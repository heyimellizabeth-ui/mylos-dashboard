# Mylos Backend Setup Guide for Hostinger hPanel

## Step 1: Create MySQL Database in hPanel

1. **Log into hPanel** at https://hpanel.hostinger.com
2. Go to **"Databases"** → **"MySQL Databases"**
3. Click **"Create New Database"**
   - Database name: `mylos_db` (or your preferred name)
   - Click **"Create"**
4. **Create Database User:**
   - Username: `mylos_user` (or your preferred username)
   - Password: Click **"Generate"** for a strong password
   - **IMPORTANT**: Copy and save these credentials:
     ```
     Database Name: u123456789_mylos_db (example - yours will have your user ID)
     Username: u123456789_mylos_user
     Password: [the generated password]
     Host: localhost
     ```
5. **Assign User to Database:**
   - Select the database you created
   - Select the user you created
   - Grant **"All Privileges"**
   - Click **"Add User to Database"**

## Step 2: Upload Backend Files via File Manager

1. In hPanel, go to **"Files"** → **"File Manager"**
2. Navigate to `public_html/`
3. You should see your existing `mylos/` folder with your frontend
4. Create a new folder called `api/` next to `mylos/`
5. Upload all the files from the `backend-code/` folder to `public_html/api/`

Your structure should look like:
```
public_html/
├── mylos/           (your existing frontend)
│   └── index.html
├── api/             (NEW - backend files)
│   ├── config/
│   ├── auth/
│   ├── purchases/
│   └── ...
└── uploads/         (NEW - for invoice files)
    └── invoices/
```

## Step 3: Configure Database Connection

1. Navigate to `public_html/api/config/`
2. Edit `database.php`
3. Update the credentials you saved from Step 1:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_mylos_db');    // YOUR database name
   define('DB_USER', 'u123456789_mylos_user');  // YOUR username
   define('DB_PASS', 'your_generated_password'); // YOUR password
   ```

## Step 4: Import Database Schema

### Option A: Using phpMyAdmin (Easier)
1. In hPanel, go to **"Databases"** → **"phpMyAdmin"**
2. Select your `mylos_db` database from the left sidebar
3. Click **"Import"** tab
4. Click **"Choose File"** and select `database-schema.sql`
5. Click **"Go"** at the bottom
6. You should see "Import has been successfully finished"

### Option B: Using SSH (Advanced)
```bash
mysql -u u123456789_mylos_user -p u123456789_mylos_db < database-schema.sql
```

## Step 5: Set Up File Upload Directory

1. In File Manager, create folder: `public_html/uploads/invoices/`
2. Right-click the `uploads` folder → **"Permissions"**
3. Set permissions to `755` (read/write/execute for owner)
4. Set `invoices/` subfolder to `755` as well

## Step 6: Get OCR API Key (Free)

Since you process ~60 invoices/month, we'll use OCR.space (25,000 free requests/month):

1. Go to https://ocr.space/ocrapi
2. Click **"Register for free API key"**
3. Enter your email
4. Check your email for the API key
5. Edit `api/config/ocr.php` and add your key:
   ```php
   define('OCR_API_KEY', 'your_ocr_space_api_key_here');
   ```

## Step 7: Test the API

1. Open your browser and go to:
   ```
   https://softsyntax.dev/api/test.php
   ```
2. You should see:
   ```json
   {
     "status": "success",
     "message": "API is working!",
     "database": "connected",
     "php_version": "8.x"
   }
   ```

## Step 8: Update Frontend to Use API

In your frontend JavaScript files, change the API base URL to:
```javascript
const API_BASE_URL = 'https://softsyntax.dev/api';
```

## Troubleshooting

### "Database connection failed"
- Check credentials in `api/config/database.php`
- Verify database user has all privileges
- Check database name includes your Hostinger user ID prefix

### "Permission denied" errors
- Check folder permissions are set to 755
- Check file permissions are set to 644
- Ensure `uploads/` folder exists and is writable

### "CORS errors" in browser console
- The `cors.php` file should handle this automatically
- If issues persist, check your domain is whitelisted in `config/cors.php`

### API returns 500 error
- Check PHP error logs in hPanel → "Advanced" → "Error Logs"
- Enable error display temporarily in `config/database.php` (for debugging only)

## Security Notes

- Never commit `config/database.php` with real credentials to GitHub
- Use HTTPS for all API calls (Hostinger provides free SSL)
- Change default passwords after setup
- Regularly backup your database via hPanel

## Next Steps

Once setup is complete:
1. Test each API endpoint using the test files
2. Update your frontend to call real API endpoints
3. Test invoice upload and OCR processing
4. Set up user authentication
5. Configure automated backups

Need help? Check the individual endpoint documentation in each folder's README.md file.
