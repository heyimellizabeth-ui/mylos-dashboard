<?php
/**
 * API Test Endpoint
 * GET /api/test.php
 *
 * Tests if the API is working and can connect to the database
 */

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'config/utils.php';

try {
    // Test database connection
    $db = getDB();
    $db->query("SELECT 1");

    // Get PHP version
    $php_version = phpversion();

    // Check if uploads directory exists
    $uploads_dir = __DIR__ . '/../uploads/invoices/';
    $uploads_writable = is_dir($uploads_dir) && is_writable($uploads_dir);

    sendSuccess('API is working correctly!', [
        'php_version' => $php_version,
        'database' => 'connected',
        'uploads_directory' => [
            'exists' => is_dir($uploads_dir),
            'writable' => $uploads_writable,
            'path' => $uploads_dir
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    sendError('API test failed', 500, [
        'error' => $e->getMessage()
    ]);
}
