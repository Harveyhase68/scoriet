<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load Composer's autoloader
require 'vendor/autoload.php';

require_once('dbconfig.php');
require_once('functions.php');
require_once("config.php");

class USER
{

    private $conn;

    public function __construct()
    {
        $database = new Database();
        $db = $database->dbConnection();
        $this->conn = $db;
    }

    public function runQuery($sql)
    {
        $stmt = $this->conn->prepare($sql);
        return $stmt;
    }

    public function register($uname, $umail, $upass, $uIP)
    {
        try {
            $key = (string)uuid();
            $link = WEB_ADDRESS . "/confirm_email.php?email=" . $umail . "&key=" . $key;

            $new_password = md5($upass);
            $join_date = time();

            $stmt = $this->conn->prepare("INSERT INTO users(user_name,user_email,user_pass,user_joining_date,user_registration_ip,user_activation_key) VALUES(:uname, :umail, :upass, FROM_UNIXTIME(:ujdate), :uip, :ukey)");

            $stmt->bindparam(":uname", $uname);
            $stmt->bindparam(":umail", $umail);
            $stmt->bindparam(":upass", $new_password);
            $stmt->bindparam(":ujdate", $join_date);
            $stmt->bindparam(":uip", $uIP);
            $stmt->bindparam(":ukey", $key);

            $stmt->execute();
            if (!$stmt) {
                return "0;" . $stmt->errorInfo();
            }

            $text_body = (string)"";

            $text_body .= "Hallo " . $uname . ",<br><br>\n\n";
            $text_body .= "Ihre Registrierung ist fast vollständig. Bitte bestätigen Sie nun die Gültigkeit Ihrer Email Adresse.<br><br>\n\n";
            $text_body .= "Um Ihre E-Mail-Adresse zu bestätigen, folgen Sie bitte diesem Link:<br><br>\n\n";
            $text_body .= "<a href=\"" . $link . "\" target=\"_blank\">" . $link . "</a><br><br>\n\n";
            $text_body .= "Falls Sie den Link nicht folgen können, kopieren Sie bitte den Link in die Adresszeile Ihres Browsers.<br><br>\n\n";
            $text_body .= "Ihre Registrierungsdaten:<br><br>\n\n";
            $text_body .= "Email: " . $umail . "<br>\n";
            $text_body .= "Benutzername: " . $uname . "<br>\n";
            $text_body .= "Passwort: wie angegeben<br><br>\n\n";
            $text_body .= "Mit freundlichen Grüßen<br>\n";
            $text_body .= COMPANY . "<br>\n";

            //Kopie senden!
            $mail = new PHPMailer(true);
            $mail->isSendmail();
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(COMPANY_EMAIL, COMPANY);
            $mail->addReplyTo(COMPANY_EMAIL, COMPANY);
            $mail->AddAddress(COMPANY_EMAIL, 'Registrierung eines Kunden');

            $mail->Subject = COMPANY . " - Registrierung eines Kunden";

            $mail->msgHTML($text_body);
            $mail->AltBody = $text_body;

            $mail->send();

            //Daten ändern auf eigenen Mail server
            $mail = new PHPMailer(true);
            $mail->isSendmail();
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(COMPANY_EMAIL, COMPANY);
            $mail->addReplyTo(COMPANY_EMAIL, COMPANY);
            $mail->AddAddress($umail, $uname);

            $mail->Subject = COMPANY . " - Registrierung Bestätigung";

            $mail->msgHTML($text_body);
            $mail->AltBody = $text_body;

            if (!$mail->send()) {
                return "0" . $mail->ErrorInfo;
            } else {
                return "1";
            }
        } catch (phpmailerException $e) {
            return "0;" . $e->errorMessage(); //Pretty error messages from PHPMailer
        } catch (PDOException $e) {
            return "0;" . $e->getMessage();
        }
    }

    public function resend_email($umail,$uname)
    {
        try {

            $stmt = $this->conn->prepare("SELECT user_id, user_name FROM users WHERE user_name=:uname OR user_email=:umail ");
            $stmt->execute(array(':uname' => $uname, ':umail' => $umail));
            $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$stmt->rowCount() == 1) {
                return "0;Benutzername oder Email wurde nicht gefunden !";
            } else {
                $uname=$userRow['user_name'];
            }

            $key = (string)uuid();
            $link = WEB_ADDRESS . "/confirm_email.php?email=" . $umail . "&key=" . $key;

            $update_key_date = time();

            $stmt = $this->conn->prepare("UPDATE users SET user_activation_key=:ukey, user_activation_key_created=FROM_UNIXTIME(:udate) WHERE user_email=:umail");

            $stmt->bindparam(":ukey", $key);
            $stmt->bindparam(":udate", $update_key_date);
            $stmt->bindparam(":umail", $umail);

            $stmt->execute();
            if (!$stmt) {
                return "0;" . $stmt->errorInfo();
            }

            $text_body = "";

            $text_body .= "Hallo " . $uname . ",<br><br>\n\n";
            $text_body .= "Ihre Registrierung ist fast vollständig. Bitte bestätigen Sie nun die Gültigkeit Ihrer Email Adresse.<br><br>\n\n";
            $text_body .= "Um Ihre E-Mail-Adresse zu bestätigen, folgen Sie bitte diesem Link:<br><br>\n\n";
            $text_body .= "<a href=\"" . $link . "\" target=\"_blank\">" . $link . "</a><br><br>\n\n";
            $text_body .= "Falls Sie den Link nicht folgen können, kopieren Sie bitte den Link in die Adresszeile Ihres Browsers.<br><br>\n\n";
            $text_body .= "Ihre Registrierungsdaten:<br><br>\n\n";
            $text_body .= "Email: " . $umail . "<br>\n";
            $text_body .= "Benutzername: " . $uname . "<br>\n";
            $text_body .= "Passwort: wie angegeben<br><br>\n\n";
            $text_body .= "Mit freundlichen Grüßen<br>\n";
            $text_body .= COMPANY . "<br>\n";

            //Daten ändern auf eigenen Mail server
            $mail = new PHPMailer(true);
            $mail->isSendmail();
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(COMPANY_EMAIL, COMPANY);
            $mail->addReplyTo(COMPANY_EMAIL, COMPANY);
            $mail->AddAddress($umail, $uname);

            $mail->Subject = COMPANY . " - Registrierung Bestätigung";

            $mail->msgHTML($text_body);
            $mail->AltBody = $text_body;

            if (!$mail->send()) {
                return "0" . $mail->ErrorInfo;
            } else {
                return "1";
            }
        } catch (phpmailerException $e) {
            return "0;" . $e->errorMessage(); //Pretty error messages from PHPMailer
        } catch (PDOException $e) {
            return "0;" . $e->getMessage();
        }
    }

    public function doLogin($uname, $umail, $upass)
    {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM users WHERE user_name=:uname OR user_email=:umail");
            $stmt->execute(array(':uname' => $uname, ':umail' => $umail));
            $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($stmt->rowCount() == 1) {
                if (md5($upass)==$userRow['user_pass']) {
                    if ($userRow['user_email_confirmed']==0) {
                        return '0;Sie haben Ihre Email Adresse noch nicht bestätigt<br><a href="' . WEB_ADDRESS . '/resend_email.php?email=' . $umail . '">Hier nochmal zusenden lassen</a>';
                    }
                    if ($userRow['user_erp_activated']==0 && $userRow['user_admin']==0) {
                        return "0;Bitte gedulden Sie sich noch ein wenig, Ihr Konto muss erst von " . COMPANY . " freigeschalten werden";
                    }
                    $_SESSION['user_session'] = $userRow['user_id'];
                    $_SESSION['user_email'] = $userRow['user_email'];
                    $_SESSION['user_name'] = $userRow['user_name'];
                    $_SESSION['user_id'] = $userRow['user_id'];
                    $_SESSION['user_admin'] = $userRow['user_admin'];
                    return "1";
                } else {
                    return "0;Benutzername oder Passwort falsch";
                }
            } else {
                return "0;Benutzername oder Passwort falsch";
            }
        } catch (PDOException $e) {
            return "0;" . $e->getMessage();
        }
    }

    public function doLoginPlain($uname, $umail, $upass)
    {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM users WHERE user_name=:uname OR user_email=:umail");
            $stmt->execute(array(':uname' => $uname, ':umail' => $umail));
            $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($stmt->rowCount() == 1) {
                if ($upass==$userRow['user_pass']) {
                    if ($userRow['user_email_confirmed']==0) {
                        return '0;Sie haben Ihre Email Adresse noch nicht bestätigt<br><a href="' . WEB_ADDRESS . '/resend_email.php?email=' . $umail . '">Hier nochmal zusenden lassen</a>';
                    }
                    if ($userRow['user_erp_activated']==0 && $userRow['user_admin']==0) {
                        return "0;Bitte gedulden Sie sich noch ein wenig, Ihr Konto muss erst von " . COMPANY . " freigeschalten werden";
                    }
                    $_SESSION['user_session'] = $userRow['user_id'];
                    $_SESSION['user_email'] = $userRow['user_email'];
                    $_SESSION['user_name'] = $userRow['user_name'];
                    $_SESSION['user_id'] = $userRow['user_id'];
                    $_SESSION['user_admin'] = $userRow['user_admin'];
                    return "1";
                } else {
                    return "0;Benutzername oder Passwort falsch";
                }
            } else {
                return "0;Benutzername oder Passwort falsch";
            }
        } catch (PDOException $e) {
            return "0;" . $e->getMessage();
        }
    }

    public function doKeyConfirm($umail, $ukey)
    {
        try {
            $stmt = $this->conn->prepare("SELECT user_id, user_name, user_email, user_pass, user_activation_key, user_activation_key_created FROM users WHERE user_email=:umail AND user_activation_key=:ukey");

            $stmt->bindparam(":umail", $umail);
            $stmt->bindparam(":ukey", $ukey);

            $stmt->execute();
            if (!$stmt) {
                return "0;" . $stmt->errorInfo();
            }

            $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($stmt->rowCount() == 1) {
                if ($userRow['user_activation_key_created']>(time() - 60*60*24)) {
                    return "0;Dieser Schlüssel ist älter als 24 Stunden, bitte fordern Sie einen neuen Schlüssel an!";
                } else {

                    $stmt = $this->conn->prepare("UPDATE users SET 	user_activation_key='',user_activation_key_created=NULL,user_email_confirmed=1 WHERE user_email=:umail ");

                    $stmt->bindparam(":umail", $umail);

                    $stmt->execute();
                    if (!$stmt) {
                        return "0;" . $stmt->errorInfo();
                    }

                    return "1";
                }
            } else {
                return "0;Schlüssel oder Email Adresse wurde nicht gefunden, bitte fordern Sie einen neuen Schlüssel an!";
            }
        } catch (PDOException $e) {
            echo $e->getMessage();
        }
    }

    public function doPasswordChange($uid, $upass)
    {
        try {

            $new_password = md5($upass);
            $stmt = $this->conn->prepare("UPDATE users SET user_pass=:upass,user_password_forgot_key='',user_password_forgot_key_created=NULL WHERE user_id=:uid ");

            $stmt->bindparam(":uid", $uid);
            $stmt->bindparam(":upass", $new_password);

            $stmt->execute();
            if (!$stmt) {
                return "0;" . $stmt->errorInfo();
            } else {
                return "1";
            }

        } catch (PDOException $e) {
            return "0;" . $e->getMessage();
        }
    }

    public function doPasswordForgot($umail)
    {
        try {

            //$temp_password = (string)random_password($length = 12, $type = 'alpha_numeric');

            $stmt = $this->conn->prepare("SELECT * FROM users WHERE user_email=:umail");
            $stmt->bindparam(":umail", $umail);
            $stmt->execute();
            if (!$stmt) {
                return false;
            }

            if ($stmt->rowCount() == 1) {

                $userRow = $stmt->fetch(PDO::FETCH_ASSOC);

                $key = (string)uuid();
                $link = WEB_ADDRESS . "/password_forgot_change.php?email=" . $umail . "&key=" . $key;

                //$new_password = (string)password_hash($temp_password, PASSWORD_DEFAULT);
                $key_date = time();

                $stmt = $this->conn->prepare("UPDATE users SET user_password_forgot_key=:ukey,user_password_forgot_key_created=FROM_UNIXTIME(:ukeydate) WHERE user_email=:umail ");

                $stmt->bindparam(":ukey", $key);
                $stmt->bindparam(":ukeydate", $key_date);
                $stmt->bindparam(":umail", $umail);

                $stmt->execute();
                if (!$stmt) {
                    return "0;" . $stmt->errorInfo();
                }

                $text_body = "";

                $text_body .= "Hallo " . $userRow['user_name'] . ",<br><br>\n\n";
                $text_body .= "Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.<br>\n";
                $text_body .= "Mit diesem Link (Gültigkeit 24 Stunden) können Sie Ihr Passwort zurücksetzen und ein Neues Passwort wählen.<br>\n";
                $text_body .= "Sollten Sie Ihr Passwort nicht vergessen haben bzw. keine Änderung Ihres Passworts wünschen,<br>\n";
                $text_body .= "betrachten Sie diese E-Mail bitte als gegenstandslos. Ihr Passwort bleibt somit unverändert.<br>\n";
                $text_body .= "Bitte wählen Sie, um das Passwort zurückzusetzen, folgenden Link:<br><br>\n\n";
                $text_body .= "<a href=\"" . $link . "\" target=\"_blank\">" . $link . "</a><br><br>\n\n";
                $text_body .= "Falls Sie den Link nicht direkt folgen können, kopieren Sie bitte den Link in die Adresszeile Ihres Browsers.<br><br>\n\n";
                $text_body .= "Mit freundlichen Grüßen<br>\n";
                $text_body .= COMPANY . "<br>\n";

                //Daten ändern auf eigenen Mail server
                $mail = new PHPMailer;
                $mail->isSendmail();
                $mail->CharSet = 'UTF-8';
                $mail->setFrom(COMPANY_EMAIL, COMPANY);
                $mail->addReplyTo(COMPANY_EMAIL, COMPANY);
                $mail->addAddress($umail, $userRow['user_name']);

                $mail->Subject = COMPANY . " - Änderung des Passwortes";

                $mail->msgHTML($text_body);
                $mail->AltBody = $text_body;

                if (!$mail->send()) {
                    return "0" . $mail->ErrorInfo;
                } else {
                    return "1";
                }
            } else {
                return "0;Schlüssel oder Email Adresse wurde nicht gefunden, bitte fordern Sie einen neuen Schlüssel an!";
            }
        } catch (PDOException $e) {
            echo $e->getMessage();
        }
    }

    public function doPasswordForgotKeyConfirm($umail, $ukey)
    {
        try {
            $stmt = $this->conn->prepare("SELECT user_id, user_name, user_email, user_pass, user_password_forgot_key, user_password_forgot_key_created FROM users WHERE user_email=:umail AND user_password_forgot_key=:ukey");

            $stmt->bindparam(":umail", $umail);
            $stmt->bindparam(":ukey", $ukey);

            $stmt->execute();
            if (!$stmt) {
                return "0;" . $stmt->errorInfo();
            }

            $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($stmt->rowCount() == 1) {
                if ($userRow['user_password_forgot_key_created']>(time() - 60*60*24)) {
                    return "0;Dieser Schlüssel ist älter als 24 Stunden, bitte fordern Sie einen neuen Schlüssel an !";
                } else {
                    return "1";
                }
            } else {
                return "0;Schlüssel oder Email Adresse wurde nicht gefunden, bitte fordern Sie einen neuen Schlüssel an !";
            }
        } catch (PDOException $e) {
            echo $e->getMessage();
        }
    }

    public function doPasswordForgetChange($umail, $upass)
    {

        try {

            $new_password = md5($upass);
            $stmt = $this->conn->prepare("UPDATE users SET user_pass=:upass,user_password_forgot_key='',user_password_forgot_key_created=NULL WHERE user_email=:umail ");

            $stmt->bindparam(":upass", $new_password);
            $stmt->bindparam(":umail", $umail);

            $stmt->execute();
            if (!$stmt) {
                return "0;" . $stmt->errorInfo();
            } else {
                return "1";
            }

        } catch (PDOException $e) {
            return "0;" . $e->getMessage();
        }
    }

    public
    function is_loggedin()
    {
        if (isset($_SESSION['user_session'])) {
            return true;
        }
    }

    public
    function redirect($url)
    {
        header("Location: $url");
    }

    public
    function doLogout()
    {
        session_destroy();
        unset($_SESSION['user_session']);
        unset($_SESSION['user_email']);
        unset($_SESSION['user_name']);
        return true;
    }
}

?>