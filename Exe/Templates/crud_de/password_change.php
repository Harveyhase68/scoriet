<?php

require_once("session.php");
require_once('class.user.php');
require_once("config.php");

$user = new USER();

$user_id = $_SESSION['user_session'];

$stmt = $user->runQuery("SELECT * FROM users WHERE user_id=:user_id");
$stmt->execute(array(":user_id" => $user_id));

$userRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (isset($_POST['btn-change-password'])) {

    $uoldpass = strip_tags($_POST['txt_oldpass']);
    $upass = strip_tags($_POST['txt_upass']);
    $upassconfirm = strip_tags($_POST['txt_upass_confirm']);

    if (md5($uoldpass)<>$userRow['user_pass']) {
        $error[] = "Altes Passwort ist leider falsch !" . "old: " . $uoldpass . "(" . md5($uoldpass);
    } else if ($upass == "") {
        $error[] = "Wählen Sie ein neues Passwort !";
    } else if ($upass <> $upassconfirm) {
        $error[] = "Passwort und Passwort Bestätigung müssen übereinstimmen !";
    } else if (strlen($upass) < 6) {
        $error[] = "Neues Passwort muss mindestens 6 Stellen haben";
    } else {
        $ret = $user->doPasswordChange($user_id, $upass);
        if (!substr($ret, 0, 1) == "1") {
            $error[] = substr($ret, 2);
        } else {
            $user->redirect('password_change_ok.php');
        }
    }
} else if (isset($_POST['btn-back'])) {
    $user->redirect('index.php');
}

include_once("header.php");
include_once("navbar.php");
?>

    <div class="clearfix"></div>

    <div class="signin-form">

        <div class="container">

            <hr/>

            <form method="post" class="form-signin">
                <div class="form-inner-container">
                    <h2 class="form-signin-heading">Passwort ändern</h2>
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
                    }
                    ?>
                    <div class="form-group">
                        <input type="password" class="form-control" name="txt_oldpass"
                               placeholder="Aktuelles Passwort"/>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" name="txt_upass"
                               placeholder="Passwort (6 Stellen min)"/>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" name="txt_upass_confirm" placeholder="Bestätigung"/>
                    </div>
                    <div class="clearfix"></div>
                    <hr/>
                    <div class="form-group">
                        <button type="submit" class="btn btn-change-password" name="btn-back">
                            <i class="glyphicon glyphicon-open-file"></i>&nbsp;Zurück
                        </button>
                        <button type="submit" class="btn btn-primary" name="btn-change-password">
                            <i class="glyphicon glyphicon-open-file"></i>&nbsp;Ändern
                        </button>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span class="copyright"><?php echo FOOTER; ?></span>
                </div>
            </form>
        </div>
    </div>
<?php
include_once("footer.php");