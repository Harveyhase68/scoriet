<?php
//****************************************************
// (c) 2020 Alexander Predl - august 8. 2020
// Systemhaus Predl IT GesmbH, A-2103 Langenzersdorf
//
// MySQL wrapper for data access
//
// {filename} class
//
// namespace data
// use of {filename} in folder /business
//
// use of DataMapper in folder /data
//
// This class can be used direct
//
//****************************************************

namespace data;

use business\{filename};

error_reporting(E_ALL);
ini_set('display_errors', 'on');

class {filename}_data extends DataMapper
{
	private $LastId=null;
	private $LastRowCount=null;
	private $NoCommit=false;
	
	function __construct($SetNoCommit=false) {
	   $this->NoCommit=$SetNoCommit;
       parent::__construct();
    }
	
	// Query special, always use %1 for placeholder for the fields!!! otherwise an error occur! %2 placeholder for {filename}
	public function Query($query){
		// Purpose: execute a query
		// Example:
		// $DataClass = new {filename}_data;
		// $RecordSet=$DataClass->Query("SELECT %1 FROM %2");
		// NEVER USE: Query("SELECT item1,item2 FROM file") in this case please use your own \PDO query!
		// Return: a array of {filename} see /business
		// Use: echo $RecordSet[0]['item'];
		// foreach ($RecordSet as $Record) {
		//   echo $Record['item'];
		// }
		//ORDER BY, LIMIT and WHERE are as is!!
		try{
			$query=str_replace("%1","{for {nmaxitems}}{item.name}{if nCountItems<{nmaxitems}},{endif}{endfor}",$query);
			$query=str_replace("%2","{filename}",$query);
			$stmt = $this->db->query($query);
			$res = $stmt->fetchAll(\PDO::FETCH_ASSOC);
			$records = array();
			foreach($res as $zz => $db_records) {
				$records[$zz]=$db_records;
{for {nmaxitems}}
{switch {item.type}}
{case 21,22,23}
				if (isset($records[$zz]['{item.name}'])) {
					$records[$zz]['{item.name}']=sodium_bin2base64($records[$zz]['{item.name}'],7);
				}
{case 24,25,26,27,28,29}
				if (isset($records[$zz]['{item.name}'])) {
					$records[$zz]['{item.name}']=sodium_bin2base64($records[$zz]['{item.name}'],7);
				}
{endswitch}
{endfor}
			}
			$this->LastRowCount = $stmt->rowCount();
			return $records;
		}
		catch(Exception $e){
			echo 'Fehler: '.$e->getMessage();
		}		
	}
	
	// Insert a record
	public function Insert($au){
		// Purpose: insert records in the database
		// Insert need a array for $au for each {filename} class, even you only insert one record!
		// Example:
		// $DataClass = new {filename}_data;
		// $RecordSet=array();
		// $RecordSet[] = new {filename}(array());
		// $RetArr=$DataClass->Insert($RecordSet);
		// Return: associative array 'Count' and 'Insert' count of whole count, inserts ie var_dump($RetArr); or echo $RetArr['Count'];
		$nInsert=(int)0;
		try{
			$QueryInsert = "INSERT INTO `{filename}` ({for {nmaxitemsnokey}}{item.name}{if nCountItemsNoKey<{nmaxitemsnokey}},{endif}{endfor})
							VALUES ({for {nmaxitemsnokey}}:SP_{item.name}{if nCountItemsNoKey<{nmaxitemsnokey}},{endif}{endfor})";
			foreach ($au as $row) {
				$nInsert++;
				$StmtInsert = $this->db->prepare($QueryInsert);
{for {nmaxitemsnokey}}
{switch {item.type}}
{case 21,22,23}
				$StmtInsert->bindValue(':SP_{item.name}',sodium_bin2base64($row->{item.name}),7);
{case 24,25,26,27,28,29}
				$StmtInsert->bindValue(':SP_{item.name}',sodium_bin2base64($row->{item.name}),7);
{othercase}				$StmtInsert->bindValue(':SP_{item.name}',$row->{item.name});
{endswitch}
{endfor}
				if (!$this->NoCommit) {
					$this->db->beginTransaction();
				}
				$StmtInsert->execute();
				$this->LastId = $this->db->lastInsertId();
				if (!$this->NoCommit) {
					$this->db->commit();
				}
			}
			return array("Count"=>(int)$nInsert,"id"=>(int)$this->LastId);
		}
		catch(Exception $e){
			if (!$this->NoCommit) {
				$this->db->rollback();
			}
			echo 'Fehler: '.$e->getMessage();
		}		
	}

	// Update a record
	public function Update($au){
		// Purpose: update records in the database
		// Insert need a array for $au for each {filename} class, even you only update one record!
		// Example:
		// $DataClass = new {filename};
		// $RecordSet=array();
		// $RecordSet[] = new {filename}(array());
		// $RetArr=$DataClass->Update($RecordSet);
		// Return: associative array 'Count' and 'Update' count of whole count or updates ie var_dump($RetArr); or echo $RetArr['Count'];
		$nUpdate=(int)0;
		try{
			$QueryUpdate  = "UPDATE `{filename}` SET ";
{for {nmaxitemsnokeyall}}
			if (isset($au[0]->{item.name})) {
				$QueryUpdate .= "`{item.name}`=:SP_{item.name},";
			}
{endfor}
			//Remove last ,
			$QueryUpdate=substr($QueryUpdate,0,-1);
			$QueryUpdate .= " WHERE {filekeyname} = :SP_keyname";
			foreach ($au as $row) {
				$nUpdate++;
				$StmtUpdate = $this->db->prepare($QueryUpdate);
{for {nmaxitemsnokeyall}}
				if (isset($au[0]->{item.name})) {
{switch {item.type}}
{case 21,22,23}
					$StmtUpdate->bindValue(':SP_{item.name}',sodium_bin2base64($row->{item.name}),7);
{case 24,25,26,27,28,29}
					$StmtUpdate->bindValue(':SP_{item.name}',sodium_bin2base64($row->{item.name}),7);
{othercase}					$StmtUpdate->bindValue(':SP_{item.name}',$row->{item.name});
{endswitch}
				}
{endfor}
				$StmtUpdate->bindValue(':SP_keyname',$row->{filekeyname});
				if (!$this->NoCommit) {
					$this->db->beginTransaction();
				}
				$StmtUpdate->execute();
				if (!$this->NoCommit) {
					$this->db->commit();
				}
			}
			return array("Count"=>(int)$nUpdate);
		}
		catch(Exception $e){
			if (!$this->NoCommit) {
				$this->db->rollback();
			}
			echo 'Fehler: '.$e->getMessage();
		}		
	}

	public function Delete($au){
		//Purpose: delete a record, found by key defined in the project!!
		//Example:
		//$aut=array();
		//$new->Delete(1);
		//Return: true/false
		$nDelete=(int)0;
		try{
			$QueryDelete = "DELETE FROM 
								`{filename}`
							WHERE 
								{filekeyname} = :SP_keyname";
			foreach ($au as $row) {
				$nDelete++;
				$StmtDelete = $this->db->prepare($QueryDelete);
				$StmtDelete->bindValue(':SP_keyname',$row->{filekeyname});
				if (!$this->NoCommit) {
					$this->db->beginTransaction();
				}
				$StmtDelete->execute();
				if (!$this->NoCommit) {
					$this->db->commit();
				}
				if ($StmtDelete->rowCount() == 0) {
					return false;
				}
			}
			$this->LastRowCount = $nDelete;
			return true;
		}
		catch(Exception $e) {
			throw new Exception("Fehler: " . $e->getMessage());
			//echo 'Fehler: '.$e->getMessage();
			return false;
		}		
	}
	
	public function DeleteAll(){
		//Purpose: delete all records
		//Example:
		//$aut=array();
		//$new->DeleteAll();
		//Return: true/false
		try{
			$query = 'DELETE FROM `{filename}`';
			$stmt = $this->db->query($query);
			if ((int)$stmt->rowCount() == 0) {
				return false;
			} else {
				$this->LastRowCount = $stmt->rowCount();
				return true;
			}
		}
		catch(Exception $e)
		{
			echo 'Fehler: '.$e->getMessage();
			return false;
		}		
	}

    public function GetLastID(){
        // Purpose: get last id of the file
        // Example:
        // $DataClass = new {filename}_data;
        // $RecordSet=$DataClass->GetLastID();
        try{
            $query="SELECT {filekeyname} FROM `{filename}` ORDER BY {filekeyname} DESC LIMIT 1";
            $stmt = $this->db->query($query);
            $res = $stmt->fetch();
            return $res['{filekeyname}'];
        }
        catch(Exception $e){
            echo 'Fehler: '.$e->getMessage();
        }
    }

	public function StartTransaction(){
		//Purpose: Start Transaction
		//Example:
		//$new->StartTransaction();
		//Return: true/false
		try{
			$this->db->beginTransaction();
			return true;
		}
		catch(Exception $e)
		{
			throw new Exception("Fehler: " . $e->getMessage());
			return false;
		}		
	}
	
	public function CommitTransaction(){
		//Purpose: Commit Transaction
		//Example:
		//$new->CommitTransaction();
		//Return: true/false
		try{
			$this->db->commit();
			return true;
		}
		catch(Exception $e)
		{
			throw new Exception("Fehler: " . $e->getMessage());
			return false;
		}		
	}
	
	public function RollbackTransaction(){
		//Purpose: Rollback Transaction
		//Example:
		//$new->RollbackTransaction();
		//Return: true/false
		try{
			$this->db->rollback();
			return true;
		} catch(Exception $e) {
			throw new Exception("Fehler: " . $e->getMessage());
			return false;
		}		
	}
	
	public function ExecSQL($SQL){
		//Purpose: Execute a generic SQL
		//Example:
		//$new->ExecSQL("UPDATE XY SET(A=1);");
		//Return: true/false
		try{
			$stmt = $this->db->query($SQL);
			$result[]=$stmt->fetch(\PDO::FETCH_ASSOC);
			return $result;
		}
		catch(Exception $e)
		{
			echo 'Fehler: '.$e->getMessage();
			return false;
		}		
	}

	public function __set($name, $value) {
		$this->$name = $value;
    }
	
    public function __get($name) {        
		return $this->$name;
    }
}
?>
