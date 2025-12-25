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

    // Try OCR but don't fail if it doesn't work (we'll do manual entry)
    $ocr_result = processOCR($file_path);
    $ocr_text = '';
    $ocr_status = 'pending';
    $ocr_data_json = null;

    if ($ocr_result['status'] === 'error') {
        // OCR failed, but that's okay - save as manual entry
        $ocr_status = 'manual';
        error_log('OCR skipped (expected): ' . $ocr_result['message']);
    } else {
        // OCR succeeded
        $ocr_status = 'completed';
        $ocr_data_json = json_encode([
            'raw_text' => $ocr_result['raw_text'] ?? '',
            'parsed_data' => $ocr_result['parsed_data'] ?? [],
            'confidence' => $ocr_result['confidence'] ?? 0
        ]);
    }

    // Save scan record (success OR manual)
    $stmt = $db->prepare("
        INSERT INTO invoice_scans
        (file_path, original_filename, ocr_data, ocr_status, processed_date, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, NOW(), ?, NOW())
    ");

    $stmt->execute([
        $file_path,
        $original_filename,
        $ocr_data_json,
        $ocr_status,
        getCurrentUserId()
    ]);

    $scan_id = $db->lastInsertId();

    // Return SUCCESS regardless of OCR status
    sendSuccess('Invoice uploaded successfully', [
        'scan_id' => $scan_id,
        'filename' => $unique_filename,
        'original_filename' => $original_filename,
        'ocr_status' => $ocr_status,
        'ocr_data' => $ocr_result['parsed_data'] ?? null,
        'raw_text' => $ocr_result['raw_text'] ?? '',
        'message' => $ocr_status === 'manual'
            ? 'Ready for manual entry'
            : 'OCR completed'
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
