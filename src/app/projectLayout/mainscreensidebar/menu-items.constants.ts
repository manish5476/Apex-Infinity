import { PERMISSIONS } from '@core/auth/permissions.constants';

export interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string[];
  items?: MenuItem[];
  badge?: string;
  expanded?: boolean; // Optional: helps if you want accordion style
  permissions?: string[]; // RBAC check
}

export const SIDEBAR_MENU: MenuItem[] = [
  // ==========================
  // 1. CORE & DASHBOARD
  // ==========================
  {
    label: 'Overview',
    icon: 'pi pi-home',
    items: [
      { label: 'Create Dashboard', icon: 'pi pi-plus-circle', routerLink: ['/create-dashboard'] },
      { label: 'Dashboard', icon: 'pi pi-chart-line', routerLink: ['/dashboard'], permissions: [PERMISSIONS.DASHBOARD.VIEW] },
      { label: 'Team Chat', icon: 'pi pi-comments', routerLink: ['/chat'], permissions: [PERMISSIONS.CHAT.READ] },
      { label: 'My Notes', icon: 'pi pi-book', routerLink: ['/notes'], permissions: [PERMISSIONS.NOTE.READ] },
    ]
  },

  // ==========================
  // 2. DATA ANALYTICS (UNIFIED)
  // ==========================
  {
    label: 'Analytics & BI',
    icon: 'pi pi-chart-bar',
    permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE],
    items: [
      {
        label: 'Core Hubs',
        icon: 'pi pi-objects-column',
        items: [
          { label: 'Executive View', icon: 'pi pi-shield', routerLink: ['/dashboard/executive'], permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE] },
          { label: 'Live Monitor', icon: 'pi pi-bolt', routerLink: ['/dashboard/live-monitor'], permissions: [PERMISSIONS.ANALYTICS.VIEW_ALERTS] },
          { label: 'Real-time Stats', icon: 'pi pi-sync', routerLink: ['/dashboard/predictive'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] },
          { label: 'Export Hub', icon: 'pi pi-download', routerLink: ['/dashboard/export-hub'], permissions: [PERMISSIONS.ANALYTICS.EXPORT_DATA] },
        ]
      },
      {
        label: 'Financial BI',
        icon: 'pi pi-wallet',
        items: [
          { label: 'Financials', icon: 'pi pi-chart-line', routerLink: ['/dashboard/finance-main'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'Cash Flow', icon: 'pi pi-money-bill', routerLink: ['/dashboard/cash-flow'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'EMI Stats', icon: 'pi pi-credit-card', routerLink: ['/dashboard/emi-analytics'], permissions: [PERMISSIONS.ANALYTICS.EMI_READ] },
        ]
      },
      {
        label: 'Customer Intelligence',
        icon: 'pi pi-users',
        items: [
          { label: 'Customer 360', icon: 'pi pi-user', routerLink: ['/dashboard/customer-360'], permissions: [PERMISSIONS.CUSTOMER.READ] },
          { label: 'Market Segments', icon: 'pi pi-sitemap', routerLink: ['/dashboard/customer-segmentation'], permissions: [PERMISSIONS.ANALYTICS.VIEW_CUSTOMER_SEGMENTATION] },
          { label: 'LTV Analysis', icon: 'pi pi-star', routerLink: ['/dashboard/customer-ltv-analysis'], permissions: [PERMISSIONS.ANALYTICS.VIEW_CUSTOMER_LTV] },
        ]
      },
      {
        label: 'Inventory & Ops',
        icon: 'pi pi-box',
        items: [
          { label: 'Product Stats', icon: 'pi pi-tag', routerLink: ['/dashboard/product-stats'], permissions: [PERMISSIONS.ANALYTICS.VIEW_INVENTORY] },
          { label: 'Dead Stock', icon: 'pi pi-exclamation-circle', routerLink: ['/dashboard/dead-stock'], permissions: [PERMISSIONS.ANALYTICS.VIEW_STOCK_FORECAST] },
          { label: 'Operational BI', icon: 'pi pi-cog', routerLink: ['/dashboard/operational'], permissions: [PERMISSIONS.ANALYTICS.VIEW_OPERATIONAL] },
          { label: 'Peak Analysis', icon: 'pi pi-clock', routerLink: ['/dashboard/peak-hours'], permissions: [PERMISSIONS.ANALYTICS.VIEW_STAFF_PERFORMANCE] },
          { label: 'Staff Stats', icon: 'pi pi-users', routerLink: ['/dashboard/staff-performance'], permissions: [PERMISSIONS.ANALYTICS.VIEW_STAFF_PERFORMANCE] },
        ]
      },
      {
        label: 'System & Security',
        icon: 'pi pi-shield',
        items: [
          { label: 'Audit Logs', icon: 'pi pi-list-check', routerLink: ['/dashboard/audit-logs'], permissions: [PERMISSIONS.ANALYTICS.VIEW_SECURITY_AUDIT] },
          { label: 'Compliance', icon: 'pi pi-verified', routerLink: ['/dashboard/compliance'], permissions: [PERMISSIONS.ANALYTICS.VIEW_SECURITY_AUDIT] },
          { label: 'Data Health', icon: 'pi pi-database', routerLink: ['/dashboard/data-health'], permissions: [PERMISSIONS.ANALYTICS.VIEW_SECURITY_AUDIT] },
        ]
      }
    ]
  },

  // ==========================
  // 3. CHART ANALYSIS (UNIFIED)
  // ==========================
  {
    label: 'Visual Insights',
    icon: 'pi pi-chart-pie',
    permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE],
    items: [
      { label: 'Gallery View', icon: 'pi pi-th-large', routerLink: ['/charts/gallery'], permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE] },
      {
        label: 'Finance Charts',
        icon: 'pi pi-wallet',
        items: [
          { label: 'Finance Trend', icon: 'pi pi-chart-line', routerLink: ['/charts/financial'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'Gross Profit', icon: 'pi pi-dollar', routerLink: ['/charts/gp'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'YoY Growth', icon: 'pi pi-arrow-up-right', routerLink: ['/charts/growth'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'Payment Mix', icon: 'pi pi-credit-card', routerLink: ['/charts/payment'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'Purchase/Sales', icon: 'pi pi-sync', routerLink: ['/charts/pvs'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FINANCIAL] },
          { label: 'EMI Portfolio', icon: 'pi pi-calendar', routerLink: ['/charts/emi'], permissions: [PERMISSIONS.ANALYTICS.EMI_READ] },
        ]
      },
      {
        label: 'Sales Charts',
        icon: 'pi pi-shopping-cart',
        items: [
          { label: 'AOV Trend', icon: 'pi pi-chart-line', routerLink: ['/charts/aov'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] },
          { label: 'Sales Dist', icon: 'pi pi-globe', routerLink: ['/charts/dist'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] },
          { label: 'Return Rate', icon: 'pi pi-replay', routerLink: ['/charts/return'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] },
          { label: 'Performers', icon: 'pi pi-star', routerLink: ['/charts/performers'], permissions: [PERMISSIONS.ANALYTICS.VIEW_EXECUTIVE] },
          { label: 'Order Funnel', icon: 'pi pi-filter-fill', routerLink: ['/charts/funnel'], permissions: [PERMISSIONS.ANALYTICS.VIEW_FORECAST] },
        ]
      },
      {
        label: 'Customer & Ops',
        icon: 'pi pi-users',
        items: [
          { label: 'Acquisition', icon: 'pi pi-user-plus', routerLink: ['/charts/acquisition'], permissions: [PERMISSIONS.CUSTOMER.READ] },
          { label: 'Outstanding', icon: 'pi pi-money-bill', routerLink: ['/charts/outstanding'], permissions: [PERMISSIONS.CUSTOMER.READ] },
          { label: 'Branch Radar', icon: 'pi pi-map-marker', routerLink: ['/charts/radar'], permissions: [PERMISSIONS.ANALYTICS.VIEW_BRANCH_COMPARISON] },
          { label: 'Activity Heatmap', icon: 'pi pi-th-large', routerLink: ['/charts/heatmap'], permissions: [PERMISSIONS.ANALYTICS.VIEW_OPERATIONAL] },
          { label: 'Inventory Health', icon: 'pi pi-box', routerLink: ['/charts/inventory'], permissions: [PERMISSIONS.ANALYTICS.VIEW_INVENTORY] },
        ]
      }
    ]
  },

  // ==========================
  // 4. SALES & BILLING (CRM)
  // ==========================
  {
    label: 'Sales & Billing',
    icon: 'pi pi-shopping-cart',
    permissions: [PERMISSIONS.INVOICE.READ, PERMISSIONS.CUSTOMER.READ, PERMISSIONS.EMI.READ],
    items: [
      {
        label: 'Invoices',
        icon: 'pi pi-receipt',
        permissions: [PERMISSIONS.INVOICE.READ],
        items: [
          { label: 'All Invoices', icon: 'pi pi-list', routerLink: ['/invoices'], permissions: [PERMISSIONS.INVOICE.READ] },
          { label: 'Scan Invoice', icon: 'pi pi-plus', routerLink: ['/invoices/PosInvoiceComponent'], permissions: [PERMISSIONS.INVOICE.CREATE] },
          { label: 'Create Invoice', icon: 'pi pi-plus', routerLink: ['/invoices/create'], permissions: [PERMISSIONS.INVOICE.CREATE] },
          // { label: 'Profit Dashboard (Old)', icon: 'pi pi-chart-pie', routerLink: ['/invoices/ProfitDashboardComponent'], permissions: [PERMISSIONS.REPORT.PROFIT] },
          { label: 'Profit Dashboard ', icon: 'pi pi-file-excel', routerLink: ['/invoices/profitDashboardNew'], permissions: [PERMISSIONS.REPORT.PROFIT] },
          { label: 'Profit Summary', icon: 'pi pi-file-excel', routerLink: ['/invoices/ProfitSummaryComponent'], permissions: [PERMISSIONS.REPORT.PROFIT] },
          { label: 'Advanced Analysis', icon: 'pi pi-chart-bar', routerLink: ['/invoices/AdvancedProfitAnalysisComponent'], permissions: [PERMISSIONS.REPORT.PROFIT] },
        ]
      },
      { label: 'Customers Analytics', icon: 'pi pi-users', routerLink: ['/customer/analyticsCustomer'], permissions: [PERMISSIONS.CUSTOMER.READ] },
      { label: 'Customers', icon: 'pi pi-users', routerLink: ['/customer'], permissions: [PERMISSIONS.CUSTOMER.READ] },
      { label: 'Sales Returns', icon: 'pi pi-replay', routerLink: ['/sales/returns'], permissions: [PERMISSIONS.SALES_RETURN.READ] },
      { label: 'EMI Management', icon: 'pi pi-calendar-clock', routerLink: ['/emis'], permissions: [PERMISSIONS.EMI.READ] },
    ]
  },

  // ==========================
  // 5. WORKSPACE & MEETINGS
  // ==========================
  {
    label: 'Workspace',
    icon: 'pi pi-briefcase',
    permissions: [PERMISSIONS.NOTE.READ, PERMISSIONS.NOTE.VIEW_ANALYTICS, PERMISSIONS.NOTE.VIEW_CALENDAR, PERMISSIONS.MEETING.READ],
    items: [
      { label: 'Notes Admin List', icon: 'pi pi-shield', routerLink: ['/notes/admin/notes'], permissions: [PERMISSIONS.NOTE.READ] },
      { label: 'Notes Analytics', icon: 'pi pi-chart-bar', routerLink: ['/notes/analytics'], permissions: [PERMISSIONS.NOTE.VIEW_ANALYTICS] },
      { label: 'Notes List', icon: 'pi pi-list', routerLink: ['/notes'], permissions: [PERMISSIONS.NOTE.READ] },
      { label: 'Create Note', icon: 'pi pi-plus', routerLink: ['/notes/create'], permissions: [PERMISSIONS.NOTE.WRITE] },
      { label: 'Calendar', icon: 'pi pi-calendar', routerLink: ['/notes/calendar'], permissions: [PERMISSIONS.NOTE.VIEW_CALENDAR] },
      { label: 'Meetings', icon: 'pi pi-video', routerLink: ['/notes/Meeting'], permissions: [PERMISSIONS.MEETING.READ] },
    ]
  },

  // ==========================
  // 6. INVENTORY & PURCHASE
  // ==========================
  {
    label: 'Inventory & Purchase',
    icon: 'pi pi-box',
    permissions: [PERMISSIONS.PRODUCT.READ, PERMISSIONS.PURCHASE.READ, PERMISSIONS.SUPPLIER.READ],
    items: [
      {
        label: 'Products',
        icon: 'pi pi-tag',
        permissions: [PERMISSIONS.PRODUCT.READ],
        items: [
          { label: 'Product List', icon: 'pi pi-list', routerLink: ['/product'], permissions: [PERMISSIONS.PRODUCT.READ] },
          { label: 'Add Product', icon: 'pi pi-plus', routerLink: ['/product/create'], permissions: [PERMISSIONS.PRODUCT.CREATE] },
          { label: 'Low Stock Report', icon: 'pi pi-exclamation-triangle', routerLink: ['/product/reports/low-stock'], permissions: [PERMISSIONS.PRODUCT.READ] },
        ]
      },
      {
        label: 'Purchases',
        icon: 'pi pi-shopping-bag',
        permissions: [PERMISSIONS.PURCHASE.READ],
        items: [
          { label: 'Purchase Orders', icon: 'pi pi-list', routerLink: ['/purchase'], permissions: [PERMISSIONS.PURCHASE.READ] },
          { label: 'New Purchase', icon: 'pi pi-plus', routerLink: ['/purchase/create'], permissions: [PERMISSIONS.PURCHASE.CREATE] },
          { label: 'Debit Notes (Returns)', icon: 'pi pi-replay', routerLink: ['/purchase/returns'], permissions: [PERMISSIONS.PURCHASE.RETURN] }
        ]
      },
      { label: 'Suppliers', icon: 'pi pi-truck', routerLink: ['/suppliers'], permissions: [PERMISSIONS.SUPPLIER.READ] },
    ]
  },

  // ==========================
  // 7. FINANCE & ACCOUNTS
  // ==========================
  {
    label: 'Accounting',
    icon: 'pi pi-wallet',
    permissions: [PERMISSIONS.LEDGER.READ, PERMISSIONS.ACCOUNT.READ, PERMISSIONS.PAYMENT.READ, PERMISSIONS.TRANSACTION.READ, PERMISSIONS.SALES.VIEW],
    items: [
      { label: 'Ledger (P&L)', icon: 'pi pi-book', routerLink: ['/financials'], permissions: [PERMISSIONS.LEDGER.READ] },
      {
        label: 'Chart of Accounts',
        icon: 'pi pi-sitemap',
        permissions: [PERMISSIONS.ACCOUNT.READ],
        items: [
          { label: 'List View', icon: 'pi pi-list', routerLink: ['/accounts'], permissions: [PERMISSIONS.ACCOUNT.READ] },
          { label: 'Tree View', icon: 'pi pi-share-alt', routerLink: ['/accounts/tree'], permissions: [PERMISSIONS.ACCOUNT.READ] },
        ]
      },
      { label: 'Payments', icon: 'pi pi-money-bill', routerLink: ['/payments'], permissions: [PERMISSIONS.PAYMENT.READ] },
      { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'], permissions: [PERMISSIONS.TRANSACTION.READ] },
      { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'], permissions: [PERMISSIONS.SALES.VIEW] },
      { label: 'Sales Returns', icon: 'pi pi-replay', routerLink: ['/sales/returns'], permissions: [PERMISSIONS.SALES_RETURN.READ] },
    ]
  },

  // ==========================
  // 8. HUMAN RESOURCES
  // ==========================
  {
    label: 'Human Resources',
    icon: 'pi pi-id-card',
    permissions: [PERMISSIONS.DEPARTMENT.READ, PERMISSIONS.USER.READ, PERMISSIONS.SHIFT.READ, PERMISSIONS.ATTENDANCE.READ, PERMISSIONS.LEAVE.READ],
    items: [
      {
        label: 'Self Service',
        icon: 'pi pi-user',
        items: [
          { label: 'My Time Hub', icon: 'pi pi-compass', routerLink: ['/hrms/my-time'], permissions: [PERMISSIONS.ATTENDANCE.READ] },
        ]
      },
      {
        label: 'Workforce & Time',
        icon: 'pi pi-users',
        permissions: [PERMISSIONS.USER.READ, PERMISSIONS.ATTENDANCE.MANAGE],
        items: [
          { label: 'User Directory', icon: 'pi pi-users', routerLink: ['/user/list'], permissions: [PERMISSIONS.USER.READ] },
          { label: 'Employee Directory', icon: 'pi pi-users', routerLink: ['/hrms/employees/list'], permissions: [PERMISSIONS.USER.READ] },
          { label: 'Live Punches', icon: 'pi pi-bolt', routerLink: ['/hrms/attendance/live-feed'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'Attendance Admin', icon: 'pi pi-shield', routerLink: ['/hrms/attendance/admin'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'HR Reports', icon: 'pi pi-chart-bar', routerLink: ['/hrms/daily-attendance/reports'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'Leave Admin', icon: 'pi pi-calendar-plus', routerLink: ['/hrms/leave/admin'], permissions: [PERMISSIONS.LEAVE.ADMIN] },
        ]
      },
      {
        label: 'HR Configuration',
        icon: 'pi pi-cog',
        permissions: [PERMISSIONS.DEPARTMENT.MANAGE, PERMISSIONS.SHIFT.MANAGE],
        items: [
          { label: 'Department Hub', icon: 'pi pi-building', routerLink: ['/hrms/department/hub'], permissions: [PERMISSIONS.DEPARTMENT.READ] },
          { label: 'Designation Hub', icon: 'pi pi-id-card', routerLink: ['/hrms/designation/list'], permissions: [PERMISSIONS.DESIGNATION.READ] },
          { label: 'Shift Roster', icon: 'pi pi-calendar', routerLink: ['/hrms/shifts/list'], permissions: [PERMISSIONS.SHIFT.READ] },
          { label: 'Shift Assignment', icon: 'pi pi-user-plus', routerLink: ['/hrms/shift-groups/list'], permissions: [PERMISSIONS.SHIFT.GROUP_READ] },
          { label: 'Geofencing', icon: 'pi pi-map-marker', routerLink: ['/hrms/geofence/hub'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'Biometrics', icon: 'pi pi-fingerprint', routerLink: ['/hrms/attendance/machines/hub'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'Holiday Calendar', icon: 'pi pi-calendar-ext', routerLink: ['/hrms/holidays/hub'], permissions: [PERMISSIONS.DEPARTMENT.READ] },
        ]
      }
    ]
  },

  // ==========================
  // 9. STOREFRONT ADMIN
  // ==========================
  {
    label: 'Storefront',
    icon: 'pi pi-shopping-bag',
    permissions: [PERMISSIONS.ORG.MANAGE, PERMISSIONS.STOREFRONT.READ],
    items: [
      { label: 'Command Center', icon: 'pi pi-home', routerLink: ['/storefront/overview'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Analytics Overview', icon: 'pi pi-chart-line', routerLink: ['/storefront/analytics'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Sales Reports', icon: 'pi pi-file-excel', routerLink: ['/storefront/reports/sales'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Page Builder', icon: 'pi pi-sitemap', routerLink: ['/storefront/pages'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Templates Library', icon: 'pi pi-clone', routerLink: ['/storefront/templates'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Media Manager', icon: 'pi pi-image', routerLink: ['/storefront/media'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Orders', icon: 'pi pi-receipt', routerLink: ['/storefront/orders'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Abandoned Carts', icon: 'pi pi-shopping-cart', routerLink: ['/storefront/abandoned-carts'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Delivery Agents', icon: 'pi pi-truck', routerLink: ['/storefront/delivery-agents'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Customers', icon: 'pi pi-users', routerLink: ['/storefront/customers'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Customer Segments', icon: 'pi pi-users', routerLink: ['/storefront/segments'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Coupons', icon: 'pi pi-ticket', routerLink: ['/storefront/coupons'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Discount Manager', icon: 'pi pi-percentage', routerLink: ['/storefront/discounts'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'Smart Rules', icon: 'pi pi-bolt', routerLink: ['/storefront/rules'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      { label: 'SEO Dashboard', icon: 'pi pi-search', routerLink: ['/storefront/seo'], permissions: [PERMISSIONS.STOREFRONT.READ] },
      {
        label: 'Design & Layout',
        icon: 'pi pi-palette',
        permissions: [PERMISSIONS.STOREFRONT.LAYOUT_MANAGE, PERMISSIONS.STOREFRONT.THEME_MANAGE],
        items: [
          { label: 'Themes', icon: 'pi pi-images', routerLink: ['/storefront/themes'], permissions: [PERMISSIONS.STOREFRONT.THEME_MANAGE] },
          { label: 'Master Layout', icon: 'pi pi-desktop', routerLink: ['/storefront/settings/layout'], permissions: [PERMISSIONS.STOREFRONT.LAYOUT_MANAGE] }
        ]
      },
      {
        label: 'Administration',
        icon: 'pi pi-cog',
        permissions: [PERMISSIONS.STOREFRONT.READ],
        items: [
          { label: 'Storefront Settings', icon: 'pi pi-cog', routerLink: ['/storefront/settings'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Domain Settings', icon: 'pi pi-globe', routerLink: ['/storefront/domains'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Integrations', icon: 'pi pi-link', routerLink: ['/storefront/integrations'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Role Management', icon: 'pi pi-users', routerLink: ['/storefront/roles'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Billing', icon: 'pi pi-credit-card', routerLink: ['/storefront/billing'], permissions: [PERMISSIONS.STOREFRONT.READ] }
        ]
      },
      {
        label: 'System Logs',
        icon: 'pi pi-list',
        permissions: [PERMISSIONS.STOREFRONT.READ],
        items: [
          { label: 'Activity Logs', icon: 'pi pi-history', routerLink: ['/storefront/activity'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Audit History', icon: 'pi pi-history', routerLink: ['/storefront/audit-history'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Notifications Center', icon: 'pi pi-bell', routerLink: ['/storefront/notifications'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Publish History', icon: 'pi pi-cloud-upload', routerLink: ['/storefront/publish-history'], permissions: [PERMISSIONS.STOREFRONT.READ] },
          { label: 'Page Revisions', icon: 'pi pi-file-edit', routerLink: ['/storefront/revisions'], permissions: [PERMISSIONS.STOREFRONT.READ] }
        ]
      }
    ]
  },

  // ==========================
  // 10. SYSTEM ADMINISTRATION
  // ==========================
  {
    label: 'Administration',
    icon: 'pi pi-cog',
    permissions: [PERMISSIONS.ORG.MANAGE, PERMISSIONS.ROLE.MANAGE, PERMISSIONS.MASTER.READ, PERMISSIONS.SESSION.VIEW_ALL, PERMISSIONS.ASSET.READ],
    items: [
      { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'], permissions: [PERMISSIONS.ORG.MANAGE] },
      { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'], permissions: [PERMISSIONS.BRANCH.READ] },
      { label: 'Roles & Permissions', icon: 'pi pi-lock', routerLink: ['/admin/roles'], permissions: [PERMISSIONS.ROLE.MANAGE] },
      { label: 'Master Data', icon: 'pi pi-database', routerLink: ['/masterList'], permissions: [PERMISSIONS.MASTER.READ] },
      { label: 'Active Sessions', icon: 'pi pi-wifi', routerLink: ['/sessions'], permissions: [PERMISSIONS.SESSION.VIEW_ALL] },
      { label: 'Assets', icon: 'pi pi-wifi', routerLink: ['/assets'], permissions: [PERMISSIONS.ASSET.READ] },
    ]
  }
];
