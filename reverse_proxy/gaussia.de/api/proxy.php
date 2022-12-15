<?php
// PHP Proxy
// Responds to both HTTP GET and POST requests
//
// original idea see https://github.com/abdul/php-proxy

//echo "ich bin da!";

$config_not_avail_html=<<<EOT
<html>
<head>
<meta content="text/html; charset=UTF-8" http-equiv="content-type">
<title>ERROR</title>
</head>
<body>
<p>application not available</p>
</body>
</html>
EOT;

$fhlog = null;
if ($logging) {
    $fhlog = fopen('c:/temp/phpproxy.log', 'a') or die($php_errormsg);
    fwrite($fhlog, "\n\n\n\n\n*************************\n " . date("Y-m-d H:i:s") . " -> start logging\n\n");
}

// CORS support (e. g. for ajax requests )
if ($config_cors_enabled != null && $config_cors_enabled) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, HEAD');
    header('Access-Control-Allow-Headers: X-PINGOTHER, Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    header('Access-Control-Max-Age: 1728000');
}

$webserver_url= $webserver . ":" . $port . $rel_path; 

if (isset($_SERVER['REMOTE_ADDR'])) {
    $ip = $_SERVER['REMOTE_ADDR'];
} else {
    $ip = "unknown";
}

//$getvars = '';

// caveat: getvars contains the URL parameters regardless the request Method (GET, POST, ...)
$getvars = 'ip=' . $ip . '&';

foreach ($_GET as $key => $value) {
    $getvars .= $key . '=' . urlencode(trim($value)) . '&';
}

$error_curl = false;

$request_body = "";
$request_body = file_get_contents('php://input');


session_start();

$url = 'http://' . $webserver_url;

if ($fhlog != null) {
    fwrite($fhlog, "new Request to " . $url . "\n");
    //fwrite($fhlog, "apache_request_headers(): " . json_encode(apache_request_headers()) . "\n"); // get list of headers
}

//Start the Curl session

$session = curl_init($url);

if ($logging) {
    curl_setopt($session, CURLOPT_STDERR, $fhlog);
    curl_setopt($session, CURLOPT_VERBOSE, true);
}

$orig_req_headers = apache_request_headers(); // get list of headers

$request_header_array = array();
foreach ($orig_req_headers as $header => $value) { // iterate over that list of headers
    $request_header_array[] = $header . ": " . $value;
    if ($fhlog != null) {
        fwrite($fhlog, "request header: " . $header . ": " . $value . "\n");
    }
}

if ($fhlog != null) {
    fwrite($fhlog, "request header #: " . count($request_header_array) . "\n");
    fwrite($fhlog, "request body size: " . strlen($request_body) . "\n");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($session, CURLOPT_POST, true);
    if ($request_body != "") {
        curl_setopt($session, CURLOPT_POSTFIELDS, $request_body);
    }
} else if ($request_body != "") {
    if ($fhlog != null) {
        fwrite($fhlog, "*** warning: GET method with non-empty body not supported!\n");
        fwrite($fhlog, "request_body:\n'" . $request_body . "'\n");
    }
}
curl_setopt($session, CURLOPT_HTTPHEADER, $request_header_array);

if ($request_body == "") {
    curl_setopt($session, CURLOPT_FOLLOWLOCATION, true); // follow redictions if present
}

curl_setopt($session, CURLOPT_TIMEOUT, 60);
curl_setopt($session, CURLOPT_RETURNTRANSFER, true); // result of curl request is held in memory not printed to stdout

curl_setopt($session, CURLINFO_HEADER_OUT, true); // to enable curl_getinfo to deliver the header from the response

curl_setopt($session, CURLOPT_HEADER, 1); // header is part of the response

// Make the call
if (!$response = curl_exec($session)) {
    $error_curl = true;
    if ($fhlog != null) {
        fwrite($fhlog, "** curl_exec called - ERROR!\n");
    }
} else {
    $error_curl = false;
    if ($fhlog != null) {
        fwrite($fhlog, "** curl_exec called!\n");
    }
    $response_header_size = curl_getinfo($session, CURLINFO_HEADER_SIZE);
    $response_headers = substr($response, 0, $response_header_size);
    $response_body = substr($response, $response_header_size);

    if ($fhlog != null) {
        fwrite($fhlog, "response header size: " . strlen($response_headers) . "\n");
        fwrite($fhlog, "response body size: " . strlen($response_body) . "\n");
    }
    $headers_indexed_arr = explode("\r\n", $response_headers);
    foreach ($headers_indexed_arr as $header_line) {
        if ($header_line == "Transfer-Encoding: chunked") {
            continue;
        }
        header($header_line);
        if ($fhlog != null) {
            fwrite($fhlog, "response header: " . $header_line . "\n");
        }
    }
    /*if ($fhlog != null) {
    fwrite($fhlog, "response body:\n'" . $response_body . "'\n");
    }*/
    echo $response_body;
}

if ($error_curl) {
    http_response_code(503);

    echo $config_not_avail_html;

}

//echo '4';
curl_close($session);

if ($fhlog != null) {
    fwrite($fhlog, "\n*************************\n " . date("Y-m-d H:i:s") . " -> end logging\n\n\n");
    fclose($fhlog) or die($php_errormsg);
}
