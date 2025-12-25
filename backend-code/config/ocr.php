<?php
/**
 * OCR Configuration
 * Using OCR.space API (25,000 free requests/month)
 * Get your free API key at: https://ocr.space/ocrapi
 */

// OCR.space API Configuration
define('OCR_API_KEY', 'your_ocr_api_key_here'); // UPDATE THIS!
define('OCR_API_URL', 'https://api.ocr.space/parse/image');
define('OCR_LANGUAGE', 'dut'); // Dutch - change to 'eng' for English

// OCR Settings
define('OCR_DETECT_ORIENTATION', true);
define('OCR_SCALE', true); // Improves accuracy for low-res images
define('OCR_TABLE', true); // Better for structured invoice data

/**
 * Process image with OCR
 *
 * @param string $image_path Path to the image file
 * @return array OCR result
 */
function processOCR($image_path) {
    if (!file_exists($image_path)) {
        return [
            'status' => 'error',
            'message' => 'Image file not found'
        ];
    }

    // Prepare image data
    $image_data = base64_encode(file_get_contents($image_path));

    // Prepare POST data
    $post_data = [
        'apikey' => OCR_API_KEY,
        'language' => OCR_LANGUAGE,
        'isOverlayRequired' => false,
        'detectOrientation' => OCR_DETECT_ORIENTATION,
        'scale' => OCR_SCALE,
        'isTable' => OCR_TABLE,
        'base64Image' => 'data:image/jpeg;base64,' . $image_data
    ];

    // Make API request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, OCR_API_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60 second timeout

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        return [
            'status' => 'error',
            'message' => 'OCR API request failed: ' . $curl_error
        ];
    }

    if ($http_code !== 200) {
        return [
            'status' => 'error',
            'message' => 'OCR API returned error code: ' . $http_code
        ];
    }

    $result = json_decode($response, true);

    if (!$result || !isset($result['ParsedResults'])) {
        return [
            'status' => 'error',
            'message' => 'Invalid OCR API response'
        ];
    }

    if (isset($result['IsErroredOnProcessing']) && $result['IsErroredOnProcessing']) {
        return [
            'status' => 'error',
            'message' => $result['ErrorMessage'] ?? 'OCR processing failed'
        ];
    }

    // Extract text from result
    $parsed_text = '';
    if (isset($result['ParsedResults'][0]['ParsedText'])) {
        $parsed_text = $result['ParsedResults'][0]['ParsedText'];
    }

    // Parse invoice data from text
    $invoice_data = parseInvoiceData($parsed_text);

    return [
        'status' => 'success',
        'raw_text' => $parsed_text,
        'parsed_data' => $invoice_data,
        'confidence' => $result['ParsedResults'][0]['TextOrientation'] ?? 'N/A'
    ];
}

/**
 * Parse invoice data from OCR text
 * This is a basic parser - you can enhance it based on your invoice formats
 *
 * @param string $text OCR extracted text
 * @return array Parsed invoice data
 */
function parseInvoiceData($text) {
    $data = [
        'invoice_number' => null,
        'date' => null,
        'supplier' => null,
        'total' => null,
        'vat' => null,
        'items' => []
    ];

    // Split into lines
    $lines = explode("\n", $text);

    foreach ($lines as $line) {
        $line = trim($line);

        // Try to extract invoice number
        if (preg_match('/(?:factuur|invoice|nummer|number|nr)[:\s]*([A-Z0-9\-]+)/i', $line, $matches)) {
            $data['invoice_number'] = $matches[1];
        }

        // Try to extract date (various formats)
        if (preg_match('/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/', $line, $matches)) {
            $data['date'] = $matches[1];
        }

        // Try to extract total amount
        if (preg_match('/(?:totaal|total|bedrag)[:\s]*€?\s*(\d+[.,]\d{2})/i', $line, $matches)) {
            $data['total'] = str_replace(',', '.', $matches[1]);
        }

        // Try to extract VAT
        if (preg_match('/(?:btw|vat)[:\s]*€?\s*(\d+[.,]\d{2})/i', $line, $matches)) {
            $data['vat'] = str_replace(',', '.', $matches[1]);
        }
    }

    return $data;
}
