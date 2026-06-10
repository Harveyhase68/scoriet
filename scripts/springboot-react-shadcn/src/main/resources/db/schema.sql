-- ScorietTemplate schema
-- Simplified subset of database/test_address.sql:
-- only customers + lookup tables postal_codes and companies, plus users for login.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS postal_codes;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;

-- Application users (login)
CREATE TABLE users (
  user_id BIGINT NOT NULL AUTO_INCREMENT,
  user_username VARCHAR(64) NOT NULL,
  user_password VARCHAR(100) NOT NULL,          -- BCrypt hash
  user_display_name VARCHAR(128) DEFAULT NULL,
  user_role VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
  user_enabled TINYINT(1) NOT NULL DEFAULT 1,
  user_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY ux_user_username (user_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies (legal entities)
CREATE TABLE companies (
  comp_id BIGINT NOT NULL AUTO_INCREMENT,
  comp_name VARCHAR(255) NOT NULL,
  comp_vat_number VARCHAR(64) DEFAULT NULL,
  comp_website VARCHAR(255) DEFAULT NULL,
  comp_phone VARCHAR(64) DEFAULT NULL,
  comp_industry VARCHAR(128) DEFAULT NULL,
  comp_notes TEXT DEFAULT NULL,
  comp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comp_updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (comp_id),
  KEY idx_comp_name (comp_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Postal codes (lookup)
CREATE TABLE postal_codes (
  pc_id BIGINT NOT NULL AUTO_INCREMENT,
  pc_country_code CHAR(2) NOT NULL DEFAULT 'AT',
  pc_postal_code VARCHAR(32) NOT NULL,
  pc_city VARCHAR(128) NOT NULL,
  pc_state VARCHAR(128) DEFAULT NULL,
  pc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pc_updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (pc_id),
  UNIQUE KEY ux_pc_country_postal_city (pc_country_code, pc_postal_code, pc_city),
  KEY idx_pc_city (pc_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers (main table) - links to postal_codes and companies
CREATE TABLE customers (
  cust_id BIGINT NOT NULL AUTO_INCREMENT,
  cust_nr VARCHAR(64) NOT NULL,
  cust_first_name VARCHAR(128) DEFAULT NULL,
  cust_last_name VARCHAR(128) NOT NULL,
  cust_email VARCHAR(255) DEFAULT NULL,
  cust_phone VARCHAR(64) DEFAULT NULL,
  cust_street VARCHAR(255) DEFAULT NULL,
  cust_house_number VARCHAR(32) DEFAULT NULL,
  cust_postal_code_id BIGINT DEFAULT NULL,
  cust_company_id BIGINT DEFAULT NULL,
  cust_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  cust_notes TEXT DEFAULT NULL,
  cust_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cust_updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cust_id),
  UNIQUE KEY ux_cust_nr (cust_nr),
  KEY idx_cust_email (cust_email),
  KEY idx_cust_postal_code (cust_postal_code_id),
  KEY idx_cust_company (cust_company_id),
  CONSTRAINT fk_cust_postal_code FOREIGN KEY (cust_postal_code_id) REFERENCES postal_codes(pc_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cust_company FOREIGN KEY (cust_company_id) REFERENCES companies(comp_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
