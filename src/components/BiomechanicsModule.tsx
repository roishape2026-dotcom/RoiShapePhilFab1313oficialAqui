import { useState, useMemo } from 'react';
import { EXERCISE_LIBRARY } from '@/data/exercises';
import { MuscleMap } from '@/components/MuscleMap';
import {
  Brain, Target, Zap, Activity, Layers, Search, Dumbbell,
  AlertTriangle, TrendingUp, Lightbulb, Bone, Eye, X
} from 'lucide-react';

type TabKey = 'mapping' | 'biomechanics' | 'mindMuscle' | 'torque' | 'execution' | 'mistakes' | 'progression';

const DETAIL_TABS: { key: TabKey; label: string; icon: typeof Brain }[] = [
  { key: 'mapping', label: 'Mapeamento', icon: Layers },
  { key: 'biomechanics', label: 'Biomecânica', icon: Activity },
  { key: 'mindMuscle', label: 'Mente-Músculo', icon: Brain },
  { key: 'torque', label: 'Torque & Vetor', icon: Dumbbell },
  { key: 'execution', label: 'Execução', icon: Target },
  { key: 'mistakes', label: 'Erros Comuns', icon: AlertTriangle },
  { key: 'progression', label: 'Progressão', icon: TrendingUp },
];

export function BiomechanicsModule() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'inferior' | 'superior' | 'core'>('all');
  const [selected, setSelected] = useState(EXERCISE_LIBRARY[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('mapping');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const filtered = useMemo(() => EXERCISE_LIBRARY.filter((e) => {
    const matchSearch = search === '' || e.name.toLowerCase().includes(search.toLowerCase()) || e.targetMuscle.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchMuscle = !selectedMuscle || e.targetMuscle.includes(selectedMuscle) || selectedMuscle.includes(e.targetMuscle);
    return matchSearch && matchCat && matchMuscle;
  }), [search, selectedCategory, selectedMuscle]);

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'inferior': return 'Inferiores';
      case 'superior': return 'Superiores';
      case 'core': return 'Core';
      default: return 'Todos';
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-neon-500" />
              Biomecânica & Anatomia Muscular
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Mapeamento muscular completo, conexão mente-músculo, torque/vetor de força, execução técnica e progressão regressiva
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-neon text-xs">
              <Bone className="w-3 h-3" />
              {EXERCISE_LIBRARY.length} exercícios
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Muscle Map */}
      <MuscleMap onMuscleSelect={setSelectedMuscle} selectedMuscle={selectedMuscle} />

      {/* Active muscle filter indicator */}
      {selectedMuscle && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Filtrando por músculo:</span>
          <span className="badge badge-neon flex items-center gap-1.5">
            {selectedMuscle}
            <button onClick={() => setSelectedMuscle(null)} className="hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercício ou músculo..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 p-1 bg-dark-900 rounded-xl">
          {(['all', 'inferior', 'superior', 'core'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat ? 'bg-neon-500 text-dark-950' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Exercise list */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {filtered.map((ex) => (
            <button
              key={ex.name}
              onClick={() => setSelected(ex)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.name === ex.name
                  ? 'bg-dark-800 border-neon-500/50'
                  : 'bg-dark-900 border-dark-600 hover:border-dark-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{ex.name}</p>
                {ex.blockType === 'tension' ? (
                  <span className="badge badge-tension text-[10px]">Tensão</span>
                ) : (
                  <span className="badge badge-metabolic text-[10px]">Metab.</span>
                )}
              </div>
              <p className="text-xs text-neon-400 mt-0.5">{ex.targetMuscle}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{categoryLabel(ex.category)}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum exercício encontrado.</p>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              {/* Exercise header */}
              <div className="card p-5 bg-gradient-to-r from-dark-800 to-dark-900">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                    <p className="text-sm text-neon-400 mt-0.5 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {selected.targetMuscle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected.blockType === 'tension' ? (
                      <span className="badge badge-tension"><Target className="w-3 h-3" /> Bloco 1 — Tensão Mecânica</span>
                    ) : (
                      <span className="badge badge-metabolic"><Zap className="w-3 h-3" /> Bloco 2 — Estresse Metabólico</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {selected.defaultSets} séries | {selected.defaultReps} reps | {selected.defaultRest}s descanso
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab selector */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {DETAIL_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? 'bg-neon-500/15 text-neon-400 border border-neon-500/30'
                          : 'text-gray-400 hover:text-gray-200 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="animate-fade-in">
                {activeTab === 'mapping' && (
                  <div className="card p-5 space-y-4">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-neon-500" />
                      Mapeamento Muscular Completo
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-dark-900 rounded-xl p-3 border border-neon-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-neon-500" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Músculo Alvo Principal</span>
                        </div>
                        <span className="badge badge-neon text-sm">{selected.targetMuscle}</span>
                      </div>

                      {selected.secondaryMuscles.length > 0 && (
                        <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-orange-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Músculos Secundários (Sinergistas)</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {selected.secondaryMuscles.map((m) => (
                              <span key={m} className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20 text-sm">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selected.stabilizers.length > 0 && (
                        <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Bone className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estabilizadores</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {selected.stabilizers.map((m) => (
                              <span key={m} className="badge bg-dark-700 text-gray-400 border border-dark-500 text-sm">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-dark-900 rounded-lg p-3 text-center border border-dark-600">
                          <p className="text-lg font-bold text-white">{selected.defaultSets}</p>
                          <p className="text-[10px] text-gray-500">Séries</p>
                        </div>
                        <div className="bg-dark-900 rounded-lg p-3 text-center border border-dark-600">
                          <p className="text-lg font-bold text-white">{selected.defaultReps}</p>
                          <p className="text-[10px] text-gray-500">Reps</p>
                        </div>
                        <div className="bg-dark-900 rounded-lg p-3 text-center border border-dark-600">
                          <p className="text-lg font-bold text-white">{selected.defaultRest}s</p>
                          <p className="text-[10px] text-gray-500">Descanso</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'biomechanics' && (
                  <div className="card p-5">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-neon-500" />
                      Biomecânica do Movimento
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.biomechanics}</p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Plano de Movimento</p>
                        <p className="text-sm text-gray-300">
                          {selected.category === 'inferior' ? 'Sagital — predominante' : selected.category === 'core' ? 'Sagital / Frontal' : 'Sagital — predominante'}
                        </p>
                      </div>
                      <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Contração</p>
                        <p className="text-sm text-gray-300">
                          {selected.blockType === 'tension' ? 'Concêntrica + Excêntrica (Carga Alta)' : 'Concêntrica + Excêntrica (Tensão Contínua)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'mindMuscle' && (
                  <div className="card p-5 border-neon-500/20">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-neon-500" />
                      Conexão Mente-Músculo
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.mindMuscleConnection}</p>
                    <div className="mt-4 bg-neon-500/5 rounded-xl p-3 border border-neon-500/20">
                      <p className="text-xs text-gray-500 flex items-start gap-2">
                        <Eye className="w-3.5 h-3.5 text-neon-500 flex-shrink-0 mt-0.5" />
                        <span>Para o aluno: foque em sentir o músculo alvo trabalhando em cada repetição. Toque a região ativa antes da série para ativar a propriocepção.</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'torque' && (
                  <div className="card p-5 border-orange-500/20">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-orange-400" />
                      Ajuste de Torque / Vetor de Força
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.torqueVector}</p>
                    <div className="mt-4 bg-orange-500/5 rounded-xl p-3 border border-orange-500/20">
                      <p className="text-xs text-gray-500 flex items-start gap-2">
                        <Dumbbell className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>Para o Personal: use estes ajustes para direcionar a carga ao músculo alvo ou corrigir compensações do aluno.</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'execution' && (
                  <div className="card p-5">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-neon-500" />
                      Dicas de Execução Técnica
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.executionTips}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-start gap-2 bg-dark-900 rounded-lg p-3 border border-dark-600">
                        <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                          <strong className="text-yellow-400">Tempo sob tensão:</strong> 1s concêntrica | 1s pausa | 2-3s excêntrica para hipertrofia. Cadência mais lenta para estresse metabólico.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 bg-dark-900 rounded-lg p-3 border border-dark-600">
                        <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                          <strong className="text-yellow-400">Respiração:</strong> Inspire na fase excêntrica (descida). Expire na concêntrica (subida). Mantenha core ativo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'mistakes' && (
                  <div className="card p-5 border-red-500/20">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Erros Comuns e Como Corrigir
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.commonMistakes}</p>
                    <div className="mt-4 bg-red-500/5 rounded-xl p-3 border border-red-500/20">
                      <p className="text-xs text-gray-500 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>Para o Personal: observe estes padrões durante a execução do aluno e corrija imediatamente com cues verbais e táteis.</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'progression' && (
                  <div className="card p-5 border-green-500/20">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Progressão e Regressão
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.progressionRegression}</p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/20">
                        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Progressar</p>
                        <p className="text-xs text-gray-400">Aumente carga, amplitude ou tempo sob tensão quando o aluno executar todas as séries com técnica perfeita.</p>
                      </div>
                      <div className="bg-yellow-500/5 rounded-xl p-3 border border-yellow-500/20">
                        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Regressar</p>
                        <p className="text-xs text-gray-400">Reduza carga, amplitude ou use versão assistida quando houver perda de técnica ou dor articular.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Block positioning reminder */}
              <div className="card p-4 bg-dark-900 border-dark-600">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Posicionamento no Método ROI Shape:</span>
                  {selected.blockType === 'tension' ? (
                    <span className="text-xs text-orange-400">Início do treino — Carga alta | 4-8 reps | Descanso completo 90-180s</span>
                  ) : (
                    <span className="text-xs text-cyan-400">Final do treino — Volume alto | 12-20+ reps | Descanso curto 30-60s</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
