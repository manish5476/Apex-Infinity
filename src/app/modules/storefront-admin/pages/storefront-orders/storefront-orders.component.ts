import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { SplitterModule } from 'primeng/splitter';

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, TooltipModule, DrawerModule, SplitterModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './storefront-orders.component.html',
  styleUrls: ['./storefront-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontOrdersComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orders = signal<any[]>([]);
  readonly selectedOrder = signal<any | null>(null);
  readonly sidebarVisible = signal(false);

  readonly availableAgents = signal<any[]>([]);

  deliveryAssignment = {
    deliveryAgent: null as string | null,
    carrierName: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
    deliveryNotes: ''
  };

  // PrimeNG table columns (informational)
  readonly cols = [
    { field: 'orderNumber', header: 'Order' },
    { field: 'customer', header: 'Customer' },
    { field: 'createdAt', header: 'Date' },
    { field: 'paymentStatus', header: 'Payment' },
    { field: 'orderStatus', header: 'Status' },
    { field: 'total', header: 'Total' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadAgents();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getStorefrontOrders({ limit: 50 }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load orders.');
        return of({ data: [] });
      })
    ).subscribe((res: any) => {
      // Map nested customer data for grid display
      const mapped = (res?.data ?? []).map((o: any) => ({
        ...o,
        customerName: o.customerId ? `${o.customerId.firstName} ${o.customerId.lastName}` : 'Guest'
      }));
      this.orders.set(mapped);
      this.loading.set(false);
    });
  }

  loadAgents(): void {
    this.adminService.getDeliveryAgents({ limit: 100 }).subscribe({
      next: (res) => this.availableAgents.set(res.data || []),
      error: (err) => console.error('Failed to load agents', err)
    });
  }

  onRowSelect(event: any): void {
    this.openOrder(event.data);
  }

  onRowUnselect(): void {
    this.sidebarVisible.set(false);
  }

  getPaymentSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warn';
      case 'failed': return 'danger';
      default: return 'info';
    }
  }

  getOrderSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'closed': case 'confirmed': return 'success';
      case 'placed': case 'processing': return 'warn';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }

  getFulfillmentSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'fulfilled': case 'shipped': case 'delivered': return 'success';
      case 'partial': return 'info';
      case 'unfulfilled': return 'warn';
      default: return 'info';
    }
  }

  acceptOrder(order: any, event: Event): void {
    event.stopPropagation();
    this.loading.set(true);
    this.adminService.updateOrderStatus(order._id, { orderStatus: 'confirmed' }).subscribe({
      next: () => this.load(),
      error: () => this.loading.set(false)
    });
  }

  cancelOrder(order: any, event: Event): void {
    event.stopPropagation();
    this.loading.set(true);
    this.adminService.updateOrderStatus(order._id, { orderStatus: 'cancelled' }).subscribe({
      next: () => this.load(),
      error: () => this.loading.set(false)
    });
  }

  openOrder(order: any): void {
    this.selectedOrder.set(order);
    this.sidebarVisible.set(true);
    this.deliveryAssignment = {
      deliveryAgent: order.deliveryAgent || null,
      carrierName: order.carrierName || '',
      trackingNumber: order.trackingNumber || '',
      estimatedDeliveryDate: order.estimatedDeliveryDate ? order.estimatedDeliveryDate.split('T')[0] : '',
      deliveryNotes: order.deliveryNotes || ''
    };
  }

  updateStatus(field: 'orderStatus' | 'fulfillmentStatus' | 'paymentStatus', value: string): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.loading.set(true);
    this.adminService.updateOrderStatus(order._id, { [field]: value }).subscribe({
      next: (res) => {
        // Refresh grid
        this.load();
        // Update selected order details
        this.selectedOrder.set(res.data);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to update order status');
      }
    });
  }

  assignDelivery(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.loading.set(true);
    this.adminService.assignDeliveryAgent(order._id, this.deliveryAssignment).subscribe({
      next: (res) => {
        this.load();
        this.selectedOrder.set(res.data);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to assign delivery');
      }
    });
  }

  closePanel(): void {
    this.sidebarVisible.set(false);
  }
}
