<?php
/**
 * Search Products
 * GET /api/products/search.php?q=tomato
 *
 * Fast product search endpoint for team members looking up products
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

if (!isset($_GET['q']) || empty($_GET['q'])) {
    sendError('Search query is required');
}

$query = $_GET['q'];

try {
    $db = getDB();

    // Search in product name, description, and category
    $stmt = $db->prepare("
        SELECT
            p.id,
            p.name,
            p.category,
            p.subcategory,
            p.unit,
            p.description,
            p.is_seasonal,
            p.season_months,
            COUNT(DISTINCT ps.supplier_id) as supplier_count,
            MIN(ps.current_price) as min_price
        FROM products p
        LEFT JOIN product_suppliers ps ON p.id = ps.product_id AND ps.is_active = 1
        WHERE p.is_active = 1
        AND (
            p.name LIKE ?
            OR p.description LIKE ?
            OR p.category LIKE ?
            OR p.subcategory LIKE ?
        )
        GROUP BY p.id
        ORDER BY p.name ASC
        LIMIT 20
    ");

    $search_term = '%' . $query . '%';
    $stmt->execute([$search_term, $search_term, $search_term, $search_term]);
    $results = $stmt->fetchAll();

    sendSuccess('Search completed', [
        'query' => $query,
        'results' => $results,
        'count' => count($results)
    ]);

} catch (PDOException $e) {
    logError('Database error in products/search.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
