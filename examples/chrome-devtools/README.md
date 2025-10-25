# Chrome DevTools MCP Examples

This directory contains example scripts for use with the chrome-devtools-mcp server.

## Prerequisites

1. Session manager running:
   ```bash
   npm start
   ```

2. Chrome DevTools MCP session started (will auto-start on first tool call)

## Usage

All examples can be run using the mcp-call.js helper:

```bash
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/<script-name>.js
```

Or with cleaner output:

```bash
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/<script-name>.js --format=raw
```

## Available Examples

### check-accessibility.js
Scans the current page for common accessibility issues:
- Images without alt text
- Buttons without accessible labels
- Form inputs without labels

**Usage:**
```bash
# Navigate to a page first
node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com

# Run accessibility check
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/check-accessibility.js --format=raw
```

### check-buttons.js
Audits all clickable buttons on the page to verify they have IDs and accessible labels.

**Usage:**
```bash
node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/check-buttons.js --format=raw
```

### find-broken-links.js
Identifies potentially broken or suspicious links:
- Empty href attributes
- Hash-only links (#)
- JavaScript protocol links
- Suspicious relative paths

**Usage:**
```bash
node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/find-broken-links.js --format=raw
```

### extract-forms.js
Extracts all forms on the page along with their structure and fields.

**Usage:**
```bash
node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com/contact
node scripts/mcp-call.js chrome-devtools-mcp evaluate_script examples/chrome-devtools/extract-forms.js --format=raw
```

## Creating Your Own Scripts

All scripts should be JavaScript functions that return JSON-serializable data:

```javascript
() => {
  // Your DOM inspection code here
  const data = document.querySelectorAll('div');

  return {
    count: data.length,
    // other data...
  };
}
```

## Tips

1. **Use --format=raw** for cleaner output that extracts just the result
2. **Chain operations** by saving intermediate results or using batch calls
3. **Take screenshots** after running scripts to visualize findings:
   ```bash
   node scripts/mcp-call.js chrome-devtools-mcp take_screenshot --format png --filePath ./result.png
   ```
