import { useState, useMemo } from 'react';
import { EXERCISE_LIBRARY } from '@/data/exercises';
import { Search, X } from 'lucide-react';

interface MuscleMapProps {
  onMuscleSelect: (muscle: string | null) => void;
  selectedMuscle: string | null;
}

interface MuscleRegion {
  id: string;
  label: string;
  targetMatch: string[];
  d: string;
  cx: number;
  cy: number;
}

const MUSCLE_REGIONS: MuscleRegion[] = [
  {
    id: 'deltoids',
    label: 'Deltoide',
    targetMatch: ['Deltoide', 'Deltoide (Média e Anterior)', 'Deltoide (Anterior e Média)', 'Deltoide Média', 'Deltoide Anterior', 'Deltoide Posterior'],
    d: 'M 80 90 Q 60 85 55 110 L 60 140 L 75 135 L 85 110 Z M 170 90 Q 190 85 195 110 L 190 140 L 175 135 L 165 110 Z',
    cx: 70,
    cy: 115,
  },
  {
    id: 'chest',
    label: 'Peitoral',
    targetMatch: ['Peitoral Maior', 'Peitoral Superior'],
    d: 'M 90 105 Q 85 105 82 120 L 90 145 L 125 142 L 125 115 L 90 105 Z M 160 105 Q 165 105 168 120 L 160 145 L 125 142 L 125 115 L 160 105 Z',
    cx: 125,
    cy: 125,
  },
  {
    id: 'biceps',
    label: 'Bíceps',
    targetMatch: ['Bíceps'],
    d: 'M 58 145 Q 52 155 55 180 L 65 185 L 72 160 L 68 145 Z M 192 145 Q 198 155 195 180 L 185 185 L 178 160 L 182 145 Z',
    cx: 62,
    cy: 170,
  },
  {
    id: 'triceps',
    label: 'Tríceps',
    targetMatch: ['Tríceps'],
    d: 'M 72 145 Q 68 160 70 185 L 80 182 L 82 160 L 78 145 Z M 178 145 Q 182 160 180 185 L 170 182 L 168 160 L 172 145 Z',
    cx: 175,
    cy: 170,
  },
  {
    id: 'lats',
    label: 'Dorsais',
    targetMatch: ['Dorsal Maior'],
    d: 'M 82 140 Q 78 145 80 175 L 100 175 L 115 155 L 115 140 Z M 168 140 Q 172 145 170 175 L 150 175 L 135 155 L 135 140 Z',
    cx: 125,
    cy: 160,
  },
  {
    id: 'traps',
    label: 'Trapézio',
    targetMatch: ['Trapézio', 'Trapézio Superior'],
    d: 'M 88 92 Q 85 95 83 105 L 125 102 L 167 105 L 165 95 Q 162 92 155 90 L 125 88 L 95 90 Z',
    cx: 125,
    cy: 98,
  },
  {
    id: 'abs',
    label: 'Core / Abdomen',
    targetMatch: ['Core', 'Abdômen', 'Abdominal'],
    d: 'M 105 145 L 105 185 L 145 185 L 145 145 L 125 142 Z',
    cx: 125,
    cy: 165,
  },
  {
    id: 'quads',
    label: 'Quadríceps',
    targetMatch: ['Quadríceps', 'Quadríceps Femoral'],
    d: 'M 105 195 L 108 250 L 118 255 L 122 200 Z M 142 195 L 142 250 L 132 255 L 128 200 Z',
    cx: 125,
    cy: 225,
  },
  {
    id: 'hamstrings',
    label: 'Isquiotibiais',
    targetMatch: ['Isquiotibiais', 'Posterior de Coxa'],
    d: 'M 100 200 L 98 250 L 108 252 L 110 200 Z M 150 200 L 152 250 L 142 252 L 140 200 Z',
    cx: 125,
    cy: 230,
  },
  {
    id: 'glutes',
    label: 'Glúteos',
    targetMatch: ['Glúteo Máximo', 'Glúteo'],
    d: 'M 100 188 Q 95 195 98 210 L 115 212 L 125 200 L 135 212 L 152 210 Q 155 195 150 188 L 125 186 Z',
    cx: 125,
    cy: 200,
  },
  {
    id: 'calves',
    label: 'Panturrilhas',
    targetMatch: ['Panturrilha', 'Gastrocnêmio', 'Sóleo'],
    d: 'M 104 260 L 102 295 L 112 300 L 114 260 Z M 146 260 L 148 295 L 138 300 L 136 260 Z',
    cx: 125,
    cy: 280,
  },
];

export function MuscleMap({ onMuscleSelect, selectedMuscle }: MuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const exercisesForMuscle = useMemo(() => {
    if (!selectedMuscle) return [];
    const region = MUSCLE_REGIONS.find((r) => r.label === selectedMuscle);
    if (!region) return [];
    return EXERCISE_LIBRARY.filter((ex) =>
      region.targetMatch.some((t) => ex.targetMuscle.includes(t) || t.includes(ex.targetMuscle))
    );
  }, [selectedMuscle]);

  const isMuscleActive = (region: MuscleRegion) => {
    if (selectedMuscle === region.label) return true;
    if (hoveredMuscle === region.id) return true;
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-500 animate-pulse" />
            Mapa Anatômico Interativo
          </h4>
          {selectedMuscle && (
            <button
              onClick={() => onMuscleSelect(null)}
              className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Clique em um grupo muscular para filtrar os exercícios correspondentes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* SVG Body */}
          <div className="flex-shrink-0 mx-auto">
            <svg
              viewBox="0 0 250 320"
              className="w-48 h-64 sm:w-56 sm:h-72"
              style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.15))' }}
            >
              {/* Body silhouette base */}
              <ellipse cx="125" cy="45" rx="28" ry="32" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1.5" />
              <path d="M 97 78 L 153 78 L 155 90 L 95 90 Z" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1.5" />
              <path d="M 85 90 L 165 90 L 170 195 L 155 190 L 145 188 L 105 188 L 95 190 L 80 195 Z" fill="#16162a" stroke="#2a2a3e" strokeWidth="1.5" />
              <path d="M 95 190 L 155 190 L 150 215 L 100 215 Z" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1.5" />
              <path d="M 98 215 L 118 215 L 115 310 L 102 310 Z" fill="#16162a" stroke="#2a2a3e" strokeWidth="1.5" />
              <path d="M 132 215 L 152 215 L 148 310 L 135 310 Z" fill="#16162a" stroke="#2a2a3e" strokeWidth="1.5" />
              {/* Arms */}
              <path d="M 82 95 Q 55 100 52 150 L 48 195 L 62 198 L 68 150 L 78 100 Z" fill="#16162a" stroke="#2a2a3e" strokeWidth="1.5" />
              <path d="M 168 95 Q 195 100 198 150 L 202 195 L 188 198 L 182 150 L 172 100 Z" fill="#16162a" stroke="#2a2a3e" strokeWidth="1.5" />

              {/* Muscle regions */}
              {MUSCLE_REGIONS.map((region) => {
                const active = isMuscleActive(region);
                const exerciseCount = EXERCISE_LIBRARY.filter((ex) =>
                  region.targetMatch.some((t) => ex.targetMuscle.includes(t) || t.includes(ex.targetMuscle))
                ).length;

                return (
                  <g
                    key={region.id}
                    className="cursor-pointer"
                    onClick={() => onMuscleSelect(active ? null : region.label)}
                    onMouseEnter={() => setHoveredMuscle(region.id)}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  >
                    <path
                      d={region.d}
                      fill={active ? '#10B981' : 'rgba(255,255,255,0.04)'}
                      stroke={active ? '#10B981' : 'rgba(255,255,255,0.15)'}
                      strokeWidth="1.5"
                      style={{
                        transition: 'all 0.2s ease',
                        filter: active ? 'drop-shadow(0 0 6px #10B981)' : 'none',
                        opacity: exerciseCount === 0 ? 0.3 : 1,
                      }}
                    />
                    {active && (
                      <text
                        x={region.cx}
                        y={region.cy}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="7"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {region.label}
                      </text>
                    )}
                    {/* Hover label */}
                    {hoveredMuscle === region.id && !active && (
                      <text
                        x={region.cx}
                        y={region.cy}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="6"
                        className="pointer-events-none select-none"
                      >
                        {region.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected muscle info */}
          <div className="flex-1 min-w-0">
            {selectedMuscle ? (
              <div className="animate-fade-in">
                <div className="bg-neon-500/10 border border-neon-500/30 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-neon-500" style={{ boxShadow: '0 0 8px #10B981' }} />
                    <p className="text-sm font-bold text-neon-400">{selectedMuscle}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {exercisesForMuscle.length} exercício(s) com este músculo como alvo principal
                  </p>
                </div>

                {exercisesForMuscle.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {exercisesForMuscle.map((ex) => (
                      <div key={ex.name} className="bg-dark-900 border border-dark-600 rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">{ex.name}</p>
                          <p className="text-[10px] text-gray-500">{ex.targetMuscle}</p>
                        </div>
                        <span className={`badge text-[9px] ${ex.blockType === 'tension' ? 'badge-tension' : 'badge-metabolic'}`}>
                          {ex.blockType === 'tension' ? 'Tensão' : 'Metab.'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Nenhum exercício cadastrado para este grupo muscular ainda.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Selecione um músculo no mapa ao lado</p>
                  <p className="text-[10px] text-gray-600 mt-1">{MUSCLE_REGIONS.length} grupos musculares disponíveis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { MUSCLE_REGIONS };
