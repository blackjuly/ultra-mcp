import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const llmRequests = sqliteTable('llm_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  provider: text('provider', { enum: ['openai', 'gemini', 'azure', 'grok', 'openai-compatible'] }).notNull(),
  model: text('model').notNull(),
  toolName: text('tool_name'), // MCP tool that triggered this request
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCost: real('estimated_cost'), // Cost in USD
  durationMs: integer('duration_ms'),
  status: text('status', { enum: ['success', 'error'] }).notNull(),
  errorMessage: text('error_message'),
  requestData: text('request_data', { mode: 'json' }), // Store prompt, params
  responseData: text('response_data', { mode: 'json' }), // Store response content
  finishReason: text('finish_reason'), // stop, length, content-filter, etc.
}, (table) => ({
  timestampIdx: index('llm_requests_timestamp_idx').on(table.timestamp),
  providerIdx: index('llm_requests_provider_idx').on(table.provider),
  statusIdx: index('llm_requests_status_idx').on(table.status),
}));

// Session persistence tables for conversation memory
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'), // Optional human-readable name
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  lastMessageAt: integer('last_message_at', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['active', 'archived', 'deleted'] }).default('active').notNull(),
  metadata: text('metadata', { mode: 'json' }), // Store session-level context
}, (table) => ({
  createdAtIdx: index('sessions_created_at_idx').on(table.createdAt),
  statusIdx: index('sessions_status_idx').on(table.status),
  lastMessageAtIdx: index('sessions_last_message_at_idx').on(table.lastMessageAt),
}));

export const conversationMessages = sqliteTable('conversation_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageIndex: integer('message_index').notNull(), // Order within conversation
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  role: text('role', { enum: ['user', 'assistant', 'system', 'tool'] }).notNull(),
  content: text('content').notNull(),
  toolName: text('tool_name'), // If this message was from/to a tool
  parentMessageId: text('parent_message_id'), // For threading/branching conversations
  metadata: text('metadata', { mode: 'json' }), // Store message-level context
}, (table) => ({
  sessionIdIdx: index('conversation_messages_session_id_idx').on(table.sessionId),
  timestampIdx: index('conversation_messages_timestamp_idx').on(table.timestamp),
  messageIndexIdx: index('conversation_messages_message_index_idx').on(table.sessionId, table.messageIndex),
  // Unique constraint to prevent duplicate message indices within a session
  sessionMessageIdx: uniqueIndex('conversation_messages_session_message_idx_unique').on(table.sessionId, table.messageIndex),
}));

export const conversationFiles = sqliteTable('conversation_files', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  fileContent: text('file_content'),
  contentHash: text('content_hash'), // For deduplication
  addedAt: integer('added_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  accessCount: integer('access_count').default(0).notNull(),
  isRelevant: integer('is_relevant', { mode: 'boolean' }).default(true), // For context pruning
}, (table) => ({
  sessionIdIdx: index('conversation_files_session_id_idx').on(table.sessionId),
  contentHashIdx: index('conversation_files_content_hash_idx').on(table.contentHash),
  relevanceIdx: index('conversation_files_relevance_idx').on(table.sessionId, table.isRelevant),
  // Unique constraint to prevent duplicate file hashes within a session
  sessionHashIdx: uniqueIndex('conversation_files_session_hash_unique').on(table.sessionId, table.contentHash),
}));

// Governance and budget tracking
export const conversationBudgets = sqliteTable('conversation_budgets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  maxTokens: integer('max_tokens'),
  maxCostUsd: real('max_cost_usd'),
  maxDurationMs: integer('max_duration_ms'),
  usedTokens: integer('used_tokens').default(0).notNull(),
  usedCostUsd: real('used_cost_usd').default(0).notNull(),
  usedDurationMs: integer('used_duration_ms').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
}, (table) => ({
  sessionIdIdx: index('conversation_budgets_session_id_idx').on(table.sessionId),
  // Unique constraint to ensure one budget per session
  sessionIdUnique: uniqueIndex('conversation_budgets_session_id_unique').on(table.sessionId),
}));

export type LlmRequest = typeof llmRequests.$inferInsert;
export type LlmRequestSelect = typeof llmRequests.$inferSelect;

export type Session = typeof sessions.$inferInsert;
export type SessionSelect = typeof sessions.$inferSelect;

export type ConversationMessage = typeof conversationMessages.$inferInsert;
export type ConversationMessageSelect = typeof conversationMessages.$inferSelect;

export type ConversationFile = typeof conversationFiles.$inferInsert;
export type ConversationFileSelect = typeof conversationFiles.$inferSelect;

export type ConversationBudget = typeof conversationBudgets.$inferInsert;
export type ConversationBudgetSelect = typeof conversationBudgets.$inferSelect;