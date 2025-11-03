import { invokeLLM } from '../_core/llm';
import { getDb } from '../db';
import { aiConversations, aiMessages, aiCache, llmCostTracking, type User } from '../../drizzle/schema';
import { encrypt, decrypt } from './encryption';
import { generateCacheKey, extractKeywords, isPersonalizedQuery } from './cache';
import { SYSTEM_PROMPT, PRICING_INQUIRY_RESPONSE, ERROR_MESSAGE, isPricingInquiry } from './prompts';
import { eq, and, gt, desc } from 'drizzle-orm';

/**
 * AI Request Queue for concurrency control
 * Prevents cost overruns from simultaneous requests
 */
class AIRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 5;
  private timeout = 30000; // 30 seconds

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout: AI service is busy. Please try again in a moment.'));
      }, this.timeout);

      const wrappedTask = async () => {
        try {
          const result = await task();
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      this.queue.push(wrappedTask);
      this.processQueue();
    });
  }

  private processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }

  getQueueStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

const aiQueue = new AIRequestQueue();

/**
 * Generate unique session ID for conversation
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check cache for similar question
 * @param question User question
 * @returns Cached answer or null
 */
async function checkCache(question: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const cacheKey = generateCacheKey(question);
    const now = new Date();

    const cached = await db
      .select()
      .from(aiCache)
      .where(and(
        eq(aiCache.questionHash, cacheKey),
        gt(aiCache.expiresAt, now)
      ))
      .limit(1);

    if (cached.length > 0) {
      // Update hit count
      await db
        .update(aiCache)
        .set({ hitCount: cached[0].hitCount + 1 })
        .where(eq(aiCache.id, cached[0].id));

      console.log('[AI Cache] Cache hit for question:', question.substring(0, 50));
      return cached[0].answer;
    }

    return null;
  } catch (error) {
    console.error('[AI Cache] Error checking cache:', error);
    return null;
  }
}

/**
 * Save answer to cache
 * @param question User question
 * @param answer AI answer
 */
async function saveToCache(question: string, answer: string): Promise<void> {
  try {
    // Don't cache personalized queries
    if (isPersonalizedQuery(question)) {
      return;
    }

    const db = await getDb();
    if (!db) return;

    const cacheKey = generateCacheKey(question);
    const keywords = extractKeywords(question);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day TTL

    await db.insert(aiCache).values({
      questionHash: cacheKey,
      questionKeywords: keywords.join(' '),
      questionSample: question.substring(0, 500), // Store sample for reference
      answer: answer,
      expiresAt: expiresAt,
    }).onDuplicateKeyUpdate({
      set: {
        answer: answer,
        expiresAt: expiresAt,
      }
    });

    console.log('[AI Cache] Saved to cache:', question.substring(0, 50));
  } catch (error) {
    console.error('[AI Cache] Error saving to cache:', error);
  }
}

/**
 * Get conversation history for context
 * @param conversationId Conversation ID
 * @param limit Maximum number of messages to retrieve
 * @returns Array of messages
 */
async function getConversationHistory(conversationId: number, limit: number = 10): Promise<Array<{ role: string; content: string }>> {
  try {
    const db = await getDb();
    if (!db) return [];

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(desc(aiMessages.createdAt))
      .limit(limit);

    // Reverse to get chronological order
    return messages.reverse().map(msg => {
      let content = msg.content || '';
      
      // Decrypt if encrypted
      if (msg.contentEncrypted) {
        try {
          content = decrypt(msg.contentEncrypted);
        } catch (error) {
          console.error('[AI Chat] Failed to decrypt message:', error);
        }
      }

      return {
        role: msg.role,
        content: content,
      };
    });
  } catch (error) {
    console.error('[AI Chat] Error getting conversation history:', error);
    return [];
  }
}

/**
 * Save conversation message
 * @param conversationId Conversation ID
 * @param role Message role
 * @param content Message content
 * @param consentMode User consent mode
 */
async function saveMessage(
  conversationId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  consentMode: 'standard' | 'privacy' | 'anonymous'
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // For standard mode, encrypt the content
    if (consentMode === 'standard') {
      const encrypted = encrypt(content);
      await db.insert(aiMessages).values({
        conversationId,
        role,
        content: null, // Don't store plain text
        contentEncrypted: encrypted,
      });
    } else {
      // For privacy and anonymous modes, don't store content
      // (or store temporarily for session only)
      await db.insert(aiMessages).values({
        conversationId,
        role,
        content: null, // Don't persist
        contentEncrypted: null,
      });
    }
  } catch (error) {
    console.error('[AI Chat] Error saving message:', error);
  }
}

/**
 * Track LLM API cost
 * @param conversationId Conversation ID
 * @param tokenCount Total tokens used
 */
async function trackCost(conversationId: number | null, tokenCount: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // GPT-3.5-turbo pricing: $0.002 per 1K tokens
    const costPerToken = 0.000002;
    const cost = tokenCount * costPerToken;

    await db.insert(llmCostTracking).values({
      conversationId,
      tokenCount,
      cost,
      model: 'gpt-3.5-turbo',
    });

    console.log(`[AI Cost] Tracked cost: $${cost.toFixed(6)} (${tokenCount} tokens)`);
  } catch (error) {
    console.error('[AI Cost] Error tracking cost:', error);
  }
}

/**
 * Main AI chat handler
 * @param user User object (or undefined for anonymous)
 * @param message User message
 * @param sessionId Session ID (optional, will create new if not provided)
 * @returns AI response
 */
export async function handleAIChat(
  user: User | undefined,
  message: string,
  sessionId?: string
): Promise<{
  answer: string;
  sessionId: string;
  source: 'cache' | 'llm';
  conversationId?: number;
}> {
  return aiQueue.enqueue(async () => {
    try {
      // Validate input
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > 2000) {
        throw new Error('Message is too long (max 2000 characters)');
      }

      // Check if this is a pricing inquiry
      if (isPricingInquiry(message)) {
        return {
          answer: PRICING_INQUIRY_RESPONSE,
          sessionId: sessionId || generateSessionId(),
          source: 'cache',
        };
      }

      // Check cache first
      const cachedAnswer = await checkCache(message);
      if (cachedAnswer) {
        return {
          answer: cachedAnswer,
          sessionId: sessionId || generateSessionId(),
          source: 'cache',
        };
      }

      // Get or create conversation
      const db = await getDb();
      let conversationId: number | undefined;
      let consentMode: 'standard' | 'privacy' | 'anonymous' = 'anonymous';

      if (db) {
        if (!sessionId) {
          sessionId = generateSessionId();
        }

        // Try to find existing conversation
        const existingConv = await db
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.sessionId, sessionId))
          .limit(1);

        if (existingConv.length > 0) {
          conversationId = existingConv[0].id;
          consentMode = existingConv[0].consentMode;
        } else {
          // Create new conversation
          consentMode = user ? (user.consentMode || 'standard') : 'anonymous';
          const expiresAt = consentMode === 'standard' ? new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) : null; // 120 days

          const result = await db.insert(aiConversations).values({
            userId: user?.id,
            sessionId,
            consentMode,
            expiresAt,
          });

          conversationId = result[0].insertId;
        }

        // Save user message
        if (conversationId) {
          await saveMessage(conversationId, 'user', message, consentMode);
        }
      }

      // Get conversation history for context
      let conversationHistory: Array<{ role: string; content: string }> = [];
      if (conversationId && consentMode === 'standard') {
        conversationHistory = await getConversationHistory(conversationId, 5);
      }

      // Build messages for LLM
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: message },
      ];

      // Call LLM
      console.log('[AI Chat] Calling LLM for message:', message.substring(0, 50));
      const response = await invokeLLM({
        messages: messages as any,
        max_tokens: 800,
        temperature: 0.3,
      });

      const answer = response.choices[0].message.content;
      const tokenCount = response.usage?.total_tokens || 0;

      // Save assistant message
      if (conversationId && db) {
        await saveMessage(conversationId, 'assistant', answer, consentMode);
      }

      // Track cost
      await trackCost(conversationId || null, tokenCount);

      // Save to cache if generic question
      if (!isPersonalizedQuery(message)) {
        await saveToCache(message, answer);
      }

      return {
        answer,
        sessionId: sessionId || generateSessionId(),
        source: 'llm',
        conversationId,
      };
    } catch (error) {
      console.error('[AI Chat] Error handling chat:', error);
      
      // Return error message
      return {
        answer: ERROR_MESSAGE,
        sessionId: sessionId || generateSessionId(),
        source: 'cache',
      };
    }
  });
}

/**
 * Get queue status (for monitoring)
 */
export function getQueueStatus() {
  return aiQueue.getQueueStatus();
}
