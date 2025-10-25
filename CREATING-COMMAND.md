# Creating a Claude Code Command with MCP On Demand

## For Humans

**What this does:** Creates a Claude Code command (invoked with `/command-name`) that uses MCP On Demand to access chrome-devtools-mcp capabilities without permanent context pollution.

**Example - Debug web UI command:**

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/main/CREATING-COMMAND.md and create a /debug-ui command that opens a URL, takes a screenshot, and gets the page content using chrome-devtools-mcp
```

**Prerequisites:** Read [README.md](README.md) first to set up MCP On Demand.

## For LLMs

### Overview

Commands in Claude Code are markdown files in `~/.claude/commands/` that expand to full prompts when invoked with `/command-name`.

**Prerequisites:** Ensure mcp-on-demand is installed per [README.md](README.md).

### Command File Structure

Create `~/.claude/commands/<command-name>.md`:

```markdown
---
description: Brief description of what this command does
---

# Command Name

Instructions for the LLM to execute.

\```bash
# Bash commands here
\```
```

### Example: Web UI Debug Command

**Ask the user where mcp-on-demand is installed** (or use known path if in context).

Create `~/.claude/commands/debug-ui.md`:

```markdown
---
description: Debug a web UI by capturing screenshot and page content using chrome-devtools-mcp
---

# Debug UI Command

Debug the web UI at the specified URL by capturing a screenshot and extracting page content.

Parameters:
- url: The URL to debug
- output: Path to save screenshot (optional, defaults to debug-screenshot.png)

\```bash
# Ensure session manager is running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start session (--no-show-tools since we know what we need)
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp --no-show-tools

# Batch: open page, screenshot, and get content
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"{{url}}"}},
  {"tool":"take_screenshot","args":{"filePath":"{{output:-debug-screenshot.png}}"}},
  {"tool":"get_page_content","args":{}}
]'

# Stop session
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp

echo "Debug info captured for {{url}}"
echo "Screenshot: {{output:-debug-screenshot.png}}"
\```
```

### Usage

```bash
/debug-ui url=http://localhost:5173
/debug-ui url=http://localhost:5173 output=C:/my-debug.png
```

### Key Patterns

1. **Check if session manager running** - Start if needed
2. **Use --no-show-tools** - Commands know what tools they need
3. **Use batch for efficiency** - Multiple tools in one call
4. **Stop session when done** - Clean up resources
5. **Use placeholders** - `{{parameter}}` gets replaced by user input
6. **Default values** - `{{output:-default.png}}` provides fallback

### Other Command Examples

**Screenshot only:**
```markdown
---
description: Take a screenshot of a URL using chrome-devtools-mcp
---

# Screenshot Command

Capture a screenshot of {{url}} and save to {{output}}.

\```bash
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp --no-show-tools
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"{{url}}"}},
  {"tool":"take_screenshot","args":{"filePath":"{{output}}"}}
]'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp

echo "Screenshot saved to {{output}}"
\```
```

**Navigate to URL:**
```markdown
---
description: Open a URL in chrome-devtools-mcp browser
---

# Navigate Command

Open {{url}} in the browser.

\```bash
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp --no-show-tools
node <mcp-on-demand-path>/src/session-cli.js call chrome-devtools-mcp new_page '{"url":"{{url}}"}'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```
```

**Click element:**
```markdown
---
description: Click an element on the current page
---

# Click Command

Click element with UID {{uid}}.

\```bash
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp --no-show-tools
node <mcp-on-demand-path>/src/session-cli.js call chrome-devtools-mcp click '{"uid":"{{uid}}"}'
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```
```

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-SKILL.md](CREATING-SKILL.md) - Create skills with MCP On Demand
