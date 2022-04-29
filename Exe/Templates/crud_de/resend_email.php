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

    $umail = strip_tags($_GET['email']);
    $name = strip_tags($_GET['email']);

    $ret = $user->resend_email($umail, $name);

    if (!substr($ret, 0, 1) == "1") {
        $error = substr($ret, 2);
    }

}
include_once("header.php");

?>

    <div class="signin-form">

        <div class="container">

            <form class="form-signin" method="post" id="login-form">

                <h2 class="form-signin-heading">Aktivierungs-Email zusenden</h2>
                <hr/>

                <div class="alert alert-info">
                    <i class="glyphicon glyphicon-log-in"></i> &nbsp; Sie haben eine Email erhalten, bestätigen Sie nun
                    Ihre Email Adresse indem Sie auf den Link drücken, danach können Sie sich einloggen! <a
                            href='index.php'>Zum Login</a>
                </div>

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