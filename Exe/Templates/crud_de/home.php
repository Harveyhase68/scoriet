<?php
	include_once('session.php');
	include_once('config.php');
	include_once('header.php');
?>
  <body>
	<div class="container">
<?php
	include_once('navbar.php');
	makenavbar("index.php");
?>    
      <div class="jumbotron">
        <h1>{projectname} - Main</h1>
      </div>
<?php
include_once('footer.php');