<?php
// IMPORTANT: Store this file securely outside the public web root if possible!
// Or protect this file using .htaccess if inside the public root.
// Copy this file to 'config.php' and update credentials.

return [
    // Secret API Key. Generate a strong random string (e.g., 64 chars).
    'api_key' => 'YOUR_SECURE_RANDOM_API_KEY_HERE',
    
    'mail' => [
        // Hostinger SMTP settings
        'host' => 'smtp.hostinger.com',
        'port' => 465, // 465 for SSL, 587 for TLS
        'username' => 'no-reply@yourdomain.com',
        'password' => 'YOUR_EMAIL_PASSWORD',
        'encryption' => 'ssl', // 'ssl' or 'tls'
        'from_address' => 'no-reply@yourdomain.com',
        'from_name' => 'Logistics Service',
    ],
    
    'rate_limit' => [
        'max_requests' => 100, // Max requests per hour per IP
        // Absolute path outside webroot is highly recommended for logs
        'file_path' => __DIR__ . '/logs/rate_limit.json',
    ],
    
    'logging' => [
        // Absolute path outside webroot is highly recommended for logs
        'failed_auth_file' => __DIR__ . '/logs/failed_auth.log',
    ]
];
