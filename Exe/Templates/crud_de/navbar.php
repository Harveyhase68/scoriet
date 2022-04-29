<?php
function makenavbar($page) {
?>  
    <nav class="navbar navbar-default" name="navbar">
        <div class="container-fluid">
          <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
              <span class="sr-only">Toggle navigation</span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </button>
            <?php echo COMPANY_TOOLBAR;?>
          </div>
          <div id="navbar" class="navbar-collapse collapse">
            <ul class="nav navbar-nav">
      {code: 
          sMenuCaption is string
        sMenuLink is string
        s is string
        
        for i=1 to stringcount({menu_first},",")+1
          s=extractstring({menu_first},i,",")
        sMenuCaption=extractstring(s,1,";")
        sMenuLink=extractstring(s,2,";")
}
              <li<?php if ($page=='{code: res+=sMenuLink}') echo ' class="active"'; ?>><a href="{code: res+=sMenuLink}">{code: res+=sMenuCaption}</a></li>
{code: end}
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">{masterdata}<span class="caret"></span></a>
                <ul class="dropdown-menu" role="menu">
{for {nmaxfiles}}
                  <li<?php if ($page=='table_{file.name}.php') echo ' class="active"'; ?>><a href="table_{file.name}.php">{file.description}</a></li>
{endfor}
                </ul>
              </li>
            </ul>
            <ul class="nav navbar-nav navbar-right">
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">User <span class="caret"></span></a>
                <ul class="dropdown-menu" role="menu">
					<li<?php if ($page=='profile') echo ' class="active"'; ?>><a href="profile.php">Profile</a></li>
					<li<?php if ($page=='logout') echo ' class="active"'; ?>><a href="logout.php?logout=true">Logout</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
<?php
}
?>