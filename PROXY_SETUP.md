# Ultra-MCP 代理设置指南

本指南说明如何配置 Ultra-MCP 通过代理访问 Google Gemini API。

## 代理启动脚本

我们提供了两个启动脚本来设置代理环境变量：

### 1. 批处理文件 (Windows)

使用 `start-with-proxy.bat`：

```batch
@echo off
REM Set proxy environment variables for accessing Google Gemini through proxy
set HTTP_PROXY=http://127.0.0.1:7897/
set HTTPS_PROXY=http://127.0.0.1:7897/

REM Start ultra-mcp with proxy settings
npx -y ultra-mcp@latest
```

### 2. PowerShell 脚本 (Windows)

使用 `start-with-proxy.ps1`：

```powershell
# Set proxy environment variables for accessing Google Gemini through proxy
$env:HTTP_PROXY = "http://127.0.0.1:7897/"
$env:HTTPS_PROXY = "http://127.0.0.1:7897/"

# Start ultra-mcp with proxy settings
npx -y ultra-mcp@latest
```

## MCP 服务器配置

要在 Claude Desktop 中使用代理启动的 Ultra-MCP，请更新您的 MCP 配置：

### 选项 1: 使用批处理文件

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "cmd",
      "args": [
        "/c",
        "C:\\tmp\\start-with-proxy.bat"
      ]
    }
  }
}
```

### 选项 2: 使用 PowerShell 脚本

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "powershell",
      "args": [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "C:\\path\\to\\ultra-mcp\\start-with-proxy.ps1"
      ]
    }
  }
}
```

### 选项 3: 直接在配置中设置环境变量

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "ultra-mcp@latest"
      ],
      "env": {
        "HTTP_PROXY": "http://127.0.0.1:7897/",
        "HTTPS_PROXY": "http://127.0.0.1:7897/"
      }
    }
  }
}
```

## 代理设置说明

- `HTTP_PROXY`: 用于 HTTP 请求的代理服务器
- `HTTPS_PROXY`: 用于 HTTPS 请求的代理服务器
- 代理地址 `http://127.0.0.1:7897/` 是常见的本地代理配置

## 使用步骤

1. 确保您的代理服务器正在运行（通常在端口 7897）
2. 选择上述配置选项之一
3. 更新您的 Claude Desktop MCP 配置文件
4. 重启 Claude Desktop
5. Ultra-MCP 现在应该能够通过代理访问 Google Gemini API

## 代理实现方案

### 方案一：环境变量配置（推荐）

项目已集成 `https-proxy-agent` 库，支持通过环境变量自动配置代理：

```bash
# 设置代理环境变量
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897

# 启动 ultra-mcp
npx -y ultra-mcp chat
```

在 Windows PowerShell 中：
```powershell
$env:HTTP_PROXY = "http://127.0.0.1:7897"
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
npx -y ultra-mcp chat
```

### 方案二：使用提供的脚本

使用项目提供的启动脚本：
- `start-with-proxy.ps1` (PowerShell)
- `start-with-proxy.bat` (批处理)
- `test-proxy.ps1` (测试脚本)

### 技术实现

项目在 `src/providers/gemini.ts` 中实现了代理支持：

1. 检测 `HTTP_PROXY`、`HTTPS_PROXY` 或 `GLOBAL_AGENT_HTTPS_PROXY` 环境变量
2. 使用 `https-proxy-agent` 创建代理代理
3. 为 `@ai-sdk/google` 提供自定义 `fetch` 函数
4. 确保所有 API 请求通过指定代理发送

## 故障排除

- 确保代理服务器地址和端口正确
- 检查代理服务器是否正在运行
- 验证代理服务器允许访问 Google API 域名
- 确保已安装 `https-proxy-agent` 依赖：`npm install https-proxy-agent`
- 查看 Ultra-MCP 日志以获取详细错误信息
- 如果仍有问题，尝试重新构建项目：`npm run build`