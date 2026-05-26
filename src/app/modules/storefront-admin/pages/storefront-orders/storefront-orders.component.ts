import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { AppSharedGrid } from '../../../shared/AgGrid/grid/app-shared-grid/app-shared-grid';
import { GridColDef } from '../../../shared/AgGrid/grid/grid.types';

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [CommonModule, AppSharedGrid, CurrencyPipe, DatePipe, FormsModule],
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
  
  readonly availableAgents = signal<any[]>([]);
  
  deliveryAssignment = {
    deliveryAgent: null as string | null,
    carrierName: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
    deliveryNotes: ''
  };

  readonly columns: GridColDef[] = [
    {
      headerName: 'Order',
      field: 'orderNumber',
      flex: 1,
      minWidth: 150,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Customer',
      field: 'customerId.firstName',
      flex: 1.5,
      minWidth: 200,
      cellConfig: { type: 'text' }
    },
    {
      headerName: 'Date',
      field: 'createdAt',
      flex: 1,
      minWidth: 150,
      cellConfig: { type: 'datetime' }
    },
    {
      headerName: 'Payment',
      field: 'paymentStatus',
      flex: 1,
      minWidth: 120,
      cellConfig: {
        type: 'badge',
        badgeMap: { paid: 'success', pending: 'warning', failed: 'danger' }
      }
    },
    {
      headerName: 'Fulfillment',
      field: 'orderStatus',
      flex: 1,
      minWidth: 140,
      cellConfig: {
        type: 'badge',
        badgeMap: { fulfilled: 'success', unfulfilled: 'warning', cancelled: 'danger' }
      }
    },
    {
      headerName: 'Total',
      field: 'totals.grandTotal',
      flex: 1,
      minWidth: 120,
      cellConfig: { type: 'currency', currencyCode: 'INR' }
    }
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
        'customerId.firstName': o.customerId ? `${o.customerId.firstName} ${o.customerId.lastName}` : 'Guest'
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

  onGridEvent(event: any): void {
    if (event.type === 'selectionChanged') {
      const selected = event.rows[0];
      if (selected) {
        this.openOrder(selected);
      } else {
        this.selectedOrder.set(null);
      }
    }
  }

  openOrder(order: any): void {
    this.selectedOrder.set(order);
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
    this.selectedOrder.set(null);
  }
}
