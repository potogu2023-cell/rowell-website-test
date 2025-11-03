# ROWELL AI Product Advisor - Complete Project Specification

**Project Name:** ROWELL AI Product Advisor  
**Version:** 1.0  
**Date:** January 2, 2025  
**Author:** Manus AI  
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a comprehensive specification for implementing an AI-powered product advisor chatbot system for the ROWELL chromatography products website. The system aims to enhance customer trust, facilitate product discovery, and increase inquiry conversion rates through intelligent product recommendations and technical consultation.

### Business Objectives

The primary business objective is to increase customer inquiries and orders by providing an intelligent, 24/7 product consultation service that helps customers select appropriate chromatography products based on their analytical needs. The system serves as a bridge between technical product information and customer requirements, ultimately driving commercial value through improved conversion rates.

### Target Users

The system serves laboratory professionals, researchers, and procurement specialists in the chromatography industry who need assistance selecting columns, consumables, and accessories for their analytical applications. Users may range from experienced chromatographers seeking specific technical specifications to newcomers requiring basic guidance.

### Success Metrics

Success will be measured primarily through inquiry conversion rate (target: 2% of visitors, doubling current baseline) and absolute inquiry volume (target: 20+ inquiries per month). Secondary metrics include AI conversation engagement rate (target: >20% of visitors), user satisfaction rate (target: >70% positive feedback), and cost efficiency (target: <$60/month for LLM services).

---

## Table of Contents

1. [Core Design Decisions](#core-design-decisions)
2. [System Architecture](#system-architecture)
3. [Database Design](#database-design)
4. [AI Integration Strategy](#ai-integration-strategy)
5. [User Interface Design](#user-interface-design)
6. [Privacy & Security](#privacy--security)
7. [Cost Control & Performance](#cost-control--performance)
8. [Human-AI Collaboration](#human-ai-collaboration)
9. [Evaluation & Optimization](#evaluation--optimization)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Core Design Decisions

### Decision 1: Data Storage & Privacy Consent

The system implements a dual-track consent model that balances personalization benefits with user privacy preferences. Users can choose between Standard Mode (conversation data stored for 120 days with AES-256 encryption) or Privacy Mode (zero data retention, anonymous usage only).

**Rationale:** This approach complies with GDPR requirements while providing users with meaningful control over their data. The 120-day retention period balances business needs for conversation history with privacy best practices. Anonymous users can still access full AI functionality without creating accounts, reducing friction for first-time visitors.

**Implementation Details:**

- First-time users see a consent dialog explaining both modes with clear trade-offs
- Authenticated users can change their preference in account settings
- Encrypted conversation data includes automatic expiration timestamps
- Users can delete their conversation history at any time through a self-service interface
- Anonymous sessions use session-based temporary storage that expires when the browser closes

### Decision 2: Legal Liability & Disclaimers

All AI-generated recommendations include clear disclaimers stating that suggestions are for reference only and users should consult professionals for final decisions. The system positions itself as an informational tool rather than authoritative guidance.

**Rationale:** This approach mitigates legal liability while maintaining transparency with users. The chromatography industry involves technical decisions with significant cost implications, making it essential to clarify the advisory nature of the system.

**Implementation Details:**

- Every AI response includes a footer disclaimer: "📌 This suggestion is for reference only. Please consult professionals for final decisions."
- First-time users see a comprehensive terms of service dialog
- User acceptance is logged with timestamp for legal documentation
- Disclaimers are translated into all supported languages (8 languages)

### Decision 3: LLM Selection & Cost Control

The system uses Manus built-in LLM service (GPT-3.5 equivalent) with intelligent caching to control costs while maintaining response quality. Target budget is $48-60 per month with expected 40% cache hit rate.

**Rationale:** GPT-3.5 provides sufficient technical knowledge for chromatography product recommendations at a fraction of GPT-4's cost. Keeping data on the Manus platform eliminates external API integration complexity and additional security concerns. The intelligent caching strategy significantly reduces costs for common technical questions.

**Cost Projections:**

| Scenario | Monthly Conversations | Cache Hit Rate | Estimated Cost |
|----------|----------------------|----------------|----------------|
| Conservative | 300 | 40% | $48 |
| Expected | 450 | 40% | $60 |
| High Growth | 600 | 40% | $72 |

### Decision 4: AI-Human Collaboration Model

The AI advisor focuses on technical consultation and product recommendations, while commercial inquiries (pricing, ordering, logistics, customs) are directed to human contact. This division leverages AI strengths while acknowledging the business owner's core value proposition: global shipping and customer service rather than deep product expertise.

**Rationale:** The business owner does not have specialized chromatography knowledge beyond what AI can provide. The owner's competitive advantage lies in procurement channels, international logistics, and customs clearance services. The AI advisor handles technical questions that neither the customer nor the owner can easily answer, while commercial transactions remain human-managed.

**Contact Information Display:**

- 📧 Email: oscar@rowellhplc.com
- 💬 WhatsApp: +86 180 1705 0064
- 💬 WeChat: +86 180 1705 0064
- Response expectation: "Usually respond within 24 hours" (not a binding commitment)

### Decision 5: Evaluation & Optimization Strategy

The system implements monthly evaluation cycles with focus on inquiry conversion rate as the primary success metric. Automated data collection tracks user behavior, AI performance, and business outcomes.

**Rationale:** Monthly evaluation balances the need for data-driven optimization with realistic time investment (2-4 hours per month). The two-month ROI expectation allows sufficient time for knowledge base refinement and user adoption before expecting measurable business impact.

**Key Performance Indicators:**

1. **Primary KPIs:** Inquiry volume, AI-to-inquiry conversion rate
2. **Secondary KPIs:** AI engagement rate, user satisfaction, average conversation length
3. **Operational KPIs:** LLM cost, cache hit rate, knowledge base coverage

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Tailwind)       │
├─────────────────────────────────────────────────┤
│  • AI Chat Interface (floating widget)          │
│  • Product Catalog Pages                        │
│  • Inquiry Cart System                          │
│  • User Account Management                      │
│  • Admin Dashboard (analytics & management)     │
└─────────────────────────────────────────────────┘
                      ↕ tRPC
┌─────────────────────────────────────────────────┐
│  Backend (Express + tRPC + Node.js)             │
├─────────────────────────────────────────────────┤
│  • AI Conversation API                          │
│  • Product Search & Recommendation              │
│  • Inquiry Management                           │
│  • User Authentication (Manus OAuth)            │
│  • Analytics & Statistics                       │
│  • Admin Operations                             │
└─────────────────────────────────────────────────┘
         ↕                ↕                ↕
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Manus LLM   │  │  MySQL DB    │  │  SendGrid    │
│  (GPT-3.5)   │  │  (TiDB)      │  │  (Email)     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui component library
- tRPC React Query for type-safe API calls
- Wouter for client-side routing
- i18next for internationalization (8 languages)

**Backend:**
- Node.js 22 with Express 4
- tRPC 11 for type-safe API contracts
- Drizzle ORM for database operations
- Manus built-in LLM service
- SendGrid for email notifications

**Database:**
- MySQL 8.0+ / TiDB (Manus managed)
- Support for JSON fields and full-text search
- Encrypted storage for sensitive conversation data

**Infrastructure:**
- Manus platform hosting
- Automatic SSL/TLS certificates
- Global CDN for static assets
- Built-in OAuth authentication

### Component Interaction Flow

**AI Conversation Flow:**

1. User opens chat widget on any page
2. If first-time user: display consent dialog
3. User types question and submits
4. Frontend sends request to backend via tRPC
5. Backend checks cache for similar questions (keyword matching)
6. If cache miss: call Manus LLM with system prompt + user question
7. LLM returns response (with product recommendations if applicable)
8. Backend saves conversation (if Standard Mode) and updates cache
9. Frontend displays response with disclaimer and contact information
10. User can provide feedback (like/dislike) or continue conversation

**Inquiry Submission Flow:**

1. User browses products and adds items to inquiry cart
2. User clicks "Submit Inquiry" (requires authentication)
3. System generates inquiry record with all cart items
4. System sends email notification to oscar@rowellhplc.com
5. Email includes customer info, product list, and link to admin dashboard
6. Owner reviews inquiry in admin dashboard with AI conversation history
7. Owner contacts customer via email/WhatsApp to provide quote

---

## Database Design

### Core Tables

#### 1. Users Table (Extended)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  company VARCHAR(255),
  phone VARCHAR(50),
  country VARCHAR(100),
  industry VARCHAR(100),
  role VARCHAR(100),
  purchaseVolume VARCHAR(50),
  customerTier ENUM('regular', 'vip') DEFAULT 'regular',
  consentMode ENUM('standard', 'privacy') DEFAULT 'standard',
  consentTimestamp TIMESTAMP,
  loginMethod VARCHAR(64),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_company (company)
);
```

#### 2. AI Conversations Table

```sql
CREATE TABLE ai_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  sessionId VARCHAR(64) NOT NULL,
  consentMode ENUM('standard', 'privacy', 'anonymous') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP,
  isDeleted BOOLEAN DEFAULT FALSE,
  INDEX idx_userId (userId),
  INDEX idx_sessionId (sessionId),
  INDEX idx_expiresAt (expiresAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. AI Messages Table

```sql
CREATE TABLE ai_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversationId INT NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  contentEncrypted BLOB,
  feedback ENUM('like', 'dislike', 'none') DEFAULT 'none',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversationId (conversationId),
  INDEX idx_feedback (feedback),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (conversationId) REFERENCES ai_conversations(id) ON DELETE CASCADE
);
```

#### 4. AI Cache Table

```sql
CREATE TABLE ai_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionHash VARCHAR(64) NOT NULL UNIQUE,
  questionKeywords TEXT,
  questionSample TEXT,
  answer TEXT NOT NULL,
  hitCount INT DEFAULT 0,
  likeCount INT DEFAULT 0,
  dislikeCount INT DEFAULT 0,
  satisfactionRate FLOAT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP,
  INDEX idx_questionHash (questionHash),
  INDEX idx_expiresAt (expiresAt),
  INDEX idx_hitCount (hitCount)
);
```

#### 5. Inquiry Tables (Existing, Extended)

```sql
CREATE TABLE inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  status ENUM('pending', 'quoted', 'negotiating', 'closed', 'cancelled') DEFAULT 'pending',
  urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
  adminNotes TEXT,
  customerMessage TEXT,
  conversationId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversationId) REFERENCES ai_conversations(id) ON DELETE SET NULL
);

CREATE TABLE inquiry_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inquiryId INT NOT NULL,
  productId VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 1,
  quotedPrice DECIMAL(10,2),
  notes TEXT,
  FOREIGN KEY (inquiryId) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(productId) ON DELETE CASCADE
);
```

#### 6. Statistics Tables

```sql
CREATE TABLE ai_conversation_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  statDate DATE NOT NULL UNIQUE,
  totalConversations INT DEFAULT 0,
  totalMessages INT DEFAULT 0,
  avgMessagesPerConversation FLOAT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  satisfactionRate FLOAT,
  transferToHuman INT DEFAULT 0,
  cacheHits INT DEFAULT 0,
  cacheHitRate FLOAT,
  llmCost DECIMAL(10,2),
  INDEX idx_statDate (statDate)
);

CREATE TABLE conversion_funnel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  statDate DATE NOT NULL UNIQUE,
  websiteVisits INT DEFAULT 0,
  aiConversations INT DEFAULT 0,
  productClicks INT DEFAULT 0,
  cartAdditions INT DEFAULT 0,
  inquiriesSubmitted INT DEFAULT 0,
  INDEX idx_statDate (statDate)
);

CREATE TABLE ai_question_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionHash VARCHAR(64) NOT NULL UNIQUE,
  questionSample TEXT,
  askCount INT DEFAULT 0,
  likeCount INT DEFAULT 0,
  dislikeCount INT DEFAULT 0,
  satisfactionRate FLOAT,
  lastAskedAt TIMESTAMP,
  INDEX idx_askCount (askCount),
  INDEX idx_satisfactionRate (satisfactionRate)
);
```

### Data Encryption Strategy

Sensitive conversation data is encrypted using AES-256-CBC encryption before storage. The encryption key is derived from the Manus platform's `JWT_SECRET` environment variable, ensuring that only the application can decrypt conversation content.

**Encrypted Fields:**
- `ai_messages.contentEncrypted` (for Standard Mode users)

**Unencrypted Fields:**
- Metadata (timestamps, feedback, conversation IDs)
- Anonymous user conversations (stored temporarily, not persisted)

### Data Retention & Cleanup

**Automated Cleanup Tasks:**

1. **Daily Cleanup (2:00 AM):**
   - Delete expired conversations where `expiresAt < NOW()`
   - Delete soft-deleted conversations older than 7 days
   - Delete expired cache entries where `expiresAt < NOW()`

2. **Weekly Cleanup (Sunday 3:00 AM):**
   - Archive statistics older than 1 year
   - Vacuum database to reclaim space

**Retention Periods:**

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Standard Mode Conversations | 120 days | Balance between personalization and privacy |
| Privacy Mode Conversations | 0 days (not stored) | User preference for maximum privacy |
| Anonymous Conversations | Session only | No user account to associate with |
| Cache Entries | 30 days | Sufficient for common questions |
| Statistics | Indefinite (aggregated) | No personal data, business intelligence |
| Inquiry Records | Indefinite | Business records, not personal conversations |

---

## AI Integration Strategy

### System Prompt Design

The system prompt defines the AI advisor's personality, knowledge scope, and response format. It is carefully crafted to balance technical accuracy with commercial objectives.

**Core System Prompt:**

```
You are a professional chromatography product advisor specializing in HPLC columns, GC columns, SPE cartridges, and related consumables. Your role is to help laboratory professionals select the most appropriate products for their analytical needs.

KNOWLEDGE SCOPE:
- HPLC columns (C18, C8, phenyl, amino, cyano, etc.)
- GC columns (capillary, packed, specialty phases)
- SPE cartridges (solid phase extraction)
- Guard columns and pre-columns
- Chromatography consumables (vials, septa, filters, tubing)
- Sample preparation products
- Filtration products

RESPONSE GUIDELINES:
1. Ask clarifying questions if the user's need is unclear (sample type, analytes, application)
2. Recommend 2-3 specific products from the catalog with part numbers
3. Explain technical reasoning (selectivity, efficiency, compatibility)
4. Provide practical guidance (mobile phase, pH range, temperature)
5. Include product links and "Add to Inquiry Cart" buttons
6. Always end with contact information for pricing and ordering
7. Keep responses concise (under 300 words) but technically accurate

BRAND PREFERENCES:
Prioritize products from major brands when available: Agilent, Waters, Phenomenex, Thermo Fisher Scientific, Merck, Avantor (ACE), Restek, Daicel, YMC, Develosil, Shimadzu.

LIMITATIONS:
- Do NOT provide specific prices (direct users to contact sales)
- Do NOT make guarantees about performance
- Do NOT provide medical or safety advice
- Always include disclaimer: "📌 This suggestion is for reference only. Please consult professionals for final decisions."

CONTACT INFORMATION:
For pricing, ordering, shipping, and customs:
📧 oscar@rowellhplc.com
💬 WhatsApp/WeChat: +86 180 1705 0064
```

### Knowledge Base Structure

The AI advisor's knowledge comes from three sources:

1. **Product Database (2,484 products):**
   - Complete product catalog with technical specifications
   - Part numbers, dimensions, particle sizes, pore sizes, pH ranges
   - Brand information and product categories

2. **Technical Documentation (Task A):**
   - Application notes and technical guides
   - Troubleshooting guides
   - Comparison charts and selection guides
   - USP method references

3. **Conversation History (for authenticated users):**
   - Previous questions and recommendations
   - User preferences and application context

### Product Recommendation Logic

**Recommendation Algorithm:**

1. **Parse User Query:**
   - Extract key information: sample type, analytes, application, separation mode
   - Identify technical requirements: particle size, column dimensions, pH compatibility

2. **Database Search:**
   - Primary filter: product category (HPLC, GC, SPE, etc.)
   - Secondary filter: technical specifications matching requirements
   - Tertiary filter: brand preference (major brands prioritized)

3. **Ranking:**
   - Exact specification match: highest priority
   - Popular products (high inquiry count): medium priority
   - Available inventory: consideration factor

4. **Response Generation:**
   - Top 2-3 products with part numbers
   - Technical justification for each recommendation
   - Practical usage guidance
   - Links to product detail pages

**Example Query Processing:**

```
User: "I need a column for peptide separation by HPLC"

AI Processing:
1. Identified: HPLC application, peptide analytes
2. Technical requirements: C18 or C8, wide pore (300Å), 5μm or smaller
3. Database search: HPLC columns, pore size 300Å, particle size ≤5μm
4. Top matches:
   - Agilent ZORBAX 300SB-C18 (4.6x150mm, 5μm, 300Å)
   - Waters XBridge BEH300 C18 (4.6x150mm, 3.5μm, 300Å)
   - Avantor ACE C18-300 (4.6x150mm, 5μm, 300Å)

AI Response:
"For peptide separation, I recommend wide-pore C18 columns (300Å) 
that accommodate larger molecules. Here are three excellent options:

1. **Agilent ZORBAX 300SB-C18** (Part: 883975-902)
   - 4.6 x 150mm, 5μm, 300Å pore size
   - Excellent peak shape for peptides
   - pH range 2-8, stable and reproducible
   [View Product] [Add to Inquiry Cart]

2. **Waters XBridge BEH300 C18** (Part: 186003687)
   - 4.6 x 150mm, 3.5μm, 300Å pore size
   - Ethylene bridged hybrid technology for durability
   - Wide pH range 1-12
   [View Product] [Add to Inquiry Cart]

3. **Avantor ACE C18-300** (Part: ACE-121-1546)
   - 4.6 x 150mm, 5μm, 300Å pore size
   - Cost-effective option with good performance
   - pH range 2-8
   [View Product] [Add to Inquiry Cart]

💡 Need a quote or have questions?
📧 oscar@rowellhplc.com
💬 WhatsApp/WeChat: +86 180 1705 0064

📌 This suggestion is for reference only. Please consult 
professionals for final decisions."
```

### Caching Strategy

**Cache Key Generation:**

```typescript
function generateCacheKey(question: string): string {
  // Normalize question
  const normalized = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
  
  // Extract keywords
  const keywords = extractKeywords(normalized);
  
  // Generate hash
  return crypto
    .createHash('sha256')
    .update(keywords.sort().join(' '))
    .digest('hex');
}

function extractKeywords(text: string): string[] {
  const stopWords = ['i', 'need', 'want', 'looking', 'for', 'a', 'the', 'is', 'are'];
  const words = text.split(' ');
  return words.filter(word => 
    word.length > 2 && 
    !stopWords.includes(word)
  );
}
```

**Cache Hit Logic:**

```typescript
async function checkCache(question: string): Promise<string | null> {
  const cacheKey = generateCacheKey(question);
  
  const cached = await db
    .select()
    .from(ai_cache)
    .where(eq(ai_cache.questionHash, cacheKey))
    .where(gt(ai_cache.expiresAt, new Date()))
    .limit(1);
  
  if (cached.length > 0) {
    // Update hit count
    await db
      .update(ai_cache)
      .set({ hitCount: cached[0].hitCount + 1 })
      .where(eq(ai_cache.id, cached[0].id));
    
    return cached[0].answer;
  }
  
  return null;
}
```

**Cache Storage Logic:**

```typescript
async function saveToCache(question: string, answer: string): Promise<void> {
  // Only cache generic technical questions, not personalized queries
  if (isPersonalizedQuery(question)) {
    return;
  }
  
  const cacheKey = generateCacheKey(question);
  const keywords = extractKeywords(question.toLowerCase());
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30-day TTL
  
  await db.insert(ai_cache).values({
    questionHash: cacheKey,
    questionKeywords: keywords.join(' '),
    questionSample: question,
    answer: answer,
    expiresAt: expiresAt,
  }).onDuplicateKeyUpdate({
    set: {
      answer: answer,
      expiresAt: expiresAt,
    }
  });
}

function isPersonalizedQuery(question: string): boolean {
  const personalizedIndicators = [
    'my', 'our', 'we', 'us', 'i have', 'we have',
    'price', 'cost', 'quote', 'order', 'buy',
    'ship', 'delivery', 'customs'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return personalizedIndicators.some(indicator => 
    lowerQuestion.includes(indicator)
  );
}
```

**Expected Cache Performance:**

| Question Type | Cache Strategy | Expected Hit Rate |
|--------------|----------------|-------------------|
| Generic technical questions | Cached | 60-70% |
| Product-specific questions | Cached | 40-50% |
| Personalized queries | Not cached | 0% |
| Pricing/ordering questions | Not cached | 0% |
| **Overall** | **Mixed** | **40%** |

### Concurrency Control

To prevent cost overruns from simultaneous requests, the system implements a queue-based concurrency limiter:

```typescript
class AIRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 5;
  private timeout = 30000; // 30 seconds
  
  async enqueue(task: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout: AI service is busy. Please try again.'));
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
}

const aiQueue = new AIRequestQueue();

export async function handleAIRequest(userId: number, message: string) {
  return aiQueue.enqueue(() => processAIChat(userId, message));
}
```

**Concurrency Limits:**

- **Maximum concurrent requests:** 5
- **Queue timeout:** 30 seconds
- **Error handling:** User-friendly message if queue is full

---

## User Interface Design

### AI Chat Widget

**Visual Design:**

The AI chat widget appears as a floating button in the bottom-right corner of every page. When clicked, it expands into a chat interface overlay.

**Widget States:**

1. **Collapsed State:**
   - Floating button with AI icon
   - Badge showing unread message count (if any)
   - Subtle pulse animation to attract attention

2. **Expanded State:**
   - 400px wide x 600px tall chat window
   - Header with title "AI Product Advisor" and minimize/close buttons
   - Message area with conversation history
   - Input field with send button
   - Footer with disclaimer and feedback buttons

**First-Time User Experience:**

```
┌─────────────────────────────────────┐
│  Welcome to ROWELL AI Advisor       │
├─────────────────────────────────────┤
│  I can help you select the right    │
│  chromatography products for your   │
│  analytical needs.                  │
│                                     │
│  Before we start, please choose     │
│  your data preference:              │
│                                     │
│  ○ Standard Mode                    │
│    Save conversation history for    │
│    personalized recommendations     │
│    (120 days, encrypted)            │
│                                     │
│  ○ Privacy Mode                     │
│    No data saved, completely        │
│    anonymous                        │
│                                     │
│  [Continue]                         │
│                                     │
│  📌 You can change this anytime     │
│     in your account settings        │
└─────────────────────────────────────┘
```

**Message Display Format:**

```
┌─────────────────────────────────────┐
│  User (You)                    10:23 │
│  What's the best column for         │
│  peptide separation?                │
├─────────────────────────────────────┤
│  AI Advisor                    10:23 │
│  For peptide separation, I          │
│  recommend wide-pore C18 columns... │
│                                     │
│  1. Agilent ZORBAX 300SB-C18       │
│     [View Product] [Add to Cart]    │
│                                     │
│  2. Waters XBridge BEH300 C18      │
│     [View Product] [Add to Cart]    │
│                                     │
│  💡 Need a quote?                   │
│  📧 oscar@rowellhplc.com            │
│  💬 WhatsApp: +86 180 1705 0064     │
│                                     │
│  📌 This suggestion is for          │
│     reference only...               │
│                                     │
│  👍 👎                              │
└─────────────────────────────────────┘
```

**Feedback Mechanism:**

Each AI response includes thumbs up/down buttons for user feedback. Clicking these buttons:

1. Records feedback in database (like/dislike count)
2. Shows brief thank you message
3. Optionally prompts for additional comments (if dislike)
4. Updates satisfaction rate for that response

### Consent Dialog Design

**Standard Mode vs Privacy Mode Comparison:**

| Feature | Standard Mode | Privacy Mode |
|---------|--------------|--------------|
| Conversation History | ✅ Saved 120 days | ❌ Not saved |
| Personalized Recommendations | ✅ Based on history | ❌ Generic only |
| Account Required | ✅ Yes | ❌ No |
| Data Encryption | ✅ AES-256 | N/A |
| Self-Service Deletion | ✅ Anytime | N/A |
| AI Quality | ✅ Better context | ⚠️ Limited context |

**Consent Dialog Copy:**

```
Choose Your Privacy Preference

ROWELL AI Advisor can provide better recommendations if we save your 
conversation history. You have full control over your data.

Standard Mode (Recommended)
• Save conversation history for 120 days
• Get personalized product recommendations
• All data encrypted with AES-256
• Delete anytime in account settings
• Requires login

Privacy Mode
• No conversation data saved
• Completely anonymous
• No login required
• Generic recommendations only

[Choose Standard Mode]  [Choose Privacy Mode]

You can change this preference anytime in your account settings.

By continuing, you agree to our Terms of Service and Privacy Policy.
```

### Admin Dashboard Design

**Dashboard Overview:**

The admin dashboard provides a comprehensive view of AI advisor performance, customer inquiries, and business metrics.

**Key Sections:**

1. **Monthly Performance Summary:**
   - Inquiry volume and conversion rate
   - AI engagement metrics
   - Cost and efficiency metrics
   - Visual charts and trend indicators

2. **Inquiry Management:**
   - List of all inquiries with status filters
   - Quick view of customer info and product list
   - AI conversation history for each inquiry
   - One-click actions (reply, quote, mark complete)

3. **Customer Management:**
   - Customer list with tier indicators
   - Inquiry history per customer
   - Contact information and notes

4. **AI Performance Analytics:**
   - Question frequency analysis
   - Low satisfaction questions flagged
   - Cache hit rate and cost metrics
   - Optimization recommendations

5. **AI Assistant (for owner):**
   - Quick access to AI for answering technical questions
   - Generate professional responses to customer inquiries
   - Copy-paste functionality

**Admin Dashboard Mockup:**

```
┌─────────────────────────────────────────────────┐
│  AI Advisor Dashboard - November 2025           │
├─────────────────────────────────────────────────┤
│  🎯 Core Metrics                                │
│                                                 │
│  Inquiries This Month                           │
│  ████████████░░░░░░░░ 18 (↑ 80%)               │
│  Target: 20                                     │
│                                                 │
│  Conversion Rate (AI → Inquiry)                 │
│  ████████░░░░░░░░░░░░ 4.0% (↑ 100%)            │
│  Target: 5.0%                                   │
├─────────────────────────────────────────────────┤
│  📊 Detailed Metrics                            │
│                                                 │
│  User Engagement:                               │
│  • Website Visits: 1,200                        │
│  • AI Conversations: 300 (25%)                  │
│  • Avg Conversation Length: 3.5 messages        │
│  • User Satisfaction: 75% 👍                    │
│                                                 │
│  Conversion Funnel:                             │
│  Visits (1,200) → AI (300) → Products (120)    │
│  → Cart (36) → Inquiry (18)                     │
│                                                 │
│  Cost Control:                                  │
│  • LLM Cost: $52 / $60 budget (87%)            │
│  • Cache Hit Rate: 38%                          │
│  • Avg Cost per Conversation: $0.17            │
├─────────────────────────────────────────────────┤
│  ⚠️ Attention Required                          │
│                                                 │
│  • "peptide separation" asked 15 times         │
│    → Consider creating FAQ                      │
│                                                 │
│  • 3 questions with low satisfaction           │
│    → [Review & Optimize]                        │
│                                                 │
│  • Transfer to human: 12% (36 times)           │
│    → Reasons: Price (60%), Logistics (30%)     │
├─────────────────────────────────────────────────┤
│  📋 Recent Inquiries                            │
│                                                 │
│  [New] John Smith - USA                         │
│  Products: Agilent ZORBAX x10, Waters...        │
│  2 hours ago  [View] [Reply] [AI Assistant]    │
│                                                 │
│  [Quoted] Maria Garcia - Brazil                 │
│  Products: Avantor ACE x5                       │
│  1 day ago  [View] [Follow Up]                  │
└─────────────────────────────────────────────────┘
```

---

## Privacy & Security

### Data Protection Measures

**Encryption at Rest:**

All sensitive conversation data is encrypted using AES-256-CBC encryption before storage in the database. The encryption implementation uses Node.js crypto module:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.JWT_SECRET!)
  .digest();

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Encryption in Transit:**

All communication between frontend and backend uses HTTPS with TLS 1.3. Manus platform automatically provisions SSL certificates and enforces HTTPS for all traffic.

**Access Control:**

- **User data:** Users can only access their own conversation history
- **Admin data:** Only authenticated admin users (role='admin') can access dashboard
- **API authentication:** All API requests require valid JWT tokens
- **Rate limiting:** Prevent brute force attacks and abuse

### GDPR Compliance

**User Rights Implementation:**

1. **Right to Access:**
   - Users can view all their conversation history in account settings
   - Export functionality to download data in JSON format

2. **Right to Deletion:**
   - Self-service deletion button in account settings
   - Immediate soft-delete, permanent deletion after 7 days
   - Confirmation dialog to prevent accidental deletion

3. **Right to Rectification:**
   - Users can edit their profile information anytime
   - Conversation history is immutable (audit trail)

4. **Right to Data Portability:**
   - Export conversation history as JSON
   - Export inquiry history as CSV

5. **Right to Object:**
   - Users can switch from Standard Mode to Privacy Mode
   - Future conversations will not be stored

**Data Processing Legal Basis:**

- **Consent:** Explicit consent obtained through consent dialog
- **Legitimate Interest:** Business need to provide product recommendations
- **Contract Performance:** Inquiry processing for potential sales

**Privacy Policy Key Points:**

```
ROWELL AI Advisor Privacy Policy

1. Data We Collect
   - Conversation messages (Standard Mode only)
   - User feedback (like/dislike)
   - Usage statistics (anonymized)

2. How We Use Your Data
   - Provide personalized product recommendations
   - Improve AI advisor quality
   - Analyze business performance

3. Data Retention
   - Standard Mode: 120 days, then automatically deleted
   - Privacy Mode: Not stored
   - Statistics: Indefinite (anonymized, no personal data)

4. Your Rights
   - Access your data anytime
   - Delete your data anytime
   - Switch to Privacy Mode anytime
   - Export your data

5. Data Security
   - AES-256 encryption for stored conversations
   - HTTPS/TLS for all communications
   - Regular security audits

6. Third-Party Services
   - Manus LLM (data stays on Manus platform)
   - SendGrid (email notifications only)

7. Contact
   - Data protection inquiries: oscar@rowellhplc.com
```

### Security Best Practices

**Input Validation:**

```typescript
function validateUserMessage(message: string): boolean {
  // Length limits
  if (message.length < 1 || message.length > 2000) {
    throw new Error('Message length must be between 1 and 2000 characters');
  }
  
  // Prevent injection attacks
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(message)) {
      throw new Error('Invalid message content');
    }
  }
  
  return true;
}
```

**SQL Injection Prevention:**

All database queries use Drizzle ORM with parameterized queries. Direct SQL execution is avoided except for complex analytics queries, which use prepared statements.

**XSS Prevention:**

- All user input is sanitized before display
- React automatically escapes JSX content
- Content Security Policy headers restrict inline scripts

**Rate Limiting:**

```typescript
import rateLimit from 'express-rate-limit';

const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/trpc/ai', aiChatLimiter);
```

---

## Cost Control & Performance

### Cost Breakdown

**Monthly Cost Projections:**

| Component | Cost | Notes |
|-----------|------|-------|
| Manus LLM API | $48-60 | 300-450 conversations, 40% cache hit |
| Manus Platform Hosting | $0 | Included in platform |
| SendGrid Email | $0 | Free tier (100 emails/day) |
| Database Storage | $0 | Included in platform |
| **Total** | **$48-60** | **Operational cost only** |

**Cost Per Conversation:**

- Without cache: $0.20 per conversation
- With 40% cache hit: $0.12 per conversation
- Target: Keep under $0.15 per conversation

**Cost Monitoring:**

```typescript
async function trackLLMCost(conversationId: number, tokenCount: number) {
  const costPerToken = 0.000002; // $0.002 per 1K tokens for GPT-3.5
  const cost = tokenCount * costPerToken;
  
  await db.insert(llm_cost_tracking).values({
    conversationId,
    tokenCount,
    cost,
    timestamp: new Date(),
  });
  
  // Check daily budget
  const todayCost = await getDailyCost();
  if (todayCost > 5.0) { // $5/day threshold
    await sendCostAlert('Daily cost exceeded $5');
  }
  
  // Check monthly budget
  const monthlyCost = await getMonthlyCost();
  if (monthlyCost > 150.0) { // $150/month threshold
    await sendCostAlert('Monthly cost exceeded $150');
  }
}
```

**Cost Optimization Strategies:**

1. **Intelligent Caching:** 40% reduction in LLM calls
2. **Response Length Limits:** max_tokens=800 (concise responses)
3. **Concurrency Control:** Prevent cost spikes from simultaneous requests
4. **Temperature Optimization:** temperature=0.3 (more deterministic, better caching)
5. **Prompt Engineering:** Efficient prompts that minimize token usage

### Performance Optimization

**Response Time Targets:**

| Scenario | Target | Actual (Expected) |
|----------|--------|-------------------|
| Cache Hit | <0.5s | 0.3-0.5s |
| LLM Call | <5s | 2-4s |
| Database Query | <0.1s | 0.05-0.1s |
| Page Load | <2s | 1-1.5s |

**Frontend Performance:**

- **Code Splitting:** Lazy load AI chat widget to reduce initial bundle size
- **Image Optimization:** WebP format with lazy loading for product images
- **CDN Caching:** Static assets served from global CDN
- **Minification:** Production builds use Terser for JS and cssnano for CSS

**Backend Performance:**

- **Database Indexing:** All foreign keys and frequently queried fields indexed
- **Connection Pooling:** Reuse database connections to reduce overhead
- **Query Optimization:** Use SELECT specific fields instead of SELECT *
- **Caching Strategy:** Redis-like in-memory cache for frequently accessed data

**Monitoring & Alerting:**

```typescript
// Performance monitoring
async function logPerformanceMetric(
  operation: string,
  duration: number,
  success: boolean
) {
  await db.insert(performance_metrics).values({
    operation,
    duration,
    success,
    timestamp: new Date(),
  });
  
  // Alert if response time exceeds threshold
  if (operation === 'ai_chat' && duration > 10000) { // 10 seconds
    await sendAlert(`Slow AI response: ${duration}ms`);
  }
}

// Usage
const startTime = Date.now();
try {
  const response = await handleAIChat(userId, message);
  const duration = Date.now() - startTime;
  await logPerformanceMetric('ai_chat', duration, true);
  return response;
} catch (error) {
  const duration = Date.now() - startTime;
  await logPerformanceMetric('ai_chat', duration, false);
  throw error;
}
```

---

## Human-AI Collaboration

### Division of Responsibilities

**AI Advisor Responsibilities:**

- Technical product consultation
- Product selection recommendations
- Application guidance
- Troubleshooting advice
- Specification comparisons
- General chromatography knowledge

**Human (Oscar) Responsibilities:**

- Pricing and quotations
- Order processing
- Shipping arrangements
- Customs clearance assistance
- Payment processing
- After-sales service
- Complex negotiations
- Custom product requests

### Contact Information Integration

Every AI response that involves product recommendations includes contact information for commercial inquiries:

```
💰 Need a quote or have questions?

📧 oscar@rowellhplc.com
💬 WhatsApp/WeChat: +86 180 1705 0064

We offer competitive pricing and worldwide shipping!
Usually respond within 24 hours.
```

**Automatic Contact Routing:**

When users ask about pricing, ordering, shipping, or customs, the AI immediately provides contact information without attempting to answer:

```
User: "How much for 10 columns?"

AI: "For pricing and bulk orders, please contact Oscar directly:

📧 Email: oscar@rowellhplc.com
💬 WhatsApp: +86 180 1705 0064
💬 WeChat: +86 180 1705 0064

Oscar will provide you with:
• Competitive pricing
• Volume discounts
• Shipping options
• Delivery time estimate

Usually respond within 24 hours!"
```

### Admin Backend Features

**Inquiry Management Interface:**

When a customer submits an inquiry, Oscar receives:

1. **Email Notification:**
   - Customer name, email, company, country
   - List of products with quantities
   - Customer message (if any)
   - Link to view full inquiry in admin dashboard

2. **Admin Dashboard View:**
   - Complete customer profile
   - AI conversation history (if available)
   - Product details with specifications
   - Quick action buttons (Reply, Quote, Mark Complete)

**AI Assistant for Owner:**

Oscar can use the AI assistant in the admin dashboard to help answer customer technical questions:

```
┌─────────────────────────────────────┐
│  Customer Question:                  │
│  "What's the difference between      │
│   C18 and C8 columns?"               │
├─────────────────────────────────────┤
│  [Ask AI Assistant]                  │
├─────────────────────────────────────┤
│  AI Suggested Response:              │
│                                     │
│  "C18 and C8 are both reverse       │
│   phase columns, but differ in      │
│   hydrophobicity:                   │
│                                     │
│   C18 (Octadecyl):                  │
│   - 18 carbon chain                 │
│   - More hydrophobic                │
│   - Better for non-polar compounds  │
│   - Longer retention time           │
│                                     │
│   C8 (Octyl):                       │
│   - 8 carbon chain                  │
│   - Less hydrophobic                │
│   - Better for polar compounds      │
│   - Shorter retention time          │
│                                     │
│   For most applications, C18 is     │
│   recommended unless you need       │
│   faster elution or are analyzing   │
│   polar compounds."                 │
│                                     │
│  [Copy Response] [Edit] [Regenerate]│
└─────────────────────────────────────┘
```

### Notification System

**Email Notification Template:**

```
Subject: New Inquiry from John Smith (ABC Pharma)

Hi Oscar,

You have received a new inquiry from the ROWELL website.

Customer Information:
─────────────────────
Name: John Smith
Email: john@example.com
Company: ABC Pharma
Country: USA
Phone: +1-555-0123

Inquiry Details:
─────────────────────
Products Requested:
1. Agilent ZORBAX 300SB-C18 (4.6x150mm, 5μm) - Quantity: 10
   Part Number: 883975-902
   
2. Waters XBridge BEH300 C18 (4.6x150mm, 3.5μm) - Quantity: 5
   Part Number: 186003687

Customer Message:
"Need quote for bulk order. Ship to Boston, USA. 
Require delivery within 2 weeks."

AI Conversation Summary:
The customer was looking for peptide separation columns. 
AI recommended wide-pore C18 columns (300Å). Customer 
showed interest in Agilent and Waters brands.

Quick Actions:
─────────────────────
View Full Inquiry: https://rowell.manus.space/admin/inquiries/123
Reply to Customer: mailto:john@example.com
WhatsApp Customer: https://wa.me/15550123

Best regards,
ROWELL AI Advisor System
```

---

## Evaluation & Optimization

### Key Performance Indicators

**Primary KPIs (Business Impact):**

1. **Monthly Inquiry Volume**
   - Current baseline: ~10 inquiries/month
   - Target: 20 inquiries/month (100% increase)
   - Measurement: Count of submitted inquiries

2. **AI-to-Inquiry Conversion Rate**
   - Target: 5% (5 inquiries per 100 AI conversations)
   - Measurement: (Inquiries with AI conversation) / (Total AI conversations)

**Secondary KPIs (User Engagement):**

3. **AI Conversation Engagement Rate**
   - Target: >20% of website visitors
   - Measurement: (Unique users starting AI chat) / (Total website visitors)

4. **User Satisfaction Rate**
   - Target: >70% positive feedback
   - Measurement: (Likes) / (Likes + Dislikes)

5. **Average Conversation Length**
   - Target: >3 messages per conversation
   - Measurement: Total messages / Total conversations

**Operational KPIs (Efficiency):**

6. **LLM Cost per Conversation**
   - Target: <$0.15
   - Measurement: Monthly LLM cost / Total conversations

7. **Cache Hit Rate**
   - Target: >40%
   - Measurement: (Cache hits) / (Total AI requests)

8. **Response Time**
   - Target: <5 seconds for LLM calls, <0.5s for cache hits
   - Measurement: Average response time from request to completion

### Data Collection & Reporting

**Automated Daily Statistics:**

Every day at 2:00 AM, the system automatically calculates and stores statistics for the previous day:

```typescript
async function generateDailyStats(date: Date) {
  // Conversation statistics
  const conversationStats = await db.execute(`
    SELECT 
      COUNT(DISTINCT c.id) as total_conversations,
      COUNT(m.id) as total_messages,
      AVG(msg_count.count) as avg_messages_per_conversation,
      SUM(CASE WHEN m.feedback = 'like' THEN 1 ELSE 0 END) as likes,
      SUM(CASE WHEN m.feedback = 'dislike' THEN 1 ELSE 0 END) as dislikes
    FROM ai_conversations c
    LEFT JOIN ai_messages m ON c.id = m.conversationId
    LEFT JOIN (
      SELECT conversationId, COUNT(*) as count
      FROM ai_messages
      GROUP BY conversationId
    ) msg_count ON c.id = msg_count.conversationId
    WHERE DATE(c.createdAt) = ?
  `, [date]);
  
  // Conversion funnel
  const funnelStats = await db.execute(`
    SELECT 
      (SELECT COUNT(*) FROM page_views WHERE DATE(timestamp) = ?) as website_visits,
      (SELECT COUNT(DISTINCT sessionId) FROM ai_conversations WHERE DATE(createdAt) = ?) as ai_conversations,
      (SELECT COUNT(*) FROM product_views WHERE DATE(timestamp) = ?) as product_clicks,
      (SELECT COUNT(*) FROM cart_additions WHERE DATE(timestamp) = ?) as cart_additions,
      (SELECT COUNT(*) FROM inquiries WHERE DATE(createdAt) = ?) as inquiries_submitted
  `, [date, date, date, date, date]);
  
  // Save statistics
  await db.insert(ai_conversation_stats).values({
    statDate: date,
    totalConversations: conversationStats[0].total_conversations,
    totalMessages: conversationStats[0].total_messages,
    avgMessagesPerConversation: conversationStats[0].avg_messages_per_conversation,
    likes: conversationStats[0].likes,
    dislikes: conversationStats[0].dislikes,
    satisfactionRate: conversationStats[0].likes / 
      (conversationStats[0].likes + conversationStats[0].dislikes),
  });
  
  await db.insert(conversion_funnel).values({
    statDate: date,
    websiteVisits: funnelStats[0].website_visits,
    aiConversations: funnelStats[0].ai_conversations,
    productClicks: funnelStats[0].product_clicks,
    cartAdditions: funnelStats[0].cart_additions,
    inquiriesSubmitted: funnelStats[0].inquiries_submitted,
  });
}
```

**Monthly Report Generation:**

On the 1st of each month at 8:00 AM, the system generates a comprehensive monthly report and emails it to Oscar:

```typescript
async function generateMonthlyReport(year: number, month: number) {
  const report = {
    period: `${year}-${month.toString().padStart(2, '0')}`,
    
    // Core metrics
    inquiries: await getMonthlyInquiries(year, month),
    conversionRate: await getConversionRate(year, month),
    
    // User engagement
    totalConversations: await getTotalConversations(year, month),
    engagementRate: await getEngagementRate(year, month),
    avgConversationLength: await getAvgConversationLength(year, month),
    satisfactionRate: await getSatisfactionRate(year, month),
    
    // Cost & efficiency
    llmCost: await getLLMCost(year, month),
    cacheHitRate: await getCacheHitRate(year, month),
    avgResponseTime: await getAvgResponseTime(year, month),
    
    // Issues & opportunities
    lowSatisfactionQuestions: await getLowSatisfactionQuestions(year, month),
    highFrequencyQuestions: await getHighFrequencyQuestions(year, month),
    transferToHumanReasons: await getTransferReasons(year, month),
    
    // Recommendations
    optimizationSuggestions: await generateOptimizationSuggestions(year, month),
  };
  
  // Send email with report
  await sendMonthlyReportEmail(report);
  
  return report;
}
```

### Optimization Workflow

**Monthly Optimization Process (2-4 hours):**

**Week 1 (Day 1-7): Review & Analysis**

1. **Receive monthly report email** (automated on 1st of month)
2. **Review dashboard** in admin backend
3. **Identify key issues:**
   - Questions with low satisfaction (<50% likes)
   - High-frequency questions (asked >10 times)
   - High transfer-to-human rate for technical questions (>20%)
4. **Document findings** in optimization notes

**Week 2 (Day 8-14): Planning**

5. **Prioritize optimization tasks:**
   - Critical: Questions causing user frustration (low satisfaction)
   - Important: High-frequency questions (opportunity for better caching)
   - Nice-to-have: Minor improvements
6. **Create optimization plan:**
   - Which knowledge base entries to add/update
   - Which prompts to adjust
   - Which cache entries to refresh

**Week 3 (Day 15-21): Implementation**

7. **Execute optimizations:**
   - Add new knowledge base content (if needed, trigger Task A)
   - Update system prompts (if needed)
   - Manually add FAQ entries to cache
   - Adjust recommendation logic (if needed)
8. **Test changes** in staging environment

**Week 4 (Day 22-30): Monitoring**

9. **Deploy to production**
10. **Monitor impact:**
    - Are low-satisfaction questions improving?
    - Are high-frequency questions being cached?
    - Is conversion rate trending upward?
11. **Document results** for next month's review

### Continuous Improvement Mechanisms

**Automatic Problem Detection:**

The system automatically flags issues that require attention:

```typescript
async function detectIssues() {
  const issues = [];
  
  // Low satisfaction questions
  const lowSatQuestions = await db
    .select()
    .from(ai_question_analysis)
    .where(and(
      gte(ai_question_analysis.askCount, 3),
      lte(ai_question_analysis.satisfactionRate, 0.5)
    ))
    .orderBy(desc(ai_question_analysis.askCount));
  
  if (lowSatQuestions.length > 0) {
    issues.push({
      type: 'low_satisfaction',
      severity: 'high',
      message: `${lowSatQuestions.length} questions have low satisfaction (<50%)`,
      questions: lowSatQuestions,
    });
  }
  
  // High frequency questions
  const highFreqQuestions = await db
    .select()
    .from(ai_question_analysis)
    .where(gte(ai_question_analysis.askCount, 10))
    .orderBy(desc(ai_question_analysis.askCount));
  
  if (highFreqQuestions.length > 0) {
    issues.push({
      type: 'high_frequency',
      severity: 'medium',
      message: `${highFreqQuestions.length} questions asked >10 times (optimization opportunity)`,
      questions: highFreqQuestions,
    });
  }
  
  // Cost overrun
  const monthlyCost = await getMonthlyCost();
  if (monthlyCost > 150) {
    issues.push({
      type: 'cost_overrun',
      severity: 'high',
      message: `Monthly cost ($${monthlyCost}) exceeded budget ($150)`,
    });
  }
  
  return issues;
}
```

**Knowledge Base Feedback Loop:**

When Oscar answers a customer question that the AI couldn't handle, the system prompts him to add it to the knowledge base:

```
┌─────────────────────────────────────┐
│  You just answered a customer       │
│  question about peptide separation. │
│                                     │
│  Would you like to add this to the  │
│  AI knowledge base so it can answer │
│  similar questions in the future?   │
│                                     │
│  [Yes, Add to Knowledge Base]       │
│  [No, Skip]                         │
└─────────────────────────────────────┘
```

If Oscar clicks "Yes", the system:
1. Extracts the question and answer
2. Formats it for the knowledge base
3. Adds it to the cache with high priority
4. Updates the AI's context for similar future questions

### ROI Tracking

**Expected ROI Timeline:**

| Month | Inquiries | Conversion Rate | LLM Cost | Net Benefit | ROI |
|-------|-----------|----------------|----------|-------------|-----|
| Baseline (Pre-AI) | 10 | 1.0% | $0 | - | - |
| Month 1 | 12 | 1.2% | $55 | +$200 | 264% |
| Month 2 | 18 | 1.8% | $60 | +$800 | 1233% |
| Month 3+ | 20+ | 2.0%+ | $60 | +$1000+ | 1567%+ |

**Assumptions:**
- Average order value: $500
- Inquiry-to-order conversion rate: 30%
- Additional inquiries generate incremental revenue

**ROI Calculation:**

```
Net Benefit = (Additional Orders × Avg Order Value) - LLM Cost
ROI = (Net Benefit / LLM Cost) × 100%

Example (Month 3):
Additional Orders = (20 - 10) × 30% = 3 orders
Revenue = 3 × $500 = $1,500
Net Benefit = $1,500 - $60 = $1,440
ROI = ($1,440 / $60) × 100% = 2,400%
```

---

## Implementation Roadmap

### Phase 1: MVP Development (Week 1-2)

**Goal:** Launch a functional AI advisor with core features

**Tasks:**

1. **Database Setup (Day 1-2)**
   - Create all database tables
   - Set up encryption functions
   - Create initial indexes
   - Test data retention policies

2. **Backend API Development (Day 3-6)**
   - Implement AI conversation API
   - Integrate Manus LLM service
   - Create product recommendation logic
   - Implement basic caching (keyword-based)
   - Set up concurrency control
   - Create inquiry submission API

3. **Frontend Development (Day 7-10)**
   - Build AI chat widget component
   - Create consent dialog
   - Implement message display and input
   - Add feedback buttons (like/dislike)
   - Integrate with backend API
   - Test on all pages

4. **Testing & Bug Fixes (Day 11-12)**
   - Test AI responses for accuracy
   - Test consent flow
   - Test inquiry submission
   - Fix critical bugs
   - Performance testing

5. **Deployment (Day 13-14)**
   - Deploy to production
   - Monitor for issues
   - Collect initial user feedback

**Deliverables:**
- ✅ Functional AI chat widget on all pages
- ✅ Basic product recommendations
- ✅ Consent system (Standard/Privacy modes)
- ✅ Inquiry submission
- ✅ Email notifications to Oscar

**Success Criteria:**
- AI responds to user questions within 5 seconds
- No critical bugs in production
- At least 10 users try the AI advisor
- At least 1 inquiry submitted through AI

---

### Phase 2: Optimization & Enhancement (Week 3-4)

**Goal:** Improve performance, add analytics, enhance user experience

**Tasks:**

1. **Caching Enhancement (Day 15-16)**
   - Implement intelligent cache storage
   - Pre-populate cache with common questions
   - Test cache hit rate
   - Optimize cache expiration

2. **Admin Dashboard (Day 17-19)**
   - Create dashboard layout
   - Implement KPI display
   - Add inquiry management interface
   - Build customer management interface
   - Create AI assistant for owner

3. **Analytics Implementation (Day 20-21)**
   - Set up daily statistics collection
   - Create data visualization components
   - Implement issue detection
   - Test monthly report generation

4. **User Experience Improvements (Day 22-23)**
   - Add loading states and animations
   - Improve mobile responsiveness
   - Optimize chat widget positioning
   - Add conversation history view (for authenticated users)

5. **Testing & Optimization (Day 24-25)**
   - Load testing with concurrent users
   - Optimize database queries
   - Review and improve AI prompts
   - Test all admin features

6. **Documentation (Day 26-28)**
   - Create user guide for customers
   - Create admin guide for Oscar
   - Document API endpoints
   - Write troubleshooting guide

**Deliverables:**
- ✅ Admin dashboard with analytics
- ✅ Improved caching (40%+ hit rate)
- ✅ AI assistant for owner
- ✅ Complete documentation

**Success Criteria:**
- Cache hit rate >35%
- Admin dashboard loads in <2 seconds
- All KPIs tracked accurately
- Oscar can manage inquiries efficiently

---

### Phase 3: Continuous Improvement (Ongoing)

**Goal:** Maintain and optimize based on real-world usage

**Monthly Tasks:**

1. **Performance Review (1st of each month)**
   - Review monthly report
   - Analyze KPI trends
   - Identify optimization opportunities

2. **Knowledge Base Updates (As needed)**
   - Add new product information
   - Update technical documentation
   - Refresh cache with improved answers

3. **Prompt Optimization (As needed)**
   - Adjust system prompts based on user feedback
   - Test different response formats
   - A/B test recommendation strategies

4. **Bug Fixes & Maintenance (Ongoing)**
   - Monitor error logs
   - Fix reported issues
   - Update dependencies

**Quarterly Tasks:**

1. **Major Feature Additions**
   - Evaluate new AI capabilities (e.g., image understanding)
   - Consider integration with additional data sources
   - Explore advanced analytics features

2. **Performance Optimization**
   - Database optimization and cleanup
   - Code refactoring for better maintainability
   - Infrastructure scaling if needed

3. **User Research**
   - Collect qualitative feedback from users
   - Conduct user interviews (if possible)
   - Analyze user behavior patterns

---

### Technical Implementation Details

#### Backend API Structure

**tRPC Router Organization:**

```typescript
// server/routers.ts
export const appRouter = router({
  // Existing routers
  auth: authRouter,
  system: systemRouter,
  
  // New AI advisor routers
  ai: router({
    // AI conversation
    chat: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        conversationId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await handleAIChat(ctx.user, input.message, input.conversationId);
      }),
    
    // User feedback
    feedback: publicProcedure
      .input(z.object({
        messageId: z.number(),
        feedback: z.enum(['like', 'dislike']),
      }))
      .mutation(async ({ input }) => {
        return await saveFeedback(input.messageId, input.feedback);
      }),
    
    // Conversation history
    history: protectedProcedure
      .query(async ({ ctx }) => {
        return await getConversationHistory(ctx.user.id);
      }),
    
    // Delete conversation
    deleteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await deleteConversation(input.conversationId, ctx.user.id);
      }),
  }),
  
  // Admin analytics
  admin: router({
    analytics: router({
      dashboard: adminProcedure
        .query(async () => {
          return await getDashboardData();
        }),
      
      monthlyReport: adminProcedure
        .input(z.object({ year: z.number(), month: z.number() }))
        .query(async ({ input }) => {
          return await getMonthlyReport(input.year, input.month);
        }),
    }),
    
    inquiries: inquiryRouter, // Existing inquiry management
    customers: customerRouter, // Existing customer management
    
    // AI assistant for owner
    aiAssistant: adminProcedure
      .input(z.object({ question: z.string() }))
      .mutation(async ({ input }) => {
        return await getAIAssistance(input.question);
      }),
  }),
});
```

#### Frontend Component Structure

```
client/src/
├── components/
│   ├── ai/
│   │   ├── AIChatWidget.tsx          # Main chat widget
│   │   ├── ConsentDialog.tsx         # Privacy consent dialog
│   │   ├── MessageList.tsx           # Conversation display
│   │   ├── MessageInput.tsx          # User input field
│   │   ├── ProductRecommendation.tsx # Product card in chat
│   │   └── FeedbackButtons.tsx       # Like/dislike buttons
│   ├── admin/
│   │   ├── Dashboard.tsx             # Admin dashboard
│   │   ├── AnalyticsCharts.tsx       # KPI visualizations
│   │   ├── InquiryList.tsx           # Inquiry management
│   │   ├── CustomerList.tsx          # Customer management
│   │   └── AIAssistant.tsx           # AI helper for owner
│   └── ui/                           # shadcn/ui components
├── pages/
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── ProductDetail.tsx
│   ├── Account.tsx                   # User account settings
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── Inquiries.tsx
│       └── Customers.tsx
└── lib/
    ├── trpc.ts                       # tRPC client
    └── ai-utils.ts                   # AI-related utilities
```

#### Key Implementation Files

**AI Chat Handler (Backend):**

```typescript
// server/ai/chat-handler.ts
import { invokeLLM } from '../_core/llm';
import { checkCache, saveToCache } from './cache';
import { saveConversation, encryptMessage } from './storage';

export async function handleAIChat(
  user: User | undefined,
  message: string,
  conversationId?: string
) {
  // 1. Validate input
  validateUserMessage(message);
  
  // 2. Check cache
  const cachedAnswer = await checkCache(message);
  if (cachedAnswer) {
    return {
      answer: cachedAnswer,
      source: 'cache',
      conversationId,
    };
  }
  
  // 3. Get conversation history (if authenticated)
  let conversationHistory = [];
  if (user && conversationId) {
    conversationHistory = await getConversationHistory(
      user.id,
      conversationId
    );
  }
  
  // 4. Build prompt
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: message },
  ];
  
  // 5. Call LLM
  const response = await invokeLLM({
    messages,
    max_tokens: 800,
    temperature: 0.3,
  });
  
  const answer = response.choices[0].message.content;
  
  // 6. Save conversation (if Standard Mode)
  if (user && user.consentMode === 'standard') {
    await saveConversation(user.id, conversationId, message, answer);
  }
  
  // 7. Update cache (if generic question)
  if (!isPersonalizedQuery(message)) {
    await saveToCache(message, answer);
  }
  
  // 8. Track cost
  await trackLLMCost(response.usage.total_tokens);
  
  return {
    answer,
    source: 'llm',
    conversationId: conversationId || generateConversationId(),
  };
}
```

**AI Chat Widget (Frontend):**

```typescript
// client/src/components/ai/AIChatWidget.tsx
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import ConsentDialog from './ConsentDialog';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState<string>();
  
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        source: data.source,
      }]);
      setConversationId(data.conversationId);
    },
  });
  
  useEffect(() => {
    // Check if user has seen consent dialog
    const hasConsented = localStorage.getItem('ai_consent');
    if (!hasConsented && isOpen) {
      setShowConsent(true);
    }
  }, [isOpen]);
  
  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
    }]);
    
    chatMutation.mutate({
      message,
      conversationId,
    });
  };
  
  const handleConsent = (mode: 'standard' | 'privacy') => {
    localStorage.setItem('ai_consent', mode);
    setShowConsent(false);
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 
                   rounded-full shadow-lg hover:bg-blue-700 
                   flex items-center justify-center text-white"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] 
                    bg-white rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg 
                      flex justify-between items-center">
        <h3 className="font-semibold">AI Product Advisor</h3>
        <button onClick={() => setIsOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Consent Dialog */}
      {showConsent && (
        <ConsentDialog onConsent={handleConsent} />
      )}
      
      {/* Messages */}
      <MessageList messages={messages} />
      
      {/* Input */}
      <MessageInput 
        onSend={handleSendMessage}
        disabled={chatMutation.isLoading}
      />
      
      {/* Footer */}
      <div className="p-2 text-xs text-gray-500 text-center border-t">
        📌 Suggestions are for reference only
      </div>
    </div>
  );
}
```

---

## Risk Assessment & Mitigation

### Technical Risks

**Risk 1: LLM Response Quality**

- **Description:** AI provides inaccurate or irrelevant product recommendations
- **Impact:** High (loss of user trust, negative brand perception)
- **Probability:** Medium
- **Mitigation:**
  - Comprehensive system prompt with clear guidelines
  - Product database with accurate specifications
  - User feedback mechanism to identify poor responses
  - Monthly review and prompt optimization
  - Disclaimer on every response

**Risk 2: Cost Overrun**

- **Description:** LLM API costs exceed budget due to high usage or abuse
- **Impact:** Medium (financial impact)
- **Probability:** Low
- **Mitigation:**
  - Intelligent caching (40% cost reduction)
  - Concurrency limits (max 5 simultaneous)
  - Rate limiting per user (30 requests per 15 minutes)
  - Daily and monthly cost alerts
  - Response length limits (max_tokens=800)

**Risk 3: System Downtime**

- **Description:** AI advisor becomes unavailable due to technical issues
- **Impact:** Medium (temporary loss of functionality)
- **Probability:** Low
- **Mitigation:**
  - Graceful degradation (show contact info if AI fails)
  - Error handling and retry logic
  - Monitoring and alerting
  - Manus platform reliability (99.9% uptime)

### Business Risks

**Risk 4: Low User Adoption**

- **Description:** Users don't engage with AI advisor
- **Impact:** High (project fails to achieve ROI)
- **Probability:** Medium
- **Mitigation:**
  - Prominent placement of chat widget
  - Proactive greeting message
  - Clear value proposition
  - Mobile-friendly design
  - Multilingual support (8 languages)

**Risk 5: Inquiry Quality Decline**

- **Description:** AI generates more inquiries but lower quality (less likely to convert)
- **Impact:** Medium (wasted time on unqualified leads)
- **Probability:** Low
- **Mitigation:**
  - AI asks qualifying questions before recommending products
  - Require authentication for inquiry submission
  - Track inquiry-to-order conversion rate
  - Adjust AI strategy based on conversion data

### Legal & Compliance Risks

**Risk 6: Data Privacy Violation**

- **Description:** Failure to comply with GDPR or other privacy regulations
- **Impact:** High (legal liability, fines)
- **Probability:** Low
- **Mitigation:**
  - Explicit consent mechanism
  - Privacy Mode option (zero data retention)
  - AES-256 encryption for stored data
  - Automatic data expiration (120 days)
  - Self-service deletion
  - Clear privacy policy

**Risk 7: Liability for AI Recommendations**

- **Description:** Customer blames ROWELL for poor results based on AI advice
- **Impact:** Medium (reputation damage, potential legal claims)
- **Probability:** Low
- **Mitigation:**
  - Clear disclaimers on every response
  - Terms of service acknowledgment
  - Position as "advisor" not "authority"
  - Log all conversations for audit trail
  - Professional liability insurance (recommended)

---

## Success Criteria & Go-Live Checklist

### MVP Success Criteria

Before launching Phase 1 (MVP), the following criteria must be met:

**Functional Requirements:**
- ✅ AI chat widget appears on all pages
- ✅ Consent dialog displays correctly for first-time users
- ✅ AI responds to user questions within 5 seconds
- ✅ Product recommendations include part numbers and links
- ✅ Users can submit inquiries with AI conversation context
- ✅ Email notifications sent to Oscar for new inquiries
- ✅ Disclaimers appear on every AI response
- ✅ Feedback buttons (like/dislike) work correctly

**Technical Requirements:**
- ✅ Database tables created and indexed
- ✅ Encryption working for conversation data
- ✅ Concurrency control prevents cost spikes
- ✅ Rate limiting prevents abuse
- ✅ Error handling provides graceful degradation
- ✅ Mobile responsive design

**Security Requirements:**
- ✅ HTTPS enforced on all pages
- ✅ Input validation prevents injection attacks
- ✅ Authentication required for inquiry submission
- ✅ Admin dashboard requires admin role

**Testing Requirements:**
- ✅ All API endpoints tested
- ✅ Frontend components tested on Chrome, Safari, Firefox
- ✅ Mobile testing on iOS and Android
- ✅ Load testing with 10 concurrent users
- ✅ No critical bugs in production

### Phase 2 Success Criteria

Before considering Phase 2 complete:

**Functional Requirements:**
- ✅ Admin dashboard displays all KPIs accurately
- ✅ Inquiry management interface fully functional
- ✅ AI assistant for owner provides helpful responses
- ✅ Cache hit rate >35%
- ✅ Monthly report generation works correctly

**Performance Requirements:**
- ✅ Dashboard loads in <2 seconds
- ✅ Cache hits respond in <0.5 seconds
- ✅ Database queries optimized with proper indexes
- ✅ No performance degradation under normal load

**Documentation Requirements:**
- ✅ User guide published
- ✅ Admin guide published
- ✅ API documentation complete
- ✅ Troubleshooting guide available

### Long-Term Success Criteria (3 months)

**Business Metrics:**
- ✅ Monthly inquiries ≥ 20 (100% increase from baseline)
- ✅ AI-to-inquiry conversion rate ≥ 4%
- ✅ User satisfaction rate ≥ 70%

**Operational Metrics:**
- ✅ LLM cost <$60/month
- ✅ Cache hit rate ≥ 40%
- ✅ Average response time <5 seconds

**Quality Metrics:**
- ✅ <5% of questions have low satisfaction (<50% likes)
- ✅ <10% transfer-to-human rate for technical questions
- ✅ No critical bugs reported in 30 days

---

## Appendices

### Appendix A: Sample AI Conversations

**Example 1: Peptide Separation**

```
User: I need to separate peptides by HPLC. What column should I use?

AI: For peptide separation, I recommend wide-pore C18 columns (300Å) 
that accommodate larger molecules. Here are three excellent options:

1. **Agilent ZORBAX 300SB-C18** (Part: 883975-902)
   - 4.6 x 150mm, 5μm, 300Å pore size
   - Excellent peak shape for peptides
   - pH range 2-8, stable and reproducible
   [View Product] [Add to Inquiry Cart]

2. **Waters XBridge BEH300 C18** (Part: 186003687)
   - 4.6 x 150mm, 3.5μm, 300Å pore size
   - Ethylene bridged hybrid technology for durability
   - Wide pH range 1-12
   [View Product] [Add to Inquiry Cart]

3. **Avantor ACE C18-300** (Part: ACE-121-1546)
   - 4.6 x 150mm, 5μm, 300Å pore size
   - Cost-effective option with good performance
   - pH range 2-8
   [View Product] [Add to Inquiry Cart]

💡 Need a quote or have questions?
📧 oscar@rowellhplc.com
💬 WhatsApp/WeChat: +86 180 1705 0064

📌 This suggestion is for reference only. Please consult 
professionals for final decisions.

User: What mobile phase should I use?

AI: For peptide separation on C18 columns, I recommend:

**Mobile Phase A (Aqueous):**
- 0.1% TFA (trifluoroacetic acid) in water
- Or 0.1% formic acid in water (MS-compatible)

**Mobile Phase B (Organic):**
- Acetonitrile with 0.1% TFA
- Or acetonitrile with 0.1% formic acid

**Gradient:**
- Start: 5-10% B
- End: 50-80% B
- Time: 20-60 minutes (depending on complexity)
- Flow rate: 1.0 mL/min

**Tips:**
- TFA provides better peak shape but suppresses MS signal
- Formic acid is better for LC-MS applications
- Keep temperature at 30-40°C for better reproducibility

Would you like help selecting a specific gradient for your peptides?

💡 Need a quote or have questions?
📧 oscar@rowellhplc.com
💬 WhatsApp/WeChat: +86 180 1705 0064

📌 This suggestion is for reference only. Please consult 
professionals for final decisions.
```

**Example 2: Pricing Inquiry**

```
User: How much for 10 Agilent ZORBAX columns?

AI: For pricing and bulk orders, please contact Oscar directly:

📧 Email: oscar@rowellhplc.com
💬 WhatsApp: +86 180 1705 0064
💬 WeChat: +86 180 1705 0064

Oscar will provide you with:
• Competitive pricing
• Volume discounts
• Shipping options
• Delivery time estimate

Usually respond within 24 hours!
```

**Example 3: Troubleshooting**

```
User: I'm seeing peak tailing with my C18 column. What should I do?

AI: Peak tailing on C18 columns can have several causes. Let's 
troubleshoot systematically:

**Common Causes & Solutions:**

1. **pH Issues**
   - Problem: Mobile phase pH too high or too low
   - Solution: Adjust pH to 2.5-3.5 for optimal performance
   - Add 0.1% TFA or formic acid to buffer

2. **Column Contamination**
   - Problem: Buildup of strongly retained compounds
   - Solution: Flush column with 100% acetonitrile or methanol
   - Run blank gradient to clean

3. **Sample Overload**
   - Problem: Too much sample injected
   - Solution: Reduce injection volume or dilute sample
   - Typical: 10-20 μL of 0.1-1 mg/mL

4. **Column Aging**
   - Problem: Stationary phase degradation
   - Solution: Replace column if >1000 injections
   - Use guard column to extend life

5. **Mobile Phase Issues**
   - Problem: Insufficient acid modifier
   - Solution: Increase TFA to 0.1-0.2%
   - Ensure fresh mobile phase (<1 week old)

**Quick Test:**
Run a standard (like caffeine or uracil) to confirm if it's 
column-related or sample-related.

Would you like specific recommendations for your application?

💡 Need technical support?
📧 oscar@rowellhplc.com
💬 WhatsApp/WeChat: +86 180 1705 0064

📌 This suggestion is for reference only. Please consult 
professionals for final decisions.
```

### Appendix B: Database Schema Diagram

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ openId              │
│ name                │
│ email               │
│ company             │
│ consentMode         │
│ consentTimestamp    │
│ ...                 │
└─────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────┐
│ ai_conversations    │
├─────────────────────┤
│ id (PK)             │
│ userId (FK)         │
│ sessionId           │
│ consentMode         │
│ createdAt           │
│ expiresAt           │
│ isDeleted           │
└─────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────┐
│   ai_messages       │
├─────────────────────┤
│ id (PK)             │
│ conversationId (FK) │
│ role                │
│ content             │
│ contentEncrypted    │
│ feedback            │
│ createdAt           │
└─────────────────────┘

┌─────────────────────┐
│    ai_cache         │
├─────────────────────┤
│ id (PK)             │
│ questionHash        │
│ questionKeywords    │
│ answer              │
│ hitCount            │
│ likeCount           │
│ dislikeCount        │
│ expiresAt           │
└─────────────────────┘

┌─────────────────────┐
│    inquiries        │
├─────────────────────┤
│ id (PK)             │
│ userId (FK)         │
│ conversationId (FK) │
│ status              │
│ urgency             │
│ adminNotes          │
│ createdAt           │
└─────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────┐
│  inquiry_items      │
├─────────────────────┤
│ id (PK)             │
│ inquiryId (FK)      │
│ productId (FK)      │
│ quantity            │
│ quotedPrice         │
└─────────────────────┘

┌─────────────────────┐
│ ai_conversation_    │
│      stats          │
├─────────────────────┤
│ id (PK)             │
│ statDate            │
│ totalConversations  │
│ satisfactionRate    │
│ llmCost             │
│ ...                 │
└─────────────────────┘

┌─────────────────────┐
│ conversion_funnel   │
├─────────────────────┤
│ id (PK)             │
│ statDate            │
│ websiteVisits       │
│ aiConversations     │
│ inquiriesSubmitted  │
│ ...                 │
└─────────────────────┘
```

### Appendix C: Environment Variables

Required environment variables for the AI advisor system:

```bash
# Manus Platform (Auto-injected)
DATABASE_URL=mysql://...
JWT_SECRET=...
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
OWNER_OPEN_ID=...
OWNER_NAME=...

# SendGrid Email
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@rowellhplc.com

# AI Advisor Configuration
AI_MAX_CONCURRENT=5
AI_QUEUE_TIMEOUT=30000
AI_CACHE_TTL_DAYS=30
AI_CONVERSATION_RETENTION_DAYS=120
AI_COST_ALERT_DAILY=5.0
AI_COST_ALERT_MONTHLY=150.0

# Contact Information
CONTACT_EMAIL=oscar@rowellhplc.com
CONTACT_WHATSAPP=+8618017050064
CONTACT_WECHAT=+8618017050064
```

### Appendix D: Glossary

**AI Advisor:** The intelligent chatbot system that provides product recommendations and technical consultation to website visitors.

**Cache Hit Rate:** The percentage of AI requests that are served from cache instead of calling the LLM API, reducing cost and improving response time.

**Consent Mode:** User preference for data storage, either Standard Mode (data saved for 120 days) or Privacy Mode (no data saved).

**Conversion Rate:** The percentage of AI conversations that result in inquiry submissions, measuring the effectiveness of the AI advisor.

**LLM (Large Language Model):** The AI model (GPT-3.5) that powers the conversational capabilities of the AI advisor.

**ROI (Return on Investment):** The financial benefit gained from the AI advisor relative to its operational cost, calculated as (Net Benefit / Cost) × 100%.

**System Prompt:** The instructions given to the LLM that define its personality, knowledge scope, and response format.

**tRPC:** TypeScript Remote Procedure Call, a framework for building type-safe APIs between frontend and backend.

**Vector Search:** A technique for finding similar text by comparing numerical representations (embeddings) of questions, used for intelligent caching.

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-02 | Manus AI | Initial comprehensive specification based on 10 core issue discussions |

---

## Approval & Sign-off

**Project Owner:** Oscar (oscar@rowellhplc.com)  
**Technical Lead:** Manus AI  
**Status:** Ready for Implementation  
**Next Steps:** Begin Phase 1 (MVP Development)

---

*This document represents the complete specification for the ROWELL AI Product Advisor system. All design decisions are based on extensive discussion of business requirements, technical constraints, and strategic objectives. Implementation should follow the phased roadmap outlined in this document.*
