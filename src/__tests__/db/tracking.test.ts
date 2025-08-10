import { describe, it, expect, beforeEach } from 'vitest';
import { trackLLMRequest, updateLLMCompletion, getUsageStats } from '../../db/tracking';
import { getDatabase } from '../../db/connection';
import { llmRequests } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('LLM Tracking', () => {
  beforeEach(async () => {
    // Clean up test data
    try {
      const db = await getDatabase();
      await db.delete(llmRequests).execute();
    } catch (error) {
      // Database might not be initialized yet
    }
  });

  it('should track LLM request and completion', async () => {
    const startTime = Date.now();
    
    // Track a request
    const requestId = await trackLLMRequest({
      provider: 'openai',
      model: 'gpt-4',
      toolName: 'test-tool',
      requestData: { prompt: 'test prompt' },
      startTime,
    });

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');

    // Update completion
    await updateLLMCompletion({
      requestId,
      responseData: { text: 'test response' },
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      finishReason: 'stop',
      endTime: Date.now(),
    });

    // Verify data was stored
    const db = await getDatabase();
    const results = await db.select()
      .from(llmRequests)
      .where(eq(llmRequests.id, requestId))
      .execute();

    expect(results).toHaveLength(1);
    const record = results[0];
    expect(record.provider).toBe('openai');
    expect(record.model).toBe('gpt-4');
    expect(record.toolName).toBe('test-tool');
    expect(record.totalTokens).toBe(30);
    expect(record.status).toBe('success');
    expect(record.finishReason).toBe('stop');
  });

  it('should calculate usage statistics', async () => {
    // Track a few test requests
    const requests = [
      { provider: 'openai' as const, model: 'gpt-4', tokens: 100 },
      { provider: 'gemini' as const, model: 'gemini-pro', tokens: 200 },
      { provider: 'openai' as const, model: 'gpt-3.5-turbo', tokens: 150 },
    ];

    for (const req of requests) {
      const requestId = await trackLLMRequest({
        provider: req.provider,
        model: req.model,
        requestData: { prompt: 'test' },
        startTime: Date.now(),
      });

      await updateLLMCompletion({
        requestId,
        responseData: { text: 'response' },
        usage: {
          promptTokens: req.tokens / 2,
          completionTokens: req.tokens / 2,
          totalTokens: req.tokens,
        },
        endTime: Date.now(),
      });
    }

    const stats = await getUsageStats(30);
    expect(stats).toBeDefined();
    expect(stats!.totalRequests).toBe(3);
    expect(stats!.totalTokens).toBe(450);
    expect(stats!.byProvider.openai).toBe(2);
    expect(stats!.byProvider.gemini).toBe(1);
  });
});