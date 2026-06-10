-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Erstellungszeit: 09. Jun 2026 um 19:13
-- Server-Version: 8.4.8
-- PHP-Version: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `scoriettemplate`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `companies`
--

DROP TABLE IF EXISTS `companies`;
CREATE TABLE IF NOT EXISTS `companies` (
  `comp_id` bigint NOT NULL AUTO_INCREMENT,
  `comp_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comp_vat_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comp_website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comp_phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comp_industry` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comp_notes` text COLLATE utf8mb4_unicode_ci,
  `comp_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `comp_updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`comp_id`),
  KEY `idx_comp_name` (`comp_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `companies`
--

INSERT INTO `companies` (`comp_id`, `comp_name`, `comp_vat_number`, `comp_website`, `comp_phone`, `comp_industry`, `comp_notes`, `comp_created_at`, `comp_updated_at`) VALUES
(1, 'Alpine Software AG', 'ATU12345678', 'https://alpine-software.example', '+43 1 2345678', 'Software', NULL, '2026-06-06 20:44:20', '2026-06-09 14:30:52'),
(2, 'Donau Logistik AG', 'ATU87654321', 'https://donau-logistik.example', '+43 732 998877', 'Logistics', NULL, '2026-06-06 20:44:20', NULL),
(3, 'Berliner Medien GmbH', 'DE123456789', 'https://berliner-medien.example', '+49 30 445566', 'Media', NULL, '2026-06-06 20:44:20', NULL),
(4, 'Helvetia Consulting AG', 'CHE-123.456.789', 'https://helvetia-consulting.example', '+41 44 1122334', 'Consulting', NULL, '2026-06-06 20:44:20', NULL);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `customers`
--

DROP TABLE IF EXISTS `customers`;
CREATE TABLE IF NOT EXISTS `customers` (
  `cust_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_nr` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cust_first_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cust_last_name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cust_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cust_phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cust_street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cust_house_number` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cust_postal_code_id` bigint DEFAULT NULL,
  `cust_company_id` bigint DEFAULT NULL,
  `cust_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `cust_notes` text COLLATE utf8mb4_unicode_ci,
  `cust_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cust_updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cust_id`),
  UNIQUE KEY `ux_cust_nr` (`cust_nr`),
  KEY `idx_cust_email` (`cust_email`),
  KEY `idx_cust_postal_code` (`cust_postal_code_id`),
  KEY `idx_cust_company` (`cust_company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `customers`
--

INSERT INTO `customers` (`cust_id`, `cust_nr`, `cust_first_name`, `cust_last_name`, `cust_email`, `cust_phone`, `cust_street`, `cust_house_number`, `cust_postal_code_id`, `cust_company_id`, `cust_status`, `cust_notes`, `cust_created_at`, `cust_updated_at`) VALUES
(1, 'C-1001', 'Anna', 'Huber', 'anna.huber@example.com', '+43 664 1111111', 'Stephansplatz', '4', 1, 1, 'ACTIVE', 'Key account since 2022.', '2026-06-06 20:44:20', NULL),
(2, 'C-1002', 'Bernhard', 'Maier', 'b.maier@example.com', '+43 664 2222222', 'Donaustadtstrasse', '12/3', 2, 2, 'ACTIVE', NULL, '2026-06-06 20:44:20', NULL),
(3, 'C-1003', 'Claudia', 'Berger', 'claudia.berger@example.com', '+43 676 3333333', 'Rathausplatz', '1', 3, NULL, 'PROSPECT', 'Met at trade fair.', '2026-06-06 20:44:20', NULL),
(4, 'C-1004', 'David', 'Wagner', 'd.wagner@example.com', '+43 699 4444444', 'Landstrasse', '45', 4, 2, 'ACTIVE', NULL, '2026-06-06 20:44:20', NULL),
(5, 'C-1005', 'Eva', 'Pichler', 'eva.pichler@example.com', '+43 662 5555555', 'Getreidegasse', '9', 5, NULL, 'LEAD', NULL, '2026-06-06 20:44:20', NULL),
(6, 'C-1006', 'Franz', 'Steiner', 'franz.steiner@example.com', '+43 316 6666666', 'Herrengasse', '16', 6, 1, 'INACTIVE', 'Contract paused.', '2026-06-06 20:44:20', NULL),
(7, 'C-1007', 'Greta', 'Schmidt', 'greta.schmidt@example.com', '+49 30 7777777', 'Invalidenstrasse', '110', 7, 3, 'ACTIVE', NULL, '2026-06-06 20:44:20', NULL),
(8, 'C-1008', 'Hans', 'Bauer', 'hans.bauer@example.com', '+49 89 8888888', 'Marienplatz', '8', 8, 3, 'ACTIVE', NULL, '2026-06-06 20:44:20', NULL),
(9, 'C-1009', 'Ingrid', 'Keller', 'ingrid.keller@example.com', '+41 44 9999999', 'Bahnhofstrasse', '21', 10, 4, 'ACTIVE', 'Prefers contact by email.', '2026-06-06 20:44:20', NULL),
(10, 'C-1010', 'Jakob', 'Lehmann', 'jakob.lehmann@example.com', '+49 40 1010101', 'Moenckebergstrasse', '7', 9, NULL, 'ARCHIVED', 'Moved abroad.', '2026-06-06 20:44:20', NULL);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `postal_codes`
--

DROP TABLE IF EXISTS `postal_codes`;
CREATE TABLE IF NOT EXISTS `postal_codes` (
  `pc_id` bigint NOT NULL AUTO_INCREMENT,
  `pc_country_code` char(2) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AT',
  `pc_postal_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pc_city` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pc_state` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pc_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pc_updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pc_id`),
  UNIQUE KEY `ux_pc_country_postal_city` (`pc_country_code`,`pc_postal_code`,`pc_city`),
  KEY `idx_pc_city` (`pc_city`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `postal_codes`
--

INSERT INTO `postal_codes` (`pc_id`, `pc_country_code`, `pc_postal_code`, `pc_city`, `pc_state`, `pc_created_at`, `pc_updated_at`) VALUES
(1, 'AT', '1010', 'Vienna', 'Vienna', '2026-06-06 20:44:20', NULL),
(2, 'AT', '1220', 'Vienna', 'Vienna', '2026-06-06 20:44:20', NULL),
(3, 'AT', '3100', 'St. Poelten', 'Lower Austria', '2026-06-06 20:44:20', NULL),
(4, 'AT', '4020', 'Linz', 'Upper Austria', '2026-06-06 20:44:20', NULL),
(5, 'AT', '5020', 'Salzburg', 'Salzburg', '2026-06-06 20:44:20', NULL),
(6, 'AT', '8010', 'Graz', 'Styria', '2026-06-06 20:44:20', NULL),
(7, 'DE', '10115', 'Berlin', 'Berlin', '2026-06-06 20:44:20', NULL),
(8, 'DE', '80331', 'Munich', 'Bavaria', '2026-06-06 20:44:20', NULL),
(9, 'DE', '20095', 'Hamburg', 'Hamburg', '2026-06-06 20:44:20', NULL),
(10, 'CH', '8001', 'Zurich', 'Zurich', '2026-06-06 20:44:20', NULL);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `user_username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_display_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMIN',
  `user_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `user_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `ux_user_username` (`user_username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `users`
--

INSERT INTO `users` (`user_id`, `user_username`, `user_password`, `user_display_name`, `user_role`, `user_enabled`, `user_created_at`) VALUES
(1, 'admin', '$2a$10$qFW7exL9fyaVqxTOkWpJEORFal7MfFW.yHHVnSWhcaGgl8iipCJki', 'Administrator', 'ADMIN', 1, '2026-06-06 20:44:20');

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_cust_company` FOREIGN KEY (`cust_company_id`) REFERENCES `companies` (`comp_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cust_postal_code` FOREIGN KEY (`cust_postal_code_id`) REFERENCES `postal_codes` (`pc_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
