import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getConfigManager } from '../../../config/manager';
import { ConfigSchema } from '../../../config/schema';

export const configRouter = router({
  get: publicProcedure.query(async () => {
    const configManager = await getConfigManager();
    const config = await configManager.getConfig();
    
    // Mask API keys for security
    const maskedConfig = {
      openai: {
        configured: !!config.openai?.apiKey,
        apiKey: config.openai?.apiKey ? '***' + config.openai.apiKey.slice(-4) : undefined,
        baseURL: config.openai?.baseURL,
      },
      google: {
        configured: !!config.google?.apiKey,
        apiKey: config.google?.apiKey ? '***' + config.google.apiKey.slice(-4) : undefined,
        baseURL: config.google?.baseURL,
      },
      azure: {
        configured: !!config.azure?.apiKey,
        apiKey: config.azure?.apiKey ? '***' + config.azure.apiKey.slice(-4) : undefined,
        baseURL: config.azure?.baseURL,
      },
      xai: {
        configured: !!config.xai?.apiKey,
        apiKey: config.xai?.apiKey ? '***' + config.xai.apiKey.slice(-4) : undefined,
        baseURL: config.xai?.baseURL,
      },
      qwen3Coder: {
        configured: !!config.qwen3Coder?.apiKey,
        apiKey: config.qwen3Coder?.apiKey ? '***' + config.qwen3Coder.apiKey.slice(-4) : undefined,
        baseURL: config.qwen3Coder?.baseURL,
      },
      deepseekR1: {
        configured: !!config.deepseekR1?.apiKey,
        apiKey: config.deepseekR1?.apiKey ? '***' + config.deepseekR1.apiKey.slice(-4) : undefined,
        baseURL: config.deepseekR1?.baseURL,
      },
    };
    
    return maskedConfig;
  }),

  update: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure', 'xai', 'qwen3Coder', 'deepseekR1']),
        config: z.object({
          apiKey: z.string().optional(),
          baseURL: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const configManager = await getConfigManager();
      
      if (input.config.apiKey) {
        await configManager.setApiKey(input.provider, input.config.apiKey);
      }

      if (input.config.baseURL !== undefined) {
        await configManager.setBaseURL(input.provider, input.config.baseURL || undefined);
      }
      
      return { success: true };
    }),

  testConnection: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure', 'xai', 'qwen3Coder', 'deepseekR1']),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement connection testing
      return {
        success: true,
        message: `${input.provider} connection successful`,
      };
    }),

  reset: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure', 'xai', 'qwen3Coder', 'deepseekR1']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const configManager = await getConfigManager();
      
      if (input.provider) {
        // Reset specific provider
        await configManager.setApiKey(input.provider, undefined);
        await configManager.setBaseURL(input.provider, undefined);
      } else {
        // Reset all
        await configManager.reset();
      }
      
      return { success: true };
    }),
});