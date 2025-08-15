import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

export class BailianProvider implements AIProvider {
  name = "bailian";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ apiKey: string; baseURL: string }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.bailian?.apiKey || process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
      throw new Error("Bailian API key not configured. Run 'ultra config' or set DASHSCOPE_API_KEY environment variable.");
    }

    const baseURL = config.bailian?.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

    return { apiKey, baseURL };
  }

  getDefaultModel(): string {
    return "qwen-max";
  }

  private async getPreferredModel(): Promise<string> {
    try {
      const config = await this.configManager.getConfig();
      return config.bailian?.preferredModel || this.getDefaultModel();
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
      provider: 'bailian',
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
        throw new Error(`Bailian API error (${response.status}): ${errorText}`);
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
      provider: 'bailian',
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
        throw new Error(`Bailian API error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received from Bailian API');
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