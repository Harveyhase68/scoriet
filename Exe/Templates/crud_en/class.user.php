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

            $text_body .= "Hello " . $uname . ",<br><br>\n\n";
            $text_body .= "Your registration is almost complete. Please confirm the validity of your email address.<br><br>\n\n";
            $text_body .= "To confirm your email address, please follow this link:<br><br>\n\n";
            $text_body .= "<a href=\"" . $link . "\" target=\"_blank\">" . $link . "</a><br><br>\n\n";
            $text_body .= "If you cannot follow the link, please copy the link into the address line of your browser.<br><br>\n\n";
            $text_body .= "Your registration data:<br><br>\n\n";
            $text_body .= "Email: " . $umail . "<br>\n";
            $text_body .= "Username: " . $uname . "<br>\n";
            $text_body .= "Password: as specified<br><br>\n\n";
            $text_body .= "Sincerely yours<br>\n";
            $text_body .= COMPANY . "<br>\n";

            //Kopie senden!
            $mail = new PHPMailer(true);
            $mail->isSendmail();
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(COMPANY_EMAIL, COMPANY);
            $mail->addReplyTo(COMPANY_EMAIL, COMPANY);
            $mail->AddAddress(COMPANY_EMAIL, 'Registration of a customer');

            $mail->Subject = COMPANY . " - Registration of a customer";

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

            $mail->Subject = COMPANY . " - Registration of a customer";

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
                return "0;Username or email not found!";
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
            $text_body .= "Your registration is almost complete. Please confirm the validity of your email address.<br><br>\n\n";
            $text_body .= "To confirm your email address, please follow this link:<br><br>\n\n";
            $text_body .= "<a href=\"" . $link . "\" target=\"_blank\">" . $link . "</a><br><br>\n\n";
            $text_body .= "If you cannot follow the link, please copy the link into the address line of your browser.<br><br>\n\n";
            $text_body .= "Your registration data:<br><br>\n\n";
            $text_body .= "Email: " . $umail . "<br>\n";
            $text_body .= "Username: " . $uname . "<br>\n";
            $text_body .= "Passwort: wie angegeben<br><br>\n\n";
            $text_body .= "Sincerely yours<br>\n";
            $text_body .= COMPANY . "<br>\n";

            //Daten ändern auf eigenen Mail server
            $mail = new PHPMailer(true);
            $mail->isSendmail();
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(COMPANY_EMAIL, COMPANY);
            $mail->addReplyTo(COMPANY_EMAIL, COMPANY);
            $mail->AddAddress($umail, $uname);

            $mail->Subject = COMPANY . " - Registration confirmation";

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
                        return '0;You have not yet confirmed your email address<br><a href="' . WEB_ADDRESS . '/resend_email.php?email=' . $umail . '">Resend</a>';
                    }
                    if ($userRow['user_erp_activated']==0 && $userRow['user_admin']==0) {
                        return "0;Please be patient a little longer, your account must first be activated by " . COMPANY;
                    }
                    $_SESSION['user_session'] = $userRow['user_id'];
                    $_SESSION['user_email'] = $userRow['user_email'];
                    $_SESSION['user_name'] = $userRow['user_name'];
                    $_SESSION['user_id'] = $userRow['user_id'];
                    $_SESSION['user_admin'] = $userRow['user_admin'];
                    return "1";
                } else {
                    return "0;Username or password wrong";
                }
            } else {
                return "0;Username or password wrong";
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
                        return '0;You have not yet confirmed your email address<br><a href="' . WEB_ADDRESS . '/resend_email.php?email=' . $umail . '">Resend</a>';
                    }
                    if ($userRow['user_erp_activated']==0 && $userRow['user_admin']==0) {
                        return "0;Please be patient a little longer, your account must first be activated by " . COMPANY;
                    }
                    $_SESSION['user_session'] = $userRow['user_id'];
                    $_SESSION['user_email'] = $userRow['user_email'];
                    $_SESSION['user_name'] = $userRow['user_name'];
                    $_SESSION['user_id'] = $userRow['user_id'];
                    $_SESSION['user_admin'] = $userRow['user_admin'];
                    return "1";
                } else {
                    return "0;Username or password wrong";
                }
            } else {
                return "0;Username or password wrong";
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
                    return "0;This key is older than 24 hours, please request a new key!";
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
                return "0;Key or email address was not found, please request a new key!";
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

                $text_body .= "Hello," . $userRow['user_name'] . ",<br><br>\n\n";
                $text_body .= "ee have received a request to reset your password.<br>\n";
                $text_body .= "With this link (valid for 24 hours) you can reset your password and choose a new password.<br>\n";
                $text_body .= "If you have not forgotten your password or do not wish to change your password,<br>\n";
                $text_body .= "please regard this e-mail as irrelevant. Your password remains unchanged.<br>\n";
                $text_body .= "Please select the following link to reset the password:<br><br>\n\n";
                $text_body .= "<a href=\"" . $link . "\" target=\"_blank\">" . $link . "</a><br><br>\n\n";
                $text_body .= "If you cannot follow the link directly, please copy the link into the address line of your browser.<br><br>\n\n";
                $text_body .= "Sincerely yours<br>\n";
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
                return "0;Key or email address was not found, please request a new key!";
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
                    return "0;This key is older than 24 hours, please request a new key!";
                } else {
                    return "1";
                }
            } else {
                return "0;Key or email address was not found, please request a new key!";
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