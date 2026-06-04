function joinUrl(baseUrl, path) {
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');
  const normalizedPath = String(path || '').replace(/^\/+/, '');

  if (!normalizedBase) return `/${normalizedPath}`;
  if (!normalizedPath) return normalizedBase;

  return `${normalizedBase}/${normalizedPath}`;
}

module.exports = { joinUrl };
