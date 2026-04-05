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
      { label: 'Dashboard', icon: 'pi pi-chart-line', routerLink: ['/dashboard'], permissions: [PERMISSIONS.DASHBOARD.VIEW] },
      { label: 'Team Chat', icon: 'pi pi-comments', routerLink: ['/chat'], permissions: [PERMISSIONS.CHAT.READ] },
      { label: 'My Notes', icon: 'pi pi-book', routerLink: ['/notes'], permissions: [PERMISSIONS.NOTE.READ] },
    ]
  },

  // ==========================
  // 2. SALES & BILLING (CRM)
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
          { label: 'Profit Dashboard', icon: 'pi pi-chart-pie', routerLink: ['/invoices/ProfitDashboardComponent'], permissions: [PERMISSIONS.REPORT.PROFIT] },
          { label: 'Profit Dashboard', icon: 'pi pi-file-excel', routerLink: ['/invoices/profitDashboardNew'], permissions: [PERMISSIONS.REPORT.PROFIT] },
          { label: 'Profit Summary', icon: 'pi pi-file-excel', routerLink: ['/invoices/ProfitSummaryComponent'], permissions: [PERMISSIONS.REPORT.PROFIT] },
          { label: 'Advanced Analysis', icon: 'pi pi-chart-bar', routerLink: ['/invoices/AdvancedProfitAnalysisComponent'], permissions: [PERMISSIONS.REPORT.PROFIT] },
        ]
      },
      { label: 'Customers Analytics', icon: 'pi pi-users', routerLink: ['/customer/analytics'], permissions: [PERMISSIONS.CUSTOMER.READ] },
      { label: 'Customers', icon: 'pi pi-users', routerLink: ['/customer'], permissions: [PERMISSIONS.CUSTOMER.READ] },
      { label: 'EMI Management', icon: 'pi pi-calendar-clock', routerLink: ['/emis'], permissions: [PERMISSIONS.EMI.READ] },
    ]
  },

  // ==========================
  // 3. WORKSPACE & MEETINGS
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
  // 4. INVENTORY & SUPPLY (SCM)
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
  // 5. FINANCE & ACCOUNTS
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
    ]
  },

  // ==========================
  // 6. HUMAN RESOURCES
  // ==========================
  {
    label: 'Human Resources',
    icon: 'pi pi-id-card',
    permissions: [PERMISSIONS.DEPARTMENT.READ, PERMISSIONS.USER.READ, PERMISSIONS.SHIFT.READ, PERMISSIONS.ATTENDANCE.READ, PERMISSIONS.LEAVE.READ],
    items: [
      {
        label: 'Core HR',
        icon: 'pi pi-building',
        permissions: [PERMISSIONS.DEPARTMENT.READ, PERMISSIONS.DESIGNATION.READ],
        items: [
          { label: 'Department Hub', icon: 'pi pi-home', routerLink: ['/hrms/department/hub'], permissions: [PERMISSIONS.DEPARTMENT.READ] },
          { label: 'Department List', icon: 'pi pi-list', routerLink: ['/hrms/department/list'], permissions: [PERMISSIONS.DEPARTMENT.READ] },
          { label: 'Department Hierarchy', icon: 'pi pi-sitemap', routerLink: ['/hrms/department/heirachy'], permissions: [PERMISSIONS.DEPARTMENT.READ] },
          { label: 'Add Department', icon: 'pi pi-plus', routerLink: ['/hrms/department/new'], permissions: [PERMISSIONS.DEPARTMENT.MANAGE] },
          { label: 'Designation List', icon: 'pi pi-list', routerLink: ['/hrms/designation/list'], permissions: [PERMISSIONS.DESIGNATION.READ] },
          { label: 'Designation Hierarchy', icon: 'pi pi-sitemap', routerLink: ['/hrms/designation/heirachy'], permissions: [PERMISSIONS.DESIGNATION.READ] },
          { label: 'Add Designation', icon: 'pi pi-plus', routerLink: ['/hrms/designation/new'], permissions: [PERMISSIONS.DESIGNATION.MANAGE] },
          { label: 'Salary Bands', icon: 'pi pi-money-bill', routerLink: ['/hrms/designation/salary'], permissions: [PERMISSIONS.DESIGNATION.MANAGE] },
          { label: 'Promotions', icon: 'pi pi-angle-double-up', routerLink: ['/hrms/designation/promotion'], permissions: [PERMISSIONS.DESIGNATION.MANAGE] },
          { label: 'Career Path', icon: 'pi pi-map', routerLink: ['/hrms/designation/career'], permissions: [PERMISSIONS.DESIGNATION.READ] }
        ]
      },
      {
        label: 'Staff Management',
        icon: 'pi pi-users',
        permissions: [PERMISSIONS.USER.READ],
        items: [
          { label: 'Employee List', icon: 'pi pi-users', routerLink: ['/user/list'], permissions: [PERMISSIONS.USER.READ] },
          { label: 'Employee Hierarchy', icon: 'pi pi-sitemap', routerLink: ['/user/hierarchy'], permissions: [PERMISSIONS.USER.READ] },
          { label: 'Onboard User', icon: 'pi pi-user-plus', routerLink: ['/user/create'], permissions: [PERMISSIONS.USER.MANAGE] },
        ]
      },
      {
        label: 'Shifts & Rosters',
        icon: 'pi pi-clock',
        permissions: [PERMISSIONS.SHIFT.READ],
        items: [
          { label: 'Shift Hub', icon: 'pi pi-calendar', routerLink: ['/hrms/shifts/list'], permissions: [PERMISSIONS.SHIFT.READ] },
          { label: 'Add Shift', icon: 'pi pi-plus', routerLink: ['/hrms/shifts/new'], permissions: [PERMISSIONS.SHIFT.MANAGE] },
          { label: 'Shift Coverage', icon: 'pi pi-users', routerLink: ['/hrms/shifts/coverage'], permissions: [PERMISSIONS.SHIFT.READ] },
          { label: 'Shift Validator', icon: 'pi pi-check-square', routerLink: ['/hrms/shifts/validator'], permissions: [PERMISSIONS.SHIFT.MANAGE] },
          { label: 'Shift Calculator', icon: 'pi pi-calculator', routerLink: ['/hrms/shifts/calculator'], permissions: [PERMISSIONS.SHIFT.MANAGE] },
          { label: 'Clone Shift', icon: 'pi pi-copy', routerLink: ['/hrms/shifts/clone'], permissions: [PERMISSIONS.SHIFT.MANAGE] },
          { label: 'Group Rotation', icon: 'pi pi-sync', routerLink: ['/hrms/shift-groups/list'], permissions: [PERMISSIONS.SHIFT.GROUP_READ] },
          { label: 'Add Shift Group', icon: 'pi pi-plus', routerLink: ['/hrms/shift-groups/create'], permissions: [PERMISSIONS.SHIFT.GROUP_MANAGE] }
        ]
      },
      {
        label: 'Time & Attendance',
        icon: 'pi pi-calendar-times',
        permissions: [PERMISSIONS.ATTENDANCE.READ],
        items: [
          { label: 'My Web Clock', icon: 'pi pi-clock', routerLink: ['/hrms/attendance/my-clock'], permissions: [PERMISSIONS.ATTENDANCE.READ] },
          { label: 'My Timesheet', icon: 'pi pi-calendar', routerLink: ['/hrms/daily-attendance/my-timesheet'], permissions: [PERMISSIONS.ATTENDANCE.READ] },
          { label: 'Live Punch Feed', icon: 'pi pi-video', routerLink: ['/hrms/attendance/live-feed'], permissions: [PERMISSIONS.ATTENDANCE.READ] },
          { label: 'Attendance Admin', icon: 'pi pi-shield', routerLink: ['/hrms/attendance/admin'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'Daily Admin Register', icon: 'pi pi-sliders-h', routerLink: ['/hrms/daily-attendance/admin'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] },
          { label: 'Reports & Bulk Edit', icon: 'pi pi-file-excel', routerLink: ['/hrms/daily-attendance/reports'], permissions: [PERMISSIONS.ATTENDANCE.MANAGE] }
        ]
      },
      {
        label: 'Leaves & Holidays',
        icon: 'pi pi-calendar-minus',
        permissions: [PERMISSIONS.LEAVE.READ, PERMISSIONS.HOLIDAY.READ],
        items: [
          { label: 'My Leaves', icon: 'pi pi-user', routerLink: ['/hrms/leave/hub'], permissions: [PERMISSIONS.LEAVE.READ] },
          { label: 'Apply Leave', icon: 'pi pi-pencil', routerLink: ['/hrms/leave/apply'], permissions: [PERMISSIONS.LEAVE.REQUEST] },
          { label: 'Leave Admin Hub', icon: 'pi pi-shield', routerLink: ['/hrms/leave/admin'], permissions: [PERMISSIONS.LEAVE.ADMIN] },
          { label: 'Balance Admin', icon: 'pi pi-wallet', routerLink: ['/hrms/leave-balances/admin'], permissions: [PERMISSIONS.LEAVE.BALANCE_MANAGE] },
          { label: 'Holiday Calendar', icon: 'pi pi-calendar-plus', routerLink: ['/hrms/holidays/hub'], permissions: [PERMISSIONS.HOLIDAY.READ] },
          { label: 'Add Holiday', icon: 'pi pi-plus', routerLink: ['/hrms/holidays/new'], permissions: [PERMISSIONS.HOLIDAY.MANAGE] }
        ]
      },
      {
        label: 'Devices & Locations',
        icon: 'pi pi-server',
        permissions: [PERMISSIONS.ATTENDANCE.MACHINE_READ, PERMISSIONS.ATTENDANCE.GEOFENCE_READ],
        items: [
          { label: 'Machine Fleet Hub', icon: 'pi pi-desktop', routerLink: ['/hrms/attendance/machines/hub'], permissions: [PERMISSIONS.ATTENDANCE.MACHINE_READ] },
          { label: 'Add Machine', icon: 'pi pi-plus', routerLink: ['/hrms/attendance/machines/new'], permissions: [PERMISSIONS.ATTENDANCE.MACHINE_MANAGE] },
          { label: 'Machine Logs', icon: 'pi pi-list', routerLink: ['/hrms/attendance/machines/logs'], permissions: [PERMISSIONS.ATTENDANCE.MACHINE_READ] },
          { label: 'Machine Analytics', icon: 'pi pi-chart-bar', routerLink: ['/hrms/attendance/machines/analytics'], permissions: [PERMISSIONS.ATTENDANCE.MACHINE_READ] },
          { label: 'Geofence Command', icon: 'pi pi-map', routerLink: ['/hrms/geofence/hub'], permissions: [PERMISSIONS.ATTENDANCE.GEOFENCE_READ] },
          { label: 'Add Geofence', icon: 'pi pi-plus', routerLink: ['/hrms/geofence/new'], permissions: [PERMISSIONS.ATTENDANCE.GEOFENCE_MANAGE] }
        ]
      }
    ]
  },

  // ==========================
  // 7. SYSTEM ADMINISTRATION
  // ==========================
  {
    label: 'Administration',
    icon: 'pi pi-cog',
    permissions: [PERMISSIONS.ORG.MANAGE, PERMISSIONS.ROLE.MANAGE, PERMISSIONS.MASTER.READ, PERMISSIONS.SESSION.VIEW_ALL, PERMISSIONS.ASSET.READ],
    items: [
      { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'], permissions: [PERMISSIONS.ORG.MANAGE] },
      { label: 'Storefront Pages', icon: 'pi pi-pages', routerLink: ['/storefront/pages'], permissions: [PERMISSIONS.ORG.MANAGE] },
      { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'], permissions: [PERMISSIONS.BRANCH.READ] },
      { label: 'Roles & Permissions', icon: 'pi pi-lock', routerLink: ['/admin/roles'], permissions: [PERMISSIONS.ROLE.MANAGE] },
      { label: 'Master Data', icon: 'pi pi-database', routerLink: ['/masterList'], permissions: [PERMISSIONS.MASTER.READ] },
      { label: 'Active Sessions', icon: 'pi pi-wifi', routerLink: ['/sessions'], permissions: [PERMISSIONS.SESSION.VIEW_ALL] },
      { label: 'Assets', icon: 'pi pi-wifi', routerLink: ['/assets'], permissions: [PERMISSIONS.ASSET.READ] },
    ]
  }
];