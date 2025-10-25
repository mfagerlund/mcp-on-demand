# Create Skill

## For Humans

Create a skill (auto-activates based on context) that uses MCP On Demand (assuming the MCP is installed and Calude Code knows where).

**Example:**

```
Read https://raw.githubusercontent.com/mfagerlund/mcp-on-demand/refs/heads/master/CREATE-SKILL.md and create a web debugging skill using chrome-devtools-mcp
```

Use it naturally:
```
Debug http://localhost:5173 - submit button isn't working
```

**Note:** The MCP should already be installed before creating the skill. See "Installing an MCP" section below for reference.

## For LLMs

**Prerequisites:**
- [README.md](README.md) must be set up
- The target MCP must already be installed on the system

### CRITICAL: Path Discovery

Before creating the skill, you MUST:

1. **Find mcp-on-demand installation path**:
   - Check if already installed: search for `session-manager.js` or `session-cli.js`
   - If not found, ask user: "Where is mcp-on-demand installed?"
   - Store this as `<mcp-on-demand-path>`

2. **Find target MCP installation path**:
   - The requested MCP should already be installed
   - Ask user: "Where is <mcp-name> installed?"
   - Store this as `<target-mcp-path>`

3. **Verify configuration**:
   - Check `<mcp-on-demand-path>/src/session-manager.js` for MCP_CONFIGS
   - If the target MCP is not configured, add it with the correct path

**DO NOT create the skill until you have ACTUAL, REAL paths** (not placeholders like `<mcp-on-demand-path>`).

### Installing an MCP (Reference Only)

This section is for informational purposes only. The MCP should already be installed before you create a skill.

**Example: Installing chrome-devtools-mcp**

If you needed to install chrome-devtools-mcp, you would:

1. Clone the repository:
   ```bash
   cd /path/to/your/mcps/folder
   git clone https://github.com/ChromeDevTools/chrome-devtools-mcp.git
   cd chrome-devtools-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build (if required):
   ```bash
   npm run build
   ```

4. Configure in `mcp-on-demand/src/session-manager.js`:
   ```javascript
   const MCP_CONFIGS = {
     'chrome-devtools-mcp': {
       command: 'node',
       args: ['/path/to/your/mcps/folder/chrome-devtools-mcp/build/index.js'],
       env: {}
     }
   };
   ```

**However, for creating skills, assume the MCP is already installed and configured.**

### Structure

Skills are directories in `~/.claude/skills/<skill-name>/`:

```
~/.claude/skills/<skill-name>/
  SKILL.md           # Required: metadata and instructions
  scripts/           # Optional: helper scripts
  LICENSE.txt        # Optional
```

### SKILL.md Format

The generated SKILL.md MUST include a "Configuration" section with ACTUAL paths:

```markdown
---
name: skill-name
description: Detailed description of when to use this skill
---

# Skill Name

## Configuration

**MCP On Demand Path:** /actual/path/to/mcp-on-demand
**Target MCP Path:** /actual/path/to/target-mcp
**MCP Name:** target-mcp-name

**Session Manager:**
```bash
node /actual/path/to/mcp-on-demand/src/session-manager.js
```

**Ensure session manager is running:**
```bash
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node /actual/path/to/mcp-on-demand/src/session-manager.js &
  sleep 2
fi
```

## When to Use

- Scenario 1
- Scenario 2

## How to Use

Extract parameters from user's message.

**Start session:**
```bash
node /actual/path/to/mcp-on-demand/src/session-cli.js start target-mcp-name
```

**Execute batch:**
```bash
node /actual/path/to/mcp-on-demand/src/session-cli.js batch target-mcp-name '[
  {"tool":"tool-name","args":{...}},
  {"tool":"tool-name","args":{...}}
]'
```

**Stop session:**
```bash
node /actual/path/to/mcp-on-demand/src/session-cli.js stop target-mcp-name
```

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

## Configuration

**MCP On Demand Path:** /home/user/projects/mcp-on-demand
**Target MCP Path:** /home/user/mcps/chrome-devtools-mcp
**MCP Name:** chrome-devtools-mcp

**Ensure session manager is running:**
```bash
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node /home/user/projects/mcp-on-demand/src/session-manager.js &
  sleep 2
fi
```

## When to Use

- User describes web page issues
- User needs screenshots or console logs
- User mentions broken forms, buttons, or interactions

## How to Use

Extract URL from user's message.

**Start session:**
```bash
node /home/user/projects/mcp-on-demand/src/session-cli.js start chrome-devtools-mcp
```

**Execute batch:**
```bash
node /home/user/projects/mcp-on-demand/src/session-cli.js batch chrome-devtools-mcp '[
  {"tool":"new_page","args":{"url":"$URL"}},
  {"tool":"take_screenshot","args":{"filePath":"debug.png"}},
  {"tool":"get_page_content","args":{}},
  {"tool":"get_console_logs","args":{}}
]'
```

**Stop session:**
```bash
node /home/user/projects/mcp-on-demand/src/session-cli.js stop chrome-devtools-mcp
```

Analyze results and provide specific findings with screenshots and console output.
```

**Activation:** Skill auto-activates when user says: "Debug http://localhost:5173 - submit fails"

No explicit invocation needed. The description determines when Claude activates the skill.
