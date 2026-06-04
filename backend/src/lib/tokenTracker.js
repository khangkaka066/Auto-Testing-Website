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
  // Dùng Supabase RPC để atomic increment — tránh race condition khi nhiều job chạy song song
  const supabase = require('./supabase');
  let error = null;
  try {
    const result = await supabase.rpc('increment_user_tokens', {
      p_user_id: userId,
      p_tokens: count,
    });
    error = result.error;
  } catch (err) {
    error = { message: err.message || 'rpc_failed' };
  }

  if (error) {
    // Fallback về read-modify-write nếu RPC chưa được tạo
    await updateById(userId, {
      $inc: { tokens_used: count, credits: -count },
    }).catch(err => console.error('[tokenTracker] fallback error:', err.message));
  }
}

function runWithTracking(fn) {
  const store = { input: 0, output: 0, total: 0 };
  return jobTokenStorage.run(store, async () => {
    await fn();
    return { input: store.input, output: store.output, total: store.total };
  });
}

function recordTokens(usageObj) {
  const store = jobTokenStorage.getStore();
  if (!store || !usageObj) return;
  store.input  += usageObj.prompt_tokens     || 0;
  store.output += usageObj.completion_tokens || 0;
  store.total  += usageObj.total_tokens      || 0;
}

module.exports = { getUserStats, addUserTokens, runWithTracking, recordTokens };
