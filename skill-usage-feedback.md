# Skill Usage Feedback: web-debug

**Skill Location:** `C:\Users\matti\.claude\skills\web-debug`

**Test Date:** 2025-10-25

**Task:** Debug a webpage to check if all buttons have IDs

---

## What Worked Well ✅

### 1. Core Functionality
- **Session manager started smoothly** after dependencies were installed
- **Tool calling via curl** worked perfectly with both inline JSON and file-based JSON (`-d @file.json`)
- **Chrome DevTools MCP integration** was seamless - all 27 tools were available as documented
- **JSON responses** were clear and well-structured with success/error states
- **Background process** ran stably throughout the entire debugging session

### 2. Tool Execution
- `navigate_page` - Worked flawlessly to load the target URL
- `evaluate_script` - Successfully executed JavaScript in browser context multiple times
- **No crashes or hangs** - the system remained responsive throughout

### 3. Documentation Quality
- Tool categories were clearly organized (Input, Navigation, Emulation, Performance, Network, Debugging)
- Example curl commands were accurate and worked as-is
- File paths were correct and verified

---

## Critical Finding: I Missed the mcp-call.js Script! ⚠️

**Important:** During my testing, I used curl directly and encountered JSON escaping issues. However, **mcp-on-demand already includes a `scripts/mcp-call.js` helper** that solves exactly this problem!

The script supports:
- File-based scripts: `node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js`
- Stdin: `echo "() => document.title" | node scripts/mcp-call.js chrome-devtools-mcp evaluate_script`
- CLI args: `node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com`
- Automatic JSON escaping
- Configurable host/port via `MCP_HOST` and `MCP_PORT` env vars

**This invalidates much of my JSON escaping complaints below.** The real issue is that:
1. The skill documentation doesn't mention this script exists
2. All examples in the skill docs use curl directly
3. I didn't discover it until after completing the task

**Recommendation:** Update skill docs to prominently feature `mcp-call.js` as the primary interface, with curl as a fallback for advanced users.

---

## What Didn't Work / Pain Points ❌

### 1. Missing Prerequisites
**Issue:** The skill doesn't mention that dependencies need to be installed first.

**What happened:**
```bash
node C:/Dev/mcp-on-demand/src/session-manager.js
# Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@modelcontextprotocol/sdk'
```

**Fix required:**
```bash
cd C:/Dev/mcp-on-demand && npm install
```

**Suggestion:** Add a "Prerequisites" section to the skill documentation that explains:
- Run `npm install` in the mcp-on-demand directory before first use
- Verify Node.js version compatibility

### 2. No Startup Verification Guidance
**Issue:** No guidance on how to verify the session manager is running before attempting to use it.

**What I did:**
```bash
sleep 2 && curl http://127.0.0.1:9876 -X POST -H "Content-Type: application/json" -d '{"action":"list"}'
```

**Suggestion:** Add a "Verifying the Session Manager" section with:
- Expected response when running correctly: `{"success":true,"sessions":[]}`
- How long to wait before the server is ready (~2-3 seconds)
- What to do if port 9876 doesn't respond

### 3. Cleanup/Shutdown Instructions Missing
**Issue:** The skill shows how to stop individual MCP sessions but not the session manager itself.

**Questions left unanswered:**
- How do I gracefully shut down the session manager?
- Should I kill the background process? Use Ctrl+C? Is there a shutdown endpoint?
- What happens to active sessions when the session manager stops?

**Suggestion:** Add a "Cleanup" section explaining:
- How to stop the session manager
- Whether it needs manual cleanup or auto-terminates
- Best practices for session lifecycle management

### 4. JSON Escaping Issues
**Issue:** Complex JavaScript in inline JSON required escaping that caused errors initially.

**What failed:**
```bash
curl ... -d '{"args":{"function":"() => { ... }"}}'  # JSON escaping hell
```

**What worked:**
```bash
# Using file-based JSON payload
curl ... -d @C:/Dev/check-buttons.json
```

**Suggestion:** Add examples of:
- File-based JSON payloads for complex scripts (this is a best practice anyway)
- A note that complex JavaScript should use the file approach to avoid escaping issues

---

## Missing Documentation Elements

### 1. Troubleshooting Section
Should include:
- What if port 9876 is already in use?
- What if Chrome fails to launch?
- What if a tool call times out?
- Common error messages and their solutions

### 2. Error Handling Examples
Show examples of:
- What error responses look like
- How to handle tool call failures
- Retry strategies

### 3. Background Process Management
Clarify:
- That the session manager needs to run in background
- How to check if it's still running
- How to view its logs/output
- Resource usage expectations

### 4. Session Lifecycle
Explain:
- When to start/stop sessions
- Can multiple sessions run concurrently?
- Session timeout behavior
- Memory/resource cleanup

---

## Suggestions for Improvement

### Quick Wins:
1. **Add a "Quick Start" checklist** at the top:
   ```markdown
   - [ ] Run `npm install` in mcp-on-demand directory
   - [ ] Start session manager: `node src/session-manager.js` (background)
   - [ ] Verify running: `curl http://127.0.0.1:9876 -X POST ...`
   - [ ] Start MCP session: `curl ... {"action":"start",...}`
   ```

2. **Add a "Common Patterns" section** showing:
   - File-based JSON for complex scripts
   - Batch operations workflow
   - Typical debugging session flow

3. **Add expected timing information**:
   - Session manager startup: ~2-3 seconds
   - Chrome launch: ~3-5 seconds
   - Typical tool call response: <1 second

### Nice-to-Haves:
1. Example of using the `batch` action (it's mentioned but not demonstrated)
2. Performance considerations (when to batch vs. individual calls)
3. Integration examples with Claude Code workflows
4. Screenshots or expected output examples

---

## Overall Assessment

**Rating: 8/10**

The MCP-on-demand architecture is excellent and worked reliably once set up. The main issues are documentation gaps around prerequisites and lifecycle management rather than technical problems with the implementation.

**Would I use it again?** Absolutely. Once running, it was smooth and powerful.

**Biggest improvement needed:** Prerequisites and setup verification steps in the skill documentation.

---

## Follow-up Questions for Refinement

### Technical Implementation:
1. **Port configuration**: Is port 9876 hardcoded or configurable? If configurable, where is that documented?

   **Answer:** I didn't see any configuration options in the skill docs. It appears hardcoded to 9876. Would be useful to know if it's configurable via environment variable or config file.

2. **Chrome instance management**:
   - Does the session manager launch a new Chrome instance or connect to an existing one?
   - Can you configure Chrome launch flags (e.g., headless mode, custom user data dir)?
   - What happens if Chrome is already running?

   **Answer:** The chrome-devtools-mcp docs mention it auto-launches Chrome and uses a persistent profile at `%HOMEPATH%/.cache/chrome-devtools-mcp/chrome-profile-stable`. It appeared to launch a new visible Chrome window. I didn't see configuration options for headless mode or custom launch flags in the skill docs.

3. **Concurrent sessions**:
   - The document mentions session IDs - can multiple debugging sessions run simultaneously?
   - Are there resource limits (max sessions, memory caps)?
   - Can one session interfere with another?

   **Answer:** I only ran one session (chrome-devtools-mcp). The session manager responded with `{"success":true,"sessions":[]}` initially, suggesting it can track multiple sessions, but I didn't test concurrent usage. No resource limits mentioned in docs.

4. **Tool call batching**:
   - The `batch` action is mentioned but not demonstrated - can you provide a real-world example?
   - What's the practical difference in performance between batched and individual calls?
   - Are batched calls atomic (all succeed or all fail)?

   **Answer:** I didn't use batching - made individual calls for navigate + evaluate_script separately. Would have been useful to batch them. Example from the docs shows structure but not real-world use case or error handling behavior.

### User Experience:
5. **Error recovery**:
   - If a tool call fails mid-session, can you retry or is the session corrupted?
   - What's the recommended approach when Chrome crashes during a session?

   **Answer:** I had one JSON parsing error (my fault with escaping), but the session remained functional - I just retried with corrected JSON. Session state appeared resilient. No Chrome crashes encountered.

6. **Development workflow**:
   - How did you discover which tools were available? Trial and error, or is there documentation?
   - Did you use the actual MCP chrome-devtools docs, or just the skill docs?

   **Answer:** The skill docs list all 27 tools with descriptions. Starting the session with `"showTools":true` returned full tool schemas in JSON, which was very helpful. Used only the skill docs + the tool schema response.

7. **File-based JSON payloads**:
   - Where did you save `C:/Dev/check-buttons.json`? Does location matter?
   - Should this be a recommended best practice in the docs for all complex operations?

   **Answer:** Saved in `C:/Dev/` (my working directory). Location doesn't matter as long as curl can access it. **Strong recommendation:** File-based JSON should be documented as the primary approach for complex scripts, with inline JSON only for simple cases.

### Documentation Gaps:
8. **Platform differences**:
   - You're on Windows (MSYS_NT) - did you encounter any platform-specific issues?
   - Should the skill docs have separate instructions for Windows/Mac/Linux?

   **Answer:** Paths worked fine with forward slashes (`C:/Dev/...`) in MSYS/Git Bash. No platform-specific issues. The skill docs already use forward slashes which is good cross-platform practice.

9. **Node.js version**:
   - What Node.js version were you using?
   - Should there be a minimum version requirement documented?

   **Answer:** Node.js v22.20.0. Yes, minimum version should be documented - the MCP SDK likely has specific requirements.

10. **Real-world debugging session**:
    - How long did the entire debugging task take (from cold start to results)?
    - How many tool calls did you make in total?
    - Did you need to refer to external MCP chrome-devtools documentation?

    **Answer:**
    - **Cold start to results:** ~3-4 minutes (including npm install, troubleshooting, multiple script iterations)
    - **Tool calls:** 4 total (1x navigate_page, 3x evaluate_script with different queries)
    - **External docs:** No, only used skill docs and the tool schema from the start response

### Skill Design Philosophy:
11. **Skill activation**:
    - You mentioned the skill "activates when user mentions URLs, localhost, web pages..."
    - Did Claude Code automatically suggest using this skill, or did you invoke it manually?
    - Should skills be more proactive in self-advertising their capabilities?

    **Answer:** User explicitly invoked the skill with the "debug" command. The skill description says it should be used "when the user wants to debug websites" - in this case the user said "debug https://..." so it was a clear match. Proactive suggestion would be nice but might be noisy.

12. **Integration with Claude Code**:
    - Did you use this skill through Claude Code's agent, or directly via curl?
    - If through Claude Code, how was the experience different from manual curl usage?
    - Should the skill docs focus more on Claude Code integration vs. standalone usage?

    **Answer:** Used through Claude Code - I read the skill docs and then executed curl commands via the Bash tool. The skill docs are written for direct curl usage, which worked well. Claude Code's ability to run bash commands made it seamless. Docs should show both patterns.

### Missing Context:
13. **The actual task results**:
    - Did you successfully identify which buttons lacked IDs?
    - How many buttons were checked?
    - Was the JavaScript evaluation result easy to parse and act on?

    **Answer:**
    - **Yes**, successfully identified all buttons and their ID status
    - **5 buttons found** (2 with IDs, 3 without)
    - **JSON parsing:** Very easy - the evaluate_script tool returns clean JSON that I could immediately analyze

14. **Session manager output**:
    - What did the session manager log to console while running?
    - Were those logs helpful for debugging?
    - Should log verbosity be configurable?

    **Answer:** Session manager output was minimal and helpful:
   ```
   Session manager running on http://127.0.0.1:9876
   PID: 14484
   Session info: C:\Users\matti\.mcp-on-demand\session.json

   chrome-devtools-mcp exposes content of the browser instance to the MCP clients allowing them to inspect,
   debug, and modify any data in the browser or DevTools.
   Avoid sharing sensitive or personal information that you do not want to share with MCP clients.
   ```
   Clean, informative startup messages. Security warning is appreciated. No verbose logging during operation which is good for background usage.

15. **Comparison to alternatives**:
    - How does this compare to using Chrome DevTools directly, or Puppeteer?
    - What's the unique value proposition of the MCP approach for web debugging?

    **Answer:**
    - **vs Chrome DevTools:** More scriptable/automatable, can integrate into workflows, but less visual
    - **vs Puppeteer:** Similar capability, but MCP provides standardized interface and doesn't require writing a Node.js script
    - **Unique value:** The MCP-on-demand session manager acts as a universal adapter - you can swap chrome-devtools-mcp for any other MCP server without changing your workflow. That's powerful.

---

## Solution: JSON Escaping Helper Script

The biggest usability pain point was JSON escaping for complex JavaScript. Here's a proposed solution:

### Option 1: Helper Script for Inline Payloads

Create `mcp-on-demand/scripts/call-tool.js`:

```javascript
#!/usr/bin/env node
// Usage: node scripts/call-tool.js <mcpName> <toolName> [scriptFile]

const http = require('http');
const fs = require('fs');

const [mcpName, toolName, scriptFile] = process.argv.slice(2);

if (!mcpName || !toolName) {
  console.error('Usage: call-tool.js <mcpName> <toolName> [scriptFile]');
  process.exit(1);
}

let functionCode;
if (scriptFile) {
  functionCode = fs.readFileSync(scriptFile, 'utf8');
} else {
  // Read from stdin
  functionCode = fs.readFileSync(0, 'utf8');
}

const payload = JSON.stringify({
  action: 'call',
  mcpName: mcpName,
  toolName: toolName,
  args: {
    function: functionCode
  }
});

const options = {
  hostname: '127.0.0.1',
  port: 9876,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
```

**Usage:**
```bash
# From file
node scripts/call-tool.js chrome-devtools-mcp evaluate_script my-script.js

# From stdin
echo "() => document.title" | node scripts/call-tool.js chrome-devtools-mcp evaluate_script

# Inline heredoc
node scripts/call-tool.js chrome-devtools-mcp evaluate_script <<'EOF'
() => {
  const buttons = document.querySelectorAll('button');
  return Array.from(buttons).map(b => ({ id: b.id, text: b.textContent }));
}
EOF
```

### Option 2: Enhanced Session Manager with Script Support

Add a new action type to the session manager itself:

```json
{
  "action": "call-with-script",
  "mcpName": "chrome-devtools-mcp",
  "toolName": "evaluate_script",
  "scriptPath": "./scripts/check-buttons.js"
}
```

The session manager would:
1. Read the script file
2. Automatically wrap it in the correct args structure
3. Handle JSON escaping internally
4. Make the tool call

### Option 3: Template System

Create `mcp-on-demand/templates/evaluate_script.json`:

```json
{
  "action": "call",
  "mcpName": "{{MCP_NAME}}",
  "toolName": "evaluate_script",
  "args": {
    "function": "{{SCRIPT}}"
  }
}
```

Helper script that does variable substitution:

```bash
#!/bin/bash
# scripts/mcp-eval.sh
MCP_NAME="$1"
SCRIPT_FILE="$2"
SCRIPT=$(cat "$SCRIPT_FILE" | jq -Rs .)  # Reads file, escapes as JSON string

cat templates/evaluate_script.json | \
  sed "s|{{MCP_NAME}}|$MCP_NAME|g" | \
  jq --arg script "$SCRIPT" '.args.function = $script' | \
  curl -X POST -H "Content-Type: application/json" -d @- http://127.0.0.1:9876
```

**Usage:**
```bash
./scripts/mcp-eval.sh chrome-devtools-mcp check-buttons.js
```

### Option 4: Auto-detect Script Files

Enhance the session manager to auto-detect when args contain file paths:

```json
{
  "action": "call",
  "mcpName": "chrome-devtools-mcp",
  "toolName": "evaluate_script",
  "args": {
    "function": "file://./scripts/check-buttons.js"
  }
}
```

When the session manager sees `file://` prefix, it automatically reads and escapes the file content.

### Recommendation

**Implement Option 4** (auto-detect) + **Option 1** (helper script) together:

1. **Option 4** makes the session manager smarter for all use cases
2. **Option 1** provides a CLI tool for quick one-offs
3. Both avoid JSON escaping hell entirely
4. Keeps the API clean and doesn't break existing usage

This would make the most common pain point (complex JavaScript) trivial to handle.
