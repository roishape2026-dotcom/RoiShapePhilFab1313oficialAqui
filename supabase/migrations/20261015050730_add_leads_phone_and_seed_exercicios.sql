/*
# Add leads phone column and seed exercicios table

1. Changes to `leads` table:
- Add `phone` column (text, nullable) — captures WhatsApp/phone during lead signup
- Add `email` column (text, nullable) — captures email during lead signup

2. Changes to `exercicios` table:
- Seed the exercicios table with the ROI Shape exercise library so the AI workout generator and exercise search have data to work with.

3. Security
- The leads table already has RLS enabled. No new policies needed — existing policies remain.
- The exercicios table already has RLS enabled. No new policies needed.
*/

-- Add phone and email columns to leads table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone') THEN
    ALTER TABLE leads ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
    ALTER TABLE leads ADD COLUMN email text;
  END IF;
END $$;

-- Seed exercicios table with ROI Shape library (idempotent — uses ON CONFLICT)
INSERT INTO exercicios (id, nome, grupo_muscular, youtube_video_id, orientacao_biomecanica) VALUES
  ('ex-supino-reto', 'Supino Reto', 'Peito', 'eQjZgyyBJMc', 'Pressão horizontal recrutando peitoral, deltoides anteriores e tríceps.'),
  ('ex-supino-inclinado', 'Supino Inclinado', 'Peito', 'eufDL9MmF8A', 'Pressão horizontal inclinada enfatizando feixes claviculares do peitoral.'),
  ('ex-crossover', 'Crossover', 'Peito', '0uB7PH3oFVo', 'Tração cruzada isolando peitoral com tensão contínua da polia.'),
  ('ex-flexao-braco', 'Flexão de Braço', 'Peito', 'I_uBK4DDflU', 'Pressão horizontal com peso corporal. Recruta peitoral, tríceps e deltoides.'),
  ('ex-supino-articulado', 'Supino Articulado', 'Peito', 'p8xQJHqD5ug', 'Máquina guiada que permite trajeto natural do movimento de pressão horizontal.'),
  ('ex-puxada-alta', 'Puxada Alta', 'Costas', 'JSZ14mZY5Mo', 'Tração vertical na polia alta recrutando dorsais e romboides.'),
  ('ex-remada-curvada', 'Remada Curvada', 'Costas', '50AkPBZwACQ', 'Tração horizontal recrutando dorsais, romboides e trapézio.'),
  ('ex-remada-baixa', 'Remada Baixa', 'Costas', 'dgnvHzvNOIk', 'Tração horizontal na polia baixa com apoio torácico. Tensão contínua.'),
  ('ex-remada-triangulo', 'Remada Triângulo', 'Costas', 'dgnvHzvNOIk', 'Tração horizontal com pegada triangular. Foco em dorsais e romboides.'),
  ('ex-puxada-frontal', 'Puxada Frontal', 'Costas', 'JSZ14mZY5Mo', 'Tração vertical com pegada frontal. Foco em dorsais com maior amplitude.'),
  ('ex-pulldown', 'Pulldown', 'Costas', '01YCC3W5qLo', 'Tração vertical na polia alta com pegada aberta. Isolamento de dorsais.'),
  ('ex-remada-unilateral', 'Remada Unilateral', 'Costas', '6SbZlzMXYoI', 'Tração horizontal unilateral com halter. Permite maior amplitude e correção de assimetrias.'),
  ('ex-desenvolvimento-halteres', 'Desenvolvimento com Halteres', 'Ombros', 'MmHTcVK-1tU', 'Pressão vertical recrutando deltoides e tríceps. Halteres permitem maior amplitude.'),
  ('ex-elevacao-lateral', 'Elevação Lateral', 'Ombros', 'eufDL9MmF8A', 'Abdução de ombro isolando deltoides médios. Movimento controlado.'),
  ('ex-elevacao-frontal', 'Elevação Frontal', 'Ombros', 'eufDL9MmF8A', 'Flexão de ombro isolando deltoides anteriores.'),
  ('ex-crucifixo-inverso', 'Crucifixo Inverso', 'Ombros', '0uB7PH3oFVo', 'Abdução horizontal inversa isolando deltoides posteriores e romboides.'),
  ('ex-desenvolvimento-arnold', 'Desenvolvimento Arnold', 'Ombros', 'MmHTcVK-1tU', 'Pressão vertical com rotação durante o movimento. Recruta todas as cabeças do deltoide.'),
  ('ex-agachamento-livre', 'Agachamento Livre', 'Pernas', '6ppjJrbrW7g', 'Movimento multiarticular recrutando quadríceps, glúteos e posteriores.'),
  ('ex-leg-press', 'Leg Press 45', 'Pernas', 'waAxlYvtCcI', 'Pressão de quadril e joelho com carga guiada. Posição dos pés determina ênfase.'),
  ('ex-stiff', 'Stiff', 'Pernas', 'jSomWOwLiGE', 'Hip hinge com joelhos semi-estendidos, maximizando alongamento dos posteriores.'),
  ('ex-cadeira-extensora', 'Cadeira Extensora', 'Pernas', 'pJZXbaF-MCM', 'Isolamento de quadríceps com tensão contínua. Ideal para hipoxia e pump.'),
  ('ex-mesa-flexora', 'Mesa Flexora', 'Pernas', 'y6juG3XuRe4', 'Isolamento de posteriores de coxa com flexão de joelho deitado. Tensão contínua.'),
  ('ex-passada', 'Passada', 'Pernas', 'I_uBK4DDflU', 'Movimento unilateral com peso corporal ou carga. Recruta quadríceps e glúteos.'),
  ('ex-agachamento-bulgaro', 'Agachamento Búlgaro', 'Pernas', '6ppjJrbrW7g', 'Agachamento unilateral com pé de trás elevado. Máxima ativação de quadríceps e glúteos.'),
  ('ex-cadeira-abdutora', 'Cadeira Abdutora', 'Pernas', 'p8xQJHqD5ug', 'Abdução de quadril isolando glúteo médio. Tensão contínua para pump.'),
  ('ex-cadeira-adutora', 'Cadeira Adutora', 'Pernas', 'p8xQJHqD5ug', 'Isolamento de adutores com adução controlada. Bom para estresse metabólico.'),
  ('ex-elevacao-pelvica', 'Elevação Pélvica', 'Pernas', '5KYtuo5Y-sg', 'Extensão de quadril com apoio dorsal. Máxima ativação do glúteo máximo.'),
  ('ex-rosca-direta', 'Rosca Direta', 'Braços', 'dgnvHzvNOIk', 'Flexão de cotovelo isolando bíceps. Tensão contínua para pump.'),
  ('ex-rosca-polia', 'Rosca na Polia', 'Braços', 'dgnvHzvNOIk', 'Flexão de cotovelo na polia baixa. Tensão contínua e constante.'),
  ('ex-rosca-alternada', 'Rosca Alternada', 'Braços', 'dgnvHzvNOIk', 'Flexão de cotovelo unilateral alternada com halteres. Permite supinação ativa.'),
  ('ex-rosca-martelo', 'Rosca Martelo', 'Braços', 'dgnvHzvNOIk', 'Flexão de cotovelo com pegada neutra. Enfatiza braquiorradial e braquial.'),
  ('ex-triceps-pulley', 'Tríceps Pulley', 'Braços', '6SbZlzMXYoI', 'Extensão de cotovelo na polia alta isolando tríceps. Tensão contínua.'),
  ('ex-triceps-testa', 'Tríceps Testa', 'Braços', '6SbZlzMXYoI', 'Extensão de cotovelo deitado com barra. Alongamento máximo da cabeça longa.'),
  ('ex-triceps-coice', 'Tríceps Coice', 'Braços', '6SbZlzMXYoI', 'Extensão de cotovelo unilateral na polia alta. Isolamento da cabeça longa.'),
  ('ex-triceps-corda', 'Tríceps Corda', 'Braços', '6SbZlzMXYoI', 'Extensão de cotovelo com corda. Permite separar as mãos na extensão final.'),
  ('ex-crucifixo-maquina', 'Crucifixo Máquina', 'Peito', 'p8xQJHqD5ug', 'Tração cruzada em máquina. Tensão contínua isolando peitoral.'),
  ('ex-abdominal-infra', 'Abdominal Infra', 'Core', 'el3oHblB5DM', 'Flexão de quadril e tronco enfatizando a porção inferior do reto abdominal.'),
  ('ex-abdominal-supra', 'Abdominal Supra', 'Core', 'el3oHblB5DM', 'Flexão de tronco isolando a porção superior do reto abdominal.'),
  ('ex-prancha-ventral', 'Prancha Ventral', 'Core', 'I_uBK4DDflU', 'Estabilização isométrica recrutando todo o core. Tensão contínua.'),
  ('ex-prancha-lateral', 'Prancha Lateral', 'Core', 'I_uBK4DDflU', 'Estabilização isométrica lateral recrutando oblíquos e glúteo médio.'),
  ('ex-hyperextensao-lombar', 'Hipertextensão Lombar', 'Core', 'jSomWOwLiGE', 'Extensão de quadril e coluna no banco romano. Fortalece cadeia posterior.')
ON CONFLICT (nome) DO UPDATE SET
  youtube_video_id = EXCLUDED.youtube_video_id,
  orientacao_biomecanica = EXCLUDED.orientacao_biomecanica,
  grupo_muscular = EXCLUDED.grupo_muscular;
