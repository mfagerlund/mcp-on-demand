# Create Skill

**For humans:** Point Claude Code to this guide and specify which MCP to wrap and where it's installed:
```
Read https://raw.githubusercontent.com/mfagerlund/mcp-on-demand/refs/heads/master/CREATE-SKILL.md and create a skill for <mcp-name> (installed at /path/to/mcp)
```

The rest of this document is for LLMs to follow when creating skills.

---

Auto-activating skill that uses MCP On Demand. Activates based on user intent.

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

## Create Skill

Skills live in `~/.claude/skills/<skill-name>/SKILL.md`

**Directory name must match skill name** (use lowercase with hyphens).

Create the skill directory:
```bash
mkdir -p ~/.claude/skills/<skill-name>
```

```markdown
---
name: skill-name
description: Specific scenarios that trigger this skill. Be detailed - determines auto-activation.
---

# Skill Name

**MCP:** `mcp-name`

## When to Use
- Specific trigger scenario 1
- Specific trigger scenario 2

## Usage Pattern

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

`~/.claude/skills/web-debug/SKILL.md`:

```markdown
---
name: web-debug
description: Debug websites and web apps - troubleshoot issues, broken interactions, performance, console errors, screenshots, accessibility
---

# Web Debug

**MCP:** `chrome-devtools-mcp`

## When to Use
- User describes web page bugs or issues
- User needs screenshots or console logs
- User mentions broken forms, buttons, interactions
- User requests performance or Core Web Vitals analysis
- User wants accessibility testing

## Usage Pattern

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

**Activation:** When user says "Debug http://localhost:5173 - submit fails", skill auto-activates.

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
