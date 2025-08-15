import { embed, embedMany, EmbeddingModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAzure } from '@ai-sdk/azure';
import { ConfigManager } from '../config/manager';
import { logger } from '../utils/logger';
import { ProxyAgent } from 'undici';

export interface EmbeddingConfig {
  provider: 'openai' | 'azure' | 'gemini' | 'openai-compatible' | 'bailian';
  model?: string;
  apiKey?: string;
  baseURL?: string;
  resourceName?: string;
}

export class EmbeddingProvider {
  private config: EmbeddingConfig;
  private configManager: ConfigManager;

  constructor(config: EmbeddingConfig, configManager: ConfigManager) {
    this.config = config;
    this.configManager = configManager;
  }

  async getEmbedding(text: string): Promise<number[]> {
    const model = await this.getEmbeddingModel();
    
    try {
      const result = await embed({
        model,
        value: text,
      });
      
      return result.embedding;
    } catch (error) {
      logger.error(`Embedding error with ${this.config.provider}:`, error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    const model = await this.getEmbeddingModel();
    
    try {
      // WORKAROUND: Azure has a bug with batch embeddings in Vercel AI SDK
      // Process sequentially for Azure only to avoid 400 errors
      if (this.config.provider === 'azure') {
        const embeddings: number[][] = [];
        for (const text of texts) {
          const result = await embed({
            model,
            value: text, // Single string for single embedding
          });
          embeddings.push(result.embedding);
        }
        return embeddings;
      }
      
      // Use batch processing for other providers (OpenAI, Gemini)
      const result = await embedMany({
        model,
        values: texts,
      });
      
      return result.embeddings;
    } catch (error) {
      logger.error(`Batch embedding error with ${this.config.provider}:`, error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getEmbeddingModel(): Promise<EmbeddingModel<any>> {
    const config = await this.configManager.getConfig();
    
    // Check for proxy configuration
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.GLOBAL_AGENT_HTTPS_PROXY;
    let customFetch: typeof fetch | undefined;
    
    if (proxyUrl) {
      const proxyAgent = new ProxyAgent(proxyUrl);
      customFetch = (url: string | URL | Request, init?: RequestInit) => {
        return fetch(url, {
          ...init,
          // @ts-ignore - ProxyAgent is compatible with fetch dispatcher
          dispatcher: proxyAgent
        });
      };
    }
    
    switch (this.config.provider) {
      case 'openai': {
        const apiKey = this.config.apiKey || config.openai?.apiKey;
        if (!apiKey) {
          throw new Error('OpenAI API key not configured');
        }
        
        const openaiInstance = createOpenAI({
          apiKey,
          baseURL: this.config.baseURL || config.openai?.baseURL,
          fetch: customFetch,
        });
        const modelName = this.config.model || config.vectorConfig?.embeddingModel?.openai || 'text-embedding-3-small';
        return openaiInstance.embedding(modelName);
      }
      
      case 'azure': {
        const apiKey = this.config.apiKey || config.azure?.apiKey;
        
        if (!apiKey) {
          throw new Error('Azure OpenAI API key required');
        }
        
        // Get resource name from config or extract from legacy baseURL
        let resourceName = this.config.resourceName || config.azure?.resourceName;
        
        if (!resourceName) {
          // Try to extract from legacy baseURL for backward compatibility
          const baseURL = this.config.baseURL || process.env.AZURE_BASE_URL || process.env.AZURE_ENDPOINT;
          if (baseURL) {
            resourceName = baseURL.match(/https:\/\/(.+?)\.openai\.azure\.com/)?.[1];
          }
        }
        
        if (!resourceName) {
          throw new Error('Azure resource name required. Please configure resourceName or set AZURE_BASE_URL environment variable.');
        }
        
        const azure = createAzure({
          apiKey,
          resourceName,
          fetch: customFetch,
        });
        
        const modelName = this.config.model || config.vectorConfig?.embeddingModel?.azure || 'text-embedding-3-small';
        return azure.embedding(modelName);
      }
      
      case 'gemini': {
        const apiKey = this.config.apiKey || config.google?.apiKey;
        if (!apiKey) {
          throw new Error('Google API key not configured');
        }
        
        const googleInstance = createGoogleGenerativeAI({
          apiKey,
          baseURL: this.config.baseURL || config.google?.baseURL,
          fetch: customFetch,
        });
        const modelName = this.config.model || config.vectorConfig?.embeddingModel?.gemini || 'text-embedding-004';
        return googleInstance.embedding(modelName);
      }
      
      case 'bailian': {
        const apiKey = this.config.apiKey || config.bailian?.apiKey;
        if (!apiKey) {
          throw new Error('Alibaba Bailian API key not configured');
        }
        
        const bailianInstance = createOpenAI({
          apiKey,
          baseURL: this.config.baseURL || config.bailian?.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          fetch: customFetch,
        });
        const modelName = this.config.model || config.vectorConfig?.embeddingModel?.bailian || 'text-embedding-v1';
        return bailianInstance.embedding(modelName);
      }
      
      default:
        throw new Error(`Unsupported embedding provider: ${this.config.provider}`);
    }
  }
}

export async function getDefaultEmbeddingProvider(configManager: ConfigManager): Promise<EmbeddingProvider> {
  const config = await configManager.getConfig();
  const vectorConfig = config.vectorConfig;
  
  // Determine provider priority
  let provider: 'openai' | 'azure' | 'gemini' | 'openai-compatible' | 'bailian' = 'openai';
  
  if (vectorConfig?.defaultProvider) {
    provider = vectorConfig.defaultProvider;
  } else if (config.azure?.apiKey && (config.azure?.resourceName || process.env.AZURE_BASE_URL || process.env.AZURE_ENDPOINT)) {
    provider = 'azure';
  } else if (config.openai?.apiKey) {
    provider = 'openai';
  } else if (config.google?.apiKey) {
    provider = 'gemini';
  } else if (config.bailian?.apiKey) {
    provider = 'bailian';
  } else {
    throw new Error('No embedding provider configured. Please configure OpenAI, Azure, Google, or Alibaba Bailian API keys.');
  }
  
  return new EmbeddingProvider({ provider }, configManager);
}