import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { TabKey } from '@/lib/constants';
import type { Profile, UserRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string, role: 'personal' | 'student', phone?: string, personalId?: string) => Promise<{ error: string | null; success: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Conta não encontrada ou senha incorreta. Verifique o e-mail e a senha e tente novamente.';
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed'))
    return 'E-mail não confirmado. Confirme o endereço pelo link recebido antes de entrar.';
  if (msg.includes('Password should be at least') || msg.includes('Password must be at least'))
    return 'A senha precisa ter pelo menos 6 caracteres.';
  if (msg.includes('Password should contain') || msg.includes('weak password'))
    return 'Escolha uma senha mais forte, com pelo menos 6 caracteres.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado';
  if (msg.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres';
  if (msg.includes('Unable to validate email address')) return 'E-mail inválido';
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('email rate limit exceeded'))
    return 'Aguarde alguns minutos para tentar novamente ou entre em contato com o suporte.';
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }, [session, fetchProfile]);

  useEffect(() => {
    const loadingTimeout = setTimeout(() => setLoading(false), 5000);
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          if (!p) {
            // No profile row = invalid session. Force sign out.
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
          } else {
            setProfile(p);
          }
        }
      } catch {
        // Supabase unavailable
      } finally {
        setLoading(false);
      }

      try {
        const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
          (async () => {
            setSession(s);
            if (event === 'PASSWORD_RECOVERY') {
              setPasswordRecovery(true);
              setLoading(false);
              return;
            }
            if (s?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              const p = await fetchProfile(s.user.id);
              if (!p) {
                await supabase.auth.signOut();
                setSession(null);
                setProfile(null);
              } else {
                setProfile(p);
              }
            } else if (event === 'SIGNED_OUT') {
              setProfile(null);
              setSession(null);
            }
          })();
        });
        unsub = sub.subscription.unsubscribe;
      } catch {
        // ignore
      }
    })();

    return () => {
      clearTimeout(loadingTimeout);
      unsub?.();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { error: 'Informe e-mail e senha.' };
    }

    try {
      // Try normal Supabase login first
      const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    // If normal login fails AND this is the admin provisioning email,
    // call the server-side provisioning edge function (password stays server-side).
        if (error) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return { error: translateError(error.message) };
        }
      

    if (!data.user) return { error: 'Falha na autenticação. Tente novamente.' };

    // Double-check: profile must exist in the database
    const p = await fetchProfile(data.user.id);
    if (!p) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return { error: 'Perfil não encontrado. Contate o suporte para ativar sua conta.' };
    }

    setProfile(p);

    // Best-effort session logging
    try {
      await supabase.from('session_logs').insert({
        user_id: data.user.id,
        user_email: cleanEmail,
        user_agent: navigator.userAgent,
        ip_hash: null,
      });
    } catch {
      // best-effort
    }

      return { error: null };
    } catch (err) {
      await supabase.auth.signOut().catch(() => undefined);
      setSession(null);
      setProfile(null);
      const message = err instanceof Error ? err.message : 'Não foi possível concluir o login.';
      return { error: translateError(message) };
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName: string,
    role: 'personal' | 'student',
    phone?: string,
    personalId?: string,
  ): Promise<{ error: string | null; success: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const metadata: Record<string, string> = {
      display_name: displayName,
      phone: phone || '',
    };

    // The DB trigger reads raw_user_meta_data.role to determine the profile role.
    // For student signups (via invite link), pass role='student' and personal_id.
    // For public trainer signups, omit role so the trigger defaults to 'personal'.
    if (role === 'student') {
      metadata.role = 'student';
      if (personalId) metadata.personal_id = personalId;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: metadata },
      });

      if (error) return { error: translateError(error.message), success: false };
      if (!data.user) return { error: 'Falha no cadastro. Tente novamente.', success: false };

      // With email confirmation disabled, Supabase returns a session immediately.
      // If it does not, try the same credentials so the user enters without a second form.
      if (!data.session) {
        const login = await signIn(cleanEmail, password);
        if (login.error) {
          return {
            error: login.error.includes('não confirmado')
              ? 'Cadastro criado, mas a confirmação de e-mail ainda está ativada no Supabase.'
              : login.error,
            success: false,
          };
        }
      } else {
        setSession(data.session);
        const p = await fetchProfile(data.user.id);
        if (!p) {
          await supabase.auth.signOut();
          setSession(null);
          return { error: 'Cadastro criado, mas o perfil não foi criado. Contate o suporte.', success: false };
        }
        setProfile(p);
      }

      return { error: null, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível concluir o cadastro.';
      return { error: translateError(message), success: false };
    }
  }, [fetchProfile, signIn]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin, passwordRecovery, clearPasswordRecovery, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getHomeTabForRole(role: UserRole | undefined): TabKey {
  if (role === 'admin') return 'admin';
  return 'workouts';
}
