<?php

require_once("session.php");
require_once("class.user.php");
require_once("config.php");
include_once('dbconfig.php');

$database = new Database();
$pdo = $database->dbConnection();

$id=$_POST["id"];
$id = (int)filter_var($id, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$name=$_POST["name"];
$name = (string)filter_var($name, FILTER_SANITIZE_FULL_SPECIAL_CHARS);

$q = $pdo->prepare("SELECT * FROM {filename} WHERE {fileprimarykey}=:p_id");
$q->bindparam(":p_id", $id);
$q->execute();
if ($q->rowCount() == 1) {
	$row = $q->fetch(PDO::FETCH_ASSOC);
    $image = $row[$name];
}

header("Content-type: image/jpeg");
header('Content-Disposition: attachment; filename="{filename}_' . $name . $id . '.jpg"');
header("Content-Transfer-Encoding: binary"); 
header('Expires: 0');
header('Pragma: no-cache');
header("Content-Length: ".strlen($image));

echo $image;
exit();
