import { AIProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { AzureOpenAIProvider } from "./azure";
import { GrokProvider } from "./grok";
import { OpenAICompatibleProvider } from "./openai-compatible";
import { Qwen3CoderProvider } from "./qwen3-coder";
import { DeepSeekR1Provider } from "./deepseek-r1";
import { ConfigManager } from "../config/manager";

export class ProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize all providers
    this.providers.set("openai", new OpenAIProvider(this.configManager));
    this.providers.set("gemini", new GeminiProvider(this.configManager));
    this.providers.set("azure", new AzureOpenAIProvider(this.configManager));
    this.providers.set("grok", new GrokProvider(this.configManager));
    this.providers.set("openai-compatible", new OpenAICompatibleProvider(this.configManager));
    this.providers.set("qwen3-coder", new Qwen3CoderProvider(this.configManager));
    this.providers.set("deepseek-r1", new DeepSeekR1Provider(this.configManager));
  }

  async getProvider(name: string): Promise<AIProvider> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Unknown provider: ${name}. Available providers: ${Array.from(this.providers.keys()).join(", ")}`);
    }

    // Check if the requested provider is configured
    const configuredProviders = await this.getConfiguredProviders();
    
    // If the requested provider is configured, return it
    if (configuredProviders.includes(name)) {
      return provider;
    }

    // Special case: if OpenAI is requested but not configured, fallback to Azure if available
    if (name === "openai" && configuredProviders.includes("azure")) {
      return this.providers.get("azure")!;
    }

    // If the requested provider is not configured, throw an error
    throw new Error(`Provider '${name}' is not configured. Available configured providers: ${configuredProviders.join(", ")}. Run 'ultra-mcp config' to set up API keys.`);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getAvailableModels(): Record<string, string[]> {
    const models: Record<string, string[]> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        models[name] = provider.listModels();
      } catch {
        // Provider might not be configured, skip it
        models[name] = [];
      }
    }
    
    return models;
  }

  async getConfiguredProviders(): Promise<string[]> {
    const config = await this.configManager.getConfig();
    const configured: string[] = [];

    if (config.openai?.apiKey || process.env.OPENAI_API_KEY) {
      configured.push("openai");
    }

    if (config.google?.apiKey || process.env.GOOGLE_API_KEY) {
      configured.push("gemini");
    }

    if ((config.azure?.apiKey || process.env.AZURE_API_KEY) && 
        (config.azure?.resourceName || process.env.AZURE_BASE_URL || process.env.AZURE_ENDPOINT)) {
      configured.push("azure");
    }

    if (config.xai?.apiKey || process.env.XAI_API_KEY) {
      configured.push("grok");
    }

    if (config.openaiCompatible?.baseURL) {
      // For Ollama, we don't require an API key (can use fake key)
      // For OpenRouter, we require a real API key
      const providerName = config.openaiCompatible?.providerName || 'ollama';
      if (providerName === 'ollama' || config.openaiCompatible?.apiKey) {
        configured.push("openai-compatible");
      }
    }

    if (config.qwen3Coder?.apiKey || process.env.DASHSCOPE_API_KEY) {
      configured.push("qwen3-coder");
    }

    if (config.deepseekR1?.apiKey || process.env.DASHSCOPE_API_KEY) {
      configured.push("deepseek-r1");
    }

    return configured;
  }

  async getPreferredProvider(preferredProviders?: string[]): Promise<string> {
    const configured = await this.getConfiguredProviders();
    
    // If Azure is configured, always prefer it
    if (configured.includes("azure")) {
      return "azure";
    }
    
    // If preferred providers are specified, use the first configured one
    if (preferredProviders) {
      for (const provider of preferredProviders) {
        if (configured.includes(provider)) {
          return provider;
        }
      }
    }
    
    // Otherwise, return the first configured provider
    if (configured.length > 0) {
      return configured[0];
    }
    
    throw new Error("No AI providers configured. Run 'ultra-mcp config' to set up API keys.");
  }
}