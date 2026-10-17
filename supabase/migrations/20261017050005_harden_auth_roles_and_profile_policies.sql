/*
# Harden Authentication, Role Separation, and Profile Security

## Purpose
Fix critical security flaws: fake login bypass, cross-role leaks, and insecure profile policies.
This migration enforces strict role-based access control at the database level.

## Changes

### 1. Role constraint on profiles.role
- Restrict `role` column to exactly: `'admin'`, `'personal'`, `'student'`.
- Existing `'master'` or `'trainer'` values are migrated to their correct equivalents:
  - `'master'` → `'admin'`
  - `'trainer'` → `'personal'`
- This is a data correction, NOT a column drop or type change — no data is lost.

### 2. Harden handle_new_user trigger function
- Public signups (no metadata role) → `role = 'personal'` (default for new trainers).
- Signups with `raw_user_meta_data.role = 'student'` → `role = 'student'` (created by trainer via invite).
- Master emails (`roishape2026@gmail.com`, `contato@roishape.com.br`) → `role = 'admin'`.
- Also sets `linked_trainer_id` from metadata when present (for student invites).
- Sets `plan_type` and `subscription_status` appropriately per role.
- Uses `NEW.raw_user_meta_data` (user-mutable) for role hints ONLY at signup time.
  The authoritative role lives in the `profiles` table, not in JWT metadata.

### 3. Fix profiles RLS policies
- Remove `anon` SELECT grant (no unauthenticated access to profiles).
- Keep `authenticated` SELECT scoped to own profile.
- Keep INSERT scoped to own profile (trigger handles most inserts, but client
  may need to insert during signup flow before the trigger fires).
- UPDATE: restrict to `display_name` column only via column-level privilege.
  Users must NOT be able to change their own `role`, `plan_type`,
  `subscription_status`, `trial_ends_at`, etc.
- Add DELETE policy for own profile (account deletion).

### 4. Revoke dangerous grants
- Revoke `anon` SELECT on profiles.
- Revoke `authenticated` UPDATE on all columns; grant only `display_name`.

## Security
- RLS remains enabled on profiles.
- All policies use `auth.uid()` for ownership.
- No `USING (true)` shortcuts on profiles.
- Column-level privilege prevents privilege escalation via UPDATE.
*/

-- ──────────────────────────────────────────────
-- 1. Migrate existing role values and add constraint
-- ──────────────────────────────────────────────

UPDATE profiles SET role = 'admin' WHERE role = 'master';
UPDATE profiles SET role = 'personal' WHERE role = 'trainer';

-- Drop any existing check constraint on role, then add the strict one
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'personal', 'student'));

-- Ensure subscription_status has a check constraint too
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('active', 'trial', 'expired', 'blocked'));

-- Ensure plan_type has a check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_type_check
  CHECK (plan_type IN ('free', 'starter', 'pro'));

-- ──────────────────────────────────────────────
-- 2. Harden handle_new_user trigger function
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_plan text;
  v_sub text;
  v_trainer_id uuid;
  v_display_name text;
  v_phone text;
  is_master boolean;
BEGIN
  is_master := NEW.email IN ('roishape2026@gmail.com', 'contato@roishape.com.br');

  -- Determine role from metadata or master email list
  IF is_master THEN
    v_role := 'admin';
    v_plan := 'pro';
    v_sub := 'active';
  ELSIF NEW.raw_user_meta_data ? 'role' AND NEW.raw_user_meta_data->>'role' = 'student' THEN
    v_role := 'student';
    v_plan := 'free';
    v_sub := 'active';
  ELSE
    -- Public signup defaults to personal (trainer)
    v_role := 'personal';
    v_plan := 'free';
    v_sub := 'trial';
  END IF;

  -- Extract optional fields from metadata
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_trainer_id := NULLIF(NEW.raw_user_meta_data->>'personal_id', '')::uuid;

  INSERT INTO public.profiles (
    id, email, display_name, role, plan_type, subscription_status,
    linked_trainer_id, trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_role,
    v_plan,
    v_sub,
    v_trainer_id,
    CASE WHEN v_role = 'personal' AND NOT is_master
         THEN now() + interval '10 days'
         ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    plan_type = EXCLUDED.plan_type,
    subscription_status = EXCLUDED.subscription_status,
    linked_trainer_id = EXCLUDED.linked_trainer_id,
    trial_ends_at = EXCLUDED.trial_ends_at;

  RETURN NEW;
END;
$function$;

-- ──────────────────────────────────────────────
-- 3. Fix profiles RLS policies
-- ──────────────────────────────────────────────

-- Revoke dangerous grants
REVOKE SELECT ON profiles FROM anon;
REVOKE UPDATE ON profiles FROM authenticated;
REVOKE DELETE ON profiles FROM anon;

-- Grant only display_name UPDATE to authenticated (column-level privilege)
GRANT UPDATE (display_name) ON profiles TO authenticated;

-- Drop and recreate policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile_safe" ON profiles;

-- SELECT: users can read only their own profile
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT: users can insert their own profile (for edge cases where trigger hasn't fired)
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: users can update only their own profile (column privilege limits to display_name)
CREATE POLICY "update_own_profile_safe"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: users can delete their own profile
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ──────────────────────────────────────────────
-- 4. Harden session_logs (remove open DELETE/UPDATE)
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "delete_own_session_log" ON session_logs;
DROP POLICY IF EXISTS "insert_own_session_log" ON session_logs;
DROP POLICY IF EXISTS "select_all_session_logs_admin" ON session_logs;

-- Only admins can view all session logs; users can see their own
CREATE POLICY "select_own_session_logs"
ON session_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all session logs
CREATE POLICY "select_all_session_logs_admin"
ON session_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Anyone authenticated can insert a session log (login tracking)
CREATE POLICY "insert_session_logs"
ON session_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- No UPDATE or DELETE policies — session logs are immutable
REVOKE UPDATE ON session_logs FROM anon, authenticated;
REVOKE DELETE ON session_logs FROM anon, authenticated;

-- ──────────────────────────────────────────────
-- 5. Fix exercicios — remove anon write access
-- ──────────────────────────────────────────────

REVOKE INSERT, UPDATE, DELETE ON exercicios FROM anon;
