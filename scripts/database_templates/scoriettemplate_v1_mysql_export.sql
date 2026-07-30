-- MySQL Database Export
-- Schema: scoriettemplate
-- Description: No description
-- Version: 1
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Generated: 2026-07-25 07:10:14
-- Table count: 4

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Table: companies
-- ============================================

DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `comp_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_name` VARCHAR(255) NOT NULL COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_vat_number` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_website` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_phone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_industry` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_notes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `comp_updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`comp_id`),
  KEY `idx_comp_name` (`comp_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\",\"sing\":\"company\",\"fns\":\"com\",\"fs\":\"formset_a\",\"rp\":\"report_set_a\"}';

-- ============================================
-- Table: postal_codes
-- ============================================

DROP TABLE IF EXISTS `postal_codes`;
CREATE TABLE `postal_codes` (
  `pc_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `pc_country_code` CHAR(2) NOT NULL DEFAULT 'AT' COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `pc_postal_code` VARCHAR(32) NOT NULL COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `pc_city` VARCHAR(128) NOT NULL COMMENT '{\"v\":3,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `pc_state` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `pc_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `pc_updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`pc_id`),
  UNIQUE KEY `ux_pc_country_postal_city` (`pc_country_code`, `pc_postal_code`, `pc_city`),
  KEY `idx_pc_city` (`pc_city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\",\"sing\":\"postal_code\",\"fns\":\"pc\"}';

-- ============================================
-- Table: users
-- ============================================

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `user_username` VARCHAR(64) NOT NULL COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `user_password` VARCHAR(100) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `user_display_name` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `user_role` VARCHAR(32) NOT NULL DEFAULT 'ADMIN' COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `user_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `user_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `ux_user_username` (`user_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\",\"sing\":\"user\",\"fns\":\"use\"}';

-- ============================================
-- Table: customers
-- ============================================

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `cust_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_nr` VARCHAR(64) NOT NULL COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_first_name` VARCHAR(128) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_last_name` VARCHAR(128) NOT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_email` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":2,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_phone` VARCHAR(64) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_street` VARCHAR(255) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_house_number` VARCHAR(32) DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_postal_code_id` BIGINT DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"postal_codes\",\"linkf\":\"pc_id\",\"linkd\":\"pc_id\",\"linko\":\"pc_id\"}',
  `cust_company_id` BIGINT DEFAULT NULL COMMENT '{\"v\":3,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\",\"control\":\"COMBOBOX\",\"linkt\":\"companies\",\"linkf\":\"comp_id\",\"linkd\":\"comp_id\",\"linko\":\"comp_id\"}',
  `cust_status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_notes` TEXT DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  `cust_updated_at` TIMESTAMP DEFAULT NULL COMMENT '{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\"}',
  PRIMARY KEY (`cust_id`),
  UNIQUE KEY `ux_cust_nr` (`cust_nr`),
  KEY `idx_cust_email` (`cust_email`),
  KEY `idx_cust_postal_code` (`cust_postal_code_id`),
  KEY `idx_cust_company` (`cust_company_id`),
  CONSTRAINT `fk_cust_company` FOREIGN KEY (`cust_company_id`) REFERENCES `companies` (`comp_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_cust_postal_code` FOREIGN KEY (`cust_postal_code_id`) REFERENCES `postal_codes` (`pc_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{\"v\":1,\"created\":\"2026-06-07\",\"createdby\":\"scoriet-system\",\"updated\":\"2026-06-07\",\"updatedby\":\"scoriet-system\",\"sing\":\"customer\",\"fns\":\"cus\"}';

SET FOREIGN_KEY_CHECKS = 1;

-- Export completed successfully
-- Total tables exported: 4