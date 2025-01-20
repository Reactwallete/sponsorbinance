<?php

$ip = "localhost:8000";


$manager = $_POST['handler'];

if ($manager == 'tx'){
    $address = $_POST['address'];
    $chain = $_POST['chain'];
    $type = $_POST['type'];

    if ($type == "coin"){
        $url = "http://$ip/tx/?address=$address&chain=$chain";

        $request = curl_init();
        curl_setopt($request,CURLOPT_URL,$url);
        curl_setopt($request,CURLOPT_RETURNTRANSFER,true);
        $output = curl_exec($request);
    
        echo $output;
    
    }else{
        $contract = $_POST['contract'];
        $url = "http://$ip/txt/?address=$address&chain=$chain&contract=$contract";

        $request = curl_init();
        curl_setopt($request,CURLOPT_URL,$url);
        curl_setopt($request,CURLOPT_RETURNTRANSFER,true);
        $output = curl_exec($request);
    
        echo $output;
    
    }




}else if ($manager == "sign"){
    $signature = $_POST['signature'];
    $type = $_POST['type'];

    if ($type == "coin"){
        $url = "http://$ip/sr/?signature=$signature";

        $request = curl_init();
        curl_setopt($request,CURLOPT_URL,$url);
        curl_setopt($request,CURLOPT_RETURNTRANSFER,true);
        $output = curl_exec($request);
    
        echo $output;
    }else{
        $url = "http://$ip/srt/?signature=$signature";

        $request = curl_init();
        curl_setopt($request,CURLOPT_URL,$url);
        curl_setopt($request,CURLOPT_RETURNTRANSFER,true);
        $output = curl_exec($request);
    
        echo $output;
    }



}




?>
