-- Mylos Restaurant Product Database Schema
-- Purpose: Track products, suppliers, prices, and enable price comparison for restaurant team

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS product_suppliers;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS invoice_scans;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

-- Users Table (for team member authentication)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user', 'viewer'
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers Table
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(50),
    payment_terms VARCHAR(100), -- e.g., "Net 30", "Cash on delivery"
    delivery_days VARCHAR(100), -- e.g., "Mon, Wed, Fri"
    minimum_order DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0, -- 0-5 star rating
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table (ingredients/items the restaurant buys)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- e.g., "Vegetables", "Meat", "Dairy", "Dry Goods"
    subcategory VARCHAR(100), -- e.g., "Tomatoes", "Beef", "Cheese"
    unit VARCHAR(50) NOT NULL, -- e.g., "kg", "liter", "piece", "box"
    description TEXT,
    sku VARCHAR(100), -- your internal SKU/code
    storage_location VARCHAR(100), -- where you store it
    min_stock_level DECIMAL(10,2), -- alert when below this
    current_stock DECIMAL(10,2) DEFAULT 0,
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_months VARCHAR(50), -- e.g., "Mar-Sep" or "Summer"
    image_url VARCHAR(500),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product-Supplier Relationship (which suppliers sell which products)
CREATE TABLE product_suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    supplier_product_name VARCHAR(255), -- what the supplier calls it
    supplier_sku VARCHAR(100), -- supplier's SKU/code
    current_price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- might differ from product unit
    is_preferred BOOLEAN DEFAULT FALSE, -- preferred supplier for this product
    delivery_time_days INT, -- typical delivery time
    last_price_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_supplier (product_id, supplier_id),
    INDEX idx_product (product_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_price (current_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Price History (track price changes over time)
CREATE TABLE price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_supplier_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    season VARCHAR(50), -- e.g., "Spring 2025", "Winter", "Peak Season"
    price_change_percent DECIMAL(5,2), -- % change from previous price
    recorded_by INT, -- user who recorded this
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_supplier_id) REFERENCES product_suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_supplier (product_supplier_id),
    INDEX idx_date (effective_date),
    INDEX idx_season (season)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchases Table (actual purchase orders/invoices)
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100),
    supplier_id INT NOT NULL,
    purchase_date DATE NOT NULL,
    delivery_date DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    payment_date DATE,
    payment_method VARCHAR(50), -- 'bank transfer', 'cash', 'credit card'
    recorded_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_supplier (supplier_id),
    INDEX idx_date (purchase_date),
    INDEX idx_invoice (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Items (individual items in a purchase)
CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    product_supplier_id INT, -- link to which supplier-product combo was used
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_supplier_id) REFERENCES product_suppliers(id) ON DELETE SET NULL,
    INDEX idx_purchase (purchase_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Scans (OCR processed invoices)
CREATE TABLE invoice_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT,
    file_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    ocr_data JSON,
    ocr_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processed_date TIMESTAMP NULL,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_purchase (purchase_id),
    INDEX idx_status (ocr_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts Table (low stock, price changes, etc.)
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'price_increase', 'price_decrease', 'seasonal'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
    related_product_id INT,
    related_supplier_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_by INT,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (related_supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (read_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (alert_type),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: 'admin123' - CHANGE THIS!)
-- Password hash for 'admin123' using PHP password_hash()
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@mylos.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');

-- Sample data for testing

-- Sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, payment_terms, delivery_days, is_active) VALUES
('Fresh Farm Produce', 'John Doe', 'john@freshfarm.com', '+31 20 123 4567', 'Net 14', 'Mon, Wed, Fri', TRUE),
('Metro Wholesale', 'Jane Smith', 'jane@metro.com', '+31 20 234 5678', 'Net 30', 'Daily', TRUE),
('Seafood Direct', 'Bob Johnson', 'bob@seafood.com', '+31 20 345 6789', 'Cash on delivery', 'Tue, Thu', TRUE);

-- Sample products
INSERT INTO products (name, category, subcategory, unit, description, is_seasonal, season_months, is_active) VALUES
('Tomatoes Roma', 'Vegetables', 'Tomatoes', 'kg', 'Fresh Roma tomatoes', TRUE, 'May-Sep', TRUE),
('Olive Oil Extra Virgin', 'Pantry', 'Oils', 'liter', 'Extra virgin olive oil', FALSE, NULL, TRUE),
('Fresh Salmon Fillet', 'Seafood', 'Fish', 'kg', 'Norwegian salmon', FALSE, NULL, TRUE),
('Mozzarella di Bufala', 'Dairy', 'Cheese', 'kg', 'Buffalo mozzarella DOP', FALSE, NULL, TRUE),
('Asparagus Green', 'Vegetables', 'Asparagus', 'kg', 'Fresh green asparagus', TRUE, 'Mar-Jun', TRUE);

-- Sample product-supplier relationships with prices
INSERT INTO product_suppliers (product_id, supplier_id, supplier_product_name, current_price, unit, is_preferred) VALUES
(1, 1, 'Roma Tomatoes Premium', 2.50, 'kg', TRUE),
(1, 2, 'Tomatoes Roma Grade A', 2.20, 'kg', FALSE),
(2, 2, 'Olive Oil EV 1L', 8.50, 'liter', TRUE),
(3, 3, 'Salmon Fillet Fresh', 18.90, 'kg', TRUE),
(4, 1, 'Buffalo Mozzarella', 12.50, 'kg', TRUE),
(5, 1, 'Asparagus Green NL', 6.80, 'kg', TRUE);

-- Sample price history (showing seasonal variation)
INSERT INTO price_history (product_supplier_id, price, unit, effective_date, season, price_change_percent) VALUES
(1, 3.20, 'kg', '2025-01-01', 'Winter', NULL),
(1, 2.80, 'kg', '2025-05-01', 'Spring', -12.5),
(1, 2.50, 'kg', '2025-07-01', 'Summer Peak', -10.7),
(6, 8.50, 'kg', '2025-03-01', 'Peak Season', NULL),
(6, 6.80, 'kg', '2025-06-01', 'End Season', -20.0);

-- Sample alert
INSERT INTO alerts (alert_type, title, message, severity, related_product_id) VALUES
('seasonal', 'Asparagus Season Ending', 'Green asparagus prices will increase by ~20% after June. Consider bulk purchasing.', 'warning', 5);

-- Create view for easy price comparison
CREATE VIEW v_product_price_comparison AS
SELECT
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.unit as product_unit,
    s.id as supplier_id,
    s.name as supplier_name,
    ps.current_price,
    ps.unit as price_unit,
    ps.is_preferred,
    ps.delivery_time_days,
    ps.last_price_update,
    (SELECT AVG(current_price)
     FROM product_suppliers
     WHERE product_id = p.id AND is_active = TRUE) as avg_market_price,
    ROUND(((ps.current_price - (SELECT AVG(current_price)
                                  FROM product_suppliers
                                  WHERE product_id = p.id AND is_active = TRUE)) /
           (SELECT AVG(current_price)
            FROM product_suppliers
            WHERE product_id = p.id AND is_active = TRUE)) * 100, 2) as price_vs_average_percent
FROM products p
JOIN product_suppliers ps ON p.id = ps.product_id
JOIN suppliers s ON ps.supplier_id = s.id
WHERE p.is_active = TRUE AND ps.is_active = TRUE
ORDER BY p.name, ps.current_price;

-- Database schema version
CREATE TABLE schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version) VALUES ('1.0.0');
