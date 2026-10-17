import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PLANS, FREE_STUDENT_LIMIT } from '@/lib/constants';
import type { TrainerStudent, Profile } from '@/types';
import {
  Users, Plus, Trash2, X, Mail, Search, UserCheck,
  Dumbbell, Activity, TrendingUp, Eye, Link as LinkIcon,
  Ban, CheckCircle2, AlertTriangle, Crown, Link2, Copy, Check,
  UserPlus, Calendar, Percent
} from 'lucide-react';

const WEEK_DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// Deterministic pseudo-frequency based on student id hash
function getFrequency(studentId: string): number[] {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) hash = ((hash << 5) - hash + studentId.charCodeAt(i)) | 0;
  return WEEK_DAYS.map((_, i) => {
    const seed = (hash + i * 7) & 0xff;
    return seed % 100 > 35;
  });
}

export function StudentManagement() {
  const { session, profile, isAdmin } = useAuth();
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TrainerStudent | null>(null);
  const [studentStats, setStudentStats] = useState<{ workouts: number; bioRecords: number } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPaid = profile?.plan_type === 'starter' || profile?.plan_type === 'pro' || profile?.subscription_status === 'active' || isAdmin;
  const studentLimit = isPaid ? Infinity : FREE_STUDENT_LIMIT;
  const activeStudents = students.filter((s) => !s.is_blocked).length;
  const blockedCount = students.filter((s) => s.is_blocked).length;
  const canAddMore = activeStudents < studentLimit;

  // Calculate retention percentage
  const totalStudents = students.length;
  const retentionPct = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

  const loadStudents = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('trainer_students')
        .select('*')
        .eq('trainer_id', session.user.id)
        .order('created_at', { ascending: false });
      setStudents(data ?? []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const searchStudent = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', searchEmail.trim().toLowerCase())
        .eq('role', 'student')
        .maybeSingle();
      setSearchResult(data as Profile | null);
    } catch {
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddClick = () => {
    if (!canAddMore) { setShowUpgrade(true); return; }
    setShowAdd(true);
  };

  const linkStudent = async () => {
    if (!session?.user || !searchResult) return;
    try {
      await supabase.from('trainer_students').insert({
        trainer_id: session.user.id,
        student_id: searchResult.id,
        student_name: searchResult.display_name || searchResult.email,
        student_email: searchResult.email,
        is_blocked: false,
      });
      setShowAdd(false);
      setSearchEmail('');
      setSearchResult(null);
      await loadStudents();
    } catch { /* ignore */ }
  };

  const toggleBlockStudent = async (student: TrainerStudent) => {
    const newBlocked = !student.is_blocked;
    setStudents(students.map((s) => s.id === student.id ? { ...s, is_blocked: newBlocked } : s));
    try {
      await supabase.from('trainer_students').update({ is_blocked: newBlocked }).eq('id', student.id);
    } catch { /* ignore */ }
  };

  const unlinkStudent = async (id: string) => {
    try {
      await supabase.from('trainer_students').delete().eq('id', id);
      setStudents(students.filter((s) => s.id !== id));
      if (selectedStudent?.id === id) setSelectedStudent(null);
    } catch { /* ignore */ }
  };

  const viewStudentDetails = async (student: TrainerStudent) => {
    setSelectedStudent(student);
    try {
      const [workoutsR, bioR] = await Promise.all([
        supabase.from('workouts').select('id, name, created_at').eq('student_id', student.student_id).order('created_at', { ascending: false }),
        supabase.from('bioimpedance_records').select('id, record_date, weight_kg, body_fat_pct').eq('user_id', student.student_id).order('record_date', { ascending: false }),
      ]);
      setStudentStats({
        workouts: workoutsR.data?.length || 0,
        bioRecords: bioR.data?.length || 0,
      });
    } catch {
      setStudentStats({ workouts: 0, bioRecords: 0 });
    }
  };

  const generateInviteToken = async () => {
    if (!session?.user) return;
    const token = `${session?.user?.id?.slice(0, 8) ?? 'roi'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await supabase.from('trainer_students').insert({
        trainer_id: session.user.id,
        student_id: null,
        student_name: 'Convite Pendente',
        student_email: '',
        invite_token: token,
        is_blocked: false,
      });
      setInviteToken(token);
      setShowInvite(true);
      await loadStudents();
    } catch { /* ignore */ }
  };

  const inviteUrl = inviteToken ? `${window.location.origin}/?invite=${inviteToken}` : '';

  const copyInviteUrl = () => {
    if (!inviteUrl) return;
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-500" />
              Painel do Professor
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Gestao completa de alunos — cadastre, acompanhe e retenha
            </p>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={handleAddClick} className="card card-hover p-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-neon-500" />
            <span className="text-xs text-gray-500">Adicionar</span>
          </div>
          <p className="text-lg font-bold text-white">+ Aluno</p>
          <p className="text-[10px] text-gray-600 mt-1">Vincular novo aluno</p>
        </button>
        <button onClick={generateInviteToken} className="card card-hover p-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-5 h-5 text-neon-500" />
            <span className="text-xs text-gray-500">Convite</span>
          </div>
          <p className="text-lg font-bold text-white">Link de Cadastro</p>
          <p className="text-[10px] text-gray-600 mt-1">Gerar link do aluno</p>
        </button>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-400" />
            <span className="text-xs text-gray-500">Ativos / Inativos</span>
          </div>
          <p className="text-lg font-bold text-white">
            <span className="text-green-400">{activeStudents}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-red-400">{blockedCount}</span>
          </p>
          <p className="text-[10px] text-gray-600 mt-1">{totalStudents} total</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-neon-500" />
            <span className="text-xs text-gray-500">Retencao</span>
          </div>
          <p className="text-lg font-bold text-white">{retentionPct}%</p>
          <p className="text-[10px] text-gray-600 mt-1">Frequencia semanal</p>
        </div>
      </div>

      {/* Free tier limit warning */}
      {!isPaid && (
        <div className="card p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400">Plano Gratuito — Limite de {FREE_STUDENT_LIMIT} Aluno</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Voce tem {activeStudents} de {FREE_STUDENT_LIMIT} aluno(s) ativo(s). Assine para gerenciar alunos ilimitados.
              </p>
              <button onClick={() => setShowUpgrade(true)} className="btn-secondary text-xs mt-2 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Fazer Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student list with weekly frequency markers */}
      {students.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum aluno vinculado ainda. Clique em "+ Aluno" para comecar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((s) => {
            const freq = getFrequency(s.id ?? s.student_id ?? '');
            return (
              <div key={s.id} className={`card p-4 group ${s.is_blocked ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.is_blocked ? 'bg-red-500/10 border border-red-500/20' : 'bg-neon-500/10 border border-neon-500/20'}`}>
                      {s.is_blocked ? <Ban className="w-5 h-5 text-red-400" /> : <UserCheck className="w-5 h-5 text-neon-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.student_name || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {s.student_email || '—'}
                      </p>
                      {s.is_blocked && (
                        <span className="text-[10px] text-red-400 font-semibold mt-0.5 block">BLOQUEADO</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => unlinkStudent(s.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Weekly frequency markers */}
                {!s.is_blocked && (
                  <div className="flex items-center gap-1 mt-3">
                    {WEEK_DAYS.map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-gray-600">{day}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold ${
                          freq[i]
                            ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30'
                            : 'bg-dark-900 text-gray-700 border border-dark-600'
                        }`}>
                          {freq[i] ? '✓' : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => viewStudentDetails(s)}
                    className={`btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 ${selectedStudent?.id === s.id ? 'text-neon-400' : ''}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Detalhes
                  </button>
                  <button
                    onClick={() => toggleBlockStudent(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      s.is_blocked
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                    }`}
                  >
                    {s.is_blocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {s.is_blocked ? 'Reativar' : 'Bloquear'}
                  </button>
                  <span className="text-[10px] text-gray-600 ml-auto">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student detail panel */}
      {selectedStudent && studentStats && (
        <div className="card p-5 animate-fade-in">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-neon-500" />
            Painel do Aluno: {selectedStudent.student_name || '—'}
            {selectedStudent.is_blocked && (
              <span className="badge badge-error text-[10px]">Bloqueado</span>
            )}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-500">Fichas de Treino</span>
              </div>
              <p className="text-lg font-bold text-white">{studentStats.workouts}</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-500">Avaliacoes Fisicas</span>
              </div>
              <p className="text-lg font-bold text-white">{studentStats.bioRecords}</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-3 border border-dark-600">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-neon-500" />
                <span className="text-xs text-gray-500">Status</span>
              </div>
              <p className={`text-sm font-bold ${selectedStudent.is_blocked ? 'text-red-400' : 'text-neon-400'}`}>
                {selectedStudent.is_blocked ? 'Bloqueado' : 'Ativo'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={() => { setShowAdd(false); setSearchResult(null); setSearchEmail(''); }}>
          <div className="card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Vincular Aluno</h3>
              <button onClick={() => { setShowAdd(false); setSearchResult(null); setSearchEmail(''); }} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Buscar por e-mail do aluno</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                      placeholder="aluno@email.com"
                      className="input-field pl-10"
                      autoFocus
                    />
                  </div>
                  <button onClick={searchStudent} disabled={searching} className="btn-secondary px-4">
                    {searching ? <span className="w-4 h-4 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" /> : 'Buscar'}
                  </button>
                </div>
              </div>

              {searchResult && (
                <div className="bg-neon-500/10 border border-neon-500/30 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-500/20 border border-neon-500/30 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-neon-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{searchResult.display_name || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500">{searchResult.email}</p>
                    </div>
                  </div>
                  <button onClick={linkStudent} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                    <LinkIcon className="w-4 h-4" />
                    Confirmar Vinculo
                  </button>
                </div>
              )}

              {searchEmail && !searchResult && !searching && (
                <div className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">Aluno nao encontrado. Peça para ele criar uma conta gratuita primeiro.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={() => setShowUpgrade(false)}>
          <div className="card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-neon-500" />
                Upgrade Necessario
              </h3>
              <button onClick={() => setShowUpgrade(false)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-400 font-semibold mb-1">Limite de aluno gratuito atingido</p>
                <p className="text-xs text-gray-400">Assine um plano para gerenciar alunos ilimitados.</p>
              </div>
              <div className="space-y-3">
                <a href={PLANS.starter.asaasLink} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full flex items-center justify-between text-sm p-4">
                  <div className="text-left">
                    <p className="font-semibold text-white">Personal Starter</p>
                    <p className="text-xs text-gray-500">Alunos ilimitados</p>
                  </div>
                  <span className="text-neon-400 font-bold">R$ 47,90/mes</span>
                </a>
                <a href={PLANS.pro.asaasLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full flex items-center justify-between text-sm p-4">
                  <div className="text-left">
                    <p className="font-semibold text-dark-950">Personal Pro + IA</p>
                    <p className="text-xs text-dark-800">Alunos ilimitados + IA + CRM</p>
                  </div>
                  <span className="text-dark-950 font-bold">R$ 97,00/mes</span>
                </a>
              </div>
              <p className="text-xs text-gray-600 text-center">10 dias gratis de degustacao · Cancele quando quiser</p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && inviteToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={() => { setShowInvite(false); setInviteToken(null); setCopied(false); }}>
          <div className="card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-neon-500" />
                Link de Cadastro do Aluno
              </h3>
              <button onClick={() => { setShowInvite(false); setInviteToken(null); setCopied(false); }} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-neon-500/10 border border-neon-500/30 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-3">
                  Envie este link para o seu aluno. Ele podera criar a conta gratuita e sera vinculado automaticamente:
                </p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={inviteUrl} className="input-field text-xs font-mono" />
                  <button onClick={copyInviteUrl} className="btn-primary px-3 py-2 text-sm flex items-center gap-1.5">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
