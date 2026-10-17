import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Apple, Plus, Trash2, X, Flame, Droplet, Beef, Scale } from 'lucide-react';

interface MealEntry {
  id: string;
  meal: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export function NutritionModule() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const addEntry = (entry: Omit<MealEntry, 'id'>) => {
    setEntries([...entries, { ...entry, id: `meal-${Date.now()}` }]);
    setShowForm(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Apple className="w-5 h-5 text-neon-500" />
              Nutrição & Dieta
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Acompanhe sua alimentação diária e metas de macronutrientes
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Registrar Refeição
          </button>
        </div>
      </div>

      {/* Daily macros summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MacroCard icon={Flame} label="Calorias" value={totals.calories} unit="kcal" color="text-orange-400" />
        <MacroCard icon={Beef} label="Proteínas" value={totals.protein} unit="g" color="text-neon-400" />
        <MacroCard icon={Scale} label="Carboidratos" value={totals.carbs} unit="g" color="text-cyan-400" />
        <MacroCard icon={Droplet} label="Gorduras" value={totals.fat} unit="g" color="text-yellow-400" />
      </div>

      {/* Meal entries */}
      {entries.length === 0 ? (
        <div className="card p-12 text-center">
          <Apple className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma refeição registrada hoje. Adicione sua primeira refeição.</p>
        </div>
      ) : (
        <div className="card p-5">
          <h3 className="font-bold text-white mb-3">Refeições de Hoje</h3>
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-500/10 flex items-center justify-center">
                    <Apple className="w-5 h-5 text-neon-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{e.meal}</p>
                    <p className="text-xs text-gray-500">{e.food} · {e.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{e.calories} kcal</p>
                    <p className="text-[10px] text-gray-500">P: {e.protein}g · C: {e.carbs}g · G: {e.fat}g</p>
                  </div>
                  <button onClick={() => deleteEntry(e.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && <MealForm onClose={() => setShowForm(false)} onSave={addEntry} />}
    </div>
  );
}

function MacroCard({ icon: Icon, label, value, unit, color }: {
  icon: typeof Flame; label: string; value: number; unit: string; color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}<span className="text-sm text-gray-500 font-normal"> {unit}</span></p>
    </div>
  );
}

function MealForm({ onClose, onSave }: { onClose: () => void; onSave: (entry: Omit<MealEntry, 'id'>) => void }) {
  const [form, setForm] = useState({
    meal: 'Café da manhã',
    food: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      meal: form.meal,
      food: form.food,
      calories: parseInt(form.calories) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
      time: form.time,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={onClose}>
      <div className="card p-6 w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Nova Refeição</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Refeição</label>
            <select value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })} className="input-field py-2 text-sm">
              <option value="Café da manhã">Café da manhã</option>
              <option value="Lanche da manhã">Lanche da manhã</option>
              <option value="Almoço">Almoço</option>
              <option value="Lanche da tarde">Lanche da tarde</option>
              <option value="Pré-treino">Pré-treino</option>
              <option value="Pós-treino">Pós-treino</option>
              <option value="Jantar">Jantar</option>
              <option value="Ceia">Ceia</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Alimentos</label>
            <input type="text" value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} className="input-field py-2 text-sm" placeholder="Ex: Frango grelhado, arroz, salada" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Calorias (kcal)</label>
              <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input-field py-2 text-sm" placeholder="0" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Proteína (g)</label>
              <input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className="input-field py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Carboidratos (g)</label>
              <input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="input-field py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Gorduras (g)</label>
              <input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} className="input-field py-2 text-sm" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Horário</label>
            <input type="text" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field py-2 text-sm" />
          </div>
          <button type="submit" className="btn-primary w-full">Adicionar Refeição</button>
        </form>
      </div>
    </div>
  );
}
