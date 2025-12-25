<?php
/**
 * Create New Supplier
 * POST /api/suppliers/create.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getJsonInput();

// Validate required fields
validateRequired($data, ['name']);

try {
    $db = getDB();

    $stmt = $db->prepare("
        INSERT INTO suppliers
        (name, contact_person, email, phone, address, vat_number,
         payment_terms, delivery_days, minimum_order, notes, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        sanitizeInput($data['name']),
        $data['contact_person'] ?? null,
        $data['email'] ?? null,
        $data['phone'] ?? null,
        $data['address'] ?? null,
        $data['vat_number'] ?? null,
        $data['payment_terms'] ?? null,
        $data['delivery_days'] ?? null,
        $data['minimum_order'] ?? null,
        $data['notes'] ?? null,
        $data['rating'] ?? 0
    ]);

    $supplier_id = $db->lastInsertId();

    sendSuccess('Supplier created successfully', [
        'id' => $supplier_id
    ]);

} catch (PDOException $e) {
    logError('Database error in suppliers/create.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500);
}
