-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20251030.ec4c083182
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 03. Dez 2025 um 09:23
-- Server-Version: 8.4.7
-- PHP-Version: 8.4.14

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `sakila`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `actor`
--

CREATE TABLE `actor` (
  `actor_id` smallint UNSIGNED NOT NULL,
  `first_name` varchar(45) NOT NULL,
  `last_name` varchar(45) NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `actor_info`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `actor_info` (
`actor_id` smallint unsigned
,`first_name` varchar(45)
,`last_name` varchar(45)
,`film_info` text
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `address`
--

CREATE TABLE `address` (
  `address_id` smallint UNSIGNED NOT NULL,
  `address` varchar(50) NOT NULL,
  `address2` varchar(50) DEFAULT NULL,
  `district` varchar(20) NOT NULL,
  `city_id` smallint UNSIGNED NOT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `location` longtext NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `category`
--

CREATE TABLE `category` (
  `category_id` tinyint UNSIGNED NOT NULL,
  `name` varchar(25) NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `city`
--

CREATE TABLE `city` (
  `city_id` smallint UNSIGNED NOT NULL,
  `city` varchar(50) NOT NULL,
  `country_id` smallint UNSIGNED NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `country`
--

CREATE TABLE `country` (
  `country_id` smallint UNSIGNED NOT NULL,
  `country` varchar(50) NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `customer`
--

CREATE TABLE `customer` (
  `customer_id` smallint UNSIGNED NOT NULL,
  `store_id` tinyint UNSIGNED NOT NULL,
  `first_name` varchar(45) NOT NULL,
  `last_name` varchar(45) NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `address_id` smallint UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `create_date` datetime NOT NULL,
  `last_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Trigger `customer`
--
DELIMITER $$
CREATE TRIGGER `customer_create_date` BEFORE INSERT ON `customer` FOR EACH ROW SET NEW.create_date = NOW()
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `customer_list`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `customer_list` (
`ID` smallint unsigned
,`name` varchar(91)
,`address` varchar(50)
,`zip code` varchar(10)
,`phone` varchar(20)
,`city` varchar(50)
,`country` varchar(50)
,`notes` varchar(6)
,`SID` tinyint unsigned
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `film`
--

CREATE TABLE `film` (
  `film_id` smallint UNSIGNED NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` text,
  `release_year` year DEFAULT NULL,
  `language_id` tinyint UNSIGNED NOT NULL,
  `original_language_id` tinyint UNSIGNED DEFAULT NULL,
  `rental_duration` tinyint UNSIGNED NOT NULL DEFAULT '3',
  `rental_rate` decimal(4,2) NOT NULL DEFAULT '4.99',
  `length` smallint UNSIGNED DEFAULT NULL,
  `replacement_cost` decimal(5,2) NOT NULL DEFAULT '19.99',
  `rating` enum('G','PG','PG-13','R','NC-17') DEFAULT 'G',
  `special_features` set('Trailers','Commentaries','Deleted Scenes','Behind the Scenes') DEFAULT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Trigger `film`
--
DELIMITER $$
CREATE TRIGGER `del_film` AFTER DELETE ON `film` FOR EACH ROW BEGIN
    DELETE FROM film_text WHERE film_id = old.film_id;
  END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `ins_film` AFTER INSERT ON `film` FOR EACH ROW BEGIN
    INSERT INTO film_text (film_id, title, description)
        VALUES (new.film_id, new.title, new.description);
  END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `upd_film` AFTER UPDATE ON `film` FOR EACH ROW BEGIN
    IF (old.title != new.title) OR (old.description != new.description) OR (old.film_id != new.film_id)
    THEN
        UPDATE film_text
            SET title=new.title,
                description=new.description,
                film_id=new.film_id
        WHERE film_id=old.film_id;
    END IF;
  END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `film_actor`
--

CREATE TABLE `film_actor` (
  `actor_id` smallint UNSIGNED NOT NULL,
  `film_id` smallint UNSIGNED NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `film_category`
--

CREATE TABLE `film_category` (
  `film_id` smallint UNSIGNED NOT NULL,
  `category_id` tinyint UNSIGNED NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `film_list`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `film_list` (
`FID` smallint unsigned
,`title` varchar(128)
,`description` text
,`category` varchar(25)
,`price` decimal(4,2)
,`length` smallint unsigned
,`rating` enum('G','PG','PG-13','R','NC-17')
,`actors` text
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `film_text`
--

CREATE TABLE `film_text` (
  `film_id` smallint NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` mediumint UNSIGNED NOT NULL,
  `film_id` smallint UNSIGNED NOT NULL,
  `store_id` tinyint UNSIGNED NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `language`
--

CREATE TABLE `language` (
  `language_id` tinyint UNSIGNED NOT NULL,
  `name` char(20) NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `nicer_but_slower_film_list`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `nicer_but_slower_film_list` (
`FID` smallint unsigned
,`title` varchar(128)
,`description` text
,`category` varchar(25)
,`price` decimal(4,2)
,`length` smallint unsigned
,`rating` enum('G','PG','PG-13','R','NC-17')
,`actors` text
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `payment`
--

CREATE TABLE `payment` (
  `payment_id` smallint UNSIGNED NOT NULL,
  `customer_id` smallint UNSIGNED NOT NULL,
  `staff_id` tinyint UNSIGNED NOT NULL,
  `rental_id` int DEFAULT NULL,
  `amount` decimal(5,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `last_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Trigger `payment`
--
DELIMITER $$
CREATE TRIGGER `payment_date` BEFORE INSERT ON `payment` FOR EACH ROW SET NEW.payment_date = NOW()
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `rental`
--

CREATE TABLE `rental` (
  `rental_id` int NOT NULL,
  `rental_date` datetime NOT NULL,
  `inventory_id` mediumint UNSIGNED NOT NULL,
  `customer_id` smallint UNSIGNED NOT NULL,
  `return_date` datetime DEFAULT NULL,
  `staff_id` tinyint UNSIGNED NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Trigger `rental`
--
DELIMITER $$
CREATE TRIGGER `rental_date` BEFORE INSERT ON `rental` FOR EACH ROW SET NEW.rental_date = NOW()
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `sales_by_film_category`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `sales_by_film_category` (
`category` varchar(25)
,`total_sales` decimal(27,2)
);

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `sales_by_store`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `sales_by_store` (
`store` varchar(101)
,`manager` varchar(91)
,`total_sales` decimal(27,2)
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `staff`
--

CREATE TABLE `staff` (
  `staff_id` tinyint UNSIGNED NOT NULL,
  `first_name` varchar(45) NOT NULL,
  `last_name` varchar(45) NOT NULL,
  `address_id` smallint UNSIGNED NOT NULL,
  `picture` blob,
  `email` varchar(50) DEFAULT NULL,
  `store_id` tinyint UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `username` varchar(16) NOT NULL,
  `password` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stellvertreter-Struktur des Views `staff_list`
-- (Siehe unten für die tatsächliche Ansicht)
--
CREATE TABLE `staff_list` (
`ID` tinyint unsigned
,`name` varchar(91)
,`address` varchar(50)
,`zip code` varchar(10)
,`phone` varchar(20)
,`city` varchar(50)
,`country` varchar(50)
,`SID` tinyint unsigned
);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `store`
--

CREATE TABLE `store` (
  `store_id` tinyint UNSIGNED NOT NULL,
  `manager_staff_id` tinyint UNSIGNED NOT NULL,
  `address_id` smallint UNSIGNED NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `actor`
--
ALTER TABLE `actor`
  ADD PRIMARY KEY (`actor_id`),
  ADD KEY `idx_actor_last_name` (`last_name`);

--
-- Indizes für die Tabelle `address`
--
ALTER TABLE `address`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `idx_fk_city_id` (`city_id`);

--
-- Indizes für die Tabelle `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indizes für die Tabelle `city`
--
ALTER TABLE `city`
  ADD PRIMARY KEY (`city_id`),
  ADD KEY `idx_fk_country_id` (`country_id`);

--
-- Indizes für die Tabelle `country`
--
ALTER TABLE `country`
  ADD PRIMARY KEY (`country_id`);

--
-- Indizes für die Tabelle `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `idx_fk_store_id` (`store_id`),
  ADD KEY `idx_fk_address_id` (`address_id`),
  ADD KEY `idx_last_name` (`last_name`);

--
-- Indizes für die Tabelle `film`
--
ALTER TABLE `film`
  ADD PRIMARY KEY (`film_id`),
  ADD KEY `idx_title` (`title`),
  ADD KEY `idx_fk_language_id` (`language_id`),
  ADD KEY `idx_fk_original_language_id` (`original_language_id`);

--
-- Indizes für die Tabelle `film_actor`
--
ALTER TABLE `film_actor`
  ADD PRIMARY KEY (`actor_id`,`film_id`),
  ADD KEY `idx_fk_film_id` (`film_id`);

--
-- Indizes für die Tabelle `film_category`
--
ALTER TABLE `film_category`
  ADD PRIMARY KEY (`film_id`,`category_id`),
  ADD KEY `fk_film_category_category` (`category_id`);

--
-- Indizes für die Tabelle `film_text`
--
ALTER TABLE `film_text`
  ADD PRIMARY KEY (`film_id`);
ALTER TABLE `film_text` ADD FULLTEXT KEY `idx_title_description` (`title`,`description`);

--
-- Indizes für die Tabelle `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `idx_fk_film_id` (`film_id`),
  ADD KEY `idx_store_id_film_id` (`store_id`,`film_id`);

--
-- Indizes für die Tabelle `language`
--
ALTER TABLE `language`
  ADD PRIMARY KEY (`language_id`);

--
-- Indizes für die Tabelle `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_fk_staff_id` (`staff_id`),
  ADD KEY `idx_fk_customer_id` (`customer_id`),
  ADD KEY `fk_payment_rental` (`rental_id`);

--
-- Indizes für die Tabelle `rental`
--
ALTER TABLE `rental`
  ADD PRIMARY KEY (`rental_id`),
  ADD UNIQUE KEY `rental_date` (`rental_date`,`inventory_id`,`customer_id`),
  ADD KEY `idx_fk_inventory_id` (`inventory_id`),
  ADD KEY `idx_fk_customer_id` (`customer_id`),
  ADD KEY `idx_fk_staff_id` (`staff_id`);

--
-- Indizes für die Tabelle `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `idx_fk_store_id` (`store_id`),
  ADD KEY `idx_fk_address_id` (`address_id`);

--
-- Indizes für die Tabelle `store`
--
ALTER TABLE `store`
  ADD PRIMARY KEY (`store_id`),
  ADD UNIQUE KEY `idx_unique_manager` (`manager_staff_id`),
  ADD KEY `idx_fk_address_id` (`address_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `actor`
--
ALTER TABLE `actor`
  MODIFY `actor_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=201;

--
-- AUTO_INCREMENT für Tabelle `address`
--
ALTER TABLE `address`
  MODIFY `address_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=606;

--
-- AUTO_INCREMENT für Tabelle `category`
--
ALTER TABLE `category`
  MODIFY `category_id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT für Tabelle `city`
--
ALTER TABLE `city`
  MODIFY `city_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=601;

--
-- AUTO_INCREMENT für Tabelle `country`
--
ALTER TABLE `country`
  MODIFY `country_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT für Tabelle `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=600;

--
-- AUTO_INCREMENT für Tabelle `film`
--
ALTER TABLE `film`
  MODIFY `film_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1001;

--
-- AUTO_INCREMENT für Tabelle `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` mediumint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4582;

--
-- AUTO_INCREMENT für Tabelle `language`
--
ALTER TABLE `language`
  MODIFY `language_id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT für Tabelle `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16050;

--
-- AUTO_INCREMENT für Tabelle `rental`
--
ALTER TABLE `rental`
  MODIFY `rental_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16050;

--
-- AUTO_INCREMENT für Tabelle `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT für Tabelle `store`
--
ALTER TABLE `store`
  MODIFY `store_id` tinyint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

-- --------------------------------------------------------

--
-- Struktur des Views `actor_info`
--
DROP TABLE IF EXISTS `actor_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY INVOKER VIEW `actor_info`  AS SELECT `a`.`actor_id` AS `actor_id`, `a`.`first_name` AS `first_name`, `a`.`last_name` AS `last_name`, group_concat(distinct concat(`c`.`name`,': ',(select group_concat(`f`.`title` order by `f`.`title` ASC separator ', ') from ((`film` `f` join `film_category` `fc` on((`f`.`film_id` = `fc`.`film_id`))) join `film_actor` `fa` on((`f`.`film_id` = `fa`.`film_id`))) where ((`fc`.`category_id` = `c`.`category_id`) and (`fa`.`actor_id` = `a`.`actor_id`)))) order by `c`.`name` ASC separator '; ') AS `film_info` FROM (((`actor` `a` left join `film_actor` `fa` on((`a`.`actor_id` = `fa`.`actor_id`))) left join `film_category` `fc` on((`fa`.`film_id` = `fc`.`film_id`))) left join `category` `c` on((`fc`.`category_id` = `c`.`category_id`))) GROUP BY `a`.`actor_id`, `a`.`first_name`, `a`.`last_name` ;

-- --------------------------------------------------------

--
-- Struktur des Views `customer_list`
--
DROP TABLE IF EXISTS `customer_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `customer_list`  AS SELECT `cu`.`customer_id` AS `ID`, concat(`cu`.`first_name`,_utf8mb4' ',`cu`.`last_name`) AS `name`, `a`.`address` AS `address`, `a`.`postal_code` AS `zip code`, `a`.`phone` AS `phone`, `city`.`city` AS `city`, `country`.`country` AS `country`, if(`cu`.`active`,_utf8mb4'active',_utf8mb4'') AS `notes`, `cu`.`store_id` AS `SID` FROM (((`customer` `cu` join `address` `a` on((`cu`.`address_id` = `a`.`address_id`))) join `city` on((`a`.`city_id` = `city`.`city_id`))) join `country` on((`city`.`country_id` = `country`.`country_id`))) ;

-- --------------------------------------------------------

--
-- Struktur des Views `film_list`
--
DROP TABLE IF EXISTS `film_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `film_list`  AS SELECT `film`.`film_id` AS `FID`, `film`.`title` AS `title`, `film`.`description` AS `description`, `category`.`name` AS `category`, `film`.`rental_rate` AS `price`, `film`.`length` AS `length`, `film`.`rating` AS `rating`, group_concat(concat(`actor`.`first_name`,_utf8mb4' ',`actor`.`last_name`) separator ', ') AS `actors` FROM ((((`category` left join `film_category` on((`category`.`category_id` = `film_category`.`category_id`))) left join `film` on((`film_category`.`film_id` = `film`.`film_id`))) join `film_actor` on((`film`.`film_id` = `film_actor`.`film_id`))) join `actor` on((`film_actor`.`actor_id` = `actor`.`actor_id`))) GROUP BY `film`.`film_id`, `category`.`name` ;

-- --------------------------------------------------------

--
-- Struktur des Views `nicer_but_slower_film_list`
--
DROP TABLE IF EXISTS `nicer_but_slower_film_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `nicer_but_slower_film_list`  AS SELECT `film`.`film_id` AS `FID`, `film`.`title` AS `title`, `film`.`description` AS `description`, `category`.`name` AS `category`, `film`.`rental_rate` AS `price`, `film`.`length` AS `length`, `film`.`rating` AS `rating`, group_concat(concat(concat(upper(substr(`actor`.`first_name`,1,1)),lower(substr(`actor`.`first_name`,2,length(`actor`.`first_name`))),_utf8mb4' ',concat(upper(substr(`actor`.`last_name`,1,1)),lower(substr(`actor`.`last_name`,2,length(`actor`.`last_name`)))))) separator ', ') AS `actors` FROM ((((`category` left join `film_category` on((`category`.`category_id` = `film_category`.`category_id`))) left join `film` on((`film_category`.`film_id` = `film`.`film_id`))) join `film_actor` on((`film`.`film_id` = `film_actor`.`film_id`))) join `actor` on((`film_actor`.`actor_id` = `actor`.`actor_id`))) GROUP BY `film`.`film_id`, `category`.`name` ;

-- --------------------------------------------------------

--
-- Struktur des Views `sales_by_film_category`
--
DROP TABLE IF EXISTS `sales_by_film_category`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `sales_by_film_category`  AS SELECT `c`.`name` AS `category`, sum(`p`.`amount`) AS `total_sales` FROM (((((`payment` `p` join `rental` `r` on((`p`.`rental_id` = `r`.`rental_id`))) join `inventory` `i` on((`r`.`inventory_id` = `i`.`inventory_id`))) join `film` `f` on((`i`.`film_id` = `f`.`film_id`))) join `film_category` `fc` on((`f`.`film_id` = `fc`.`film_id`))) join `category` `c` on((`fc`.`category_id` = `c`.`category_id`))) GROUP BY `c`.`name` ORDER BY `total_sales` DESC ;

-- --------------------------------------------------------

--
-- Struktur des Views `sales_by_store`
--
DROP TABLE IF EXISTS `sales_by_store`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `sales_by_store`  AS SELECT concat(`c`.`city`,_utf8mb4',',`cy`.`country`) AS `store`, concat(`m`.`first_name`,_utf8mb4' ',`m`.`last_name`) AS `manager`, sum(`p`.`amount`) AS `total_sales` FROM (((((((`payment` `p` join `rental` `r` on((`p`.`rental_id` = `r`.`rental_id`))) join `inventory` `i` on((`r`.`inventory_id` = `i`.`inventory_id`))) join `store` `s` on((`i`.`store_id` = `s`.`store_id`))) join `address` `a` on((`s`.`address_id` = `a`.`address_id`))) join `city` `c` on((`a`.`city_id` = `c`.`city_id`))) join `country` `cy` on((`c`.`country_id` = `cy`.`country_id`))) join `staff` `m` on((`s`.`manager_staff_id` = `m`.`staff_id`))) GROUP BY `s`.`store_id` ORDER BY `cy`.`country` ASC, `c`.`city` ASC ;

-- --------------------------------------------------------

--
-- Struktur des Views `staff_list`
--
DROP TABLE IF EXISTS `staff_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `staff_list`  AS SELECT `s`.`staff_id` AS `ID`, concat(`s`.`first_name`,_utf8mb4' ',`s`.`last_name`) AS `name`, `a`.`address` AS `address`, `a`.`postal_code` AS `zip code`, `a`.`phone` AS `phone`, `city`.`city` AS `city`, `country`.`country` AS `country`, `s`.`store_id` AS `SID` FROM (((`staff` `s` join `address` `a` on((`s`.`address_id` = `a`.`address_id`))) join `city` on((`a`.`city_id` = `city`.`city_id`))) join `country` on((`city`.`country_id` = `country`.`country_id`))) ;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `address`
--
ALTER TABLE `address`
  ADD CONSTRAINT `fk_address_city` FOREIGN KEY (`city_id`) REFERENCES `city` (`city_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `city`
--
ALTER TABLE `city`
  ADD CONSTRAINT `fk_city_country` FOREIGN KEY (`country_id`) REFERENCES `country` (`country_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `customer`
--
ALTER TABLE `customer`
  ADD CONSTRAINT `fk_customer_address` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_customer_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`store_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `film`
--
ALTER TABLE `film`
  ADD CONSTRAINT `fk_film_language` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_film_language_original` FOREIGN KEY (`original_language_id`) REFERENCES `language` (`language_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `film_actor`
--
ALTER TABLE `film_actor`
  ADD CONSTRAINT `fk_film_actor_actor` FOREIGN KEY (`actor_id`) REFERENCES `actor` (`actor_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_film_actor_film` FOREIGN KEY (`film_id`) REFERENCES `film` (`film_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `film_category`
--
ALTER TABLE `film_category`
  ADD CONSTRAINT `fk_film_category_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_film_category_film` FOREIGN KEY (`film_id`) REFERENCES `film` (`film_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `fk_inventory_film` FOREIGN KEY (`film_id`) REFERENCES `film` (`film_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`store_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_rental` FOREIGN KEY (`rental_id`) REFERENCES `rental` (`rental_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `rental`
--
ALTER TABLE `rental`
  ADD CONSTRAINT `fk_rental_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rental_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`inventory_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rental_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `fk_staff_address` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_staff_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`store_id`) ON UPDATE CASCADE;

--
-- Constraints der Tabelle `store`
--
ALTER TABLE `store`
  ADD CONSTRAINT `fk_store_address` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_store_staff` FOREIGN KEY (`manager_staff_id`) REFERENCES `staff` (`staff_id`) ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
