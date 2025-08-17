import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getConfigManager } from '../../../config/manager';
import { ProviderManager } from '../../../providers/manager';

export const modelsRouter = router({
  list: publicProcedure.query(async () => {
    const configManager = await getConfigManager();
    const config = await configManager.getConfig();
    const providerManager = new ProviderManager(configManager);
    
    const models = [];
    
    // OpenAI models
    if (config.openai?.apiKey) {
      models.push(
        { id: 'gpt-5', name: 'GPT-5', provider: 'openai', description: 'Latest reasoning model' },
        { id: 'o3', name: 'O3', provider: 'openai', description: 'Advanced reasoning' },
      );
    }
    
    // Google models
    if (config.google?.apiKey) {
      models.push(
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast multimodal' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'Advanced capabilities' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', description: 'Fast and efficient' },
      );
    }
    
    // Azure models
    if (config.azure?.apiKey) {
      models.push(
        { id: 'gpt-5', name: 'GPT-5 (Azure)', provider: 'azure', description: 'Latest reasoning' },
        { id: 'o3', name: 'O3 (Azure)', provider: 'azure', description: 'Advanced reasoning' },
      );
    }
    
    // xAI models
    if (config.xai?.apiKey) {
      models.push(
        { id: 'grok-4', name: 'Grok-4', provider: 'xai', description: 'Latest xAI model with reasoning' },
        { id: 'grok-3', name: 'Grok-3', provider: 'xai', description: 'Advanced conversational AI' },
      );
    }
    
    // Qwen3-Coder models
    if (config.qwen3Coder?.apiKey) {
      models.push(
        { id: 'qwen3-coder-plus', name: 'Qwen3-Coder Plus', provider: 'qwen3-coder', description: 'Advanced coding model' },
        { id: 'qwen-max', name: 'Qwen Max', provider: 'qwen3-coder', description: 'Most capable Qwen model' },
        { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen3-coder', description: 'Balanced performance and cost' },
        { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen3-coder', description: 'Fast and efficient' },
      );
    }
    
    // DeepSeek-R1 models
    if (config.deepseekR1?.apiKey) {
      models.push(
        { id: 'deepseek-r1', name: 'DeepSeek-R1', provider: 'deepseek-r1', description: 'Advanced reasoning model' },
      );
    }
    
    return models;
  }),

  priorities: publicProcedure.query(async () => {
    // TODO: Load from config
    return {
      defaultProvider: 'azure',
      modelPriorities: [
        { model: 'gpt-5', priority: 1 },
        { model: 'gpt-4o', priority: 2 },
        { model: 'gemini-2.0-flash-exp', priority: 3 },
      ],
    };
  }),

  updatePriorities: publicProcedure
    .input(
      z.object({
        defaultProvider: z.enum(['openai', 'google', 'azure', 'xai', 'qwen3-coder', 'deepseek-r1']).optional(),
        modelPriorities: z.array(
          z.object({
            model: z.string(),
            priority: z.number().min(1).max(100),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Save to config
      return { success: true };
    }),
});
