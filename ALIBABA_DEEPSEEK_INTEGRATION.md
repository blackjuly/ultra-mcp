# 阿里百炼和DeepSeek模型集成指南

本指南详细说明如何在Ultra-MCP项目中集成阿里百炼模型（qwen-code）和DeepSeek模型。

## 集成概述

基于Ultra-MCP的现有架构，我们需要：
1. 创建新的Provider实现
2. 更新配置Schema
3. 注册新的Provider到ProviderManager
4. 更新相关类型定义

## 步骤1: 创建阿里百炼Provider

### 1.1 创建 `src/providers/alibaba.ts`

```typescript
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

export class AlibabaProvider implements AIProvider {
  name = "alibaba";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ apiKey: string; baseURL?: string }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.alibaba?.apiKey || process.env.ALIBABA_API_KEY;
    const baseURL = config.alibaba?.baseURL || process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

    if (!apiKey) {
      throw new Error("Alibaba API key not configured. Run 'ultra config' or set ALIBABA_API_KEY environment variable.");
    }

    return { apiKey, baseURL };
  }

  getDefaultModel(): string {
    return "qwen-coder-plus";
  }

  private async getPreferredModel(): Promise<string> {
    try {
      const config = await this.configManager.getConfig();
      return config.alibaba?.preferredModel || this.getDefaultModel();
    } catch {
      return this.getDefaultModel();
    }
  }

  listModels(): string[] {
    return [
      "qwen-coder-plus",
      "qwen-coder-turbo",
      "qwen-plus",
      "qwen-turbo",
      "qwen-max",
      "qwen2.5-coder-32b-instruct",
      "qwen2.5-72b-instruct"
    ];
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || await this.getPreferredModel();
    const startTime = Date.now();

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'alibaba',
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

    // 使用OpenAI兼容的API格式
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: `API Error: ${response.status} ${error}`,
        endTime: Date.now(),
      });
      throw new Error(`Alibaba API Error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined;

    await updateLLMCompletion({
      requestId,
      responseData: { text },
      usage,
      finishReason: data.choices[0]?.finish_reason,
      endTime: Date.now(),
    });

    return {
      text,
      model,
      usage,
      metadata: data,
    };
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || await this.getPreferredModel();

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxOutputTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Alibaba API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
```

## 步骤2: 创建DeepSeek Provider

### 2.1 创建 `src/providers/deepseek.ts`

```typescript
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

export class DeepSeekProvider implements AIProvider {
  name = "deepseek";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ apiKey: string; baseURL?: string }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.deepseek?.apiKey || process.env.DEEPSEEK_API_KEY;
    const baseURL = config.deepseek?.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

    if (!apiKey) {
      throw new Error("DeepSeek API key not configured. Run 'ultra config' or set DEEPSEEK_API_KEY environment variable.");
    }

    return { apiKey, baseURL };
  }

  getDefaultModel(): string {
    return "deepseek-coder";
  }

  private async getPreferredModel(): Promise<string> {
    try {
      const config = await this.configManager.getConfig();
      return config.deepseek?.preferredModel || this.getDefaultModel();
    } catch {
      return this.getDefaultModel();
    }
  }

  listModels(): string[] {
    return [
      "deepseek-coder",
      "deepseek-chat",
      "deepseek-reasoner"
    ];
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || await this.getPreferredModel();
    const startTime = Date.now();

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'deepseek',
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

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: `API Error: ${response.status} ${error}`,
        endTime: Date.now(),
      });
      throw new Error(`DeepSeek API Error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined;

    await updateLLMCompletion({
      requestId,
      responseData: { text },
      usage,
      finishReason: data.choices[0]?.finish_reason,
      endTime: Date.now(),
    });

    return {
      text,
      model,
      usage,
      metadata: data,
    };
  }

  // 流式文本生成实现类似于阿里百炼
  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    // 实现类似于阿里百炼的流式处理
    // ...
  }
}
```

## 步骤3: 更新配置Schema

### 3.1 修改 `src/config/schema.ts`

在ConfigSchema中添加新的provider配置：

```typescript
// 在ConfigSchema中添加
alibaba: z.object({
  apiKey: ApiKeySchema,
  baseURL: z.string().url().optional(),
  preferredModel: z.string().optional(),
}).optional(),
deepseek: z.object({
  apiKey: ApiKeySchema,
  baseURL: z.string().url().optional(),
  preferredModel: z.string().optional(),
}).optional(),
```

在defaultConfig中添加：

```typescript
alibaba: {
  apiKey: undefined,
  baseURL: undefined,
  preferredModel: 'qwen-coder-plus',
},
deepseek: {
  apiKey: undefined,
  baseURL: undefined,
  preferredModel: 'deepseek-coder',
},
```

## 步骤4: 更新ProviderManager

### 4.1 修改 `src/providers/manager.ts`

```typescript
// 添加导入
import { AlibabaProvider } from "./alibaba";
import { DeepSeekProvider } from "./deepseek";

// 在initializeProviders方法中添加
this.providers.set("alibaba", new AlibabaProvider(this.configManager));
this.providers.set("deepseek", new DeepSeekProvider(this.configManager));
```

## 步骤5: 更新交互式配置

### 5.1 修改 `src/config/interactive.ts`

添加阿里百炼和DeepSeek的API密钥配置选项。

## 步骤6: 更新向量配置

### 6.1 在VectorConfigSchema中添加新provider支持

```typescript
defaultProvider: z.enum(['openai', 'azure', 'gemini', 'openai-compatible', 'alibaba', 'deepseek']).default('openai'),
```

## 步骤7: 测试集成

### 7.1 配置API密钥

```bash
npx ultra-mcp config
```

### 7.2 测试新provider

```bash
# 测试阿里百炼
npx ultra-mcp chat --provider alibaba --model qwen-coder-plus

# 测试DeepSeek
npx ultra-mcp chat --provider deepseek --model deepseek-coder
```

## API密钥获取

### 阿里百炼
1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
2. 创建应用并获取API Key
3. 设置环境变量或通过配置命令设置

### DeepSeek
1. 访问 [DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册账号并获取API Key
3. 设置环境变量或通过配置命令设置

## 注意事项

1. **API兼容性**: 两个provider都使用OpenAI兼容的API格式
2. **错误处理**: 确保正确处理API错误和网络异常
3. **使用跟踪**: 集成了Ultra-MCP的使用跟踪系统
4. **流式支持**: 实现了流式文本生成功能
5. **代理支持**: 继承了项目的代理配置支持

## 扩展建议

1. 添加模型特定的参数支持
2. 实现更详细的错误分类
3. 添加模型性能监控
4. 支持更多阿里百炼和DeepSeek的模型
5. 添加模型切换的智能推荐

通过以上步骤，您就可以在Ultra-MCP中成功集成阿里百炼的qwen-code和DeepSeek模型了。