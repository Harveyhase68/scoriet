/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : PostgreSQL
 Source Server Version : 160002 (160002)
 Source Host           : localhost:5432
 Source Catalog        : customer_db
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 160002 (160002)
 File Encoding         : 65001

 Date: 27/01/2026 09:15:14
*/


-- ----------------------------
-- Table structure for addresses
-- ----------------------------
DROP TABLE IF EXISTS "public"."addresses";
CREATE TABLE "public"."addresses" (
  "adr_id" int8 NOT NULL,
  "adr_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "sal_no" int8,
  "tit_no" int8,
  "adr_company" varchar(50) COLLATE "pg_catalog"."default",
  "adr_company_department" varchar(50) COLLATE "pg_catalog"."default",
  "adr_first_name" varchar(40) COLLATE "pg_catalog"."default",
  "adr_middle_name" varchar(50) COLLATE "pg_catalog"."default",
  "adr_last_name" varchar(40) COLLATE "pg_catalog"."default",
  "adr_street" varchar(50) COLLATE "pg_catalog"."default",
  "pc_no" varchar(20) COLLATE "pg_catalog"."default",
  "adr_city" varchar(50) COLLATE "pg_catalog"."default",
  "count_no" varchar(2) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for contact_methods
-- ----------------------------
DROP TABLE IF EXISTS "public"."contact_methods";
CREATE TABLE "public"."contact_methods" (
  "cm_id" int8 NOT NULL,
  "cm_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "cm_type" int2,
  "cm_value" text COLLATE "pg_catalog"."default",
  "cm_primary" int2
)
;

-- ----------------------------
-- Table structure for contacts
-- ----------------------------
DROP TABLE IF EXISTS "public"."contacts";
CREATE TABLE "public"."contacts" (
  "cont_id" int8 NOT NULL,
  "cont_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "sal_no" int8,
  "tit_no" int8,
  "cont_first_name" varchar(50) COLLATE "pg_catalog"."default",
  "cont_middle_name" varchar(50) COLLATE "pg_catalog"."default",
  "cont_last_name" varchar(50) COLLATE "pg_catalog"."default",
  "cont_position" varchar(100) COLLATE "pg_catalog"."default",
  "cont_department" varchar(100) COLLATE "pg_catalog"."default",
  "cont_phone" varchar(50) COLLATE "pg_catalog"."default",
  "cont_mobile" varchar(50) COLLATE "pg_catalog"."default",
  "cont_email" varchar(255) COLLATE "pg_catalog"."default",
  "cont_birthday" date,
  "cont_created" date,
  "cont_last_changed" timestamp(6)
)
;

-- ----------------------------
-- Table structure for countries
-- ----------------------------
DROP TABLE IF EXISTS "public"."countries";
CREATE TABLE "public"."countries" (
  "count_id" int8 NOT NULL,
  "count_no" varchar(2) COLLATE "pg_catalog"."default",
  "count_no_iso" varchar(3) COLLATE "pg_catalog"."default",
  "count_name" varchar(100) COLLATE "pg_catalog"."default",
  "count_phone_area_code" varchar(5) COLLATE "pg_catalog"."default",
  "count_shop_address_type" text COLLATE "pg_catalog"."default",
  "count_image" bytea,
  "count_image_file_name" varchar(128) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for customer_addresses
-- ----------------------------
DROP TABLE IF EXISTS "public"."customer_addresses";
CREATE TABLE "public"."customer_addresses" (
  "ca_id" int8 NOT NULL,
  "cust_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "adr_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "ca_address_type" int2,
  "ca_primary_invoice_address" int2,
  "ca_primary_delivery_address" int2
)
;

-- ----------------------------
-- Table structure for customer_contacts
-- ----------------------------
DROP TABLE IF EXISTS "public"."customer_contacts";
CREATE TABLE "public"."customer_contacts" (
  "cc_id" int8 NOT NULL,
  "cust_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "cont_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "adr_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "cm_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "cc_primary_contact" int2
)
;

-- ----------------------------
-- Table structure for customer_state
-- ----------------------------
DROP TABLE IF EXISTS "public"."customer_state";
CREATE TABLE "public"."customer_state" (
  "cst_id" int8 NOT NULL,
  "cst_no" int8 NOT NULL,
  "cst_name" varchar(50) COLLATE "pg_catalog"."default",
  "cst_locked" int2,
  "cst_display_no_name" varchar(50) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS "public"."customers";
CREATE TABLE "public"."customers" (
  "cust_id" int8 NOT NULL,
  "cust_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "cust_no" int8 NOT NULL,
  "cst_no" int8,
  "cust_accounts_receivable_account" int8,
  "cust_composite_no_match_code" varchar(50) COLLATE "pg_catalog"."default",
  "branch_no" int8,
  "cust_created" date,
  "cust_last_changed" timestamp(6),
  "cust_last_purchase" date,
  "cust_match_code" varchar(40) COLLATE "pg_catalog"."default",
  "cust_price_type" int2,
  "sd_no" int4,
  "cust_send_emails" int2,
  "cust_invoice_copies" int2,
  "cust_uid" varchar(20) COLLATE "pg_catalog"."default",
  "cust_text" text COLLATE "pg_catalog"."default",
  "shop_no" int4,
  "lang_no" int4
)
;

-- ----------------------------
-- Table structure for foreign_currencies
-- ----------------------------
DROP TABLE IF EXISTS "public"."foreign_currencies";
CREATE TABLE "public"."foreign_currencies" (
  "fc_id" int8 NOT NULL,
  "fc_code" varchar(3) COLLATE "pg_catalog"."default",
  "fc_name" varchar(50) COLLATE "pg_catalog"."default",
  "fc_updated_at" timestamp(6),
  "fc_composite_code_name" varchar(55) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for languages
-- ----------------------------
DROP TABLE IF EXISTS "public"."languages";
CREATE TABLE "public"."languages" (
  "lang_id" int8 NOT NULL,
  "lang_no" int4 NOT NULL,
  "lang_name" varchar(50) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for payment_bank_accounts
-- ----------------------------
DROP TABLE IF EXISTS "public"."payment_bank_accounts";
CREATE TABLE "public"."payment_bank_accounts" (
  "pba_id" int8 NOT NULL,
  "pba_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "pba_bank_name" varchar(60) COLLATE "pg_catalog"."default",
  "pba_routing_number" varchar(50) COLLATE "pg_catalog"."default",
  "pba_account_number" varchar(50) COLLATE "pg_catalog"."default",
  "pba_iban" varchar(25) COLLATE "pg_catalog"."default",
  "pba_bic" varchar(12) COLLATE "pg_catalog"."default",
  "pba_sepa_id" varchar(35) COLLATE "pg_catalog"."default",
  "pba_is_primary" int2,
  "fc_code" varchar(3) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for payment_credit_cards
-- ----------------------------
DROP TABLE IF EXISTS "public"."payment_credit_cards";
CREATE TABLE "public"."payment_credit_cards" (
  "pcc_id" int8 NOT NULL,
  "pcc_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "pcc_cardholder_name" varchar(50) COLLATE "pg_catalog"."default",
  "pcc_type" int2,
  "pcc_data" text COLLATE "pg_catalog"."default",
  "pcc_expiry_date" date,
  "pcc_is_primary" int2,
  "pcc_created_at" date,
  "pcc_updated_at" date
)
;

-- ----------------------------
-- Table structure for payment_methods
-- ----------------------------
DROP TABLE IF EXISTS "public"."payment_methods";
CREATE TABLE "public"."payment_methods" (
  "pm_id" int8 NOT NULL,
  "pm_uuid" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "cust_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "pba_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "pcc_uuid" varchar(36) COLLATE "pg_catalog"."default",
  "pm_type" int2,
  "pm_email" varchar(50) COLLATE "pg_catalog"."default",
  "lang_no" int4,
  "fc_code" varchar(3) COLLATE "pg_catalog"."default",
  "pm_is_default" int2 NOT NULL
)
;

-- ----------------------------
-- Table structure for post_codes
-- ----------------------------
DROP TABLE IF EXISTS "public"."post_codes";
CREATE TABLE "public"."post_codes" (
  "pc_id" int8 NOT NULL,
  "pc_no" varchar(20) COLLATE "pg_catalog"."default",
  "pc_city" varchar(80) COLLATE "pg_catalog"."default",
  "count_no" varchar(2) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for sales_discount
-- ----------------------------
DROP TABLE IF EXISTS "public"."sales_discount";
CREATE TABLE "public"."sales_discount" (
  "sd_id" int8 NOT NULL,
  "sd_no" int4 NOT NULL,
  "sd_name" varchar(50) COLLATE "pg_catalog"."default",
  "sd_discount_percent" float8 NOT NULL,
  "sd_discount_payment_terms" int8,
  "sd_net_payment_terms" int8
)
;

-- ----------------------------
-- Table structure for salutations
-- ----------------------------
DROP TABLE IF EXISTS "public"."salutations";
CREATE TABLE "public"."salutations" (
  "sal_id" int8 NOT NULL,
  "sal_no" int8 NOT NULL,
  "sal_name" varchar(20) COLLATE "pg_catalog"."default",
  "sal_letter_salutation" varchar(50) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for shops
-- ----------------------------
DROP TABLE IF EXISTS "public"."shops";
CREATE TABLE "public"."shops" (
  "shop_id" int8 NOT NULL,
  "shop_no" int4 NOT NULL,
  "shop_name" varchar(64) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for titles
-- ----------------------------
DROP TABLE IF EXISTS "public"."titles";
CREATE TABLE "public"."titles" (
  "tit_id" int8 NOT NULL,
  "tit_no" int8 NOT NULL,
  "tit_name" varchar(30) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" int4 NOT NULL,
  "username" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "first_name" varchar(50) COLLATE "pg_catalog"."default",
  "last_name" varchar(50) COLLATE "pg_catalog"."default",
  "role" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "reset_token" varchar(64) COLLATE "pg_catalog"."default",
  "reset_token_expires" timestamp(6),
  "is_active" int2 NOT NULL,
  "last_login" timestamp(6),
  "created_at" timestamp(6) NOT NULL,
  "updated_at" timestamp(6) NOT NULL
)
;

-- ----------------------------
-- Indexes structure for table addresses
-- ----------------------------
CREATE INDEX "addresses_adr_city_ckey" ON "public"."addresses" USING btree (
  "adr_city" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "addresses_adr_uuid_key" ON "public"."addresses" USING btree (
  "adr_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "addresses_count_no_ckey" ON "public"."addresses" USING btree (
  "count_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "addresses_pc_no_ckey" ON "public"."addresses" USING btree (
  "pc_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "addresses_sal_no_ckey" ON "public"."addresses" USING btree (
  "sal_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "addresses_tit_no_ckey" ON "public"."addresses" USING btree (
  "tit_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table addresses
-- ----------------------------
ALTER TABLE "public"."addresses" ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("adr_id");

-- ----------------------------
-- Indexes structure for table contact_methods
-- ----------------------------
CREATE INDEX "contact_methods_cm_id_ckey" ON "public"."contact_methods" USING btree (
  "cm_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "contact_methods_cm_uuid_key" ON "public"."contact_methods" USING btree (
  "cm_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table contacts
-- ----------------------------
CREATE INDEX "contacts_cont_birthday_ckey" ON "public"."contacts" USING btree (
  "cont_birthday" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "contacts_cont_uuid_key" ON "public"."contacts" USING btree (
  "cont_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "contacts_sal_no_ckey" ON "public"."contacts" USING btree (
  "sal_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "contacts_tit_no_ckey" ON "public"."contacts" USING btree (
  "tit_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table contacts
-- ----------------------------
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("cont_id");

-- ----------------------------
-- Indexes structure for table countries
-- ----------------------------
CREATE INDEX "countries_count_name_ckey" ON "public"."countries" USING btree (
  "count_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "countries_count_no_iso_ckey" ON "public"."countries" USING btree (
  "count_no_iso" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "countries_count_no_key" ON "public"."countries" USING btree (
  "count_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "countries_count_phone_area_code_ckey" ON "public"."countries" USING btree (
  "count_phone_area_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table countries
-- ----------------------------
ALTER TABLE "public"."countries" ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("count_id");

-- ----------------------------
-- Indexes structure for table customer_addresses
-- ----------------------------
CREATE INDEX "customer_addresses_adr_uuid_ckey" ON "public"."customer_addresses" USING btree (
  "adr_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "customer_addresses_ca_address_key_key" ON "public"."customer_addresses" USING btree (
  "cust_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "adr_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "customer_addresses_ca_id_ckey" ON "public"."customer_addresses" USING btree (
  "ca_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "customer_addresses_cust_uuid_ckey" ON "public"."customer_addresses" USING btree (
  "cust_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table customer_contacts
-- ----------------------------
CREATE INDEX "customer_contacts_adr_uuid_ckey" ON "public"."customer_contacts" USING btree (
  "adr_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "customer_contacts_cc_id_ckey" ON "public"."customer_contacts" USING btree (
  "cc_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "customer_contacts_cm_uuid_ckey" ON "public"."customer_contacts" USING btree (
  "cm_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "customer_contacts_cont_uuid_ckey" ON "public"."customer_contacts" USING btree (
  "cont_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "customer_contacts_cust_uuid_ckey" ON "public"."customer_contacts" USING btree (
  "cust_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table customer_state
-- ----------------------------
CREATE INDEX "customer_state_cst_id_ckey" ON "public"."customer_state" USING btree (
  "cst_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "customer_state_cst_no_key" ON "public"."customer_state" USING btree (
  "cst_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table customers
-- ----------------------------
CREATE INDEX "customers_branch_no_ckey" ON "public"."customers" USING btree (
  "branch_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "customers_cst_no_ckey" ON "public"."customers" USING btree (
  "cst_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "customers_cust_accounts_receivable_account_key" ON "public"."customers" USING btree (
  "cust_accounts_receivable_account" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "customers_cust_composite_no_match_code_ckey" ON "public"."customers" USING btree (
  "cust_composite_no_match_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "customers_cust_created_ckey" ON "public"."customers" USING btree (
  "cust_created" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "customers_cust_last_changed_ckey" ON "public"."customers" USING btree (
  "cust_last_changed" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "customers_cust_last_purchase_ckey" ON "public"."customers" USING btree (
  "cust_last_purchase" "pg_catalog"."date_ops" ASC NULLS LAST
);
CREATE INDEX "customers_cust_match_code_ckey" ON "public"."customers" USING btree (
  "cust_match_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "customers_cust_no_key" ON "public"."customers" USING btree (
  "cust_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "customers_cust_uuid_key" ON "public"."customers" USING btree (
  "cust_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "customers_lang_no_ckey" ON "public"."customers" USING btree (
  "lang_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "customers_sd_no_ckey" ON "public"."customers" USING btree (
  "sd_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "customers_shop_no_ckey" ON "public"."customers" USING btree (
  "shop_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table customers
-- ----------------------------
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("cust_id");

-- ----------------------------
-- Indexes structure for table foreign_currencies
-- ----------------------------
CREATE UNIQUE INDEX "foreign_currencies_fc_code_key" ON "public"."foreign_currencies" USING btree (
  "fc_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "foreign_currencies_fc_composite_code_name_ckey" ON "public"."foreign_currencies" USING btree (
  "fc_composite_code_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "foreign_currencies_fc_id_ckey" ON "public"."foreign_currencies" USING btree (
  "fc_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table languages
-- ----------------------------
CREATE INDEX "languages_lang_name_ckey" ON "public"."languages" USING btree (
  "lang_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "languages_lang_no_key" ON "public"."languages" USING btree (
  "lang_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table languages
-- ----------------------------
ALTER TABLE "public"."languages" ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("lang_id");

-- ----------------------------
-- Indexes structure for table payment_bank_accounts
-- ----------------------------
CREATE INDEX "payment_bank_accounts_fc_code_ckey" ON "public"."payment_bank_accounts" USING btree (
  "fc_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "payment_bank_accounts_pba_id_ckey" ON "public"."payment_bank_accounts" USING btree (
  "pba_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "payment_bank_accounts_pba_uuid_key" ON "public"."payment_bank_accounts" USING btree (
  "pba_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table payment_credit_cards
-- ----------------------------
CREATE INDEX "payment_credit_cards_pcc_id_ckey" ON "public"."payment_credit_cards" USING btree (
  "pcc_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "payment_credit_cards_pcc_uuid_key" ON "public"."payment_credit_cards" USING btree (
  "pcc_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table payment_methods
-- ----------------------------
CREATE INDEX "payment_methods_cust_uuid_ckey" ON "public"."payment_methods" USING btree (
  "cust_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "payment_methods_fc_code_ckey" ON "public"."payment_methods" USING btree (
  "fc_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "payment_methods_lang_no_ckey" ON "public"."payment_methods" USING btree (
  "lang_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "payment_methods_pba_uuid_ckey" ON "public"."payment_methods" USING btree (
  "pba_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "payment_methods_pcc_uuid_ckey" ON "public"."payment_methods" USING btree (
  "pcc_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "payment_methods_pm_id_ckey" ON "public"."payment_methods" USING btree (
  "pm_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "payment_methods_pm_key_key" ON "public"."payment_methods" USING btree (
  "pm_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "cust_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "payment_methods_pm_type_ckey" ON "public"."payment_methods" USING btree (
  "pm_type" "pg_catalog"."int2_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "payment_methods_pm_uuid_key" ON "public"."payment_methods" USING btree (
  "pm_uuid" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Indexes structure for table post_codes
-- ----------------------------
CREATE INDEX "post_codes_count_no_ckey" ON "public"."post_codes" USING btree (
  "count_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "post_codes_pc_city_ckey" ON "public"."post_codes" USING btree (
  "pc_city" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "post_codes_pc_key_key" ON "public"."post_codes" USING btree (
  "pc_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "pc_city" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "post_codes_pc_no_ckey" ON "public"."post_codes" USING btree (
  "pc_no" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table post_codes
-- ----------------------------
ALTER TABLE "public"."post_codes" ADD CONSTRAINT "post_codes_pkey" PRIMARY KEY ("pc_id");

-- ----------------------------
-- Indexes structure for table sales_discount
-- ----------------------------
CREATE INDEX "sales_discount_sd_name_ckey" ON "public"."sales_discount" USING btree (
  "sd_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "sales_discount_sd_no_key" ON "public"."sales_discount" USING btree (
  "sd_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table sales_discount
-- ----------------------------
ALTER TABLE "public"."sales_discount" ADD CONSTRAINT "sales_discount_pkey" PRIMARY KEY ("sd_id");

-- ----------------------------
-- Indexes structure for table salutations
-- ----------------------------
CREATE UNIQUE INDEX "salutations_sal_no_key" ON "public"."salutations" USING btree (
  "sal_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table salutations
-- ----------------------------
ALTER TABLE "public"."salutations" ADD CONSTRAINT "salutations_pkey" PRIMARY KEY ("sal_id");

-- ----------------------------
-- Indexes structure for table shops
-- ----------------------------
CREATE INDEX "shops_shop_name_ckey" ON "public"."shops" USING btree (
  "shop_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "shops_shop_no_key" ON "public"."shops" USING btree (
  "shop_no" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table shops
-- ----------------------------
ALTER TABLE "public"."shops" ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("shop_id");

-- ----------------------------
-- Indexes structure for table titles
-- ----------------------------
CREATE UNIQUE INDEX "titles_tit_no_key" ON "public"."titles" USING btree (
  "tit_no" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table titles
-- ----------------------------
ALTER TABLE "public"."titles" ADD CONSTRAINT "titles_pkey" PRIMARY KEY ("tit_id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "users_email_key" ON "public"."users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "users_is_active_key" ON "public"."users" USING btree (
  "is_active" "pg_catalog"."int2_ops" ASC NULLS LAST
);
CREATE INDEX "users_reset_token_key" ON "public"."users" USING btree (
  "reset_token" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "users_username_key" ON "public"."users" USING btree (
  "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table addresses
-- ----------------------------
ALTER TABLE "public"."addresses" ADD CONSTRAINT "addresses_constraint_countries_addresses_fkey" FOREIGN KEY ("count_no") REFERENCES "public"."countries" ("count_no") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table customer_addresses
-- ----------------------------
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_constraint_addresses_customer_addresses_fkey" FOREIGN KEY ("adr_uuid") REFERENCES "public"."addresses" ("adr_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_constraint_customers_customer_addresses_fkey" FOREIGN KEY ("cust_uuid") REFERENCES "public"."customers" ("cust_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table customer_contacts
-- ----------------------------
ALTER TABLE "public"."customer_contacts" ADD CONSTRAINT "customer_contacts_addresses_fkey" FOREIGN KEY ("adr_uuid") REFERENCES "public"."addresses" ("adr_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customer_contacts" ADD CONSTRAINT "customer_contacts_constraint_contacts_customer_contacts_fkey" FOREIGN KEY ("cont_uuid") REFERENCES "public"."contacts" ("cont_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customer_contacts" ADD CONSTRAINT "customer_contacts_constraint_customers_customer_contacts_fkey" FOREIGN KEY ("cust_uuid") REFERENCES "public"."customers" ("cust_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customer_contacts" ADD CONSTRAINT "customer_contacts_contact_methods_fkey" FOREIGN KEY ("cm_uuid") REFERENCES "public"."contact_methods" ("cm_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table customers
-- ----------------------------
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_constraint_customer_state_customers_fkey" FOREIGN KEY ("cst_no") REFERENCES "public"."customer_state" ("cst_no") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_constraint_languages_customers_fkey" FOREIGN KEY ("lang_no") REFERENCES "public"."languages" ("lang_no") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_constraint_sales_discount_customers_fkey" FOREIGN KEY ("sd_no") REFERENCES "public"."sales_discount" ("sd_no") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_constraint_shops_customers_fkey" FOREIGN KEY ("shop_no") REFERENCES "public"."shops" ("shop_no") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table payment_bank_accounts
-- ----------------------------
ALTER TABLE "public"."payment_bank_accounts" ADD CONSTRAINT "payment_bank_accounts_constraint_foreign_currencies_payment0001" FOREIGN KEY ("fc_code") REFERENCES "public"."foreign_currencies" ("fc_code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table payment_methods
-- ----------------------------
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_constraint_customers_payment_methods_fkey" FOREIGN KEY ("cust_uuid") REFERENCES "public"."customers" ("cust_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_constraint_foreign_currencies_payment_metho0004" FOREIGN KEY ("fc_code") REFERENCES "public"."foreign_currencies" ("fc_code") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_constraint_languages_payment_methods_fkey" FOREIGN KEY ("lang_no") REFERENCES "public"."languages" ("lang_no") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_constraint_payment_bank_accounts_payment_me0002" FOREIGN KEY ("pba_uuid") REFERENCES "public"."payment_bank_accounts" ("pba_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_constraint_payment_credit_cards_payment_met0003" FOREIGN KEY ("pcc_uuid") REFERENCES "public"."payment_credit_cards" ("pcc_uuid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table post_codes
-- ----------------------------
ALTER TABLE "public"."post_codes" ADD CONSTRAINT "post_codes_countries_fkey" FOREIGN KEY ("count_no") REFERENCES "public"."countries" ("count_no") ON DELETE NO ACTION ON UPDATE NO ACTION;
