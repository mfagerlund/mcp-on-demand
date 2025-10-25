() => {
  return {
    title: document.title,
    url: document.location.href,
    timestamp: new Date().toISOString()
  };
}
