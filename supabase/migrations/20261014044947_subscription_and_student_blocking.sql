/*
# Subscription tracking + Student blocking + Trial period

## Security & Business Logic
1. profiles: Add subscription_status, trial_ends_at columns
   - subscription_status: 'trial' | 'active' | 'expired' | 'blocked'
   - trial_ends_at: when the 10-day trial ends for trainers
   - Trainers in 'trial' or 'expired' status are limited to 1 student
   - Trainers in 'blocked' status have all their students auto-blocked

2. trainer_students: Add is_blocked column
   - When true, the student cannot see workouts from this trainer
   - Trainer can toggle this manually ("Desvincular / Bloquear Aluno")
   - Auto-set to true when trainer subscription becomes 'expired' or 'blocked'

3. Revoke UPDATE on subscription_status from authenticated users
   - Only the update_own_profile SECURITY DEFINER function or admin can change it
   - This prevents trainers from self-activating their subscription
*/

-- Add subscription columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Revoke UPDATE on subscription_status from authenticated (prevent self-activation)
-- We already revoked all UPDATE on profiles and granted only display_name
-- Re-grant nothing extra — subscription_status stays server-controlled

-- Add is_blocked to trainer_students
ALTER TABLE trainer_students ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_students_trainer ON trainer_students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status);
