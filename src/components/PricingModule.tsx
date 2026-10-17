import { useAuth } from '@/context/AuthContext';
import { PLANS, BRAND, UPSELL, TRIAL, FUNDADOR } from '@/lib/constants';
import {
  Check, Crown, Zap, MessageCircle, QrCode, CreditCard,
  GraduationCap, Dumbbell, Bot, Megaphone, Rocket, Kanban, Sparkles, Link as LinkIcon,
  TrendingDown, Clock, Gift
} from 'lucide-react';

export function PricingModule() {
  const { isAdmin } = useAuth();
  const isFundador = typeof window !== 'undefined' &&
    (window.location.search.includes('ref=fundador') || window.location.pathname.includes('/fundador'));

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="card p-6 bg-gradient-to-br from-neon-500/10 to-dark-900 border-neon-500/30">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-neon-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Acesso Admin Master</h2>
              <p className="text-sm text-gray-400 mt-1">
                Você tem acesso total e irrestrito a todos os recursos, IAs e relatórios. Sem cobranças, sem paywall.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="card p-5">
              <h3 className="font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
              <div className="mt-3">
                <span className="badge badge-neon">Acesso Liberado</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial / Founder Banner */}
      {isFundador ? (
        <div className="card p-6 bg-gradient-to-r from-neon-500/15 via-dark-800 to-dark-900 border-neon-500/40 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-neon-500/20 border border-neon-500/40 flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-neon-500" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">LINK VIP — LOTE DE FUNDADORES</h3>
                <p className="text-sm text-neon-400">Pague 1 Mês e Ganhe +1 Mês Grátis (2 meses pelo preço de 1)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="badge badge-neon text-sm">
                <Clock className="w-3 h-3" />
                Vagas Limitadas
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 bg-gradient-to-r from-neon-500/15 via-dark-800 to-dark-900 border-neon-500/40 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-neon-500/20 border border-neon-500/40 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-neon-500" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{TRIAL.label.toUpperCase()}</h3>
                <p className="text-sm text-neon-400">{TRIAL.afterTrialLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="badge badge-neon text-sm">
                <Clock className="w-3 h-3" />
                Sem cartão na inscrição
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment methods banner */}
      <div className="card p-4 bg-dark-900 border-dark-600">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-neon-500" />
            <span className="text-sm text-gray-300">PIX Automático / Instantâneo</span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neon-500" />
            <span className="text-sm text-gray-300">Cartão de Crédito (Assinatura Recorrente)</span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">PIX de Contingência:</span>
            <span className="text-xs text-neon-400 font-mono select-all">{BRAND.pixKey}</span>
          </div>
        </div>
      </div>

      {/* Student Plan — highlighted banner card */}
      <div className="card p-6 bg-gradient-to-r from-neon-500/10 via-dark-800 to-dark-900 border-neon-500/30">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/15 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-neon-500" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{PLANS.free.name}</h3>
              <p className="text-sm text-neon-400 font-semibold">{PLANS.free.description}</p>
            </div>
          </div>
          <div className="sm:ml-auto">
            <span className="badge badge-neon text-sm">
              <Check className="w-3 h-3" />
              Acesso Liberado
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {PLANS.free.features.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-neon-500 flex-shrink-0 mt-0.5" />
              {f}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-dark-600">
          <p className="text-xs text-gray-500">
            Sem cobranças, sem cartão de crédito, sem contador de dias de teste. Acesso permanente e ilimitado.
          </p>
        </div>
      </div>

      {/* Section divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-dark-600" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-neon-500" />
          Planos para Personal Trainer
        </span>
        <div className="h-px flex-1 bg-dark-600" />
      </div>

      {/* Trainer Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Starter */}
        <div className="card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-5 h-5 text-neon-500" />
            <h3 className="font-bold text-white text-lg">Personal Starter</h3>
          </div>

          {/* Anchored pricing */}
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-3xl font-bold text-white">
              R$ {PLANS.starter.price.toFixed(2).replace('.', ',')}
              <span className="text-sm text-gray-500 font-normal">/mês</span>
            </p>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600 line-through">
              R$ {FUNDADOR.originalMonthly.toFixed(2).replace('.', ',')}
            </span>
            <span className="badge badge-neon text-[10px]">
              <TrendingDown className="w-2.5 h-2.5" />
              {isFundador ? 'VIP Fundador' : 'Lote de Fundadores'}
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">O que está incluso:</p>
          <ul className="space-y-2.5 mb-5 flex-1">
            {PLANS.starter.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-neon-500 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <a
            href={PLANS.starter.asaasLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full text-center text-sm flex items-center justify-center gap-2"
          >
            Assinar via Asaas
            <MessageCircle className="w-4 h-4" />
          </a>
          <a
            href={PLANS.starter.infinitePayLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full text-center text-xs flex items-center justify-center gap-1.5 mt-2 text-gray-400"
          >
            ou pagar via InfinitePay
            <CreditCard className="w-3.5 h-3.5" />
          </a>
          <p className="text-xs text-gray-600 mt-2 text-center">
            PIX ou Cartão · Asaas / InfinitePay
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-600">
            <LinkIcon className="w-3 h-3" />
            <span className="font-mono truncate max-w-[200px]">{PLANS.starter.asaasLink.replace('https://www.asaas.com/c/', 'asaas.com/c/')}</span>
          </div>
        </div>

        {/* Pro */}
        <div className="card p-6 flex flex-col relative border-neon-500/50 shadow-lg shadow-neon-500/10 md:scale-[1.02]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="badge badge-neon text-xs">
              <Zap className="w-3 h-3" />
              O Mais Popular & Completo
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-neon-500" />
            <h3 className="font-bold text-white text-lg">Personal Pro + IA</h3>
          </div>

          {/* Anchored pricing — BOGO founder vs regular */}
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-3xl font-bold text-white">
              R$ {isFundador ? FUNDADOR.proFounderPrice.toFixed(2).replace('.', ',') : PLANS.pro.price.toFixed(2).replace('.', ',')}
              <span className="text-sm text-gray-500 font-normal">/mês</span>
            </p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600 line-through">
              R$ {FUNDADOR.proRegularPrice.toFixed(2).replace('.', ',')}
            </span>
            <span className="badge badge-neon text-[10px]">
              <TrendingDown className="w-2.5 h-2.5" />
              {isFundador ? 'VIP Fundador BOGO' : 'Lote de Fundadores'}
            </span>
          </div>
          {isFundador && (
            <p className="text-xs text-neon-400 mb-3 font-semibold">
              Pague o 1º Mês e Ganhe o 2º Mês 100% Grátis
            </p>
          )}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">O que está incluso:</p>
          <ul className="space-y-2.5 mb-5 flex-1">
            {PLANS.pro.features.map((f, i) => {
              const icon = getProFeatureIcon(f);
              const Icon = icon;
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <Icon className="w-4 h-4 text-neon-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              );
            })}
          </ul>

          <a
            href={PLANS.pro.asaasLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full text-center text-sm flex items-center justify-center gap-2"
          >
            Assinar via Asaas
            <MessageCircle className="w-4 h-4" />
          </a>
          <a
            href={PLANS.pro.infinitePayLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full text-center text-xs flex items-center justify-center gap-1.5 mt-2 text-gray-400"
          >
            ou pagar via InfinitePay
            <CreditCard className="w-3.5 h-3.5" />
          </a>
          <p className="text-xs text-gray-600 mt-2 text-center">
            PIX ou Cartão · Asaas / InfinitePay
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-600">
            <LinkIcon className="w-3 h-3" />
            <span className="font-mono truncate max-w-[200px]">{PLANS.pro.asaasLink.replace('https://www.asaas.com/c/', 'asaas.com/c/')}</span>
          </div>
        </div>
      </div>

      {/* PIX contingency section */}
      <div className="card p-5 bg-dark-900 border-dark-600">
        <h3 className="text-semibold text-white mb-2 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-neon-500" />
          Chave PIX Oficial de Contingência
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          Para transferências manuais em caso de necessidade, use a chave PIX oficial:
        </p>
        <div className="bg-dark-800 rounded-xl p-3 font-mono text-neon-400 text-sm select-all">
          {BRAND.pixKey}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span>E-mail de suporte:</span>
          <a href={`mailto:${BRAND.supportEmail}`} className="text-neon-400 hover:underline">{BRAND.supportEmail}</a>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Após o pagamento, envie o comprovante para {BRAND.supportEmail} ou WhatsApp {BRAND.whatsapp1Name}: +55 11 97393-8020
        </p>
      </div>

      {/* Upsell banner */}
      <div className="card p-5 bg-gradient-to-r from-orange-500/10 to-dark-900 border-orange-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-6 h-6 text-orange-400" />
          <div>
            <h3 className="font-bold text-white">Upsell — Estrutura de Vendas</h3>
            <p className="text-xs text-gray-400">{UPSELL.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-2xl font-bold text-orange-400">R$ {UPSELL.price.toFixed(2).replace('.', ',')}</p>
          <a
            href={`https://wa.me/${BRAND.whatsapp1}?text=${encodeURIComponent(UPSELL.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Quero saber mais
          </a>
        </div>
      </div>
    </div>
  );
}

function getProFeatureIcon(feature: string): typeof Check {
  if (feature.includes('IA') || feature.includes('Inteligência Artificial')) return Bot;
  if (feature.includes('Prompts')) return Sparkles;
  if (feature.includes('Tráfego') || feature.includes('Anúncios')) return Megaphone;
  if (feature.includes('Upsell') || feature.includes('297')) return Rocket;
  if (feature.includes('CRM') || feature.includes('Kanban')) return Kanban;
  return Check;
}
