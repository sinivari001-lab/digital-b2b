// Mock data for the B2B portal
const CATEGORIES = [
  { id: 'alimentos', name: 'Alimentos', icon: '🍚' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'higiene', name: 'Higiene e Perfumaria', icon: '🧴' },
  { id: 'limpeza', name: 'Limpeza', icon: '🧹' },
  { id: 'biscoitos', name: 'Biscoitos e Doces', icon: '🍪' },
  { id: 'domestico', name: 'Uso Doméstico', icon: '🏠' },
  { id: 'papelaria', name: 'Papelaria', icon: '📎' },
  { id: 'petshop', name: 'Pet Shop', icon: '🐾' },
];

const BRANDS = [
  'Nestlé', 'Unilever', 'P&G', 'Ambev', 'JBS', 'BRF', 'Coca-Cola',
  'Colgate', 'Ypê', 'Camil', 'M. Dias Branco', 'Bunge', 'Cargill',
  'Mondelez', 'PepsiCo', 'Heineken', 'Kimberly-Clark', 'Johnson & Johnson',
  'Reckitt', 'Arcor',
];

const PRODUCTS = [
  // Alimentos
  { id: 1, name: 'Arroz Camil Tipo 1 5kg', brand: 'Camil', category: 'alimentos', price: 22.90, priceBox: 274.80, unit: 'pct', boxQty: 12, minOrder: 6, stock: 480, sku: 'ALM-001', barcode: '7896006712345' },
  { id: 2, name: 'Feijão Carioca Camil 1kg', brand: 'Camil', category: 'alimentos', price: 8.49, priceBox: 169.80, unit: 'pct', boxQty: 20, minOrder: 10, stock: 600, sku: 'ALM-002', barcode: '7896006712346' },
  { id: 3, name: 'Óleo de Soja Bunge 900ml', brand: 'Bunge', category: 'alimentos', price: 7.29, priceBox: 145.80, unit: 'un', boxQty: 20, minOrder: 10, stock: 300, sku: 'ALM-003', barcode: '7891234567890' },
  { id: 4, name: 'Açúcar Refinado União 1kg', brand: 'Cargill', category: 'alimentos', price: 5.59, priceBox: 55.90, unit: 'pct', boxQty: 10, minOrder: 10, stock: 450, sku: 'ALM-004', barcode: '7891234567891' },
  { id: 5, name: 'Macarrão Espaguete Adria 500g', brand: 'M. Dias Branco', category: 'alimentos', price: 4.29, priceBox: 85.80, unit: 'pct', boxQty: 20, minOrder: 20, stock: 720, sku: 'ALM-005', barcode: '7891234567892' },
  { id: 6, name: 'Farinha de Trigo Bunge 1kg', brand: 'Bunge', category: 'alimentos', price: 5.19, priceBox: 51.90, unit: 'pct', boxQty: 10, minOrder: 10, stock: 360, sku: 'ALM-006', barcode: '7891234567893' },
  { id: 7, name: 'Sal Refinado Cisne 1kg', brand: 'Cargill', category: 'alimentos', price: 2.99, priceBox: 89.70, unit: 'pct', boxQty: 30, minOrder: 30, stock: 900, sku: 'ALM-007', barcode: '7891234567894' },
  { id: 8, name: 'Leite Condensado Moça 395g', brand: 'Nestlé', category: 'alimentos', price: 8.99, priceBox: 215.76, unit: 'un', boxQty: 24, minOrder: 12, stock: 240, sku: 'ALM-008', barcode: '7891234567895' },

  // Bebidas
  { id: 9, name: 'Coca-Cola 2L', brand: 'Coca-Cola', category: 'bebidas', price: 9.49, priceBox: 56.94, unit: 'un', boxQty: 6, minOrder: 6, stock: 420, sku: 'BEB-001', barcode: '7894900012345' },
  { id: 10, name: 'Guaraná Antarctica 2L', brand: 'Ambev', category: 'bebidas', price: 7.99, priceBox: 47.94, unit: 'un', boxQty: 6, minOrder: 6, stock: 360, sku: 'BEB-002', barcode: '7894900012346' },
  { id: 11, name: 'Cerveja Brahma 350ml (lata)', brand: 'Ambev', category: 'bebidas', price: 3.29, priceBox: 39.48, unit: 'un', boxQty: 12, minOrder: 12, stock: 1200, sku: 'BEB-003', barcode: '7894900012347' },
  { id: 12, name: 'Cerveja Heineken 350ml (lata)', brand: 'Heineken', category: 'bebidas', price: 5.49, priceBox: 65.88, unit: 'un', boxQty: 12, minOrder: 12, stock: 600, sku: 'BEB-004', barcode: '7894900012348' },
  { id: 13, name: 'Suco Del Valle Uva 1L', brand: 'Coca-Cola', category: 'bebidas', price: 7.29, priceBox: 87.48, unit: 'un', boxQty: 12, minOrder: 6, stock: 300, sku: 'BEB-005', barcode: '7894900012349' },
  { id: 14, name: 'Água Mineral Crystal 500ml', brand: 'Coca-Cola', category: 'bebidas', price: 1.79, priceBox: 21.48, unit: 'un', boxQty: 12, minOrder: 12, stock: 1800, sku: 'BEB-006', barcode: '7894900012350' },

  // Higiene
  { id: 15, name: 'Sabonete Dove Original 90g', brand: 'Unilever', category: 'higiene', price: 4.79, priceBox: 57.48, unit: 'un', boxQty: 12, minOrder: 12, stock: 480, sku: 'HIG-001', barcode: '7891150012345' },
  { id: 16, name: 'Shampoo Pantene 400ml', brand: 'P&G', category: 'higiene', price: 22.90, priceBox: 274.80, unit: 'un', boxQty: 12, minOrder: 6, stock: 180, sku: 'HIG-002', barcode: '7891150012346' },
  { id: 17, name: 'Creme Dental Colgate 90g', brand: 'Colgate', category: 'higiene', price: 5.49, priceBox: 65.88, unit: 'un', boxQty: 12, minOrder: 12, stock: 720, sku: 'HIG-003', barcode: '7891150012347' },
  { id: 18, name: 'Papel Higiênico Neve 30m (4un)', brand: 'Kimberly-Clark', category: 'higiene', price: 8.99, priceBox: 107.88, unit: 'pct', boxQty: 12, minOrder: 6, stock: 360, sku: 'HIG-004', barcode: '7891150012348' },
  { id: 19, name: 'Desodorante Rexona Aero 150ml', brand: 'Unilever', category: 'higiene', price: 16.90, priceBox: 202.80, unit: 'un', boxQty: 12, minOrder: 6, stock: 240, sku: 'HIG-005', barcode: '7891150012349' },

  // Limpeza
  { id: 20, name: 'Detergente Ypê 500ml', brand: 'Ypê', category: 'limpeza', price: 2.79, priceBox: 55.80, unit: 'un', boxQty: 20, minOrder: 20, stock: 1000, sku: 'LIM-001', barcode: '7896098712345' },
  { id: 21, name: 'Água Sanitária Ypê 1L', brand: 'Ypê', category: 'limpeza', price: 4.49, priceBox: 53.88, unit: 'un', boxQty: 12, minOrder: 12, stock: 600, sku: 'LIM-002', barcode: '7896098712346' },
  { id: 22, name: 'Sabão em Pó OMO 1.6kg', brand: 'Unilever', category: 'limpeza', price: 19.90, priceBox: 119.40, unit: 'un', boxQty: 6, minOrder: 6, stock: 300, sku: 'LIM-003', barcode: '7896098712347' },
  { id: 23, name: 'Amaciante Comfort 2L', brand: 'Unilever', category: 'limpeza', price: 16.49, priceBox: 98.94, unit: 'un', boxQty: 6, minOrder: 6, stock: 240, sku: 'LIM-004', barcode: '7896098712348' },
  { id: 24, name: 'Desinfetante Lysoform 1L', brand: 'Reckitt', category: 'limpeza', price: 12.90, priceBox: 154.80, unit: 'un', boxQty: 12, minOrder: 6, stock: 360, sku: 'LIM-005', barcode: '7896098712349' },

  // Biscoitos e Doces
  { id: 25, name: 'Biscoito Cream Cracker Vitarella 400g', brand: 'M. Dias Branco', category: 'biscoitos', price: 5.49, priceBox: 109.80, unit: 'pct', boxQty: 20, minOrder: 10, stock: 500, sku: 'BIS-001', barcode: '7891234512345' },
  { id: 26, name: 'Chocolate Lacta ao Leite 90g', brand: 'Mondelez', category: 'biscoitos', price: 6.99, priceBox: 167.76, unit: 'un', boxQty: 24, minOrder: 12, stock: 360, sku: 'BIS-002', barcode: '7891234512346' },
  { id: 27, name: 'Bala Butter Toffees 600g', brand: 'Arcor', category: 'biscoitos', price: 14.90, priceBox: 89.40, unit: 'pct', boxQty: 6, minOrder: 6, stock: 180, sku: 'BIS-003', barcode: '7891234512347' },
  { id: 28, name: 'Biscoito Oreo 90g', brand: 'Mondelez', category: 'biscoitos', price: 4.29, priceBox: 154.44, unit: 'un', boxQty: 36, minOrder: 12, stock: 432, sku: 'BIS-004', barcode: '7891234512348' },

  // Uso Doméstico
  { id: 29, name: 'Esponja Scotch-Brite (3un)', brand: 'Reckitt', category: 'domestico', price: 5.99, priceBox: 71.88, unit: 'pct', boxQty: 12, minOrder: 12, stock: 480, sku: 'DOM-001', barcode: '7891234562345' },
  { id: 30, name: 'Saco de Lixo 50L (10un)', brand: 'Ypê', category: 'domestico', price: 7.49, priceBox: 89.88, unit: 'pct', boxQty: 12, minOrder: 12, stock: 360, sku: 'DOM-002', barcode: '7891234562346' },
];

const MOCK_USERS = [
  { id: 1, email: 'demo@empresa.com', password: '123456', name: 'Mercearia São Jorge', cnpj: '12.345.678/0001-90', type: 'client', priceTable: 'standard' },
  { id: 2, email: 'admin@distribuidora.com', password: '123456', name: 'Admin Distribuidora', cnpj: '98.765.432/0001-10', type: 'admin', priceTable: 'admin' },
  { id: 3, email: 'rep@distribuidora.com', password: '123456', name: 'João Silva (Representante)', cnpj: '', type: 'rep', priceTable: 'rep' },
];

const ORDER_STATUSES = [
  { id: 'pending', label: 'Pendente', color: '#f59e0b' },
  { id: 'confirmed', label: 'Confirmado', color: '#3b82f6' },
  { id: 'processing', label: 'Em separação', color: '#8b5cf6' },
  { id: 'shipped', label: 'Enviado', color: '#06d6a0' },
  { id: 'delivered', label: 'Entregue', color: '#22c55e' },
  { id: 'cancelled', label: 'Cancelado', color: '#ef4444' },
];

const MOCK_ORDERS = [
  { id: 4871, date: '2026-06-09T14:32:00', status: 'shipped', items: [{ productId: 1, qty: 24 }, { productId: 9, qty: 12 }, { productId: 20, qty: 40 }], total: 1012.80, payment: 'boleto', deliveryDate: '2026-06-12' },
  { id: 4865, date: '2026-06-07T09:15:00', status: 'delivered', items: [{ productId: 15, qty: 24 }, { productId: 17, qty: 24 }, { productId: 22, qty: 12 }], total: 1517.52, payment: 'boleto', deliveryDate: '2026-06-10' },
  { id: 4858, date: '2026-06-05T16:48:00', status: 'delivered', items: [{ productId: 11, qty: 48 }, { productId: 25, qty: 20 }, { productId: 8, qty: 12 }], total: 475.80, payment: 'pix', deliveryDate: '2026-06-08' },
];
