async function mapConcurrent(items, maxConcurrent, fn, options = {}) {
  const limit = Math.max(1, Math.min(Number(maxConcurrent) || 1, items.length || 1));
  const results = new Array(items.length).fill(null);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      try {
        results[currentIndex] = await fn(items[currentIndex], currentIndex);
      } catch (err) {
        if (typeof options.onError === 'function') {
          results[currentIndex] = options.onError(err, items[currentIndex], currentIndex);
        } else {
          results[currentIndex] = null;
        }
      } finally {
        completed++;
        if (typeof options.onProgress === 'function') {
          options.onProgress({ completed, total: items.length });
        }
      }
    }
  }

  if (typeof options.onProgress === 'function') {
    options.onProgress({ completed: 0, total: items.length });
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

module.exports = { mapConcurrent };
