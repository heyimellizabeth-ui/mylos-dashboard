<?php
/**
 * List Suppliers
 * GET /api/suppliers/list.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    $db = getDB();

    // Get suppliers with product count and stats
    $stmt = $db->query("
        SELECT
            s.*,
            COUNT(DISTINCT ps.product_id) as product_count,
            AVG(ps.current_price) as avg_price,
            (SELECT COUNT(*)
             FROM purchases p
             WHERE p.supplier_id = s.id
             AND p.purchase_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_orders
        FROM suppliers s
        LEFT JOIN product_suppliers ps ON s.id = ps.supplier_id AND ps.is_active = 1
        WHERE s.is_active = 1
        GROUP BY s.id
        ORDER BY s.name ASC
    ");

    $suppliers = $stmt->fetchAll();

    sendSuccess('Suppliers retrieved successfully', [
        'suppliers' => $suppliers
    ]);

} catch (PDOException $e) {
    logError('Database error in suppliers/list.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
