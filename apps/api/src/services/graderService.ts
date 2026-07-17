export interface GradeBreakdown {
  entityCoverage: number;
  structureScore: number;
  readability: number;
}

export interface GradeResult {
  score: number;
  breakdown: GradeBreakdown;
}

/**
 * Fast syllable counter for English words.
 */
export const countSyllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const clean = w.replace(/(?:es|ed|e)$/, '');
  const vowelMatches = clean.match(/[aeiouy]{1,2}/g);
  return vowelMatches ? vowelMatches.length : 1;
};

/**
 * Computes SEO content score locally and synchronously (updates < 10ms).
 */
export const gradeContent = (
  text: string,
  targetKeyword: string,
  sharedEntities?: string[]
): GradeResult => {
  const rawText = text || '';
  const cleanKeyword = (targetKeyword || '').toLowerCase().trim();

  // 1. Entity Coverage Score
  let entityCoverage = 100;
  if (sharedEntities && sharedEntities.length > 0) {
    let matched = 0;
    const lowerText = rawText.toLowerCase();
    for (const entity of sharedEntities) {
      if (lowerText.includes(entity.toLowerCase())) {
        matched++;
      }
    }
    entityCoverage = Math.round((matched / sharedEntities.length) * 100);
  }

  // 2. Structure Score (heading count and paragraph word count check)
  const lines = rawText.split('\n');
  let headingCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || /<h[1-6]/i.test(trimmed)) {
      headingCount++;
    }
  }

  let headingScore = 0;
  if (headingCount === 1) headingScore = 50;
  else if (headingCount >= 2) headingScore = 100;

  // Filter out heading lines before splitting text into paragraphs
  const paragraphText = lines
    .filter((line) => !line.trim().startsWith('#') && !/<h[1-6]/i.test(line.trim()))
    .join('\n');

  // Split paragraphs by blank lines or HTML <p> tags
  const paragraphs = paragraphText
    .split(/(?:\n\s*\n|<p[^>]*>)/i)
    .map((p) => p.replace(/<[^>]*>/g, '').trim())
    .filter((p) => p.length > 0);

  let paragraphScore = 100;
  if (paragraphs.length > 0) {
    let goodParagraphs = 0;
    for (const p of paragraphs) {
      const words = p.split(/\s+/).filter((w) => w.length > 0).length;
      // Ideal paragraph length distribution: between 20 and 150 words
      if (words >= 20 && words <= 150) {
        goodParagraphs++;
      }
    }
    paragraphScore = Math.round((goodParagraphs / paragraphs.length) * 100);
  } else {
    paragraphScore = 0;
  }

  const structureScore = Math.round(0.4 * headingScore + 0.6 * paragraphScore);

  // 3. Readability Score (Flesch Readability Ease approximation)
  const sentences = rawText.split(/[.!?]+(?:[ \t\r\n]+|$)/).filter((s) => s.trim().length > 0);

  const words = rawText.split(/\s+/).filter((w) => w.length > 0);

  let readability = 0;
  if (words.length > 0) {
    const totalSentences = sentences.length > 0 ? sentences.length : 1;
    const totalWords = words.length;
    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

    // Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const ease =
      206.835 - 1.015 * (totalWords / totalSentences) - 84.6 * (totalSyllables / totalWords);
    readability = Math.round(Math.max(0, Math.min(100, ease)));
  }

  // 4. Score formulation
  let keywordBonus = 0;
  if (cleanKeyword && rawText.toLowerCase().includes(cleanKeyword)) {
    keywordBonus = 5;
  }

  let score = 0;
  if (sharedEntities && sharedEntities.length > 0) {
    score = Math.round(0.4 * entityCoverage + 0.3 * structureScore + 0.3 * readability);
  } else {
    score = Math.round(0.5 * structureScore + 0.5 * readability);
  }

  score = Math.min(100, score + keywordBonus);

  return {
    score,
    breakdown: {
      entityCoverage,
      structureScore,
      readability,
    },
  };
};
