# Creating a Claude Code Skill with MCP On Demand

## For Humans

**What this does:** Creates a Claude Code skill (reusable capability) that uses MCP On Demand to access chrome-devtools-mcp capabilities without permanent context pollution.

**Example - Web debugging skill:**

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/main/CREATING-SKILL.md and create a web debugging skill that can inspect pages, take screenshots, and analyze DOM using chrome-devtools-mcp
```

**Prerequisites:** Read [README.md](README.md) first to set up MCP On Demand.

## For LLMs

### Overview

Skills in Claude Code are reusable capabilities defined in `~/.claude/skills/<skill-name>/`.

**Prerequisites:** Ensure mcp-on-demand is installed per [README.md](README.md).

### Skill Directory Structure

```
~/.claude/skills/<skill-name>/
  SKILL.md           # Skill metadata and instructions
  scripts/           # Optional helper scripts
  LICENSE.txt        # License (optional)
```

### SKILL.md Format

```markdown
---
name: skill-name
description: Brief description
license: MIT
---

# Skill Name

Detailed instructions for when and how to use this skill.

## When to Use

- Scenario 1
- Scenario 2

## How to Use

Step-by-step instructions with code examples.
```

### Example: Web Debugging Skill

**Ask the user where mcp-on-demand is installed** (or use known path if in context).

Create `~/.claude/skills/web-debug-mcp/SKILL.md`:

```markdown
---
name: web-debug-mcp
description: Debug web UIs using chrome-devtools-mcp via MCP On Demand
license: MIT
---

# Web Debugging Skill

This skill provides web UI debugging capabilities using chrome-devtools-mcp without permanent context pollution.

## When to Use

- User asks to debug a web page or UI
- Need to inspect page structure, elements, or behavior
- Capture screenshots for visual verification
- Extract DOM content or element information
- Test web application functionality

## How to Use

\```bash
# Ensure session manager is running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start chrome-devtools-mcp session
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp

# Example: Debug a page - screenshot + content
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"<target-url>"}},
  {"tool":"take_screenshot","args":{"filePath":"<output-path>"}},
  {"tool":"get_page_content","args":{}}
]'

# Stop session when done
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```

## Available Tools

When you start the session, you'll receive tool definitions. Key tools:
- `new_page` - Open URL in browser
- `take_screenshot` - Capture visual state
- `get_page_content` - Get DOM snapshot with element UIDs
- `click` - Click elements by UID
- `type_text` - Type into input fields
- `get_console_logs` - Get browser console output
- `evaluate_javascript` - Execute JS in page context

## Example Workflows

**Debug UI issue:**
\```bash
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"http://localhost:5173"}},
  {"tool":"get_page_content","args":{}},
  {"tool":"take_screenshot","args":{"filePath":"debug.png"}},
  {"tool":"get_console_logs","args":{}}
]'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```

**Test form interaction:**
\```bash
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"http://localhost:5173/form"}},
  {"tool":"get_page_content","args":{}},
  {"tool":"click","args":{"uid":"input-email"}},
  {"tool":"type_text","args":{"text":"test@example.com"}},
  {"tool":"click","args":{"uid":"submit-button"}},
  {"tool":"take_screenshot","args":{"filePath":"form-submitted.png"}}
]'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```
```

### Skill with Helper Script

For more complex skills, create helper scripts:

Create `~/.claude/skills/web-debug-mcp/scripts/debug-page.sh`:

```bash
#!/bin/bash
MCP_PATH="<mcp-on-demand-path>"
URL="$1"
OUTPUT_DIR="${2:-.}"

if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node "$MCP_PATH/src/session-manager.js" &
  sleep 2
fi

node "$MCP_PATH/src/session-cli.js" start chrome-devtools-mcp --no-show-tools
node "$MCP_PATH/src/session-cli.js" batch chrome-devtools-mcp "[
  {\"tool\":\"new_page\",\"args\":{\"url\":\"$URL\"}},
  {\"tool\":\"take_screenshot\",\"args\":{\"filePath\":\"$OUTPUT_DIR/screenshot.png\"}},
  {\"tool\":\"get_page_content\",\"args\":{}}
]"
node "$MCP_PATH/src/session-cli.js" stop chrome-devtools-mcp

echo "Debug info saved to $OUTPUT_DIR"
```

Then in SKILL.md:

```markdown
## How to Use

\```bash
bash ~/.claude/skills/web-debug-mcp/scripts/debug-page.sh <url> <output-dir>
\```
```

### Key Patterns

1. **Start with tool discovery** - First session start shows all tools
2. **Subsequent sessions can use --no-show-tools** - When restarting MCP
3. **Use batch for multi-step workflows** - Reduces overhead
4. **Check session manager status** - Start if not running
5. **Always stop session** - Clean up when done

### Skill Activation

Skills activate automatically when:
- User mentions the skill by name
- User's request matches the "When to Use" scenarios
- Claude Code determines the skill is relevant

You can also explicitly invoke: `/skill web-debug-mcp`

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-COMMAND.md](CREATING-COMMAND.md) - Create commands with MCP On Demand
