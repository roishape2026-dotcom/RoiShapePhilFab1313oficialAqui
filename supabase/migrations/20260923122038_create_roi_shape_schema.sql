/*
# Fullbody ROI Shape - Core Schema

1. New Tables
- `profiles`: Extends auth.users with role (trainer/student/admin), display_name, plan_type.
- `workouts`: Workout sheets created by trainers, optionally assigned to students.
- `workout_exercises`: Individual exercises within a workout, organized by block (tension/metabolic).
- `bioimpedance_records`: Omron HBF-514C bioimpedance measurements for tracking body composition.
- `leads`: CRM leads from WhatsApp for the traffic hub Kanban board.

2. Security
- RLS enabled on all tables.
- Owner-scoped CRUD policies using auth.uid().
- Profiles: users can read/update their own profile.
- Workouts: trainers can CRUD their own workouts; students can read workouts assigned to them.
- Workout exercises: scoped through parent workout ownership.
- Bioimpedance: users can CRUD their own records.
- Leads: owner-scoped CRUD.

3. Notes
- Admin emails (contato@roishape.com.br, roishape2026@gmail.com, fcassessoria13@gmail.com) get admin role via trigger on signup.
- Owner columns default to auth.uid() so inserts work without explicitly passing user_id.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('trainer', 'student', 'admin')),
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'pro')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile + assign admin role for official emails on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email IN ('contato@roishape.com.br', 'roishape2026@gmail.com', 'fcassessoria13@gmail.com') THEN 'admin'
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Treino Fullbody',
  day_focus text NOT NULL DEFAULT 'fullbody',
  focus_order text NOT NULL DEFAULT 'inferiors_first',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_workouts" ON workouts;
CREATE POLICY "select_own_workouts" ON workouts FOR SELECT
  TO authenticated USING (
    auth.uid() = trainer_id OR auth.uid() = student_id
  );

DROP POLICY IF EXISTS "insert_own_workouts" ON workouts;
CREATE POLICY "insert_own_workouts" ON workouts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "update_own_workouts" ON workouts;
CREATE POLICY "update_own_workouts" ON workouts FOR UPDATE
  TO authenticated USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "delete_own_workouts" ON workouts;
CREATE POLICY "delete_own_workouts" ON workouts FOR DELETE
  TO authenticated USING (auth.uid() = trainer_id);

-- Workout exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  block_type text NOT NULL DEFAULT 'tension' CHECK (block_type IN ('tension', 'metabolic')),
  sets_count int NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '8-12',
  rest_seconds int NOT NULL DEFAULT 90,
  youtube_url text DEFAULT '',
  exercise_order int NOT NULL DEFAULT 0,
  target_muscle text DEFAULT '',
  secondary_muscles text DEFAULT '',
  biomechanics_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_workout_exercises" ON workout_exercises;
CREATE POLICY "select_workout_exercises" ON workout_exercises FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND (workouts.trainer_id = auth.uid() OR workouts.student_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_workout_exercises" ON workout_exercises;
CREATE POLICY "insert_workout_exercises" ON workout_exercises FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_workout_exercises" ON workout_exercises;
CREATE POLICY "update_workout_exercises" ON workout_exercises FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.trainer_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_workout_exercises" ON workout_exercises;
CREATE POLICY "delete_workout_exercises" ON workout_exercises FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.trainer_id = auth.uid()
    )
  );

-- Bioimpedance records table
CREATE TABLE IF NOT EXISTS bioimpedance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,1) NOT NULL,
  height_cm numeric(5,1) NOT NULL,
  age int NOT NULL,
  gender text NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  body_fat_pct numeric(5,1),
  muscle_mass_pct numeric(5,1),
  visceral_fat_level int,
  basal_metabolism int,
  body_mass_index numeric(5,1),
  fat_mass_kg numeric(5,1),
  lean_mass_kg numeric(5,1),
  skeletal_muscle_pct numeric(5,1),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bioimpedance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bioimpedance" ON bioimpedance_records;
CREATE POLICY "select_own_bioimpedance" ON bioimpedance_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bioimpedance" ON bioimpedance_records;
CREATE POLICY "insert_own_bioimpedance" ON bioimpedance_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bioimpedance" ON bioimpedance_records;
CREATE POLICY "update_own_bioimpedance" ON bioimpedance_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bioimpedance" ON bioimpedance_records;
CREATE POLICY "delete_own_bioimpedance" ON bioimpedance_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Leads table (CRM Kanban)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  source text NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'meta_ads', 'google_ads', 'tiktok_ads', 'youtube', 'organic', 'referral')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_leads" ON leads;
CREATE POLICY "select_own_leads" ON leads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_leads" ON leads;
CREATE POLICY "insert_own_leads" ON leads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_leads" ON leads;
CREATE POLICY "update_own_leads" ON leads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_leads" ON leads;
CREATE POLICY "delete_own_leads" ON leads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workouts_trainer ON workouts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workouts_student ON workouts(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_bioimpedance_user ON bioimpedance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);