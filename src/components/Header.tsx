import { useAuth } from '@/context/AuthContext';
import { BRAND } from '@/lib/constants';
import type { TabKey } from '@/lib/constants';
import {
  Dumbbell, LogOut, Shield, Crown,
  Users, Activity, BarChart3, CreditCard, Sparkles, Megaphone,
  Apple, User, Headphones, Home,
} from 'lucide-react';

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
}

interface TabDef {
  key: TabKey;
  label: string;
  icon: typeof Dumbbell;
  roles: ('admin' | 'personal' | 'student')[];
}

const TABS: TabDef[] = [
  { key: 'workouts', label: 'Início', icon: Home, roles: ['admin', 'personal', 'student'] },
  { key: 'students', label: 'Alunos', icon: Users, roles: ['admin', 'personal'] },
  { key: 'ai-studio', label: 'Studio IA', icon: Sparkles, roles: ['admin', 'personal'] },
  { key: 'biomechanics', label: 'Biomecânica', icon: Activity, roles: ['admin', 'personal', 'student'] },
  { key: 'bioimpedance', label: 'Avaliação', icon: BarChart3, roles: ['admin', 'personal', 'student'] },
  { key: 'nutrition', label: 'Nutrição', icon: Apple, roles: ['admin', 'personal', 'student'] },
  { key: 'traffic', label: 'Tráfego', icon: Megaphone, roles: ['admin', 'personal'] },
  { key: 'pricing', label: 'Premium', icon: CreditCard, roles: ['admin', 'personal'] },
  { key: 'profile', label: 'Perfil', icon: User, roles: ['admin', 'personal', 'student'] },
  { key: 'support', label: 'Suporte', icon: Headphones, roles: ['admin', 'personal', 'student'] },
  { key: 'admin', label: 'Admin', icon: Shield, roles: ['admin'] },
];

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { profile, isAdmin, signOut } = useAuth();

  const role = profile?.role ?? 'student';
  const visibleTabs = TABS.filter((t) => t.roles.includes(role));

  return (
    <header className="sticky top-0 z-50 glass border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-dark-800 border border-neon-500/30 flex items-center justify-center">
              <Dumbbell className="w-4.5 h-4.5 text-neon-500" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white leading-tight">ROI Shape</h1>
              <p className="text-[10px] text-gray-500 leading-tight">{BRAND.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="badge badge-warning hidden sm:inline-flex">
                <Crown className="w-3 h-3" />
                Admin Master
              </span>
            )}
            {!isAdmin && role === 'student' && (
              <span className="badge badge-neon hidden sm:inline-flex">
                Aluno
              </span>
            )}
            {!isAdmin && role === 'personal' && (
              <span className="badge badge-neon hidden sm:inline-flex">
                Personal Trainer
              </span>
            )}

            <button
              onClick={signOut}
              className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-dark-800 transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
