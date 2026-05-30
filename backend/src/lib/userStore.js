<<<<<<< HEAD
const supabase = require('./supabase');

async function findByEmail(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.trim())
    .maybeSingle();
  return data || null;
}

async function findById(id) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data || null;
}

async function save(email, user) {
  const userWithTimestamp = {
    ...user,
    created_at: user.created_at || new Date().toISOString(),
  };
  await supabase.from('users').insert([userWithTimestamp]);
}

module.exports = { findByEmail, findById, save };
=======
const { MongoClient } = require('mongodb');
const { MONGO_URL, DB_NAME } = require('../config/env');

const INITIAL_CREDITS = 500_000;
let _col = null;

// Kết nối lazy — chỉ kết nối khi lần đầu cần dùng
async function getCollection() {
  if (_col) return _col;
  if (!MONGO_URL) throw new Error('MONGO_URL not configured');
  const client = await MongoClient.connect(MONGO_URL);
  _col = client.db(DB_NAME).collection('users');
  // Index để tìm nhanh theo email và id
  await _col.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  await _col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
  console.log('[userStore] MongoDB users collection ready');
  return _col;
}

async function findByEmail(email) {
  const col = await getCollection();
  return col.findOne({ email }, { projection: { _id: 0 } });
}

async function findById(id) {
  const col = await getCollection();
  return col.findOne({ id }, { projection: { _id: 0 } });
}

async function save(email, user) {
  const col = await getCollection();
  // Đảm bảo có credits mặc định nếu user mới
  if (user.tokens_used === undefined) user.tokens_used = 0;
  if (user.credits === undefined) user.credits = INITIAL_CREDITS;
  await col.updateOne({ email }, { $set: user }, { upsert: true });
}

async function updateById(id, changes) {
  const col = await getCollection();
  // Nếu changes có operator ($set, $inc, ...) thì dùng trực tiếp, không bọc thêm
  const hasOperator = Object.keys(changes).some(k => k.startsWith('$'));
  const update = hasOperator ? changes : { $set: changes };
  await col.updateOne({ id }, update);
}

module.exports = { findByEmail, findById, save, updateById, INITIAL_CREDITS };
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
