import { useAuth } from '@/context/AuthContext';
import { BRAND, PLANS } from '@/lib/constants';
import { User, Mail, Crown, GraduationCap, Cog, CreditCard, Calendar, Activity } from 'lucide-react';

export function ProfileModule() {
  const { profile, isAdmin } = useAuth();

  if (!profile) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-400">Carregando perfil...</p>
      </div>
    );
  }

  const role = profile.role ?? 'student';
  const isStudent = role === 'student';
  const isTrainer = role === 'personal';
  const planLabel = profile.plan_type === 'pro' ? 'Pro + IA' : profile.plan_type === 'starter' ? 'Starter' : 'Free';
  const statusLabel = profile.subscription_status === 'active' ? 'Ativo' : profile.subscription_status === 'trial' ? 'Degustação' : profile.subscription_status === 'expired' ? 'Inadimplente' : profile.subscription_status === 'blocked' ? 'Bloqueado' : '—';

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
            {isAdmin ? <Crown className="w-8 h-8 text-neon-500" /> : isStudent ? <GraduationCap className="w-8 h-8 text-neon-500" /> : <Cog className="w-8 h-8 text-neon-500" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{profile.display_name || 'Sem nome'}</h2>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {profile.email}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge text-[10px] ${isAdmin ? 'badge-warning' : isStudent ? 'badge-neon' : 'badge-neon'}`}>
                {isAdmin ? 'Admin Master' : isStudent ? 'Aluno' : 'Personal Trainer'}
              </span>
              {!isAdmin && (
                <span className={`badge text-[10px] ${profile.plan_type === 'pro' ? 'badge-neon' : profile.plan_type === 'starter' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-dark-700 text-gray-400 border border-dark-500'}`}>
                  Plano {planLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="card p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-neon-500" />
          Detalhes da Conta
        </h3>
        <div className="space-y-3">
          <DetailRow icon={Mail} label="E-mail" value={profile.email} />
          <DetailRow icon={User} label="Nome" value={profile.display_name || 'Não definido'} />
          <DetailRow icon={Cog} label="Tipo de Conta" value={isAdmin ? 'Admin Master' : isStudent ? 'Aluno' : 'Personal Trainer'} />
          {!isAdmin && (
            <>
              <DetailRow icon={CreditCard} label="Plano" value={`Plano ${planLabel}`} />
              <DetailRow icon={Activity} label="Status da Assinatura" value={statusLabel} />
              {profile.trial_ends_at && (
                <DetailRow icon={Calendar} label="Degustação termina em" value={new Date(profile.trial_ends_at).toLocaleDateString('pt-BR')} />
              )}
              {profile.subscription_due_date && (
                <DetailRow icon={Calendar} label="Próximo vencimento" value={new Date(profile.subscription_due_date).toLocaleDateString('pt-BR')} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Plan info for trainer */}
      {isTrainer && !isAdmin && (
        <div className="card p-5">
          <h3 className="font-bold text-white mb-3">Seu Plano Atual</h3>
          <div className="bg-dark-900 rounded-xl p-4 border border-dark-600">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-white">
                {profile.plan_type === 'pro' ? PLANS.pro.name : profile.plan_type === 'starter' ? PLANS.starter.name : 'Plano Gratuito'}
              </p>
              <span className="badge badge-neon text-[10px]">{statusLabel}</span>
            </div>
            {profile.subscription_status === 'trial' && (
              <p className="text-xs text-neon-400 mt-2">
                Você está no período de degustação de 10 dias. Após esse período, escolha um plano para continuar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Contact links */}
      <div className="card p-5">
        <h3 className="font-bold text-white mb-3">Contato & Suporte</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">E-mail</span>
            <a href={`mailto:${BRAND.supportEmail}`} className="text-neon-400 hover:underline">{BRAND.supportEmail}</a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Site</span>
            <a href={BRAND.site} target="_blank" rel="noopener noreferrer" className="text-neon-400 hover:underline">{BRAND.site.replace('https://', '')}</a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Instagram</span>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="text-neon-400 hover:underline">{BRAND.instagramHandle}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className="text-sm text-gray-200 text-right">{value}</span>
    </div>
  );
}
