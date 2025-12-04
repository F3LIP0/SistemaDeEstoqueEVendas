-- ============================================
-- SISTEMA DE ESTOQUE E VENDAS - ESQUEMA COMPLETO
-- Projeto Final de Curso
-- Banco de dados: PostgreSQL
-- ============================================

-- Criar o banco de dados (executar separadamente)
-- CREATE DATABASE sistema_estoque_vendas;

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');

CREATE TYPE transaction_type AS ENUM (
    'purchase_order',
    'stock_receipt', 
    'stock_adjustment',
    'stock_transfer',
    'sale',
    'return',
    'damage',
    'expired'
);

-- ============================================
-- 1. TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role_creation CHECK (
        (created_by IS NULL AND role IN ('admin', 'manager')) OR 
        (created_by IS NOT NULL)
    )
);

CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE password_reset_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. TABELAS DE FUNCIONÁRIOS E PONTO
-- ============================================
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    phone_number VARCHAR(20),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_records (
    record_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out TIMESTAMP,
    total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (check_out - check_in))/3600
    ) STORED,
    date DATE GENERATED ALWAYS AS (check_in::DATE) STORED,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    approved_by INTEGER REFERENCES users(user_id),
    approval_date TIMESTAMP,
    CONSTRAINT chk_checkout_time CHECK (check_out IS NULL OR check_out > check_in)
);

CREATE TABLE leave_requests (
    request_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(user_id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

-- ============================================
-- 3. TABELAS DE PRODUTOS
-- ============================================
CREATE TABLE product_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES product_categories(category_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brands (
    brand_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES product_categories(category_id),
    brand_id INTEGER REFERENCES brands(brand_id),
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    unit_of_measure VARCHAR(20) NOT NULL,
    cost_price DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    wholesale_price DECIMAL(12,2),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    current_stock INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions VARCHAR(50),
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_taxable BOOLEAN DEFAULT TRUE,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_restocked DATE,
    CONSTRAINT chk_prices CHECK (selling_price >= cost_price),
    CONSTRAINT chk_stock_levels CHECK (max_stock_level >= min_stock_level)
);

CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    alt_text VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. TABELAS DE TRANSAÇÕES DE ESTOQUE
-- ============================================
CREATE TABLE inventory_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_type transaction_type NOT NULL,
    product_id INTEGER REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    reference_number VARCHAR(50),
    reference_id INTEGER,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by INTEGER REFERENCES users(user_id),
    verified_at TIMESTAMP,
    CONSTRAINT chk_quantity CHECK (quantity != 0)
);

CREATE TABLE stock_movements (
    movement_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES inventory_transactions(transaction_id),
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    movement_type VARCHAR(20) NOT NULL,
    notes TEXT
);

-- ============================================
-- 5. TABELAS DE COMPRAS (ENTRADA)
-- ============================================
CREATE TABLE purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    shipping_cost DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_terms VARCHAR(100),
    created_by INTEGER REFERENCES users(user_id),
    approved_by INTEGER REFERENCES users(user_id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_delivery_date CHECK (expected_delivery_date >= order_date)
);

CREATE TABLE purchase_order_items (
    poi_id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    notes TEXT
);

CREATE TABLE receiving_reports (
    report_id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(po_id),
    received_by INTEGER REFERENCES users(user_id),
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    notes TEXT
);

-- ============================================
-- 6. TABELAS DE VENDAS (SAÍDA)
-- ============================================
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    customer_type VARCHAR(20) DEFAULT 'retail',
    credit_limit DECIMAL(12,2),
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    required_date DATE,
    shipped_date TIMESTAMP,
    subtotal DECIMAL(12,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(12,2),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2),
    payment_method VARCHAR(30),
    payment_status VARCHAR(20) DEFAULT 'pending',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    notes TEXT,
    salesperson_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales_orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (
        quantity * unit_price * (1 - discount_percentage/100)
    ) STORED,
    notes TEXT,
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0)
);

CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES sales_orders(order_id),
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(20) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_due_date CHECK (due_date >= invoice_date)
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(invoice_id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    received_by INTEGER REFERENCES users(user_id),
    notes TEXT
);

-- ============================================
-- 7. TABELAS ADICIONAIS DE SUPORTE
-- ============================================
CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    manager_id INTEGER REFERENCES users(user_id),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouse_stock (
    stock_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id)
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_url VARCHAR(500)
);

-- ============================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(created_at);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_employees_user_id ON employees(user_id);

-- ============================================
-- 9. TRIGGERS E FUNÇÕES
-- ============================================
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type IN ('stock_receipt', 'return') THEN
        UPDATE products 
        SET current_stock = current_stock + NEW.quantity,
            last_restocked = CURRENT_DATE
        WHERE product_id = NEW.product_id;
    ELSIF NEW.transaction_type IN ('sale', 'damage', 'expired') THEN
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity
        WHERE product_id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sales_orders_updated BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. DADOS INICIAIS
-- ============================================
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('company_name', 'Sistema de Estoque e Vendas', 'Nome da empresa para relatórios'),
('tax_rate', '18', 'Percentual padrão de impostos'),
('currency', 'BRL', 'Moeda padrão'),
('low_stock_threshold', '10', 'Nível mínimo de estoque para alertas'),
('invoice_prefix', 'FAT', 'Prefixo para números de fatura'),
('order_prefix', 'PED', 'Prefixo para pedidos de venda');

-- Usuário admin inicial (senha: admin123 - TROQUE NA PRODUÇÃO)
INSERT INTO users (username, password_hash, email, first_name, last_name, role, is_active) 
VALUES ('admin', '$2y$10$YourHashedPasswordHere', 'admin@empresa.com', 'Admin', 'Sistema', 'admin', true);

INSERT INTO product_categories (name, description) VALUES
('Eletrônicos', 'Dispositivos eletrônicos e componentes'),
('Material de Escritório', 'Itens de escritório e papelaria'),
('Alimentos e Bebidas', 'Produtos alimentícios e bebidas'),
('Material de Limpeza', 'Produtos de limpeza e manutenção');

INSERT INTO brands (name, contact_email) VALUES
('TechMarca', 'contato@techmarca.com'),
('OfficePlus', 'info@officeplus.com'),
('FoodQuality', 'vendas@foodquality.com');

-- ============================================
-- FIM DO ESQUEMA DO BANCO DE DADOS
-- ============================================