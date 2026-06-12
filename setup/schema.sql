-- ============================================================
-- DigitalB2B — Multi-tenant B2B Portal Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. TENANTS (distribuidores)
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  cnpj text,
  logo_url text,
  logo_text text DEFAULT 'Digital<span>B2B</span>',
  config jsonb DEFAULT '{}'::jsonb,
  plan text CHECK (plan IN ('setup', 'self-service')) DEFAULT 'setup',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE tenants IS 'Each distributor is a tenant with their own portal';
COMMENT ON COLUMN tenants.slug IS 'Subdomain: slug.digitalb2b.com.br';
COMMENT ON COLUMN tenants.config IS 'JSON with colors, contact, shipping, payments, features, promoBanner, footer';
COMMENT ON COLUMN tenants.plan IS 'setup = done-for-you, self-service = client manages';

-- 2. TENANT MEMBERS (admins/owners — linked to Supabase Auth)
CREATE TABLE tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'admin', 'rep')) DEFAULT 'admin',
  name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, auth_id)
);

COMMENT ON TABLE tenant_members IS 'Distributor team members (owner, admin, sales rep)';

-- 3. CATEGORIES
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '📦',
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. PRODUCTS
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sku text,
  barcode text,
  name text NOT NULL,
  brand text,
  description text,
  price numeric(10,2) NOT NULL,
  price_box numeric(10,2),
  unit text DEFAULT 'un',
  box_qty int DEFAULT 1,
  min_order int DEFAULT 1,
  stock int DEFAULT 0,
  image_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(tenant_id, active);

-- 5. PORTAL USERS (lojistas/clientes do distribuidor)
CREATE TABLE portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  cnpj text,
  phone text,
  address text,
  price_table text DEFAULT 'standard',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_portal_users_tenant ON portal_users(tenant_id);

-- 6. ORDERS
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  portal_user_id uuid REFERENCES portal_users(id),
  order_number int NOT NULL,
  status text CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')) DEFAULT 'pending',
  payment_method text,
  subtotal numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  notes text,
  delivery_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_user ON orders(portal_user_id);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);

-- Auto-increment order_number per tenant
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS trigger AS $$
BEGIN
  SELECT COALESCE(MAX(order_number), 4870) + 1 INTO NEW.order_number
  FROM orders WHERE tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION next_order_number();

-- 7. ORDER ITEMS
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity int NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- ROW LEVEL SECURITY (tenant isolation)
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper: get tenant_id for current auth user
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM tenant_members WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- TENANTS: members can read their own tenant
CREATE POLICY "tenant_read" ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

CREATE POLICY "tenant_update" ON tenants FOR UPDATE
  USING (id = get_user_tenant_id());

-- Public read for portal (by slug) — lojistas need to see tenant config
CREATE POLICY "tenant_public_read" ON tenants FOR SELECT
  USING (active = true);

-- TENANT MEMBERS
CREATE POLICY "members_read" ON tenant_members FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "members_manage" ON tenant_members FOR ALL
  USING (tenant_id = get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM tenant_members
      WHERE auth_id = auth.uid() AND tenant_id = tenant_members.tenant_id AND role = 'owner'
    ));

-- CATEGORIES: tenant members full access, public read for portal
CREATE POLICY "categories_tenant" ON categories FOR ALL
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "categories_public" ON categories FOR SELECT
  USING (active = true);

-- PRODUCTS: tenant members full access, public read for portal
CREATE POLICY "products_tenant" ON products FOR ALL
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "products_public" ON products FOR SELECT
  USING (active = true);

-- PORTAL USERS: tenant members manage, public self-read
CREATE POLICY "portal_users_tenant" ON portal_users FOR ALL
  USING (tenant_id = get_user_tenant_id());

-- ORDERS: tenant members see all, public by portal_user
CREATE POLICY "orders_tenant" ON orders FOR ALL
  USING (tenant_id = get_user_tenant_id());

-- ORDER ITEMS: through order access
CREATE POLICY "order_items_read" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id
    AND orders.tenant_id = get_user_tenant_id()
  ));

CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id
    AND orders.tenant_id = get_user_tenant_id()
  ));

-- ============================================================
-- PORTAL AUTH FUNCTION (for lojistas — not Supabase Auth)
-- ============================================================

CREATE OR REPLACE FUNCTION portal_login(p_tenant_slug text, p_email text, p_password text)
RETURNS json AS $$
DECLARE
  v_user portal_users%ROWTYPE;
  v_tenant_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_tenant_slug AND active = true;
  IF v_tenant_id IS NULL THEN RETURN json_build_object('error', 'Portal não encontrado'); END IF;

  SELECT * INTO v_user FROM portal_users
    WHERE tenant_id = v_tenant_id AND email = p_email AND active = true;
  IF v_user IS NULL THEN RETURN json_build_object('error', 'Credenciais inválidas'); END IF;

  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('error', 'Credenciais inválidas');
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'email', v_user.email,
    'cnpj', v_user.cnpj,
    'price_table', v_user.price_table,
    'tenant_id', v_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_portal_users_updated_at BEFORE UPDATE ON portal_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- EXTENSIONS (enable in Supabase Dashboard > Database > Extensions)
-- ============================================================
-- pgcrypto (for crypt/gen_salt in portal_login) — usually enabled by default
CREATE EXTENSION IF NOT EXISTS pgcrypto;
