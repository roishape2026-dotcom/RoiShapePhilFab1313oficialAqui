import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BRAND, UPSELL } from '@/lib/constants';
import type { Lead } from '@/types';
import {
  Megaphone, Plus, Trash2, X, MessageCircle, Phone, MapPin,
  Sparkles, Users, TrendingUp, Filter, ArrowRight, Zap, Target
} from 'lucide-react';

const KANBAN_COLUMNS: { key: Lead['status']; label: string; color: string }[] = [
  { key: 'new', label: 'Novos', color: 'border-blue-500/30' },
  { key: 'contacted', label: 'Contatados', color: 'border-yellow-500/30' },
  { key: 'qualified', label: 'Qualificados', color: 'border-neon-500/30' },
  { key: 'won', label: 'Fechados', color: 'border-green-500/30' },
  { key: 'lost', label: 'Perdidos', color: 'border-red-500/30' },
];

const OBJECTION_SCRIPTS = [
  { objection: 'Está caro', script: 'Entendo! Pense no valor como um investimento de R$ 3,23/dia (Plano Pro R$ 97,00/mês). Menos que um café. Você terá retorno em resultados reais dos seus alunos.' },
  { objection: 'Vou pensar', script: 'Claro! Mas lembre que as vagas com bônus são limitadas. Posso reservar a sua agora e você decide nos próximos 10 dias sem risco?' },
  { objection: 'Já uso outro app', script: 'Excelente! O ROI Shape não substitui, ele complementa. Ninguém no mercado oferece biomecânica + bioimpedância + CRM de tráfego em um só lugar.' },
  { objection: 'Não tenho tempo', script: 'O método foi desenhado para Personal ocupado. A IA gera a ficha em 30 segundos. Você só revisa e aprova.' },
];

const TRAFFIC_CHANNELS = [
  { name: 'Meta Ads', icon: Megaphone, color: 'text-blue-400', desc: 'Facebook & Instagram Ads', url: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns' },
  { name: 'Google Ads', icon: Target, color: 'text-neon-400', desc: 'Search & Display Network', url: 'https://ads.google.com/aw/campaigns' },
  { name: 'TikTok Ads', icon: Sparkles, color: 'text-pink-400', desc: 'Vídeos curtos e viralização', url: 'https://ads.tiktok.com/i18n/dashboard/campaign/' },
  { name: 'YouTube Ads', icon: TrendingUp, color: 'text-red-400', desc: 'Canal e anúncios em vídeo', url: 'https://ads.google.com/aw/campaigns?ocid=youtube' },
];

const AI_PROMPTS = [
  { title: 'Copy para Meta Ads', prompt: 'Crie um anúncio para Instagram focado em Personal Trainers que querem gerar fichas de treino científico automaticamente. Destaque: IA, biomecânica e bioimpedância. TOM: direto, profissional, urgência.' },
  { title: 'Roteiro de Reels', prompt: 'Escreva um roteiro de Reels de 30 segundos mostrando a transformação de um aluno usando o método ROI Shape. Comece com um gancho forte nos primeiros 3 segundos.' },
  { title: 'Script de Vendas WhatsApp', prompt: 'Escreva um script de vendas para WhatsApp que um Personal pode enviar para leads interessados em treino personalizado. Inclua quebra das 3 objeções mais comuns.' },
  { title: 'Bio para Instagram', prompt: 'Crie uma bio de Instagram para um Personal Trainer que usa o método ROI Shape. Inclua CTA para agendar avaliação e link na bio.' },
];

export function TrafficHub() {
  const { session } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [radius, setRadius] = useState(5);

  const loadLeads = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const addLead = async (name: string, phone: string, source: string) => {
    if (!session?.user) return;
    await supabase.from('leads').insert({
      user_id: session.user.id,
      name, phone, source,
      status: 'new',
    });
    setShowAddLead(false);
    await loadLeads();
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    setLeads(leads.map((l) => l.id === id ? { ...l, status } : l));
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const deleteLead = async (id: string) => {
    setLeads(leads.filter((l) => l.id !== id));
    await supabase.from('leads').delete().eq('id', id);
  };

  const upsellWhatsappUrl = `https://wa.me/${BRAND.whatsapp1}?text=${encodeURIComponent(UPSELL.whatsappMessage)}`;

  const openChannel = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-neon-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-neon-500/20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-neon-500" />
          Hub de Tráfego Pago & CRM
        </h2>
        <p className="text-sm text-gray-400 mt-1">Conectores multicanal, lançador de anúncios locais e gestão de leads</p>
      </div>

      {/* Upsell Banner */}
      <div className="card p-5 bg-gradient-to-r from-neon-500/10 to-dark-800 border-neon-500/30 animate-pulse-glow">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[260px]">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-neon-500" />
              Assessoria VIP ROI Shape
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Quer a equipe da ROI Shape rodando seus anúncios locais e colocando novos alunos no seu WhatsApp? Contrate a Assessoria VIP por{' '}
              <span className="text-neon-400 font-bold">R$ 297,00</span> (Taxa Única)!
            </p>
          </div>
          <a href={upsellWhatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
            <MessageCircle className="w-4 h-4" />
            Contratar R$ 297
          </a>
        </div>
      </div>

      {/* Traffic channels */}
      <div>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-neon-500" />
          Conectores de Tráfego
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TRAFFIC_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <button key={ch.name} onClick={() => openChannel(ch.url)} className="card card-hover p-4 block group text-left w-full">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 ${ch.color}`} />
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-neon-500 transition-colors" />
                </div>
                <p className="font-semibold text-white text-sm">{ch.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Local Ad Launcher */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-neon-500" />
          Lançador de Anúncios Locais
        </h3>
        <p className="text-sm text-gray-400 mb-4">Defina o raio de alcance das suas campanhas em torno da sua academia</p>
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="flex-1 min-w-[200px] accent-neon-500"
          />
          <span className="badge badge-neon">{radius} km de raio</span>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TRAFFIC_CHANNELS.slice(0, 3).map((ch) => {
            const Icon = ch.icon;
            return (
              <button key={ch.name} onClick={() => openChannel(ch.url)} className="btn-secondary flex items-center justify-center gap-2 text-sm">
                <Icon className={`w-4 h-4 ${ch.color}`} />
                Lançar em {ch.name}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Prompts Studio */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neon-500" />
            Studio de Prompts de IA
          </h3>
          <button onClick={() => setShowPrompts(!showPrompts)} className="btn-ghost text-sm">
            {showPrompts ? 'Ocultar' : 'Ver prompts'}
          </button>
        </div>
        {showPrompts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
            {AI_PROMPTS.map((p) => (
              <div key={p.title} className="bg-dark-900 rounded-xl p-3 border border-dark-600">
                <p className="font-semibold text-neon-400 text-sm mb-1">{p.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{p.prompt}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(p.prompt)}
                  className="btn-ghost text-xs mt-2 px-2 py-1"
                >
                  Copiar prompt
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRM Kanban */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-500" />
            Mini-CRM — Leads do WhatsApp
          </h3>
          <button onClick={() => setShowAddLead(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KANBAN_COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.key);
            return (
              <div key={col.key} className={`card p-3 border-t-2 ${col.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{col.label}</p>
                  <span className="badge bg-dark-700 text-gray-400 text-[10px]">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map((lead) => (
                    <div key={lead.id} className="bg-dark-900 rounded-xl p-3 border border-dark-600 group">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-white">{lead.name}</p>
                        <button onClick={() => deleteLead(lead.id)} className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-400 flex items-center gap-1 mt-1 hover:underline">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                      <span className="text-[10px] text-gray-500 mt-1 block">Origem: {lead.source}</span>
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                        className="w-full mt-2 bg-dark-800 border border-dark-600 rounded-lg px-2 py-1 text-xs text-gray-300"
                      >
                        {KANBAN_COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {colLeads.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Vazio</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Objection scripts */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Filter className="w-5 h-5 text-neon-500" />
          Scripts de Quebra de Objeções
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OBJECTION_SCRIPTS.map((s) => (
            <div key={s.objection} className="bg-dark-900 rounded-xl p-3 border border-dark-600">
              <p className="text-sm font-semibold text-orange-400 mb-1">"{s.objection}"</p>
              <p className="text-xs text-gray-400 leading-relaxed">{s.script}</p>
            </div>
          ))}
        </div>
      </div>

      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onAdd={addLead} />}
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, phone: string, source: string) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('whatsapp');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Novo Lead</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field py-2 text-sm" placeholder="Nome do lead" autoFocus />
          </div>
          <div>
            <label className="text-xs text-gray-500">Telefone / WhatsApp</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field py-2 text-sm" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Origem</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field py-2 text-sm">
              <option value="whatsapp">WhatsApp</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="tiktok_ads">TikTok Ads</option>
              <option value="youtube">YouTube</option>
              <option value="organic">Orgânico</option>
              <option value="referral">Indicação</option>
            </select>
          </div>
          <button onClick={() => onAdd(name, phone, source)} className="btn-primary w-full">Adicionar Lead</button>
        </div>
      </div>
    </div>
  );
}
