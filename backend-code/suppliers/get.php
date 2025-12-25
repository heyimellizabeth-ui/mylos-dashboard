<?php
/**
 * Get Supplier Details
 * GET /api/suppliers/get.php?id=123
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

if (!isset($_GET['id']) || empty($_GET['id'])) {
    sendError('Supplier ID is required');
}

$supplier_id = intval($_GET['id']);

try {
    $db = getDB();

    // Get supplier details
    $stmt = $db->prepare("SELECT * FROM suppliers WHERE id = ? AND is_active = 1");
    $stmt->execute([$supplier_id]);
    $supplier = $stmt->fetch();

    if (!$supplier) {
        sendError('Supplier not found', 404);
    }

    // Get products supplied by this supplier
    $products_stmt = $db->prepare("
        SELECT
            p.id,
            p.name,
            p.category,
            p.unit,
            ps.current_price,
            ps.unit as price_unit,
            ps.is_preferred,
            ps.supplier_product_name,
            ps.last_price_update
        FROM product_suppliers ps
        JOIN products p ON ps.product_id = p.id
        WHERE ps.supplier_id = ? AND ps.is_active = 1 AND p.is_active = 1
        ORDER BY p.name ASC
    ");
    $products_stmt->execute([$supplier_id]);
    $products = $products_stmt->fetchAll();

    // Get recent purchase history
    $purchases_stmt = $db->prepare("
        SELECT
            p.id,
            p.invoice_number,
            p.purchase_date,
            p.total,
            p.payment_status
        FROM purchases p
        WHERE p.supplier_id = ?
        ORDER BY p.purchase_date DESC
        LIMIT 10
    ");
    $purchases_stmt->execute([$supplier_id]);
    $purchases = $purchases_stmt->fetchAll();

    sendSuccess('Supplier details retrieved successfully', [
        'supplier' => $supplier,
        'products' => $products,
        'recent_purchases' => $purchases
    ]);

} catch (PDOException $e) {
    logError('Database error in suppliers/get.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
