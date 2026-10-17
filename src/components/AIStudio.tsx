import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { EXERCISE_LIBRARY, type ExerciseData } from '@/data/exercises';
import {
  Sparkles, Zap, Loader2, Copy, Check, Dumbbell, AlertTriangle,
  Target, Activity, Users
} from 'lucide-react';

const OBJECTIVES = [
  { key: 'hipertrofia', label: 'Hipertrofia' },
  { key: 'forca', label: 'Força' },
  { key: 'resistencia', label: 'Resistência' },
  { key: 'emagrecimento', label: 'Emagrecimento' },
  { key: 'reabilitacao', label: 'Reabilitação' },
];

const LEVELS = [
  { key: 'iniciante', label: 'Iniciante' },
  { key: 'intermediario', label: 'Intermediário' },
  { key: 'avancado', label: 'Avançado' },
];

const EQUIPMENT = [
  'Halteres', 'Barra fixa', 'Polias', 'Máquinas', 'Barras', 'Anilhas',
  'Banco', 'Kettlebell', 'Bands/Elásticos', 'Apenas peso do corpo',
];

export function AIStudio() {
  const { session } = useAuth();
  const [objective, setObjective] = useState('hipertrofia');
  const [level, setLevel] = useState('intermediario');
  const [restrictions, setRestrictions] = useState('');
  const [equipment, setEquipment] = useState<string[]>(['Halteres', 'Polias', 'Máquinas', 'Banco']);
  const [emphasis, setEmphasis] = useState<'inferiors' | 'superiors' | 'fullbody'>('fullbody');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<{ name: string; workoutId: string } | null>(null);

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const buildPrompt = () => {
    const obj = OBJECTIVES.find((o) => o.key === objective)?.label ?? objective;
    const lvl = LEVELS.find((l) => l.key === level)?.label ?? level;
    const equip = equipment.join(', ') || 'Sem equipamentos especificados';
    const restrict = restrictions.trim() || 'Nenhuma restrição articular ou lesão relatada';
    const emph = emphasis === 'inferiors' ? 'Membros Inferiores' : emphasis === 'superiors' ? 'Membros Superiores' : 'Fullbody Completo';

    return `Você é um Personal Trainer especialista no Método Fullbody ROI Shape (R — Respiração, O — Organização, I — Intensidade).

Gere uma ficha de treino personalizada com os seguintes parâmetros:

OBJETIVO: ${obj}
NÍVEL DO ALUNO: ${lvl}
ÊNFASE: ${emph}
EQUIPAMENTOS DISPONÍVEIS: ${equip}
RESTRIÇÕES ARTICULARES/LESES: ${restrict}

ESTRUTURA OBRIGATÓRIA (Método ROI Shape):
- Bloco 1 (Tensão Mecânica): 2-3 exercícios compostos/multiarticulares, pirâmide ou 4-8 reps até falha, descanso 90-180s. Tag: "🎯 Foco: Tensão Mecânica"
- Bloco 2 (Estresse Metabólico): 3-4 exercícios isoladores/máquinas, 12-25 reps (alto volume e pump), descanso 30-60s. Tag: "⚡ Foco: Estresse Metabólico"

PRINCÍPIOS R.O.I.:
- R: Controle respiratório e intra-abdominal durante toda a execução
- O: Conexão neuro-muscular e organização postural
- I: Carga progressiva e falha mecânica precisa

Para cada exercício, forneça:
1. Nome do exercício
2. Bloco (Tensão ou Metabólico)
3. Séries x Repetições
4. Tempo de descanso (segundos)
5. Técnica especial (Normal, Pirâmide, Drop-set, Bi-set)
6. Músculo alvo
7. Observação biomecânica breve

Adapte os exercícios considerando as restrições articulares e os equipamentos disponíveis.`;
  };

  const handleGeneratePrompt = () => {
    setGeneratedPrompt(buildPrompt());
    setGeneratedWorkout(null);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateWorkout = async () => {
    if (!session?.user) return;
    setGenerating(true);
    setGeneratedWorkout(null);

    const focusOrder = emphasis === 'inferiors' ? 'inferiors_first' : emphasis === 'superiors' ? 'superiors_first' : 'inferiors_first';
    const name = `Treino IA ${OBJECTIVES.find((o) => o.key === objective)?.label ?? ''} — ${new Date().toLocaleDateString('pt-BR')}`;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-workout`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ emphasis, focus_order: focusOrder, trainer_id: session.user.id }),
      });

      if (!res.ok) throw new Error(`Falha (${res.status})`);
      const plan = await res.json();

      type PlanExercise = { id_exercicio: string; nome: string; series: number; repeticoes: string; descanso_segundos: number; tecnica_especial: string };
      type PlanDia = { exercicios: PlanExercise[] };
      type PlanResponse = { dias?: PlanDia[]; divisao?: string };

      const typedPlan = plan as PlanResponse;
      const allExercises: Array<Record<string, unknown>> = [];

      for (const dia of typedPlan.dias ?? []) {
        for (let idx = 0; idx < dia.exercicios.length; idx++) {
          const ex = dia.exercicios[idx];
          const libEx = EXERCISE_LIBRARY.find((e) => e.name === ex.nome);
          const techLower = (ex.tecnica_especial || '').toLowerCase();
          const method = techLower.includes('pirâmide') ? 'pyramid'
            : techLower.includes('drop') ? 'dropset'
            : techLower.includes('bi-set') ? 'biset'
            : 'normal';
          allExercises.push({
            workout_id: '',
            exercise_name: ex.nome,
            block_type: (libEx?.blockType ?? (idx < 3 ? 'tension' : 'metabolic')) as 'tension' | 'metabolic',
            sets_count: ex.series,
            reps: ex.repeticoes,
            rest_seconds: ex.descanso_segundos,
            exercise_order: idx,
            target_muscle: libEx?.targetMuscle ?? '',
            secondary_muscles: libEx?.secondaryMuscles.join(', ') ?? '',
            biomechanics_notes: libEx?.biomechanics ?? '',
            youtube_url: libEx?.youtubeUrl ?? `https://www.youtube.com/watch?v=${ex.id_exercicio}`,
            training_method: method as 'normal' | 'pyramid' | 'dropset' | 'biset',
            method_notes: ex.tecnica_especial || '',
          });
        }
      }

      const workoutName = `${typedPlan.divisao ?? name} — ${new Date().toLocaleDateString('pt-BR')}`;
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({ trainer_id: session.user.id, name: workoutName, focus_order: focusOrder, day_focus: emphasis })
        .select().single();
      if (workoutError || !workoutData) throw new Error('Falha ao criar ficha');

      const inserts = allExercises.map((ex) => ({ ...ex, workout_id: workoutData.id }));
      await supabase.from('workout_exercises').insert(inserts);

      setGeneratedWorkout({ name: workoutName, workoutId: workoutData.id });
    } catch {
      const cat = emphasis === 'inferiors' || emphasis === 'fullbody' ? 'inferior' : 'superior';
      const compCat = cat === 'inferior' ? 'superior' : 'inferior';
      const tension = EXERCISE_LIBRARY.filter((e) => e.blockType === 'tension' && e.category === cat).slice(0, 3);
      const comp = EXERCISE_LIBRARY.filter((e) => e.blockType === 'metabolic' && e.category === compCat).slice(0, 3);

      const { data: wd, error } = await supabase
        .from('workouts')
        .insert({ trainer_id: session.user.id, name, focus_order: focusOrder, day_focus: emphasis })
        .select().single();
      if (error || !wd) { setGenerating(false); return; }

      const build = (ex: ExerciseData, i: number, m: 'normal' | 'pyramid' | 'dropset' | 'biset', reps: string, sets: number, rest: number, notes: string) => ({
        workout_id: wd.id, exercise_name: ex.name, block_type: ex.blockType, sets_count: sets, reps, rest_seconds: rest,
        exercise_order: i, target_muscle: ex.targetMuscle, secondary_muscles: ex.secondaryMuscles.join(', '),
        biomechanics_notes: ex.biomechanics, youtube_url: ex.youtubeUrl, training_method: m, method_notes: notes,
      });
      const inserts: ReturnType<typeof build>[] = [];
      if (tension[0]) inserts.push(build(tension[0], 0, 'pyramid', '12/10/8/6', 4, 120, 'Pirâmide regressiva'));
      if (tension[1]) inserts.push(build(tension[1], 1, 'dropset', '15/12/10/8', 4, 120, 'Drop-set na última série'));
      if (tension[2]) inserts.push(build(tension[2], 2, 'pyramid', '10/8/6/4', 4, 90, 'Pirâmide regressiva'));
      if (comp[0]) inserts.push(build(comp[0], 3, 'normal', '15', 3, 60, ''));
      if (comp[1]) inserts.push(build(comp[1], 4, 'normal', '12/15/17', 3, 45, 'Reps crescentes'));
      await supabase.from('workout_exercises').insert(inserts);
      setGeneratedWorkout({ name, workoutId: wd.id });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon-500" />
          Studio de Prompts & IA
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure os parâmetros do aluno e gere um prompt estruturado ou uma ficha completa com IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Objective */}
        <div className="card p-4">
          <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-1.5">
            <Target className="w-4 h-4 text-neon-500" />
            Objetivo Principal
          </label>
          <div className="flex gap-2 flex-wrap">
            {OBJECTIVES.map((o) => (
              <button
                key={o.key}
                onClick={() => setObjective(o.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  objective === o.key ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30' : 'bg-dark-900 text-gray-400 border border-dark-600'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div className="card p-4">
          <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-neon-500" />
            Nível do Aluno
          </label>
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLevel(l.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  level === l.key ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30' : 'bg-dark-900 text-gray-400 border border-dark-600'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emphasis */}
      <div className="card p-4">
        <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-neon-500" />
          Ênfase do Treino
        </label>
        <div className="flex gap-2 flex-wrap">
          {([['inferiors', 'Membros Inferiores'], ['superiors', 'Membros Superiores'], ['fullbody', 'Fullbody Completo']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setEmphasis(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                emphasis === key ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30' : 'bg-dark-900 text-gray-400 border border-dark-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Restrictions */}
      <div className="card p-4">
        <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          Restrições Articulares / Lesões
        </label>
        <textarea
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
          placeholder="Ex: Lombalgia, limitação no joelho direito, histórico de lesão no manguito rotador..."
          className="input-field py-2 text-sm min-h-[80px] resize-y"
        />
      </div>

      {/* Equipment */}
      <div className="card p-4">
        <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-1.5">
          <Users className="w-4 h-4 text-neon-500" />
          Equipamentos Disponíveis
        </label>
        <div className="flex gap-2 flex-wrap">
          {EQUIPMENT.map((item) => (
            <button
              key={item}
              onClick={() => toggleEquipment(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                equipment.includes(item) ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30' : 'bg-dark-900 text-gray-400 border border-dark-600'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={handleGeneratePrompt} className="btn-secondary flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-neon-500" />
          Gerar Prompt Estruturado
        </button>
        <button onClick={handleGenerateWorkout} disabled={generating} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 text-neon-500 animate-spin" /> : <Zap className="w-4 h-4 text-neon-500" />}
          {generating ? 'Gerando Treino...' : 'Gerar Treino Personalizado com a IA'}
        </button>
      </div>

      {/* Generated prompt */}
      {generatedPrompt && !generatedWorkout && (
        <div className="card p-5 bg-dark-900 border-neon-500/30 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-neon-400 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Prompt Estruturado Gerado
            </h3>
            <button onClick={handleCopy} className="btn-ghost text-xs flex items-center gap-1.5 px-2 py-1">
              {copied ? <><Check className="w-3.5 h-3.5 text-neon-500" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
            </button>
          </div>
          <pre className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap font-mono bg-dark-950 rounded-xl p-4 border border-dark-600 max-h-[400px] overflow-y-auto">{generatedPrompt}</pre>
        </div>
      )}

      {/* Generated workout success */}
      {generatedWorkout && (
        <div className="card p-6 bg-gradient-to-r from-neon-500/10 to-dark-900 border-neon-500/30 animate-fade-in text-center">
          <div className="w-12 h-12 rounded-full bg-neon-500/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-neon-500" />
          </div>
          <h3 className="font-bold text-white text-lg">Ficha Criada com Sucesso!</h3>
          <p className="text-sm text-gray-400 mt-1">{generatedWorkout.name}</p>
          <p className="text-xs text-gray-500 mt-2">A ficha foi adicionada à aba "Treinos". Acesse para revisar e editar os exercícios.</p>
        </div>
      )}
    </div>
  );
}
