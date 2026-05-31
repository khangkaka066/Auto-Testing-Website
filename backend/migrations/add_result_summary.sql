-- 1. Full test result persistence
ALTER TABLE test_reports
  ADD COLUMN IF NOT EXISTS result_summary jsonb;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_test_reports_user_status
  ON test_reports (user_id, status);

CREATE INDEX IF NOT EXISTS idx_test_reports_user_start_time
  ON test_reports (user_id, start_time DESC);

-- 3. Atomic token increment — tránh race condition khi nhiều jobs chạy song song
CREATE OR REPLACE FUNCTION increment_user_tokens(p_user_id uuid, p_tokens integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE users
  SET tokens_used = tokens_used + p_tokens,
      credits     = GREATEST(0, credits - p_tokens)
  WHERE id = p_user_id;
$$;
