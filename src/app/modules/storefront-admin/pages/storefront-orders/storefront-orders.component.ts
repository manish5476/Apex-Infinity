import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';
import { GridPaginationComponent } from '@shared/ui/grid/components/grid-pagination.component';
import { GridPageState } from '@shared/ui/grid/grid-types';
import { EmptyStateComponent } from '@shared/ui/feedback/empty-state/empty-state.component';

/** Real backend-supported fulfillment modes. 'public_partner' removed — was backed by fake hardcoded data only. */
type FulfillmentMode = 'internal_fleet' | 'external_carrier' | 'pickup_only';

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DrawerModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    SearchFilterComponent,
    SelectFilterComponent,
    GridPaginationComponent,
    EmptyStateComponent
  ],
  templateUrl: './storefront-orders.component.html',
  styleUrls: ['./storefront-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontOrdersComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orders = signal<any[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<string | null>(null);
  readonly paymentFilter = signal<string | null>(null);
  readonly selectedOrder = signal<any | null>(null);
  readonly sidebarVisible = signal(false);
  readonly availableAgents = signal<any[]>([]);

  readonly statusOptions: SelectFilterOption[] = [
    { label: 'All Order Statuses', value: null },
    { label: 'Placed', value: 'placed' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Closed', value: 'closed' }
  ];

  readonly paymentOptions: SelectFilterOption[] = [
    { label: 'All Payment Statuses', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Paid', value: 'paid' },
    { label: 'Failed', value: 'failed' }
  ];

  readonly hasActiveFilters = computed(() => !!this.searchTerm() || !!this.statusFilter() || !!this.paymentFilter());

  /** Default to internal_fleet — only real agents from getDeliveryAgents() API are used */
  readonly fulfillmentMode = signal<FulfillmentMode>('internal_fleet');
  readonly activeStage = signal<'intake' | 'strategy' | 'dispatch' | 'tracking'>('intake');

  deliveryAssignment = {
    deliveryAgent: null as string | null,
    carrierName: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
    deliveryNotes: '',
    dispatchPriority: 'normal',
    serviceLevel: 'standard'
  };

  readonly activeOrders = computed(() =>
    this.orders().filter(order => !['cancelled', 'closed'].includes(order.orderStatus)).length
  );

  readonly pendingAcceptance = computed(() =>
    this.orders().filter(order => ['placed', 'draft'].includes(order.orderStatus)).length
  );

  readonly pendingDispatch = computed(() =>
    this.orders().filter(order => order.orderStatus === 'confirmed' && order.fulfillmentStatus === 'unfulfilled').length
  );

  readonly exceptionOrders = computed(() =>
    this.orders().filter(order => ['cancelled', 'returned'].includes(order.orderStatus) || order.fulfillmentStatus === 'returned').length
  );

  readonly deliveryQuote = computed(() => {
    const order = this.selectedOrder();
    const mode = this.fulfillmentMode();
    const orderValue = Number(order?.totals?.grandTotal || 0);
    const shippingPaid = Number(order?.totals?.shipping || 0);
    const priorityMultiplier = this.priorityMultiplier(this.deliveryAssignment.dispatchPriority);
    const serviceMultiplier = this.serviceMultiplier(this.deliveryAssignment.serviceLevel);
    // Base rates are indicative only — not from external APIs. Shown for internal ops reference.
    const baseRate = mode === 'internal_fleet' ? 54
      : mode === 'external_carrier' ? 70
        : 0; // pickup_only has no delivery cost
    const codFee = order?.paymentMethod === 'COD' ? Math.max(12, Math.round(orderValue * 0.006)) : 0;
    const handlingFee = mode === 'pickup_only' ? 0 : 18;
    const estimatedCost = Math.round((baseRate + codFee + handlingFee) * priorityMultiplier * serviceMultiplier);

    return {
      baseRate,
      codFee,
      handlingFee,
      priorityMultiplier,
      serviceMultiplier,
      estimatedCost,
      customerShippingPaid: shippingPaid,
      margin: shippingPaid - estimatedCost,
      chargeRecommendation: Math.max(shippingPaid, estimatedCost)
    };
  });

  ngOnInit(): void {
    this.load();
    this.loadAgents();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getStorefrontOrders({
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchTerm() || undefined,
      status: this.statusFilter() || undefined,
      paymentStatus: this.paymentFilter() || undefined
    }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load orders.');
        return of({ data: [], total: 0 });
      })
    ).subscribe((res: any) => {
      const mapped = (res?.data ?? []).map((order: any) => ({
        ...order,
        customerName: order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Guest',
        logisticsMode: (() => {
          const m = order.metadata?.logistics?.fulfillmentMode;
          if (m === 'internal_fleet' || m === 'external_carrier' || m === 'pickup_only') return m;
          return 'internal_fleet';
        })()
      }));
      this.orders.set(mapped);
      this.total.set(res?.total ?? res?.results ?? mapped.length);
      this.loading.set(false);
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.load();
  }

  onStatusChange(status: any): void {
    this.statusFilter.set(status || null);
    this.currentPage.set(1);
    this.load();
  }

  onPaymentChange(payment: any): void {
    this.paymentFilter.set(payment || null);
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set(null);
    this.paymentFilter.set(null);
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(state: GridPageState): void {
    this.currentPage.set(state.page + 1);
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  loadAgents(): void {
    this.adminService.getDeliveryAgents({ limit: 100 }).subscribe({
      next: (res) => this.availableAgents.set(res.data || []),
      error: () => this.availableAgents.set([])
    });
  }

  openOrder(order: any): void {
    this.selectedOrder.set(order);
    this.sidebarVisible.set(true);
    this.activeStage.set(this.stageFor(order));
    // Only real modes: internal_fleet, external_carrier, pickup_only
    const savedMode = order.metadata?.logistics?.fulfillmentMode;
    const safeMode: FulfillmentMode = (savedMode === 'internal_fleet' || savedMode === 'external_carrier' || savedMode === 'pickup_only')
      ? savedMode
      : 'internal_fleet';
    this.fulfillmentMode.set(safeMode);
    this.deliveryAssignment = {
      deliveryAgent: typeof order.deliveryAgent === 'string' ? order.deliveryAgent : order.deliveryAgent?._id || null,
      carrierName: order.carrierName || '',
      trackingNumber: order.trackingNumber || '',
      estimatedDeliveryDate: order.estimatedDeliveryDate ? order.estimatedDeliveryDate.split('T')[0] : '',
      deliveryNotes: order.deliveryNotes || '',
      dispatchPriority: order.metadata?.logistics?.dispatchPriority || 'normal',
      serviceLevel: order.metadata?.logistics?.serviceLevel || 'standard'
    };
  }

  closePanel(): void {
    this.sidebarVisible.set(false);
  }

  setMode(mode: FulfillmentMode): void {
    this.fulfillmentMode.set(mode);
    if (mode === 'internal_fleet') {
      this.deliveryAssignment.carrierName = '';
    }
  }

  acceptOrder(order: any, event?: Event): void {
    event?.stopPropagation();
    this.loading.set(true);
    this.adminService.updateOrderStatus(order._id, { orderStatus: 'confirmed' }).subscribe({
      next: (res) => {
        this.load();
        const updated = res.data || { ...order, orderStatus: 'confirmed' };
        this.selectedOrder.set(updated);
        this.activeStage.set('strategy');
      },
      error: () => this.loading.set(false)
    });
  }

  cancelOrder(order: any, event?: Event): void {
    event?.stopPropagation();
    this.loading.set(true);
    this.adminService.updateOrderStatus(order._id, { orderStatus: 'cancelled' }).subscribe({
      next: () => this.load(),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(field: 'orderStatus' | 'fulfillmentStatus' | 'paymentStatus', value: string): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.loading.set(true);
    this.adminService.updateOrderStatus(order._id, { [field]: value }).subscribe({
      next: (res) => {
        this.load();
        this.selectedOrder.set(res.data);
        this.activeStage.set(this.stageFor(res.data));
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to update order status');
      }
    });
  }

  saveFulfillmentPlan(): void {
    const order = this.selectedOrder();
    if (!order) return;

    const mode = this.fulfillmentMode();
    const payload = {
      ...this.deliveryAssignment,
      fulfillmentMode: mode,
      carrierName: this.deliveryAssignment.carrierName,
      deliveryAgent: mode === 'internal_fleet' ? this.deliveryAssignment.deliveryAgent : null,
      deliveryQuote: this.deliveryQuote()
    };

    this.loading.set(true);
    this.adminService.assignDeliveryAgent(order._id, payload).subscribe({
      next: (res) => {
        this.load();
        this.selectedOrder.set(res.data);
        this.activeStage.set('dispatch');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save fulfillment plan');
      }
    });
  }

  markReadyForPickup(): void {
    this.updateStatus('fulfillmentStatus', 'shipped');
    this.activeStage.set('tracking');
  }

  markDelivered(): void {
    this.updateStatus('fulfillmentStatus', 'delivered');
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
      case 'closed':
      case 'confirmed': return 'success';
      case 'placed':
      case 'processing': return 'warn';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }

  getFulfillmentSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'fulfilled':
      case 'shipped':
      case 'delivered': return 'success';
      case 'partial': return 'info';
      case 'returned': return 'danger';
      default: return 'warn';
    }
  }


  priorityMultiplier(priority: string): number {
    switch (priority) {
      case 'urgent': return 1.75;
      case 'high': return 1.35;
      case 'low': return 0.9;
      default: return 1;
    }
  }

  serviceMultiplier(serviceLevel: string): number {
    switch (serviceLevel) {
      case 'same_day': return 1.45;
      case 'express': return 1.25;
      case 'scheduled': return 1.1;
      default: return 1;
    }
  }

  stageFor(order: any): 'intake' | 'strategy' | 'dispatch' | 'tracking' {
    if (['placed', 'draft'].includes(order?.orderStatus)) return 'intake';
    if (!order?.metadata?.logistics?.fulfillmentMode && !order?.deliveryAgent && !order?.carrierName) return 'strategy';
    if (['shipped', 'delivered'].includes(order?.fulfillmentStatus)) return 'tracking';
    return 'dispatch';
  }
}
