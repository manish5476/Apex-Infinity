import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../modules/auth/services/auth-service';

@Component({
  selector: 'app-mainscreen-sidebar',
  imports: [CommonModule, ButtonModule, AvatarModule, RouterModule],
  templateUrl: './mainscreensidebar.html',
  styleUrl: './mainscreensidebar.scss',
})
export class Mainscreensidebar {
 @Input() isPinned: boolean = false;
  @Input() isHovered: boolean = false;
  @Output() pinToggle = new EventEmitter<void>();
  @Output() mouseEnter = new EventEmitter<void>();
  @Output() mouseEnterTriggerZone = new EventEmitter<void>();
  @Output() mouseLeave = new EventEmitter<void>();

  expandedItems: boolean[] = [];

  menuItems = [
    {
      label: 'Customers', icon: 'pi pi-users',
      items: [
        { label: 'create', icon: 'pi pi-cog', routerLink: ['/customer/create'] },
        { label: 'CustomerList', icon: 'pi pi-list', routerLink: ['/customer/list'] },
        // { label: 'Details', icon: 'pi pi-info-circle', routerLink: ['/customers/detailed'] },
        // { label: 'Segment', icon: 'pi pi-chart-pie', routerLink: ['/customers/segment'] },
      ]
    },
    {
      label: 'Products', icon: 'pi pi-shopping-bag',
      items: [
        // { label: 'Product List', icon: 'pi pi-list', routerLink: ['/products/list'] },
        { label: 'Product Master', icon: 'pi pi-cog', routerLink: ['/products/master'] },
        { label: 'Product Details', icon: 'pi pi-info-circle', routerLink: ['/products/detail'] }
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
        { label: 'View Invoice', icon: 'pi pi-eye', routerLink: ['/invoices/view'] },
        { label: 'Create Invoice', icon: 'pi pi-plus-circle', routerLink: ['/invoices/create'] },
        { label: 'Invoice Details', icon: 'pi pi-file-edit', routerLink: ['/invoices/details'] }
      ]
    },
    {
      label: 'Emi', icon: 'pi pi-indian-rupee',
      items: [
        { label: 'Create Emi', icon: 'pi pi-eye', routerLink: ['/Emi/create'] },
        { label: 'Emi dashboard', icon: 'pi pi-eye', routerLink: ['/Emi/emidashboard'] },
      ]
    },
    {
      label: 'Payments', icon: 'pi pi-wallet',
      items: [
        { label: 'Payment', icon: 'pi pi-money-bill', routerLink: ['/payment/payment'] },
        { label: 'View Payment', icon: 'pi pi-eye', routerLink: ['/payment/paymentView'] },
        { label: 'Payment List', icon: 'pi pi-list', routerLink: ['/payment/paymentList'] }
      ]
    }
  ];
  // currentUser$: Observable<User | null>;

  constructor(private authService: AuthService) {
    // this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    this.expandedItems = new Array(this.menuItems.length).fill(false);
  }

  toggleMenuItem(index: number) {
    // Only toggle if the item has a sub-menu
    if (this.menuItems[index].items) {
      this.expandedItems[index] = !this.expandedItems[index];
    }
  }

  logout() {
    // this.authService.logout();
  }
}
