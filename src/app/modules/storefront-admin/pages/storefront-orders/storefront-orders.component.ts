import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';

type FulfillmentMode = 'internal_fleet' | 'public_partner' | 'external_carrier' | 'pickup_only';

interface PublicDeliveryPartner {
  id: string;
  name: string;
  type: string;
  eta: string;
  price: number;
  rating: number;
  sla: string;
  coverage: string;
  features: string[];
  score: number;
}

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, TooltipModule, DrawerModule, CurrencyPipe, DatePipe, FormsModule],
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

  readonly fulfillmentMode = signal<FulfillmentMode>('public_partner');
  readonly selectedPartnerId = signal('apex-express');
  readonly activeStage = signal<'intake' | 'strategy' | 'dispatch' | 'tracking'>('intake');

  readonly publicPartners: PublicDeliveryPartner[] = [
    {
      id: 'apex-express',
      name: 'Apex Express Network',
      type: 'Hyperlocal + Last mile',
      eta: '2-4 hrs',
      price: 86,
      rating: 4.8,
      sla: '96% on-time',
      coverage: 'Metro + Tier 1',
      features: ['COD', 'Live tracking', 'Returns'],
      score: 94
    },
    {
      id: 'delhivery-grid',
      name: 'Delhivery Grid',
      type: 'Regional courier',
      eta: '1-2 days',
      price: 72,
      rating: 4.6,
      sla: '93% on-time',
      coverage: 'Pan India',
      features: ['Bulk', 'RTO', 'Webhook'],
      score: 89
    },
    {
      id: 'porter-rapid',
      name: 'Porter Rapid',
      type: 'Fleet operator',
      eta: 'Same day',
      price: 118,
      rating: 4.7,
      sla: '95% on-time',
      coverage: 'City clusters',
      features: ['Van', 'Scheduled', 'Proof'],
      score: 91
    }
  ];

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

  readonly selectedPartner = computed(() =>
    this.publicPartners.find(partner => partner.id === this.selectedPartnerId()) || this.publicPartners[0]
  );

  readonly deliveryQuote = computed(() => {
    const order = this.selectedOrder();
    const mode = this.fulfillmentMode();
    const partner = this.selectedPartner();
    const orderValue = Number(order?.totals?.grandTotal || 0);
    const shippingPaid = Number(order?.totals?.shipping || 0);
    const priorityMultiplier = this.priorityMultiplier(this.deliveryAssignment.dispatchPriority);
    const serviceMultiplier = this.serviceMultiplier(this.deliveryAssignment.serviceLevel);
    const baseRate = mode === 'public_partner'
      ? partner.price
      : mode === 'internal_fleet'
        ? 54
        : mode === 'external_carrier'
          ? 70
          : 0;
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
    this.adminService.getStorefrontOrders({ limit: 50 }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load orders.');
        return of({ data: [] });
      })
    ).subscribe((res: any) => {
      const mapped = (res?.data ?? []).map((order: any) => ({
        ...order,
        customerName: order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Guest',
        logisticsMode: order.metadata?.logistics?.fulfillmentMode || (order.fulfilledBy === 'platform' ? 'public_partner' : 'internal_fleet')
      }));
      this.orders.set(mapped);
      this.loading.set(false);
    });
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
    const logisticsMode = order.metadata?.logistics?.fulfillmentMode || (order.fulfilledBy === 'platform' ? 'public_partner' : 'internal_fleet');
    this.fulfillmentMode.set(logisticsMode);
    this.selectedPartnerId.set(order.metadata?.logistics?.publicPartnerId || 'apex-express');
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
    if (mode === 'public_partner') {
      const partner = this.selectedPartner();
      this.deliveryAssignment.carrierName = partner.name;
    }
    if (mode === 'internal_fleet') {
      this.deliveryAssignment.carrierName = '';
    }
  }

  selectPartner(partner: PublicDeliveryPartner): void {
    this.selectedPartnerId.set(partner.id);
    this.deliveryAssignment.carrierName = partner.name;
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
    const partner = this.selectedPartner();
    const payload = {
      ...this.deliveryAssignment,
      fulfillmentMode: mode,
      publicPartnerId: mode === 'public_partner' ? partner.id : null,
      publicPartnerName: mode === 'public_partner' ? partner.name : '',
      carrierName: mode === 'public_partner' ? partner.name : this.deliveryAssignment.carrierName,
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

  partnerScoreFor(order: any): number {
    const city = order?.shippingAddress?.city || '';
    const base = this.selectedPartner().score;
    return city ? Math.min(base + 2, 99) : base;
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
