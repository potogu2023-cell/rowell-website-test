import crypto from 'crypto';

/**
 * Cache utilities for AI advisor
 * Implements keyword-based caching to reduce LLM API costs
 */

// Stop words to filter out when extracting keywords
const STOP_WORDS = new Set([
  // English
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
  'don', 'should', 'now',
  // Common question words
  'need', 'want', 'looking', 'find', 'get', 'help', 'please', 'could', 'would', 'should',
]);

/**
 * Normalize question text for consistent caching
 * @param question Raw question text
 * @returns Normalized question text
 */
export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Extract keywords from question for cache matching
 * @param question Question text
 * @returns Array of keywords
 */
export function extractKeywords(question: string): string[] {
  const normalized = normalizeQuestion(question);
  const words = normalized.split(' ');
  
  // Filter out stop words and short words
  const keywords = words.filter(word => 
    word.length > 2 && 
    !STOP_WORDS.has(word)
  );
  
  // Remove duplicates and sort
  return Array.from(new Set(keywords)).sort();
}

/**
 * Generate cache key (hash) from question
 * @param question Question text
 * @returns SHA-256 hash of normalized keywords
 */
export function generateCacheKey(question: string): string {
  const keywords = extractKeywords(question);
  const keyString = keywords.join(' ');
  
  return crypto
    .createHash('sha256')
    .update(keyString)
    .digest('hex');
}

/**
 * Check if a question is personalized (should not be cached)
 * Personalized queries contain user-specific information or commercial intent
 * @param question Question text
 * @returns True if question is personalized
 */
export function isPersonalizedQuery(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  // Indicators of personalized queries
  const personalizedIndicators = [
    // Personal pronouns
    'my', 'our', 'we', 'us', 'i have', 'we have', 'i am', 'we are',
    // Commercial intent
    'price', 'cost', 'quote', 'order', 'buy', 'purchase', 'payment',
    // Logistics
    'ship', 'delivery', 'customs', 'import', 'export',
    // Specific customer info
    'company', 'laboratory', 'university', 'institute',
  ];
  
  return personalizedIndicators.some(indicator => 
    lowerQuestion.includes(indicator)
  );
}

/**
 * Calculate similarity score between two keyword sets
 * Uses Jaccard similarity coefficient
 * @param keywords1 First keyword set
 * @param keywords2 Second keyword set
 * @returns Similarity score between 0 and 1
 */
export function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity = |intersection| / |union|
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Test cache utilities
 * Should only be used in development
 */
export function testCacheUtilities(): boolean {
  try {
    console.log('[Cache] Running tests...');
    
    // Test 1: Normalization
    const q1 = "What's the BEST column for peptide separation?";
    const normalized = normalizeQuestion(q1);
    console.log('[Cache] Normalized:', normalized);
    
    // Test 2: Keyword extraction
    const keywords = extractKeywords(q1);
    console.log('[Cache] Keywords:', keywords);
    
    // Test 3: Cache key generation
    const cacheKey = generateCacheKey(q1);
    console.log('[Cache] Cache key:', cacheKey);
    
    // Test 4: Same question should generate same key
    const q2 = "what is the best column for peptide separation";
    const cacheKey2 = generateCacheKey(q2);
    if (cacheKey === cacheKey2) {
      console.log('[Cache] ✓ Same questions generate same cache key');
    } else {
      console.error('[Cache] ✗ Same questions generate different cache keys');
      return false;
    }
    
    // Test 5: Personalized query detection
    const personalizedQ = "How much does this column cost?";
    const genericQ = "What is the best column for peptide separation?";
    if (isPersonalizedQuery(personalizedQ) && !isPersonalizedQuery(genericQ)) {
      console.log('[Cache] ✓ Personalized query detection works');
    } else {
      console.error('[Cache] ✗ Personalized query detection failed');
      return false;
    }
    
    // Test 6: Similarity calculation
    const k1 = ['peptide', 'separation', 'column'];
    const k2 = ['peptide', 'separation', 'hplc'];
    const similarity = calculateSimilarity(k1, k2);
    console.log('[Cache] Similarity:', similarity);
    
    console.log('[Cache] All tests passed ✓');
    return true;
  } catch (error) {
    console.error('[Cache] Test failed with error:', error);
    return false;
  }
}
