<?php

require_once("class.user.php");
require_once("config.php");

$login = new USER();

if (isset($_POST['btn-back'])) {
    $login->redirect('index.php');
}

include_once("header.php");
?>
    <div class="info-form">
        <div class="container">
            <form class="form-info-breit" method="post" id="login-form">
                <table class="table">
                    <tr style="text-align: center">
                        <td><?php echo COMPANY_HEADER; ?></td>
                    </tr>
                    <tr>
                        <td>
                            <h2 class="form-signin-heading" style="text-align: center">Impressum</h2>
                            <div class="form-control-static" style="padding-left: 200px;">
                                <span><b>ihr name</b><br>
                                ihre adresse · Tel. +43 ihre telefonnummer<br>
                                    E-Mail: ihre email adresse · <a href="https://www.syspredl.com">ihre webseite</a><br>
                                Firmenbuchnr.: xxx · UID-Nr.: ATU xxxxxx<br>
                                Inhalte der website - Änderungen und Irrtümer vorbehalten<br><br>
                                <span style="color: #00A2D1">Website Design und Entwicklung</span><br>
                                <b>Systemhaus Predl IT-GesmbH</b><br>
                                2191 Gaweinstal · Wienerstrasse 3 · Tel: +43 (0) 2574 / 28505<br>
                                Email: office@syspredl.com · <a href="http://www.syspredl.com">www.syspredl.com</a><br><br>
                            </div>
                            <div class="form-group">
                                <button type="submit" name="btn-back" class="btn btn-info">
                                    <i class="glyphicon glyphicon-check"></i>&nbsp;Zurück
                                </button>
                            </div>
                        </td>
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