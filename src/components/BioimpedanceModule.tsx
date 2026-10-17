import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { BioimpedanceRecord } from '@/types';
import { BRAND } from '@/lib/constants';
import {
  Activity, Plus, Trash2, TrendingUp, TrendingDown, Heart,
  Scale, Zap, Download, X, Award
} from 'lucide-react';

export function BioimpedanceModule() {
  const { session } = useAuth();
  const [records, setRecords] = useState<BioimpedanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStoriesCard, setShowStoriesCard] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bioimpedance_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('record_date', { ascending: true });
    setRecords(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const addRecord = async (data: Omit<BioimpedanceRecord, 'id' | 'user_id' | 'created_at' | 'body_mass_index' | 'fat_mass_kg' | 'lean_mass_kg'>) => {
    if (!session?.user) return;
    const bmi = Number((data.weight_kg / Math.pow(data.height_cm / 100, 2)).toFixed(1));
    const fatMass = Number((data.weight_kg * (data.body_fat_pct || 0) / 100).toFixed(1));
    const leanMass = Number((data.weight_kg - fatMass).toFixed(1));
    await supabase.from('bioimpedance_records').insert({
      ...data,
      user_id: session.user.id,
      body_mass_index: bmi,
      fat_mass_kg: fatMass,
      lean_mass_kg: leanMass,
    });
    setShowForm(false);
    await loadRecords();
  };

  const deleteRecord = async (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
    await supabase.from('bioimpedance_records').delete().eq('id', id);
  };

  const latest = records[records.length - 1];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-500" />
              Bioimpedância — Omron HBF-514C
            </h2>
            <p className="text-sm text-gray-400 mt-1">Avaliação física completa com cálculo automático e gráficos de evolução</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Nova Avaliação
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma avaliação registrada. Adicione sua primeira medição da bioimpedância.</p>
        </div>
      ) : (
        <>
          {/* Latest results */}
          {latest && <ResultsGrid record={latest} />}

          {/* Evolution chart */}
          {records.length >= 2 && <EvolutionChart records={records} />}

          {/* History */}
          <div className="card p-5">
            <h3 className="font-bold text-white mb-3">Histórico de Avaliações</h3>
            <div className="space-y-2">
              {records.slice().reverse().map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neon-500/10 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-neon-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{new Date(r.record_date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-500">{r.weight_kg}kg | IMC {r.body_mass_index} | {r.body_fat_pct}% gordura</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowStoriesCard(true)} className="btn-ghost text-xs px-2 py-1">
                      <Download className="w-3.5 h-3.5" />
                      Stories
                    </button>
                    <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showForm && <RecordForm onClose={() => setShowForm(false)} onSave={addRecord} />}
      {showStoriesCard && latest && <StoriesCardModal record={latest} onClose={() => setShowStoriesCard(false)} />}
    </div>
  );
}

function getVisceralColor(level: number | null): string {
  if (!level) return 'badge badge-success';
  if (level <= 9) return 'badge badge-success';
  if (level <= 14) return 'badge badge-warning';
  return 'badge badge-error';
}

function getVisceralLabel(level: number | null): string {
  if (!level) return 'N/A';
  if (level <= 9) return 'Normal';
  if (level <= 14) return 'Alto';
  return 'Risco Crítico';
}

function ResultsGrid({ record }: { record: BioimpedanceRecord }) {
  const bmiCategory = (() => {
    const bmi = record.body_mass_index || 0;
    if (bmi < 18.5) return { label: 'Abaixo', color: 'badge-warning' };
    if (bmi < 25) return { label: 'Normal', color: 'badge-success' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'badge-warning' };
    return { label: 'Obesidade', color: 'badge-error' };
  })();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard icon={Scale} label="Peso" value={`${record.weight_kg ?? 0}kg`} color="text-white" />
      <StatCard icon={Activity} label="IMC" value={`${record.body_mass_index ?? '—'}`} badge={bmiCategory.label} badgeClass={bmiCategory.color} />
      <StatCard icon={TrendingUp} label="Massa Magra" value={`${record.lean_mass_kg ?? 0}kg`} color="text-neon-400" />
      <StatCard icon={TrendingDown} label="Massa Gorda" value={`${record.fat_mass_kg ?? 0}kg`} color="text-orange-400" />
      <StatCard icon={Zap} label="% Músculo" value={`${record.skeletal_muscle_pct || '—'}%`} color="text-neon-400" />
      <StatCard icon={Heart} label="Gordura Visceral" value={`${record.visceral_fat_level || '—'}`} badge={getVisceralLabel(record.visceral_fat_level)} badgeClass={getVisceralColor(record.visceral_fat_level)} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'text-white', badge, badgeClass }: {
  icon: typeof Scale; label: string; value: string; color?: string; badge?: string; badgeClass?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {badge && <span className={`badge ${badgeClass} mt-1 text-[10px]`}>{badge}</span>}
    </div>
  );
}

function EvolutionChart({ records }: { records: BioimpedanceRecord[] }) {
  const width = 800;
  const height = 300;
  const padding = 40;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const leanValues = records.map((r) => r.lean_mass_kg || 0);
  const fatValues = records.map((r) => r.fat_mass_kg || 0);
  const allValues = [...leanValues, ...fatValues];
  const minVal = Math.min(...allValues) - 2;
  const maxVal = Math.max(...allValues) + 2;
  const valRange = maxVal - minVal || 1;

  const xStep = records.length > 1 ? chartW / (records.length - 1) : 0;

  const toX = (i: number) => padding + i * xStep;
  const toY = (v: number) => padding + chartH - ((v - minVal) / valRange) * chartH;

  const leanPath = leanValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
  const fatPath = fatValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');

  return (
    <div className="card p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-neon-500" />
        Evolução: Massa Magra vs. Massa Gorda
      </h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line key={p} x1={padding} y1={padding + chartH * p} x2={width - padding} y2={padding + chartH * p} stroke="#222226" strokeWidth="1" />
          ))}

          {/* Y axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <text key={p} x={padding - 8} y={padding + chartH * p + 4} fill="#6b7280" fontSize="11" textAnchor="end">
              {(maxVal - valRange * p).toFixed(0)}
            </text>
          ))}

          {/* Lean mass line */}
          <path d={leanPath} fill="none" stroke="#10B981" strokeWidth="2.5" />
          {leanValues.map((v, i) => (
            <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill="#10B981" />
          ))}

          {/* Fat mass line */}
          <path d={fatPath} fill="none" stroke="#f97316" strokeWidth="2.5" />
          {fatValues.map((v, i) => (
            <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill="#f97316" />
          ))}

          {/* X axis labels */}
          {records.map((r, i) => (
            <text key={i} x={toX(i)} y={height - 12} fill="#6b7280" fontSize="10" textAnchor="middle">
              {new Date(r.record_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-500" />
          <span className="text-xs text-gray-400">Massa Magra (kg)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-400">Massa Gorda (kg)</span>
        </div>
      </div>
    </div>
  );
}

function RecordForm({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<BioimpedanceRecord, 'id' | 'user_id' | 'created_at' | 'body_mass_index' | 'fat_mass_kg' | 'lean_mass_kg'>) => void }) {
  const [form, setForm] = useState({
    record_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    height_cm: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    body_fat_pct: '',
    muscle_mass_pct: '',
    skeletal_muscle_pct: '',
    visceral_fat_level: '',
    basal_metabolism: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      record_date: form.record_date,
      weight_kg: parseFloat(form.weight_kg) || 0,
      height_cm: parseFloat(form.height_cm) || 0,
      age: parseInt(form.age) || 0,
      gender: form.gender,
      body_fat_pct: parseFloat(form.body_fat_pct) || null,
      muscle_mass_pct: parseFloat(form.muscle_mass_pct) || null,
      skeletal_muscle_pct: parseFloat(form.skeletal_muscle_pct) || null,
      visceral_fat_level: parseInt(form.visceral_fat_level) || null,
      basal_metabolism: parseInt(form.basal_metabolism) || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Nova Avaliação — Omron HBF-514C</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Data</label>
              <input type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} className="input-field py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Peso (kg)</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="input-field py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Altura (cm)</label>
              <input type="number" step="0.1" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="input-field py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Idade</label>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input-field py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sexo</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} className="input-field py-2 text-sm">
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">% Gordura</label>
              <input type="number" step="0.1" value={form.body_fat_pct} onChange={(e) => setForm({ ...form, body_fat_pct: e.target.value })} className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">% Músculo Esquelético</label>
              <input type="number" step="0.1" value={form.skeletal_muscle_pct} onChange={(e) => setForm({ ...form, skeletal_muscle_pct: e.target.value })} className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Gordura Visceral (1-30)</label>
              <input type="number" min="1" max="30" value={form.visceral_fat_level} onChange={(e) => setForm({ ...form, visceral_fat_level: e.target.value })} className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Metabolismo Basal (kcal)</label>
              <input type="number" value={form.basal_metabolism} onChange={(e) => setForm({ ...form, basal_metabolism: e.target.value })} className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">% Massa Muscular</label>
              <input type="number" step="0.1" value={form.muscle_mass_pct} onChange={(e) => setForm({ ...form, muscle_mass_pct: e.target.value })} className="input-field py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Salvar Avaliação</button>
        </form>
      </div>
    </div>
  );
}

function StoriesCardModal({ record, onClose }: { record: BioimpedanceRecord; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
        <rect width="1080" height="1920" fill="#09090b"/>
        <rect x="0" y="0" width="1080" height="8" fill="#10B981"/>
        <text x="540" y="120" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#10B981">ROI SHAPE</text>
        <text x="540" y="170" text-anchor="middle" font-family="Arial" font-size="24" fill="#6b7280">Resultado da Bioimpedância</text>
        <text x="540" y="280" text-anchor="middle" font-family="Arial" font-size="36" fill="#ffffff">${new Date(record.record_date).toLocaleDateString('pt-BR')}</text>
        <circle cx="540" cy="500" r="150" fill="none" stroke="#10B981" stroke-width="3"/>
        <text x="540" y="490" text-anchor="middle" font-family="Arial" font-size="80" font-weight="bold" fill="#ffffff">${record.weight_kg}</text>
        <text x="540" y="540" text-anchor="middle" font-family="Arial" font-size="28" fill="#10B981">kg</text>
        <text x="200" y="800" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">IMC</text>
        <text x="200" y="850" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#ffffff">${record.body_mass_index}</text>
        <text x="540" y="800" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">Massa Magra</text>
        <text x="540" y="850" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#10B981">${record.lean_mass_kg}kg</text>
        <text x="880" y="800" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">Massa Gorda</text>
        <text x="880" y="850" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#f97316">${record.fat_mass_kg}kg</text>
        <text x="540" y="1050" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">Gordura Visceral</text>
        <text x="540" y="1100" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="${(record.visceral_fat_level || 0) <= 9 ? '#10B981' : (record.visceral_fat_level || 0) <= 14 ? '#eab308' : '#ef4444'}">${record.visceral_fat_level || '—'}</text>
        <rect x="340" y="1300" width="400" height="80" rx="40" fill="none" stroke="#10B981" stroke-width="2"/>
        <text x="540" y="1350" text-anchor="middle" font-family="Arial" font-size="24" fill="#10B981">SELO DE VALIDAÇÃO ROI SHAPE</text>
        <text x="540" y="1500" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">${BRAND.instagramHandle}</text>
        <text x="540" y="1550" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">${BRAND.site.replace('https://', '')}</text>
      </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-shape-card-${record.record_date}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 text-neon-500" /> Card para Stories</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        {/* Preview */}
        <div ref={cardRef} className="aspect-[9/16] rounded-2xl bg-dark-950 border border-neon-500/20 p-6 flex flex-col items-center justify-center text-center mb-4">
          <p className="text-neon-500 font-bold text-sm tracking-wider">ROI SHAPE</p>
          <p className="text-xs text-gray-500 mb-4">Resultado da Bioimpedância</p>
          <p className="text-white text-lg mb-6">{new Date(record.record_date).toLocaleDateString('pt-BR')}</p>
          <div className="w-24 h-24 rounded-full border-2 border-neon-500 flex flex-col items-center justify-center mb-6">
            <p className="text-3xl font-bold text-white">{record.weight_kg ?? 0}</p>
            <p className="text-xs text-neon-500">kg</p>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full mb-6">
            <div><p className="text-xs text-gray-500">IMC</p><p className="text-lg font-bold text-white">{record.body_mass_index ?? '—'}</p></div>
            <div><p className="text-xs text-gray-500">Magra</p><p className="text-lg font-bold text-neon-400">{record.lean_mass_kg ?? 0}kg</p></div>
            <div><p className="text-xs text-gray-500">Gorda</p><p className="text-lg font-bold text-orange-400">{record.fat_mass_kg ?? 0}kg</p></div>
          </div>
          <div className="border border-neon-500/30 rounded-full px-4 py-2">
            <p className="text-xs text-neon-500 font-semibold">SELO DE VALIDAÇÃO ROI SHAPE</p>
          </div>
          <p className="text-xs text-gray-500 mt-4">{BRAND.instagramHandle}</p>
        </div>

        <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Baixar Card (SVG)
        </button>
      </div>
    </div>
  );
}


