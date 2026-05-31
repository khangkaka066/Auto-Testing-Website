-- Bảng lưu lịch sử giao dịch nạp tiền
CREATE TABLE IF NOT EXISTS transactions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_name          text,
  credits_added         integer NOT NULL DEFAULT 0,
  amount_usd            numeric(10,2) NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'pending', -- pending | completed | failed
  stripe_session_id     text UNIQUE,
  stripe_payment_intent text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON transactions (user_id, created_at DESC);
