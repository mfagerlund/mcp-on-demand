# MCP On-Demand

[![npm version](https://badge.fury.io/js/mcp-on-demand.svg)](https://www.npmjs.com/package/mcp-on-demand)
[![npm downloads](https://img.shields.io/npm/dm/mcp-on-demand.svg)](https://www.npmjs.com/package/mcp-on-demand)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight HTTP session manager for Model Context Protocol (MCP) servers. Load MCP servers on-demand instead of keeping them in context permanently. Zero token overhead when not in use.

## For Humans

**What this does:** Use any MCP server without permanent context pollution.

**Get started:**
- [Create Command](CREATE-COMMAND.md) - Build `/commands` that use MCP On Demand
- [Create Skill](CREATE-SKILL.md) - Build auto-activating skills that use MCP On Demand

## For LLMs

### Prerequisites

1. **Node.js 22+** is required
2. **MCP servers** must be pre-installed on the user's system
3. **MCP-on-demand** must be installed and configured

### Installation

**IMPORTANT:** This document assumes MCP servers have already been installed on the system.

1. **Install mcp-on-demand globally**
   ```bash
   npm install -g mcp-on-demand
   ```

   The installation automatically runs setup, which creates `~/.mcp-on-demand/installation.json` to make the CLI self-locating. This allows you to use `mcp-on-demand` commands from anywhere.

2. **Create configuration file**

   Create `~/.mcp-on-demand/mcp-configs.json` with user's MCP installation paths:

   ```json
   {
     "chrome-devtools-mcp": {
       "command": "node",
       "args": ["/absolute/path/to/chrome-devtools-mcp/build/src/index.js"]
     }
   }
   ```

   **Ask the user for their MCP installation paths.** Do not assume locations.

3. **Start session manager** (run once, leave running)
   ```bash
   mcp-on-demand manager &
   ```

### Configuration Format

The `~/.mcp-on-demand/mcp-configs.json` file maps MCP names to their launch commands:

```json
{
  "mcp-name": {
    "command": "executable",
    "args": ["/absolute/path/to/mcp/entrypoint.js", "additional", "args"]
  }
}
```

**Examples:**

Node.js MCP:
```json
{
  "chrome-devtools-mcp": {
    "command": "node",
    "args": ["C:/Dev/chrome-devtools-mcp/build/src/index.js"]
  }
}
```

Python MCP:
```json
{
  "example-python-mcp": {
    "command": "python3",
    "args": ["/home/user/mcp-servers/example/main.py"]
  }
}
```

Binary MCP:
```json
{
  "example-binary-mcp": {
    "command": "/usr/local/bin/example-mcp",
    "args": ["--flag", "value"]
  }
}
```

### Usage Pattern


Use the `mcp-on-demand` CLI to interact with MCP sessions. The CLI communicates with the session manager via HTTP API on `http://127.0.0.1:9876`.

**Start MCP session:**
```bash
mcp-on-demand start chrome-devtools-mcp
```

### Discovering Available Tools

When you start an MCP session, the available tools are automatically displayed with their full schemas:

```bash
mcp-on-demand start chrome-devtools-mcp
```

**Output example:**
```json
{
  "success": true,
  "mcpName": "chrome-devtools-mcp",
  "toolCount": 15,
  "message": "Session started with 15 tools",
  "tools": [
    {
      "name": "navigate_page",
      "description": "Navigate to a URL",
      "inputSchema": { ... }
    },
    ...
  ]
}
```

**Best practice:** Review the tools output to understand what capabilities the MCP provides, then use the appropriate tools for your task. This ensures you're always working with the current set of tools and their actual schemas.

**Hide tools list:** Use `--no-show-tools` to suppress the tools output:
```bash
mcp-on-demand start chrome-devtools-mcp --no-show-tools
```

**Call tool:**
```bash
mcp-on-demand call chrome-devtools-mcp navigate_page '{"url": "https://example.com"}'
```

**Batch call:**
```bash
mcp-on-demand batch chrome-devtools-mcp '[
  {"tool": "navigate_page", "args": {"url": "https://example.com"}},
  {"tool": "take_screenshot", "args": {"format": "png"}}
]'
```

**Stop session:**
```bash
mcp-on-demand stop chrome-devtools-mcp
```

**List active sessions:**
```bash
mcp-on-demand list
```

**Shutdown session manager:**
```bash
mcp-on-demand shutdown
```

### File References with file://

The session manager automatically resolves `file://` references in tool arguments:

```bash
mcp-on-demand call chrome-devtools-mcp evaluate_script '{
  "function": "file://./scripts/check-buttons.js"
}'
```

**What happens:**
1. Session manager detects `file://` prefix
2. Reads file contents from disk
3. Replaces string with file contents
4. Executes tool call with resolved content

**Supported paths:**
- Relative: `file://./script.js` (relative to session manager working directory)
- Absolute: `file:///absolute/path/to/script.js`

**Works everywhere:** File resolution recursively traverses all objects and arrays in args.

### API Reference

All requests are POST to `http://127.0.0.1:9876` with JSON payloads.

**Actions:**

| Action | Parameters | Description |
|--------|------------|-------------|
| `start` | `mcpName` (required), `showTools` (optional, default: true) | Start MCP session |
| `call` | `mcpName`, `toolName`, `args` | Call single tool |
| `batch` | `mcpName`, `toolCalls` (array) | Call multiple tools sequentially |
| `stop` | `mcpName` | Stop MCP session |
| `list` | (none) | List active sessions |
| `shutdown` | (none) | Shutdown session manager |

**Response format:**

Success:
```json
{"success": true, ...}
```

Error:
```json
{"error": "error message"}
```

### Example: Web Debugging Workflow

```bash
# Ensure session manager is running
mcp-on-demand list || {
  mcp-on-demand manager &
  sleep 2
}

# Start chrome-devtools-mcp session
mcp-on-demand start chrome-devtools-mcp

# Execute debugging workflow
mcp-on-demand batch chrome-devtools-mcp '[
  {"tool": "navigate_page", "args": {"url": "https://example.com"}},
  {"tool": "evaluate_script", "args": {"function": "file://./check-buttons.js"}},
  {"tool": "take_screenshot", "args": {"filePath": "./screenshot.png"}}
]'

# Stop session when done
mcp-on-demand stop chrome-devtools-mcp
```

### Token Economics

- **Native MCP**: 5000+ tokens per MCP permanently in context
- **MCP On Demand**: 0 tokens when not in use, ~5000 tokens only when session active
- **Per-call overhead**: Identical (~30 tokens)
- **Value**: Use 10+ MCPs without permanent context cost

### Error Handling

**Common errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Unknown MCP: xyz` | MCP not in config | Add to `~/.mcp-on-demand/mcp-configs.json` |
| `Session xyz already running` | Duplicate start | Use existing session or stop first |
| `No active session for xyz` | Session not started | Call `start` action first |
| `Failed to read file: ENOENT` | File not found | Check `file://` path |
| Connection refused | Session manager not running | Start session manager |

**Session resilience:**
- Malformed requests do **not** corrupt sessions
- Failed tool calls do **not** invalidate sessions
- Sessions are independent and can be restarted

### Architecture

```
┌─────────────────┐
│   Client/LLM    │ (Claude Code, mcp-on-demand CLI)
└────────┬────────┘
         │ HTTP POST :9876
         │
┌────────▼────────────────────┐
│  Session Manager            │
│  - Loads ~/.mcp-on-demand/  │
│    mcp-configs.json         │
│  - Manages MCP sessions     │
│  - Routes tool calls        │
│  - Resolves file:// refs    │
└────────┬────────────────────┘
         │ stdio transport
         │
┌────────▼────────────────────┐
│  MCP Server(s)              │
│  (chrome-devtools-mcp, etc) │
└─────────────────────────────┘
```

### File Structure

```
mcp-on-demand/
├── src/
│   └── session-manager.js         # Main HTTP server & MCP client
├── bin/
│   └── mcp-on-demand.js           # CLI executable
├── scripts/
│   ├── mcp-call.js                # Helper script for tool calls
│   └── setup.js                   # Setup script for installation.json
├── mcp-configs.example.json       # Example configuration
├── package.json
└── README.md
```

**User configuration:**
```
~/.mcp-on-demand/
├── installation.json              # CLI self-location (auto-generated by npm run setup)
├── mcp-configs.json               # User's MCP paths (required)
└── session.json                   # Runtime state (auto-generated)
```

### Platform Notes

**Windows (MSYS/Git Bash):**
- Use forward slashes: `C:/Dev/chrome-devtools-mcp/...`
- Works correctly in MSYS/Git Bash environments

**macOS/Linux:**
- Standard Unix paths
- Consider `nohup` for background session manager

### Troubleshooting

**Session manager not responding?**
```bash
rm ~/.mcp-on-demand/session.json
mcp-on-demand manager &
sleep 2
mcp-on-demand list
```

**MCP won't start?**
1. Check config exists: `cat ~/.mcp-on-demand/mcp-configs.json`
2. Verify MCP path: `ls /path/to/mcp/index.js`
3. Check Node.js version: `node --version` (need v22+)
4. Test MCP directly: `node /path/to/mcp/index.js`

**Port 9876 in use?**
- Change `PORT` constant in `src/session-manager.js:12`

**Tool call timeout?**
- Session remains functional - retry the call
- Consider restarting the session if persistent

### Design Philosophy

**Separation of Concerns:**
- MCP-on-demand does **not** install or manage MCP servers
- Users maintain their own MCP installations
- Session manager provides runtime orchestration only

**Universal Adapter Pattern:**
- Standardized HTTP API for any MCP server
- Swap MCP servers without changing client code
- Works with any stdio-based MCP implementation

**Zero Overhead:**
- No token cost when sessions inactive
- Sessions started/stopped as needed
- Multiple concurrent sessions supported

## License

MIT

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
