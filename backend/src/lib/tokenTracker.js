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
  const creditCost = creditsForTokens(count);

  const supabase = require('./supabase');

  // Try atomic RPC first
  try {
    const { error } = await supabase.rpc('increment_user_tokens', {
      p_user_id: userId,
      p_tokens: count,
      p_credits: creditCost,
    });
    if (!error) {
      console.log(`[tokenTracker] RPC ok — deducted ${creditCost.toFixed(6)} credits for user ${userId}`);
      return;
    }
    console.warn('[tokenTracker] RPC failed, using fallback:', error.message);
  } catch (err) {
    console.warn('[tokenTracker] RPC exception, using fallback:', err.message);
  }

  // Fallback: direct read-modify-write
  try {
    const user = await findById(userId);
    if (!user) { console.error('[tokenTracker] user not found:', userId); return; }
    const currentCredits = parseFloat(user.credits) || 0;
    const newTokensUsed  = (user.tokens_used || 0) + count;

    // Try with full float precision first (requires numeric column type)
    const newCreditsFloat = Math.max(0, currentCredits - creditCost);
    const { error: floatErr } = await supabase
      .from('users')
      .update({ credits: newCreditsFloat, tokens_used: newTokensUsed })
      .eq('id', userId);

    if (!floatErr) {
      console.log(`[tokenTracker] fallback ok — credits: ${currentCredits} → ${newCreditsFloat.toFixed(6)} for user ${userId}`);
      return;
    }

    // If column is bigint/integer, round to nearest integer
    if (floatErr.message?.includes('bigint') || floatErr.message?.includes('integer')) {
      console.warn('[tokenTracker] credits column is integer type — rounding. Run: ALTER TABLE users ALTER COLUMN credits TYPE numeric(12,6) USING credits::numeric;');
      const newCreditsInt = Math.max(0, Math.floor(currentCredits - creditCost));
      const { error: intErr } = await supabase
        .from('users')
        .update({ credits: newCreditsInt, tokens_used: newTokensUsed })
        .eq('id', userId);
      if (intErr) {
        console.error('[tokenTracker] integer fallback failed:', intErr.message);
      } else {
        console.log(`[tokenTracker] integer fallback ok — credits: ${currentCredits} → ${newCreditsInt} for user ${userId}`);
      }
    } else {
      console.error('[tokenTracker] fallback update failed:', floatErr.message);
    }
  } catch (err) {
    console.error('[tokenTracker] fallback exception:', err.message);
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
