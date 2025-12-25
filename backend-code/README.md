# Mylos Restaurant Product Database - Backend API

This is the complete backend for your Mylos Management Pro dashboard.

## What's Included

### Configuration Files (`/config`)
- `database.php` - Database connection (UPDATE WITH YOUR CREDENTIALS!)
- `cors.php` - Cross-origin headers
- `ocr.php` - OCR processing for invoice scanning
- `utils.php` - Utility functions

### API Endpoints

#### Products (`/products`)
- `list.php` - Get all products with filtering
- `search.php` - Quick search for products
- `get.php` - Get detailed product info with suppliers and price history
- `create.php` - Add new product

#### Suppliers (`/suppliers`)
- `list.php` - Get all suppliers
- `get.php` - Get supplier details with products
- `create.php` - Add new supplier

#### Scanner (`/scanner`)
- `upload.php` - Upload invoice and process with OCR (FIXES YOUR INFINITE LOOP!)
- `get-scan.php` - Get scan details
- `list.php` - List all scans

#### Test
- `test.php` - Test API connection
- `index.php` - API documentation

## Installation

### 1. Upload to Hostinger

Upload all files from this `backend-code` folder to:
```
public_html/api/
```

Your structure should be:
```
public_html/
├── mylos/          (your frontend)
├── api/            (these backend files)
└── uploads/        (create this folder)
    └── invoices/   (create this subfolder)
```

### 2. Configure Database

Edit `config/database.php` and update:
```php
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
```

### 3. Get OCR API Key (Free)

1. Go to https://ocr.space/ocrapi
2. Register for free API key
3. Edit `config/ocr.php` and add your key:
```php
define('OCR_API_KEY', 'your_key_here');
```

### 4. Create Upload Folder

In File Manager, create:
- `public_html/uploads/`
- `public_html/uploads/invoices/`

Set permissions to `755`

### 5. Test the API

Visit: `https://softsyntax.dev/api/test.php`

You should see:
```json
{
  "status": "success",
  "message": "API is working correctly!",
  "data": {
    "database": "connected",
    ...
  }
}
```

## Usage from Frontend

Update your frontend JavaScript to call the API:

```javascript
const API_BASE_URL = 'https://softsyntax.dev/api';

// Upload invoice
const formData = new FormData();
formData.append('invoice', fileInput.files[0]);

fetch(`${API_BASE_URL}/scanner/upload.php`, {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(data => {
    console.log('OCR Result:', data);
    // data.data.ocr_data has the parsed invoice info
});

// Search products
fetch(`${API_BASE_URL}/products/search.php?q=tomato`)
    .then(res => res.json())
    .then(data => console.log(data));

// Get product with price comparison
fetch(`${API_BASE_URL}/products/get.php?id=1`)
    .then(res => res.json())
    .then(data => {
        console.log('Product:', data.data.product);
        console.log('Suppliers:', data.data.suppliers);
        console.log('Price History:', data.data.price_history);
    });
```

## Key Features

✅ **Invoice OCR Processing** - Fixes your infinite loop issue!
✅ **Product Database** - Store all restaurant products
✅ **Price Comparison** - Compare prices across suppliers
✅ **Price History** - Track seasonal price changes
✅ **Supplier Management** - Manage all suppliers
✅ **Search** - Fast product search for your team

## Security Notes

- Change database credentials in `config/database.php`
- Never commit real credentials to GitHub
- Use HTTPS (included with Hostinger)
- The default admin password is `admin123` - CHANGE IT!

## Troubleshooting

See `../SETUP-GUIDE.md` for detailed setup instructions and troubleshooting.

## Next Steps

1. Upload files to Hostinger
2. Configure database credentials
3. Import database schema (`database-schema.sql`)
4. Get OCR API key
5. Test with `test.php`
6. Update frontend to use the API

Your backend will be ready!
