# 在 Trae 中配置 Ultra MCP 服务器

本指南说明如何将本地的 Ultra MCP 项目配置为 MCP 服务器，并在 Trae AI IDE 中使用，同时支持代理访问。

## 前提条件

1. 确保项目已构建：
   ```bash
   npm run build
   ```

2. 确保已配置 API 密钥：
   ```bash
   node dist/cli.js config
   ```

## 配置步骤

### 1. 使用提供的启动脚本

我们已经创建了一个 PowerShell 启动脚本 `start-mcp-server-with-proxy.ps1`，它会：
- 设置代理环境变量
- 启动 Ultra MCP 作为 MCP 服务器

### 2. 在 Trae 中配置 MCP 服务器

在 Trae AI IDE 中，添加以下 MCP 服务器配置：

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

**重要说明**: 
- 使用相对路径 `dist/cli.js` 而不是绝对路径
- 必须设置 `cwd` 工作目录指向项目根目录
- 环境变量用于代理配置

### 3. 配置文件位置

根据你的 Trae 配置，将上述 JSON 配置添加到相应的配置文件中：

- **用户级配置**: `~/.config/trae/mcp-servers.json`
- **项目级配置**: `.trae/mcp-servers.json`

### 4. 验证配置

1. 重启 Trae AI IDE
2. 在 Trae 中检查 MCP 服务器状态
3. 尝试使用 Ultra MCP 提供的工具

## 可用的 MCP 工具

Ultra MCP 提供以下工具类别：

### AI 模型工具
- `ask_ai` - 向 AI 模型提问
- `stream_ai` - 流式 AI 响应
- `deep_reasoning` - 深度推理分析
- `code_review` - 代码审查
- `debug_issue` - 调试问题

### 向量搜索工具
- `vector_search` - 语义代码搜索
- `vector_index` - 创建向量索引

### 高级工作流工具
- `review_workflow` - 代码审查工作流
- `analyze_workflow` - 分析工作流
- `debug_workflow` - 调试工作流
- `plan_workflow` - 规划工作流
- `docs_workflow` - 文档生成工作流

## 代理配置说明

### 支持的代理环境变量
- `HTTP_PROXY` - HTTP 代理地址
- `HTTPS_PROXY` - HTTPS 代理地址
- `GLOBAL_AGENT_HTTPS_PROXY` - 全局 HTTPS 代理

### 默认代理设置
脚本默认使用 `http://127.0.0.1:7897` 作为代理地址。如需修改，请编辑：
- `start-mcp-server-with-proxy.ps1` 文件
- 或在 Trae 配置中的 `env` 部分

## 故障排除

### 1. 权限问题
如果遇到 PowerShell 执行策略问题：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. 路径问题
确保所有路径使用绝对路径，并且使用双反斜杠 `\\` 转义。

### 3. 代理连接问题
- 确保代理服务器正在运行
- 检查代理地址和端口是否正确
- 查看 Ultra MCP 日志文件：`/tmp/ultra-mcp-error.log`

### 4. API 密钥问题
确保已正确配置 API 密钥。Ultra MCP 支持以下 AI 提供商：
- OpenAI (GPT-4, GPT-3.5等)
- Google Gemini
- Azure OpenAI
- xAI Grok
- Qwen3-Coder (阿里云通义千问)
- DeepSeek-R1 (阿里云百炼版 deepseek)

配置 API 密钥：
```bash
node dist/cli.js config
```

## 测试配置

### 1. 手动测试 MCP 服务器

```powershell
# 设置代理环境变量
$env:HTTP_PROXY='http://127.0.0.1:7897'
$env:HTTPS_PROXY='http://127.0.0.1:7897'
$env:GLOBAL_AGENT_HTTPS_PROXY='http://127.0.0.1:7897'

# 启动 MCP 服务器
node dist/cli.js
```

### 2. 使用 MCP Inspector 测试

首先安装 MCP Inspector：
```powershell
npm install -g @modelcontextprotocol/inspector
```

然后启动 Inspector：
```powershell
mcp-inspector node dist/cli.js
```

这将启动一个 Web 界面，你可以在浏览器中测试 MCP 服务器的所有功能。

### 3. 验证代理功能

- 确保你的代理服务器在 `http://127.0.0.1:7897` 运行
- 在 MCP Inspector 中测试 AI 工具调用
- 检查代理服务器日志确认请求通过代理

## 更新配置

当 Ultra MCP 代码更新后：
1. 重新构建项目：`npm run build`
2. 重启 Trae AI IDE
3. MCP 服务器将自动使用新版本

---

配置完成后，你就可以在 Trae AI IDE 中使用本地的 Ultra MCP 服务器，享受多模型 AI 支持和代理访问功能！