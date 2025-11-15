import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth-service';

@Component({
  selector: 'app-mainscreen-sidebar',
  standalone: true, // Mark as standalone
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
  
  expandedItems: { [key: string]: boolean } = {}; // Use object for safety
  menuItems: any[] = []; // Corrected type from MenuItem[]

  private authService = inject(AuthService);

  constructor() { }

  ngOnInit() {
    this.menuItems = this.getCorrectMenuItems();
    // Initialize expanded state
    this.menuItems.forEach(item => {
      this.expandedItems[item.label] = false; // Start all as collapsed
    });
  }

  getCorrectMenuItems(): any[] {
    return [
    {
      label: 'Customers', icon: 'pi pi-users',
      items: [
        { label: 'create', icon: 'pi pi-cog', routerLink: ['/customer/create'] },
        { label: 'CustomerList', icon: 'pi pi-list', routerLink: ['/customer'] },
        // { label: 'Details', icon: 'pi pi-info-circle', routerLink: ['/customer/'] },
        // { label: 'Segment', icon: 'pi pi-chart-pie', routerLink: ['/customers/segment'] },
      ]
    },
    {
      label: 'Products', icon: 'pi pi-shopping-bag',
      items: [
        { label: 'Product List', icon: 'pi pi-list', routerLink: ['/product'] },
        { label: 'Product Master', icon: 'pi pi-cog', routerLink: ['/product/create'] },
        { label: 'Product Details', icon: 'pi pi-info-circle', routerLink: ['/product/123/edit'] } // use dynamic ID at runtime
      ]
    },
     {
      label: 'Payments', icon: 'pi pi-wallet',
      items: [
        { label: 'Payment List', icon: 'pi pi-list', routerLink: ['/payment'] },
        { label: 'Payment', icon: 'pi pi-money-bill', routerLink: ['/payment/create'] },
        { label: 'View Payment', icon: 'pi pi-eye', routerLink: ['/payment/123/edit'] },
      ]
    },

    {
      label: 'Sellers', icon: 'pi pi-briefcase',
      items: [
        { label: 'Seller', icon: 'pi pi-id-card', routerLink: ['/sellers/Seller'] },
        { label: 'Seller Details', icon: 'pi pi-user-edit', routerLink: ['/sellers/Sellerdetails'] },
      ]
    },
    {
      label: 'Invoices', icon: 'pi pi-file',
      items: [
        { label: 'View Invoice', icon: 'pi pi-eye', routerLink: ['/invoices'] },
        { label: 'Create Invoice', icon: 'pi pi-plus-circle', routerLink: ['/invoices/create'] },
        { label: 'Invoice Details', icon: 'pi pi-file-edit', routerLink: ['/invoices/123/edit'] }
      ]
    },
    {
      label: 'Emi', icon: 'pi pi-indian-rupee',
      items: [
        { label: 'Create Emi', icon: 'pi pi-eye', routerLink: ['/Emi/create'] },
        { label: 'Emi dashboard', icon: 'pi pi-eye', routerLink: ['/Emi/emidashboard'] },
      ]
    },

  ];
    //  [
    //   {
    //     label: 'Main',
    //     items: [
    //       { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/dashboard'] },
    //     ]
    //   },
    //   {
    //     label: 'Sales',
    //     icon: 'pi pi-dollar',
    //     items: [
    //       { label: 'Customers', icon: 'pi pi-users', routerLink: ['/customer'] },
    //       { label: 'Invoices', icon: 'pi pi-receipt', routerLink: ['/invoices'] },
    //     ]
    //   },
    //   {
    //     label: 'Catalog & Purchases',
    //     icon: 'pi pi-box',
    //     items: [
    //       { label: 'Products', icon: 'pi pi-list', routerLink: ['/products'] },
    //       { label: 'Suppliers', icon: 'pi pi-truck', routerLink: ['/suppliers'] },
    //     ]
    //   },
    //   {
    //     label: 'Financials',
    //     icon: 'pi pi-wallet',
    //     items: [
    //       { label: 'Payments Ledger', icon: 'pi pi-book', routerLink: ['/payments'] },
    //     ]
    //   },
    //   {
    //     label: 'Settings',
    //     icon: 'pi pi-cog',
    //     items: [
    //       { label: 'Branches', icon: 'pi pi-building', routerLink: ['/branches'] },
    //       { label: 'Roles & Permissions', icon: 'pi pi-shield', routerLink: ['/admin/roles'] },
    //     ]
    //   },
    // ];
  }

  toggleMenuItem(label: string) {
    if (this.expandedItems.hasOwnProperty(label)) {
      this.expandedItems[label] = !this.expandedItems[label];
    }
  }

  logout() {
    this.authService.logout(); // Correctly call logout
  }
}

// import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { AvatarModule } from 'primeng/avatar';
// import { RouterModule } from '@angular/router';
// import { Observable } from 'rxjs';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { MenuItem } from 'primeng/api';

// @Component({
//   selector: 'app-mainscreen-sidebar',
//   imports: [CommonModule, ButtonModule, AvatarModule, RouterModule],
//   templateUrl: './mainscreensidebar.html',
//   styleUrl: './mainscreensidebar.scss',
// })
// export class Mainscreensidebar {
//   @Input() isPinned: boolean = false;
//   @Input() isHovered: boolean = false;
//   @Output() pinToggle = new EventEmitter<void>();
//   @Output() mouseEnter = new EventEmitter<void>();
//   @Output() mouseEnterTriggerZone = new EventEmitter<void>();
//   @Output() mouseLeave = new EventEmitter<void>();
//   expandedItems: boolean[] = [];
//   menuItems!: MenuItem[] 
//   // menuItems = [
//   //   {
//   //     label: 'Customers', icon: 'pi pi-users',
//   //     items: [
//   //       { label: 'create', icon: 'pi pi-cog', routerLink: ['/customer/create'] },
//   //       { label: 'CustomerList', icon: 'pi pi-list', routerLink: ['/customer'] },
//   //       // { label: 'Details', icon: 'pi pi-info-circle', routerLink: ['/customer/'] },
//   //       // { label: 'Segment', icon: 'pi pi-chart-pie', routerLink: ['/customers/segment'] },
//   //     ]
//   //   },
//   //   {
//   //     label: 'Products', icon: 'pi pi-shopping-bag',
//   //     items: [
//   //       { label: 'Product List', icon: 'pi pi-list', routerLink: ['/product'] },
//   //       { label: 'Product Master', icon: 'pi pi-cog', routerLink: ['/product/create'] },
//   //       { label: 'Product Details', icon: 'pi pi-info-circle', routerLink: ['/product/123/edit'] } // use dynamic ID at runtime
//   //     ]
//   //   },
//   //    {
//   //     label: 'Payments', icon: 'pi pi-wallet',
//   //     items: [
//   //       { label: 'Payment List', icon: 'pi pi-list', routerLink: ['/payment'] },
//   //       { label: 'Payment', icon: 'pi pi-money-bill', routerLink: ['/payment/create'] },
//   //       { label: 'View Payment', icon: 'pi pi-eye', routerLink: ['/payment/123/edit'] },
//   //     ]
//   //   },

//   //   {
//   //     label: 'Sellers', icon: 'pi pi-briefcase',
//   //     items: [
//   //       { label: 'Seller', icon: 'pi pi-id-card', routerLink: ['/sellers/Seller'] },
//   //       { label: 'Seller Details', icon: 'pi pi-user-edit', routerLink: ['/sellers/Sellerdetails'] },
//   //     ]
//   //   },
//   //   {
//   //     label: 'Invoices', icon: 'pi pi-file',
//   //     items: [
//   //       { label: 'View Invoice', icon: 'pi pi-eye', routerLink: ['/invoices'] },
//   //       { label: 'Create Invoice', icon: 'pi pi-plus-circle', routerLink: ['/invoices/create'] },
//   //       { label: 'Invoice Details', icon: 'pi pi-file-edit', routerLink: ['/invoices/123/edit'] }
//   //     ]
//   //   },
//   //   {
//   //     label: 'Emi', icon: 'pi pi-indian-rupee',
//   //     items: [
//   //       { label: 'Create Emi', icon: 'pi pi-eye', routerLink: ['/Emi/create'] },
//   //       { label: 'Emi dashboard', icon: 'pi pi-eye', routerLink: ['/Emi/emidashboard'] },
//   //     ]
//   //   },

//   // ];
//   // currentUser$: Observable<User | null>;

//   constructor(private authService: AuthService) {
//     // this.currentUser$ = this.authService.currentUser$;
//   }

//   ngOnInit() {
//     this.menuItems = this.getCorrectMenuItems();

//     this.expandedItems = new Array(this.menuItems.length).fill(false);
//   }

//   getCorrectMenuItems(): MenuItem[] {
//     return [
//       {
//         label: 'Main',
//         items: [
//           { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/dashboard'] },
//         ]
//       },
//       {
//         label: 'Sales',
//         icon: 'pi pi-dollar',
//         items: [
//           { label: 'Customers', icon: 'pi pi-users', routerLink: ['/customer'] },
//           { label: 'New Customer', icon: 'pi pi-user-plus', routerLink: ['/customer/create'] },
//           { label: 'Invoices', icon: 'pi pi-receipt', routerLink: ['/invoices'] },
//           { label: 'New Invoice', icon: 'pi pi-file-plus', routerLink: ['/invoices/create'] },
//         ]
//       },
//       {
//         label: 'Catalog & Purchases',
//         icon: 'pi pi-box',
//         items: [
//           { label: 'Products', icon: 'pi pi-list', routerLink: ['/product'] },
//           { label: 'New Product', icon: 'pi pi-plus', routerLink: ['/product/create'] },
//           { label: 'Suppliers', icon: 'pi pi-truck', routerLink: ['/suppliers'] },
//           { label: 'New Supplier', icon: 'pi pi-plus', routerLink: ['/suppliers/create'] },
//         ]
//       },
//       {
//         label: 'Financials',
//         icon: 'pi pi-wallet',
//         items: [
//           { label: 'Payments Ledger', icon: 'pi pi-list', routerLink: ['/payment'] },
//           { label: 'Record Payment', icon: 'pi pi-money-bill', routerLink: ['/payment/create'] },
//         ]
//       },
//       {
//         label: 'Settings',
//         icon: 'pi pi-cog',
//         items: [
//           { label: 'Branches', icon: 'pi pi-building', routerLink: ['/branches'] },
//           { label: 'Roles & Permissions', icon: 'pi pi-shield', routerLink: ['/admin/roles'] },
//         ]
//       },
//     ];
//   }

//   toggleMenuItem(index: number) {
//     // Only toggle if the item has a sub-menu
//     if (this.menuItems[index].items) {
//       this.expandedItems[index] = !this.expandedItems[index];
//     }
//   }

//   logout() {
//     // this.authService.logout();
//   }
// }
