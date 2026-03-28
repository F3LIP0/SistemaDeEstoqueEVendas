-- ============================================
-- fluxa - SCHEMA POSTGRESQL
-- Para Supabase
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS BÁSICAS
-- ============================================

-- Tabela de Roles (Níveis de Acesso)
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_level INT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INT REFERENCES categories(category_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Marcas
CREATE TABLE IF NOT EXISTS brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Unidades de Medida
CREATE TABLE IF NOT EXISTS units (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(category_id),
    brand_id INT REFERENCES brands(brand_id),
    unit_id INT NOT NULL REFERENCES units(unit_id),
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    minimum_stock INT DEFAULT 10,
    maximum_stock INT,
    current_stock INT DEFAULT 0,
    weight DECIMAL(8, 2),
    dimensions VARCHAR(50),
    is_perishable BOOLEAN DEFAULT FALSE,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    address VARCHAR(300),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    cnpj VARCHAR(20) UNIQUE,
    address VARCHAR(300),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Registros de Ponto
CREATE TABLE IF NOT EXISTS time_records (
    record_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos de Venda
CREATE TABLE IF NOT EXISTS sales_orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    total_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens de Pedidos de Venda
CREATE TABLE IF NOT EXISTS sales_order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES sales_orders(order_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    movement_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(user_id),
    reference_type VARCHAR(50),
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Entradas de Estoque
CREATE TABLE IF NOT EXISTS stock_entries (
    entry_id SERIAL PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT REFERENCES suppliers(supplier_id),
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DECIMAL(12, 2),
    notes TEXT,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens de Entradas
CREATE TABLE IF NOT EXISTS stock_entry_items (
    entry_item_id SERIAL PRIMARY KEY,
    entry_id INT NOT NULL REFERENCES stock_entries(entry_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Saídas de Estoque
CREATE TABLE IF NOT EXISTS stock_exits (
    exit_id SERIAL PRIMARY KEY,
    exit_number VARCHAR(50) UNIQUE NOT NULL,
    exit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DECIMAL(12, 2),
    notes TEXT,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens de Saídas
CREATE TABLE IF NOT EXISTS stock_exit_items (
    exit_item_id SERIAL PRIMARY KEY,
    exit_id INT NOT NULL REFERENCES stock_exits(exit_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_value DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ajustes de Estoque
CREATE TABLE IF NOT EXISTS stock_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    adjustment_quantity INT NOT NULL,
    adjustment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(200),
    notes TEXT,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ordens de Compra
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    po_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'DRAFT',
    total_amount DECIMAL(12, 2),
    delivery_date DATE,
    notes TEXT,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens de Ordens de Compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
    po_item_id SERIAL PRIMARY KEY,
    po_id INT NOT NULL REFERENCES purchase_orders(po_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    received_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES sales_orders(order_id),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Log de Atividades
CREATE TABLE IF NOT EXISTS activity_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_time_records_user ON time_records(user_id);
CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(clock_in);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);

-- ============================================
-- 3. INSERIR DADOS INICIAIS
-- ============================================

-- Inserir Roles
INSERT INTO roles (role_name, role_level, description) VALUES
    ('EMPLOYEE', 1, 'Funcionário comum')
    ON CONFLICT DO NOTHING;

INSERT INTO roles (role_name, role_level, description) VALUES
    ('MANAGER', 2, 'Gerente/Supervisor')
    ON CONFLICT DO NOTHING;

INSERT INTO roles (role_name, role_level, description) VALUES
    ('ADMIN', 3, 'Administrador do sistema')
    ON CONFLICT DO NOTHING;

-- Inserir Unidades de Medida
INSERT INTO units (unit_name, abbreviation) VALUES
    ('Unidade', 'un'),
    ('Quilograma', 'kg'),
    ('Litro', 'l'),
    ('Metro', 'm'),
    ('Centímetro', 'cm'),
    ('Caixa', 'cx'),
    ('Dúzia', 'dz'),
    ('Pacote', 'pct'),
    ('Lata', 'lt')
    ON CONFLICT DO NOTHING;

-- Inserir Categorias
INSERT INTO categories (category_name, description) VALUES
    ('Eletrônicos', 'Produtos eletrônicos em geral'),
    ('Alimentos', 'Alimentos e bebidas'),
    ('Limpeza', 'Produtos de limpeza'),
    ('Vestuário', 'Roupas e acessórios'),
    ('Outros', 'Outros produtos')
    ON CONFLICT DO NOTHING;

-- Inserir Marcas
INSERT INTO brands (brand_name, description) VALUES
    ('Genérica', 'Marca genérica/sem marca'),
    ('Premium', 'Produtos premium'),
    ('Econômica', 'Linha econômica')
    ON CONFLICT DO NOTHING;

-- Inserir Cliente padrão
INSERT INTO customers (full_name, email, phone, city, state) VALUES
    ('Cliente Padrão', 'cliente@example.com', '0000-0000', 'São Paulo', 'SP')
    ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CRIAR VIEWS ÚTEIS
-- ============================================

-- Remover views antigas se existirem
DROP VIEW IF EXISTS vw_inventory_value CASCADE;
DROP VIEW IF EXISTS vw_sales_summary CASCADE;
DROP VIEW IF EXISTS vw_low_stock_products CASCADE;

-- View: Produtos com Estoque Baixo
CREATE VIEW vw_low_stock_products AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.current_stock,
    p.minimum_stock,
    c.category_name,
    b.brand_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN brands b ON p.brand_id = b.brand_id
WHERE p.current_stock <= p.minimum_stock
    AND p.is_active = TRUE
ORDER BY p.current_stock ASC;

-- View: Resumo de Vendas
CREATE VIEW vw_sales_summary AS
SELECT 
    DATE(so.order_date) as sale_date,
    COUNT(DISTINCT so.order_id) as total_orders,
    COUNT(DISTINCT so.customer_id) as unique_customers,
    SUM(so.total_amount) as total_revenue,
    AVG(so.total_amount) as average_order_value,
    MAX(so.total_amount) as max_order_value
FROM sales_orders so
WHERE so.status != 'CANCELLED'
GROUP BY DATE(so.order_date)
ORDER BY sale_date DESC;

-- View: Valor do Inventário
CREATE VIEW vw_inventory_value AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.current_stock,
    p.cost_price,
    p.selling_price,
    (p.current_stock * p.cost_price) as inventory_cost,
    (p.current_stock * p.selling_price) as inventory_value,
    ((p.current_stock * p.selling_price) - (p.current_stock * p.cost_price)) as potential_profit,
    c.category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.is_active = TRUE
ORDER BY inventory_value DESC;

-- ============================================
-- 5. CRIAR FUNÇÕES E TRIGGERS
-- ============================================

-- Função: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers: updated_at
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_stock_entries_updated_at BEFORE UPDATE ON stock_entries
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 6. COMENTÁRIOS DE DESENVOLVIMENTO
-- ============================================

-- Schema pronto para Supabase!
-- 1. Copie este arquivo e cole no SQL Editor do Supabase
-- 2. Execute o script completo
-- 3. Defina Row Level Security (RLS) se necessário
-- 4. Configure as políticas de acesso
-- 5. O backend criará automaticamente o usuário admin ao iniciar

-- Credenciais iniciais:
-- Admin: admin@empresa.com / admin123
-- Altere a senha após o primeiro acesso!
