const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const { MONGO_URL, DB_NAME } = require('../../config/env');

let db = null;
if (MONGO_URL) {
  MongoClient.connect(MONGO_URL)
    .then(client => { db = client.db(DB_NAME); })
    .catch(err => console.error('MongoDB connection error:', err.message));
}

async function createStatus(req, res) {
  const { client_name } = req.body;
  if (!client_name) return res.status(400).json({ error: 'client_name is required' });

  const record = { id: uuidv4(), client_name, timestamp: new Date().toISOString() };
  if (db) {
    try { await db.collection('status_checks').insertOne({ ...record }); } catch {}
  }
  return res.json(record);
}

async function getStatuses(req, res) {
  if (db) {
    try {
      const checks = await db.collection('status_checks')
        .find({}, { projection: { _id: 0 } })
        .limit(1000)
        .toArray();
      return res.json(checks);
    } catch {}
  }
  return res.json([]);
}

module.exports = { createStatus, getStatuses };
