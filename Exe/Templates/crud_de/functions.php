<?php

include_once("dbconfig.php");

$wochentag = array();
$wochentag[1]="Montag";
$wochentag[2]="Dienstag";
$wochentag[3]="Mittwoch";
$wochentag[4]="Donnerstag";
$wochentag[5]="Freitag";
$wochentag[6]="Samstag";
$wochentag[7]="Sonntag";

function get_preis($preislistenr,$spezialpreislistenr,$artikelnr)
{
    $database = new Database();
    $conn = $database->dbConnection();
    $pdo = $conn->prepare("SELECT * FROM preisliste WHERE preislistenr=:upreislistennr AND artikelnr=:uartikelnr");
    $pdo->bindparam(":upreislistennr", $preislistenr);
    $pdo->bindparam(":uartikelnr", $artikelnr);
    $pdo->execute();
    if (!$pdo) {
        echo "0;" . $pdo->errorInfo();
        exit;
    }
    if ($pdo->rowCount() == 1) {
        $preisliste = $pdo->fetch(PDO::FETCH_ASSOC);
        $preis=(float)$preisliste['preis'];
    } else {
        $preis=(int)0;
    }

    if ($spezialpreislistenr<>0) {
        $pdo = $conn->prepare("SELECT * FROM preisliste WHERE preislistenr=:upreislistennr AND artikelnr=:uartikelnr");
        $pdo->bindparam(":upreislistennr", $spezialpreislistenr);
        $pdo->bindparam(":uartikelnr", $artikelnr);
        $pdo->execute();
        if (!$pdo) {
            echo "0;" . $pdo->errorInfo();
            exit;
        }
        if ($pdo->rowCount() == 1) {
            $spezialpreisliste = $pdo->fetch(PDO::FETCH_ASSOC);
            $preis = (float)$spezialpreisliste['preis'];
        }
    }

    return $preis;
}

function get_summe($bestellungid)
{
    $summe = (float)0;

    $database = new Database();
    $conn = $database->dbConnection();
    $pdo = $conn->prepare("SELECT * FROM bestellung WHERE bestellung_id=:ubestellung_id");
    $pdo->bindparam(":ubestellung_id", $_SESSION['bestellungid']);
    $pdo->execute();
    if (!$pdo) {
        echo "0;" . $pdo->errorInfo();
        exit;
    }

    if (!$pdo->rowCount() == 1) {
        $login->redirect('index.php');
    } else {
        $bestellung = $pdo->fetch(PDO::FETCH_ASSOC);
    }

    $pdo = $conn->prepare("SELECT * FROM bestellung_zeilen WHERE bestellung_id=:ubestellung_id");
    $pdo->bindparam(":ubestellung_id", $_SESSION['bestellungid']);
    $pdo->execute();
    if (!$pdo) {
        echo "0;" . $pdo->errorInfo();
        exit;
    }

    $zeilen_alle = $pdo->fetchAll(PDO::FETCH_ASSOC);
    foreach ($zeilen_alle as $zeile) {
        $bestellmenge = (int)$zeile['bestellmenge'];
        $preis = (float)get_preis($_SESSION['user_preisliste'], $_SESSION['user_spezialpreisliste'], $zeile['artikelnr']);
        $summe = $summe + round($preis * $bestellmenge, 2);
    }
    return $summe;
}

function get_settings()
{
    $database = new Database();
    $conn = $database->dbConnection();
    $pdo = $conn->prepare("SELECT * FROM settings WHERE settings_nr=1");
    $pdo->execute();
    if (!$pdo) {
        echo "0;" . $pdo->errorInfo();
        exit;
    }
    if ($pdo->rowCount() == 1) {
        $settings = $pdo->fetch(PDO::FETCH_ASSOC);
        //Schöner machen die Uhrzeit statt 18:00:00 nur mehr 18:00 anzeigen:
        $settings['uhrzeit_bestellschluss']=substr($settings['uhrzeit_bestellschluss'],0,5);
        $settings['uhrzeit_bestellschluss_tk']=substr($settings['uhrzeit_bestellschluss_tk'],0,5);
    } else {
        $settings['bestellung_fuer_feiertage']=(int)1;
        $settings['bestellung_fuer_sonntag']=(int)1;
        $settings['uhrzeit_bestellschluss']="18:00";
        $settings['alarm_vor_bestellschluss_in_minuten']=(int)60;
        $settings['uhrzeit_bestellschluss_tk']="18:00";
        $settings['wochentag_bestellschluss_tk']=(int)4;
        $settings['bestellschluss_tage_tk']=(int)3;
        $settings['alarm_vor_bestellschluss_tk_in_minuten']=(int)60;
        $settings['ft_samstag']=0;
        $settings['ft_josef']=0;
        $settings['ft_florian']=0;
        $settings['ft_rupert']=0;
        $settings['ft_volksabstimmung']=0;
        $settings['ft_martinstag']=0;
        $settings['ft_leopolditag']=0;
    }

    $database->disconnect();
    unset($database);
    unset($pd);
    unset($conn);

    return $settings;
}

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

function getnextworkday($datum,$settings) {
    if ($settings['bestellung_fuer_feiertage']==1) {
        $datum=$datum+86400;
        return $datum;
    } else {
        for ($i = 1; $i < 6; $i++) {
            $datum=$datum+86400;
            //echo date('d.m.Y',$datum);
            $feiertag=getfeiertag($datum,$settings['ft_samstag'], $settings['ft_josef'], $settings['ft_florian'], $settings['ft_rupert'], $settings['ft_volksabstimmung'], $settings['ft_martinstag'], $settings['ft_leopolditag']);
            //echo " " . $feiertag['wochentag'] . " " . $feiertag['bezeichnung'] . "<br>";
            if (!$feiertag['feiertag']) {
                return $datum;
            }
        }
    }
}

function getfeiertag($datum,$ft_samstag,$ft_josef,$ft_florian,$ft_rupert,$ft_volksabstimmung,$ft_martinstag,$ft_leopolditag)
{
    $ostern=easter_date(date('Y',$datum));
    $res = array();

    $tag = (int)date('d',$datum);
    $monat = (int)date('m',$datum);
    //$jahr=(int)date('Y',$datum);

    $wochentagnummer=(int)date('N',$datum);

    if ($tag==1 && $monat==1) {
        $res['bezeichnung'] = "NeuJahr";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==6 &&  $monat==1) {
        $res['bezeichnung'] = "Heilig3König";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==19 &&  $monat==3 && $ft_josef==1) {
        $res['bezeichnung'] = "Josefstag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==4 &&  $monat==5 && $ft_florian==1) {
        $res['bezeichnung'] = "Florianitag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==24 &&  $monat==9 && $ft_rupert==1) {
        $res['bezeichnung'] = "Rupertitag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==10 &&  $monat==10 && $ft_volksabstimmung==1) {
        $res['bezeichnung'] = "Tag der Volksabstimmung";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==11 &&  $monat==11 && $ft_martinstag==1) {
        $res['bezeichnung'] = "Martinstag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==15 &&  $monat==11 && $ft_leopolditag==1) {
        $res['bezeichnung'] = "Leopolditag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==($ostern-2)) {
        $res['bezeichnung'] = "Karfreitag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==$ostern) {
        $res['bezeichnung'] = "Ostersonntag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==($ostern+1)) {
        $res['bezeichnung'] = "Ostermontag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==1 && $monat==5) {
        $res['bezeichnung'] = "Staatsfeiertag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==($ostern+39)) {
        $res['bezeichnung'] = "Christi Himmelfahrt";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==($ostern+49)) {
        $res['bezeichnung'] = "Pfingstsonntag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==($ostern+50)) {
        $res['bezeichnung'] = "Pfingstmontag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($datum==($ostern+60)) {
        $res['bezeichnung'] = "Fronleichnam";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==15 && $monat==8) {
        $res['bezeichnung'] = "Mariä Himmelfahrt";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==26 && $monat==10) {
        $res['bezeichnung'] = "Nationalfeiertag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==1 && $monat==11) {
        $res['bezeichnung'] = "Allerheiligen";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==8 && $monat==12) {
        $res['bezeichnung'] = "Maria Empfängnis";
        $res['feiertag'] = true;
        return $res;
    }
//    if ($tag==24 && $monat==12) {
//        $res['bezeichnung'] = "Heiliger Abend";
//        $res['feiertag'] = true;
//        return $res;
//    }
    if ($tag==25 && $monat==12) {
        $res['bezeichnung'] = "Christtag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($tag==26 && $monat==12) {
        $res['bezeichnung'] = "Stefanitag";
        $res['feiertag'] = true;
        return $res;
    }
    //if ($tag==31 && $monat==12) {
    //    $res['bezeichnung'] = "Sylvester";
    //    $res['feiertag'] = true;
    //    return $res;
    //}
    if ($ft_samstag && $wochentagnummer==6) {
        $res['bezeichnung'] = "Samstag";
        $res['feiertag'] = true;
        return $res;
    }
    if ($wochentagnummer==7) {
        $res['bezeichnung'] = "Sonntag";
        $res['feiertag'] = true;
        return $res;
    }
    $res['bezeichnung'] = "";
    $res['feiertag'] = false;
    return $res;
}

function datum_ok($datum) {
    $pattern = '/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/';
    if(preg_match($pattern, $datum)) {
        return true;
    } else {
        return false;
    }
}