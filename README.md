# 🌌 Apex Infinity ERP — Complete System Report

[![Angular](https://img.shields.io/badge/Angular-21-DD0031.svg?style=flat&logo=angular)](https://angular.io/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-21-690196.svg?style=flat&logo=prime)](https://primeng.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Electron](https://img.shields.io/badge/Electron-41-47848F.svg?style=flat&logo=electron)](https://www.electronjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101.svg?style=flat&logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)

**Apex Infinity** is a comprehensive, multi-tenant **Enterprise Resource Planning (ERP) + CRM + E-Commerce** platform designed for modern businesses of all sizes. It provides a fully modular, scalable, real-time solution for managing everything from financials and supply chains to human resources, customer relations, logistics, and a public-facing storefront — all within a single unified platform.

---

## 📋 Table of Contents

1. [System Architecture](#-system-architecture)
2. [Technology Stack](#-technology-stack)
3. [Quick Start](#-quick-start)
4. [Project Structure](#-project-structure)
5. [Authentication & Security](#-authentication--security)
6. [ERP Dashboard & Navigation](#-erp-dashboard--navigation)
7. [Analytics & Business Intelligence](#-analytics--business-intelligence)
8. [Financial Management](#-financial-management)
9. [Sales & Invoicing](#-sales--invoicing)
10. [Inventory & Product Management](#-inventory--product-management)
11. [Purchase & Supplier Management](#-purchase--supplier-management)
12. [Customer Relationship Management](#-customer-relationship-management)
13. [HRMS — Human Resource Management](#-hrms--human-resource-management)
14. [Logistics & Delivery](#-logistics--delivery)
15. [Team Collaboration](#-team-collaboration)
16. [Notes & Knowledge Management](#-notes--knowledge-management)
17. [Public Storefront Engine](#-public-storefront-engine)
18. [Storefront Admin Command Center](#-storefront-admin-command-center)
19. [AI Agent Module](#-ai-agent-module)
20. [Notification & Automation System](#-notification--automation-system)
21. [Organization & Access Control](#-organization--access-control)
22. [Admin & Platform Management](#-admin--platform-management)
23. [Real-Time Features](#-real-time-features)
24. [API Reference](#-api-reference)
25. [Deployment](#-deployment)
26. [Testing](#-testing)

---

## 🏗️ System Architecture

Apex Infinity is a **full-stack monorepo** split into two main projects:

| Repository | Role | Port |
|------------|------|------|
| `apex` (this repo) | Angular 21 Frontend (SPA + SSR) | 4200 |
| `apex-crm-backend` | Node.js + Express REST API | 4000 |

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           APEX INFINITY PLATFORM                           │
│                                                                            │
│  ┌──────────────────────────┐    REST/WS    ┌────────────────────────────┐│
│  │    Angular 21 SPA + SSR  │◄────────────►│   Express.js REST API      ││
│  │    + Electron Desktop    │              │   /api/v1 (Port 4000)       ││
│  │    (Port 4200)           │              │   MongoDB + Socket.io       ││
│  └──────────────────────────┘              └────────────────────────────┘│
│             │                                          │                   │
│    ┌────────┴───────────┐                   ┌──────────┴──────────┐       │
│    │  Vercel (Web Host) │                   │  Cloudinary (Files)  │       │
│    │  Electron (Desktop)│                   │  Nodemailer (Email)  │       │
│    │  Expo (Mobile)     │                   │  Cron Jobs (Auto)    │       │
│    └────────────────────┘                   └─────────────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model
- Every organization gets a unique **slug** (URL identifier) and **shopId**
- All data (products, customers, sales, staff, etc.) is **org-scoped** — fully isolated per tenant
- **Branch hierarchy** allows sub-division of any organization into multiple operational locations

### Deployment Targets
| Target | Technology | URL |
|--------|-----------|-----|
| **Web** | Vercel (SSR) | `https://apex-infinity.vercel.app` |
| **Desktop** | Electron 41 | `.exe` via `electron-builder` |
| **Mobile** | Expo / React Native | via `eas.json` |

---

## 🛠️ Technology Stack

### Frontend
| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Angular (Standalone Components + Signals) | 21 |
| UI Components | PrimeNG + PrimeIcons | 21 |
| Material Design | Angular Material + CDK | 21 |
| Styling | TailwindCSS + PostCSS | 4.1 |
| Rich Text Editor | TipTap (with links, tasks, placeholder, underline) | 3 |
| Data Grid | AG Grid Angular | 35 |
| Charts | Chart.js | 4 |
| Maps | Leaflet | 1.9 |
| QR/Barcode Scanner | html5-qrcode | 2.3 |
| Excel Export | ExcelJS | 4 |
| File Download | file-saver | 2 |
| Real-time | Socket.io Client | 4 |
| Server-Side Rendering | Angular SSR (Express) | 21 |
| Desktop Shell | Electron | 41 |
| Reactive State | RxJS | 7.8 |

### Backend (`apex-crm-backend`)
| Category | Technology |
|----------|-----------|
| Runtime | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (7-day) + HTTP-only Cookies |
| Real-time | Socket.io |
| File Storage | Cloudinary CDN |
| Email | Nodemailer (SMTP / Gmail App Password) |
| PDF Generation | Invoice PDF controller |
| API Documentation | Swagger UI (at `/api-docs`) |
| Security | Helmet, express-mongo-sanitize, xss-clean, HPP |
| Rate Limiting | express-rate-limit |
| Logging | Morgan + Winston |
| Scheduling | node-cron |
| Query Parsing | qs |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20+
- **Angular CLI** — `npm install -g @angular/cli`
- **MongoDB** (local or Atlas)

### Frontend Installation

```bash
# Install dependencies
npm install

# Start Development Server
npm run start:dev          # Development (default)
npm run start:qa           # QA (connected to OnRender API)
npm run start:prod         # Production mode

# Build for Deployment
npm run build:dev
npm run build:qa
npm run build:prod

# SSR Production Server
npm run serve:ssr:apex

# Desktop (Electron)
npm run electron:serve     # Dev with live reload
npm run electron:dev       # Dev build + Electron
npm run electron:prod      # Production build + Electron
npm run dist               # Package as installable .exe
```

### Backend (`apex-crm-backend`)

```bash
# Install dependencies
npm install

# Start server
npm start                  # Production
npm run dev                # Development (nodemon)
```

### Required Environment Variables (Backend)

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE=mongodb://127.0.0.1:27017/yourDbName

# JWT
JWT_SECRET=your_super_secure_secret
JWT_EXPIRES_IN=7d

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_app_password

# Cron Job Schedules (cron syntax)
PAYMENT_REMINDER_CRON=0 9 * * *
OVERDUE_REMINDER_CRON=30 9 * * *
EMI_CHECK_CRON=0 8 * * *
INVENTORY_ALERT_CRON=0 10 * * *
ENABLE_CRONS=true

# Low Stock Threshold
LOW_STOCK_THRESHOLD=10
```

---

## 📁 Project Structure

```text
apex/
├── src/
│   ├── app/
│   │   ├── AIAgent/                   # AI chat agent components
│   │   ├── Tabbing/                   # Multi-tab workspace logic + TabRouterGuard
│   │   ├── UtilityComponents/         # Shared UI utilities
│   │   ├── admin/                     # Analytics dashboards + charts
│   │   │   ├── admin.routes.ts        # Dashboard route definitions
│   │   │   ├── charts.routes.ts       # Chart gallery routes
│   │   │   ├── admin-analytics.service.ts
│   │   │   └── charts/               # Chart components (15+ types)
│   │   ├── chat/                      # Real-time team chat module
│   │   ├── core/                      # Guards, interceptors, auth services
│   │   │   └── auth/
│   │   │       ├── guards/            # authGuard, permissionGuard
│   │   │       └── permissions.constants.ts  # All RBAC permission keys
│   │   ├── interfaces/                # Global TypeScript interfaces
│   │   ├── landingPage/               # Public marketing landing page
│   │   ├── modules/
│   │   │   ├── Ledger/                # Financial ledger viewer
│   │   │   ├── accounts/              # Chart of accounts
│   │   │   ├── auth/                  # Login, signup, password reset pages
│   │   │   ├── branch/                # Multi-branch management
│   │   │   ├── customer/              # Customer CRM module
│   │   │   ├── delivery/              # In-store delivery agent portal
│   │   │   ├── emi/                   # EMI & installment management
│   │   │   ├── hrms/                  # Full HRMS (attendance, leave, shifts, etc.)
│   │   │   ├── invoice/               # Invoice management + PDF
│   │   │   ├── logistics/             # Shipment tracking
│   │   │   ├── notes/                 # Rich text notes & meeting management
│   │   │   ├── organization/          # Org settings, roles, assets
│   │   │   ├── payment/               # Payment recording & allocation
│   │   │   ├── platform-delivery/     # Apex Global Delivery Network
│   │   │   ├── product/               # Product catalog & inventory
│   │   │   ├── purchase/              # Purchase orders
│   │   │   ├── sales/                 # Sales orders & returns
│   │   │   ├── shared/                # Shared components (404, Unauthorized, Master List)
│   │   │   ├── storefront-admin/      # Storefront command center (CMS)
│   │   │   ├── storefront-public/     # Public e-commerce storefront
│   │   │   ├── supplier/              # Supplier CRM
│   │   │   ├── transactions/          # Transaction log + audit logs
│   │   │   └── user/                  # User management
│   │   ├── projectLayout/             # App shell: sidebar, dashboard builder
│   │   ├── shared/                    # Global shared services & pipes
│   │   ├── storefront/                # Storefront core services & resolvers
│   │   ├── app.routes.ts              # Root Angular router
│   │   └── app.config.ts             # App-wide providers & configuration
│   ├── assets/                        # Static assets (icons, images, fonts)
│   ├── environments/                  # dev / qa / prod environment configs
│   └── styles/                        # Global SCSS / CSS
├── electron-main.js                   # Electron desktop entry point
├── tailwind.config.js                 # TailwindCSS design tokens
├── angular.json                       # Angular workspace configuration
└── vercel.json                        # Vercel SSR deployment config
```

---

## 🔐 Authentication & Security

### Authentication Flow

```
User submits credentials
       ↓
POST /api/v1/auth/login
       ↓
JWT generated (7 days) → Stored in HTTP-only cookie
       ↓
Angular authGuard checks token on every protected route
       ↓
permissionGuard checks specific RBAC permission per route
       ↓
Backend middleware validates JWT on every API call
```

### Auth Features
| Feature | Description |
|---------|-------------|
| **JWT Authentication** | 7-day expiry, HTTP-only cookie storage |
| **Refresh Token** | `POST /api/v1/auth/refresh-token` |
| **Email Verification** | Tokenized email confirmation on signup |
| **Password Reset** | Secure email-based reset with expiring tokens |
| **Session Management** | View and revoke sessions per device |
| **Multi-device Sessions** | See all active logins, terminate any session |
| **User Blocking** | Admins can block/unblock any user |
| **Permission Overrides** | Grant extra permissions beyond role defaults |

### RBAC Permission System
All routes use a `PERMISSIONS` constant object with keys like:

```
DASHBOARD.VIEW      CHAT.READ         LEDGER.READ
TRANSACTION.READ    SALE.READ/MANAGE  INVOICE.READ/MANAGE
ACCOUNT.READ        PAYMENT.READ      EMI.READ/MANAGE
PRODUCT.READ        PURCHASE.READ     SUPPLIER.READ/MANAGE
CUSTOMER.READ       USER.READ/MANAGE  BRANCH.READ/MANAGE
ORG.MANAGE          ROLE.MANAGE       STOREFRONT.READ/MANAGE
MASTER.READ         SESSION.VIEW_ALL  LOGS.VIEW
NOTE.READ/MANAGE    ASSET.READ        HRMS.*
```

### Backend Security Layers
| Middleware | Protection |
|-----------|-----------|
| `helmet()` | Secure HTTP headers (CSP, HSTS, etc.) |
| `mongoSanitize()` | Prevents NoSQL injection attacks |
| `xss-clean` | Strips XSS payloads from request body |
| `hpp()` | HTTP Parameter Pollution protection |
| CORS whitelist | Strict origin control (localhost + Vercel + Expo + Capacitor) |
| Rate limiting `/api/v1` | 2,000 requests / hour |
| Rate limiting `/public` | 500 requests / 15 minutes |
| Request ID middleware | Unique `X-Request-Id` header on every request |
| Session activity tracking | Auto-updates last-seen on all requests |

---

## 🧭 ERP Dashboard & Navigation

The ERP application shell (`MainDashboardComponent`) provides:
- **Multi-tab workspace** — open multiple modules simultaneously like browser tabs
- **Tab Router Guard** — prevents duplicate tabs from being opened
- **Sidebar navigation** with module groupings
- **Permission-aware menu** — items auto-hide based on user permissions
- **Dashboard Builder** (`/create-dashboard`) — create custom KPI dashboards

### Route Map (All Protected by `authGuard`)

| URL Path | Module | Key Permission |
|----------|--------|---------------|
| `/dashboard` | Analytics Dashboards | `DASHBOARD.VIEW` |
| `/charts` | Chart Gallery | `DASHBOARD.VIEW` |
| `/chat` | Team Chat | `CHAT.READ` |
| `/financials` | Financial Ledger | `LEDGER.READ` |
| `/transactions` | Transaction History | `TRANSACTION.READ` |
| `/logs` | Audit Logs | `LOGS.VIEW` |
| `/sales` | Sales Management | `SALE.READ` |
| `/assets` | Asset Registry | `ASSET.READ` |
| `/accounts` | Chart of Accounts | `ACCOUNT.READ` |
| `/payments` | Payment Management | `PAYMENT.READ` |
| `/notes` | Notes & Meetings | `NOTE.READ` |
| `/invoices` | Invoice Management | `INVOICE.READ` |
| `/emis` | EMI Management | `EMI.READ` |
| `/product` | Product Catalog | `PRODUCT.READ` |
| `/purchase` | Purchase Orders | `PURCHASE.READ` |
| `/suppliers` | Supplier CRM | `SUPPLIER.READ` |
| `/customer` | Customer CRM | `CUSTOMER.READ` |
| `/user` | User Management | `USER.READ` |
| `/branches` | Branch Management | `BRANCH.READ` |
| `/hrms` | HR Management | (sub-permissions) |
| `/logistics` | Shipment Tracking | (logistics perms) |
| `/storefront` | Storefront Admin | `STOREFRONT.READ` |
| `/admin/organization` | Org Settings | `ORG.MANAGE` |
| `/admin/roles` | Roles & Permissions | `ROLE.MANAGE` |
| `/masterList` | Master Data | `MASTER.READ` |
| `/sessions` | Active Sessions | `SESSION.VIEW_ALL` |

---

## 📊 Analytics & Business Intelligence

### Executive Dashboard (`/dashboard/executive`)
High-level KPIs for management: total revenue, sales count, outstanding dues, profit margins, top products, and top customers — all with date range filtering.

### Analytics Dashboard Views
| View | Metrics |
|------|---------|
| **Financial Trend** | Revenue, gross profit, cash flow, YoY growth |
| **Branch Comparison** | Multi-branch performance radar chart |
| **Inventory Health** | Stock levels, dead stock, stock predictions |
| **Customer Intelligence** | LTV, churn risk, segmentation, market basket analysis |
| **Staff Performance** | Attendance KPIs, leave utilization, top performers |
| **Operational Metrics** | Peak hours heatmap, order funnel, payment method distribution |
| **Predictive Analytics** | AI-powered forecasting for sales and stock |
| **Procurement** | Purchase trends, supplier performance |
| **Sales Distribution** | By time, channel, and product category |
| **AOV Trend** | Average Order Value over time |
| **Return Rate** | Sales return analytics |
| **Order Funnel** | Cart → Checkout → Completion tracking |

### Customer Analytics (`/api/v1/customer-analytics`)
| Metric | Description |
|--------|-------------|
| Overview | Customer count, acquisition rate |
| Segmentation | RFM-based behavioral segments |
| LTV | Lifetime value per customer cohort |
| EMI Portfolio | Customer installment analysis |
| Geospatial | Map-based location distribution |
| Payment Behavior | On-time vs. late payment patterns |
| Real-time Feed | Live customer activity |
| Export | Download as Excel/CSV |

### Chart Gallery (`/charts`)
A curated library of visual charts:
- Bar charts, Line charts, Pie charts, Doughnut charts
- Radar charts, Scatter plots, Bubble charts
- Area charts, Mixed charts
- Real-time updating charts
- Export to PNG/PDF

---

## 💰 Financial Management

### Financial Ledger (`/financials`)
A complete **double-entry accounting** system:
- Full ledger view with debit/credit entries
- **Balance Sheet** — assets, liabilities, equity
- **Profit & Loss Statement** — revenue vs. expenses
- **Trial Balance** — verification of ledger accuracy
- **Cash Flow Statement** — operating, investing, financing
- **Retained Earnings** report
- Export ledger to Excel

### Transactions (`/transactions`)
- Comprehensive log of all financial transactions across the organization
- Filter by date, type, branch, user
- Party-level transaction views (customer/supplier)
- Export filtered results

### Audit Logs (`/logs`)
- Immutable audit trail for all system actions
- Who did what, when, and from which IP
- Filter by module, action type, and user

---

## 🧾 Sales & Invoicing

### Sales Management (`/sales`)
| Feature | Description |
|---------|-------------|
| Create Sales Order | Items, customer, branch, discount, tax |
| Sales History | Filter by date, customer, payment status |
| Sales Returns | Process returns, update stock automatically |
| Payment Tracking | Partial, full, and advance payments against sales |
| Bulk Status Update | Change status for multiple orders at once |
| Customer Sales Summary | View all sales for a specific customer |

### Invoice Management (`/invoices`)
| Feature | Description |
|---------|-------------|
| Invoice Creation | Auto-generated from sales or manual entry |
| PDF Download | Generate styled PDF invoices |
| Email Invoice | Send directly from the system via SMTP |
| Payment Recording | Record payments against invoices |
| Invoice History | Full audit trail of changes |
| Draft Management | Save incomplete invoices as drafts |
| Trash & Restore | Soft delete with restore capability |
| Bulk Operations | Bulk cancel, bulk status update |
| **Profit Analytics** | Per-invoice and per-product profit calculation |
| Reports | Outstanding, tax, sales, and profit reports |
| Number Validation | Prevent duplicate invoice numbers |

### EMI & Installment Management (`/emis`)
| Feature | Description |
|---------|-------------|
| EMI Plan Creation | Set total amount, installment count, frequency |
| Installment Schedule | Auto-generates due dates and amounts |
| Payment Recording | Mark individual installments as paid |
| Overdue Detection | Flags installments past their due date |
| Advance Application | Apply advance payments to reduce balance |
| EMI Analytics | Portfolio overview, overdue trends |
| Customer EMI History | All EMIs per customer |
| Automated Reminders | Daily cron sends overdue/upcoming alerts |

---

## 📦 Inventory & Product Management

### Product Catalog (`/product`)
| Feature | Description |
|---------|-------------|
| Product CRUD | Name, SKU, barcode, description, pricing, images |
| Multi-branch Inventory | Per-branch stock quantities |
| Stock Adjustment | Manual increase/decrease with reason |
| Stock Transfer | Move stock between branches |
| Bulk Import | Upload Excel file to create products in bulk |
| Bulk Update | Modify multiple products simultaneously |
| QR/Barcode Scanner | `html5-qrcode` based scanning for quick lookup |
| Product Search | By name, SKU, or barcode |
| Low Stock Reports | Products below threshold across branches |
| Product History | Audit trail of stock changes |
| Soft Delete & Restore | Archive products without data loss |
| Image Upload | Cloudinary-backed product image management |
| Product Conditions | New, refurbished, used — configurable |
| Warranty Plans | Assign warranty terms per product |
| Tags & Categories | Hierarchical category + sub-category |
| Tax Rates | Configurable GST/VAT rates per product |

### Stock Management (`/api/v1/stock`)
- Adjust stock (add/remove with reason)
- Transfer stock between branches
- Real-time stock level queries

---

## 🏭 Purchase & Supplier Management

### Purchase Orders (`/purchase`)
| Feature | Description |
|---------|-------------|
| PO Creation | Items, supplier, branch, payment terms |
| Purchase Payments | Record payments against purchase orders |
| Purchase Returns | Process supplier returns |
| Status Tracking | Pending → Ordered → Received → Completed |
| Analytics | Purchase trends, pending payments |
| Export | Download purchase records as Excel |
| Bulk Update | Modify status for multiple POs |

### Supplier CRM (`/suppliers`)
| Feature | Description |
|---------|-------------|
| Supplier Profiles | Contact info, categories, payment terms |
| KYC Documents | Upload and manage identity documents |
| Supplier Ledger | Financial balance per supplier |
| Supplier Dashboard | Purchase history, outstanding amounts |
| Bulk Import | Add multiple suppliers via Excel |
| Supplier Search | Quick lookup by name, phone, category |
| Soft Delete & Restore | Archive without data loss |
| Ledger Export | Download supplier-specific ledger |

---

## 👥 Customer Relationship Management

### Customer Module (`/customer`)
| Feature | Description |
|---------|-------------|
| Customer Profiles | Name, phone, email, address, type |
| Credit Limits | Set and manage credit limits per customer |
| Outstanding Balance | Real-time balance tracking |
| Purchase History | All invoices, payments, EMIs |
| Bulk Import | Upload customers from Excel |
| Duplicate Detection | Phone/email duplicate check before creation |
| Convert to CRM | Convert storefront shoppers into CRM contacts |
| Soft Delete & Restore | Archival with full restore |
| Customer Search | Multi-field search |

### Customer Analytics (in-depth)
| Metric | Description |
|--------|-------------|
| LTV (Lifetime Value) | Total revenue per customer over time |
| RFM Segmentation | Recency, Frequency, Monetary analysis |
| Geospatial Mapping | Customer location heat map |
| Churn Risk | Identifies at-risk customers based on activity |
| Market Basket Analysis | Products frequently bought together |
| Payment Behavior | On-time vs. late payment ratios |
| Real-time Activity | Live feed of customer actions |
| Export | Download analytics as CSV/Excel |

---

## 👔 HRMS — Human Resource Management

The HRMS is one of the most feature-rich modules, covering the complete employee lifecycle.

### Employees (`/hrms/employees`)
| Feature | Description |
|---------|-------------|
| Employee Onboarding | Create employee profile with all HR details |
| Employee List | Searchable, filterable staff directory |
| Profile Management | Edit employee data, contact info, docs |
| Organization Hierarchy | Visual org chart of all employees |
| Role Assignment | Assign ERP system roles to employees |

### Departments (`/hrms/department`)
| Feature | Description |
|---------|-------------|
| Department Hub | Overview dashboard |
| Department List | All departments with staff counts |
| Department Hierarchy | Visual tree of parent/child departments |
| Career Paths | Configure progression routes within departments |
| Assign Users | Link employees to departments |

### Designations (`/hrms/designation`)
| Feature | Description |
|---------|-------------|
| Designation List | All job titles with levels |
| Salary Bands | Configure min/max salary per designation |
| Designation Hierarchy | Org chart by job title |
| Career Path Mapping | Promotion routes per designation |
| Promotion Eligibility | Identify staff ready for promotion |

### Shifts & Scheduling (`/hrms/shifts`, `/hrms/shift-groups`)
| Feature | Description |
|---------|-------------|
| Shift Creation | Define shift name, start/end times, break duration |
| Shift Cloner | Duplicate shift structure across periods |
| Shift Coverage | View staffing coverage gaps |
| Shift Validator | Check assignment conflicts |
| Shift Calculator | Hours worked, overtime calculation |
| Shift Assignments | Assign employees to specific shifts |
| Shift Groups | Bundle multiple shifts into a rotation group |
| Group Staff | Assign employees to shift groups |
| Schedule Generation | Auto-generate weekly/monthly schedules |
| Timeline View | Visual timeline of all shifts |

### Attendance (`/hrms/attendance`, `/hrms/daily-attendance`)
| Feature | Description |
|---------|-------------|
| **My Clock** | Employee self-service check-in/out |
| **Admin Attendance** | Manager view of all employee attendance |
| **Live Feed** | Real-time streaming of check-in events (Socket.io) |
| **Staff Log** | Per-employee detailed attendance log |
| **My Timesheet** | Employee daily timesheet view |
| **Admin Timesheet** | Manager-level timesheet management |
| **Attendance Reports** | HR analytics on attendance patterns |
| **Regularization** | Submit requests to fix missed/incorrect logs |

### Biometric Machines (`/hrms/attendance/machines`)
| Feature | Description |
|---------|-------------|
| Device Management | Add, edit, delete attendance machines |
| Device Details | Hardware specs, last sync, status |
| Raw Logs | View punch-in/out data from machines |
| Machine Analytics | Device usage statistics |
| Sync | Trigger data sync from machine to system |
| Regenerate Key | Rotate API keys for device security |
| Connection Test | Verify device reachability |
| Map Users | Link machine user IDs to system employee IDs |

### Geo-Fencing (`/hrms/geofence`)
| Feature | Description |
|---------|-------------|
| Geofence Creation | Draw geographic boundaries on Leaflet map |
| Location Validation | Enforce check-in only within allowed zones |
| Geofence Hub | Overview of all zones |
| Checkpoint Verification | Multi-point location verification for field staff |
| Violation Tracking | Log employees checking in outside zones |
| Nearby Search | Find nearest valid geofence for a location |

### Leave Management (`/hrms/leave`, `/hrms/leave-balances`)
| Feature | Description |
|---------|-------------|
| Leave Application | Employee self-service leave request |
| Admin Hub | Manager view of all pending/approved leaves |
| Approval Workflow | Approve, reject, or escalate requests |
| Bulk Approval | Process multiple requests simultaneously |
| Team Calendar | Visual calendar of all team leaves |
| Leave Details | Full info on each leave request |
| Leave Balances | Admin view of all employee leave balances |
| Balance Accrual | Monthly automatic leave accrual |
| Bulk Initialize | Set opening balances for all employees |
| Utilization Trends | Analytics on leave consumption patterns |
| Balance Report | Exportable balance summary |

### Holiday Calendar (`/hrms/holidays`)
| Feature | Description |
|---------|-------------|
| Holiday Hub | Annual calendar view of all holidays |
| Add Holiday | Create single or recurring holidays |
| Bulk Creation | Import multiple holidays at once |
| Year-wise View | Navigate holidays by year |
| Copy Year | Duplicate last year's holidays to next year |
| Date Conflict Check | Prevent overlapping holiday declarations |

---

## 🚚 Logistics & Delivery

### Logistics Module (`/logistics`)
| Feature | Description |
|---------|-------------|
| Shipment Creation | Create outbound shipments |
| Status Transitions | Pending → Dispatched → In Transit → Delivered |
| Shipment Tracking | Real-time shipment status view |
| Operations Summary | Daily/weekly logistics overview |

### In-Store Delivery System (`/store/:slug/delivery`)
| Feature | Description |
|---------|-------------|
| Delivery Agent Login | Store-specific agent portal |
| Order Assignment | Orders assigned to agents |
| Order Scanning | Scan order by ID/barcode |
| Status Updates | Mark orders as picked up, in transit, delivered |
| Agent Dashboard | Personal delivery queue |

### Apex Global Delivery Network (`/apex-delivery`)
A platform-wide delivery orchestration layer:
| Feature | Description |
|---------|-------------|
| Cross-org Routing | Route deliveries across different organizations |
| Global Agent Registration | Register platform-level delivery partners |
| Platform Order Management | Track orders across all tenant storefronts |
| Delivery Agent Portal | Separate login for platform agents |

---

## 💬 Team Collaboration

### Team Chat (`/chat`)
Built on **Socket.io** for real-time messaging:

| Feature | Description |
|---------|-------------|
| Channels | Create public/private channels |
| Direct Messages | One-on-one chat between staff |
| Channel Members | Add/remove members from channels |
| Enable/Disable Channels | Archive channels without deleting |
| Message CRUD | Send, edit, delete messages |
| Read Receipts | Per-message read status |
| File Uploads | Share files in chat (Cloudinary-backed) |
| Real-time Updates | Instant delivery via WebSocket |

---

## 📝 Notes & Knowledge Management

### Notes Module (`/notes`)
A powerful knowledge management system built on **TipTap** rich-text editor:

| Feature | Description |
|---------|-------------|
| Rich Text Notes | Full WYSIWYG editor (bold, italic, lists, links, tasks) |
| Pinning | Pin important notes to the top |
| Archiving | Archive notes without deletion |
| Sharing | Share with specific users with permission levels (view/edit) |
| Subtasks | Add nested checklists inside notes |
| Time Logging | Track time spent on tasks |
| Commenting | Threaded comments with emoji reactions |
| Note Linking | Link related notes together |
| Duplicate | Clone notes as templates |
| Templates | Save and reuse note structures |
| Convert to Task | Promote note to formal task |
| Trash Bin | Soft delete with restore and permanent delete |
| Bulk Operations | Bulk delete, bulk update, bulk archive |
| Network Graph View | Visual web of linked notes |
| Calendar View | Monthly calendar of note due dates |
| Analytics | Heatmap of note creation activity |
| Export | Download all notes as file |
| Search | Full-text search across all notes |
| Shared With Me | View notes others have shared |

### Meeting Management (inside Notes)
| Feature | Description |
|---------|-------------|
| Meeting Creation | Title, agenda, date/time, participants |
| Join/Leave | RSVP and attendance tracking |
| Participants | Add/remove meeting attendees |
| Polls | Create polls within meetings |
| Poll Voting | Real-time voting results |
| Action Items | Create and assign follow-up tasks |
| Convert Action Item | Promote to a full note/task |
| Meeting Cancel | Cancel with notification to participants |
| Analytics Summary | Meeting frequency, attendance rates |

---

## 🛍️ Public Storefront Engine

Each organization gets a fully independent **multi-tenant e-commerce storefront** at `/store/:orgSlug`.

### Dynamic Page Builder
The storefront renders pages from a CMS backend using **39 configurable UI section types**:

| Section Block | Purpose |
|---------------|---------|
| `hero-banner` | Full-width hero with headline, subtitle, and CTA buttons |
| `editorial-hero` | Magazine-style editorial layout with typography focus |
| `video-hero` | Autoplay video background hero section |
| `text-video-mask` | Text revealed through a video mask effect |
| `product-grid` | Responsive grid of products with filters |
| `product-slider` | Horizontally scrollable product carousel |
| `product-listing` | Full-page product listing with advanced filtering |
| `featured-product` | Single product spotlight with details |
| `bento-grid` | Asymmetric content grid (modern layout trend) |
| `asymmetric-canvas` | Freeform canvas with overlapping elements |
| `split-content` | Two-column split text + image layout |
| `split-screen-slider` | Side-by-side full-screen slider |
| `stacked-cards` | Cards that stack on scroll with parallax effect |
| `sticky-scroll-reveal` | Content revealed as user scrolls |
| `tabbed-showcase` | Tabbed interface for product/feature categories |
| `testimonial-slider` | Customer review carousel |
| `blog-feed` | Article/news feed with cards |
| `category-grid` | Visual product category navigation |
| `hover-reveal-list` | List with content revealed on hover |
| `feature-grid` | Feature highlights in icon + text format |
| `stats-counter` | Animated number counters for key stats |
| `logo-cloud` | Brand partner / client logo display |
| `instagram-feed` | Social media visual feed integration |
| `map-locations` | Leaflet map with store location pins |
| `countdown-timer` | Animated sale/event countdown |
| `pricing-table` | Multi-tier pricing plan comparison |
| `faq-accordion` | Expandable FAQ sections |
| `contact-form` | Customer inquiry submission form |
| `newsletter-signup` | Email subscription capture |
| `text-content` | Full rich-text editorial content block |
| `divider` | Styled horizontal visual separator |
| `spacer` | Configurable vertical whitespace |

### Commerce Routes (`/store/:orgSlug/*`)
| Route | Feature |
|-------|---------|
| `` (root) | Dynamic homepage (CMS-configured) |
| `products` | Full product listing with category/price/brand filters |
| `products/:slug` | Product detail page with add-to-cart |
| `cart` | Shopping cart (add, remove, update quantities) |
| `checkout` | Complete checkout with address, shipping, payment |
| `orders/success` | Order confirmation with summary |
| `orders/failure` | Failure page with retry options |
| `track-order` | Real-time order status tracking |
| `search` | Product search with filters |
| `compare` | Side-by-side product comparison (up to 4) |
| `wishlist` | Saved wishlist (requires login) |
| `recently-viewed` | Personalized recently viewed products |
| `recommendations` | AI-powered product recommendations |
| `reviews` | Customer review aggregation page |
| `rewards` | Loyalty points and rewards program |
| `gift-card` | Gift card purchase and redemption |
| `:pageSlug` | Any CMS-configured custom page |

### Cart System Features
| Feature | Description |
|---------|-------------|
| Add/Update/Remove Items | Full cart item management |
| Apply Coupons | Discount code validation and application |
| Shipping Estimate | Calculate shipping cost before checkout |
| Cart Validation | Real-time stock availability check |
| Cart Merge | Merge guest cart into customer cart on login |

### Customer Self-Service Portal (`/store/:slug/portal/*`)
| Route | Feature |
|-------|---------|
| `portal/login` | Store-specific customer authentication |
| `portal/register` | New customer account creation |
| `portal/forgot-password` | Password recovery via email |
| `portal/reset-password` | Token-based password reset |
| `portal/dashboard` | Personal account dashboard |
| `portal/orders` | Complete order history |
| `portal/orders/:id` | Detailed order view with tracking |
| `portal/returns` | All return requests |
| `portal/returns/:id` | Return status and details |
| `portal/return-form` | Submit a new return request |
| `portal/profile` | Edit profile, addresses, password |

---

## 🏪 Storefront Admin Command Center

The admin side of the storefront (`/storefront`) gives full CMS and operational control:

### Admin Pages
| Page | Description |
|------|-------------|
| **Overview** | Store dashboard with key metrics |
| **Page Manager** | List all store pages, publish/unpublish |
| **Page Builder** | Drag-and-drop section-based page editor |
| **Customers** | View all storefront-registered customers |
| **Orders** | Manage all store orders, assign delivery agents |
| **Coupons** | Create and manage discount codes |
| **Delivery Agents** | Add agents, assign to delivery areas |
| **Theme Marketplace** | Browse and apply store themes |
| **Layout Settings** | Customize header, footer, navigation |
| **Smart Rules Engine** | Dynamic pricing and product rules |
| **Analytics** | Store performance analytics |
| **Sales Reports** | Revenue and order reports |
| **Abandoned Carts** | Recover incomplete checkouts |
| **Discount Manager** | Manage all active discounts |
| **Customer Segmentation** | Group customers for targeted campaigns |
| **SEO Dashboard** | Meta tags, keywords, sitemap |
| **Media Manager** | Upload and manage store images/files |
| **Templates Library** | Save and reuse page section templates |
| **Integrations** | Connect third-party services |
| **Domain Settings** | Custom domain configuration |
| **Activity Logs** | Complete store activity audit |
| **Notifications Center** | Store notification management |
| **Audit History** | Change log for store configuration |
| **Publish History** | Record of all page publications |
| **Page Revisions** | Version control for pages |
| **Roles** | Storefront-specific role management |
| **Settings** | General store configuration |
| **Onboarding** | Setup wizard for new stores |
| **Billing** | Subscription and billing management |

### Smart Rules Engine
| Feature | Description |
|---------|-------------|
| Rule Creation | Define conditions and actions |
| Rule Preview | Test rules before publishing |
| Rule Execution | Manually trigger rule evaluation |
| Cache Management | Clear rule result cache |
| Bulk Operations | Enable/disable multiple rules |

---

## 🤖 AI Agent Module

The AI module provides intelligent business intelligence capabilities.

### AI Data Tools (Active)
| Tool | Inputs | Outputs |
|------|--------|---------|
| **Sales Tool** | Date range, payment status, invoice number, amount range | Revenue totals, due amounts, invoice list |
| **Product Tool** | Search query (name/SKU/barcode), in-stock filter | Stock levels, pricing, per-branch inventory |
| **Customer Tool** | Name/phone search, dues threshold | Customer list, outstanding balances |
| **EMI Tool** | Status filter (active/overdue/completed) | Installment schedules, overdue counts, next due dates |
| **Payment Tool** | Type (inflow/outflow), date range, method, status | Payment history, total amounts |

### AI Architecture
```
User query (natural language)
        ↓
POST /api/v1/ai-agent/chat
        ↓
[Planned: LangChain Agent with Gemini 1.5 Flash]
        ↓
Tool selection → DB Query → Result summarization
        ↓
Human-readable response
```

> **Note:** Tool functions are fully implemented. LangChain + Gemini orchestration is scaffolded and ready for activation once `GOOGLE_API_KEY` is configured.

---

## 🔔 Notification & Automation System

### Automated Cron Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| Payment Reminder | Daily 9:00 AM | Notify customers of upcoming payment dues |
| Overdue Reminder | Daily 9:30 AM | Alert on overdue balances |
| EMI Check | Daily 8:00 AM | Detect overdue EMI installments |
| Inventory Alert | Daily 10:00 AM | Low-stock notifications |
| General Notifications | Daily 11:00 AM | Dispatch scheduled announcements |

### Notification System
| Feature | Description |
|---------|-------------|
| Push Notifications | Delivered via Socket.io in real-time |
| Email Notifications | Sent via Nodemailer SMTP |
| Unread Count | Badge with live unread count |
| Mark as Read | Individual or bulk read marking |
| Clear All | Remove all notifications at once |
| Notification Stats | Count by type, read/unread ratios |

### Announcements
| Feature | Description |
|---------|-------------|
| Org-wide Announcements | Broadcast to all organization members |
| Targeted Announcements | Send to specific roles, branches, or users |
| Scheduled Delivery | Set a future send time |
| Announcement History | View all past announcements |

### Webhook System
| Feature | Description |
|---------|-------------|
| Outbound Webhooks | Trigger on events (sale created, payment received, etc.) |
| Inbound Payment Webhook | Receive payment confirmations from gateways |
| Delivery Log | Track every webhook delivery attempt |
| Replay | Retry failed webhook deliveries |
| Connection Test | Verify endpoint reachability |
| Status Monitoring | Real-time webhook health dashboard |
| API Key Rotation | Regenerate webhook authentication keys |

---

## 🏢 Organization & Access Control

### Organization Management
| Feature | Description |
|---------|-------------|
| Organization Creation | Register a new org with name, slug, logo |
| Organization Settings | Update branding, contact info, preferences |
| Member Approval | Review and approve new member requests |
| Member Rejection | Decline membership with reason |
| Pending Members | Queue of users awaiting approval |
| Organization Lookup | Find org by slug or shopId |
| Ownership Transfer | Initiate and accept ownership changes |
| Shop Unique ID | Permanent unique identifier for each store |

### Branch Management
| Feature | Description |
|---------|-------------|
| Branch CRUD | Create branches with address and contact info |
| Branch Hierarchy | Parent/child branch relationships |
| Re-parenting | Move branches in the hierarchy |
| Employee Assignment | Link employees to specific branches |
| Transfer Requests | Staff can request branch transfers |
| Branch Analytics | Per-branch revenue, stock, staff KPIs |
| Branch Radar | Multi-branch performance comparison chart |

### Role & Permission System
| Feature | Description |
|---------|-------------|
| Role Creation | Define custom roles per organization |
| Permission Assignment | Select granular permissions per role |
| User Role Assignment | Assign one or more roles to each user |
| Permission Overrides | Grant/restrict individual permissions beyond role |
| Permission Check API | Validate permissions programmatically |
| All Permissions View | List all available system permissions |

### Asset Management (`/assets`)
- Track physical and digital organizational assets
- Asset list with details (value, location, assigned to)
- Asset assignment and status tracking

---

## 🛡️ Admin & Platform Management

### Super Admin Dashboard (`/api/v1/admin`)
Available to platform administrators:

| Tool | Description |
|------|-------------|
| Command Center | System-wide operational control panel |
| Feature Flags | Toggle features on/off per organization |
| Security Audit | Detect suspicious activity patterns |
| Compliance Dashboard | Regulatory compliance status overview |
| Reports | Generate cross-organization reports |
| User Impersonation | Debug user sessions (admin only) |
| User Block/Unblock | Platform-level account management |

### Developer Tools (`/api/v1/admin/platform/developer/*`)
| Tool | Description |
|------|-------------|
| API Tester | Test API endpoints from admin panel |
| Cache Clear | Flush application cache |
| Database Inspector | Browse MongoDB collections |
| Log Viewer | Stream server logs in real-time |
| Queue Monitor | View background job queues |
| Health Check | System + database status |
| Redis Status | Cache layer health check |

---

## ⚡ Real-Time Features

All real-time features are powered by **Socket.io**:

### Chat
- Instant message delivery across channels
- Presence indicators (online/offline)
- Typing indicators

### Live Attendance
- Real-time check-in/check-out events stream
- `LiveAttendanceFeedComponent` — live dashboard
- Biometric machine events pushed instantly to dashboard

### Notifications
- Push notifications delivered within milliseconds
- Notification badge auto-updates without page refresh
- Critical alerts (overdue EMI, low stock) in real-time

### Session Updates
- Session activity tracking on every request
- Admin can see last-active time per session

---

## 📡 API Reference

> All endpoints prefixed with `/api/v1`

| Group | Base Route | Key Operations |
|-------|-----------|----------------|
| **Auth** | `/auth` | login, logout, signup, refresh-token, verify-email, reset-password |
| **Users** | `/users` | CRUD, permissions, photo, devices, hierarchy, bulk-status |
| **Roles** | `/roles` | CRUD, assign/revoke, permissions |
| **Sessions** | `/sessions` | list, revoke, bulk-delete, me |
| **Accounts** | `/accounts` | CRUD, hierarchy, reparent, branch-performance, summary |
| **Invoices** | `/invoices` | CRUD, PDF, email, payments, analytics, export, bulk-ops |
| **Payments** | `/payments` | CRUD, allocate-auto, allocate-manual, webhook, receipt |
| **EMI** | `/emi` | CRUD, pay-installment, apply-advance, mark-overdue, analytics |
| **Ledger** | `/ledgers` | balance-sheet, P&L, trial-balance, cash-flow, export |
| **Transactions** | `/transactions` | list, detail, party-transactions, statements |
| **Reconciliation** | `/reconciliation` | manual, mismatches, summary, pending |
| **Inventory** | `/inventory` | stock management, adjust, transfer |
| **Logistics** | `/logistics` | shipments CRUD, status transitions, operations summary |
| **Products** | `/products` | CRUD, bulk-import, scan, stock-adjust, stock-transfer, low-stock |
| **Purchases** | `/purchases` | CRUD, payments, returns, analytics, bulk-update |
| **Sales** | `/sales` | CRUD, returns, bulk-ops, customer-summary, analytics |
| **Stock** | `/stock` | adjust, transfer |
| **Organization** | `/organization` | CRUD, members, lookup, ownership |
| **Branches** | `/branches` | CRUD, hierarchy, employees, bulk |
| **Customers** | `/customers` | CRUD, credit-limit, bulk-import, analytics, search |
| **Suppliers** | `/suppliers` | CRUD, KYC, dashboard, ledger-export, bulk-import |
| **Master Data** | `/master`, `/master-list`, `/master-types`, `/dropdowns` | configuration data management |
| **Analytics** | `/analytics` | 20+ analytics endpoints |
| **Customer Analytics** | `/customer-analytics` | segmentation, LTV, geospatial, payment-behavior |
| **Dashboard** | `/dashboard` | 15+ KPI chart endpoints |
| **AI Agent** | `/ai-agent` | chat endpoint |
| **Webhooks** | `/webhooks` | CRUD, test, logs, replay |
| **Notifications** | `/notifications` | CRUD, mark-read, stats, unread-count |
| **Announcements** | `/announcements` | CRUD, stats |
| **Chat** | `/chat` | channels, messages, members, upload |
| **Notes** | `/notes` | CRUD, sharing, subtasks, meetings, templates, time-log |
| **Feed** | `/feed` | activity feed |
| **HRMS** | `/hrms` | attendance, leave, shifts, geofence, machines |
| **Departments** | `/departments` | CRUD, hierarchy, career-path, salary-bands |
| **Search** | `/search` | global cross-module search |
| **Charts** | `/chart` | chart data endpoints |
| **Logs** | `/logs` | audit logs |
| **Assets** | `/assets` | file CRUD, photo upload |
| **Cron** | `/cron` | trigger jobs, status, stop |
| **Storefront Public** | `/store/:slug/*` | products, cart, checkout, account, orders |
| **Storefront Admin** | `/admin/storefront/*` | pages, orders, coupons, agents, rules, themes |
| **Delivery Agents** | `/delivery-agent/*` | login, orders, scan, status updates |
| **Platform Delivery** | `/platform-delivery/*` | global delivery network |
| **Admin** | `/admin/*` | platform tools, feature flags, security |
| **Ownership** | `/ownership` | initiate, finalize, force, cancel transfer |

### Health Check Endpoints
```
GET /           → API status + environment
GET /health     → Database status, uptime, service health
GET /api-docs   → Swagger UI interactive documentation
```

---

## 🚢 Deployment

### Web Deployment (Vercel)
```bash
npm run build:prod
# vercel.json is pre-configured for SSR routing
```

### Desktop Build (Electron)
```bash
npm run dist
# Outputs Windows .exe installer to dist/electron/
```

### Environment Configurations
| Config | File | Backend URL |
|--------|------|-------------|
| Development | `environment.development.ts` | `http://localhost:4000` |
| QA | `environment.qa.ts` | OnRender API |
| Production | `environment.production.ts` | Production API |

---

## 🧪 Testing

```bash
# Run Unit Tests (Karma + Jasmine)
npm test

# Run E2E Tests
ng e2e

# Run Backend Tests
cd ../apex-crm-backend
node test.js
node src/test-api.js
```

---

## 📊 System Metrics

| Metric | Value |
|--------|-------|
| Frontend Modules | 23+ feature modules |
| Backend API Routes | 80+ route groups |
| Total API Endpoints | 300+ individual endpoints |
| Storefront Section Types | 39 UI page builder blocks |
| Storefront Commerce Routes | 20+ shopping routes |
| Customer Portal Routes | 10 self-service routes |
| HRMS Sub-modules | 10 (employees, departments, designations, shifts, shift-groups, attendance, daily-attendance, geofence, machines, holidays) |
| Storefront Admin Panels | 25+ management surfaces |
| Real-time Events | Chat, attendance, notifications |
| Automated Cron Jobs | 5 daily scheduled tasks |
| AI Data Tools | 5 (sales, product, customer, EMI, payment) |
| Deployment Targets | Web (Vercel), Desktop (Electron), Mobile (Expo) |

---

## 🔄 Data Flow Architecture

```
                    ┌─────────────────────┐
                    │    User Action      │
                    │   (Angular UI)      │
                    └────────┬────────────┘
                             │ HTTP / WebSocket
                    ┌────────▼────────────┐
                    │  Express.js Router  │
                    │  /api/v1/...        │
                    └────────┬────────────┘
                             │
               ┌─────────────▼──────────────┐
               │  Middleware Chain           │
               │  1. CORS + Helmet          │
               │  2. Rate Limiter           │
               │  3. Request ID             │
               │  4. Session Activity       │
               │  5. JWT Auth Middleware    │
               │  6. Permission Check       │
               └─────────────┬──────────────┘
                             │
                    ┌────────▼────────────┐
                    │    Controller       │
                    │  (Business Logic)   │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  Mongoose Model     │◄──► MongoDB
                    │  (Data Layer)       │
                    └────────┬────────────┘
                             │
               ┌─────────────▼──────────────┐
               │  Response + Side Effects   │
               │  - HTTP Response           │
               │  - Socket.io broadcast     │
               │  - Email notification      │
               │  - Cloudinary upload       │
               └────────────────────────────┘
```

---

*Built with ❤️ by Manish — Apex Infinity Team*

*Last updated: June 2026*