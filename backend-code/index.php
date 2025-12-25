<?php
/**
 * Mylos Restaurant Product Database API
 * API Index/Documentation
 */

header('Content-Type: application/json; charset=UTF-8');

$api_info = [
    'name' => 'Mylos Restaurant Product Database API',
    'version' => '1.0.0',
    'status' => 'active',
    'endpoints' => [
        'test' => [
            'url' => '/api/test.php',
            'method' => 'GET',
            'description' => 'Test API connection and database'
        ],
        'products' => [
            'list' => 'GET /api/products/list.php',
            'search' => 'GET /api/products/search.php?q=query',
            'get' => 'GET /api/products/get.php?id=123',
            'create' => 'POST /api/products/create.php'
        ],
        'suppliers' => [
            'list' => 'GET /api/suppliers/list.php',
            'get' => 'GET /api/suppliers/get.php?id=123',
            'create' => 'POST /api/suppliers/create.php'
        ],
        'scanner' => [
            'upload' => 'POST /api/scanner/upload.php',
            'get' => 'GET /api/scanner/get-scan.php?id=123',
            'list' => 'GET /api/scanner/list.php'
        ]
    ],
    'documentation' => 'See SETUP-GUIDE.md for setup instructions'
];

echo json_encode($api_info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
