<?php

use data\{filename}_data;
use business\{filename};

require_once("autoload.php");
require_once("session.php");

if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    header('WWW-Authenticate: Basic realm="{projectname}"');
	header('HTTP/1.0 401 Unauthorized');
    include_once("http/error401.html");
	exit;
}

if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
	if (substr($_SERVER['HTTP_AUTHORIZATION'], 0, 5) == 'Basic') {

		//Get username and pasword from PHP $_SERVER global variable
		$g_username = strip_tags($_SERVER['PHP_AUTH_USER']);
		$g_password = strip_tags($_SERVER['PHP_AUTH_PW']);
		
		if ($g_username<>"admin" OR $g_password<>"admin") {
			header('WWW-Authenticate: Basic realm="{projectname}"');
			header('HTTP/1.0 401 Unauthorized');
			include_once("http/error401.html");
			return 0;
		}
	} else {
		header('WWW-Authenticate: Basic realm="{projectname}"');
		header('HTTP/1.0 401 Unauthorized');
		include_once("http/error401.html");
		return 0;
	}
} else {
	header('WWW-Authenticate: Basic realm="{projectname}"');
	header('HTTP/1.0 401 Unauthorized');
	include_once("http/error401.html");
	return 0;
}

$jsonraw = file_get_contents('php://input');
$post_request = json_decode($jsonraw);

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch ($requestMethod) {
	case "GET":
		if (isset($_GET['{filekeyname}'])) {
			//Single Record
			$DataClass = new {filename}_data();
			$RecordSet=$DataClass->Query("SELECT %1 FROM %2 WHERE {filekeyname}=" . $_GET['{filekeyname}']);

			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 200");

			$json_response = json_encode($RecordSet);
			echo $json_response;

			break;
		} else {
			
			//Query Records

			$zz=(int)0;
			$post_array=[];
			foreach($_GET as $key => $value) {  
				$zz++;
			}

			$DataClass = new {filename}_data();
			
			if ($zz==0) {
				$RecordSet=$DataClass->Query("SELECT %1 FROM %2 ORDER BY {filekeyname} ASC");
			} else {
				$clause=(string)"";
				$order_by=(string)"";
				$SQL="SELECT %1 FROM %2 ";
				foreach($_GET as $key => $value) {  
					if ($clause!=="") {
						$clause.=" AND ";
					}
					if ($key=="orderby") {
						$order_by=$value;
					} else {
						$clause.=$key . "='" . $value . "'";
					}
				}
				if ($clause!=="") {
					$SQL.="WHERE ";
				}
				if ($order_by=="") {
					$SQL.=$clause . " ORDER BY {filekeyname} ASC";
				} else {
					$SQL.=$clause . " ORDER BY " . $order_by;
				}
				$RecordSet=$DataClass->Query($SQL);
			}
			
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 200");

			$json_response = json_encode($RecordSet);
			echo $json_response;

			break;
		}
		break;
	case "POST":
		
        $DataClass = new {filename}_data();
        $RecordSet=$DataClass->Insert($post_request);

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");

        echo "ok;" . $RecordSet['id'];
        break;
	case "PATCH":
		
		if (!isset($_GET['{filekeyname}'])) {
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 404");
			break;
		}		
        
		$DataClass = new {filename}_data();
        $RecordSet=$DataClass->Update($_GET['{filekeyname}'], $post_request);

        header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 200");

        echo "ok";
		break;
	case "DELETE":
		
		if (!isset($_GET['{filekeyname}'])) {
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 404");
			break;
		}		
        
		$DataClass = new {filename}_data();
        
		if ($DataClass->Delete($_GET['{filekeyname}'])) {
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 200");
			echo "ok";
		} else {
			header("Content-Type:application/json; charset=utf-8");
			header("HTTP/1.1 200");
			echo "{filekeyname}: " . $_GET['{filekeyname}'] . " konnte nicht gefunden werden!";
		}
		break;
	default:
		header("Content-Type:application/json; charset=utf-8");
        header("HTTP/1.1 404");
		break;
}
