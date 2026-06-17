const supabase = require('../../lib/supabase');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@123456,testpilotadmin@gmail.com').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function getStats(req, res) {
  try {
    const [
      { count: totalUsers },
      { data: txData },
      { count: totalTests },
      { data: reviewData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('amount_usd, credits_added, status'),
      supabase.from('test_reports').select('*', { count: 'exact', head: true }),
      supabase.from('report_contact').select('*', { count: 'exact', head: false }),
    ]);

    const completedTx = (txData || []).filter(t => t.status === 'completed' || t.status === 'succeeded');
    // amount_usd column stores VND — frontend handles conversion
    const totalRevenue = completedTx.reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);
    const totalCredits = completedTx.reduce((sum, t) => sum + (Number(t.credits_added) || 0), 0);

    return res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalRevenue,       // raw VND
        totalCredits,
        totalTransactions: (txData || []).length,
        totalTests: totalTests || 0,
        totalReviews: (reviewData || []).length,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;

    const userList = data || [];

    // Fetch completed transactions to determine Pro status
    const userIds = userList.map(u => u.id).filter(Boolean);
    let proSet = new Set();
    if (userIds.length > 0) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('user_id')
        .in('user_id', userIds)
        .in('status', ['completed', 'succeeded']);
      (txData || []).forEach(t => proSet.add(t.user_id));
    }

    const users = userList.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      credits: u.credits,
      created_at: u.created_at,
      is_admin: u.is_admin === true || ADMIN_EMAILS.includes((u.email || '').toLowerCase()),
      is_pro: proSet.has(u.id),
    }));

    return res.json({ success: true, data: users, total: count, page, limit });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getTransactions(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;

    // Enrich with user info if possible
    const txList = data || [];
    if (txList.length > 0) {
      const userIds = [...new Set(txList.map(t => t.user_id).filter(Boolean))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.id] = u; });
      txList.forEach(t => { t.users = userMap[t.user_id] || null; });
    }

    return res.json({ success: true, data: txList, total: count, page, limit });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getReviews(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('report_contact')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return res.json({ success: true, data, total: count, page, limit });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Chat session management ───────────────────────────────────────────────

async function getChatSessions(req, res) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getChatMessages(req, res) {
  try {
    const { sessionId } = req.params;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function adminReply(req, res) {
  try {
    const { session_id, content } = req.body;
    if (!session_id || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Missing session_id or content' });
    }

    const { data, error } = await supabase.from('chat_messages').insert([{
      session_id,
      role: 'admin',
      sender_name: req.user.name || 'Admin',
      content: content.trim(),
    }]).select().single();

    if (error) throw error;

    // Update session timestamp
    await supabase.from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function closeSession(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('chat_sessions')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Chart data (last 6 months) ───────────────────────────────────────────────

async function getChartData(req, res) {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const [{ data: usersData }, { data: txData }] = await Promise.all([
      supabase.from('users').select('created_at').gte('created_at', sixMonthsAgo),
      supabase.from('transactions').select('created_at, amount_usd, status').gte('created_at', sixMonthsAgo),
    ]);

    // Build last-6-months labels
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        users: 0,
        revenue: 0,
      });
    }

    const monthMap = {};
    months.forEach(m => { monthMap[m.key] = m; });

    (usersData || []).forEach(u => {
      const key = u.created_at?.slice(0, 7);
      if (monthMap[key]) monthMap[key].users += 1;
    });

    (txData || []).forEach(t => {
      if (t.status !== 'completed' && t.status !== 'succeeded') return;
      const key = t.created_at?.slice(0, 7);
      // Store raw VND — frontend converts to USD
      if (monthMap[key]) monthMap[key].revenue += Number(t.amount_usd) || 0;
    });

    return res.json({ success: true, data: months });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Recent activity ──────────────────────────────────────────────────────────

async function getRecentActivity(req, res) {
  try {
    const [{ data: recentUsers }, { data: recentTx }, { data: recentTests }] = await Promise.all([
      supabase.from('users').select('id, name, email, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('transactions').select('id, user_id, package_name, amount_usd, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('test_reports').select('id, project_id, status, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    // Enrich transactions with user name
    const txList = recentTx || [];
    if (txList.length > 0) {
      const ids = [...new Set(txList.map(t => t.user_id).filter(Boolean))];
      const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', ids);
      const map = {};
      (usersData || []).forEach(u => { map[u.id] = u; });
      txList.forEach(t => { t.user = map[t.user_id] || null; });
    }

    return res.json({
      success: true,
      data: {
        recentUsers: recentUsers || [],
        recentTransactions: txList,
        recentTests: recentTests || [],
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getStats, getUsers, getTransactions, getReviews, getChartData, getRecentActivity, getChatSessions, getChatMessages, adminReply, closeSession };
