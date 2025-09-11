DROP TABLE IF EXISTS `accounting_log`;
CREATE TABLE IF NOT EXISTS `accounting_log` (
  `accl_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL DEFAULT '0',
  `station_no` int UNSIGNED DEFAULT '0',
  `moncl_no` int UNSIGNED DEFAULT NULL,
  `accl_type` tinyint UNSIGNED DEFAULT NULL,
  `accl_type_no` int UNSIGNED DEFAULT NULL,
  `accl_date` date DEFAULT NULL,
  `accl_time` time DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `accl_changed_date` datetime DEFAULT NULL,
  `accl_first_slip_no` bigint UNSIGNED DEFAULT '0',
  `accl_last_slip_no` bigint UNSIGNED DEFAULT '0',
  `accl_accounting_date` date DEFAULT NULL,
  `accl_pdf` longblob,
  `accl_atm_accounting` longtext,
  PRIMARY KEY (`accl_id`),
  KEY `accounting_log_branch_no_ckey` (`branch_no`),
  KEY `accounting_log_station_no_ckey` (`station_no`),
  KEY `accounting_log_moncl_no_ckey` (`moncl_no`),
  KEY `accounting_log_accl_type_ckey` (`accl_type`),
  KEY `accounting_log_accl_type_no_ckey` (`accl_type_no`),
  KEY `accounting_log_accl_date_ckey` (`accl_date`),
  KEY `accounting_log_accl_time_ckey` (`accl_time`),
  KEY `accounting_log_opera_no_ckey` (`opera_no`),
  KEY `accounting_log_accl_changed_date_ckey` (`accl_changed_date`),
  KEY `accounting_log_accl_last_slip_no_ckey` (`accl_last_slip_no`),
  KEY `accounting_log_accl_key_type_ckey` (`station_no`,`accl_type`,`accl_type_no`),
  KEY `accounting_log_accl_key_money_counting_ckey` (`station_no`,`moncl_no`),
  KEY `accounting_log_accl_key_log_ckey` (`station_no`,`accl_type`,`opera_no`,`accl_last_slip_no`),
  KEY `accounting_log_accl_key_branch_ckey` (`branch_no`,`station_no`,`accl_type`,`accl_type_no`)
);
DROP TABLE IF EXISTS `atm_log`;
CREATE TABLE IF NOT EXISTS `atm_log` (
  `atml_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `atml_date_time` datetime DEFAULT NULL,
  `atml_changed_date` datetime DEFAULT NULL,
  `atml_termination_due_to_errors` tinyint DEFAULT '0',
  `salesm_slip_no` bigint UNSIGNED DEFAULT '0',
  `atml_transaction_log` longtext,
  `atml_last_error` longtext,
  `atml_error_log` longtext,
  PRIMARY KEY (`atml_id`),
  KEY `atm_log_station_no_ckey` (`station_no`),
  KEY `atm_log_salesm_guid_ckey` (`salesm_guid`),
  KEY `atm_log_atml_changed_date_ckey` (`atml_changed_date`),
  KEY `atm_log_salesm_slip_no_ckey` (`salesm_slip_no`),
  KEY `atm_log_atml_date_time_ckey` (`atml_date_time`)
);
DROP TABLE IF EXISTS `banking_accounts`;
CREATE TABLE IF NOT EXISTS `banking_accounts` (
  `banka_id` bigint NOT NULL AUTO_INCREMENT,
  `banka_no` int DEFAULT '0',
  `banka_bank_name` varchar(50) DEFAULT '',
  `banka_iban` varchar(50) DEFAULT '',
  `banka_bic_swift` varchar(50) DEFAULT '',
  `banka_account_no` varchar(50) DEFAULT '',
  `banka_bank_code` varchar(50) DEFAULT '',
  `banka_creditor_id` varchar(50) DEFAULT '',
  PRIMARY KEY (`banka_id`),
  UNIQUE KEY `banka_no` (`banka_no`),
  KEY `WDIDX16788927340` (`banka_bank_name`)
);
DROP TABLE IF EXISTS `bar_systems`;
CREATE TABLE IF NOT EXISTS `bar_systems` (
  `bars_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `bars_date_time` datetime DEFAULT NULL,
  `salesd_line_no` int DEFAULT NULL,
  `bars_last_send` datetime DEFAULT NULL,
  `bars_last_receive` datetime DEFAULT NULL,
  `bars_debit_kredit` tinyint UNSIGNED DEFAULT NULL,
  `bars_ok` tinyint DEFAULT NULL,
  `bars_cancellation` tinyint DEFAULT NULL,
  `bars_send` varchar(40) DEFAULT NULL,
  `bars_receive` varchar(40) DEFAULT NULL,
  `bars_error` tinyint DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `bars_quantity` decimal(18,6) DEFAULT '0.000000',
  `salesm_guid` varchar(32) DEFAULT NULL,
  `bars_prod_foreign_no` bigint UNSIGNED DEFAULT NULL,
  `bars_table_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`bars_id`),
  KEY `bar_systems_station_no_ckey` (`station_no`),
  KEY `bar_systems_opera_no_ckey` (`opera_no`),
  KEY `bar_systems_bars_date_time_ckey` (`bars_date_time`),
  KEY `bar_systems_salesd_line_no_ckey` (`salesd_line_no`),
  KEY `bar_systems_bars_debit_kredit_ckey` (`bars_debit_kredit`),
  KEY `bar_systems_bars_ok_ckey` (`bars_ok`),
  KEY `bar_systems_bars_cancellation_ckey` (`bars_cancellation`),
  KEY `bar_systems_bars_key_ckey` (`station_no`,`prod_no`,`bars_prod_foreign_no`,`bars_ok`)
);

--
-- Tabellenstruktur für Tabelle `bluecode_customers`
--

DROP TABLE IF EXISTS `bluecode_customers`;
CREATE TABLE IF NOT EXISTS `bluecode_customers` (
  `bluec_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `bluec_customer_id` varchar(40) DEFAULT NULL,
  `bluec_scheme_no` tinyint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`bluec_id`),
  KEY `bluecode_customers_cust_no_ckey` (`cust_no`),
  KEY `bluecode_customers_opera_no_ckey` (`opera_no`),
  KEY `bluecode_customers_bluec_customer_id_ckey` (`bluec_customer_id`),
  KEY `bluecode_customers_bluec_scheme_no_ckey` (`bluec_scheme_no`),
  KEY `bluecode_customers_bluec_key_key` (`cust_no`,`bluec_customer_id`),
  KEY `bluecode_customers_bluec_key_customer_key` (`bluec_customer_id`,`cust_no`),
  KEY `bluecode_customers_bluec_key_operator_id_ckey` (`opera_no`,`bluec_customer_id`),
  KEY `bluecode_customers_bluec_key_id_operator_ckey` (`bluec_customer_id`,`opera_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `bluecode_logs`
--

DROP TABLE IF EXISTS `bluecode_logs`;
CREATE TABLE IF NOT EXISTS `bluecode_logs` (
  `bluel_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `bluel_date` datetime DEFAULT NULL,
  `bluel_slip_no` bigint UNSIGNED DEFAULT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `bluel_changed_date` datetime DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `bluel_uuid` varchar(36) DEFAULT NULL,
  `bluel_tan` varchar(40) DEFAULT NULL,
  `bluel_barcode` varchar(20) DEFAULT NULL,
  `bluel_response_content` longtext,
  `bluel_success` tinyint DEFAULT NULL,
  `bluel_error` tinyint DEFAULT NULL,
  `bluel_error_code` varchar(50) DEFAULT NULL,
  `bluel_total` decimal(18,6) DEFAULT '0.000000',
  `bluel_tip` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`bluel_id`),
  KEY `bluecode_logs_opera_no_ckey` (`opera_no`),
  KEY `bluecode_logs_station_no_ckey` (`station_no`),
  KEY `bluecode_logs_branch_no_ckey` (`branch_no`),
  KEY `bluecode_logs_bluel_date_ckey` (`bluel_date`),
  KEY `bluecode_logs_bluel_slip_no_ckey` (`bluel_slip_no`),
  KEY `bluecode_logs_salesm_guid_ckey` (`salesm_guid`),
  KEY `bluecode_logs_bluel_changed_date_ckey` (`bluel_changed_date`),
  KEY `bluecode_logs_bluel_uuid_key` (`bluel_uuid`),
  KEY `bluecode_logs_bluel_tan_ckey` (`bluel_tan`),
  KEY `bluecode_logs_bluel_barcode_ckey` (`bluel_barcode`),
  KEY `bluecode_logs_bluel_success_ckey` (`bluel_success`),
  KEY `bluecode_logs_bluel_error_ckey` (`bluel_error`)
);

--
-- Tabellenstruktur für Tabelle `bluecode_schemes`
--

DROP TABLE IF EXISTS `bluecode_schemes`;
CREATE TABLE IF NOT EXISTS `bluecode_schemes` (
  `blues_id` bigint NOT NULL AUTO_INCREMENT,
  `bluec_scheme_no` tinyint UNSIGNED DEFAULT NULL,
  `blues_description` varchar(35) DEFAULT NULL,
  `blues_code_key` varchar(50) DEFAULT NULL,
  `blues_address_type` tinyint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`blues_id`),
  KEY `bluecode_schemes_bluec_scheme_no_key` (`bluec_scheme_no`),
  KEY `bluecode_schemes_blues_description_ckey` (`blues_description`),
  KEY `bluecode_schemes_blues_code_key_key` (`blues_code_key`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `branches`
--

DROP TABLE IF EXISTS `branches`;
CREATE TABLE IF NOT EXISTS `branches` (
  `branch_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL,
  `branch_ref_no` int UNSIGNED DEFAULT NULL,
  `branch_description` varchar(50) DEFAULT NULL,
  `branch_fiscal_authorities_description` varchar(12) DEFAULT NULL,
  `branch_composite_no_description` varchar(57) DEFAULT NULL,
  `branch_account` int UNSIGNED DEFAULT NULL,
  `branch_offset_account` int UNSIGNED DEFAULT NULL,
  `branch_booking_reference` varchar(6) DEFAULT NULL,
  `branch_customer_payments_offset_account` int UNSIGNED DEFAULT NULL,
  `branch_last_waitl_no` int UNSIGNED DEFAULT '0',
  `branch_customer_payments_booking_reference` varchar(6) DEFAULT NULL,
  `branch_customer_payments_code` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `branches_branch_no_key` (`branch_no`),
  KEY `branches_branch_ref_no_key` (`branch_ref_no`),
  KEY `branches_branch_composite_no_description_key` (`branch_composite_no_description`)
);

--
-- Tabellenstruktur für Tabelle `branch_customer_imports`
--

DROP TABLE IF EXISTS `branch_customer_imports`;
CREATE TABLE IF NOT EXISTS `branch_customer_imports` (
  `branci_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `branci_weekday_1` tinyint DEFAULT '0',
  `branci_weekday_2` tinyint DEFAULT '0',
  `branci_weekday_3` tinyint DEFAULT '0',
  `branci_weekday_4` tinyint DEFAULT '0',
  `branci_weekday_5` tinyint DEFAULT '0',
  `branci_weekday_6` tinyint DEFAULT '0',
  `branci_weekday_7` tinyint DEFAULT '0',
  PRIMARY KEY (`branci_id`),
  KEY `branch_customer_imports_branch_no_ckey` (`branch_no`),
  KEY `branch_customer_imports_cust_no_ckey` (`cust_no`),
  KEY `branch_customer_imports_branci_key_key` (`branch_no`,`cust_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `branch_images`
--

DROP TABLE IF EXISTS `branch_images`;
CREATE TABLE IF NOT EXISTS `branch_images` (
  `branchi_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL,
  `branchi_time_of_day` tinyint UNSIGNED DEFAULT NULL,
  `branchi_sort` int DEFAULT NULL,
  `branchi_image` longblob,
  `branchi_image_file_name` varchar(128) DEFAULT '',
  PRIMARY KEY (`branchi_id`),
  KEY `branch_images_branch_no_ckey` (`branch_no`),
  KEY `branch_images_branchi_time_of_day_ckey` (`branchi_time_of_day`),
  KEY `branch_images_branchi_sort_ckey` (`branchi_sort`),
  KEY `branch_images_branchi_key_ckey` (`branch_no`,`branchi_time_of_day`,`branchi_sort`)
);

--
-- Tabellenstruktur für Tabelle `buildings`
--

DROP TABLE IF EXISTS `buildings`;
CREATE TABLE IF NOT EXISTS `buildings` (
  `build_id` bigint NOT NULL AUTO_INCREMENT,
  `build_no` int UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `build_description` varchar(50) DEFAULT NULL,
  `build_number_of_rooms` int UNSIGNED DEFAULT NULL,
  `build_image` longblob,
  `build_image_file_name` varchar(128) DEFAULT '',
  `build_father_building` int UNSIGNED DEFAULT NULL,
  `build_father_click_x` int UNSIGNED DEFAULT NULL,
  `build_father_click_y` int UNSIGNED DEFAULT NULL,
  `build_father_click_height` int UNSIGNED DEFAULT NULL,
  `build_father_click_width` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`build_id`),
  KEY `buildings_build_no_key` (`build_no`),
  KEY `buildings_branch_no_ckey` (`branch_no`),
  KEY `buildings_build_father_building_ckey` (`build_father_building`),
  KEY `buildings_build_key_ckey` (`branch_no`,`build_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `calendar_entries`
--

DROP TABLE IF EXISTS `calendar_entries`;
CREATE TABLE IF NOT EXISTS `calendar_entries` (
  `cale_id` bigint NOT NULL AUTO_INCREMENT,
  `calt_id` bigint DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `cale_guid` varchar(32) DEFAULT NULL,
  `cale_changed_date` datetime DEFAULT NULL,
  `cref_no` int UNSIGNED DEFAULT NULL,
  `cale_description` varchar(40) DEFAULT NULL,
  `cale_notes` longtext,
  `cale_from_date_time` datetime DEFAULT NULL,
  `cale_to_date_time` datetime DEFAULT NULL,
  `cale_walk_in_customers` tinyint DEFAULT NULL,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `phonel_id` int DEFAULT NULL,
  `cale_first_name` varchar(40) DEFAULT NULL,
  `cale_last_name` varchar(40) DEFAULT NULL,
  `cale_phone_number` varchar(50) DEFAULT NULL,
  `cale_microsoft_outlook_import` tinyint DEFAULT '0',
  `cale_microsoft_outlook_export` tinyint DEFAULT '0',
  `cale_repeat` tinyint DEFAULT '0',
  `cale_table_seats` int DEFAULT NULL,
  `cale_attended` tinyint DEFAULT '0',
  `cale_customer_canceled` tinyint DEFAULT '0',
  `cale_customer_missed` tinyint DEFAULT '0',
  `cale_customer_uesd_online_booking` tinyint DEFAULT '0',
  `cale_canceled_by_staff` tinyint DEFAULT '0',
  `cale_confirmed_by_staff` tinyint DEFAULT '0',
  PRIMARY KEY (`cale_id`),
  KEY `calendar_entries_calt_id_ckey` (`calt_id`),
  KEY `calendar_entries_branch_no_ckey` (`branch_no`),
  KEY `calendar_entries_cale_guid_ckey` (`cale_guid`),
  KEY `calendar_entries_cale_changed_date_ckey` (`cale_changed_date`),
  KEY `calendar_entries_cref_no_ckey` (`cref_no`),
  KEY `calendar_entries_cale_from_date_time_ckey` (`cale_from_date_time`),
  KEY `calendar_entries_cale_to_date_time_ckey` (`cale_to_date_time`),
  KEY `calendar_entries_cust_no_ckey` (`cust_no`),
  KEY `calendar_entries_phonel_id_ckey` (`phonel_id`),
  KEY `calendar_entries_cale_attended_ckey` (`cale_attended`),
  KEY `calendar_entries_cale_customer_canceled_ckey` (`cale_customer_canceled`),
  KEY `calendar_entries_cale_customer_missed_ckey` (`cale_customer_missed`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `calendar_infos`
--

DROP TABLE IF EXISTS `calendar_infos`;
CREATE TABLE IF NOT EXISTS `calendar_infos` (
  `cali_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `cali_date` date DEFAULT NULL,
  `cali_date_entry` datetime DEFAULT NULL,
  `cali_text` longtext,
  `cali_control_width` double DEFAULT '0',
  PRIMARY KEY (`cali_id`),
  KEY `calendar_infos_cust_no_ckey` (`cust_no`),
  KEY `calendar_infos_cali_date_ckey` (`cali_date`),
  KEY `calendar_infos_cali_date_entry_ckey` (`cali_date_entry`),
  KEY `calendar_infos_cali_key_customer_no_date_ckey` (`cust_no`,`cali_date`),
  KEY `calendar_infos_cali_key_date_customer_no_ckey` (`cali_date`,`cust_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `calendar_types`
--

DROP TABLE IF EXISTS `calendar_types`;
CREATE TABLE IF NOT EXISTS `calendar_types` (
  `calt_id` bigint NOT NULL AUTO_INCREMENT,
  `calt_description` varchar(35) DEFAULT NULL,
  `calt_subject` tinyint UNSIGNED DEFAULT NULL,
  `calt_type` tinyint UNSIGNED DEFAULT '0',
  `calt_image` longblob,
  `calt_image_file_name` varchar(128) DEFAULT '',
  `calt_minutes` int UNSIGNED DEFAULT '60',
  PRIMARY KEY (`calt_id`)
);

--
-- Tabellenstruktur für Tabelle `cash_inflows`
--

DROP TABLE IF EXISTS `cash_inflows`;
CREATE TABLE IF NOT EXISTS `cash_inflows` (
  `cashi_id` bigint NOT NULL AUTO_INCREMENT,
  `cashi_no` int UNSIGNED DEFAULT NULL,
  `cashi_description` varchar(50) DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`cashi_id`),
  KEY `cash_inflows_cashi_no_key` (`cashi_no`),
  KEY `cash_inflows_prod_no_ckey` (`prod_no`)
);

--
-- Tabellenstruktur für Tabelle `cash_outflows`
--

DROP TABLE IF EXISTS `cash_outflows`;
CREATE TABLE IF NOT EXISTS `cash_outflows` (
  `casho_id` bigint NOT NULL AUTO_INCREMENT,
  `casho_no` int UNSIGNED DEFAULT NULL,
  `casho_description` varchar(50) DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`casho_id`),
  KEY `cash_outflows_casho_no_key` (`casho_no`),
  KEY `cash_outflows_prod_no_ckey` (`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `characteristic_details`
--

DROP TABLE IF EXISTS `characteristic_details`;
CREATE TABLE IF NOT EXISTS `characteristic_details` (
  `chard_id` bigint NOT NULL AUTO_INCREMENT,
  `chard_no` int DEFAULT NULL,
  `charm_no` int DEFAULT NULL,
  `chard_description` varchar(50) DEFAULT NULL,
  `chard_sort` int DEFAULT NULL,
  PRIMARY KEY (`chard_id`),
  KEY `characteristic_details_chard_no_key` (`chard_no`),
  KEY `characteristic_details_charm_no_ckey` (`charm_no`),
  KEY `characteristic_details_chard_sort_ckey` (`chard_sort`),
  KEY `characteristic_details_chard_key_ckey` (`charm_no`,`chard_no`),
  KEY `characteristic_details_chard_key_sort_ckey` (`charm_no`,`chard_sort`)
);

--
-- Daten für Tabelle `characteristic_details`
--

INSERT INTO `characteristic_details` (`chard_id`, `chard_no`, `charm_no`, `chard_description`, `chard_sort`) VALUES
(7, 1, 1, 'Klein 300ml', 1),
(9, 2, 1, 'Gross 500ml', 2);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `characteristic_master`
--

DROP TABLE IF EXISTS `characteristic_master`;
CREATE TABLE IF NOT EXISTS `characteristic_master` (
  `charm_id` bigint NOT NULL AUTO_INCREMENT,
  `charm_no` int DEFAULT NULL,
  `charm_description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`charm_id`),
  KEY `characteristic_master_charm_no_key` (`charm_no`),
  KEY `characteristic_master_charm_description_ckey` (`charm_description`)
);

--
-- Tabellenstruktur für Tabelle `combo_meals`
--

DROP TABLE IF EXISTS `combo_meals`;
CREATE TABLE IF NOT EXISTS `combo_meals` (
  `combm_id` bigint NOT NULL AUTO_INCREMENT,
  `combm_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `combm_destination_prod_no` bigint UNSIGNED DEFAULT NULL,
  `combm_quantity` double DEFAULT NULL,
  `combm_print_on_slip` tinyint DEFAULT '1',
  `combm_print_on_kitchen_order` tinyint DEFAULT '1',
  `combm_print_price` tinyint DEFAULT '1',
  `combm_debit_stock` tinyint UNSIGNED DEFAULT '3',
  `combm_swap_this_product` tinyint DEFAULT '1',
  `combm_swap_type` tinyint UNSIGNED DEFAULT '1',
  `combm_swap_maximum_percent_price_difference` double DEFAULT '15',
  `selm_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`combm_id`),
  UNIQUE KEY `combo_meals_combm_key_key` (`prod_no`,`combm_no`),
  KEY `combo_meals_combm_no_ckey` (`combm_no`),
  KEY `combo_meals_prod_no_ckey` (`prod_no`),
  KEY `combo_meals_selm_no_ckey` (`selm_no`)
);

--
-- Tabellenstruktur für Tabelle `commission_groups`
--

DROP TABLE IF EXISTS `commission_groups`;
CREATE TABLE IF NOT EXISTS `commission_groups` (
  `commg_id` bigint NOT NULL AUTO_INCREMENT,
  `commg_no` int UNSIGNED DEFAULT NULL,
  `commg_description` varchar(50) DEFAULT NULL,
  `commg_match_code` varchar(30) DEFAULT NULL,
  `commg_composite_no_match` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`commg_id`),
  KEY `commission_groups_commg_no_key` (`commg_no`),
  KEY `commission_groups_commg_match_code_ckey` (`commg_match_code`),
  KEY `commission_groups_commg_composite_no_match_key` (`commg_composite_no_match`)
);

--
-- Tabellenstruktur für Tabelle `commission_operators`
--

DROP TABLE IF EXISTS `commission_operators`;
CREATE TABLE IF NOT EXISTS `commission_operators` (
  `commo_id` bigint NOT NULL AUTO_INCREMENT,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `commg_no` int UNSIGNED DEFAULT NULL,
  `commo_date` date DEFAULT NULL,
  `commo_class_a` double DEFAULT '0',
  `commo_class_b` double DEFAULT '0',
  `commo_class_c` double DEFAULT '0',
  PRIMARY KEY (`commo_id`),
  KEY `commission_operators_opera_no_ckey` (`opera_no`),
  KEY `commission_operators_commg_no_ckey` (`commg_no`),
  KEY `commission_operators_commo_date_ckey` (`commo_date`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `commission_pyramid`
--

DROP TABLE IF EXISTS `commission_pyramid`;
CREATE TABLE IF NOT EXISTS `commission_pyramid` (
  `commp_id` bigint NOT NULL AUTO_INCREMENT,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `commp_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`commp_id`),
  KEY `commission_pyramid_opera_no_ckey` (`opera_no`),
  KEY `commission_pyramid_commp_no_ckey` (`commp_no`),
  KEY `commission_pyramid_commp_key_operator_pyramid_key` (`opera_no`,`commp_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `company_settings`
--

DROP TABLE IF EXISTS `company_settings`;
CREATE TABLE IF NOT EXISTS `company_settings` (
  `comset_id` bigint NOT NULL AUTO_INCREMENT,
  `comset_no` int DEFAULT '0',
  `comset_address_text` longtext,
  `comset_address_addresser_text` longtext,
  `comset_company_name` varchar(50) DEFAULT '',
  `comset_company_name_2` varchar(50) DEFAULT '0',
  `comset_street` varchar(50) DEFAULT '',
  `count_no` varchar(2) DEFAULT '',
  `postc_no` varchar(8) DEFAULT '',
  `comset_city` varchar(50) DEFAULT '',
  `comset_tel` varchar(50) DEFAULT '',
  `comset_mobile` varchar(50) DEFAULT '',
  `comset_email` varchar(50) DEFAULT '',
  `comset_www` varchar(50) DEFAULT '',
  `comset_uid` varchar(50) DEFAULT '',
  `comset_tax_no` varchar(50) DEFAULT '',
  `comset_company_registration_number` varchar(50) DEFAULT '',
  `comset_managing_director` varchar(50) DEFAULT '',
  PRIMARY KEY (`comset_id`),
  UNIQUE KEY `comset_no` (`comset_no`),
  KEY `WDIDX16788927351` (`count_no`),
  KEY `WDIDX16788927352` (`postc_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `countries`
--

DROP TABLE IF EXISTS `countries`;
CREATE TABLE IF NOT EXISTS `countries` (
  `count_id` bigint NOT NULL AUTO_INCREMENT,
  `count_no` varchar(2) DEFAULT NULL,
  `count_no_iso` varchar(3) DEFAULT NULL,
  `count_description` varchar(100) DEFAULT NULL,
  `count_phone_area_code` varchar(5) DEFAULT NULL,
  `count_shop_address_type` longtext,
  `count_image` longblob,
  `count_image_file_name` varchar(128) DEFAULT '',
  PRIMARY KEY (`count_id`),
  KEY `countries_count_no_key` (`count_no`),
  KEY `countries_count_no_iso_ckey` (`count_no_iso`),
  KEY `countries_count_description_ckey` (`count_description`),
  KEY `countries_count_phone_area_code_ckey` (`count_phone_area_code`)
);

--
-- Tabellenstruktur für Tabelle `courses`
--

DROP TABLE IF EXISTS `courses`;
CREATE TABLE IF NOT EXISTS `courses` (
  `cours_id` bigint NOT NULL AUTO_INCREMENT,
  `cours_no` int UNSIGNED DEFAULT NULL,
  `cours_description` varchar(50) DEFAULT NULL,
  `cours_font_color` int UNSIGNED DEFAULT NULL,
  `cours_background_color` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`cours_id`),
  KEY `courses_cours_no_key` (`cours_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `cross_references`
--

DROP TABLE IF EXISTS `cross_references`;
CREATE TABLE IF NOT EXISTS `cross_references` (
  `cref_id` bigint NOT NULL AUTO_INCREMENT,
  `cref_no` int UNSIGNED DEFAULT NULL,
  `cref_description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`cref_id`),
  KEY `cross_references_cref_no_key` (`cref_no`),
  KEY `cross_references_cref_description_ckey` (`cref_description`)
);

--
-- Tabellenstruktur für Tabelle `customers`
--

DROP TABLE IF EXISTS `customers`;
CREATE TABLE IF NOT EXISTS `customers` (
  `cust_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `cust_reserved` tinyint DEFAULT NULL,
  `cust_accounts_receivable_account` int UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED DEFAULT NULL,
  `cust_ref_no` int UNSIGNED DEFAULT NULL,
  `cust_composite_no_match_code` varchar(50) DEFAULT NULL,
  `cust_locked` tinyint DEFAULT '0',
  `cust_last_changed` datetime DEFAULT NULL,
  `cust_search` varchar(40) DEFAULT NULL,
  `custg_no` int DEFAULT NULL,
  `cust_company` varchar(50) DEFAULT NULL,
  `cust_company_department` varchar(50) DEFAULT '',
  `sal_no` int DEFAULT '0',
  `tit_no` int DEFAULT '0',
  `cust_first_name` varchar(40) DEFAULT NULL,
  `cust_last_name` varchar(40) DEFAULT NULL,
  `cust_street` varchar(50) DEFAULT NULL,
  `postc_no` varchar(8) DEFAULT NULL,
  `cust_city` varchar(50) DEFAULT NULL,
  `count_no` varchar(2) DEFAULT NULL,
  `cust_price_type` tinyint UNSIGNED DEFAULT '0',
  `cust_text` longtext,
  `cust_discount` double DEFAULT '0',
  `salesdc_no` int DEFAULT '0',
  `cust_phone` varchar(50) DEFAULT NULL,
  `cust_mobile_phone` varchar(50) DEFAULT NULL,
  `cust_fax` varchar(50) DEFAULT NULL,
  `cust_email` varchar(128) DEFAULT NULL,
  `cust_send_emails` tinyint DEFAULT '0',
  `cust_skype` varchar(100) DEFAULT NULL,
  `cust_invoice_copies` tinyint UNSIGNED DEFAULT '2',
  `banka_no` int DEFAULT '0',
  `cust_birthday` date DEFAULT NULL,
  `cust_created` date DEFAULT NULL,
  `cust_last_purchase` date DEFAULT NULL,
  `cust_annual_sales_last_year` decimal(18,6) DEFAULT '0.000000',
  `cust_annual_sales_this_year` decimal(18,6) DEFAULT '0.000000',
  `cust_turnover_not_deducted` decimal(18,6) DEFAULT '0.000000',
  `cust_uid` varchar(20) DEFAULT NULL,
  `cust_bank_name` varchar(60) DEFAULT NULL,
  `cust_bank_code_old` varchar(10) DEFAULT NULL,
  `cust_bank_no_old` varchar(50) DEFAULT NULL,
  `cust_iban` varchar(25) DEFAULT NULL,
  `cust_bic` varchar(12) DEFAULT NULL,
  `cust_sepa_id` varchar(35) DEFAULT NULL,
  `cust_contact_name` varchar(50) DEFAULT NULL,
  `cust_balance` decimal(18,6) DEFAULT '0.000000',
  `cust_balance_last_clearing` datetime DEFAULT NULL,
  `formt_no` int UNSIGNED DEFAULT NULL,
  `shop_id` bigint DEFAULT NULL,
  `cust_driver_tour_sort_1` varchar(12) DEFAULT NULL,
  `cust_driver_tour_sort_2` varchar(12) DEFAULT NULL,
  `cust_driver_tour_sort_3` varchar(12) DEFAULT NULL,
  `cust_driver_tour_sort_4` varchar(12) DEFAULT NULL,
  `cust_driver_tour_sort_5` varchar(12) DEFAULT NULL,
  `cust_driver_tour_sort_6` varchar(12) DEFAULT NULL,
  `cust_driver_tour_sort_7` varchar(12) DEFAULT NULL,
  PRIMARY KEY (`cust_id`),
  KEY `customers_cust_no_key` (`cust_no`),
  KEY `customers_cust_reserved_ckey` (`cust_reserved`),
  KEY `customers_cust_accounts_receivable_account_ckey` (`cust_accounts_receivable_account`),
  KEY `customers_branch_no_ckey` (`branch_no`),
  KEY `customers_cust_composite_no_match_code_ckey` (`cust_composite_no_match_code`),
  KEY `customers_cust_last_changed_ckey` (`cust_last_changed`),
  KEY `customers_cust_search_ckey` (`cust_search`),
  KEY `customers_custg_no_ckey` (`custg_no`),
  KEY `customers_sal_no_ckey` (`sal_no`),
  KEY `customers_tit_no_ckey` (`tit_no`),
  KEY `customers_postc_no_ckey` (`postc_no`),
  KEY `customers_cust_city_ckey` (`cust_city`),
  KEY `customers_count_no_ckey` (`count_no`),
  KEY `customers_cust_phone_ckey` (`cust_phone`),
  KEY `customers_cust_email_ckey` (`cust_email`),
  KEY `customers_cust_birthday_ckey` (`cust_birthday`),
  KEY `customers_cust_created_ckey` (`cust_created`),
  KEY `customers_cust_last_purchase_ckey` (`cust_last_purchase`),
  KEY `customers_cust_sepa_id_ckey` (`cust_sepa_id`),
  KEY `customers_formt_no_ckey` (`formt_no`),
  KEY `customers_shop_id_ckey` (`shop_id`),
  KEY `customers_cust_driver_tour_sort_1_ckey` (`cust_driver_tour_sort_1`),
  KEY `customers_cust_driver_tour_sort_2_ckey` (`cust_driver_tour_sort_2`),
  KEY `customers_cust_driver_tour_sort_3_ckey` (`cust_driver_tour_sort_3`),
  KEY `customers_cust_driver_tour_sort_4_ckey` (`cust_driver_tour_sort_4`),
  KEY `customers_cust_driver_tour_sort_5_ckey` (`cust_driver_tour_sort_5`),
  KEY `customers_cust_driver_tour_sort_6_ckey` (`cust_driver_tour_sort_6`),
  KEY `customers_cust_driver_tour_sort_7_ckey` (`cust_driver_tour_sort_7`),
  KEY `customers_salesdc_no_ckey` (`salesdc_no`),
  KEY `customers_banka_no_key` (`banka_no`)
);


--
-- Tabellenstruktur für Tabelle `customer_emails`
--

DROP TABLE IF EXISTS `customer_emails`;
CREATE TABLE IF NOT EXISTS `customer_emails` (
  `custe_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `custe_email_address` varchar(128) DEFAULT NULL,
  `custe_subject` varchar(80) DEFAULT NULL,
  `custe_body` longtext,
  `custe_date_time` datetime DEFAULT NULL,
  `custe_date_time_send` datetime DEFAULT NULL,
  `custe_attachment` longblob,
  `custe_file_name` varchar(128) DEFAULT NULL,
  `custe_failed` tinyint DEFAULT NULL,
  `custe_source` longtext,
  `custe_error_code` varchar(128) DEFAULT NULL,
  `custe_email_address_sender` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`custe_id`),
  KEY `customer_emails_cust_no_ckey` (`cust_no`),
  KEY `customer_emails_custe_email_address_ckey` (`custe_email_address`),
  KEY `customer_emails_custe_date_time_ckey` (`custe_date_time`),
  KEY `customer_emails_custe_date_time_send_ckey` (`custe_date_time_send`),
  KEY `customer_emails_custe_file_name_ckey` (`custe_file_name`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `customer_groups`
--

DROP TABLE IF EXISTS `customer_groups`;
CREATE TABLE IF NOT EXISTS `customer_groups` (
  `custg_id` bigint NOT NULL AUTO_INCREMENT,
  `custg_no` int DEFAULT NULL,
  `custg_description` varchar(40) DEFAULT NULL,
  `custg_composite_no_description` varchar(50) DEFAULT NULL,
  `custg_sort` int DEFAULT NULL,
  `custg_ref_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`custg_id`),
  KEY `customer_groups_custg_no_key` (`custg_no`),
  KEY `customer_groups_custg_description_key` (`custg_description`),
  KEY `customer_groups_custg_composite_no_description_ckey` (`custg_composite_no_description`),
  KEY `customer_groups_custg_sort_ckey` (`custg_sort`),
  KEY `customer_groups_custg_ref_no_key` (`custg_ref_no`)
);

--
-- Tabellenstruktur für Tabelle `customer_group_links`
--

DROP TABLE IF EXISTS `customer_group_links`;
CREATE TABLE IF NOT EXISTS `customer_group_links` (
  `custgl_id` bigint NOT NULL AUTO_INCREMENT,
  `custg_no` smallint DEFAULT '0',
  `cust_no` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`custgl_id`),
  UNIQUE KEY `custgl_key` (`custg_no`,`cust_no`),
  UNIQUE KEY `custgl_mkey` (`cust_no`,`custg_no`),
  KEY `WDIDX16788927353` (`custg_no`),
  KEY `WDIDX16788927354` (`cust_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `customer_loyalty_accountings`
--

DROP TABLE IF EXISTS `customer_loyalty_accountings`;
CREATE TABLE IF NOT EXISTS `customer_loyalty_accountings` (
  `custl_id` bigint NOT NULL AUTO_INCREMENT,
  `custl_day` date DEFAULT NULL,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `custl_amount` decimal(18,6) DEFAULT '0.000000',
  `custl_barcode` varchar(80) DEFAULT NULL,
  `custl_printed` tinyint DEFAULT '0',
  `custl_type` tinyint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`custl_id`),
  KEY `customer_loyalty_accountings_custl_day_ckey` (`custl_day`),
  KEY `customer_loyalty_accountings_cust_no_ckey` (`cust_no`),
  KEY `customer_loyalty_accountings_custl_barcode_ckey` (`custl_barcode`),
  KEY `customer_loyalty_accountings_custl_printed_ckey` (`custl_printed`),
  KEY `customer_loyalty_accountings_custl_key_ckey` (`cust_no`,`custl_barcode`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `customer_notes`
--

DROP TABLE IF EXISTS `customer_notes`;
CREATE TABLE IF NOT EXISTS `customer_notes` (
  `custn_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `custn_date` datetime DEFAULT NULL,
  `custn_changed_date` datetime DEFAULT NULL,
  `formd_id` bigint DEFAULT NULL,
  `custn_value` longtext,
  `custn_image` longblob,
  `custn_image_file_name` varchar(128) DEFAULT NULL,
  `custn_image_height` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`custn_id`),
  KEY `customer_notes_cust_no_ckey` (`cust_no`),
  KEY `customer_notes_opera_no_ckey` (`opera_no`),
  KEY `customer_notes_custn_date_ckey` (`custn_date`),
  KEY `customer_notes_custn_changed_date_ckey` (`custn_changed_date`),
  KEY `customer_notes_formd_id_ckey` (`formd_id`),
  KEY `customer_notes_custn_key_date_ckey` (`cust_no`,`formd_id`,`custn_date`),
  KEY `customer_notes_custn_key_ckey` (`cust_no`,`formd_id`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `customer_sales_accounts`
--

DROP TABLE IF EXISTS `customer_sales_accounts`;
CREATE TABLE IF NOT EXISTS `customer_sales_accounts` (
  `custsa_id` bigint NOT NULL AUTO_INCREMENT,
  `cust_no` int UNSIGNED DEFAULT NULL,
  `custsa_date` datetime DEFAULT NULL,
  `custsa_type` tinyint UNSIGNED DEFAULT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `salesm_slip_no` bigint UNSIGNED DEFAULT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `custsa_amount` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`custsa_id`),
  KEY `customer_sales_accounts_cust_no_ckey` (`cust_no`),
  KEY `customer_sales_accounts_custsa_date_ckey` (`custsa_date`),
  KEY `customer_sales_accounts_custsa_type_ckey` (`custsa_type`),
  KEY `customer_sales_accounts_salesm_guid_ckey` (`salesm_guid`),
  KEY `customer_sales_accounts_salesm_slip_no_ckey` (`salesm_slip_no`),
  KEY `customer_sales_accounts_station_no_ckey` (`station_no`),
  KEY `customer_sales_accounts_custsa_key_ckey` (`cust_no`,`custsa_date`),
  KEY `customer_sales_accounts_custsa_key_type_ckey` (`cust_no`,`custsa_type`,`custsa_date`)
);

--
-- Tabellenstruktur für Tabelle `data_transfer_list`
--

DROP TABLE IF EXISTS `data_transfer_list`;
CREATE TABLE IF NOT EXISTS `data_transfer_list` (
  `dtl_id` bigint NOT NULL AUTO_INCREMENT,
  `dtl_date` datetime DEFAULT NULL,
  `dtl_from_station` int UNSIGNED DEFAULT NULL,
  `dtl_to_station` int UNSIGNED DEFAULT NULL,
  `dtl_type` varchar(3) DEFAULT NULL,
  `dtl_message` longtext,
  `dtl_done` tinyint DEFAULT '0',
  PRIMARY KEY (`dtl_id`),
  KEY `data_transfer_list_dtl_from_station_ckey` (`dtl_from_station`),
  KEY `data_transfer_list_dtl_to_station_ckey` (`dtl_to_station`),
  KEY `data_transfer_list_dtl_date_ckey` (`dtl_date`),
  KEY `data_transfer_list_dtl_type_ckey` (`dtl_type`),
  KEY `data_transfer_list_dtl_done_ckey` (`dtl_done`),
  KEY `data_transfer_list_dtl_key_ckey` (`dtl_done`,`dtl_from_station`,`dtl_to_station`,`dtl_id`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `delivery_types`
--

DROP TABLE IF EXISTS `delivery_types`;
CREATE TABLE IF NOT EXISTS `delivery_types` (
  `delt_id` bigint NOT NULL AUTO_INCREMENT,
  `delt_no` int DEFAULT '0',
  `delt_description` varchar(50) DEFAULT '0',
  `delt_eat_here` tinyint DEFAULT '0',
  `delt_take_away` tinyint DEFAULT '0',
  `delt_delivery` tinyint DEFAULT '0',
  PRIMARY KEY (`delt_id`),
  KEY `delivery_types_delt_no_key` (`delt_no`),
  KEY `delivery_types_delt_description_ckey` (`delt_description`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `device_details`
--

DROP TABLE IF EXISTS `device_details`;
CREATE TABLE IF NOT EXISTS `device_details` (
  `deviced_id` bigint NOT NULL AUTO_INCREMENT,
  `devicem_no` int DEFAULT NULL,
  `deviced_no` int DEFAULT NULL,
  `deviced_description` varchar(50) DEFAULT NULL,
  `deviced_code` varchar(255) DEFAULT NULL,
  `devicem_type` tinyint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`deviced_id`),
  UNIQUE KEY `device_details_deviced_key_key` (`devicem_no`,`deviced_no`),
  KEY `device_details_devicem_no_ckey` (`devicem_no`),
  KEY `device_details_deviced_no_ckey` (`deviced_no`)
);

--
-- Tabellenstruktur für Tabelle `device_master`
--

DROP TABLE IF EXISTS `device_master`;
CREATE TABLE IF NOT EXISTS `device_master` (
  `devicem_id` bigint NOT NULL AUTO_INCREMENT,
  `devicem_no` int DEFAULT '0',
  `devicem_port_name` varchar(255) DEFAULT NULL,
  `devicem_name` varchar(255) DEFAULT NULL,
  `devicem_description` longtext,
  `devicem_connection_type` tinyint UNSIGNED DEFAULT '0',
  `devicem_type` tinyint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`devicem_id`),
  UNIQUE KEY `device_master_devicem_no_key` (`devicem_no`)
);

--
-- Tabellenstruktur für Tabelle `dining_areas`
--

DROP TABLE IF EXISTS `dining_areas`;
CREATE TABLE IF NOT EXISTS `dining_areas` (
  `dareas_id` bigint NOT NULL AUTO_INCREMENT,
  `dareas_no` int UNSIGNED DEFAULT '0',
  `branch_no` int UNSIGNED DEFAULT '0',
  `dareas_description` varchar(50) DEFAULT NULL,
  `dareas_tables_count` int UNSIGNED DEFAULT '1',
  `dareas_image` longblob,
  `dareas_image_file_name` varchar(128) DEFAULT '',
  `dareas_master_no` int UNSIGNED DEFAULT '0',
  `dareas_master_x` int UNSIGNED DEFAULT '0',
  `dareas_master_y` int UNSIGNED DEFAULT '0',
  `dareas_master_width` int UNSIGNED DEFAULT '0',
  `dareas_master_height` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`dareas_id`),
  KEY `dining_areas_dareas_no_key` (`dareas_no`),
  KEY `dining_areas_branch_no_ckey` (`branch_no`),
  KEY `dining_areas_dareas_master_no_ckey` (`dareas_master_no`),
  KEY `dining_areas_dareas_key_ckey` (`branch_no`,`dareas_no`)
);

--
-- Tabellenstruktur für Tabelle `fonts`
--

DROP TABLE IF EXISTS `fonts`;
CREATE TABLE IF NOT EXISTS `fonts` (
  `font_id` bigint NOT NULL AUTO_INCREMENT,
  `font_no` int DEFAULT '0',
  `font_name` varchar(128) DEFAULT '',
  `font_image` longblob,
  `font_image_file_name` varchar(128) DEFAULT '',
  PRIMARY KEY (`font_id`),
  KEY `fonts_font_no_key` (`font_no`),
  KEY `fonts_font_name_key` (`font_name`)
);

--
-- Tabellenstruktur für Tabelle `form_template_details`
--

DROP TABLE IF EXISTS `form_template_details`;
CREATE TABLE IF NOT EXISTS `form_template_details` (
  `formd_id` bigint NOT NULL AUTO_INCREMENT,
  `formd_no` int DEFAULT '0',
  `formt_no` int UNSIGNED DEFAULT '0',
  `formd_control` varchar(50) DEFAULT '0',
  `formd_type` tinyint UNSIGNED DEFAULT '0',
  `formd_page` tinyint UNSIGNED DEFAULT '0',
  `formd_x` double DEFAULT '0',
  `formd_y` double DEFAULT '0',
  `formd_width` double DEFAULT '0',
  `formd_height` double DEFAULT '0',
  `formd_font_name` varchar(50) DEFAULT '',
  `formd_font_size` double DEFAULT '0',
  `formd_font_bold` tinyint DEFAULT '0',
  `formd_font_italic` tinyint DEFAULT '0',
  `formd_font_underlined` tinyint DEFAULT '0',
  `formd_value` varchar(512) DEFAULT NULL,
  `formd_image` longblob,
  `formd_image_file_name` varchar(80) DEFAULT '',
  `formd_angel` int DEFAULT '0',
  `formd_font_strike_out` tinyint DEFAULT '0',
  `formd_font_color` int UNSIGNED DEFAULT '0',
  `formd_background_color` int UNSIGNED DEFAULT '0',
  `formd_orientation_horizontal` tinyint UNSIGNED DEFAULT '0',
  `formd_orientation_vertical` tinyint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`formd_id`),
  KEY `form_template_details_formd_no_ckey` (`formd_no`),
  KEY `form_template_details_formt_no_ckey` (`formt_no`),
  KEY `form_template_details_formd_control_ckey` (`formd_control`),
  KEY `form_template_details_formd_type_ckey` (`formd_type`),
  KEY `form_template_details_formd_page_ckey` (`formd_page`),
  KEY `form_template_details_formd_key_ckey` (`formt_no`,`formd_page`,`formd_control`),
  KEY `form_template_details_formd_key_id_ckey` (`formt_no`,`formd_page`,`formd_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `form_template_master`
--

DROP TABLE IF EXISTS `form_template_master`;
CREATE TABLE IF NOT EXISTS `form_template_master` (
  `formt_id` bigint NOT NULL AUTO_INCREMENT,
  `formt_no` int UNSIGNED DEFAULT '0',
  `formt_type` tinyint UNSIGNED DEFAULT '0',
  `formt_description` varchar(50) DEFAULT NULL,
  `formt_border` tinyint DEFAULT '0',
  `formt_preview` tinyint DEFAULT '0',
  `formt_width` double DEFAULT '0',
  `formt_height` double DEFAULT '0',
  `formt_border_right` double DEFAULT '0',
  `formt_border_left` double DEFAULT '0',
  `formt_border_top` double DEFAULT '0',
  `formt_border_bottom` double DEFAULT '0',
  `formt_zoom` int UNSIGNED DEFAULT '180',
  `formt_background_color` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`formt_id`),
  KEY `form_template_master_formt_no_key` (`formt_no`)
);

--
-- Tabellenstruktur für Tabelle `kiosk_details`
--

DROP TABLE IF EXISTS `kiosk_details`;
CREATE TABLE IF NOT EXISTS `kiosk_details` (
  `kioskd_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED DEFAULT '0',
  `kioskm_no` int DEFAULT '0',
  `kioskm_page_no` int DEFAULT '0',
  `kioskd_name` varchar(36) NOT NULL DEFAULT '',
  `kioskd_sort` int DEFAULT '0',
  `kioskd_x` int DEFAULT '0',
  `kioskd_y` int DEFAULT '0',
  `kioskd_width` int DEFAULT '0',
  `kioskd_height` int DEFAULT '0',
  `kioskd_type` tinyint UNSIGNED DEFAULT '0',
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `kioskd_program` varchar(160) DEFAULT NULL,
  `kioskd_offset_x` int DEFAULT '0',
  `kioskd_offset_y` int DEFAULT '0',
  `kioskd_font_name` varchar(50) DEFAULT 'Roboto Condensed',
  `kioskd_font_size` int DEFAULT '8',
  `kioskd_font_bold` tinyint DEFAULT '0',
  `kioskd_font_italic` tinyint DEFAULT '0',
  `kioskd_font_underlined` tinyint DEFAULT '0',
  `kioskd_font_color` int DEFAULT '16777215',
  `kioskd_text_pos_x` int UNSIGNED DEFAULT '0',
  `kioskd_text_pos_y` int UNSIGNED DEFAULT '0',
  `kioskd_generate_2_image` tinyint DEFAULT '0',
  `kioskd_dont_use_offset_for_text` tinyint DEFAULT '0',
  PRIMARY KEY (`kioskd_id`),
  KEY `kiosk_details_station_no_ckey` (`station_no`),
  KEY `kiosk_details_kioskm_no_ckey` (`kioskm_no`),
  KEY `kiosk_details_kioskm_page_no_ckey` (`kioskm_page_no`),
  KEY `kiosk_details_prod_no_ckey` (`prod_no`),
  KEY `kiosk_details_kioskd_key_key` (`station_no`,`kioskm_no`,`kioskm_page_no`),
  KEY `kiosk_details_kioskd_key_sort_ckey` (`station_no`,`kioskm_no`,`kioskm_page_no`,`kioskd_sort`),
  KEY `kiosk_details_kioskd_name_key` (`kioskd_name`)
);

--
-- Tabellenstruktur für Tabelle `kiosk_master`
--

DROP TABLE IF EXISTS `kiosk_master`;
CREATE TABLE IF NOT EXISTS `kiosk_master` (
  `kioskm_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED DEFAULT '0',
  `kioskm_no` int DEFAULT '0',
  `kioskm_page_no` int DEFAULT '0',
  `kioskm_previous_page_no` int DEFAULT '0',
  `kioskm_description` varchar(50) DEFAULT '',
  `kioskm_page_type` tinyint UNSIGNED DEFAULT '0',
  `kioskm_background_image` longblob,
  `kioskm_width` int DEFAULT '0',
  `kioskm_height` int DEFAULT '0',
  `selm_no_dine_in` int UNSIGNED DEFAULT '0',
  `selm_no_take_away` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`kioskm_id`),
  UNIQUE KEY `kiosk_master_kioskm_key_key` (`station_no`,`kioskm_no`,`kioskm_page_no`) USING BTREE,
  KEY `kiosk_master_station_no_ckey` (`station_no`),
  KEY `kiosk_master_kioskm_no_ckey` (`kioskm_no`),
  KEY `kiosk_master_kioskm_page_no_ckey` (`kioskm_page_no`)
);

--
-- Tabellenstruktur für Tabelle `kiosk_translations`
--

DROP TABLE IF EXISTS `kiosk_translations`;
CREATE TABLE IF NOT EXISTS `kiosk_translations` (
  `kioskt_id` bigint NOT NULL AUTO_INCREMENT,
  `kioskd_name` varchar(36) DEFAULT '',
  `lang_no` int DEFAULT '0',
  `kioskt_description` longtext,
  `kioskt_image` longblob,
  PRIMARY KEY (`kioskt_id`),
  KEY `kiosk_translations_lang_no_ckey` (`lang_no`),
  KEY `kiosk_translations_kioskt_key_key` (`lang_no`)
) ENGINE=InnoDB AUTO_INCREMENT=1319 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tabellenstruktur für Tabelle `languages`
--

DROP TABLE IF EXISTS `languages`;
CREATE TABLE IF NOT EXISTS `languages` (
  `lang_id` bigint NOT NULL AUTO_INCREMENT,
  `lang_no` int DEFAULT NULL,
  `lang_description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`lang_id`),
  KEY `languages_lang_no_key` (`lang_no`),
  KEY `languages_lang_description_ckey` (`lang_description`)
);


--
-- Tabellenstruktur für Tabelle `money_counting_lists`
--

DROP TABLE IF EXISTS `money_counting_lists`;
CREATE TABLE IF NOT EXISTS `money_counting_lists` (
  `moncl_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `moncl_no` int UNSIGNED DEFAULT NULL,
  `moncl_date` date DEFAULT NULL,
  `moncl_cent_1` int UNSIGNED DEFAULT '0',
  `moncl_cent_2` int UNSIGNED DEFAULT '0',
  `moncl_cent_5` int UNSIGNED DEFAULT '0',
  `moncl_cent_10` int UNSIGNED DEFAULT '0',
  `moncl_cent_20` int UNSIGNED DEFAULT '0',
  `moncl_cent_50` int UNSIGNED DEFAULT '0',
  `moncl_euro_1` int UNSIGNED DEFAULT '0',
  `moncl_euro_2` int UNSIGNED DEFAULT '0',
  `moncl_note_5` int UNSIGNED DEFAULT '0',
  `moncl_note_10` int UNSIGNED DEFAULT '0',
  `moncl_note_20` int UNSIGNED DEFAULT '0',
  `moncl_note_50` int UNSIGNED DEFAULT '0',
  `moncl_note_100` int UNSIGNED DEFAULT '0',
  `moncl_note_200` int UNSIGNED DEFAULT '0',
  `moncl_note_500` int UNSIGNED DEFAULT '0',
  `moncl_total` decimal(18,6) DEFAULT '0.000000',
  `moncl_change` decimal(18,6) DEFAULT '0.000000',
  `moncl_changed_date` datetime DEFAULT NULL,
  PRIMARY KEY (`moncl_id`),
  KEY `money_counting_lists_branch_no_ckey` (`branch_no`),
  KEY `money_counting_lists_station_no_ckey` (`station_no`),
  KEY `money_counting_lists_moncl_no_ckey` (`moncl_no`),
  KEY `money_counting_lists_moncl_date_ckey` (`moncl_date`),
  KEY `money_counting_lists_moncl_changed_date_ckey` (`moncl_changed_date`),
  KEY `money_counting_lists_moncl_key_key` (`station_no`,`moncl_no`),
  KEY `money_counting_lists_moncl_key_date_ckey` (`station_no`,`moncl_date`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `operators`
--

DROP TABLE IF EXISTS `operators`;
CREATE TABLE IF NOT EXISTS `operators` (
  `opera_id` bigint NOT NULL AUTO_INCREMENT,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `commp_no` int UNSIGNED DEFAULT NULL,
  `perm_no` tinyint UNSIGNED DEFAULT NULL,
  `opera_login_name` varchar(40) DEFAULT NULL,
  `opera_first_name` varchar(35) DEFAULT NULL,
  `opera_last_name` varchar(35) DEFAULT NULL,
  `opera_address` varchar(50) DEFAULT NULL,
  `opera_zip` varchar(50) DEFAULT NULL,
  `opera_city` varchar(50) DEFAULT NULL,
  `opera_birthday` date DEFAULT NULL,
  `opera_code` varchar(20) DEFAULT NULL,
  `opera_password` varchar(20) DEFAULT NULL,
  `opera_transponder_code` varchar(14) DEFAULT NULL,
  `opera_may_sell` tinyint DEFAULT '1',
  `opera_operator_base_sales` decimal(18,6) DEFAULT '0.000000',
  `opera_ref_no` int UNSIGNED DEFAULT '0',
  `opera_composite_no_login_name` varchar(50) DEFAULT NULL,
  `opera_sort` varchar(8) DEFAULT NULL,
  `operaw_no` int DEFAULT '0',
  `opera_limit_tables` tinyint DEFAULT '0',
  `opera_commission_in_percent` double DEFAULT NULL,
  `opera_start_of_work` time DEFAULT NULL,
  `opera_end_of_work` time DEFAULT NULL,
  `opera_lock_tables` tinyint DEFAULT '0',
  `opera_table_management_active` tinyint DEFAULT '0',
  `opera_table_management_type` tinyint UNSIGNED DEFAULT NULL,
  `opera_tables_balance` tinyint DEFAULT '0',
  `opera_time_recording_active` tinyint DEFAULT '0',
  `opera_time_recording_mandatory` tinyint DEFAULT '0',
  `opera_work_schedule_color` int UNSIGNED DEFAULT '0',
  `opera_work_schedule_font_color` int UNSIGNED DEFAULT '0',
  `opera_work_schedule_header_color` int UNSIGNED DEFAULT '0',
  `opera_screen_statistics_color` int UNSIGNED DEFAULT '0',
  `opera_login_color` int UNSIGNED DEFAULT '0',
  `opera_login_font_color` int UNSIGNED DEFAULT '0',
  `opera_calendar_color` int UNSIGNED DEFAULT '0',
  `opera_calendar_font_color` int UNSIGNED DEFAULT '0',
  `opera_calendar_width` int UNSIGNED DEFAULT '200',
  `opera_employed_since` date DEFAULT NULL,
  `opera_dismissed_since` date DEFAULT NULL,
  `opera_open_receipts_must_be_handed_over` tinyint DEFAULT '0',
  `opera_daily_budget` decimal(18,6) DEFAULT '0.000000',
  `opera_daily_budget_last_balance` datetime DEFAULT NULL,
  `opera_no_cash_drawer_open` tinyint DEFAULT '0',
  `branch_no` int UNSIGNED DEFAULT '0',
  `opera_image` longblob,
  `opera_dispensing_system_operator_no` int UNSIGNED DEFAULT NULL,
  `opera_dispensing_system_operator_is_service` tinyint DEFAULT '0',
  `opera_table_group_external` int DEFAULT '0',
  `opera_table_group_internal` int DEFAULT '0',
  `opera_last_login` datetime DEFAULT NULL,
  `opera_temporary_job` tinyint DEFAULT '0',
  `opera_employee_discount_in_percent` double DEFAULT '0',
  PRIMARY KEY (`opera_id`),
  KEY `operators_opera_no_key` (`opera_no`),
  KEY `operators_commp_no_key` (`commp_no`),
  KEY `operators_perm_no_ckey` (`perm_no`),
  KEY `operators_opera_login_name_key` (`opera_login_name`),
  KEY `operators_opera_birthday_ckey` (`opera_birthday`),
  KEY `operators_opera_code_ckey` (`opera_code`),
  KEY `operators_opera_password_ckey` (`opera_password`),
  KEY `operators_opera_transponder_code_ckey` (`opera_transponder_code`),
  KEY `operators_opera_ref_no_key` (`opera_ref_no`),
  KEY `operators_opera_composite_no_login_name_key` (`opera_composite_no_login_name`),
  KEY `operators_opera_sort_ckey` (`opera_sort`),
  KEY `operators_operaw_no_ckey` (`operaw_no`),
  KEY `operators_opera_limit_tables_ckey` (`opera_limit_tables`),
  KEY `operators_branch_no_ckey` (`branch_no`),
  KEY `operators_opera_dispensing_system_operator_no_ckey` (`opera_dispensing_system_operator_no`),
  KEY `operators_opera_table_group_external_ckey` (`opera_table_group_external`),
  KEY `operators_opera_table_group_internal_ckey` (`opera_table_group_internal`),
  KEY `operators_opera_last_login_ckey` (`opera_last_login`),
  KEY `operators_opera_key_branch_sort_ckey` (`branch_no`,`opera_sort`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `operator_coms`
--

DROP TABLE IF EXISTS `operator_coms`;
CREATE TABLE IF NOT EXISTS `operator_coms` (
  `operac_id` bigint NOT NULL AUTO_INCREMENT,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `table_no` int UNSIGNED DEFAULT NULL,
  `operac_date_time` datetime DEFAULT NULL,
  `operac_call_type` tinyint UNSIGNED DEFAULT NULL,
  `operac_done` tinyint DEFAULT '0',
  PRIMARY KEY (`operac_id`),
  KEY `operator_coms_opera_no_ckey` (`opera_no`),
  KEY `operator_coms_table_no_ckey` (`table_no`),
  KEY `operator_coms_operac_date_time_ckey` (`operac_date_time`),
  KEY `operator_coms_operac_done_ckey` (`operac_done`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `operator_tables`
--

DROP TABLE IF EXISTS `operator_tables`;
CREATE TABLE IF NOT EXISTS `operator_tables` (
  `operat_id` bigint NOT NULL AUTO_INCREMENT,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `table_no` int UNSIGNED DEFAULT NULL,
  `operat_allowed` tinyint DEFAULT '0',
  PRIMARY KEY (`operat_id`),
  KEY `operator_tables_opera_no_ckey` (`opera_no`),
  KEY `operator_tables_table_no_ckey` (`table_no`),
  KEY `operator_tables_operat_key_key` (`opera_no`,`table_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `operator_work_types`
--

DROP TABLE IF EXISTS `operator_work_types`;
CREATE TABLE IF NOT EXISTS `operator_work_types` (
  `operaw_id` bigint NOT NULL AUTO_INCREMENT,
  `operaw_no` int DEFAULT NULL,
  `operaw_description` varchar(50) DEFAULT NULL,
  `operaw_normal_work_time_from` time DEFAULT NULL,
  `operaw_normal_work_time_to` time DEFAULT NULL,
  `operaw_public_holiday_surcharge` tinyint DEFAULT '0',
  `operaw_public_holiday_surcharge_percent` double DEFAULT '0',
  `operaw_saturday_surcharge` tinyint DEFAULT '0',
  `operaw_saturday_surcharge_percent` double DEFAULT '0',
  `operaw_saturday_from` time DEFAULT NULL,
  `operaw_saturday_to` time DEFAULT NULL,
  `operaw_sunday_surcharge` tinyint DEFAULT '0',
  `operaw_sunday_surcharge_percent` double DEFAULT '0',
  `operaw_weekend_work` tinyint DEFAULT '0',
  `operaw_public_holiday_work` tinyint DEFAULT '0',
  `operaw_weekly_hours` double DEFAULT '0',
  `operaw_hours_per_month` double DEFAULT '0',
  `operaw_maximum_hours_per_day` double DEFAULT '0',
  `operaw_maximum_hours_per_week` double DEFAULT '0',
  `operaw_maximum_hours_per_month` double DEFAULT '0',
  `operaw_night_surcharge` tinyint DEFAULT '0',
  `operaw_night_surcharge_percent` double DEFAULT '0',
  `operaw_night_surcharge_from` time DEFAULT NULL,
  `operaw_night_surcharge_to` time DEFAULT NULL,
  `operaw_additional_surcharge_1` tinyint DEFAULT '0',
  `operaw_additional_surcharge_1_percent` double DEFAULT '0',
  `operaw_additional_surcharge_1_from_weekly_hours` double DEFAULT '0',
  `operaw_additional_surcharge_2` tinyint DEFAULT '0',
  `operaw_additional_surcharge_2_percent` double DEFAULT '0',
  `operaw_additional_surcharge_2_from_weekly_hours` double DEFAULT '0',
  `operaw_additional_surcharge_3` tinyint DEFAULT '0',
  `operaw_additional_surcharge_3_percent` double DEFAULT '0',
  `operaw_additional_surcharge_3_from_weekly_hours` double DEFAULT '0',
  `operaw_break_at_least_hours` double DEFAULT '0',
  `operaw_break_at_least_minutes` tinyint UNSIGNED DEFAULT '0',
  `operaw_break_at_least_minutes_paid` tinyint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`operaw_id`),
  KEY `operator_work_types_operaw_no_key` (`operaw_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `order_details`
--

DROP TABLE IF EXISTS `order_details`;
CREATE TABLE IF NOT EXISTS `order_details` (
  `orderd_id` bigint NOT NULL AUTO_INCREMENT,
  `orderm_id` bigint DEFAULT NULL,
  `orderd_description` longtext,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `orderd_quantity` double DEFAULT '0',
  `orderd_new` tinyint DEFAULT '0',
  PRIMARY KEY (`orderd_id`),
  KEY `order_details_orderm_id_key` (`orderm_id`),
  KEY `order_details_opera_no_ckey` (`opera_no`),
  KEY `order_details_prod_no_ckey` (`prod_no`),
  KEY `order_details_orderd_key_ckey` (`orderm_id`,`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `order_form_details`
--

DROP TABLE IF EXISTS `order_form_details`;
CREATE TABLE IF NOT EXISTS `order_form_details` (
  `orderfd_id` bigint NOT NULL AUTO_INCREMENT,
  `orderfm_id` bigint DEFAULT NULL,
  `orderfd_description` longtext,
  `orderfd_line_no` int DEFAULT '0',
  `prod_no` bigint UNSIGNED DEFAULT '0',
  `orderfd_order_pack_size` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`orderfd_id`),
  KEY `order_form_details_orderfm_id_ckey` (`orderfm_id`),
  KEY `order_form_details_orderfd_line_no_ckey` (`orderfd_line_no`),
  KEY `order_form_details_prod_no_ckey` (`prod_no`),
  KEY `order_form_details_orderfd_key_ckey` (`orderfm_id`,`orderfd_line_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `order_form_master`
--

DROP TABLE IF EXISTS `order_form_master`;
CREATE TABLE IF NOT EXISTS `order_form_master` (
  `orderfm_id` bigint NOT NULL AUTO_INCREMENT,
  `orderfm_description` varchar(128) DEFAULT NULL,
  `orderfm_email` varchar(128) DEFAULT NULL,
  `orderfm_branches` varchar(255) DEFAULT NULL,
  `orderfm_header_image` longblob,
  `orderfm_footer_image` longblob,
  `orderfm_alert_time` time DEFAULT NULL,
  `orderfm_border_left` double DEFAULT '13',
  `orderfm_border_right` double DEFAULT '13',
  `orderfm_product_column_width` double DEFAULT '25',
  `orderfm_quantity_column_width` double DEFAULT '25',
  `orderfm_normal_font_name` varchar(50) DEFAULT 'Helvetica',
  `orderfm_bold_font_name` varchar(50) DEFAULT 'Helvetica-Bold',
  `orderfm_italic_font_name` varchar(50) DEFAULT 'Helvetica',
  `orderfm_bold_italic_font_name` varchar(50) DEFAULT 'Helvetica',
  `orderfm_font_size` double DEFAULT '14',
  PRIMARY KEY (`orderfm_id`),
  KEY `order_form_master_orderfm_description_ckey` (`orderfm_description`),
  KEY `order_form_master_orderfm_email_ckey` (`orderfm_email`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `order_master`
--

DROP TABLE IF EXISTS `order_master`;
CREATE TABLE IF NOT EXISTS `order_master` (
  `orderm_id` bigint NOT NULL AUTO_INCREMENT,
  `orderfm_id` bigint DEFAULT NULL,
  `orderm_order_no` varchar(9) NOT NULL DEFAULT '',
  `orderm_date` datetime DEFAULT NULL,
  `station_no` int UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `orderm_date_created` datetime DEFAULT NULL,
  `orderm_date_send` datetime DEFAULT NULL,
  `orderm_email` varchar(128) DEFAULT NULL,
  `orderm_description` varchar(128) DEFAULT NULL,
  `orderm_alert_time` time DEFAULT NULL,
  `orderm_send` tinyint DEFAULT NULL,
  PRIMARY KEY (`orderm_id`),
  KEY `order_master_orderfm_id_ckey` (`orderfm_id`),
  KEY `order_master_orderm_order_no_key` (`orderm_order_no`),
  KEY `order_master_orderm_date_ckey` (`orderm_date`),
  KEY `order_master_station_no_ckey` (`station_no`),
  KEY `order_master_branch_no_ckey` (`branch_no`),
  KEY `order_master_orderm_key_key` (`branch_no`,`orderfm_id`,`orderm_date`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `part_lists`
--

DROP TABLE IF EXISTS `part_lists`;
CREATE TABLE IF NOT EXISTS `part_lists` (
  `partl_id` bigint NOT NULL AUTO_INCREMENT,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `partl_line_no` int UNSIGNED DEFAULT '0',
  `partl_quantity` double DEFAULT '0',
  `prod_no_destination` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`partl_id`),
  KEY `part_lists_prod_no_ckey` (`prod_no`),
  KEY `part_lists_partl_line_no_ckey` (`partl_line_no`),
  KEY `part_lists_partl_key_ckey` (`prod_no`,`partl_line_no`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `payment_types`
--

DROP TABLE IF EXISTS `payment_types`;
CREATE TABLE IF NOT EXISTS `payment_types` (
  `payt_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL DEFAULT '0',
  `payt_type` int DEFAULT NULL,
  `payt_description` varchar(50) DEFAULT NULL,
  `payt_category_type` tinyint UNSIGNED DEFAULT NULL,
  `payt_cash` tinyint NOT NULL DEFAULT '1',
  `payt_collect_on_delivery` tinyint DEFAULT '0',
  `payt_object_accounts` int UNSIGNED DEFAULT '0',
  `payt_posting_text` varchar(50) DEFAULT NULL,
  `payt_posting_code` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`payt_id`),
  KEY `payment_types_branch_no_ckey` (`branch_no`),
  KEY `payment_types_payt_type_ckey` (`payt_type`),
  KEY `payment_types_payt_key_key` (`branch_no`,`payt_type`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `perm_id` bigint NOT NULL AUTO_INCREMENT,
  `perm_no` tinyint UNSIGNED DEFAULT NULL,
  `perm_description` varchar(35) DEFAULT NULL,
  `perm_composite_no_description` varchar(50) DEFAULT NULL,
  `perm_admin` tinyint DEFAULT '1',
  `perm_change_permissions` tinyint DEFAULT '1',
  `perm_reporter` tinyint DEFAULT '1',
  `perm_mobile_app` tinyint DEFAULT '1',
  `perm_add_products_on_pos` tinyint DEFAULT '1',
  `perm_add_customers_on_pos` tinyint DEFAULT '1',
  `perm_ownconsumption` tinyint DEFAULT '1',
  `perm_rejects` tinyint DEFAULT '1',
  `perm_personnel_sales` tinyint DEFAULT '1',
  `perm_orders` tinyint DEFAULT '1',
  `perm_returns` tinyint DEFAULT '1',
  `perm_rotten_food` tinyint DEFAULT '1',
  `perm_standing_orders` tinyint DEFAULT '1',
  `perm_goods_receipt` tinyint DEFAULT '0',
  `perm_cancel_a_slip` tinyint DEFAULT '1',
  `perm_cancel_a_product` tinyint DEFAULT '1',
  `perm_cancel_a_slip_line` tinyint DEFAULT '1',
  `perm_pos_final_report` tinyint DEFAULT '1',
  `perm_product_group_journal` tinyint DEFAULT '1',
  `perm_product_journal` tinyint DEFAULT '1',
  `perm_entry_change` tinyint DEFAULT '1',
  `perm_operator_payroll` tinyint DEFAULT '1',
  `perm_cash_counting` tinyint DEFAULT '1',
  `perm_cash_counting_differences` tinyint DEFAULT '1',
  `perm_pos_sales` tinyint DEFAULT '1',
  `perm_inventory_postings` tinyint DEFAULT '1',
  `perm_warehouse_booking` tinyint DEFAULT '1',
  `perm_stock_status_printing` tinyint DEFAULT '1',
  `perm_stock_movement_printing` tinyint DEFAULT '1',
  `perm_see_stock_locations` tinyint DEFAULT '1',
  `perm_store_warehouse_transfer` tinyint DEFAULT '1',
  `perm_cash_withdrawals` tinyint DEFAULT '1',
  `perm_cash_deposits` tinyint DEFAULT '1',
  `perm_voucher_sale` tinyint DEFAULT '1',
  `perm_voucher_create` tinyint DEFAULT '1',
  `perm_inventory` tinyint DEFAULT '1',
  `perm_switch_off_receipt_printing` tinyint DEFAULT '1',
  `perm_invoice_printing` tinyint DEFAULT '1',
  `perm_see_cancellation_information` tinyint DEFAULT '1',
  `perm_price_correction` tinyint DEFAULT '1',
  `perm_change_product_description` tinyint DEFAULT '1',
  `perm_receipt_discount` tinyint DEFAULT '1',
  `perm_product_single_discount` tinyint DEFAULT '1',
  `perm_open_cash_drawer` tinyint DEFAULT '1',
  `perm_waiters_assign_tables` tinyint DEFAULT '1',
  `perm_assign_billed_receipts_to_new_waiters` tinyint DEFAULT '1',
  `perm_time_recording_entry` tinyint DEFAULT '1',
  `perm_shelf_labelling_print` tinyint DEFAULT '1',
  `perm_label_print` tinyint DEFAULT '1',
  `perm_warehouse_authorization_list` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`perm_id`),
  KEY `permissions_perm_no_key` (`perm_no`),
  KEY `permissions_perm_composite_no_description_ckey` (`perm_composite_no_description`)
);

--
-- Tabellenstruktur für Tabelle `permission_elements`
--

DROP TABLE IF EXISTS `permission_elements`;
CREATE TABLE IF NOT EXISTS `permission_elements` (
  `perme_id` bigint NOT NULL AUTO_INCREMENT,
  `perm_no` tinyint UNSIGNED DEFAULT NULL,
  `perme_window_name` varchar(100) DEFAULT NULL,
  `perme_state` tinyint UNSIGNED DEFAULT '0',
  `perme_name` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`perme_id`),
  KEY `permission_elements_perm_no_key` (`perm_no`),
  KEY `permission_elements_perme_window_name_ckey` (`perme_window_name`),
  KEY `permission_elements_perme_name_ckey` (`perme_name`),
  KEY `permission_elements_perme_key_key` (`perm_no`,`perme_name`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `phone_list`
--

DROP TABLE IF EXISTS `phone_list`;
CREATE TABLE IF NOT EXISTS `phone_list` (
  `phonel_id` bigint NOT NULL AUTO_INCREMENT,
  `phonel_guid` varchar(32) DEFAULT NULL,
  `phonel_time` bigint UNSIGNED DEFAULT NULL,
  `phonel_date_time` datetime DEFAULT NULL,
  `phonel_ok` tinyint DEFAULT '0',
  `phonel_phone_number` varchar(50) DEFAULT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `cust_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`phonel_id`),
  KEY `phone_list_phonel_guid_ckey` (`phonel_guid`),
  KEY `phone_list_phonel_time_ckey` (`phonel_time`),
  KEY `phone_list_phonel_date_time_ckey` (`phonel_date_time`),
  KEY `phone_list_phonel_ok_ckey` (`phonel_ok`),
  KEY `phone_list_phonel_phone_number_ckey` (`phonel_phone_number`),
  KEY `phone_list_salesm_guid_ckey` (`salesm_guid`),
  KEY `phone_list_cust_no_ckey` (`cust_no`),
  KEY `phone_list_phonel_key_ckey` (`phonel_guid`,`phonel_date_time`),
  KEY `phone_list_phonel_key_2_ckey` (`phonel_guid`,`phonel_time`)
);

--
-- Tabellenstruktur für Tabelle `postcodes`
--

DROP TABLE IF EXISTS `postcodes`;
CREATE TABLE IF NOT EXISTS `postcodes` (
  `postc_id` bigint NOT NULL AUTO_INCREMENT,
  `postc_no` varchar(8) DEFAULT NULL,
  `postc_city` varchar(30) DEFAULT NULL,
  `count_no` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`postc_id`),
  KEY `postcodes_count_no_ckey` (`count_no`),
  KEY `postcodes_postc_no_ckey` (`postc_no`),
  KEY `postcodes_postc_city_ckey` (`postc_city`),
  KEY `postcodes_postc_key_key` (`postc_no`,`postc_city`)
) ENGINE=InnoDB AUTO_INCREMENT=18814 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `pos_keyboard_buttons`
--

DROP TABLE IF EXISTS `pos_keyboard_buttons`;
CREATE TABLE IF NOT EXISTS `pos_keyboard_buttons` (
  `posb_id` bigint NOT NULL AUTO_INCREMENT,
  `posb_no` int DEFAULT NULL,
  `posb_description` varchar(50) DEFAULT 'Standard',
  `posb_image` longblob,
  `posb_image_mask` longblob,
  `posb_display_type` tinyint UNSIGNED DEFAULT '1',
  `posb_inner_color` tinyint UNSIGNED DEFAULT '1',
  `posb_destination_color_top` int UNSIGNED DEFAULT '16777215',
  `posb_destination_color_bottom` int UNSIGNED DEFAULT '16777215',
  `posb_destination_color_hoover` int UNSIGNED DEFAULT '16777215',
  `posb_destination_color_disabled` int UNSIGNED DEFAULT '16777215',
  `posb_reverse_color` tinyint DEFAULT '1',
  `posb_border_x` tinyint UNSIGNED DEFAULT '1',
  `posb_border_y` tinyint UNSIGNED DEFAULT '1',
  `posb_caption_x` tinyint UNSIGNED DEFAULT '2',
  `posb_caption_y` tinyint UNSIGNED DEFAULT '2',
  `posb_width` int UNSIGNED DEFAULT '1',
  `posb_height` int UNSIGNED DEFAULT '1',
  `posb_border_color_x` tinyint UNSIGNED DEFAULT '1',
  `posb_border_color_y` tinyint UNSIGNED DEFAULT '1',
  `posb_shape_type` tinyint UNSIGNED DEFAULT '1',
  `posb_roundness` tinyint UNSIGNED DEFAULT '1',
  `posb_gap_x` int DEFAULT '2',
  `posb_gap_y` int DEFAULT '2',
  `posb_info_x` int DEFAULT '127',
  `posb_info_y` int DEFAULT '88',
  `posb_stock_x` int DEFAULT '2',
  `posb_stock_y` int DEFAULT '3',
  `posb_price_x` int DEFAULT '0',
  `posb_price_y` int DEFAULT '0',
  `posb_prod_no_x` int DEFAULT '0',
  `posb_prod_no_y` int DEFAULT '0',
  PRIMARY KEY (`posb_id`),
  UNIQUE KEY `pos_keyboard_buttons_posb_no_key` (`posb_no`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `pos_keyboard_copy_lists`
--

DROP TABLE IF EXISTS `pos_keyboard_copy_lists`;
CREATE TABLE IF NOT EXISTS `pos_keyboard_copy_lists` (
  `posc_id` bigint NOT NULL AUTO_INCREMENT,
  `posc_source_station_no` tinyint UNSIGNED DEFAULT NULL,
  `posc_source_layout_no` int UNSIGNED DEFAULT NULL,
  `posc_destination_station_no` tinyint UNSIGNED DEFAULT NULL,
  `posc_destination_layout_no` int UNSIGNED DEFAULT NULL,
  `posc_new_description` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`posc_id`),
  KEY `pos_keyboard_copy_lists_posc_source_station_no_ckey` (`posc_source_station_no`),
  KEY `pos_keyboard_copy_lists_posc_source_layout_no_ckey` (`posc_source_layout_no`),
  KEY `pos_keyboard_copy_lists_posc_destination_station_no_ckey` (`posc_destination_station_no`),
  KEY `pos_keyboard_copy_lists_posc_destination_layout_no_ckey` (`posc_destination_layout_no`),
  KEY `pos_keyboard_copy_lists_posc_key_source_ckey` (`posc_source_station_no`,`posc_source_layout_no`),
  KEY `pos_keyboard_copy_lists_posc_key_destination_ckey` (`posc_destination_station_no`,`posc_destination_layout_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `pos_keyboard_details`
--

DROP TABLE IF EXISTS `pos_keyboard_details`;
CREATE TABLE IF NOT EXISTS `pos_keyboard_details` (
  `poskd_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `poskm_no` int UNSIGNED DEFAULT NULL,
  `poskd_type` int DEFAULT NULL,
  `poskd_prod_group` int DEFAULT NULL,
  `poskd_no` int UNSIGNED NOT NULL DEFAULT '0',
  `poskd_height` double DEFAULT '1',
  `poskd_width` double NOT NULL DEFAULT '1',
  `poskd_program` varchar(255) DEFAULT NULL,
  `poskd_description` longtext,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prodg_no` int DEFAULT '0',
  `poskd_background_color` int UNSIGNED DEFAULT '0',
  `poskd_font_color` int UNSIGNED DEFAULT '0',
  `poskd_enabled` tinyint NOT NULL DEFAULT '1',
  `poskd_image` longblob,
  `poskd_image_file_name` varchar(50) DEFAULT NULL,
  `poskd_invisible` tinyint NOT NULL DEFAULT '0',
  `poskd_font_name` varchar(50) DEFAULT 'Arial',
  `poskd_font_size` double DEFAULT '8',
  `poskd_font_bold` tinyint DEFAULT '0',
  `poskd_font_italic` tinyint DEFAULT '0',
  `poskd_font_underlined` tinyint DEFAULT '0',
  `poskd_use_font` tinyint DEFAULT '0',
  `poskd_stock` double DEFAULT '0',
  `poskd_stock_entry_date_time` datetime DEFAULT NULL,
  `poskd_stock_enable` tinyint DEFAULT '1',
  `posb_no` int DEFAULT '0',
  `poskd_enabled_date_from` datetime DEFAULT NULL,
  `poskd_enabled_date_to` datetime DEFAULT NULL,
  `poskd_enabled_weekday_1` tinyint DEFAULT '0',
  `poskd_enabled_weekday_2` tinyint DEFAULT '0',
  `poskd_enabled_weekday_3` tinyint DEFAULT '0',
  `poskd_enabled_weekday_4` tinyint DEFAULT '0',
  `poskd_enabled_weekday_5` tinyint DEFAULT '0',
  `poskd_enabled_weekday_6` tinyint DEFAULT '0',
  `poskd_enabled_weekday_7` tinyint DEFAULT '0',
  `poskd_each_day_process` tinyint DEFAULT '0',
  `poskd_image_full_size` tinyint DEFAULT '0',
  `poskd_font_posistion_type` tinyint UNSIGNED DEFAULT '0',
  `poskd_font_posistion_y` int UNSIGNED DEFAULT '0',
  `poskd_keyboard_code` varchar(2) DEFAULT NULL,
  `poskd_keyboard_shift` tinyint DEFAULT '0',
  `poskd_keyboard_ctrl` tinyint DEFAULT '0',
  `poskd_keyboard_alt` tinyint DEFAULT '0',
  PRIMARY KEY (`poskd_id`),
  UNIQUE KEY `pos_keyboard_details_poskd_key_key` (`station_no`,`poskm_no`,`poskd_type`,`poskd_prod_group`,`poskd_no`),
  KEY `pos_keyboard_details_station_no_ckey` (`station_no`),
  KEY `pos_keyboard_details_poskm_no_ckey` (`poskm_no`),
  KEY `pos_keyboard_details_poskd_type_ckey` (`poskd_type`),
  KEY `pos_keyboard_details_poskd_prod_group_ckey` (`poskd_prod_group`),
  KEY `pos_keyboard_details_prod_no_ckey` (`prod_no`),
  KEY `pos_keyboard_details_prodg_no_ckey` (`prodg_no`),
  KEY `pos_keyboard_details_posb_no_ckey` (`posb_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7943 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `pos_keyboard_dialog_details`
--

DROP TABLE IF EXISTS `pos_keyboard_dialog_details`;
CREATE TABLE IF NOT EXISTS `pos_keyboard_dialog_details` (
  `poskdd_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `poskm_no` int UNSIGNED DEFAULT NULL,
  `poskdm_no` int UNSIGNED DEFAULT NULL,
  `poskdd_page_no` int UNSIGNED DEFAULT NULL,
  `poskdd_no` int UNSIGNED DEFAULT NULL,
  `poskdd_program` varchar(255) DEFAULT NULL,
  `poskdd_description` varchar(64) DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `poskdd_background_color` int UNSIGNED DEFAULT '0',
  `poskdd_font_color` int UNSIGNED DEFAULT '0',
  `poskdd_enabled` tinyint NOT NULL DEFAULT '1',
  `poskdd_visible` tinyint NOT NULL DEFAULT '1',
  `poskdd_image` longblob,
  `poskdd_image_file_name` varchar(50) DEFAULT NULL,
  `poskdd_use_font` tinyint DEFAULT '0',
  `poskdd_font_name` varchar(50) DEFAULT 'Arial',
  `poskdd_font_size` double DEFAULT '12',
  `poskdd_font_bold` tinyint DEFAULT '1',
  `poskdd_font_italic` tinyint DEFAULT '0',
  `poskdd_font_underlined` tinyint DEFAULT '0',
  `poskdd_x` int UNSIGNED DEFAULT '0',
  `poskdd_y` int UNSIGNED DEFAULT '0',
  `poskdd_width` int UNSIGNED DEFAULT '0',
  `poskdd_height` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`poskdd_id`),
  KEY `pos_keyboard_dialog_details_station_no_ckey` (`station_no`),
  KEY `pos_keyboard_dialog_details_poskm_no_ckey` (`poskm_no`),
  KEY `pos_keyboard_dialog_details_poskdm_no_ckey` (`poskdm_no`),
  KEY `pos_keyboard_dialog_details_poskdd_page_no_ckey` (`poskdd_page_no`),
  KEY `pos_keyboard_dialog_details_poskdd_no_ckey` (`poskdd_no`),
  KEY `pos_keyboard_dialog_details_prod_no_ckey` (`prod_no`),
  KEY `pos_keyboard_dialog_details_poskdd_key_ckey` (`station_no`,`poskm_no`,`poskdm_no`,`poskdd_no`),
  KEY `pos_keyboard_dialog_details_poskdd_key_page_key` (`station_no`,`poskm_no`,`poskdm_no`,`poskdd_page_no`,`poskdd_no`)
) ENGINE=InnoDB AUTO_INCREMENT=641 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `pos_keyboard_dialog_master`
--

DROP TABLE IF EXISTS `pos_keyboard_dialog_master`;
CREATE TABLE IF NOT EXISTS `pos_keyboard_dialog_master` (
  `poskdm_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `poskm_no` int UNSIGNED DEFAULT NULL,
  `poskdm_no` int UNSIGNED DEFAULT NULL,
  `poskdm_description` varchar(50) DEFAULT NULL,
  `poskdm_x` int UNSIGNED DEFAULT '0',
  `poskdm_y` int UNSIGNED DEFAULT '0',
  `poskdm_font_name` varchar(50) DEFAULT 'Arial',
  `poskdm_font_size` double DEFAULT '8',
  `poskdm_font_bold` tinyint DEFAULT '0',
  `poskdm_font_italic` tinyint DEFAULT '0',
  `poskdm_font_underline` tinyint DEFAULT '0',
  `poskdm_operator_logoff` tinyint DEFAULT '0',
  `poskdm_program_type` tinyint UNSIGNED DEFAULT '1',
  PRIMARY KEY (`poskdm_id`),
  UNIQUE KEY `pos_keyboard_dialog_master_poskdm_key_dialog_no_key` (`station_no`,`poskm_no`,`poskdm_no`),
  KEY `pos_keyboard_dialog_master_station_no_ckey` (`station_no`),
  KEY `pos_keyboard_dialog_master_poskm_no_ckey` (`poskm_no`),
  KEY `pos_keyboard_dialog_master_poskdm_no_ckey` (`poskdm_no`),
  KEY `pos_keyboard_dialog_master_poskdm_key_ckey` (`station_no`,`poskm_no`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `pos_keyboard_master`
--

DROP TABLE IF EXISTS `pos_keyboard_master`;
CREATE TABLE IF NOT EXISTS `pos_keyboard_master` (
  `poskm_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `poskm_no` int UNSIGNED DEFAULT NULL,
  `selm_no` int UNSIGNED DEFAULT NULL,
  `poskm_description` varchar(50) DEFAULT 'Tastaturlayout',
  `poskm_background_image` longblob,
  `poskm_products_style` int UNSIGNED DEFAULT '1',
  `poskm_product_main_groups_style` int UNSIGNED DEFAULT '1',
  `poskm_product_groups_style` int UNSIGNED DEFAULT '1',
  `poskm_display_main_groups_instead_of_product_groups` tinyint DEFAULT '0',
  `poskm_numeric_keypad_style` int UNSIGNED DEFAULT '1',
  `poskm_quick_access_keys_style` int UNSIGNED DEFAULT '1',
  `poskm_hide_quick_access_keys` tinyint DEFAULT '0',
  `poskm_slip_table_style` int UNSIGNED DEFAULT '1',
  `poskm_display_keys_style` int UNSIGNED DEFAULT '1',
  `poskm_command_keys_style` int UNSIGNED DEFAULT '1',
  `poskm_key_count_x` int UNSIGNED DEFAULT '12',
  `poskm_key_count_y` int UNSIGNED DEFAULT '13',
  `poskm_physical_pos_width` int UNSIGNED DEFAULT '0',
  `poskm_physical_pos_height` int UNSIGNED DEFAULT '0',
  `poskm_product_keys_left` tinyint UNSIGNED DEFAULT '1',
  `poskm_product_keys_top_` tinyint UNSIGNED DEFAULT '2',
  `poskm_product_keys_width` tinyint UNSIGNED DEFAULT '8',
  `poskm_product_keys_height` tinyint UNSIGNED DEFAULT '10',
  `poskm_product_keys_new_inner_dimensions` tinyint DEFAULT '1',
  `poskm_product_keys_new_width` tinyint UNSIGNED DEFAULT '6',
  `poskm_product_keys_new_height` tinyint UNSIGNED DEFAULT '7',
  `poskm_product_keys_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_product_keys_font_size` double DEFAULT '12',
  `poskm_product_keys_font_bold` tinyint DEFAULT '1',
  `poskm_product_keys_font_italic` tinyint DEFAULT '0',
  `poskm_product_keys_font_underlined` tinyint DEFAULT '0',
  `poskm_product_keys_more_color` int DEFAULT '13290441',
  `poskm_product_keys_back_image` longblob,
  `poskm_product_keys_next_image` longblob,
  `poskm_product_keys_price_display` tinyint UNSIGNED DEFAULT '1',
  `poskm_product_keys_price_image` longblob,
  `poskm_product_keys_price_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_product_keys_price_font_size` double DEFAULT '12',
  `poskm_product_keys_price_font_bold` tinyint DEFAULT '0',
  `poskm_product_keys_price_font_underlined` tinyint DEFAULT '0',
  `poskm_product_keys_price_font_italic` tinyint DEFAULT '0',
  `poskm_product_keys_price_delimiter_before` varchar(50) DEFAULT NULL,
  `poskm_product_keys_price_delimiter_after` varchar(50) DEFAULT NULL,
  `poskm_product_keys_prod_no_display` tinyint DEFAULT '0',
  `poskm_product_keys_prod_no_image` longblob,
  `poskm_product_keys_prod_no_pos_on_key` tinyint UNSIGNED DEFAULT '0',
  `poskm_product_keys_prod_no_font_color` int DEFAULT '0',
  `poskm_product_keys_prod_no_font_name` varchar(50) DEFAULT '',
  `poskm_product_keys_prod_no_font_size` double DEFAULT '0',
  `poskm_product_keys_prod_no_font_bold` tinyint DEFAULT '0',
  `poskm_product_keys_prod_no_font_underlined` tinyint DEFAULT '0',
  `poskm_product_keys_prod_no_font_italic` tinyint DEFAULT '0',
  `poskm_keypad_x` tinyint UNSIGNED DEFAULT '9',
  `poskm_keypad_y` tinyint UNSIGNED DEFAULT '7',
  `poskm_keypad_width` tinyint UNSIGNED DEFAULT '4',
  `poskm_keypad_height` tinyint UNSIGNED DEFAULT '5',
  `poskm_keypad_override` tinyint NOT NULL DEFAULT '1',
  `poskm_keypad_new_width` tinyint UNSIGNED DEFAULT '5',
  `poskm_keypad_new_height` tinyint UNSIGNED DEFAULT '5',
  `poskm_keypad_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_keypad_font_size` double DEFAULT '24',
  `poskm_keypad_font_bold` tinyint DEFAULT '1',
  `poskm_keypad_font_italic` tinyint DEFAULT '0',
  `poskm_keypad_font_underlined` tinyint DEFAULT '0',
  `poskm_slip_table_x` tinyint UNSIGNED DEFAULT '9',
  `poskm_slip_table_y` tinyint UNSIGNED DEFAULT '2',
  `poskm_slip_table_width` tinyint UNSIGNED DEFAULT '4',
  `poskm_slip_table_height` tinyint UNSIGNED DEFAULT '5',
  `poskm_info_x` tinyint UNSIGNED DEFAULT '1',
  `poskm_info_y` tinyint UNSIGNED DEFAULT '1',
  `poskm_info_width` tinyint UNSIGNED DEFAULT '12',
  `poskm_info_height` tinyint UNSIGNED DEFAULT '1',
  `poskm_info_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_info_font_size` double DEFAULT '11',
  `poskm_info_font_bold` tinyint DEFAULT '1',
  `poskm_info_font_italic` tinyint DEFAULT '0',
  `poskm_info_font_underlined` tinyint DEFAULT '0',
  `poskm_prod_group_x` tinyint UNSIGNED DEFAULT '2',
  `poskm_prod_group_y` tinyint UNSIGNED DEFAULT '12',
  `poskm_prod_group_width` tinyint UNSIGNED DEFAULT '11',
  `poskm_prod_group_height` tinyint UNSIGNED DEFAULT '1',
  `poskm_prod_group_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_prod_group_font_size` double DEFAULT '11',
  `poskm_prod_group_font_bold` tinyint DEFAULT '1',
  `poskm_prod_group_font_italic` tinyint DEFAULT '0',
  `poskm_prod_group_font_underlined` tinyint DEFAULT '0',
  `poskm_prod_group_more_background_color` int DEFAULT '13290441',
  `poskm_prod_group_more_previous_image` longblob,
  `poskm_prod_group_more_next_image` longblob,
  `poskm_functions_x` tinyint UNSIGNED DEFAULT '1',
  `poskm_functions_y` tinyint UNSIGNED DEFAULT '13',
  `poskm_functions_width` tinyint UNSIGNED DEFAULT '12',
  `poskm_functions_height` tinyint UNSIGNED DEFAULT '1',
  `poskm_functions_more_background_color` int DEFAULT '13290441',
  `poskm_functions_more_previous_image` longblob,
  `poskm_functions_more_next_image` longblob,
  `poskm_functions_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_functions_font_size` double DEFAULT '11',
  `poskm_functions_font_bold` tinyint DEFAULT '1',
  `poskm_functions_font_italic` tinyint DEFAULT '0',
  `poskm_functions_font_underlined` tinyint DEFAULT '0',
  `poskm_common_used_products_x` tinyint UNSIGNED DEFAULT '1',
  `poskm_common_used_products_y` tinyint UNSIGNED DEFAULT '12',
  `poskm_common_used_products_width` tinyint UNSIGNED DEFAULT '1',
  `poskm_common_used_products_height` tinyint UNSIGNED DEFAULT '1',
  `poskm_slip_table_font_size` double DEFAULT '8',
  `poskm_entry_controls_font_name` varchar(50) DEFAULT 'Verdana',
  `poskm_entry_controls_font_size` double DEFAULT '18',
  `poskm_entry_controls_font_bold` tinyint DEFAULT '1',
  `poskm_entry_controls_font_italic` tinyint DEFAULT '0',
  `poskm_entry_controls_font_underlined` tinyint DEFAULT '0',
  `poskm_entry_controls_column` tinyint UNSIGNED DEFAULT '4',
  `poskm_slip_table_content_1` tinyint UNSIGNED DEFAULT '1',
  `poskm_slip_table_content_2` tinyint UNSIGNED DEFAULT '2',
  `poskm_slip_table_content_3` tinyint UNSIGNED DEFAULT '3',
  `poskm_slip_table_content_4` tinyint UNSIGNED DEFAULT '4',
  `poskm_slip_table_content_5` tinyint UNSIGNED DEFAULT '5',
  `poskm_slip_table_content_6` tinyint UNSIGNED DEFAULT '6',
  `poskm_slip_table_width_in_percent_1` double DEFAULT '10',
  `poskm_slip_table_width_in_percent_2` double DEFAULT '50',
  `poskm_slip_table_width_in_percent_3` double DEFAULT '20',
  `poskm_slip_table_width_in_percent_4` double DEFAULT '20',
  `poskm_slip_table_width_in_percent_5` double DEFAULT '0',
  `poskm_slip_table_width_in_percent_6` double DEFAULT '0',
  `poskm_slip_table_description_1_german` varchar(20) NOT NULL DEFAULT 'Stk',
  `poskm_slip_table_description_2_german` varchar(20) NOT NULL DEFAULT 'Bezeichnung',
  `poskm_slip_table_description_3_german` varchar(20) NOT NULL DEFAULT 'Preis',
  `poskm_slip_table_description_4_german` varchar(20) NOT NULL DEFAULT 'Summe',
  `poskm_slip_table_description_5_german` varchar(20) NOT NULL DEFAULT 'Rab%',
  `poskm_slip_table_description_6_german` varchar(20) NOT NULL DEFAULT 'Art-Nr',
  `poskm_slip_table_description_1_english` varchar(20) NOT NULL DEFAULT 'Amount',
  `poskm_slip_table_description_2_english` varchar(20) NOT NULL DEFAULT 'Description',
  `poskm_slip_table_description_3_english` varchar(20) NOT NULL DEFAULT 'Value',
  `poskm_slip_table_description_4_english` varchar(20) NOT NULL DEFAULT 'Sum',
  `poskm_slip_table_description_5_english` varchar(20) NOT NULL DEFAULT 'Reb%',
  `poskm_slip_table_description_6_english` varchar(20) NOT NULL DEFAULT 'Prod-No.',
  `poskm_slip_table_display_scrollbar` tinyint NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_payment_display` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_image` longblob,
  `poskm_vice_pos_pole_atm_payment_image` longblob,
  `poskm_vice_pos_pole_bluecode_payment_` longblob,
  `poskm_vice_pos_pole_payment_display_total` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_display_given` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_change_display` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_total_x` int UNSIGNED NOT NULL DEFAULT '750',
  `poskm_vice_pos_pole_payment_total_y` int UNSIGNED NOT NULL DEFAULT '248',
  `poskm_vice_pos_pole_payment_total_font_name` varchar(50) NOT NULL DEFAULT 'Arial',
  `poskm_vice_pos_pole_payment_total_font_size` double NOT NULL DEFAULT '48',
  `poskm_vice_pos_pole_payment_total_font_bold` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_total_font_color` int UNSIGNED NOT NULL DEFAULT '16777215',
  `poskm_vice_pos_pole_payment_given_x` int UNSIGNED NOT NULL DEFAULT '750',
  `poskm_vice_pos_pole_payment_given_y` int UNSIGNED NOT NULL DEFAULT '348',
  `poskm_vice_pos_pole_payment_given_font_name` varchar(50) NOT NULL DEFAULT 'Arial',
  `poskm_vice_pos_pole_payment_given_font_size` double NOT NULL DEFAULT '48',
  `poskm_vice_pos_pole_payment_given_font_bold` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_given_font_color` int UNSIGNED NOT NULL DEFAULT '16777215',
  `poskm_vice_pos_pole_payment_change_x` int UNSIGNED NOT NULL DEFAULT '750',
  `poskm_vice_pos_pole_payment_change_y` int UNSIGNED NOT NULL DEFAULT '448',
  `poskm_vice_pos_pole_payment_change_font_name` varchar(50) NOT NULL DEFAULT 'Arial',
  `poskm_vice_pos_pole_payment_change_font_size` double NOT NULL DEFAULT '48',
  `poskm_vice_pos_pole_payment_change_font_bold` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_payment_change_font_color` int UNSIGNED NOT NULL DEFAULT '16777215',
  `poskm_round_the_clock_product_browse` tinyint DEFAULT '1',
  `poskm_product_display_page_no` tinyint UNSIGNED DEFAULT '1',
  `poskm_keyboard_stock_ok_image` longblob,
  `poskm_keyboard_stock_warning_image` longblob,
  `poskm_keyboard_stock_zero_image` longblob,
  `poskm_stock_ok_image` longblob,
  `poskm_stock_stock_warning_image` longblob,
  `poskm_stock_stock_zero_image` longblob,
  `poskm_stock_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_stock_font_size` double DEFAULT '8',
  `poskm_stock_font_bold` tinyint DEFAULT '1',
  `poskm_stock_font_underlined` tinyint DEFAULT '0',
  `poskm_stock_font_italic` tinyint DEFAULT '0',
  `poskm_stock_ok_font_color` int UNSIGNED DEFAULT '16777215',
  `poskm_stock_warning_font_color` int UNSIGNED DEFAULT '16777215',
  `poskm_stock_zero_font_color` int UNSIGNED DEFAULT '0',
  `poskm_stock_image_width` int UNSIGNED DEFAULT '60',
  `poskm_stock_image_height` int UNSIGNED DEFAULT '20',
  `poskm_stock_display_zero` tinyint DEFAULT '1',
  `poskm_vice_pos_pole_running_total_display` tinyint DEFAULT '1',
  `poskm_vice_pos_pole_running_total_x` int UNSIGNED NOT NULL DEFAULT '170',
  `poskm_vice_pos_pole_running_total_y` int UNSIGNED NOT NULL DEFAULT '18',
  `poskm_vice_pos_pole_running_total_font_name` varchar(50) NOT NULL DEFAULT 'Arial',
  `poskm_vice_pos_pole_running_total_font_size` double NOT NULL DEFAULT '38',
  `poskm_vice_pos_pole_running_total_bold` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_running_total_underlined` tinyint NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_running_total_italic` tinyint NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_running_total_color` int UNSIGNED NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_running_total_image` longblob,
  `poskm_vice_pos_pole_running_products_x` int UNSIGNED NOT NULL DEFAULT '20',
  `poskm_vice_pos_pole_running_products_y` int UNSIGNED NOT NULL DEFAULT '110',
  `poskm_vice_pos_pole_running_products_font_name` varchar(50) NOT NULL DEFAULT 'Arial',
  `poskm_vice_pos_pole_running_products_font_size` double NOT NULL DEFAULT '32',
  `poskm_vice_pos_pole_running_products_font_bold` tinyint NOT NULL DEFAULT '1',
  `poskm_vice_pos_pole_running_products_font_underlined` tinyint NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_running_products_italic` tinyint NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_running_products_font_color` int UNSIGNED NOT NULL DEFAULT '0',
  `poskm_vice_pos_pole_running_products_line_spacing` int UNSIGNED NOT NULL DEFAULT '34',
  `poskm_vice_pos_pole_running_products_lines_count` tinyint UNSIGNED NOT NULL DEFAULT '13',
  `poskm_vice_pos_pole_running_products_pixel_width` int UNSIGNED DEFAULT '340',
  `poskm_vice_pos_pole_running_quantity_pixel_width` int UNSIGNED DEFAULT '130',
  `poskm_vice_pos_pole_running_price_pixel_width` int UNSIGNED DEFAULT '130',
  `poskm_vice_pos_pole_product_display` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_x` int UNSIGNED DEFAULT '20',
  `poskm_vice_pos_pole_product_y` int UNSIGNED DEFAULT '685',
  `poskm_vice_pos_pole_product_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_vice_pos_pole_product_font_size` double DEFAULT '38',
  `poskm_vice_pos_pole_product_font_bold` tinyint DEFAULT '1',
  `poskm_vice_pos_pole_product_font_underlined` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_font_italic` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_font_color` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_image_display` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_image_x` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_image_y` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_image_width` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_image_height` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_info_display` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_info_x` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_info_y` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_info_width` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_info_height` int UNSIGNED DEFAULT '0',
  `poskm_vice_pos_pole_product_info_font_name` varchar(50) DEFAULT 'Arial',
  `poskm_vice_pos_pole_product_info_font_size` double DEFAULT '0',
  `poskm_vice_pos_pole_product_info_font_bold` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_info_font_underlined` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_info_font_italic` tinyint DEFAULT '0',
  `poskm_vice_pos_pole_product_info_font_color` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`poskm_id`),
  UNIQUE KEY `pos_keyboard_master_poskm_key_key` (`station_no`,`poskm_no`),
  KEY `pos_keyboard_master_station_no_ckey` (`station_no`),
  KEY `pos_keyboard_master_poskm_no_ckey` (`poskm_no`),
  KEY `pos_keyboard_master_selm_no_ckey` (`selm_no`)
);

--
-- Tabellenstruktur für Tabelle `price_list_assignments`
--

DROP TABLE IF EXISTS `price_list_assignments`;
CREATE TABLE IF NOT EXISTS `price_list_assignments` (
  `pricea_id` bigint NOT NULL AUTO_INCREMENT,
  `cref_no` int UNSIGNED DEFAULT NULL,
  `pricea_base_pricem_no` int UNSIGNED DEFAULT NULL,
  `pricea_special_pricem_no` int UNSIGNED DEFAULT NULL,
  `pricea_description` longtext,
  `pricea_from_date` date DEFAULT NULL,
  `pricea_change_possible` tinyint DEFAULT '1',
  PRIMARY KEY (`pricea_id`),
  KEY `price_list_assignments_cref_no_ckey` (`cref_no`),
  KEY `price_list_assignments_pricea_base_pricem_no_ckey` (`pricea_base_pricem_no`),
  KEY `price_list_assignments_pricea_special_pricem_no_ckey` (`pricea_special_pricem_no`),
  KEY `price_list_assignments_pricea_key_key` (`cref_no`,`pricea_from_date`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `price_list_characteristic_details`
--

DROP TABLE IF EXISTS `price_list_characteristic_details`;
CREATE TABLE IF NOT EXISTS `price_list_characteristic_details` (
  `pricec_id` bigint NOT NULL AUTO_INCREMENT,
  `pricem_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prodc_guid` varchar(32) DEFAULT NULL,
  `pricec_price` decimal(18,6) DEFAULT '0.000000',
  `pricec_discount_locked` tinyint DEFAULT '0',
  `pricec_returns_limit` tinyint DEFAULT '0',
  `pricec_discount_percent` double DEFAULT '0',
  `pricec_print_zero_price` tinyint DEFAULT '0',
  `pricec_comission_discount` double DEFAULT '0',
  `pricec_comission_locked` tinyint DEFAULT '0',
  PRIMARY KEY (`pricec_id`),
  KEY `price_list_characteristic_details_pricem_no_ckey` (`pricem_no`),
  KEY `price_list_characteristic_details_prod_no_ckey` (`prod_no`),
  KEY `price_list_characteristic_details_pricec_key_ckey` (`pricem_no`,`prod_no`),
  KEY `price_list_characteristic_details_prodc_guid_ckey` (`prodc_guid`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `price_list_details`
--

DROP TABLE IF EXISTS `price_list_details`;
CREATE TABLE IF NOT EXISTS `price_list_details` (
  `priced_id` bigint NOT NULL AUTO_INCREMENT,
  `pricem_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `priced_price` decimal(18,6) DEFAULT '0.000000',
  `priced_discount_locked` tinyint DEFAULT '0',
  `priced_returns_limit` tinyint DEFAULT '1',
  `priced_discount_percent` double DEFAULT '0',
  `priced_print_zero_price` tinyint DEFAULT '0',
  `priced_comission_discount` double DEFAULT '0',
  `priced_comission_locked` tinyint DEFAULT '0',
  PRIMARY KEY (`priced_id`),
  UNIQUE KEY `price_list_details_priced_key_key` (`pricem_no`,`prod_no`),
  KEY `price_list_details_pricem_no_ckey` (`pricem_no`),
  KEY `price_list_details_prod_no_ckey` (`prod_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2313 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `price_list_master`
--

DROP TABLE IF EXISTS `price_list_master`;
CREATE TABLE IF NOT EXISTS `price_list_master` (
  `pricem_id` bigint NOT NULL AUTO_INCREMENT,
  `pricem_no` int UNSIGNED DEFAULT '0',
  `pricem_composite_description_no` varchar(50) DEFAULT NULL,
  `pricem_description` longtext,
  `pricem_decimal_places` tinyint UNSIGNED DEFAULT '1',
  PRIMARY KEY (`pricem_id`),
  UNIQUE KEY `price_list_master_pricem_no_key` (`pricem_no`),
  KEY `price_list_master_pricem_composite_description_no_ckey` (`pricem_composite_description_no`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `printers`
--

DROP TABLE IF EXISTS `printers`;
CREATE TABLE IF NOT EXISTS `printers` (
  `printer_id` bigint NOT NULL AUTO_INCREMENT,
  `devicem_no` int DEFAULT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `printer_type` tinyint UNSIGNED DEFAULT NULL,
  `printer_connection_com_port` tinyint UNSIGNED DEFAULT '0',
  `printer_connection_parameter` varchar(50) DEFAULT NULL,
  `printer_use` tinyint DEFAULT '1',
  `printer_warn_paper_low` tinyint DEFAULT '1',
  `printer_com_parameter` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`printer_id`),
  KEY `printers_devicem_no_ckey` (`devicem_no`),
  KEY `printers_station_no_ckey` (`station_no`),
  KEY `printers_printer_type_ckey` (`printer_type`),
  KEY `printers_printer_key_key` (`station_no`,`printer_type`)
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `printer_types`
--

DROP TABLE IF EXISTS `printer_types`;
CREATE TABLE IF NOT EXISTS `printer_types` (
  `printert_id` bigint NOT NULL AUTO_INCREMENT,
  `printert_no` int DEFAULT '0',
  `printert_type` tinyint UNSIGNED DEFAULT NULL,
  `printert_description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`printert_id`),
  KEY `printer_types_printert_type_key` (`printert_type`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `producer`
--

DROP TABLE IF EXISTS `producer`;
CREATE TABLE IF NOT EXISTS `producer` (
  `produ_id` bigint NOT NULL AUTO_INCREMENT,
  `produ_no` int DEFAULT '0',
  `produ_description` varchar(50) DEFAULT '',
  PRIMARY KEY (`produ_id`),
  UNIQUE KEY `produ_no` (`produ_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `prod_id` bigint NOT NULL AUTO_INCREMENT,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prod_guid` varchar(32) DEFAULT NULL,
  `prod_composite_no_description` varchar(50) DEFAULT NULL,
  `prodg_no` int DEFAULT NULL,
  `prod_match_code` varchar(10) DEFAULT NULL,
  `prod_ean` varchar(14) DEFAULT NULL,
  `prod_description` longtext,
  `prod_description_pos` longtext,
  `prod_text` longtext,
  `vat_no` tinyint UNSIGNED DEFAULT NULL,
  `produ_no` int DEFAULT '0',
  `prod_production_type` tinyint UNSIGNED DEFAULT '1',
  `prod_properties` tinyint UNSIGNED DEFAULT '0',
  `prod_printer_type` tinyint UNSIGNED DEFAULT NULL,
  `prod_price_type` tinyint UNSIGNED DEFAULT '1',
  `shop_id` bigint DEFAULT NULL,
  `prod_shop_mapping` tinyint UNSIGNED DEFAULT '0',
  `prod_allow_split_amount` tinyint DEFAULT '0',
  `prod_negative_price` tinyint DEFAULT '0',
  `prod_frequency_product` tinyint DEFAULT '1',
  `prod_discount_lock` tinyint DEFAULT '0',
  `prod_change_description_allowed` tinyint DEFAULT '0',
  `prod_operator_commission_allowed` tinyint DEFAULT '1',
  `prod_print_main_menu_product` tinyint DEFAULT '1',
  `prod_calculate_menu_price` tinyint DEFAULT '1',
  `prod_print_menu_price_but_no_calculation` tinyint DEFAULT '0',
  `prod_print_product_on_kitchen_order` tinyint DEFAULT '1',
  `prod_print_product_on_receipt` tinyint DEFAULT '1',
  `revenuea_no` int UNSIGNED DEFAULT NULL,
  `prod_storable` tinyint DEFAULT '1',
  `prod_stock_duration` int UNSIGNED DEFAULT '0',
  `prod_allow_negative_inventory` tinyint DEFAULT '1',
  `commg_no` int UNSIGNED DEFAULT NULL,
  `prod_barcode_scales_item` tinyint DEFAULT '0',
  `prod_bar_items` tinyint DEFAULT '0',
  `prod_minors_protection` tinyint UNSIGNED DEFAULT '1',
  `prod_scale_item` tinyint DEFAULT '0',
  `prod_scale_item_tare` double DEFAULT '0',
  `prod_season_item` tinyint UNSIGNED DEFAULT '0',
  `prod_kitchen_order_group` varchar(10) DEFAULT NULL,
  `prod_table_or_kitchen_receipt_description` longtext,
  `prod_sub_article` tinyint DEFAULT '0',
  `sup_no` int UNSIGNED DEFAULT NULL,
  `prod_property_ean_type` tinyint UNSIGNED DEFAULT NULL,
  `prod_property_composition` varchar(50) DEFAULT NULL,
  `prod_last_purchase_price` decimal(18,6) DEFAULT '0.000000',
  `prod_average_purchase_price` decimal(18,6) DEFAULT '0.000000',
  `prod_allergens` varchar(26) DEFAULT NULL,
  `unit_no` int UNSIGNED DEFAULT NULL,
  `prod_unit_per_piece` decimal(18,6) DEFAULT '0.000000',
  `prod_adding_stock_units_instead_of_quantity` tinyint DEFAULT '0',
  `prod_convert_to_quantity` decimal(18,6) DEFAULT '0.000000',
  `prod_entry_group_for_export_2003` tinyint UNSIGNED DEFAULT '0',
  `prod_do_not_transfer_items_for_returns` tinyint DEFAULT '0',
  `stocks_no` int DEFAULT NULL,
  `selm_no` int UNSIGNED DEFAULT NULL,
  `prod_article_has_parts_list` tinyint DEFAULT '0',
  `prod_stock_parts_list_book_directly` tinyint DEFAULT '0',
  `prod_enter_additional_description` tinyint DEFAULT '0',
  `prod_kitchen_slip_only` tinyint DEFAULT '0',
  `prod_add_one_to_subtotal_line` tinyint DEFAULT '0',
  `prod_reservation_allowed` tinyint DEFAULT '0',
  `vouchm_no` int UNSIGNED DEFAULT NULL,
  `prod_create_voucher` tinyint DEFAULT '0',
  `cours_no` int UNSIGNED DEFAULT NULL,
  `prod_set_course_no_no_adding` tinyint DEFAULT '0',
  `prod_blue_code_enabled` tinyint DEFAULT '0',
  `prod_blue_code_voucher` tinyint DEFAULT '0',
  `prod_add_or_draw_image` tinyint DEFAULT '0',
  `prod_domestic_product` tinyint DEFAULT '0',
  `prod_organic_product` tinyint DEFAULT '0',
  `prod_shipping_item` tinyint DEFAULT '0',
  `prod_download_item` tinyint DEFAULT '0',
  `prod_no_reservation` tinyint DEFAULT '0',
  `count_no` varchar(2) DEFAULT NULL,
  `prod_vegan` tinyint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`prod_id`),
  UNIQUE KEY `products_prod_no_key` (`prod_no`),
  KEY `products_cours_no_ckey` (`cours_no`),
  KEY `products_prod_composite_no_description_ckey` (`prod_composite_no_description`),
  KEY `products_prodg_no_ckey` (`prodg_no`),
  KEY `products_prod_match_code_ckey` (`prod_match_code`),
  KEY `products_prod_ean_ckey` (`prod_ean`),
  KEY `products_vat_no_ckey` (`vat_no`),
  KEY `products_prod_printer_type_ckey` (`prod_printer_type`),
  KEY `products_shop_id_ckey` (`shop_id`),
  KEY `products_revenuea_no_ckey` (`revenuea_no`),
  KEY `products_commg_no_ckey` (`commg_no`),
  KEY `products_sup_no_ckey` (`sup_no`),
  KEY `products_unit_no_ckey` (`unit_no`),
  KEY `products_stocks_no_ckey` (`stocks_no`),
  KEY `products_selm_no_ckey` (`selm_no`),
  KEY `products_vouchm_no_ckey` (`vouchm_no`),
  KEY `products_count_no_ckey` (`count_no`),
  KEY `products_produ_no_key` (`produ_no`)
) ENGINE=InnoDB AUTO_INCREMENT=662 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `product_barcodes`
--

DROP TABLE IF EXISTS `product_barcodes`;
CREATE TABLE IF NOT EXISTS `product_barcodes` (
  `prodb_id` bigint NOT NULL AUTO_INCREMENT,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prodb_ean` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`prodb_id`),
  KEY `product_barcodes_prod_no_ckey` (`prod_no`),
  KEY `product_barcodes_prodb_ean_ckey` (`prodb_ean`),
  KEY `product_barcodes_prodb_key_key` (`prod_no`,`prodb_ean`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `product_characteristics`
--

DROP TABLE IF EXISTS `product_characteristics`;
CREATE TABLE IF NOT EXISTS `product_characteristics` (
  `prodc_id` bigint NOT NULL AUTO_INCREMENT,
  `prodc_guid` varchar(32) DEFAULT NULL,
  `chard_no` int DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prodc_prod_no_destination` bigint UNSIGNED DEFAULT '0',
  `prodc_ean` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`prodc_id`),
  KEY `product_characteristics_chard_no_ckey` (`chard_no`),
  KEY `product_characteristics_prod_no_ckey` (`prod_no`),
  KEY `product_characteristics_prodc_ean_ckey` (`prodc_ean`),
  KEY `product_characteristics_prodc_key_key` (`prod_no`,`chard_no`),
  KEY `product_characteristics_prodc_guid_key` (`prodc_guid`),
  KEY `product_characteristics_prodc_key_destination_ckey` (`prodc_prod_no_destination`,`chard_no`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `product_characteristics_translations`
--

DROP TABLE IF EXISTS `product_characteristics_translations`;
CREATE TABLE IF NOT EXISTS `product_characteristics_translations` (
  `prodct_id` bigint NOT NULL AUTO_INCREMENT,
  `prodc_guid` varchar(32) DEFAULT '0',
  `prodct_description` varchar(50) DEFAULT '',
  `lang_no` int DEFAULT '0',
  `prodct_image` longblob,
  `prodct_image_file_name` varchar(128) DEFAULT '',
  `prodct_image_width` int UNSIGNED DEFAULT '0',
  `prodct_image_heigth` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`prodct_id`),
  KEY `product_characteristics_translations_prodc_guid_ckey` (`prodc_guid`),
  KEY `product_characteristics_translations_lang_no_ckey` (`lang_no`),
  KEY `product_characteristics_translations_prodct_key_key` (`prodc_guid`,`lang_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tabellenstruktur für Tabelle `product_foreign_numbers`
--

DROP TABLE IF EXISTS `product_foreign_numbers`;
CREATE TABLE IF NOT EXISTS `product_foreign_numbers` (
  `prodfn_id` bigint NOT NULL AUTO_INCREMENT,
  `prodfn_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prodfn_foreign_product_no` bigint UNSIGNED DEFAULT NULL,
  `prodfn_bar_system_start` tinyint DEFAULT '0',
  `prodfn_bar_system_end` tinyint DEFAULT '0',
  PRIMARY KEY (`prodfn_id`),
  KEY `product_foreign_numbers_prodfn_no_ckey` (`prodfn_no`),
  KEY `product_foreign_numbers_prod_no_ckey` (`prod_no`),
  KEY `product_foreign_numbers_prodfn_foreign_product_no_ckey` (`prodfn_foreign_product_no`),
  KEY `product_foreign_numbers_prodfn_key_ckey` (`prodfn_no`,`prod_no`),
  KEY `product_foreign_numbers_prodfn_key_foreign_ckey` (`prodfn_no`,`prodfn_foreign_product_no`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `product_groups`
--

DROP TABLE IF EXISTS `product_groups`;
CREATE TABLE IF NOT EXISTS `product_groups` (
  `prodg_id` bigint NOT NULL AUTO_INCREMENT,
  `prodg_no` int DEFAULT NULL,
  `prodm_no` int DEFAULT NULL,
  `prodg_description` varchar(50) DEFAULT NULL,
  `prodg_start_prod_no` int DEFAULT '0',
  `prodg_type` tinyint UNSIGNED DEFAULT '1',
  `vat_no` tinyint UNSIGNED DEFAULT NULL,
  `prodg_key_color` int UNSIGNED DEFAULT NULL,
  `prodg_font_color` int UNSIGNED DEFAULT NULL,
  `prodg_operator_commission_allowed` tinyint DEFAULT '1',
  `prodg_composite_no_description` varchar(50) DEFAULT NULL,
  `prodg_printer_type` tinyint UNSIGNED DEFAULT NULL,
  `prodg_sort` longtext,
  `prodg_lock_workstation` longtext,
  `shop_id` bigint DEFAULT NULL,
  PRIMARY KEY (`prodg_id`),
  UNIQUE KEY `product_groups_prodg_no_key` (`prodg_no`),
  KEY `product_groups_prodm_no_ckey` (`prodm_no`),
  KEY `product_groups_prodg_description_ckey` (`prodg_description`),
  KEY `product_groups_vat_no_ckey` (`vat_no`),
  KEY `product_groups_prodg_composite_no_description_ckey` (`prodg_composite_no_description`),
  KEY `product_groups_prodg_printer_type_ckey` (`prodg_printer_type`),
  KEY `product_groups_shop_id_ckey` (`shop_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `product_group_links`
--

DROP TABLE IF EXISTS `product_group_links`;
CREATE TABLE IF NOT EXISTS `product_group_links` (
  `prodl_id` bigint NOT NULL AUTO_INCREMENT,
  `prodg_no` int DEFAULT '0',
  `prod_no` bigint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`prodl_id`),
  UNIQUE KEY `prodl_key` (`prodg_no`,`prod_no`),
  UNIQUE KEY `prodl_mkey` (`prod_no`,`prodg_no`),
  KEY `WDIDX16788927375` (`prodg_no`),
  KEY `WDIDX16788927376` (`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `product_group_translations`
--

DROP TABLE IF EXISTS `product_group_translations`;
CREATE TABLE IF NOT EXISTS `product_group_translations` (
  `prodgt_id` bigint NOT NULL AUTO_INCREMENT,
  `lang_no` int DEFAULT '0',
  `prodgt_description` varchar(50) DEFAULT '',
  `prodg_no` int DEFAULT '0',
  PRIMARY KEY (`prodgt_id`),
  KEY `product_group_translations_lang_no_ckey` (`lang_no`),
  KEY `product_group_translations_prodg_no_ckey` (`prodg_no`),
  KEY `product_group_translations_prodgt_key_ckey` (`prodg_no`,`lang_no`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tabellenstruktur für Tabelle `product_images`
--

DROP TABLE IF EXISTS `product_images`;
CREATE TABLE IF NOT EXISTS `product_images` (
  `prodi_id` bigint NOT NULL AUTO_INCREMENT,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `prodi_type` tinyint UNSIGNED DEFAULT NULL,
  `prodi_image` longblob,
  `prodi_image_file_name` varchar(128) DEFAULT NULL,
  `prodi_width` smallint UNSIGNED DEFAULT '0',
  `prodi_height` smallint UNSIGNED DEFAULT '0',
  `lang_no` int DEFAULT '0',
  PRIMARY KEY (`prodi_id`),
  UNIQUE KEY `prodi_key` (`prod_no`,`lang_no`,`prodi_type`),
  KEY `WDIDX16810599550` (`prod_no`),
  KEY `WDIDX16810599551` (`prodi_type`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Tabellenstruktur für Tabelle `product_main_groups`
--

DROP TABLE IF EXISTS `product_main_groups`;
CREATE TABLE IF NOT EXISTS `product_main_groups` (
  `prodm_id` bigint NOT NULL AUTO_INCREMENT,
  `prodm_no` int DEFAULT NULL,
  `shop_no` int DEFAULT NULL,
  `prodm_description` varchar(50) DEFAULT NULL,
  `prodm_type` tinyint UNSIGNED DEFAULT '0',
  `prodm_composite_no_description` varchar(56) DEFAULT NULL,
  `prodm_button_background_color` int UNSIGNED DEFAULT '0',
  `prodm_font_color` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`prodm_id`),
  UNIQUE KEY `product_main_groups_prodm_no_key` (`prodm_no`),
  KEY `product_main_groups_shop_no_ckey` (`shop_no`),
  KEY `product_main_groups_prodm_description_ckey` (`prodm_description`),
  KEY `product_main_groups_prodm_composite_no_description_ckey` (`prodm_composite_no_description`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `product_translations`
--

DROP TABLE IF EXISTS `product_translations`;
CREATE TABLE IF NOT EXISTS `product_translations` (
  `prodt_id` bigint NOT NULL AUTO_INCREMENT,
  `prodt_type` tinyint UNSIGNED DEFAULT '0',
  `lang_no` int DEFAULT '0',
  `prod_no` bigint UNSIGNED DEFAULT '0',
  `prodt_description` longtext,
  PRIMARY KEY (`prodt_id`),
  KEY `product_translations_prodt_type_ckey` (`prodt_type`),
  KEY `product_translations_lang_no_ckey` (`lang_no`),
  KEY `product_translations_prod_no_ckey` (`prod_no`),
  KEY `product_translations_prodt_key_ckey` (`prod_no`,`lang_no`,`prodt_type`)
);

--
-- Tabellenstruktur für Tabelle `public_holidays`
--

DROP TABLE IF EXISTS `public_holidays`;
CREATE TABLE IF NOT EXISTS `public_holidays` (
  `pubhol_id` bigint NOT NULL AUTO_INCREMENT,
  `count_no` varchar(2) DEFAULT NULL,
  `count_id` varchar(2) DEFAULT NULL,
  `pubhol_neujahrstag` tinyint DEFAULT '0',
  `pubhol_oster_montag` tinyint DEFAULT '0',
  `pubhol_heilige_3_koenige` tinyint DEFAULT '0',
  `pubhol_staatsfeiertag` tinyint DEFAULT '0',
  `pubhol_christi_himmelfahrtstag` tinyint DEFAULT '0',
  `pubhol_fron_leichnam` tinyint DEFAULT '0',
  `pubhol_maria_himmelfahrt` tinyint DEFAULT '0',
  `pubhol_nationalfeiertag` tinyint DEFAULT '0',
  `pubhol_allerheiligen` tinyint DEFAULT '0',
  `pubhol_naria_empfaengnis` tinyint DEFAULT '0',
  `pubhol_christtag` tinyint DEFAULT '0',
  `pubhol_stefanitag` tinyint DEFAULT '0',
  `pubhol_reformationstag` tinyint DEFAULT '0',
  `pubhol_bet_und_busstag` tinyint DEFAULT '0',
  `pubhol_friedens_fest` tinyint DEFAULT '0',
  `pubhol_berchtoldstag` tinyint DEFAULT '0',
  `pubhol_tag_der_arbeit` tinyint DEFAULT '0',
  `pubhol_pfingst_montag` tinyint DEFAULT '0',
  `pubhol_karfreitag` tinyint DEFAULT '0',
  `pubhol_josefstag` tinyint DEFAULT '0',
  `pubhol_florianitag` tinyint DEFAULT '0',
  `pubhol_rupertitag` tinyint DEFAULT '0',
  `pubhol_tag_der_volksabstimmung` tinyint DEFAULT '0',
  `pubhol_martinstag` tinyint DEFAULT '0',
  `pubhol_leopoldi_tag` tinyint DEFAULT '0',
  `pubhol_bundesfeier` tinyint DEFAULT '0',
  `pubhol_feiertag_1` tinyint DEFAULT '0',
  `pubhol_feiertag_1_date` date DEFAULT NULL,
  `pubhol_feiertag_2` tinyint DEFAULT '0',
  `pubhol_feiertag_2_date` date DEFAULT NULL,
  `pubhol_feiertag_3` tinyint DEFAULT '0',
  `pubhol_feiertag_3_date` date DEFAULT NULL,
  PRIMARY KEY (`pubhol_id`),
  KEY `public_holidays_count_id_ckey` (`count_id`),
  KEY `public_holidays_count_no_ckey` (`count_no`)
);

--
-- Tabellenstruktur für Tabelle `revenue_accounts`
--

DROP TABLE IF EXISTS `revenue_accounts`;
CREATE TABLE IF NOT EXISTS `revenue_accounts` (
  `revenuea_id` bigint NOT NULL AUTO_INCREMENT,
  `revenuea_no` int UNSIGNED DEFAULT NULL,
  `revenuea_description` varchar(50) DEFAULT NULL,
  `vat_no` tinyint UNSIGNED DEFAULT NULL,
  `revenuea_booking_reference` int UNSIGNED DEFAULT NULL,
  `revenuea_no_accounting_transfer` tinyint DEFAULT '0',
  PRIMARY KEY (`revenuea_id`),
  KEY `revenue_accounts_revenuea_no_key` (`revenuea_no`),
  KEY `revenue_accounts_revenuea_description_ckey` (`revenuea_description`),
  KEY `revenue_accounts_vat_no_ckey` (`vat_no`)
);

--
-- Tabellenstruktur für Tabelle `rksv_dep`
--

DROP TABLE IF EXISTS `rksv_dep`;
CREATE TABLE IF NOT EXISTS `rksv_dep` (
  `rksvd_id` bigint NOT NULL AUTO_INCREMENT,
  `rksvd_no` bigint UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `salesm_slip_no` bigint UNSIGNED DEFAULT NULL,
  `salesm_date` date DEFAULT NULL,
  `salesm_time` time DEFAULT NULL,
  `rksvd_turnover_total` decimal(18,6) DEFAULT '0.000000',
  `rksvd_turnover_slip` decimal(18,6) DEFAULT '0.000000',
  `rksvd_turnover_total_aes` varchar(50) DEFAULT NULL,
  `rksvd_signature_hex` varchar(18) DEFAULT NULL,
  `rksvd_text` longtext,
  `salesm_rksv_turnover_1` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_2` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_3` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_4` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_5` decimal(18,6) DEFAULT '0.000000',
  `rksvd_training` tinyint DEFAULT '0',
  `rksvd_signature_device_failed` tinyint DEFAULT '0',
  `rksvd_state` tinyint UNSIGNED DEFAULT NULL,
  `rksvd_transfered` datetime DEFAULT NULL,
  `rksvd_fon_transfered` datetime DEFAULT NULL,
  PRIMARY KEY (`rksvd_id`),
  KEY `rksv_dep_rksvd_no_ckey` (`rksvd_no`),
  KEY `rksv_dep_branch_no_ckey` (`branch_no`),
  KEY `rksv_dep_station_no_ckey` (`station_no`),
  KEY `rksv_dep_salesm_guid_ckey` (`salesm_guid`),
  KEY `rksv_dep_salesm_slip_no_ckey` (`salesm_slip_no`),
  KEY `rksv_dep_salesm_date_ckey` (`salesm_date`),
  KEY `rksv_dep_salesm_time_ckey` (`salesm_time`),
  KEY `rksv_dep_rksvd_state_ckey` (`rksvd_state`),
  KEY `rksv_dep_rksvd_transfered_ckey` (`rksvd_transfered`),
  KEY `rksv_dep_rksvd_key_key` (`station_no`,`rksvd_no`),
  KEY `rksv_dep_rksvd_status_key_ckey` (`station_no`,`rksvd_state`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `rksv_online_tax_authorities`
--

DROP TABLE IF EXISTS `rksv_online_tax_authorities`;
CREATE TABLE IF NOT EXISTS `rksv_online_tax_authorities` (
  `rksvo_id` bigint NOT NULL AUTO_INCREMENT,
  `rksvo_type` tinyint UNSIGNED DEFAULT '0',
  `rksvo_sequence_no` varchar(50) DEFAULT NULL,
  `rksvo_return_code` longtext,
  `rksvo_message` longtext,
  `rksvo_result_list` longtext,
  `rksvo_error_code` varchar(50) DEFAULT NULL,
  `rksvo_success` tinyint DEFAULT '0',
  `rksvo_error` tinyint DEFAULT '0',
  `rksvo_transferred` datetime DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `station_no` int UNSIGNED NOT NULL,
  PRIMARY KEY (`rksvo_id`),
  KEY `rksv_online_tax_authorities_rksvo_transferred_ckey` (`rksvo_transferred`),
  KEY `rksv_online_tax_authorities_branch_no_ckey` (`branch_no`),
  KEY `rksv_online_tax_authorities_station_no_ckey` (`station_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `room_rentals`
--

DROP TABLE IF EXISTS `room_rentals`;
CREATE TABLE IF NOT EXISTS `room_rentals` (
  `room_id` bigint NOT NULL AUTO_INCREMENT,
  `room_no` int UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `build_no` int UNSIGNED DEFAULT NULL,
  `room_sort` varchar(8) DEFAULT NULL,
  `room_reference_no` int UNSIGNED DEFAULT NULL,
  `room_composite_no_description` varchar(59) DEFAULT NULL,
  `description` varchar(50) DEFAULT NULL,
  `room_number_beds` int DEFAULT NULL,
  `room_x` int DEFAULT '0',
  `room_y` int DEFAULT '0',
  `room_width` int DEFAULT '0',
  `room_height` int DEFAULT '0',
  `room_image` longblob,
  `room_image_occupied` longblob,
  `room_image_reservated` longblob,
  `room_image_reservated_occupied` longblob,
  `room_icon_calendar` longblob,
  `room_image_file_name` varchar(255) DEFAULT NULL,
  `room_image_occupied_file_name` varchar(255) DEFAULT NULL,
  `room_image_reservated_file_name` varchar(255) DEFAULT NULL,
  `room_image_reservated_occupied_file_name` varchar(255) DEFAULT NULL,
  `room_icon_calendar_file_name` varchar(255) DEFAULT NULL,
  `room_color` int UNSIGNED DEFAULT '0',
  `room_font_color` int UNSIGNED DEFAULT '0',
  `room_font_name` varchar(50) DEFAULT NULL,
  `room_font_size` double DEFAULT '10',
  `room_font_bold` tinyint DEFAULT '0',
  `room_font_italic` tinyint DEFAULT '0',
  `room_font_underlined` tinyint DEFAULT '0',
  `opera_no` int UNSIGNED DEFAULT '0',
  `cust_no` int UNSIGNED DEFAULT '0',
  `room_calendar_width` int UNSIGNED DEFAULT '100',
  PRIMARY KEY (`room_id`),
  KEY `room_rentals_room_no_key` (`room_no`),
  KEY `room_rentals_branch_no_ckey` (`branch_no`),
  KEY `room_rentals_build_no_ckey` (`build_no`),
  KEY `room_rentals_room_reference_no_key` (`room_reference_no`),
  KEY `room_rentals_room_composite_no_description_key` (`room_composite_no_description`),
  KEY `room_rentals_room_number_beds_ckey` (`room_number_beds`),
  KEY `room_rentals_opera_no_ckey` (`opera_no`),
  KEY `room_rentals_cust_no_ckey` (`cust_no`),
  KEY `room_rentals_room_key_key` (`branch_no`,`build_no`,`room_no`),
  KEY `room_rentals_room_key_branch_room_no_ckey` (`branch_no`,`room_no`),
  KEY `room_rentals_room_key_branch_sort_ckey` (`branch_no`,`room_sort`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `route_details`
--

DROP TABLE IF EXISTS `route_details`;
CREATE TABLE IF NOT EXISTS `route_details` (
  `routed_id` bigint NOT NULL AUTO_INCREMENT,
  `routem_no` int NOT NULL DEFAULT '0',
  `cust_no` int UNSIGNED DEFAULT NULL,
  `routed_order_no` int DEFAULT NULL,
  `routed_money_due` decimal(18,6) DEFAULT NULL,
  `routed_turnover` decimal(18,6) DEFAULT NULL,
  `routed_money_dept` decimal(18,6) DEFAULT NULL,
  `routed_money_payed` decimal(18,6) DEFAULT NULL,
  `routed_payment_cust_no` bigint DEFAULT '0',
  `routed_dept_cust_no` bigint DEFAULT '0',
  `routed_turnover_no` bigint DEFAULT '0',
  PRIMARY KEY (`routed_id`),
  KEY `route_details_cust_no_ckey` (`cust_no`),
  KEY `route_details_routed_order_no_ckey` (`routed_order_no`),
  KEY `route_details_routed_key_ckey` (`cust_no`),
  KEY `route_details_routem_no_key` (`routem_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `route_groups`
--

DROP TABLE IF EXISTS `route_groups`;
CREATE TABLE IF NOT EXISTS `route_groups` (
  `routeg_id` bigint NOT NULL AUTO_INCREMENT,
  `routeg_no` int DEFAULT NULL,
  `routeg_description` varchar(50) DEFAULT NULL,
  `routeg_weekday_1` tinyint DEFAULT '0',
  `routeg_weekday_2` tinyint DEFAULT '0',
  `routeg_weekday_3` tinyint DEFAULT '0',
  `routeg_weekday_4` tinyint DEFAULT '0',
  `routeg_weekday_5` tinyint DEFAULT '0',
  `routeg_weekday_6` tinyint DEFAULT '0',
  `routeg_weekday_7` tinyint DEFAULT '0',
  `opera_no` int UNSIGNED DEFAULT NULL,
  `routeg_license_plate` varchar(12) DEFAULT NULL,
  `routeg_region_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`routeg_id`),
  KEY `route_groups_routeg_no_key` (`routeg_no`),
  KEY `route_groups_opera_no_ckey` (`opera_no`),
  KEY `route_groups_routeg_license_plate_ckey` (`routeg_license_plate`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `route_master`
--

DROP TABLE IF EXISTS `route_master`;
CREATE TABLE IF NOT EXISTS `route_master` (
  `routem_id` bigint NOT NULL AUTO_INCREMENT,
  `routem_no` int NOT NULL DEFAULT '0',
  `routeg_no` int NOT NULL DEFAULT '0',
  `routem_date` date DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `routeg_license_plate` varchar(12) DEFAULT NULL,
  `routem_mileage_start` int UNSIGNED DEFAULT NULL,
  `routem_mileage_end` int UNSIGNED DEFAULT NULL,
  `routem_mileage` int UNSIGNED DEFAULT NULL,
  `routem_time_start` time DEFAULT NULL,
  `routem_time_end` time DEFAULT NULL,
  `routem_hours` decimal(18,6) DEFAULT NULL,
  `routem_balance_still_open` decimal(18,6) DEFAULT NULL,
  `routem_total_still_open` decimal(18,6) DEFAULT NULL,
  `routem_total_turnover` decimal(18,6) DEFAULT NULL,
  `routem_total_money_due` decimal(18,6) DEFAULT NULL,
  `routem_total_money_dept` decimal(18,6) DEFAULT NULL,
  `routem_route_id` bigint DEFAULT NULL,
  PRIMARY KEY (`routem_id`),
  KEY `route_master_routeg_no_ckey` (`routeg_no`),
  KEY `route_master_routem_date_ckey` (`routem_date`),
  KEY `route_master_opera_no_ckey` (`opera_no`),
  KEY `route_master_routeg_license_plate_ckey` (`routeg_license_plate`),
  KEY `route_master_routem_key_key` (`routeg_no`,`routem_date`),
  KEY `route_master_routem_no_key` (`routem_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `sales_details`
--

DROP TABLE IF EXISTS `sales_details`;
CREATE TABLE IF NOT EXISTS `sales_details` (
  `salesd_id` bigint NOT NULL AUTO_INCREMENT,
  `prodc_guid` varchar(32) DEFAULT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `vouchd_no` int UNSIGNED DEFAULT NULL,
  `salesd_line_no` int DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `salesd_changed_date` datetime DEFAULT NULL,
  `salesd_changed_station` int UNSIGNED DEFAULT '0',
  `salesd_changed_version` int UNSIGNED DEFAULT '0',
  `salesd_date` date DEFAULT NULL,
  `salesd_time` time DEFAULT NULL,
  `salesd_barcode` varchar(14) DEFAULT NULL,
  `salesd_amount` double DEFAULT '0',
  `stockm_reserved` double DEFAULT '0',
  `stockr_guid` varchar(32) DEFAULT '',
  `salesd_price_total` decimal(18,6) DEFAULT '0.000000',
  `salesd_price_one_unit` decimal(18,6) DEFAULT '0.000000',
  `vat_no` tinyint UNSIGNED DEFAULT NULL,
  `salesd_product_description` varchar(255) DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `salesd_kitchen_order_no` int DEFAULT '0',
  `salesd_discount_locked` tinyint DEFAULT '0',
  `salesd_line_discount_amount` decimal(18,6) DEFAULT '0.000000',
  `salesd_line_discount_percent` double DEFAULT '0',
  `salesd_invoice_split_part_no` int UNSIGNED DEFAULT '0',
  `salesd_line_cancellation` tinyint UNSIGNED DEFAULT '0',
  `salesd_cancellation_slip_no` int UNSIGNED DEFAULT '0',
  `salesd_cancellation_type` tinyint UNSIGNED DEFAULT '0',
  `salesd_print_line_on_slip` tinyint DEFAULT '1',
  `salesd_print_price_on_slip` tinyint DEFAULT '1',
  `salesd_print_on_kitchen_order` tinyint DEFAULT '1',
  `salesd_menue_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_operator_single_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_operator_total_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_product_groups_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_products_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_hourly_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_selled_products_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_products_selled_each_operator_no` int UNSIGNED DEFAULT '0',
  `salesd_counting_list_no` int UNSIGNED DEFAULT '0',
  `commg_no` int UNSIGNED DEFAULT '0',
  `salesd_accounting_commision_no` int UNSIGNED DEFAULT '0',
  `salesd_commision_amount` decimal(18,6) DEFAULT '0.000000',
  `salesd_key_pressed` varchar(15) DEFAULT NULL,
  `salesd_subtotal_line_no` int DEFAULT '0',
  `salesd_stock_level_target` double DEFAULT '0',
  `salesd_final_total` decimal(18,6) DEFAULT '0.000000',
  `salesd_net_final_total` decimal(18,6) DEFAULT '0.000000',
  `salesd_vat_final_total` decimal(18,6) DEFAULT '0.000000',
  `salesd_brut_final_total` decimal(18,6) DEFAULT '0.000000',
  `salesd_discount_total` decimal(18,6) DEFAULT '0.000000',
  `salesd_final_total_before_discount` decimal(18,6) DEFAULT '0.000000',
  `salesd_product_group` int DEFAULT '0',
  `sup_no` int UNSIGNED DEFAULT '0',
  `salesd_purchasing_price_net` decimal(18,6) DEFAULT '0.000000',
  `salesd_amount_source_from_scale` tinyint DEFAULT '0',
  `salesd_erp_delivery_note_no` int UNSIGNED DEFAULT '0',
  `salesd_erp_delivery_note_date` date DEFAULT NULL,
  `salesd_erp_delivery_note_customer_no` int UNSIGNED DEFAULT '0',
  `salesd_erp_line_no` int UNSIGNED DEFAULT '0',
  `salesd_erp_delivery_note_data_acquisition_group` tinyint UNSIGNED DEFAULT '0',
  `salesd_erp_invoice_no` int UNSIGNED DEFAULT '0',
  `salesd_was_transferred` tinyint DEFAULT '0',
  `salesd_product_only_on_kitchen_order` tinyint DEFAULT '0',
  `salesd_voucher_barcode` varchar(14) DEFAULT NULL,
  `salesd_foreign_article_number` varchar(80) DEFAULT NULL,
  `salesd_dispensing_system_ok` tinyint DEFAULT '0',
  `salesd_selection_no` int UNSIGNED DEFAULT '0',
  `salesd_course_no` int UNSIGNED DEFAULT '0',
  `salesd_kitchen_order_image` longblob,
  `salesd_kitchen_order_image_changed` datetime DEFAULT NULL,
  `salesd_kitchen_order_image_changed_station` int UNSIGNED DEFAULT '0',
  `salesd_kitchen_order_image_changed_version` int UNSIGNED DEFAULT '0',
  `salesd_line_no_from_main_product` int DEFAULT '0',
  `salesd_staggered_price` tinyint DEFAULT '0',
  `salesd_bluecode_voucher` tinyint DEFAULT '0',
  `salesd_bluecode_product_no` varchar(36) DEFAULT NULL,
  `revenuea_no` int UNSIGNED DEFAULT '0',
  PRIMARY KEY (`salesd_id`),
  KEY `sales_details_salesm_guid_ckey` (`salesm_guid`),
  KEY `sales_details_vouchd_no_ckey` (`vouchd_no`),
  KEY `sales_details_salesd_line_no_ckey` (`salesd_line_no`),
  KEY `sales_details_prod_no_ckey` (`prod_no`),
  KEY `sales_details_salesd_changed_date_ckey` (`salesd_changed_date`),
  KEY `sales_details_salesd_changed_station_ckey` (`salesd_changed_station`),
  KEY `sales_details_salesd_changed_version_ckey` (`salesd_changed_version`),
  KEY `sales_details_salesd_date_ckey` (`salesd_date`),
  KEY `sales_details_vat_no_ckey` (`vat_no`),
  KEY `sales_details_opera_no_ckey` (`opera_no`),
  KEY `sales_details_sup_no_ckey` (`sup_no`),
  KEY `sales_details_revenuea_no_ckey` (`revenuea_no`),
  KEY `sales_details_salesd_key_date_time_ckey` (`salesd_date`,`salesd_time`),
  KEY `sales_details_salesd_key_key` (`salesm_guid`,`salesd_line_no`),
  KEY `sales_details_salesd_key_barcode_ckey` (`salesm_guid`,`salesd_barcode`),
  KEY `sales_details_salesd_key_changed_ckey` (`salesd_changed_station`,`salesd_changed_version`),
  KEY `sales_details_salesd_key_changed_version_ckey` (`salesd_changed_version`,`salesd_changed_station`),
  KEY `sales_details_prodc_guid_ckey` (`prodc_guid`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `sales_discount`
--

DROP TABLE IF EXISTS `sales_discount`;
CREATE TABLE IF NOT EXISTS `sales_discount` (
  `salesdc_id` bigint NOT NULL AUTO_INCREMENT,
  `salesdc_no` int NOT NULL DEFAULT '0',
  `salesdc_description` varchar(50) DEFAULT '',
  `salesdc_discount_percent` float NOT NULL DEFAULT '0',
  `salesdc_discount_payment_terms` int UNSIGNED DEFAULT '7',
  `salesdc_net_payment_terms` int UNSIGNED DEFAULT '14',
  PRIMARY KEY (`salesdc_id`),
  UNIQUE KEY `salesdc_no` (`salesdc_no`),
  KEY `WDIDX16788927387` (`salesdc_description`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `sales_master`
--

DROP TABLE IF EXISTS `sales_master`;
CREATE TABLE IF NOT EXISTS `sales_master` (
  `salesm_id` bigint NOT NULL AUTO_INCREMENT,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `salesm_changed_date` datetime DEFAULT NULL,
  `salesm_changed_station` int UNSIGNED DEFAULT '0',
  `salesm_changed_version` int UNSIGNED DEFAULT '0',
  `salesm_state` int DEFAULT '0',
  `salesm_type` tinyint UNSIGNED DEFAULT '1',
  `salesm_slip_no` bigint UNSIGNED DEFAULT '0',
  `salesm_invoice_no` int DEFAULT '0',
  `salesm_table_no` decimal(18,6) DEFAULT '0.000000',
  `salesm_table_no_integer` int UNSIGNED DEFAULT '0',
  `waitl_last_no` tinyint UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `salesm_station_finished_document` int UNSIGNED DEFAULT '0',
  `employee_no` int UNSIGNED DEFAULT NULL,
  `salesm_date` date DEFAULT NULL,
  `salesm_date_logic` date DEFAULT NULL,
  `salesm_time` time DEFAULT NULL,
  `salesm_line_count` int DEFAULT '0',
  `salesm_payment_type` int DEFAULT NULL,
  `delt_no` int DEFAULT '0',
  `salesm_delivery_date_time` datetime DEFAULT NULL,
  `salesm_delivery_opera_no` int UNSIGNED DEFAULT '0',
  `salesm_subtotal` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_1` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_2` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_3` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_4` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_5` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_6` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_7` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_8` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_9` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_given_history_10` decimal(18,6) DEFAULT '0.000000',
  `salesm_cash_change` decimal(18,6) DEFAULT '0.000000',
  `cust_no` int UNSIGNED DEFAULT NULL,
  `salesm_company` varchar(50) DEFAULT NULL,
  `salesm_company_department` varchar(50) DEFAULT '',
  `sal_no` int DEFAULT '0',
  `tit_no` int DEFAULT '0',
  `salesm_first_name` varchar(40) DEFAULT NULL,
  `salesm_last_name` varchar(40) DEFAULT NULL,
  `salesm_street` varchar(50) DEFAULT NULL,
  `postc_no` varchar(8) DEFAULT NULL,
  `cust_city` varchar(30) DEFAULT NULL,
  `count_no` varchar(2) DEFAULT NULL,
  `salesm_last_product_group` int DEFAULT '0',
  `salesm_last_product_group_offset` int DEFAULT '0',
  `salesm_last_product_screen_dialog` int DEFAULT '0',
  `salesm_quantity` double NOT NULL DEFAULT '0',
  `salesm_net_total` decimal(18,6) DEFAULT '0.000000',
  `salesm_vat_total` decimal(18,6) DEFAULT '0.000000',
  `salesm_cancellation` tinyint DEFAULT '0',
  `salesm_transferred` tinyint DEFAULT '0',
  `salesm_transferred_station` int DEFAULT '0',
  `salesm_transferred_date` date DEFAULT NULL,
  `salesm_transferred_time` time DEFAULT NULL,
  `salesm_transferred_from_station` int DEFAULT '0',
  `salesm_transferred_from_date` date DEFAULT NULL,
  `salesm_transferred_from_time` time DEFAULT NULL,
  `salesm_transferred_in_progress` tinyint DEFAULT '0',
  `salesm_discount_amount` decimal(18,6) DEFAULT '0.000000',
  `salesm_discount_percent` double DEFAULT '0',
  `salesm_voucher_redeemed` tinyint DEFAULT '0',
  `salesm_voucher_description` varchar(50) DEFAULT NULL,
  `salesm_voucher_ean` varchar(80) DEFAULT NULL,
  `salesm_total` decimal(18,6) DEFAULT '0.000000',
  `salesm_decimal_places` tinyint UNSIGNED DEFAULT '2',
  `salesm_printed` tinyint DEFAULT '0',
  `salesm_customer_account_booked` tinyint DEFAULT '0',
  `salesm_ignore_working_hours` tinyint DEFAULT '0',
  `salesm_kitchen_order_printed` tinyint DEFAULT '0',
  `salesm_erp_invoice_no` int UNSIGNED DEFAULT '0',
  `salesm_tip` decimal(18,6) DEFAULT '0.000000',
  `salesm_get_signature` tinyint DEFAULT '0',
  `salesm_get_signature_and_invoice` tinyint DEFAULT '0',
  `salesm_get_kitchen_order` tinyint DEFAULT '0',
  `salesm_get_bluecode` tinyint DEFAULT '0',
  `salesm_get_bluecode_ok` tinyint DEFAULT '0',
  `salesm_bluecode_tan` varchar(40) DEFAULT NULL,
  `salesm_bluecode_barcode` varchar(24) DEFAULT NULL,
  `salesm_bluecode_end_to_end_id` varchar(50) DEFAULT NULL,
  `salesm_bluecode_refund_ok` tinyint DEFAULT '0',
  `salesm_bluecode_voucher_ok` tinyint DEFAULT '0',
  `salesm_rksv_signature` longtext,
  `salesm_rksv_signature_mobile` longtext,
  `salesm_rksv_status` tinyint UNSIGNED DEFAULT '0',
  `salesm_rksv_failed` tinyint DEFAULT '0',
  `salesm_rksv_collective_receipt` tinyint DEFAULT '0',
  `salesm_rksv_turnover_1` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_2` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_3` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_4` decimal(18,6) DEFAULT '0.000000',
  `salesm_rksv_turnover_5` decimal(18,6) DEFAULT '0.000000',
  `salesm_fon_transfer_ok` tinyint DEFAULT '0',
  `salesm_fon_transfer_error_code` varchar(5) DEFAULT NULL,
  `salesm_fon_transfer_date` datetime DEFAULT NULL,
  `salesm_atm_customer_slip` longtext,
  `salesm_atm_merchant_slip` longtext,
  `salesm_atm_terminal_id` varchar(50) DEFAULT NULL,
  `salesm_atm_cash_partial_payment_amount` decimal(18,6) DEFAULT '0.000000',
  `salesm_atm_cash_partial_payment` tinyint DEFAULT '0',
  `salesm_atm_transaction_no` varchar(50) DEFAULT NULL,
  `salesm_atm_reference_no` varchar(20) DEFAULT NULL,
  `salesm_atm_authentication_no` varchar(10) DEFAULT NULL,
  `salesm_atm_acquire_no` varchar(12) DEFAULT NULL,
  `salesm_atm_payment_method` varchar(15) DEFAULT NULL,
  `salesm_atm_aid` varchar(24) DEFAULT NULL,
  `salesm_atm_refund_ok` tinyint DEFAULT '0',
  `salesm_sync_station` int UNSIGNED DEFAULT '0',
  `salesm_sync_started` datetime DEFAULT NULL,
  `salesm_back_plus_import_date` datetime DEFAULT NULL,
  `salesm_webshop_order_id` varchar(12) DEFAULT NULL,
  `salesm_webshop_customer_remark` longtext,
  `salesm_total_invoice_from` date DEFAULT NULL,
  `salesm_total_invoice_to` date DEFAULT NULL,
  `salesm_tse_start` datetime DEFAULT NULL,
  `salesm_tse_stop` datetime DEFAULT NULL,
  `salesm_tse_transaction_no` bigint DEFAULT '0',
  `salesm_tse_signature_counter` bigint DEFAULT '0',
  `salesm_tse_serial_no` varchar(64) DEFAULT '0',
  `salesm_tse_type` tinyint UNSIGNED DEFAULT '0',
  `salesm_tse_signature` longtext,
  `salesm_tse_status` tinyint UNSIGNED DEFAULT '0',
  `salesm_tse_turnover_1` decimal(18,6) DEFAULT '0.000000',
  `salesm_tse_turnover_2` decimal(18,6) DEFAULT '0.000000',
  `salesm_tse_turnover_3` decimal(18,6) DEFAULT '0.000000',
  `salesm_tse_turnover_4` decimal(18,6) DEFAULT '0.000000',
  `salesm_tse_turnover_5` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`salesm_id`),
  KEY `sales_master_salesm_guid_key` (`salesm_guid`),
  KEY `sales_master_salesm_changed_date_ckey` (`salesm_changed_date`),
  KEY `sales_master_salesm_changed_station_ckey` (`salesm_changed_station`),
  KEY `sales_master_salesm_changed_version_ckey` (`salesm_changed_version`),
  KEY `sales_master_salesm_state_ckey` (`salesm_state`),
  KEY `sales_master_salesm_type_ckey` (`salesm_type`),
  KEY `sales_master_salesm_slip_no_ckey` (`salesm_slip_no`),
  KEY `sales_master_salesm_invoice_no_ckey` (`salesm_invoice_no`),
  KEY `sales_master_salesm_table_no_ckey` (`salesm_table_no`),
  KEY `sales_master_salesm_table_no_integer_ckey` (`salesm_table_no_integer`),
  KEY `sales_master_branch_no_ckey` (`branch_no`),
  KEY `sales_master_station_no_ckey` (`station_no`),
  KEY `sales_master_opera_no_ckey` (`opera_no`),
  KEY `sales_master_employee_no_ckey` (`employee_no`),
  KEY `sales_master_salesm_date_ckey` (`salesm_date`),
  KEY `sales_master_salesm_date_logic_ckey` (`salesm_date_logic`),
  KEY `sales_master_salesm_time_ckey` (`salesm_time`),
  KEY `sales_master_salesm_payment_type_ckey` (`salesm_payment_type`),
  KEY `sales_master_delt_no_ckey` (`delt_no`),
  KEY `sales_master_cust_no_ckey` (`cust_no`),
  KEY `sales_master_sal_no_ckey` (`sal_no`),
  KEY `sales_master_tit_no_ckey` (`tit_no`),
  KEY `sales_master_postc_no_ckey` (`postc_no`),
  KEY `sales_master_cust_city_ckey` (`cust_city`),
  KEY `sales_master_count_no_ckey` (`count_no`),
  KEY `sales_master_salesm_get_signature_ckey` (`salesm_get_signature`),
  KEY `sales_master_salesm_get_signature_and_invoice_ckey` (`salesm_get_signature_and_invoice`),
  KEY `sales_master_salesm_get_kitchen_order_ckey` (`salesm_get_kitchen_order`),
  KEY `sales_master_salesm_rksv_status_ckey` (`salesm_rksv_status`),
  KEY `sales_master_salesm_key_key` (`station_no`,`salesm_slip_no`),
  KEY `sales_master_salesm_key_operator_ckey` (`station_no`,`employee_no`,`salesm_state`),
  KEY `sales_master_salesm_key_table_no_ckey` (`branch_no`,`salesm_cancellation`,`salesm_state`,`salesm_table_no`),
  KEY `sales_master_salesm_key_table_no_integer_ckey` (`branch_no`,`salesm_table_no_integer`,`salesm_cancellation`,`salesm_state`),
  KEY `sales_master_salesm_key_date_time_ckey` (`salesm_date`,`salesm_time`),
  KEY `sales_master_salesm_key_date_time_logic_ckey` (`salesm_date_logic`,`salesm_time`),
  KEY `sales_master_salesm_key_branch_station_ckey` (`branch_no`,`station_no`,`salesm_slip_no`),
  KEY `sales_master_salesm_key_branch_date_logic_ckey` (`branch_no`,`station_no`,`salesm_date_logic`,`salesm_time`),
  KEY `sales_master_salesm_key_changed_ckey` (`salesm_changed_station`,`salesm_changed_version`),
  KEY `sales_master_salesm_ley_changed_version_ckey` (`salesm_changed_version`,`salesm_changed_station`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `sales_operations`
--

DROP TABLE IF EXISTS `sales_operations`;
CREATE TABLE IF NOT EXISTS `sales_operations` (
  `saleso_id` bigint NOT NULL AUTO_INCREMENT,
  `saleso_guid` varchar(32) DEFAULT NULL,
  `saleso_changed_date` datetime DEFAULT NULL,
  `saleso_changed_station` int UNSIGNED DEFAULT '0',
  `saleso_changed_version` int UNSIGNED DEFAULT '0',
  `saleso_state` int DEFAULT '0',
  `saleso_type` tinyint UNSIGNED DEFAULT '1',
  `saleso_no` bigint UNSIGNED DEFAULT '0',
  `branch_no` int UNSIGNED NOT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `saleso_date` date DEFAULT NULL,
  `saleso_time` time DEFAULT NULL,
  `saleso_date_logic` date DEFAULT NULL,
  `saleso_line_count` int DEFAULT '0',
  `cust_no` int UNSIGNED DEFAULT NULL,
  `saleso_company` varchar(50) DEFAULT NULL,
  `saleso_company_department` varchar(50) DEFAULT '',
  `sal_no` int DEFAULT '0',
  `tit_no` int DEFAULT '0',
  `saleso_first_name` varchar(40) DEFAULT NULL,
  `saleso_last_name` varchar(40) DEFAULT NULL,
  `saleso_street` varchar(50) DEFAULT NULL,
  `postc_no` varchar(8) DEFAULT NULL,
  `cust_city` varchar(30) DEFAULT NULL,
  `count_no` varchar(2) DEFAULT NULL,
  `saleso_quantity` double NOT NULL DEFAULT '0',
  `saleso_cancellation` tinyint DEFAULT '0',
  `saleso_subtotal` decimal(18,6) DEFAULT '0.000000',
  `saleso_discount_percent` double DEFAULT '0',
  `saleso_discount_amount` decimal(18,6) DEFAULT '0.000000',
  `saleso_total` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_drawer_open` tinyint DEFAULT '0',
  `saleso_destination_date` date DEFAULT NULL,
  `saleso_destination_time` time DEFAULT NULL,
  `saleso_type_no` bigint UNSIGNED NOT NULL DEFAULT '0',
  `saleso_table_no` decimal(18,6) NOT NULL DEFAULT '0.000000',
  `sup_no` int UNSIGNED DEFAULT '0',
  `saleso_source_cref_no` int UNSIGNED NOT NULL DEFAULT '0',
  `saleso_destination_cref_no` int UNSIGNED NOT NULL DEFAULT '0',
  `saleso_working_hours_type` int NOT NULL DEFAULT '0',
  `saleso_working_hours_adjustment` tinyint NOT NULL DEFAULT '0',
  `saleso_working_hours_automatic_insert` tinyint NOT NULL DEFAULT '0',
  `saleso_cash_given_history_1` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_2` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_3` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_4` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_5` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_6` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_7` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_8` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_9` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_given_history_10` decimal(18,6) DEFAULT '0.000000',
  `saleso_cash_change` decimal(18,6) DEFAULT '0.000000',
  `saleso_delivery_note_no` int UNSIGNED DEFAULT '0',
  `saleso_delivery_note_cust_no` int UNSIGNED DEFAULT '0',
  `saleso_delivery_note_date` date DEFAULT NULL,
  `saleso_erp_invoice_no` int UNSIGNED DEFAULT '0',
  `saleso_stock_goods_receipt_guid` varchar(32) DEFAULT NULL,
  `saleso_decimal_places` tinyint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`saleso_id`),
  KEY `sales_operations_saleso_guid_key` (`saleso_guid`),
  KEY `sales_operations_saleso_changed_date_ckey` (`saleso_changed_date`),
  KEY `sales_operations_saleso_changed_station_ckey` (`saleso_changed_station`),
  KEY `sales_operations_saleso_changed_version_ckey` (`saleso_changed_version`),
  KEY `sales_operations_saleso_state_ckey` (`saleso_state`),
  KEY `sales_operations_saleso_type_ckey` (`saleso_type`),
  KEY `sales_operations_saleso_no_ckey` (`saleso_no`),
  KEY `sales_operations_branch_no_ckey` (`branch_no`),
  KEY `sales_operations_station_no_ckey` (`station_no`),
  KEY `sales_operations_opera_no_ckey` (`opera_no`),
  KEY `sales_operations_saleso_date_ckey` (`saleso_date`),
  KEY `sales_operations_saleso_date_logic_ckey` (`saleso_date_logic`),
  KEY `sales_operations_cust_no_ckey` (`cust_no`),
  KEY `sales_operations_sal_no_ckey` (`sal_no`),
  KEY `sales_operations_tit_no_ckey` (`tit_no`),
  KEY `sales_operations_postc_no_ckey` (`postc_no`),
  KEY `sales_operations_cust_city_ckey` (`cust_city`),
  KEY `sales_operations_count_no_ckey` (`count_no`),
  KEY `sales_operations_saleso_destination_date_ckey` (`saleso_destination_date`),
  KEY `sales_operations_saleso_destination_time_ckey` (`saleso_destination_time`),
  KEY `sales_operations_saleso_type_no_ckey` (`saleso_type_no`),
  KEY `sales_operations_saleso_table_no_ckey` (`saleso_table_no`),
  KEY `sales_operations_sup_no_ckey` (`sup_no`),
  KEY `sales_operations_saleso_source_cref_no_ckey` (`saleso_source_cref_no`),
  KEY `sales_operations_saleso_destination_cref_no_ckey` (`saleso_destination_cref_no`),
  KEY `sales_operations_saleso_working_hours_type_ckey` (`saleso_working_hours_type`),
  KEY `sales_operations_saleso_working_hours_adjustment_ckey` (`saleso_working_hours_adjustment`),
  KEY `sales_operations_saleso_stock_goods_receipt_guid_ckey` (`saleso_stock_goods_receipt_guid`),
  KEY `sales_operations_saleso_key_key` (`station_no`,`saleso_no`),
  KEY `sales_operations_saleso_key_operator_ckey` (`station_no`,`opera_no`,`saleso_state`),
  KEY `sales_operations_saleso_key_type_no_ckey` (`station_no`,`saleso_type`,`saleso_type_no`),
  KEY `sales_operations_saleso_key_station_type_date_ckey` (`station_no`,`saleso_type`,`saleso_date`),
  KEY `sales_operations_saleso_key_table_ckey` (`branch_no`,`saleso_cancellation`,`saleso_state`,`saleso_table_no`),
  KEY `sales_operations_saleso_key_station_operator_ckey` (`branch_no`,`saleso_date`,`saleso_time`,`opera_no`,`saleso_type`),
  KEY `sales_operations_saleso_key_cross_reference_ckey` (`saleso_type`,`saleso_source_cref_no`,`saleso_destination_cref_no`),
  KEY `sales_operations_saleso_key_delivery_receipt_ckey` (`branch_no`,`saleso_date`,`saleso_type`,`saleso_delivery_note_cust_no`,`saleso_delivery_note_no`),
  KEY `sales_operations_saleso_key_date_time_ckey` (`saleso_date`,`saleso_time`),
  KEY `sales_operations_saleso_key_destination_date_time_ckey` (`saleso_destination_date`,`saleso_destination_time`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `sales_proposals`
--

DROP TABLE IF EXISTS `sales_proposals`;
CREATE TABLE IF NOT EXISTS `sales_proposals` (
  `salesp_id` bigint NOT NULL AUTO_INCREMENT,
  `cref_no` int UNSIGNED DEFAULT NULL,
  `salesp_weekday` tinyint UNSIGNED DEFAULT NULL,
  `routeg_no` int DEFAULT '0',
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `salesp_quantity` double DEFAULT '0',
  `salesp_discount_percent` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`salesp_id`),
  KEY `sales_proposals_cref_no_ckey` (`cref_no`),
  KEY `sales_proposals_salesp_weekday_ckey` (`salesp_weekday`),
  KEY `sales_proposals_routeg_no_ckey` (`routeg_no`),
  KEY `sales_proposals_prod_no_ckey` (`prod_no`),
  KEY `sales_proposals_salesp_key_ckey` (`cref_no`,`salesp_weekday`,`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `salutations`
--

DROP TABLE IF EXISTS `salutations`;
CREATE TABLE IF NOT EXISTS `salutations` (
  `sal_id` bigint NOT NULL AUTO_INCREMENT,
  `sal_no` int DEFAULT '0',
  `sal_description` varchar(60) DEFAULT '',
  PRIMARY KEY (`sal_id`),
  KEY `salutations_sal_no_key` (`sal_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `scales`
--

DROP TABLE IF EXISTS `scales`;
CREATE TABLE IF NOT EXISTS `scales` (
  `scale_id` bigint NOT NULL AUTO_INCREMENT,
  `scale_barcode` varchar(14) DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `scale_character_start` tinyint UNSIGNED DEFAULT '8',
  `scale_character_length` tinyint UNSIGNED DEFAULT '5',
  `scale_divisor` double DEFAULT '100',
  `scale_positive_sign` tinyint DEFAULT '1',
  `scale_price_or_quantity` tinyint UNSIGNED DEFAULT '1',
  PRIMARY KEY (`scale_id`),
  KEY `scales_scale_barcode_key` (`scale_barcode`),
  KEY `scales_prod_no_ckey` (`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `selection_details`
--

DROP TABLE IF EXISTS `selection_details`;
CREATE TABLE IF NOT EXISTS `selection_details` (
  `seld_id` bigint NOT NULL AUTO_INCREMENT,
  `selm_no` int UNSIGNED DEFAULT NULL,
  `seld_sort` int UNSIGNED DEFAULT NULL,
  `seld_object_no` bigint UNSIGNED DEFAULT NULL,
  `seld_flag` varchar(12) DEFAULT '',
  `seld_shop_id_exclude_surcharge` bigint DEFAULT NULL,
  `seld_shop_id_include_surcharge` bigint DEFAULT NULL,
  PRIMARY KEY (`seld_id`),
  KEY `selection_details_selm_no_ckey` (`selm_no`),
  KEY `selection_details_seld_sort_ckey` (`seld_sort`),
  KEY `selection_details_seld_object_no_ckey` (`seld_object_no`),
  KEY `selection_details_seld_shop_id_exclude_surcharge_ckey` (`seld_shop_id_exclude_surcharge`),
  KEY `selection_details_seld_shop_id_include_surcharge_ckey` (`seld_shop_id_include_surcharge`),
  KEY `selection_details_seld_key_ckey` (`selm_no`,`seld_sort`),
  KEY `selection_details_seld_object_no_key_key` (`selm_no`,`seld_object_no`)
) ENGINE=InnoDB AUTO_INCREMENT=385 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `selection_master`
--

DROP TABLE IF EXISTS `selection_master`;
CREATE TABLE IF NOT EXISTS `selection_master` (
  `selm_id` bigint NOT NULL AUTO_INCREMENT,
  `selm_no` int UNSIGNED DEFAULT NULL,
  `selm_description` varchar(50) DEFAULT NULL,
  `selm_composite_no_description` varchar(50) DEFAULT NULL,
  `selm_type` tinyint UNSIGNED DEFAULT NULL,
  `selm_shop_id_exclude_surcharge` bigint DEFAULT NULL,
  `selm_shop_id_include_surcharge` bigint DEFAULT '0',
  `selm_selection_sell` int DEFAULT '107',
  PRIMARY KEY (`selm_id`),
  KEY `selection_master_selm_no_key` (`selm_no`),
  KEY `selection_master_selm_composite_no_description_ckey` (`selm_composite_no_description`),
  KEY `selection_master_selm_type_ckey` (`selm_type`),
  KEY `selection_master_selm_selection_sell_ckey` (`selm_selection_sell`),
  KEY `selection_master_selm_key_ckey` (`selm_type`,`selm_selection_sell`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `sepa_bank_directory`
--

DROP TABLE IF EXISTS `sepa_bank_directory`;
CREATE TABLE IF NOT EXISTS `sepa_bank_directory` (
  `sepa_id` bigint NOT NULL AUTO_INCREMENT,
  `sepa_bank_code` varchar(8) DEFAULT NULL,
  `sepa_description` varchar(80) DEFAULT NULL,
  `sepa_bic` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`sepa_id`),
  KEY `sepa_bank_directory_sepa_bank_code_key` (`sepa_bank_code`),
  KEY `sepa_bank_directory_sepa_description_ckey` (`sepa_description`),
  KEY `sepa_bank_directory_sepa_bic_ckey` (`sepa_bic`)
) ENGINE=InnoDB AUTO_INCREMENT=897 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `shops`
--

DROP TABLE IF EXISTS `shops`;
CREATE TABLE IF NOT EXISTS `shops` (
  `shop_id` bigint DEFAULT '0',
  `shop_no` int DEFAULT NULL,
  `shop_description` varchar(64) DEFAULT NULL,
  KEY `shops_shop_id_ckey` (`shop_id`),
  KEY `shops_shop_no_key` (`shop_no`),
  KEY `shops_shop_description_ckey` (`shop_description`)
);

--
-- Tabellenstruktur für Tabelle `smart_card_devices`
--

DROP TABLE IF EXISTS `smart_card_devices`;
CREATE TABLE IF NOT EXISTS `smart_card_devices` (
  `smartcd_id` bigint NOT NULL AUTO_INCREMENT,
  `smartcd_hex` varchar(64) DEFAULT NULL,
  `smartcd_certificate` longtext,
  `smartcd_public_key` longtext,
  `smartcd_authority` longtext,
  `branch_no` int UNSIGNED NOT NULL,
  `station_no` int UNSIGNED NOT NULL,
  `smartcd_transferred` datetime DEFAULT NULL,
  `smartcd_tax_authorities_transferred` datetime DEFAULT NULL,
  PRIMARY KEY (`smartcd_id`),
  KEY `smart_card_devices_smartcd_hex_key` (`smartcd_hex`),
  KEY `smart_card_devices_branch_no_ckey` (`branch_no`),
  KEY `smart_card_devices_station_no_ckey` (`station_no`),
  KEY `smart_card_devices_smartcd_transferred_ckey` (`smartcd_transferred`),
  KEY `smart_card_devices_smartcd_key_ckey` (`station_no`,`smartcd_hex`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `special_offers`
--

DROP TABLE IF EXISTS `special_offers`;
CREATE TABLE IF NOT EXISTS `special_offers` (
  `spoff_id` bigint NOT NULL AUTO_INCREMENT,
  `spoff_date_from` varchar(12) DEFAULT NULL,
  `spoff_date_to` varchar(12) DEFAULT NULL,
  `spoff_price` decimal(18,6) DEFAULT '0.000000',
  `spoff_discount_percent` double DEFAULT '0',
  `spoff_discount_amount` varchar(50) DEFAULT NULL,
  `spoff_price_null_ok` tinyint DEFAULT '0',
  `spoff_discount_not_granted` tinyint DEFAULT '0',
  `spoff_reference_product_date` varchar(34) DEFAULT NULL,
  `cref_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `spoff_slip_text` longtext,
  `spoff_take_quantity` int UNSIGNED DEFAULT '0',
  `spoff_pay_quantity` int UNSIGNED DEFAULT '0',
  `spoff_everyday_itself` tinyint DEFAULT '0',
  `spoff_selection_type` tinyint UNSIGNED DEFAULT '1',
  `selm_no` int UNSIGNED DEFAULT NULL,
  `prodg_no` int DEFAULT NULL,
  `spoff_composite_ref_selection_date` varchar(28) DEFAULT NULL,
  `spoff_composite_ref_product_group_date` varchar(28) DEFAULT NULL,
  `spoff_type` tinyint UNSIGNED DEFAULT '1',
  `pricem_no` int UNSIGNED DEFAULT NULL,
  `spoff_weekday_1` tinyint DEFAULT '0',
  `spoff_weekday_2` tinyint DEFAULT '0',
  `spoff_weekday_3` tinyint DEFAULT '0',
  `spoff_weekday_4` tinyint DEFAULT '0',
  `spoff_weekday_5` tinyint DEFAULT '0',
  `spoff_weekday_6` tinyint DEFAULT '0',
  `spoff_weekday_7` tinyint DEFAULT '0',
  `spoff_weekday_8` tinyint DEFAULT '0',
  PRIMARY KEY (`spoff_id`),
  KEY `special_offers_spoff_date_from_ckey` (`spoff_date_from`),
  KEY `special_offers_spoff_date_to_ckey` (`spoff_date_to`),
  KEY `special_offers_spoff_reference_product_date_ckey` (`spoff_reference_product_date`),
  KEY `special_offers_cref_no_ckey` (`cref_no`),
  KEY `special_offers_prod_no_ckey` (`prod_no`),
  KEY `special_offers_selm_no_ckey` (`selm_no`),
  KEY `special_offers_prodg_no_ckey` (`prodg_no`),
  KEY `special_offers_spoff_composite_ref_selection_date_ckey` (`spoff_composite_ref_selection_date`),
  KEY `special_offers_spoff_composite_ref_product_group_date_ckey` (`spoff_composite_ref_product_group_date`),
  KEY `special_offers_pricem_no_ckey` (`pricem_no`),
  KEY `special_offers_spoff_key_product_no_ckey` (`cref_no`,`prod_no`,`spoff_date_from`,`spoff_date_to`),
  KEY `special_offers_spoff_key_selection_no_ckey` (`cref_no`,`selm_no`,`spoff_date_from`,`spoff_date_to`),
  KEY `special_offers_spoff_key_product_group_no_ckey` (`cref_no`,`prodg_no`,`spoff_date_from`,`spoff_date_to`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `staggered_prices`
--

DROP TABLE IF EXISTS `staggered_prices`;
CREATE TABLE IF NOT EXISTS `staggered_prices` (
  `stagp_id` bigint NOT NULL AUTO_INCREMENT,
  `pricem_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `stagp_from_quantity` decimal(18,6) DEFAULT NULL,
  `stagp_price` decimal(18,6) DEFAULT '0.000000',
  `stagp_discount_percent` double DEFAULT '0',
  PRIMARY KEY (`stagp_id`),
  KEY `staggered_prices_pricem_no_ckey` (`pricem_no`),
  KEY `staggered_prices_prod_no_ckey` (`prod_no`),
  KEY `staggered_prices_stagp_from_quantity_ckey` (`stagp_from_quantity`),
  KEY `staggered_prices_stagp_key_ckey` (`pricem_no`,`prod_no`,`stagp_from_quantity`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `stations`
--

DROP TABLE IF EXISTS `stations`;
CREATE TABLE IF NOT EXISTS `stations` (
  `station_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED DEFAULT NULL,
  `station_device_id` varchar(32) DEFAULT NULL,
  `branch_no` int UNSIGNED DEFAULT NULL,
  `station_composite_no_description` varchar(57) DEFAULT NULL,
  `station_description` varchar(50) DEFAULT NULL,
  `station_fiscal_authorities_description` varchar(9) DEFAULT '',
  `station_is_server` tinyint DEFAULT '0',
  `station_is_back_office` tinyint DEFAULT '0',
  `station_locked` tinyint DEFAULT '0',
  `station_mobile` tinyint DEFAULT '0',
  `station_warehouse_master` tinyint DEFAULT '0',
  `station_message_send_type` tinyint UNSIGNED DEFAULT '0',
  `station_messages_do_not_delete` tinyint DEFAULT '0',
  `station_email_address` varchar(128) DEFAULT NULL,
  `station_email_name` varchar(80) DEFAULT NULL,
  `station_pop_user_name` varchar(80) DEFAULT NULL,
  `station_pop_password` varchar(80) DEFAULT NULL,
  `station_pop_authentication` tinyint UNSIGNED DEFAULT '0',
  `station_pop_server` varchar(80) DEFAULT NULL,
  `station_pop_port` int UNSIGNED DEFAULT NULL,
  `station_pop_tls` tinyint UNSIGNED DEFAULT NULL,
  `station_smtp_user_name` varchar(80) DEFAULT NULL,
  `station_smtp_password` varchar(80) DEFAULT NULL,
  `station_smtp_authentication` tinyint UNSIGNED DEFAULT '0',
  `station_smtp_server` varchar(80) DEFAULT NULL,
  `station_smtp_port` int UNSIGNED DEFAULT NULL,
  `station_smtp_tls` tinyint UNSIGNED DEFAULT NULL,
  `station_fiscal_authorities_transferred` datetime DEFAULT NULL,
  `station_last_logon` datetime DEFAULT NULL,
  PRIMARY KEY (`station_id`),
  UNIQUE KEY `stations_station_no_key` (`station_no`),
  KEY `stations_station_device_id_ckey` (`station_device_id`),
  KEY `stations_branch_no_ckey` (`branch_no`),
  KEY `stations_station_composite_no_description_key` (`station_composite_no_description`),
  KEY `stations_station_is_server_ckey` (`station_is_server`),
  KEY `stations_station_is_back_office_ckey` (`station_is_back_office`),
  KEY `stations_station_mobile_ckey` (`station_mobile`),
  KEY `stations_station_email_address_ckey` (`station_email_address`),
  KEY `stations_station_master_key_ckey` (`branch_no`,`station_warehouse_master`),
  KEY `stations_station_key_ckey` (`branch_no`,`station_no`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `station_emails`
--

DROP TABLE IF EXISTS `station_emails`;
CREATE TABLE IF NOT EXISTS `station_emails` (
  `statione_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `statione_date` datetime DEFAULT NULL,
  `statione_email_sender` varchar(128) DEFAULT NULL,
  `statione_email_sender_name` varchar(50) DEFAULT NULL,
  `statione_email_receiver` varchar(128) DEFAULT NULL,
  `statione_email_receiver_name` varchar(50) DEFAULT NULL,
  `statione_read` tinyint DEFAULT '0',
  `statione_send` tinyint DEFAULT '0',
  `statione_subject` varchar(256) DEFAULT NULL,
  `statione_message` longtext,
  PRIMARY KEY (`statione_id`),
  KEY `station_emails_station_no_ckey` (`station_no`),
  KEY `station_emails_statione_date_ckey` (`statione_date`),
  KEY `station_emails_statione_email_sender_ckey` (`statione_email_sender`),
  KEY `station_emails_statione_email_sender_name_ckey` (`statione_email_sender_name`),
  KEY `station_emails_statione_email_receiver_ckey` (`statione_email_receiver`),
  KEY `station_emails_statione_email_receiver_name_ckey` (`statione_email_receiver_name`),
  KEY `station_emails_statione_read_ckey` (`statione_read`),
  KEY `station_emails_statione_key_ckey` (`station_no`,`statione_date`,`statione_email_sender`,`statione_email_receiver`),
  KEY `station_emails_statione_date_key_ckey` (`station_no`,`statione_email_sender`,`statione_email_receiver`,`statione_date`),
  KEY `station_emails_statione_read_key_ckey` (`station_no`,`statione_read`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `station_log`
--

DROP TABLE IF EXISTS `station_log`;
CREATE TABLE IF NOT EXISTS `station_log` (
  `statlog_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `statlog_date` date DEFAULT NULL,
  `statlog_time` time DEFAULT NULL,
  `salesd_line_no` int DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `statlog_log_type` tinyint UNSIGNED DEFAULT NULL,
  `statlog_amount` double DEFAULT '0',
  `salesm_guid` varchar(32) DEFAULT NULL,
  `statlog_ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`statlog_id`),
  KEY `station_log_station_no_ckey` (`station_no`),
  KEY `station_log_statlog_date_ckey` (`statlog_date`),
  KEY `station_log_statlog_time_ckey` (`statlog_time`),
  KEY `station_log_salesd_line_no_ckey` (`salesd_line_no`),
  KEY `station_log_opera_no_ckey` (`opera_no`),
  KEY `station_log_statlog_log_type_ckey` (`statlog_log_type`),
  KEY `station_log_salesm_guid_ckey` (`salesm_guid`)
) ENGINE=InnoDB AUTO_INCREMENT=1067 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `station_settings`
--

DROP TABLE IF EXISTS `station_settings`;
CREATE TABLE IF NOT EXISTS `station_settings` (
  `set_id` bigint NOT NULL AUTO_INCREMENT,
  `comset_no` int DEFAULT '0',
  `station_no` int UNSIGNED NOT NULL DEFAULT '0',
  `set_branch_name_prefix` varchar(4) DEFAULT '',
  `set_last_slip_no` bigint UNSIGNED DEFAULT '0',
  `set_last_invoice_no` bigint UNSIGNED DEFAULT '0',
  `set_invoice_city_text` varchar(24) DEFAULT '',
  `set_last_kitchen_order_no` bigint UNSIGNED DEFAULT '0',
  `set_last_sales_operation_no` bigint UNSIGNED DEFAULT '0',
  `set_last_cancellation_no` bigint UNSIGNED DEFAULT '0',
  `set_last_money_counting_list_no` bigint UNSIGNED DEFAULT '0',
  `set_last_product_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_product_group_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_hour_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_waiter_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_waiter_total_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_voucher_no` bigint UNSIGNED DEFAULT '0',
  `set_last_selled_products_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_product_operator_accounting_no` bigint UNSIGNED DEFAULT '0',
  `set_last_rksv_dep_no` bigint UNSIGNED DEFAULT '0',
  `set_email_order_no` int UNSIGNED DEFAULT '0',
  `set_sequence_slip_header_logo` tinyint UNSIGNED DEFAULT '1',
  `set_print_header_logo_from_printer` tinyint DEFAULT '0',
  `set_header_logo` longblob,
  `set_print_slip_text_header` tinyint DEFAULT '1',
  `set_sales_slip_header_1` varchar(62) DEFAULT '',
  `set_sales_slip_header_2` varchar(62) DEFAULT '',
  `set_sales_slip_header_3` varchar(62) DEFAULT '',
  `set_sales_slip_header_4` varchar(62) DEFAULT '',
  `set_sales_slip_header_5` varchar(62) DEFAULT '',
  `set_sales_slip_header_6` varchar(62) DEFAULT '',
  `set_sales_slip_header_7` varchar(62) DEFAULT '',
  `set_sales_slip_header_8` varchar(62) DEFAULT '',
  `set_sales_slip_header_9` varchar(62) DEFAULT '',
  `set_sales_slip_header_1_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_1_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_1_font_bold` tinyint DEFAULT '1',
  `set_sales_slip_header_1_font_wide` tinyint DEFAULT '1',
  `set_sales_slip_header_1_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_1_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_s_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_2_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_2_font_bold` tinyint DEFAULT '1',
  `set_sales_slip_header_2_font_wide` tinyint DEFAULT '1',
  `set_sales_slip_header_2_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_2_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_3_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_3_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_3_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_3_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_3_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_3_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_4_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_4_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_4_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_4_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_4_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_4_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_5_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_5_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_5_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_5_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_5_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_5_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_6_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_6_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_6_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_6_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_6_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_6_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_7_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_7_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_7_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_7_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_7_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_7_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_8_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_8_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_8_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_8_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_8_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_8_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_header_9_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_header_9_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_header_9_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_header_9_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_header_9_font_centerd` tinyint DEFAULT '1',
  `set_sales_slip_header_9_font_italic` tinyint DEFAULT '0',
  `set_gdi_title_font_name` varchar(50) DEFAULT 'Arial;12',
  `set_gdi_title_subtitle_font_name` varchar(50) DEFAULT 'Arial;12',
  `set_gdi_title_copyright_font_name` varchar(50) DEFAULT 'Arial;8',
  `set_gdi_body_lines_font_name` varchar(50) DEFAULT 'Arial;10',
  `set_gdi_body_columns_font_name` varchar(50) DEFAULT '10;57;22;11',
  `set_gdi_body_grid_header_font_name` varchar(50) DEFAULT 'Arial;10',
  `set_gdi_footer_header_font_name` varchar(50) DEFAULT 'Arial;10',
  `set_gdi_footer_total_font_name` varchar(50) DEFAULT 'Arial;12',
  `set_gdi_footer_vat_total_font_name` varchar(50) DEFAULT 'Arial;10',
  `set_gdi_footer_rksv_qr_font_name` double DEFAULT '30',
  `set_gdi_footer_atm_font_name` varchar(50) DEFAULT 'Courier New',
  `set_sequence_slip_footer_logo` tinyint UNSIGNED DEFAULT '1',
  `set_print_footer_logo_from_printer` tinyint DEFAULT '0',
  `set_footer_logo` longblob,
  `set_print_footer_logo` tinyint DEFAULT '1',
  `set_sales_slip_footer_1` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_2` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_3` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_4` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_5` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_6` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_7` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_8` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_9` varchar(62) DEFAULT NULL,
  `set_sales_slip_footer_1_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_footer_1_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_1_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_1_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_1_font_centered` tinyint DEFAULT '1',
  `set_sales_slip_footer_1_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_2_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_footer_2_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_2_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_2_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_2_font_centered` tinyint DEFAULT '1',
  `set_sales_slip_footer_2_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_3_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_footer_3_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_3_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_3_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_3_font_centered` tinyint DEFAULT '1',
  `set_sales_slip_footer_3_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_4_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_footer_4_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_4_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_4_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_4_font_centered` tinyint DEFAULT '1',
  `set_sales_slip_footer_4_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_5_font_no` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `set_sales_slip_footer_5_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_5_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_5_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_5_font_centered` tinyint DEFAULT '1',
  `set_sales_slip_footer_5_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_6_font_no` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `set_sales_slip_footer_6_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_6_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_6_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_6_font_centered` tinyint DEFAULT '0',
  `set_sales_slip_footer_6_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_7_font_no` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `set_sales_slip_footer_7_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_7_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_7_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_7_font_centered` tinyint DEFAULT '0',
  `set_sales_slip_footer_7_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_8_font_no` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `set_sales_slip_footer_8_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_8_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_8_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_8_font_centered` tinyint DEFAULT '0',
  `set_sales_slip_footer_8_font_italic` tinyint DEFAULT '0',
  `set_sales_slip_footer_9_font_no` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `set_sales_slip_footer_9_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_sales_slip_footer_9_font_bold` tinyint DEFAULT '0',
  `set_sales_slip_footer_9_font_wide` tinyint DEFAULT '0',
  `set_sales_slip_footer_9_font_centered` tinyint DEFAULT '0',
  `set_sales_slip_footer_9_font_italic` tinyint DEFAULT '0',
  `set_transponder_no` int DEFAULT NULL,
  `set_transponder_com` tinyint UNSIGNED DEFAULT '2',
  `set_transponder_com_settings` varchar(50) DEFAULT '9600,0,7,0',
  `set_transponder_with_keyboard` tinyint DEFAULT '1',
  `set_transponder_use` tinyint DEFAULT '0',
  `set_barcode_scanner_no` int DEFAULT NULL,
  `set_barcode_scanner_com` tinyint UNSIGNED DEFAULT '3',
  `set_barcode_scanner_com_settings` varchar(50) DEFAULT '9600,1,8,0',
  `set_barcode_scanner_use` tinyint DEFAULT '0',
  `set_pole_display_no` int DEFAULT NULL,
  `set_pole_display_com` tinyint UNSIGNED DEFAULT '4',
  `set_pole_display_com_settings` varchar(50) DEFAULT '9600,0,8,0',
  `set_pole_display_use` tinyint DEFAULT '0',
  `set_pole_display_text_1` varchar(100) DEFAULT '',
  `set_pole_display_text_2` varchar(100) DEFAULT '** Guten Tag ** ',
  `set_pole_display_text_speed_1` int UNSIGNED DEFAULT '60',
  `set_pole_display_text_speed_2` int UNSIGNED DEFAULT '60',
  `set_pole_display_text_direction_1` tinyint DEFAULT '1',
  `set_pole_display_text_direction_2` tinyint DEFAULT '0',
  `set_pole_display_type` tinyint UNSIGNED DEFAULT '2',
  `set_cash_drawer_no` int DEFAULT NULL,
  `set_cash_drawer_com` tinyint UNSIGNED DEFAULT '4',
  `set_cash_drawer_com_settings` varchar(50) DEFAULT '9600,0,8,0',
  `set_cash_drawer_use` tinyint DEFAULT '0',
  `set_second_screen_use` tinyint DEFAULT '0',
  `set_second_screen_type` tinyint UNSIGNED DEFAULT '1',
  `set_second_screen_speed` int UNSIGNED DEFAULT '0',
  `set_second_screen_random` tinyint DEFAULT '0',
  `set_second_screen_no` tinyint UNSIGNED DEFAULT '2',
  `set_second_screen_payment_delay` int UNSIGNED DEFAULT '30',
  `set_beverage_dispensing_system_no` int DEFAULT NULL,
  `set_beverage_dispensing_system_com` tinyint UNSIGNED DEFAULT '0',
  `set_beverage_dispensing_system_com_settings` varchar(50) DEFAULT '',
  `set_beverage_dispensing_system_foreign_nr_system` int UNSIGNED DEFAULT NULL,
  `set_beverage_dispensing_system_use_with_com` tinyint DEFAULT '0',
  `set_beverage_dispensing_system_use_with_list` tinyint DEFAULT '0',
  `set_scale_no` int DEFAULT NULL,
  `set_scale_com` tinyint UNSIGNED DEFAULT '0',
  `set_scale_com_settings` varchar(50) DEFAULT NULL,
  `set_scale_foreign_no_system` int UNSIGNED DEFAULT NULL,
  `set_scale_text` longtext,
  `set_scale_mark` varchar(4) DEFAULT NULL,
  `set_scale_use` tinyint DEFAULT '0',
  `set_atm_no` int DEFAULT '0',
  `set_atm_com` tinyint UNSIGNED DEFAULT '0',
  `set_atm_com_settings` varchar(50) DEFAULT NULL,
  `set_atm_use` tinyint DEFAULT '0',
  `set_atm_refund_prod_no` bigint UNSIGNED DEFAULT '0',
  `set_caller_identification_no` int DEFAULT '0',
  `set_caller_identification_com` int DEFAULT '0',
  `set_caller_identification_com_settings` varchar(50) DEFAULT NULL,
  `set_caller_identification_table_no_start` decimal(18,6) DEFAULT '100.000000',
  `set_caller_identification_use` tinyint DEFAULT '0',
  `set_pos_entry_mask_2_decimal_places` varchar(12) DEFAULT '10,2fS',
  `set_pos_entry_mask_3_decimal_places` varchar(12) DEFAULT '11,3fS',
  `set_pos_total_mask_2_decimal_places` varchar(12) DEFAULT '10,2fS',
  `set_pos_total_mask_3_decimal_places` varchar(50) DEFAULT '11,2fS',
  `set_slip_prod_no_width_in_characters` tinyint UNSIGNED DEFAULT '6',
  `set_slip_vat_width_in_characters` int UNSIGNED DEFAULT '1',
  `set_pos_quantity_entry_mask_on_screen` varchar(12) DEFAULT '11,3fS',
  `set_pos_price_entry_mask_on_screen` varchar(12) DEFAULT '11,3fS',
  `set_pos_display_cancelled_lines_bold` tinyint DEFAULT '0',
  `set_slip_prod_text_maximum_lines` tinyint UNSIGNED DEFAULT '2',
  `set_slip_prod_text_full_width` tinyint DEFAULT '0',
  `set_slip_type` tinyint UNSIGNED DEFAULT '1',
  `set_kitchen_order_type` tinyint UNSIGNED DEFAULT '1',
  `set_kitchen_order_title_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_kitchen_order_body_header_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;10;1',
  `set_kitchen_order_body_lines_font_name` varchar(50) DEFAULT 'Helvetica;10',
  `set_kitchen_order_body_column_width` varchar(50) DEFAULT '12;88',
  `set_kitchen_order_footer_total_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_kitchen_order_footer_font_name` varchar(50) DEFAULT 'Helvetica;8',
  `set_kitchen_order_print_info_instead_product_description` tinyint DEFAULT '0',
  `set_kitchen_order_product_description_maximum_lines` tinyint UNSIGNED DEFAULT '2',
  `set_kitchen_order_line_spacing` double DEFAULT '0',
  `set_payment_must_enter_before_total` tinyint DEFAULT '0',
  `set_cash_drawer_must_be_closed` tinyint DEFAULT '0',
  `set_hide_mouse_arrow` tinyint DEFAULT '1',
  `set_currency_sign` varchar(3) DEFAULT 'EUR',
  `set_single_line_cancellation` tinyint DEFAULT '0',
  `set_whole_slip_cancellation` tinyint DEFAULT '0',
  `set_print_cancellation_information_on_accounting` tinyint DEFAULT '1',
  `set_print_cancelled_products_on_slip` tinyint DEFAULT '0',
  `set_cancellation_only_one_piece` tinyint DEFAULT '0',
  `set_logon_twice_logoff` tinyint DEFAULT '1',
  `set_logon_automatic` tinyint DEFAULT '0',
  `set_logff_timer_minutes` int DEFAULT '10',
  `set_operator_stays_logon_each_after_total` tinyint DEFAULT '1',
  `set_operator_accounts_for_each_product` tinyint DEFAULT '0',
  `set_general_work_time_start` time DEFAULT '00:00:00',
  `set_general_work_time_hours` int DEFAULT '24',
  `set_start_with_product_group` int DEFAULT '0',
  `set_round_on_10_cent` tinyint DEFAULT '0',
  `set_no_cash_receipt_is_discountable` tinyint DEFAULT '0',
  `set_use_synchronisation` tinyint DEFAULT '0',
  `set_display_exit_screen` tinyint DEFAULT '1',
  `set_shutdown_computer_after_exit` tinyint DEFAULT '0',
  `set_lock_pos_if_cash_given_wrong` tinyint DEFAULT '0',
  `set_lock_pos_if_wrong_cash_given` tinyint DEFAULT '0',
  `set_use_money_count_list` tinyint UNSIGNED DEFAULT '1',
  `set_use_operator_money_count_list` tinyint UNSIGNED DEFAULT '0',
  `set_direct_debit_id` varchar(35) DEFAULT '',
  `set_call_server_on_new_customer_record` tinyint DEFAULT '1',
  `set_new_customer_record_use_price_list_no` int UNSIGNED DEFAULT '0',
  `set_new_customer_record_invoice_copies` tinyint UNSIGNED DEFAULT '2',
  `set_new_customer_record_customer_group` int UNSIGNED DEFAULT '0',
  `set_no_price_list_for_customers` tinyint DEFAULT '1',
  `set_cust_no_walk_in_customer` int UNSIGNED DEFAULT '0',
  `set_customer_address_font_no` tinyint UNSIGNED DEFAULT '1',
  `set_customer_address_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_customer_address_font_bold` tinyint DEFAULT '0',
  `set_customer_address_font_cetered` tinyint DEFAULT '1',
  `set_customer_address_font_wide` tinyint DEFAULT '0',
  `set_customer_telephone_font_no` tinyint UNSIGNED DEFAULT '1',
  `set_customer_telephone_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_customer_telephone_font_bold` tinyint DEFAULT '1',
  `set_customer_telephone_font_centered` tinyint DEFAULT '1',
  `set_customer_telephone_font_wide` tinyint DEFAULT '0',
  `set_customer_info_font_no` int DEFAULT '1',
  `set_customer_info_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_customer_info_font_bold` tinyint DEFAULT '0',
  `set_customer_info_font_centered` tinyint DEFAULT '1',
  `set_customer_info_font_wide` tinyint DEFAULT '0',
  `set_print_customer_address` tinyint DEFAULT '1',
  `set_print_customer_telephone` tinyint DEFAULT '0',
  `set_print_customer_info` tinyint DEFAULT '0',
  `set_new_customer_records_no_from` int UNSIGNED DEFAULT NULL,
  `set_new_customer_records_no_` int UNSIGNED DEFAULT NULL,
  `set_empty_lines_on_slip` longtext,
  `set_customer_barcode_prefix` varchar(12) DEFAULT 'L',
  `set_customer_barcode_prefix_before` tinyint DEFAULT '1',
  `set_quantity_on_slip_add` tinyint DEFAULT '1',
  `set_quantity_on_kitchen_order_add` tinyint DEFAULT '0',
  `set_quantity_on_screen_add` tinyint DEFAULT '0',
  `set_show_delivery_screen` tinyint UNSIGNED DEFAULT '0',
  `set_combo_meals_prod_no` bigint UNSIGNED DEFAULT '0',
  `set_image_pre_login_screen` longblob,
  `set_imput_100_equals_1_quantity` tinyint DEFAULT '0',
  `set_stock_assessment_percent` double DEFAULT '0',
  `set_standard_cash_for_money_change` decimal(18,6) DEFAULT '250.000000',
  `set_begin_of_the_year` date DEFAULT NULL,
  `set_display_protection_of_minors_warning` tinyint DEFAULT '1',
  `set_display_protection_of_minors_refused_products` tinyint DEFAULT '1',
  `set_print_quantity_greater_than_1_as_a_new_line` tinyint DEFAULT '1',
  `set_print_product_description_bold` tinyint DEFAULT '1',
  `set_print_text_for_interim_billing` varchar(300) DEFAULT '* Dieser Beleg dient nur der Vorabrechnung, bitte verlangen Sie eine Rechnung!',
  `set_minutes_before_table_got_yellow` int UNSIGNED DEFAULT '10',
  `set_shared_tables_are_listed_separately` tinyint DEFAULT '1',
  `set_customer_tables_are_listed_separately` tinyint DEFAULT '1',
  `set_pos_keyboard_keys_types` tinyint UNSIGNED DEFAULT '2',
  `set_reservate_each_slip_after_selecting` tinyint DEFAULT '0',
  `set_reservate_each_slip_with_table_no_after_selecting` tinyint DEFAULT '0',
  `set_update_type` tinyint UNSIGNED DEFAULT '1',
  `set_debug_mode` tinyint DEFAULT '0',
  `set_stock_debug_mode` tinyint DEFAULT '0',
  `set_accounting_debug_mode` tinyint DEFAULT '0',
  `set_print_accounting_only_main_product_groups` tinyint DEFAULT '0',
  `set_print_slip_copy_without_header` tinyint DEFAULT '0',
  `set_print_slip_copy_with_large_i_for_sharing` tinyint DEFAULT '1',
  `set_print_header_before_next_customer` tinyint DEFAULT '0',
  `set_print_each_product_line_live` tinyint DEFAULT '0',
  `set_keyboard_stock_enable` tinyint DEFAULT '0',
  `set_keyboard_stock_display` tinyint DEFAULT '0',
  `set_stock_enable` tinyint DEFAULT '0',
  `set_stock_display` tinyint DEFAULT '0',
  `set_stock_evaluation_type` tinyint UNSIGNED DEFAULT '0',
  `set_stock_evaluation_price_list_no` int UNSIGNED DEFAULT '0',
  `set_do_not_use_more_than_target_stock_level` tinyint DEFAULT '0',
  `set_show_stock_booking_info` tinyint DEFAULT '1',
  `stockl_no` int UNSIGNED DEFAULT '1',
  `set_default_stock_no_for_stock_transfers_from` int UNSIGNED DEFAULT '1',
  `set_default_stock_no_for_stock_transfers_to` int UNSIGNED DEFAULT '1',
  `set_display_stock_transfers_on_accounting` tinyint DEFAULT '0',
  `set_pos_dialog_page_for_product_characteristics` int UNSIGNED DEFAULT '103',
  `set_print_inventory_counting_with_target_stock_levels` tinyint NOT NULL DEFAULT '1',
  `set_fill_inventory_with_current_stock_level` tinyint DEFAULT '0',
  `set_print_inventory_counting_list` tinyint DEFAULT '1',
  `set_print_inventory_recording_list` tinyint DEFAULT '1',
  `set_book_returns_with_actual_stock_level` tinyint DEFAULT '1',
  `set_print_inventory_on_windows_printer` tinyint DEFAULT '0',
  `set_windows_printer_for_inventory` varchar(128) DEFAULT NULL,
  `count_no` varchar(2) DEFAULT NULL,
  `set_background_image_before_logon_width` int UNSIGNED DEFAULT '0',
  `set_background_image_before_logon_height` int UNSIGNED DEFAULT '0',
  `set_print_operator_on_accounting` tinyint DEFAULT '1',
  `set_final_accounting_for_operators_only_with_handed_over_report` tinyint DEFAULT '1',
  `set_work_time_direct_from_server` tinyint DEFAULT '0',
  `set_print_work_time_on_accounting` tinyint DEFAULT '0',
  `set_print_slip_on_each_work_time_logon_logoff` tinyint DEFAULT '0',
  `set_lock_table_minutes_before_reservation` int UNSIGNED DEFAULT '30',
  `set_color_table_minutes_before_reservation` int UNSIGNED DEFAULT '90',
  `set_reservation_enable_from_time` time DEFAULT '11:00:00',
  `set_reservation_enable_until_time` time DEFAULT '22:00:00',
  `set_combo_meals_switch_screen_no` int UNSIGNED DEFAULT '7',
  `set_voucher_connect_to_server` tinyint DEFAULT '0',
  `set_voucher_cancellation_with_new_voucher` tinyint DEFAULT '0',
  `set_voucher_titel_font_name` varchar(50) DEFAULT 'Helvetica-Oblique;12;1',
  `set_voucher_titel_font_no` tinyint UNSIGNED DEFAULT '0',
  `set_voucher_header_font_name` varchar(50) DEFAULT 'Helvetica;12',
  `set_voucher_header_font_bold` tinyint DEFAULT '0',
  `set_voucher_header_font_wide` tinyint DEFAULT '0',
  `set_voucher_header_font_centered` tinyint DEFAULT '0',
  `set_voucher_body_font_no` tinyint UNSIGNED DEFAULT '0',
  `set_voucher_body_font_name` varchar(50) DEFAULT 'Helvetica;12',
  `set_voucher_body_font_bold` tinyint DEFAULT '0',
  `set_voucher_body_font_wide` tinyint DEFAULT '0',
  `set_voucher_body_font_centered` tinyint DEFAULT '0',
  `set_voucher_footer_font_no` tinyint UNSIGNED DEFAULT '0',
  `set_voucher_footer_font_name` varchar(50) DEFAULT 'Helvetica;12',
  `set_voucher_footer_font_bold` tinyint DEFAULT '0',
  `set_voucher_footer_font_wide` tinyint DEFAULT '0',
  `set_voucher_footer_font_centered` tinyint DEFAULT '0',
  `set_voucher_no_for_canncellation_slip` int DEFAULT '0',
  `set_voucher_no_for_generate_vouchers_from_the_level_of_sales` int DEFAULT '0',
  `set_generate_vouchers_from_the_level_of_sales` tinyint DEFAULT '0',
  `set_use_server_for_voucher_gernerate` tinyint DEFAULT '1',
  `set_each_customer_can_only_pay_with_one_voucher` tinyint DEFAULT '0',
  `set_no_cash_payout_from_voucher` tinyint DEFAULT '0',
  `set_sort_slip_according_product_groups` tinyint DEFAULT '0',
  `set_print_slip_no_as_a_barcode_on_slip` tinyint DEFAULT '0',
  `set_bonus_points_divider` decimal(32,6) DEFAULT '3.000000',
  `set_bonus_points_voucher_divider` decimal(32,6) DEFAULT '10.000000',
  `set_bonus_points_accouning_from` decimal(32,6) DEFAULT '30.000000',
  `set_print_ongoing_bonus_points_on_slip` tinyint NOT NULL DEFAULT '0',
  `set_operator_can_change_price_and_quantity` tinyint DEFAULT '1',
  `set_operator_switch_on_change_price_and_quantity` tinyint DEFAULT '0',
  `set_display_wait_screen_after_total` tinyint DEFAULT '1',
  `set_company_gln_13_for_product_barcode_no_rearrange` varchar(13) DEFAULT '',
  `set_customer_prepaid_prod_no` bigint UNSIGNED DEFAULT '0',
  `set_print_unit_of_measure_additional_to_product_description` tinyint UNSIGNED DEFAULT '1',
  `set_print_confirmaton_after_adding_changing_a_product` tinyint DEFAULT '0',
  `set_print_allergens_on_slip` tinyint DEFAULT '0',
  `set_do_not_print_a_delivery_entrance_slip` tinyint DEFAULT '0',
  `set_unit_of_measure_width_on_slip` tinyint UNSIGNED DEFAULT '3',
  `set_warning_sound_type` tinyint UNSIGNED DEFAULT '1',
  `set_warning_sound_file_name` varchar(100) DEFAULT NULL,
  `set_product_sound_type` tinyint UNSIGNED DEFAULT '1',
  `set_product_sound_file_name` varchar(100) DEFAULT NULL,
  `set_reminder_sound_type` tinyint UNSIGNED DEFAULT '0',
  `set_reminder_sound_file_name` varchar(100) DEFAULT NULL,
  `set_email_sound_type` tinyint UNSIGNED DEFAULT '0',
  `set_email_sound_file_name` varchar(100) DEFAULT NULL,
  `set_operator_pos_key_color_highlight` tinyint DEFAULT '0',
  `set_print_monthly_accounting_with_customer_payments` tinyint DEFAULT '1',
  `set_print_daily_accounting_with_customer_payments` tinyint DEFAULT '1',
  `set_accept_sales_proposals` tinyint UNSIGNED DEFAULT '2',
  `set_recalculate_slip_with_customer_prices` tinyint DEFAULT '1',
  `set_dayparts_definition` varchar(200) DEFAULT 'Morgen;06:00;08:59,Vormittag;09:00;11:59,Mittag;12:00;13:59,Nachmittag;14:00;17:59,Abend;18:00;20:59,Nacht;21:00;05:59',
  `set_use_product_description_as_rtf_field` tinyint DEFAULT '1',
  `set_email_receipt_enable` tinyint DEFAULT '0',
  `set_email_receipt_interval` int DEFAULT '1500',
  `set_email_receipt_ignore_in_minutes` tinyint UNSIGNED DEFAULT '5',
  `set_customer_account_sign` varchar(10) DEFAULT NULL,
  `set_bluecode_use` tinyint DEFAULT '0',
  `set_bluecode_ping` varchar(70) DEFAULT 'https://merchant-api.bluecode.com/v4/ping',
  `set_bluecode_url` varchar(120) DEFAULT 'https://merchant-api.bluecode.com/v4',
  `set_bluecode_pay_endpoint` varchar(35) DEFAULT '/payment',
  `set_bluecode_listen_endpoint` varchar(35) DEFAULT '/status',
  `set_bluecode_register_endpoint` varchar(35) DEFAULT '/register',
  `set_bluecode_delete_endpoint` varchar(50) DEFAULT '/schemes/delete',
  `set_bluecode_code_endpoint` varchar(50) DEFAULT '/schemes/code',
  `set_bluecode_user_agent` varchar(120) DEFAULT 'Systemhaus_Predl_Touch_Extra_%1',
  `set_bluecode_merchant_id` varchar(50) DEFAULT '',
  `set_bluecode_merchant_security_key` varchar(40) DEFAULT '',
  `set_bluecode_branch_no` varchar(20) DEFAULT '',
  `set_bluecode_product_no` bigint UNSIGNED DEFAULT '0',
  `set_bluecode_barcode_lenght` int UNSIGNED DEFAULT '3',
  `set_bluecode_use_tip_in_pos` tinyint DEFAULT '0',
  `set_bluecode_timeout` int UNSIGNED DEFAULT '60',
  `set_list_all_products_wich_are_not_printed_on_kitchen_order` longtext,
  `set_enable_keyboard_entry_on_pos_screen` tinyint DEFAULT '0',
  `set_enable_keyboard_entry_on_pos_payment_entry` tinyint DEFAULT '0',
  `set_rksv_aes_256_key` varchar(50) DEFAULT NULL,
  `set_rksv_aes_256_checksum` varchar(4) DEFAULT NULL,
  `set_rksv_turnover_counter` bigint DEFAULT '0',
  `set_rksv_turnover_counter_aes_crypted` varchar(50) DEFAULT NULL,
  `set_rksv_turnover_last_slip_no` bigint UNSIGNED DEFAULT '0',
  `set_rksv_use` tinyint DEFAULT '0',
  `set_fiscal_authorities_smart_card_type` tinyint UNSIGNED DEFAULT '1',
  `set_fiscal_authorities_provider` tinyint UNSIGNED DEFAULT '1',
  `set_fiscal_authorities_smart_card_hex` varchar(12) DEFAULT NULL,
  `set_fiscal_authorities_smart_card_certificate` longtext,
  `set_fiscal_authorities_use` tinyint DEFAULT '0',
  `set_fiscal_authorities_member_id` varchar(50) DEFAULT NULL,
  `set_fiscal_authorities_user_id` varchar(50) DEFAULT NULL,
  `set_fiscal_authorities_pin` varchar(50) DEFAULT NULL,
  `set_fiscal_authorities_uuid` varchar(14) DEFAULT NULL,
  `set_fiscal_authorities_gln` varchar(13) DEFAULT NULL,
  `set_fiscal_authorities_tax_number` varchar(14) DEFAULT NULL,
  `set_fiscal_authorities_order_type` tinyint UNSIGNED DEFAULT '1',
  `set_fiscal_authorities_transmission_type` varchar(1) DEFAULT 'P',
  `set_fiscal_authorities_transmission_url` varchar(128) DEFAULT NULL,
  `set_automatic_accounting` tinyint DEFAULT '0',
  `set_automatic_accounting_time` time DEFAULT NULL,
  `set_merge_port_use` tinyint DEFAULT '0',
  `set_merge_port_directory` varchar(128) DEFAULT NULL,
  `set_merge_port_device_id` varchar(25) DEFAULT NULL,
  `set_merge_port_url` varchar(128) DEFAULT 'http://localhost:8080/',
  `set_merge_port_request_token_url` varchar(50) DEFAULT 'oauth/token',
  `set_merge_port_refresh_token_url` varchar(50) DEFAULT 'oauth/token',
  `set_merge_port_payment_create_url` varchar(50) DEFAULT 'api/payment/%1/transactions',
  `set_merge_port_payment_get_transaction_url` varchar(50) DEFAULT 'api/payment/%1/transactions',
  `set_merge_port_payment_get_all_transactions_url` varchar(50) DEFAULT 'api/payment/%1/transactions',
  `set_merge_port_payment_delete_url` varchar(50) DEFAULT 'api/payment/%1/transactions',
  `set_merge_port_terminal_user` varchar(80) DEFAULT 'admin',
  `set_merge_port_terminal_password` varchar(50) DEFAULT 'admin',
  `set_merge_port_user` varchar(80) DEFAULT 'admin',
  `set_merge_port_password` varchar(50) DEFAULT 'admin',
  `set_merge_port_payment_provider` varchar(50) DEFAULT 'SIX',
  `set_merge_port_payment_transaction_type` varchar(200) DEFAULT 'PURCHASE;CANCEL;REFUND;PRE_AUTH;COMPLETE;END_OF_DAY',
  `set_webshop_use` tinyint DEFAULT '0',
  `set_webshop_shop_no` int DEFAULT '1',
  `set_webshop_language_no` int DEFAULT '1',
  `set_webshop_ftl_url` varchar(160) DEFAULT NULL,
  `set_webshop_ftp_username` varchar(50) DEFAULT NULL,
  `set_webshop_ftp_password` varchar(50) DEFAULT NULL,
  `set_webshop_import_orders` tinyint DEFAULT '0',
  `set_webshop_upload_url` varchar(160) DEFAULT NULL,
  `set_webshop_download_url` varchar(160) DEFAULT NULL,
  `set_webshop_query_each_seconds` int UNSIGNED DEFAULT '10',
  `set_webshop_type` tinyint UNSIGNED DEFAULT '1',
  `set_webshop_start_table_no` decimal(18,6) DEFAULT '100.000000',
  `set_webshop_start_table_type` tinyint UNSIGNED DEFAULT '1',
  `set_webshop_new_customers_customer_group` int UNSIGNED DEFAULT '0',
  `set_webshop_order_master_endpoint` varchar(50) DEFAULT NULL,
  `set_webshop_order_details_endpoint` varchar(50) DEFAULT NULL,
  `set_operators_cannot_use_same_table_groups` tinyint DEFAULT '0',
  `set_operators_logon_ask_table_group` tinyint DEFAULT '0',
  `set_tables_same_as_on_mobile_phone` tinyint DEFAULT '0',
  `set_before_accounting_repair_database` tinyint DEFAULT '0',
  `set_before_accounting_send_data_to_server` tinyint DEFAULT '0',
  `set_before_accounting_check_data_on_server` tinyint DEFAULT '0',
  `set_print_product_group_accounting_with_customers` tinyint DEFAULT '0',
  `set_print_product_group_accounting_customer_sum` tinyint DEFAULT '0',
  `set_print_product_group_accounting_customer_no_total` tinyint DEFAULT '0',
  `set_bluecode_cancel_endpoint` varchar(35) DEFAULT '/cancel',
  `set_bluecode_refund_endpoint` varchar(35) DEFAULT '/refund',
  `set_bluecode_heartbeat_endpoint` varchar(35) DEFAULT '/heartbeat',
  `set_bluecode_transaction_callback` varchar(50) DEFAULT '/determined-by-merchant',
  `set_bluecode_loyalty_status` varchar(50) DEFAULT '/loyalty/status',
  `set_bluecode_loyalty_update` varchar(50) DEFAULT '/loyalty/update',
  `set_bluecode_rewards_redeem` varchar(50) DEFAULT '/rewards/redeem',
  `set_bluecode_authorizations` varchar(50) DEFAULT '/authorizations',
  `set_bluecode_charges` varchar(50) DEFAULT '/charges',
  `set_bluecode_alipay_product_no` bigint UNSIGNED DEFAULT '0',
  `set_bluecode_alipay_barcode_lenght` tinyint UNSIGNED DEFAULT '2',
  `set_bluecode_alipay_timeout` int UNSIGNED DEFAULT '60',
  `set_bluecode_time_zone` varchar(80) DEFAULT 'Europe/Vienna',
  `set_bluecode_use_loyality_program` tinyint DEFAULT '0',
  `set_operator_price_list_valid_for_all_operators` tinyint UNSIGNED DEFAULT '1',
  `set_operator_price_list_no` tinyint UNSIGNED DEFAULT '0',
  `set_operator_price_list_percent_selection` tinyint UNSIGNED DEFAULT '0',
  `set_back_plus_use_rksv_for_driver` tinyint DEFAULT '0',
  `set_back_plus_use_rksv_for_cash_payment_invoice` tinyint DEFAULT '0',
  `set_back_plus_signatur_station_no` int UNSIGNED DEFAULT '0',
  `set_back_plus_signatur_branch_no` int UNSIGNED DEFAULT '0',
  `set_back_plus_signatur_program_directory` varchar(128) DEFAULT NULL,
  `set_back_plus_signatur_data_directory` varchar(128) DEFAULT NULL,
  `set_back_plus_signatur_query_every_ms` int UNSIGNED DEFAULT '500',
  `set_back_plus_signatur_operator_no` int UNSIGNED DEFAULT '0',
  `set_back_plus_rksv_turnover_10` bigint UNSIGNED DEFAULT '0',
  `set_back_plus_rksv_turnover_20` bigint UNSIGNED DEFAULT '0',
  `set_back_plus_rksv_turnover_13` bigint UNSIGNED DEFAULT '0',
  `set_back_plus_rksv_turnover_19` bigint UNSIGNED DEFAULT '0',
  `set_back_plus_rksv_turnover_0` bigint UNSIGNED DEFAULT '0',
  `set_use_mobile_pos_webservice` tinyint DEFAULT '0',
  `set_mobile_pos_webservice_type` tinyint UNSIGNED DEFAULT '1',
  `set_mobile_pos_webservice_ip` varchar(128) DEFAULT NULL,
  `set_mobile_pos_webservice_username` varchar(40) DEFAULT NULL,
  `set_mobile_pos_webservice_password` varchar(20) DEFAULT NULL,
  `set_mobile_pos_webservice_use_encryption` tinyint DEFAULT '0',
  `set_use_error_email_reports` longtext,
  `set_bluecode_slip_name` longtext,
  `set_bluecode_slip_street` varchar(255) DEFAULT NULL,
  `set_bluecode_slip_zip_code` varchar(20) DEFAULT NULL,
  `set_bluecode_slip_city` varchar(128) DEFAULT NULL,
  `set_bluecode_slip_phone` varchar(50) DEFAULT NULL,
  `set_bluecode_slip_website` varchar(128) DEFAULT NULL,
  `set_bluecode_slip_uid` varchar(12) DEFAULT NULL,
  `set_bluecode_slip_notes` longtext,
  `set_external_stock_use` tinyint DEFAULT '0',
  `set_extermal_stock_url` varchar(128) DEFAULT NULL,
  `set_external_stock_user_name` varchar(50) DEFAULT NULL,
  `set_external_stock_password` varchar(50) DEFAULT NULL,
  `set_external_stock_query_endpoint` varchar(50) DEFAULT 'query.php',
  `set_external_stock_debit_endpoint` varchar(50) DEFAULT 'debit.php',
  `set_external_stock_set_endpoint` varchar(50) DEFAULT 'set.php',
  `set_external_stock_reservation_endpoint` varchar(50) DEFAULT 'reservation.php',
  `set_external_stock_set_null_endpoint` varchar(50) DEFAULT 'set_null.php',
  `set_external_stock_adjust_endpoint` varchar(50) DEFAULT 'adjust.php',
  `set_external_stock_reservation_delete_endpoint` varchar(50) DEFAULT 'reservation_delete.php',
  `set_wait_list_use` tinyint DEFAULT '0',
  `set_tse_use` tinyint DEFAULT '0',
  `set_tse_type` tinyint UNSIGNED DEFAULT '0',
  `set_tse_public_key` longtext,
  `set_tse_serial_no` varchar(64) DEFAULT NULL,
  `set_tse_certificate` longtext,
  `set_tse_started_date_time` datetime DEFAULT NULL,
  `set_tse_slip_counter` bigint DEFAULT '0',
  `set_tse_turnover_counter` bigint DEFAULT '0',
  `set_tse_drive_letter` varchar(1) DEFAULT NULL,
  `set_tse_seed` varchar(32) DEFAULT NULL,
  `set_tse_station_name` varchar(30) DEFAULT NULL,
  `set_tse_puk` varchar(6) DEFAULT NULL,
  `set_tse_admin_pin` varchar(5) DEFAULT NULL,
  `set_tse_time_admin_pin` varchar(5) DEFAULT NULL,
  `set_tse_salesm_guid` varchar(50) DEFAULT NULL,
  `set_back_plus_use_tse_for_driver` tinyint DEFAULT '0',
  `set_back_plus_use_tse_for_cash_payment_invoice` tinyint DEFAULT '0',
  `set_back_plus_tse_turnover_19` bigint DEFAULT '0',
  `set_back_plus_tse_turnover_7` bigint DEFAULT '0',
  `set_back_plus_tse_turnover_10_5` bigint DEFAULT '0',
  `set_back_plus_tse_turnover_5_5` bigint DEFAULT '0',
  `set_back_plus_tse_turnover_0` bigint DEFAULT '0',
  `set_import_external_database_use` tinyint DEFAULT '0',
  `set_import_external_database_url` varchar(128) DEFAULT NULL,
  `set_import_external_database_user_name` varchar(50) DEFAULT NULL,
  `set_import_external_database_password` varchar(50) DEFAULT NULL,
  `set_import_external_database_interval` int DEFAULT NULL,
  `set_import_external_database_stock_locations_endpoint` varchar(50) DEFAULT NULL,
  `set_import_external_database_product_groups_endpoint` varchar(50) DEFAULT NULL,
  `set_import_external_database_products_endpoint` varchar(50) DEFAULT NULL,
  `set_import_external_database_vat_endpoint` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`set_id`),
  KEY `station_settings_station_no_key` (`station_no`),
  KEY `station_settings_set_transponder_no_ckey` (`set_transponder_no`),
  KEY `station_settings_set_barcode_scanner_no_ckey` (`set_barcode_scanner_no`),
  KEY `station_settings_set_pole_display_no_ckey` (`set_pole_display_no`),
  KEY `station_settings_set_cash_drawer_no_ckey` (`set_cash_drawer_no`),
  KEY `station_settings_count_no_ckey` (`count_no`),
  KEY `station_settings_stockl_no_ckey` (`stockl_no`),
  KEY `station_settings_set_beverage_dispensing_system_no_ckey` (`set_beverage_dispensing_system_no`),
  KEY `station_settings_set_scale_no_ckey` (`set_scale_no`),
  KEY `station_settings_set_scale_foreign_no_system_ckey` (`set_scale_foreign_no_system`),
  KEY `station_settings_set_beverage_dispensing_system_foreign_nr_0001` (`set_beverage_dispensing_system_foreign_nr_system`),
  KEY `station_settings_comset_no_ckey` (`comset_no`)
);

--
-- Tabellenstruktur für Tabelle `stock_characteristics`
--

DROP TABLE IF EXISTS `stock_characteristics`;
CREATE TABLE IF NOT EXISTS `stock_characteristics` (
  `stockc_id` bigint NOT NULL AUTO_INCREMENT,
  `stockm_guid` varchar(32) DEFAULT NULL,
  `prodc_guid` varchar(32) DEFAULT NULL,
  `stockc_changed_date_time` datetime DEFAULT NULL,
  `stockc_stock_level` double DEFAULT '0',
  `stockc_minimum_order_quantity` double DEFAULT '0',
  `stockc_minimum_stock_level` double DEFAULT '0',
  `stockc_target_stock_level` double DEFAULT '0',
  `stockc_minimum_stock_value` decimal(18,6) DEFAULT '0.000000',
  `stockc_average_stock_value` decimal(18,6) DEFAULT '0.000000',
  `stockc_maximum_stock_value` decimal(18,6) DEFAULT '0.000000',
  `stockc_average_purchasing_price_net` decimal(18,6) DEFAULT '0.000000',
  `stockc_average_purchasing_price_gross` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`stockc_id`),
  KEY `stock_characteristics_stockm_guid_ckey` (`stockm_guid`),
  KEY `stock_characteristics_stockc_changed_date_time_ckey` (`stockc_changed_date_time`),
  KEY `stock_characteristics_stockc_key_ckey` (`stockm_guid`),
  KEY `stock_characteristics_prodc_guid_ckey` (`prodc_guid`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `stock_details`
--

DROP TABLE IF EXISTS `stock_details`;
CREATE TABLE IF NOT EXISTS `stock_details` (
  `stockd_id` bigint NOT NULL AUTO_INCREMENT,
  `prodc_guid` varchar(32) DEFAULT NULL,
  `salesm_guid` varchar(32) DEFAULT NULL,
  `stockd_guid` varchar(32) DEFAULT NULL,
  `stockm_guid` varchar(32) DEFAULT NULL,
  `stockd_source` int UNSIGNED DEFAULT NULL,
  `stockd_destination` int UNSIGNED DEFAULT NULL,
  `salesd_line_no` int DEFAULT '0',
  `opera_no` int UNSIGNED DEFAULT NULL,
  `stockd_date_time` datetime DEFAULT NULL,
  `stockd_date_time_logic` datetime DEFAULT NULL,
  `stockd_changed_date_time` datetime DEFAULT NULL,
  `stockd_type` tinyint UNSIGNED DEFAULT '0',
  `stockd_amount` double DEFAULT '0',
  `stockd_retail_price_gross` decimal(18,6) DEFAULT '0.000000',
  `stockd_retail_price_net` decimal(18,6) DEFAULT '0.000000',
  `stockd_purchasing_price_net` decimal(18,6) DEFAULT '0.000000',
  `stockd_description` varchar(50) DEFAULT NULL,
  `sup_no` int UNSIGNED DEFAULT NULL,
  `stockd_uploaded` tinyint DEFAULT '0',
  `stockd_uploaded_date_time` datetime DEFAULT NULL,
  PRIMARY KEY (`stockd_id`),
  KEY `stock_details_salesm_guid_ckey` (`salesm_guid`),
  KEY `stock_details_stockd_guid_ckey` (`stockd_guid`),
  KEY `stock_details_stockm_guid_ckey` (`stockm_guid`),
  KEY `stock_details_stockd_source_ckey` (`stockd_source`),
  KEY `stock_details_stockd_destination_ckey` (`stockd_destination`),
  KEY `stock_details_salesd_line_no_ckey` (`salesd_line_no`),
  KEY `stock_details_opera_no_ckey` (`opera_no`),
  KEY `stock_details_stockd_date_time_ckey` (`stockd_date_time`),
  KEY `stock_details_stockd_changed_date_time_ckey` (`stockd_changed_date_time`),
  KEY `stock_details_sup_no_ckey` (`sup_no`),
  KEY `stock_details_stockd_uploaded_ckey` (`stockd_uploaded`),
  KEY `stock_details_stockd_key_ckey` (`stockm_guid`,`stockd_guid`),
  KEY `stock_details_stockd_key_slip_ckey` (`salesm_guid`,`salesd_line_no`),
  KEY `stock_details_prodc_guid_ckey` (`prodc_guid`)
) ENGINE=InnoDB AUTO_INCREMENT=1259 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `stock_locations`
--

DROP TABLE IF EXISTS `stock_locations`;
CREATE TABLE IF NOT EXISTS `stock_locations` (
  `stockl_id` bigint NOT NULL AUTO_INCREMENT,
  `stockl_no` int UNSIGNED DEFAULT NULL,
  `stockl_description` varchar(50) DEFAULT NULL,
  `stockl_ref_no` int UNSIGNED DEFAULT NULL,
  `stockl_composite_no_description` varchar(57) DEFAULT NULL,
  PRIMARY KEY (`stockl_id`),
  KEY `stock_locations_stockl_no_key` (`stockl_no`),
  KEY `stock_locations_stockl_description_ckey` (`stockl_description`)
);

--
-- Tabellenstruktur für Tabelle `stock_log`
--

DROP TABLE IF EXISTS `stock_log`;
CREATE TABLE IF NOT EXISTS `stock_log` (
  `stocklog_id` bigint NOT NULL AUTO_INCREMENT,
  `stocklog_text` longtext,
  `stocklog_date_time` datetime DEFAULT NULL,
  `stocklog_source_function` varchar(128) DEFAULT NULL,
  `station_no` int UNSIGNED DEFAULT '0',
  `stocklog_changed_date` datetime DEFAULT NULL,
  `stocklog_changed_type` tinyint UNSIGNED DEFAULT '0',
  `stocklog_changed_operation` tinyint UNSIGNED DEFAULT '0',
  `stocklog_file` varchar(25) DEFAULT NULL,
  `stocklog_quantity_before` decimal(18,6) DEFAULT '0.000000',
  `stocklog_quantity_after` decimal(18,6) DEFAULT '0.000000',
  `stocklog_stock_master_guid` varchar(32) DEFAULT NULL,
  `stocklog_stock_details_guid` varchar(32) DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`stocklog_id`),
  KEY `stock_log_stocklog_date_time_ckey` (`stocklog_date_time`),
  KEY `stock_log_station_no_ckey` (`station_no`),
  KEY `stock_log_prod_no_ckey` (`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `stock_master`
--

DROP TABLE IF EXISTS `stock_master`;
CREATE TABLE IF NOT EXISTS `stock_master` (
  `stockm_id` bigint NOT NULL AUTO_INCREMENT,
  `stockm_guid` varchar(32) DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `stockl_no` int UNSIGNED DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `stockm_changed` datetime DEFAULT NULL,
  `stockm_stock` double DEFAULT '0',
  `stockm_reserved` double DEFAULT '0',
  `stockm_last_stock` double DEFAULT '0',
  `stockm_last_stock_date` datetime DEFAULT NULL,
  `stockm_minimum_order_quantity` double DEFAULT '0',
  `stockm_minimum_stock` double DEFAULT '0',
  `stockm_planned_stock_levelr` double DEFAULT '0',
  `stockm_minimum_stock_value` decimal(18,6) DEFAULT '0.000000',
  `stockm_average_stock_value` decimal(18,6) DEFAULT '0.000000',
  `stockm_maximum_stock_value` decimal(18,6) DEFAULT '0.000000',
  `stockm_average_stock_value_net` decimal(18,6) DEFAULT '0.000000',
  `stockm_average_stock_value_gross` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`stockm_id`),
  UNIQUE KEY `stock_master_stockm_guid_key` (`stockm_guid`),
  UNIQUE KEY `stock_master_stockm_key_key` (`branch_no`,`stockl_no`,`prod_no`),
  KEY `stock_master_branch_no_ckey` (`branch_no`),
  KEY `stock_master_stockl_no_ckey` (`stockl_no`),
  KEY `stock_master_prod_no_ckey` (`prod_no`),
  KEY `stock_master_stockm_changed_ckey` (`stockm_changed`)
) ENGINE=InnoDB AUTO_INCREMENT=1165 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `stock_states`
--

DROP TABLE IF EXISTS `stock_states`;
CREATE TABLE IF NOT EXISTS `stock_states` (
  `stocks_id` bigint NOT NULL AUTO_INCREMENT,
  `stocks_no` int DEFAULT NULL,
  `shop_no` int DEFAULT NULL,
  `stocks_description` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`stocks_id`),
  KEY `stock_states_shop_no_ckey` (`shop_no`),
  KEY `stock_states_stocks_no_key` (`stocks_no`)
);

--
-- Tabellenstruktur für Tabelle `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE IF NOT EXISTS `suppliers` (
  `sup_id` bigint NOT NULL AUTO_INCREMENT,
  `sup_no` int UNSIGNED DEFAULT NULL,
  `sup_ref_no` int UNSIGNED DEFAULT NULL,
  `sup_composite_no_description` varchar(50) DEFAULT NULL,
  `sup_match_code` varchar(40) DEFAULT NULL,
  `sup_company` varchar(40) DEFAULT NULL,
  `sup_company_department` varchar(50) DEFAULT '',
  `sal_no` int DEFAULT '0',
  `tit_no` int DEFAULT '0',
  `sup_first_name` varchar(40) DEFAULT NULL,
  `sup_last_name` varchar(40) DEFAULT NULL,
  `sup_street` varchar(40) DEFAULT NULL,
  `sup_zip` varchar(8) DEFAULT NULL,
  `sup_city` varchar(30) DEFAULT NULL,
  `count_no` varchar(50) DEFAULT '',
  `sup_phone` varchar(50) DEFAULT NULL,
  `sup_fax` varchar(50) DEFAULT NULL,
  `sup_email` varchar(60) DEFAULT NULL,
  `sup_skype` varchar(100) DEFAULT NULL,
  `sup_suspend` tinyint DEFAULT '0',
  `sup_date_created` date DEFAULT NULL,
  `sup_date_last_delivery` datetime DEFAULT NULL,
  `sup_annual_sales` decimal(18,6) DEFAULT NULL,
  `sup_total_revenue` decimal(18,6) DEFAULT NULL,
  `sup_contact_person` varchar(50) DEFAULT NULL,
  `sup_uid` varchar(20) DEFAULT NULL,
  `sup_bankname` varchar(60) DEFAULT NULL,
  `sup_bank_code` varchar(10) DEFAULT NULL,
  `sup_account_number` varchar(50) DEFAULT NULL,
  `sup_iban` varchar(25) DEFAULT NULL,
  `sup_bic_swift` varchar(12) DEFAULT NULL,
  PRIMARY KEY (`sup_id`),
  KEY `suppliers_sup_no_key` (`sup_no`),
  KEY `suppliers_sup_ref_no_key` (`sup_ref_no`),
  KEY `suppliers_sup_composite_no_description_key` (`sup_composite_no_description`),
  KEY `suppliers_sup_match_code_ckey` (`sup_match_code`),
  KEY `suppliers_sal_no_ckey` (`sal_no`),
  KEY `suppliers_tit_no_ckey` (`tit_no`),
  KEY `suppliers_sup_zip_ckey` (`sup_zip`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `synchronizations`
--

DROP TABLE IF EXISTS `synchronizations`;
CREATE TABLE IF NOT EXISTS `synchronizations` (
  `sync_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `station_no_destination` int UNSIGNED DEFAULT NULL,
  `sync_enabled` tinyint DEFAULT '0',
  `sync_use_transfer_list` tinyint DEFAULT '0',
  `sync_receive_interval` int UNSIGNED DEFAULT '0',
  `sync_receive_send` int UNSIGNED DEFAULT '0',
  `sync_database` varchar(50) DEFAULT NULL,
  `sync_ip_address` varchar(50) DEFAULT NULL,
  `sync_provider` tinyint UNSIGNED DEFAULT '2',
  `sync_username` varchar(50) DEFAULT NULL,
  `sync_password` varchar(50) DEFAULT NULL,
  `extended_options` varchar(50) DEFAULT NULL,
  `sync_cursor_options` varchar(50) DEFAULT NULL,
  `sync_crypt_method` tinyint UNSIGNED DEFAULT '0',
  `sync_compression` tinyint DEFAULT '0',
  `sync_cache` int UNSIGNED DEFAULT '0',
  `sync_composite_no_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`sync_id`),
  KEY `synchronizations_station_no_ckey` (`station_no`),
  KEY `synchronizations_station_no_destination_ckey` (`station_no_destination`),
  KEY `synchronizations_sync_key_key` (`station_no`,`station_no_destination`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `synchronization_transfer_lists`
--

DROP TABLE IF EXISTS `synchronization_transfer_lists`;
CREATE TABLE IF NOT EXISTS `synchronization_transfer_lists` (
  `trans_id` bigint NOT NULL AUTO_INCREMENT,
  `trans_line_no` int UNSIGNED DEFAULT NULL,
  `sync_id` bigint DEFAULT NULL,
  `trans_send_type` tinyint UNSIGNED DEFAULT NULL,
  `trans_from_date` date DEFAULT NULL,
  `trans_to_date` time DEFAULT NULL,
  `trans_shut_down` tinyint DEFAULT '0',
  `trans_weekday_1` tinyint DEFAULT '1',
  `trans_weekday_2` tinyint DEFAULT '1',
  `trans_weekday_3` tinyint DEFAULT '1',
  `trans_weekday_4` tinyint DEFAULT '1',
  `trans_weekday_5` tinyint DEFAULT '1',
  `trans_weekday_6` tinyint DEFAULT '1',
  `trans_weekday_7` tinyint DEFAULT '1',
  PRIMARY KEY (`trans_id`),
  KEY `synchronization_transfer_lists_trans_line_no_ckey` (`trans_line_no`),
  KEY `synchronization_transfer_lists_sync_id_ckey` (`sync_id`),
  KEY `synchronization_transfer_lists_trans_key_key` (`sync_id`,`trans_line_no`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tables`
--

DROP TABLE IF EXISTS `tables`;
CREATE TABLE IF NOT EXISTS `tables` (
  `table_id` bigint NOT NULL AUTO_INCREMENT,
  `table_no` int UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `dareas_no` int UNSIGNED DEFAULT NULL,
  `tableg_no` int DEFAULT NULL,
  `table_sort` varchar(8) DEFAULT NULL,
  `table_ref_no` int UNSIGNED DEFAULT NULL,
  `table_composite_no_description` varchar(59) DEFAULT NULL,
  `table_description` varchar(50) DEFAULT NULL,
  `table_number_seats` int DEFAULT NULL,
  `table_pos_x` int DEFAULT '0',
  `table_pos_y` int DEFAULT '0',
  `table_width` int DEFAULT '0',
  `table_height` int DEFAULT '0',
  `table_image_normal` longblob,
  `table_image_occupied` longblob,
  `table_image_waiting` longblob,
  `table_image_reserved` longblob,
  `table_image_reserved_occupied` longblob,
  `table_image_reserved_waiting` longblob,
  `table_calendar_icon` longblob,
  `table_image_normal_file_name` varchar(255) DEFAULT NULL,
  `table_image_occupied_file_name` varchar(255) DEFAULT NULL,
  `table_image_waiting_file_name` varchar(255) DEFAULT NULL,
  `table_image_reserved_file_name` varchar(255) DEFAULT NULL,
  `table_image_reserved_occupied_file_name` varchar(255) DEFAULT NULL,
  `table_image_reserved_waiting_file_name` varchar(255) DEFAULT NULL,
  `table_calendar_icon_file_name` varchar(255) DEFAULT NULL,
  `table_color` int UNSIGNED DEFAULT '0',
  `table_font_color` int UNSIGNED DEFAULT '0',
  `table_font_name` varchar(50) DEFAULT NULL,
  `table_font_size` double DEFAULT '10',
  `table_font_bold` tinyint DEFAULT '0',
  `table_font_italic` tinyint DEFAULT '0',
  `table_font_underlined` tinyint DEFAULT '0',
  `table_fixed_operator` varchar(80) DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT '0',
  `cust_no` int UNSIGNED DEFAULT '0',
  `table_no_display_on_this_station` varchar(80) DEFAULT NULL,
  `table_calendar_width` int UNSIGNED DEFAULT '100',
  `table_no_display_on_calendar` tinyint DEFAULT '0',
  PRIMARY KEY (`table_id`),
  KEY `tables_table_no_key` (`table_no`),
  KEY `tables_branch_no_ckey` (`branch_no`),
  KEY `tables_dareas_no_ckey` (`dareas_no`),
  KEY `tables_tableg_no_ckey` (`tableg_no`),
  KEY `tables_table_ref_no_key` (`table_ref_no`),
  KEY `tables_table_composite_no_description_key` (`table_composite_no_description`),
  KEY `tables_table_number_seats_ckey` (`table_number_seats`),
  KEY `tables_opera_no_ckey` (`opera_no`),
  KEY `tables_cust_no_ckey` (`cust_no`),
  KEY `tables_table_key_key` (`branch_no`,`dareas_no`,`table_no`),
  KEY `tables_table_key_branch_ckey` (`branch_no`,`table_no`),
  KEY `tables_table_key_sort_ckey` (`branch_no`,`table_sort`),
  KEY `tables_table_key_table_groups_ckey` (`branch_no`,`tableg_no`,`table_no`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `table_groups`
--

DROP TABLE IF EXISTS `table_groups`;
CREATE TABLE IF NOT EXISTS `table_groups` (
  `tableg_id` bigint NOT NULL AUTO_INCREMENT,
  `tableg_no` int DEFAULT NULL,
  `tableg_type` tinyint UNSIGNED DEFAULT NULL,
  `tableg_description` varchar(50) DEFAULT NULL,
  `tableg_key` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`tableg_id`),
  KEY `table_groups_tableg_no_key` (`tableg_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `titles`
--

DROP TABLE IF EXISTS `titles`;
CREATE TABLE IF NOT EXISTS `titles` (
  `tit_id` bigint NOT NULL AUTO_INCREMENT,
  `tit_no` int DEFAULT '0',
  `tit_description` varchar(50) DEFAULT '',
  PRIMARY KEY (`tit_id`),
  KEY `titles_tit_no_key` (`tit_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tse_dep`
--

DROP TABLE IF EXISTS `tse_dep`;
CREATE TABLE IF NOT EXISTS `tse_dep` (
  `tsed_id` bigint NOT NULL AUTO_INCREMENT,
  `tsed_no` bigint DEFAULT '0',
  `branch_no` int UNSIGNED DEFAULT '0',
  `station_no` int UNSIGNED DEFAULT '0',
  `salesm_guid` varchar(32) DEFAULT '',
  `salesm_slip_no` bigint UNSIGNED DEFAULT '0',
  `salesm_date` date DEFAULT NULL,
  `salesm_time` time DEFAULT NULL,
  `tsed_type` tinyint UNSIGNED DEFAULT '0',
  `tsed_turnover_total` decimal(18,6) DEFAULT '0.000000',
  `tsed_serial_no` varchar(64) DEFAULT '',
  `tsed_signature` longtext,
  `tsed_signature_counter` varchar(50) DEFAULT '',
  `tsed_transaction_no` bigint UNSIGNED DEFAULT '0',
  `tsed_turnover_1` decimal(18,6) DEFAULT '0.000000',
  `tsed_turnover_2` decimal(18,6) DEFAULT '0.000000',
  `tsed_turnover_3` decimal(18,6) DEFAULT '0.000000',
  `tsed_turnover_4` decimal(18,6) DEFAULT '0.000000',
  `tsed_turnover_5` decimal(18,6) DEFAULT '0.000000',
  PRIMARY KEY (`tsed_id`),
  KEY `tse_dep_tsed_no_ckey` (`tsed_no`),
  KEY `tse_dep_branch_no_ckey` (`branch_no`),
  KEY `tse_dep_station_no_ckey` (`station_no`),
  KEY `tse_dep_salesm_guid_ckey` (`salesm_guid`),
  KEY `tse_dep_salesm_slip_no_ckey` (`salesm_slip_no`),
  KEY `tse_dep_salesm_date_ckey` (`salesm_date`),
  KEY `tse_dep_salesm_time_ckey` (`salesm_time`),
  KEY `tse_dep_tsed_type_ckey` (`tsed_type`),
  KEY `tse_dep_tsed_key_ckey` (`station_no`,`tsed_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `unit_of_measure`
--

DROP TABLE IF EXISTS `unit_of_measure`;
CREATE TABLE IF NOT EXISTS `unit_of_measure` (
  `unit_id` bigint NOT NULL AUTO_INCREMENT,
  `unit_no` int UNSIGNED DEFAULT NULL,
  `unit_description` varchar(35) DEFAULT NULL,
  `unit_description_slip` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`unit_id`),
  KEY `unit_of_measure_unit_no_key` (`unit_no`),
  KEY `unit_of_measure_unit_description_ckey` (`unit_description`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;


--
-- Tabellenstruktur für Tabelle `vat`
--

DROP TABLE IF EXISTS `vat`;
CREATE TABLE IF NOT EXISTS `vat` (
  `vat_id` bigint NOT NULL AUTO_INCREMENT,
  `vat_no` tinyint UNSIGNED DEFAULT NULL,
  `vat_composite_no_description` varchar(50) DEFAULT NULL,
  `shop_id` bigint DEFAULT NULL,
  `vat_description` varchar(50) DEFAULT NULL,
  `vat_percent` decimal(18,6) DEFAULT '0.000000',
  `vat_description_slip` varchar(8) DEFAULT NULL,
  `vat_no_accounting` int UNSIGNED DEFAULT '0',
  `vat_rksv_type` tinyint UNSIGNED DEFAULT '0',
  `vat_tse_type` tinyint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`vat_id`),
  KEY `vat_vat_no_key` (`vat_no`),
  KEY `vat_vat_composite_no_description_ckey` (`vat_composite_no_description`),
  KEY `vat_shop_id_ckey` (`shop_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `versions`
--

DROP TABLE IF EXISTS `versions`;
CREATE TABLE IF NOT EXISTS `versions` (
  `ver_id` bigint NOT NULL AUTO_INCREMENT,
  `ver_guid` varchar(32) DEFAULT NULL,
  `ver_analyse_version` int UNSIGNED DEFAULT NULL,
  `ver_programm_version` varchar(14) DEFAULT NULL,
  `ver_update_url` varchar(128) DEFAULT NULL,
  `ver_last_update_date` date DEFAULT NULL,
  PRIMARY KEY (`ver_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `voucher_details`
--

DROP TABLE IF EXISTS `voucher_details`;
CREATE TABLE IF NOT EXISTS `voucher_details` (
  `vouchd_id` bigint NOT NULL AUTO_INCREMENT,
  `vouchd_no` int UNSIGNED DEFAULT NULL,
  `vouchm_no` int UNSIGNED DEFAULT NULL,
  `branch_no` int UNSIGNED NOT NULL,
  `prod_no` bigint UNSIGNED DEFAULT NULL,
  `vouchd_description` varchar(50) DEFAULT NULL,
  `vouchd_reserved` tinyint DEFAULT '0',
  `vouchd_changed_date` datetime DEFAULT NULL,
  `vouchd_ean` varchar(80) DEFAULT NULL,
  `vouchd_created_on` date DEFAULT NULL,
  `vouchd_selled` tinyint DEFAULT '0',
  `vouchd_selled_on` datetime DEFAULT NULL,
  `vouchd_selled_from` int UNSIGNED DEFAULT '0',
  `vouchd_redeemed` tinyint DEFAULT '0',
  `vouchd_redeemed_on` datetime DEFAULT NULL,
  `vouchd_redeemed_from` int UNSIGNED DEFAULT '0',
  `vouchd_value` decimal(18,6) DEFAULT '0.000000',
  `vouchd_up_to_purchase_value` decimal(18,6) DEFAULT '0.000000',
  `vouchd_printed` tinyint DEFAULT '0',
  `vouchd_from_date` date DEFAULT NULL,
  `vouchd_to_date` date DEFAULT NULL,
  `vouchd_type` tinyint UNSIGNED DEFAULT '0',
  `vouchd_seller_slip_guid` varchar(32) DEFAULT NULL,
  `vouchd_redeemed_slip_guid` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`vouchd_id`),
  KEY `voucher_details_vouchd_no_ckey` (`vouchd_no`),
  KEY `voucher_details_vouchm_no_ckey` (`vouchm_no`),
  KEY `voucher_details_branch_no_ckey` (`branch_no`),
  KEY `voucher_details_prod_no_ckey` (`prod_no`),
  KEY `voucher_details_vouchd_description_ckey` (`vouchd_description`),
  KEY `voucher_details_vouchd_reserved_ckey` (`vouchd_reserved`),
  KEY `voucher_details_vouchd_changed_date_ckey` (`vouchd_changed_date`),
  KEY `voucher_details_vouchd_ean_key` (`vouchd_ean`),
  KEY `voucher_details_vouchd_created_on_ckey` (`vouchd_created_on`),
  KEY `voucher_details_vouchd_selled_ckey` (`vouchd_selled`),
  KEY `voucher_details_vouchd_selled_on_ckey` (`vouchd_selled_on`),
  KEY `voucher_details_vouchd_redeemed_ckey` (`vouchd_redeemed`),
  KEY `voucher_details_vouchd_redeemed_on_ckey` (`vouchd_redeemed_on`),
  KEY `voucher_details_vouchd_printed_ckey` (`vouchd_printed`),
  KEY `voucher_details_vouchd_key_key` (`vouchm_no`,`vouchd_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `voucher_generations`
--

DROP TABLE IF EXISTS `voucher_generations`;
CREATE TABLE IF NOT EXISTS `voucher_generations` (
  `vouchg_id` bigint NOT NULL AUTO_INCREMENT,
  `vouchm_no` int UNSIGNED DEFAULT NULL,
  `vouchg_line` int UNSIGNED DEFAULT '0',
  `vouchg_from_value` decimal(18,6) DEFAULT '0.000000',
  `vouchg_value` decimal(18,6) DEFAULT '0.000000',
  `vouchg_changed_date` datetime DEFAULT NULL,
  PRIMARY KEY (`vouchg_id`),
  KEY `voucher_generations_vouchm_no_ckey` (`vouchm_no`),
  KEY `voucher_generations_vouchg_line_ckey` (`vouchg_line`),
  KEY `voucher_generations_vouchg_from_value_ckey` (`vouchg_from_value`),
  KEY `voucher_generations_vouchg_value_ckey` (`vouchg_value`),
  KEY `voucher_generations_vouchg_changed_date_ckey` (`vouchg_changed_date`),
  KEY `voucher_generations_vouchg_key_ckey` (`vouchm_no`,`vouchg_line`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `voucher_master`
--

DROP TABLE IF EXISTS `voucher_master`;
CREATE TABLE IF NOT EXISTS `voucher_master` (
  `vouchm_id` bigint NOT NULL AUTO_INCREMENT,
  `vouchm_no` int UNSIGNED DEFAULT NULL,
  `vouchm_changed_date` datetime DEFAULT NULL,
  `vouchm_description` varchar(60) DEFAULT NULL,
  `prod_no` bigint UNSIGNED DEFAULT '0',
  `vouchm_own_voucher` tinyint DEFAULT '0',
  `vouchm_default_value` longtext,
  `vouchm_different_value_allowed` tinyint NOT NULL DEFAULT '0',
  `vouchm_ean_type` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `vouchm_ean_prefix` varchar(50) DEFAULT NULL,
  `vouchm_date_of_expiry_in_month` int UNSIGNED DEFAULT '12',
  `vouchm_header` longtext,
  `vouchm_center` longtext,
  `vouchm_bottom` longtext,
  `vouchm_type` tinyint UNSIGNED DEFAULT '0',
  PRIMARY KEY (`vouchm_id`),
  KEY `voucher_master_vouchm_no_key` (`vouchm_no`),
  KEY `voucher_master_vouchm_changed_date_ckey` (`vouchm_changed_date`),
  KEY `voucher_master_vouchm_description_ckey` (`vouchm_description`),
  KEY `voucher_master_prod_no_ckey` (`prod_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `wait_list`
--

DROP TABLE IF EXISTS `wait_list`;
CREATE TABLE IF NOT EXISTS `wait_list` (
  `waitl_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_no` int UNSIGNED NOT NULL DEFAULT '0',
  `salesm_guid` varchar(32) DEFAULT NULL,
  `waitl_date_time` datetime DEFAULT NULL,
  `waitl_last_no` tinyint UNSIGNED DEFAULT '0',
  `waitl_state` tinyint UNSIGNED DEFAULT '1',
  `waitl_kitchen_date_time` datetime DEFAULT NULL,
  PRIMARY KEY (`waitl_id`),
  KEY `wait_list_branch_no_ckey` (`branch_no`),
  KEY `wait_list_salesm_guid_ckey` (`salesm_guid`),
  KEY `wait_list_waitl_kitchen_date_time_ckey` (`waitl_kitchen_date_time`),
  KEY `wait_list_waitl_key_ckey` (`branch_no`,`waitl_last_no`),
  KEY `wait_list_waitl_key_kitchen_date_time_ckey` (`branch_no`,`waitl_kitchen_date_time`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `webservice_tasks`
--

DROP TABLE IF EXISTS `webservice_tasks`;
CREATE TABLE IF NOT EXISTS `webservice_tasks` (
  `webt_id` bigint NOT NULL AUTO_INCREMENT,
  `webt_guid` varchar(32) DEFAULT NULL,
  `webt_type` tinyint UNSIGNED DEFAULT '0',
  `webt_date_time` datetime DEFAULT NULL,
  `webt_ok` tinyint DEFAULT '0',
  `webt_ok_station` int UNSIGNED DEFAULT '0',
  `webt_error_message` longtext,
  PRIMARY KEY (`webt_id`),
  KEY `webservice_tasks_webt_guid_ckey` (`webt_guid`),
  KEY `webservice_tasks_webt_ok_ckey` (`webt_ok`),
  KEY `webservice_tasks_webt_key_key` (`webt_guid`,`webt_type`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `webshop_orders`
--

DROP TABLE IF EXISTS `webshop_orders`;
CREATE TABLE IF NOT EXISTS `webshop_orders` (
  `webso_id` bigint NOT NULL AUTO_INCREMENT,
  `shop_no` int DEFAULT NULL,
  `webso_ok` tinyint DEFAULT '0',
  PRIMARY KEY (`webso_id`),
  KEY `webshop_orders_shop_no_key` (`shop_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `work_schedules`
--

DROP TABLE IF EXISTS `work_schedules`;
CREATE TABLE IF NOT EXISTS `work_schedules` (
  `works_id` bigint NOT NULL AUTO_INCREMENT,
  `workt_no` bigint DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  `works_from_date` datetime DEFAULT NULL,
  `works_to_date` datetime DEFAULT NULL,
  `works_description` varchar(512) DEFAULT NULL,
  `works_holiday` tinyint DEFAULT '0',
  PRIMARY KEY (`works_id`),
  KEY `work_schedules_workt_no_ckey` (`workt_no`),
  KEY `work_schedules_opera_no_ckey` (`opera_no`),
  KEY `work_schedules_works_from_date_ckey` (`works_from_date`),
  KEY `work_schedules_works_to_date_ckey` (`works_to_date`),
  KEY `work_schedules_works_key_1_ckey` (`opera_no`,`works_from_date`,`works_to_date`,`workt_no`),
  KEY `work_schedules_works_key_2_ckey` (`works_from_date`,`works_to_date`,`workt_no`,`opera_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `work_schedule_configs`
--

DROP TABLE IF EXISTS `work_schedule_configs`;
CREATE TABLE IF NOT EXISTS `work_schedule_configs` (
  `workc_id` bigint NOT NULL AUTO_INCREMENT,
  `station_no` int UNSIGNED NOT NULL,
  `workc_display_border_left` double DEFAULT '20',
  `workc_display_border_right` double DEFAULT '5',
  `workc_display_border_top` double DEFAULT '5',
  `workc_display_border_bottom` double DEFAULT '5',
  `workc_header_1_format` varchar(24) DEFAULT 'YYYY',
  `workc_header_2_format` varchar(24) DEFAULT 'MMMM',
  `workc_header_3_format` varchar(24) DEFAULT 'KW',
  `workc_header_4_format` varchar(24) DEFAULT 'DD.MM KW',
  `workc_header_5_format` varchar(24) DEFAULT 'HH',
  `workc_header_6_format` varchar(24) DEFAULT 'HH:NN',
  `workc_type_1_header` varchar(6) DEFAULT '146',
  `workc_type_2_header` varchar(6) DEFAULT '145',
  `workc_type_3_header` varchar(6) DEFAULT '14',
  `workc_first_column_width` double DEFAULT '80',
  `workc_type_1_column_width` double DEFAULT '5',
  `workc_type_2_column_width` double DEFAULT '3',
  `workc_type_3_column_width` double DEFAULT '20',
  `workc_color_type` tinyint UNSIGNED DEFAULT '0',
  `workc_printer_border_left` double DEFAULT '20',
  `workc_printer_border_right` double DEFAULT '5',
  `workc_printer_border_top` double DEFAULT '5',
  `workc_printer_border_bottom` double DEFAULT '5',
  `workc_printer_header_1_format` varchar(24) DEFAULT 'YYYY',
  `workc_printer_header_2_format` varchar(24) DEFAULT 'MMMM',
  `workc_printer_header_3_format` varchar(24) DEFAULT 'KW',
  `workc_printer_header_4_format` varchar(24) DEFAULT 'DD.MM KW',
  `workc_printer_header_5_format` varchar(24) DEFAULT 'HH',
  `workc_printer_header_6_format` varchar(24) DEFAULT 'HH:NN',
  `workc_printer_first_column_width` double DEFAULT '80',
  `workc_printer_type_1_column_width` double DEFAULT '5',
  `workc_printer_type_2_column_width` double DEFAULT '3',
  `workc_printer_type_3_column_width` double DEFAULT '20',
  `workc_printer_type_1_header_width` varchar(6) DEFAULT '146',
  `workc_printer_type_2_header_width` varchar(6) DEFAULT '145',
  `workc_printer_type_3_header_width` varchar(6) DEFAULT '14',
  PRIMARY KEY (`workc_id`),
  KEY `work_schedule_configs_station_no_key` (`station_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Tabellenstruktur für Tabelle `work_schedule_series_detail`
--

DROP TABLE IF EXISTS `work_schedule_series_detail`;
CREATE TABLE IF NOT EXISTS `work_schedule_series_detail` (
  `worksd_id` bigint NOT NULL AUTO_INCREMENT,
  `worksm_id` bigint DEFAULT NULL,
  `worksd_weekday_1` tinyint DEFAULT '0',
  `worksd_weekday_2` tinyint DEFAULT '0',
  `worksd_weekday_3` tinyint DEFAULT '0',
  `worksd_weekday_4` tinyint DEFAULT '0',
  `worksd_weekday_5` tinyint DEFAULT '0',
  `worksd_weekday_6` tinyint DEFAULT '0',
  `worksd_weekday_7` tinyint DEFAULT '0',
  `worksd_weekday_8` tinyint DEFAULT '0',
  `worksd_weekday_9` tinyint DEFAULT '0',
  `worksd_valid_on_weekday_` tinyint UNSIGNED DEFAULT '0',
  `worksd_from_time` time DEFAULT NULL,
  `worksd_to_time` time DEFAULT NULL,
  `worksd_type` tinyint DEFAULT '0',
  `worksd_day_of_month` tinyint UNSIGNED DEFAULT '0',
  `worksd_week_no` tinyint UNSIGNED DEFAULT '0',
  `worksd_month_no` tinyint UNSIGNED DEFAULT '0',
  `worksd_ignore_holiday` tinyint DEFAULT '0',
  PRIMARY KEY (`worksd_id`),
  KEY `work_schedule_series_detail_worksm_id_ckey` (`worksm_id`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `work_schedule_series_master`
--

DROP TABLE IF EXISTS `work_schedule_series_master`;
CREATE TABLE IF NOT EXISTS `work_schedule_series_master` (
  `worksm_id` bigint NOT NULL AUTO_INCREMENT,
  `worksm_description` varchar(50) DEFAULT NULL,
  `opera_no` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`worksm_id`),
  KEY `work_schedule_series_master_worksm_description_ckey` (`worksm_description`),
  KEY `work_schedule_series_master_opera_no_ckey` (`opera_no`)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `work_schedule_types`
--

DROP TABLE IF EXISTS `work_schedule_types`;
CREATE TABLE IF NOT EXISTS `work_schedule_types` (
  `workt_id` bigint NOT NULL AUTO_INCREMENT,
  `workt_no` bigint DEFAULT NULL,
  `workt_description` varchar(35) DEFAULT NULL,
  `workt_working_hours` tinyint DEFAULT '0',
  `workt_standard` tinyint DEFAULT '0',
  `workt_holiday` tinyint DEFAULT '0',
  `workt_break` tinyint DEFAULT '0',
  `workt_color` int UNSIGNED DEFAULT '0',
  `workt_caption` varchar(6) DEFAULT NULL,
  `workt_sick_leave` tinyint DEFAULT '0',
  `workt_stand_in` tinyint DEFAULT '0',
  `workt_duty_swap` tinyint DEFAULT '0',
  PRIMARY KEY (`workt_id`),
  KEY `work_schedule_types_workt_no_key` (`workt_no`),
  KEY `work_schedule_types_workt_working_hours_ckey` (`workt_working_hours`),
  KEY `work_schedule_types_workt_standard_ckey` (`workt_standard`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `accounting_log`
--
ALTER TABLE `accounting_log`
  ADD CONSTRAINT `Constraint_Stations_Accounting_Logs` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `atm_log`
--
ALTER TABLE `atm_log`
  ADD CONSTRAINT `Constraint_Stations_ATM_Log` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `bar_systems`
--
ALTER TABLE `bar_systems`
  ADD CONSTRAINT `Constraint_Stations_Bar_Systems` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `bluecode_customers`
--
ALTER TABLE `bluecode_customers`
  ADD CONSTRAINT `Constraint_BlueCodeScheme_BlueCodeCustomers` FOREIGN KEY (`bluec_scheme_no`) REFERENCES `bluecode_schemes` (`bluec_scheme_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Customers_BlueCode_Customers` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`);

--
-- Constraints der Tabelle `branch_customer_imports`
--
ALTER TABLE `branch_customer_imports`
  ADD CONSTRAINT `Constraint_Branch_Customer_Branch_Import` FOREIGN KEY (`branch_no`) REFERENCES `branches` (`branch_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `branch_images`
--
ALTER TABLE `branch_images`
  ADD CONSTRAINT `Constraint_Branch_Images` FOREIGN KEY (`branch_no`) REFERENCES `branches` (`branch_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `calendar_entries`
--
ALTER TABLE `calendar_entries`
  ADD CONSTRAINT `Constraint_Kalendertyp_Kalender` FOREIGN KEY (`calt_id`) REFERENCES `calendar_types` (`calt_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `cash_inflows`
--
ALTER TABLE `cash_inflows`
  ADD CONSTRAINT `Constraint_Products_Cash_Inflows` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`);

--
-- Constraints der Tabelle `cash_outflows`
--
ALTER TABLE `cash_outflows`
  ADD CONSTRAINT `Constraint_Products_Cash_Outflows` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`);

--
-- Constraints der Tabelle `characteristic_details`
--
ALTER TABLE `characteristic_details`
  ADD CONSTRAINT `Constraint_Characteristics_ Master_Characteristics_Details` FOREIGN KEY (`charm_no`) REFERENCES `characteristic_master` (`charm_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `commission_operators`
--
ALTER TABLE `commission_operators`
  ADD CONSTRAINT `Constraint_Operators_Commission_Operators` FOREIGN KEY (`opera_no`) REFERENCES `operators` (`opera_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `commission_pyramid`
--
ALTER TABLE `commission_pyramid`
  ADD CONSTRAINT `Constraint_Operator_Commission_Pyramid` FOREIGN KEY (`commp_no`) REFERENCES `operators` (`commp_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Operator_Commission_Pyramid_Reverse` FOREIGN KEY (`opera_no`) REFERENCES `operators` (`opera_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `Constraint_Customer_Groups_Customers` FOREIGN KEY (`custg_no`) REFERENCES `customer_groups` (`custg_no`) ON DELETE CASCADE,
  ADD CONSTRAINT `Constraint_Form_Templates_Customers` FOREIGN KEY (`formt_no`) REFERENCES `form_template_master` (`formt_no`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `customer_emails`
--
ALTER TABLE `customer_emails`
  ADD CONSTRAINT `Constraint_Customers_Customer_Emails` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `customer_loyalty_accountings`
--
ALTER TABLE `customer_loyalty_accountings`
  ADD CONSTRAINT `Constraint_Customers_Customer_Loyalty_Accountings` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `customer_notes`
--
ALTER TABLE `customer_notes`
  ADD CONSTRAINT `Constraint_Customers_Customers_Notes` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `customer_sales_accounts`
--
ALTER TABLE `customer_sales_accounts`
  ADD CONSTRAINT `Constraint_Customers_Customer_Sales_Accounts` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `device_details`
--
ALTER TABLE `device_details`
  ADD CONSTRAINT `device_details_constraint_device_master_device_details_fkey` FOREIGN KEY (`devicem_no`) REFERENCES `device_master` (`devicem_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `dining_areas`
--
ALTER TABLE `dining_areas`
  ADD CONSTRAINT `Constraint_Branch_Dining_Areas` FOREIGN KEY (`branch_no`) REFERENCES `branches` (`branch_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `form_template_details`
--
ALTER TABLE `form_template_details`
  ADD CONSTRAINT `Constraint_Form_Template_Master_Details` FOREIGN KEY (`formt_no`) REFERENCES `form_template_master` (`formt_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `kiosk_master`
--
ALTER TABLE `kiosk_master`
  ADD CONSTRAINT `Constraint_stations_kiosk_master` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`);

--
-- Constraints der Tabelle `money_counting_lists`
--
ALTER TABLE `money_counting_lists`
  ADD CONSTRAINT `Constraint_Station_Money_Count_List` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `operators`
--
ALTER TABLE `operators`
  ADD CONSTRAINT `Constraint_Operator_Work_Types_Operators` FOREIGN KEY (`operaw_no`) REFERENCES `operator_work_types` (`operaw_no`),
  ADD CONSTRAINT `Constraint_Operators_Permissions` FOREIGN KEY (`perm_no`) REFERENCES `permissions` (`perm_no`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `operator_coms`
--
ALTER TABLE `operator_coms`
  ADD CONSTRAINT `Constraint_Table_Operator_Com` FOREIGN KEY (`table_no`) REFERENCES `tables` (`table_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `operator_tables`
--
ALTER TABLE `operator_tables`
  ADD CONSTRAINT `Constraint_Operator_Operator_Tables` FOREIGN KEY (`opera_no`) REFERENCES `operators` (`opera_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Tables_Operator_Tables` FOREIGN KEY (`table_no`) REFERENCES `tables` (`table_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `Constraint_Order_Master_Order_Details` FOREIGN KEY (`orderm_id`) REFERENCES `order_master` (`orderm_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `order_form_details`
--
ALTER TABLE `order_form_details`
  ADD CONSTRAINT `Constraint_Order_Form_Master_Details` FOREIGN KEY (`orderfm_id`) REFERENCES `order_form_master` (`orderfm_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `order_master`
--
ALTER TABLE `order_master`
  ADD CONSTRAINT `Constraint_Order_Form_Master_Order_Master` FOREIGN KEY (`orderfm_id`) REFERENCES `order_form_master` (`orderfm_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `part_lists`
--
ALTER TABLE `part_lists`
  ADD CONSTRAINT `Constraint_Artikel_Stueckliste` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `permission_elements`
--
ALTER TABLE `permission_elements`
  ADD CONSTRAINT `Constraint_Berechtigungen_BerechtigungElement` FOREIGN KEY (`perm_no`) REFERENCES `permissions` (`perm_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `phone_list`
--
ALTER TABLE `phone_list`
  ADD CONSTRAINT `Constraint_Customers_Phone_List` FOREIGN KEY (`cust_no`) REFERENCES `customers` (`cust_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `postcodes`
--
ALTER TABLE `postcodes`
  ADD CONSTRAINT `Constraint_countries_postcodes` FOREIGN KEY (`count_no`) REFERENCES `countries` (`count_no`);

--
-- Constraints der Tabelle `price_list_assignments`
--
ALTER TABLE `price_list_assignments`
  ADD CONSTRAINT `Constraint_Cross_Reference_Price_List_Assignments` FOREIGN KEY (`cref_no`) REFERENCES `cross_references` (`cref_no`);

--
-- Constraints der Tabelle `price_list_details`
--
ALTER TABLE `price_list_details`
  ADD CONSTRAINT `price_list_details_constraint_bxprlname_bxpreisliste_fkey` FOREIGN KEY (`pricem_no`) REFERENCES `price_list_master` (`pricem_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `price_list_details_constraint_products_price_list_details_fkey` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `printers`
--
ALTER TABLE `printers`
  ADD CONSTRAINT `Constraint_Device_Master_Printers` FOREIGN KEY (`devicem_no`) REFERENCES `device_master` (`devicem_no`),
  ADD CONSTRAINT `Constraint_Stations_Printers` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `product_barcodes`
--
ALTER TABLE `product_barcodes`
  ADD CONSTRAINT `Constraint_Artikel_ArtikelEAN` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `product_characteristics`
--
ALTER TABLE `product_characteristics`
  ADD CONSTRAINT `Constraint_Artikel_Artikel_Eigenschaften` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Eigenschaften_Zeilen_Artikel_Eigenschaften` FOREIGN KEY (`chard_no`) REFERENCES `characteristic_details` (`chard_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `product_foreign_numbers`
--
ALTER TABLE `product_foreign_numbers`
  ADD CONSTRAINT `Constraint_Products_Products_Foreign_Numbers` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `product_groups`
--
ALTER TABLE `product_groups`
  ADD CONSTRAINT `product_groups_constraint_product_main_groups_product_group0001` FOREIGN KEY (`prodm_no`) REFERENCES `product_main_groups` (`prodm_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `Constraint_Products_Images` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `public_holidays`
--
ALTER TABLE `public_holidays`
  ADD CONSTRAINT `Constraint_Counties_Public_Holidays` FOREIGN KEY (`count_id`) REFERENCES `countries` (`count_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `room_rentals`
--
ALTER TABLE `room_rentals`
  ADD CONSTRAINT `Constraint_Branches_Room_Rentals` FOREIGN KEY (`branch_no`) REFERENCES `branches` (`branch_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Buildings_Room_Rentals` FOREIGN KEY (`build_no`) REFERENCES `buildings` (`build_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `route_master`
--
ALTER TABLE `route_master`
  ADD CONSTRAINT `Constraint_Route_Groups_Route_Master` FOREIGN KEY (`routeg_no`) REFERENCES `route_groups` (`routeg_no`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `sales_proposals`
--
ALTER TABLE `sales_proposals`
  ADD CONSTRAINT `Constraint_Products_Sale_Proposals` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `scales`
--
ALTER TABLE `scales`
  ADD CONSTRAINT `Constraint_Products_Scales` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `selection_details`
--
ALTER TABLE `selection_details`
  ADD CONSTRAINT `Constraint_Selection_Master_Selection_Details` FOREIGN KEY (`selm_no`) REFERENCES `selection_master` (`selm_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `staggered_prices`
--
ALTER TABLE `staggered_prices`
  ADD CONSTRAINT `Constraint_PreislistenNamen_Staffelpreise` FOREIGN KEY (`pricem_no`) REFERENCES `price_list_master` (`pricem_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `stations`
--
ALTER TABLE `stations`
  ADD CONSTRAINT `Constraint_Branches_Stations` FOREIGN KEY (`branch_no`) REFERENCES `branches` (`branch_no`);

--
-- Constraints der Tabelle `station_emails`
--
ALTER TABLE `station_emails`
  ADD CONSTRAINT `Constraint_Stations_Station_Emails` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `station_log`
--
ALTER TABLE `station_log`
  ADD CONSTRAINT `Constraint_Stations_Station_Log` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `station_settings`
--
ALTER TABLE `station_settings`
  ADD CONSTRAINT `Constraint_Countries_Station_Settings` FOREIGN KEY (`count_no`) REFERENCES `countries` (`count_no`),
  ADD CONSTRAINT `Constraint_Stations_Station_Settings` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`);

--
-- Constraints der Tabelle `stock_characteristics`
--
ALTER TABLE `stock_characteristics`
  ADD CONSTRAINT `Constraint_Stock_Master_Stock_Characteristics` FOREIGN KEY (`stockm_guid`) REFERENCES `stock_master` (`stockm_guid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `stock_details`
--
ALTER TABLE `stock_details`
  ADD CONSTRAINT `Constraint_Stock_Master_Stock_Details` FOREIGN KEY (`stockm_guid`) REFERENCES `stock_master` (`stockm_guid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `stock_master`
--
ALTER TABLE `stock_master`
  ADD CONSTRAINT `stock_master_constraint_products_stock_master_fkey` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `stock_reservations`
--
ALTER TABLE `stock_reservations`
  ADD CONSTRAINT `Constraint_stock_locations_stock_reservations` FOREIGN KEY (`stockl_no`) REFERENCES `stock_locations` (`stockl_no`);

--
-- Constraints der Tabelle `synchronizations`
--
ALTER TABLE `synchronizations`
  ADD CONSTRAINT `Constraint_Stations_Synchronizations` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `synchronization_transfer_lists`
--
ALTER TABLE `synchronization_transfer_lists`
  ADD CONSTRAINT `Constraint_Synchronisations_Transfer_List` FOREIGN KEY (`sync_id`) REFERENCES `synchronizations` (`sync_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `tables`
--
ALTER TABLE `tables`
  ADD CONSTRAINT `Constraint_Branches_Tables` FOREIGN KEY (`branch_no`) REFERENCES `branches` (`branch_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Table_Groups_Table` FOREIGN KEY (`tableg_no`) REFERENCES `table_groups` (`tableg_no`);

--
-- Constraints der Tabelle `voucher_details`
--
ALTER TABLE `voucher_details`
  ADD CONSTRAINT `Constraint_Voucher_Master_Voucher_Details` FOREIGN KEY (`vouchm_no`) REFERENCES `voucher_master` (`vouchm_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `voucher_generations`
--
ALTER TABLE `voucher_generations`
  ADD CONSTRAINT `Constraint_Voucher_Master_Voucher_Generations` FOREIGN KEY (`vouchm_no`) REFERENCES `voucher_master` (`vouchm_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `voucher_master`
--
ALTER TABLE `voucher_master`
  ADD CONSTRAINT `Constraint_Products_Voucher_Master` FOREIGN KEY (`prod_no`) REFERENCES `products` (`prod_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `work_schedules`
--
ALTER TABLE `work_schedules`
  ADD CONSTRAINT `Constraint_Operator_Work_Schedules` FOREIGN KEY (`opera_no`) REFERENCES `operators` (`opera_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Constraint_Work_Schedule_Types_Work_Schedules` FOREIGN KEY (`workt_no`) REFERENCES `work_schedule_types` (`workt_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `work_schedule_configs`
--
ALTER TABLE `work_schedule_configs`
  ADD CONSTRAINT `Constraint_Kassen_ArbeitsplanConfig` FOREIGN KEY (`station_no`) REFERENCES `stations` (`station_no`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `work_schedule_series_detail`
--
ALTER TABLE `work_schedule_series_detail`
  ADD CONSTRAINT `Constraint_ArbeitsplanSerieKopf_ArbeitsplanSerieZeilen` FOREIGN KEY (`worksm_id`) REFERENCES `work_schedule_series_master` (`worksm_id`);

--
-- Constraints der Tabelle `work_schedule_series_master`
--
ALTER TABLE `work_schedule_series_master`
  ADD CONSTRAINT `Constraint_Bediener_ArbeitsplanSerieKopf` FOREIGN KEY (`opera_no`) REFERENCES `operators` (`opera_no`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
