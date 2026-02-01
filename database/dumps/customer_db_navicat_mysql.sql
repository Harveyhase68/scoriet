/*
 Navicat Premium Data Transfer

 Source Server         : MySQL localhost
 Source Server Type    : MySQL
 Source Server Version : 80407 (8.4.7)
 Source Host           : localhost:3306
 Source Schema         : scoriet_customer_db

 Target Server Type    : MySQL
 Target Server Version : 80407 (8.4.7)
 File Encoding         : 65001

 Date: 27/01/2026 09:17:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for addresses
-- ----------------------------
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses`  (
  `adr_id` bigint NOT NULL AUTO_INCREMENT,
  `adr_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `sal_no` bigint NULL DEFAULT NULL,
  `tit_no` bigint NULL DEFAULT NULL,
  `adr_company` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_company_department` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_first_name` varchar(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_middle_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_last_name` varchar(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_street` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pc_no` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_city` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `count_no` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`adr_id`) USING BTREE,
  UNIQUE INDEX `addresses_adr_uuid_key`(`adr_uuid` ASC) USING BTREE,
  INDEX `addresses_pc_no_ckey`(`pc_no` ASC) USING BTREE,
  INDEX `addresses_sal_no_ckey`(`sal_no` ASC) USING BTREE,
  INDEX `addresses_tit_no_ckey`(`tit_no` ASC) USING BTREE,
  INDEX `addresses_adr_city_ckey`(`adr_city` ASC) USING BTREE,
  INDEX `addresses_count_no_ckey`(`count_no` ASC) USING BTREE,
  CONSTRAINT `addresses_constraint_countries_addresses_fkey` FOREIGN KEY (`count_no`) REFERENCES `countries` (`count_no`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for contact_methods
-- ----------------------------
DROP TABLE IF EXISTS `contact_methods`;
CREATE TABLE `contact_methods`  (
  `cm_id` bigint NOT NULL AUTO_INCREMENT,
  `cm_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `cm_type` tinyint UNSIGNED NULL DEFAULT 1,
  `cm_value` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL,
  `cm_primary` tinyint NULL DEFAULT 1,
  UNIQUE INDEX `contact_methods_cm_uuid_key`(`cm_uuid` ASC) USING BTREE,
  INDEX `contact_methods_cm_id_ckey`(`cm_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for contacts
-- ----------------------------
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts`  (
  `cont_id` bigint NOT NULL AUTO_INCREMENT,
  `cont_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `sal_no` bigint NULL DEFAULT NULL,
  `tit_no` bigint NULL DEFAULT NULL,
  `cont_first_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_middle_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_last_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_position` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_department` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_phone` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_mobile` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_birthday` date NULL DEFAULT NULL,
  `cont_created` date NULL DEFAULT NULL,
  `cont_last_changed` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`cont_id`) USING BTREE,
  UNIQUE INDEX `contacts_cont_uuid_key`(`cont_uuid` ASC) USING BTREE,
  INDEX `contacts_sal_no_ckey`(`sal_no` ASC) USING BTREE,
  INDEX `contacts_tit_no_ckey`(`tit_no` ASC) USING BTREE,
  INDEX `contacts_cont_birthday_ckey`(`cont_birthday` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for countries
-- ----------------------------
DROP TABLE IF EXISTS `countries`;
CREATE TABLE `countries`  (
  `count_id` bigint NOT NULL AUTO_INCREMENT,
  `count_no` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `count_no_iso` varchar(3) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `count_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `count_phone_area_code` varchar(5) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `count_shop_address_type` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL,
  `count_image` longblob NULL,
  `count_image_file_name` varchar(128) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT '',
  PRIMARY KEY (`count_id`) USING BTREE,
  UNIQUE INDEX `countries_count_no_key`(`count_no` ASC) USING BTREE,
  INDEX `countries_count_no_iso_ckey`(`count_no_iso` ASC) USING BTREE,
  INDEX `countries_count_name_ckey`(`count_name` ASC) USING BTREE,
  INDEX `countries_count_phone_area_code_ckey`(`count_phone_area_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 260 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for customer_addresses
-- ----------------------------
DROP TABLE IF EXISTS `customer_addresses`;
CREATE TABLE `customer_addresses`  (
  `ca_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `ca_address_type` tinyint UNSIGNED NULL DEFAULT 1,
  `ca_primary_invoice_address` tinyint NULL DEFAULT 1,
  `ca_primary_delivery_address` tinyint NULL DEFAULT 1,
  UNIQUE INDEX `customer_addresses_ca_address_key_key`(`cust_uuid` ASC, `adr_uuid` ASC) USING BTREE,
  INDEX `customer_addresses_ca_id_ckey`(`ca_id` ASC) USING BTREE,
  INDEX `customer_addresses_cust_uuid_ckey`(`cust_uuid` ASC) USING BTREE,
  INDEX `customer_addresses_adr_uuid_ckey`(`adr_uuid` ASC) USING BTREE,
  CONSTRAINT `customer_addresses_constraint_addresses_customer_addresses_fkey` FOREIGN KEY (`adr_uuid`) REFERENCES `addresses` (`adr_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_addresses_constraint_customers_customer_addresses_fkey` FOREIGN KEY (`cust_uuid`) REFERENCES `customers` (`cust_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for customer_contacts
-- ----------------------------
DROP TABLE IF EXISTS `customer_contacts`;
CREATE TABLE `customer_contacts`  (
  `cc_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cont_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `adr_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cm_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cc_primary_contact` tinyint NULL DEFAULT 1,
  INDEX `customer_contacts_cc_id_ckey`(`cc_id` ASC) USING BTREE,
  INDEX `customer_contacts_cust_uuid_ckey`(`cust_uuid` ASC) USING BTREE,
  INDEX `customer_contacts_cont_uuid_ckey`(`cont_uuid` ASC) USING BTREE,
  INDEX `customer_contacts_adr_uuid_ckey`(`adr_uuid` ASC) USING BTREE,
  INDEX `customer_contacts_cm_uuid_ckey`(`cm_uuid` ASC) USING BTREE,
  CONSTRAINT `customer_contacts_addresses_fkey` FOREIGN KEY (`adr_uuid`) REFERENCES `addresses` (`adr_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_contacts_constraint_contacts_customer_contacts_fkey` FOREIGN KEY (`cont_uuid`) REFERENCES `contacts` (`cont_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_contacts_constraint_customers_customer_contacts_fkey` FOREIGN KEY (`cust_uuid`) REFERENCES `customers` (`cust_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_contacts_contact_methods_fkey` FOREIGN KEY (`cm_uuid`) REFERENCES `contact_methods` (`cm_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for customer_state
-- ----------------------------
DROP TABLE IF EXISTS `customer_state`;
CREATE TABLE `customer_state`  (
  `cst_id` bigint NOT NULL AUTO_INCREMENT,
  `cst_no` bigint NOT NULL DEFAULT 0,
  `cst_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cst_locked` tinyint NULL DEFAULT 0,
  `cst_display_no_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  UNIQUE INDEX `customer_state_cst_no_key`(`cst_no` ASC) USING BTREE,
  INDEX `customer_state_cst_id_ckey`(`cst_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers`  (
  `cust_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `cust_no` int UNSIGNED NOT NULL DEFAULT 0,
  `cst_no` bigint NULL DEFAULT NULL,
  `cust_accounts_receivable_account` int UNSIGNED NULL DEFAULT NULL,
  `cust_composite_no_match_code` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `branch_no` int UNSIGNED NULL DEFAULT NULL,
  `cust_created` date NULL DEFAULT NULL,
  `cust_last_changed` datetime NULL DEFAULT NULL,
  `cust_last_purchase` date NULL DEFAULT NULL,
  `cust_match_code` varchar(40) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cust_price_type` tinyint UNSIGNED NULL DEFAULT NULL,
  `sd_no` int NULL DEFAULT NULL,
  `cust_send_emails` tinyint NULL DEFAULT NULL,
  `cust_invoice_copies` tinyint UNSIGNED NULL DEFAULT NULL,
  `cust_uid` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `cust_text` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL,
  `shop_no` int NULL DEFAULT NULL,
  `lang_no` int NULL DEFAULT NULL,
  PRIMARY KEY (`cust_id`) USING BTREE,
  UNIQUE INDEX `customers_cust_uuid_key`(`cust_uuid` ASC) USING BTREE,
  UNIQUE INDEX `customers_cust_no_key`(`cust_no` ASC) USING BTREE,
  UNIQUE INDEX `customers_cust_accounts_receivable_account_key`(`cust_accounts_receivable_account` ASC) USING BTREE,
  INDEX `customers_cst_no_ckey`(`cst_no` ASC) USING BTREE,
  INDEX `customers_cust_composite_no_match_code_ckey`(`cust_composite_no_match_code` ASC) USING BTREE,
  INDEX `customers_branch_no_ckey`(`branch_no` ASC) USING BTREE,
  INDEX `customers_cust_created_ckey`(`cust_created` ASC) USING BTREE,
  INDEX `customers_cust_last_changed_ckey`(`cust_last_changed` ASC) USING BTREE,
  INDEX `customers_cust_last_purchase_ckey`(`cust_last_purchase` ASC) USING BTREE,
  INDEX `customers_cust_match_code_ckey`(`cust_match_code` ASC) USING BTREE,
  INDEX `customers_sd_no_ckey`(`sd_no` ASC) USING BTREE,
  INDEX `customers_shop_no_ckey`(`shop_no` ASC) USING BTREE,
  INDEX `customers_lang_no_ckey`(`lang_no` ASC) USING BTREE,
  CONSTRAINT `customers_constraint_customer_state_customers_fkey` FOREIGN KEY (`cst_no`) REFERENCES `customer_state` (`cst_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customers_constraint_languages_customers_fkey` FOREIGN KEY (`lang_no`) REFERENCES `languages` (`lang_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customers_constraint_sales_discount_customers_fkey` FOREIGN KEY (`sd_no`) REFERENCES `sales_discount` (`sd_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customers_constraint_shops_customers_fkey` FOREIGN KEY (`shop_no`) REFERENCES `shops` (`shop_no`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for foreign_currencies
-- ----------------------------
DROP TABLE IF EXISTS `foreign_currencies`;
CREATE TABLE `foreign_currencies`  (
  `fc_id` bigint NOT NULL AUTO_INCREMENT,
  `fc_code` varchar(3) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT '',
  `fc_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT '',
  `fc_updated_at` datetime NULL DEFAULT NULL,
  `fc_composite_code_name` varchar(55) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  UNIQUE INDEX `foreign_currencies_fc_code_key`(`fc_code` ASC) USING BTREE,
  INDEX `foreign_currencies_fc_id_ckey`(`fc_id` ASC) USING BTREE,
  INDEX `foreign_currencies_fc_composite_code_name_ckey`(`fc_composite_code_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for languages
-- ----------------------------
DROP TABLE IF EXISTS `languages`;
CREATE TABLE `languages`  (
  `lang_id` bigint NOT NULL AUTO_INCREMENT,
  `lang_no` int NOT NULL DEFAULT 0,
  `lang_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`lang_id`) USING BTREE,
  UNIQUE INDEX `languages_lang_no_key`(`lang_no` ASC) USING BTREE,
  INDEX `languages_lang_name_ckey`(`lang_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for payment_bank_accounts
-- ----------------------------
DROP TABLE IF EXISTS `payment_bank_accounts`;
CREATE TABLE `payment_bank_accounts`  (
  `pba_id` bigint NOT NULL AUTO_INCREMENT,
  `pba_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `pba_bank_name` varchar(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_routing_number` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_account_number` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_iban` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_bic` varchar(12) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_sepa_id` varchar(35) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_is_primary` tinyint NULL DEFAULT 1,
  `fc_code` varchar(3) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  UNIQUE INDEX `payment_bank_accounts_pba_uuid_key`(`pba_uuid` ASC) USING BTREE,
  INDEX `payment_bank_accounts_pba_id_ckey`(`pba_id` ASC) USING BTREE,
  INDEX `payment_bank_accounts_fc_code_ckey`(`fc_code` ASC) USING BTREE,
  CONSTRAINT `payment_bank_accounts_constraint_foreign_currencies_payment0001` FOREIGN KEY (`fc_code`) REFERENCES `foreign_currencies` (`fc_code`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for payment_credit_cards
-- ----------------------------
DROP TABLE IF EXISTS `payment_credit_cards`;
CREATE TABLE `payment_credit_cards`  (
  `pcc_id` bigint NOT NULL AUTO_INCREMENT,
  `pcc_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `pcc_cardholder_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pcc_type` tinyint UNSIGNED NULL DEFAULT 1,
  `pcc_data` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL,
  `pcc_expiry_date` date NULL DEFAULT NULL,
  `pcc_is_primary` tinyint NULL DEFAULT 1,
  `pcc_created_at` date NULL DEFAULT NULL,
  `pcc_updated_at` date NULL DEFAULT NULL,
  UNIQUE INDEX `payment_credit_cards_pcc_uuid_key`(`pcc_uuid` ASC) USING BTREE,
  INDEX `payment_credit_cards_pcc_id_ckey`(`pcc_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for payment_methods
-- ----------------------------
DROP TABLE IF EXISTS `payment_methods`;
CREATE TABLE `payment_methods`  (
  `pm_id` bigint NOT NULL AUTO_INCREMENT,
  `pm_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `cust_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pba_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pcc_uuid` varchar(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pm_type` tinyint UNSIGNED NULL DEFAULT 0,
  `pm_email` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `lang_no` int NULL DEFAULT NULL,
  `fc_code` varchar(3) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pm_is_default` tinyint NOT NULL DEFAULT 1,
  UNIQUE INDEX `payment_methods_pm_uuid_key`(`pm_uuid` ASC) USING BTREE,
  UNIQUE INDEX `payment_methods_pm_key_key`(`pm_uuid` ASC, `cust_uuid` ASC) USING BTREE,
  INDEX `payment_methods_pm_id_ckey`(`pm_id` ASC) USING BTREE,
  INDEX `payment_methods_cust_uuid_ckey`(`cust_uuid` ASC) USING BTREE,
  INDEX `payment_methods_pba_uuid_ckey`(`pba_uuid` ASC) USING BTREE,
  INDEX `payment_methods_pcc_uuid_ckey`(`pcc_uuid` ASC) USING BTREE,
  INDEX `payment_methods_pm_type_ckey`(`pm_type` ASC) USING BTREE,
  INDEX `payment_methods_lang_no_ckey`(`lang_no` ASC) USING BTREE,
  INDEX `payment_methods_fc_code_ckey`(`fc_code` ASC) USING BTREE,
  CONSTRAINT `payment_methods_constraint_customers_payment_methods_fkey` FOREIGN KEY (`cust_uuid`) REFERENCES `customers` (`cust_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_foreign_currencies_payment_metho0004` FOREIGN KEY (`fc_code`) REFERENCES `foreign_currencies` (`fc_code`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_languages_payment_methods_fkey` FOREIGN KEY (`lang_no`) REFERENCES `languages` (`lang_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_payment_bank_accounts_payment_me0002` FOREIGN KEY (`pba_uuid`) REFERENCES `payment_bank_accounts` (`pba_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_payment_credit_cards_payment_met0003` FOREIGN KEY (`pcc_uuid`) REFERENCES `payment_credit_cards` (`pcc_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for post_codes
-- ----------------------------
DROP TABLE IF EXISTS `post_codes`;
CREATE TABLE `post_codes`  (
  `pc_id` bigint NOT NULL AUTO_INCREMENT,
  `pc_no` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `pc_city` varchar(80) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `count_no` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`pc_id`) USING BTREE,
  UNIQUE INDEX `post_codes_pc_key_key`(`pc_no` ASC, `pc_city` ASC) USING BTREE,
  INDEX `post_codes_pc_no_ckey`(`pc_no` ASC) USING BTREE,
  INDEX `post_codes_pc_city_ckey`(`pc_city` ASC) USING BTREE,
  INDEX `post_codes_count_no_ckey`(`count_no` ASC) USING BTREE,
  CONSTRAINT `post_codes_countries_fkey` FOREIGN KEY (`count_no`) REFERENCES `countries` (`count_no`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sales_discount
-- ----------------------------
DROP TABLE IF EXISTS `sales_discount`;
CREATE TABLE `sales_discount`  (
  `sd_id` bigint NOT NULL AUTO_INCREMENT,
  `sd_no` int NOT NULL DEFAULT 0,
  `sd_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `sd_discount_percent` double NOT NULL DEFAULT 0,
  `sd_discount_payment_terms` int UNSIGNED NULL DEFAULT 7,
  `sd_net_payment_terms` int UNSIGNED NULL DEFAULT 14,
  PRIMARY KEY (`sd_id`) USING BTREE,
  UNIQUE INDEX `sales_discount_sd_no_key`(`sd_no` ASC) USING BTREE,
  INDEX `sales_discount_sd_name_ckey`(`sd_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for salutations
-- ----------------------------
DROP TABLE IF EXISTS `salutations`;
CREATE TABLE `salutations`  (
  `sal_id` bigint NOT NULL AUTO_INCREMENT,
  `sal_no` bigint NOT NULL,
  `sal_name` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `sal_letter_salutation` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`sal_id`) USING BTREE,
  UNIQUE INDEX `salutations_sal_no_key`(`sal_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for shops
-- ----------------------------
DROP TABLE IF EXISTS `shops`;
CREATE TABLE `shops`  (
  `shop_id` bigint NOT NULL AUTO_INCREMENT,
  `shop_no` int NOT NULL DEFAULT 0,
  `shop_name` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`shop_id`) USING BTREE,
  UNIQUE INDEX `shops_shop_no_key`(`shop_no` ASC) USING BTREE,
  INDEX `shops_shop_name_ckey`(`shop_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for titles
-- ----------------------------
DROP TABLE IF EXISTS `titles`;
CREATE TABLE `titles`  (
  `tit_id` bigint NOT NULL AUTO_INCREMENT,
  `tit_no` bigint NOT NULL,
  `tit_name` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`tit_id`) USING BTREE,
  UNIQUE INDEX `titles_tit_no_key`(`tit_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `first_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `last_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role` enum('admin','user','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'user',
  `reset_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reset_token_expires` datetime NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` datetime NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `users_username_key`(`username` ASC) USING BTREE,
  UNIQUE INDEX `users_email_key`(`email` ASC) USING BTREE,
  INDEX `users_reset_token_key`(`reset_token` ASC) USING BTREE,
  INDEX `users_is_active_key`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
