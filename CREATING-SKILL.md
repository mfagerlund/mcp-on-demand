# Creating a Claude Code Skill with MCP On Demand

## For Humans

**What this does:** Creates a Claude Code skill (reusable capability) that uses MCP On Demand to access chrome-devtools-mcp capabilities without permanent context pollution.

**Example - Web debugging skill:**

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/master/CREATING-SKILL.md and create a web debugging skill that can inspect pages, take screenshots, and analyze DOM using chrome-devtools-mcp
```

Then use it naturally when needed:
```
Debug http://localhost:5173 - the submit button isn't working
```

## For LLMs

**Prerequisites:** Read [README.md](README.md) to set up MCP On Demand if not already installed.

### Overview

Skills in Claude Code are reusable capabilities defined in `~/.claude/skills/<skill-name>/`.

Skills activate automatically when user requests match the skill's purpose. Users don't invoke skills explicitly - they describe what they need naturally.

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
- User describes issues with buttons, forms, or interactions
- User needs to inspect page structure or behavior
- User wants screenshots for visual verification
- User needs to analyze DOM or console errors

## How to Use

When user describes a web debugging need, extract the URL and issue from their message.

\```bash
# Extract from user's message (e.g., "Debug http://localhost:5173 - submit button fails")
URL="<extracted-url>"

# Ensure session manager is running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start chrome-devtools-mcp session
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp

# Batch: open page, capture debug info
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp "[
  {\"tool\":\"new_page\",\"args\":{\"url\":\"$URL\"}},
  {\"tool\":\"take_screenshot\",\"args\":{\"filePath\":\"debug.png\"}},
  {\"tool\":\"get_page_content\",\"args\":{}},
  {\"tool\":\"get_console_logs\",\"args\":{}}
]"

# Stop session when done
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```

After executing:
- Analyze screenshot for visual issues
- Examine page content to locate mentioned elements
- Check console logs for errors
- Provide specific findings and actionable recommendations
```

## Available Tools

When you start the session, you'll receive tool definitions. Key tools:
- `new_page` - Open URL in browser
- `take_screenshot` - Capture visual state
- `get_page_content` - Get DOM snapshot with element UIDs
- `click` - Click elements by UID
- `type_text` - Type into input fields
- `get_console_logs` - Get browser console output
- `evaluate_javascript` - Execute JS in page context

## Example Natural Language Triggers

Users might say:
- "Debug http://localhost:5173 - the submit button isn't working"
- "Check why the form validation fails on localhost:3000"
- "Investigate the layout issue on https://myapp.com/dashboard"
- "Take a screenshot of http://localhost:5173 and analyze the errors"

The skill should activate and extract necessary information from their message.

### Skill with Helper Script

For more complex workflows, create helper scripts:

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
  {\"tool\":\"get_page_content\",\"args\":{}},
  {\"tool\":\"get_console_logs\",\"args\":{}}
]"
node "$MCP_PATH/src/session-cli.js" stop chrome-devtools-mcp

echo "Debug info saved to $OUTPUT_DIR"
```

### Key Patterns

1. **Natural language activation** - Skill activates from user's description
2. **Extract from context** - Parse URL and issue from user's message
3. **Start with tool discovery** - First session start shows all tools
4. **Use batch for workflows** - Reduces overhead
5. **Analyze and report** - Provide insights, not just raw data
6. **Always stop session** - Clean up when done

### Skill Activation

Skills activate automatically when:
- User's message matches "When to Use" scenarios
- User describes a problem the skill can solve
- Claude Code determines the skill is relevant

Unlike commands, skills are NOT invoked explicitly - they work in the background.

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-COMMAND.md](CREATING-COMMAND.md) - Create commands with MCP On Demand
- [CREATING-AGENT.md](CREATING-AGENT.md) - Create agents with MCP On Demand
