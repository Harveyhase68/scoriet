<?php

include_once("dbconfig.php");

$wochentag = array();
$wochentag[1]="Monday";
$wochentag[2]="Tuesday";
$wochentag[3]="Wednesday";
$wochentag[4]="Thursday";
$wochentag[5]="Friday";
$wochentag[6]="Saturday";
$wochentag[7]="Sunday";

function uuid($prefix = '')
{
    $chars = md5(uniqid(mt_rand(), true));
    $uuid = substr($chars, 0, 8) . '-';
    $uuid .= substr($chars, 8, 4) . '-';
    $uuid .= substr($chars, 12, 4) . '-';
    $uuid .= substr($chars, 16, 4) . '-';
    $uuid .= substr($chars, 20, 12);
    return $prefix . $uuid;
}

function random_password($length = 8, $type = 'alpha_numeric')
{

    if ($length < 1 || $length > 1024) return null;

    mt_srand(crc32(microtime()));

    $lower = 'abcdefghijklmnopqrstuvwxy';
    $upper = strtoupper($lower);
    $numbers = '1234567890';
    $dash = '-';
    $underscore = '_';
    $symbols = '`~!@#$%^&*()+=[]\\{}|:";\'<>?,./';

    switch ($type) {
        case 'lower':
            $chars = $lower;
            break;
        case 'upper':
            $chars = $upper;
            break;
        case 'numeric':
            $chars = $numbers;
            break;
        case 'alpha':
            $chars = $lower . $upper;
            break;
        case 'symbol':
            $chars = $symbols . $dash . $underscore;
            break;
        case 'alpha_numeric':
            $chars = $lower . $upper . $numbers;
            break;
        case 'alpha_numeric_dash':
            $chars = $lower . $upper . $numbers . $dash;
            break;
        case 'alpha_numeric_underscore':
            $chars = $lower . $upper . $numbers . $underscore;
            break;
        case 'alpha_numeric_dash_underscore':
            $chars = $lower . $upper . $numbers . $underscore . $dash;
            break;
        case 'all':
            $chars = $lower . $upper . $numbers . $underscore . $dash . $symbols;
            break;
        default:
            return null;
    }

    $min = 0;
    $max = strlen($chars) - 1;

    $password = '';

    for ($i = 0; $i < $length; $i++) {
        $random = mt_rand($min, $max);
        $char = substr($chars, $random, 1);
        $password .= $char;
    }

    return $password;
}

function datum_ok($datum) {
    $pattern = '/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/';
    if(preg_match($pattern, $datum)) {
        return true;
    } else {
        return false;
    }
}