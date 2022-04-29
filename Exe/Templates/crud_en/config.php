<?php
error_reporting(E_ALL);
ini_set('error_reporting', E_ALL);
ini_set('display_errors', true);
ini_set('display_startup_errors', true);
ini_set('html_errors', true);
ini_set('error_prepend_string', '');
ini_set('error_append_string', '');

define('WEB_ADDRESS', '{projecturl}');
define('OFFLINE', false);
define('REGISTER_OFFLINE', false);
define('USER_CAN_REGISTER', true);
define('COMPANY', 'Company XXX');
define('COMPANY_HEADER', '<a class="navbar-brand" href="#">{projectname}</a>');
//define('COMPANY_HEADER', '<img src="' . WEB_ADDRESS . '/images/header.png">');
define('COMPANY_EMAIL', 'office@predl.cc');
define('COMPANY_TOOLBAR', '<a class="navbar-brand" href="#">{projectname}</a>');
//define('COMPANY_TOOLBAR', '<a href="' . WEB_ADDRESS . '"><img src="' . WEB_ADDRESS . '/images/toolbar_header.png"></a>');
define('IMPRESSUM', '<a href="' . WEB_ADDRESS . '/impressum.php">Impressum</a>');
define('FOOTER', 'Website by &copy;2020 <a href="http://www.syspredl.com">Systemhaus Predl IT-GesmbH</a>');
define('EMAILDEBUG', false);