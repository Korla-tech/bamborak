<?php

$config_cors_enabled = false;
$logging = false;
//$logging = true;

if (!$logging) {
    $webserver = "vmd70556.contaboserver.net";
    $port      = 8080;
} else {
    $webserver = "localhost";
    $port      = 8080;
}

$rel_path = "/api/info/";

include '../proxy.php';

?>
