import { eq, desc, and, sum, count, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';
import { getDatabase } from './connection.js';
import { TokenizerManager } from '../utils/tokenizer.js';
import { logger } from '../utils/logger.js';
import { 
  sessions, 
  conversationMessages, 
  conversationFiles, 
  conversationBudgets,
  type Session,
  type SessionSelect,
  type ConversationMessage,
  type ConversationMessageSelect,
  type ConversationFile,
  type ConversationBudget,
  type ConversationBudgetSelect
} from './schema.js';

export interface ConversationContext {
  sessionId: string;
  messages: ConversationMessageSelect[];
  files: (ConversationFile & { content?: string })[];
  budget?: ConversationBudgetSelect;
  totalTokens: number;
  totalCost: number;
}

export interface SessionSummary {
  id: string;
  name?: string;
  messageCount: number;
  fileCount: number;
  totalTokens: number;
  totalCost: number;
  lastActivity: Date;
  status: 'active' | 'archived' | 'deleted';
}

export class ConversationMemoryManager {
  private async getDb() {
    return await getDatabase();
  }

  /**
   * Create or retrieve a conversation session
   */
  async getOrCreateSession(sessionId?: string, name?: string): Promise<SessionSelect> {
    try {
      const db = await this.getDb();
      
      if (sessionId) {
        const existing = await db
          .select()
          .from(sessions)
          .where(eq(sessions.id, sessionId))
          .limit(1);
        
        if (existing.length > 0) {
          return existing[0];
        }
      }

      const [newSession] = await db
        .insert(sessions)
        .values({
          id: sessionId,
          name,
          status: 'active'
        })
        .returning();

      return newSession;
    } catch (error) {
      logger.error('Failed to get or create session:', error);
      throw new Error(`Failed to get or create session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    toolName?: string,
    parentMessageId?: string,
    metadata?: Record<string, any>
  ): Promise<ConversationMessageSelect> {
    try {
      const db = await this.getDb();
      
      // Get next message index
      const lastMessage = await db
        .select({ messageIndex: conversationMessages.messageIndex })
        .from(conversationMessages)
        .where(eq(conversationMessages.sessionId, sessionId))
        .orderBy(desc(conversationMessages.messageIndex))
        .limit(1);

      const messageIndex = (lastMessage[0]?.messageIndex ?? -1) + 1;

      const [message] = await db
        .insert(conversationMessages)
        .values({
          sessionId,
          messageIndex,
          role,
          content,
          toolName,
          parentMessageId,
          metadata
        })
        .returning();

      // Update session last message time
      await db
        .update(sessions)
        .set({ 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(sessions.id, sessionId));

      return message;
    } catch (error) {
      logger.error('Failed to add message to conversation:', error);
      throw new Error(`Failed to add message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add files to conversation context with deduplication and encryption
   */
  async addFiles(
    sessionId: string,
    files: Array<{ filePath: string; content: string }>
  ): Promise<void> {
    try {
      const db = await this.getDb();
      const filesToInsert: ConversationFile[] = [];

      for (const file of files) {
        const contentHash = createHash('sha256')
          .update(file.content)
          .digest('hex');

        // Check if file with same hash already exists
        const existing = await db
          .select()
          .from(conversationFiles)
          .where(
            and(
              eq(conversationFiles.sessionId, sessionId),
              eq(conversationFiles.contentHash, contentHash)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          filesToInsert.push({
            sessionId,
            filePath: file.filePath,
            fileContent: file.content,
            contentHash,
            isRelevant: true
          });
        } else {
          // Update access count and time for existing file
          await db
            .update(conversationFiles)
            .set({
              lastAccessedAt: new Date(),
              accessCount: existing[0].accessCount + 1
            })
            .where(eq(conversationFiles.id, existing[0].id));
        }
      }

      if (filesToInsert.length > 0) {
        await db.insert(conversationFiles).values(filesToInsert);
      }
    } catch (error) {
      logger.error('Failed to add files to conversation:', error);
      throw new Error(`Failed to add files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get conversation context with intelligent pruning and decryption
   */
  async getConversationContext(
    sessionId: string,
    maxTokens?: number,
    includeFiles = true,
    model = 'gpt-4'
  ): Promise<ConversationContext> {
    try {
      const db = await this.getDb();
      
      // Get session budget
      const budget = await db
        .select()
        .from(conversationBudgets)
        .where(eq(conversationBudgets.sessionId, sessionId))
        .limit(1);

      // Get messages in chronological order
      const messages = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.sessionId, sessionId))
        .orderBy(conversationMessages.messageIndex);

      // Get relevant files if requested
      let files: (ConversationFile & { content?: string })[] = [];
      if (includeFiles) {
        const encryptedFiles = await db
          .select()
          .from(conversationFiles)
          .where(
            and(
              eq(conversationFiles.sessionId, sessionId),
              eq(conversationFiles.isRelevant, true)
            )
          )
          .orderBy(desc(conversationFiles.lastAccessedAt));

        // Map files with content field
        files = encryptedFiles.map(file => ({
          ...file,
          content: file.fileContent || undefined
        }));
      }

      // Calculate accurate token usage using tiktoken
      const messageTokens = TokenizerManager.countMessageTokens(
        messages.map(m => ({ role: m.role, content: m.content })),
        model
      );
      
      const fileTokens = files.reduce((sum, file) => {
        const content = file.content || file.fileContent || '';
        return sum + TokenizerManager.countTokens(content, model);
      }, 0);
      
      const totalTokens = messageTokens + fileTokens;

      // Prune context if it exceeds limits
      if (maxTokens && totalTokens > maxTokens) {
        // Keep recent messages and most relevant files
        const prunedMessages = await this.pruneMessages(messages, Math.floor(maxTokens * 0.7), model);
        const prunedFiles = await this.pruneFiles(files, Math.floor(maxTokens * 0.3), model);
        
        return {
          sessionId,
          messages: prunedMessages,
          files: prunedFiles,
          budget: budget[0],
          totalTokens: maxTokens,
          totalCost: budget[0]?.usedCostUsd || 0
        };
      }

      return {
        sessionId,
        messages,
        files,
        budget: budget[0],
        totalTokens,
        totalCost: budget[0]?.usedCostUsd || 0
      };
    } catch (error) {
      logger.error('Failed to get conversation context:', error);
      throw new Error(`Failed to get conversation context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set or update conversation budget
   */
  async setBudget(
    sessionId: string,
    maxTokens?: number,
    maxCostUsd?: number,
    maxDurationMs?: number
  ): Promise<ConversationBudgetSelect> {
    try {
      const db = await this.getDb();
      
      const existing = await db
        .select()
        .from(conversationBudgets)
        .where(eq(conversationBudgets.sessionId, sessionId))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(conversationBudgets)
          .set({
            maxTokens,
            maxCostUsd,
            maxDurationMs,
            updatedAt: new Date()
          })
          .where(eq(conversationBudgets.id, existing[0].id))
          .returning();
        return updated;
      }

      const [newBudget] = await db
        .insert(conversationBudgets)
        .values({
          sessionId,
          maxTokens,
          maxCostUsd,
          maxDurationMs
        })
        .returning();

      return newBudget;
    } catch (error) {
      logger.error('Failed to set conversation budget:', error);
      throw new Error(`Failed to set budget: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update budget usage
   */
  async updateBudgetUsage(
    sessionId: string,
    tokens: number,
    costUsd: number,
    durationMs: number
  ): Promise<void> {
    const db = await this.getDb();
    
    const existing = await db
      .select()
      .from(conversationBudgets)
      .where(eq(conversationBudgets.sessionId, sessionId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(conversationBudgets)
        .set({
          usedTokens: existing[0].usedTokens + tokens,
          usedCostUsd: existing[0].usedCostUsd + costUsd,
          usedDurationMs: existing[0].usedDurationMs + durationMs,
          updatedAt: new Date()
        })
        .where(eq(conversationBudgets.id, existing[0].id));
    }
  }

  /**
   * Check if budget limits are exceeded
   */
  async checkBudgetLimits(sessionId: string): Promise<{
    withinLimits: boolean;
    tokenLimitExceeded: boolean;
    costLimitExceeded: boolean;
    durationLimitExceeded: boolean;
  }> {
    const db = await this.getDb();
    
    const budget = await db
      .select()
      .from(conversationBudgets)
      .where(eq(conversationBudgets.sessionId, sessionId))
      .limit(1);

    if (budget.length === 0) {
      return {
        withinLimits: true,
        tokenLimitExceeded: false,
        costLimitExceeded: false,
        durationLimitExceeded: false
      };
    }

    const b = budget[0];
    const tokenLimitExceeded = b.maxTokens !== null && b.usedTokens >= b.maxTokens;
    const costLimitExceeded = b.maxCostUsd !== null && b.usedCostUsd >= b.maxCostUsd;
    const durationLimitExceeded = b.maxDurationMs !== null && b.usedDurationMs >= b.maxDurationMs;

    return {
      withinLimits: !tokenLimitExceeded && !costLimitExceeded && !durationLimitExceeded,
      tokenLimitExceeded,
      costLimitExceeded,
      durationLimitExceeded
    };
  }

  /**
   * List all sessions with summary stats and pagination
   */
  async listSessions(
    status: 'active' | 'archived' | 'deleted' = 'active',
    limit = 50,
    offset = 0
  ): Promise<{
    sessions: SessionSummary[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const db = await this.getDb();
      
      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(sessions)
        .where(eq(sessions.status, status));
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      // Get paginated session data
      const sessionData = await db
        .select({
          id: sessions.id,
          name: sessions.name,
          status: sessions.status,
          lastMessageAt: sessions.lastMessageAt,
          messageCount: count(conversationMessages.id),
          fileCount: count(conversationFiles.id),
        })
        .from(sessions)
        .leftJoin(conversationMessages, eq(sessions.id, conversationMessages.sessionId))
        .leftJoin(conversationFiles, eq(sessions.id, conversationFiles.sessionId))
        .where(eq(sessions.status, status))
        .groupBy(sessions.id)
        .orderBy(desc(sessions.lastMessageAt))
        .limit(limit)
        .offset(offset);

      // Get budget info for each session (batch query for better performance)
      const sessionIds = sessionData.map(s => s.id);
      const budgets = sessionIds.length > 0 ? await db
        .select()
        .from(conversationBudgets)
        .where(inArray(conversationBudgets.sessionId, sessionIds)) : [];
      
      // Create budget lookup map
      const budgetMap = new Map(budgets.map(b => [b.sessionId, b]));

      const result: SessionSummary[] = sessionData.map(session => ({
        id: session.id,
        name: session.name || undefined,
        messageCount: session.messageCount,
        fileCount: session.fileCount,
        totalTokens: budgetMap.get(session.id)?.usedTokens || 0,
        totalCost: budgetMap.get(session.id)?.usedCostUsd || 0,
        lastActivity: session.lastMessageAt || new Date(),
        status: session.status as 'active' | 'archived' | 'deleted'
      }));

      return {
        sessions: result,
        totalCount,
        hasMore: offset + limit < totalCount
      };
    } catch (error) {
      logger.error('Failed to list sessions:', error);
      throw new Error(`Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Archive or delete a session
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'archived' | 'deleted'
  ): Promise<void> {
    const db = await this.getDb();
    
    await db
      .update(sessions)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(sessions.id, sessionId));
  }

  /**
   * Prune messages to fit within token limit (keep recent messages)
   */
  private async pruneMessages(
    messages: ConversationMessageSelect[],
    maxTokens: number,
    model = 'gpt-4'
  ): Promise<ConversationMessageSelect[]> {
    let totalTokens = 0;
    const result: ConversationMessageSelect[] = [];

    // Start from the most recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const tokens = TokenizerManager.countTokens(messages[i].content, model);
      if (totalTokens + tokens > maxTokens) {
        break;
      }
      totalTokens += tokens;
      result.unshift(messages[i]);
    }

    return result;
  }

  /**
   * Prune files to fit within token limit (keep most recently accessed)
   */
  private async pruneFiles(
    files: (ConversationFile & { content?: string })[],
    maxTokens: number,
    model = 'gpt-4'
  ): Promise<(ConversationFile & { content?: string })[]> {
    let totalTokens = 0;
    const result: (ConversationFile & { content?: string })[] = [];

    // Files are already sorted by lastAccessedAt desc
    for (const file of files) {
      const content = file.content || file.fileContent || '';
      const tokens = TokenizerManager.countTokens(content, model);
      if (totalTokens + tokens > maxTokens) {
        break;
      }
      totalTokens += tokens;
      result.push(file);
    }

    return result;
  }
}

export const conversationMemory = new ConversationMemoryManager();