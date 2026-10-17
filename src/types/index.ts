export type UserRole = 'admin' | 'personal' | 'student';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  plan_type: 'free' | 'starter' | 'pro';
  subscription_status?: 'active' | 'trial' | 'expired' | 'blocked';
  trial_ends_at?: string | null;
  subscription_due_date?: string | null;
  last_payment_date?: string | null;
  linked_trainer_id?: string | null;
}

export interface TrainerStudent {
  id: string;
  trainer_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  is_blocked: boolean;
  created_at: string;
}

export interface Workout {
  id: string;
  trainer_id: string;
  student_id: string | null;
  name: string;
  day_focus: string;
  focus_order: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  block_type: 'tension' | 'metabolic';
  sets_count: number;
  reps: string;
  rest_seconds: number;
  youtube_url: string;
  exercise_order: number;
  target_muscle: string;
  secondary_muscles: string;
  biomechanics_notes: string;
  training_method: 'normal' | 'pyramid' | 'dropset' | 'biset';
  method_notes: string;
}

export interface BioimpedanceRecord {
  id: string;
  user_id: string;
  record_date: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female';
  body_fat_pct: number | null;
  muscle_mass_pct: number | null;
  visceral_fat_level: number | null;
  basal_metabolism: number | null;
  body_mass_index: number | null;
  fat_mass_kg: number | null;
  lean_mass_kg: number | null;
  skeletal_muscle_pct: number | null;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
  youtube_video_id: string | null;
  url_video_interna: string | null;
  orientacao_biomecanica: string | null;
  created_at: string;
}
