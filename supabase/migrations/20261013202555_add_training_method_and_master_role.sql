-- Add training_method column to workout_exercises
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS training_method text DEFAULT 'normal'
  CHECK (training_method = ANY (ARRAY['normal'::text, 'pyramid'::text, 'dropset'::text, 'biset'::text]));

-- Add notes field for extra method details (e.g. "3x 4 reps com 15s descanso")
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS method_notes text DEFAULT '';

-- Update profiles role constraint to include 'master'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['trainer'::text, 'student'::text, 'admin'::text, 'master'::text]));
