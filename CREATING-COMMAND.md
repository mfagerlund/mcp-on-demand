# Creating a Claude Code Command with MCP On Demand

## For Humans

**What this does:** Creates a Claude Code command (invoked with `/command-name`) that uses MCP On Demand to access chrome-devtools-mcp capabilities without permanent context pollution.

**Example - Debug web UI command:**

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/master/CREATING-COMMAND.md and create a /debug-web-ui command that can investigate web pages using chrome-devtools-mcp
```

Then use it naturally:
```
/debug-web-ui In http://localhost:5173, debug why the submit button fails.
```

## For LLMs

**Prerequisites:** Read [README.md](README.md) to set up MCP On Demand if not already installed.

### Overview

Commands in Claude Code are markdown files in `~/.claude/commands/` that expand to full prompts when invoked with `/command-name`.

Users invoke commands with natural language - extract URLs, context, and intent from their message.

### Command File Structure

Create `~/.claude/commands/<command-name>.md`:

```markdown
---
description: Brief description of what this command does
---

# Command Name

Instructions for the LLM to execute based on user's natural language input.

Extract necessary information (URLs, paths, etc.) from the user's message.

\```bash
# Bash commands here
\```
```

### Example: Web UI Debug Command

**Ask the user where mcp-on-demand is installed** (or use known path if in context).

Create `~/.claude/commands/debug-web-ui.md`:

```markdown
---
description: Debug web UIs by capturing screenshots, page content, and console logs using chrome-devtools-mcp
---

# Debug Web UI Command

Investigate the web page described by the user. Extract the URL from their message.

Steps:
1. Extract URL from user's message
2. Open page in chrome-devtools-mcp
3. Capture screenshot
4. Get page content (DOM with element UIDs)
5. Get console logs
6. Analyze and report findings

\```bash
# Extract URL from user message (LLM handles this)
URL="<extracted-url>"

# Ensure session manager is running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start session
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp --no-show-tools

# Batch: open page, screenshot, get content and logs
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp "[
  {\"tool\":\"new_page\",\"args\":{\"url\":\"$URL\"}},
  {\"tool\":\"take_screenshot\",\"args\":{\"filePath\":\"debug-screenshot.png\"}},
  {\"tool\":\"get_page_content\",\"args\":{}},
  {\"tool\":\"get_console_logs\",\"args\":{}}
]"

# Stop session
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp

echo "Debug info captured for $URL"
echo "Screenshot: debug-screenshot.png"
echo "Analyzing page structure and console logs..."
\```

After executing, analyze the results:
- Review screenshot for visual issues
- Examine page content for the elements mentioned by user
- Check console logs for JavaScript errors
- Provide specific findings and recommendations
```

### Usage Examples

Natural language invocations:

```
/debug-web-ui In http://localhost:5173, debug why the submit button fails.
```

```
/debug-web-ui Check http://localhost:3000/form for layout issues
```

```
/debug-web-ui Investigate errors on https://myapp.com/dashboard
```

The LLM extracts the URL and context from the message.

### Key Patterns

1. **Natural language input** - Users describe what they want in plain English
2. **LLM extracts parameters** - Parse URL, paths, and context from message
3. **Check if session manager running** - Start if needed
4. **Use --no-show-tools** - Commands know what tools they need
5. **Use batch for efficiency** - Multiple tools in one call
6. **Analyze results** - Provide insights, not just raw data
7. **Stop session when done** - Clean up resources

### Other Command Examples

**Screenshot command:**
```markdown
---
description: Take a screenshot of a web page using chrome-devtools-mcp
---

# Screenshot Command

Capture a screenshot of the URL mentioned by the user.

Extract URL and optional output path from the user's message.

\```bash
URL="<extracted-url>"
OUTPUT="${output-path:-screenshot.png}"

if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp --no-show-tools
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp "[
  {\"tool\":\"new_page\",\"args\":{\"url\":\"$URL\"}},
  {\"tool\":\"take_screenshot\",\"args\":{\"filePath\":\"$OUTPUT\"}}
]"
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp

echo "Screenshot saved to $OUTPUT"
\```
```

Usage:
```
/screenshot Capture http://localhost:5173
/screenshot Take a screenshot of https://example.com and save to my-screenshot.png
```

**Test interaction command:**
```markdown
---
description: Test user interactions on a web page
---

# Test Interaction Command

Test the user interaction described in the message.

Extract URL and interaction steps from user's description.

\```bash
URL="<extracted-url>"

if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp

# First get page content to find element UIDs
node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp "[
  {\"tool\":\"new_page\",\"args\":{\"url\":\"$URL\"}},
  {\"tool\":\"get_page_content\",\"args\":{}}
]"

# Then execute interactions based on user's description
# (LLM identifies elements and builds appropriate click/type_text calls)

node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```
```

Usage:
```
/test-interaction On http://localhost:5173/form, fill in email and click submit
```

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-SKILL.md](CREATING-SKILL.md) - Create skills with MCP On Demand
- [CREATING-AGENT.md](CREATING-AGENT.md) - Create agents with MCP On Demand
