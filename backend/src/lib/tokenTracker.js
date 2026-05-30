const { AsyncLocalStorage } = require('async_hooks');

// Dùng AsyncLocalStorage để track tokens per job run, không cần truyền context qua params
const jobTokenStorage = new AsyncLocalStorage();

// Per-user stats: { [userId]: { tokens_used, credits } }
const userStats = {};
const INITIAL_CREDITS = 500_000; // 500k tokens miễn phí mỗi account

function getUserStats(userId) {
  if (!userStats[userId]) {
    userStats[userId] = { tokens_used: 0, credits: INITIAL_CREDITS };
  }
  return { ...userStats[userId] };
}

function addUserTokens(userId, count) {
  if (!userStats[userId]) {
    userStats[userId] = { tokens_used: 0, credits: INITIAL_CREDITS };
  }
  userStats[userId].tokens_used += count;
  userStats[userId].credits = Math.max(0, userStats[userId].credits - count);
}

// Chạy fn trong context của một job, tự track tổng tokens tiêu thụ
function runWithTracking(fn) {
  const store = { total: 0 };
  return jobTokenStorage.run(store, async () => {
    await fn();
    return store.total;
  });
}

// Gọi từ openai.js sau mỗi API call để cộng tokens vào context hiện tại
function recordTokens(usageObj) {
  const store = jobTokenStorage.getStore();
  if (store && usageObj?.total_tokens) {
    store.total += usageObj.total_tokens;
  }
}

module.exports = { getUserStats, addUserTokens, runWithTracking, recordTokens };
