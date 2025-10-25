# Create Command

## For Humans

Create a command (invoked with `/command-name`) that uses MCP On Demand.

**Example:**

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/master/CREATE-COMMAND.md and create a /debug-web-ui command using chrome-devtools-mcp
```

Use it:
```
/debug-web-ui http://localhost:5173 - submit button fails
```

## For LLMs

**Prerequisites:** [README.md](README.md) must be set up.

### Structure

Commands are markdown files in `~/.claude/commands/<command-name>.md`:

```markdown
---
description: Brief description
---

# Command Name

Extract parameters from user's message (URLs, paths, etc.).

Use session pattern from README.md: ensure session manager running → start → batch → stop.

After executing, analyze and report findings.
```

### Example

Create `~/.claude/commands/debug-web-ui.md`:

```markdown
---
description: Debug web UIs using chrome-devtools-mcp
---

# Debug Web UI

Extract URL from user's message. Use chrome-devtools-mcp to capture screenshot, page content, and console logs.

Follow session pattern from README.md with batch:
[
  {"tool":"new_page","args":{"url":"$URL"}},
  {"tool":"take_screenshot","args":{"filePath":"debug.png"}},
  {"tool":"get_page_content","args":{}},
  {"tool":"get_console_logs","args":{}}
]

Analyze results and provide specific findings.
```

**Invocation:** `/debug-web-ui http://localhost:5173 - submit button fails`

The LLM extracts URL and context, follows the session pattern from README.md.
