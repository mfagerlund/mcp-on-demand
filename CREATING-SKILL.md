# Creating a Claude Code Skill with MCP On Demand

## For Humans

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/main/CREATING-SKILL.md and create a screenshot skill that uses chrome-devtools-mcp
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

### Example: Screenshot Skill

**Ask the user where mcp-on-demand is installed** (or use known path if in context).

Create `~/.claude/skills/screenshot-mcp/SKILL.md`:

```markdown
---
name: screenshot-mcp
description: Take screenshots using chrome-devtools-mcp via MCP On Demand
license: MIT
---

# Screenshot Skill

This skill provides screenshot capabilities using chrome-devtools-mcp without permanent context pollution.

## When to Use

- User asks to take a screenshot of a URL
- Need to capture visual state of a web page
- Testing or documentation requires page captures

## How to Use

\```bash
# Ensure session manager is running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start chrome-devtools-mcp session
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp

# Use batch for efficiency
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"<target-url>"}},
  {"tool":"take_screenshot","args":{"filePath":"<output-path>"}}
]'

# Stop session
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```

## Available Tools

When you start the session, you'll receive tool definitions. Key tools:
- `new_page` - Open URL
- `take_screenshot` - Capture screenshot
- `click` - Click elements
- `get_page_content` - Get DOM snapshot

## Example Usage

Taking screenshot of localhost:

\```bash
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"http://localhost:5173"}},
  {"tool":"take_screenshot","args":{"filePath":"C:/screenshot.png"}}
]'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```
```

### Skill with Helper Script

For more complex skills, create helper scripts:

Create `~/.claude/skills/screenshot-mcp/scripts/screenshot.sh`:

```bash
#!/bin/bash
MCP_PATH="<mcp-on-demand-path>"
URL="$1"
OUTPUT="$2"

if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node "$MCP_PATH/src/session-manager.js" &
  sleep 2
fi

node "$MCP_PATH/src/session-cli.js" start chrome-devtools-mcp --no-show-tools
node "$MCP_PATH/src/session-cli.js" batch chrome-devtools-mcp "[
  {\"tool\":\"new_page\",\"args\":{\"url\":\"$URL\"}},
  {\"tool\":\"take_screenshot\",\"args\":{\"filePath\":\"$OUTPUT\"}}
]"
node "$MCP_PATH/src/session-cli.js" stop chrome-devtools-mcp

echo "Screenshot saved to $OUTPUT"
```

Then in SKILL.md:

```markdown
## How to Use

\```bash
bash ~/.claude/skills/screenshot-mcp/scripts/screenshot.sh <url> <output-path>
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

You can also explicitly invoke: `/skill screenshot-mcp`

### Other Skill Examples

**Web automation skill:**
```markdown
---
name: web-automation
description: Automate browser interactions via chrome-devtools-mcp
---

# Web Automation Skill

Navigate, click, fill forms, and extract data from web pages.

## When to Use

- User needs to interact with a web application
- Automated testing or scraping required
- Multi-step browser workflows

[Usage instructions with batch calls for complex workflows]
```

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-COMMAND.md](CREATING-COMMAND.md) - Create commands with MCP On Demand
