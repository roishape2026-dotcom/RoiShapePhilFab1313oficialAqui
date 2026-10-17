/*
# Security Hardening + Student Management

## Security Fixes
1. PROBLEM: profiles table allows users to UPDATE their own role and plan_type.
   A student could promote themselves to admin/pro by sending a direct UPDATE.
   FIX: Create a SECURITY DEFINER function `update_own_profile` that only allows
   updating display_name and email — NOT role or plan_type. Revoke direct UPDATE
   on profiles from anon/authenticated, and grant EXECUTE on the safe function.

2. PROBLEM: anon role has full CRUD on all tables (grants show all columns).
   FIX: Revoke INSERT/UPDATE/DELETE from anon on profiles, workout_exercises,
   and workouts. Keep anon SELECT where needed for public reads.

## New Table: trainer_students
- Links a trainer (profile with role='trainer') to their students (profile with role='student')
- trainer_id: uuid REFERENCES auth.users(id)
- student_id: uuid REFERENCES auth.users(id)
- student_name, student_email: denormalized for quick display
- created_at: timestamp
- RLS: trainer can CRUD their own links; students can see who their trainer is

## Modified Tables
- profiles: Added column `trainer_id` (nullable uuid) so students can be linked to a trainer
  for workout assignment. The trainer can set this when assigning a workout.
*/

-- ============================================================
-- 1. SECURITY: Lock down profiles role/plan_type from self-update
-- ============================================================

-- Revoke all direct UPDATE/DELETE from anon on sensitive tables
REVOKE UPDATE ON profiles FROM anon;
REVOKE DELETE ON profiles FROM anon;
REVOKE INSERT ON profiles FROM anon;

-- Revoke excess privileges from anon on workouts and workout_exercises
REVOKE INSERT ON workouts FROM anon;
REVOKE UPDATE ON workouts FROM anon;
REVOKE DELETE ON workouts FROM anon;

REVOKE INSERT ON workout_exercises FROM anon;
REVOKE UPDATE ON workout_exercises FROM anon;
REVOKE DELETE ON workout_exercises FROM anon;

-- Revoke anon DML on bioimpedance and leads
REVOKE INSERT ON bioimpedance_records FROM anon;
REVOKE UPDATE ON bioimpedance_records FROM anon;
REVOKE DELETE ON bioimpedance_records FROM anon;

REVOKE INSERT ON leads FROM anon;
REVOKE UPDATE ON leads FROM anon;
REVOKE DELETE ON leads FROM anon;

-- Drop the existing update_own_profile policy and replace with a restricted one
-- that only allows updating display_name (not role, not plan_type)
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- Create a SECURITY DEFINER function for safe profile updates
CREATE OR REPLACE FUNCTION update_own_profile(p_display_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET display_name = p_display_name WHERE id = auth.uid();
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION update_own_profile(text) TO authenticated;

-- Re-create a restricted UPDATE policy that only allows updating display_name
-- The column-level GRANT below enforces which columns can be written
CREATE POLICY "update_own_profile_safe"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Revoke all column UPDATE privileges, then grant only display_name
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name) ON profiles TO authenticated;

-- ============================================================
-- 2. NEW TABLE: trainer_students
-- ============================================================

CREATE TABLE IF NOT EXISTS trainer_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text DEFAULT '',
  student_email text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(trainer_id, student_id)
);

ALTER TABLE trainer_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trainer_students" ON trainer_students;
CREATE POLICY "select_own_trainer_students"
ON trainer_students FOR SELECT
TO authenticated USING (auth.uid() = trainer_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "insert_own_trainer_students" ON trainer_students;
CREATE POLICY "insert_own_trainer_students"
ON trainer_students FOR INSERT
TO authenticated WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "update_own_trainer_students" ON trainer_students;
CREATE POLICY "update_own_trainer_students"
ON trainer_students FOR UPDATE
TO authenticated USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "delete_own_trainer_students" ON trainer_students;
CREATE POLICY "delete_own_trainer_students"
ON trainer_students FOR DELETE
TO authenticated USING (auth.uid() = trainer_id);

-- ============================================================
-- 3. Add trainer_id column to profiles (nullable, for student linking)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linked_trainer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
