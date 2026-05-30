const supabase = require('./supabase');

const INITIAL_CREDITS = 500_000;

async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function save(email, user) {
  if (user.tokens_used === undefined) user.tokens_used = 0;
  if (user.credits === undefined) user.credits = INITIAL_CREDITS;

  const { error } = await supabase
    .from('users')
    .upsert({ ...user, email }, { onConflict: 'email' });
  if (error) throw error;
}

async function updateById(id, changes) {
  // Strip MongoDB-style operators ($set, $inc) — Supabase takes plain object
  const updates = {};
  for (const [k, v] of Object.entries(changes)) {
    if (k.startsWith('$')) {
      Object.assign(updates, v);
    } else {
      updates[k] = v;
    }
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

module.exports = { findByEmail, findById, save, updateById, INITIAL_CREDITS };
