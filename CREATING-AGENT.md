# Creating a Claude Code Agent with MCP On Demand

## For Humans

**What this does:** Creates a Claude Code agent (autonomous background worker) that uses MCP On Demand to access chrome-devtools-mcp capabilities with **ZERO context pollution** - agents run completely separately from your main conversation.

**Example - Web testing agent:**

In Claude Code, type:

```
Read https://github.com/mfagerlund/mcp-on-demand/blob/master/CREATING-AGENT.md and create a web-testing agent that can test web applications using chrome-devtools-mcp
```

Then launch it:
```
Launch web-testing agent to test http://localhost:5173 - verify the login form works correctly
```

**Why agents are powerful:** Agents run in their own context with their own tools. The MCP tools never appear in your main conversation - perfect for keeping your context clean while having powerful capabilities available.

## For LLMs

**Prerequisites:** Read [README.md](README.md) to set up MCP On Demand if not already installed.

### Overview

Agents in Claude Code are autonomous workers that run in separate contexts using the Task tool with `subagent_type`. They have their own tool access and don't pollute the main conversation context.

**Key advantage with MCP On Demand:**
- Agent context includes MCP tools
- Main conversation context stays clean
- Agent runs independently and reports back
- Perfect for long-running or complex MCP workflows

### Agent Pattern

Agents are launched via the Task tool and receive a prompt describing their task. Configure them to use MCP On Demand in their prompt.

### Example: Web Testing Agent

**Ask the user where mcp-on-demand is installed** (or use known path if in context).

When user requests web testing, launch an agent:

```python
# In your main conversation, use the Task tool:

Task(
  subagent_type="general-purpose",
  description="Test web application",
  prompt=f"""
You are a web testing agent with access to chrome-devtools-mcp via MCP On Demand.

Task: {user_request}

Instructions:
1. Extract URL and test requirements from the task description
2. Start MCP On Demand session manager if needed
3. Use chrome-devtools-mcp to test the application
4. Report findings

Setup:
\```bash
# Ensure session manager running
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

# Start chrome-devtools-mcp
node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
\```

Available tools from chrome-devtools-mcp:
- new_page - Open URLs
- get_page_content - Inspect DOM
- click, type_text - Interact with elements
- take_screenshot - Visual verification
- get_console_logs - Check for errors
- evaluate_javascript - Run custom checks

Test Workflow:
1. Open the application
2. Get page content to find elements
3. Execute test interactions
4. Capture screenshots
5. Check console for errors
6. Report pass/fail with evidence

Always stop the session when done:
\```bash
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```

Report Format:
- Test steps executed
- Screenshots captured (paths)
- Console errors found
- Pass/Fail status
- Recommendations
"""
)
```

### Example Invocations

User requests that trigger agent launch:

```
Launch web-testing agent to test http://localhost:5173 - verify the login form works
```

```
Use web testing agent to check if http://localhost:3000/checkout handles errors correctly
```

```
Agent: test the search functionality on https://myapp.com
```

### Agent vs Command vs Skill

**Command** (`/command-name`):
- Runs in main conversation
- MCP tools appear in main context temporarily
- User explicitly invokes
- Best for: Quick one-off tasks

**Skill** (auto-activated):
- Runs in main conversation
- MCP tools appear in main context temporarily
- Activates automatically
- Best for: Reusable patterns

**Agent** (launched with Task tool):
- Runs in separate context
- MCP tools NEVER appear in main context
- User asks to launch agent
- Best for: Complex workflows, keeping main context clean

### Complex Agent Example: Full Application Audit

```python
Task(
  subagent_type="general-purpose",
  description="Audit web application",
  prompt=f"""
You are a web auditing agent with chrome-devtools-mcp access via MCP On Demand.

Task: Perform comprehensive audit of {url}

Audit Checklist:
1. Visual inspection (screenshots of all major pages)
2. Console error check (no JavaScript errors)
3. Form validation testing
4. Navigation flow verification
5. Responsive layout check

Use MCP On Demand:
\```bash
if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
  node <mcp-on-demand-path>/src/session-manager.js &
  sleep 2
fi

node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
\```

For each page:
1. Navigate with new_page or click
2. Take screenshot
3. Get page content
4. Check console logs
5. Test interactions

Create detailed report with:
- Screenshots directory
- Issues found (with severity)
- Passing checks
- Recommendations

Stop session when complete:
\```bash
node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
\```
"""
)
```

### Key Patterns

1. **Zero main context pollution** - MCP tools exist only in agent context
2. **Long-running workflows** - Agents can execute complex multi-step processes
3. **Comprehensive reporting** - Agent returns complete findings
4. **Independent execution** - Agent manages its own MCP session lifecycle
5. **Batch operations** - Use batch calls for efficiency
6. **Clean shutdown** - Always stop MCP session before agent completes

### Agent Prompt Template

```python
f"""
You are a <purpose> agent with chrome-devtools-mcp access via MCP On Demand.

Task: {user_description}

Setup MCP On Demand:
[bash commands to start session manager and MCP session]

Available Tools:
[list relevant chrome-devtools-mcp tools]

Workflow:
[step-by-step instructions]

Report:
[what to include in final report]

Cleanup:
[stop MCP session]
"""
```

### When to Use Agents

Use agents for:
- **Complex testing workflows** - Multiple pages, interactions
- **Long-running tasks** - Comprehensive audits, monitoring
- **Context preservation** - Keep main conversation clean
- **Autonomous execution** - Let agent handle details
- **Parallel work** - Launch agent, continue other work

Use commands/skills for:
- **Quick tasks** - Single screenshot, one-off check
- **Interactive debugging** - Need to see results immediately
- **Simple workflows** - 1-2 tool calls

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-COMMAND.md](CREATING-COMMAND.md) - Create commands with MCP On Demand
- [CREATING-SKILL.md](CREATING-SKILL.md) - Create skills with MCP On Demand
