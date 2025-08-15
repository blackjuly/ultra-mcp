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
    
    // Alibaba Bailian models
    if (config.bailian?.apiKey) {
      models.push(
        { id: 'qwen-max', name: 'Qwen Max', provider: 'bailian', description: 'Most capable Qwen model' },
        { id: 'qwen-plus', name: 'Qwen Plus', provider: 'bailian', description: 'Balanced performance and cost' },
        { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'bailian', description: 'Fast and efficient' },
        { id: 'qwen2.5-72b-instruct', name: 'Qwen2.5 72B', provider: 'bailian', description: 'Large parameter model' },
        { id: 'qwen2.5-32b-instruct', name: 'Qwen2.5 32B', provider: 'bailian', description: 'Medium parameter model' },
        { id: 'qwen2.5-14b-instruct', name: 'Qwen2.5 14B', provider: 'bailian', description: 'Efficient model' },
        { id: 'qwen2.5-7b-instruct', name: 'Qwen2.5 7B', provider: 'bailian', description: 'Lightweight model' },
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
        defaultProvider: z.enum(['openai', 'google', 'azure', 'xai', 'bailian']).optional(),
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
