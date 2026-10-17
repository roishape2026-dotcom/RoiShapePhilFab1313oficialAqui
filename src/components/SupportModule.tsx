import { BRAND } from '@/lib/constants';
import { Headphones, MessageCircle, Mail, Globe, Instagram, Youtube, HelpCircle } from 'lucide-react';

export function SupportModule() {
  const faqs = [
    { q: 'Como criar uma ficha de treino?', a: 'Acesse a aba "Início" e clique em "Nova Ficha" ou "Gerar com IA" para criar treinos automaticamente.' },
    { q: 'Como adicionar um aluno?', a: 'Acesse a aba "Alunos" e clique em "+ Aluno" ou gere um link de convite para seu aluno se cadastrar.' },
    { q: 'Como funciona a degustação grátis?', a: 'Você tem 10 dias de acesso completo a todos os recursos. Após esse período, escolha um plano para continuar.' },
    { q: 'Como editar vídeos do YouTube?', a: 'Na aba "Treinos", expanda um exercício e clique em "Adicionar / Editar Link do YouTube".' },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Headphones className="w-5 h-5 text-neon-500" />
          Suporte & Ajuda
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Entre em contato com nossa equipe ou consulte as perguntas frequentes
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`https://wa.me/${BRAND.whatsapp1}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-hover p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-neon-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">WhatsApp — {BRAND.whatsapp1Name}</p>
              <p className="text-xs text-gray-500">+55 11 97393-8020</p>
            </div>
          </div>
        </a>

        <a
          href={`https://wa.me/${BRAND.whatsapp2}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-hover p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-neon-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">WhatsApp — {BRAND.whatsapp2Name}</p>
              <p className="text-xs text-gray-500">+55 11 98329-7903</p>
            </div>
          </div>
        </a>

        <a
          href={`mailto:${BRAND.supportEmail}`}
          className="card card-hover p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-neon-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">E-mail de Suporte</p>
              <p className="text-xs text-gray-500">{BRAND.supportEmail}</p>
            </div>
          </div>
        </a>

        <a
          href={BRAND.site}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-hover p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-neon-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">Site Oficial</p>
              <p className="text-xs text-gray-500">{BRAND.site.replace('https://', '')}</p>
            </div>
          </div>
        </a>

        <a
          href={BRAND.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-hover p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-6 h-6 text-neon-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">Instagram</p>
              <p className="text-xs text-gray-500">{BRAND.instagramHandle}</p>
            </div>
          </div>
        </a>

        <a
          href={BRAND.youtubeChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-hover p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon-500/10 border border-neon-500/30 flex items-center justify-center flex-shrink-0">
              <Youtube className="w-6 h-6 text-neon-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">Canal do YouTube</p>
              <p className="text-xs text-gray-500">{BRAND.youtubeChannelName}</p>
            </div>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div className="card p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-neon-500" />
          Perguntas Frequentes
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-dark-900 rounded-xl p-4 border border-dark-600">
              <p className="text-sm font-semibold text-neon-400">{faq.q}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
