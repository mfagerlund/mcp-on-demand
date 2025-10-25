() => {
  // Extract all forms and their structure
  const forms = document.querySelectorAll('form');

  return Array.from(forms).map((form, index) => {
    const inputs = form.querySelectorAll('input, textarea, select');

    return {
      formIndex: index,
      action: form.action || 'NONE',
      method: form.method || 'GET',
      id: form.id || 'NO ID',
      fieldCount: inputs.length,
      fields: Array.from(inputs).map(input => ({
        tag: input.tagName,
        type: input.type || 'text',
        name: input.name || 'NO NAME',
        id: input.id || 'NO ID',
        required: input.required,
        placeholder: input.placeholder || ''
      }))
    };
  });
}
