const supabase = require('./supabase');

const INITIAL_CREDITS = 5; // 5 free credits = 2,500,000 tokens

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
}

module.exports = { findByEmail, findById, save, updateById, INITIAL_CREDITS };
