# MCP On Demand

Dynamic MCP (Model Context Protocol) server loading - **zero context overhead when not in use**.

## The Problem

MCPs are powerful but have a critical limitation:
- All installed MCPs are **always in context**
- Large MCPs like chrome-devtools-mcp consume thousands of tokens
- You can't use many MCPs without exhausting your context budget
- Manually enabling/disabling MCPs in config requires restarts

## The Solution

**Load MCPs on demand** - start them when needed, get their tool definitions, call their tools, then shut them down.

## How It Works

1. **Start MCP**: Launch the MCP server process (e.g., chrome-devtools-mcp)
2. **Get Tools**: Query the MCP for its tool list and schemas
3. **Inject Context**: Provide tool definitions only when the MCP is active
4. **Call Tools**: Execute tools via JSON-RPC
5. **Cleanup**: Shut down the MCP when done

## Usage

```bash
# Start chrome-devtools-mcp and get its tool definitions
node src/wrapper.js start chrome-devtools-mcp

# Call a tool
node src/wrapper.js call chrome-devtools-mcp navigate_page '{"url": "https://example.com"}'
```

## Benefits

- ✅ **Zero context overhead** when MCP not in use
- ✅ **Dynamic loading** - activate only when needed
- ✅ **Skill integration** - skills can load their own MCPs
- ✅ **No config changes** - no Claude Code restarts required
- ✅ **Resource efficient** - MCPs run only when actively used

## Status

🚧 **Proof of Concept** - Successfully tested with chrome-devtools-mcp (26 tools).

## Architecture

```
┌─────────────┐
│   Skill     │  Activates skill
└──────┬──────┘
       │
       v
┌─────────────────┐
│ MCP On Demand   │  Starts MCP server
└──────┬──────────┘
       │
       v
┌─────────────────┐
│  MCP Server     │  Runs as needed
│ (chrome-dev-    │  Communicates via stdio
│  tools-mcp)     │
└─────────────────┘
```

## Future

- Generic MCP configuration for any server
- Automatic process lifecycle management
- Tool definition caching
- Skill-scoped MCP declarations
- Background process management

## Token Economics

**Before MCP On Demand:**
- chrome-devtools-mcp: ~5000 tokens permanently in context
- 5-10 MCPs: 25,000+ tokens constantly wasted
- Context exhaustion on complex tasks

**With MCP On Demand:**
- 0 tokens when not in use
- Full tool access when needed
- Use as many MCPs as you want!
