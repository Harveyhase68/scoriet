-- MySQL Database Export
-- Schema: laravel_react_database
-- Description: Laravel React Database
-- Version: 1
-- Generated: 2026-03-12 08:23:07
-- Table count: 4

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- Table: password_reset_tokens
-- ============================================

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: prod_groups
-- ============================================

DROP TABLE IF EXISTS `prod_groups`;
CREATE TABLE `prod_groups` (
  `prodg_id` BIGINT NOT NULL AUTO_INCREMENT,
  `prodg_no` BIGINT NOT NULL,
  `prodg_name` VARCHAR(50),
  `prodg_composite_no_name` VARCHAR(56),
  PRIMARY KEY (`prodg_id`),
  UNIQUE KEY `prodg_no_unique` (`prodg_no`),
  KEY `prodg_composite_no_name` (`prodg_composite_no_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: users
-- ============================================

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP,
  `password` VARCHAR(255) NOT NULL,
  `preferred_language` VARCHAR(5) NOT NULL DEFAULT 'en',
  `remember_token` VARCHAR(100),
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  CONSTRAINT `fk_users_email` FOREIGN KEY (`email`) REFERENCES `password_reset_tokens` (`email`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: products
-- ============================================

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `prod_id` BIGINT NOT NULL AUTO_INCREMENT,
  `prod_no` string NOT NULL,
  `prodg_no` BIGINT NOT NULL,
  `prod_name` VARCHAR(50) NOT NULL,
  `prod_description` MEDIUMTEXT,
  `prod_created` TIMESTAMP,
  `prod_special_offer` TINYINT,
  `prod_special_offer_expire` DATE,
  `prod_image` MEDIUMBLOB,
  PRIMARY KEY (`prod_id`),
  UNIQUE KEY `prod_no_unique` (`prod_no`),
  KEY `prod_groups_index` (`prodg_no`),
  CONSTRAINT `fk_products_prodg_no` FOREIGN KEY (`prodg_no`) REFERENCES `prod_groups` (`prodg_no`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Export completed successfully
-- Total tables exported: 4