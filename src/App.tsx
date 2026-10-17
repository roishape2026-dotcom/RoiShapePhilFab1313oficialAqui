import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, getHomeTabForRole } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { ResetPasswordScreen } from '@/components/ResetPasswordScreen';
import { Header } from '@/components/Header';
import { WorkoutModule } from '@/components/WorkoutModule';
import { BiomechanicsModule } from '@/components/BiomechanicsModule';
import { BioimpedanceModule } from '@/components/BioimpedanceModule';
import { TrafficHub } from '@/components/TrafficHub';
import { PricingModule } from '@/components/PricingModule';
import { AdminPanel } from '@/components/AdminPanel';
import { StudentManagement } from '@/components/StudentManagement';
import { AIStudio } from '@/components/AIStudio';
import { NutritionModule } from '@/components/NutritionModule';
import { ProfileModule } from '@/components/ProfileModule';
import { SupportModule } from '@/components/SupportModule';
import type { TabKey } from '@/lib/constants';
import { BRAND } from '@/lib/constants';
import type { UserRole } from '@/types';
import {
  Lock, AlertTriangle, Home, Users, Activity, BarChart3,
  CreditCard, Sparkles, Megaphone, Apple, User, Headphones,
  Shield,
} from 'lucide-react';

interface NavTab {
  key: TabKey;
  label: string;
  icon: typeof Home;
  roles: UserRole[];
}

const NAV_TABS: NavTab[] = [
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

function AppContent() {
  const { session, loading, profile, isAdmin, passwordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('workouts');

  const role: UserRole = profile?.role ?? 'student';

  // Strict guard: if the active tab is not allowed for this role, redirect to their home tab
  useEffect(() => {
    const allowed = NAV_TABS.find((t) => t.key === activeTab && t.roles.includes(role));
    if (!allowed) {
      setActiveTab(getHomeTabForRole(role));
    }
  }, [role, activeTab]);

  // When profile loads and we're still on the default, navigate to the role's home
  useEffect(() => {
    if (profile && activeTab === 'workouts' && role === 'admin') {
      setActiveTab('admin');
    }
  }, [profile, role, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-neon-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          <p className="text-sm text-gray-500">Carregando ROI Shape...</p>
        </div>
      </div>
    );
  }

  if (passwordRecovery) {
    return <ResetPasswordScreen />;
  }

  if (!session || !profile) {
    return <AuthScreen />;
  }

  const isBlocked = !isAdmin && profile.role !== 'student' && (profile.subscription_status === 'blocked' || profile.subscription_status === 'expired');

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-3">Acesso Temporariamente Suspenso</h1>
          <div className="card p-5 border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 leading-relaxed text-left">
                Acesso temporariamente suspenso por pendência na assinatura da consultoria. Regularize com o suporte.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <a
              href={`https://wa.me/${BRAND.whatsapp1}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
            >
              Falar com Suporte — {BRAND.whatsapp1Name}
            </a>
            <a
              href={`https://wa.me/${BRAND.whatsapp2}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-sm"
            >
              Falar com Suporte — {BRAND.whatsapp2Name}
            </a>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            E-mail: {profile.email}
          </p>
        </div>
      </div>
    );
  }

  const visibleTabs = NAV_TABS.filter((t) => t.roles.includes(role));
  const isStudent = role === 'student';
  const isPersonalOrAdmin = role === 'personal' || role === 'admin';

  const workoutViewMode = isStudent ? 'student' : 'personal';

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
        {activeTab === 'workouts' && <WorkoutModule viewMode={workoutViewMode} />}
        {activeTab === 'students' && isPersonalOrAdmin && <StudentManagement />}
        {activeTab === 'biomechanics' && <BiomechanicsModule />}
        {activeTab === 'bioimpedance' && <BioimpedanceModule />}
        {activeTab === 'nutrition' && <NutritionModule />}
        {activeTab === 'traffic' && isPersonalOrAdmin && <TrafficHub />}
        {activeTab === 'ai-studio' && isPersonalOrAdmin && <AIStudio />}
        {activeTab === 'pricing' && isPersonalOrAdmin && <PricingModule />}
        {activeTab === 'profile' && <ProfileModule />}
        {activeTab === 'support' && <SupportModule />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-600">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar h-14">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                    isActive ? 'text-neon-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-neon-500' : ''}`} />
                  <span className="text-[9px] sm:text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <footer className="hidden sm:block border-t border-dark-600 py-6 px-4 pb-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>Fullbody ROI Shape · {new Date().getFullYear()} · Lançamento: 04/10/2026</p>
          <div className="flex items-center gap-4">
            <a href="https://www.roishape.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-neon-400 transition-colors">roishape.com.br</a>
            <a href="https://instagram.com/roishape.tech" target="_blank" rel="noopener noreferrer" className="hover:text-neon-400 transition-colors">@roishape.tech</a>
            <a href="mailto:contato@roishape.com.br" className="hover:text-neon-400 transition-colors">contato@roishape.com.br</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
