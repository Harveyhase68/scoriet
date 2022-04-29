-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Erstellungszeit: 20. Nov 2020 um 11:30
-- Server-Version: 5.7.21
-- PHP-Version: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `shop_extra`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(80) NOT NULL,
  `user_email` varchar(128) NOT NULL,
  `user_pass` varchar(255) DEFAULT NULL,
  `user_admin` tinyint(1) DEFAULT NULL,
  `user_joining_date` timestamp NULL DEFAULT NULL,
  `user_registration_ip` varchar(45) DEFAULT NULL,
  `user_email_confirmed` tinyint(1) DEFAULT NULL,
  `user_activation_key` varchar(36) DEFAULT NULL,
  `user_activation_key_created` timestamp NULL DEFAULT NULL,
  `user_password_forgot_key` varchar(36) DEFAULT NULL,
  `user_password_forgot_key_created` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `user_password_forgot_key` (`user_password_forgot_key`),
  KEY `admin` (`user_admin`)
) ENGINE=MyISAM AUTO_INCREMENT=190 DEFAULT CHARSET=utf8;

--
-- Daten für Tabelle `users`
--

INSERT INTO `users` (`user_id`, `user_name`, `user_email`, `user_pass`, `user_admin`, `user_joining_date`, `user_registration_ip`, `user_email_confirmed`, `user_activation_key`, `user_activation_key_created`, `user_password_forgot_key`, `user_password_forgot_key_created`) VALUES
(1, 'admin', 'office@scoriet.com', '21232f297a57a5a743894a0e4a801fc3', 1, '2018-10-11 06:51:29', NULL, 1, NULL, NULL, NULL, NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
