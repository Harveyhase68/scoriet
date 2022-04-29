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
}
	
{for {nmaxitemsnoblob}}
	{if {item.typecast}="(int)"}
$p_{item.name} = {item.typecast}0;
	{else}
$p_{item.name} = {item.typecast}"";
	{endif}
{endfor}

{for {nmaxitemsblob}}
if (isset($_FILES['image_{item.name}'])) {
	if ($_FILES['image_{item.name}']<>"") {
		$handle = new \Verot\Upload\Upload($_FILES['image_{item.name}']);
		if ($handle->uploaded) {
			if (file_exists("upload/image_{item.name}." . $handle->file_src_name_ext)) {
				unlink("upload/image_{item.name}." . $handle->file_src_name_ext);
			}
			$handle->file_new_name_body   = 'image_{item.name}';
			$handle->image_resize         = true;
			$handle->image_x              = 100;
			$handle->image_ratio_y        = true;
			$handle->process('upload/');
			if ($handle->processed) {
				$handle->clean();
				$file_name_{item.name} = fopen($handle->file_dst_pathname, 'rb'); // read binary
			} else {
				echo 'error : ' . $handle->error;
			}
		}
	}
}
{endfor}
if (!empty($_POST)) {
	// keep track post values
{for {nmaxitemsnoblob}}
	if (isset($_POST['{item.name}'])) {
		$p_{item.name} = $_POST['{item.name}'];
	} else {
		$p_{item.name} = NULL;
	}
	{switch {item.controltype}}
		{case 17}
	if ($p_{item.name}=='') {
		$p_{item.name}=NULL;
	}
	{endswitch}
{endfor}

	// validate input
	$valid = true;
{for {nmaxitemsnoblob}}
	{if {item.notnull}=0}
		{if {item.datatype}="string"}
	if (empty($p_{item.name})) {
		${item.name}Error = 'Geben Sie einen Wert für {item.caption} ein!';
		$valid = false;
	}
		{endif}
	{endif}
{endfor}
		
	// update data
	if ($valid) {
		try {
			$sql = "UPDATE {filename} set {for {nmaxitemsnoblob}}{item.name} = ?{if nCountItemsNoBlob<{nmaxitemsnoblob}},{endif}{endfor} WHERE {filekeyname} = ?";
			$q = $pdo->prepare($sql);
			$q->execute(array({for {nmaxitemsnoblob}}$p_{item.name}{if nCountItemsNoBlob<{nmaxitemsnoblob}},{endif}{endfor},$id));
			$database->disconnect();
		} catch(PDOException $err) {
			echo 'The connection could not be established.<br />'.$err->getMessage().'<br />'.strval($err->getCode()).'<br />'.$err->getFile().'<br />';
			echo $err->getTrace().'<br />'.strval($err->getLine()).'<br />'.$err->getPrevious();			
		}
{for {nmaxitemsblob}}	
		if (isset($file_name_{item.name})) {
			if ($file_name_{item.name}<>"") {
				try {
					$sql = "UPDATE {filename} set {item.name} = :p_{item.name} WHERE {filekeyname} = :p_{filekeyname}";
					$q = $pdo->prepare($sql);
					$q->bindParam(':p_{item.name}', $file_name_{item.name}, PDO::PARAM_LOB);
					$q->bindParam(':p_{filekeyname}', $id);
					$q->execute();
					$database->disconnect();
				} catch(PDOException $err) {
					echo 'The connection could not be established.<br />'.$err->getMessage().'<br />'.strval($err->getCode()).'<br />'.$err->getFile().'<br />';
					echo $err->getTrace().'<br />'.strval($err->getLine()).'<br />'.$err->getPrevious();			
					exit;
				}
			}
		}
{endfor}
		header("Location: table_{filename}.php");
	}
} else {
	try {
		$sql = "SELECT * FROM {filename} where {filekeyname} = ?";
		$q = $pdo->prepare($sql);
		$q->execute(array($id));
		$data = $q->fetch(PDO::FETCH_ASSOC);
		{for {nmaxitemsnokey}}
		$p_{item.name}={item.typecast}$data['{item.name}'];
		{endfor}
	} catch(PDOException $err) {
		echo 'The connection could not be established.<br />'.$err->getMessage().'<br />'.strval($err->getCode()).'<br />'.$err->getFile().'<br />';
		echo $err->getTrace().'<br />'.strval($err->getLine()).'<br />'.$err->getPrevious();			
	}
}
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
            <form class="form-horizontal" action="update_{filename}.php?id=<?php echo $id; ?>" method="post" enctype="multipart/form-data">
{for {nmaxitemsnokey}}
{switch {item.controltype}}
{case 14}
              <div class="control-group <?php echo !empty(${item.name}Error)?'error':'';?>">
                <label class="control-label">{item.caption}</label><br>
                  <input type="checkbox" name="{item.name}" value="Ja">
              </div>
<?php if (!empty(${item.name}Error)): ?>
                  <span class="help-inline" style="fontcolor:#f00"><?php echo ${item.name}Error;?></span>
<?php endif; ?>
{case 17}
              <div class="control-group <?php echo !empty(${item.name}Error)?'error':'';?>">
                <label class="control-label">{item.caption}</label>
                <select class="form-control" name="{item.name}">
				//A empty option
				<option selected disabled hidden value=''>Bitte wählen Sie eine Option...</option>
<?php
$pdo{item.name} = Database::connect();
$pdo{item.name}->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$sql = "SELECT {item.foreignitem},{item.foreigndisplayitem} FROM {item.foreigntable} ORDER BY {item.foreignsortitem}";
$q = $pdo{item.name}->prepare($sql);
$q->execute();
$data = $q->fetch(PDO::FETCH_ASSOC);
foreach ($pdo{item.name}->query($sql) as $data) {
  echo "                  <option value=" . $data['{item.foreignitem}'];
  if ($data['{item.foreignitem}']==$p_{item.name}) {
    echo " selected";
  }
  echo ">" . $data['{item.foreigndisplayitem}'] . "</option>\r\n";
}
?>
                </select>
<?php if (!empty(${item.name}Error)): ?>
                  <span class="help-inline" style="fontcolor:#f00"><?php echo ${item.name}Error;?></span>
<?php endif; ?>
              </div>
{case 24,25,26,27,28,29}
			<br>
			<table class="table table-striped">
				<thead>
					<tr>
						<th scope="col">{item.caption}</th>
						<th scope="col">{item.caption} Ändern</th>
						<th scope="col">{item.caption} Download</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td style="vertical-align: middle;">
<?php
if (!is_null($p_{item.name})) {
echo '							<img src="data:image/jpeg;base64,'.base64_encode( $p_{item.name}).'"/>';
} else {
echo '							&nbsp;';
}
?>
						</td>
						<td style="vertical-align: middle;">
							<input type="file" name="image_{item.name}" class="file-path validate"/>
						</td>
						<td style="vertical-align: middle;">
							<a onclick="{item.name}_download(<?php echo $id;?>);" class="btn btn-success">Download</a>
						</td>
					</tr>
				</tbody>
			</table>
{othercase}
          <div class="control-group <?php echo !empty(${item.name}Error)?'error':'';?>">
            <label class="control-label">{item.caption}</label>
            <div class="controls">
              <input class="form-control" name="{item.name}" type="text" placeholder="{item.name}" value="<?php echo $p_{item.name};?>">
<?php if (!empty(${item.name}Error)): ?>
                <span class="text-warning"><?php echo ${item.name}Error;?></span>
<?php endif; ?>
            </div>
          </div>
{endswitch}
{endfor}
          <br>
 					  <div class="form-actions">
						  <button type="submit" class="btn btn-success">Ändern</button>
						  <a class="btn btn-primary" href="table_{filename}.php">Zurück</a>
						</div>
					</form>
				</div>
				
    </div> <!-- /container -->
<script type="text/javascript">
{for {nmaxitemsblob}}
function {item.name}_download(id) {
	$.redirect('download_image_{filename}.php', {'name': '{item.name}', 'id': id});
};
{endfor}
</script>
<?php
include_once('footer.php');
$database->disconnect();