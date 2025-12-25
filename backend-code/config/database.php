<?php
/**
 * Database Configuration
 * Update these values with your Hostinger MySQL credentials
 */

// Database credentials - UPDATE THESE!
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');     // Get from hPanel
define('DB_USER', 'your_database_user');     // Get from hPanel
define('DB_PASS', 'your_database_password'); // Get from hPanel
define('DB_CHARSET', 'utf8mb4');

// Error reporting (set to false in production)
define('DEBUG_MODE', false);

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]));
            } else {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Database connection failed. Please contact administrator.'
                ]));
            }
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Helper function to get database connection
function getDB() {
    return Database::getInstance()->getConnection();
}
