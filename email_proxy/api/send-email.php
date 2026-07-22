<?php
// api/send-email.php

// Include autoloader first so config can reference PHPMailer constants
require dirname(__DIR__) . '/vendor/autoload.php';

// Define absolute path to config file
$configFile = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuration file missing. Please create config/config.php from the example.']);
    exit;
}
$config = require $configFile;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// 1. Rate Limiting (Basic IP-based)
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$rateLimitDir = dirname(__DIR__) . '/logs';
if (!is_dir($rateLimitDir)) {
    mkdir($rateLimitDir, 0755, true);
}
$rateLimitFile = $rateLimitDir . '/rl_' . md5($ipAddress) . '.json';
$rateLimit = 10; // max requests
$rateWindow = 60; // per 60 seconds

if (file_exists($rateLimitFile)) {
    $data = json_decode(file_get_contents($rateLimitFile), true);
    if (time() - $data['timestamp'] < $rateWindow) {
        if ($data['count'] >= $rateLimit) {
            http_response_code(429);
            echo json_encode(['error' => 'Too Many Requests']);
            exit;
        }
        $data['count']++;
    } else {
        $data = ['count' => 1, 'timestamp' => time()];
    }
} else {
    $data = ['count' => 1, 'timestamp' => time()];
}
file_put_contents($rateLimitFile, json_encode($data));

// 2. Authentication (API Key)
function getApiKey() {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (empty($apiKey)) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (strpos($authHeader, 'Bearer ') === 0) {
            $apiKey = substr($authHeader, 7);
        }
    }
    return $apiKey;
}

$apiKey = getApiKey();

if (!hash_equals($config['api_key'], $apiKey)) {
    // Log failed authentication
    $logMessage = "[" . date('Y-m-d H:i:s') . "] Failed auth attempt from IP: $ipAddress\n";
    file_put_contents($config['log_file'], $logMessage, FILE_APPEND);
    
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// 3. Input Validation
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

$to = $input['to'] ?? '';
$from = $input['from'] ?? '';
$fromName = $input['from_name'] ?? '';
$subject = $input['subject'] ?? '';
$html = $input['html'] ?? '';
$text = $input['text'] ?? '';

if (empty($from) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing "from" email address']);
    exit;
}

if (empty($fromName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "from_name"']);
    exit;
}

if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing "to" email address']);
    exit;
}

if (empty($subject)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "subject"']);
    exit;
}

if (empty($html) && empty($text)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "html" or "text" content']);
    exit;
}

// 4. Send Email using PHPMailer
$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->SMTPAuth   = $config['smtp_auth'];
    $mail->Username   = $config['smtp_username'];
    $mail->Password   = $config['smtp_password'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->Port       = $config['smtp_port'];

    // Recipients
    $mail->setFrom($from, $fromName);
    $mail->addAddress($to);

    // Content
    $mail->isHTML(!empty($html));
    $mail->Subject = $subject;
    
    if (!empty($html)) {
        $mail->Body = $html;
        $mail->AltBody = $text ?? strip_tags($html);
    } else {
        $mail->Body = $text;
    }

    $mail->send();
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Email could not be sent. Mailer Error: ' . $mail->ErrorInfo]);
}
