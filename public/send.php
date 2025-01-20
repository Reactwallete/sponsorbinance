<?php

// آدرس IP سرور
$ip = "localhost:8000";

// دریافت ورودی و بررسی مقدار آن
$manager = isset($_POST['handler']) ? $_POST['handler'] : null;

if ($manager === 'tx') {
    // دریافت و اعتبارسنجی ورودی‌ها
    $address = isset($_POST['address']) ? $_POST['address'] : null;
    $chain = isset($_POST['chain']) ? $_POST['chain'] : null;
    $type = isset($_POST['type']) ? $_POST['type'] : null;

    // بررسی مقادیر مورد نیاز
    if (!$address || !$chain || !$type) {
        echo json_encode(["error" => "Invalid input parameters."]);
        exit;
    }

    // درخواست برای نوع coin
    if ($type === "coin") {
        $url = "http://$ip/tx/?address=" . urlencode($address) . "&chain=" . urlencode($chain);

    } else if ($type === "token") { // درخواست برای نوع token
        $contract = isset($_POST['contract']) ? $_POST['contract'] : null;
        if (!$contract) {
            echo json_encode(["error" => "Contract address is required for tokens."]);
            exit;
        }
        $url = "http://$ip/txt/?address=" . urlencode($address) . "&chain=" . urlencode($chain) . "&contract=" . urlencode($contract);

    } else {
        echo json_encode(["error" => "Invalid type."]);
        exit;
    }

    // ارسال درخواست cURL
    $request = curl_init();
    curl_setopt($request, CURLOPT_URL, $url);
    curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
    $output = curl_exec($request);

    // بررسی وضعیت پاسخ
    if (curl_errno($request)) {
        echo json_encode(["error" => "cURL error: " . curl_error($request)]);
    } else {
        echo $output;
    }

    curl_close($request);

} else if ($manager === "sign") {
    // دریافت و اعتبارسنجی ورودی‌ها
    $signature = isset($_POST['signature']) ? $_POST['signature'] : null;
    $type = isset($_POST['type']) ? $_POST['type'] : null;

    if (!$signature || !$type) {
        echo json_encode(["error" => "Invalid input parameters for signing."]);
        exit;
    }

    // تعیین URL بر اساس نوع
    if ($type === "coin") {
        $url = "http://$ip/sr/?signature=" . urlencode($signature);
    } else if ($type === "token") {
        $url = "http://$ip/srt/?signature=" . urlencode($signature);
    } else {
        echo json_encode(["error" => "Invalid type."]);
        exit;
    }

    // ارسال درخواست cURL
    $request = curl_init();
    curl_setopt($request, CURLOPT_URL, $url);
    curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
    $output = curl_exec($request);

    // بررسی وضعیت پاسخ
    if (curl_errno($request)) {
        echo json_encode(["error" => "cURL error: " . curl_error($request)]);
    } else {
        echo $output;
    }

    curl_close($request);

} else {
    echo json_encode(["error" => "Invalid handler."]);
    exit;
}

?>
