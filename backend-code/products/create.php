<?php
/**
 * Create New Product
 * POST /api/products/create.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getJsonInput();

// Validate required fields
validateRequired($data, ['name', 'category', 'unit']);

try {
    $db = getDB();

    $stmt = $db->prepare("
        INSERT INTO products
        (name, category, subcategory, unit, description, sku, storage_location,
         min_stock_level, current_stock, is_seasonal, season_months, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        sanitizeInput($data['name']),
        sanitizeInput($data['category']),
        $data['subcategory'] ?? null,
        sanitizeInput($data['unit']),
        $data['description'] ?? null,
        $data['sku'] ?? null,
        $data['storage_location'] ?? null,
        $data['min_stock_level'] ?? 0,
        $data['current_stock'] ?? 0,
        isset($data['is_seasonal']) ? (int)$data['is_seasonal'] : 0,
        $data['season_months'] ?? null,
        $data['notes'] ?? null
    ]);

    $product_id = $db->lastInsertId();

    sendSuccess('Product created successfully', [
        'id' => $product_id
    ]);

} catch (PDOException $e) {
    logError('Database error in products/create.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
