# Ultra MCP

> **All Models. One Interface. Zero Friction.**

[![npm version](https://badge.fury.io/js/ultra-mcp.svg)](https://badge.fury.io/js/ultra-mcp)
[![npm downloads](https://img.shields.io/npm/dm/ultra-mcp.svg)](https://www.npmjs.com/package/ultra-mcp)

🚀 **Ultra MCP (魔改版)** - A Model Context Protocol server that exposes OpenAI, Gemini, Azure OpenAI, xAI Grok, 阿里百炼 Qwen3-Coder, and DeepSeek R1 AI models through a single MCP interface for use with Claude Code and Cursor. This enhanced version includes Google Gemini proxy support and Alibaba Bailian platform integration.


![img](https://github.com/user-attachments/assets/b2ade474-7c68-458c-84e4-daa73e32ad8c)

> Stop wasting time having meetings with human. Now it's time to ask AI models do this.

## Inspiration

This project is inspired by:

- **[Agent2Agent (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)** by Google - Thank you Google for pioneering agent-to-agent communication protocols
- **[Zen MCP](https://github.com/BeehiveInnovations/zen-mcp-server)** - The AI orchestration server that enables Claude to collaborate with multiple AI models

## 魔改版本特性 (Enhanced Features)

这个魔改版本在原版Ultra MCP基础上增加了以下特性：

### 🌐 Google Gemini 代理支持
- **内置代理配置**: 支持通过HTTP/HTTPS代理访问Google Gemini API
- **环境变量配置**: 支持 `HTTP_PROXY`, `HTTPS_PROXY`, `GLOBAL_AGENT_HTTPS_PROXY`
- **无缝集成**: 代理配置对用户透明，无需额外设置

### 🇨🇳 中国AI模型集成
- **阿里百炼平台**: 原生支持阿里云百炼平台的 Qwen3-Coder 模型
- **DeepSeek R1**: 集成 DeepSeek 最新的 R1 推理模型
- **本地化优化**: 针对中国用户的网络环境进行优化
- **多语言支持**: 更好的中文理解和生成能力


## Why Ultra MCP?

While inspired by zen-mcp-server, Ultra MCP offers several key advantages:

### 🚀 **Easier to Use**

- **No cloning required** - Just run `npx ultra-mcp` to get started
- **NPM package** - Install globally with `npm install -g ultra-mcp`
- **Interactive setup** - Guided configuration with `npx ultra-mcp config`
- **Zero friction** - From zero to AI-powered coding in under a minute

### 📊 **Built-in Usage Analytics**

- **Local SQLite database** - All usage data stored locally using libSQL
- **Automatic tracking** - Every LLM request is tracked with token counts and costs
- **Usage statistics** - View your AI usage with `npx ultra-mcp db:stats`
- **Privacy first** - Your data never leaves your machine

### 🌐 **Modern Web Dashboard**

- **Beautiful UI** - React dashboard with Tailwind CSS
- **Real-time stats** - View usage trends, costs by provider, and model distribution
- **Easy access** - Just run `npx ultra-mcp dashboard`
- **Configuration UI** - Manage API keys and model priorities from the web

### 🔧 **Additional Benefits**

- **Simplified tools** - Maximum 4 parameters per tool (vs zen's 10-15)
- **Smart defaults** - Optimal model selection out of the box
- **TypeScript first** - Full type safety and better developer experience
- **Regular updates** - Active development with new features weekly

## Features

- 🤖 **Multi-Model Support**: Integrate OpenAI (GPT-5), Google Gemini (2.5 Pro), Azure OpenAI, xAI Grok, 阿里百炼 Qwen3-Coder, and DeepSeek R1 models
- 🌐 **Proxy Support**: Built-in Google Gemini proxy support for enhanced connectivity
- 🇨🇳 **Chinese AI Models**: Native support for 阿里百炼平台 (Alibaba Bailian) Qwen3-Coder and DeepSeek R1
- 🔌 **MCP Protocol**: Standard Model Context Protocol interface
- 🎯 **Discoverable Prompts**: All 25 tools available as prompts in Claude Code (New in v0.7.0)
- 🧠 **Deep Reasoning Tools**: Access GPT-5 for complex problem-solving
- 🔍 **Investigation & Research**: Built-in tools for thorough investigation and research
- 🌐 **Google Search Integration**: Gemini 2.5 Pro with real-time web search
- ⚡ **Real-time Streaming**: Live model responses via Vercel AI SDK
- 🔧 **Zero Config**: Interactive setup with smart defaults
- 🔑 **Secure Configuration**: Local API key storage with `conf` library
- 🧪 **TypeScript**: Full type safety and modern development experience

## Quick Start

### Installation (魔改版本)

由于这是魔改版本，未发布到npm官网，需要从源码安装：

```bash
# 1. 克隆项目到本地
git clone https://github.com/blackjuly/ultra-mcp.git
cd ultra-mcp

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 配置代理（如果需要）
# 配置clash 代理
```

### 标准安装（官方版本）

```bash
# Install globally via npm
npm install -g ultra-mcp

# Or run directly with npx
npx -y ultra-mcp config
```

### Configuration

Set up your API keys interactively:

```bash
npx -y ultra-mcp config
```

This will:

1. Show current configuration status
2. Present a provider-first menu to select which AI provider to configure
3. Guide you through setting API keys, base URLs, and preferred models
4. Store configuration securely on your system
5. Auto-load settings when the server starts

**New in v0.5.10:**
- 🎯 **Provider-first configuration** - Select specific provider to configure
- 🤖 **OpenAI-Compatible support** - Configure Ollama (local) or OpenRouter (400+ models)
- 📋 **Model selection** - Choose your preferred model from categorized lists

### Running the Server

```bash
# Run the MCP server
npx -y ultra-mcp

# Or after building locally
bun run build
node dist/cli.js
```

## CLI Commands

Ultra MCP provides several powerful commands:

### `config` - Interactive Configuration

```bash
npx -y ultra-mcp config
```

Configure API keys interactively with a user-friendly menu system.

### `dashboard` - Web Dashboard

```bash
npx -y ultra-mcp dashboard

# Custom port
npx -y ultra-mcp dashboard --port 4000

# Development mode
npx -y ultra-mcp dashboard --dev
```

Launch the web dashboard to view usage statistics, manage configurations, and monitor AI costs.

### `install` - Install for Claude Code

```bash
npx -y ultra-mcp install
```

Automatically install Ultra MCP as an MCP server for Claude Code.

### `doctor` - Health Check

```bash
npx -y ultra-mcp doctor

# Test connections to providers
npx -y ultra-mcp doctor --test
```

Check installation health and test API connections.

### `chat` - Interactive Chat

```bash
npx -y ultra-mcp chat

# Specify model and provider
npx -y ultra-mcp chat -m gpt-5 -p openai
npx -y ultra-mcp chat -m grok-4 -p grok
```

Chat interactively with AI models from the command line.

### Database Commands

#### `db:show` - Show Database Info

```bash
npx -y ultra-mcp db:show
```

Display database file location and basic statistics.

#### `db:stats` - Usage Statistics

```bash
npx -y ultra-mcp db:stats
```

Show detailed usage statistics for the last 30 days including costs by provider.

#### `db:view` - Database Viewer

```bash
npx -y ultra-mcp db:view
```

Launch Drizzle Studio to explore the usage database interactively.

### Integration with Claude Code

#### 魔改版本配置 (本地路径)

对于魔改版本，需要使用本地路径配置：

```json
{
  "mcpServers": {
    "ultra-mcp-local": {
      "command": "node",
      "args": [
        "C:\\Users\\hao\\Documents\\GitHub\\ultra-mcp\\dist/cli.js"
      ],
      "cwd": "C:\\Users\\hao\\Documents\\GitHub\\ultra-mcp",
      "env": {
        "HTTP_PROXY": "http://127.0.0.1:7897",
        "HTTPS_PROXY": "http://127.0.0.1:7897",
        "GLOBAL_AGENT_HTTPS_PROXY": "http://127.0.0.1:7897"
      }
    }
  }
}
```

**配置步骤：**

1. **下载项目**：
   ```bash
   git clone https://github.com/your-username/ultra-mcp.git
   cd ultra-mcp
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **构建项目**：
   ```bash
   npm run build
   ```

4. **配置代理**（可选）：
   - 如果需要代理访问Google Gemini等服务，在上述配置中设置 `env` 字段
   - 将代理地址替换为你的实际代理地址

5. **更新路径**：
   - 将配置中的路径 `C:\\Users\\hao\\Documents\\GitHub\\ultra-mcp` 替换为你的实际项目路径
   - 确保 `dist/cli.js` 文件存在

#### 官方版本自动安装 (Recommended)

```bash
# Install Ultra MCP for Claude Code
npx -y ultra-mcp install
```

This command will:

- Detect Claude Code installation
- Add Ultra MCP as an MCP server
- Configure for user or project scope
- Verify API key configuration

#### 官方版本手动安装

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "npx",
      "args": ["-y", "ultra-mcp@latest"]
    }
  }
}
```

### Integration with Cursor

#### 魔改版本配置

First configure your API keys:

```bash
# 进入项目目录
cd C:\Users\hao\Documents\GitHub\ultra-mcp # 替换成你实际的目录

# 配置API密钥
node dist/cli.js config
```

Then add to your Cursor or Trae MCP settings:

目录替换成实际的目录
```json
{
  "mcpServers": {
    "ultra-mcp-local": {
      "command": "node",
      "args": [
        "C:\\Users\\hao\\Documents\\GitHub\\ultra-mcp\\dist/cli.js" 
      ],
      "cwd": "C:\\Users\\hao\\Documents\\GitHub\\ultra-mcp",
      "env": {
        "HTTP_PROXY": "http://127.0.0.1:7897",
        "HTTPS_PROXY": "http://127.0.0.1:7897",
        "GLOBAL_AGENT_HTTPS_PROXY": "http://127.0.0.1:7897"
      }
    }
  }
}
```

#### 官方版本配置

First configure your API keys:

```bash
npx -y ultra-mcp config
```

Then add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "npx",
      "args": ["-y", "ultra-mcp@latest"]
    }
  }
}
```

Ultra MCP will automatically use the API keys you configured with the `config` command.

## MCP Tools & Prompts

Ultra MCP provides powerful AI tools accessible through Claude Code and Cursor. **New in v0.7.0**: All tools are now also available as **discoverable prompts** in Claude Code.

### 🎯 Prompts Support (New in v0.7.0)

All Ultra MCP tools are now exposed as **discoverable prompts** in Claude Code, making them even easier to use:

- **25 discoverable prompts** corresponding to all existing tools
- **Parameter guidance** built into each prompt template
- **Natural language interface** for all AI capabilities
- **Automatic discovery** by Claude Code and other MCP clients

**How to use prompts:**

1. Type `/` in Claude Code to see available prompts
2. Select any Ultra MCP prompt (e.g., "Deep Reasoning", "Code Review", "Debug Issue")
3. Fill in the parameters through the guided interface
4. Claude automatically generates the appropriate instruction

This makes Ultra MCP's powerful AI capabilities more accessible than ever!

### 🧠 Deep Reasoning (`deep-reasoning`)

Leverage advanced AI models for complex problem-solving and analysis.

- **Default**: GPT-5 for OpenAI/Azure, Gemini 2.5 Pro with Google Search, Grok-4 for xAI
- **Use Cases**: Complex algorithms, architectural decisions, deep analysis

### 🔍 Investigate (`investigate`)

Thoroughly investigate topics with configurable depth levels.

- **Depth Levels**: shallow, medium, deep
- **Google Search**: Enabled by default for Gemini
- **Use Cases**: Research topics, explore concepts, gather insights

### 📚 Research (`research`)

Conduct comprehensive research with multiple output formats.

- **Output Formats**: summary, detailed, academic
- **Use Cases**: Literature reviews, technology comparisons, documentation

### 📋 List Models (`list-ai-models`)

View all available AI models and their configuration status.

### Example Usage

```javascript
// In Claude Code or Cursor with MCP
await use_mcp_tool('ultra-mcp', 'deep-reasoning', {
  provider: 'openai',
  prompt: 'Design a distributed caching system for microservices',
  reasoningEffort: 'high',
});
```

## Development

```bash
# Clone the repository
git clone https://github.com/RealMikeChong/ultra-mcp
cd ultra-mcp

# Install dependencies
bun install

# Build TypeScript
bun run build

# Run tests
bun run test

# Development mode with watch
bun run dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/cli.js
```

## Architecture

Ultra MCP acts as a bridge between multiple AI model providers and MCP clients:

1. **MCP Protocol Layer**: Implements Model Context Protocol for Claude Code/Cursor communication
2. **Model Providers**: Integrates OpenAI, Google (Gemini), Azure OpenAI, and xAI Grok via Vercel AI SDK
3. **Unified Interface**: Single MCP interface to access multiple AI models
4. **Configuration Management**: Secure local storage with schema validation

### Key Components

- `src/cli.ts` - CLI entry point with commander
- `src/server.ts` - MCP server implementation
- `src/config/` - Configuration management with schema validation
- `src/handlers/` - MCP protocol handlers
- `src/providers/` - Model provider implementations
- `src/utils/` - Shared utilities for streaming and error handling

## Configuration Storage

Ultra MCP stores configuration in your system's default config directory:

- **macOS**: `~/Library/Preferences/ultra-mcp-nodejs/`
- **Linux**: `~/.config/ultra-mcp/`
- **Windows**: `%APPDATA%\ultra-mcp-nodejs\`

## Environment Variables

You can also set API keys and base URLs via environment variables:

- `OPENAI_API_KEY` / `OPENAI_BASE_URL`
- `GOOGLE_API_KEY` / `GOOGLE_BASE_URL`
- `AZURE_API_KEY` / `AZURE_BASE_URL` (base URL required for Azure)
- `XAI_API_KEY` / `XAI_BASE_URL`
- `QWEN3_CODER_API_KEY` / `QWEN3_CODER_BASE_URL` (阿里百炼平台 千问)
- `DEEPSEEK_R1_API_KEY` / `DEEPSEEK_R1_BASE_URL` (DeepSeek R1 百炼平台)


_Note: Configuration file takes precedence over environment variables._

## Vector Embeddings Configuration

Ultra MCP supports vector embeddings for semantic code search. By default, it uses **text-embedding-3-small** for cost efficiency (6.5x cheaper than the large model).

### Embedding Model Configuration

You can customize the embedding models in your configuration:

```json
{
  "vectorConfig": {
    "embeddingModel": {
      "openai": "text-embedding-3-small",  // or "text-embedding-3-large"
      "azure": "text-embedding-3-small",    // or "text-embedding-3-large"
      "gemini": "text-embedding-004"
    }
  }
}
```

### Model Comparison

| Model | Cost | Dimensions | MTEB Score | Best For |
|-------|------|------------|------------|----------|
| text-embedding-3-small | $0.02/1M tokens | 1536 | 62.3% | Cost-effective code search |
| text-embedding-3-large | $0.13/1M tokens | 3072 | 64.6% | Maximum accuracy |

### Migration Notes

- **Existing Databases**: If you have an existing vector database created with `text-embedding-3-large`, it will continue to work but won't be compatible with new embeddings from `text-embedding-3-small`. Consider re-indexing if you want to use the smaller model.
- **Backward Compatibility**: You can always override the model by configuring `embeddingModel` in your vector config.

## Roadmap

### Phase 1: Zero Config Setup

- Interactive mode for seamless first-time setup
- Auto-detection of available API keys
- Smart defaults and configuration recommendations
- One-command installation and setup

### Phase 2: Integration Helpers

- Helper commands to integrate Ultra MCP into Claude Code
- Cursor IDE integration utilities
- Auto-generation of MCP server configuration files
- Integration validation and troubleshooting tools

### Phase 3: Cost Dashboard & Analytics

- Web UI dashboard using React, shadcn/ui, and Tremor
- SQLite database for usage tracking via Drizzle ORM
- Real-time cost monitoring and budget alerts
- Usage analytics and model performance insights
- Export capabilities for billing and reporting

### Phase 4: Workflow Optimization

- Use Ultra MCP to 100x your current LLM coding workflows
- Advanced prompt templates and automation
- Multi-model orchestration and fallback strategies
- Workflow optimization recommendations
- Performance monitoring and optimization tools

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add feature"`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Testing

```bash
# Run all tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Google** for the [Agent2Agent (A2A) Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) inspiring agent interoperability
- **BeehiveInnovations** for [Zen MCP](https://github.com/BeehiveInnovations/zen-mcp-server) demonstrating AI model orchestration
- **Anthropic** for the [Model Context Protocol](https://modelcontextprotocol.io/)
- **Vercel** for the excellent [AI SDK](https://sdk.vercel.ai/)

## About the Author

👋 **Mike Chong** - Building tools to amplify human potential through AI.

As one of the earliest **users** of GitHub Copilot (personally invited by Nat Friedman, former GitHub CEO), I've witnessed firsthand how AI-assisted development can transform the way we build software. My journey as a former engineer on **Outlook iOS/Android** taught me the importance of creating tools that genuinely improve people's daily lives.

**Ultra MCP** represents my vision of democratizing access to the best AI models, making cutting-edge AI capabilities accessible to every developer through a unified, simple interface. I believe that by removing barriers between developers and AI models, we can accelerate innovation and create a better world for everyone.

_"The future belongs to those who can seamlessly orchestrate human creativity with AI capabilities."_

## 魔改版本 vs 原版对比 (Enhanced vs Original)

### 魔改版本独有特性

1. **中国AI模型支持** - 原生集成中国主流AI服务
   - 阿里百炼平台 Qwen3-Coder 模型
   - DeepSeek R1 推理模型
   - 针对中文场景优化的提示词和响应

2. **代理网络支持** - 解决网络访问问题
   - Google Gemini API 代理支持
   - 灵活的代理配置选项
   - 环境变量和配置文件双重支持


### 使用建议

- **选择魔改版本**：如果你需要使用中国AI模型、需要代理访问或希望完全控制部署
- **选择原版**：如果你只使用国际AI服务且网络访问无障碍

## Why Ultra MCP is Different from Zen MCP Server

While both projects aim to enhance AI development workflows, Ultra MCP brings unique advantages:

1. **Written in TypeScript** - Full type safety, excellent IDE support, and a more maintainable codebase

2. **Vector Search Support** - Built-in semantic code search using vector embeddings
   - Index your entire codebase with `npx ultra-mcp index`
   - Search with natural language queries: `npx ultra-mcp search "authentication logic"`
   - Powered by OpenAI, Azure OpenAI, and Google Gemini embeddings
   - Local SQLite storage with libSQL vector extension for efficient similarity search
   - Smart chunking and overlap for optimal search results

3. **Built-in Dashboard & Usage Tracking** - Comprehensive analytics and cost monitoring
   - Web dashboard with live metrics and real-time statistics
   - Automatic tracking of all LLM requests with token counts
   - **Continuously updated pricing via LiteLLM** - Accurate cost calculations
   - Tiered pricing support (e.g., Gemini's long-context pricing tiers)
   - SQLite database powered by libSQL for local-first privacy

4. **Advanced Pricing System** - Real-time cost management
   - Fetches latest pricing from LiteLLM's GitHub repository
   - File-based caching with 1-hour TTL to minimize network calls
   - CLI commands: `npx ultra-mcp pricing show gpt-4o`
   - Accurate cost tracking for hundreds of models across all providers
   - Automatic fallback to cached data when offline

Unlike many MCP implementations, Ultra MCP includes built-in vector search and a pricing-aware dashboard out of the box. These features make Ultra MCP particularly suited for developers who want robust tooling with built-in cost visibility and intelligent code search capabilities for responsible AI usage.

## Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Agent2Agent Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Zen MCP Server](https://github.com/BeehiveInnovations/zen-mcp-server)
- [Claude Code](https://claude.ai/code)
- [Cursor IDE](https://cursor.sh/)
