async function createStatus(req, res) {
  const { client_name } = req.body;
  if (!client_name) return res.status(400).json({ error: 'client_name is required' });
  return res.json({ id: Date.now().toString(), client_name, timestamp: new Date().toISOString() });
}

async function getStatuses(req, res) {
  return res.json([]);
}

module.exports = { createStatus, getStatuses };
