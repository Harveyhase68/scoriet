<?php
class Database 
{
	private static $dbName = '{projectdatabase}' ; 
	private static $dbHost = '{projectdbserver}' ;
	private static $dbUsername = '{projectdbusername}';
	private static $dbUserPassword = '{projectdbpassword}';
	private static $cont  = null;
  private static $options = array(
                 PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'",
                 PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                 //PDO::ATTR_ERRMODE => PDO::ERRMODE_SILENT,
                 //PDO::ATTR_ERRMODE => PDO::ERRMODE_WARNING,
                 PDO::ATTR_PERSISTENT => true,
                 PDO::ATTR_AUTOCOMMIT => true,
              );
	
	public function __construct() {
		exit('Init function is not allowed');
	}
	
	public static function connect()
	{
	   // One connection through whole application
       if ( null == self::$cont )
       {      
        try 
        {
          self::$cont =  new PDO( "mysql:host=".self::$dbHost.";"."dbname=".self::$dbName, self::$dbUsername, self::$dbUserPassword, self::$options);  
          self::$cont->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        }
        catch(PDOException $err) 
        {
          echo 'The connection could not be established.<br />'.$err->getMessage().'<br />'.strval($err->getCode()).'<br />'.$err->getFile().'<br />';
          echo $err->getTrace().'<br />'.strval($err->getLine()).'<br />'.$err->getPrevious();			
        }
       } 
       return self::$cont;
	}
	
	public static function disconnect()
	{
		self::$cont = null;
	}
}
?>