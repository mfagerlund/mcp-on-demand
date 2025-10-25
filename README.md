# MCP Wrapper

Dynamic MCP (Model Context Protocol) server wrapper that solves the **context pollution problem**.

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
node src/wrapper.js call chrome-devtools-mcp navigate '{"url": "https://example.com"}'

# Stop the MCP
node src/wrapper.js stop chrome-devtools-mcp
```

## Benefits

- ✅ **Zero context overhead** when MCP not in use
- ✅ **Dynamic loading** - activate only when needed
- ✅ **Skill integration** - skills can load their own MCPs
- ✅ **No config changes** - no Claude Code restarts required
- ✅ **Resource efficient** - MCPs run only when actively used

## Status

🚧 **Work in Progress** - Currently wrapping chrome-devtools-mcp as proof of concept.

## Architecture

```
┌─────────────┐
│   Skill     │  Activates skill
└──────┬──────┘
       │
       v
┌─────────────────┐
│  MCP Wrapper    │  Starts MCP server
└──────┬──────────┘
       │
       v
┌─────────────────┐
│  MCP Server     │  Runs in background
│ (chrome-dev-    │  Communicates via stdio
│  tools-mcp)     │
└─────────────────┘
```

## Future

- Support for any MCP server
- Automatic process lifecycle management
- Caching of tool definitions
- Skill-scoped MCP declarations
