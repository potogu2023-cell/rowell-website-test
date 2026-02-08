import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { db } from "../drizzle/db";
import { customerMessages } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendCustomerMessageNotification } from "./email_notification";

// 创建留言的输入验证
const createMessageSchema = z.object({
  type: z.enum(['inquiry', 'message', 'quote_request']),
  name: z.string().min(1, "姓名不能为空").max(100),
  email: z.string().email("邮箱格式不正确").max(255),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  subject: z.string().max(255).optional(),
  message: z.string().min(1, "留言内容不能为空"),
  productId: z.string().max(50).optional(),
  productName: z.string().max(255).optional(),
  productPartNumber: z.string().max(100).optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
});

export const customerMessageRouter = router({
  // 创建新留言
  create: publicProcedure
    .input(createMessageSchema)
    .mutation(async ({ input }) => {
      try {
        const [result] = await db.insert(customerMessages).values({
          type: input.type,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          subject: input.subject,
          message: input.message,
          productId: input.productId,
          productName: input.productName,
          productPartNumber: input.productPartNumber,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          status: 'new',
        });

        // 发送邮件通知
        try {
          await sendCustomerMessageNotification({
            type: input.type,
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            message: input.message,
            productId: input.productId,
            productName: input.productName,
            productPartNumber: input.productPartNumber,
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // 不影响主流程，继续返回成功
        }

        return {
          success: true,
          messageId: result.insertId,
          message: "留言已成功提交，我们会尽快回复您！",
        };
      } catch (error) {
        console.error("创建留言失败:", error);
        throw new Error("提交留言失败，请稍后重试");
      }
    }),

  // 获取留言列表（管理后台使用）
  list: publicProcedure
    .input(z.object({
      status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
      type: z.enum(['inquiry', 'message', 'quote_request']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      try {
        const conditions = [];
        
        if (input.status) {
          conditions.push(eq(customerMessages.status, input.status));
        }
        
        if (input.type) {
          conditions.push(eq(customerMessages.type, input.type));
        }

        const messages = await db
          .select()
          .from(customerMessages)
          .where(conditions.length > 0 ? conditions[0] : undefined)
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(customerMessages.createdAt);

        return {
          messages,
          total: messages.length,
        };
      } catch (error) {
        console.error("获取留言列表失败:", error);
        throw new Error("获取留言列表失败");
      }
    }),

  // 更新留言状态
  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['new', 'read', 'replied', 'closed']),
    }))
    .mutation(async ({ input }) => {
      try {
        await db
          .update(customerMessages)
          .set({
            status: input.status,
            repliedAt: input.status === 'replied' ? new Date().toISOString() : undefined,
          })
          .where(eq(customerMessages.id, input.id));

        return {
          success: true,
          message: "状态更新成功",
        };
      } catch (error) {
        console.error("更新留言状态失败:", error);
        throw new Error("更新状态失败");
      }
    }),
});
