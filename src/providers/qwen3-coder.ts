import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

export class Qwen3CoderProvider implements AIProvider {
  name = "qwen3-coder";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ apiKey: string; baseURL: string }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.qwen3Coder?.apiKey || process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
      throw new Error("Qwen3-Coder API key not configured. Run 'ultra config' or set DASHSCOPE_API_KEY environment variable.");
    }

    const baseURL = config.qwen3Coder?.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

    return { apiKey, baseURL };
  }

  getDefaultModel(): string {
    return "qwen3-coder-plus";
  }

  private async getPreferredModel(): Promise<string> {
    try {
      const config = await this.configManager.getConfig();
      return config.qwen3Coder?.preferredModel || this.getDefaultModel();
    } catch {
      return this.getDefaultModel();
    }
  }

  listModels(): string[] {
    return [
      "qwen3-coder-plus",
      "qwen-plus",
      "qwen-max",
      "deepseek-r1"
    ];
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || await this.getPreferredModel();
    const startTime = Date.now();
    
    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'qwen3-coder',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
      },
      startTime,
    });
    
    // Build messages array for OpenAI compatible format
    const messages: Array<{ role: string; content: string }> = [];
    
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    
    messages.push({ role: "user", content: request.prompt });
    
    const requestBody = {
      model: model,
      messages: messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxOutputTokens,
      top_p: 0.8,
      stream: false,
    };

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qwen3-Coder API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Extract response data (OpenAI compatible format)
      const text = result.choices?.[0]?.message?.content || '';
      const usage = result.usage ? {
        promptTokens: result.usage.prompt_tokens || 0,
        completionTokens: result.usage.completion_tokens || 0,
        totalTokens: result.usage.total_tokens || 0,
      } : undefined;
      
      // Track completion
      await updateLLMCompletion({
        requestId,
        responseData: { text },
        usage,
        finishReason: result.choices?.[0]?.finish_reason || 'stop',
        endTime: Date.now(),
      });

      return {
        text,
        model,
        usage,
        metadata: {
          requestId: result.id,
          finishReason: result.choices?.[0]?.finish_reason,
        },
      };
    } catch (error) {
      // Track error
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now(),
      });
      throw error;
    }
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || await this.getPreferredModel();
    const startTime = Date.now();
    
    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'qwen3-coder',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
      },
      startTime,
    });
    
    // Build messages array for OpenAI compatible format
    const messages: Array<{ role: string; content: string }> = [];
    
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    
    messages.push({ role: "user", content: request.prompt });
    
    const requestBody = {
      model: model,
      messages: messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxOutputTokens,
      top_p: 0.8,
      stream: true,
    };

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qwen3-Coder API error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received from Qwen3-Coder API');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let usage: any = undefined;
      let finishReason = 'stop';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  fullText += content;
                  yield content;
                }
                
                if (parsed.usage) {
                  usage = {
                    promptTokens: parsed.usage.prompt_tokens || 0,
                    completionTokens: parsed.usage.completion_tokens || 0,
                    totalTokens: parsed.usage.total_tokens || 0,
                  };
                }
                
                if (parsed.choices?.[0]?.finish_reason) {
                  finishReason = parsed.choices[0].finish_reason;
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Track completion
      await updateLLMCompletion({
        requestId,
        responseData: { text: fullText },
        usage,
        finishReason,
        endTime: Date.now(),
      });
      
    } catch (error) {
      // Track error
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now(),
      });
      throw error;
    }
  }
}