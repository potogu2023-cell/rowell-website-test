import { Router } from 'express';
import { getDb } from './db';
import { literature } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const testLiteratureRouter = Router();

// Test endpoint to bypass tRPC and directly query database
testLiteratureRouter.get('/test-literature/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log('[Test API] Querying literature with slug:', slug);
    
    const db = await getDb();
    const result = await db
      .select()
      .from(literature)
      .where(eq(literature.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Literature not found' });
    }

    const lit = result[0];

    // Return enhanced content status
    res.json({
      success: true,
      data: {
        id: lit.id,
        title: lit.title,
        slug: lit.slug,
        contentEnhanced: lit.contentEnhanced,
        hasOriginalPaperUrl: !!lit.originalPaperUrl,
        hasExpandedAnalysis: !!lit.expandedAnalysis,
        hasMethodologyDetails: !!lit.methodologyDetails,
        hasPracticalGuide: !!lit.practicalGuide,
        expandedAnalysisLength: lit.expandedAnalysis?.length || 0,
        practicalGuideLength: lit.practicalGuide?.length || 0,
        // Include first 200 chars of each for verification
        expandedAnalysisPreview: lit.expandedAnalysis?.substring(0, 200),
        practicalGuidePreview: lit.practicalGuide?.substring(0, 200),
        originalPaperUrl: lit.originalPaperUrl,
      }
    });
  } catch (error) {
    console.error('[Test API] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
