import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BRAND } from '@/lib/constants';
import { Dumbbell, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export function ResetPasswordScreen() {
  const { clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message || 'Não foi possível atualizar a senha. Tente novamente.');
      return;
    }

    setSuccess(true);
    setTimeout(async () => {
      clearPasswordRecovery();
      await supabase.auth.signOut();
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-dark-950 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl border border-neon-500/50 flex items-center justify-center mb-4 bg-dark-900">
            <Dumbbell className="w-8 h-8 text-neon-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neon-400">ROI SHAPE</h1>
          <p className="text-sm text-gray-400 mt-1">Redefinir Senha</p>
        </div>

        <div className="card p-6 animate-slide-up">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-neon-500/20 border border-neon-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-neon-500" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Senha atualizada!</h3>
              <p className="text-sm text-gray-400">
                Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Digite sua nova senha abaixo. Após salvar, você será desconectado e poderá entrar com a nova senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      autoFocus
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

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                      minLength={6}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Salvar Nova Senha
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
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
    </div>
  );
}
