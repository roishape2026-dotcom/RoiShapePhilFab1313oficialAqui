import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { BRAND, FUNDADOR, TRIAL } from '@/lib/constants';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight,
  GraduationCap, Cog, KeyRound, AlertCircle, CheckCircle2, X,
  Phone, Gift, Clock
} from 'lucide-react';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'student' | 'personal'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [studentBlocked, setStudentBlocked] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const isFundador = typeof window !== 'undefined' &&
    (window.location.search.includes('ref=fundador') || window.location.pathname.includes('/fundador'));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
      setAccountType('student');
      setMode('signup');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && accountType === 'student' && !inviteToken) {
      setStudentBlocked(true);
      return;
    }

    // Trial signup requires phone
    if (mode === 'signup' && accountType === 'personal' && !phone.trim()) {
      setError('Informe seu WhatsApp/Telefone para ativar a degustação grátis.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const result = await Promise.race([
          signIn(email, password),
          new Promise<{ error: string }>((resolve) => {
            window.setTimeout(() => resolve({ error: 'O servidor demorou para responder. Tente novamente.' }), 15000);
          }),
        ]);
        if (result.error) setError(`Falha no login: ${result.error}`);
      } else {
        const result = await Promise.race([
          signUp(email, password, displayName, accountType, phone.trim()),
          new Promise<{ error: string; success: false }>((resolve) => {
            window.setTimeout(() => resolve({ error: 'O servidor demorou para responder. Tente novamente.', success: false }), 15000);
          }),
        ]);
        if (result.error) {
          setError(result.error);
        } else if (result.success) {
          setSignupSuccess(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir a operação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    if (err) {
      setError(translateError(err.message));
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-dark-950 relative"
      style={{
        backgroundImage: 'url(/1792134867475.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-neon-500/50 flex items-center justify-center mb-4 animate-pulse-glow shadow-[0_0_32px_rgba(0,255,102,0.18)] bg-black">
            <img src="/IMG-20260430-WA0005.jpg" alt="Logo ROI Shape" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#00FF66', textShadow: '0 0 20px rgba(0,255,102,0.3)' }}>ROI SHAPE</h1>
          <p className="text-sm text-gray-400 mt-1">{BRAND.tagline}</p>
        </div>

        {/* Founder VIP banner */}
        {isFundador && (
          <div className="card p-4 mb-4 border-neon-500/40 bg-gradient-to-r from-neon-500/15 to-dark-900 animate-fade-in">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-neon-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-neon-400">LINK VIP — LOTE DE FUNDADORES</p>
                <p className="text-xs text-gray-400 mt-0.5">Pague 1 Mês, Ganhe +1 Mês Grátis · R$ {FUNDADOR.proFounderPrice.toFixed(2).replace('.', ',')}/trimestral</p>
              </div>
            </div>
          </div>
        )}

        {/* Trial banner */}
        {!isFundador && mode === 'signup' && accountType === 'personal' && (
          <div className="card p-4 mb-4 border-neon-500/30 bg-neon-500/5 animate-fade-in">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neon-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neon-400">{TRIAL.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{TRIAL.afterTrialLabel} · Sem cartão na inscrição</p>
              </div>
            </div>
          </div>
        )}

        {inviteToken && mode === 'signup' && (
          <div className="card p-4 mb-4 border-neon-500/30 bg-neon-500/5 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neon-400">Convite Recebido!</p>
                <p className="text-xs text-gray-400 mt-0.5">Complete seu cadastro gratuito como Aluno. Acesso vitalício a todos os treinos.</p>
              </div>
            </div>
          </div>
        )}

        {studentBlocked && (
          <div className="card p-5 mb-4 border-red-500/40 bg-red-500/10 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400">AREA EXCLUSIVA DO ALUNO</p>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  O acesso de aluno é concedido exclusivamente através do link de convite enviado pelo seu Personal Trainer. Solicite o link ao seu professor.
                </p>
                <button
                  onClick={() => { setStudentBlocked(false); setAccountType('personal'); }}
                  className="btn-ghost text-xs mt-3 text-neon-400"
                >
                  Sou Personal Trainer, criar conta profissional
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 animate-slide-up">
          <div className="flex gap-2 mb-6 p-1 bg-dark-900 rounded-xl">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-neon-500 text-dark-950' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-neon-500 text-dark-950' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Tipo de Conta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType('student')}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                        accountType === 'student'
                          ? 'border-neon-500 bg-neon-500/10 text-neon-400'
                          : 'border-dark-600 bg-dark-900 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                      <span className="text-xs font-semibold">Aluno</span>
                      <span className="text-[10px] text-gray-500">Gratuito Vitalicio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('personal')}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                        accountType === 'personal'
                          ? 'border-neon-500 bg-neon-500/10 text-neon-400'
                          : 'border-dark-600 bg-dark-900 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <Cog className="w-5 h-5" />
                      <span className="text-xs font-semibold">Professor / Personal</span>
                      <span className="text-[10px] text-gray-500">10 Dias Gratis</span>
                    </button>
                  </div>
                </div>

                {/* Phone field — required for trainer trial */}
                {accountType === 'personal' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">
                      Telefone / WhatsApp <span className="text-neon-400">*</span>
                      <span className="text-[10px] text-gray-600 ml-1">(obrigatorio para degustacao)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required={accountType === 'personal'}
                        className="input-field pl-10"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  minLength={6}
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {mode === 'signin' && (
              <button
                onClick={() => { setShowReset(true); setResetSent(false); setError(null); }}
                className="w-full text-center text-xs text-gray-500 hover:text-neon-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Esqueci minha senha / Redefinir
              </button>
            )}
          </div>

          {mode === 'signup' && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              {accountType === 'student'
                ? 'Alunos tem acesso gratuito vitalicio a todos os treinos e videos. Necessario convite do Personal.'
                : 'Professores tem 10 dias gratis de degustacao. Cadastro obrigatorio com Nome, E-mail e WhatsApp.'}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-600">
          <a href={BRAND.site} target="_blank" rel="noopener noreferrer" className="hover:text-neon-400 transition-colors">
            {BRAND.site.replace('https://', '')}
          </a>
          <span>|</span>
          <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-neon-400 transition-colors">
            {BRAND.instagramHandle}
          </a>
        </div>
      </div>

      {/* Signup Success Modal */}
      {signupSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-neon-500/20 border border-neon-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-neon-500" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Conta criada com sucesso!</h3>
            <p className="text-sm text-gray-400 mb-6">
              {accountType === 'personal'
                ? 'Sua conta de Personal Trainer foi criada com 10 dias de degustação grátis. Faça login para acessar o dashboard.'
                : 'Seu cadastro foi concluído. Faça login para acessar seus treinos.'}
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false);
                setMode('signin');
                setDisplayName('');
                setPhone('');
                setPassword('');
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Fazer Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={() => setShowReset(false)}>
          <div className="card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-neon-500" />
                Redefinir Senha
              </h3>
              <button onClick={() => setShowReset(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            {resetSent ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-400">
                    E-mail de redefinicao enviado! Verifique sua caixa de entrada (e spam).
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">E-mail cadastrado</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="input-field pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Enviar Link de Redefinicao
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('email rate limit exceeded'))
    return 'Aguarde alguns minutos para tentar novamente ou entre em contato com o suporte.';
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed'))
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e spam) ou entre em contato com o suporte.';
  return msg;
}
