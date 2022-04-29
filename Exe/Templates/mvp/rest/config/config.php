<?php
namespace config;

spl_autoload_extensions(".php");
spl_autoload_register();
error_reporting(E_ALL);

class config
{
  private $db_server;
	private $db_username;
	private $db_password;
	private $db_database;
	private $db_table_prefix;
	private $cfg_domain;
	private $cfg_url;
	private $cfg_path;
	private $cfg_relpath;
	private $cfg_templatepath;
	private $cfg_locale;
	private $cfg_defaultlanguage;
		
	public function __construct()
	{
		$this->db_server = "{projectdbserver}";
		$this->db_username = "{projectdbusername}";
		$this->db_password = "{projectdbpassword}";
		$this->db_database = "{projectdatabase}";
		$this->db_table_prefix = "";
		$this->cfg_domain = "{projectname}";
		
		//TODO: Hardcoded cfg, can be now stored in a database
		$this->cfg_url = "{projecturl}";
		$this->cfg_path = "/";
	$this->cfg_relpath = "{projectdirectory}";
		$this->cfg_templatepath = "template/";
		$this->cfg_locale = "/../locale/";
		$this->cfg_defaultlanguage = "en_EN";
	}
	public function __set($name, $value) {
		$this->$name = $value;
    }
    public function __get($name) {        
		return $this->$name;
    }
}
?>