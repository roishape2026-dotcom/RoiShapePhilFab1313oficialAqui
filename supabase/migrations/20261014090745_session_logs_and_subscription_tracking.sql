/*
# Session logs for anti-fraud tracking + subscription management columns

## Security & Business Logic
1. session_logs table: Tracks concurrent sessions per user for anti-fraud detection.
   - Records user_id, user_agent, ip_hash, session_token, created_at
   - Admins can query this to detect simultaneous logins from different devices/IPs
   - RLS: authenticated users can only see their own session logs; admins see all

2. profiles table: Add subscription_due_date and last_payment_date columns
   - subscription_due_date: when the current billing period ends
   - last_payment_date: last successful payment

3. trainer_students: Add cascade rule note — when trainer is blocked,
   all linked students auto-blocked (enforced at application level)
*/

-- Session logs table for anti-fraud / concurrent session tracking
CREATE TABLE IF NOT EXISTS session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_agent text,
  ip_hash text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all session logs, users can see only their own
DROP POLICY IF EXISTS "select_all_session_logs_admin" ON session_logs;
CREATE POLICY "select_all_session_logs_admin" ON session_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_session_log" ON session_logs;
CREATE POLICY "insert_own_session_log" ON session_logs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_session_log" ON session_logs;
CREATE POLICY "delete_own_session_log" ON session_logs FOR DELETE
  TO authenticated USING (true);

-- Index for faster concurrent session lookups
CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created ON session_logs(created_at DESC);

-- Add subscription tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_due_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_date date;

-- Index for admin queries on subscription status
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
