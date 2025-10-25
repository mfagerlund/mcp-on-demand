# Create Command

## For Humans

Create a command (invoked with `/command-name`) that uses MCP On Demand.

**Example:**

```
Read https://raw.githubusercontent.com/mfagerlund/mcp-on-demand/refs/heads/master/CREATE-COMMAND.md and create a /debug-web-ui command using chrome-devtools-mcp
```

Use it:
```
/debug-web-ui http://localhost:5173 - submit button fails
```

**Note:** The MCP should already be installed before creating the command. See "Installing an MCP" section below for reference.

## For LLMs

**Prerequisites:**
- [README.md](README.md) must be set up
- The target MCP must already be installed on the system

### CRITICAL: Path Discovery

Before creating the command, you MUST:

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

**DO NOT create the command until you have ACTUAL, REAL paths** (not placeholders like `<mcp-on-demand-path>`).

### Installing an MCP (Reference Only)

This section is for informational purposes only. The MCP should already be installed before you create a command.

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

**However, for creating commands, assume the MCP is already installed and configured.**

### Structure

Commands are markdown files in `~/.claude/commands/<command-name>.md`:

The generated command MUST include a "Configuration" section with ACTUAL paths:

```markdown
---
description: Brief description
---

# Command Name

## Configuration

**MCP On Demand Path:** /actual/path/to/mcp-on-demand
**Target MCP Path:** /actual/path/to/target-mcp
**MCP Name:** target-mcp-name

**Ensure session manager is running:**
```bash
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node /actual/path/to/mcp-on-demand/src/session-manager.js &
  sleep 2
fi
```

## Usage

Extract parameters from user's message (URLs, paths, etc.).

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

After executing, analyze and report findings.
```

### Example

Create `~/.claude/commands/debug-web-ui.md`:

```markdown
---
description: Debug web UIs using chrome-devtools-mcp
---

# Debug Web UI

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

## Usage

Extract URL from user's message. Use chrome-devtools-mcp to capture screenshot, page content, and console logs.

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

**Invocation:** `/debug-web-ui http://localhost:5173 - submit button fails`

The LLM extracts URL and context, executes the session pattern with the configured paths.
