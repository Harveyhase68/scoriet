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

$user = new USER();

if (isset($_POST['btn-ok'])) {
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

    $ret = $user->doKeyConfirm($umail, $ukey);

    if (!substr($ret, 0, 1) == "1") {
        $error = substr($ret, 2);
    }
}
include_once("header.php");
?>

    <div class="signin-form">

        <div class="container">

            <form class="form-signin" method="post" id="login-form">

                <h2 class="form-signin-heading">Benutzerkonto aktivieren<br>Email Bestätigung</h2>
                <hr/>

                <?php if (isset($error)) { ?>
                    <div id="error">
                        <div class="alert alert-danger">
                            <i class="glyphicon glyphicon-warning-sign"></i> &nbsp; <?php echo $error; ?> !
                        </div>
                    </div>
                <?php } else { ?>
                    <div class="alert alert-info">
                        <i class="glyphicon glyphicon-log-in"></i> &nbsp; Ihre Email Adresse wurde bestätigt, bitte
                        warten Sie nun bis <?php echo COMPANY; ?> Sie für den B2B Shop freischaltet! <a
                                href='index.php'>Zum Login</a>
                    </div>
                <?php } ?>
                <hr/>

                <div class="form-group">
                    <button type="submit" name="btn-ok" class="btn btn-default">
                        <i class="glyphicon glyphicon-log-in"></i>&nbsp; OK
                    </button>
                </div>

                <br/>

            </form>

        </div>

    </div>

<?php
include_once("footer.php");