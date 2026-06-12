// ============================================================
// SiteKit — UI Helpers
// Toast, modal, formatters, search, tab navigation
// ============================================================

const SK = window.SK || {};

// ===== TOAST =====
SK.toast = function(message, type = 'success') {
  let container = document.querySelector('.sk-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'sk-toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `sk-toast sk-toast-${type}`;
  toast.textContent = (type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : 'ℹ ') + message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// ===== MODAL =====
SK.openModal = function(id) {
  document.getElementById(id)?.classList.add('open');
};

SK.closeModal = function(id) {
  document.getElementById(id)?.classList.remove('open');
};

SK.initModals = function() {
  document.querySelectorAll('.sk-modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('open');
    });
  });
};

// ===== FORMATTERS =====
SK.formatCurrency = function(value) {
  return 'R$ ' + (value || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

SK.formatDate = function(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

SK.formatDateTime = function(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR');
};

SK.formatPhone = function(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits[2]} ${digits.slice(3,7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return phone;
};

SK.formatCNPJ = function(cnpj) {
  if (!cnpj) return '';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

// ===== SLUG =====
SK.slugify = function(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
};

// ===== TAB NAVIGATION =====
SK.initTabs = function(options = {}) {
  const { sidebarSelector = '.sk-sidebar a', pagePrefix = 'page-' } = options;
  const links = document.querySelectorAll(sidebarSelector);

  links.forEach(link => {
    const page = link.dataset.page;
    if (!page) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll(`[id^="${pagePrefix}"]`).forEach(p => p.classList.remove('active'));
      document.getElementById(`${pagePrefix}${page}`)?.classList.add('active');
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
};

// ===== NAVBAR SCROLL =====
SK.initNavScroll = function(selector = '.sk-nav') {
  const nav = document.querySelector(selector);
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
};

// ===== CONFIRM =====
SK.confirm = function(message) {
  return window.confirm(message);
};

// ===== DEBOUNCE =====
SK.debounce = function(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// ===== CSV PARSER =====
SK.parseCSV = function(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const cols = line.split(/[,;]/).map(c => c.trim().replace(/['"]/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i] || ''; });
    return row;
  }).filter(r => Object.values(r).some(v => v));
};

// ===== INIT =====
SK.init = function() {
  SK.initModals();
  SK.initNavScroll();
  document.addEventListener('DOMContentLoaded', () => {
    SK.initModals();
  });
};

window.SK = SK;
