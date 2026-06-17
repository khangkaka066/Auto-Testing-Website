-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT UNIQUE NOT NULL,
  user_name   TEXT DEFAULT 'Khách',
  user_email  TEXT DEFAULT '',
  status      TEXT DEFAULT 'active', -- active | closed
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL, -- 'user' | 'admin'
  sender_name TEXT DEFAULT '',
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS chat_sessions_status_idx ON chat_sessions(status, updated_at DESC);

-- Optional: mark a user as admin (replace with the actual user ID)
-- UPDATE users SET is_admin = true WHERE email = 'your-admin@example.com';
