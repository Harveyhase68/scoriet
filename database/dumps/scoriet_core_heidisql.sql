-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server-Version:               8.4.7 - MySQL Community Server - GPL
-- Server-Betriebssystem:        Win64
-- HeidiSQL Version:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Exportiere Struktur von Tabelle scoriet.cache
DROP TABLE IF EXISTS `cache`;
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.cache_locks
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.cli_tasks
DROP TABLE IF EXISTS `cli_tasks`;
CREATE TABLE IF NOT EXISTS `cli_tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` int NOT NULL DEFAULT '0',
  `user_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `result` json DEFAULT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Live execution logs',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `retry_count` int NOT NULL DEFAULT '0',
  `max_retries` int NOT NULL DEFAULT '3',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cli_tasks_status_priority_created_at_index` (`status`,`priority`,`created_at`),
  KEY `cli_tasks_user_id_index` (`user_id`),
  KEY `cli_tasks_project_id_index` (`project_id`),
  KEY `cli_tasks_task_type_index` (`task_type`),
  CONSTRAINT `cli_tasks_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cli_tasks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.code_adjustment_insertions
DROP TABLE IF EXISTS `code_adjustment_insertions`;
CREATE TABLE IF NOT EXISTS `code_adjustment_insertions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code_adjustment_id` bigint unsigned NOT NULL,
  `insertion_type` enum('beginning','end','middle') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `anchor_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `insertion_content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `line_offset` smallint NOT NULL DEFAULT '0',
  `insertion_order` int NOT NULL DEFAULT '0',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `code_adjustment_insertions_code_adjustment_id_index` (`code_adjustment_id`),
  CONSTRAINT `code_adjustment_insertions_code_adjustment_id_foreign` FOREIGN KEY (`code_adjustment_id`) REFERENCES `code_adjustments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.code_adjustments
DROP TABLE IF EXISTS `code_adjustments`;
CREATE TABLE IF NOT EXISTS `code_adjustments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_pattern` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_confidence` decimal(3,2) NOT NULL DEFAULT '0.80',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `execution_order` int NOT NULL DEFAULT '0',
  `created_by_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `code_adjustments_created_by_user_id_foreign` (`created_by_user_id`),
  KEY `code_adjustments_project_id_is_active_index` (`project_id`,`is_active`),
  KEY `code_adjustments_project_id_file_pattern_index` (`project_id`,`file_pattern`),
  CONSTRAINT `code_adjustments_created_by_user_id_foreign` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `code_adjustments_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.credit_transactions
DROP TABLE IF EXISTS `credit_transactions`;
CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `amount` int NOT NULL COMMENT 'Positive = purchased/added, Negative = spent',
  `type` enum('purchase','generation','project_renewal','db_renewal','teams_unlock','templates_unlock','cli_unlock','cli_extend','bundle_refund','ticket','initial_credits','admin_adjustment','patron_subscription','template_purchase','template_sale') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Model type: Project, Schema, Ticket, etc.',
  `reference_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_paid` decimal(10,2) DEFAULT NULL COMMENT 'Euro amount paid (for purchases)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `credit_transactions_user_id_index` (`user_id`),
  KEY `credit_transactions_type_index` (`type`),
  CONSTRAINT `credit_transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.deployment_logs
DROP TABLE IF EXISTS `deployment_logs`;
CREATE TABLE IF NOT EXISTS `deployment_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `task_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('info','success','warning','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deployment_logs_project_id_created_at_index` (`project_id`,`created_at`),
  KEY `deployment_logs_task_id_created_at_index` (`task_id`,`created_at`),
  KEY `deployment_logs_user_id_created_at_index` (`user_id`,`created_at`),
  CONSTRAINT `deployment_logs_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deployment_logs_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `cli_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deployment_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.failed_jobs
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.form_elements
DROP TABLE IF EXISTS `form_elements`;
CREATE TABLE IF NOT EXISTS `form_elements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `form_window_id` bigint unsigned NOT NULL,
  `element_type` enum('container','tab_container','tab_panel','menu_container','button_nav_first','button_nav_prev','button_nav_next','button_nav_last','button_save','button_cancel','button_close','button_new','button_delete','button_custom','separator','spacer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `x_position` int NOT NULL DEFAULT '0',
  `y_position` int NOT NULL DEFAULT '0',
  `width` int NOT NULL DEFAULT '100',
  `height` int NOT NULL DEFAULT '40',
  `container_orientation` enum('vertical','horizontal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_fields` int DEFAULT NULL,
  `container_gap` int DEFAULT '8' COMMENT 'Abstand zwischen Controls in Pixel',
  `container_columns` tinyint DEFAULT '1' COMMENT 'Anzahl Spalten (1-3)',
  `button_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_background_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Button Hintergrundfarbe (Hex)',
  `button_text_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Button Schriftfarbe (Hex)',
  `tab_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_tab_container_id` bigint unsigned DEFAULT NULL,
  `custom_style` json DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `form_elements_parent_tab_container_id_foreign` (`parent_tab_container_id`),
  KEY `form_elements_form_window_id_element_type_index` (`form_window_id`,`element_type`),
  KEY `form_elements_form_window_id_sort_order_index` (`form_window_id`,`sort_order`),
  CONSTRAINT `form_elements_form_window_id_foreign` FOREIGN KEY (`form_window_id`) REFERENCES `form_windows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_elements_parent_tab_container_id_foreign` FOREIGN KEY (`parent_tab_container_id`) REFERENCES `form_elements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.form_sets
DROP TABLE IF EXISTS `form_sets`;
CREATE TABLE IF NOT EXISTS `form_sets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `creator_user_id` bigint unsigned NOT NULL,
  `visibility` enum('system','private','public') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `cloned_from_id` bigint unsigned DEFAULT NULL,
  `default_background_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1f2937',
  `default_window_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#374151',
  `default_text_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#f3f4f6',
  `default_button_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#3b82f6',
  `default_button_text_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff' COMMENT 'Standard Button-Schriftfarbe',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `form_sets_cloned_from_id_foreign` (`cloned_from_id`),
  KEY `form_sets_creator_user_id_visibility_index` (`creator_user_id`,`visibility`),
  KEY `form_sets_visibility_is_active_index` (`visibility`,`is_active`),
  CONSTRAINT `form_sets_cloned_from_id_foreign` FOREIGN KEY (`cloned_from_id`) REFERENCES `form_sets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `form_sets_creator_user_id_foreign` FOREIGN KEY (`creator_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.form_windows
DROP TABLE IF EXISTS `form_windows`;
CREATE TABLE IF NOT EXISTS `form_windows` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `form_set_id` bigint unsigned NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `window_type` enum('main_menu','create_edit','data_table','report_single','report_list') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_width` int NOT NULL DEFAULT '800',
  `min_height` int NOT NULL DEFAULT '600',
  `default_width` int NOT NULL DEFAULT '1024',
  `default_height` int NOT NULL DEFAULT '768',
  `background_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `window_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `form_windows_form_set_id_window_type_unique` (`form_set_id`,`window_type`),
  CONSTRAINT `form_windows_form_set_id_foreign` FOREIGN KEY (`form_set_id`) REFERENCES `form_sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.job_batches
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.jobs
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_boards
DROP TABLE IF EXISTS `kanban_boards`;
CREATE TABLE IF NOT EXISTS `kanban_boards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Project Board',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kanban_boards_project_id_unique` (`project_id`),
  KEY `kanban_boards_is_active_index` (`is_active`),
  CONSTRAINT `kanban_boards_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_card_activities
DROP TABLE IF EXISTS `kanban_card_activities`;
CREATE TABLE IF NOT EXISTS `kanban_card_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kanban_card_activities_user_id_foreign` (`user_id`),
  KEY `kanban_card_activities_card_id_created_at_index` (`card_id`,`created_at`),
  CONSTRAINT `kanban_card_activities_card_id_foreign` FOREIGN KEY (`card_id`) REFERENCES `kanban_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kanban_card_activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_card_assignees
DROP TABLE IF EXISTS `kanban_card_assignees`;
CREATE TABLE IF NOT EXISTS `kanban_card_assignees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kanban_card_assignees_card_id_user_id_unique` (`card_id`,`user_id`),
  KEY `kanban_card_assignees_assigned_by_foreign` (`assigned_by`),
  KEY `kanban_card_assignees_card_id_index` (`card_id`),
  KEY `kanban_card_assignees_user_id_index` (`user_id`),
  CONSTRAINT `kanban_card_assignees_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `kanban_card_assignees_card_id_foreign` FOREIGN KEY (`card_id`) REFERENCES `kanban_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kanban_card_assignees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_card_comments
DROP TABLE IF EXISTS `kanban_card_comments`;
CREATE TABLE IF NOT EXISTS `kanban_card_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kanban_card_comments_user_id_foreign` (`user_id`),
  KEY `kanban_card_comments_card_id_created_at_index` (`card_id`,`created_at`),
  CONSTRAINT `kanban_card_comments_card_id_foreign` FOREIGN KEY (`card_id`) REFERENCES `kanban_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kanban_card_comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_card_label
DROP TABLE IF EXISTS `kanban_card_label`;
CREATE TABLE IF NOT EXISTS `kanban_card_label` (
  `card_id` bigint unsigned NOT NULL,
  `label_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`card_id`,`label_id`),
  KEY `kanban_card_label_label_id_foreign` (`label_id`),
  CONSTRAINT `kanban_card_label_card_id_foreign` FOREIGN KEY (`card_id`) REFERENCES `kanban_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kanban_card_label_label_id_foreign` FOREIGN KEY (`label_id`) REFERENCES `kanban_labels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_cards
DROP TABLE IF EXISTS `kanban_cards`;
CREATE TABLE IF NOT EXISTS `kanban_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `column_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` int unsigned NOT NULL DEFAULT '0',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `estimated_hours` int unsigned DEFAULT NULL,
  `actual_hours` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kanban_cards_created_by_foreign` (`created_by`),
  KEY `kanban_cards_column_id_position_index` (`column_id`,`position`),
  KEY `kanban_cards_assigned_to_index` (`assigned_to`),
  KEY `kanban_cards_due_date_index` (`due_date`),
  KEY `kanban_cards_priority_index` (`priority`),
  CONSTRAINT `kanban_cards_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `kanban_cards_column_id_foreign` FOREIGN KEY (`column_id`) REFERENCES `kanban_columns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kanban_cards_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_columns
DROP TABLE IF EXISTS `kanban_columns`;
CREATE TABLE IF NOT EXISTS `kanban_columns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `board_id` bigint unsigned NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#3b82f6',
  `position` int unsigned NOT NULL DEFAULT '0',
  `wip_limit` int unsigned DEFAULT NULL,
  `is_done_column` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kanban_columns_board_id_position_index` (`board_id`,`position`),
  CONSTRAINT `kanban_columns_board_id_foreign` FOREIGN KEY (`board_id`) REFERENCES `kanban_boards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.kanban_labels
DROP TABLE IF EXISTS `kanban_labels`;
CREATE TABLE IF NOT EXISTS `kanban_labels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `board_id` bigint unsigned NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6b7280',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kanban_labels_board_id_index` (`board_id`),
  CONSTRAINT `kanban_labels_board_id_foreign` FOREIGN KEY (`board_id`) REFERENCES `kanban_boards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.languages
DROP TABLE IF EXISTS `languages`;
CREATE TABLE IF NOT EXISTS `languages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `native_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `flag` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `languages_code_unique` (`code`),
  KEY `languages_is_active_sort_order_index` (`is_active`,`sort_order`),
  KEY `languages_is_default_index` (`is_default`),
  KEY `languages_created_by_foreign` (`created_by`),
  CONSTRAINT `languages_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.message_attachments
DROP TABLE IF EXISTS `message_attachments`;
CREATE TABLE IF NOT EXISTS `message_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `message_id` bigint unsigned NOT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` bigint unsigned NOT NULL,
  `path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `message_attachments_message_id_foreign` (`message_id`),
  CONSTRAINT `message_attachments_message_id_foreign` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.message_thread_participants
DROP TABLE IF EXISTS `message_thread_participants`;
CREATE TABLE IF NOT EXISTS `message_thread_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `thread_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `last_read_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_thread_participants_thread_id_user_id_unique` (`thread_id`,`user_id`),
  KEY `message_thread_participants_user_id_deleted_at_index` (`user_id`,`deleted_at`),
  CONSTRAINT `message_thread_participants_thread_id_foreign` FOREIGN KEY (`thread_id`) REFERENCES `message_threads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_thread_participants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.message_threads
DROP TABLE IF EXISTS `message_threads`;
CREATE TABLE IF NOT EXISTS `message_threads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_broadcast` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.messages
DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `thread_id` bigint unsigned NOT NULL,
  `sender_id` bigint unsigned NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_sender_id_foreign` (`sender_id`),
  KEY `messages_thread_id_created_at_index` (`thread_id`,`created_at`),
  CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_thread_id_foreign` FOREIGN KEY (`thread_id`) REFERENCES `message_threads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.migrations
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.oauth_access_tokens
DROP TABLE IF EXISTS `oauth_access_tokens`;
CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
  `id` char(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `client_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_access_tokens_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.oauth_auth_codes
DROP TABLE IF EXISTS `oauth_auth_codes`;
CREATE TABLE IF NOT EXISTS `oauth_auth_codes` (
  `id` char(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `client_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_auth_codes_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.oauth_clients
DROP TABLE IF EXISTS `oauth_clients`;
CREATE TABLE IF NOT EXISTS `oauth_clients` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redirect_uris` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `grant_types` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_clients_owner_type_owner_id_index` (`owner_type`,`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.oauth_device_codes
DROP TABLE IF EXISTS `oauth_device_codes`;
CREATE TABLE IF NOT EXISTS `oauth_device_codes` (
  `id` char(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `client_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_code` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scopes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `user_approved_at` datetime DEFAULT NULL,
  `last_polled_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_device_codes_user_code_unique` (`user_code`),
  KEY `oauth_device_codes_user_id_index` (`user_id`),
  KEY `oauth_device_codes_client_id_index` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.oauth_refresh_tokens
DROP TABLE IF EXISTS `oauth_refresh_tokens`;
CREATE TABLE IF NOT EXISTS `oauth_refresh_tokens` (
  `id` char(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token_id` char(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.pages
DROP TABLE IF EXISTS `pages`;
CREATE TABLE IF NOT EXISTS `pages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `popup_on_landingpage` tinyint(1) DEFAULT '0',
  `popup_on_app` tinyint(1) DEFAULT '0',
  `popup_priority` int DEFAULT '99',
  `popup_version` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_slug_locale_unique` (`slug`,`locale`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.password_reset_tokens
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.payout_items
DROP TABLE IF EXISTS `payout_items`;
CREATE TABLE IF NOT EXISTS `payout_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payout_id` bigint unsigned NOT NULL,
  `template_purchase_id` bigint unsigned NOT NULL,
  `sale_amount` decimal(10,2) NOT NULL,
  `seller_share` decimal(10,2) NOT NULL,
  `platform_share` decimal(10,2) NOT NULL,
  `vat_deducted` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payout_items_template_purchase_id_foreign` (`template_purchase_id`),
  KEY `payout_items_payout_id_index` (`payout_id`),
  CONSTRAINT `payout_items_payout_id_foreign` FOREIGN KEY (`payout_id`) REFERENCES `payouts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payout_items_template_purchase_id_foreign` FOREIGN KEY (`template_purchase_id`) REFERENCES `template_purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.payouts
DROP TABLE IF EXISTS `payouts`;
CREATE TABLE IF NOT EXISTS `payouts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `gross_amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) NOT NULL,
  `vat_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(10,2) NOT NULL,
  `seller_type` enum('at_business','eu_vat','eu_private','non_eu_business','non_eu_private') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payout_method` enum('bank_transfer','paypal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payout_destination` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `failure_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `processed_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payouts_user_id_status_index` (`user_id`,`status`),
  KEY `payouts_period_start_period_end_index` (`period_start`,`period_end`),
  KEY `payouts_status_index` (`status`),
  CONSTRAINT `payouts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.performance_metrics
DROP TABLE IF EXISTS `performance_metrics`;
CREATE TABLE IF NOT EXISTS `performance_metrics` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `operation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operation_detail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_ms` int unsigned NOT NULL,
  `memory_peak_mb` int unsigned DEFAULT NULL,
  `tables_count` int unsigned DEFAULT NULL,
  `fields_count` int unsigned DEFAULT NULL,
  `from_cache` tinyint(1) NOT NULL DEFAULT '0',
  `subscription_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_operation` (`operation`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_operation_created` (`operation`,`created_at`),
  KEY `idx_created_operation` (`created_at`,`operation`),
  CONSTRAINT `performance_metrics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1237 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.permissions
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_applications
DROP TABLE IF EXISTS `project_applications`;
CREATE TABLE IF NOT EXISTS `project_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `join_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_applications_project_id_user_id_unique` (`project_id`,`user_id`),
  KEY `project_applications_user_id_foreign` (`user_id`),
  KEY `project_applications_join_code_index` (`join_code`),
  KEY `project_applications_reviewed_by_foreign` (`reviewed_by`),
  CONSTRAINT `project_applications_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_applications_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `project_applications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_attachments
DROP TABLE IF EXISTS `project_attachments`;
CREATE TABLE IF NOT EXISTS `project_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` bigint unsigned NOT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `download_count` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_attachments_project_id_index` (`project_id`),
  KEY `project_attachments_uploaded_by_index` (`uploaded_by`),
  KEY `project_attachments_project_id_category_index` (`project_id`,`category`),
  KEY `project_attachments_project_id_created_at_index` (`project_id`,`created_at`),
  CONSTRAINT `project_attachments_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_attachments_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_form_set
DROP TABLE IF EXISTS `project_form_set`;
CREATE TABLE IF NOT EXISTS `project_form_set` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `form_set_id` bigint unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_form_set_project_id_form_set_id_unique` (`project_id`,`form_set_id`),
  KEY `project_form_set_form_set_id_foreign` (`form_set_id`),
  KEY `project_form_set_project_id_is_active_index` (`project_id`,`is_active`),
  CONSTRAINT `project_form_set_form_set_id_foreign` FOREIGN KEY (`form_set_id`) REFERENCES `form_sets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_form_set_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_generation_trees
DROP TABLE IF EXISTS `project_generation_trees`;
CREATE TABLE IF NOT EXISTS `project_generation_trees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `tree_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_stale` tinyint(1) NOT NULL DEFAULT '0',
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_generation_trees_project_id_is_stale_index` (`project_id`,`is_stale`),
  KEY `project_generation_trees_project_id_index` (`project_id`),
  CONSTRAINT `project_generation_trees_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_generations
DROP TABLE IF EXISTS `project_generations`;
CREATE TABLE IF NOT EXISTS `project_generations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `schema_version_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `generation_number` int unsigned NOT NULL DEFAULT '1',
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `archive_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'zip',
  `file_size` bigint unsigned NOT NULL DEFAULT '0',
  `languages` json DEFAULT NULL,
  `tables` json DEFAULT NULL,
  `tables_count` int unsigned NOT NULL DEFAULT '0',
  `files_count` int unsigned NOT NULL DEFAULT '0',
  `template_id` bigint unsigned DEFAULT NULL,
  `template_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('completed','failed','partial') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_generations_schema_version_id_foreign` (`schema_version_id`),
  KEY `project_generations_user_id_foreign` (`user_id`),
  KEY `project_generations_template_id_foreign` (`template_id`),
  KEY `project_generations_project_id_generation_number_index` (`project_id`,`generation_number`),
  KEY `project_generations_project_id_created_at_index` (`project_id`,`created_at`),
  CONSTRAINT `project_generations_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_generations_schema_version_id_foreign` FOREIGN KEY (`schema_version_id`) REFERENCES `schema_versions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `project_generations_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `project_generations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_invitations
DROP TABLE IF EXISTS `project_invitations`;
CREATE TABLE IF NOT EXISTS `project_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `invited_by` bigint unsigned NOT NULL,
  `invited_user_id` bigint unsigned DEFAULT NULL,
  `invited_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('member','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `status` enum('pending','accepted','declined','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_invitations_token_unique` (`token`),
  KEY `project_invitations_invited_email_status_index` (`invited_email`,`status`),
  KEY `project_invitations_project_id_status_index` (`project_id`,`status`),
  KEY `project_invitations_token_expires_at_index` (`token`,`expires_at`),
  KEY `project_invitations_invited_by_foreign` (`invited_by`),
  KEY `project_invitations_invited_user_id_foreign` (`invited_user_id`),
  CONSTRAINT `project_invitations_invited_by_foreign` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`),
  CONSTRAINT `project_invitations_invited_user_id_foreign` FOREIGN KEY (`invited_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_invitations_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_kanban_roles
DROP TABLE IF EXISTS `project_kanban_roles`;
CREATE TABLE IF NOT EXISTS `project_kanban_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` enum('srm','sdm','flow_manager') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SRM=Service Request Manager, SDM=Service Delivery Manager, Flow Manager',
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_kanban_roles_project_id_user_id_unique` (`project_id`,`user_id`),
  KEY `project_kanban_roles_user_id_foreign` (`user_id`),
  KEY `project_kanban_roles_assigned_by_foreign` (`assigned_by`),
  KEY `project_kanban_roles_project_id_role_index` (`project_id`,`role`),
  CONSTRAINT `project_kanban_roles_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `project_kanban_roles_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_kanban_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_members
DROP TABLE IF EXISTS `project_members`;
CREATE TABLE IF NOT EXISTS `project_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` enum('member','admin','owner') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `invited_by` bigint unsigned DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_members_project_id_user_id_unique` (`project_id`,`user_id`),
  KEY `project_members_project_id_role_index` (`project_id`,`role`),
  KEY `project_members_user_id_joined_at_index` (`user_id`,`joined_at`),
  KEY `project_members_invited_by_foreign` (`invited_by`),
  CONSTRAINT `project_members_invited_by_foreign` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`),
  CONSTRAINT `project_members_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_schemas
DROP TABLE IF EXISTS `project_schemas`;
CREATE TABLE IF NOT EXISTS `project_schemas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `schema_id` bigint unsigned NOT NULL,
  `association_type` enum('linked','cloned','imported') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'linked',
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_schemas_project_id_schema_id_unique` (`project_id`,`schema_id`),
  KEY `project_schemas_schema_id_foreign` (`schema_id`),
  KEY `project_schemas_association_type_index` (`association_type`),
  CONSTRAINT `project_schemas_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_schemas_schema_id_foreign` FOREIGN KEY (`schema_id`) REFERENCES `schemas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_teams
DROP TABLE IF EXISTS `project_teams`;
CREATE TABLE IF NOT EXISTS `project_teams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `team_id` bigint unsigned NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_template_usage
DROP TABLE IF EXISTS `project_template_usage`;
CREATE TABLE IF NOT EXISTS `project_template_usage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `template_id` bigint unsigned NOT NULL,
  `usage_type` enum('linked','cloned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `config` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `used_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_template_unique` (`project_id`,`template_id`),
  KEY `project_template_usage_project_id_usage_type_index` (`project_id`,`usage_type`),
  KEY `project_template_usage_template_id_usage_type_index` (`template_id`,`usage_type`),
  CONSTRAINT `project_template_usage_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_template_usage_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.project_template_variable_values
DROP TABLE IF EXISTS `project_template_variable_values`;
CREATE TABLE IF NOT EXISTS `project_template_variable_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `template_id` bigint unsigned NOT NULL,
  `variable_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_proj_tmpl_var_lang` (`project_id`,`template_id`,`variable_name`,`language`),
  KEY `idx_proj_tmpl_lang` (`project_id`,`template_id`,`language`),
  KEY `project_template_variable_values_template_id_foreign` (`template_id`),
  CONSTRAINT `project_template_variable_values_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_template_variable_values_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.projects
DROP TABLE IF EXISTS `projects`;
CREATE TABLE IF NOT EXISTS `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `owner_id` bigint unsigned NOT NULL,
  `git_provider_id` bigint unsigned DEFAULT NULL,
  `git_repository` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `git_default_branch` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `git_main_branch` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `git_target_directory` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `git_workflow` enum('push_only','push_and_pr','push_pr_merge') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'push_only',
  `git_pr_title_template` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `git_pr_description_template` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `git_auto_delete_branch` tinyint(1) NOT NULL DEFAULT '1',
  `deployment_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ftp_host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ftp_port` int DEFAULT '21',
  `ftp_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ftp_password` text COLLATE utf8mb4_unicode_ci,
  `ftp_directory` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ftp_passive` tinyint(1) NOT NULL DEFAULT '1',
  `ftp_ssl` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_public` tinyint(1) NOT NULL DEFAULT '1',
  `join_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allow_join_requests` tinyint(1) NOT NULL DEFAULT '0',
  `settings` json DEFAULT NULL,
  `database_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `database_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MySQL',
  `database_server` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '127.0.0.1',
  `database_port` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '3306',
  `database_username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `database_password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diagram_max_tables_per_row` smallint unsigned NOT NULL DEFAULT '20',
  `diagram_table_width` smallint unsigned NOT NULL DEFAULT '280',
  `diagram_table_height` smallint unsigned NOT NULL DEFAULT '450',
  `diagram_horizontal_spacing` smallint unsigned NOT NULL DEFAULT '600',
  `diagram_vertical_spacing` smallint unsigned NOT NULL DEFAULT '700',
  `form_designer_snap_to_grid` tinyint(1) NOT NULL DEFAULT '1',
  `form_designer_grid_size` int NOT NULL DEFAULT '20',
  `project_directory` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_page` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'index.php',
  `default_language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `archive_format` enum('zip','tar.gz','tar.xz') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'zip' COMMENT 'Archive format for code generation (zip, tar.gz, tar.xz)',
  `filename_short_length` tinyint unsigned DEFAULT '2',
  `decimal_separator` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT ',',
  `thousands_separator` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '.',
  `date_format` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'd.m.Y',
  `time_format` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'H:i:s',
  `currency_symbol` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '€',
  `timezone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Europe/Vienna',
  `enabled_languages` json DEFAULT NULL,
  `google_translate_api_key` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `protected_files` json DEFAULT NULL COMMENT 'Project-specific protected files (in addition to template protected files)',
  `install_script` json DEFAULT NULL COMMENT 'Project-specific install instructions (overrides template)',
  `update_script` json DEFAULT NULL COMMENT 'Project-specific update instructions (overrides template)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_join_code_unique` (`join_code`),
  KEY `projects_owner_id_is_active_index` (`owner_id`,`is_active`),
  KEY `projects_name_index` (`name`),
  KEY `projects_git_provider_id_git_repository_index` (`git_provider_id`,`git_repository`),
  CONSTRAINT `projects_git_provider_id_foreign` FOREIGN KEY (`git_provider_id`) REFERENCES `user_git_providers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_constraint_columns
DROP TABLE IF EXISTS `schema_constraint_columns`;
CREATE TABLE IF NOT EXISTS `schema_constraint_columns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `constraint_id` bigint unsigned NOT NULL,
  `field_id` bigint unsigned NOT NULL,
  `column_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `constraint_field_unique` (`constraint_id`,`field_id`),
  KEY `schema_constraint_columns_field_id_foreign` (`field_id`),
  CONSTRAINT `schema_constraint_columns_constraint_id_foreign` FOREIGN KEY (`constraint_id`) REFERENCES `schema_constraints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schema_constraint_columns_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `schema_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=463 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_constraints
DROP TABLE IF EXISTS `schema_constraints`;
CREATE TABLE IF NOT EXISTS `schema_constraints` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `table_id` bigint unsigned NOT NULL,
  `constraint_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `constraint_type` enum('PRIMARY KEY','UNIQUE','KEY','FOREIGN KEY','INDEX') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `schema_constraints_table_id_foreign` (`table_id`),
  KEY `schema_constraints_constraint_name_index` (`constraint_name`),
  KEY `schema_constraints_constraint_type_index` (`constraint_type`),
  CONSTRAINT `schema_constraints_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `schema_tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=447 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_designer_layouts
DROP TABLE IF EXISTS `schema_designer_layouts`;
CREATE TABLE IF NOT EXISTS `schema_designer_layouts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `schema_id` bigint unsigned NOT NULL,
  `version_number` int NOT NULL,
  `layout_data` json NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `schema_designer_layouts_schema_id_version_number_unique` (`schema_id`,`version_number`),
  CONSTRAINT `schema_designer_layouts_schema_id_foreign` FOREIGN KEY (`schema_id`) REFERENCES `schemas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_fields
DROP TABLE IF EXISTS `schema_fields`;
CREATE TABLE IF NOT EXISTS `schema_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `table_id` bigint unsigned NOT NULL,
  `field_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_unsigned` tinyint(1) NOT NULL DEFAULT '0',
  `is_nullable` tinyint(1) NOT NULL DEFAULT '1',
  `default_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_auto_increment` tinyint(1) NOT NULL DEFAULT '0',
  `is_primary_key` tinyint(1) NOT NULL DEFAULT '0',
  `is_index` tinyint(1) NOT NULL DEFAULT '0',
  `is_unique` tinyint(1) NOT NULL DEFAULT '0',
  `control_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TEXT' COMMENT 'UI control type (TEXT, TEXTAREA, CHECKBOX, COMBOBOX, etc.)',
  `link_table` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Linked table name (e.g., countries, products)',
  `link_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Linked field name (e.g., id, code)',
  `link_display_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Display field for ComboBox (e.g., customer_name, group_title)',
  `link_order_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Order by field name (e.g., branch_no, name)',
  `link_order_direction` enum('ASC','DESC') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ASC' COMMENT 'Order direction (ASC or DESC)',
  `field_order` int NOT NULL DEFAULT '0',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `schema_fields_table_id_field_name_unique` (`table_id`,`field_name`),
  KEY `schema_fields_field_name_index` (`field_name`),
  KEY `schema_fields_is_primary_key_index` (`is_primary_key`),
  KEY `schema_fields_is_index_index` (`is_index`),
  KEY `schema_fields_is_unique_index` (`is_unique`),
  CONSTRAINT `schema_fields_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `schema_tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=707 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_foreign_key_reference_columns
DROP TABLE IF EXISTS `schema_foreign_key_reference_columns`;
CREATE TABLE IF NOT EXISTS `schema_foreign_key_reference_columns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_id` bigint unsigned NOT NULL,
  `referenced_field_id` bigint unsigned NOT NULL,
  `column_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fk_ref_col_unique` (`reference_id`,`referenced_field_id`),
  KEY `schema_foreign_key_reference_columns_referenced_field_id_foreign` (`referenced_field_id`),
  CONSTRAINT `schema_foreign_key_reference_columns_reference_id_foreign` FOREIGN KEY (`reference_id`) REFERENCES `schema_foreign_key_references` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schema_foreign_key_reference_columns_referenced_field_id_foreign` FOREIGN KEY (`referenced_field_id`) REFERENCES `schema_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_foreign_key_references
DROP TABLE IF EXISTS `schema_foreign_key_references`;
CREATE TABLE IF NOT EXISTS `schema_foreign_key_references` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `constraint_id` bigint unsigned NOT NULL,
  `referenced_table_id` bigint unsigned NOT NULL,
  `on_delete` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'NO ACTION',
  `on_update` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'NO ACTION',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fk_ref_constraint_unique` (`constraint_id`),
  KEY `schema_foreign_key_references_referenced_table_id_foreign` (`referenced_table_id`),
  CONSTRAINT `schema_foreign_key_references_constraint_id_foreign` FOREIGN KEY (`constraint_id`) REFERENCES `schema_constraints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schema_foreign_key_references_referenced_table_id_foreign` FOREIGN KEY (`referenced_table_id`) REFERENCES `schema_tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_tables
DROP TABLE IF EXISTS `schema_tables`;
CREATE TABLE IF NOT EXISTS `schema_tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `schema_id` bigint unsigned NOT NULL,
  `schema_version_id` bigint unsigned NOT NULL,
  `table_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `primarykeyfield` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filekeyname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name_renamed` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name_short` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `schema_tables_schema_version_id_table_name_unique` (`schema_version_id`,`table_name`),
  KEY `schema_tables_schema_id_index` (`schema_id`),
  KEY `schema_tables_table_name_index` (`table_name`),
  KEY `schema_tables_primarykeyfield_index` (`primarykeyfield`),
  KEY `schema_tables_filekeyname_index` (`filekeyname`),
  KEY `schema_tables_file_name_renamed_index` (`file_name_renamed`),
  KEY `schema_tables_file_name_short_index` (`file_name_short`),
  CONSTRAINT `schema_tables_schema_id_foreign` FOREIGN KEY (`schema_id`) REFERENCES `schemas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schema_tables_schema_version_id_foreign` FOREIGN KEY (`schema_version_id`) REFERENCES `schema_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_translations
DROP TABLE IF EXISTS `schema_translations`;
CREATE TABLE IF NOT EXISTS `schema_translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `translated_text` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_item_language` (`item_name`,`code`),
  KEY `schema_translations_item_name_index` (`item_name`),
  KEY `schema_translations_code_index` (`code`),
  KEY `schema_translations_is_active_index` (`is_active`),
  KEY `schema_translations_created_by_foreign` (`created_by`),
  CONSTRAINT `schema_translations_code_foreign` FOREIGN KEY (`code`) REFERENCES `languages` (`code`) ON DELETE CASCADE,
  CONSTRAINT `schema_translations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schema_versions
DROP TABLE IF EXISTS `schema_versions`;
CREATE TABLE IF NOT EXISTS `schema_versions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `schema_id` bigint unsigned NOT NULL,
  `version_number` int NOT NULL DEFAULT '1',
  `version_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `has_unsaved_changes` tinyint(1) NOT NULL DEFAULT '0',
  `imported_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `schema_versions_schema_id_version_number_index` (`schema_id`,`version_number`),
  KEY `schema_versions_version_name_index` (`version_name`),
  CONSTRAINT `schema_versions_schema_id_foreign` FOREIGN KEY (`schema_id`) REFERENCES `schemas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.schemas
DROP TABLE IF EXISTS `schemas`;
CREATE TABLE IF NOT EXISTS `schemas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `owner_id` bigint unsigned NOT NULL,
  `visibility` enum('private','public','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `is_system_schema` tinyint(1) NOT NULL DEFAULT '0',
  `last_version` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `owner_schema_name_unique` (`owner_id`,`name`),
  KEY `schemas_owner_id_visibility_index` (`owner_id`,`visibility`),
  KEY `schemas_is_template_schema_index` (`is_system_schema`),
  CONSTRAINT `schemas_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.sessions
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.settings
DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `global_google_translate_key` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Global Google Translate API key for Business users',
  `price_patron_annual` decimal(10,2) NOT NULL DEFAULT '34.90',
  `price_patron_monthly` decimal(10,2) NOT NULL DEFAULT '49.90',
  `price_credits_500` decimal(10,2) NOT NULL DEFAULT '9.90',
  `price_credits_1000` decimal(10,2) NOT NULL DEFAULT '17.90',
  `price_credits_2500` decimal(10,2) NOT NULL DEFAULT '29.90',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.subscriptions
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `subscription_type` enum('project','schema','team','template','cli','service','bundle','form_designer','git_integration','code_adjustments','database_designer','schema_migration','message_attachments','kanban_board') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `is_free_tier` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Is this the free tier allocation?',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_soft_locked` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'READ-ONLY after expiration',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'Null = unlimited (patron monthly)',
  `expiry_warning_sent_at` timestamp NULL DEFAULT NULL,
  `expiry_final_sent_at` timestamp NULL DEFAULT NULL,
  `expired_notification_sent_at` timestamp NULL DEFAULT NULL,
  `early_renewal_bonus_days` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_subscription` (`user_id`,`subscription_type`,`entity_id`),
  KEY `subscriptions_user_id_subscription_type_is_active_index` (`user_id`,`subscription_type`,`is_active`),
  KEY `subscriptions_subscription_type_entity_id_index` (`subscription_type`,`entity_id`),
  KEY `subscriptions_user_id_is_active_expires_at_index` (`user_id`,`is_active`,`expires_at`),
  KEY `subscriptions_user_id_index` (`user_id`),
  KEY `subscriptions_subscription_type_index` (`subscription_type`),
  KEY `subscriptions_entity_id_index` (`entity_id`),
  KEY `subscriptions_is_active_index` (`is_active`),
  CONSTRAINT `subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` enum('owner','admin','member') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `team_role_id` bigint unsigned DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_members_team_id_user_id_unique` (`team_id`,`user_id`),
  KEY `team_members_user_id_foreign` (`user_id`),
  KEY `team_members_team_role_id_foreign` (`team_role_id`),
  CONSTRAINT `team_members_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_team_role_id_foreign` FOREIGN KEY (`team_role_id`) REFERENCES `team_roles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `team_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.team_role_permissions
DROP TABLE IF EXISTS `team_role_permissions`;
CREATE TABLE IF NOT EXISTS `team_role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_role_permissions_team_role_id_permission_id_unique` (`team_role_id`,`permission_id`),
  KEY `team_role_permissions_permission_id_foreign` (`permission_id`),
  CONSTRAINT `team_role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_role_permissions_team_role_id_foreign` FOREIGN KEY (`team_role_id`) REFERENCES `team_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.team_roles
DROP TABLE IF EXISTS `team_roles`;
CREATE TABLE IF NOT EXISTS `team_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_roles_team_id_slug_unique` (`team_id`,`slug`),
  KEY `team_roles_team_id_slug_index` (`team_id`,`slug`),
  CONSTRAINT `team_roles_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.teams
DROP TABLE IF EXISTS `teams`;
CREATE TABLE IF NOT EXISTS `teams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `project_owner_id` bigint unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teams_project_owner_id` (`project_owner_id`),
  CONSTRAINT `teams_project_owner_id_foreign` FOREIGN KEY (`project_owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_files
DROP TABLE IF EXISTS `template_files`;
CREATE TABLE IF NOT EXISTS `template_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'template',
  `content_type` enum('text','zip') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `zip_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `output_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_order` int NOT NULL DEFAULT '0',
  `form_window_type` tinyint DEFAULT '0' COMMENT '0=None, 1=MainMenu, 2=CreateEdit, 3=DataTable, 4=ReportSingle, 5=ReportList',
  `is_include_only` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_files_template_id_file_type_index` (`template_id`,`file_type`),
  CONSTRAINT `template_files_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_fingerprints
DROP TABLE IF EXISTS `template_fingerprints`;
CREATE TABLE IF NOT EXISTS `template_fingerprints` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `template_file_id` bigint unsigned NOT NULL,
  `file_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalized_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content_length` int unsigned NOT NULL,
  `token_signature` json DEFAULT NULL,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_significant` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_fingerprints_template_file_id_foreign` (`template_file_id`),
  KEY `template_fingerprints_file_hash_index` (`file_hash`),
  KEY `template_fingerprints_template_id_index` (`template_id`),
  KEY `template_fingerprints_file_hash_template_id_index` (`file_hash`,`template_id`),
  CONSTRAINT `template_fingerprints_template_file_id_foreign` FOREIGN KEY (`template_file_id`) REFERENCES `template_files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `template_fingerprints_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_media
DROP TABLE IF EXISTS `template_media`;
CREATE TABLE IF NOT EXISTS `template_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `media_type` enum('logo','image','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int unsigned DEFAULT NULL,
  `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_media_template_id_media_type_index` (`template_id`,`media_type`),
  CONSTRAINT `template_media_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_purchases
DROP TABLE IF EXISTS `template_purchases`;
CREATE TABLE IF NOT EXISTS `template_purchases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `buyer_user_id` bigint unsigned NOT NULL,
  `seller_user_id` bigint unsigned NOT NULL,
  `template_id` bigint unsigned NOT NULL,
  `payment_type` enum('credits','euros') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_credits` int DEFAULT NULL,
  `price_euros` decimal(8,2) DEFAULT NULL,
  `is_paid_out` tinyint(1) NOT NULL DEFAULT '0',
  `payout_id` bigint unsigned DEFAULT NULL,
  `paid_out_at` timestamp NULL DEFAULT NULL,
  `seller_earnings` decimal(10,2) DEFAULT NULL,
  `platform_fee` decimal(10,2) DEFAULT NULL,
  `seller_credits` int DEFAULT NULL,
  `seller_euros` decimal(8,2) DEFAULT NULL,
  `platform_credits` int DEFAULT NULL,
  `platform_euros` decimal(8,2) DEFAULT NULL,
  `credit_transaction_id` bigint unsigned DEFAULT NULL,
  `stripe_payment_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_payment_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_purchases_buyer_user_id_template_id_unique` (`buyer_user_id`,`template_id`),
  KEY `template_purchases_credit_transaction_id_foreign` (`credit_transaction_id`),
  KEY `template_purchases_seller_user_id_index` (`seller_user_id`),
  KEY `template_purchases_template_id_index` (`template_id`),
  KEY `template_purchases_payout_id_foreign` (`payout_id`),
  KEY `template_purchases_is_paid_out_index` (`is_paid_out`),
  KEY `template_purchases_seller_user_id_is_paid_out_index` (`seller_user_id`,`is_paid_out`),
  CONSTRAINT `template_purchases_buyer_user_id_foreign` FOREIGN KEY (`buyer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `template_purchases_credit_transaction_id_foreign` FOREIGN KEY (`credit_transaction_id`) REFERENCES `credit_transactions` (`id`),
  CONSTRAINT `template_purchases_payout_id_foreign` FOREIGN KEY (`payout_id`) REFERENCES `payouts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `template_purchases_seller_user_id_foreign` FOREIGN KEY (`seller_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `template_purchases_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_reviews
DROP TABLE IF EXISTS `template_reviews`;
CREATE TABLE IF NOT EXISTS `template_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `reviewer_user_id` bigint unsigned NOT NULL,
  `vote` tinyint NOT NULL COMMENT '+1 for approve, -1 for reject',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_reviewer` (`template_id`,`reviewer_user_id`),
  KEY `template_reviews_reviewer_user_id_foreign` (`reviewer_user_id`),
  CONSTRAINT `template_reviews_reviewer_user_id_foreign` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `template_reviews_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_schema_dependencies
DROP TABLE IF EXISTS `template_schema_dependencies`;
CREATE TABLE IF NOT EXISTS `template_schema_dependencies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `schema_id` bigint unsigned NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_schema_dependencies_template_id_schema_id_unique` (`template_id`,`schema_id`),
  KEY `template_schema_dependencies_schema_id_foreign` (`schema_id`),
  CONSTRAINT `template_schema_dependencies_schema_id_foreign` FOREIGN KEY (`schema_id`) REFERENCES `schemas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `template_schema_dependencies_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.template_variables
DROP TABLE IF EXISTS `template_variables`;
CREATE TABLE IF NOT EXISTS `template_variables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_id` bigint unsigned NOT NULL,
  `variable_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `default_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_variables_template_id_variable_name_unique` (`template_id`,`variable_name`),
  KEY `template_variables_template_id_variable_name_index` (`template_id`,`variable_name`),
  CONSTRAINT `template_variables_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.templates
DROP TABLE IF EXISTS `templates`;
CREATE TABLE IF NOT EXISTS `templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Web',
  `language` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `tags` json DEFAULT NULL,
  `file_count` int NOT NULL DEFAULT '0',
  `creator_user_id` bigint unsigned DEFAULT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `visibility` enum('private','public','store') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'private',
  `visibility_locked` tinyint(1) NOT NULL DEFAULT '0',
  `price_type` enum('credits','euros') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_credits` int DEFAULT NULL,
  `price_euros` decimal(8,2) DEFAULT NULL,
  `is_store_approved` tinyint(1) NOT NULL DEFAULT '0',
  `fingerprints_generated` tinyint(1) NOT NULL DEFAULT '0',
  `fingerprints_generated_at` timestamp NULL DEFAULT NULL,
  `sales_count` bigint unsigned NOT NULL DEFAULT '0',
  `total_revenue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `review_status` enum('draft','pending_review','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `review_score` int NOT NULL DEFAULT '0',
  `is_system_template` tinyint(1) NOT NULL DEFAULT '0',
  `original_template_id` bigint unsigned DEFAULT NULL,
  `cloned_from_template_id` bigint unsigned DEFAULT NULL,
  `is_from_store` tinyint(1) NOT NULL DEFAULT '0',
  `resale_allowed` tinyint(1) NOT NULL DEFAULT '0',
  `template_type` enum('original','cloned','linked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'original' COMMENT 'Template type: original/cloned/linked',
  `history` json DEFAULT NULL COMMENT 'Template fork and contribution history',
  `community_rating` json DEFAULT NULL COMMENT 'Community reviews and ratings',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `protected_files` json DEFAULT NULL COMMENT 'Array of filenames that should not be overwritten on update',
  `install_script` json DEFAULT NULL COMMENT 'Step-by-step install instructions',
  `update_script` json DEFAULT NULL COMMENT 'Step-by-step update instructions',
  PRIMARY KEY (`id`),
  KEY `templates_category_is_active_index` (`category`,`is_active`),
  KEY `templates_creator_user_id_visibility_index` (`creator_user_id`,`visibility`),
  KEY `templates_is_system_template_visibility_index` (`is_system_template`,`visibility`),
  KEY `templates_project_id_visibility_index` (`project_id`,`visibility`),
  KEY `templates_full_name_index` (`full_name`),
  KEY `templates_language_index` (`language`),
  KEY `templates_original_template_id_foreign` (`original_template_id`),
  KEY `templates_template_type_index` (`template_type`),
  KEY `templates_cloned_from_template_id_foreign` (`cloned_from_template_id`),
  CONSTRAINT `templates_cloned_from_template_id_foreign` FOREIGN KEY (`cloned_from_template_id`) REFERENCES `templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `templates_creator_user_id_foreign` FOREIGN KEY (`creator_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `templates_original_template_id_foreign` FOREIGN KEY (`original_template_id`) REFERENCES `templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `templates_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.tickets
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('bug_report','support','consulting') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `status` enum('open','in_progress','waiting_response','resolved','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `credits_cost` int NOT NULL DEFAULT '0' COMMENT 'Credits spent on this ticket (0 for bug reports)',
  `assigned_to` bigint unsigned DEFAULT NULL COMMENT 'System admin assigned to',
  `resolved_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tickets_assigned_to_foreign` (`assigned_to`),
  KEY `tickets_user_id_index` (`user_id`),
  KEY `tickets_type_index` (`type`),
  KEY `tickets_priority_index` (`priority`),
  KEY `tickets_status_index` (`status`),
  CONSTRAINT `tickets_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tickets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.user_git_providers
DROP TABLE IF EXISTS `user_git_providers`;
CREATE TABLE IF NOT EXISTS `user_git_providers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `provider` enum('github','gitlab','bitbucket') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'github',
  `provider_user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `token_expires_at` timestamp NULL DEFAULT NULL,
  `scopes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `connected_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_git_providers_user_id_provider_unique` (`user_id`,`provider`),
  CONSTRAINT `user_git_providers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle scoriet.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `theme` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dark',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `is_inner_core` tinyint(1) NOT NULL DEFAULT '0',
  `is_seller` tinyint(1) NOT NULL DEFAULT '0',
  `company_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_country` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vat_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_registration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seller_type` enum('at_business','eu_vat','eu_private','non_eu_business','non_eu_private') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_method` enum('bank_transfer','paypal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_payout_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_iban` varchar(34) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_bic` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seller_verified` tinyint(1) NOT NULL DEFAULT '0',
  `seller_verified_at` timestamp NULL DEFAULT NULL,
  `pending_earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `two_factor_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `two_factor_recovery_codes` text COLLATE utf8mb4_unicode_ci,
  `two_factor_trusted_devices` text COLLATE utf8mb4_unicode_ci,
  `two_factor_last_verified_at` timestamp NULL DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_type` enum('free','patron','admin','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `language` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `kanban_initials` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kanban_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credits` int NOT NULL DEFAULT '50',
  `last_monthly_credits_at` timestamp NULL DEFAULT NULL,
  `stripe_customer_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_subscription_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_subscription_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patron_type` enum('annual','monthly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pending_project_invitation_id` bigint unsigned DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_system_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `email_user_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `inactivity_warning_1_sent_at` timestamp NULL DEFAULT NULL,
  `inactivity_warning_2_sent_at` timestamp NULL DEFAULT NULL,
  `inactivity_warning_final_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `users_pending_project_invitation_id_foreign` (`pending_project_invitation_id`),
  KEY `users_inactivity_check_index` (`last_login_at`,`user_type`,`is_active`),
  CONSTRAINT `users_pending_project_invitation_id_foreign` FOREIGN KEY (`pending_project_invitation_id`) REFERENCES `project_invitations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Daten-Export vom Benutzer nicht ausgewählt

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
