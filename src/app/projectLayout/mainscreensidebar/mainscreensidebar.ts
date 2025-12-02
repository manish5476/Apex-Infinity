import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Router, RouterModule } from '@angular/router';
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
  private router = inject(Router);

  constructor() { }

  ngOnInit() {
    this.menuItems = this.getCorrectMenuItems();

    // --- Auto-expand active menu on load ---
    this.menuItems.forEach(item => {
      if (item.items) { 
        // Check if any child route is currently active
        const isChildActive = item.items.some((subItem:any) => {
          const childPath = subItem.routerLink.join('/');
          
          // Now that all paths start with /app, simple inclusion check works best
          return this.router.url.includes(childPath);
        });

        // Set the parent to expanded if a child is active
        if(isChildActive) {
            this.expandedItems[item.label] = true;
        }
      }
    });
  }

  // =========================================================
  // ✅ FIX: ALL LINKS NOW HAVE '/app' PREFIX
  // =========================================================
  getCorrectMenuItems(): any[] {
    return [
      {
        label: 'Dashboard', icon: 'pi pi-home',
        items: [
          { label: 'Overview', icon: 'pi pi-chart-bar', routerLink: ['/app/dashboard'] },
          { label: 'Notes', icon: 'pi pi-book', routerLink: ['/app/notes'] },
          { label: 'Org Settings', icon: 'pi pi-cog', routerLink: ['/app/admin/organization'] }, 
          { label: 'Sessions', icon: 'pi pi-clock', routerLink: ['/app/sessions'] } 
        ]
      },
      {
        label: 'Financials', icon: 'pi pi-file-excel',
        items: [
          { label: 'P&L Statement', icon: 'pi pi-chart-line', routerLink: ['/app/financials'] },
          { label: 'Sales', icon: 'pi pi-shopping-cart', routerLink: ['/app/sales'] },
        ]
      },
      {
        label: 'Admin', icon: 'pi pi-shield',
        items: [
          { label: 'Master List', icon: 'pi pi-database', routerLink: ['/app/masterList'] },
          { label: 'Roles', icon: 'pi pi-lock', routerLink: ['/app/admin/roles'] },
          { label: 'Branches', icon: 'pi pi-building', routerLink: ['/app/branches'] },
          { label: 'Add Branch', icon: 'pi pi-plus', routerLink: ['/app/branches/create'] },
          { label: 'Transactions', icon: 'pi pi-address-book', routerLink: ['/app/transactions'] },
          { label: 'Logs', icon: 'pi pi-info-circle', routerLink: ['/app/logs'] },
        ]
      },
      {
        label: 'Customers', icon: 'pi pi-users',
        items: [
          { label: 'All Customers', icon: 'pi pi-list', routerLink: ['/app/customer'] },
          { label: 'Add Customer', icon: 'pi pi-user-plus', routerLink: ['/app/customer/create'] },
        ]
      },
      {
        label: 'Suppliers', icon: 'pi pi-briefcase',
        items: [
          { label: 'All Suppliers', icon: 'pi pi-list', routerLink: ['/app/suppliers'] },
          { label: 'Add Supplier', icon: 'pi pi-plus', routerLink: ['/app/suppliers/create'] },
        ]
      },
      {
        label: 'Products', icon: 'pi pi-box',
        items: [
          { label: 'Inventory', icon: 'pi pi-list', routerLink: ['/app/product'] },
          { label: 'Add Product', icon: 'pi pi-plus', routerLink: ['/app/product/create'] },
        ]
      },
      {
        label: 'Purchase', icon: 'pi pi-shopping-bag',
        items: [
          { label: 'Inventory Buy', icon: 'pi pi-list', routerLink: ['/app/purchase'] },
          { label: 'Add Purchase', icon: 'pi pi-plus', routerLink: ['/app/purchase/create'] },
        ]
      },
      {
        label: 'Invoices', icon: 'pi pi-file',
        items: [
          { label: 'All Invoices', icon: 'pi pi-list', routerLink: ['/app/invoices'] },
          { label: 'New Invoice', icon: 'pi pi-plus-circle', routerLink: ['/app/invoices/create'] },
        ]
      },
      {
        label: 'Payments', icon: 'pi pi-wallet',
        items: [
          { label: 'Transaction History', icon: 'pi pi-history', routerLink: ['/app/payment'] },
          { label: 'Record Payment', icon: 'pi pi-plus', routerLink: ['/app/payment/create'] },
        ]
      },
      {
        label: 'EMI', icon: 'pi pi-calendar',
        items: [
          { label: 'EMI Lists', icon: 'pi pi-list', routerLink: ['/app/emis'] },
        ]
      }
    ];
  }

  // --- No changes below ---
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
