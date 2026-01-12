// Image Sync API - Version 1.0.1 - 2026-01-10
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { verifyAPIKey, hasPermission } from "./_core/apiKeyAuth";
import { getUserByOpenId } from "./db";
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashPassword,
  verifyEmailVerificationToken,
  verifyPassword,
  verifyPasswordResetToken,
} from "./auth-utils";
import { handleAIChat, generateSessionId, getQueueStatus } from "./ai/chat-handler";
import { GREETING_MESSAGE } from "./ai/prompts";
import { aiMessages, aiConversations, products } from "../drizzle/schema";
import { IMAGE_UPDATES } from "./image-updates-data";
import {
  createResource,
  updateResource,
  getResourceBySlug,
  listResources,
  incrementViewCount,
  getOrCreateCategory,
  listCategories,
} from "./db-resources";

export const appRouter = router({
  system: systemRouter,

  // AI Advisor Router
  ai: router({
    // Get greeting message
    greeting: publicProcedure.query(() => {
      return { message: GREETING_MESSAGE };
    }),

    // Chat with AI
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().min(1).max(2000),
          sessionId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const response = await handleAIChat(ctx.user, input.message, input.sessionId);
        return response;
      }),

    // Provide feedback on AI response
    feedback: publicProcedure
      .input(
        z.object({
          messageId: z.number(),
          feedback: z.enum(["like", "dislike"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        await db
          .update(aiMessages)
          .set({ feedback: input.feedback })
          .where(eq(aiMessages.id, input.messageId));

        return { success: true };
      }),

    // Get conversation history (for authenticated users)
    history: protectedProcedure
      .input(
        z.object({
          sessionId: z.string().optional(),
          limit: z.number().min(1).max(50).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Get user's conversations
        const conversations = await db
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.userId, ctx.user.id))
          .orderBy(desc(aiConversations.createdAt))
          .limit(input.limit || 10);

        return conversations;
      }),

    // Delete conversation (self-service deletion)
    deleteConversation: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Verify ownership
        const conversation = await db
          .select()
          .from(aiConversations)
          .where(
            and(
              eq(aiConversations.id, input.conversationId),
              eq(aiConversations.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (conversation.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        // Soft delete
        await db
          .update(aiConversations)
          .set({ isDeleted: 1 })
          .where(eq(aiConversations.id, input.conversationId));

        return { success: true };
      }),

    // Update consent mode
    updateConsent: protectedProcedure
      .input(
        z.object({
          consentMode: z.enum(["standard", "privacy"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateUserConsent } = await import("./db");
        await updateUserConsent(ctx.user.id, input.consentMode);
        return { success: true };
      }),

    // Get queue status (for monitoring)
    queueStatus: publicProcedure.query(() => {
      return getQueueStatus();
    }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // Register with email and password
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(1),
          company: z.string().optional(),
          phone: z.string().optional(),
          country: z.string().optional(),
          industry: z.string().optional(),
          purchasingRole: z.string().optional(),
          annualPurchaseVolume: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUserByEmail, createUser } = await import("./db");
        
        // Check if user already exists
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(input.password);

        // Create user with a temporary openId (email-based)
        // Since we're not using OAuth for this registration flow
        const openId = `email:${input.email}`;
        
        await createUser({
          openId,
          email: input.email,
          password: hashedPassword,
          name: input.name,
          company: input.company || null,
          phone: input.phone || null,
          country: input.country || null,
          industry: input.industry || null,
          purchasingRole: input.purchasingRole || null,
          annualPurchaseVolume: input.annualPurchaseVolume || null,
          loginMethod: "email",
          emailVerified: 0,
          role: "user",
        });

        // Generate email verification token
        const verificationToken = generateEmailVerificationToken(input.email);

        return {
          success: true,
          verificationToken,
          message: "Registration successful. Please verify your email.",
        };
      }),

    // Login with email and password
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getUserByEmail } = await import("./db");
        const { sdk } = await import("./_core/sdk");
        
        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        if (!user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "This account uses a different login method",
          });
        }

        const isValidPassword = await verifyPassword(input.password, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Check if email is verified (temporarily disabled for testing)
        // if (user.emailVerified === 0) {
        //   throw new TRPCError({
        //     code: "FORBIDDEN",
        //     message: "Please verify your email before logging in",
        //   });
        // }

        // Create session token and set cookie
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "",
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),

    // Verify email
    verifyEmail: publicProcedure
      .input(
        z.object({
          token: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateUserEmailVerified } = await import("./db");
        
        const decoded = verifyEmailVerificationToken(input.token);
        if (!decoded) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification token",
          });
        }

        await updateUserEmailVerified(decoded.email, 1);

        return {
          success: true,
          message: "Email verified successfully",
        };
      }),

    // Request password reset
    requestPasswordReset: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        const { getUserByEmail } = await import("./db");
        
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists
          return {
            success: true,
            message: "If the email exists, a reset link will be sent",
          };
        }

        const resetToken = generatePasswordResetToken(input.email);

        return {
          success: true,
          resetToken,
          message: "Password reset link sent to your email",
        };
      }),

    // Reset password
    resetPassword: publicProcedure
      .input(
        z.object({
          token: z.string(),
          newPassword: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        const { updateUserPassword } = await import("./db");
        
        const decoded = verifyPasswordResetToken(input.token);
        if (!decoded) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired reset token",
          });
        }

        const hashedPassword = await hashPassword(input.newPassword);
        await updateUserPassword(decoded.email, hashedPassword);

        return {
          success: true,
          message: "Password reset successfully",
        };
      }),

    // Get user profile (protected)
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const { getUserById } = await import("./db");
      
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Don't send password hash to client
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),

    // Update user profile (protected)
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          company: z.string().optional(),
          phone: z.string().optional(),
          country: z.string().optional(),
          industry: z.string().optional(),
          purchasingRole: z.string().optional(),
          annualPurchaseVolume: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateUserProfile } = await import("./db");
        
        await updateUserProfile(ctx.user.id, input);

        return {
          success: true,
          message: "Profile updated successfully",
        };
      }),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        brand: z.string().optional(),
        // Advanced filters
        particleSizeMin: z.number().optional(),
        particleSizeMax: z.number().optional(),
        poreSizeMin: z.number().optional(),
        poreSizeMax: z.number().optional(),
        columnLengthMin: z.number().optional(),
        columnLengthMax: z.number().optional(),
        innerDiameterMin: z.number().optional(),
        innerDiameterMax: z.number().optional(),
        phaseTypes: z.array(z.string()).optional(),
        phMin: z.number().optional(),
        phMax: z.number().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(24),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { products: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
        
        const { products, productCategories } = await import("../drizzle/schema");
        const { gte, lte, inArray } = await import("drizzle-orm");
        const page = input?.page || 1;
        const pageSize = input?.pageSize || 24;
        const offset = (page - 1) * pageSize;
        
        console.log('[products.list] Input params:', JSON.stringify(input, null, 2));
        
        // Build WHERE conditions
        const conditions: any[] = [];
        
        // Status filter - temporarily disabled for testing
        // conditions.push(inArray(products.status, ['active', 'verified']));
        
        // Brand filter
        if (input?.brand) {
          conditions.push(eq(products.brand, input.brand));
        }
        
        // Particle size range
        if (input?.particleSizeMin !== undefined) {
          conditions.push(gte(products.particleSizeNum, input.particleSizeMin));
        }
        if (input?.particleSizeMax !== undefined) {
          conditions.push(lte(products.particleSizeNum, input.particleSizeMax));
        }
        
        // Pore size range
        if (input?.poreSizeMin !== undefined) {
          conditions.push(gte(products.poreSizeNum, input.poreSizeMin));
        }
        if (input?.poreSizeMax !== undefined) {
          conditions.push(lte(products.poreSizeNum, input.poreSizeMax));
        }
        
        // Column length range
        if (input?.columnLengthMin !== undefined) {
          conditions.push(gte(products.columnLengthNum, input.columnLengthMin));
        }
        if (input?.columnLengthMax !== undefined) {
          conditions.push(lte(products.columnLengthNum, input.columnLengthMax));
        }
        
        // Inner diameter range
        if (input?.innerDiameterMin !== undefined) {
          conditions.push(gte(products.innerDiameterNum, input.innerDiameterMin));
        }
        if (input?.innerDiameterMax !== undefined) {
          conditions.push(lte(products.innerDiameterNum, input.innerDiameterMax));
        }
        
        // Phase types (multiple selection)
        if (input?.phaseTypes && input.phaseTypes.length > 0) {
          conditions.push(inArray(products.phaseType, input.phaseTypes));
        }
        
        // pH range
        if (input?.phMin !== undefined) {
          conditions.push(gte(products.phMax, input.phMin));
        }
        if (input?.phMax !== undefined) {
          conditions.push(lte(products.phMin, input.phMax));
        }
        
        // Build query based on category filter
        let query;
        let countQuery;
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        console.log('[products.list] Conditions count:', conditions.length);
        console.log('[products.list] Where clause:', whereClause);
        
        if (input?.categoryId) {
          // Query with category filter
          const categoryCondition = eq(productCategories.categoryId, input.categoryId);
          const finalCondition = whereClause 
            ? and(categoryCondition, whereClause)
            : categoryCondition;
          
          query = db
            .select({ product: products })
            .from(products)
            .innerJoin(productCategories, eq(products.id, productCategories.productId))
            .where(finalCondition)
            .orderBy(products.productName)
            .limit(pageSize)
            .offset(offset);
          
          countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .innerJoin(productCategories, eq(products.id, productCategories.productId))
            .where(finalCondition);
        } else {
          // Query all products with filters
          if (whereClause) {
            query = db
              .select()
              .from(products)
              .where(whereClause)
              .orderBy(products.productName)
              .limit(pageSize)
              .offset(offset);
            
            countQuery = db
              .select({ count: sql<number>`count(*)` })
              .from(products)
              .where(whereClause);
          } else {
            // No filters - query all products
            query = db
              .select()
              .from(products)
              .orderBy(products.productName)
              .limit(pageSize)
              .offset(offset);
            
            countQuery = db
              .select({ count: sql<number>`count(*)` })
              .from(products);
          }
        }
        
        const [productResults, countResults] = await Promise.all([
          query,
          countQuery,
        ]);
        
        const productList = input?.categoryId 
          ? productResults.map((r: any) => r.product)
          : productResults;
        
        const total = countResults[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);
        
        return {
          products: productList,
          total,
          page,
          pageSize,
          totalPages,
        };
      }),
    
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const { products } = await import("../drizzle/schema");
        const result = await db
          .select()
          .from(products)
          .where(eq(products.id, input))
          .limit(1);
        
        return result[0] || null;
      }),
    
    byBrand: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "string") return val;
        throw new Error("Brand must be a string");
      })
      .query(async ({ input }) => {
        const { getProductsByBrand } = await import("./db");
        return await getProductsByBrand(input);
      }),
    
    getBrands: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const { products, productCategories } = await import("../drizzle/schema");
        
        let query;
        if (input?.categoryId) {
          // Get brands for specific category
          query = db
            .selectDistinct({ brand: products.brand })
            .from(products)
            .innerJoin(productCategories, eq(products.id, productCategories.productId))
            .where(eq(productCategories.categoryId, input.categoryId))
            .orderBy(products.brand);
        } else {
          // Get all brands
          query = db
            .selectDistinct({ brand: products.brand })
            .from(products)
            .orderBy(products.brand);
        }
        
        const results = await query;
        return results.map(r => r.brand);
      }),
    
    getBrandStats: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const { products, productCategories } = await import("../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        
        // Status filter - temporarily disabled for testing
        // const statusFilter = inArray(products.status, ['active', 'verified']);
        
        let query;
        if (input?.categoryId) {
          // Get brand stats for specific category
          query = db
            .select({
              brand: products.brand,
              count: sql<number>`count(distinct ${products.id})`
            })
            .from(products)
            .innerJoin(productCategories, eq(products.id, productCategories.productId))
            .where(eq(productCategories.categoryId, input.categoryId))
            .groupBy(products.brand)
            .orderBy(products.brand);
        } else {
          // Get all brand stats
          query = db
            .select({
              brand: products.brand,
              count: sql<number>`count(*)`
            })
            .from(products)
            .groupBy(products.brand)
            .orderBy(products.brand);
        }
        
        const results = await query;
        return results.reduce((acc, r) => {
          acc[r.brand] = r.count;
          return acc;
        }, {} as Record<string, number>);
      }),
  }),

  category: router({
    getAll: publicProcedure.query(async () => {
      const { getAllCategories } = await import("./db");
      return await getAllCategories();
    }),
    
    getVisible: publicProcedure.query(async () => {
      const { getVisibleCategories } = await import("./db");
      return await getVisibleCategories();
    }),
    
    getTopLevel: publicProcedure.query(async () => {
      const { getTopLevelCategories } = await import("./db");
      return await getTopLevelCategories(true);
    }),
    
    getWithProductCount: publicProcedure.query(async () => {
      const { getCategoriesWithProductCount } = await import("./db");
      return await getCategoriesWithProductCount();
    }),
    
    getChildren: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null || !('parentId' in val)) {
          throw new Error('Invalid input');
        }
        const { parentId } = val as { parentId: unknown };
        if (typeof parentId !== 'number') {
          throw new Error('parentId must be a number');
        }
        return { parentId };
      })
      .query(async ({ input }) => {
        const { getChildCategories } = await import("./db");
        return await getChildCategories(input.parentId);
      }),
  }),

  cart: router({
    // Get user's cart
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getCartByUserId } = await import("./db");
      return await getCartByUserId(ctx.user.id);
    }),

    // Add product to cart
    add: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1).default(1),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { addToCart } = await import("./db");
        await addToCart(ctx.user.id, input.productId, input.quantity, input.notes);
        return { success: true };
      }),

    // Update cart item
    update: protectedProcedure
      .input(
        z.object({
          cartId: z.number(),
          quantity: z.number().min(1),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateCartItem } = await import("./db");
        await updateCartItem(input.cartId, input.quantity, input.notes);
        return { success: true };
      }),

    // Remove item from cart
    remove: protectedProcedure
      .input(z.object({ cartId: z.number() }))
      .mutation(async ({ input }) => {
        const { removeFromCart } = await import("./db");
        await removeFromCart(input.cartId);
        return { success: true };
      }),

    // Clear cart
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      const { clearCart } = await import("./db");
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  inquiry: router({
    // Create inquiry from cart
    create: protectedProcedure
      .input(
        z.object({
          urgency: z.enum(["normal", "urgent", "very_urgent"]).default("normal"),
          budgetRange: z.string().optional(),
          applicationNotes: z.string().optional(),
          deliveryAddress: z.string().optional(),
          customerNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createInquiry, addInquiryItems, getCartByUserId, clearCart } = await import("./db");
        
        // Get cart items
        const cartItems = await getCartByUserId(ctx.user.id);
        if (cartItems.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cart is empty",
          });
        }

        // Create inquiry
        const inquiry = await createInquiry({
          userId: ctx.user.id,
          urgency: input.urgency,
          budgetRange: input.budgetRange,
          applicationNotes: input.applicationNotes,
          deliveryAddress: input.deliveryAddress,
          customerNotes: input.customerNotes,
        });

        if (!inquiry) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create inquiry",
          });
        }

        // Get the inquiry ID from the result
        // Since we need the actual ID, we'll query it back
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const { inquiries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const inquiryRecord = await db
          .select()
          .from(inquiries)
          .where(eq(inquiries.inquiryNumber, inquiry.inquiryNumber))
          .limit(1);

        if (inquiryRecord.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve inquiry",
          });
        }

        const inquiryId = inquiryRecord[0].id;

        // Add inquiry items from cart
        const items = cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        }));

        await addInquiryItems(inquiryId, items);

        // Clear cart
        await clearCart(ctx.user.id);

        // Generate Excel and send emails
        try {
          const { generateInquiryExcel, sendInquiryEmail, sendCustomerConfirmationEmail } = await import("./inquiry-utils");
          const { getUserById } = await import("./db");
          const { inquiryItems, products } = await import("../drizzle/schema");
          
          const inquiryWithItems = await db
            .select({
              id: inquiryItems.id,
              productId: inquiryItems.productId,
              quantity: inquiryItems.quantity,
              notes: inquiryItems.notes,
              product: products,
            })
            .from(inquiryItems)
            .leftJoin(products, eq(inquiryItems.productId, products.id))
            .where(eq(inquiryItems.inquiryId, inquiryId));

          const currentUser = await getUserById(ctx.user.id);
          if (currentUser) {
            // Generate Excel
            const excelBuffer = await generateInquiryExcel(
              inquiryRecord[0],
              inquiryWithItems,
              currentUser
            );

            // Send emails (async, don't wait)
            sendInquiryEmail(inquiryRecord[0], currentUser, excelBuffer).catch(err => {
              console.error('[Inquiry] Failed to send inquiry email:', err);
            });
            
            sendCustomerConfirmationEmail(inquiryRecord[0], currentUser).catch(err => {
              console.error('[Inquiry] Failed to send confirmation email:', err);
            });
          }
        } catch (error) {
          console.error('[Inquiry] Failed to generate Excel or send emails:', error);
          // Don't fail the inquiry creation if email sending fails
        }

        return {
          success: true,
          inquiryNumber: inquiry.inquiryNumber,
          inquiryId,
        };
      }),

    // Get user's inquiry history
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getInquiriesByUserId } = await import("./db");
      return await getInquiriesByUserId(ctx.user.id);
    }),

    // Get inquiry details
    getById: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input }) => {
        const { getInquiryById, getInquiryItems } = await import("./db");
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Inquiry not found",
          });
        }
        const items = await getInquiryItems(input.inquiryId);
        return { inquiry, items };
      }),
  }),

  // Admin routes - only accessible by admin users
  admin: router({
    // Inquiry management
    inquiries: router({
      // Get all inquiries with filters
      list: adminProcedure
        .input(
          z.object({
            status: z.enum(["pending", "quoted", "completed", "cancelled"]).optional(),
            urgency: z.enum(["normal", "urgent", "very_urgent"]).optional(),
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
          })
        )
        .query(async ({ input }) => {
          const { inquiries, users } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          let query = db
            .select({
              id: inquiries.id,
              inquiryNumber: inquiries.inquiryNumber,
              userId: inquiries.userId,
              status: inquiries.status,
              urgency: inquiries.urgency,
              totalItems: inquiries.totalItems,
              createdAt: inquiries.createdAt,
              userName: users.name,
              userEmail: users.email,
              userCompany: users.company,
            })
            .from(inquiries)
            .leftJoin(users, eq(inquiries.userId, users.id))
            .orderBy(desc(inquiries.createdAt))
            .limit(input.limit)
            .offset(input.offset);

          if (input.status) {
            query = query.where(eq(inquiries.status, input.status)) as any;
          }
          if (input.urgency) {
            query = query.where(eq(inquiries.urgency, input.urgency)) as any;
          }

          return await query;
        }),

      // Get inquiry details with items
      getById: adminProcedure
        .input(z.object({ inquiryId: z.number() }))
        .query(async ({ input }) => {
          const { inquiries, inquiryItems, products, users } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const inquiry = await db
            .select({
              inquiry: inquiries,
              user: users,
            })
            .from(inquiries)
            .leftJoin(users, eq(inquiries.userId, users.id))
            .where(eq(inquiries.id, input.inquiryId))
            .limit(1);

          if (inquiry.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
          }

          const items = await db
            .select({
              id: inquiryItems.id,
              productId: inquiryItems.productId,
              quantity: inquiryItems.quantity,
              notes: inquiryItems.notes,
              quotedPrice: inquiryItems.quotedPrice,
              product: products,
            })
            .from(inquiryItems)
            .leftJoin(products, eq(inquiryItems.productId, products.id))
            .where(eq(inquiryItems.inquiryId, input.inquiryId));

          return {
            inquiry: inquiry[0].inquiry,
            user: inquiry[0].user,
            items,
          };
        }),

      // Update inquiry status
      updateStatus: adminProcedure
        .input(
          z.object({
            inquiryId: z.number(),
            status: z.enum(["pending", "quoted", "completed", "cancelled"]),
          })
        )
        .mutation(async ({ input }) => {
          const { inquiries } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const updateData: any = { status: input.status };
          if (input.status === "quoted") {
            updateData.quotedAt = new Date();
          } else if (input.status === "completed") {
            updateData.completedAt = new Date();
          }

          await db
            .update(inquiries)
            .set(updateData)
            .where(eq(inquiries.id, input.inquiryId));

          return { success: true };
        }),

      // Add admin notes
      addNotes: adminProcedure
        .input(
          z.object({
            inquiryId: z.number(),
            notes: z.string(),
          })
        )
        .mutation(async ({ input }) => {
          const { inquiries } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          await db
            .update(inquiries)
            .set({ adminNotes: input.notes })
            .where(eq(inquiries.id, input.inquiryId));

          return { success: true };
        }),

      // Generate PDF quotation
      generatePDF: adminProcedure
        .input(z.object({ inquiryId: z.number() }))
        .mutation(async ({ input }) => {
          const { inquiries, inquiryItems, products, users } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Get inquiry with details
          const inquiry = await db
            .select({
              inquiry: inquiries,
              user: users,
            })
            .from(inquiries)
            .leftJoin(users, eq(inquiries.userId, users.id))
            .where(eq(inquiries.id, input.inquiryId))
            .limit(1);

          if (inquiry.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
          }

          const items = await db
            .select({
              product: products,
              quantity: inquiryItems.quantity,
              notes: inquiryItems.notes,
              quotedPrice: inquiryItems.quotedPrice,

            })
            .from(inquiryItems)
            .leftJoin(products, eq(inquiryItems.productId, products.id))
            .where(eq(inquiryItems.inquiryId, input.inquiryId));

          // Generate PDF
          const { generateInquiryPDF } = await import("./pdf-utils");
          const pdfBuffer = await generateInquiryPDF({
            inquiry: inquiry[0].inquiry,
            customer: inquiry[0].user!,
            items: items as any,
          });

          // Return PDF as base64
          return {
            pdf: pdfBuffer.toString('base64'),
            filename: `quotation-${inquiry[0].inquiry.inquiryNumber}.pdf`,
          };
        }),

      // Add quote to inquiry item
      addQuote: adminProcedure
        .input(
          z.object({
            inquiryItemId: z.number(),
            quotedPrice: z.string(),
          })
        )
        .mutation(async ({ input }) => {
          const { inquiryItems } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          await db
            .update(inquiryItems)
            .set({ quotedPrice: input.quotedPrice })
            .where(eq(inquiryItems.id, input.inquiryItemId));

          return { success: true };
        }),
    }),

    // Customer management
    customers: router({
      // Get all customers
      list: adminProcedure
        .input(
          z.object({
            tier: z.enum(["regular", "vip"]).optional(),
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
          })
        )
        .query(async ({ input }) => {
          const { users } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const conditions = [eq(users.role, "user")];
          if (input.tier) {
            conditions.push(eq(users.customerTier, input.tier));
          }

          return await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              company: users.company,
              phone: users.phone,
              country: users.country,
              industry: users.industry,
              customerTier: users.customerTier,
              createdAt: users.createdAt,
              lastSignedIn: users.lastSignedIn,
            })
            .from(users)
            .where(and(...conditions))
            .orderBy(desc(users.createdAt))
            .limit(input.limit)
            .offset(input.offset);
        }),

      // Update customer tier
      updateTier: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            tier: z.enum(["regular", "vip"]),
          })
        )
        .mutation(async ({ input }) => {
          const { users } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          await db
            .update(users)
            .set({ customerTier: input.tier })
            .where(eq(users.id, input.userId));

          return { success: true };
        }),

      // Get customer inquiry history
      getInquiries: adminProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ input }) => {
          const { inquiries } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          return await db
            .select()
            .from(inquiries)
            .where(eq(inquiries.userId, input.userId))
            .orderBy(desc(inquiries.createdAt));
        }),
    }),

    // Analytics
    analytics: router({
      // Get inquiry statistics
      getInquiryStats: adminProcedure
        .input(
          z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          })
        )
        .query(async ({ input }) => {
          const { inquiries } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const conditions = [];
          if (input.startDate) {
            conditions.push(sql`${inquiries.createdAt} >= ${input.startDate}`);
          }
          if (input.endDate) {
            conditions.push(sql`${inquiries.createdAt} <= ${input.endDate}`);
          }

          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

          // Total inquiries
          const totalResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(inquiries)
            .where(whereClause);
          const total = Number(totalResult[0]?.count || 0);

          // By status
          const byStatus = await db
            .select({
              status: inquiries.status,
              count: sql<number>`count(*)`,
            })
            .from(inquiries)
            .where(whereClause)
            .groupBy(inquiries.status);

          // By urgency
          const byUrgency = await db
            .select({
              urgency: inquiries.urgency,
              count: sql<number>`count(*)`,
            })
            .from(inquiries)
            .where(whereClause)
            .groupBy(inquiries.urgency);

          // Daily stats (last 30 days)
          const dailyStats = await db
            .select({
              date: sql<string>`DATE(${inquiries.createdAt})`,
              count: sql<number>`count(*)`,
            })
            .from(inquiries)
            .where(whereClause)
            .groupBy(sql`DATE(${inquiries.createdAt})`)
            .orderBy(sql`DATE(${inquiries.createdAt})`);

          return {
            total,
            byStatus: byStatus.map(s => ({ status: s.status, count: Number(s.count) })),
            byUrgency: byUrgency.map(u => ({ urgency: u.urgency, count: Number(u.count) })),
            dailyStats: dailyStats.map(d => ({ date: d.date, count: Number(d.count) })),
          };
        }),

      // Get top products
      getTopProducts: adminProcedure
        .input(
          z.object({
            limit: z.number().min(1).max(50).default(10),
          })
        )
        .query(async ({ input }) => {
          const { inquiryItems, products } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const topProducts = await db
            .select({
              productId: products.id,
              productName: products.productName,
              brand: products.brand,
              partNumber: products.partNumber,
              count: sql<number>`count(*)`,
              totalQuantity: sql<number>`sum(${inquiryItems.quantity})`,
            })
            .from(inquiryItems)
            .leftJoin(products, eq(inquiryItems.productId, products.id))
            .groupBy(products.id, products.productName, products.brand, products.partNumber)
            .orderBy(desc(sql`count(*)`)) 
            .limit(input.limit);

          return topProducts.map(p => ({
            productId: p.productId,
            productName: p.productName,
            brand: p.brand,
            partNumber: p.partNumber,
            inquiryCount: Number(p.count),
            totalQuantity: Number(p.totalQuantity),
          }));
        }),

      // Get customer analytics
      getCustomerAnalytics: adminProcedure.query(async () => {
        const { users, inquiries } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Total customers
        const totalCustomersResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.role, "user"));
        const totalCustomers = Number(totalCustomersResult[0]?.count || 0);

        // By tier
        const byTier = await db
          .select({
            tier: users.customerTier,
            count: sql<number>`count(*)`,
          })
          .from(users)
          .where(eq(users.role, "user"))
          .groupBy(users.customerTier);

        // By country
        const byCountry = await db
          .select({
            country: users.country,
            count: sql<number>`count(*)`,
          })
          .from(users)
          .where(and(eq(users.role, "user"), sql`${users.country} IS NOT NULL`))
          .groupBy(users.country)
          .orderBy(desc(sql`count(*)`)) 
          .limit(10);

        // By industry
        const byIndustry = await db
          .select({
            industry: users.industry,
            count: sql<number>`count(*)`,
          })
          .from(users)
          .where(and(eq(users.role, "user"), sql`${users.industry} IS NOT NULL`))
          .groupBy(users.industry)
          .orderBy(desc(sql`count(*)`)) 
          .limit(10);

        // Active customers (with inquiries)
        const activeCustomersResult = await db
          .select({ count: sql<number>`count(DISTINCT ${inquiries.userId})` })
          .from(inquiries);
        const activeCustomers = Number(activeCustomersResult[0]?.count || 0);

        return {
          totalCustomers,
          activeCustomers,
          byTier: byTier.map(t => ({ tier: t.tier, count: Number(t.count) })),
          byCountry: byCountry.map(c => ({ country: c.country || "Unknown", count: Number(c.count) })),
          byIndustry: byIndustry.map(i => ({ industry: i.industry || "Unknown", count: Number(i.count) })),
        };
      }),

      // Get conversion rate
      getConversionRate: adminProcedure.query(async () => {
        const { inquiries } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(inquiries);
        const total = Number(totalResult[0]?.count || 0);

        const quotedResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(inquiries)
          .where(eq(inquiries.status, "quoted"));
        const quoted = Number(quotedResult[0]?.count || 0);

        const completedResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(inquiries)
          .where(eq(inquiries.status, "completed"));
        const completed = Number(completedResult[0]?.count || 0);

        return {
          total,
          quoted,
          completed,
          quoteRate: total > 0 ? (quoted / total) * 100 : 0,
          conversionRate: total > 0 ? (completed / total) * 100 : 0,
        };
      }),

      // Send monthly report
      sendMonthlyReport: adminProcedure
        .input(
          z.object({
            year: z.number().optional(),
            month: z.number().min(1).max(12).optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { sendMonthlyReport } = await import("./monthly-report");
          
          const now = new Date();
          const year = input.year || now.getFullYear();
          const month = input.month || now.getMonth() + 1;

          const success = await sendMonthlyReport(year, month);
          
          if (!success) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send monthly report" });
          }

          return { success: true, message: `Monthly report for ${year}-${month} sent successfully` };
        }),
    }),

    // 图片同步管理
    imageSync: router({
      // 同步图片从crawler_results到products
      sync: adminProcedure
        .mutation(async () => {
          const { products, crawlerResults } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const startTime = Date.now();

          // 1. 从crawler_results获取所有有图片的记录
          const crawlerImages = await db
            .select({
              productId: crawlerResults.productId,
              imageUrl: crawlerResults.imageUrl,
              brand: crawlerResults.brand,
              partNumber: crawlerResults.partNumber,
            })
            .from(crawlerResults)
            .where(
              and(
                isNotNull(crawlerResults.imageUrl),
                ne(crawlerResults.imageUrl, ''),
                like(crawlerResults.imageUrl, '%cdninstagram.com%')
              )
            );

          let successCount = 0;
          let failedCount = 0;
          const failedProducts: any[] = [];

          // 2. 逐个更新到products表
          for (const item of crawlerImages) {
            try {
              // 检查products表中是否存在该产品
              const existingProduct = await db
                .select({ id: products.id, imageUrl: products.imageUrl })
                .from(products)
                .where(eq(products.productId, item.productId))
                .limit(1);

              if (existingProduct.length > 0) {
                // 更新imageUrl
                await db
                  .update(products)
                  .set({ 
                    imageUrl: item.imageUrl,
                    updatedAt: new Date()
                  })
                  .where(eq(products.productId, item.productId));
                
                successCount++;
              } else {
                failedCount++;
                failedProducts.push({
                  productId: item.productId,
                  reason: 'Product not found in products table'
                });
              }
            } catch (error: any) {
              failedCount++;
              failedProducts.push({
                productId: item.productId,
                reason: error.message
              });
            }
          }

          const duration = Date.now() - startTime;

          return {
            success: true,
            summary: {
              totalFound: crawlerImages.length,
              successCount,
              failedCount,
              duration: `${(duration / 1000).toFixed(2)}s`
            },
            failedProducts: failedProducts.length > 0 ? failedProducts : undefined
          };
        }),

      // 获取图片同步状态统计
      status: adminProcedure
        .query(async () => {
          const { products, crawlerResults } = await import("../drizzle/schema");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // 统计crawler_results中的图片数量
          const crawlerCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(crawlerResults)
            .where(
              and(
                isNotNull(crawlerResults.imageUrl),
                ne(crawlerResults.imageUrl, ''),
                like(crawlerResults.imageUrl, '%cdninstagram.com%')
              )
            );

          // 统计products中已有cdninstagram图片的数量
          const productsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(
              and(
                isNotNull(products.imageUrl),
                like(products.imageUrl, '%cdninstagram.com%')
              )
            );

          // 统计products中所有有图片的数量
          const productsWithAnyImage = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(
              and(
                isNotNull(products.imageUrl),
                ne(products.imageUrl, '')
              )
            );

          // 统计products总数
          const totalProducts = await db
            .select({ count: sql<number>`count(*)` })
            .from(products);

          return {
            crawler: {
              totalImages: Number(crawlerCount[0].count),
              description: '制图团队已上传的图片数量'
            },
            products: {
              cdnInstagramImages: Number(productsCount[0].count),
              totalWithImages: Number(productsWithAnyImage[0].count),
              totalProducts: Number(totalProducts[0].count),
              coverageRate: (Number(productsWithAnyImage[0].count) / Number(totalProducts[0].count) * 100).toFixed(1) + '%'
            },
            needSync: Number(crawlerCount[0].count) - Number(productsCount[0].count)
          };
        }),
    }),
  }),

  // Resources Center Router
  resources: router({
    // Create a new resource article (for automated publishing)
    // Supports both session auth (admin users) and API Key auth
    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          content: z.string().min(1),
          excerpt: z.string().max(500).optional(),
          coverImage: z.string().max(500).optional(),
          authorName: z.string().max(100).optional(),
          status: z.enum(["draft", "published", "archived"]).default("draft"),
          language: z.string().max(10).default("en"),
          categoryName: z.string().optional(),
          tags: z.array(z.string()).optional(),
          featured: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check authentication: either session (admin user) or API Key
        let authorUserId: number;
        
        // Try API Key authentication first
        const authHeader = ctx.req.headers.authorization;
        const apiKeyAuth = await verifyAPIKey(authHeader);
        
        if (apiKeyAuth) {
          // API Key authentication
          if (!hasPermission(apiKeyAuth.permissions, "resources:create")) {
            throw new TRPCError({ code: "FORBIDDEN", message: "API key does not have resources:create permission" });
          }
          authorUserId = apiKeyAuth.createdBy;
        } else if (ctx.user) {
          // Session authentication
          if (ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create resources" });
          }
          authorUserId = ctx.user.id;
        } else {
          // No authentication
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
        }

        // Get or create category if provided
        let categoryId: number | undefined;
        if (input.categoryName) {
          const category = await getOrCreateCategory(input.categoryName);
          categoryId = category.id;
        }

        const result = await createResource({
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          coverImage: input.coverImage,
          authorName: input.authorName,
          status: input.status,
          language: input.language,
          categoryId,
          tags: input.tags,
          featured: input.featured,
        });

        return {
          success: true,
          id: result.id,
          slug: result.slug,
          url: `/resources/${result.slug}`,
        };
      }),

    // Update an existing resource article
    // Supports both session auth (admin users) and API Key auth
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(255).optional(),
          content: z.string().min(1).optional(),
          excerpt: z.string().max(500).optional(),
          coverImage: z.string().max(500).optional(),
          authorName: z.string().max(100).optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
          language: z.string().max(10).optional(),
          categoryName: z.string().optional(),
          tags: z.array(z.string()).optional(),
          featured: z.boolean().optional(),
          publishedAt: z.string().optional(), // ISO 8601 date string
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check authentication: either session (admin user) or API Key
        const authHeader = ctx.req.headers.authorization;
        const apiKeyAuth = await verifyAPIKey(authHeader);
        
        if (apiKeyAuth) {
          // API Key authentication
          if (!hasPermission(apiKeyAuth.permissions, "resources:update")) {
            throw new TRPCError({ code: "FORBIDDEN", message: "API key does not have resources:update permission" });
          }
        } else if (ctx.user) {
          // Session authentication
          if (ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update resources" });
          }
        } else {
          // No authentication
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
        }

        let categoryId: number | undefined;
        if (input.categoryName) {
          const category = await getOrCreateCategory(input.categoryName);
          categoryId = category.id;
        }

        // Parse publishedAt if provided
        let publishedAt: Date | undefined;
        if (input.publishedAt) {
          publishedAt = new Date(input.publishedAt);
          if (isNaN(publishedAt.getTime())) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid publishedAt date format" });
          }
        }

        await updateResource(input.id, {
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          coverImage: input.coverImage,
          authorName: input.authorName,
          status: input.status,
          language: input.language,
          categoryId,
          tags: input.tags,
          featured: input.featured,
          publishedAt,
        });

        return { success: true, id: input.id };
      }),

    // Delete a resource article (soft delete: set status to 'archived')
    // Supports both session auth (admin users) and API Key auth
    delete: publicProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check authentication: either session (admin user) or API Key
        const authHeader = ctx.req.headers.authorization;
        const apiKeyAuth = await verifyAPIKey(authHeader);
        
        if (apiKeyAuth) {
          // API Key authentication
          if (!hasPermission(apiKeyAuth.permissions, "resources:delete")) {
            throw new TRPCError({ code: "FORBIDDEN", message: "API key does not have resources:delete permission" });
          }
        } else if (ctx.user) {
          // Session authentication
          if (ctx.user.role !== "admin") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete resources" });
          }
        } else {
          // No authentication
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
        }

        // Soft delete: set status to 'archived'
        await updateResource(input.id, {
          status: "archived",
        });

        return { success: true, id: input.id };
      }),

    // Get resource by slug (public)
    getBySlug: publicProcedure
      .input(
        z.object({
          slug: z.string(),
        })
      )
      .query(async ({ input }) => {
        const resource = await getResourceBySlug(input.slug);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        }

        // Only show published resources to non-admin users
        if (resource.status !== "published") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        }

        // Increment view count
        await incrementViewCount(resource.id);

        return resource;
      }),

    // List resources with pagination and filters
    // Public: only shows published resources
    // With API Key: can show all resources including drafts
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(12),
          categoryId: z.number().optional(),
          featured: z.boolean().optional(),
          language: z.string().optional(),
          search: z.string().optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Check if API Key is provided
        const authHeader = ctx.req.headers.authorization;
        const apiKeyAuth = await verifyAPIKey(authHeader);
        
        let status: "published" | "draft" | "archived" | undefined;
        if (apiKeyAuth && hasPermission(apiKeyAuth.permissions, "resources:list")) {
          // API Key with list permission can specify status
          status = input.status;
        } else {
          // Public access: only show published resources
          status = "published";
        }

        return await listResources({
          page: input.page,
          pageSize: input.pageSize,
          status,
          categoryId: input.categoryId,
          featured: input.featured,
          language: input.language,
          search: input.search,
        });
      }),

    // List all categories (public)
    listCategories: publicProcedure.query(async () => {
      return await listCategories();
    }),
  }),
});
