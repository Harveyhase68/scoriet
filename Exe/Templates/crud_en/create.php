<?php
require_once("session.php");
require_once("class.user.php");
require_once("config.php");
include_once('header.php');
include_once('dbconfig.php');
$database = new Database();
$pdo = $database->dbConnection();

{for {nmaxitemsnokey}}
  {if {item.typecast}="(int)"}
  $p_{item.name} = {item.typecast}0;
  {else}
  $p_{item.name} = {item.typecast}"";
  {endif}
{endfor}

if (!empty($_POST)) {
  // keep track post values
{for {nmaxitemsnokey}}
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
{for {nmaxitemsnokey}}
  {if {item.notnull}=0}
    {if {item.datatype}="string"}
    if (empty($p_{item.name})) {
      ${item.name}Error = 'Please enter a value for {item.caption}!';
      $valid = false;
      }
    {endif}
  {endif}
{endfor}

			  // insert data
    if ($valid) {
			
      $sql = "INSERT INTO {filename} ({for {nmaxitemsnokey}}{item.name}{if nCountItemsNoKey<{nmaxitemsnokey}},{endif}{endfor}) values({for {nmaxitemsnokey}}?{if nCountItemsNoKey<{nmaxitemsnokey}},{endif}{endfor})";
      $q = $pdo->prepare($sql);
      $q->execute(array({for {nmaxitemsnokey}}$p_{item.name}{if nCountItemsNoKey<{nmaxitemsnokey}},{endif}{endfor}));
      $database->disconnect();
      header("Location: table_{filename}.php");
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
            <form class="form-horizontal" action="create_{filename}.php" method="post">
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
				<option selected disabled hidden value=''>Please choose an option...</option>
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
$database->disconnect();
?>
                </select>
<?php if (!empty(${item.name}Error)): ?>
                  <span class="help-inline" style="fontcolor:#f00"><?php echo ${item.name}Error;?></span>
<?php endif; ?>
              </div>
{othercase}
          <div class="control-group <?php echo !empty(${item.name}Error)?'error':'';?>">
            <label class="control-label">{item.caption}</label>
            <div class="controls">
              <input class="form-control" name="{item.name}" type="text" placeholder="{item.name}" value="<?php echo !empty($p_{item.name})?$p_{item.name}:'';?>">
<?php if (!empty(${item.name}Error)): ?>
                <span class="text-warning"><?php echo ${item.name}Error;?></span>
<?php endif; ?>
            </div>
          </div>
          {endswitch}
          {endfor}
          <br>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">Save</button>
            <a class="btn btn-primary" href="table_{filename}.php">Back</a>
          </div>
        </form>
      </div>
    </div> <!-- /container -->
<?php
$database->disconnect();
include_once('footer.php');
  