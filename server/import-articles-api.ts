import { Router } from 'express';
import { getDb } from './db';
import { articles, authors } from '../drizzle/schema';

const router = Router();

// Author profiles
const authorProfiles = [
  {
    name: 'Dr. Michael Zhang',
    slug: 'dr-michael-zhang',
    title: 'Technical Director',
    bio: 'Dr. Michael Zhang is a seasoned chromatography expert with over 15 years of experience in analytical chemistry. He specializes in HPLC method development and instrumentation, providing practical guidance for laboratories worldwide.',
    expertise: JSON.stringify(['HPLC', 'Method Development', 'Instrumentation', 'Troubleshooting']),
    email: 'michael.zhang@rowellhplc.com',
    photoUrl: null
  },
  {
    name: 'Dr. Evelyn Reed',
    slug: 'dr-evelyn-reed',
    title: 'Pharmaceutical Analysis Expert',
    bio: 'Dr. Evelyn Reed brings extensive pharmaceutical industry experience, specializing in drug development and quality control. Her expertise spans API characterization, impurity profiling, and regulatory compliance.',
    expertise: JSON.stringify(['Pharmaceutical Analysis', 'Drug Development', 'Quality Control', 'Regulatory Compliance']),
    email: 'evelyn.reed@rowellhplc.com',
    photoUrl: null
  },
  {
    name: 'Dr. James Chen',
    slug: 'dr-james-chen',
    title: 'Environmental & Food Safety Specialist',
    bio: 'Dr. James Chen focuses on environmental monitoring and food safety testing using chromatographic techniques. He has published numerous papers on pesticide analysis and contaminant detection.',
    expertise: JSON.stringify(['Environmental Testing', 'Food Safety', 'Pesticide Analysis', 'Contaminant Detection']),
    email: 'james.chen@rowellhplc.com',
    photoUrl: null
  },
  {
    name: 'Dr. Sarah Martinez',
    slug: 'dr-sarah-martinez',
    title: 'Clinical & Biopharmaceutical Specialist',
    bio: 'Dr. Sarah Martinez specializes in clinical diagnostics and biopharmaceutical analysis. Her work includes therapeutic drug monitoring, biomarker discovery, and monoclonal antibody characterization.',
    expertise: JSON.stringify(['Clinical Diagnostics', 'Therapeutic Drug Monitoring', 'Biopharmaceuticals', 'Biomarker Analysis']),
    email: 'sarah.martinez@rowellhplc.com',
    photoUrl: null
  }
];

// Article data (18 articles)
const articlesData = [
  {
    title: "HPLC Basics for Beginners",
    slug: "hplc-basics-for-beginners",
    authorSlug: "dr-michael-zhang",
    category: "technical-guides",
    applicationArea: "chemical",
    publishedAt: "2020-02-15",
    excerpt: "An authoritative guide to High-Performance Liquid Chromatography (HPLC) for beginners, covering fundamental principles, instrumentation, and practical considerations for effective analysis.",
    keywords: "HPLC, High-Performance Liquid Chromatography, chromatography, analytical chemistry, liquid chromatography, HPLC principles, HPLC instrumentation, method development, troubleshooting, analytical techniques",
    content: `# HPLC Basics for Beginners

## Introduction
High-Performance Liquid Chromatography (HPLC) stands as a cornerstone analytical technique in modern chemistry, indispensable across a myriad of scientific and industrial applications...`
  }
  // ... (other 17 articles would be added here)
];

router.post('/import-authors', async (req, res) => {
  try {
    const db = await getDb();
    const results = { success: 0, errors: 0, existed: 0 };
    
    for (const profile of authorProfiles) {
      try {
        await db.insert(authors).values({
          ...profile,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        results.success++;
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          results.existed++;
        } else {
          results.errors++;
          console.error(`Error importing author ${profile.name}:`, error);
        }
      }
    }
    
    res.json({ message: 'Authors import completed', results });
  } catch (error) {
    console.error('Fatal error:', error);
    res.status(500).json({ error: 'Import failed', message: String(error) });
  }
});

export default router;
