<?php

class Database
{
    public $conn;
    private $host = "{projectdbserver}";
    private $db_name = "{projectdatabase}";
    private $username = "{projectdbusername}";
    private $password = "{projectdbpassword}";
    private $options = array(
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'",
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        //PDO::ATTR_ERRMODE => PDO::ERRMODE_SILENT,
        //PDO::ATTR_ERRMODE => PDO::ERRMODE_WARNING,
        PDO::ATTR_PERSISTENT => true,
        PDO::ATTR_AUTOCOMMIT => true,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    );

    public function dbConnection()
    {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password, $this->options);
        } catch (PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
    public function disconnect()
    {
        $this->conn = null;
    }
}

?>