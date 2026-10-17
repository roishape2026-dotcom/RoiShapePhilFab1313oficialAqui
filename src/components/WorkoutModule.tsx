import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EXERCISE_LIBRARY, type ExerciseData } from '@/data/exercises';
import type { Workout, WorkoutExercise } from '@/types';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Play, Youtube, Target,
  Zap, Dumbbell, Save, X, Brain, Edit3, Lock, Flame, Repeat, Search, Loader2, ArrowLeft,
  Copy, Bookmark, Settings2, Layers, BookmarkCheck
} from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';

interface WorkoutBuilderProps {
  viewMode: 'personal' | 'student';
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const LS_WORKOUTS_KEY = 'roi_shape_workouts';
const LS_EXERCISES_KEY = 'roi_shape_exercises';
const LS_PRESETS_KEY = 'roi_presets';

function loadLSWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(LS_WORKOUTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLSWorkouts(w: Workout[]) {
  try { localStorage.setItem(LS_WORKOUTS_KEY, JSON.stringify(w)); } catch { /* ignore */ }
}

function loadLSExercises(): Record<string, WorkoutExercise[]> {
  try {
    const raw = localStorage.getItem(LS_EXERCISES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLSExercises(map: Record<string, WorkoutExercise[]>) {
  try { localStorage.setItem(LS_EXERCISES_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

function loadLSPresets(): string[] {
  try {
    const raw = localStorage.getItem(LS_PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLSPresets(p: string[]) {
  try { localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function genId(): string {
  return `ls-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function WorkoutModule({ viewMode }: WorkoutBuilderProps) {
  const { session, isAdmin } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [workoutSearch, setWorkoutSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [presetList, setPresetList] = useState<string[]>(loadLSPresets());
  const [showPresets, setShowPresets] = useState(false);

  const isTrainer = viewMode === 'personal' || isAdmin;
  const canEditVideo = isTrainer;

  const loadWorkouts = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    setLoading(true);
    let dbWorkouts: Workout[] = [];
    try {
      const col = isTrainer ? 'trainer_id' : 'student_id';
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq(col, session.user.id)
        .order('created_at', { ascending: false });
      dbWorkouts = data ?? [];
    } catch { /* ignore */ }

    // Merge with localStorage workouts (fallback ones)
    const lsWorkouts = loadLSWorkouts();
    const lsForUser = lsWorkouts.filter((w) =>
      isTrainer ? w.trainer_id === session.user.id : w.student_id === session.user.id
    );
    const dbIds = new Set(dbWorkouts.map((w) => w.id));
    const merged = [...dbWorkouts, ...lsForUser.filter((w) => !dbIds.has(w.id))];
    setWorkouts(merged);
    setLoading(false);
  }, [session, isTrainer]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const loadExercises = useCallback(async (workoutId: string) => {
    // Try localStorage first (instant render)
    const lsMap = loadLSExercises();
    if (lsMap[workoutId]) {
      setExercises(lsMap[workoutId]);
      return;
    }
    // Then try Supabase
    try {
      const { data } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('exercise_order', { ascending: true });
      setExercises(data ?? []);
    } catch {
      setExercises([]);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkout) loadExercises(selectedWorkout.id);
    else setExercises([]);
  }, [selectedWorkout, loadExercises]);

  const persistExercises = (workoutId: string, exs: WorkoutExercise[]) => {
    const lsMap = loadLSExercises();
    lsMap[workoutId] = exs;
    saveLSExercises(lsMap);
  };

  const createWorkout = async (name: string, focusOrder: string, emphasis: string) => {
    if (!session?.user) return;
    const now = new Date().toISOString();
    const newWorkout: Workout = {
      id: genId(),
      trainer_id: session.user.id,
      student_id: null,
      name,
      day_focus: emphasis,
      focus_order: focusOrder,
      notes: '',
      created_at: now,
      updated_at: now,
    };

    // Instantly update UI + localStorage
    setWorkouts((prev) => {
      const updated = [newWorkout, ...prev];
      saveLSWorkouts(updated);
      return updated;
    });
    setSelectedWorkout(newWorkout);
    setExercises([]);
    setShowCreate(false);

    // Best-effort save to Supabase
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert({ trainer_id: session.user.id, name, focus_order: focusOrder, day_focus: emphasis })
        .select().single();
      if (!error && data) {
        // Replace LS workout with DB version in state
        setWorkouts((prev) => {
          const replaced = prev.map((w) => w.id === newWorkout.id ? data : w);
          // Remove old LS entry, keep DB one
          const lsW = loadLSWorkouts().filter((w) => w.id !== newWorkout.id);
          saveLSWorkouts(lsW);
          return replaced;
        });
        setSelectedWorkout(data);
      }
    } catch { /* keep LS version */ }
  };

  const deleteWorkout = async (id: string) => {
    // Instant UI update
    setWorkouts((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      // Also clean LS
      const lsW = loadLSWorkouts().filter((w) => w.id !== id);
      saveLSWorkouts(lsW);
      const lsMap = loadLSExercises();
      delete lsMap[id];
      saveLSExercises(lsMap);
      return updated;
    });
    if (selectedWorkout?.id === id) setSelectedWorkout(null);
    try { await supabase.from('workouts').delete().eq('id', id); } catch { /* ignore */ }
  };

  const addExercise = async (ex: ExerciseData) => {
    if (!selectedWorkout) return;
    const order = exercises.length;
    const newEx: WorkoutExercise = {
      id: genId(),
      workout_id: selectedWorkout.id,
      exercise_name: ex.name,
      block_type: ex.blockType,
      sets_count: ex.defaultSets,
      reps: ex.defaultReps,
      rest_seconds: ex.defaultRest,
      youtube_url: ex.youtubeUrl,
      exercise_order: order,
      target_muscle: ex.targetMuscle,
      secondary_muscles: ex.secondaryMuscles.join(', '),
      biomechanics_notes: ex.biomechanics,
      training_method: ex.blockType === 'tension' ? 'pyramid' : 'normal',
      method_notes: '',
    };

    // Instant UI update + LS
    const updated = [...exercises, newEx];
    setExercises(updated);
    persistExercises(selectedWorkout.id, updated);
    setShowExercisePicker(false);

    // Best-effort DB save
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: selectedWorkout.id,
          exercise_name: ex.name,
          block_type: ex.blockType,
          sets_count: ex.defaultSets,
          reps: ex.defaultReps,
          rest_seconds: ex.defaultRest,
          exercise_order: order,
          target_muscle: ex.targetMuscle,
          secondary_muscles: ex.secondaryMuscles.join(', '),
          biomechanics_notes: ex.biomechanics,
          youtube_url: ex.youtubeUrl,
          training_method: ex.blockType === 'tension' ? 'pyramid' : 'normal',
          method_notes: '',
        })
        .select().single();
      if (!error && data) {
        // Replace LS exercise with DB version
        const replaced = updated.map((e) => e.id === newEx.id ? data : e);
        setExercises(replaced);
        persistExercises(selectedWorkout.id, replaced);
      }
    } catch { /* keep LS version */ }
  };

  const updateExercise = async (id: string, updates: Partial<WorkoutExercise>) => {
    const updated = exercises.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setExercises(updated);
    if (selectedWorkout) persistExercises(selectedWorkout.id, updated);
    try { await supabase.from('workout_exercises').update(updates).eq('id', id); } catch { /* ignore */ }
  };

  const deleteExercise = async (id: string) => {
    const updated = exercises.filter((e) => e.id !== id);
    setExercises(updated);
    if (selectedWorkout) persistExercises(selectedWorkout.id, updated);
    try { await supabase.from('workout_exercises').delete().eq('id', id); } catch { /* ignore */ }
  };

  const replicateSeries = async (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    if (!ex) return;
    const newSets = (ex.sets_count ?? 0) + 1;
    updateExercise(id, { sets_count: newSets });
  };

  const savePreset = (ex: WorkoutExercise) => {
    const preset = `${ex.exercise_name}: ${ex.sets_count ?? 0}x ${ex.reps ?? '12'} · ${ex.rest_seconds ?? 60}s`;
    const updated = [...presetList, preset];
    setPresetList(updated);
    saveLSPresets(updated);
  };

  const generateAIWorkout = async () => {
    if (!session?.user) return;
    setGenerating(true);

    const emphasis = (selectedWorkout?.day_focus ?? 'inferiors') as 'inferiors' | 'superiors' | 'fullbody';
    const focusOrder = (selectedWorkout?.focus_order ?? 'inferiors_first') as 'inferiors_first' | 'superiors_first';
    const isInferior = emphasis === 'inferiors' || emphasis === 'fullbody';

    // Build locally first — Phillip Sarraff method
    const cat = isInferior ? 'inferior' : 'superior';
    const compCat = isInferior ? 'superior' : 'inferior';
    const tension = EXERCISE_LIBRARY.filter((e) => e.blockType === 'tension' && e.category === cat).slice(0, 3);
    const comp = EXERCISE_LIBRARY.filter((e) => e.blockType === 'metabolic' && e.category === compCat).slice(0, 3);
    const core = EXERCISE_LIBRARY.filter((e) => e.category === 'core').slice(0, 1);

    const now = new Date().toISOString();
    const name = `Treino IA ${isInferior ? 'Ênfase Inferiores' : 'Ênfase Superiores'} — ${new Date().toLocaleDateString('pt-BR')}`;
    const newWorkout: Workout = {
      id: genId(),
      trainer_id: session.user.id,
      student_id: null,
      name,
      day_focus: emphasis,
      focus_order: focusOrder,
      notes: '',
      created_at: now,
      updated_at: now,
    };

    const buildLocal = (ex: ExerciseData, i: number, m: 'normal' | 'pyramid' | 'dropset' | 'biset', reps: string, sets: number, rest: number, notes: string): WorkoutExercise => ({
      id: genId(),
      workout_id: newWorkout.id,
      exercise_name: ex.name,
      block_type: ex.blockType,
      sets_count: sets,
      reps,
      rest_seconds: rest,
      youtube_url: ex.youtubeUrl,
      exercise_order: i,
      target_muscle: ex.targetMuscle,
      secondary_muscles: ex.secondaryMuscles.join(', '),
      biomechanics_notes: ex.biomechanics,
      training_method: m,
      method_notes: notes,
    });

    const localExercises: WorkoutExercise[] = [];
    let idx = 0;
    if (tension[0]) localExercises.push(buildLocal(tension[0], idx++, 'pyramid', '12/10/8/6', 4, 120, 'Pirâmide regressiva de carga'));
    if (tension[1]) localExercises.push(buildLocal(tension[1], idx++, 'pyramid', '15/12/10/8', 4, 120, 'Pirâmide regressiva de carga'));
    if (tension[2]) localExercises.push(buildLocal(tension[2], idx++, 'pyramid', '10/8/6/4', 4, 90, 'Pirâmide regressiva de carga'));
    if (comp[0]) localExercises.push(buildLocal(comp[0], idx++, 'normal', '15', 3, 60, 'Séries contínuas metabólicas'));
    if (comp[1]) localExercises.push(buildLocal(comp[1], idx++, 'normal', '12/15/17', 3, 45, 'Pirâmide crescente'));
    if (comp[2] && core[0]) {
      localExercises.push(buildLocal(comp[2], idx++, 'biset', '20', 3, 45, `Bi-set A1 com ${core[0].name} — sem descanso entre A1 e A2`));
      localExercises.push(buildLocal(core[0], idx++, 'biset', '15', 3, 45, `Bi-set A2 com ${comp[2].name} — sem descanso entre A1 e A2`));
    }

    // Instant UI + localStorage render
    setWorkouts((prev) => {
      const updated = [newWorkout, ...prev];
      saveLSWorkouts(updated);
      return updated;
    });
    setSelectedWorkout(newWorkout);
    setExercises(localExercises);
    persistExercises(newWorkout.id, localExercises);
    setGenerating(false);

    // Best-effort: try edge function, then DB save
    (async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-workout`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ emphasis, focus_order: focusOrder, trainer_id: session.user.id }),
        });

        if (res.ok) {
          const plan = await res.json();
          type PlanExercise = { id_exercicio: string; nome: string; series: number; repeticoes: string; descanso_segundos: number; tecnica_especial: string };
          type PlanDia = { exercicios: PlanExercise[] };
          type PlanResponse = { dias?: PlanDia[]; divisao?: string };

          const typedPlan = plan as PlanResponse;
          const aiName = `${typedPlan.divisao ?? 'Treino IA'} — ${new Date().toLocaleDateString('pt-BR')}`;

          // Save to Supabase
          const { data: dbWorkout, error: wErr } = await supabase
            .from('workouts')
            .insert({ trainer_id: session.user.id, name: aiName, focus_order: focusOrder, day_focus: emphasis })
            .select().single();

          if (!wErr && dbWorkout) {
            const aiInserts: Record<string, unknown>[] = [];
            let order = 0;
            for (const dia of typedPlan.dias ?? []) {
              for (const ex of dia.exercicios) {
                const libEx = EXERCISE_LIBRARY.find((e) => e.name === ex.nome);
                const techLower = (ex.tecnica_especial || '').toLowerCase();
                const method = techLower.includes('pirâmide') ? 'pyramid' : techLower.includes('drop') ? 'dropset' : techLower.includes('bi-set') ? 'biset' : 'normal';
                aiInserts.push({
                  workout_id: dbWorkout.id,
                  exercise_name: ex.nome,
                  block_type: (libEx?.blockType ?? (order < 3 ? 'tension' : 'metabolic')) as 'tension' | 'metabolic',
                  sets_count: ex.series,
                  reps: ex.repeticoes,
                  rest_seconds: ex.descanso_segundos,
                  exercise_order: order++,
                  target_muscle: libEx?.targetMuscle ?? '',
                  secondary_muscles: libEx?.secondaryMuscles.join(', ') ?? '',
                  biomechanics_notes: libEx?.biomechanics ?? '',
                  youtube_url: libEx?.youtubeUrl ?? '',
                  training_method: method,
                  method_notes: ex.tecnica_especial || '',
                });
              }
            }
            const { data: dbExs } = await supabase.from('workout_exercises').insert(aiInserts).select('*');
            if (dbExs && dbExs.length > 0) {
              // Replace LS workout with DB version
              setWorkouts((prev) => {
                const cleaned = prev.filter((w) => w.id !== newWorkout.id);
                const lsW = loadLSWorkouts().filter((w) => w.id !== newWorkout.id);
                saveLSWorkouts(lsW);
                return [dbWorkout, ...cleaned];
              });
              setSelectedWorkout(dbWorkout);
              setExercises(dbExs as WorkoutExercise[]);
              persistExercises(dbWorkout.id, dbExs as WorkoutExercise[]);
              return;
            }
          }
        }
      } catch { /* keep local version */ }

      // If edge function failed, try saving the local plan to DB
      try {
        const { data: dbWorkout, error: wErr } = await supabase
          .from('workouts')
          .insert({ trainer_id: session.user.id, name, focus_order: focusOrder, day_focus: emphasis })
          .select().single();

        if (!wErr && dbWorkout) {
          const dbInserts = localExercises.map((e) => ({
            workout_id: dbWorkout.id,
            exercise_name: e.exercise_name,
            block_type: e.block_type,
            sets_count: e.sets_count,
            reps: e.reps,
            rest_seconds: e.rest_seconds,
            exercise_order: e.exercise_order,
            target_muscle: e.target_muscle,
            secondary_muscles: e.secondary_muscles,
            biomechanics_notes: e.biomechanics_notes,
            youtube_url: e.youtube_url,
            training_method: e.training_method,
            method_notes: e.method_notes,
          }));
          const { data: dbExs } = await supabase.from('workout_exercises').insert(dbInserts).select('*');
          if (dbExs && dbExs.length > 0) {
            setWorkouts((prev) => {
              const cleaned = prev.filter((w) => w.id !== newWorkout.id);
              const lsW = loadLSWorkouts().filter((w) => w.id !== newWorkout.id);
              saveLSWorkouts(lsW);
              return [dbWorkout, ...cleaned];
            });
            setSelectedWorkout(dbWorkout);
            setExercises(dbExs as WorkoutExercise[]);
            persistExercises(dbWorkout.id, dbExs as WorkoutExercise[]);
          }
        }
      } catch { /* keep LS version — it's already rendered */ }
    })();
  };

  const tensionExercises = exercises.filter((e) => e.block_type === 'tension');
  const metabolicExercises = exercises.filter((e) => e.block_type === 'metabolic');
  const filteredWorkouts = workouts.filter((w) =>
    workoutSearch === '' || normalizeText(w.name ?? '').includes(normalizeText(workoutSearch))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-neon-500" />
              Fichas de Treino
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Método Phillip Sarraff — Ênfase + Complemento · Fullbody ROI Shape
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="badge badge-tension text-[10px]">Bloco Ênfase: Força + Hipertrofia</span>
              <span className="badge badge-metabolic text-[10px]">Bloco Complementar: Metabólico + Bi-set</span>
            </div>
          </div>
          {isTrainer && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Nova Ficha
              </button>
              <button onClick={generateAIWorkout} disabled={generating} className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 text-neon-500 animate-spin" /> : <Zap className="w-4 h-4 text-neon-500" />}
                {generating ? 'Gerando...' : 'Gerar com IA'}
              </button>
              {presetList.length > 0 && (
                <button onClick={() => setShowPresets(!showPresets)} className="btn-ghost flex items-center gap-2 text-sm">
                  <BookmarkCheck className="w-4 h-4" />
                  Presets ({presetList.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Presets dropdown */}
      {showPresets && presetList.length > 0 && (
        <div className="card p-4 animate-fade-in">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            Presets Salvos
          </h4>
          <div className="space-y-1">
            {presetList.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-900 rounded-lg px-3 py-2 border border-dark-600">
                <span className="text-xs text-gray-300">{p}</span>
                <button
                  onClick={() => {
                    const newPresets = presetList.filter((_, idx) => idx !== i);
                    setPresetList(newPresets);
                    saveLSPresets(newPresets);
                  }}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method explanation — Phillip Sarraff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-orange-400" />
            <span className="badge badge-tension">BLOCO 1 — Grupo de Ênfase</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            3-4 exercícios de característica <strong className="text-orange-400">Força / Hipertrofia</strong>. Pirâmides regressivas de repetição com aumento progressivo de carga. Ex: 4x 12/10/8/6 reps. Descanso 90-120s.
          </p>
        </div>
        <div className="card p-4 border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="badge badge-metabolic">BLOCO 2 — Grupo Complementar</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            3-5 exercícios de característica <strong className="text-cyan-400">Hipertrofia / Resistência</strong>. Séries contínuas metabólicas (3x 15 ou 3x 12/15/17). Combinações em <strong className="text-cyan-400">Bi-set / Super-série</strong>. Descanso 30-60s.
          </p>
        </div>
      </div>

      {!selectedWorkout ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={workoutSearch}
              onChange={(e) => setWorkoutSearch(e.target.value)}
              placeholder="Pesquisar ficha de treino..."
              className="input-field pl-10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkouts.length === 0 ? (
              <div className="col-span-full card p-12 text-center">
                <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  {isTrainer ? 'Nenhuma ficha criada ainda. Crie uma nova ficha ou gere uma com IA.' : 'Nenhuma ficha atribuída a você ainda.'}
                </p>
              </div>
            ) : (
              filteredWorkouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorkout(w)}
                  className="card card-hover p-5 text-left animate-slide-up"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white">{w.name}</h3>
                    {isTrainer && (
                      <span
                        onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id); }}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-neon">
                      {w.focus_order === 'inferiors_first' ? 'Inferiores → Superiores' : 'Superiores → Inferiores'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(w.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedWorkout(null)} className="btn-ghost flex items-center gap-1.5 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Início
              </button>
              <h2 className="text-lg font-bold text-white">{selectedWorkout.name}</h2>
            </div>
            {isTrainer && (
              <button onClick={() => setShowExercisePicker(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Adicionar Exercício
              </button>
            )}
          </div>

          {/* Block 1 — Ênfase (Tension) */}
          {tensionExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-orange-400">BLOCO 1 — Grupo de Ênfase</h3>
                <span className="text-xs text-gray-500">Força + Hipertrofia · Pirâmides Regressivas</span>
              </div>
              <div className="space-y-3">
                {tensionExercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    expanded={expandedEx === ex.id}
                    onToggle={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                    isTrainer={isTrainer}
                    canEditVideo={canEditVideo}
                    onUpdate={updateExercise}
                    onDelete={deleteExercise}
                    onReplicateSeries={replicateSeries}
                    onSavePreset={savePreset}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Block 2 — Complementar (Metabolic) */}
          {metabolicExercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-cyan-400">BLOCO 2 — Grupo Complementar</h3>
                <span className="text-xs text-gray-500">Hipertrofia + Resistência · Bi-set / Super-série</span>
              </div>
              <div className="space-y-3">
                {metabolicExercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    expanded={expandedEx === ex.id}
                    onToggle={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                    isTrainer={isTrainer}
                    canEditVideo={canEditVideo}
                    onUpdate={updateExercise}
                    onDelete={deleteExercise}
                    onReplicateSeries={replicateSeries}
                    onSavePreset={savePreset}
                  />
                ))}
              </div>
            </div>
          )}

          {exercises.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-400">
                {isTrainer ? 'Adicione exercícios para montar a ficha.' : 'Esta ficha ainda não tem exercícios.'}
              </p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateWorkoutModal onClose={() => setShowCreate(false)} onCreate={createWorkout} />
      )}

      {/* Phillip Sarraff reference card */}
      {selectedWorkout && isTrainer && (
        <div className="card p-4 bg-dark-900 border-dark-600">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Método Phillip Sarraff — Modelo de Referência
          </h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p><span className="text-orange-400 font-semibold">Ênfase</span> — 3-4 exercícios: Pirâmide 4x 12/10/8/6 + 4x 15/12/10/8 + 4x 10/8/6/4</p>
            <p><span className="text-cyan-400 font-semibold">Complementares</span> — 3-5 exercícios: 3x 15 · 3x 12/15/17 · Bi-set 3x 20 + 3x 15</p>
          </div>
        </div>
      )}

      {showExercisePicker && (
        <ExercisePickerModal onClose={() => setShowExercisePicker(false)} onPick={addExercise} />
      )}
    </div>
  );
}

// ─── MFIT-style Exercise Card: video embedded in header, inputs below ───
function ExerciseCard({
  exercise: ex,
  expanded,
  onToggle,
  isTrainer,
  canEditVideo,
  onUpdate,
  onDelete,
  onReplicateSeries,
  onSavePreset,
}: {
  exercise: WorkoutExercise;
  expanded: boolean;
  onToggle: () => void;
  isTrainer: boolean;
  canEditVideo: boolean;
  onUpdate: (id: string, updates: Partial<WorkoutExercise>) => void;
  onDelete: (id: string) => void;
  onReplicateSeries: (id: string) => void;
  onSavePreset: (ex: WorkoutExercise) => void;
}) {
  const [youtubeInput, setYoutubeInput] = useState(ex?.youtube_url || '');
  const [showYoutubeEdit, setShowYoutubeEdit] = useState(false);
  const [methodNotes, setMethodNotes] = useState(ex?.method_notes || '');

  const extractYoutubeId = (url: string): string => {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?#\s]+)/);
    return match?.[1] ?? '';
  };

  const getYoutubeEmbed = (url: string) => {
    const safeUrl = url ?? '';
    const match = safeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?#\s]+)/);
    return match?.[1] ?? '';
  };

  const embedId = getYoutubeEmbed(ex?.youtube_url ?? '');

  const methodLabel = (m: string) => {
    switch (m) {
      case 'pyramid': return 'Pirâmide';
      case 'dropset': return 'Drop-set';
      case 'biset': return 'Bi-set';
      default: return 'Simples';
    }
  };

  const methodBadge = (m: string) => {
    switch (m) {
      case 'pyramid': return { icon: Flame, label: 'Pirâmide', color: 'text-orange-400' };
      case 'dropset': return { icon: Zap, label: 'Drop-set', color: 'text-yellow-400' };
      case 'biset': return { icon: Repeat, label: 'Bi-set', color: 'text-cyan-400' };
      default: return null;
    }
  };

  const badge = methodBadge(ex?.training_method ?? 'normal');

  return (
    <div className="card card-hover overflow-hidden animate-slide-in">
      {/* MFIT-style header: name + video side by side */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-white text-base">{ex.exercise_name}</h4>
              {ex.block_type === 'tension' ? (
                <span className="badge badge-tension">Ênfase</span>
              ) : (
                <span className="badge badge-metabolic">Complementar</span>
              )}
              {badge && (
                <span className={`badge text-[10px] ${badge.color} border-current/20`}>
                  <badge.icon className="w-2.5 h-2.5" />
                  {badge.label}
                </span>
              )}
            </div>
            {ex.target_muscle && (
              <p className="text-xs text-neon-400 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {ex.target_muscle}
                {ex.secondary_muscles && <span className="text-gray-500"> + {ex.secondary_muscles}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isTrainer && (
              <button onClick={() => onDelete(ex.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onToggle} className="p-1.5 text-gray-400 hover:text-neon-400 transition-colors">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Embedded video — always visible (MFIT style) */}
        <div className="rounded-xl overflow-hidden mb-3">
          <VideoPlayer
            exerciseName={ex?.exercise_name ?? ''}
            fallbackBiomechanics={ex?.biomechanics_notes}
            youtubeUrl={ex?.youtube_url}
          />
        </div>

        {/* MFIT-style input row: Série/Rep | Carga | Intervalo — always visible for trainer */}
        {isTrainer ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Série / Rep</label>
              <input
                type="text"
                value={ex?.reps ?? ''}
                onChange={(e) => onUpdate(ex.id, { reps: e.target.value })}
                placeholder="12/10/8/6"
                className="input-field py-2 text-sm"
              />
              <p className="text-[9px] text-gray-600 mt-0.5">{ex?.sets_count ?? 0} séries</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Carga (kg)</label>
              <input
                type="text"
                value={ex?.method_notes?.match(/carga:\s*([\d./\s]+)/i)?.[1] ?? ''}
                onChange={(e) => {
                  const current = methodNotes || '';
                  const cleaned = current.replace(/carga:\s*[\d./\s]+/i, '').trim();
                  const updated = `Carga: ${e.target.value}${cleaned ? ' · ' + cleaned : ''}`;
                  setMethodNotes(updated);
                  onUpdate(ex.id, { method_notes: updated });
                }}
                placeholder="20/25/30"
                className="input-field py-2 text-sm"
              />
              <p className="text-[9px] text-gray-600 mt-0.5">progressao de carga</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Intervalo (s)</label>
              <input
                type="number"
                value={ex?.rest_seconds ?? 0}
                onChange={(e) => onUpdate(ex.id, { rest_seconds: parseInt(e.target.value) || 0 })}
                className="input-field py-2 text-sm"
              />
              <p className="text-[9px] text-gray-600 mt-0.5">descanso</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-dark-900 rounded-lg p-2 text-center">
              <p className="text-base font-bold text-white">{ex?.sets_count ?? 0}x {ex?.reps ?? '-'}</p>
              <p className="text-[10px] text-gray-500">série / rep</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-2 text-center">
              <p className="text-base font-bold text-white">{ex?.rest_seconds ?? 0}s</p>
              <p className="text-[10px] text-gray-500">intervalo</p>
            </div>
            <div className="bg-dark-900 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-neon-400">{methodBadge(ex?.training_method ?? 'normal')?.label ?? 'Simples'}</p>
              <p className="text-[10px] text-gray-500">tipo</p>
            </div>
          </div>
        )}

        {/* Always-visible observations for students */}
        {!isTrainer && (ex?.method_notes || ex?.biomechanics_notes) && (
          <div className="mt-3 space-y-2">
            {ex?.method_notes && (
              <div className="bg-dark-900/80 rounded-lg p-2.5 border border-dark-600">
                <h5 className="text-[10px] font-semibold text-neon-400 uppercase tracking-wider mb-0.5">Observação do Professor</h5>
                <p className="text-xs text-gray-300 leading-relaxed">{ex.method_notes}</p>
              </div>
            )}
            {ex?.biomechanics_notes && (
              <div className="bg-dark-900/80 rounded-lg p-2.5 border border-dark-600">
                <h5 className="text-[10px] font-semibold text-neon-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Biomecânica
                </h5>
                <p className="text-xs text-gray-400 leading-relaxed">{ex.biomechanics_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* MFIT-style action buttons — always visible for trainer */}
        {isTrainer && (
          <div className="flex gap-2 flex-wrap mt-3">
            <button
              onClick={() => onUpdate(ex.id, { sets_count: (ex?.sets_count ?? 0) + 1 })}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Série
            </button>
            <button
              onClick={() => onReplicateSeries(ex.id)}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Replicar Séries
            </button>
            <button
              onClick={() => onSavePreset(ex)}
              className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Salvar como Preset
            </button>
          </div>
        )}
      </div>

      {/* Expanded section: advanced settings */}
      {expanded && (
        <div className="border-t border-dark-600 p-4 animate-fade-in">
          <div className="space-y-3">
            {/* Series type selector — trainer only */}
            {isTrainer && (
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Settings2 className="w-3 h-3" />
                  Tipo de Série
                </h5>
                <div className="flex gap-2 flex-wrap">
                  {(['normal', 'pyramid', 'dropset', 'biset'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => onUpdate(ex.id, { training_method: m })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        (ex?.training_method ?? 'normal') === m
                          ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30'
                          : 'bg-dark-900 text-gray-400 border border-dark-600'
                      }`}
                    >
                      {methodLabel(m)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Series count input — trainer only */}
            {isTrainer && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Número de Séries</label>
                  <input
                    type="number"
                    value={ex?.sets_count ?? 0}
                    onChange={(e) => onUpdate(ex.id, { sets_count: parseInt(e.target.value) || 0 })}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Observação do Método</label>
                  <input
                    type="text"
                    value={methodNotes}
                    onChange={(e) => setMethodNotes(e.target.value)}
                    onBlur={() => onUpdate(ex.id, { method_notes: methodNotes })}
                    placeholder="Ex: Bi-set A1 + A2 sem descanso"
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {ex?.biomechanics_notes && (
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Biomecânica
                </h5>
                <p className="text-xs text-gray-400 leading-relaxed">{ex.biomechanics_notes}</p>
              </div>
            )}

            {ex?.method_notes && !isTrainer && (
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Observação do Método</h5>
                <p className="text-xs text-gray-400 leading-relaxed">{ex.method_notes}</p>
              </div>
            )}

            {/* YouTube link editor — trainer only */}
            {canEditVideo ? (
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Youtube className="w-3 h-3" />
                  Vídeo do YouTube / Shorts
                </h5>
                {showYoutubeEdit ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="input-field py-2 text-sm"
                    />
                    <button
                      onClick={async () => {
                        onUpdate(ex.id, { youtube_url: youtubeInput });
                        setShowYoutubeEdit(false);
                        // Persist to exercicios table so the video shows globally
                        const videoId = extractYoutubeId(youtubeInput);
                        try {
                          if (videoId) {
                            await supabase
                              .from('exercicios')
                              .update({ youtube_video_id: videoId })
                              .ilike('nome', ex.exercise_name);
                          }
                        } catch { /* best-effort persist */ }
                      }}
                      className="btn-primary px-3 py-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setYoutubeInput(ex?.youtube_url || ''); setShowYoutubeEdit(true); }}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    {ex?.youtube_url ? 'Alterar vídeo' : 'Adicionar / Editar Link do YouTube'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Lock className="w-3 h-3" />
                <span>Edição de vídeos disponível para Personal Trainer</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateWorkoutModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, focus: string, emphasis: string) => void }) {
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('inferiors_first');
  const [emphasis, setEmphasis] = useState('inferiors');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={onClose}>
      <div className="card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Nova Ficha de Treino</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Nome da ficha</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A — Ênfase Inferiores"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Grupo de Ênfase</label>
            <select value={emphasis} onChange={(e) => setEmphasis(e.target.value)} className="input-field">
              <option value="inferiors">Membros Inferiores (Perna)</option>
              <option value="superiors">Membros Superiores</option>
              <option value="fullbody">Fullbody Completo</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Ordem de Foco</label>
            <select value={focus} onChange={(e) => setFocus(e.target.value)} className="input-field">
              <option value="inferiors_first">Inferiores → Superiores</option>
              <option value="superiors_first">Superiores → Inferiores</option>
            </select>
          </div>
          <button onClick={() => onCreate(name || `Treino Ênfase ${emphasis === 'inferiors' ? 'Inferiores' : emphasis === 'superiors' ? 'Superiores' : 'Fullbody'}`, focus, emphasis)} className="btn-primary w-full">
            Criar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}

function ExercisePickerModal({ onClose, onPick }: { onClose: () => void; onPick: (ex: ExerciseData) => void }) {
  const [search, setSearch] = useState('');

  // Global flexible search — no category restriction, accent-insensitive
  const filtered = useMemo(() => {
    const q = normalizeText(search.trim());
    if (!q) return EXERCISE_LIBRARY;
    return EXERCISE_LIBRARY.filter((e) =>
      normalizeText(e.name).includes(q) ||
      normalizeText(e.targetMuscle).includes(q) ||
      normalizeText(e.category).includes(q) ||
      e.secondaryMuscles.some((m) => normalizeText(m).includes(q))
    );
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Adicionar Exercício</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar: agachamento, leg, supino, rosca..."
            className="input-field pl-10"
            autoFocus
          />
        </div>

        <p className="text-xs text-gray-500 mb-2">{filtered.length} exercício(s) encontrado(s)</p>

        <div className="overflow-y-auto space-y-2 flex-1 no-scrollbar">
          {filtered.map((ex) => {
            const embedId = ex.youtubeUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#\s]+)/)?.[1];
            return (
              <button
                key={ex.name}
                onClick={() => onPick(ex)}
                className="w-full text-left p-3 rounded-xl bg-dark-900 border border-dark-600 hover:border-neon-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Mini video thumbnail */}
                  <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
                    {embedId ? (
                      <img
                        src={`https://img.youtube.com/vi/${embedId}/mqdefault.jpg`}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-gray-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                    <p className="text-xs text-neon-400">{ex.targetMuscle}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`badge text-[9px] ${ex.blockType === 'tension' ? 'badge-tension' : 'badge-metabolic'}`}>
                        {ex.blockType === 'tension' ? 'Ênfase' : 'Complementar'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right flex-shrink-0">
                    <p>{ex.defaultSets}x {ex.defaultReps}</p>
                    <p>{ex.defaultRest}s</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum exercício encontrado para "{search}".</p>
          )}
        </div>
      </div>
    </div>
  );
}
