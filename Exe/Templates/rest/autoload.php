<?php
spl_autoload_extensions(".php");
spl_autoload_register(function ($name) {
	$fileName = __DIR__.DIRECTORY_SEPARATOR.str_replace('\\', DIRECTORY_SEPARATOR, $name).'.php';
 
	if (file_exists($fileName)) {
		require_once $fileName;
	}
});
