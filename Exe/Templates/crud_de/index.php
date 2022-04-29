<?php

session_start();

error_reporting(E_ALL);
ini_set('error_reporting', E_ALL);
ini_set('display_errors', true);
ini_set('html_errors', true);
ini_set('error_prepend_string', '');
ini_set('error_append_string', '');

require_once("class.user.php");
require_once("config.php");

$login = new USER();

if ($login->is_loggedin() != "") {
    unset($_SESSION['bestellungid']);
    $login->redirect('home.php');
}

if (isset($_POST['btn-login'])) {

    $uname = strip_tags($_POST['txt_uname_email']);
    $umail = strip_tags($_POST['txt_uname_email']);
    $upass = strip_tags($_POST['txt_password']);

    $ret = $login->doLogin($uname, $umail, $upass);

    if (substr($ret, 0, 1) == "1") {
        $login->redirect('home.php');
    } else {
        $error = substr($ret, 2);
    }
} else if (isset($_POST['btn-register'])) {
    $login->redirect('sign-up.php');
}

include_once("header.php");
?>
    <div class="signin-form">
        <div class="container">
            <form class="form-signin<?php if (USER_CAN_REGISTER) {
                echo "-breit";
            } ?>" method="post" id="login-form">
                <table class="table">
                    <tr style="text-align: center">
                        <td<?php if (USER_CAN_REGISTER) {
                            echo " colspan=\"2\"";
                        } ?>>
                            <?php echo COMPANY_HEADER; ?>
                            <?php if (OFFLINE) {?>
                                <hr>
                                <h3 class="text-center" style="color: #b92c28">Kundenbereich B2B, der Shop ist im Moment offline</h3>
                            <?php } ?>
                        </td>
                    </tr>
                    <tr>
                        <td>
                        <h2 class="form-signin-heading" style="text-align: center">Kunden Login</h2>
                            <div class="form-inner-container">
                                <div id="error">
                                    <?php
                                    if (isset($error)) {
                                        ?>
                                        <div class="alert alert-danger">
                                            <i class="glyphicon glyphicon-warning-sign"></i>
                                            &nbsp; <?php echo $error; ?> !
                                        </div>
                                        <?php
                                    }
                                    ?>
                                </div>

                                <div class="form-group">
                                    <input type="text" class="form-control" name="txt_uname_email"
                                           placeholder="Benutzername oder Email"/>
                                    <span id="check-e"></span>
                                </div>

                                <div class="form-group">
                                    <input type="password" class="form-control" name="txt_password"
                                           placeholder="Ihr Passwort"/>
                                </div>

                                <div class="form-group">
                                    <button type="submit" name="btn-login" class="btn btn-primary"<?php if (OFFLINE) { echo "disabled";}?>>
                                        <i class="glyphicon glyphicon-user"></i>&nbsp;Anmelden
                                    </button>
                                </div>
                                <hr>
                                <label>Passwort vergessen?<a href="password_forgot.php"<?php if (OFFLINE) { echo ' onclick="return false;"';}?>>&nbsp;Passwort zurücksetzen</a></label>
                            </div>
                        </td>
                        <?php if (USER_CAN_REGISTER) { ?>
                            <td style="max-width: 350px">
                                <h2 class="form-signin-heading" style="text-align: center"> Neue Kunden </h2>
                                <div class="form-inner-container">
                                    <div class="form-control-static">
                                        <span>Hier können Sie sich bei <?php echo COMPANY; ?> registrieren</span>
                                    </div>
                                    <div class="form-group">
                                        <button type="submit" name="btn-register" class="btn btn-info"<?php if (OFFLINE || REGISTER_OFFLINE) { echo "disabled";}?>>
                                            <i class="glyphicon glyphicon-thumbs-up"></i>&nbsp;Hier Registrieren
                                        </button>
                                    </div>
                                </div>
                            </td>
                        <?php } ?>
                    </tr>
                </table>

                <div>
                    <table width="100%">
                        <tr>
                            <td style="text-align: left"><span class="text-muted"><span class="copyright"><?php echo IMPRESSUM; ?></span></span></td>
                            <td style="text-align: right"><span class="text-muted"><span class="copyright"><?php echo FOOTER; ?></span></span></td>
                        </tr>
                    </table>
                </div>
            </form>
        </div>
    </div>

<?php
include_once("footer.php");