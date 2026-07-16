import { Router, Request, Response } from 'express';
import requireAuth from '../middleware/requireAuth';
import { SerpAnalysis } from '../models/SerpAnalysis';
import {
  getSerpProvider,
  extractTextAndWordCount,
  analyzeSerpContentWithLlm,
} from '../services/serpService';
import axios from 'axios';

const router = Router();

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

router.post('/serp-analysis', requireAuth, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({ error: 'Keyword is required and must be a non-empty string' });
    }

    const cleanKeyword = keyword.toLowerCase().trim();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Check Cache (within last 24 hours rolling)
    const cachedAnalysis = await SerpAnalysis.findOne({
      keyword: cleanKeyword,
      createdAt: { $gte: cutoff },
    });

    if (cachedAnalysis) {
      console.log(`[SerpAnalysis]: Cache hit for keyword: "${cleanKeyword}"`);
      return res.json({
        keyword: cachedAnalysis.keyword,
        avgWordCount: cachedAnalysis.avgWordCount,
        sharedEntities: cachedAnalysis.sharedEntities,
        sharedSubtopics: cachedAnalysis.sharedSubtopics,
        competitors: cachedAnalysis.competitors.map((c) => ({
          url: c.url,
          wordCount: c.wordCount,
          title: c.title,
        })),
      });
    }

    console.log(`[SerpAnalysis]: Cache miss for keyword: "${cleanKeyword}". Running analysis.`);

    // 2. Fetch SERP Results
    const serpProvider = getSerpProvider();
    const serpResults = await serpProvider.fetchTop10(cleanKeyword);

    if (!serpResults || serpResults.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch competitor organic search results' });
    }

    // 3. Crawl competitors concurrently server-side
    const crawlPromises = serpResults.map(async (item) => {
      try {
        const response = await axios.get(item.url, {
          timeout: 3000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          validateStatus: () => true, // Preserve raw outputs on client errors instead of throwing
        });

        const html = response.data;
        if (typeof html === 'string') {
          const { text, wordCount } = extractTextAndWordCount(html);
          return {
            url: item.url,
            title: item.title,
            wordCount,
            text,
          };
        }
      } catch (err: any) {
        console.error(`[SerpAnalysis] Failed fetching competitor URL '${item.url}':`, err.message);
      }

      // Fallback on error
      return {
        url: item.url,
        title: item.title,
        wordCount: 0,
        text: '',
      };
    });

    const competitorsData = await Promise.all(crawlPromises);

    // 4. Group competitor texts and call LLM
    const competitorTexts = competitorsData.map((c) => c.text).filter((t) => t.length > 0);
    const llmAnalysis = await analyzeSerpContentWithLlm(cleanKeyword, competitorTexts);

    // 5. Compute average word count
    const totalWordCount = competitorsData.reduce((sum, c) => sum + c.wordCount, 0);
    const avgWordCount =
      competitorsData.length > 0 ? Math.round(totalWordCount / competitorsData.length) : 0;

    // 6. Format and save cache
    const competitors = competitorsData.map((c) => ({
      url: c.url,
      wordCount: c.wordCount,
      title: c.title,
    }));

    const analysisDoc = new SerpAnalysis({
      keyword: cleanKeyword,
      date: getTodayDateString(),
      avgWordCount,
      sharedEntities: llmAnalysis.sharedEntities,
      sharedSubtopics: llmAnalysis.sharedSubtopics,
      competitors,
    });

    try {
      await analysisDoc.save();
    } catch (saveErr: any) {
      console.warn('[SerpAnalysis] Duplicate cache save race condition bypassed:', saveErr.message);
    }

    return res.json({
      keyword: cleanKeyword,
      avgWordCount,
      sharedEntities: llmAnalysis.sharedEntities,
      sharedSubtopics: llmAnalysis.sharedSubtopics,
      competitors,
    });
  } catch (error) {
    console.error('SERP analysis feature failed:', error);
    return res.status(500).json({ error: 'Internal server error during SERP analysis' });
  }
});

// Import rate limiter and gradeContent helpers
import { rateLimiter } from '../middleware/rateLimiter';
import { gradeContent } from '../services/graderService';

// POST /api/content/grade - Real-time content scoring endpoint
router.post(
  '/grade',
  requireAuth,
  rateLimiter(10, 1000), // Max 10 requests per second per user
  async (req: Request, res: Response) => {
    try {
      const { text, targetKeyword, sharedEntities } = req.body;

      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content must be a valid string' });
      }

      const gradeResult = gradeContent(text, targetKeyword, sharedEntities);
      return res.json(gradeResult);
    } catch (error) {
      console.error('Content grading failed:', error);
      return res.status(500).json({ error: 'Internal server error during content grading' });
    }
  }
);

export default router;
