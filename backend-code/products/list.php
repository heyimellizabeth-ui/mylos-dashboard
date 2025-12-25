<?php
/**
 * List Products
 * GET /api/products/list.php
 *
 * Returns list of products with optional filtering and search
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
    $per_page = isset($_GET['per_page']) ? min(100, max(1, intval($_GET['per_page']))) : 50;
    $offset = ($page - 1) * $per_page;

    // Filters
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $search = isset($_GET['search']) ? $_GET['search'] : null;
    $seasonal_only = isset($_GET['seasonal']) ? filter_var($_GET['seasonal'], FILTER_VALIDATE_BOOLEAN) : false;

    // Build query
    $where_clauses = ['p.is_active = 1'];
    $params = [];

    if ($category) {
        $where_clauses[] = 'p.category = ?';
        $params[] = $category;
    }

    if ($search) {
        $where_clauses[] = '(p.name LIKE ? OR p.description LIKE ?)';
        $search_term = '%' . $search . '%';
        $params[] = $search_term;
        $params[] = $search_term;
    }

    if ($seasonal_only) {
        $where_clauses[] = 'p.is_seasonal = 1';
    }

    $where_sql = implode(' AND ', $where_clauses);

    // Get total count
    $count_sql = "SELECT COUNT(*) as total FROM products p WHERE $where_sql";
    $count_stmt = $db->prepare($count_sql);
    $count_stmt->execute($params);
    $total = $count_stmt->fetch()['total'];

    // Get products with supplier count and best price
    $sql = "
        SELECT
            p.*,
            COUNT(DISTINCT ps.supplier_id) as supplier_count,
            MIN(ps.current_price) as min_price,
            MAX(ps.current_price) as max_price,
            (SELECT ps2.current_price
             FROM product_suppliers ps2
             WHERE ps2.product_id = p.id AND ps2.is_preferred = 1 AND ps2.is_active = 1
             LIMIT 1) as preferred_price
        FROM products p
        LEFT JOIN product_suppliers ps ON p.id = ps.product_id AND ps.is_active = 1
        WHERE $where_sql
        GROUP BY p.id
        ORDER BY p.name ASC
        LIMIT ? OFFSET ?
    ";

    $stmt = $db->prepare($sql);
    $query_params = array_merge($params, [$per_page, $offset]);
    $stmt->execute($query_params);
    $products = $stmt->fetchAll();

    sendSuccess('Products retrieved successfully', [
        'products' => $products,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total,
            'total_pages' => ceil($total / $per_page)
        ]
    ]);

} catch (PDOException $e) {
    logError('Database error in products/list.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
