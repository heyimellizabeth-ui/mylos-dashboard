<?php
/**
 * Utility Functions
 */

/**
 * Send JSON response
 */
function sendResponse($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $status_code = 400, $details = null) {
    $response = [
        'status' => 'error',
        'message' => $message
    ];

    if ($details !== null && DEBUG_MODE) {
        $response['details'] = $details;
    }

    sendResponse($response, $status_code);
}

/**
 * Send success response
 */
function sendSuccess($message, $data = null) {
    $response = [
        'status' => 'success',
        'message' => $message
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    sendResponse($response, 200);
}

/**
 * Get JSON input from request body
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON input: ' . json_last_error_msg());
    }

    return $data;
}

/**
 * Validate required fields
 */
function validateRequired($data, $required_fields) {
    $missing = [];

    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing));
    }
}

/**
 * Sanitize input string
 */
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Check if user is authenticated (basic implementation)
 * You can enhance this with JWT or session-based auth
 */
function requireAuth() {
    // For now, we'll skip authentication
    // TODO: Implement proper authentication
    return true;
}

/**
 * Get current user ID from session/token
 */
function getCurrentUserId() {
    // Basic implementation - enhance with real auth
    return 1; // Default admin user
}

/**
 * Validate file upload
 */
function validateFileUpload($file, $allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'], $max_size = 10485760) {
    if (!isset($file['error']) || is_array($file['error'])) {
        return 'Invalid file upload';
    }

    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'File too large (max ' . ($max_size / 1024 / 1024) . 'MB)';
        case UPLOAD_ERR_NO_FILE:
            return 'No file uploaded';
        default:
            return 'Upload error occurred';
    }

    if ($file['size'] > $max_size) {
        return 'File too large (max ' . ($max_size / 1024 / 1024) . 'MB)';
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime_type = $finfo->file($file['tmp_name']);

    if (!in_array($mime_type, $allowed_types)) {
        return 'Invalid file type. Allowed: ' . implode(', ', $allowed_types);
    }

    return true;
}

/**
 * Generate unique filename
 */
function generateUniqueFilename($original_filename) {
    $ext = pathinfo($original_filename, PATHINFO_EXTENSION);
    return uniqid('invoice_', true) . '.' . $ext;
}

/**
 * Format date for database
 */
function formatDateForDB($date_string) {
    $date = DateTime::createFromFormat('d-m-Y', $date_string);
    if (!$date) {
        $date = DateTime::createFromFormat('Y-m-d', $date_string);
    }
    if (!$date) {
        $date = DateTime::createFromFormat('d/m/Y', $date_string);
    }
    return $date ? $date->format('Y-m-d') : null;
}

/**
 * Format price for display
 */
function formatPrice($price) {
    return '€' . number_format($price, 2, ',', '.');
}

/**
 * Log error to file
 */
function logError($message, $context = []) {
    $log_file = __DIR__ . '/../logs/error.log';
    $log_dir = dirname($log_file);

    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $context_str = !empty($context) ? json_encode($context) : '';
    $log_message = "[$timestamp] $message $context_str\n";

    error_log($log_message, 3, $log_file);
}
