const { AsyncLocalStorage } = require('async_hooks');
const { updateById, findById, INITIAL_CREDITS } = require('./userStore');

const jobTokenStorage = new AsyncLocalStorage();

const TOKENS_PER_CREDIT = 500_000;

function weightedTokens(inputTokens = 0, outputTokens = 0) {
  return Math.max(0, Math.round((inputTokens || 0) + ((outputTokens || 0) * 4)));
}

function creditsForTokens(tokenCount = 0) {
  return (tokenCount || 0) / TOKENS_PER_CREDIT;
}

async function getUserStats(userId) {
  const user = await findById(userId);
  const tokensUsed = user?.tokens_used ?? 0;
  return {
    tokens_used: tokensUsed,
    credits_used: creditsForTokens(tokensUsed),
    credits:     user?.credits     ?? INITIAL_CREDITS,
  };
}

async function addUserTokens(userId, count) {
  if (!count || count <= 0) return;
  const creditCost = creditsForTokens(count); // float, e.g. 1.38

  // Try atomic RPC first (requires DB function to accept p_credits as NUMERIC)
  const supabase = require('./supabase');
  let error = null;
  try {
    const result = await supabase.rpc('increment_user_tokens', {
      p_user_id: userId,
      p_tokens: count,
      p_credits: creditCost,
    });
    error = result.error;
  } catch (err) {
    error = { message: err.message || 'rpc_failed' };
  }

  if (error) {
    // Fallback: read-modify-write (credits column must be NUMERIC in DB)
    await updateById(userId, {
      $inc: { tokens_used: count, credits: -creditCost },
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

module.exports = { getUserStats, addUserTokens, runWithTracking, recordTokens, weightedTokens, creditsForTokens, TOKENS_PER_CREDIT };
