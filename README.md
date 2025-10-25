# MCP On Demand

Load MCP servers on-demand instead of keeping them in context permanently. Zero token overhead when not in use.

## For Humans

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/main/README.md and follow the instructions to set up MCP On Demand
```

Example using chrome-devtools-mcp:
```
Read https://github.com/mfagerlund/mcp-on-demand/blob/main/README.md and follow the instructions to set up MCP On Demand for https://github.com/ChromeDevTools/chrome-devtools-mcp
```

## For LLMs

### Installation

**Ask the user where to install mcp-on-demand if not already installed.**

Common locations: `C:/Dev/mcp-on-demand`, `~/mcp-on-demand`

1. **Clone mcp-on-demand**
   ```bash
   git clone https://github.com/mfagerlund/mcp-on-demand.git <mcp-on-demand-path>
   cd <mcp-on-demand-path>
   npm install
   ```

2. **Clone target MCP** (if user specified one, e.g., chrome-devtools-mcp)
   
   **Ask the user where to install the target MCP if not already installed.**
   
   Example for chrome-devtools-mcp:
   ```bash
   git clone https://github.com/ChromeDevTools/chrome-devtools-mcp.git <mcp-path>
   cd <mcp-path>
   npm install
   npm run build
   ```

3. **Configure MCP** - Edit `<mcp-on-demand-path>/src/session-manager.js`
   
   Add MCP configuration:
   ```javascript
   const MCP_CONFIGS = {
     'chrome-devtools-mcp': {
       command: process.execPath,
       args: ['<mcp-path>/build/src/index.js']
     }
   };
   ```

4. **Start session manager** (do once, leave running)
   ```bash
   node <mcp-on-demand-path>/src/session-manager.js &
   ```

### Usage Pattern

When a task requires MCP tools:

1. **Start MCP session** (receives tool definitions)
   ```bash
   node <mcp-on-demand-path>/src/session-cli.js start <mcp-name>
   ```

2. **Call tools** (single or batch)
   ```bash
   # Single call
   node <mcp-on-demand-path>/src/session-cli.js call <mcp-name> <tool-name> '<json-args>'
   
   # Batch (more efficient)
   node <mcp-on-demand-path>/src/session-cli.js batch <mcp-name> '[
     {"tool":"<tool-name>","args":{...}},
     {"tool":"<tool-name>","args":{...}}
   ]'
   ```

3. **Stop session** (when task complete)
   ```bash
   node <mcp-on-demand-path>/src/session-cli.js stop <mcp-name>
   ```

### Commands Reference

```bash
start <mcp-name> [--no-show-tools]  # Start session (shows tools by default)
call <mcp-name> <tool> <json>       # Call single tool
batch <mcp-name> <json-array>       # Call multiple tools
stop <mcp-name>                     # Stop session
list                                # List active sessions
shutdown                            # Shutdown session manager
```

### Example: chrome-devtools-mcp Screenshot

```bash
# Ensure session manager running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start, call, stop
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"http://localhost:5173"}},
  {"tool":"take_screenshot","args":{"filePath":"screenshot.png"}}
]'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
```

### Token Economics

- **Native MCP**: 5000 tokens per MCP permanently in context
- **MCP On Demand**: 0 tokens when not in use, ~5000 tokens only when session active
- **Per-call overhead**: Identical (~30 tokens)
- **Value**: Use 10+ MCPs without permanent context cost

### Troubleshooting

**Session manager not responding?**
```bash
rm ~/.mcp-on-demand/session.json
node <mcp-on-demand-path>/src/session-manager.js &
```

**Check active sessions:**
```bash
node <mcp-on-demand-path>/src/session-cli.js list
```
