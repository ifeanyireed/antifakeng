<?php return array(
    'root' => array(
        'name' => 'project/email-proxy',
        'pretty_version' => 'dev-main',
        'version' => 'dev-main',
        'reference' => '08803ac29ae671d88822ddb32c35cb88cdf38266',
        'type' => 'library',
        'install_path' => __DIR__ . '/../../',
        'aliases' => array(),
        'dev' => true,
    ),
    'versions' => array(
        'phpmailer/phpmailer' => array(
            'pretty_version' => 'v6.12.0',
            'version' => '6.12.0.0',
            'reference' => 'd1ac35d784bf9f5e61b424901d5a014967f15b12',
            'type' => 'library',
            'install_path' => __DIR__ . '/../phpmailer/phpmailer',
            'aliases' => array(),
            'dev_requirement' => false,
        ),
        'project/email-proxy' => array(
            'pretty_version' => 'dev-main',
            'version' => 'dev-main',
            'reference' => '08803ac29ae671d88822ddb32c35cb88cdf38266',
            'type' => 'library',
            'install_path' => __DIR__ . '/../../',
            'aliases' => array(),
            'dev_requirement' => false,
        ),
    ),
);
