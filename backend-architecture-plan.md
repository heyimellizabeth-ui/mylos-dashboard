# Mylos Management Pro - Backend Architecture Plan

## Current Situation
- Frontend: Hosted at `softsyntax.dev/mylos/index.html`
- Hosting: Hostinger Business Plan
- Features Needed: Invoice OCR, Data Storage, Analytics, Supplier Management

## Option 1: Hostinger Native Backend (RECOMMENDED)

### Why This is Better for You:
- ✅ Already included in your Hostinger Business plan
- ✅ No additional costs
- ✅ Better control and customization
- ✅ Easier to debug and maintain
- ✅ All data stays on your server

### Tech Stack:
```
- PHP 8.x (comes with Hostinger)
- MySQL Database (included)
- REST API structure
- Optional: Tesseract OCR for invoice scanning
```

### What You Get with Hostinger Business:
- MySQL databases (multiple)
- PHP support
- SSH access
- Cron jobs (for scheduled tasks)
- Email functionality
- Storage space

### Implementation Steps:
1. Create MySQL database in Hostinger panel
2. Build PHP REST API endpoints
3. Connect frontend to API
4. Implement OCR processing
5. Add authentication/security

---

## Option 2: Firebase (Alternative)

### Pros:
- ✅ Quick to set up
- ✅ Real-time data sync
- ✅ Built-in authentication
- ✅ Free tier available

### Cons:
- ❌ Additional service to manage
- ❌ Vendor lock-in (Google)
- ❌ Limited control
- ❌ Costs can scale with usage
- ❌ OCR processing would still need separate solution

### Tech Stack:
```
- Firebase Firestore (database)
- Firebase Storage (file uploads)
- Firebase Functions (serverless)
- Firebase Authentication
```

---

## Recommended Architecture (Hostinger Native)

### Database Schema:

```sql
-- Purchases Table
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100),
    supplier_id INT,
    date DATE,
    amount DECIMAL(10,2),
    vat_amount DECIMAL(10,2),
    total DECIMAL(10,2),
    category VARCHAR(50),
    payment_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Suppliers Table
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Scans Table
CREATE TABLE invoice_scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT,
    file_path VARCHAR(255),
    ocr_data JSON,
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

-- Alerts Table
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(50),
    message TEXT,
    severity VARCHAR(20),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (for authentication)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints Structure:

```
/api/
├── auth/
│   ├── login.php
│   ├── logout.php
│   └── check.php
│
├── purchases/
│   ├── list.php         (GET - list all purchases)
│   ├── create.php       (POST - add new purchase)
│   ├── update.php       (PUT - update purchase)
│   ├── delete.php       (DELETE - remove purchase)
│   └── export-csv.php   (GET - export to CSV)
│
├── suppliers/
│   ├── list.php
│   ├── create.php
│   ├── update.php
│   └── delete.php
│
├── scanner/
│   ├── upload.php       (POST - upload invoice image)
│   ├── process-ocr.php  (POST - process with OCR)
│   └── get-scan.php     (GET - retrieve scan results)
│
├── analytics/
│   ├── dashboard.php    (GET - dashboard stats)
│   ├── spending.php     (GET - spending trends)
│   └── categories.php   (GET - category breakdown)
│
└── alerts/
    ├── list.php
    ├── mark-read.php
    └── create.php
```

### Folder Structure on Hostinger:

```
public_html/
├── mylos/
│   ├── index.html       (your current frontend)
│   ├── css/
│   ├── js/
│   └── assets/
│
├── api/                 (NEW - backend API)
│   ├── config/
│   │   ├── database.php
│   │   └── cors.php
│   ├── auth/
│   ├── purchases/
│   ├── suppliers/
│   ├── scanner/
│   ├── analytics/
│   └── alerts/
│
└── uploads/             (NEW - for invoice images)
    └── invoices/
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create MySQL database in Hostinger control panel
- [ ] Set up database tables (run SQL schema)
- [ ] Create `/api` folder structure
- [ ] Build database connection (`config/database.php`)
- [ ] Implement CORS headers for API access

### Phase 2: Core API (Week 2)
- [ ] Build Purchases CRUD endpoints
- [ ] Build Suppliers CRUD endpoints
- [ ] Implement CSV export functionality
- [ ] Test API with Postman or similar

### Phase 3: Authentication (Week 3)
- [ ] Implement user authentication (JWT or sessions)
- [ ] Secure all endpoints
- [ ] Update frontend to handle authentication

### Phase 4: Scanner Integration (Week 4)
- [ ] Set up file upload endpoint
- [ ] Integrate OCR solution (Tesseract or API service)
- [ ] Process invoice data extraction
- [ ] Store results in database

### Phase 5: Analytics & Alerts (Week 5)
- [ ] Build analytics calculation endpoints
- [ ] Implement smart alerts logic
- [ ] Create dashboard summary API

### Phase 6: Frontend Integration (Week 6)
- [ ] Update frontend to call real API endpoints
- [ ] Remove mock/localStorage data
- [ ] Add error handling
- [ ] Test end-to-end functionality

---

## OCR Solution Options

### Option A: Tesseract OCR (Free, Self-hosted)
- Install on Hostinger via SSH
- Process images server-side
- No per-request costs
- Requires server setup

### Option B: OCR.space API (Free tier available)
- Simple API integration
- 25,000 requests/month free
- No server setup needed
- Good accuracy

### Option C: Google Cloud Vision API
- Excellent accuracy
- Pay-per-use pricing
- 1,000 requests/month free
- More expensive at scale

---

## Security Considerations

1. **Authentication**: Use JWT tokens or PHP sessions
2. **Input Validation**: Sanitize all inputs
3. **SQL Injection**: Use prepared statements
4. **File Uploads**: Validate file types, limit sizes
5. **HTTPS**: Ensure all API calls use SSL
6. **API Rate Limiting**: Prevent abuse
7. **Environment Variables**: Store DB credentials securely

---

## Next Steps

1. **Decide on backend approach** (Hostinger native recommended)
2. **Access Hostinger control panel** and create MySQL database
3. **Set up SSH access** (if you want to install additional tools)
4. **Start with Phase 1** (database setup)
5. **I can help you code each component step by step**

## Questions to Answer:

1. Do you have SSH access enabled on your Hostinger account?
2. Have you created a MySQL database before in Hostinger?
3. How many users will access this system? (affects auth complexity)
4. Do you process many invoices per month? (affects OCR solution choice)
5. Do you want to start with Hostinger native or try Firebase first?

---

**My Recommendation**: Start with Hostinger native backend (Option 1). It's included in your plan, gives you full control, and you're not dependent on external services. We can always add Firebase later if needed for specific features like real-time sync.
