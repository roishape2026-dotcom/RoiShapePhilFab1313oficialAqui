-- Add invite_token column to trainer_students for unique student invite links
ALTER TABLE trainer_students ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;

-- Allow student_id to be nullable (for pending invites before student signs up)
-- Already nullable per original schema, just ensuring

-- Index for invite token lookups
CREATE INDEX IF NOT EXISTS idx_trainer_students_invite_token ON trainer_students(invite_token) WHERE invite_token IS NOT NULL;
