# Frontend Integration Guide

This guide shows you how to connect your existing Mylos frontend to the new backend API.

## Step 1: Update API Configuration

In your frontend JavaScript (likely in `mylos/js/app.js` or similar), add:

```javascript
// API Configuration
const API_BASE_URL = 'https://softsyntax.dev/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
```

## Step 2: Fix Invoice Upload (PRIORITY!)

Replace your current invoice upload code with:

```javascript
// In your scanner page
async function uploadInvoice(fileInput) {
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    // Show loading state
    const uploadBtn = document.getElementById('upload-btn');
    const statusText = document.getElementById('status-text');
    uploadBtn.disabled = true;
    statusText.textContent = 'OCR uitvoeren...';

    try {
        const formData = new FormData();
        formData.append('invoice', file);

        const response = await fetch(`${API_BASE_URL}/scanner/upload.php`, {
            method: 'POST',
            body: formData
            // Don't set Content-Type header - browser will set it with boundary
        });

        const result = await response.json();

        if (result.status === 'success') {
            // OCR completed!
            displayOCRResults(result.data.ocr_data);
            statusText.textContent = 'OCR voltooid!';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
        console.error('Upload error:', error);
    } finally {
        uploadBtn.disabled = false;
    }
}

function displayOCRResults(ocrData) {
    // Display the extracted data
    document.getElementById('invoice-number').value = ocrData.invoice_number || '';
    document.getElementById('invoice-date').value = ocrData.date || '';
    document.getElementById('total-amount').value = ocrData.total || '';
    document.getElementById('vat-amount').value = ocrData.vat || '';
    document.getElementById('raw-text').value = ocrData.raw_text || '';
}
```

## Step 3: Product Search for Team

```javascript
// Quick product search
async function searchProduct(query) {
    if (query.length < 2) return;

    try {
        const result = await apiCall(`/products/search.php?q=${encodeURIComponent(query)}`);

        // Display results
        displaySearchResults(result.data.results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(products) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.category} - ${product.unit}</p>
            <p>${product.supplier_count} leveranciers vanaf €${product.min_price}</p>
            ${product.is_seasonal ? '<span class="seasonal-badge">Seizoensproduct</span>' : ''}
        `;
        item.onclick = () => showProductDetails(product.id);
        resultsContainer.appendChild(item);
    });
}
```

## Step 4: Show Product Details with Price Comparison

```javascript
async function showProductDetails(productId) {
    try {
        const result = await apiCall(`/products/get.php?id=${productId}`);
        const { product, suppliers, price_stats, price_history } = result.data;

        // Display product info
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-category').textContent = product.category;

        // Display supplier comparison
        const supplierTable = document.getElementById('supplier-comparison');
        supplierTable.innerHTML = `
            <tr>
                <th>Leverancier</th>
                <th>Prijs</th>
                <th>Levertijd</th>
                <th>Contact</th>
            </tr>
        `;

        suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            row.className = supplier.is_preferred ? 'preferred' : '';
            row.innerHTML = `
                <td>
                    ${supplier.supplier_name}
                    ${supplier.is_preferred ? '<span class="badge">Voorkeur</span>' : ''}
                </td>
                <td class="price">€${supplier.current_price}</td>
                <td>${supplier.delivery_time_days || '-'} dagen</td>
                <td>${supplier.phone || '-'}</td>
            `;
            supplierTable.appendChild(row);
        });

        // Display price stats
        document.getElementById('min-price').textContent = `€${price_stats.min}`;
        document.getElementById('max-price').textContent = `€${price_stats.max}`;
        document.getElementById('avg-price').textContent = `€${price_stats.avg.toFixed(2)}`;

        // Display price history chart
        renderPriceHistoryChart(price_history);

    } catch (error) {
        console.error('Error loading product:', error);
    }
}
```

## Step 5: Load Products List

```javascript
async function loadProducts(filters = {}) {
    try {
        let url = '/products/list.php?';

        if (filters.category) url += `category=${filters.category}&`;
        if (filters.search) url += `search=${filters.search}&`;
        if (filters.seasonal) url += `seasonal=true&`;

        const result = await apiCall(url);
        displayProductsTable(result.data.products);
        updatePagination(result.data.pagination);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProductsTable(products) {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.unit}</td>
            <td>${product.supplier_count} leveranciers</td>
            <td class="price">€${product.min_price} - €${product.max_price}</td>
            <td>
                <button onclick="showProductDetails(${product.id})">Bekijken</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
```

## Step 6: Load Suppliers

```javascript
async function loadSuppliers() {
    try {
        const result = await apiCall('/suppliers/list.php');
        displaySuppliers(result.data.suppliers);
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

function displaySuppliers(suppliers) {
    const container = document.getElementById('suppliers-container');
    container.innerHTML = '';

    suppliers.forEach(supplier => {
        const card = document.createElement('div');
        card.className = 'supplier-card';
        card.innerHTML = `
            <h3>${supplier.name}</h3>
            <p><strong>Contact:</strong> ${supplier.contact_person || '-'}</p>
            <p><strong>Email:</strong> ${supplier.email || '-'}</p>
            <p><strong>Telefoon:</strong> ${supplier.phone || '-'}</p>
            <p><strong>Betalingstermijn:</strong> ${supplier.payment_terms || '-'}</p>
            <p><strong>Levertijden:</strong> ${supplier.delivery_days || '-'}</p>
            <p><strong>Producten:</strong> ${supplier.product_count}</p>
            <p><strong>Rating:</strong> ${'★'.repeat(Math.floor(supplier.rating))}${'☆'.repeat(5 - Math.floor(supplier.rating))}</p>
            <button onclick="showSupplierDetails(${supplier.id})">Details</button>
        `;
        container.appendChild(card);
    });
}
```

## Step 7: Add New Product (for admins)

```javascript
async function addProduct(formData) {
    try {
        const result = await apiCall('/products/create.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        alert('Product toegevoegd!');
        loadProducts(); // Reload list
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Example usage
const productForm = {
    name: 'Roma Tomaten',
    category: 'Groenten',
    subcategory: 'Tomaten',
    unit: 'kg',
    description: 'Verse Roma tomaten',
    is_seasonal: true,
    season_months: 'Mei-Sep'
};

addProduct(productForm);
```

## Quick Reference: API Endpoints

### Products
- `GET /products/list.php` - Get all products
- `GET /products/search.php?q=query` - Search products
- `GET /products/get.php?id=123` - Get product details with suppliers
- `POST /products/create.php` - Add new product

### Suppliers
- `GET /suppliers/list.php` - Get all suppliers
- `GET /suppliers/get.php?id=123` - Get supplier details
- `POST /suppliers/create.php` - Add new supplier

### Scanner
- `POST /scanner/upload.php` - Upload & process invoice
- `GET /scanner/get-scan.php?id=123` - Get scan details
- `GET /scanner/list.php` - List all scans

## Testing

1. Test API connection:
   ```javascript
   fetch('https://softsyntax.dev/api/test.php')
       .then(r => r.json())
       .then(d => console.log(d));
   ```

2. Test product search:
   ```javascript
   searchProduct('tomaat');
   ```

3. Test invoice upload:
   - Use the file input in your scanner page
   - Upload should now complete instead of infinite loop!

## Common Issues

### CORS Errors
If you see CORS errors in console, check:
- `config/cors.php` has your domain listed
- You're using HTTPS for both frontend and API

### Upload Doesn't Work
- Check `uploads/invoices/` folder exists
- Check folder permissions (755)
- Check OCR API key is set in `config/ocr.php`

### Database Errors
- Verify database credentials in `config/database.php`
- Run `database-schema.sql` to create tables

## Next Steps

1. Replace localStorage with real API calls
2. Add loading states for better UX
3. Add error handling and user feedback
4. Test with your team members
5. Consider adding user authentication

Your backend is ready to use!
