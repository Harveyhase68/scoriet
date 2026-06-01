-- Customer / Address Database Schema for MySQL
-- Charset and engine
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables (order matters for FKs)
DROP TABLE IF EXISTS communications;
DROP TABLE IF EXISTS mail_templates;
DROP TABLE IF EXISTS crm_notes;
DROP TABLE IF EXISTS comm_social_links;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS postal_codes;

-- Countries (reference)
CREATE TABLE countries (
  count_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  count_iso2 CHAR(2) NOT NULL,
  count_iso3 CHAR(3) DEFAULT NULL,
  count_name VARCHAR(128) NOT NULL,
  count_official_name VARCHAR(255) DEFAULT NULL,
  count_currency_code CHAR(3) DEFAULT NULL,
  count_currency_name VARCHAR(64) DEFAULT NULL,
  count_phone_code VARCHAR(16) DEFAULT NULL,
  count_region VARCHAR(64) DEFAULT NULL,
  count_subregion VARCHAR(64) DEFAULT NULL,
  count_eu_member TINYINT(1) DEFAULT 0,
  count_default_vat DECIMAL(5,2) DEFAULT NULL,
  count_timezones VARCHAR(255) DEFAULT NULL,
  count_address_format TEXT DEFAULT NULL,
  PRIMARY KEY (count_id),
  UNIQUE KEY ux_count_iso2 (count_iso2),
  UNIQUE KEY ux_count_iso3 (count_iso3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addresses (normalized)
CREATE TABLE addresses (
  addr_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  addr_street VARCHAR(255) DEFAULT NULL,
  addr_house_number VARCHAR(32) DEFAULT NULL,
  addr_po_box VARCHAR(64) DEFAULT NULL,
  addr_postal_code VARCHAR(32) DEFAULT NULL,
  addr_city VARCHAR(128) DEFAULT NULL,
  addr_state VARCHAR(128) DEFAULT NULL,
  addr_country_id INT UNSIGNED DEFAULT NULL,
  addr_latitude DECIMAL(10,7) DEFAULT NULL,
  addr_longitude DECIMAL(10,7) DEFAULT NULL,
  addr_type ENUM('billing','shipping','home','work','other') DEFAULT 'other',
  addr_is_primary TINYINT(1) DEFAULT 0,
  addr_valid_from DATE DEFAULT NULL,
  addr_valid_to DATE DEFAULT NULL,
  addr_full_text TEXT GENERATED ALWAYS AS (
    CONCAT_WS(', ', addr_street, addr_house_number, addr_postal_code, addr_city)
  ) VIRTUAL,
  PRIMARY KEY (addr_id),
  KEY idx_addr_country (addr_country_id),
  KEY idx_addr_postal_city (addr_postal_code, addr_city),
  CONSTRAINT fk_addr_country FOREIGN KEY (addr_country_id) REFERENCES countries(count_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies (legal entities)
CREATE TABLE companies (
  comp_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  comp_name VARCHAR(255) NOT NULL,
  comp_registration_number VARCHAR(128) DEFAULT NULL,
  comp_vat_number VARCHAR(64) DEFAULT NULL,
  comp_website VARCHAR(255) DEFAULT NULL,
  comp_phone VARCHAR(64) DEFAULT NULL,
  comp_fax VARCHAR(64) DEFAULT NULL,
  comp_address_id BIGINT UNSIGNED DEFAULT NULL,
  comp_industry VARCHAR(128) DEFAULT NULL,
  comp_size ENUM('micro','small','medium','large') DEFAULT NULL,
  comp_notes TEXT DEFAULT NULL,
  comp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comp_updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (comp_id),
  KEY idx_comp_name (comp_name),
  CONSTRAINT fk_comp_address FOREIGN KEY (comp_address_id) REFERENCES addresses(addr_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts (people related to customers or companies)
CREATE TABLE contacts (
  cont_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cont_cust_id BIGINT UNSIGNED DEFAULT NULL,
  cont_comp_id BIGINT UNSIGNED DEFAULT NULL,
  cont_first_name VARCHAR(128) DEFAULT NULL,
  cont_last_name VARCHAR(128) DEFAULT NULL,
  cont_title VARCHAR(64) DEFAULT NULL,
  cont_role VARCHAR(128) DEFAULT NULL,
  cont_email VARCHAR(255) DEFAULT NULL,
  cont_phone VARCHAR(64) DEFAULT NULL,
  cont_mobile VARCHAR(64) DEFAULT NULL,
  cont_address_id BIGINT UNSIGNED DEFAULT NULL,
  cont_preferred_channel ENUM('email','phone','sms','whatsapp','postal','none') DEFAULT 'email',
  cont_is_primary TINYINT(1) DEFAULT 0,
  cont_notes TEXT DEFAULT NULL,
  cont_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cont_id),
  KEY idx_cont_email (cont_email),
  KEY idx_cont_cust (cont_cust_id),
  KEY idx_cont_comp (cont_comp_id),
  CONSTRAINT fk_cont_address FOREIGN KEY (cont_address_id) REFERENCES addresses(addr_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cont_cust FOREIGN KEY (cont_cust_id) REFERENCES customers(cust_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cont_comp FOREIGN KEY (cont_comp_id) REFERENCES companies(comp_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers (main table)
CREATE TABLE customers (
  cust_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cust_nr VARCHAR(64) NOT NULL, -- external customer number
  cust_first_name VARCHAR(128) DEFAULT NULL,
  cust_last_name VARCHAR(128) DEFAULT NULL,
  cust_full_name VARCHAR(255) GENERATED ALWAYS AS (CONCAT_WS(' ', cust_first_name, cust_last_name)) VIRTUAL,
  cust_company_id BIGINT UNSIGNED DEFAULT NULL,
  cust_primary_address_id BIGINT UNSIGNED DEFAULT NULL,
  cust_billing_address_id BIGINT UNSIGNED DEFAULT NULL,
  cust_email VARCHAR(255) DEFAULT NULL,
  cust_phone VARCHAR(64) DEFAULT NULL,
  cust_mobile VARCHAR(64) DEFAULT NULL,
  cust_website VARCHAR(255) DEFAULT NULL,
  cust_vat_number VARCHAR(64) DEFAULT NULL,
  cust_tax_id VARCHAR(64) DEFAULT NULL,
  cust_legal_form VARCHAR(64) DEFAULT NULL,
  cust_status ENUM('active','inactive','prospect','lead','archived') DEFAULT 'active',
  cust_segment VARCHAR(64) DEFAULT NULL,
  cust_source VARCHAR(64) DEFAULT NULL,
  cust_language CHAR(5) DEFAULT 'en',
  cust_currency CHAR(3) DEFAULT 'EUR',
  cust_credit_limit DECIMAL(15,2) DEFAULT NULL,
  cust_balance DECIMAL(15,2) DEFAULT 0.00,
  cust_payment_terms VARCHAR(64) DEFAULT NULL,
  cust_marketing_opt_in TINYINT(1) DEFAULT 0,
  cust_marketing_channel VARCHAR(64) DEFAULT NULL,
  cust_preferred_contact_time VARCHAR(64) DEFAULT NULL,
  cust_notes TEXT DEFAULT NULL,
  cust_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cust_updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cust_id),
  UNIQUE KEY ux_cust_nr (cust_nr),
  KEY idx_cust_email (cust_email),
  KEY idx_cust_company (cust_company_id),
  CONSTRAINT fk_cust_company FOREIGN KEY (cust_company_id) REFERENCES companies(comp_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cust_primary_addr FOREIGN KEY (cust_primary_address_id) REFERENCES addresses(addr_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cust_billing_addr FOREIGN KEY (cust_billing_address_id) REFERENCES addresses(addr_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accounts (ERP / financial accounts linked to customers)
CREATE TABLE accounts (
  acct_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  acct_cust_id BIGINT UNSIGNED NOT NULL,
  acct_number VARCHAR(64) NOT NULL,
  acct_type ENUM('receivable','payable','prepaid','other') DEFAULT 'receivable',
  acct_currency CHAR(3) DEFAULT 'EUR',
  acct_open_date DATE DEFAULT NULL,
  acct_close_date DATE DEFAULT NULL,
  acct_status ENUM('open','closed','suspended') DEFAULT 'open',
  acct_notes TEXT DEFAULT NULL,
  PRIMARY KEY (acct_id),
  UNIQUE KEY ux_acct_number (acct_number),
  KEY idx_acct_cust (acct_cust_id),
  CONSTRAINT fk_acct_cust FOREIGN KEY (acct_cust_id) REFERENCES customers(cust_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders (basic ERP order header)
CREATE TABLE orders (
  ord_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ord_cust_id BIGINT UNSIGNED NOT NULL,
  ord_account_id BIGINT UNSIGNED DEFAULT NULL,
  ord_nr VARCHAR(64) NOT NULL,
  ord_status ENUM('draft','confirmed','shipped','invoiced','paid','cancelled') DEFAULT 'draft',
  ord_total DECIMAL(15,2) DEFAULT 0.00,
  ord_currency CHAR(3) DEFAULT 'EUR',
  ord_order_date DATE DEFAULT NULL,
  ord_delivery_date DATE DEFAULT NULL,
  ord_billing_address_id BIGINT UNSIGNED DEFAULT NULL,
  ord_shipping_address_id BIGINT UNSIGNED DEFAULT NULL,
  ord_notes TEXT DEFAULT NULL,
  PRIMARY KEY (ord_id),
  UNIQUE KEY ux_ord_nr (ord_nr),
  KEY idx_ord_cust (ord_cust_id),
  CONSTRAINT fk_ord_cust FOREIGN KEY (ord_cust_id) REFERENCES customers(cust_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ord_account FOREIGN KEY (ord_account_id) REFERENCES accounts(acct_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ord_bill_addr FOREIGN KEY (ord_billing_address_id) REFERENCES addresses(addr_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ord_ship_addr FOREIGN KEY (ord_shipping_address_id) REFERENCES addresses(addr_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CRM notes / interactions
CREATE TABLE crm_notes (
  crm_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  crm_cust_id BIGINT UNSIGNED DEFAULT NULL,
  crm_contact_id BIGINT UNSIGNED DEFAULT NULL,
  crm_user_id INT DEFAULT NULL,
  crm_type ENUM('call','email','meeting','note','task') DEFAULT 'note',
  crm_subject VARCHAR(255) DEFAULT NULL,
  crm_body TEXT DEFAULT NULL,
  crm_outcome VARCHAR(128) DEFAULT NULL,
  crm_next_action VARCHAR(255) DEFAULT NULL,
  crm_due_date DATE DEFAULT NULL,
  crm_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (crm_id),
  KEY idx_crm_cust (crm_cust_id),
  KEY idx_crm_contact (crm_contact_id),
  CONSTRAINT fk_crm_cust FOREIGN KEY (crm_cust_id) REFERENCES customers(cust_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_crm_contact FOREIGN KEY (crm_contact_id) REFERENCES contacts(cont_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Communications (mailing, channels, logs)
CREATE TABLE communications (
  comm_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  comm_cust_id BIGINT UNSIGNED DEFAULT NULL,
  comm_contact_id BIGINT UNSIGNED DEFAULT NULL,
  comm_channel ENUM('email','postal','sms','phone','fax','push','social') DEFAULT 'email',
  comm_direction ENUM('outbound','inbound') DEFAULT 'outbound',
  comm_subject VARCHAR(255) DEFAULT NULL,
  comm_body TEXT DEFAULT NULL,
  comm_template_id BIGINT UNSIGNED DEFAULT NULL,
  comm_sent_at TIMESTAMP NULL DEFAULT NULL,
  comm_received_at TIMESTAMP NULL DEFAULT NULL,
  comm_status ENUM('queued','sent','delivered','bounced','failed','opened') DEFAULT 'queued',
  comm_tracking_id VARCHAR(255) DEFAULT NULL,
  comm_mail_merge_data JSON DEFAULT NULL,
  PRIMARY KEY (comm_id),
  KEY idx_comm_cust (comm_cust_id),
  KEY idx_comm_contact (comm_contact_id),
  CONSTRAINT fk_comm_cust FOREIGN KEY (comm_cust_id) REFERENCES customers(cust_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comm_contact FOREIGN KEY (comm_contact_id) REFERENCES contacts(cont_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mail templates (for mailing / marketing)
CREATE TABLE mail_templates (
  mail_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mail_name VARCHAR(255) NOT NULL,
  mail_subject VARCHAR(255) DEFAULT NULL,
  mail_body TEXT DEFAULT NULL,
  mail_html MEDIUMTEXT DEFAULT NULL,
  mail_language CHAR(5) DEFAULT 'en',
  mail_channel ENUM('email','sms','postal','push') DEFAULT 'email',
  mail_is_active TINYINT(1) DEFAULT 1,
  mail_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mail_id),
  UNIQUE KEY ux_mail_name_lang (mail_name, mail_language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Simple social links table (links for companies/customers)
CREATE TABLE comm_social_links (
  social_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  social_entity_type ENUM('customer','company','contact') NOT NULL,
  social_entity_id BIGINT UNSIGNED NOT NULL,
  social_platform VARCHAR(64) NOT NULL,
  social_url VARCHAR(512) DEFAULT NULL,
  PRIMARY KEY (social_id),
  KEY idx_social_entity (social_entity_type, social_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example triggers (audit)
DROP TABLE IF EXISTS audit_changes;
CREATE TABLE audit_changes (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  audit_table VARCHAR(128) NOT NULL,
  audit_action VARCHAR(16) NOT NULL,
  audit_row_id VARCHAR(64) DEFAULT NULL,
  audit_user VARCHAR(128) DEFAULT NULL,
  audit_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  audit_data JSON DEFAULT NULL,
  PRIMARY KEY (audit_id),
  KEY idx_audit_table (audit_table)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger example: log customer updates
DROP TRIGGER IF EXISTS trg_cust_update;
DELIMITER $$
CREATE TRIGGER trg_cust_update
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
  INSERT INTO audit_changes (audit_table, audit_action, audit_row_id, audit_user, audit_data)
  VALUES ('customers', 'update', NEW.cust_id, USER(), JSON_OBJECT('old', CONCAT(OLD.cust_first_name,' ',OLD.cust_last_name), 'new', CONCAT(NEW.cust_first_name,' ',NEW.cust_last_name)));
END$$
DELIMITER ;

-- Helpful sample indexes for performance
CREATE INDEX idx_addr_latlon ON addresses (addr_latitude, addr_longitude);
CREATE INDEX idx_ord_status_date ON orders (ord_status, ord_order_date);

CREATE TABLE postal_codes (
  pc_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pc_country_id INT UNSIGNED NOT NULL,            -- FK to countries.count_id
  pc_postal_code VARCHAR(32) NOT NULL,            -- postal / ZIP code
  pc_city VARCHAR(128) NOT NULL,                  -- city / locality name
  pc_state VARCHAR(128) DEFAULT NULL,             -- state / region / province
  pc_subdivision VARCHAR(128) DEFAULT NULL,       -- optional smaller subdivision (district, borough)
  pc_latitude DECIMAL(10,7) DEFAULT NULL,        -- geocoding latitude
  pc_longitude DECIMAL(10,7) DEFAULT NULL,       -- geocoding longitude
  pc_timezone VARCHAR(64) DEFAULT NULL,          -- timezone id (e.g., Europe/Vienna)
  pc_population INT DEFAULT NULL,                 -- approximate population (if available)
  pc_delivery_zone VARCHAR(64) DEFAULT NULL,     -- delivery zone code for logistics
  pc_postal_format VARCHAR(255) DEFAULT NULL,    -- regex or format hint for validation
  pc_is_active TINYINT(1) DEFAULT 1,             -- active / deprecated
  pc_valid_from DATE DEFAULT NULL,               -- validity window start
  pc_valid_to DATE DEFAULT NULL,                 -- validity window end (deprecated)
  pc_notes TEXT DEFAULT NULL,                    -- free text notes (e.g., multiple localities)
  pc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pc_updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (pc_id),
  UNIQUE KEY ux_pc_country_postal_city (pc_country_id, pc_postal_code, pc_city),
  KEY idx_pc_country_postal (pc_country_id, pc_postal_code),
  KEY idx_pc_city (pc_city),
  KEY idx_pc_latlon (pc_latitude, pc_longitude),
  CONSTRAINT fk_pc_country FOREIGN KEY (pc_country_id) REFERENCES countries(count_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example sample rows (replace or bulk-import real dataset)
INSERT INTO postal_codes
  (pc_country_id, pc_postal_code, pc_city, pc_state, pc_latitude, pc_longitude, pc_timezone, pc_delivery_zone, pc_postal_format, pc_notes)
VALUES
  -- Austria examples
  ( (SELECT count_id FROM countries WHERE count_iso2 = 'AT' LIMIT 1), '1010', 'Vienna', 'Vienna', 48.2081743, 16.3738189, 'Europe/Vienna', 'AT-VIE-01', '^\d{4}$', 'Innere Stadt; central business district' ),
  ( (SELECT count_id FROM countries WHERE count_iso2 = 'AT' LIMIT 1), '1220', 'Vienna', 'Vienna', 48.226, 16.423, 'Europe/Vienna', 'AT-VIE-22', '^\d{4}$', 'Donaustadt' ),
  ( (SELECT count_id FROM countries WHERE count_iso2 = 'AT' LIMIT 1), '3100', 'St. Poelten', 'Lower Austria', 48.203, 15.626, 'Europe/Vienna', 'AT-STP-01', '^\d{4}$', 'Regional center' ),

  -- Germany example
  ( (SELECT count_id FROM countries WHERE count_iso2 = 'DE' LIMIT 1), '10115', 'Berlin', 'Berlin', 52.532, 13.384, 'Europe/Berlin', 'DE-BER-01', '^\d{5}$', 'Central Berlin postal area' );

-- Helpful indexes for fast lookup by postal code or by geolocation
CREATE INDEX idx_pc_postal_code ON postal_codes (pc_postal_code);
CREATE INDEX idx_pc_country_city ON postal_codes (pc_country_id, pc_city);

-- Fulltext indexes for search (MySQL 5.7+/8.0)
ALTER TABLE companies ADD FULLTEXT KEY ft_comp_name (comp_name);
ALTER TABLE crm_notes ADD FULLTEXT KEY ft_crm_body (crm_subject, crm_body);

SET FOREIGN_KEY_CHECKS = 1;