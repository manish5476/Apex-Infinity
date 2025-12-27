export interface MenuItem {
  label: string; // Removed the '?'
  icon: string;
  routerLink?: string[];
  items?: MenuItem[];
}
export const SIDEBAR_MENU: MenuItem[] = [
  {
    label: 'Dashboard', icon: 'pi pi-home',
    items: [
      { label: 'Overview', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
      { label: 'Chat', icon: 'pi pi-message', routerLink: ['/chat'] },
      { label: 'Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
      { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] }, 
      { label: 'Sessions', icon: 'pi pi-clock', routerLink: ['/sessions'] } 
    ]
  },
  {
    label: 'Financials', icon: 'pi pi-wallet',
    items: [
      { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
      { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
    ]
  },
  {
    label: 'Admin Panel', icon: 'pi pi-shield',
    items: [
      { label: 'Master List', icon: 'pi pi-database', routerLink: ['/masterList'] },
      { label: 'Roles & Access', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
      { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
      { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'] },
    ]
  },
  {
    label: 'Users Panel', icon: 'pi pi-users',
    items: [
      { label: 'User List', icon: 'pi pi-list', routerLink: ['/user/list'] },
      { label: 'Create User', icon: 'pi pi-user-plus', routerLink: ['/user/create'] },
    ]
  },
  {
    label: 'Customers', icon: 'pi pi-id-card',
    items: [
      { label: 'Customer List', icon: 'pi pi-users', routerLink: ['/customer'] },
      { label: 'Add Customer', icon: 'pi pi-plus', routerLink: ['/customer/create'] },
    ]
  },
  {
    label: 'Suppliers', icon: 'pi pi-truck',
    items: [
      { label: 'Supplier List', icon: 'pi pi-directions-alt', routerLink: ['/suppliers'] },
      { label: 'Add Supplier', icon: 'pi pi-plus-circle', routerLink: ['/suppliers/create'] },
    ]
  },
  {
    label: 'Products', icon: 'pi pi-box',
    items: [
      { label: 'Inventory', icon: 'pi pi-clone', routerLink: ['/product'] },
      { label: 'Add Product', icon: 'pi pi-tag', routerLink: ['/product/create'] },
    ]
  },
  {
    label: 'Invoices', icon: 'pi pi-file-export',
    items: [
      { label: 'All Invoices', icon: 'pi pi-copy', routerLink: ['/invoices'] },
      { label: 'Create Invoice', icon: 'pi pi-file-edit', routerLink: ['/invoices/create'] },
    ]
  },
  {
    label: 'EMI Manager', icon: 'pi pi-calendar-clock',
    items: [
      { label: 'EMI List', icon: 'pi pi-percentage', routerLink: ['/emis'] },
    ]
  }
];




// export interface MenuItem {
//   label: string;
//   icon: string;
//   routerLink?: string[];
//   items?: MenuItem[];
//   badge?: string; 
// }

// export const SIDEBAR_MENU: MenuItem[] = [
//   // --- CORE MODULE ---
//   {
//     label: 'Dashboard', 
//     icon: 'pi pi-home',
//     items: [
//       { label: 'Business Overview', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
//       { label: 'Real-time Chat', icon: 'pi pi-message', routerLink: ['/chat'] },
//       { label: 'Internal Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
//       { label: 'Active Sessions', icon: 'pi pi-history', routerLink: ['/sessions'] }
//     ]
//   },

//   // --- REVENUE & CRM CYCLE ---
//   {
//     label: 'Sales & Customers', 
//     icon: 'pi pi-shopping-cart',
//     items: [
//       { label: 'All Invoices', icon: 'pi pi-file-pdf', routerLink: ['/invoices'] },
//       { label: 'Create Invoice', icon: 'pi pi-file-edit', routerLink: ['/invoices/create'] },
//       { label: 'EMI Manager', icon: 'pi pi-calendar-clock', routerLink: ['/emis'] },
//       { label: 'Customer Directory', icon: 'pi pi-address-book', routerLink: ['/customer'] },
//       { label: 'Add New Customer', icon: 'pi pi-user-plus', routerLink: ['/customer/create'] }
//     ]
//   },

//   // --- SUPPLY CHAIN & EXPENDITURE ---
//   {
//     label: 'Procurement', 
//     icon: 'pi pi-box',
//     items: [
//       { label: 'Supplier List', icon: 'pi pi-truck', routerLink: ['/suppliers'] },
//       { label: 'Onboard Supplier', icon: 'pi pi-plus-circle', routerLink: ['/suppliers/create'] },
//       { label: 'Product Inventory', icon: 'pi pi-list-check', routerLink: ['/product'] },
//       { label: 'Master Catalog', icon: 'pi pi-tag', routerLink: ['/product/create'] }
//     ]
//   },

//   // --- FINANCIAL CONTROL ---
//   {
//     label: 'Financials', 
//     icon: 'pi pi-money-bill',
//     items: [
//       { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
//       { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
//       { label: 'Transaction Logs', icon: 'pi pi-receipt', routerLink: ['/transactions'] }
//     ]
//   },

//   // --- SYSTEM ADMINISTRATION ---
//   {
//     label: 'Administration', 
//     icon: 'pi pi-cog',
//     items: [
//       { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] },
//       { label: 'Branch Management', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
//       { label: 'Roles & Permissions', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
//       { label: 'System Master List', icon: 'pi pi-database', routerLink: ['/masterList'] }
//     ]
//   },

//   // --- HUMAN CAPITAL ---
//   {
//     label: 'User Management', 
//     icon: 'pi pi-users',
//     items: [
//       { label: 'Staff Directory', icon: 'pi pi-id-card', routerLink: ['/user/list'] },
//       { label: 'Create User Account', icon: 'pi pi-user-plus', routerLink: ['/user/create'] }
//     ]
//   }
// ];

// // export interface MenuItem {
// //   label: string; // Removed the '?'
// //   icon: string;
// //   routerLink?: string[];
// //   items?: MenuItem[];
// // }
// // export const SIDEBAR_MENU: MenuItem[] = [
// //   {
// //     label: 'Dashboard', icon: 'pi pi-home',
// //     items: [
// //       { label: 'Overview', icon: 'pi pi-chart-line', routerLink: ['/dashboard'] },
// //       { label: 'Chat', icon: 'pi pi-message', routerLink: ['/chat'] },
// //       { label: 'Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
// //       { label: 'Organization', icon: 'pi pi-building', routerLink: ['/admin/organization'] }, 
// //       { label: 'Sessions', icon: 'pi pi-clock', routerLink: ['/sessions'] } 
// //     ]
// //   },
// //   {
// //     label: 'Financials', icon: 'pi pi-wallet',
// //     items: [
// //       { label: 'P&L Statement', icon: 'pi pi-calculator', routerLink: ['/financials'] },
// //       { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
// //     ]
// //   },
// //   {
// //     label: 'Admin Panel', icon: 'pi pi-shield',
// //     items: [
// //       { label: 'Master List', icon: 'pi pi-database', routerLink: ['/masterList'] },
// //       { label: 'Roles & Access', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
// //       { label: 'Branches', icon: 'pi pi-map-marker', routerLink: ['/branches'] },
// //       { label: 'Transactions', icon: 'pi pi-history', routerLink: ['/transactions'] },
// //     ]
// //   },
// //   {
// //     label: 'Users Panel', icon: 'pi pi-users',
// //     items: [
// //       { label: 'User List', icon: 'pi pi-list', routerLink: ['/user/list'] },
// //       { label: 'Create User', icon: 'pi pi-user-plus', routerLink: ['/user/create'] },
// //     ]
// //   },
// //   {
// //     label: 'Customers', icon: 'pi pi-id-card',
// //     items: [
// //       { label: 'Customer List', icon: 'pi pi-users', routerLink: ['/customer'] },
// //       { label: 'Add Customer', icon: 'pi pi-plus', routerLink: ['/customer/create'] },
// //     ]
// //   },
// //   {
// //     label: 'Suppliers', icon: 'pi pi-truck',
// //     items: [
// //       { label: 'Supplier List', icon: 'pi pi-directions-alt', routerLink: ['/suppliers'] },
// //       { label: 'Add Supplier', icon: 'pi pi-plus-circle', routerLink: ['/suppliers/create'] },
// //     ]
// //   },
// //   {
// //     label: 'Products', icon: 'pi pi-box',
// //     items: [
// //       { label: 'Inventory', icon: 'pi pi-clone', routerLink: ['/product'] },
// //       { label: 'Add Product', icon: 'pi pi-tag', routerLink: ['/product/create'] },
// //     ]
// //   },
// //   {
// //     label: 'Invoices', icon: 'pi pi-file-export',
// //     items: [
// //       { label: 'All Invoices', icon: 'pi pi-copy', routerLink: ['/invoices'] },
// //       { label: 'Create Invoice', icon: 'pi pi-file-edit', routerLink: ['/invoices/create'] },
// //     ]
// //   },
// //   {
// //     label: 'EMI Manager', icon: 'pi pi-calendar-clock',
// //     items: [
// //       { label: 'EMI List', icon: 'pi pi-percentage', routerLink: ['/emis'] },
// //     ]
// //   }
// // ];