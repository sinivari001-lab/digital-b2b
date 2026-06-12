// ============================================================
// DigitalB2B — Supabase Client + Data Adapter
// Works in 2 modes:
//   LIVE: Connected to Supabase (production)
//   DEMO: Falls back to localStorage + mock data (sales demo)
// ============================================================

const DB2B_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  tenantSlug: '',
};

// Load config from meta tags or localStorage
(function loadSupabaseConfig() {
  const meta = document.querySelector('meta[name="db2b-supabase-url"]');
  const key = document.querySelector('meta[name="db2b-supabase-key"]');
  const slug = document.querySelector('meta[name="db2b-tenant"]');

  if (meta) DB2B_CONFIG.supabaseUrl = meta.content;
  if (key) DB2B_CONFIG.supabaseAnonKey = key.content;
  if (slug) DB2B_CONFIG.tenantSlug = slug.content;

  // Override from localStorage (set by admin)
  const saved = localStorage.getItem('db2b_supabase');
  if (saved) {
    const s = JSON.parse(saved);
    if (s.url) DB2B_CONFIG.supabaseUrl = s.url;
    if (s.key) DB2B_CONFIG.supabaseAnonKey = s.key;
    if (s.slug) DB2B_CONFIG.tenantSlug = s.slug;
  }

  // Detect tenant from subdomain: acme.digitalb2b.com.br → acme
  if (!DB2B_CONFIG.tenantSlug) {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      DB2B_CONFIG.tenantSlug = parts[0];
    }
  }
})();

const isLive = () => DB2B_CONFIG.supabaseUrl && DB2B_CONFIG.supabaseAnonKey;

// ===== SUPABASE CLIENT (lazy loaded via CDN) =====
let _supabase = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  if (!isLive()) return null;

  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  _supabase = window.supabase.createClient(DB2B_CONFIG.supabaseUrl, DB2B_CONFIG.supabaseAnonKey);
  return _supabase;
}

// ===== DATA ADAPTER (unified interface for both modes) =====
const DataStore = {

  // ----- TENANT -----
  async getTenant(slug) {
    if (!isLive()) return null;
    const sb = await getSupabase();
    const { data } = await sb.from('tenants').select('*').eq('slug', slug || DB2B_CONFIG.tenantSlug).single();
    return data;
  },

  async updateTenantConfig(config) {
    if (!isLive()) {
      localStorage.setItem('db2b_config', JSON.stringify(config));
      return { ok: true };
    }
    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (!tenant) return { error: 'Tenant not found' };
    const { error } = await sb.from('tenants').update({ config, updated_at: new Date().toISOString() }).eq('id', tenant.id);
    return error ? { error: error.message } : { ok: true };
  },

  // ----- CATEGORIES -----
  async getCategories() {
    if (!isLive()) return typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];
    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (!tenant) return [];
    const { data } = await sb.from('categories').select('*').eq('tenant_id', tenant.id).eq('active', true).order('sort_order');
    return (data || []).map(c => ({ id: c.id, name: c.name, icon: c.icon }));
  },

  async saveCategory(cat) {
    if (!isLive()) return cat;
    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (cat.id) {
      const { data } = await sb.from('categories').update({ name: cat.name, icon: cat.icon, sort_order: cat.sort_order }).eq('id', cat.id).select().single();
      return data;
    }
    const { data } = await sb.from('categories').insert({ ...cat, tenant_id: tenant.id }).select().single();
    return data;
  },

  async deleteCategory(id) {
    if (!isLive()) return;
    const sb = await getSupabase();
    await sb.from('categories').update({ active: false }).eq('id', id);
  },

  // ----- PRODUCTS -----
  async getProducts(filters = {}) {
    if (!isLive()) {
      let products = typeof PRODUCTS !== 'undefined' ? [...PRODUCTS] : [];
      if (filters.category) products = products.filter(p => p.category === filters.category);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      }
      return products;
    }

    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (!tenant) return [];

    let query = sb.from('products').select('*, categories(name, icon)').eq('tenant_id', tenant.id).eq('active', true);

    if (filters.category) query = query.eq('category_id', filters.category);
    if (filters.search) query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);

    query = query.order('name');
    const { data } = await query;

    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category_id,
      categoryName: p.categories?.name,
      categoryIcon: p.categories?.icon || '📦',
      price: parseFloat(p.price),
      priceBox: p.price_box ? parseFloat(p.price_box) : null,
      unit: p.unit,
      boxQty: p.box_qty,
      minOrder: p.min_order,
      stock: p.stock,
      sku: p.sku,
      barcode: p.barcode,
      imageUrl: p.image_url,
    }));
  },

  async getProduct(id) {
    if (!isLive()) {
      return typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(p => p.id === id) : null;
    }
    const sb = await getSupabase();
    const { data } = await sb.from('products').select('*, categories(name, icon)').eq('id', id).single();
    return data;
  },

  async saveProduct(product) {
    if (!isLive()) return product;
    const sb = await getSupabase();
    const tenant = await this.getTenant();

    const row = {
      tenant_id: tenant.id,
      category_id: product.category_id || null,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: product.price,
      price_box: product.price_box,
      unit: product.unit || 'un',
      box_qty: product.box_qty || 1,
      min_order: product.min_order || 1,
      stock: product.stock || 0,
      image_url: product.image_url,
      active: product.active !== false,
    };

    if (product.id) {
      const { data, error } = await sb.from('products').update(row).eq('id', product.id).select().single();
      return error ? { error: error.message } : data;
    }
    const { data, error } = await sb.from('products').insert(row).select().single();
    return error ? { error: error.message } : data;
  },

  async deleteProduct(id) {
    if (!isLive()) return;
    const sb = await getSupabase();
    await sb.from('products').update({ active: false }).eq('id', id);
  },

  async importProducts(csvRows) {
    if (!isLive()) return { imported: 0 };
    const sb = await getSupabase();
    const tenant = await this.getTenant();

    const rows = csvRows.map(r => ({
      tenant_id: tenant.id,
      sku: r.sku,
      barcode: r.barcode,
      name: r.name,
      brand: r.brand,
      price: parseFloat(r.price),
      price_box: r.price_box ? parseFloat(r.price_box) : null,
      unit: r.unit || 'un',
      box_qty: parseInt(r.box_qty) || 1,
      min_order: parseInt(r.min_order) || 1,
      stock: parseInt(r.stock) || 0,
    }));

    const { data, error } = await sb.from('products').insert(rows).select();
    return error ? { error: error.message } : { imported: data.length };
  },

  // ----- PORTAL USERS (lojistas) -----
  async getPortalUsers() {
    if (!isLive()) return typeof MOCK_USERS !== 'undefined' ? MOCK_USERS : [];
    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (!tenant) return [];
    const { data } = await sb.from('portal_users').select('*').eq('tenant_id', tenant.id).eq('active', true).order('name');
    return data || [];
  },

  async portalLogin(email, password) {
    if (!isLive()) {
      const user = typeof MOCK_USERS !== 'undefined' ? MOCK_USERS.find(u => u.email === email && u.password === password) : null;
      return user || { error: 'Credenciais inválidas' };
    }
    const sb = await getSupabase();
    const { data, error } = await sb.rpc('portal_login', {
      p_tenant_slug: DB2B_CONFIG.tenantSlug,
      p_email: email,
      p_password: password,
    });
    if (error) return { error: error.message };
    return data;
  },

  // ----- ORDERS -----
  async getOrders(portalUserId) {
    if (!isLive()) {
      const saved = localStorage.getItem('db2b_orders');
      return saved ? JSON.parse(saved) : (typeof MOCK_ORDERS !== 'undefined' ? [...MOCK_ORDERS] : []);
    }
    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (!tenant) return [];

    let query = sb.from('orders').select('*, order_items(*)').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    if (portalUserId) query = query.eq('portal_user_id', portalUserId);

    const { data } = await query;
    return data || [];
  },

  async createOrder(order) {
    if (!isLive()) {
      const orders = this.getOrders();
      const saved = localStorage.getItem('db2b_orders');
      const existing = saved ? JSON.parse(saved) : (typeof MOCK_ORDERS !== 'undefined' ? [...MOCK_ORDERS] : []);
      existing.unshift(order);
      localStorage.setItem('db2b_orders', JSON.stringify(existing));
      return order;
    }

    const sb = await getSupabase();
    const tenant = await this.getTenant();

    const { data: orderData, error: orderError } = await sb.from('orders').insert({
      tenant_id: tenant.id,
      portal_user_id: order.portal_user_id,
      status: 'pending',
      payment_method: order.payment,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount || 0,
      total: order.total,
      notes: order.notes,
      delivery_date: order.delivery_date,
    }).select().single();

    if (orderError) return { error: orderError.message };

    const items = order.items.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    await sb.from('order_items').insert(items);
    return orderData;
  },

  async updateOrderStatus(orderId, status) {
    if (!isLive()) return;
    const sb = await getSupabase();
    await sb.from('orders').update({ status }).eq('id', orderId);
  },

  // ----- STATS -----
  async getDashboardStats() {
    if (!isLive()) {
      const orders = typeof MOCK_ORDERS !== 'undefined' ? MOCK_ORDERS : [];
      return {
        totalProducts: typeof PRODUCTS !== 'undefined' ? PRODUCTS.length : 0,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + o.total, 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
      };
    }
    const sb = await getSupabase();
    const tenant = await this.getTenant();
    if (!tenant) return {};

    const [products, orders] = await Promise.all([
      sb.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('active', true),
      sb.from('orders').select('*').eq('tenant_id', tenant.id),
    ]);

    const orderList = orders.data || [];
    return {
      totalProducts: products.count || 0,
      totalOrders: orderList.length,
      totalRevenue: orderList.reduce((s, o) => s + parseFloat(o.total || 0), 0),
      pendingOrders: orderList.filter(o => o.status === 'pending').length,
    };
  },

  // ----- ADMIN AUTH (Supabase Auth for tenant owners) -----
  async adminLogin(email, password) {
    if (!isLive()) {
      if (email === 'admin@distribuidora.com' && password === '123456') {
        localStorage.setItem('db2b_admin', JSON.stringify({ email, role: 'owner', name: 'Admin' }));
        return { ok: true };
      }
      return { error: 'Credenciais inválidas' };
    }
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const { data: member } = await sb.from('tenant_members').select('*, tenants(*)').eq('auth_id', data.user.id).single();
    if (!member) return { error: 'Usuário não vinculado a nenhuma distribuidora' };

    DB2B_CONFIG.tenantSlug = member.tenants.slug;
    return { ok: true, tenant: member.tenants, role: member.role };
  },

  async adminLogout() {
    if (isLive()) {
      const sb = await getSupabase();
      await sb.auth.signOut();
    }
    localStorage.removeItem('db2b_admin');
    window.location.href = 'login.html';
  },

  async getAdminUser() {
    if (!isLive()) {
      const saved = localStorage.getItem('db2b_admin');
      return saved ? JSON.parse(saved) : null;
    }
    const sb = await getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const { data: member } = await sb.from('tenant_members').select('*, tenants(*)').eq('auth_id', user.id).single();
    return member;
  },

  // ----- SIGNUP (new tenant) -----
  async signup(tenantData) {
    if (!isLive()) return { error: 'Supabase não configurado' };

    const sb = await getSupabase();

    // 1. Create auth user
    const { data: authData, error: authError } = await sb.auth.signUp({
      email: tenantData.email,
      password: tenantData.password,
    });
    if (authError) return { error: authError.message };

    // 2. Create tenant
    const { data: tenant, error: tenantError } = await sb.from('tenants').insert({
      slug: tenantData.slug,
      name: tenantData.company,
      cnpj: tenantData.cnpj,
      plan: 'self-service',
      config: {
        colors: { primary: '#2563eb', primaryHover: '#1d4ed8', secondary: '#059669', headerBg: '#0f172a' },
        contact: { phone: tenantData.phone, email: tenantData.email },
        shipping: { freeAbove: 500, defaultCost: 29.90, estimateDays: 3 },
        payments: [
          { id: 'boleto', label: 'Boleto Bancário', discount: 0 },
          { id: 'pix', label: 'PIX', discount: 5 },
          { id: 'prazo', label: 'Faturado 30 dias', discount: 0 },
        ],
        features: { minOrderEnabled: true, stockDisplay: true, boxPriceDisplay: true, reorderEnabled: true, cancelEnabled: true },
      },
    }).select().single();

    if (tenantError) return { error: tenantError.message };

    // 3. Link user as owner
    await sb.from('tenant_members').insert({
      tenant_id: tenant.id,
      auth_id: authData.user.id,
      role: 'owner',
      name: tenantData.name,
      phone: tenantData.phone,
    });

    // 4. Create default categories
    const defaultCategories = [
      { name: 'Alimentos', icon: '🍚' },
      { name: 'Bebidas', icon: '🥤' },
      { name: 'Higiene', icon: '🧴' },
      { name: 'Limpeza', icon: '🧹' },
    ];
    await sb.from('categories').insert(defaultCategories.map((c, i) => ({
      tenant_id: tenant.id, name: c.name, icon: c.icon, sort_order: i,
    })));

    return { ok: true, tenant };
  },
};
