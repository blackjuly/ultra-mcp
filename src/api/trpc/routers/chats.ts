import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getDatabase } from '../../../db/connection';
import { llmRequests } from '../../../db/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

export const chatsRouter = router({
  // Get list of chats with pagination and filtering
  list: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        toolName: z.string().optional(),
        status: z.enum(['success', 'error', 'all']).default('all'),
        searchQuery: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['timestamp', 'cost', 'tokens', 'duration']).default('timestamp'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const conditions = [];

      // Date range filter
      if (input.startDate) {
        conditions.push(gte(llmRequests.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(llmRequests.timestamp, new Date(input.endDate)));
      }

      // Provider filter
      if (input.provider) {
        conditions.push(eq(llmRequests.provider, input.provider as any));
      }

      // Model filter
      if (input.model) {
        conditions.push(eq(llmRequests.model, input.model));
      }

      // Tool name filter
      if (input.toolName) {
        conditions.push(eq(llmRequests.toolName, input.toolName));
      }

      // Status filter
      if (input.status !== 'all') {
        conditions.push(eq(llmRequests.status, input.status));
      }

      // Search in request/response data
      if (input.searchQuery) {
        conditions.push(
          sql`(
            json_extract(${llmRequests.requestData}, '$.prompt') LIKE ${`%${input.searchQuery}%`}
            OR json_extract(${llmRequests.responseData}, '$.content') LIKE ${`%${input.searchQuery}%`}
            OR ${llmRequests.model} LIKE ${`%${input.searchQuery}%`}
            OR ${llmRequests.toolName} LIKE ${`%${input.searchQuery}%`}
          )`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(llmRequests)
        .where(whereClause);

      // Get the actual data
      let orderBy;
      const orderDir = input.sortOrder === 'desc' ? desc : (col: any) => col;
      
      switch (input.sortBy) {
        case 'cost':
          orderBy = orderDir(llmRequests.estimatedCost);
          break;
        case 'tokens':
          orderBy = orderDir(llmRequests.totalTokens);
          break;
        case 'duration':
          orderBy = orderDir(llmRequests.durationMs);
          break;
        default:
          orderBy = orderDir(llmRequests.timestamp);
      }

      const data = await db
        .select({
          id: llmRequests.id,
          timestamp: llmRequests.timestamp,
          provider: llmRequests.provider,
          model: llmRequests.model,
          toolName: llmRequests.toolName,
          inputTokens: llmRequests.inputTokens,
          outputTokens: llmRequests.outputTokens,
          totalTokens: llmRequests.totalTokens,
          estimatedCost: llmRequests.estimatedCost,
          durationMs: llmRequests.durationMs,
          status: llmRequests.status,
          errorMessage: llmRequests.errorMessage,
          // Extract preview from request data
          preview: sql<string>`
            CASE 
              WHEN json_extract(${llmRequests.requestData}, '$.prompt') IS NOT NULL 
              THEN substr(json_extract(${llmRequests.requestData}, '$.prompt'), 1, 100)
              WHEN json_extract(${llmRequests.requestData}, '$.messages[0].content') IS NOT NULL
              THEN substr(json_extract(${llmRequests.requestData}, '$.messages[0].content'), 1, 100)
              ELSE 'No preview available'
            END
          `.as('preview'),
        })
        .from(llmRequests)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);

      return {
        data,
        pagination: {
          total: count,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < count,
        },
      };
    }),

  // Get detailed view of a single chat
  detail: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDatabase();
      const chat = await db
        .select()
        .from(llmRequests)
        .where(eq(llmRequests.id, input.id))
        .limit(1);

      if (!chat[0]) {
        throw new Error('Chat not found');
      }

      return chat[0];
    }),

  // Get aggregated stats for chats
  stats: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(llmRequests.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(llmRequests.timestamp, new Date(input.endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get stats by tool
      const toolStats = await db
        .select({
          toolName: llmRequests.toolName,
          count: sql<number>`count(*)`,
          totalCost: sql<number>`sum(${llmRequests.estimatedCost})`,
          totalTokens: sql<number>`sum(${llmRequests.totalTokens})`,
          avgDuration: sql<number>`avg(${llmRequests.durationMs})`,
        })
        .from(llmRequests)
        .where(whereClause)
        .groupBy(llmRequests.toolName);

      // Get stats by model
      const modelStats = await db
        .select({
          model: llmRequests.model,
          provider: llmRequests.provider,
          count: sql<number>`count(*)`,
          totalCost: sql<number>`sum(${llmRequests.estimatedCost})`,
          totalTokens: sql<number>`sum(${llmRequests.totalTokens})`,
          avgDuration: sql<number>`avg(${llmRequests.durationMs})`,
          successRate: sql<number>`
            CAST(SUM(CASE WHEN ${llmRequests.status} = 'success' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100
          `,
        })
        .from(llmRequests)
        .where(whereClause)
        .groupBy(llmRequests.model, llmRequests.provider);

      // Get time-based stats (hourly for last 24h, daily for older)
      const timeStats = await db
        .select({
          period: sql<string>`
            CASE 
              WHEN ${llmRequests.timestamp} > datetime('now', '-1 day')
              THEN strftime('%Y-%m-%d %H:00', ${llmRequests.timestamp})
              ELSE strftime('%Y-%m-%d', ${llmRequests.timestamp})
            END
          `,
          count: sql<number>`count(*)`,
          totalCost: sql<number>`sum(${llmRequests.estimatedCost})`,
          totalTokens: sql<number>`sum(${llmRequests.totalTokens})`,
        })
        .from(llmRequests)
        .where(whereClause)
        .groupBy(sql`period`)
        .orderBy(sql`period`);

      return {
        toolStats,
        modelStats,
        timeStats,
      };
    }),

  // Delete a chat record
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      await db.delete(llmRequests).where(eq(llmRequests.id, input.id));
      return { success: true };
    }),
});