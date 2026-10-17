import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExercicioRow {
  id: string;
  nome: string;
  grupo_muscular: string;
  youtube_video_id: string | null;
  orientacao_biomecanica: string | null;
}

interface RequestBody {
  emphasis?: "inferiors" | "superiors" | "fullbody";
  focus_order?: "inferiors_first" | "superiors_first";
  trainer_id?: string;
}

const SYSTEM_PROMPT = `Você é o motor de inteligência artificial de prescrição de treinos do aplicativo ROI Shape.
Sua função é gerar planos de treino personalizados no formato estritamente JSON, seguindo o Método Phillip Sarraff.
REGRAS OBRIGATÓRIAS:
1. Use APENAS os nomes de exercícios padronizados da biblioteca oficial.
2. Não invente nomes de exercícios diferentes.
3. Siga a arquitetura Ênfase + Complemento:
   - BLOCO 1 (Ênfase): 3-4 exercícios de Força/Hipertrofia com Pirâmides Regressivas (ex: 4x 12/10/8/6).
   - BLOCO 2 (Complementar): 3-5 exercícios de Hipertrofia/Resistência com séries metabólicas (ex: 3x 15) e Bi-set/Super-série.
4. Retorne exclusivamente a estrutura JSON abaixo, sem marcações markdown ou explicações adicionais.
JSON Esperado:
{
  "treino_id": "string",
  "divisao": "string",
  "dias": [
    {
      "nome_treino": "string",
      "grupo_muscular_foco": "string",
      "exercicios": [
        {
          "id_exercicio": "string",
          "nome": "string",
          "series": number,
          "repeticoes": "string",
          "descanso_segundos": number,
          "tecnica_especial": "string"
        }
      ]
    }
  ]
}`;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Phillip Sarraff method: Ênfase (3-4 tension/force) + Complemento (3-5 metabolic/resistance)
function buildWorkoutPlan(
  exercises: ExercicioRow[],
  emphasis: "inferiors" | "superiors" | "fullbody",
  focusOrder: "inferiors_first" | "superiors_first"
) {
  const grupoMap: Record<string, string> = {
    "Peito": "superior",
    "Costas": "superior",
    "Ombros": "superior",
    "Braços": "superior",
    "Pernas": "inferior",
    "Core": "core",
  };

  const inferiores = exercises.filter((e) => grupoMap[e.grupo_muscular] === "inferior");
  const superiores = exercises.filter((e) => grupoMap[e.grupo_muscular] === "superior");
  const core = exercises.filter((e) => grupoMap[e.grupo_muscular] === "core");

  const isFullbody = emphasis === "fullbody";
  const primaryEmphasis = emphasis === "superiors" ? superiores : inferiores;
  const secondaryEmphasis = emphasis === "superiors" ? inferiores : superiores;

  const primaryDay = isFullbody
    ? (focusOrder === "inferiors_first" ? inferiores : superiores)
    : primaryEmphasis;
  const secondaryDay = isFullbody
    ? (focusOrder === "inferiors_first" ? superiores : inferiores)
    : secondaryEmphasis;

  const shuffledPrimary = shuffle(primaryDay);
  const shuffledSecondary = shuffle(secondaryDay);

  // Tension exercises (compound/multi-joint) for Ênfase block
  const tensionNames = [
    "Agachamento Livre", "Leg Press 45", "Stiff", "Supino Reto", "Supino Inclinado",
    "Puxada Alta", "Remada Curvada", "Desenvolvimento com Halteres", "Passada", "Agachamento Búlgaro",
    "Mesa Flexora"
  ];

  // Phillip Sarraff buildDay: Bloco Ênfase (3-4 pirâmides) + Bloco Complementar (3-5 metabólicos + Bi-set)
  const buildDay = (
    nomeTreino: string,
    grupoFoco: string,
    tensionExs: ExercicioRow[],
    metabolicExs: ExercicioRow[],
    coreExs: ExercicioRow[]
  ) => {
    // BLOCO 1: Ênfase — 3-4 exercícios, Pirâmides Regressivas com aumento de carga
    const enfaseExs = tensionExs.slice(0, 3).map((ex, i) => ({
      id_exercicio: ex.id,
      nome: ex.nome,
      series: 4,
      repeticoes: i === 0 ? "12/10/8/6" : i === 1 ? "15/12/10/8" : "10/8/6/4",
      descanso_segundos: i === 2 ? 90 : 120,
      tecnica_especial: "Pirâmide regressiva de carga",
    }));

    // BLOCO 2: Complementar — 3-5 exercícios, séries metabólicas + Bi-set
    const compExs: Array<{
      id_exercicio: string; nome: string; series: number;
      repeticoes: string; descanso_segundos: number; tecnica_especial: string;
    }> = [];

    const metabolicSlice = metabolicExs.slice(0, 2);
    metabolicSlice.forEach((ex, i) => {
      compExs.push({
        id_exercicio: ex.id,
        nome: ex.nome,
        series: 3,
        repeticoes: i === 0 ? "15" : "12/15/17",
        descanso_segundos: i === 0 ? 60 : 45,
        tecnica_especial: i === 1 ? "Pirâmide crescente" : "Séries contínuas metabólicas",
      });
    });

    // Bi-set: last metabolic + a core exercise (e.g. Bíceps na Polia + Abdominal Infra)
    const bisetMetabolic = metabolicExs[2] ?? metabolicExs[0];
    const bisetCore = coreExs[0] ?? core[0];
    if (bisetMetabolic) {
      compExs.push({
        id_exercicio: bisetMetabolic.id,
        nome: bisetMetabolic.nome,
        series: 3,
        repeticoes: "20",
        descanso_segundos: 45,
        tecnica_especial: `Bi-set A1 com ${bisetCore?.nome ?? 'Abdominal'} — sem descanso entre A1 e A2`,
      });
    }
    if (bisetCore) {
      compExs.push({
        id_exercicio: bisetCore.id,
        nome: bisetCore.nome,
        series: 3,
        repeticoes: "15",
        descanso_segundos: 45,
        tecnica_especial: `Bi-set A2 com ${bisetMetabolic?.nome ?? 'Bíceps'} — sem descanso entre A1 e A2`,
      });
    }

    return {
      nome_treino: nomeTreino,
      grupo_muscular_foco: grupoFoco,
      exercicios: [...enfaseExs, ...compExs],
    };
  };

  const primaryTension = shuffledPrimary.filter((e) => tensionNames.includes(e.nome));
  const primaryMetabolic = shuffledPrimary.filter((e) => !tensionNames.includes(e.nome));

  const secondaryTension = shuffledSecondary.filter((e) => tensionNames.includes(e.nome));
  const secondaryMetabolic = shuffledSecondary.filter((e) => !tensionNames.includes(e.nome));

  const primaryGrupos = [...new Set(primaryDay.map((e) => e.grupo_muscular))].join(", ");
  const secondaryGrupos = [...new Set(secondaryDay.map((e) => e.grupo_muscular))].join(", ");

  const primaryNome = primaryGrupos.includes("Pernas") ? "Treino A — Ênfase Inferiores" : "Treino A — Ênfase Superiores";
  const secondaryNome = secondaryGrupos.includes("Pernas") ? "Treino B — Ênfase Inferiores" : "Treino B — Ênfase Superiores";

  return {
    treino_id: `roi-${Date.now()}`,
    divisao: isFullbody ? "Fullbody AB (Alternada)" : `AB Split — ${primaryGrupos} / ${secondaryGrupos}`,
    dias: [
      buildDay(primaryNome, primaryGrupos, primaryTension, primaryMetabolic, core),
      buildDay(secondaryNome, secondaryGrupos, secondaryTension, secondaryMetabolic, core),
    ],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: RequestBody = {};
    if (req.method === "POST") {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    }

    const emphasis = body.emphasis ?? "inferiors";
    const focusOrder = body.focus_order ?? "inferiors_first";

    const { data: exercises, error: dbError } = await supabase
      .from("exercicios")
      .select("id, nome, grupo_muscular, youtube_video_id, orientacao_biomecanica")
      .order("nome");

    if (dbError || !exercises || exercises.length === 0) {
      return new Response(
        JSON.stringify({ error: "Biblioteca de exercícios vazia ou indisponível" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = buildWorkoutPlan(exercises as ExercicioRow[], emphasis, focusOrder);

    return new Response(
      JSON.stringify({ ...plan, system_prompt: SYSTEM_PROMPT }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
