<?php
/**
 * Get Scan Details
 * GET /api/scanner/get-scan.php?id=123
 *
 * Retrieves details of a specific scan
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// Check if scan ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    sendError('Scan ID is required');
}

$scan_id = intval($_GET['id']);

try {
    $db = getDB();

    $stmt = $db->prepare("
        SELECT
            id,
            original_filename,
            ocr_data,
            ocr_status,
            processed_date,
            created_at
        FROM invoice_scans
        WHERE id = ?
    ");

    $stmt->execute([$scan_id]);
    $scan = $stmt->fetch();

    if (!$scan) {
        sendError('Scan not found', 404);
    }

    // Decode OCR data
    if ($scan['ocr_data']) {
        $scan['ocr_data'] = json_decode($scan['ocr_data'], true);
    }

    sendSuccess('Scan retrieved successfully', $scan);

} catch (PDOException $e) {
    logError('Database error in get-scan.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
