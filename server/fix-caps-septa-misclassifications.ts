import { publicProcedure, router } from "./_core/trpc";
import { db } from "./db";
import { products } from "./db/schema";
import { eq, and, or, like } from "drizzle-orm";

export const fixCapsSeptaRouter = router({
  analyze: publicProcedure.query(async () => {
    console.log("Analyzing Caps & Septa category (ID 20) for misclassifications...");
    
    // Query all products in Caps & Septa category
    const capsSeptaProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, 20))
      .limit(1000);
    
    console.log(`Total products in Caps & Septa: ${capsSeptaProducts.length}`);
    
    // Identify SPE products (should be in SPE Cartridges, ID 16)
    const speProducts = capsSeptaProducts.filter(p => 
      p.nameEn && (
        p.nameEn.includes('Bond Elut') ||
        p.nameEn.includes('Oasis') ||
        p.nameEn.includes('Strata') ||
        p.nameEn.includes('SPE Cartridge') ||
        p.nameEn.includes('SPE Column')
      )
    );
    
    // Identify GC products (should be in GC categories, 30001-30005)
    const gcProducts = capsSeptaProducts.filter(p =>
      p.nameEn && p.nameEn.includes('GC Column')
    );
    
    // Identify Filter products (should be in Filters, ID 18)
    const filterProducts = capsSeptaProducts.filter(p =>
      p.nameEn && (
        p.nameEn.includes('Filter') ||
        p.nameEn.includes('Syringe Filter')
      )
    );
    
    // Remaining products (might be actual caps & septa or other misclassifications)
    const otherProducts = capsSeptaProducts.filter(p =>
      !speProducts.includes(p) && 
      !gcProducts.includes(p) && 
      !filterProducts.includes(p)
    );
    
    return {
      total: capsSeptaProducts.length,
      spe: {
        count: speProducts.length,
        samples: speProducts.slice(0, 10).map(p => ({
          productId: p.productId,
          name: p.nameEn,
          currentCategory: p.categoryId
        }))
      },
      gc: {
        count: gcProducts.length,
        samples: gcProducts.slice(0, 10).map(p => ({
          productId: p.productId,
          name: p.nameEn,
          currentCategory: p.categoryId
        }))
      },
      filters: {
        count: filterProducts.length,
        samples: filterProducts.slice(0, 10).map(p => ({
          productId: p.productId,
          name: p.nameEn,
          currentCategory: p.categoryId
        }))
      },
      others: {
        count: otherProducts.length,
        samples: otherProducts.slice(0, 10).map(p => ({
          productId: p.productId,
          name: p.nameEn,
          currentCategory: p.categoryId
        }))
      }
    };
  }),
  
  fixAll: publicProcedure.mutation(async () => {
    console.log("Fixing all misclassifications in Caps & Septa category...");
    
    const results = {
      spe: 0,
      gc: 0,
      filters: 0
    };
    
    // Fix SPE products -> SPE Cartridges (ID 16)
    const speResult = await db
      .update(products)
      .set({ categoryId: 16 })
      .where(
        and(
          eq(products.categoryId, 20),
          or(
            like(products.nameEn, '%Bond Elut%'),
            like(products.nameEn, '%Oasis%'),
            like(products.nameEn, '%Strata%'),
            like(products.nameEn, '%SPE Cartridge%'),
            like(products.nameEn, '%SPE Column%')
          )
        )
      );
    results.spe = speResult.rowsAffected || 0;
    
    // Fix GC products -> Other GC Columns (ID 30005) as default
    const gcResult = await db
      .update(products)
      .set({ categoryId: 30005 })
      .where(
        and(
          eq(products.categoryId, 20),
          like(products.nameEn, '%GC Column%')
        )
      );
    results.gc = gcResult.rowsAffected || 0;
    
    // Fix Filter products -> Filters (ID 18)
    const filterResult = await db
      .update(products)
      .set({ categoryId: 18 })
      .where(
        and(
          eq(products.categoryId, 20),
          or(
            like(products.nameEn, '%Filter%'),
            like(products.nameEn, '%Syringe Filter%')
          )
        )
      );
    results.filters = filterResult.rowsAffected || 0;
    
    return {
      success: true,
      updated: results,
      total: results.spe + results.gc + results.filters
    };
  })
});
