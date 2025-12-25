<?php
/**
 * List All Scans
 * GET /api/scanner/list.php
 *
 * Returns list of all invoice scans
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    $db = getDB();

    // Pagination
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $per_page = isset($_GET['per_page']) ? min(100, max(1, intval($_GET['per_page']))) : 20;
    $offset = ($page - 1) * $per_page;

    // Get total count
    $count_stmt = $db->query("SELECT COUNT(*) as total FROM invoice_scans");
    $total = $count_stmt->fetch()['total'];

    // Get scans
    $stmt = $db->prepare("
        SELECT
            is_scan.id,
            is_scan.original_filename,
            is_scan.ocr_status,
            is_scan.processed_date,
            is_scan.created_at,
            p.invoice_number,
            s.name as supplier_name
        FROM invoice_scans is_scan
        LEFT JOIN purchases p ON is_scan.purchase_id = p.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY is_scan.created_at DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->execute([$per_page, $offset]);
    $scans = $stmt->fetchAll();

    sendSuccess('Scans retrieved successfully', [
        'scans' => $scans,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total,
            'total_pages' => ceil($total / $per_page)
        ]
    ]);

} catch (PDOException $e) {
    logError('Database error in list.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
