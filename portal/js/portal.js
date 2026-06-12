// Portal core logic — B2B E-commerce
const PRICE_TABLES = {
  standard: { label: 'Padrão', multiplier: 1.0 },
  vip: { label: 'VIP', multiplier: 0.92 },
  atacado: { label: 'Atacado', multiplier: 0.85 },
};

const Portal = {
  // ===== AUTH =====
  getUser() {
    const u = localStorage.getItem('db2b_user');
    return u ? JSON.parse(u) : null;
  },

  login(email, password) {
    let user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      const approved = JSON.parse(localStorage.getItem('db2b_approved_users') || '[]');
      user = approved.find(u => u.email === email && u.password === password);
    }
    if (!user) return null;
    localStorage.setItem('db2b_user', JSON.stringify(user));
    return user;
  },

  getApprovedUsers() {
    return JSON.parse(localStorage.getItem('db2b_approved_users') || '[]');
  },

  getPriceForUser(basePrice, user) {
    if (!user) return basePrice;
    const table = PRICE_TABLES[user.priceTable || 'standard'] || PRICE_TABLES.standard;
    return +(basePrice * table.multiplier).toFixed(2);
  },

  logout() {
    localStorage.removeItem('db2b_user');
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!this.getUser()) {
      window.location.href = 'login.html';
      return null;
    }
    return this.getUser();
  },

  requireAuthForAction() {
    if (!this.getUser()) {
      this.toast('Faca login para continuar', 'error');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return false;
    }
    return true;
  },

  // ===== CART =====
  getCart() {
    const c = localStorage.getItem('db2b_cart');
    return c ? JSON.parse(c) : [];
  },

  saveCart(cart) {
    localStorage.setItem('db2b_cart', JSON.stringify(cart));
    this.updateCartBadge();
  },

  addToCart(productId, qty) {
    if (!this.requireAuthForAction()) return;
    const cart = this.getCart();
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const actualQty = Math.max(qty, product.minOrder);
    const existing = cart.find(item => item.productId === productId);

    if (existing) {
      existing.qty += actualQty;
    } else {
      cart.push({ productId, qty: actualQty });
    }

    this.saveCart(cart);
    this.toast(`${product.name} adicionado ao carrinho`, 'success');

    // P0: Add-to-cart success animation
    // Find the button that triggered — look for the product card's add-cart-btn
    const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (productCard) {
      const btn = productCard.querySelector('.add-cart-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Adicionado!';
        btn.classList.add('success');
        setTimeout(() => {
          btn.textContent = '✓ No carrinho';
          btn.classList.remove('success');
          btn.classList.add('added');
        }, 1500);
      }
    }
    // Also check pcard-btn (home page featured products)
    // handled by event caller context

    // Cart badge bump animation
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(b => {
      b.classList.remove('bump');
      void b.offsetWidth; // force reflow to restart animation
      b.classList.add('bump');
    });
  },

  updateCartItem(productId, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) {
      if (qty <= 0) { this.removeFromCart(productId); return; }
      item.qty = qty;
      this.saveCart(cart);
    }
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(i => i.productId !== productId);
    this.saveCart(cart);
  },

  getCartTotal() {
    const user = this.getUser();
    return this.getCart().reduce((sum, item) => {
      const p = PRODUCTS.find(pr => pr.id === item.productId);
      if (!p) return sum;
      const price = this.getPriceForUser(p.price, user);
      return sum + (price * item.qty);
    }, 0);
  },

  getCartCount() {
    return this.getCart().length;
  },

  clearCart() {
    localStorage.removeItem('db2b_cart');
    this.updateCartBadge();
  },

  updateCartBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const count = this.getCart().length;
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  // ===== ORDERS =====
  getOrders() {
    const o = localStorage.getItem('db2b_orders');
    return o ? JSON.parse(o) : [...MOCK_ORDERS];
  },

  saveOrders(orders) {
    localStorage.setItem('db2b_orders', JSON.stringify(orders));
  },

  placeOrder(payment) {
    const cart = this.getCart();
    if (cart.length === 0) return null;

    const orders = this.getOrders();
    const maxId = orders.reduce((max, o) => Math.max(max, o.id), 4870);

    const order = {
      id: maxId + 1,
      date: new Date().toISOString(),
      status: 'pending',
      items: [...cart],
      total: this.getCartTotal(),
      payment: payment || 'boleto',
      deliveryDate: this.addDays(new Date(), 3).toISOString().split('T')[0],
    };

    orders.unshift(order);
    this.saveOrders(orders);
    this.clearCart();
    return order;
  },

  reorder(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(item => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      if (product) this.addToCart(item.productId, item.qty);
    });
  },

  // ===== UI HELPERS =====
  toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icon}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  formatCurrency(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  getStatusInfo(statusId) {
    return ORDER_STATUSES.find(s => s.id === statusId) || ORDER_STATUSES[0];
  },

  getCategoryIcon(categoryId) {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.icon : '📦';
  },

  getCategoryName(categoryId) {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  },

  getStockLabel(stock) {
    if (stock > 100) return { text: `Em estoque`, cls: 'in-stock' };
    if (stock > 0) return { text: `Últimas ${stock} un`, cls: 'low-stock' };
    return { text: 'Indisponível', cls: 'no-stock' };
  },

  // ===== STORE HEADER =====
  renderStoreHeader(activeCat) {
    const user = this.getUser();
    const header = document.getElementById('storeHeader');
    if (!header) return;

    const logoHtml = (typeof CONFIG !== 'undefined' && CONFIG.logoText) ? CONFIG.logoText : 'Digital<span>B2B</span>';
    const promoEnabled = typeof CONFIG !== 'undefined' && CONFIG.promoBanner?.enabled !== false;
    const promoText = (typeof CONFIG !== 'undefined' && CONFIG.promoBanner?.text) || '';
    const promoLinkText = (typeof CONFIG !== 'undefined' && CONFIG.promoBanner?.linkText) || '';

    const existingPromo = document.querySelector('.promo-banner');
    if (existingPromo && !promoEnabled) existingPromo.style.display = 'none';
    if (existingPromo && promoEnabled && promoText) {
      existingPromo.innerHTML = `${promoText} <a href="#">${promoLinkText}</a>`;
    }

    let actionsHtml;
    if (user) {
      const roleLabel = user.type === 'admin' ? 'Admin' : user.type === 'rep' ? 'Representante' : 'Cliente';
      const adminLink = user.type === 'admin' ? '<a href="dashboard.html" class="header-action" style="color:#f59e0b"><span class="lc lc-lg"><i data-lucide="settings"></i></span>Painel</a>' : '';
      actionsHtml = `
        ${adminLink}
        <a href="pedidos.html" class="header-action"><span class="lc lc-lg"><i data-lucide="clipboard-list"></i></span>Pedidos</a>
        <a href="carrinho.html" class="header-action">
          <span class="lc lc-lg"><i data-lucide="shopping-cart"></i></span>Carrinho
          <span class="count cart-count" style="display:none">0</span>
        </a>
        <div class="header-user-info">
          <div>
            <div class="name">${user.name.split(' ').slice(0, 2).join(' ')} <span class="badge-tier ${user.priceTable || 'standard'}">${PRICE_TABLES[user.priceTable || 'standard'].label}</span></div>
            <div class="role">${roleLabel}</div>
          </div>
        </div>
        <button class="header-action" onclick="Portal.logout()"><span class="lc lc-lg"><i data-lucide="log-out"></i></span>Sair</button>
      `;
    } else {
      actionsHtml = `
        <a href="carrinho.html" class="header-action">
          <span class="lc lc-lg"><i data-lucide="shopping-cart"></i></span>Carrinho
          <span class="count cart-count" style="display:none">0</span>
        </a>
        <a href="login.html" class="header-action" style="color:#3b82f6"><span class="lc lc-lg"><i data-lucide="user"></i></span>Entrar</a>
        <a href="register.html" class="header-action" style="color:#059669"><span class="lc lc-lg"><i data-lucide="user-plus"></i></span>Cadastrar</a>
      `;
    }

    header.innerHTML = `
      <div class="header-top">
        <button class="mobile-toggle" onclick="document.querySelector('.category-nav').classList.toggle('mobile-open')">☰</button>
        <a href="index.html" class="header-logo">${logoHtml}</a>
        <div class="header-search">
          <input type="text" placeholder="Buscar produtos, marcas, códigos..." id="globalSearch">
          <button onclick="doSearch()"><i data-lucide="search" style="width:18px;height:18px;"></i></button>
        </div>
        <div class="header-actions">${actionsHtml}</div>
      </div>
      <nav class="category-nav">
        <div class="category-nav-inner">
          <a href="catalogo.html" class="cat-link ${!activeCat || activeCat === 'all' ? 'active' : ''}">
            <span class="icon">📋</span>Todos
          </a>
          ${CATEGORIES.map(c => `
            <a href="catalogo.html?cat=${c.id}" class="cat-link ${activeCat === c.id ? 'active' : ''}">
              <span class="icon">${c.icon}</span>${c.name}
            </a>
          `).join('')}
        </div>
      </nav>
    `;

    // P1: Social proof bar — add before header
    const existingProof = document.querySelector('.social-proof-bar');
    if (!existingProof) {
      const proofBar = document.createElement('div');
      proofBar.className = 'social-proof-bar';
      proofBar.innerHTML = `
        <span><strong>2.500+</strong> lojistas ativos</span>
        <span>&middot;</span>
        <span><strong>48.000+</strong> pedidos entregues</span>
        <span>&middot;</span>
        <span><strong>4.8/5</strong> avaliação</span>
      `;
      const headerEl = document.getElementById('storeHeader');
      if (headerEl) headerEl.parentElement.insertBefore(proofBar, headerEl);
    }

    this.updateCartBadge();
    refreshIcons();
  },

  // ===== STORE FOOTER =====
  renderStoreFooter() {
    const footer = document.getElementById('storeFooter');
    if (!footer) return;

    const footerLogo = (typeof CONFIG !== 'undefined' && CONFIG.logoText) ? CONFIG.logoText : 'Digital<span>B2B</span>';
    const footerDesc = (typeof CONFIG !== 'undefined' && CONFIG.footer?.description) || 'Portal de compras online para revendedores e atacadistas.';
    const contactPhone = (typeof CONFIG !== 'undefined' && CONFIG.contact?.phone) || '(11) 0000-0000';
    const contactEmail = (typeof CONFIG !== 'undefined' && CONFIG.contact?.email) || 'comercial@distribuidora.com';
    const contactHours = (typeof CONFIG !== 'undefined' && CONFIG.contact?.hours) || 'Seg a Sex: 8:00 às 18:00';

    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="logo">${footerLogo}</div>
            <p>${footerDesc}</p>
          </div>
          <div>
            <h4>Portal</h4>
            <ul class="footer-links">
              <li><a href="catalogo.html">Catálogo</a></li>
              <li><a href="carrinho.html">Carrinho</a></li>
              <li><a href="pedidos.html">Meus Pedidos</a></li>
            </ul>
          </div>
          <div>
            <h4>Suporte</h4>
            <ul class="footer-links">
              <li><a href="#">Central de Ajuda</a></li>
              <li><a href="#">WhatsApp</a></li>
              <li><a href="#">${contactPhone}</a></li>
            </ul>
          </div>
          <div>
            <h4>Atendimento</h4>
            <ul class="footer-links">
              <li>${contactHours}</li>
              <li>${contactEmail}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; 2026 ${(typeof CONFIG !== 'undefined' && CONFIG.company) ? CONFIG.company : 'DigitalB2B'} — Portal de Compras. Todos os direitos reservados.
          <div style="margin-top:6px; font-size:0.68rem; color:#475569;">Powered by <a href="https://digitalb2b.com.br" target="_blank" rel="noopener" style="color:#3b82f6; font-weight:600;">DigitalB2B</a></div>
        </div>
      </div>
    `;

    // P1: WhatsApp floating button (disabled for now)
    if (false && !document.querySelector('.whatsapp-float')) {
      const waPhone = (typeof CONFIG !== 'undefined' && CONFIG.contact?.whatsapp) || '5571900000000';
      const wa = document.createElement('a');
      wa.className = 'whatsapp-float pulse';
      wa.href = `https://wa.me/${waPhone}?text=Olá! Vim do portal e gostaria de mais informações.`;
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.innerHTML = '<svg viewBox="0 0 24 24" fill="#ffffff"><path fill="#ffffff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
      document.body.appendChild(wa);
    }
  },
};

function doSearch() {
  const input = document.getElementById('globalSearch');
  if (input && input.value.trim()) {
    window.location.href = `catalogo.html?q=${encodeURIComponent(input.value.trim())}`;
  }
}

function refreshIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}
