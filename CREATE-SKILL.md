# Create Skill

## For Humans

Create a skill (auto-activates based on context) that uses MCP On Demand.

**Example:**

```
Read https://raw.githubusercontent.com/mfagerlund/mcp-on-demand/refs/heads/master/CREATE-SKILL.md and create a web debugging skill using chrome-devtools-mcp
```

Use it naturally:
```
Debug http://localhost:5173 - submit button isn't working
```

## For LLMs

**Prerequisites:** [README.md](README.md) must be set up.

### Structure

Skills are directories in `~/.claude/skills/<skill-name>/`:

```
~/.claude/skills/<skill-name>/
  SKILL.md           # Required: metadata and instructions
  scripts/           # Optional: helper scripts
  LICENSE.txt        # Optional
```

### SKILL.md Format

```markdown
---
name: skill-name
description: Detailed description of when to use this skill
---

# Skill Name

## When to Use

- Scenario 1
- Scenario 2

## How to Use

Extract parameters from user's message.

Use session pattern from README.md: ensure session manager running → start → batch → stop.

Analyze and report findings.
```

### Example

Create `~/.claude/skills/web-debug/SKILL.md`:

```markdown
---
name: web-debug
description: Debug web UIs when user describes page issues, broken interactions, or needs screenshots/console analysis
---

# Web Debug Skill

## When to Use

- User describes web page issues
- User needs screenshots or console logs
- User mentions broken forms, buttons, or interactions

## How to Use

Extract URL from user's message.

Use chrome-devtools-mcp with batch:
[
  {"tool":"new_page","args":{"url":"$URL"}},
  {"tool":"take_screenshot","args":{"filePath":"debug.png"}},
  {"tool":"get_page_content","args":{}},
  {"tool":"get_console_logs","args":{}}
]

Follow session pattern from README.md. Analyze and provide specific findings.
```

**Activation:** Skill auto-activates when user says: "Debug http://localhost:5173 - submit fails"

No explicit invocation needed. The description determines when Claude activates the skill.
