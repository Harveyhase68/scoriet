<?php 
require_once("session.php");
require_once("class.user.php");
require_once("config.php");
include_once('header.php');
include_once('dbconfig.php');
$database = new Database();
$pdo = $database->dbConnection();
	
$id = null;
if ( !empty($_GET['id'])) {
	$id = $_REQUEST['id'];
}

if ( null==$id ) {
	header("Location: table_{filename}.php");
} else {
	$sql = "SELECT * FROM {filename} where {filekeyname} = ?";
	$q = $pdo->prepare($sql);
	$q->execute(array($id));
	$data = $q->fetch(PDO::FETCH_ASSOC);
	$database->disconnect();
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
		<h1>{filedescription}</h1>
		<dl>
{for {nmaxitems}}
{switch {item.controltype}}
{case 14}
		<dt>{item.caption}</dt><dd><input type="checkbox" class="check"<?php if ($data['{item.name}']==1) {echo " checked=\"checked\"";}?>/></dd>
{case 24,25,26,27,28,29}
<?php
if (!is_null($data['{item.name}'])) {
	echo '		<dt>{item.caption}</dt><dd><img src="data:image/jpeg;base64,'.base64_encode( $data['{item.name}'] ).'"/></dd>';
} else {
	echo '		<dt>{item.caption}</dt><dd>&nbsp;</dd>';
}
?>
{othercase}
		<dt>{item.caption}</dt><dd><?php echo $data['{item.name}'];?></dd>
{endswitch}
{endfor}			
		</dl>
		<a class="btn btn-primary" href="table_{filename}.php">Zurück</a>
		</div>
	</div> <!-- /container -->
<?php
include_once('footer.php');
$database->disconnect();