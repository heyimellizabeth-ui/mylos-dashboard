<?php
/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * Allows your frontend to communicate with the API
 */

// Set allowed origins (your website domain)
$allowed_origins = [
    'https://softsyntax.dev',
    'http://softsyntax.dev',
    'https://www.softsyntax.dev',
    'http://localhost:3000', // for local testing
    'http://localhost:8000'
];

// Get the origin of the request
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Check if the origin is in our allowed list
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default to your main domain
    header("Access-Control-Allow-Origin: https://softsyntax.dev");
}

// Allow credentials
header("Access-Control-Allow-Credentials: true");

// Allow specific methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Allow specific headers
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Cache preflight requests for 1 hour
header("Access-Control-Max-Age: 3600");

// Set content type to JSON
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
