# Recommendations for mcp-on-demand Team

**Date:** 2025-10-25
**Based on:** Real-world usage testing the web-debug skill with chrome-devtools-mcp
**Tester:** Claude Code AI assistant
**Task:** Debugging webpage to check button IDs

---

## Executive Summary

mcp-on-demand works well once set up, but has significant **discoverability and documentation issues**. The architecture is solid, but users will struggle without better docs and easier interfaces.

**Key Issues:**
1. Skill docs don't mention `mcp-call.js` helper script exists
2. Prerequisites (npm install) not documented
3. JSON escaping makes direct curl usage painful
4. Response format is deeply nested and hard to parse
5. No guidance on session lifecycle management

**Rating:** 8/10 for functionality, 5/10 for documentation

---

## Priority 1: Critical Documentation Fixes

### 1.1 Add Prerequisites Section to All Skills

**Current state:** Skills assume dependencies are installed
**What happened:** First run failed with `ERR_MODULE_NOT_FOUND`

**Add to skill documentation:**

```markdown
## Prerequisites

Before using this skill:

1. **Install dependencies** (first time only):
   ```bash
   cd C:/Dev/mcp-on-demand
   npm install
   ```

2. **Verify Node.js version:**
   - Required: Node.js v18+ (tested with v22.20.0)
   - Check: `node --version`

3. **Verify session manager starts:**
   ```bash
   node src/session-manager.js &
   sleep 2
   curl http://127.0.0.1:9876 -X POST -H "Content-Type: application/json" -d '{"action":"list"}'
   # Expected: {"success":true,"sessions":[]}
   ```
```

### 1.2 Feature mcp-call.js as Primary Interface

**Current state:** All examples use curl directly
**What happened:** I didn't discover `scripts/mcp-call.js` until after completing the task

**Update skill docs to show mcp-call.js FIRST:**

```markdown
## Usage

### Recommended: Using mcp-call.js Helper

The easiest way to call MCP tools is using the provided helper script:

```bash
# Navigate to a page
node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com

# Run JavaScript from file (no escaping needed!)
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script check-buttons.js

# Run JavaScript from stdin
echo "() => document.title" | node scripts/mcp-call.js chrome-devtools-mcp evaluate_script

# Run JavaScript from heredoc
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script <<'EOF'
() => {
  const buttons = document.querySelectorAll('button');
  return Array.from(buttons).length;
}
EOF
```

### Advanced: Direct curl Usage

For advanced users or automation, you can call the session manager directly with curl:
[... existing curl examples ...]
```

### 1.3 Add Quick Start Checklist

Add at the top of every skill:

```markdown
## Quick Start

- [ ] Run `npm install` in mcp-on-demand directory
- [ ] Start session manager: `node src/session-manager.js &`
- [ ] Verify: `curl http://127.0.0.1:9876 -X POST -d '{"action":"list"}'`
- [ ] Start MCP session: [see Starting the Session below]
- [ ] Call tools: Use `scripts/mcp-call.js` (recommended) or curl

**Estimated setup time:** 30 seconds (if dependencies installed), 2 minutes (first time)
```

---

## Priority 2: Improve mcp-call.js

### 2.1 Add Output Format Options

**Problem:** Response is deeply nested JSON with markdown

**Current response:**
```json
{
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# evaluate_script response\nScript ran on page and returned:\n```json\n5\n```"
      }
    ]
  }
}
```

**Solution:** Add `--format` flag to mcp-call.js:

```javascript
// Add to parseArgs()
const formatFlag = rest.find(arg => arg.startsWith('--format='));
const format = formatFlag ? formatFlag.split('=')[1] : 'json';

// Add to main()
if (format === 'raw') {
  // Extract just the result value
  const content = result.result?.content?.[0]?.text || '';
  const match = content.match(/```json\n(.*?)\n```/s);
  console.log(match ? JSON.parse(match[1]) : content);
} else if (format === 'text') {
  // Extract text content only
  console.log(result.result?.content?.[0]?.text || '');
} else {
  // Full JSON response (default)
  console.log(JSON.stringify(result, null, 2));
}
```

**Usage:**
```bash
# Full JSON (default)
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js

# Just the result value
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js --format=raw
# Output: 5

# Text content only
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js --format=text
# Output: Script ran on page and returned: 5
```

### 2.2 Add Batch Call Support

Add batch call capability to mcp-call.js:

```javascript
// scripts/mcp-batch.js
// Reads a batch file and executes multiple calls in sequence

// batch.txt:
// navigate_page --url https://example.com
// evaluate_script check-buttons.js
// take_screenshot --format png

// Usage: node scripts/mcp-batch.js chrome-devtools-mcp batch.txt
```

### 2.3 Create Shell Wrapper (mcp Command)

**Create:** `scripts/mcp` (bash wrapper)

```bash
#!/bin/bash
# Universal MCP caller with auto-start and clean output
# Usage: mcp <mcpName> <toolName> [args...]

set -e

MCP_NAME="$1"
TOOL_NAME="$2"
shift 2

# Auto-start session manager if not running
if ! curl -s http://127.0.0.1:9876/health >/dev/null 2>&1; then
  echo "Starting session manager..." >&2
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  node "$SCRIPT_DIR/../src/session-manager.js" &
  sleep 2
fi

# Read from stdin if available
SCRIPT=""
if [ ! -t 0 ]; then
  SCRIPT=$(cat)
fi

# Call mcp-call.js with raw format by default
if [ -n "$SCRIPT" ]; then
  node "$SCRIPT_DIR/mcp-call.js" "$MCP_NAME" "$TOOL_NAME" "$@" --format=raw <<< "$SCRIPT"
else
  node "$SCRIPT_DIR/mcp-call.js" "$MCP_NAME" "$TOOL_NAME" "$@" --format=raw
fi
```

Make executable: `chmod +x scripts/mcp`

**Usage:**
```bash
# Clean, natural CLI
mcp chrome-devtools-mcp navigate_page --url https://example.com

# With heredoc (zero escaping)
mcp chrome-devtools-mcp evaluate_script <<'EOF'
() => document.querySelectorAll('button').length
EOF
# Output: 5
```

---

## Priority 3: Session Manager Enhancements

### 3.1 Add file:// Protocol Support

**Problem:** Complex JavaScript requires JSON escaping or external files

**Solution:** Auto-read files when args contain `file://` prefix

```javascript
// In session-manager.js, before calling MCP tool:

function expandFileProtocol(args) {
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && value.startsWith('file://')) {
      const filePath = value.slice(7); // Remove 'file://'
      args[key] = fs.readFileSync(filePath, 'utf8');
    }
  }
  return args;
}

// Usage in tool call handler:
const expandedArgs = expandFileProtocol(args);
```

**Benefits:**
- Zero escaping needed
- Keep scripts in separate files (better organization)
- Works with existing curl/mcp-call.js usage

**Example:**
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

### 3.2 Add Health Check Endpoint

Add `GET /health` for checking if session manager is running:

```javascript
// In session-manager.js
if (req.method === 'GET' && req.url === '/health') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    pid: process.pid,
    uptime: process.uptime(),
    sessions: Object.keys(sessions).length
  }));
  return;
}
```

### 3.3 Add Graceful Shutdown Endpoint

Add `POST /shutdown` for clean session manager termination:

```javascript
if (req.method === 'POST' && parsedBody.action === 'shutdown') {
  // Stop all sessions
  for (const [mcpName, session] of Object.entries(sessions)) {
    await stopSession(mcpName);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Shutting down' }));

  // Exit gracefully after response sent
  setTimeout(() => process.exit(0), 100);
  return;
}
```

**Usage:**
```bash
curl http://127.0.0.1:9876 -X POST -d '{"action":"shutdown"}'
```

### 3.4 Add Session Status Endpoint

Add detailed session information:

```javascript
if (parsedBody.action === 'status') {
  const sessionInfo = Object.entries(sessions).map(([name, session]) => ({
    name,
    toolCount: session.tools?.length || 0,
    // Add more metadata as needed
  }));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    sessionManager: {
      pid: process.pid,
      uptime: process.uptime(),
      port: PORT
    },
    sessions: sessionInfo
  }));
  return;
}
```

---

## Priority 4: Documentation Improvements

### 4.1 Add Troubleshooting Section

Add to every skill:

```markdown
## Troubleshooting

### Session manager won't start
- **Check port availability:** `netstat -an | grep 9876` (macOS/Linux) or `netstat -an | findstr 9876` (Windows)
- **Already running?** Check: `curl http://127.0.0.1:9876 -X POST -d '{"action":"list"}'`
- **Dependencies missing?** Run: `npm install` in mcp-on-demand directory

### Chrome fails to launch (chrome-devtools-mcp)
- **Check Chrome installation:** Verify Chrome is installed and in PATH
- **Profile directory locked?** Close existing Chrome instances
- **Permissions issue?** Check `~/.cache/chrome-devtools-mcp/` permissions

### Tool call times out
- **Network issue?** Check if target URL is accessible
- **Page too complex?** Increase timeout in navigate_page
- **Chrome crashed?** Restart session: `{"action":"stop","mcpName":"chrome-devtools-mcp"}` then start again

### JSON parsing errors
- **Use mcp-call.js instead of curl** to avoid escaping issues
- **For curl users:** Save complex payloads to files and use `-d @file.json`
- **Check quotes:** Ensure proper escaping of nested JSON
```

### 4.2 Add Performance Guidelines

```markdown
## Performance Tips

**When to batch calls:**
- Multiple independent operations on same page
- Can save 200-500ms per avoided round trip
- Example: Navigate + screenshot in single batch

**When NOT to batch:**
- Operations depend on each other (use sequential calls)
- Different pages/sessions
- Long-running operations (batch has collective timeout)

**Expected timings:**
- Session manager startup: ~2-3 seconds
- Chrome launch (first time): ~3-5 seconds
- Chrome launch (warm): ~1-2 seconds
- Tool call (navigate_page): 1-3 seconds (depends on page)
- Tool call (evaluate_script): 50-200ms
- Tool call (take_screenshot): 200-500ms
```

### 4.3 Add Real-World Examples Section

```markdown
## Real-World Examples

### Example 1: Check All Buttons Have IDs
```bash
# Create script
cat > check-buttons.js <<'EOF'
() => {
  const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
  return Array.from(buttons).map(btn => ({
    tag: btn.tagName,
    id: btn.id || 'NO ID',
    text: btn.textContent.trim().substring(0, 50),
    hasId: !!btn.id
  }));
}
EOF

# Run check
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script check-buttons.js --format=raw
```

### Example 2: Performance Audit
```bash
# Start trace, load page, stop trace, analyze
node scripts/mcp-batch.js chrome-devtools-mcp <<'EOF'
{"tool":"performance_start_trace","args":{"reload":true,"autoStop":false}}
{"tool":"wait_for","args":{"text":"loaded"}}
{"tool":"performance_stop_trace","args":{}}
{"tool":"performance_analyze_insight","args":{"insightName":"LCPBreakdown"}}
EOF
```

### Example 3: Automated Accessibility Check
```bash
# Take snapshot and extract all elements missing alt text
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script <<'EOF'
() => {
  const images = document.querySelectorAll('img');
  return Array.from(images)
    .filter(img => !img.alt)
    .map(img => ({ src: img.src, location: img.getBoundingClientRect() }));
}
EOF
```
```

---

## Priority 5: Developer Experience

### 5.1 Add package.json Scripts

Make common operations easier:

```json
{
  "scripts": {
    "start": "node src/session-manager.js",
    "start:bg": "node src/session-manager.js &",
    "health": "curl http://127.0.0.1:9876 -X POST -d '{\"action\":\"list\"}'",
    "stop": "curl http://127.0.0.1:9876 -X POST -d '{\"action\":\"shutdown\"}'",
    "call": "node scripts/mcp-call.js",
    "example:chrome": "npm run call chrome-devtools-mcp navigate_page -- --url https://example.com"
  }
}
```

**Usage:**
```bash
npm start          # Start session manager (foreground)
npm run health     # Check status
npm run call -- chrome-devtools-mcp navigate_page --url https://example.com
npm stop           # Shutdown
```

### 5.2 Add TypeScript Definitions

For better IDE support:

```typescript
// types/mcp-on-demand.d.ts

export interface CallRequest {
  action: 'call';
  mcpName: string;
  toolName: string;
  args?: Record<string, any>;
}

export interface BatchRequest {
  action: 'batch';
  mcpName: string;
  toolCalls: Array<{
    tool: string;
    args?: Record<string, any>;
  }>;
}

export interface SessionResponse {
  success: boolean;
  mcpName?: string;
  toolCount?: number;
  message?: string;
  tools?: ToolDefinition[];
  error?: string;
}

export interface CallResponse {
  success: boolean;
  result?: {
    content: Array<{
      type: 'text' | 'image';
      text?: string;
      data?: string;
      mimeType?: string;
    }>;
  };
  error?: string;
}
```

### 5.3 Create Examples Directory

```
mcp-on-demand/
  examples/
    chrome-devtools/
      check-accessibility.js
      measure-performance.js
      find-broken-links.js
      extract-forms.js
    README.md
```

Each example should be runnable:
```bash
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/check-accessibility.js
```

---

## Summary of Recommendations

### Must Have (Priority 1):
1. ✅ Document npm install prerequisite
2. ✅ Feature mcp-call.js in all skill docs
3. ✅ Add Quick Start checklist to skills
4. ✅ Add `--format` flag to mcp-call.js

### Should Have (Priority 2):
5. ✅ Add `file://` protocol support to session manager
6. ✅ Create shell wrapper (`mcp` command)
7. ✅ Add health check endpoint
8. ✅ Add graceful shutdown endpoint

### Nice to Have (Priority 3):
9. ✅ Add troubleshooting section to docs
10. ✅ Add real-world examples
11. ✅ Add package.json scripts
12. ✅ Create examples directory

### Future Consideration:
13. TypeScript definitions for IDE support
14. Batch call helper script
15. Session persistence across restarts
16. WebSocket support for streaming responses

---

## Estimated Implementation Time

- **Priority 1 (Critical docs):** 2-4 hours
- **Priority 2 (mcp-call.js + session manager):** 4-6 hours
- **Priority 3 (Examples + docs):** 2-3 hours

**Total:** ~10-15 hours for significant UX improvement

---

## Testing Notes

All recommendations based on real-world testing:
- Platform: Windows 10 (MSYS_NT via Git Bash)
- Node.js: v22.20.0
- Task: Debug webpage for button IDs (5 buttons found, 3 missing IDs)
- Time: ~4 minutes from cold start to results
- Tool calls: 4 total (1 navigate, 3 evaluate_script iterations)
- Pain points: JSON escaping, finding mcp-call.js, no docs on prerequisites

The architecture is solid. With these improvements, mcp-on-demand will be much more discoverable and user-friendly.
