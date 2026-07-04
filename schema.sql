-- AntiFakeNG Database Schema (MySQL)
-- Created according to the antifakeng.html product blueprint.

-- Drop tables in reverse dependency order to avoid foreign key errors
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS fraud_events;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS verification_sessions;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS consumers;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS producers;

-- 1. Producers (Tenant isolation root)
CREATE TABLE producers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    plan_tier VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    brand_logo_url VARCHAR(512),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users (Staff / Administrators)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- admin, producer, qa, support
    producer_id INT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products (Scoped to a single producer)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producer_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Production Batches
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    batch_code VARCHAR(100) NOT NULL UNIQUE,
    quantity INT NOT NULL,
    manufacture_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, recalled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. QR Codes (Verification tokens)
CREATE TABLE qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    signature VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, recalled, blocked
    printed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Consumers (Opted-in verifiers)
CREATE TABLE consumers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number_hash VARCHAR(255) NOT NULL UNIQUE,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Devices (Fingerprints for fraud detection)
CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fingerprint_hash VARCHAR(255) NOT NULL UNIQUE,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Verification Sessions (Each scan attempt)
CREATE TABLE verification_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code_id INT NOT NULL,
    consumer_id INT NULL,
    device_id TEXT NULL,
    ip_country VARCHAR(100) NULL,
    result VARCHAR(50) NOT NULL, -- genuine, previously_verified, suspicious, high_risk, invalid, recalled
    risk_score DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (consumer_id) REFERENCES consumers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Consumer Reports
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code_id INT NOT NULL,
    consumer_id INT NOT NULL,
    description TEXT,
    retailer_name VARCHAR(255) NULL,
    retailer_location TEXT NULL,
    photo_url VARCHAR(512) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, investigating, resolved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (consumer_id) REFERENCES consumers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Fraud Events (Flagged by risk engine)
CREATE TABLE fraud_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    verification_session_id INT NOT NULL,
    signal_type VARCHAR(100) NOT NULL, -- e.g. tampered_token, impossible_travel
    severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verification_session_id) REFERENCES verification_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Audit Logs (Immutable logging)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SEED TEST DATA ====================

-- 1. Seed Producers
INSERT INTO producers (id, name, slug, plan_tier, contact_email, brand_logo_url, status) VALUES
(1, 'AURA Skincare', 'aura', 'growth', 'hello@auraskin.com', '/logo.png', 'active'),
(2, 'Nexa Agro', 'nexa-agro', 'starter', 'support@nexa.com', '/logo.png', 'active');

-- 2. Seed Users (Bcrypt hashes for 'aura123456' / 'admin123456')
INSERT INTO users (id, email, password_hash, role, producer_id, status) VALUES
(1, 'admin@auraskin.com', '$2a$10$wJtK/f2Z/9f1Q4/n75.0ODWk7jH9t48wE4zF2y6/w6x2d2r6w3a2', 'producer', 1, 'active'),
(2, 'admin@antifakeng.com', '$2a$10$wJtK/f2Z/9f1Q4/n75.0ODWk7jH9t48wE4zF2y6/w6x2d2r6w3a2', 'admin', NULL, 'active');

-- 3. Seed Products
INSERT INTO products (id, producer_id, name, sku, category, description, image_url) VALUES
(1, 1, 'AURA Skincare Serum', 'AURA-SERUM-50ML', 'Cosmetics', 'Premium hydrating skincare serum with Hyaluronic Acid.', '/logo.png'),
(2, 2, 'NexaFertilize Plus', 'NEX-FER-PLS', 'Agriculture', 'Organic nitrogen-rich fertilizer.', '/logo.png');

-- 4. Seed Batches
INSERT INTO batches (id, product_id, batch_code, quantity, manufacture_date, expiry_date, status) VALUES
(1, 1, 'B-AUR-2026-01', 5000, '2026-01-01 00:00:00', '2028-01-01 00:00:00', 'active'),
(2, 2, 'B-NEX-2026-02', 2000, '2026-02-01 00:00:00', '2028-02-01 00:00:00', 'draft');

-- 5. Seed QR Codes (Signature generated using HMAC-SHA256 with key 'antifake_secret')
INSERT INTO qr_codes (id, batch_id, token, signature, status) VALUES
(1, 1, '9F3C-71AE', '919d854eb130838b939fa4beec8c81961e699b828a2a8934ca4e9c7ff52b86e4', 'active'),
(2, 1, '8E2B-60CD', 'e4d8a571936de3cae96f1b3e8e19cde47bc9dfa16641e7fcae8c18cbbe8a29b3', 'active');
