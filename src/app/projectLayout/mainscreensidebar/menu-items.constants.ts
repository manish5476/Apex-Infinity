export interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string[];
  items?: MenuItem[];
  badge?: string;
  expanded?: boolean; // Optional: helps if you want accordion style
}

export const SIDEBAR_MENU: MenuItem[] = [
  // ==========================
  // 1. CORE & DASHBOARD
  // ==========================
  {
    label: 'Overview',
    icon: 'pi pi-home',
    items: [
      { label: 'Dashboard', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
      { label: 'Team Chat', icon: 'pi pi-comments', routerLink: ['/chat'] },
      { label: 'My Notes', icon: 'pi pi-book', routerLink: ['/notes'] },
    ]
  },

  // ==========================
  // 2. SALES & BILLING (CRM)
  // ==========================
  {
    label: 'Sales & Billing',
    icon: 'pi pi-shopping-cart',
    items: [
      {
        label: 'Invoices',
        icon: 'pi pi-receipt',
        items: [
          { label: 'All Invoices', icon: 'pi pi-list', routerLink: ['/invoices'] },
          { label: 'Create Invoice', icon: 'pi pi-plus', routerLink: ['/invoices/create'] },
          { label: 'Profit Dashboard', icon: 'pi pi-chart-pie', routerLink: ['/invoices/ProfitDashboardComponent'] },
          { label: 'Profit Summary', icon: 'pi pi-file-excel', routerLink: ['/invoices/ProfitSummaryComponent'] },
          { label: 'Advanced Analysis', icon: 'pi pi-chart-bar', routerLink: ['/invoices/AdvancedProfitAnalysisComponent'] },
        ]
      },
      { label: 'Customers', icon: 'pi pi-users', routerLink: ['/customer'] },
      { label: 'EMI Management', icon: 'pi pi-calendar-clock', routerLink: ['/emis'] },
    ]
  },

  // ==========================
  // 3. WORKSPACE & MEETINGS
  // ==========================
  {
    label: 'Workspace',
    icon: 'pi pi-briefcase',
    items: [
      { label: 'Notes Admin List', icon: 'pi pi-shield', routerLink: ['/notes/admin/notes'] },
      { label: 'Notes Analytics', icon: 'pi pi-chart-bar', routerLink: ['/notes/analytics'] },
      { label: 'Notes List', icon: 'pi pi-list', routerLink: ['/notes'] },
      { label: 'Create Note', icon: 'pi pi-plus', routerLink: ['/notes/create'] },
      { label: 'Calendar', icon: 'pi pi-calendar', routerLink: ['/notes/calendar'] },
      { label: 'Meetings', icon: 'pi pi-video', routerLink: ['/notes/Meeting'] },
    ]
  },

  // ==========================
  // 4. INVENTORY & SUPPLY (SCM)
  // ==========================
  {
    label: 'Inventory & Purchase',
    icon: 'pi pi-box',
    items: [
      {
        label: 'Products',
        icon: 'pi pi-tag',
        items: [
          { label: 'Product List', icon: 'pi pi-list', routerLink: ['/product'] },
          { label: 'Add Product', icon: 'pi pi-plus', routerLink: ['/product/create'] },
        ]
      },
      {
        label: 'Purchases',
        icon: 'pi pi-shopping-bag',
        items: [
          { label: 'Purchase Orders', icon: 'pi pi-list', routerLink: ['/purchase'] },
          { label: 'New Purchase', icon: 'pi pi-plus', routerLink: ['/purchase/create'] },
          { label: 'Debit Notes (Returns)', icon: 'pi pi-replay', routerLink: ['/purchase/returns'] }
        ]
      },
      { label: 'Suppliers', icon: 'pi pi-truck', routerLink: ['/suppliers'] },
    ]
  },

  // ==========================
  // 5. FINANCE & ACCOUNTS
  // ==========================
  {
    label: 'Accounting',
    icon: 'pi pi-wallet',
    items: [
      { label: 'Ledger (P&L)', icon: 'pi pi-book', routerLink: ['/financials'] },
      {
        label: 'Chart of Accounts',
        icon: 'pi pi-sitemap',
        items: [
          { label: 'List View', icon: 'pi pi-list', routerLink: ['/accounts'] },
          { label: 'Tree View', icon: 'pi pi-share-alt', routerLink: ['/accounts/tree'] },
        ]
      },
      { label: 'Payments', icon: 'pi pi-money-bill', routerLink: ['/payments'] },
      { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'] },
      { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
    ]
  },

  // ==========================
  // 6. HUMAN RESOURCES (HRMS)
  // ==========================
  {
    label: 'Human Resources',
    icon: 'pi pi-id-card',
    items: [
      {
        label: 'Core HR',
        icon: 'pi pi-building',
        items: [
          { label: 'Department Hub', icon: 'pi pi-home', routerLink: ['/hrms/department/hub'] },
          { label: 'Department List', icon: 'pi pi-list', routerLink: ['/hrms/department/list'] },
          { label: 'Designation Hierarchy', icon: 'pi pi-sitemap', routerLink: ['/hrms/designation/heirachy'] },
          { label: 'Designation List', icon: 'pi pi-list', routerLink: ['/hrms/designation/list'] }
        ]
      },
      {
        label: 'Staff Management',
        icon: 'pi pi-users',
        items: [
          { label: 'Employee List', icon: 'pi pi-users', routerLink: ['/user/list'] },
          { label: 'Onboard User', icon: 'pi pi-user-plus', routerLink: ['/user/create'] },
        ]
      },
      {
        label: 'Shifts & Rosters',
        icon: 'pi pi-clock',
        items: [
          { label: 'Shift Hub', icon: 'pi pi-calendar', routerLink: ['/hrms/shifts/list'] },
          { label: 'Shift Coverage', icon: 'pi pi-users', routerLink: ['/hrms/shifts/coverage'] },
          { label: 'Group Rotation', icon: 'pi pi-sync', routerLink: ['/hrms/shift-groups/list'] }
        ]
      },
      {
        label: 'Time & Attendance',
        icon: 'pi pi-calendar-times',
        items: [
          { label: 'My Web Clock', icon: 'pi pi-clock', routerLink: ['/hrms/attendance/my-clock'] },
          { label: 'My Timesheet', icon: 'pi pi-calendar', routerLink: ['/hrms/daily-attendance/my-timesheet'] },
          { label: 'Live Punch Feed', icon: 'pi pi-video', routerLink: ['/hrms/attendance/live-feed'] },
          { label: 'Daily Admin Register', icon: 'pi pi-sliders-h', routerLink: ['/hrms/daily-attendance/admin'] },
          { label: 'Reports & Bulk Edit', icon: 'pi pi-file-excel', routerLink: ['/hrms/daily-attendance/reports'] }
        ]
      },
      {
        label: 'Leaves & Holidays',
        icon: 'pi pi-calendar-minus',
        items: [
          { label: 'My Leaves', icon: 'pi pi-user', routerLink: ['/hrms/leave/hub'] },
          { label: 'Leave Admin Hub', icon: 'pi pi-shield', routerLink: ['/hrms/leave/admin'] },
          { label: 'Balance Admin', icon: 'pi pi-wallet', routerLink: ['/hrms/leave-balances/admin'] },
          { label: 'Holiday Calendar', icon: 'pi pi-calendar-plus', routerLink: ['/hrms/holidays/hub'] },
        ]
      },
      {
        label: 'Devices & Locations',
        icon: 'pi pi-server',
        items: [
          { label: 'Machine Fleet Hub', icon: 'pi pi-desktop', routerLink: ['/hrms/machines/hub'] },
          { label: 'Machine Logs', icon: 'pi pi-list', routerLink: ['/hrms/machines/logs'] },
          { label: 'Machine Analytics', icon: 'pi pi-chart-bar', routerLink: ['/hrms/machines/analytics'] },
          { label: 'Geofence Command', icon: 'pi pi-map', routerLink: ['/hrms/geofence/hub'] }
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
    items: [
      { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] },
      { label: 'Storefront Pages', icon: 'pi pi-pages', routerLink: ['/storefront/pages'] },
      { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
      { label: 'Roles & Permissions', icon: 'pi pi-lock', routerLink: ['/admin/roles'] },
      { label: 'Master Data', icon: 'pi pi-database', routerLink: ['/masterList'] },
      { label: 'Active Sessions', icon: 'pi pi-wifi', routerLink: ['/sessions'] },
    ]
  }
];


// export interface MenuItem {
//   label: string;
//   icon: string;
//   routerLink?: string[];
//   items?: MenuItem[];
//   badge?: string;
//   expanded?: boolean; // Optional: helps if you want accordion style
// }

// export const SIDEBAR_MENU: MenuItem[] = [
//   // ==========================
//   // 1. CORE & DASHBOARD
//   // ==========================
//   {
//     label: 'Overview',
//     icon: 'pi pi-home',
//     items: [
//       { label: 'Dashboard', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
//       { label: 'Team Chat', icon: 'pi pi-comments', routerLink: ['/chat'] },
//       { label: 'My Notes', icon: 'pi pi-book', routerLink: ['/notes'] },
//     ]
//   },

//   // ==========================
//   // 2. SALES & BILLING (CRM)
//   // ==========================
//   {
//     label: 'Sales & Billing',
//     icon: 'pi pi-shopping-cart',
//     items: [
//       // Invoices & Analytics
//       {
//         label: 'Invoices',
//         icon: 'pi pi-receipt',
//         items: [
//           { label: 'All Invoices', icon: 'pi pi-list', routerLink: ['/invoices'] },
//           { label: 'Create Invoice', icon: 'pi pi-plus', routerLink: ['/invoices/create'] },
//           // Specific Analytics Routes
//           { label: 'Profit Dashboard', icon: 'pi pi-chart-pie', routerLink: ['/invoices/ProfitDashboardComponent'] },
//           { label: 'Profit Summary', icon: 'pi pi-file-excel', routerLink: ['/invoices/ProfitSummaryComponent'] },
//           { label: 'Advanced Analysis', icon: 'pi pi-chart-bar', routerLink: ['/invoices/AdvancedProfitAnalysisComponent'] },
//         ]
//       },
//       { label: 'Customers', icon: 'pi pi-users', routerLink: ['/customer'] },
//       { label: 'EMI Management', icon: 'pi pi-calendar-clock', routerLink: ['/emis'] },
//     ]
//   },
//   {
//     label: 'Notes',
//     icon: 'pi pi-book',
//     items: [

//       {
//         label: 'Notes Admin List',
//         icon: 'pi pi-list',
//         routerLink: ['/notes/admin/notes']
//       },
//       {
//         label: 'Notes Analytics',
//         icon: 'pi pi-list',
//         routerLink: ['/notes/analytics']
//       },
//       {
//         label: 'Notes List',
//         icon: 'pi pi-list',
//         routerLink: ['/notes']
//       },

//       {
//         label: 'Create Note',
//         icon: 'pi pi-plus',
//         routerLink: ['/notes/create']
//       },

//       {
//         label: 'Calendar',
//         icon: 'pi pi-calendar',
//         routerLink: ['/notes/calendar']
//       },
//       {
//         label: 'Meeting',
//         icon: 'pi pi-calendar',
//         routerLink: ['/notes/Meeting']
//       },
//     ]
//   },
//   // ==========================
//   // 3. INVENTORY & SUPPLY (SCM)
//   // ==========================
//   {
//     label: 'Inventory & Purchase',
//     icon: 'pi pi-box',
//     items: [
//       {
//         label: 'Products',
//         icon: 'pi pi-tag',
//         items: [
//           { label: 'Product List', icon: 'pi pi-list', routerLink: ['/product'] },
//           { label: 'Add Product', icon: 'pi pi-plus', routerLink: ['/product/create'] },
//         ]
//       },
//       {
//         label: 'Purchases',
//         icon: 'pi pi-shopping-bag',
//         items: [
//           { label: 'Purchase Orders', icon: 'pi pi-list', routerLink: ['/purchase'] },
//           { label: 'New Purchase', icon: 'pi pi-plus', routerLink: ['/purchase/create'] },
//           // ✅ ADDED: Returns / Debit Notes
//           { label: 'Debit Notes (Returns)', icon: 'pi pi-replay', routerLink: ['/purchase/returns'] }
//         ]
//       },
//       { label: 'Suppliers', icon: 'pi pi-truck', routerLink: ['/suppliers'] },
//     ]
//   },

//   // ==========================
//   // 4. FINANCE & ACCOUNTS
//   // ==========================
//   {
//     label: 'Accounting',
//     icon: 'pi pi-wallet',
//     items: [
//       { label: 'Ledger (P&L)', icon: 'pi pi-book', routerLink: ['/financials'] },
//       {
//         label: 'Chart of Accounts',
//         icon: 'pi pi-sitemap',
//         items: [
//           { label: 'List View', icon: 'pi pi-list', routerLink: ['/accounts'] },
//           { label: 'Tree View', icon: 'pi pi-share-alt', routerLink: ['/accounts/tree'] },
//         ]
//       },
//       { label: 'Payments', icon: 'pi pi-money-bill', routerLink: ['/payments'] },
//       { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'] },
//       { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
//     ]
//   },

//   // ==========================
//   // 5. WORKFORCE (HR)
//   // ==========================
// {
//   label: 'Human Resources',
//   icon: 'pi pi-id-card',
//   items: [
//     {
//       label: 'Department',
//       icon: 'pi pi-building',
//       items: [
//         { label: 'Department Hub', icon: 'pi pi-home', routerLink: ['/hrms/department/hub'] },
//         { label: 'Department List', icon: 'pi pi-list', routerLink: ['/hrms/department/list'] },
//         { label: 'Add Department', icon: 'pi pi-plus', routerLink: ['/hrms/department/new'] }
//       ]
//     },
//     {
//       label: 'Designation',
//       icon: 'pi pi-sitemap',
//       items: [
//         { label: 'Designation Hierarchy', icon: 'pi pi-sitemap', routerLink: ['/hrms/designation/heirachy'] },
//         { label: 'Designation Promotion', icon: 'pi pi-arrow-up', routerLink: ['/hrms/designation/promotion'] },
//         { label: 'Designation Salary', icon: 'pi pi-money-bill', routerLink: ['/hrms/designation/salary'] },
//         { label: 'Designation Career', icon: 'pi pi-map', routerLink: ['/hrms/designation/career'] },
//         { label: 'Designation List', icon: 'pi pi-list', routerLink: ['/hrms/designation/list'] },
//         { label: 'Add Designation', icon: 'pi pi-plus', routerLink: ['/hrms/designation/new'] }
//       ]
//     },
//     {
//       label: 'Shifts & Rosters',
//       icon: 'pi pi-clock',
//       items: [
//         { label: 'Shift List', icon: 'pi pi-list', routerLink: ['/hrms/shifts/list'] },
//         { label: 'Add Shift', icon: 'pi pi-plus', routerLink: ['/hrms/shifts/new'] },
//         { label: 'Clone Shift', icon: 'pi pi-copy', routerLink: ['/hrms/shifts/clone'] },
//         { label: 'Shift Coverage', icon: 'pi pi-users', routerLink: ['/hrms/shifts/coverage'] },
//         { label: 'Shift Calculator', icon: 'pi pi-calculator', routerLink: ['/hrms/shifts/calculator'] },
//         { label: 'Shift Validator', icon: 'pi pi-check-square', routerLink: ['/hrms/shifts/validator'] },
//         { label: 'Group List', icon: 'pi pi-sync', routerLink: ['/hrms/shift-groups/list'] },
//         { label: 'Create Group', icon: 'pi pi-plus-circle', routerLink: ['/hrms/shift-groups/new'] }
//       ]
//     },
//     {
//       label: 'Leave Management',
//       icon: 'pi pi-calendar-minus',
//       items: [
//         { label: 'My Leaves', icon: 'pi pi-user', routerLink: ['/hrms/leave/hub'] },
//         { label: 'Apply for Leave', icon: 'pi pi-send', routerLink: ['/hrms/leave/apply'] },
//         { label: 'Leave Admin Hub', icon: 'pi pi-shield', routerLink: ['/hrms/leave/admin'] },
//         { label: 'Balance Admin', icon: 'pi pi-wallet', routerLink: ['/hrms/leave-balances/admin'] }
//       ]
//     },
//     {
//       label: 'Raw Attendance (Logs)',
//       icon: 'pi pi-id-card',
//       items: [
//         { label: 'My Web Clock', icon: 'pi pi-clock', routerLink: ['/hrms/attendance/my-clock'] },
//         { label: 'Live Punch Feed', icon: 'pi pi-video', routerLink: ['/hrms/attendance/live-feed'] },
//         { label: 'Log Audit Console', icon: 'pi pi-eye', routerLink: ['/hrms/attendance/admin'] }
//       ]
//     },
//     {
//       label: 'Daily Attendance',
//       icon: 'pi pi-calendar-times',
//       items: [
//         { label: 'My Timesheet', icon: 'pi pi-calendar', routerLink: ['/hrms/daily-attendance/my-timesheet'] },
//         { label: 'Daily Admin Register', icon: 'pi pi-sliders-h', routerLink: ['/hrms/daily-attendance/admin'] },
//         { label: 'Reports & Bulk Edit', icon: 'pi pi-file-excel', routerLink: ['/hrms/daily-attendance/reports'] }
//       ]
//     },
//     { label: 'Holiday Calendar', icon: 'pi pi-calendar-plus', routerLink: ['/hrms/holidays/hub'] },
//     {
//       label: 'Devices & Locations',
//       icon: 'pi pi-server',
//       items: [
//         { label: 'Machine Fleet Hub', icon: 'pi pi-desktop', routerLink: ['/hrms/machines/hub'] },
//         { label: 'Register Device', icon: 'pi pi-plus-circle', routerLink: ['/hrms/machines/new'] },
//         { label: 'machine Logs', icon: 'pi pi-plus-circle', routerLink: ['/hrms/machines/Logs'] },
//         { label: 'Machine Analytics', icon: 'pi pi-plus-circle', routerLink: ['/hrms/machines/analytics'] },
//         { label: 'Geofence Command', icon: 'pi pi-map', routerLink: ['/hrms/geofence/hub'] },
//         { label: 'Define Boundary', icon: 'pi pi-map-marker', routerLink: ['/hrms/geofence/new'] },
//         { label: 'Define Boundary', icon: 'pi pi-map-marker', routerLink: ['/hrms/geofence/new'] },
//       ]
//     }
//   ]
// },
//   {
//     label: 'Staff Management',
//     icon: 'pi pi-user',
//     items: [
//       { label: 'Employee List', icon: 'pi pi-users', routerLink: ['/user/list'] },
//       { label: 'Onboard User', icon: 'pi pi-user-plus', routerLink: ['/user/create'] },
//     ]
//   },
  
//   // ==========================
//   // 6. SYSTEM ADMINISTRATION
//   // ==========================
//   {
//     label: 'Administration',
//     icon: 'pi pi-cog',
//     items: [
//       { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] },
//       { label: 'storefront', icon: 'pi pi-pages', routerLink: ['/storefront/pages'] },
//       { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
//       { label: 'Roles & Permissions', icon: 'pi pi-lock', routerLink: ['/admin/roles'] },
//       { label: 'Master Data', icon: 'pi pi-database', routerLink: ['/masterList'] },
//       // { label: 'System Logs', icon: 'pi pi-exclamation-circle', routerLink: ['/logs'] },
//       { label: 'Active Sessions', icon: 'pi pi-wifi', routerLink: ['/sessions'] },
//     ]
//   },

// ];



// // export interface MenuItem {
// //   label: string;
// //   icon: string;
// //   routerLink?: string[];
// //   items?: MenuItem[];
// //   badge?: string;
// // }

// // export const SIDEBAR_MENU: MenuItem[] = [
// //   // --- CORE MODULE ---
// //   {
// //     label: 'Dashboard',
// //     icon: 'pi pi-home',
// //     items: [
// //       { label: 'Business Overview', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
// //       { label: 'Real-time Chat', icon: 'pi pi-message', routerLink: ['/chat'] },
// //       { label: 'Internal Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
// //       { label: 'Active Sessions', icon: 'pi pi-history', routerLink: ['/sessions'] },
// //       { label: 'Acounts', icon: 'pi pi-history', routerLink: ['/accounts'] },
// //       { label: 'Acounts tree', icon: 'pi pi-history', routerLink: ['/accounts/tree'] },
// //       // { label: 'attendence', icon: 'pi pi-history', routerLink: ['/attendence'] },
// //       // { label: 'shift', icon: 'pi pi-history', routerLink: ['/shift'] },
// //       // { label: 'holiday', icon: 'pi pi-history', routerLink: ['/holiday'] },
// //     ]
// //   },
// //   {
// //     label: 'Attendance',
// //     icon: 'pi pi-calendar',
// //     items: [
// //       {
// //         label: 'Dashboard',
// //         icon: 'pi pi-home',
// //         routerLink: ['/attendence/dashboard']
// //       },
// //       {
// //         label: 'punching',
// //         icon: 'pi pi-home',
// //         routerLink: ['/attendence/punching']
// //       },
// //       {
// //         label: 'Management',
// //         icon: 'pi pi-users',
// //         routerLink: ['/attendence/manager']
// //       },
// //       {
// //         label: 'Reports',
// //         icon: 'pi pi-chart-bar',
// //         routerLink: ['/attendence/reports']
// //       },
// //       {
// //         label: 'Shifts',
// //         icon: 'pi pi-clock',
// //         routerLink: ['/attendence/shifts']
// //       },
// //       {
// //         label: 'Holidays',
// //         icon: 'pi pi-calendar-times',
// //         routerLink: ['/attendence/holidays']
// //       },
// //       {
// //         label: 'My Requests',
// //         icon: 'pi pi-inbox',
// //         routerLink: ['/attendence/my-requests']
// //       }
// //     ]
// //   },
// //   {
// //     label: 'Sales & Customers',
// //     icon: 'pi pi-shopping-cart',
// //     items: [
// //       { label: 'All Invoices', icon: 'pi pi-file-pdf', routerLink: ['/invoices'] },
// //       { label: 'Create Invoice', icon: 'pi pi-file-edit', routerLink: ['/invoices/create'] },
// //       { label: 'Invoice analytics', icon: 'pi pi-file-edit', routerLink: ['/invoices/invoicesanalytics'] },
// //       { label: 'ProfitSummaryComponent analytics', icon: 'pi pi-file-edit', routerLink: ['/invoices/ProfitSummaryComponent'] },
// //       { label: 'ProfitDashboardComponent analytics', icon: 'pi pi-file-edit', routerLink: ['/invoices/ProfitDashboardComponent'] },
// //       { label: 'AdvancedProfitAnalysisComponent analytics', icon: 'pi pi-file-edit', routerLink: ['/invoices/AdvancedProfitAnalysisComponent'] },
// //       { label: 'EMI Manager', icon: 'pi pi-calendar-clock', routerLink: ['/emis'] },
// //       { label: 'Customer Directory', icon: 'pi pi-address-book', routerLink: ['/customer'] },
// //       { label: 'Add New Customer', icon: 'pi pi-user-plus', routerLink: ['/customer/create'] }
// //     ]
// //   },

// //   // --- SUPPLY CHAIN & EXPENDITURE ---
// //   {
// //     label: 'Procurement',
// //     icon: 'pi pi-box',
// //     items: [
// //       { label: 'Supplier List', icon: 'pi pi-truck', routerLink: ['/suppliers'] },
// //       { label: 'Onboard Supplier', icon: 'pi pi-plus-circle', routerLink: ['/suppliers/create'] },
// //       { label: 'Product Inventory', icon: 'pi pi-list-check', routerLink: ['/product'] },
// //       { label: 'Master Catalog', icon: 'pi pi-tag', routerLink: ['/product/create'] }
// //     ]
// //   },

// //   // --- FINANCIAL CONTROL ---
// //   // {
// //   //   label: 'Financials',
// //   //   icon: 'pi pi-money-bill',
// //   //   items: [
// //   //     { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
// //   //     { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
// //   //     { label: 'Transaction Logs', icon: 'pi pi-receipt', routerLink: ['/transactions'] }
// //   //   ]
// //   // },
// //   {
// //     label: 'Financials',
// //     icon: 'pi pi-money-bill',
// //     items: [
// //       { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
// //       { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
// //       { label: 'Transaction Logs', icon: 'pi pi-receipt', routerLink: ['/transactions'] },

// //       // 💳 PAYMENTS (restored)
// //       { label: 'Payment History', icon: 'pi pi-wallet', routerLink: ['/payments'] },
// //       { label: 'Record Payment', icon: 'pi pi-plus-circle', routerLink: ['/payments/create'] }
// //     ]
// //   },
// //   // --- SYSTEM ADMINISTRATION ---
// //   {
// //     label: 'Administration',
// //     icon: 'pi pi-cog',
// //     items: [
// //       { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] },
// //       { label: 'Branch Management', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
// //       { label: 'Roles & Permissions', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
// //       { label: 'System Master List', icon: 'pi pi-database', routerLink: ['/masterList'] }
// //     ]
// //   },
// //   {
// //     label: 'purchase', icon: 'pi pi-box',
// //     items: [
// //       { label: 'Inventory buy', icon: 'pi pi-list', routerLink: ['/purchase'] },
// //       { label: 'Add purchase', icon: 'pi pi-plus', routerLink: ['/purchase/create'] },
// //     ]
// //   },

// //   // --- HUMAN CAPITAL ---
// //   {
// //     label: 'User Management',
// //     icon: 'pi pi-users',
// //     items: [
// //       { label: 'Staff Directory', icon: 'pi pi-id-card', routerLink: ['/user/list'] },
// //       { label: 'Create User Account', icon: 'pi pi-user-plus', routerLink: ['/user/create'] }
// //     ]
// //   }
// // ];

// // // // export interface MenuItem {
// // // //   label: string; // Removed the '?'
// // // //   icon: string;
// // // //   routerLink?: string[];
// // // //   items?: MenuItem[];
// // // // }
// // // // export const SIDEBAR_MENU: MenuItem[] = [
// // // //   {
// // // //     label: 'Dashboard', icon: 'pi pi-home',
// // // //     items: [
// // // //       { label: 'Overview', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
// // // //       { label: 'Chat', icon: 'pi pi-message', routerLink: ['/chat'] },
// // // //       { label: 'Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
// // // //       { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] },
// // // //       { label: 'Sessions', icon: 'pi pi-clock', routerLink: ['/sessions'] }
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Financials', icon: 'pi pi-wallet',
// // // //     items: [
// // // //       { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
// // // //       { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Admin Panel', icon: 'pi pi-shield',
// // // //     items: [
// // // //       { label: 'Master List', icon: 'pi pi-database', routerLink: ['/masterList'] },
// // // //       { label: 'Roles & Access', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
// // // //       { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
// // // //       { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Users Panel', icon: 'pi pi-users',
// // // //     items: [
// // // //       { label: 'User List', icon: 'pi pi-list', routerLink: ['/user/list'] },
// // // //       { label: 'Create User', icon: 'pi pi-user-plus', routerLink: ['/user/create'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Customers', icon: 'pi pi-id-card',
// // // //     items: [
// // // //       { label: 'Customer List', icon: 'pi pi-users', routerLink: ['/customer'] },
// // // //       { label: 'Add Customer', icon: 'pi pi-plus', routerLink: ['/customer/create'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Suppliers', icon: 'pi pi-truck',
// // // //     items: [
// // // //       { label: 'Supplier List', icon: 'pi pi-directions-alt', routerLink: ['/suppliers'] },
// // // //       { label: 'Add Supplier', icon: 'pi pi-plus-circle', routerLink: ['/suppliers/create'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Products', icon: 'pi pi-box',
// // // //     items: [
// // // //       { label: 'Inventory', icon: 'pi pi-clone', routerLink: ['/product'] },
// // // //       { label: 'Add Product', icon: 'pi pi-tag', routerLink: ['/product/create'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'Invoices', icon: 'pi pi-file-export',
// // // //     items: [
// // // //       { label: 'All Invoices', icon: 'pi pi-copy', routerLink: ['/invoices'] },
// // // //       { label: 'Create Invoice', icon: 'pi pi-file-edit', routerLink: ['/invoices/create'] },
// // // //     ]
// // // //   },
// // // //   {
// // // //     label: 'EMI Manager', icon: 'pi pi-calendar-clock',
// // // //     items: [
// // // //       { label: 'EMI List', icon: 'pi pi-percentage', routerLink: ['/emis'] },
// // // //     ]
// // // //   }
// // // // ];

// // // export interface MenuItem {
// // //   label: string; // Removed the '?'
// // //   icon: string;
// // //   routerLink?: string[];
// // //   items?: MenuItem[];
// // // }
// // // export const SIDEBAR_MENU: MenuItem[] = [
// // //   {
// // //     label: 'Dashboard', icon: 'pi pi-home',
// // //     items: [
// // //       { label: 'Overview', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
// // //       { label: 'Chat', icon: 'pi pi-message', routerLink: ['/chat'] },
// // //       { label: 'Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
// // //       { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] },
// // //       { label: 'Sessions', icon: 'pi pi-clock', routerLink: ['/sessions'] }
// // //     ]
// // //   },
// // //   {
// // //     label: 'Financials', icon: 'pi pi-wallet',
// // //     items: [
// // //       { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
// // //       { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'Admin Panel', icon: 'pi pi-shield',
// // //     items: [
// // //       { label: 'Master List', icon: 'pi pi-database', routerLink: ['/masterList'] },
// // //       { label: 'Roles & Access', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
// // //       { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
// // //       { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'Users Panel', icon: 'pi pi-users',
// // //     items: [
// // //       { label: 'User List', icon: 'pi pi-list', routerLink: ['/user/list'] },
// // //       { label: 'Create User', icon: 'pi pi-user-plus', routerLink: ['/user/create'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'Customers', icon: 'pi pi-id-card',
// // //     items: [
// // //       { label: 'Customer List', icon: 'pi pi-users', routerLink: ['/customer'] },
// // //       { label: 'Add Customer', icon: 'pi pi-plus', routerLink: ['/customer/create'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'Suppliers', icon: 'pi pi-truck',
// // //     items: [
// // //       { label: 'Supplier List', icon: 'pi pi-directions-alt', routerLink: ['/suppliers'] },
// // //       { label: 'Add Supplier', icon: 'pi pi-plus-circle', routerLink: ['/suppliers/create'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'Products', icon: 'pi pi-box',
// // //     items: [
// // //       { label: 'Inventory', icon: 'pi pi-clone', routerLink: ['/product'] },
// // //       { label: 'Add Product', icon: 'pi pi-tag', routerLink: ['/product/create'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'Invoices', icon: 'pi pi-file-export',
// // //     items: [
// // //       { label: 'All Invoices', icon: 'pi pi-copy', routerLink: ['/invoices'] },
// // //       { label: 'Create Invoice', icon: 'pi pi-file-edit', routerLink: ['/invoices/create'] },
// // //     ]
// // //   },
// // //   {
// // //     label: 'EMI Manager', icon: 'pi pi-calendar-clock',
// // //     items: [
// // //       { label: 'EMI List', icon: 'pi pi-percentage', routerLink: ['/emis'] },
// // //     ]
// // //   }
// // // ];


// // {
// //     label: 'Attendance',
// //     icon: 'pi pi-clock',
// //     items: [
// //       { label: 'Dashboard', icon: 'pi pi-desktop', routerLink: ['/attendence/dashboard'] },
// //       { label: 'Punch In/Out', icon: 'pi pi-check-circle', routerLink: ['/attendence/punching'] },
// //       { label: 'My Requests', icon: 'pi pi-inbox', routerLink: ['/attendence/my-requests'] },
// //       { label: 'Manager View', icon: 'pi pi-briefcase', routerLink: ['/attendence/manager'] },
// //       { label: 'Shifts', icon: 'pi pi-calendar', routerLink: ['/attendence/shifts'] },
// //       { label: 'Holidays', icon: 'pi pi-sun', routerLink: ['/attendence/holidays'] },
// //       { label: 'Reports', icon: 'pi pi-file', routerLink: ['/attendence/reports'] },
// //     ]
// //   }
// //   ,
