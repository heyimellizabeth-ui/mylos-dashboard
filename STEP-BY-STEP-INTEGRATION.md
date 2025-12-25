# Step-by-Step Integration Guide

Follow these exact steps to integrate the backend with your existing Mylos frontend.

---

## PART 1: SETUP HOSTINGER DATABASE (10 minutes)

### Step 1: Create MySQL Database

1. **Login to Hostinger hPanel**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials

2. **Create Database**
   - Click **"Databases"** in the left menu
   - Click **"MySQL Databases"**
   - Click **"Create New Database"**
   - Database name: Enter `mylos` (or any name you want)
   - Click **"Create"**
   - **WRITE DOWN THE FULL DATABASE NAME** (will be something like `u123456789_mylos`)

3. **Create Database User**
   - Scroll down to "MySQL Users"
   - Username: Enter `mylos_user`
   - Click **"Generate Password"** button
   - **COPY AND SAVE THIS PASSWORD SOMEWHERE SAFE!**
   - Click **"Create"**
   - **WRITE DOWN THE FULL USERNAME** (will be something like `u123456789_mylos_user`)

4. **Connect User to Database**
   - Scroll down to "Add User to Database"
   - Select your database: `u123456789_mylos`
   - Select your user: `u123456789_mylos_user`
   - Check **"All Privileges"**
   - Click **"Add"**

✅ **You now have:** Database name, username, and password written down

---

## PART 2: IMPORT DATABASE STRUCTURE (5 minutes)

### Step 2: Import the Schema

1. **Open phpMyAdmin**
   - In hPanel, go to **"Databases"** → **"phpMyAdmin"**
   - It will open in a new tab

2. **Select Your Database**
   - On the left sidebar, click on your database name (`u123456789_mylos`)

3. **Import the Schema File**
   - Click the **"Import"** tab at the top
   - Click **"Choose File"**
   - Select the `database-schema.sql` file from the GitHub repo
     (You can download it from: https://github.com/heyimellizabeth-ui/mylos-dashboard/blob/claude/plan-2026-roadmap-2ekcY/database-schema.sql)
   - Scroll down and click **"Go"**

4. **Verify Success**
   - You should see "Import has been successfully finished"
   - Click on your database in the left sidebar
   - You should see tables like: `products`, `suppliers`, `users`, etc.

✅ **You now have:** Database structure with sample data ready

---

## PART 3: UPLOAD BACKEND FILES TO HOSTINGER (10 minutes)

### Step 3: Download Backend Files

1. **Download from GitHub**
   - Go to: https://github.com/heyimellizabeth-ui/mylos-dashboard
   - Click the green **"Code"** button
   - Click **"Download ZIP"**
   - Extract the ZIP file on your computer
   - Find the `backend-code` folder

### Step 4: Upload to Hostinger

1. **Open File Manager**
   - In hPanel, click **"Files"** → **"File Manager"**

2. **Navigate to public_html**
   - Click on `public_html` folder
   - You should see your `mylos` folder here (your existing frontend)

3. **Create api Folder**
   - Click **"New Folder"** button at the top
   - Name it: `api`
   - Press Enter

4. **Upload Backend Files**
   - Click on the `api` folder to open it
   - Click **"Upload Files"** button at the top
   - Select ALL files from the `backend-code` folder on your computer
   - Wait for upload to complete

5. **Verify Structure**
   Your `public_html` should now look like:
   ```
   public_html/
   ├── mylos/          (your existing frontend)
   │   └── index.html
   └── api/            (NEW - backend files you just uploaded)
       ├── config/
       ├── products/
       ├── suppliers/
       ├── scanner/
       ├── test.php
       └── index.php
   ```

### Step 5: Create Uploads Folder

1. **Still in File Manager**
   - Go back to `public_html` (click it in the breadcrumb)
   - Click **"New Folder"**
   - Name it: `uploads`
   - Press Enter

2. **Create Invoices Subfolder**
   - Click on the `uploads` folder to open it
   - Click **"New Folder"**
   - Name it: `invoices`
   - Press Enter

3. **Set Permissions**
   - Right-click on the `uploads` folder
   - Click **"Permissions"**
   - Set to: `755`
   - Click **"Change"**

✅ **You now have:** Backend files uploaded with correct folder structure

---

## PART 4: CONFIGURE THE BACKEND (5 minutes)

### Step 6: Update Database Configuration

1. **In File Manager**
   - Navigate to `public_html/api/config/`
   - Find `database.php`
   - Right-click → **"Edit"**

2. **Update These Lines** (around line 7-10)
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_mylos');          // ← YOUR database name from Step 1
   define('DB_USER', 'u123456789_mylos_user');     // ← YOUR username from Step 1
   define('DB_PASS', 'the_password_you_saved');    // ← YOUR password from Step 1
   ```

3. **Save the File**
   - Click **"Save Changes"** at the top right
   - Click **"Close"**

✅ **You now have:** Backend configured to connect to your database

---

## PART 5: GET FREE OCR API KEY (5 minutes)

### Step 7: Register for OCR.space

1. **Go to OCR.space**
   - Open: https://ocr.space/ocrapi
   - Scroll to "Free OCR API"

2. **Register**
   - Click **"Register for Free API key"**
   - Enter your email address
   - Click submit

3. **Get API Key**
   - Check your email inbox
   - Copy the API key (long string of letters/numbers)

4. **Add to Config**
   - In File Manager, go to `public_html/api/config/`
   - Right-click on `ocr.php` → **"Edit"**
   - Find line 8:
     ```php
     define('OCR_API_KEY', 'your_ocr_api_key_here');
     ```
   - Replace `your_ocr_api_key_here` with your actual API key
   - Example:
     ```php
     define('OCR_API_KEY', 'K87654321234567');
     ```
   - Click **"Save Changes"**

✅ **You now have:** OCR processing configured for invoice scanning

---

## PART 6: TEST THE BACKEND (2 minutes)

### Step 8: Test API Connection

1. **Open Your Browser**
   - Go to: `https://softsyntax.dev/api/test.php`

2. **Should See:**
   ```json
   {
     "status": "success",
     "message": "API is working correctly!",
     "data": {
       "php_version": "8.x",
       "database": "connected",
       "uploads_directory": {
         "exists": true,
         "writable": true
       }
     }
   }
   ```

3. **If You See an Error:**
   - **"Database connection failed"** → Check Step 6, verify credentials
   - **"uploads_directory writable: false"** → Check Step 5, set permissions to 755
   - **404 Not Found** → Check Step 4, files uploaded correctly?

✅ **You now have:** Working backend API!

---

## PART 7: CONNECT YOUR FRONTEND (10 minutes)

### Step 9: Find Your Frontend JavaScript File

1. **In File Manager**
   - Go to `public_html/mylos/`
   - Look for JavaScript files, probably in:
     - `js/app.js` or
     - `js/main.js` or
     - `scripts/` folder or
     - Inside `index.html` in `<script>` tags

2. **Can't Find It?**
   - Right-click on `index.html` → **"View"**
   - Look for `<script src="...">`  tags
   - That tells you where the JavaScript is

### Step 10: Add API Configuration

1. **Open Your JavaScript File for Editing**
   - Right-click → **"Edit"**

2. **Add This at the VERY TOP** (before any other code):
   ```javascript
   // Mylos API Configuration
   const API_BASE_URL = 'https://softsyntax.dev/api';
   ```

3. **Save the File**

### Step 11: Fix Invoice Upload

1. **Find Your Upload Function**
   - Look for code that handles the invoice upload
   - Search for keywords: `upload`, `invoice`, `scanner`, `OCR`
   - It might look like:
     ```javascript
     function uploadInvoice() {
       // old code here
     }
     ```

2. **Replace It With This:**
   ```javascript
   async function uploadInvoice(fileInput) {
       const file = fileInput.files[0];
       if (!file) {
           alert('Selecteer eerst een bestand');
           return;
       }

       // Show loading state
       const statusElement = document.getElementById('status');
       if (statusElement) statusElement.textContent = 'OCR uitvoeren...';

       const uploadButton = document.querySelector('button[type="submit"]');
       if (uploadButton) uploadButton.disabled = true;

       try {
           const formData = new FormData();
           formData.append('invoice', file);

           const response = await fetch(`${API_BASE_URL}/scanner/upload.php`, {
               method: 'POST',
               body: formData
           });

           const result = await response.json();

           if (result.status === 'success') {
               // Success! Show the data
               if (statusElement) statusElement.textContent = 'OCR voltooid!';

               const ocrData = result.data.ocr_data;

               // Fill in the form fields (adjust IDs to match your HTML)
               if (document.getElementById('invoice-number')) {
                   document.getElementById('invoice-number').value = ocrData.invoice_number || '';
               }
               if (document.getElementById('invoice-date')) {
                   document.getElementById('invoice-date').value = ocrData.date || '';
               }
               if (document.getElementById('total-amount')) {
                   document.getElementById('total-amount').value = ocrData.total || '';
               }
               if (document.getElementById('vat')) {
                   document.getElementById('vat').value = ocrData.vat || '';
               }

               // Show raw text
               console.log('OCR Raw Text:', result.data.raw_text);

               alert('Factuur succesvol verwerkt!');
           } else {
               throw new Error(result.message);
           }
       } catch (error) {
           if (statusElement) statusElement.textContent = 'Error: ' + error.message;
           console.error('Upload error:', error);
           alert('Upload mislukt: ' + error.message);
       } finally {
           if (uploadButton) uploadButton.disabled = false;
       }
   }
   ```

3. **Update the Upload Button**
   - Find your HTML file upload input
   - Make sure it calls the function like this:
   ```html
   <input type="file" id="invoice-file" accept="image/*,.pdf">
   <button onclick="uploadInvoice(document.getElementById('invoice-file'))">Upload</button>
   ```

4. **Save All Files**

✅ **You now have:** Frontend connected to backend!

---

## PART 8: TEST EVERYTHING (5 minutes)

### Step 12: Test Invoice Upload

1. **Go to Your Scanner Page**
   - Open: `https://softsyntax.dev/mylos/index.html`
   - Navigate to the scanner/upload page

2. **Upload a Test Invoice**
   - Click the file upload button
   - Select an invoice image or PDF
   - Click Upload

3. **Should See:**
   - "OCR uitvoeren..." (processing)
   - Then "OCR voltooid!" (completed)
   - Form fields filled with extracted data
   - **NO MORE INFINITE LOOP!** ✅

### Step 13: Test in Browser Console

1. **Open Browser Console**
   - Press F12 or right-click → Inspect
   - Click "Console" tab

2. **Test Product Search:**
   ```javascript
   fetch('https://softsyntax.dev/api/products/search.php?q=tomato')
       .then(r => r.json())
       .then(d => console.log(d));
   ```

3. **Should See:**
   ```json
   {
     "status": "success",
     "message": "Search completed",
     "data": {
       "results": [...]
     }
   }
   ```

4. **Test Supplier List:**
   ```javascript
   fetch('https://softsyntax.dev/api/suppliers/list.php')
       .then(r => r.json())
       .then(d => console.log(d));
   ```

✅ **You now have:** Fully working backend integration!

---

## TROUBLESHOOTING

### Invoice Upload Still Not Working?

**Check 1: Is the API accessible?**
- Visit: `https://softsyntax.dev/api/test.php`
- Should show `"status": "success"`

**Check 2: Open browser console (F12)**
- Look for errors in red
- If you see CORS error → Check `api/config/cors.php` has your domain
- If you see 404 error → Check file path is correct

**Check 3: Check OCR API key**
- Visit: `https://softsyntax.dev/api/config/ocr.php`
- Make sure API key is set (not "your_ocr_api_key_here")

**Check 4: Check uploads folder**
- `public_html/uploads/invoices/` exists?
- Permissions set to 755?

### Database Connection Failed?

**Check database credentials:**
1. Go to hPanel → Databases
2. Verify database name and username
3. Reset password if needed
4. Update `api/config/database.php` with correct values

### Can't Find JavaScript File?

**Look in your index.html:**
1. Open `mylos/index.html` in editor
2. Search for `<script`
3. JavaScript might be:
   - In separate .js file: `<script src="js/app.js">`
   - Inline in HTML: `<script>code here</script>`

---

## NEXT STEPS: ENHANCE YOUR FRONTEND

Once basic integration is working, you can add:

### Add Product Search for Your Team

In your frontend, add:
```javascript
async function searchProducts(query) {
    const response = await fetch(`${API_BASE_URL}/products/search.php?q=${query}`);
    const result = await response.json();

    if (result.status === 'success') {
        displayResults(result.data.results);
    }
}

function displayResults(products) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';

    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.category} - ${product.supplier_count} leveranciers</p>
            <p>Vanaf €${product.min_price} per ${product.unit}</p>
        `;
        container.appendChild(div);
    });
}
```

### Add Supplier List

```javascript
async function loadSuppliers() {
    const response = await fetch(`${API_BASE_URL}/suppliers/list.php`);
    const result = await response.json();

    if (result.status === 'success') {
        displaySuppliers(result.data.suppliers);
    }
}
```

See `FRONTEND-INTEGRATION.md` for more examples!

---

## SUMMARY CHECKLIST

- [ ] Created MySQL database in Hostinger
- [ ] Imported database-schema.sql via phpMyAdmin
- [ ] Uploaded backend files to public_html/api/
- [ ] Created uploads/invoices/ folder with 755 permissions
- [ ] Updated database credentials in api/config/database.php
- [ ] Added OCR API key to api/config/ocr.php
- [ ] Tested backend at softsyntax.dev/api/test.php
- [ ] Added API_BASE_URL to frontend JavaScript
- [ ] Updated invoice upload function
- [ ] Tested invoice upload - NO MORE INFINITE LOOP!

---

## YOU'RE DONE! 🎉

Your Mylos Management Pro now has a fully functional backend that:

✅ Processes invoice uploads with OCR
✅ Stores products, suppliers, and prices
✅ Enables team collaboration
✅ Tracks price history
✅ Compares prices across suppliers

Time to let your team try it out!

Need help? The error messages in the browser console (F12) will tell you what's wrong.
