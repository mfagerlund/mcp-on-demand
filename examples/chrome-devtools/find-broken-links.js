() => {
  // Find potentially broken links
  const links = document.querySelectorAll('a[href]');

  return Array.from(links).map(link => {
    const href = link.href;
    const isBroken =
      href === '' ||
      href === '#' ||
      href.startsWith('javascript:') ||
      !href.match(/^https?:\/\//) && !href.startsWith('/');

    return {
      text: link.textContent.trim().substring(0, 50),
      href: href,
      isSuspicious: isBroken,
      reason: href === '' ? 'empty' :
              href === '#' ? 'hash-only' :
              href.startsWith('javascript:') ? 'javascript-protocol' :
              'relative-path'
    };
  }).filter(link => link.isSuspicious);
}
