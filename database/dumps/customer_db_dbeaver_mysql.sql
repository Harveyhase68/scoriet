-- MySQL dump 10.13  Distrib 8.4.7, for Win64 (x86_64)
--
-- Host: localhost    Database: scoriet_customer_db
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `adr_id` bigint NOT NULL AUTO_INCREMENT,
  `adr_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `sal_no` bigint DEFAULT NULL,
  `tit_no` bigint DEFAULT NULL,
  `adr_company` varchar(50) DEFAULT NULL,
  `adr_company_department` varchar(50) DEFAULT NULL,
  `adr_first_name` varchar(40) DEFAULT NULL,
  `adr_middle_name` varchar(50) DEFAULT NULL,
  `adr_last_name` varchar(40) DEFAULT NULL,
  `adr_street` varchar(50) DEFAULT NULL,
  `pc_no` varchar(20) DEFAULT NULL,
  `adr_city` varchar(50) DEFAULT NULL,
  `count_no` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`adr_id`),
  UNIQUE KEY `addresses_adr_uuid_key` (`adr_uuid`),
  KEY `addresses_pc_no_ckey` (`pc_no`),
  KEY `addresses_sal_no_ckey` (`sal_no`),
  KEY `addresses_tit_no_ckey` (`tit_no`),
  KEY `addresses_adr_city_ckey` (`adr_city`),
  KEY `addresses_count_no_ckey` (`count_no`),
  CONSTRAINT `addresses_constraint_countries_addresses_fkey` FOREIGN KEY (`count_no`) REFERENCES `countries` (`count_no`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contact_methods`
--

DROP TABLE IF EXISTS `contact_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_methods` (
  `cm_id` bigint NOT NULL AUTO_INCREMENT,
  `cm_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `cm_type` tinyint unsigned DEFAULT '1',
  `cm_value` longtext,
  `cm_primary` tinyint DEFAULT '1',
  UNIQUE KEY `contact_methods_cm_uuid_key` (`cm_uuid`),
  KEY `contact_methods_cm_id_ckey` (`cm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `cont_id` bigint NOT NULL AUTO_INCREMENT,
  `cont_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `sal_no` bigint DEFAULT NULL,
  `tit_no` bigint DEFAULT NULL,
  `cont_first_name` varchar(50) DEFAULT NULL,
  `cont_middle_name` varchar(50) DEFAULT NULL,
  `cont_last_name` varchar(50) DEFAULT NULL,
  `cont_position` varchar(100) DEFAULT NULL,
  `cont_department` varchar(100) DEFAULT NULL,
  `cont_phone` varchar(50) DEFAULT NULL,
  `cont_mobile` varchar(50) DEFAULT NULL,
  `cont_email` varchar(255) DEFAULT NULL,
  `cont_birthday` date DEFAULT NULL,
  `cont_created` date DEFAULT NULL,
  `cont_last_changed` datetime DEFAULT NULL,
  PRIMARY KEY (`cont_id`),
  UNIQUE KEY `contacts_cont_uuid_key` (`cont_uuid`),
  KEY `contacts_sal_no_ckey` (`sal_no`),
  KEY `contacts_tit_no_ckey` (`tit_no`),
  KEY `contacts_cont_birthday_ckey` (`cont_birthday`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries` (
  `count_id` bigint NOT NULL AUTO_INCREMENT,
  `count_no` varchar(2) DEFAULT NULL,
  `count_no_iso` varchar(3) DEFAULT NULL,
  `count_name` varchar(100) DEFAULT NULL,
  `count_phone_area_code` varchar(5) DEFAULT NULL,
  `count_shop_address_type` longtext,
  `count_image` longblob,
  `count_image_file_name` varchar(128) DEFAULT '',
  PRIMARY KEY (`count_id`),
  UNIQUE KEY `countries_count_no_key` (`count_no`),
  KEY `countries_count_no_iso_ckey` (`count_no_iso`),
  KEY `countries_count_name_ckey` (`count_name`),
  KEY `countries_count_phone_area_code_ckey` (`count_phone_area_code`)
) ENGINE=InnoDB AUTO_INCREMENT=260 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `ca_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_uuid` varchar(36) DEFAULT NULL,
  `adr_uuid` varchar(36) DEFAULT NULL,
  `ca_address_type` tinyint unsigned DEFAULT '1',
  `ca_primary_invoice_address` tinyint DEFAULT '1',
  `ca_primary_delivery_address` tinyint DEFAULT '1',
  UNIQUE KEY `customer_addresses_ca_address_key_key` (`cust_uuid`,`adr_uuid`),
  KEY `customer_addresses_ca_id_ckey` (`ca_id`),
  KEY `customer_addresses_cust_uuid_ckey` (`cust_uuid`),
  KEY `customer_addresses_adr_uuid_ckey` (`adr_uuid`),
  CONSTRAINT `customer_addresses_constraint_addresses_customer_addresses_fkey` FOREIGN KEY (`adr_uuid`) REFERENCES `addresses` (`adr_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_addresses_constraint_customers_customer_addresses_fkey` FOREIGN KEY (`cust_uuid`) REFERENCES `customers` (`cust_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_contacts`
--

DROP TABLE IF EXISTS `customer_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_contacts` (
  `cc_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_uuid` varchar(36) DEFAULT NULL,
  `cont_uuid` varchar(36) DEFAULT NULL,
  `adr_uuid` varchar(36) DEFAULT NULL,
  `cm_uuid` varchar(36) DEFAULT NULL,
  `cc_primary_contact` tinyint DEFAULT '1',
  KEY `customer_contacts_cc_id_ckey` (`cc_id`),
  KEY `customer_contacts_cust_uuid_ckey` (`cust_uuid`),
  KEY `customer_contacts_cont_uuid_ckey` (`cont_uuid`),
  KEY `customer_contacts_adr_uuid_ckey` (`adr_uuid`),
  KEY `customer_contacts_cm_uuid_ckey` (`cm_uuid`),
  CONSTRAINT `customer_contacts_addresses_fkey` FOREIGN KEY (`adr_uuid`) REFERENCES `addresses` (`adr_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_contacts_constraint_contacts_customer_contacts_fkey` FOREIGN KEY (`cont_uuid`) REFERENCES `contacts` (`cont_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_contacts_constraint_customers_customer_contacts_fkey` FOREIGN KEY (`cust_uuid`) REFERENCES `customers` (`cust_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customer_contacts_contact_methods_fkey` FOREIGN KEY (`cm_uuid`) REFERENCES `contact_methods` (`cm_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_state`
--

DROP TABLE IF EXISTS `customer_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_state` (
  `cst_id` bigint NOT NULL AUTO_INCREMENT,
  `cst_no` bigint NOT NULL DEFAULT '0',
  `cst_name` varchar(50) DEFAULT NULL,
  `cst_locked` tinyint DEFAULT '0',
  `cst_display_no_name` varchar(50) DEFAULT NULL,
  UNIQUE KEY `customer_state_cst_no_key` (`cst_no`),
  KEY `customer_state_cst_id_ckey` (`cst_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `cust_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `cust_no` int unsigned NOT NULL DEFAULT '0',
  `cst_no` bigint DEFAULT NULL,
  `cust_accounts_receivable_account` int unsigned DEFAULT NULL,
  `cust_composite_no_match_code` varchar(50) DEFAULT NULL,
  `branch_no` int unsigned DEFAULT NULL,
  `cust_created` date DEFAULT NULL,
  `cust_last_changed` datetime DEFAULT NULL,
  `cust_last_purchase` date DEFAULT NULL,
  `cust_match_code` varchar(40) DEFAULT NULL,
  `cust_price_type` tinyint unsigned DEFAULT NULL,
  `sd_no` int DEFAULT NULL,
  `cust_send_emails` tinyint DEFAULT NULL,
  `cust_invoice_copies` tinyint unsigned DEFAULT NULL,
  `cust_uid` varchar(20) DEFAULT NULL,
  `cust_text` longtext,
  `shop_no` int DEFAULT NULL,
  `lang_no` int DEFAULT NULL,
  PRIMARY KEY (`cust_id`),
  UNIQUE KEY `customers_cust_uuid_key` (`cust_uuid`),
  UNIQUE KEY `customers_cust_no_key` (`cust_no`),
  UNIQUE KEY `customers_cust_accounts_receivable_account_key` (`cust_accounts_receivable_account`),
  KEY `customers_cst_no_ckey` (`cst_no`),
  KEY `customers_cust_composite_no_match_code_ckey` (`cust_composite_no_match_code`),
  KEY `customers_branch_no_ckey` (`branch_no`),
  KEY `customers_cust_created_ckey` (`cust_created`),
  KEY `customers_cust_last_changed_ckey` (`cust_last_changed`),
  KEY `customers_cust_last_purchase_ckey` (`cust_last_purchase`),
  KEY `customers_cust_match_code_ckey` (`cust_match_code`),
  KEY `customers_sd_no_ckey` (`sd_no`),
  KEY `customers_shop_no_ckey` (`shop_no`),
  KEY `customers_lang_no_ckey` (`lang_no`),
  CONSTRAINT `customers_constraint_customer_state_customers_fkey` FOREIGN KEY (`cst_no`) REFERENCES `customer_state` (`cst_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customers_constraint_languages_customers_fkey` FOREIGN KEY (`lang_no`) REFERENCES `languages` (`lang_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customers_constraint_sales_discount_customers_fkey` FOREIGN KEY (`sd_no`) REFERENCES `sales_discount` (`sd_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `customers_constraint_shops_customers_fkey` FOREIGN KEY (`shop_no`) REFERENCES `shops` (`shop_no`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `foreign_currencies`
--

DROP TABLE IF EXISTS `foreign_currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foreign_currencies` (
  `fc_id` bigint NOT NULL AUTO_INCREMENT,
  `fc_code` varchar(3) DEFAULT '',
  `fc_name` varchar(50) DEFAULT '',
  `fc_updated_at` datetime DEFAULT NULL,
  `fc_composite_code_name` varchar(55) DEFAULT NULL,
  UNIQUE KEY `foreign_currencies_fc_code_key` (`fc_code`),
  KEY `foreign_currencies_fc_id_ckey` (`fc_id`),
  KEY `foreign_currencies_fc_composite_code_name_ckey` (`fc_composite_code_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `lang_id` bigint NOT NULL AUTO_INCREMENT,
  `lang_no` int NOT NULL DEFAULT '0',
  `lang_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`lang_id`),
  UNIQUE KEY `languages_lang_no_key` (`lang_no`),
  KEY `languages_lang_name_ckey` (`lang_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_bank_accounts`
--

DROP TABLE IF EXISTS `payment_bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_bank_accounts` (
  `pba_id` bigint NOT NULL AUTO_INCREMENT,
  `pba_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `pba_bank_name` varchar(60) DEFAULT NULL,
  `pba_routing_number` varchar(50) DEFAULT NULL,
  `pba_account_number` varchar(50) DEFAULT NULL,
  `pba_iban` varchar(25) DEFAULT NULL,
  `pba_bic` varchar(12) DEFAULT NULL,
  `pba_sepa_id` varchar(35) DEFAULT NULL,
  `pba_is_primary` tinyint DEFAULT '1',
  `fc_code` varchar(3) DEFAULT NULL,
  UNIQUE KEY `payment_bank_accounts_pba_uuid_key` (`pba_uuid`),
  KEY `payment_bank_accounts_pba_id_ckey` (`pba_id`),
  KEY `payment_bank_accounts_fc_code_ckey` (`fc_code`),
  CONSTRAINT `payment_bank_accounts_constraint_foreign_currencies_payment0001` FOREIGN KEY (`fc_code`) REFERENCES `foreign_currencies` (`fc_code`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_credit_cards`
--

DROP TABLE IF EXISTS `payment_credit_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_credit_cards` (
  `pcc_id` bigint NOT NULL AUTO_INCREMENT,
  `pcc_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `pcc_cardholder_name` varchar(50) DEFAULT NULL,
  `pcc_type` tinyint unsigned DEFAULT '1',
  `pcc_data` longtext,
  `pcc_expiry_date` date DEFAULT NULL,
  `pcc_is_primary` tinyint DEFAULT '1',
  `pcc_created_at` date DEFAULT NULL,
  `pcc_updated_at` date DEFAULT NULL,
  UNIQUE KEY `payment_credit_cards_pcc_uuid_key` (`pcc_uuid`),
  KEY `payment_credit_cards_pcc_id_ckey` (`pcc_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `pm_id` bigint NOT NULL AUTO_INCREMENT,
  `pm_uuid` varchar(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `cust_uuid` varchar(36) DEFAULT NULL,
  `pba_uuid` varchar(36) DEFAULT NULL,
  `pcc_uuid` varchar(36) DEFAULT NULL,
  `pm_type` tinyint unsigned DEFAULT '0',
  `pm_email` varchar(50) DEFAULT NULL,
  `lang_no` int DEFAULT NULL,
  `fc_code` varchar(3) DEFAULT NULL,
  `pm_is_default` tinyint NOT NULL DEFAULT '1',
  UNIQUE KEY `payment_methods_pm_uuid_key` (`pm_uuid`),
  UNIQUE KEY `payment_methods_pm_key_key` (`pm_uuid`,`cust_uuid`),
  KEY `payment_methods_pm_id_ckey` (`pm_id`),
  KEY `payment_methods_cust_uuid_ckey` (`cust_uuid`),
  KEY `payment_methods_pba_uuid_ckey` (`pba_uuid`),
  KEY `payment_methods_pcc_uuid_ckey` (`pcc_uuid`),
  KEY `payment_methods_pm_type_ckey` (`pm_type`),
  KEY `payment_methods_lang_no_ckey` (`lang_no`),
  KEY `payment_methods_fc_code_ckey` (`fc_code`),
  CONSTRAINT `payment_methods_constraint_customers_payment_methods_fkey` FOREIGN KEY (`cust_uuid`) REFERENCES `customers` (`cust_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_foreign_currencies_payment_metho0004` FOREIGN KEY (`fc_code`) REFERENCES `foreign_currencies` (`fc_code`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_languages_payment_methods_fkey` FOREIGN KEY (`lang_no`) REFERENCES `languages` (`lang_no`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_payment_bank_accounts_payment_me0002` FOREIGN KEY (`pba_uuid`) REFERENCES `payment_bank_accounts` (`pba_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payment_methods_constraint_payment_credit_cards_payment_met0003` FOREIGN KEY (`pcc_uuid`) REFERENCES `payment_credit_cards` (`pcc_uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_codes`
--

DROP TABLE IF EXISTS `post_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_codes` (
  `pc_id` bigint NOT NULL AUTO_INCREMENT,
  `pc_no` varchar(20) DEFAULT NULL,
  `pc_city` varchar(80) DEFAULT NULL,
  `count_no` varchar(2) NOT NULL DEFAULT '',
  PRIMARY KEY (`pc_id`),
  UNIQUE KEY `post_codes_pc_key_key` (`pc_no`,`pc_city`),
  KEY `post_codes_pc_no_ckey` (`pc_no`),
  KEY `post_codes_pc_city_ckey` (`pc_city`),
  KEY `post_codes_count_no_ckey` (`count_no`),
  CONSTRAINT `post_codes_countries_fkey` FOREIGN KEY (`count_no`) REFERENCES `countries` (`count_no`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_discount`
--

DROP TABLE IF EXISTS `sales_discount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_discount` (
  `sd_id` bigint NOT NULL AUTO_INCREMENT,
  `sd_no` int NOT NULL DEFAULT '0',
  `sd_name` varchar(50) DEFAULT NULL,
  `sd_discount_percent` double NOT NULL DEFAULT '0',
  `sd_discount_payment_terms` int unsigned DEFAULT '7',
  `sd_net_payment_terms` int unsigned DEFAULT '14',
  PRIMARY KEY (`sd_id`),
  UNIQUE KEY `sales_discount_sd_no_key` (`sd_no`),
  KEY `sales_discount_sd_name_ckey` (`sd_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salutations`
--

DROP TABLE IF EXISTS `salutations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salutations` (
  `sal_id` bigint NOT NULL AUTO_INCREMENT,
  `sal_no` bigint NOT NULL,
  `sal_name` varchar(20) DEFAULT NULL,
  `sal_letter_salutation` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`sal_id`),
  UNIQUE KEY `salutations_sal_no_key` (`sal_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shops`
--

DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `shop_id` bigint NOT NULL AUTO_INCREMENT,
  `shop_no` int NOT NULL DEFAULT '0',
  `shop_name` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`shop_id`),
  UNIQUE KEY `shops_shop_no_key` (`shop_no`),
  KEY `shops_shop_name_ckey` (`shop_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `titles`
--

DROP TABLE IF EXISTS `titles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `titles` (
  `tit_id` bigint NOT NULL AUTO_INCREMENT,
  `tit_no` bigint NOT NULL,
  `tit_name` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`tit_id`),
  UNIQUE KEY `titles_tit_no_key` (`tit_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` enum('admin','user','viewer') NOT NULL DEFAULT 'user',
  `reset_token` varchar(64) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_reset_token_key` (`reset_token`),
  KEY `users_is_active_key` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'scoriet_customer_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-29  9:20:47
