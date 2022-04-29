<?php
//****************************************************
// (c) 2014 Alexander Predl
// Systemhaus Predl IT GesmbH, A-2103 Langenzersdorf
//
// This code is not Freeware, you need a valid license
//
// DataMapper class (abstract, no direct use)
//
// abstract to all _data classes in folder /data
//****************************************************

namespace data;
use config\config, PDO;

error_reporting(E_ALL);
ini_set('display_errors', 'on');

abstract class DataMapper
{
	protected $db;
	
	public function __construct()
	{
		$user = "";
		$pass = "";
		$host = "";
		$db_name = "";
		$db_prefix = "";
		
		//Get the config class
		$db_cfg=new config;
		
		//MySQL Access, please do not edit this code by hand!
		$username=$db_cfg->db_username;
		$password=$db_cfg->db_password;
		$server=$db_cfg->db_server;
		$database=$db_cfg->db_database;
		$db_prefix=$db_cfg->db_table_prefix;
		
		try
		{
			$options = array(
			   PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'",
			   PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
			   //PDO::ATTR_ERRMODE => PDO::ERRMODE_SILENT,
			   //PDO::ATTR_ERRMODE => PDO::ERRMODE_WARNING,
			   PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
			   PDO::ATTR_PERSISTENT => true,
			   PDO::ATTR_AUTOCOMMIT => true,
			);
			$this->db = new PDO("mysql:host=$server;dbname=$database",$username,$password,$options);
		}
		catch(PDOException $err)
		{
			echo 'The connection could not be established.<br />'.$err->getMessage().'<br />'.strval($err->getCode()).'<br />'.$err->getFile().'<br />';
            echo $err->getTrace().'<br />'.strval($err->getLine()).'<br />'.$err->getPrevious();			
		}
	}
	public function dbprefix() 
	{ 
		return $this->db_prefix; 
	}
}
?>
