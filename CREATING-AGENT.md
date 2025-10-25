# Creating a Claude Code Agent with MCP On Demand

## For Humans

**What this does:** Shows how to launch Claude Code agents (via Task tool) that use MCP On Demand to access chrome-devtools-mcp capabilities with **ZERO context pollution** - agents run completely separately from your main conversation.

**Example - Web testing agent:**

In Claude Code, type:

```
Launch an agent to test http://localhost:5173 - verify the login form works correctly using chrome-devtools-mcp
```

**Why agents are powerful:** Agents run in their own context with their own tools. The MCP tools never appear in your main conversation - perfect for keeping your context clean while having powerful capabilities available.

## For LLMs

**Prerequisites:** Read [README.md](README.md) to set up MCP On Demand if not already installed.

### Overview

When users ask to "launch an agent" or describe complex tasks, use the Task tool to launch an agent with `subagent_type="general-purpose"`.

**Key advantage with MCP On Demand:**
- Agent runs in separate context
- Agent's prompt includes MCP On Demand setup instructions
- MCP tools available to agent but NOT in main conversation
- Main context stays completely clean
- Perfect for long-running or complex MCP workflows

### How to Launch an Agent

When user requests an agent for web testing/debugging:

**Ask the user where mcp-on-demand is installed** (or use known path if in context).

Use the Task tool with a prompt that:
1. Explains the agent's role
2. Provides MCP On Demand setup commands
3. Lists available tools
4. Describes the workflow
5. Specifies what to report back

### Example: Web Testing Agent

User says: `Launch an agent to test http://localhost:5173 - verify login works`

You invoke Task tool:

```
Tool: Task
Parameters:
  subagent_type: "general-purpose"
  description: "Test web application login"
  prompt: |
    You are a web testing agent with access to chrome-devtools-mcp via MCP On Demand.
    
    Task: Test http://localhost:5173 login form - verify it works correctly
    
    Setup MCP On Demand:
    ```bash
    # Ensure session manager running
    if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
      node <mcp-on-demand-path>/src/session-manager.js &
      sleep 2
    fi
    
    # Start chrome-devtools-mcp
    node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
    ```
    
    Available MCP tools:
    - new_page - Open URLs
    - get_page_content - Inspect DOM (includes element UIDs)
    - click - Click elements by UID
    - type_text - Type into input fields
    - take_screenshot - Visual verification
    - get_console_logs - Check for errors
    - evaluate_javascript - Run custom checks
    
    Test Workflow:
    1. Open http://localhost:5173
    2. Get page content to find login form elements
    3. Fill in test credentials (use test@example.com / password123)
    4. Click submit button
    5. Take screenshot of result
    6. Check console for errors
    7. Verify successful login
    
    Use batch for efficiency:
    ```bash
    node <mcp-on-demand-path>/src/session-cli.js batch chrome-devtools-mcp '[
      {"tool":"new_page","args":{"url":"http://localhost:5173"}},
      {"tool":"get_page_content","args":{}},
      ...
    ]'
    ```
    
    Always stop session when done:
    ```bash
    node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
    ```
    
    Report Format:
    - Test steps executed
    - Screenshots captured (paths)
    - Console errors found (if any)
    - Pass/Fail status
    - Specific issues if login failed
    - Recommendations
```

The agent will execute this autonomously and report back. MCP tools exist only in agent's context.

### Example Invocations

User requests that trigger agent launch:

```
Launch an agent to test http://localhost:5173 - verify the login form works
```

```
Use an agent to audit http://localhost:3000 for JavaScript errors
```

```
Agent: comprehensively test the checkout flow on https://myapp.com
```

Extract URL and requirements from user's message, then launch agent with appropriate prompt.

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

**Agent** (Task tool):
- Runs in separate context ← KEY DIFFERENCE
- MCP tools NEVER appear in main context ← ZERO POLLUTION
- User asks to launch agent
- Best for: Complex workflows, keeping main context pristine

### Complex Agent Example: Full Application Audit

User: `Launch agent to audit http://localhost:5173 comprehensively`

```
Tool: Task
Parameters:
  subagent_type: "general-purpose"
  description: "Comprehensive web application audit"
  prompt: |
    You are a web auditing agent with chrome-devtools-mcp via MCP On Demand.
    
    Task: Comprehensive audit of http://localhost:5173
    
    Audit Checklist:
    1. Visual inspection (screenshots of all major pages)
    2. Console error check (no JavaScript errors)
    3. Form validation testing
    4. Navigation flow verification
    5. Responsive layout check
    
    Setup MCP On Demand:
    ```bash
    if ! curl -s http://127.0.0.1:9876 >/dev/null 2>&1; then
      node <mcp-on-demand-path>/src/session-manager.js &
      sleep 2
    fi
    
    node <mcp-on-demand-path>/src/session-cli.js start chrome-devtools-mcp
    ```
    
    For each major page:
    1. Navigate (new_page or click)
    2. Take screenshot
    3. Get page content
    4. Check console logs
    5. Test key interactions
    
    Create detailed report with:
    - Screenshots directory
    - Issues found (with severity: critical/major/minor)
    - Passing checks
    - Specific recommendations
    
    Stop session when complete:
    ```bash
    node <mcp-on-demand-path>/src/session-cli.js stop chrome-devtools-mcp
    ```
```

### Key Patterns

1. **Zero main context pollution** - MCP tools exist only in agent context
2. **Long-running workflows** - Agents can execute complex multi-step processes
3. **Comprehensive reporting** - Agent returns complete findings to main conversation
4. **Independent execution** - Agent manages its own MCP session lifecycle
5. **Batch operations** - Include batch examples in agent prompt
6. **Clean shutdown** - Agent must stop MCP session before completing

### Agent Prompt Template

When launching agents with MCP On Demand:

```
You are a <purpose> agent with chrome-devtools-mcp access via MCP On Demand.

Task: <user's description>

Setup MCP On Demand:
[bash commands to check/start session manager and start MCP session]

Available Tools:
[list relevant chrome-devtools-mcp tools]

Workflow:
[step-by-step instructions for the task]

Report:
[what to include in final report back to main conversation]

Cleanup:
[stop MCP session command]
```

### When to Launch Agents

Launch agents for:
- **Complex testing workflows** - Multiple pages, interactions
- **Long-running tasks** - Comprehensive audits, monitoring
- **Context preservation** - Keep main conversation pristine
- **Autonomous execution** - Let agent handle all details
- **Parallel work** - Launch agent, user continues other work

Use commands/skills for:
- **Quick tasks** - Single screenshot, one-off check
- **Interactive debugging** - Need immediate results in main conversation
- **Simple workflows** - 1-2 tool calls

### Related

- [README.md](README.md) - Setup and installation
- [CREATING-COMMAND.md](CREATING-COMMAND.md) - Create commands with MCP On Demand
- [CREATING-SKILL.md](CREATING-SKILL.md) - Create skills with MCP On Demand
