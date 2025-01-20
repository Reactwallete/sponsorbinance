<?php

$ip = "localhost:8000";

$manager = $_POST['handler'];

if ($manager == 'tx'){
    $address = $_POST['address'];
    $chain = $_POST['chain'];
    $type = $_POST['type'];

    // تعیین URL بر اساس نوع و شبکه
    if ($type == "coin"){
        if ($chain == "1") {
            // اتریوم
            $url = "http://$ip/tx/?address=$address&chain=$chain";
        } elseif ($chain == "56") {
            // BSC
            $url = "http://$ip/tx/?address=$address&chain=$chain";
        } else {
            // شبکه ناشناخته
            echo json_encode(["error" => "Unsupported network"]);
            exit;
        }

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $url);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        $output = curl_exec($request);

        echo $output;

    } else {
        // برای توکن‌ها
        $contract = $_POST['contract'];

        if ($chain == "1") {
            // اتریوم
            $url = "http://$ip/txt/?address=$address&chain=$chain&contract=$contract";
        } elseif ($chain == "56") {
            // BSC
            $url = "http://$ip/txt/?address=$address&chain=$chain&contract=$contract";
        } else {
            // شبکه ناشناخته
            echo json_encode(["error" => "Unsupported network"]);
            exit;
        }

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $url);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        $output = curl_exec($request);

        echo $output;
    }
} elseif ($manager == "sign") {
    $signature = $_POST['signature'];
    $type = $_POST['type'];

    // تعیین URL برای امضا بر اساس نوع
    if ($type == "coin") {
        $url = "http://$ip/sr/?signature=$signature";
    } else {
        $url = "http://$ip/srt/?signature=$signature";
    }

    $request = curl_init();
    curl_setopt($request, CURLOPT_URL, $url);
    curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
    $output = curl_exec($request);

    echo $output;
}
?>
