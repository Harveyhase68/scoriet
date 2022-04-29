<?php
session_start();

require_once('class.user.php');
require_once("config.php");

$user = new USER();

if (isset($_POST['btn-change-pwd'])) {

    $umail = strip_tags($_POST['txt_umail']);

    if (isset($_SERVER['REMOTE_ADDR'])) {
        $uIP = $_SERVER['REMOTE_ADDR'];
    } else {
        $uIP = "";
    }

    if ($umail == "") {
        $error[] = "Bitte geben Sie eine Email Adresse an !";
    } else if (!filter_var($umail, FILTER_VALIDATE_EMAIL)) {
        $error[] = 'Bitte geben Sie eine gültige Email Adresse an !';
    } else {
        try {
            $stmt = $user->runQuery("SELECT * FROM users WHERE user_email=:umail");
            $stmt->execute(array(':umail' => $umail));
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row['user_email'] == $umail) {
                $ret = $user->doPasswordForgot($umail);
                if ($ret) {
                    $user->redirect('password_forgot.php?send');
                } else {
                    $error[] = substr($ret, 2);
                }
            } else {
                $error[] = "Diese Email Adresse ist nicht gespeichert !";
            }
        } catch (PDOException $e) {
            $error[] = $e->getMessage();
        }
    }
}

include_once("header.php");
?>

    <div class="signin-form">

        <div class="container">

            <form method="post" class="form-signin">
                <div class="form-inner-container">
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
                    } else if (isset($_GET['send'])) {
                        ?>
                        <div class="alert alert-info">
                            <i class="glyphicon glyphicon-log-in"></i> &nbsp; Sie haben eine Email erhalten, folgen Sie
                            dem
                            Link im Email um Ihr Passwort zu ändern! <a
                                    href='index.php'>Zum Login</a>
                        </div>
                        <?php
                    }
                    ?>
                    <div class="form-group">
                        <input type="text" class="form-control" name="txt_umail" placeholder="Email"
                               value="<?php if (isset($error)) {
                                   echo $umail;
                               } ?>"/>
                    </div>
                    <div class="clearfix"></div>
                    <hr/>
                    <div class="form-group">
                        <button type="submit" class="btn btn-danger" name="btn-change-pwd">
                            <i class="glyphicon glyphicon-open-file"></i>&nbsp;Passwort zurücksetzen
                        </button>
                    </div>
                    <hr/>
                    <label>Ich habe mich bereits registriert ! <a href="index.php">Zum Login</a></label>
                </div>
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