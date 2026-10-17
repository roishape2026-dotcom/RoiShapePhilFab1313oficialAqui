import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BRAND, ADMIN_EMAILS, PARTNERS, PLANS } from '@/lib/constants';
import type { Profile } from '@/types';
import {
  Shield, Crown, Users, Dumbbell, Activity, Megaphone,
  TrendingUp, Mail, MessageCircle, Lock, CreditCard,
  Ban, CheckCircle2, Trash2, AlertTriangle, UserCog,
  Clock, Monitor, Smartphone
} from 'lucide-react';

interface AdminTab {
  key: 'overview' | 'subscriptions' | 'security';
  label: string;
  icon: typeof Shield;
}

const ADMIN_TABS: AdminTab[] = [
  { key: 'overview', label: 'Visão Geral', icon: Shield },
  { key: 'subscriptions', label: 'Assinaturas & Inadimplência', icon: CreditCard },
  { key: 'security', label: 'Segurança & Sessões', icon: Lock },
];

interface SessionLog {
  id: string;
  user_email: string;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
}

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab['key']>('overview');
  const [stats, setStats] = useState({ users: 0, workouts: 0, bioRecords: 0, leads: 0 });
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<{ email: string; count: number; devices: string[] }[]>([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [usersR, workoutsR, bioR, leadsR] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('workouts').select('id'),
      supabase.from('bioimpedance_records').select('id'),
      supabase.from('leads').select('id'),
    ]);
    setStats({
      users: usersR.data?.length || 0,
      workouts: workoutsR.data?.length || 0,
      bioRecords: bioR.data?.length || 0,
      leads: leadsR.data?.length || 0,
    });
    setAllUsers((usersR.data || []) as Profile[]);
    setRecentUsers((usersR.data || []).slice(0, 20) as Profile[]);
    setLoading(false);
  }, []);

  const loadSessionLogs = useCallback(async () => {
    const { data } = await supabase
      .from('session_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setSessionLogs((data || []) as SessionLog[]);

    // Detect concurrent sessions
    const sessionsByEmail = new Map<string, Set<string>>();
    (data || []).forEach((log: SessionLog) => {
      const email = log.user_email;
      const device = log.user_agent?.includes('Mobile') ? 'Mobile' : 'Desktop';
      if (!sessionsByEmail.has(email)) sessionsByEmail.set(email, new Set());
      sessionsByEmail.get(email)!.add(device);
    });

    const alerts: { email: string; count: number; devices: string[] }[] = [];
    sessionsByEmail.forEach((devices, email) => {
      if (devices.size > 1) {
        const count = (data || []).filter((l: SessionLog) => l.user_email === email).length;
        alerts.push({ email, count, devices: Array.from(devices) });
      }
    });
    setSecurityAlerts(alerts);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (activeTab === 'security') loadSessionLogs(); }, [activeTab, loadSessionLogs]);

  const updateSubscriptionStatus = async (userId: string, status: 'active' | 'trial' | 'expired' | 'blocked') => {
    setActionLoading(userId);
    await supabase.from('profiles').update({ subscription_status: status }).eq('id', userId);

    if (status === 'blocked' || status === 'expired') {
      await supabase.from('trainer_students').update({ is_blocked: true }).eq('trainer_id', userId);
    }

    setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscription_status: status } : u));
    setRecentUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscription_status: status } : u));
    setActionLoading(null);
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    await supabase.from('trainer_students').delete().eq('trainer_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    setRecentUsers((prev) => prev.filter((u) => u.id !== userId));
    setActionLoading(null);
  };

  const banUser = async (userId: string) => {
    await updateSubscriptionStatus(userId, 'blocked');
  };

  if (!isAdmin) {
    return (
      <div className="card p-12 text-center">
        <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Acesso restrito. Apenas sócios autorizados podem visualizar este painel.</p>
      </div>
    );
  }

  const trainers = allUsers.filter((u) => u.role === 'personal');

  const statCards = [
    { label: 'Usuários', value: stats.users, icon: Users, color: 'text-neon-400' },
    { label: 'Fichas de Treino', value: stats.workouts, icon: Dumbbell, color: 'text-orange-400' },
    { label: 'Avaliações', value: stats.bioRecords, icon: Activity, color: 'text-cyan-400' },
    { label: 'Leads CRM', value: stats.leads, icon: Megaphone, color: 'text-pink-400' },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active': return <span className="badge bg-green-500/15 text-green-400 border border-green-500/30 text-[10px]">Ativo</span>;
      case 'trial': return <span className="badge badge-neon text-[10px]">Trial</span>;
      case 'expired': return <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-[10px]">Inadimplente</span>;
      case 'blocked': return <span className="badge bg-red-500/15 text-red-400 border border-red-500/30 text-[10px]">Bloqueado</span>;
      default: return <span className="badge bg-dark-700 text-gray-400 border border-dark-500 text-[10px]">—</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-neon-500/10 to-dark-900 border-neon-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center">
            <Crown className="w-6 h-6 text-neon-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Painel Admin Master
              <Shield className="w-5 h-5 text-neon-500" />
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Acesso exclusivo dos sócios · Gestão total do ecossistema ROI Shape
            </p>
          </div>
        </div>
      </div>

      {/* Partners display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PARTNERS.map((p) => (
          <div key={p.email} className="card p-5 bg-gradient-to-r from-dark-800 to-dark-900 border-neon-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-500/15 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
                <UserCog className="w-5 h-5 text-neon-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="text-xs text-neon-400">{p.role}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{p.email}</p>
              </div>
              <a
                href={`https://wa.me/${p.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-dark-800 border border-dark-600 hover:border-neon-500/50 transition-all flex-shrink-0"
                title={`WhatsApp ${p.name}`}
              >
                <MessageCircle className="w-4 h-4 text-neon-400" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Tab selector */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-neon-500/15 text-neon-400 border border-neon-500/30'
                  : 'text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <>
          {/* Admin emails */}
          <div className="card p-4 bg-dark-900 border-dark-600">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">E-mails com Acesso Master</h3>
            <div className="flex flex-wrap gap-2">
              {ADMIN_EMAILS.map((email) => (
                <span key={email} className="badge badge-neon text-xs">
                  <Mail className="w-3 h-3" />
                  {email}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${s.color}`} />
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Recent users */}
          <div className="card p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-500" />
              Usuários Recentes
            </h3>
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
                        {u.role === 'admin' ? <Crown className="w-4 h-4 text-neon-500" /> : <Users className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{u.display_name || u.email}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-[10px] ${
                        u.role === 'admin' ? 'badge-warning' :
                        u.role === 'personal' ? 'badge-neon' :
                        'bg-dark-700 text-gray-400 border border-dark-500'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'personal' ? 'Personal' : 'Aluno'}
                      </span>
                      <span className={`badge text-[10px] ${
                        u.plan_type === 'pro' ? 'badge-neon' :
                        u.plan_type === 'starter' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                        'bg-dark-700 text-gray-400 border border-dark-500'
                      }`}>
                        {u.plan_type === 'pro' ? 'Pro' : u.plan_type === 'starter' ? 'Starter' : 'Free'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* === SUBSCRIPTIONS TAB === */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-neon-500" />
              Gestão de Assinaturas e Inadimplência
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Monitore e controle o status de assinatura de todos os Personal Trainers cadastrados.
            </p>

            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : trainers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum Personal Trainer cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-dark-600">
                      <th className="text-left py-2 px-2">Nome</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">E-mail</th>
                      <th className="text-left py-2 px-2">Plano</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Vencimento</th>
                      <th className="text-right py-2 px-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.map((t) => (
                      <tr key={t.id} className="border-b border-dark-700 hover:bg-dark-800/50 transition-colors">
                        <td className="py-3 px-2">
                          <p className="font-semibold text-white text-xs">{t.display_name || 'Sem nome'}</p>
                          <p className="text-[10px] text-gray-500 sm:hidden">{t.email}</p>
                        </td>
                        <td className="py-3 px-2 hidden sm:table-cell text-gray-400 text-xs">{t.email}</td>
                        <td className="py-3 px-2">
                          <span className={`badge text-[10px] ${
                            t.plan_type === 'pro' ? 'badge-neon' :
                            t.plan_type === 'starter' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                            'bg-dark-700 text-gray-400 border border-dark-500'
                          }`}>
                            {t.plan_type === 'pro' ? `Pro R$${PLANS.pro.price.toFixed(2).replace('.', ',')}` : t.plan_type === 'starter' ? `Starter R$${PLANS.starter.price.toFixed(2).replace('.', ',')}` : 'Free'}
                          </span>
                        </td>
                        <td className="py-3 px-2">{getStatusBadge(t.subscription_status)}</td>
                        <td className="py-3 px-2 hidden sm:table-cell text-xs text-gray-400">
                          {t.subscription_due_date ? new Date(t.subscription_due_date).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.subscription_status !== 'blocked' && t.subscription_status !== 'expired' ? (
                              <button
                                onClick={() => updateSubscriptionStatus(t.id, 'expired')}
                                disabled={actionLoading === t.id}
                                className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all"
                                title="Suspender por falta de pagamento"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateSubscriptionStatus(t.id, 'active')}
                                disabled={actionLoading === t.id}
                                className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all"
                                title="Liberar / Ativar Acesso"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => banUser(t.id)}
                              disabled={actionLoading === t.id}
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                              title="Bloquear Definitivamente"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteUser(t.id)}
                              disabled={actionLoading === t.id}
                              className="p-1.5 rounded-lg bg-dark-700 border border-dark-600 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Blocked users warning */}
          {trainers.filter((t) => t.subscription_status === 'blocked' || t.subscription_status === 'expired').length > 0 && (
            <div className="card p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400">
                    {trainers.filter((t) => t.subscription_status === 'blocked' || t.subscription_status === 'expired').length} Personal(is) com acesso suspenso
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Todos os alunos vinculados a esses Personais tiveram o acesso travado automaticamente. O aviso exibido para eles: "Acesso temporariamente suspenso por pendência na assinatura da consultoria. Regularize com o suporte."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === SECURITY TAB === */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Security alerts */}
          <div className="card p-5">
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Alertas de Segurança — Sessões Simultâneas
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Detecção de acessos simultâneos em dispositivos diferentes para a mesma conta. Sinais de possível compartilhamento de senha.
            </p>

            {securityAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum alerta de segurança no momento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {securityAlerts.map((alert) => (
                  <div key={alert.email} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">{alert.email}</p>
                        <p className="text-xs text-gray-500">
                          {alert.count} sessões · Dispositivos: {alert.devices.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {allUsers.find((u) => u.email === alert.email) && (
                        <button
                          onClick={() => banUser(allUsers.find((u) => u.email === alert.email)!.id)}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Banir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent session logs */}
          <div className="card p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-neon-500" />
              Log de Sessões Recentes
            </h3>
            {sessionLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhum log de sessão registrado.</p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {sessionLogs.slice(0, 30).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2.5 bg-dark-900 rounded-lg border border-dark-700 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {log.user_agent?.includes('Mobile') ? (
                        <Smartphone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-neon-400 flex-shrink-0" />
                      )}
                      <span className="text-gray-300 truncate">{log.user_email}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-600 text-[10px] hidden sm:inline">
                        {log.user_agent?.slice(0, 40) || 'Unknown'}
                      </span>
                      <span className="text-gray-600 text-[10px] flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick contacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neon-500" />
            Contatos Oficiais
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Suporte</span>
              <span className="text-neon-400">{BRAND.supportEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PIX Oficial</span>
              <span className="text-neon-400 font-mono text-xs">{BRAND.pixKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">WhatsApp Phillip</span>
              <span className="text-neon-400">+55 11 97393-8020</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">WhatsApp Fábio</span>
              <span className="text-neon-400">+55 11 98329-7903</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Instagram</span>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="text-neon-400 hover:underline">{BRAND.instagramHandle}</a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Site</span>
              <a href={BRAND.site} target="_blank" rel="noopener noreferrer" className="text-neon-400 hover:underline">{BRAND.site.replace('https://', '')}</a>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-500" />
            Informações do Sistema
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Lançamento</span>
              <span className="text-white">{BRAND.launchDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PIX Contingência</span>
              <span className="text-neon-400 font-mono text-xs">{BRAND.pixKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Planos</span>
              <span className="text-white">Starter R$47,90 · Pro R$97,90</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pro Fundador BOGO</span>
              <span className="text-white">R$ 67,90/mês</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Upsell Estrutura</span>
              <span className="text-white">R$ 297,00 (taxa única)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
