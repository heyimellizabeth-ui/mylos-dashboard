<?php
/**
 * Invoice Upload Endpoint
 * POST /api/scanner/upload.php
 *
 * Handles file upload and initiates OCR processing
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/utils.php';
require_once '../config/ocr.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Check if file was uploaded
if (!isset($_FILES['invoice']) || $_FILES['invoice']['error'] === UPLOAD_ERR_NO_FILE) {
    sendError('No file uploaded');
}

$file = $_FILES['invoice'];

// Validate file upload
$validation = validateFileUpload($file);
if ($validation !== true) {
    sendError($validation);
}

// Define upload directory
$upload_dir = __DIR__ . '/../../uploads/invoices/';

// Create upload directory if it doesn't exist
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        sendError('Failed to create upload directory');
    }
}

// Generate unique filename
$original_filename = basename($file['name']);
$unique_filename = generateUniqueFilename($original_filename);
$file_path = $upload_dir . $unique_filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $file_path)) {
    sendError('Failed to save uploaded file');
}

try {
    $db = getDB();

    // Process OCR immediately
    $ocr_result = processOCR($file_path);

    if ($ocr_result['status'] === 'error') {
        // Save scan record with failed status
        $stmt = $db->prepare("
            INSERT INTO invoice_scans
            (file_path, original_filename, ocr_status, uploaded_by, created_at)
            VALUES (?, ?, 'failed', ?, NOW())
        ");
        $stmt->execute([$file_path, $original_filename, getCurrentUserId()]);

        sendError('OCR processing failed: ' . $ocr_result['message'], 500);
    }

    // Save scan record with OCR data
    $stmt = $db->prepare("
        INSERT INTO invoice_scans
        (file_path, original_filename, ocr_data, ocr_status, processed_date, uploaded_by, created_at)
        VALUES (?, ?, ?, 'completed', NOW(), ?, NOW())
    ");

    $ocr_data_json = json_encode([
        'raw_text' => $ocr_result['raw_text'],
        'parsed_data' => $ocr_result['parsed_data'],
        'confidence' => $ocr_result['confidence']
    ]);

    $stmt->execute([
        $file_path,
        $original_filename,
        $ocr_data_json,
        getCurrentUserId()
    ]);

    $scan_id = $db->lastInsertId();

    // Return success with parsed data
    sendSuccess('Invoice uploaded and processed successfully', [
        'scan_id' => $scan_id,
        'filename' => $unique_filename,
        'original_filename' => $original_filename,
        'ocr_data' => $ocr_result['parsed_data'],
        'raw_text' => $ocr_result['raw_text']
    ]);

} catch (PDOException $e) {
    // Clean up uploaded file on database error
    if (file_exists($file_path)) {
        unlink($file_path);
    }

    logError('Database error in upload.php', ['error' => $e->getMessage()]);
    sendError('Database error occurred', 500, $e->getMessage());
} catch (Exception $e) {
    logError('Error in upload.php', ['error' => $e->getMessage()]);
    sendError('An error occurred', 500, $e->getMessage());
}
