# Chrome DevTools MCP Examples

This directory contains example scripts for use with the chrome-devtools-mcp server.

## Prerequisites

1. Install mcp-on-demand:
   ```bash
   npm install -g mcp-on-demand
   ```

2. Session manager auto-starts on first use

3. Chrome DevTools MCP session will auto-start on first tool call

## Usage

All examples can be run using the mcp-on-demand CLI:

```bash
mcp-on-demand call chrome-devtools-mcp evaluate_script '{"function":"file://examples/chrome-devtools/<script-name>.js"}'
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
mcp-on-demand call chrome-devtools-mcp navigate_page '{"url":"https://example.com"}'

# Run accessibility check
mcp-on-demand call chrome-devtools-mcp evaluate_script '{"function":"file://examples/chrome-devtools/check-accessibility.js"}'
```

### check-buttons.js
Audits all clickable buttons on the page to verify they have IDs and accessible labels.

**Usage:**
```bash
mcp-on-demand call chrome-devtools-mcp navigate_page '{"url":"https://example.com"}'
mcp-on-demand call chrome-devtools-mcp evaluate_script '{"function":"file://examples/chrome-devtools/check-buttons.js"}'
```

### find-broken-links.js
Identifies potentially broken or suspicious links:
- Empty href attributes
- Hash-only links (#)
- JavaScript protocol links
- Suspicious relative paths

**Usage:**
```bash
mcp-on-demand call chrome-devtools-mcp navigate_page '{"url":"https://example.com"}'
mcp-on-demand call chrome-devtools-mcp evaluate_script '{"function":"file://examples/chrome-devtools/find-broken-links.js"}'
```

### extract-forms.js
Extracts all forms on the page along with their structure and fields.

**Usage:**
```bash
mcp-on-demand call chrome-devtools-mcp navigate_page '{"url":"https://example.com/contact"}'
mcp-on-demand call chrome-devtools-mcp evaluate_script '{"function":"file://examples/chrome-devtools/extract-forms.js"}'
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

1. **Use batch commands** for sequential operations:
   ```bash
   mcp-on-demand batch chrome-devtools-mcp '[
     {"tool":"navigate_page","args":{"url":"https://example.com"}},
     {"tool":"evaluate_script","args":{"function":"file://examples/chrome-devtools/check-buttons.js"}}
   ]'
   ```

2. **Take screenshots** after running scripts to visualize findings:
   ```bash
   mcp-on-demand call chrome-devtools-mcp take_screenshot '{"format":"png","filePath":"./result.png"}'
   ```
