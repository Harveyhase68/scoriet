<?php
require_once("session.php");
require_once("class.user.php");
require_once("config.php");
include_once('header.php');
include_once('dbconfig.php');

$database = new Database();
$pdo = $database->dbConnection();

$recordpage=NULL;
if (isset($_POST['recordpage'])) {
	if (!$_POST['recordpage']=="") {
		$recordpage = $_POST['recordpage'];
		$recordpage = (int)filter_var($recordpage, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
	}
}
if ($recordpage=="") {
	$recordpage=(int)10;
} else {
	$recordpage=(int)$recordpage;
}

$totalpages=NULL;
if (isset($_POST['totalpages'])) {
	if (!$_POST['totalpages']=="") {
		$totalpages = $_POST['totalpages'];
		$totalpages = (int)filter_var($totalpages, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
	}
}

$page=NULL;
if (isset($_POST['page'])) {
	if (!$_POST['page']=="") {
		$page = $_POST['page'];
		$page = (int)filter_var($page, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
	}
}

$lastsort=NULL;
if (isset($_POST['lastsort'])) {
	if (!$_POST['lastsort']=="") {
		$lastsort = $_POST['lastsort'];
		$lastsort = filter_var($lastsort, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
	}
}

$sort=NULL;
$order_by=(string)" ORDER BY {filekeyname} ASC";
if (isset($_POST['sort'])) {
	if (!$_POST['sort']=="") {
		$sort=$_POST['sort'];
		$sort=filter_var($sort, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
		switch ($sort) {
{for {nmaxitems}}
			case "{item.name}":
				$order_by=(string)" ORDER BY {item.name} ASC";
				break;
			case "{item.name}_d":
				$order_by=(string)" ORDER BY {item.name} DESC";
				break;
{endfor}
		}
	}
}

$lastsearch=NULL;
if (isset($_POST['lastsearch'])) {
	if (!$_POST['lastsearch']=="") {
		$lastsearch = $_POST['lastsearch'];
		$lastsearch = filter_var($lastsearch, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
	}
}

$search=NULL;
if (isset($_POST['search'])) {
	if (!$_POST['search']=="") {
		$search = $_POST['search'];
		$search = filter_var($search, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
	}
}

if ($search<>$lastsearch) {
	//Back... calculate max records
	$totalpages=null;
}

if ($lastsearch=="" && $search<>"") {
	$lastsearch=$search;
}

if (is_null($search)) {
	if (is_null($totalpages)) {
		$sql = 'SELECT count(*) AS count FROM {filename}' . $order_by;
		$q = $pdo->prepare($sql);
		$q->execute();
		$data = $q->fetch(PDO::FETCH_ASSOC);
		
		//Store the data
		$totalpages=$data['count'];

		//Back again
		$page=(int)1;
	}
	if ($totalpages<=$recordpage) {
		//Fix only 1 page, even it tolds me to display the page 2
		$page=(int)1;
	}
	$limit=" LIMIT " . (($page-1)*$recordpage) . "," . $recordpage;
	$sql = 'SELECT * FROM {filename}' . $order_by . $limit;
	$input=(string)"";
} else {
	//Override sort...
	if (is_null($sort)) {
		$order_by=" ORDER BY {filekeyname} ASC";
	}
	if (is_null($totalpages)) {
		$sql = 'SELECT count(*) AS count FROM {filename} WHERE ({for {nmaxsearchkeys}}{item.name} LIKE \'%' . $search . '%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})' . $order_by;
		$q = $pdo->prepare($sql);
		$q->execute();
		$data = $q->fetch(PDO::FETCH_ASSOC);
		
		//Store the data
		$totalpages=$data['count'];

		//Back again
		$page=(int)1;
	}
	if ($totalpages<=$recordpage) {
		//Fix only 1 page, even it tolds me to display the page 2
		$page=(int)1;
	}
	$limit=" LIMIT " . (($page-1)*$recordpage) . "," . $recordpage;
	$sql = 'SELECT * FROM {filename} WHERE ({for {nmaxsearchkeys}}{item.name} LIKE \'%' . $search . '%\'{if nCountSearchkeys<{nmaxsearchkeys}} OR {endif}{endfor})' . $order_by . $limit;
}

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
			<p>
			<table width="100%">
				<tr>
					<td width="10%">
							<a href="create_{filename}.php" class="btn btn-success">Erzeugen</a>
					</td>
					<td width="10%">
							<a href="#" class="btn btn-danger" onclick="delete_selected();">Löschen</a>
					</td>
					<td width="10%">
							<a href="print_{filename}.php" class="btn btn-info" target="_blank">Drucken</a>
					</td>
					<td width="70%" align="right">
						<div class="row">
							<div class="col-xs-6 col-md-4">
								<div class="input-group">
									<input type="text" class="form-control" placeholder="Suchen..." id="search_id" name="search_name" value="<?php echo $search;?>"/>
									<div class="input-group-btn">
										<button class="btn btn-primary" style="height: 34px;" onclick="transmit({search: document.getElementById('search_id').value, sort: 'artikelnr'});">
											<span class="glyphicon glyphicon-search"></span>
										</button>
										<button class="btn btn-danger" style="height: 34px;" onclick="const log = document.getElementById('search_id');log.value='';transmit({search:''});">
											<span class="glyphicon glyphicon-remove"></span>
										</button>
									</div>
								</div>
							</div>
						</div>
					</td>
				</tr>
			</table>
		</p>
		<div class="row scrollable">
			<table id="{filename}_Table" class="table table-striped table-bordered">
				  <thead>
					<tr>
						<th>Auswahl</th>
{for {nmaxitems}}
						<th><span onclick="transmit({ search: '<?php echo $search;?>', lastsort: '<?php echo $sort;?>', sort: '{item.name}<?php if ($sort=="{item.name}") {echo "_d";}?>' });" style="white-space: nowrap;color:#337ab7;">{item.caption}<?php if ($sort=="{item.name}") { echo '&nbsp;<span class="glyphicon glyphicon-triangle-top"></span>'; } else { if ($sort=="{item.name}") {echo '&nbsp;<span class="glyphicon glyphicon-triangle-bottom"></span>';} }?></span></th>
{endfor}
						<th colspan="3">&nbsp;</th>
					</tr>
				  </thead>
				  <tbody>
<?php 
				   foreach ($pdo->query($sql) as $row) {
							echo '				<tr>'; echo "\r\n";
							echo '					<td align="center"><input type="checkbox" id="select' . $row['{filekeyname}'] . '" value="'. $row['{filekeyname}'].'" /></td>'; echo "\r\n";
{for {nmaxitems}}
{switch {item.type}}
{case 2,3,4,5,6,7,8,9,10,11,12}
							echo '					<td align="right">'. $row['{item.name}'] . '</td>'; echo "\r\n";
{case 1}
							echo '					<td align="center">'. $row['{item.name}'] . '</td>'; echo "\r\n";
{case 24,25,26,27,28,29}
							if (!is_null($row['{item.name}'])) {
								echo '					<td><img src="data:image/jpeg;base64,'.base64_encode( $row['{item.name}'] ).'"/></td>'; echo "\r\n";
							} else {
								echo '					<td>&nbsp;</td>'; echo "\r\n";
							}
{othercase}
							echo '					<td align="left">'. $row['{item.name}'] . '</td>'; echo "\r\n";						
{endswitch}
{endfor}
							echo '					<td>'; echo "\r\n";
							echo '						<a class="btn btn-primary" href="read_{filename}.php?id='.$row['{filekeyname}'].'">Anzeigen</a>'; echo "\r\n";
							echo '						&nbsp;'; echo "\r\n";
							echo '					<td>'; echo "\r\n";
							echo '						<a class="btn btn-success" href="update_{filename}.php?id='.$row['{filekeyname}'].'">Ändern</a>'; echo "\r\n";
							echo '						&nbsp;'; echo "\r\n";
							echo '					<td>'; echo "\r\n";							
							echo '						<a class="btn btn-danger" href="delete_{filename}.php?id='.$row['{filekeyname}'].'">Löschen</a>'; echo "\r\n";
							echo '					</td>'; echo "\r\n";
							echo '				</tr>'; echo "\r\n";
				   }
				  ?>
				  </tbody>
			</table>
    	</div>
			<!-- Pagination -->
			<nav aria-label="Page navigation example mt-5">
				<ul class="pagination justify-content-center">
					<li class="page-item<?php if ($page==1) {echo " disabled";}?>">
						<a class="page-link"<?php if (!($page==1)) { echo ' onclick="transmit({ page: 1});"';}?>><span aria-hidden="true">««</span></a>
					</li>
					<li class="page-item<?php if ($page<=1) {echo " disabled";}?>">
						<a class="page-link"<?php if (!($page<=1)) { echo ' onclick="transmit({ page: ' . ($page-1) . '});"';}?>><span aria-hidden="true">«</span></a>
					</li>
<?php
$count_pages=(int)ceil($totalpages/$recordpage);
$zzmax = (int)0;
$start=$page-4;
if ($start<=0) {
	$start=1;
}
for ($i = $start; $i <= $count_pages; $i++) {
	$zzmax++;
	if ($zzmax>9) {
		break;
	}
	if ($i==$page) {
		echo '					<li class="page-item active">'; echo "\r\n";
	} else {
		echo '					<li class="page-item">'; echo "\r\n";
	}
	echo '						<span class="page-link" onclick="transmit({ search: \'' . $search . '\', page: ' . $i . '});">&nbsp;' . $i . '&nbsp;</span>'; echo "\r\n";
	echo '					</li>'; echo "\r\n";
}
$next=$page+1;
if ($next>$count_pages) {
	$next=$count_pages;
}
?>
					<li class="page-item<?php if ($page>=$count_pages) {echo " disabled";}?>">
						<span class="page-link" <?php if (!($page>=$count_pages)) { echo ' onclick="transmit({ page: ' . $next . '});"';}?>aria-hidden="true">»</span>
					</li>
					<li class="page-item<?php if (($page>=$count_pages)) {echo " disabled";}?>">
						<span class="page-link"<?php if (!($page>=$count_pages)) { echo ' onclick="transmit({ page: ' . $count_pages . '});"';}?> aria-hidden="true">»»</span>
					</li>
					<li class="page-item">
						<label class="checkbox-inline" for="bl1_id" style="margin-left:25px;margin-top:7px;float:left;">Blättern:</label>
						<select class="form-control" name="bl1_id" id="bl1_id" style="width:80px;float:left;margin-left:5px;" onchange="transmit({ recordpage: value});">
							<option id="bl10" value="10"<?php if ($recordpage==10) {echo " selected";}?>>10</option>
							<option id="bl30" value="30"<?php if ($recordpage==30) {echo " selected";}?>>30</option>
							<option id="bl100" value="100"<?php if ($recordpage==100) {echo " selected";}?>>100</option>
							<option id="bl500" value="500"<?php if ($recordpage==500) {echo " selected";}?>>500</option>
							<option id="bl1000" value="1000"<?php if ($recordpage==1000) {echo " selected";}?>>1000</option>
						</select>
					</li>
				</ul>
			</nav>
      </div>
	</div>
<script type="text/javascript">
function transmit({lastsort='<?php echo $lastsort;?>', sort='<?php echo $sort;?>', lastsearch='<?php echo $search;?>', search='', recordpage=<?php echo $recordpage;?>, totalpages='<?php echo $totalpages;?>', page='<?php echo $page;?>'}) {
	//alert(lastsort+"/"+sort+"/"+lastsearch+"/"+search);
	$.redirect('table_{filename}.php', {'lastsort': lastsort, 'sort': sort, 'lastsearch': lastsearch, 'search': search, 'recordpage': recordpage, 'totalpages': totalpages, 'page': page});
};
function delete_selected() {
  var s="";
  $("#{filename}_Table tbody input:checkbox").each(function() {
    if(this.checked==true) {
      s=s+this.value+";";
    }
  });
  if(s=="") {
    return alert("Keine Datensätze ausgewählt!");
  } else {
    s=s.substring(0,s.length-1);
	var url = 'delete_checked_{filename}.php';
	var form = $('<form action="' + url + '" method="post">' + '<input type="text" name="Daten" value="' + s + '" />' + '</form>');
	$('body').append(form);
	form.submit();
  };
};
const log = document.getElementById('search_id');
log.addEventListener('keyup', logKey);
log.focus();
log.select();
function logKey(e) {
	if (e.key === 'Enter' || e.keyCode === 13) {
		const value=document.getElementById('search_id').value;
		transmit({search: value});
	}
};
</script>
<?php
include_once('footer.php');
$database->disconnect();