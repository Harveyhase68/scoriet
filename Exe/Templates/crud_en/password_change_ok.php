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
    $user->doLogout();
    $user->redirect('index.php');
}
include_once("header.php");
?>

    <div class="signin-form">

        <div class="container">

            <form class="form-signin" method="post" id="login-form">

                <h2 class="form-signin-heading">Password change</h2>
                <hr/>

                <div class="alert alert-info">
                    <i class="glyphicon glyphicon-log-in"></i> &nbsp; Your password was changed successfully. You can now log in with the new password! <a
                            href='index.php'>To the login</a>
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