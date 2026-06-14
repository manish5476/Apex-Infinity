# Backend APIs Pending UI Implementation

I performed a deep check comparing the **apex-crm-backend** route registry (`src/routes/routeRegistrynew.js`) with the **Angular Frontend** modules, routing, and services. 

Here is the section-by-section breakdown of backend APIs that currently **do not have corresponding frontend UI implementations or routing**:

### 1. Accounting & Billing
*The core invoicing, payments, ledgers, and transactions are implemented. However, the following advanced accounting features are missing:*
- **Reconciliation (`/api/v1/reconciliation`)**: API exists for bank/account reconciliation, but no UI module exists to perform it.
- **Statements (`/api/v1/statements`)**: API for generating account/customer statements is pending UI.
- **Party Transactions (`/api/v1/partytransactions`)**: Dedicated endpoints for third-party ledger transactions lack a frontend view.

### 2. Utilities, System & Automation
*Basic admin settings and dashboard analytics exist, but deeper system tools are missing from the frontend:*
- **Webhooks (`/api/v1/webhooks`)**: API exists to manage webhook subscriptions and payloads, but there's no UI to configure them.
- **Cron Jobs (`/api/v1/cron`)**: API to view and trigger scheduled jobs is missing from the admin UI.
- **System Logs (`/api/v1/logs`)**: API for viewing application logs/activity is missing (as we saw during the Storefront cleanup, the sidebar item was a placeholder).
- **Announcements (`/api/v1/announcements`)**: API for system-wide announcements/banners has no frontend management page.
- **Activity Feed (`/api/v1/feed`)**: API for an internal activity feed exists but isn't integrated into the dashboard yet.

### 3. Storefront
*As discovered in our previous cleanup, the core storefront builder and e-commerce tools are built, but:*
- **Smart Rules (`/api/v1/admin/storefront/smart-rules`)**: A robust backend controller exists for evaluating "Smart Rules" (likely for dynamic pricing, discounts, or segments), but there is absolutely no UI built for this yet.

### 4. Organization & CRM
*Customers, branches, and organization settings are implemented, but:*
- **Ownership (`/api/v1/ownership`)**: API for managing record ownership and data-level access transfers exists in the backend but has no frontend management screen.

### 5. Inventory (Ambiguous)
- **Stock & Inventory (`/api/v1/stock`, `/api/v1/inventory`)**: While the UI has "Products" and "Low Stock Reports", the dedicated generic `inventory` and `stock` management backend endpoints do not have standalone 1:1 frontend modules (they might be partially consumed by the product module, but full inventory reconciliation UI seems missing).

---
**Summary for Next Steps:**
If you want to start building out missing features, **Smart Rules**, **Bank Reconciliation**, and **Webhook Configuration** are the most prominent backend APIs waiting for a frontend!
