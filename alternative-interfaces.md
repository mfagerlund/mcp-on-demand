# Alternative Interface Formats for mcp-on-demand

## Current State: JSON Everywhere

**Request:**
```json
{
  "action": "call",
  "mcpName": "chrome-devtools-mcp",
  "toolName": "evaluate_script",
  "args": {
    "function": "() => { return document.querySelectorAll('button').length; }"
  }
}
```

**Response:**
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

**Problems:**
- Escaping hell for complex scripts
- Response is triple-nested (JSON > content array > text with markdown JSON block)
- Not human-friendly in terminal
- Parsing overhead

---

## Alternative 1: Line-Based Protocol (like Redis)

**Request (newline-delimited):**
```
CALL chrome-devtools-mcp evaluate_script
SCRIPT
() => {
  return document.querySelectorAll('button').length;
}
END
```

**Response:**
```
OK
5
```

Or for errors:
```
ERROR Bad escaped character
```

**Pros:**
- No escaping needed for multi-line scripts
- Simple to parse (readline)
- Human-readable
- Minimal overhead

**Cons:**
- Need delimiter for multi-line content (END, EOF, etc.)
- Harder to represent complex nested structures
- Not self-describing

---

## Alternative 2: YAML (Structured but Human-Friendly)

**Request:**
```yaml
action: call
mcpName: chrome-devtools-mcp
toolName: evaluate_script
args:
  function: |
    () => {
      return document.querySelectorAll('button').length;
    }
```

**Response:**
```yaml
success: true
result: 5
```

**Pros:**
- No escaping for multi-line strings (using `|` or `>`)
- More readable than JSON
- Still structured
- Good library support

**Cons:**
- YAML parsing is slower than JSON
- Whitespace-sensitive (can be error-prone)
- Heavier dependency

---

## Alternative 3: Mixed Protocol (Structure + Raw)

Use JSON for structure but raw text for content:

**Request format:**
```
POST /call
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="action"
call

--boundary
Content-Disposition: form-data; name="mcpName"
chrome-devtools-mcp

--boundary
Content-Disposition: form-data; name="toolName"
evaluate_script

--boundary
Content-Disposition: form-data; name="script"

() => {
  return document.querySelectorAll('button').length;
}
--boundary--
```

**Response:**
```
Status: 200
Content-Type: text/plain

5
```

**Pros:**
- Zero escaping
- HTTP-standard approach
- Can stream responses
- Each part is raw text

**Cons:**
- More complex to implement
- Overhead of multipart encoding
- Overkill for simple requests

---

## Alternative 4: Separate Channels (My Recommendation)

Keep JSON for **control** but use **separate channels** for content:

**Session manager exposes multiple endpoints:**

### Control endpoint (JSON): `POST /control`
```json
{
  "action": "call",
  "mcpName": "chrome-devtools-mcp",
  "toolName": "evaluate_script",
  "scriptId": "temp-12345"
}
```

### Script upload (raw text): `POST /script`
```javascript
() => {
  return document.querySelectorAll('button').length;
}
```

**Returns:** `{"scriptId": "temp-12345"}`

### Result retrieval: `GET /result/call-67890`
**Returns raw text:**
```
5
```

Or for structured results, still JSON but flattened:
```json
{"count": 5, "type": "number"}
```

**Pros:**
- Zero escaping for scripts
- Clean separation of concerns
- Can cache/reuse scripts
- Results can be raw or structured as needed
- Streaming support for large results

**Cons:**
- Multiple HTTP requests
- More complex client implementation
- State management (scriptId lifecycle)

---

## Alternative 5: TOML (Config-Style)

**Request:**
```toml
action = "call"
mcpName = "chrome-devtools-mcp"
toolName = "evaluate_script"

[args]
function = '''
() => {
  return document.querySelectorAll('button').length;
}
'''
```

**Response:**
```toml
success = true
result = 5
```

**Pros:**
- Multi-line strings with `'''` (no escaping)
- More readable than JSON
- Good for config-like structures
- Gaining popularity (Rust ecosystem)

**Cons:**
- Less common than JSON/YAML
- Not as flexible for deeply nested structures
- Parsing libraries less mature

---

## Alternative 6: MessagePack (Binary)

Keep the JSON structure but use MessagePack binary encoding:

**Same logical structure as JSON, but binary serialization**

**Pros:**
- Faster than JSON
- Smaller payload
- No escaping issues (binary-safe)
- Schema-compatible with JSON

**Cons:**
- Not human-readable (can't curl and read)
- Debugging harder
- Requires msgpack libraries

---

## Alternative 7: Simple Shell Script Interface

Most radical: ditch HTTP entirely for local usage.

**Instead of:**
```bash
curl http://127.0.0.1:9876 -d @payload.json
```

**Do:**
```bash
mcp chrome-devtools-mcp evaluate_script <<'EOF'
() => {
  return document.querySelectorAll('button').length;
}
EOF
```

The `mcp` script:
1. Starts session manager if not running
2. Handles all protocol details internally
3. Returns clean output (just the result)
4. Uses Unix pipes/heredocs for content

**Example implementation:**
```bash
#!/bin/bash
# mcp <mcpName> <toolName> [args...]

MCP_NAME="$1"
TOOL_NAME="$2"
shift 2

# Read script from stdin if available
if [ ! -t 0 ]; then
  SCRIPT=$(cat)
fi

# Start session manager if not running
if ! curl -s http://127.0.0.1:9876/health >/dev/null 2>&1; then
  node "$(dirname "$0")/../src/session-manager.js" &
  sleep 2
fi

# Make the call
node "$(dirname "$0")/mcp-call.js" "$MCP_NAME" "$TOOL_NAME" "$@" <<< "$SCRIPT" | jq -r '.result.content[0].text'
```

**Usage:**
```bash
# Simple call
mcp chrome-devtools-mcp navigate_page --url https://example.com

# With script
mcp chrome-devtools-mcp evaluate_script <<'EOF'
() => document.title
EOF

# Pipe
echo "() => document.title" | mcp chrome-devtools-mcp evaluate_script
```

**Pros:**
- Zero escaping (heredocs are raw)
- Natural shell integration
- Auto-starts session manager
- Clean output by default
- Feels like a regular CLI tool

**Cons:**
- Platform-specific (bash)
- Abstracts away protocol details
- Less flexible than direct HTTP

---

## Recommendation: Hybrid Approach

**For the session manager HTTP interface:**
- Keep JSON for structure/control (it's the MCP standard)
- But add **file:// support** for content:

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

Session manager auto-reads and inlines the file (no escaping needed).

**For CLI usage:**
- Provide shell wrapper (Alternative 7) as primary interface
- Falls back to mcp-call.js
- Falls back to raw curl for advanced users

**For responses:**
- Add `--format` flag to mcp-call.js:
  - `--format=json` (default, full response)
  - `--format=text` (extract just the text content)
  - `--format=raw` (extract result value only)

Example:
```bash
# Full JSON response
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js

# Just the result
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js --format=raw
# Output: 5

# Just the text content
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script script.js --format=text
# Output: Script ran on page and returned: 5
```

This gives users choice without breaking existing functionality.
