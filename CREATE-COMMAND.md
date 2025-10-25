# Create Command

Explicit `/command-name` that uses MCP On Demand. User invokes manually.

## Setup Required

Run once in the mcp-on-demand directory:
```bash
cd <mcp-on-demand-directory>
npm install
npm run setup
npm link
```

- `npm run setup` creates `~/.mcp-on-demand/installation.json`
- `npm link` makes `mcp-on-demand` command available globally (restart terminal after this)

**Verify CLI works:**
```bash
mcp-on-demand list
```

If command not found, restart your terminal or use full path: `node /path/to/mcp-on-demand/bin/mcp-on-demand.js`

## Configure Target MCP

Add your MCP to `~/.mcp-on-demand/mcp-configs.json`:

**Windows:**
```json
{
  "chrome-devtools-mcp": {
    "command": "node",
    "args": ["C:/Dev/chrome-devtools-mcp/build/src/index.js"]
  }
}
```

**macOS/Linux:**
```json
{
  "chrome-devtools-mcp": {
    "command": "node",
    "args": ["/home/user/chrome-devtools-mcp/build/src/index.js"]
  }
}
```

**Verify configuration works:**
```bash
mcp-on-demand start chrome-devtools-mcp
mcp-on-demand call chrome-devtools-mcp list_pages '{}'
mcp-on-demand stop chrome-devtools-mcp
```

If successful, you'll see `{"success": true, ...}` responses.

## Create Command

Commands live in `~/.claude/commands/<command-name>.md`

Create the command file:
```bash
mkdir -p ~/.claude/commands
```

```markdown
---
description: Brief description of what this command does
---

# Command Name

**MCP:** `mcp-name`

Extract parameters from user message.

**Start session:**
\```bash
mcp-on-demand start mcp-name
\```

**Call tools (when checking output between steps):**
\```bash
mcp-on-demand call mcp-name tool-name '{"arg":"value"}'
\```

**Or batch (for sequential operations):**
\```bash
mcp-on-demand batch mcp-name '[
  {"tool":"tool1","args":{...}},
  {"tool":"tool2","args":{...}}
]'
\```

**Stop session:**
\```bash
mcp-on-demand stop mcp-name
\```

Report findings with analysis and specific recommendations.
```

## Complete Example

`~/.claude/commands/debug-web.md`:

```markdown
---
description: Debug web UIs using Chrome DevTools
---

# Debug Web UI

**MCP:** `chrome-devtools-mcp`

Extract URL from user message.

**Start:**
\```bash
mcp-on-demand start chrome-devtools-mcp
\```

**Debug:**
\```bash
mcp-on-demand batch chrome-devtools-mcp '[
  {"tool":"navigate_page","args":{"url":"$URL"}},
  {"tool":"take_snapshot","args":{}},
  {"tool":"list_console_messages","args":{}},
  {"tool":"take_screenshot","args":{"filePath":"./debug.png"}}
]'
\```

**Stop:**
\```bash
mcp-on-demand stop chrome-devtools-mcp
\```

Analyze results with screenshots and console output. Provide specific findings.
```

**Invocation:** User types `/debug-web http://localhost:5173 - submit fails`

## Session Manager

**IMPORTANT:** The session manager **auto-starts** on first CLI use. You should NEVER need to manually start it unless troubleshooting.

To manually start (only for troubleshooting):
```bash
mcp-on-demand manager &
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `mcp-on-demand: command not found` | Run `npm link` in mcp-on-demand directory, or use full path |
| `Unknown MCP: xyz` | Add to `~/.mcp-on-demand/mcp-configs.json` |
| Config test fails | Verify MCP path exists and MCP is built (`npm run build` in MCP dir) |
| Session manager not responding | Kill stale process: `pkill -f session-manager`, then retry |
