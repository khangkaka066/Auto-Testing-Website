<<<<<<< HEAD
const supabase = require('./supabase');
=======
<<<<<<< HEAD
const { MongoClient } = require('mongodb');
const { MONGO_URL, DB_NAME } = require('../config/env');
>>>>>>> 23cdd77fca004870ebd36a2f5013e7f6e25df8c2

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
<<<<<<< HEAD

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
=======
  await col.updateOne({ email }, { $set: user }, { upsert: true });
=======
const supabase = require('./supabase');

const INITIAL_CREDITS = 500_000;

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
>>>>>>> 6183f3a (updates)
}

async function updateById(id, changes) {
  // Handle MongoDB-style $inc operator used by tokenTracker
  if (changes.$inc) {
    const user = await findById(id);
    if (!user) return;
    const updates = {};
    for (const [key, val] of Object.entries(changes.$inc)) {
      updates[key] = (user[key] ?? 0) + val;
    }
    await supabase.from('users').update(updates).eq('id', id);
  } else if (changes.$set) {
    await supabase.from('users').update(changes.$set).eq('id', id);
  } else {
    await supabase.from('users').update(changes).eq('id', id);
  }
>>>>>>> 23cdd77fca004870ebd36a2f5013e7f6e25df8c2
}

module.exports = { findByEmail, findById, save, updateById, INITIAL_CREDITS };
