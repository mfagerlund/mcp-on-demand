# Create Skill

## For Humans

Create a skill (auto-activates based on context) that uses MCP On Demand (assuming the MCP is installed and Claude Code knows where).

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
- MCP On Demand must be set up with `npm run setup`

### Installation Detection

MCP On Demand is **self-locating** via `~/.mcp-on-demand/installation.json`. You do NOT need to search for installation paths.

**To verify setup:**
```bash
test -f ~/.mcp-on-demand/installation.json && echo "Setup complete" || echo "Run: npm run setup"
```

**The installation.json contains:**
```json
{
  "installPath": "/actual/path/to/mcp-on-demand",
  "version": "0.1.0",
  "installedAt": "2025-10-25T..."
}
```

### MCP Configuration

**Target MCPs are configured in:** `~/.mcp-on-demand/mcp-configs.json`

Example:
```json
{
  "chrome-devtools-mcp": {
    "command": "node",
    "args": ["/absolute/path/to/chrome-devtools-mcp/build/src/index.js"]
  }
}
```

**If the target MCP is not configured:**
1. Ask user for the MCP installation path
2. Check if MCP needs building (TypeScript MCPs need `npm install && npm run build`)
3. Add configuration to `~/.mcp-on-demand/mcp-configs.json`

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

4. Configure in `~/.mcp-on-demand/mcp-configs.json`:
   ```json
   {
     "chrome-devtools-mcp": {
       "command": "node",
       "args": ["/absolute/path/to/chrome-devtools-mcp/build/src/index.js"]
     }
   }
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

**IMPORTANT:** Skills now use the portable `mcp-on-demand` command instead of hard-coded paths.

```markdown
---
name: skill-name
description: Detailed description of when to use this skill. This determines auto-activation.
---

# Skill Name

## Configuration

**MCP On Demand:** Self-locating via `~/.mcp-on-demand/installation.json`

**MCP Name:** `target-mcp-name`

**Session Commands:**
\```bash
mcp-on-demand start target-mcp-name
mcp-on-demand call target-mcp-name <tool> <json>
mcp-on-demand stop target-mcp-name
\```

## When to Use

- Scenario 1 that triggers this skill
- Scenario 2 that triggers this skill
- Be specific - this determines auto-activation

## How to Use

Extract parameters from user's message.

**Start session:**
\```bash
mcp-on-demand start target-mcp-name
\```

**Execute operations:**
\```bash
mcp-on-demand call target-mcp-name tool-name '{"arg": "value"}'
\```

**Or batch operations:**
\```bash
mcp-on-demand batch target-mcp-name '[
  {"tool":"tool-name","args":{...}},
  {"tool":"tool-name","args":{...}}
]'
\```

**Stop session:**
\```bash
mcp-on-demand stop target-mcp-name
\```

Analyze and report findings with specific recommendations.
```

### Example Skill

Create `~/.claude/skills/web-debug/SKILL.md`:

```markdown
---
name: web-debug
description: Debug websites and web applications - troubleshoot page issues, broken interactions, analyze performance, inspect console errors, take screenshots, or test accessibility
---

# Web Debug Skill

## Configuration

**MCP On Demand:** Self-locating via `~/.mcp-on-demand/installation.json`

**MCP Name:** `chrome-devtools-mcp`

**Session Commands:**
\```bash
mcp-on-demand start chrome-devtools-mcp
mcp-on-demand call chrome-devtools-mcp <tool> <json>
mcp-on-demand stop chrome-devtools-mcp
\```

## When to Use

- User describes web page issues or bugs
- User needs screenshots or console logs
- User mentions broken forms, buttons, or interactions
- User requests performance analysis or Core Web Vitals
- User wants accessibility testing

## How to Use

Extract URL from user's message.

**Start session:**
\```bash
mcp-on-demand start chrome-devtools-mcp
\```

**Navigate and debug:**
\```bash
# Navigate to page
mcp-on-demand call chrome-devtools-mcp navigate_page '{"url":"$URL"}'

# Take snapshot to see DOM structure
mcp-on-demand call chrome-devtools-mcp take_snapshot '{}'

# Check console for errors
mcp-on-demand call chrome-devtools-mcp list_console_messages '{}'

# Take screenshot
mcp-on-demand call chrome-devtools-mcp take_screenshot '{"filePath":"./debug.png"}'
\```

**Or use batch for complex workflows:**
\```bash
mcp-on-demand batch chrome-devtools-mcp '[
  {"tool":"navigate_page","args":{"url":"$URL"}},
  {"tool":"take_snapshot","args":{}},
  {"tool":"list_console_messages","args":{}},
  {"tool":"take_screenshot","args":{"filePath":"./screenshot.png"}}
]'
\```

**Stop session:**
\```bash
mcp-on-demand stop chrome-devtools-mcp
\```

Analyze results and provide specific findings with screenshots and console output.
```

**Activation:** Skill auto-activates when user says: "Debug http://localhost:5173 - submit fails"

No explicit invocation needed. The description determines when Claude activates the skill.

### Key Changes from Old Format

**Old (hard-coded paths):**
```bash
node /home/user/projects/mcp-on-demand/src/session-cli.js start chrome-devtools-mcp
```

**New (portable):**
```bash
mcp-on-demand start chrome-devtools-mcp
```

**Benefits:**
- Works regardless of installation location
- No path discovery needed
- Skills are portable between machines
- Cleaner, simpler syntax

### Setup Verification

Before creating a skill, verify the system is ready:

```bash
# Check MCP On Demand is set up
test -f ~/.mcp-on-demand/installation.json && echo "✓ Setup complete" || echo "✗ Run: npm run setup"

# Check MCP is configured
cat ~/.mcp-on-demand/mcp-configs.json

# Test the command works
mcp-on-demand list
```

### Troubleshooting

**"mcp-on-demand: command not found"**
- Run `npm run setup` in the mcp-on-demand directory
- Or use the full path: `node <install-path>/bin/mcp-on-demand.js`

**"Session manager not running"**
- Start it: `mcp-on-demand manager &`
- Or it will auto-start on first tool use

**"Unknown MCP: xyz"**
- Add to `~/.mcp-on-demand/mcp-configs.json`
- Verify MCP installation and build status
