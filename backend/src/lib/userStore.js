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
