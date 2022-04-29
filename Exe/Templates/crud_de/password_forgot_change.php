<?php
session_start();

require_once('class.user.php');
require_once("config.php");

$user = new USER();
$massive_error = (bool)false;

if (isset($_POST['btn-change-password'])) {

    $umail = strip_tags($_POST['txt_umail']);
    $upass = strip_tags($_POST['txt_upass']);
    $upassconfirm = strip_tags($_POST['txt_upass_confirm']);

    if ($upass == "") {
        $error[] = "Wählen Sie ein neues Passwort !";
    } else if ($upass <> $upassconfirm) {
        $error[] = "Passwort und Passwort Bestätigung müssen übereinstimmen !";
    } else if (strlen($upass) < 6) {
        $error[] = "Neues Passwort muss mindestens 6 Stellen haben";
    } else {
        $ret = $user->doPasswordForgetChange($umail, $upass);
        if (!substr($ret, 0, 1) == "1") {
            $error[] = substr($ret, 2);
        } else {
            $user->redirect('password_forgot_change_ok.php');
        }
    }
} else if (isset($_POST['btn-ok'])) {
    $user->redirect('index.php');
} else {

    if (isset($_GET['email'])) {
        $umail = strip_tags($_GET['email']);
    } else {
        $user->redirect('index.php');
    }
    if (isset($_GET['key'])) {
        $ukey = strip_tags($_GET['key']);
    } else {
        $user->redirect('index.php');
    }

    $ret = $user->doPasswordForgotKeyConfirm($umail, $ukey);
    if (!substr($ret, 0, 1) == "1") {
        $error[] = "Emailadresse oder Schlüssel nicht gefunden !";
        $massive_error = true;
    }
}

include_once("header.php");
?>

    <div class="signin-form">

        <div class="container">

            <form method="post" class="form-signin">
                <h2 class="form-signin-heading">Passwort vergessen</h2>
                <hr/>
                <?php
                if (isset($error)) {
                    foreach ($error as $error) {
                        ?>
                        <div class="alert alert-danger">
                            <i class="glyphicon glyphicon-warning-sign"></i> &nbsp; <?php echo $error; ?>
                        </div>
                        <?php
                    }
                } else if (isset($_GET['changed'])) {
                    ?>
                    <div class="alert alert-info">
                        <i class="glyphicon glyphicon-log-in"></i> &nbsp; Sie haben erfolgreich Ihr Passwort
                        geändert!<br>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary" name="btn-ok">
                            <i class="glyphicon glyphicon-open-file"></i>&nbsp;Zurück
                        </button>
                    </div>
                    <?php
                }
                if (!isset($_GET['changed']) && !$massive_error) { ?>
                    <div class="form-group">
                        <input type="text" class="form-control" name="txt_umail" placeholder="Email"
                               value="<?php echo $umail; ?>"/>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" name="txt_upass"
                               placeholder="Passwort (6 Stellen min)"/>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" name="txt_upass_confirm"
                               placeholder="Passwort Bestätigen"/>
                    </div>
                    <div class="clearfix"></div>
                    <hr/>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary" name="btn-change-password">
                            <i class="glyphicon glyphicon-open-file"></i>&nbsp;Passwort ändern
                        </button>
                    </div>
                <?php } ?>
            </form>
        </div>
    </div>
<?php
include_once("footer.php");