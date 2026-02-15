import { Router } from 'express';
import { seedArticles } from './seed-articles';

const router = Router();

// Admin endpoint to seed articles
// Access: POST /api/admin/seed-articles
router.post('/seed-articles', async (req, res) => {
  try {
    console.log('Admin: Starting article seeding...');
    const result = await seedArticles();
    res.json(result);
  } catch (error) {
    console.error('Admin: Seeding failed:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error) 
    });
  }
});

export default router;
