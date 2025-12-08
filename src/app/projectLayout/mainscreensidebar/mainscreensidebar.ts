import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Router, RouterModule } from '@angular/router'; // <-- FIX 2: Import Router
import { AuthService } from '../../modules/auth/services/auth-service';

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, RouterModule],
  templateUrl: './mainscreensidebar.html',
  styleUrl: './mainscreensidebar.scss',
})
export class Mainscreensidebar implements OnInit {
  @Input() isPinned: boolean = false;
  @Input() isHovered: boolean = false;
  @Output() pinToggle = new EventEmitter<void>();
  @Output() mouseEnter = new EventEmitter<void>();
  @Output() mouseEnterTriggerZone = new EventEmitter<void>();
  @Output() mouseLeave = new EventEmitter<void>();

  expandedItems: { [key: string]: boolean } = {};
  menuItems: any[] = [];

  private authService = inject(AuthService);
  private router = inject(Router); // <-- FIX 2: Inject Router

  constructor() { }

  ngOnInit() {
    this.menuItems = this.getCorrectMenuItems();

    // --- FIX 2: Auto-expand active menu on load ---
    this.menuItems.forEach(item => {
      if (item.items) { // Only check expandable items

        // Check if any child route is currently active
        const isChildActive = item.items.some((subItem:any) => {
          const childPath = subItem.routerLink.join('/');

          // Special case for root or dashboard links (must be exact)
          if (childPath === '/' || childPath.includes('/dashboard')) {
            return this.router.url === childPath;
          }

          // General case for all other routes (e.g., /customer/create starts with /customer)
          return this.router.url.startsWith(childPath);
        });

        // Set the parent to expanded if a child is active
        this.expandedItems[item.label] = isChildActive;
      }
    });
    // --- End of Fix ---
  }

  getCorrectMenuItems(): any[] {
  return [
    {
      label: 'Dashboard', icon: 'pi pi-home',
      items: [
        { label: 'Overview', icon: 'pi pi-chart-bar', routerLink: ['/dashboard'] },
        { label: 'chat', icon: 'pi pi-message', routerLink: ['/chat'] },
        { label: 'Notes', icon: 'pi pi-pencil', routerLink: ['/notes'] },
        { label: 'Organization', icon: 'pi pi-cog', routerLink: ['/admin/organization'] }, 
        { label: 'Sessions', icon: 'pi pi-clock', routerLink: ['/sessions'] } 
      ]
    },
    {
      label: 'Financials', icon: 'pi pi-wallet',
      items: [
        { label: 'P&L Statement', icon: 'pi pi-chart-line', routerLink: ['/financials'] },
        { label: 'Sales Reports', icon: 'pi pi-chart-bar', routerLink: ['/sales'] },
      ]
    },
    {
      label: 'Admin Panel', icon: 'pi pi-shield',
      items: [
        { label: 'Master List', icon: 'pi pi-database', routerLink: ['/masterList'] },
        { label: 'Roles & Access', icon: 'pi pi-key', routerLink: ['/admin/roles'] },
        { label: 'Branches', icon: 'pi pi-building', routerLink: ['/branches'] },
        { label: 'Create Branch', icon: 'pi pi-plus-circle', routerLink: ['/branches/create'] },
        { label: 'Transactions', icon: 'pi pi-book', routerLink: ['/transactions'] },
        { label: 'System Logs', icon: 'pi pi-history', routerLink: ['/logs'] },
      ]
    },
    {
      label: 'Customers', icon: 'pi pi-user',
      items: [
        { label: 'Customer List', icon: 'pi pi-users', routerLink: ['/customer'] },
        { label: 'Add Customer', icon: 'pi pi-user-plus', routerLink: ['/customer/create'] },
      ]
    },
    {
      label: 'Suppliers', icon: 'pi pi-truck',
      items: [
        { label: 'Supplier List', icon: 'pi pi-list', routerLink: ['/suppliers'] },
        { label: 'Add Supplier', icon: 'pi pi-plus', routerLink: ['/suppliers/create'] },
      ]
    },
    {
      label: 'Products', icon: 'pi pi-box',
      items: [
        { label: 'Inventory', icon: 'pi pi-list-check', routerLink: ['/product'] },
        { label: 'Add Product', icon: 'pi pi-plus-circle', routerLink: ['/product/create'] },
      ]
    },
    {
      label: 'Purchase', icon: 'pi pi-shopping-cart',
      items: [
        { label: 'Purchase List', icon: 'pi pi-list', routerLink: ['/purchase'] },
        { label: 'New Purchase', icon: 'pi pi-cart-plus', routerLink: ['/purchase/create'] },
      ]
    },
    {
      label: 'Invoices', icon: 'pi pi-file',
      items: [
        { label: 'All Invoices', icon: 'pi pi-list', routerLink: ['/invoices'] },
        { label: 'Create Invoice', icon: 'pi pi-plus-circle', routerLink: ['/invoices/create'] },
      ]
    },
    {
      label: 'Payments', icon: 'pi pi-credit-card',
      items: [
        { label: 'Payment History', icon: 'pi pi-history', routerLink: ['/payments'] },
        { label: 'Record Payment', icon: 'pi pi-money-bill', routerLink: ['/payments/create'] },
      ]
    },
    {
      label: 'EMI Manager', icon: 'pi pi-calendar-clock',
      items: [
        { label: 'EMI List', icon: 'pi pi-list', routerLink: ['/emis'] },
      ]
    }
  ];
}


//   getCorrectMenuItems(): any[] {
//   return [
//     {
//       label: 'Dashboard', icon: 'pi pi-home',
//       items: [
//         { label: 'Overview', icon: 'pi pi-chart-bar', routerLink: ['/dashboard'] },
//         { label: 'Notes', icon: 'pi pi-chart-bar', routerLink: ['/notes'] },
//         { label: 'organization setting', icon: 'pi pi-cog', routerLink: ['/admin/organization'] }, 
//         { label: 'sessions', icon: 'pi pi-cog', routerLink: ['/sessions'] } 
//       ]
//     },
//     // 🚀 NEW: FINANCIALS SECTION
//     {
//       label: 'Financials', icon: 'pi pi-file-excel',
//       items: [
//         { label: 'P&L Statement', icon: 'pi pi-chart-line', routerLink: ['/financials'] },
//         { label: 'Sales', icon: 'pi pi-chart-line', routerLink: ['/sales'] },
//       ]
//     },
//     // -----------------------------------------------------
//     {
//       label: 'Admin', icon: 'pi pi-shield',
//       items: [
//         { label: 'Master List', icon: 'pi pi-database', routerLink: ['/masterList'] },
//         { label: 'Roles', icon: 'pi pi-lock', routerLink: ['/admin/roles'] },
//         { label: 'Branches', icon: 'pi pi-building', routerLink: ['/branches'] },
//         { label: 'Add Branch', icon: 'pi pi-plus', routerLink: ['/branches/create'] },
//         { label: 'Transactions', icon: 'pi pi-address-book', routerLink: ['/transactions'] },
//         { label: 'logs', icon: 'pi pi-address-book', routerLink: ['/logs'] },
//       ]
//     },
//     {
//       label: 'Customers', icon: 'pi pi-users',
//       items: [
//         { label: 'All Customers', icon: 'pi pi-list', routerLink: ['/customer'] },
//         { label: 'Add Customer', icon: 'pi pi-user-plus', routerLink: ['/customer/create'] },
//       ]
//     },
//     {
//       label: 'Suppliers', icon: 'pi pi-briefcase',
//       items: [
//         { label: 'All Suppliers', icon: 'pi pi-list', routerLink: ['/suppliers'] },
//         { label: 'Add Supplier', icon: 'pi pi-plus', routerLink: ['/suppliers/create'] },
//       ]
//     },
//     {
//       label: 'Products', icon: 'pi pi-box',
//       items: [
//         { label: 'Inventory', icon: 'pi pi-list', routerLink: ['/product'] },
//         { label: 'Add Product', icon: 'pi pi-plus', routerLink: ['/product/create'] },
//       ]
//     },
//     {
//       label: 'purchase', icon: 'pi pi-box',
//       items: [
//         { label: 'Inventory buy', icon: 'pi pi-list', routerLink: ['/purchase'] },
//         { label: 'Add purchase', icon: 'pi pi-plus', routerLink: ['/purchase/create'] },
//       ]
//     },
//     {
//       label: 'Invoices', icon: 'pi pi-file',
//       items: [
//         { label: 'All Invoices', icon: 'pi pi-list', routerLink: ['/invoices'] },
//         { label: 'New Invoice', icon: 'pi pi-plus-circle', routerLink: ['/invoices/create'] },
//       ]
//     },
//     {
//       label: 'Payments', icon: 'pi pi-wallet',
//       items: [
//         { label: 'Transaction History', icon: 'pi pi-history', routerLink: ['/payments'] },
//         { label: 'Record Payments', icon: 'pi pi-plus', routerLink: ['/payments/create'] },
//       ]
//     },
//     {
//       label: 'EMI', icon: 'pi pi-calendar',
//       items: [
//         { label: 'EMI Lists', icon: 'pi pi-list', routerLink: ['/emis'] },
//         // { label: 'Create Plan', icon: 'pi pi-plus', routerLink: ['/emis/create'] },
//       ]
//     }
//   ];
// }
  // --- No changes to the functions below ---
  toggleMenuItem(label: string) {
    if (this.expandedItems.hasOwnProperty(label)) {
      this.expandedItems[label] = !this.expandedItems[label];
    }
  }

  onMenuTitleEnter(label: string) {
    if (!this.isPinned) {
      if (this.expandedItems.hasOwnProperty(label)) {
        this.expandedItems[label] = true;
      }
    }
  }

  onMenuTitleLeave(label: string) {
    if (!this.isPinned) {
      if (this.expandedItems.hasOwnProperty(label)) {
        this.expandedItems[label] = false;
      }
    }
  }

  logout() {
    this.authService.logout();
  }
}