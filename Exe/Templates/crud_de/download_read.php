<?php

session_start();

error_reporting(E_ALL);
ini_set('error_reporting', E_ALL);
ini_set('display_errors', true);
ini_set('html_errors', true);
ini_set('error_prepend_string', '');
ini_set('error_append_string', '');

require_once("class.user.php");
require_once("config.php");

$login = new USER();

if (isset($_GET['email'])) {
    $umail = $_GET['email'];
    $uname = $_GET['email'];
} else {
    echo "error:email missing";
    exit;
}

if (isset($_GET['password'])) {
    $upass = $_GET['password'];
} else {
    echo "error:password missing";
    exit;
}

$ret = $login->doLoginPlain($uname, $umail, $upass);

if (substr($ret, 0, 1) == "1") {
    if ($_SESSION['user_admin'] == "1") {

        include_once('dbconfig.php');
        $database = new Database();
        $conn = $database->dbConnection();
        $pdo = $conn->prepare("SELECT {filekeyname} FROM {filename} ORDER BY {filekeyname} ASC");
        $pdo->execute();
        if (!$pdo) {
            echo "0;" . $pdo->errorInfo();
            exit;
		} else {
			$res = $pdo->fetchAll(\PDO::FETCH_ASSOC);
			$records = array();
			foreach($res as $zz => $db_records) {
				$records[$zz]=$db_records;
			}
			$json_response = json_encode($records);
			echo $json_response;
		}
        if ($pdo->rowCount() > 0) {
        } else {
			echo "0;" . $pdo->errorInfo();
			exit;
        }
    } else {
        echo "error:login wrong";
        exit;
    }
} else {
    echo "error:login wrong";
    exit;
}