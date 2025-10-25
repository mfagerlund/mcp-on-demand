() => {
  // Check all clickable buttons and their IDs
  const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');

  return Array.from(buttons).map(btn => ({
    tag: btn.tagName,
    id: btn.id || 'NO ID',
    text: btn.textContent.trim().substring(0, 50),
    hasId: !!btn.id,
    type: btn.type || 'N/A',
    ariaLabel: btn.getAttribute('aria-label') || 'NONE'
  }));
}
