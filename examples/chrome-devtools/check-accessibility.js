() => {
  // Check for common accessibility issues
  const issues = [];

  // Check images without alt text
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images)
    .filter(img => !img.alt)
    .map(img => ({
      type: 'missing-alt',
      element: 'img',
      src: img.src,
      location: img.getBoundingClientRect()
    }));
  issues.push(...imagesWithoutAlt);

  // Check buttons without accessible labels
  const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
  const buttonsWithoutLabels = Array.from(buttons)
    .filter(btn => !btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.id)
    .map(btn => ({
      type: 'missing-label',
      element: btn.tagName,
      html: btn.outerHTML.substring(0, 100)
    }));
  issues.push(...buttonsWithoutLabels);

  // Check form inputs without labels
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
  const inputsWithoutLabels = Array.from(inputs)
    .filter(input => {
      const hasLabel = input.labels && input.labels.length > 0;
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
    })
    .map(input => ({
      type: 'missing-label',
      element: input.tagName,
      inputType: input.type,
      id: input.id || 'NO ID',
      name: input.name || 'NO NAME'
    }));
  issues.push(...inputsWithoutLabels);

  return {
    totalIssues: issues.length,
    issues: issues
  };
}
