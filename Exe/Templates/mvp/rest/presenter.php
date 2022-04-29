<?php

session_start();

error_reporting(E_ALL);
ini_set('display_errors', 'on');

use data\{filename}_data;
use business\{filename};

spl_autoload_extensions(".php");
spl_autoload_register(function ($name) {
	$fileName = __DIR__.DIRECTORY_SEPARATOR.str_replace('\\', DIRECTORY_SEPARATOR, $name).'.php';
 
	if (file_exists($fileName)) {
		require_once $fileName;
	}
});

$jsonraw = file_get_contents('php://input');
$post_request = json_decode($jsonraw);

if (isset($_GET['getall'])) {
    $method='getall';
} elseif (isset($_GET['get'])) {
    $method='get';
} elseif (isset($_GET['update'])) {
    $method='update';
} elseif (isset($_GET['insert'])) {
    $method='insert';
} elseif (isset($_GET['getmaxid'])) {
    $method='getmaxid';
} elseif (isset($_GET['delete'])) {
    $method='delete';
} else {
    $method='fetchall';
}

switch ($method) {
    case "getall":
        $DataClass = new {filename}_data();
		if (isset($post_request->select)) {
			$RecordSet=$DataClass->Query($post_request->select);
		} else {
			$RecordSet=$DataClass->Query("SELECT %1 FROM %2 ORDER BY {filekeyname} ASC");
		}

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");

        $json_response = json_encode($RecordSet);
        echo $json_response;

        break;
    case "get":
        $DataClass = new {filename}_data();
        $RecordSet=$DataClass->Query("SELECT %1 FROM %2 WHERE {filekeyname}=" . $post_request->{filekeyname} . " ORDER BY {filekeyname} ASC");

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");

        $json_response = json_encode($RecordSet);
        echo $json_response;

        break;
    case "update":
        $DataClass = new {filename}_data();
        $RecordSet=$DataClass->Update($post_request);

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");

        echo "ok";
        break;
    case "insert":
        $DataClass = new {filename}_data(false);
        $RecordSet=$DataClass->Insert($post_request);

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");

        echo "ok;" . $RecordSet['id'];
        break;
    case "getmaxid":
        $DataClass = new {filename}_data();
        $RecordSet=$DataClass->GetLastID();

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");
        echo $RecordSet;
        break;
    case "delete":
        $DataClass = new {filename}_data();
        if ($DataClass->Delete($post_request)) {
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 200");
			echo "ok";
		} else {
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 200");
			echo "{filename} konnte nicht gefunden werden!";
		}
        break;
    default:
		header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 404");
		break;
}

