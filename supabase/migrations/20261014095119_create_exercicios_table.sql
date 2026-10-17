/*
# Create exercicios table — shared exercise library

1. New Tables
- `exercicios` — central exercise library accessible by all authenticated users
  - `id` (text, primary key) — slug-style identifier (e.g. "supino-reto")
  - `nome` (text, not null, unique) — exercise name in Portuguese
  - `grupo_muscular` (text, not null) — muscle group (e.g. "Peito", "Costas", "Pernas")
  - `youtube_video_id` (text, nullable) — YouTube video ID for embed
  - `url_video_interna` (text, nullable) — internal/video URL fallback
  - `orientacao_biomecanica` (text, nullable) — biomechanics guidance text
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `exercicios`.
- SELECT: any authenticated user (trainers and students) can browse the library.
- INSERT/UPDATE/DELETE: restricted to admin master emails only.
- Admin emails: fcassessoria13@gmail.com, contato@roishape.com.br, roishape2026@gmail.com

3. Important Notes
- This table is a shared reference catalog — it is NOT user-scoped.
- YouTube URLs stored as video IDs convert directly to embed format.
- The `id` column uses TEXT (not uuid) to allow slug-based lookups.
*/

CREATE TABLE IF NOT EXISTS public.exercicios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    grupo_muscular TEXT NOT NULL,
    youtube_video_id TEXT,
    url_video_interna TEXT,
    orientacao_biomecanica TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the exercise library
DROP POLICY IF EXISTS "select_exercicios" ON public.exercicios;
CREATE POLICY "select_exercicios"
ON public.exercicios FOR SELECT
TO authenticated
USING (true);

-- Only admin master emails can insert
DROP POLICY IF EXISTS "insert_exercicios_admin" ON public.exercicios;
CREATE POLICY "insert_exercicios_admin"
ON public.exercicios FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'fcassessoria13@gmail.com',
    'contato@roishape.com.br',
    'roishape2026@gmail.com'
  )
);

-- Only admin master emails can update
DROP POLICY IF EXISTS "update_exercicios_admin" ON public.exercicios;
CREATE POLICY "update_exercicios_admin"
ON public.exercicios FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'fcassessoria13@gmail.com',
    'contato@roishape.com.br',
    'roishape2026@gmail.com'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'fcassessoria13@gmail.com',
    'contato@roishape.com.br',
    'roishape2026@gmail.com'
  )
);

-- Only admin master emails can delete
DROP POLICY IF EXISTS "delete_exercicios_admin" ON public.exercicios;
CREATE POLICY "delete_exercicios_admin"
ON public.exercicios FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'fcassessoria13@gmail.com',
    'contato@roishape.com.br',
    'roishape2026@gmail.com'
  )
);

-- Index for fast name/group searches
CREATE INDEX IF NOT EXISTS idx_exercicios_nome ON public.exercicios (nome);
CREATE INDEX IF NOT EXISTS idx_exercicios_grupo ON public.exercicios (grupo_muscular);
