// ============================================================
// CONFIGURAÇÃO DO PORTAL — Edite aqui para cada cliente
// ============================================================
const CONFIG = {
  // --- MARCA ---
  company: 'Distribuidora Exemplo',
  portalName: 'Portal de Compras',
  logo: '',
  logoText: 'Distribuidora<span>Exemplo</span>',
  favicon: '',

  // --- CORES (CSS variables) ---
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    secondary: '#059669',
    secondaryLight: '#ecfdf5',
    headerBg: '#0f172a',
    headerBg2: '#1e293b',
  },

  // --- CONTATO ---
  contact: {
    phone: '(11) 0000-0000',
    whatsapp: '5511900000000',
    email: 'comercial@distribuidora.com',
    address: 'Rua Exemplo, 123 — São Paulo/SP',
    hours: 'Seg a Sex: 8:00 às 18:00',
  },

  // --- FRETE ---
  shipping: {
    freeAbove: 500,
    defaultCost: 29.90,
    estimateDays: 3,
  },

  // --- PAGAMENTO ---
  payments: [
    { id: 'boleto', label: 'Boleto Bancário', discount: 0 },
    { id: 'pix', label: 'PIX', discount: 5 },
    { id: 'prazo', label: 'Faturado 30 dias', discount: 0 },
  ],

  // --- BANNER PROMO ---
  promoBanner: {
    enabled: true,
    text: '🚚 Frete grátis em pedidos acima de R$ 500',
    link: '#',
    linkText: 'Confira as condições',
  },

  // --- FOOTER ---
  footer: {
    description: 'Portal de compras online para revendedores e atacadistas. Faça seus pedidos 24h, acompanhe entregas e gerencie sua conta.',
    cnpj: '00.000.000/0001-00',
  },

  // --- FEATURES ---
  features: {
    minOrderEnabled: true,
    stockDisplay: true,
    boxPriceDisplay: true,
    reorderEnabled: true,
    cancelEnabled: true,
  },
};

// Aplica cores customizadas no CSS
function applyConfig() {
  const root = document.documentElement;
  if (CONFIG.colors.primary) root.style.setProperty('--accent', CONFIG.colors.primary);
  if (CONFIG.colors.primaryHover) root.style.setProperty('--accent-hover', CONFIG.colors.primaryHover);
  if (CONFIG.colors.primaryLight) root.style.setProperty('--accent-light', CONFIG.colors.primaryLight);
  if (CONFIG.colors.secondary) root.style.setProperty('--accent-2', CONFIG.colors.secondary);
  if (CONFIG.colors.secondaryLight) root.style.setProperty('--accent-2-light', CONFIG.colors.secondaryLight);
  if (CONFIG.colors.headerBg) root.style.setProperty('--bg-header', CONFIG.colors.headerBg);
  if (CONFIG.colors.headerBg2) root.style.setProperty('--bg-header-2', CONFIG.colors.headerBg2);

  document.title = `${CONFIG.portalName} — ${CONFIG.company}`;

  // Carrega config salva no localStorage (do admin)
  const saved = localStorage.getItem('db2b_config');
  if (saved) {
    const s = JSON.parse(saved);
    Object.assign(CONFIG, s);
    if (s.colors) {
      Object.entries(s.colors).forEach(([k, v]) => {
        if (v) CONFIG.colors[k] = v;
      });
      if (s.colors.primary) root.style.setProperty('--accent', s.colors.primary);
      if (s.colors.primaryHover) root.style.setProperty('--accent-hover', s.colors.primaryHover);
      if (s.colors.primaryLight) root.style.setProperty('--accent-light', s.colors.primaryLight);
      if (s.colors.secondary) root.style.setProperty('--accent-2', s.colors.secondary);
      if (s.colors.headerBg) root.style.setProperty('--bg-header', s.colors.headerBg);
      if (s.colors.headerBg2) root.style.setProperty('--bg-header-2', s.colors.headerBg2);
    }
    document.title = `${CONFIG.portalName} — ${CONFIG.company}`;
  }
}

applyConfig();
