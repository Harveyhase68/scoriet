-- MySQL Database Export
-- Schema: laravel_angular_database
-- Description: No description
-- Version: 1
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Generated: 2026-07-25 07:39:17
-- Table count: 10

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Table: companies
-- ============================================

DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `comp_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_no` BIGINT NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_name` VARCHAR(255) NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_registration_number` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_vat_number` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_website` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_phone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_fax` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_industry` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_size` ENUM('micro','small','medium','large') DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_notes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`comp_id`),
  UNIQUE KEY `ux_comp_no` (`comp_no`),
  KEY `idx_comp_name` (`comp_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"company\",\"fns\":\"com\"}';

-- ============================================
-- Table: countries
-- ============================================

DROP TABLE IF EXISTS `countries`;
CREATE TABLE `countries` (
  `count_id` INT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_iso2` CHAR(2) NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_iso3` CHAR(3) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_name` VARCHAR(128) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_official_name` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_currency_code` CHAR(3) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_currency_name` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_phone_code` VARCHAR(16) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_region` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_subregion` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_eu_member` TINYINT(1) DEFAULT 0 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_default_vat` DECIMAL(5,2) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_timezones` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_address_format` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_display` TEXT GENERATED ALWAYS AS (concat_ws(_utf8mb4' ',`count_iso2`,_utf8mb4'-',`count_name`)) VIRTUAL NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`count_id`),
  UNIQUE KEY `ux_count_iso2` (`count_iso2`),
  UNIQUE KEY `ux_count_iso3` (`count_iso3`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"country\",\"fns\":\"cou\"}';

-- ============================================
-- Table: languages
-- ============================================

DROP TABLE IF EXISTS `languages`;
CREATE TABLE `languages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `code` VARCHAR(5) NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `name` VARCHAR(100) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `native_name` VARCHAR(100) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `flag` VARCHAR(10) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `created_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`id`),
  UNIQUE KEY `languages_code_unique` (`code`),
  KEY `languages_is_active_sort_order_index` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"language\",\"fns\":\"lan\"}';

-- ============================================
-- Table: users
-- ============================================

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `name` VARCHAR(255) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `email` VARCHAR(255) NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `avatar_path` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `language` VARCHAR(5) NOT NULL DEFAULT 'en' COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `email_verified_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `password` VARCHAR(255) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `remember_token` VARCHAR(100) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `created_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `two_factor_secret` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `two_factor_confirmed_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `two_factor_recovery_codes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `two_factor_trusted_devices` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `two_factor_last_verified_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"user\",\"fns\":\"use\"}';

-- ============================================
-- Table: customers
-- ============================================

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `cust_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_no` BIGINT NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_first_name` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_last_name` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_full_name` VARCHAR(255) GENERATED ALWAYS AS (concat_ws(_utf8mb4' ',`cust_first_name`,`cust_last_name`)) VIRTUAL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `comp_no` BIGINT DEFAULT NULL COMMENT '{\"v\":4,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"companies\",\"linkf\":\"comp_no\",\"linkd\":\"comp_no\",\"linko\":\"comp_no\"}',
  `cust_email` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_phone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_mobile` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_website` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_vat_number` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_tax_id` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_legal_form` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_status` ENUM('active','inactive','prospect','lead','archived') DEFAULT 'active' COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_segment` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_source` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_language` CHAR(5) DEFAULT 'en' COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_currency` CHAR(3) DEFAULT 'EUR' COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_credit_limit` DECIMAL(15,2) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_balance` DECIMAL(15,2) DEFAULT 0.00 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_payment_terms` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_marketing_opt_in` TINYINT(1) DEFAULT 0 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_marketing_channel` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_preferred_contact_time` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_notes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`cust_id`),
  UNIQUE KEY `ux_cust_no` (`cust_no`),
  KEY `idx_cust_email` (`cust_email`),
  KEY `idx_cust_company_no` (`comp_no`),
  CONSTRAINT `fk_cust_comp_no` FOREIGN KEY (`comp_no`) REFERENCES `companies` (`comp_no`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"customer\",\"fns\":\"cus\"}';

-- ============================================
-- Table: postal_codes
-- ============================================

DROP TABLE IF EXISTS `postal_codes`;
CREATE TABLE `postal_codes` (
  `pc_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_iso2` VARCHAR(2) NOT NULL COMMENT '{\"v\":4,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"countries\",\"linkf\":\"count_iso2\",\"linkd\":\"count_iso2\",\"linko\":\"count_iso2\"}',
  `pc_postal_code` VARCHAR(32) NOT NULL COMMENT '{\"v\":5,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_city` VARCHAR(128) NOT NULL COMMENT '{\"v\":5,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_state` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_subdivision` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_timezone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_population` INT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_delivery_zone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_postal_format` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_is_active` TINYINT(1) DEFAULT 1 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_valid_from` DATE DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_valid_to` DATE DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_notes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`pc_id`),
  UNIQUE KEY `ux_pc_postal_city` (`pc_postal_code`, `pc_city`),
  KEY `idx_pc_city` (`pc_city`),
  KEY `idx_pc_latlon` (`pc_latitude`, `pc_longitude`),
  KEY `idx_pc_postal_code` (`pc_postal_code`),
  KEY `fk_pc_count_iso2` (`count_iso2`),
  CONSTRAINT `fk_pc_count_iso2` FOREIGN KEY (`count_iso2`) REFERENCES `countries` (`count_iso2`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"postal_code\",\"fns\":\"pc\"}';

-- ============================================
-- Table: addresses
-- ============================================

DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (
  `addr_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_no` BIGINT NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_street` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_house_number` VARCHAR(32) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `pc_postal_code` VARCHAR(32) DEFAULT NULL COMMENT '{\"v\":4,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"postal_codes\",\"linkf\":\"pc_postal_code\",\"linkd\":\"pc_postal_code\",\"linko\":\"pc_postal_code\"}',
  `pc_city` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":4,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"postal_codes\",\"linkf\":\"pc_city\",\"linkd\":\"pc_city\",\"linko\":\"pc_city\"}',
  `pc_state` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `count_iso2` VARCHAR(2) DEFAULT NULL COMMENT '{\"v\":4,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"countries\",\"linkf\":\"count_iso2\",\"linkd\":\"count_iso2\",\"linko\":\"count_iso2\"}',
  `addr_latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_type` ENUM('billing','shipping','home','work','other') DEFAULT 'other' COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_is_primary` TINYINT(1) DEFAULT 0 COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_valid_from` DATE DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_valid_to` DATE DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_full_text` TEXT GENERATED ALWAYS AS (concat_ws(_utf8mb4', ',`addr_street`,`addr_house_number`,`pc_postal_code`,`pc_city`)) VIRTUAL NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`addr_id`),
  UNIQUE KEY `ux_addr_no` (`addr_no`),
  KEY `idx_addr_latlon` (`addr_latitude`, `addr_longitude`),
  KEY `idx_addr_country` (`count_iso2`),
  KEY `fk_addr_pc_postal_code` (`pc_postal_code`, `pc_city`),
  CONSTRAINT `fk_addr_pc_postal_code` FOREIGN KEY (`pc_postal_code`, `pc_city`) REFERENCES `postal_codes` (`pc_postal_code`, `pc_city`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_count_iso2` FOREIGN KEY (`count_iso2`) REFERENCES `countries` (`count_iso2`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"address\",\"fns\":\"add\"}';

-- ============================================
-- Table: contacts
-- ============================================

DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `cont_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_no` BIGINT NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_first_name` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_last_name` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_title` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_role` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_email` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_phone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_mobile` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_preferred_channel` ENUM('email','phone','sms','whatsapp','postal','none') DEFAULT 'email' COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_notes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cont_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `addr_no` BIGINT DEFAULT NULL COMMENT '{\"v\":4,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"addresses\",\"linkf\":\"addr_no\",\"linkd\":\"addr_no\",\"linko\":\"addr_no\"}',
  PRIMARY KEY (`cont_id`),
  UNIQUE KEY `ux_cont_no` (`cont_no`),
  KEY `idx_cont_email` (`cont_email`),
  KEY `fk_cont_addr_no` (`addr_no`),
  CONSTRAINT `fk_cont_addr_no` FOREIGN KEY (`addr_no`) REFERENCES `addresses` (`addr_no`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"contact\",\"fns\":\"con\"}';

-- ============================================
-- Table: customer_addresses
-- ============================================

DROP TABLE IF EXISTS `customer_addresses`;
CREATE TABLE `customer_addresses` (
  `ca_i` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `ca_no` BIGINT NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_no` BIGINT NOT NULL COMMENT '{\"v\":6,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"customers\",\"linkf\":\"cust_no\",\"linkd\":\"cust_no\",\"linko\":\"cust_no\"}',
  `addr_no` BIGINT NOT NULL COMMENT '{\"v\":6,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"addresses\",\"linkf\":\"addr_no\",\"linkd\":\"addr_no\",\"linko\":\"addr_no\"}',
  `ca_addr_type` ENUM('billing & shipping','billing','shipping','home','work','branch','other') NOT NULL DEFAULT 'billing & shipping' COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`ca_i`),
  UNIQUE KEY `ug_ca_cust_no_add_no` (`cust_no`, `addr_no`),
  KEY `idx_addr_cust_no` (`cust_no`),
  KEY `idx_addr_no` (`addr_no`),
  KEY `idx_ca_addr_type` (`ca_addr_type`),
  CONSTRAINT `fk_ca_address_no` FOREIGN KEY (`addr_no`) REFERENCES `addresses` (`addr_no`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_ca_customer_no` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"customer_address\",\"fns\":\"ca\"}';

-- ============================================
-- Table: customer_contacts
-- ============================================

DROP TABLE IF EXISTS `customer_contacts`;
CREATE TABLE `customer_contacts` (
  `cc_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cc_no` BIGINT NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  `cust_no` BIGINT NOT NULL COMMENT '{\"v\":6,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"customers\",\"linkf\":\"cust_no\",\"linkd\":\"cust_no\",\"linko\":\"cust_no\"}',
  `cont_no` BIGINT NOT NULL COMMENT '{\"v\":6,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"contacts\",\"linkf\":\"cont_no\",\"linkd\":\"cont_no\",\"linko\":\"cont_no\"}',
  `cc_cont_is_primary` TINYINT DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`cc_id`),
  UNIQUE KEY `ux_cc_no` (`cc_no`),
  UNIQUE KEY `ug_cc_cust_no_cont_no` (`cust_no`, `cont_no`),
  KEY `idx_cc_cust_no` (`cust_no`),
  KEY `idx_cc_cont_no` (`cont_no`),
  KEY `idx_cc_cont_is_primary` (`cc_cont_is_primary`),
  CONSTRAINT `fk_cc_cont_no` FOREIGN KEY (`cont_no`) REFERENCES `contacts` (`cont_no`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_cc_cust_no` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-07-14\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-07-14\",\"updatedby\":\"scoriet-system\",\"sing\":\"customer_contact\",\"fns\":\"cc\"}';

SET FOREIGN_KEY_CHECKS = 1;

-- Export completed successfully
-- Total tables exported: 10