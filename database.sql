-- Database Schema for Laporan Keuangan Dashboard
-- Optimized for MySQL/MariaDB (Laragon Default)

-- Table for Users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY, -- Using UUID as string
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table for Custom Sections (Kategori Induk)
CREATE TABLE IF NOT EXISTS sections (
    id CHAR(36) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    user_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table for Menus
CREATE TABLE IF NOT EXISTS menus (
    id CHAR(36) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'operational', 'savings', or custom
    icon_name VARCHAR(50),     -- Name of the Lucide icon to use
    section_id CHAR(36),       -- Null if not in a custom section
    user_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table for Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY,
    menu_id CHAR(36),
    user_id CHAR(36),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(255),
    proof_image LONGTEXT, -- Stores base64
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table for Division Settings (Bantuan Operasional)
CREATE TABLE IF NOT EXISTS division_settings (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nominal DECIMAL(15, 2) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Indexing for performance
CREATE INDEX idx_transactions_menu_id ON transactions(menu_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_menus_user_id ON menus(user_id);
CREATE INDEX idx_sections_user_id ON sections(user_id);
CREATE INDEX idx_division_settings_order ON division_settings(display_order);
