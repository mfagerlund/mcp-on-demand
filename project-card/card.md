---
oneliner: HTTP session manager that loads MCP servers on-demand instead of keeping them in every context window
tags: [mcp, model-context-protocol, cli, nodejs, session-manager, daemon, claude-code, tooling]
stack: [Node.js, JavaScript]
generated: 2026-09-06
commit: f522d23
placeholder: true
---
Published npm package (mcp-on-demand, v0.7.1) that runs a background HTTP session manager so MCP servers can be started, called and stopped on demand rather than staying resident and burning context tokens. Ships a CLI (`mcp-on-demand start/call/batch/stop/list/status`), an auto-start daemon, and skill/command authoring docs for wiring it into Claude Code. Working and actively maintained.
