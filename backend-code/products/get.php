<?php
/**
 * Get Product Details with Suppliers and Price History
 * GET /api/products/get.php?id=123
 *
 * Returns detailed product info including all suppliers, prices, and price history
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

if (!isset($_GET['id']) || empty($_GET['id'])) {
    sendError('Product ID is required');
}

$product_id = intval($_GET['id']);

try {
    $db = getDB();

    // Get product details
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ? AND is_active = 1");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch();

    if (!$product) {
        sendError('Product not found', 404);
    }

    // Get all suppliers for this product with current prices
    $suppliers_stmt = $db->prepare("
        SELECT
            ps.id as product_supplier_id,
            ps.supplier_product_name,
            ps.supplier_sku,
            ps.current_price,
            ps.unit,
            ps.is_preferred,
            ps.delivery_time_days,
            ps.last_price_update,
            ps.notes,
            s.id as supplier_id,
            s.name as supplier_name,
            s.contact_person,
            s.email,
            s.phone,
            s.payment_terms,
            s.delivery_days,
            s.rating
        FROM product_suppliers ps
        JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.product_id = ? AND ps.is_active = 1 AND s.is_active = 1
        ORDER BY ps.is_preferred DESC, ps.current_price ASC
    ");
    $suppliers_stmt->execute([$product_id]);
    $suppliers = $suppliers_stmt->fetchAll();

    // Calculate price comparison stats
    $prices = array_column($suppliers, 'current_price');
    $price_stats = [
        'min' => !empty($prices) ? min($prices) : 0,
        'max' => !empty($prices) ? max($prices) : 0,
        'avg' => !empty($prices) ? array_sum($prices) / count($prices) : 0,
        'count' => count($suppliers)
    ];

    // Get price history (last 12 months)
    $history_stmt = $db->prepare("
        SELECT
            ph.price,
            ph.unit,
            ph.effective_date,
            ph.season,
            ph.price_change_percent,
            ph.notes,
            s.name as supplier_name
        FROM price_history ph
        JOIN product_suppliers ps ON ph.product_supplier_id = ps.id
        JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.product_id = ?
        AND ph.effective_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        ORDER BY ph.effective_date DESC
        LIMIT 50
    ");
    $history_stmt->execute([$product_id]);
    $price_history = $history_stmt->fetchAll();

    // Get recent purchases of this product
    $purchases_stmt = $db->prepare("
        SELECT
            pi.quantity,
            pi.unit,
            pi.unit_price,
            p.purchase_date,
            s.name as supplier_name
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE pi.product_id = ?
        ORDER BY p.purchase_date DESC
        LIMIT 10
    ");
    $purchases_stmt->execute([$product_id]);
    $recent_purchases = $purchases_stmt->fetchAll();

    sendSuccess('Product details retrieved successfully', [
        'product' => $product,
        'suppliers' => $suppliers,
        'price_stats' => $price_stats,
        'price_history' => $price_history,
        'recent_purchases' => $recent_purchases
    ]);

} catch (PDOException $e) {
    logError('Database error in products/get.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
