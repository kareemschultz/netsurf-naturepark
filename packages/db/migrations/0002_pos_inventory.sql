CREATE TABLE IF NOT EXISTS netsurf_product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES netsurf_product_categories(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price_gyd INTEGER NOT NULL,
  sku VARCHAR(50) UNIQUE,
  track_stock BOOLEAN NOT NULL DEFAULT FALSE,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_sales (
  id SERIAL PRIMARY KEY,
  sale_number VARCHAR(20) NOT NULL UNIQUE,
  subtotal_gyd INTEGER NOT NULL,
  discount_gyd INTEGER NOT NULL DEFAULT 0,
  tax_gyd INTEGER NOT NULL DEFAULT 0,
  total_gyd INTEGER NOT NULL,
  items_count INTEGER NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'cash',
  notes TEXT NOT NULL DEFAULT '',
  voided BOOLEAN NOT NULL DEFAULT FALSE,
  voided_at TIMESTAMP,
  void_reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_sale_payments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES netsurf_sales(id) ON DELETE CASCADE,
  method VARCHAR(30) NOT NULL,
  amount_gyd INTEGER NOT NULL,
  reference VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES netsurf_sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES netsurf_products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  unit_price_gyd INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total_gyd INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS netsurf_stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES netsurf_products(id) ON DELETE RESTRICT,
  type VARCHAR(20) NOT NULL,
  quantity_change INTEGER NOT NULL,
  reference_id INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_stock_transfers (
  id SERIAL PRIMARY KEY,
  transfer_number VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  dispatched_by VARCHAR(200) NOT NULL,
  dispatched_at TIMESTAMP,
  notes TEXT NOT NULL DEFAULT '',
  received_by VARCHAR(200),
  received_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_stock_transfer_items (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER NOT NULL REFERENCES netsurf_stock_transfers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES netsurf_products(id) ON DELETE RESTRICT,
  product_name_snapshot VARCHAR(200) NOT NULL,
  qty_dispatched INTEGER NOT NULL,
  qty_received INTEGER,
  discrepancy_notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS netsurf_pos_audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  performed_by VARCHAR(200) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_sort_order
  ON netsurf_product_categories (sort_order, name);

CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON netsurf_products (category_id, is_active);

CREATE INDEX IF NOT EXISTS idx_products_track_stock
  ON netsurf_products (track_stock, stock_qty);

CREATE INDEX IF NOT EXISTS idx_sales_created_at
  ON netsurf_sales (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_voided_created_at
  ON netsurf_sales (voided, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id
  ON netsurf_sale_payments (sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON netsurf_sale_items (sale_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created_at
  ON netsurf_stock_movements (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_status_created_at
  ON netsurf_stock_transfers (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id
  ON netsurf_stock_transfer_items (transfer_id);

CREATE INDEX IF NOT EXISTS idx_pos_audit_log_entity
  ON netsurf_pos_audit_log (entity_type, entity_id, created_at DESC);
