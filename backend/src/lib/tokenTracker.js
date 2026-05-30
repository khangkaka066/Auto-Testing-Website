const { AsyncLocalStorage } = require('async_hooks');
const { updateById, findById, INITIAL_CREDITS } = require('./userStore');

const jobTokenStorage = new AsyncLocalStorage();

async function getUserStats(userId) {
  const user = await findById(userId);
  return {
    tokens_used: user?.tokens_used ?? 0,
    credits:     user?.credits     ?? INITIAL_CREDITS,
  };
}

async function addUserTokens(userId, count) {
  if (!count || count <= 0) return;
  // Bỏ qua lỗi DB — không để token tracking làm crash pipeline
  await updateById(userId, {
    $inc: { tokens_used: count, credits: -count },
  }).catch(err => console.error('[tokenTracker] updateById error:', err.message));
}

function runWithTracking(fn) {
  const store = { total: 0 };
  return jobTokenStorage.run(store, async () => {
    await fn();
    return store.total;
  });
}

function recordTokens(usageObj) {
  const store = jobTokenStorage.getStore();
  if (store && usageObj?.total_tokens) {
    store.total += usageObj.total_tokens;
  }
}

module.exports = { getUserStats, addUserTokens, runWithTracking, recordTokens };
