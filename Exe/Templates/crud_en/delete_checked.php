<?php

require_once("session.php");
require_once("class.user.php");
require_once("config.php");
include_once('header.php');
include_once('dbconfig.php');
$database = new Database();
$pdo = $database->dbConnection();

if (isset($_POST['Daten'])) {
$p_daten = explode(";", $_POST['Daten']);
} else {
header("Location: table_{filename}.php");
}

if ( isset($_POST['ok'])) {
	
	// delete data
	if ($_POST['ok']) {
	  foreach ($p_daten as $id) {
		try
		{
		  $sql = "DELETE FROM {filename} WHERE {fileprimarykey} = ?";
		  $q = $pdo->prepare($sql);
		  $q->execute(array($id));
		}
		catch(PDOException $err) 
		{
		  echo $err->getTrace().'<br />'.strval($err->getLine()).'<br />'.$err->getPrevious();        
		}
		if (!$q->rowCount() == 1) {
		  header("Location: table_{filename}.php");
		}
	  }
	  $database->disconnect();
	  header("Location: table_{filename}.php");
	}
	
} 
?>
<?php
include_once('header.php');
?>
	<body>
	<div class="container">
	<?php
	$_SESSION['NAVSELECT'] = "{filename}";
	include_once('navbar.php');
	makenavbar("table_{filename}.php");
	?>    
	  <div class="jumbotron">
		<h1>{filename}</h1>
		  <form class="form-horizontal" action="delete_checked_{filename}.php" method="post">
			<input type="hidden" name="Daten" value="<?php echo $_POST['Daten'];?>"/>
			<input type="hidden" name="ok" value="1"/>
	<?php
foreach ($p_daten as $id) {
	$sql = 'SELECT * FROM {filename} WHERE {fileprimarykey}=' . $id;
	$q = $pdo->prepare($sql);
	$q->execute(array($id));
	if ($q->rowCount() > 0) {
		$data = $q->fetch(PDO::FETCH_ASSOC);
		echo $data['{fileprimarykey}'] . "<br>\r\n";
	}
}
$database->disconnect();
	?>
		  <p class="alert alert-error">Do you really want to delete these records?</p>
		  <div class="form-actions">
			<button type="submit" class="btn btn-danger">Yes</button>
			<a class="btn btn-primary" href="table_{filename}.php">No</a>
		  </div>
		</form>
	  </div>
	</div>
<?php
include_once('footer.php');