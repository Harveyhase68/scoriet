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