# Auto-Start Daemon Feedback

**Date:** 2025-11-12
**Context:** Real-world usage attempting to debug React Native web app with Chrome DevTools MCP
**Reporter:** Claude Code AI assistant

---

## Executive Summary

The mcp-on-demand CLI currently requires users to manually start the session manager daemon before using any commands. This creates a poor first-run experience and unnecessary friction. The CLI should automatically start the daemon when needed, similar to how Docker automatically manages the Docker daemon.

**Current behavior:**
```bash
$ mcp-on-demand start chrome-devtools-mcp
Failed to connect to session manager: fetch failed
Is the session manager running?
```

**Expected behavior:**
```bash
$ mcp-on-demand start chrome-devtools-mcp
Session manager not running, starting it...
Session manager started (PID 12345)
{
  "success": true,
  "mcpName": "chrome-devtools-mcp",
  ...
}
```

---

## Issues Encountered

### Issue 1: Session Manager Not Running

**What happened:**
1. Attempted to use `mcp-on-demand start chrome-devtools-mcp`
2. Got error: "Failed to connect to session manager: fetch failed"
3. Error message suggested running `node src/session-manager.js` (wrong - should use CLI command)

**Current code location:**
- `src/session-cli.js` lines 10-13 (checks for SESSION_FILE)
- `src/session-cli.js` lines 33-36 (catches fetch errors)

**Problems:**
1. User must know about the daemon concept
2. User must remember to start daemon in separate terminal
3. Error messages show internal implementation details (`node src/session-manager.js`)
4. Error messages don't suggest the correct CLI command (`mcp-on-demand manager &`)

### Issue 2: Installation Path Confusion

**What happened:**
1. Tried `npx @on-demand-mcp/cli start` (assumed package was published to npm)
2. Got 404 error - package doesn't exist in npm registry
3. Had to be directed to local dev path `c:\dev\mcp-on-demand`

**Context from package.json:**
- Package name: `mcp-on-demand` v0.6.0
- Has `bin` entry for CLI
- Has `postinstall` script that runs setup

**Gap:**
The README suggests `npm install -g mcp-on-demand` but the package may not be published yet. This creates confusion about whether to use:
- Global install: `mcp-on-demand` command
- Local dev: `cd c:\dev\mcp-on-demand && npm start`

---

## Recommended Solutions

### Solution 1: Auto-Start Daemon (Primary Recommendation)

**Implementation approach:**

Modify `src/session-cli.js` to auto-start the daemon when not running:

```javascript
// Add at top of session-cli.js
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function ensureDaemonRunning() {
  // Check if session manager is running
  if (!existsSync(SESSION_FILE)) {
    console.log('Session manager not running, starting it...');
    return await startDaemon();
  }

  // Verify it's actually responsive
  try {
    const sessionInfo = JSON.parse(await readFile(SESSION_FILE, 'utf-8'));
    const url = `http://127.0.0.1:${sessionInfo.port}/health`;
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });

    if (response.ok) {
      return true; // Daemon is running and responsive
    }
  } catch (err) {
    console.log('Session manager not responsive, restarting...');
  }

  return await startDaemon();
}

async function startDaemon() {
  const sessionManagerPath = join(__dirname, 'session-manager.js');

  // Start daemon in background
  const daemon = spawn('node', [sessionManagerPath], {
    detached: true,
    stdio: 'ignore'
  });

  daemon.unref(); // Allow parent to exit

  console.log(`Session manager started (PID ${daemon.pid})`);

  // Wait for daemon to be ready
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (existsSync(SESSION_FILE)) {
      console.log('Session manager ready');
      return true;
    }
  }

  throw new Error('Session manager failed to start within 5 seconds');
}

// Modify sendCommand function
async function sendCommand(command) {
  // Ensure daemon is running before sending command
  await ensureDaemonRunning();

  // ... rest of existing code ...
}
```

**Benefits:**
- Zero user configuration needed
- Works on first run
- Matches user expectations from other tools (Docker, etc.)
- Daemon lifecycle is transparent to users

**Trade-offs:**
- Slightly more complex CLI code
- Need to handle edge cases (port already in use, permission errors, etc.)
- May need platform-specific spawn options for Windows

### Solution 2: Improve Error Messages (Quick Win)

**Minimal change to improve UX immediately:**

```javascript
// In session-cli.js, lines 10-13
if (!existsSync(SESSION_FILE)) {
  console.error('Session manager not running.');
  console.error('');
  console.error('Start it with: mcp-on-demand manager');
  console.error('Or in background: mcp-on-demand manager &');
  console.error('');
  console.error('Tip: Add this to your shell startup (~/.bashrc or ~/.zshrc):');
  console.error('  mcp-on-demand manager &');
  process.exit(1);
}

// In session-cli.js, lines 33-36
} catch (err) {
  console.error('Failed to connect to session manager:', err.message);
  console.error('');
  console.error('The session manager may have crashed or stopped.');
  console.error('Restart it with: mcp-on-demand manager');
  console.error('');
  console.error('Check status: curl http://127.0.0.1:9876/health');
  process.exit(1);
}
```

**Benefits:**
- Easy to implement (5 minutes)
- Provides correct CLI commands (not internal paths)
- Educates users about shell startup options
- Can be done immediately while Solution 1 is in development

### Solution 3: Add Daemon Status Check to CLI

**Add a new command to help users understand daemon state:**

```javascript
// In bin/mcp-on-demand.js, add to switch statement:
case 'status':
  scriptPath = join(installPath, 'src', 'session-status.js');
  break;
```

**New file: `src/session-status.js`:**

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const SESSION_FILE = join(STATE_DIR, 'session.json');

async function checkStatus() {
  console.log('MCP On-Demand Status');
  console.log('===================\n');

  // Check if session file exists
  if (!existsSync(SESSION_FILE)) {
    console.log('Status: NOT RUNNING');
    console.log('');
    console.log('Start the session manager with:');
    console.log('  mcp-on-demand manager &');
    process.exit(1);
  }

  // Check if daemon is responsive
  try {
    const sessionInfo = JSON.parse(await readFile(SESSION_FILE, 'utf-8'));
    const url = `http://127.0.0.1:${sessionInfo.port}/health`;

    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    const health = await response.json();

    console.log('Status: RUNNING');
    console.log('');
    console.log(`PID: ${health.pid}`);
    console.log(`Port: ${sessionInfo.port}`);
    console.log(`Uptime: ${Math.floor(health.uptime)} seconds`);
    console.log(`Active Sessions: ${health.activeSessions.length}`);

    if (health.activeSessions.length > 0) {
      console.log(`  - ${health.activeSessions.join('\n  - ')}`);
    }
  } catch (err) {
    console.log('Status: UNRESPONSIVE');
    console.log('');
    console.log('Session file exists but daemon is not responding.');
    console.log('');
    console.log('Try restarting:');
    console.log('  rm ~/.mcp-on-demand/session.json');
    console.log('  mcp-on-demand manager &');
  }
}

await checkStatus();
```

**Usage:**
```bash
$ mcp-on-demand status
MCP On-Demand Status
===================

Status: RUNNING

PID: 12345
Port: 9876
Uptime: 3600 seconds
Active Sessions: 1
  - chrome-devtools-mcp
```

**Benefits:**
- Helps users diagnose issues
- Shows what's actually running
- Provides actionable next steps
- Works with or without auto-start

---

## Implementation Priority

**Recommended order:**

1. **Solution 2 (Immediate)** - Improve error messages
   - Time: 10 minutes
   - Impact: Medium (better guidance)
   - Risk: None

2. **Solution 3 (Short-term)** - Add status command
   - Time: 30 minutes
   - Impact: Medium (helps debugging)
   - Risk: Low

3. **Solution 1 (Long-term)** - Auto-start daemon
   - Time: 2-4 hours (including testing on Windows/Mac/Linux)
   - Impact: High (best UX)
   - Risk: Medium (need thorough testing)

**Suggested phasing:**
- **v0.6.1**: Solutions 2 & 3 (error messages + status command)
- **v0.7.0**: Solution 1 (auto-start daemon)

---

## Additional Considerations

### Platform Differences

**Windows (MSYS/Git Bash):**
- `spawn` with `detached: true` works differently than Unix
- May need to use `START /B` command wrapper
- Test with both Git Bash and PowerShell

**macOS/Linux:**
- Standard Unix process management works
- Consider `nohup` for better daemon behavior
- May want to write PID file for process management

### Configuration

Add option to disable auto-start for users who want manual control:

```json
// ~/.mcp-on-demand/config.json
{
  "autoStartDaemon": true,  // default
  "daemonStartTimeout": 5000,  // ms to wait for startup
  "daemonHealthCheckTimeout": 2000  // ms for health check
}
```

### Logging

When auto-starting, capture daemon logs:

```javascript
const logPath = join(STATE_DIR, 'daemon.log');
const logStream = createWriteStream(logPath, { flags: 'a' });

const daemon = spawn('node', [sessionManagerPath], {
  detached: true,
  stdio: ['ignore', logStream, logStream]
});
```

Users can then check `~/.mcp-on-demand/daemon.log` if issues occur.

---

## Testing Checklist

Before releasing auto-start feature:

- [ ] Test on Windows (Git Bash)
- [ ] Test on Windows (PowerShell)
- [ ] Test on macOS
- [ ] Test on Linux
- [ ] Test with daemon already running (should not restart)
- [ ] Test with stale session.json (should detect and restart)
- [ ] Test with port 9876 already in use (should error gracefully)
- [ ] Test daemon restart after crash
- [ ] Test cleanup on SIGINT/SIGTERM
- [ ] Verify daemon properly detaches (parent can exit)
- [ ] Test with multiple concurrent CLI calls (should not start multiple daemons)

---

## Related Documentation Updates

Once auto-start is implemented, update these docs:

1. **README.md** - Remove "Start session manager" from installation steps
2. **CREATE-COMMAND.md** - Remove daemon startup from examples
3. **CREATE-SKILL.md** - Remove daemon startup from skill templates
4. **Error messages** - Remove references to manual daemon start

Keep daemon documentation for:
- Advanced users who want manual control
- Troubleshooting section
- Architecture explanation

---

## Comparison to Other Tools

**Docker:**
```bash
$ docker ps
# Automatically starts Docker daemon if not running
```

**PostgreSQL (Homebrew):**
```bash
$ psql
# Auto-starts postgres service if installed via Homebrew
```

**Redis (macOS):**
```bash
$ redis-cli
# Shows error if not running, but brew services provides easy start
```

**mcp-on-demand should match Docker's behavior:**
- Transparent daemon management
- Auto-start when needed
- Status command to check health
- Option to manually control for advanced users

---

## Conclusion

The current manual daemon management creates unnecessary friction. Auto-starting the daemon would make mcp-on-demand much more user-friendly, especially for first-time users and in automated workflows.

**Recommended next steps:**
1. Implement improved error messages (Solution 2) - ship in v0.6.1
2. Add status command (Solution 3) - ship in v0.6.1
3. Design and implement auto-start (Solution 1) - target v0.7.0
4. Test thoroughly on all platforms before v0.7.0 release

This would make mcp-on-demand truly "on-demand" - users shouldn't need to think about daemons at all.
