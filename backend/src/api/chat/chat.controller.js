const supabase = require('../../lib/supabase');

// Customer creates or retrieves their active chat session
async function createSession(req, res) {
  try {
    const { user_name, user_email, session_key } = req.body;

    if (!session_key) {
      return res.status(400).json({ success: false, message: 'Missing session_key' });
    }

    // Check if session already exists
    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_key', session_key)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const { data, error } = await supabase.from('chat_sessions').insert([{
      session_key,
      user_name: user_name || 'Guest',
      user_email: user_email || '',
      status: 'active',
    }]).select().single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Customer sends a message
async function sendMessage(req, res) {
  try {
    const { session_id, content, sender_name } = req.body;
    if (!session_id || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Missing session_id or content' });
    }

    const { data, error } = await supabase.from('chat_messages').insert([{
      session_id,
      role: 'user',
      sender_name: sender_name || 'Customer',
      content: content.trim(),
    }]).select().single();

    if (error) throw error;

    await supabase.from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Customer polls for messages in their session
async function getMessages(req, res) {
  try {
    const { sessionId } = req.params;
    const since = req.query.since; // ISO timestamp for polling

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gt('created_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Simple bot chat handler — no OpenAI, just acknowledges the message
// The real AI responses come from the local KB in the frontend
async function botChat(req, res) {
  return res.json({ success: false, reply: '' });
}

module.exports = { botChat, createSession, sendMessage, getMessages };
