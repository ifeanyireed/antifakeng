<?php
// config.example.php
// IMPORTANT: Copy this to config.php and update the credentials.
// For enhanced security, ensure this folder is not web-accessible.

return [
    // API Authentication Key (Generate a secure random string)
    'api_key' => 'my_api_key_6f3b92d8a4c1e7f50b4a1d9c2e8f7a3b',

    // SMTP Configuration (Hostinger Local SMTP or remote)
    'smtp_host'     => 'smtp.hostinger.com', 
    'smtp_auth'     => true,                 
    'smtp_username' => 'hello@resultspro.ng',
    'smtp_password' => '*Reedb4b4',
    // ENCRYPTION_STARTTLS (587) or ENCRYPTION_SMTPS (465)
    'smtp_secure'   => PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS, 
    'smtp_port'     => 465,

    // Sender Details are now strictly provided via the API JSON payload.

    // Log file path for failed auth (Make sure PHP has write permissions)
    'log_file'      => __DIR__ . '/../logs/auth_failures.log',
];
