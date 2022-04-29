<?php

require_once __DIR__ . '/vendor/autoload.php';

require_once("session.php");
require_once("class.user.php");
require_once("config.php");
include_once('dbconfig.php');

$database = new Database();
$pdo = $database->dbConnection();

$mpdf = new \Mpdf\Mpdf(['mode' => 'utf-8', 'format' => 'A4-P']);
//$mpdf = new \Mpdf\Mpdf(['mode' => 'utf-8', 'format' => 'A4-L']); //Landscape

$output='<h1>{filename}</h1>';
$output.='<table id="{filename}_Table" style="font-size: 0.7em; padding:0px; margin: 0px;">';
$output.='<thead>';
$output.='<tr>';
{for {nmaxitemsnokeyall}}
$output.='<th style="border-bottom:1px solid; padding:0px; margin: 0px;" align="left" width="50px">{item.caption}</th>';
{endfor}
$output.='</tr>';
$output.='</thead>';
$output.='<tbody>';
$sql = 'SELECT * FROM {filename} ORDER BY {filekeyname} ASC';
foreach ($pdo->query($sql) as $row) {
	$output.='<tr>';
{for {nmaxitemsnokeyall}}
{switch {item.type}}
{case 2,3,4,5,6,7,8,9,10,11,12}
	$output.='<td align="right">' . $row['{item.name}'] . '</td>';
{case 1}
	$output.='<td align="center"><input type="checkbox"';
	if ($row['{item.name}']==1) {$output.=' checked="checked"';}
	$output.='></td>';
{case 24,25,26,27,28,29}
	if (!is_null($row['{item.name}'])) {
		$output.='<td><img src="data:image/jpeg;base64,'.base64_encode( $row['{item.name}'] ).'"/></td>';
	} else {
		$output.='<td>&nbsp;</td>';
	}
{othercase}	$output.='<td align="left">' . $row['{item.name}'] . '</td>';
{endswitch}
{endfor}
	$output.='</tr>';
}
$output.='</tbody>';
$output.='</table>';
$mpdf->WriteHTML($output);
$mpdf->setFooter('{PAGENO}');
$mpdf->Output('{filename}.pdf', 'I');