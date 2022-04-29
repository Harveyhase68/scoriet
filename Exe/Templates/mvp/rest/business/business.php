<?php
//****************************************************
// (c) 2020 Alexander Predl - august 8. 2020
// Systemhaus Predl IT GesmbH, A-2103 Langenzersdorf
//
// {filename} class
//
// namespace business
// Structure for a data record
// Used by {filename}_data classes
//
//****************************************************

namespace business;

spl_autoload_extensions(".php");
spl_autoload_register();
error_reporting(E_ALL);

class {filename} {
	//All fields from {filename}
{for {nmaxitems}}
	private ${item.name}=NULL;
{endfor}
	
	//This part creates the array for each field
	public function __construct($param=array()) { 
		//All data fields for {filename}
{for {nmaxitems}}
		if (array_key_exists('{item.name}',$param)) {
			if (is_null($param['{item.name}'])) {$this->{item.name}=NULL;} else {$this->{item.name}={item.typecast}$param['{item.name}'];}
		} else {
			$this->{item.name}=(object)NULL;
		}
{endfor}
	} 
	
	public function __set($name, $value) {
		if (is_object($value)) {
			$this->$name = $value;
		} else {
			switch ($name) {
{for {nmaxitems}}
				case '{item.name}': if (is_null($value)) {$this->$name = NULL;} else {$this->$name = {item.typecast}$value;} break;
{endfor}
			}
		}
    }
	
    public function __get($name) {        
		return $this->$name;
    }
}
?>
