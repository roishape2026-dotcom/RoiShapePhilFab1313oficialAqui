export const BRAND = {
  name: 'Fullbody ROI Shape',
  tagline: 'O Método de Elite para Personais & Alunos',
  site: 'https://www.roishape.com.br',
  instagram: 'https://instagram.com/roishape.tech',
  instagramHandle: '@roishape.tech',
  supportEmail: 'contato@roishape.com.br',
  masterEmail: 'roishape2026@gmail.com',
  youtubeChannelName: 'ROI SHAPE',
  youtubeChannelUrl: 'https://www.youtube.com/@ROISHAPE',
  pixKey: 'roishape2026@gmail.com',
  whatsapp1: '5511973938020',
  whatsapp2: '5511983297903',
  whatsapp1Name: 'Phillip Sarraff',
  whatsapp2Name: 'Fábio Carvalho',
  launchDate: '04 de Outubro de 2026',
};

export const PARTNERS = [
  {
    name: 'Fábio Carvalho',
    email: 'fcassessoria13@gmail.com',
    role: 'Estratégia Digital & Marketing',
    whatsapp: '5511983297903',
  },
  {
    name: 'Phillip Sarraff',
    email: 'roishape2026@gmail.com',
    role: 'Responsável Técnico CREF',
    whatsapp: '5511973938020',
  },
];

export const ADMIN_EMAILS = [
  'roishape2026@gmail.com',
  'contato@roishape.com.br',
];

export const PLANS = {
  free: {
    name: 'Plano Aluno / FIT',
    price: 0,
    description: 'R$ 0,00 — Gratuito Vitalício',
    features: [
      'Visualização de Fichas de Treino Diárias (Método Fullbody ROI Shape)',
      'Marcadores Interativos de Cargas e Séries Concluídas',
      'Vídeos de Execução no YouTube ao lado de cada exercício',
      'Módulo de Biomecânica & Mapeamento de Ativação Muscular',
      'Avaliação de Bioimpedância Omron HBF-514C com Gráficos de Evolução',
      'Selo de Validação ROI Shape para Stories do Instagram',
    ],
  },
  starter: {
    name: 'Personal Starter — Lote de Fundadores',
    price: 47.9,
    asaasLink: 'https://www.asaas.com/c/jl6n45u9cursfgc9',
    infinitePayLink: 'https://checkout.infinitepay.io/roishape-4790',
    description: 'R$ 47,90 / mês',
    trialDays: 10,
    features: [
      'Prescrição e Montagem de Treinos no Método Fullbody ROI Shape',
      'Gestão Completa e Ilimitada de Carteira de Alunos',
      'Avaliação Física & Bioimpedância Omron HBF-514C com Selo para Instagram',
      'Módulo de Biomecânica & Anatomia Muscular',
    ],
  },
  pro: {
    name: 'Personal Pro + IA — Lote de Fundadores',
    price: 97.0,
    asaasLink: 'https://www.asaas.com/c/3f7daow0s845zt7z',
    infinitePayLink: 'https://checkout.infinitepay.io/roishape-9700',
    description: 'R$ 97,00 / mês',
    popular: true,
    trialDays: 10,
    features: [
      'TUDO do Plano Starter +',
      'Gerador de Treinos com Inteligência Artificial Integrada',
      'Studio de Prompts de IA Prontos para Personais',
      'Central de Tráfego Pago & Lançador de Anúncios Locais (Meta, Google, TikTok, YouTube)',
      'Banner de Upsell de Estrutura de Vendas por R$ 297,00',
      'Mini-CRM Kanban de Vendas com Scripts de WhatsApp',
    ],
  },
};

export const UPSELL = {
  price: 297.0,
  description: 'Estrutura Profissional de Anúncios + Página de Vendas Pronta',
  whatsappMessage: 'Olá! Quero contratar a estruturação do meu ecossistema de anúncios e página de vendas por R$ 297,00.',
};

export const TRIAL = {
  days: 10,
  label: '10 Dias Grátis de Degustação',
  afterTrialPrice: 47.9,
  afterTrialLabel: 'R$ 47,90/mês a partir do 11º dia',
};

export const FUNDADOR = {
  label: 'Lote de Fundadores — Pague 1 Mês e Ganhe +1 Mês Grátis (BOGO)',
  starterPrice: 47.9,
  proFounderPrice: 67.9,
  proRegularPrice: 97.0,
  originalMonthly: 47.9,
  originalQuarterly: 97.0,
  refParam: 'fundador',
};

export const FREE_STUDENT_LIMIT = 1;

export type ViewMode = 'personal' | 'student';
export type TabKey =
  | 'workouts' | 'students' | 'profile' | 'bioimpedance' | 'nutrition'
  | 'biomechanics' | 'marketing' | 'traffic' | 'pricing'
  | 'admin' | 'ai-studio' | 'support';
