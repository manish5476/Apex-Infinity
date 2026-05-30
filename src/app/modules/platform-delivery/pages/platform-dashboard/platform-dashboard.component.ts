import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatformDeliveryService } from '../../services/platform-delivery.service';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="premium-layout">
      <header class="premium-header">
        <div class="brand">
          <div class="brand-icon-wrapper">
            <i class="pi pi-box"></i>
          </div>
          <h1>Apex Deliveries</h1>
        </div>
        <div class="header-actions">
          <button class="glass-btn" (click)="showPasswordModal.set(true)" title="Settings">
            <i class="pi pi-cog"></i>
          </button>
          <button class="glass-btn danger-hover" (click)="logout()" title="Logout">
            <i class="pi pi-power-off"></i>
          </button>
        </div>
      </header>

      <main class="main-content">
        <div class="toolbar">
          <div class="segment-control">
            <button [class.active]="filter() === 'active'" (click)="filter.set('active')">Active Orders</button>
            <button [class.active]="filter() === 'delivered'" (click)="filter.set('delivered')">Delivered</button>
          </div>
          <button class="btn-primary" (click)="openScanner()">
            <i class="pi pi-qrcode"></i> Scan Parcel
          </button>
        </div>

        <div *ngIf="loading()" class="empty-state">
          <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2rem;"></i>
          <p>Syncing your deliveries...</p>
        </div>

        <div *ngIf="!loading() && filteredOrders().length === 0" class="empty-state">
          <div class="icon-circle"><i class="pi pi-check"></i></div>
          <h3>All Caught Up</h3>
          <p>You have no {{ filter() }} deliveries in your queue.</p>
        </div>

        <div class="card-grid" *ngIf="!loading() && filteredOrders().length > 0">
          <div class="delivery-card" *ngFor="let order of filteredOrders()" (click)="selectedOrder.set(order)">
            
            <div class="card-header">
              <div class="header-left">
                <span class="order-id">{{ order.orderNumber }}</span>
                <span class="merchant" *ngIf="order.organizationId?.name">
                  <i class="pi pi-shop"></i> {{ order.organizationId.name }}
                </span>
              </div>
              <span class="status-pill" [attr.data-status]="order.fulfillmentStatus">
                {{ order.fulfillmentStatus }}
              </span>
            </div>

            <div class="card-body">
              <div class="info-line">
                <i class="pi pi-user text-muted"></i>
                <span class="fw-500">{{ order.shippingAddress?.fullName || 'Customer' }}</span>
              </div>
              <div class="info-line">
                <i class="pi pi-map-marker text-muted"></i>
                <span class="text-truncate" [title]="order.shippingAddress?.addressLine1">
                  {{ order.shippingAddress?.addressLine1 }}, {{ order.shippingAddress?.city }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <div class="payment-tag" [class.cod]="order.paymentMethod === 'COD'">
                <i class="pi pi-money-bill" *ngIf="order.paymentMethod === 'COD'"></i>
                {{ order.paymentMethod === 'COD' ? 'Collect: ' + (order.totalAmount | currency:'INR') : 'Prepaid' }}
              </div>
              <i class="pi pi-arrow-right text-muted view-icon"></i>
            </div>
            
          </div>
        </div>
      </main>

      <div class="drawer-backdrop" *ngIf="selectedOrder()" (click)="selectedOrder.set(null)"></div>
      <div class="drawer" [class.open]="selectedOrder()">
        <ng-container *ngIf="selectedOrder() as order">
          
          <div class="drawer-header">
            <div class="drawer-title-block">
              <h2>{{ order.orderNumber }}</h2>
              <span class="merchant-badge"><i class="pi pi-shop"></i> {{ order.organizationId?.name }}</span>
            </div>
            <button class="close-btn" (click)="selectedOrder.set(null)"><i class="pi pi-times"></i></button>
          </div>

          <div class="drawer-content">
            
            <div class="action-panel" *ngIf="order.fulfillmentStatus !== 'delivered'">
              <button class="btn-secondary flex-1" 
                      *ngIf="order.fulfillmentStatus !== 'shipped'"
                      (click)="updateStatus(order._id, 'shipped')" [disabled]="updating()">
                <i class="pi pi-truck" *ngIf="!updating()"></i> Out for Delivery
              </button>
              
              <button class="btn-success flex-1" 
                      (click)="handleDeliverClick(order)" [disabled]="updating()">
                <i class="pi pi-check-circle" *ngIf="!updating()"></i> 
                {{ order.paymentMethod === 'COD' ? 'Collect & Deliver' : 'Mark Delivered' }}
              </button>
            </div>

            <div class="detail-group">
              <h3><i class="pi pi-map"></i> Delivery Details</h3>
              <div class="detail-row">
                <span class="label">Recipient</span>
                <span class="value fw-600">{{ order.shippingAddress?.fullName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Contact</span>
                <span class="value"><a [href]="'tel:' + order.shippingAddress?.phone" class="link">{{ order.shippingAddress?.phone }}</a></span>
              </div>
              <div class="detail-row">
                <span class="label">Address</span>
                <span class="value">
                  {{ order.shippingAddress?.addressLine1 }}<br>
                  <span *ngIf="order.shippingAddress?.addressLine2">{{ order.shippingAddress?.addressLine2 }}<br></span>
                  {{ order.shippingAddress?.city }}, {{ order.shippingAddress?.state }} {{ order.shippingAddress?.postalCode }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Payment</span>
                <span class="value" [class.text-success]="order.paymentMethod === 'COD'">
                  {{ order.paymentMethod === 'COD' ? 'COD (' + (order.totalAmount | currency:'INR') + ')' : 'Prepaid' }}
                </span>
              </div>
            </div>

            <div class="detail-group" *ngIf="order.items?.length">
              <h3><i class="pi pi-box"></i> Package Contents</h3>
              <div class="item-list">
                <div class="item-row" *ngFor="let item of order.items">
                  <div class="item-qty">{{ item.quantity }}x</div>
                  <div class="item-name">{{ item.snapshot?.name || item.name }}</div>
                  <div class="item-price">{{ item.unitPrice | currency:'INR' }}</div>
                </div>
              </div>
            </div>

            <div class="detail-group" *ngIf="order.timeline?.length">
              <h3><i class="pi pi-history"></i> Order Timeline</h3>
              <div class="timeline">
                <div class="tl-node" *ngFor="let event of order.timeline.slice().reverse()">
                  <div class="tl-marker"></div>
                  <div class="tl-data">
                    <span class="tl-message">{{ event.message }}</span>
                    <span class="tl-date">{{ event.at | date:'MMM dd, h:mm a' }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </ng-container>
      </div>

      <div class="modal-backdrop" *ngIf="showScanner()">
        <div class="premium-modal">
          <div class="modal-head">
            <h3>Scan Parcel</h3>
            <button class="close-btn" (click)="closeScanner()"><i class="pi pi-times"></i></button>
          </div>
          
          <div class="segment-control mb-15">
            <button [class.active]="scanMode() === 'camera'" (click)="scanMode.set('camera')">Camera</button>
            <button [class.active]="scanMode() === 'manual'" (click)="scanMode.set('manual')">Manual ID</button>
          </div>
          
          <div [hidden]="scanMode() !== 'camera'" class="scanner-wrapper">
            <div id="qr-reader"></div>
          </div>
          
          <div *ngIf="scanMode() === 'manual'" class="manual-input-box">
            <input type="text" [ngModel]="manualIdentifier()" (ngModelChange)="manualIdentifier.set($event)" class="premium-input" placeholder="Enter Tracking ID">
            <button class="btn-primary w-100 mt-10" (click)="searchManual()" [disabled]="searchingScan()">
              {{ searchingScan() ? 'Searching...' : 'Find Order' }}
            </button>
          </div>
          
          <div class="error-toast mt-10" *ngIf="scanError()">
            <i class="pi pi-exclamation-triangle"></i> {{ scanError() }}
          </div>
        </div>
      </div>

      <div class="modal-backdrop" *ngIf="showPaymentModal()" style="z-index: 1000;">
        <div class="premium-modal text-center">
          <div class="cod-icon"><i class="pi pi-wallet"></i></div>
          <h3 style="margin-top: 15px;">Collect Cash on Delivery</h3>
          <p class="text-muted" style="margin-bottom: 20px;">Please ensure you have collected the exact amount below before handing over the parcel.</p>
          
          <div class="cod-amount">
             {{ selectedOrder()?.totalAmount | currency:'INR' }}
          </div>
          
          <div class="flex-row mt-20">
             <button class="btn-secondary flex-1" (click)="showPaymentModal.set(false)">Cancel</button>
             <button class="btn-success flex-1" (click)="confirmDeliverWithPayment()">Payment Collected</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :root {
      --primary-bg: #f4f7fb;
      --card-bg: #ffffff;
      --accent: #6366f1;
      --accent-dark: #4f46e5;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border-light: #e2e8f0;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --radius-lg: 16px;
      --radius-md: 12px;
      --radius-sm: 8px;
    }

    .premium-layout {
      background-color: var(--primary-bg);
      min-height: 100vh;
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--text-main);
    }

    /* Helpers */
    .text-muted { color: var(--text-muted); }
    .text-success { color: var(--success); }
    .fw-500 { font-weight: 500; }
    .fw-600 { font-weight: 600; }
    .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%; }
    .w-100 { width: 100%; }
    .mt-10 { margin-top: 10px; }
    .mt-20 { margin-top: 20px; }
    .mb-15 { margin-bottom: 15px; }
    .flex-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }

    /* Header */
    .premium-header {
      background: linear-gradient(135deg, #4c1d95 0%, #0f172a 100%);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon-wrapper {
      background: rgba(255, 255, 255, 0.1);
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #a78bfa; font-size: 1.2rem;
    }
    .brand h1 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #ffffff; letter-spacing: 0.5px; }
    
    .header-actions { display: flex; gap: 8px; }
    .glass-btn {
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0; width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: all 0.2s ease;
    }
    .glass-btn:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-1px); }
    .glass-btn.danger-hover:hover { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.3); }

    /* Main Content */
    .main-content { max-width: 1200px; margin: 0 auto; padding: 24px; }
    
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 15px; }
    
    /* Segment Control (Modern Tabs) */
    .segment-control { display: flex; background: #e2e8f0; padding: 4px; border-radius: var(--radius-sm); }
    .segment-control button {
      border: none; background: transparent; padding: 8px 16px; font-size: 0.85rem;
      font-weight: 600; color: var(--text-muted); border-radius: 6px;
      cursor: pointer; transition: all 0.2s ease;
    }
    .segment-control button.active { background: #ffffff; color: var(--text-main); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-success {
      padding: 10px 18px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 600;
      border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-primary { background: var(--accent); color: white; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2); }
    .btn-primary:hover:not([disabled]) { background: var(--accent-dark); transform: translateY(-1px); }
    
    .btn-secondary { background: #ffffff; color: var(--text-main); border: 1px solid var(--border-light); }
    .btn-secondary:hover:not([disabled]) { background: #f8fafc; border-color: #cbd5e1; }
    
    .btn-success { background: var(--success); color: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); }
    .btn-success:hover:not([disabled]) { background: #059669; transform: translateY(-1px); }

    .btn-primary[disabled], .btn-secondary[disabled], .btn-success[disabled] { opacity: 0.6; cursor: not-allowed; }

    /* Empty State */
    .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .icon-circle { width: 64px; height: 64px; background: #e0e7ff; color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 15px; }
    .empty-state h3 { margin: 0 0 8px 0; color: var(--text-main); }

    /* Data Grid */
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    
    .delivery-card {
      background: var(--card-bg); border-radius: var(--radius-md); padding: 16px;
      border: 1px solid var(--border-light); cursor: pointer; transition: all 0.2s ease;
      display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden;
    }
    .delivery-card:hover { border-color: #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); transform: translateY(-2px); }
    
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed var(--border-light); padding-bottom: 12px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .order-id { font-weight: 700; font-size: 0.95rem; font-family: ui-monospace, monospace; color: var(--text-main); }
    .merchant { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
    
    .status-pill {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 4px 10px; border-radius: 20px;
    }
    .status-pill[data-status="unfulfilled"] { background: #fef3c7; color: #b45309; }
    .status-pill[data-status="shipped"] { background: #e0e7ff; color: #4338ca; }
    .status-pill[data-status="delivered"] { background: #d1fae5; color: #047857; }

    .card-body { display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; }
    .info-line { display: flex; align-items: center; gap: 8px; }
    .info-line i { width: 16px; text-align: center; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; }
    .payment-tag { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: #f1f5f9; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
    .payment-tag.cod { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    
    .view-icon { transition: transform 0.2s; }
    .delivery-card:hover .view-icon { transform: translateX(4px); color: var(--accent); }

    /* Premium Drawer */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(4px); z-index: 100; }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 480px;
      background: var(--primary-bg); z-index: 101; transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.1);
    }
    .drawer.open { transform: translateX(0); }
    
    .drawer-header {
      background: var(--card-bg); padding: 20px 24px; border-bottom: 1px solid var(--border-light);
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .drawer-title-block h2 { margin: 0 0 6px 0; font-size: 1.25rem; font-family: ui-monospace, monospace; }
    .merchant-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); background: var(--primary-bg); padding: 4px 10px; border-radius: 6px; }
    
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.2s; }
    .close-btn:hover { background: #e2e8f0; color: var(--text-main); }
    
    .drawer-content { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; }
    
    .action-panel { display: flex; gap: 12px; background: var(--card-bg); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    
    .detail-group { background: var(--card-bg); border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--border-light); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .detail-group h3 { margin: 0 0 16px 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px; }
    
    .detail-row { display: flex; margin-bottom: 12px; font-size: 0.9rem; }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-row .label { width: 100px; color: var(--text-muted); flex-shrink: 0; }
    .detail-row .value { flex: 1; color: var(--text-main); line-height: 1.4; }
    .link { color: var(--accent); text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    
    /* Item List */
    .item-list { display: flex; flex-direction: column; gap: 8px; }
    .item-row { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; padding: 8px 0; border-bottom: 1px dashed var(--border-light); }
    .item-row:last-child { border-bottom: none; padding-bottom: 0; }
    .item-qty { background: var(--primary-bg); color: var(--text-muted); font-size: 0.8rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .item-name { flex: 1; font-weight: 500; }
    .item-price { font-weight: 600; }

    /* Timeline */
    .timeline { margin-left: 8px; border-left: 2px solid var(--border-light); padding-left: 20px; display: flex; flex-direction: column; gap: 16px; }
    .tl-node { position: relative; }
    .tl-marker { position: absolute; left: -25px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: 2px solid var(--card-bg); box-shadow: 0 0 0 1px var(--border-light); }
    .tl-data { display: flex; flex-direction: column; }
    .tl-message { font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
    .tl-date { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

    /* Modals & Inputs */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .premium-modal { background: var(--card-bg); border-radius: var(--radius-lg); width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    
    .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-head h3 { margin: 0; font-size: 1.15rem; font-weight: 600; }
    
    .premium-input { width: 100%; padding: 12px 16px; font-size: 0.95rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm); outline: none; transition: all 0.2s; background: var(--primary-bg); color: var(--text-main); box-sizing: border-box; }
    .premium-input:focus { border-color: var(--accent); background: #ffffff; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
    
    .scanner-wrapper { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-light); }
    
    .error-toast { background: #fef2f2; color: var(--danger); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; display: flex; align-items: center; gap: 8px; border: 1px solid #fecaca; }
    
    /* COD Specifics */
    .cod-icon { width: 72px; height: 72px; border-radius: 50%; background: #ecfdf5; color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1); }
    .cod-amount { background: var(--primary-bg); border: 2px dashed #a7f3d0; border-radius: var(--radius-md); padding: 20px; font-size: 2rem; font-weight: 700; color: var(--success); }

    /* Responsive */
    @media (max-width: 768px) {
      .drawer { max-width: 100%; }
      .premium-header { padding: 12px 16px; }
      .main-content { padding: 16px; }
    }
  `]
})
export class PlatformDashboardComponent implements OnInit, OnDestroy {
  private platformService = inject(PlatformDeliveryService);
  private router = inject(Router);

  // --- Signal State Management ---
  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  updating = signal<boolean>(false);
  filter = signal<'active' | 'delivered'>('active');
  selectedOrder = signal<any | null>(null);

  // Scanner state signals
  showScanner = signal<boolean>(false);
  scanMode = signal<'camera' | 'manual'>('camera');
  manualIdentifier = signal<string>('');
  scanError = signal<string>('');
  searchingScan = signal<boolean>(false);
  private html5QrcodeScanner: Html5QrcodeScanner | null = null;

  // Modal signals
  showPaymentModal = signal<boolean>(false);
  showPasswordModal = signal<boolean>(false);

  // --- Computed Values ---
  filteredOrders = computed(() => {
    const currentFilter = this.filter();
    const allOrders = this.orders();
    if (currentFilter === 'active') {
      return allOrders.filter(o => o.fulfillmentStatus !== 'delivered');
    }
    return allOrders.filter(o => o.fulfillmentStatus === 'delivered');
  });

  ngOnInit() {
    this.loadOrders();
  }

  ngOnDestroy() {
    this.cleanupScanner();
  }

  loadOrders() {
    this.loading.set(true);
    this.platformService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
        this.loading.set(false);
      }
    });
  }

  // -------------------------------------------------------------
  // SCANNER LOGIC
  // -------------------------------------------------------------

  openScanner() {
    this.showScanner.set(true);
    this.scanMode.set('camera');
    this.scanError.set('');
    this.manualIdentifier.set('');

    setTimeout(() => {
      this.initScanner();
    }, 100);
  }

  closeScanner() {
    this.showScanner.set(false);
    this.cleanupScanner();
  }

  private initScanner() {
    if (this.html5QrcodeScanner) return;

    this.html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
      false
    );

    this.html5QrcodeScanner.render(
      (decodedText) => this.onScanSuccess(decodedText),
      (error) => { /* Ignore background errors */ }
    );
  }

  private cleanupScanner() {
    if (this.html5QrcodeScanner) {
      try {
        this.html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner", e));
      } catch (e) { }
      this.html5QrcodeScanner = null;
    }
  }

  onScanSuccess(decodedText: string) {
    this.cleanupScanner();
    this.scanMode.set('manual');
    this.manualIdentifier.set(decodedText);
    this.searchManual();
  }

  searchManual() {
    const term = this.manualIdentifier().trim();
    if (!term) return;

    this.searchingScan.set(true);
    this.scanError.set('');

    this.platformService.scanOrder(term).subscribe({
      next: (res) => {
        this.searchingScan.set(false);
        this.closeScanner();

        // Mutate the array safely using signals
        const currentOrders = this.orders();
        const exists = currentOrders.find(o => o._id === res.data._id);
        if (!exists) {
          this.orders.update(orders => [res.data, ...orders]);
        }

        // Open drawer
        this.selectedOrder.set(res.data);
      },
      error: (err) => {
        this.searchingScan.set(false);
        this.scanError.set(err?.error?.message || 'Order not found or not assigned to you');
      }
    });
  }

  // -------------------------------------------------------------
  // DELIVERY & COD LOGIC
  // -------------------------------------------------------------

  handleDeliverClick(order: any) {
    if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
      this.showPaymentModal.set(true);
    } else {
      this.updateStatus(order._id, 'delivered');
    }
  }

  confirmDeliverWithPayment() {
    const currentOrder = this.selectedOrder();
    if (!currentOrder) return;
    
    this.showPaymentModal.set(false);
    this.updateStatus(currentOrder._id, 'delivered', true);
  }

  updateStatus(orderId: string, status: string, paymentCollected = false) {
    this.updating.set(true);
    this.platformService.updateOrderStatus(orderId, status, paymentCollected).subscribe({
      next: (res) => {
        this.updating.set(false);
        
        this.orders.update(orders => 
          orders.map(o => o._id === orderId ? res.data : o)
        );
        this.selectedOrder.set(res.data);

        if (status === 'delivered') {
          setTimeout(() => this.selectedOrder.set(null), 1000);
        }
      },
      error: (err) => {
        console.error('Update failed', err);
        this.updating.set(false);
        alert(err?.error?.message || 'Failed to update status');
      }
    });
  }

  logout() {
    this.platformService.logout();
    this.router.navigate(['/apex-delivery/login']);
  }
}// import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { PlatformDeliveryService } from '../../services/platform-delivery.service';
// import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

// @Component({
//   selector: 'app-platform-dashboard',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   template: `
//     <div class="pro-layout">
//       <header class="pro-header">
//         <div class="brand">
//           <i class="pi pi-box brand-icon"></i>
//           <h1>Platform Deliveries</h1>
//         </div>
//         <div class="header-actions">
//           <button class="icon-btn" (click)="showPasswordModal.set(true)" title="Settings">
//             <i class="pi pi-cog"></i>
//           </button>
//           <button class="icon-btn text-danger" (click)="logout()" title="Logout">
//             <i class="pi pi-sign-out"></i>
//           </button>
//         </div>
//       </header>

//       <main class="pro-content">
//         <div class="toolbar">
//           <div class="tabs">
//             <button [class.active]="filter() === 'active'" (click)="filter.set('active')">Active</button>
//             <button [class.active]="filter() === 'delivered'" (click)="filter.set('delivered')">Delivered</button>
//           </div>
//           <button class="pro-btn primary-btn btn-sm" (click)="openScanner()">
//             <i class="pi pi-qrcode"></i> Scan Parcel
//           </button>
//         </div>

//         <div *ngIf="loading()" class="state-container">
//           <i class="pi pi-spin pi-spinner text-muted"></i>
//           <span class="text-sm">Fetching orders...</span>
//         </div>

//         <div *ngIf="!loading() && filteredOrders().length === 0" class="state-container">
//           <i class="pi pi-check-circle text-success" style="font-size: 1.5rem;"></i>
//           <p class="text-sm">No {{ filter() }} deliveries at the moment.</p>
//         </div>

//         <div class="data-list" *ngIf="!loading() && filteredOrders().length > 0">
//           <div class="data-row" *ngFor="let order of filteredOrders()" (click)="selectedOrder.set(order)">
            
//             <div class="col-main">
//               <div class="row-header">
//                 <span class="order-id">{{ order.orderNumber }}</span>
//                 <span class="badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus }}</span>
//               </div>
//               <div class="merchant-name" *ngIf="order.organizationId?.name">
//                 <i class="pi pi-shop text-muted"></i> {{ order.organizationId.name }}
//               </div>
//             </div>

//             <div class="col-details">
//               <div class="detail-item">
//                 <i class="pi pi-user text-muted"></i>
//                 <span>{{ order.shippingAddress?.fullName || 'Customer' }}</span>
//               </div>
//               <div class="detail-item">
//                 <i class="pi pi-map-marker text-muted"></i>
//                 <span class="truncate" style="max-width: 150px;" [title]="order.shippingAddress?.addressLine1">
//                   {{ order.shippingAddress?.addressLine1 }}
//                 </span>
//               </div>
//             </div>

//             <div class="col-payment">
//               <div class="cod-tag" *ngIf="order.paymentMethod === 'COD'">
//                 COD: {{ order.totalAmount | currency:'INR' }}
//               </div>
//               <div class="prepaid-tag" *ngIf="order.paymentMethod !== 'COD'">
//                 Prepaid
//               </div>
//             </div>

//             <div class="col-action">
//               <i class="pi pi-chevron-right text-muted"></i>
//             </div>
            
//           </div>
//         </div>
//       </main>

//       <div class="drawer-overlay" *ngIf="selectedOrder()" (click)="selectedOrder.set(null)"></div>
//       <div class="drawer-panel" [class.open]="selectedOrder()">
        
//         <ng-container *ngIf="selectedOrder() as order">
//           <div class="drawer-header">
//             <div>
//               <h2 class="drawer-title">{{ order.orderNumber }}</h2>
//               <span class="merchant-name"><i class="pi pi-shop"></i> {{ order.organizationId?.name }}</span>
//             </div>
//             <button class="icon-btn" (click)="selectedOrder.set(null)"><i class="pi pi-times"></i></button>
//           </div>

//           <div class="drawer-body">
            
//             <div class="action-bar" *ngIf="order.fulfillmentStatus !== 'delivered'">
//               <button class="pro-btn secondary-btn" 
//                       *ngIf="order.fulfillmentStatus !== 'shipped'"
//                       (click)="updateStatus(order._id, 'shipped')" [disabled]="updating()">
//                 <i class="pi pi-truck" *ngIf="!updating()"></i> Out for Delivery
//               </button>
              
//               <button class="pro-btn success-btn" 
//                       (click)="handleDeliverClick(order)" [disabled]="updating()">
//                 <i class="pi pi-check" *ngIf="!updating()"></i> 
//                 {{ order.paymentMethod === 'COD' ? 'Collect & Deliver' : 'Mark Delivered' }}
//               </button>
//             </div>

//             <div class="info-section">
//               <h3 class="section-title">Delivery Information</h3>
//               <table class="pro-table">
//                 <tbody>
//                   <tr>
//                     <td class="label">Customer</td>
//                     <td>{{ order.shippingAddress?.fullName }}</td>
//                   </tr>
//                   <tr>
//                     <td class="label">Phone</td>
//                     <td><a [href]="'tel:' + order.shippingAddress?.phone" class="link">{{ order.shippingAddress?.phone }}</a></td>
//                   </tr>
//                   <tr>
//                     <td class="label">Address</td>
//                     <td>
//                       {{ order.shippingAddress?.addressLine1 }}<br>
//                       <span *ngIf="order.shippingAddress?.addressLine2">{{ order.shippingAddress?.addressLine2 }}<br></span>
//                       {{ order.shippingAddress?.city }}, {{ order.shippingAddress?.state }} {{ order.shippingAddress?.postalCode }}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td class="label">Payment</td>
//                     <td>
//                       <span [class.text-success]="order.paymentMethod === 'COD'">
//                         {{ order.paymentMethod === 'COD' ? 'COD (' + (order.totalAmount | currency:'INR') + ')' : 'Prepaid' }}
//                       </span>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>

//             <div class="info-section" *ngIf="order.items?.length">
//               <h3 class="section-title">Package Contents ({{ order.items.length }})</h3>
//               <div class="compact-item-list">
//                 <div class="compact-item" *ngFor="let item of order.items">
//                   <span class="qty">{{ item.quantity }}x</span>
//                   <span class="name">{{ item.snapshot?.name || item.name }}</span>
//                   <span class="price">{{ item.unitPrice | currency:'INR' }}</span>
//                 </div>
//               </div>
//             </div>

//             <div class="info-section" *ngIf="order.timeline?.length">
//               <h3 class="section-title">Timeline</h3>
//               <div class="pro-timeline">
//                 <div class="tl-item" *ngFor="let event of order.timeline.slice().reverse()">
//                   <div class="tl-dot"></div>
//                   <div class="tl-content">
//                     <span class="tl-msg">{{ event.message }}</span>
//                     <span class="tl-time">{{ event.at | date:'dd MMM, HH:mm' }}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </ng-container>
//       </div>

//       <div class="pro-modal-overlay" *ngIf="showScanner()">
//         <div class="pro-modal">
//           <div class="modal-header">
//             <h3>Scan Parcel</h3>
//             <button class="icon-btn" (click)="closeScanner()"><i class="pi pi-times"></i></button>
//           </div>
          
//           <div class="tabs mb-3">
//             <button [class.active]="scanMode() === 'camera'" (click)="scanMode.set('camera')">Camera</button>
//             <button [class.active]="scanMode() === 'manual'" (click)="scanMode.set('manual')">Manual ID</button>
//           </div>
          
//           <div [hidden]="scanMode() !== 'camera'">
//             <div id="qr-reader" class="scanner-box"></div>
//           </div>
          
//           <div *ngIf="scanMode() === 'manual'" class="manual-entry">
//             <input type="text" [ngModel]="manualIdentifier()" (ngModelChange)="manualIdentifier.set($event)" class="pro-input" placeholder="Enter Tracking ID">
//             <button class="pro-btn primary-btn w-100 mt-2" (click)="searchManual()" [disabled]="searchingScan()">
//               {{ searchingScan() ? 'Searching...' : 'Search Order' }}
//             </button>
//           </div>
          
//           <div class="alert alert-error mt-2" *ngIf="scanError()">{{ scanError() }}</div>
//         </div>
//       </div>

//       <div class="pro-modal-overlay" *ngIf="showPaymentModal()" style="z-index: 1000;">
//         <div class="pro-modal">
//           <div class="modal-header border-0 pb-0">
//             <h3>Collect COD</h3>
//           </div>
//           <div class="modal-body text-center">
//             <p class="text-sm text-muted">Confirm exact cash collected from customer.</p>
//             <div class="cod-amount-display">
//                {{ selectedOrder()?.totalAmount | currency:'INR' }}
//             </div>
//           </div>
//           <div class="modal-footer flex-row mt-3">
//              <button class="pro-btn secondary-btn flex-1" (click)="showPaymentModal.set(false)">Cancel</button>
//              <button class="pro-btn success-btn flex-1" (click)="confirmDeliverWithPayment()">Confirm Payment</button>
//           </div>
//         </div>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* Professional SaaS Variables */
//     :root {
//       --bg-body: #f1f5f9;
//       --bg-surface: #ffffff;
//       --border-color: #e2e8f0;
//       --text-main: #0f172a;
//       --text-muted: #64748b;
//       --primary: #2563eb;
//       --primary-hover: #1d4ed8;
//       --success: #059669;
//       --danger: #dc2626;
//       --radius: 6px;
//       --radius-sm: 4px;
//       --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
//       --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//     }

//     .pro-layout {
//       background-color: var(--bg-body);
//       min-height: 100vh;
//       font-family: 'Inter', system-ui, -apple-system, sans-serif;
//       color: var(--text-main);
//       font-size: 14px;
//     }

//     /* Typography & Utilities */
//     .text-sm { font-size: 12px; }
//     .text-muted { color: var(--text-muted); }
//     .text-success { color: var(--success); }
//     .text-danger { color: var(--danger); }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
//     .w-100 { width: 100%; }
//     .mt-2 { margin-top: 8px; }
//     .mt-3 { margin-top: 12px; }
//     .mb-3 { margin-bottom: 12px; }
//     .flex-row { display: flex; gap: 8px; }
//     .flex-1 { flex: 1; }

//     /* Header */
//     .pro-header {
//       background: var(--bg-surface);
//       border-bottom: 1px solid var(--border-color);
//       padding: 0 16px;
//       height: 52px;
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       position: sticky;
//       top: 0;
//       z-index: 10;
//     }
//     .brand { display: flex; align-items: center; gap: 8px; }
//     .brand h1 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-main); }
    
//     .icon-btn {
//       background: transparent; border: none; color: var(--text-muted);
//       width: 32px; height: 32px; border-radius: var(--radius-sm);
//       cursor: pointer; display: flex; align-items: center; justify-content: center;
//       transition: background 0.15s;
//     }
//     .icon-btn:hover { background: var(--bg-body); color: var(--text-main); }

//     /* Content & Toolbar */
//     .pro-content { padding: 16px; max-width: 1200px; margin: 0 auto; }
    
//     .toolbar {
//       display: flex; justify-content: space-between; align-items: center;
//       margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
//     }
    
//     .tabs {
//       display: flex; background: #e2e8f0; padding: 2px; border-radius: var(--radius);
//     }
//     .tabs button {
//       border: none; background: transparent; padding: 6px 12px; font-size: 13px;
//       font-weight: 500; color: var(--text-muted); border-radius: var(--radius-sm);
//       cursor: pointer; transition: all 0.2s;
//     }
//     .tabs button.active { background: var(--bg-surface); color: var(--text-main); box-shadow: var(--shadow-sm); }

//     /* Dense Data List */
//     .data-list { display: flex; flex-direction: column; gap: 8px; }
    
//     .data-row {
//       background: var(--bg-surface);
//       border: 1px solid var(--border-color);
//       border-radius: var(--radius);
//       padding: 12px; display: flex; align-items: center; gap: 16px;
//       cursor: pointer; transition: border-color 0.15s;
//     }
//     .data-row:hover { border-color: #cbd5e1; box-shadow: var(--shadow-sm); }
    
//     .col-main { flex: 2; display: flex; flex-direction: column; gap: 4px; }
//     .row-header { display: flex; align-items: center; gap: 8px; }
//     .order-id { font-weight: 600; font-size: 13px; font-family: ui-monospace, monospace; }
//     .merchant-name { font-size: 12px; color: var(--text-muted); }
    
//     .col-details { flex: 3; display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
//     .detail-item { display: flex; align-items: center; gap: 6px; }
    
//     .col-payment { flex: 1; text-align: right; }
//     .cod-tag { background: #dcfce7; color: #166534; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-block; }
//     .prepaid-tag { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 500; padding: 2px 6px; border-radius: 4px; display: inline-block; }
    
//     .col-action { flex: 0; padding-left: 8px; }

//     .badge {
//       font-size: 10px; font-weight: 600; text-transform: uppercase;
//       padding: 2px 6px; border-radius: 4px;
//     }
//     .badge[data-status="unfulfilled"] { background: #fef3c7; color: #92400e; }
//     .badge[data-status="shipped"] { background: #dbeafe; color: #1e40af; }
//     .badge[data-status="delivered"] { background: #dcfce7; color: #166534; }

//     /* Side Panel Drawer (Desktop Pro) */
//     .drawer-overlay {
//       position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
//       z-index: 100; backdrop-filter: blur(2px);
//     }
//     .drawer-panel {
//       position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 450px;
//       background: var(--bg-surface); z-index: 101; transform: translateX(100%);
//       transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
//       box-shadow: -4px 0 15px rgba(0,0,0,0.05); display: flex; flex-direction: column;
//     }
//     .drawer-panel.open { transform: translateX(0); }
    
//     .drawer-header {
//       padding: 16px; border-bottom: 1px solid var(--border-color);
//       display: flex; justify-content: space-between; align-items: flex-start;
//       background: #f8fafc;
//     }
//     .drawer-title { margin: 0 0 4px 0; font-size: 16px; font-weight: 600; font-family: ui-monospace, monospace; }
    
//     .drawer-body { padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; }
    
//     .action-bar { display: flex; gap: 8px; }
//     .action-bar .pro-btn { flex: 1; }

//     .section-title { font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin: 0 0 8px 0; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
    
//     /* Professional Tables */
//     .pro-table { width: 100%; border-collapse: collapse; font-size: 13px; }
//     .pro-table td { padding: 6px 0; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
//     .pro-table td.label { width: 100px; color: var(--text-muted); }
//     .link { color: var(--primary); text-decoration: none; }
//     .link:hover { text-decoration: underline; }

//     /* Compact Items */
//     .compact-item-list { display: flex; flex-direction: column; gap: 4px; }
//     .compact-item { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
//     .compact-item:last-child { border-bottom: none; }
//     .compact-item .qty { color: var(--text-muted); width: 30px; }
//     .compact-item .name { flex: 1; font-weight: 500; }
//     .compact-item .price { font-weight: 600; }

//     /* Clean Timeline */
//     .pro-timeline { border-left: 2px solid #e2e8f0; margin-left: 6px; padding-left: 16px; display: flex; flex-direction: column; gap: 12px; }
//     .tl-item { position: relative; }
//     .tl-dot { position: absolute; left: -21px; top: 4px; width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; border: 2px solid var(--bg-surface); }
//     .tl-content { display: flex; flex-direction: column; }
//     .tl-msg { font-size: 13px; font-weight: 500; }
//     .tl-time { font-size: 11px; color: var(--text-muted); }

//     /* Modals & Inputs */
//     .pro-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
//     .pro-modal { background: var(--bg-surface); border-radius: var(--radius); width: 100%; max-width: 400px; padding: 20px; box-shadow: var(--shadow-md); }
//     .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
//     .modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    
//     .pro-input { width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
//     .pro-input:focus { border-color: var(--primary); }
    
//     .pro-btn { padding: 8px 16px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
//     .btn-sm { padding: 6px 12px; font-size: 12px; }
//     .primary-btn { background: var(--primary); color: white; }
//     .primary-btn:hover:not([disabled]) { background: var(--primary-hover); }
//     .secondary-btn { background: #f8fafc; border-color: var(--border-color); color: var(--text-main); }
//     .secondary-btn:hover:not([disabled]) { background: #f1f5f9; }
//     .success-btn { background: var(--success); color: white; }
//     .pro-btn[disabled] { opacity: 0.6; cursor: not-allowed; }

//     .scanner-box { border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color) !important; }
//     .alert { padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; }
//     .alert-error { background: #fef2f2; color: var(--danger); border: 1px solid #fecaca; }

//     .cod-amount-display { font-size: 24px; font-weight: 700; color: var(--success); padding: 16px; border: 1px dashed #a7f3d0; background: #ecfdf5; border-radius: var(--radius-sm); margin-top: 12px; }
    
//     /* Responsive overrides */
//     @media (max-width: 768px) {
//       .data-row { flex-direction: column; align-items: flex-start; gap: 8px; }
//       .col-main, .col-details, .col-payment { width: 100%; text-align: left; }
//       .col-action { display: none; }
//       .row-header { justify-content: space-between; }
//       .drawer-panel { max-width: 100%; }
//     }
//   `]
// })
// export class PlatformDashboardComponent implements OnInit, OnDestroy {
//   private platformService = inject(PlatformDeliveryService);
//   private router = inject(Router);

//   // --- Signal State Management ---
//   orders = signal<any[]>([]);
//   loading = signal<boolean>(true);
//   updating = signal<boolean>(false);
//   filter = signal<'active' | 'delivered'>('active');
//   selectedOrder = signal<any | null>(null);

//   // Scanner state signals
//   showScanner = signal<boolean>(false);
//   scanMode = signal<'camera' | 'manual'>('camera');
//   manualIdentifier = signal<string>('');
//   scanError = signal<string>('');
//   searchingScan = signal<boolean>(false);
//   private html5QrcodeScanner: Html5QrcodeScanner | null = null;

//   // Modal signals
//   showPaymentModal = signal<boolean>(false);
//   showPasswordModal = signal<boolean>(false);

//   // --- Computed Values ---
//   filteredOrders = computed(() => {
//     const currentFilter = this.filter();
//     const allOrders = this.orders();
//     if (currentFilter === 'active') {
//       return allOrders.filter(o => o.fulfillmentStatus !== 'delivered');
//     }
//     return allOrders.filter(o => o.fulfillmentStatus === 'delivered');
//   });

//   ngOnInit() {
//     this.loadOrders();
//   }

//   ngOnDestroy() {
//     this.cleanupScanner();
//   }

//   loadOrders() {
//     this.loading.set(true);
//     this.platformService.getOrders().subscribe({
//       next: (res) => {
//         this.orders.set(res.data || []);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to load orders', err);
//         if (err.status === 401 || err.status === 403) {
//           this.logout();
//         }
//         this.loading.set(false);
//       }
//     });
//   }

//   // -------------------------------------------------------------
//   // SCANNER LOGIC
//   // -------------------------------------------------------------

//   openScanner() {
//     this.showScanner.set(true);
//     this.scanMode.set('camera');
//     this.scanError.set('');
//     this.manualIdentifier.set('');

//     setTimeout(() => {
//       this.initScanner();
//     }, 100);
//   }

//   closeScanner() {
//     this.showScanner.set(false);
//     this.cleanupScanner();
//   }

//   private initScanner() {
//     if (this.html5QrcodeScanner) return;

//     this.html5QrcodeScanner = new Html5QrcodeScanner(
//       "qr-reader",
//       { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
//       false
//     );

//     this.html5QrcodeScanner.render(
//       (decodedText) => this.onScanSuccess(decodedText),
//       (error) => { /* Ignore background errors */ }
//     );
//   }

//   private cleanupScanner() {
//     if (this.html5QrcodeScanner) {
//       try {
//         this.html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner", e));
//       } catch (e) { }
//       this.html5QrcodeScanner = null;
//     }
//   }

//   onScanSuccess(decodedText: string) {
//     this.cleanupScanner();
//     this.scanMode.set('manual');
//     this.manualIdentifier.set(decodedText);
//     this.searchManual();
//   }

//   searchManual() {
//     const term = this.manualIdentifier().trim();
//     if (!term) return;

//     this.searchingScan.set(true);
//     this.scanError.set('');

//     this.platformService.scanOrder(term).subscribe({
//       next: (res) => {
//         this.searchingScan.set(false);
//         this.closeScanner();

//         // Mutate the array safely using signals
//         const currentOrders = this.orders();
//         const exists = currentOrders.find(o => o._id === res.data._id);
//         if (!exists) {
//           this.orders.update(orders => [res.data, ...orders]);
//         }

//         // Open drawer
//         this.selectedOrder.set(res.data);
//       },
//       error: (err) => {
//         this.searchingScan.set(false);
//         this.scanError.set(err?.error?.message || 'Order not found or not assigned to you');
//       }
//     });
//   }

//   // -------------------------------------------------------------
//   // DELIVERY & COD LOGIC
//   // -------------------------------------------------------------

//   handleDeliverClick(order: any) {
//     if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
//       this.showPaymentModal.set(true);
//     } else {
//       this.updateStatus(order._id, 'delivered');
//     }
//   }

//   confirmDeliverWithPayment() {
//     const currentOrder = this.selectedOrder();
//     if (!currentOrder) return;
    
//     this.showPaymentModal.set(false);
//     this.updateStatus(currentOrder._id, 'delivered', true);
//   }

//   updateStatus(orderId: string, status: string, paymentCollected = false) {
//     this.updating.set(true);
//     this.platformService.updateOrderStatus(orderId, status, paymentCollected).subscribe({
//       next: (res) => {
//         this.updating.set(false);
        
//         this.orders.update(orders => 
//           orders.map(o => o._id === orderId ? res.data : o)
//         );
//         this.selectedOrder.set(res.data);

//         if (status === 'delivered') {
//           setTimeout(() => this.selectedOrder.set(null), 1000);
//         }
//       },
//       error: (err) => {
//         console.error('Update failed', err);
//         this.updating.set(false);
//         alert(err?.error?.message || 'Failed to update status');
//       }
//     });
//   }

//   logout() {
//     this.platformService.logout();
//     this.router.navigate(['/apex-delivery/login']);
//   }
// }// import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router } from '@angular/router';
// // import { FormsModule } from '@angular/forms';
// // import { PlatformDeliveryService } from '../../services/platform-delivery.service';
// // import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

// // @Component({
// //   selector: 'app-platform-dashboard',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule],
// //   template: `
// //     <div class="dashboard-container">
// //       <header class="header">
// //         <div class="brand">
// //           <i class="pi pi-globe brand-icon"></i>
// //           <h1>Platform Deliveries</h1>
// //         </div>
// //         <div class="header-actions" style="display: flex; gap: 10px;">
// //           <button class="icon-btn" (click)="showPasswordModal = true" title="Change Password">
// //             <i class="pi pi-key"></i>
// //           </button>
// //           <button class="icon-btn logout-btn" (click)="logout()" title="Logout">
// //             <i class="pi pi-power-off"></i>
// //           </button>
// //         </div>
// //       </header>

// //       <main class="content">
// //         <div class="status-tabs">
// //           <button [class.active]="filter === 'active'" (click)="filter = 'active'">Active</button>
// //           <button [class.active]="filter === 'delivered'" (click)="filter = 'delivered'">Delivered</button>
// //         </div>

// //         <div *ngIf="loading" class="loading-state">
// //           <i class="pi pi-spin pi-spinner"></i>
// //           <p>Loading orders...</p>
// //         </div>

// //         <div *ngIf="!loading && filteredOrders.length === 0" class="empty-state">
// //           <div class="empty-icon"><i class="pi pi-check-circle"></i></div>
// //           <h3>All Caught Up!</h3>
// //           <p>You have no {{ filter }} deliveries at the moment.</p>
// //         </div>

// //         <div class="orders-list" *ngIf="!loading && filteredOrders.length > 0">
// //           <div class="order-card" *ngFor="let order of filteredOrders" (click)="openDetails(order)">
// //             <div class="order-header">
// //               <div class="header-left">
// //                 <span class="order-number">{{ order.orderNumber }}</span>
// //                 <span class="merchant-name" *ngIf="order.organizationId?.name">
// //                   <i class="pi pi-shop"></i> {{ order.organizationId.name }}
// //                 </span>
// //               </div>
// //               <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus | titlecase }}</span>
// //             </div>
            
// //             <div class="order-body">
// //               <div class="info-row">
// //                 <i class="pi pi-map-marker"></i>
// //                 <div class="address-details" *ngIf="order.shippingAddress">
// //                   <strong>{{ order.shippingAddress.fullName || order.customerId?.firstName || 'Customer' }}</strong>
// //                   <p>{{ order.shippingAddress.addressLine1 }}, {{ order.shippingAddress.city }}</p>
// //                 </div>
// //               </div>
              
// //               <div class="info-row">
// //                 <i class="pi pi-phone"></i>
// //                 <p>{{ order.shippingAddress?.phone || 'No phone provided' }}</p>
// //               </div>
              
// //               <div class="info-row cod-highlight" *ngIf="order.paymentMethod === 'COD'">
// //                 <i class="pi pi-money-bill"></i>
// //                 <strong>Collect: {{ order.totalAmount | currency:'INR' }}</strong>
// //               </div>
// //             </div>
            
// //             <div class="order-footer">
// //               <div class="items-count">{{ order.items?.length || 0 }} items</div>
// //               <button class="action-btn">
// //                 <span>View Details</span>
// //                 <i class="pi pi-angle-right"></i>
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </main>
      
// //       <button class="fab-scan" (click)="openScanner()">
// //         <i class="pi pi-camera"></i>
// //       </button>
      
// //       <div class="modal-overlay" *ngIf="showScanner">
// //         <div class="modal-card scanner-modal">
// //           <div class="modal-header">
// //             <h3>Scan Parcel</h3>
// //             <button class="close-btn" (click)="closeScanner()"><i class="pi pi-times"></i></button>
// //           </div>
// //           <div class="scan-tabs">
// //             <button [class.active]="scanMode === 'camera'" (click)="scanMode = 'camera'">Camera</button>
// //             <button [class.active]="scanMode === 'manual'" (click)="scanMode = 'manual'">Manual</button>
// //           </div>
          
// //           <div class="scanner-container" [hidden]="scanMode !== 'camera'">
// //             <div id="qr-reader"></div>
// //           </div>
          
// //           <div class="manual-input-container" *ngIf="scanMode === 'manual'">
// //             <input type="text" [(ngModel)]="manualIdentifier" class="premium-input" placeholder="Tracking ID or Order #">
// //             <button class="premium-btn primary-btn full-width" style="margin-top: 15px;" (click)="searchManual()" [disabled]="searchingScan">
// //               <i class="pi pi-spin pi-spinner" *ngIf="searchingScan"></i>
// //               {{ searchingScan ? 'Searching...' : 'Search' }}
// //             </button>
// //           </div>
          
// //           <div class="scan-error" *ngIf="scanError">{{ scanError }}</div>
// //         </div>
// //       </div>
      
// //       <div class="modal-overlay" *ngIf="showPaymentModal" style="z-index: 1000;">
// //         <div class="modal-card payment-modal">
// //           <div class="payment-icon"><i class="pi pi-wallet"></i></div>
// //           <h3>Collect Cash on Delivery</h3>
// //           <p>This is a COD order. Please collect the exact amount below from the customer before completing the delivery.</p>
          
// //           <div class="amount-box">
// //              {{ selectedOrder?.totalAmount | currency:'INR' }}
// //           </div>
          
// //           <div class="payment-actions">
// //              <button class="premium-btn secondary-btn" (click)="showPaymentModal = false">Cancel</button>
// //              <button class="premium-btn success-btn" (click)="confirmDeliverWithPayment()">
// //                <i class="pi pi-check"></i> Cash Collected
// //              </button>
// //           </div>
// //         </div>
// //       </div>

// //       <div class="detail-overlay" *ngIf="selectedOrder && !showScanner && !showPaymentModal && !showPasswordModal" (click)="closeDetails()"></div>
// //       <div class="detail-sheet" [class.open]="selectedOrder && !showScanner && !showPaymentModal && !showPasswordModal">
// //         <div class="drag-handle" (click)="closeDetails()"></div>
// //         <div class="sheet-content" *ngIf="selectedOrder as order">
          
// //           <div class="sheet-header">
// //             <div class="sheet-header-left">
// //               <h2>{{ order.orderNumber }}</h2>
// //               <span class="merchant-tag" *ngIf="order.organizationId?.name">
// //                 <i class="pi pi-shop"></i> {{ order.organizationId.name }}
// //               </span>
// //             </div>
// //             <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus | titlecase }}</span>
// //           </div>
          
// //           <div class="customer-info">
// //             <h3>Delivery Details</h3>
// //             <div class="info-group">
// //               <i class="pi pi-user"></i>
// //               <span>{{ order.shippingAddress?.fullName || 'Customer' }}</span>
// //             </div>
// //             <div class="info-group">
// //               <i class="pi pi-phone"></i>
// //               <a [href]="'tel:' + order.shippingAddress?.phone">{{ order.shippingAddress?.phone || 'No phone' }}</a>
// //             </div>
// //             <div class="info-group address">
// //               <i class="pi pi-map-marker"></i>
// //               <div>
// //                 <p>{{ order.shippingAddress?.addressLine1 }}</p>
// //                 <p *ngIf="order.shippingAddress?.addressLine2">{{ order.shippingAddress?.addressLine2 }}</p>
// //                 <p>{{ order.shippingAddress?.city }}, {{ order.shippingAddress?.state }} {{ order.shippingAddress?.postalCode || order.shippingAddress?.pincode }}</p>
// //               </div>
// //             </div>
            
// //             <div class="info-group">
// //                <i class="pi pi-credit-card"></i>
// //                <span>
// //                   {{ order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid' }}
// //                   <strong *ngIf="order.paymentMethod === 'COD'" style="color: #16a34a; margin-left: 5px;">
// //                     ({{ order.totalAmount | currency:'INR' }})
// //                   </strong>
// //                </span>
// //             </div>
// //           </div>
          
// //           <div class="items-summary" *ngIf="order.items?.length">
// //             <h3>Items ({{ order.items.length }})</h3>
// //             <ul class="item-list">
// //               <li *ngFor="let item of order.items" class="item-row">
// //                 <img [src]="item.snapshot?.image" alt="Product Image" class="item-img" *ngIf="item.snapshot?.image">
// //                 <div class="item-info">
// //                   <span class="item-name">{{ item.snapshot?.name || item.name || 'Product' }}</span>
// //                   <div class="item-meta">
// //                     <span class="item-qty">Qty: {{ item.quantity }}</span>
// //                     <span class="item-price">{{ item.unitPrice | currency:'INR' }}</span>
// //                   </div>
// //                 </div>
// //               </li>
// //             </ul>
// //           </div>

// //           <div class="timeline-section" *ngIf="order.timeline?.length">
// //             <h3>Order Timeline</h3>
// //             <div class="timeline-container">
// //               <div class="timeline-item" *ngFor="let event of order.timeline.slice().reverse()">
// //                 <div class="timeline-dot"></div>
// //                 <div class="timeline-content">
// //                   <p>{{ event.message }}</p>
// //                   <span>{{ event.at | date:'medium' }}</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
          
// //           <div class="notes" *ngIf="order.deliveryNotes">
// //             <h3>Delivery Notes</h3>
// //             <p>{{ order.deliveryNotes }}</p>
// //           </div>
          
// //           <div class="action-buttons">
// //             <button class="action-btn out-for-delivery" 
// //                     *ngIf="order.fulfillmentStatus !== 'shipped' && order.fulfillmentStatus !== 'delivered'"
// //                     (click)="updateStatus(order._id, 'shipped')" [disabled]="updating">
// //               <i class="pi pi-truck" *ngIf="!updating"></i>
// //               <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
// //               Mark Out for Delivery
// //             </button>
            
// //             <button class="action-btn delivered" 
// //                     *ngIf="order.fulfillmentStatus !== 'delivered'"
// //                     (click)="handleDeliverClick(order)" [disabled]="updating">
// //               <i class="pi pi-check-circle" *ngIf="!updating"></i>
// //               <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
// //               {{ order.paymentMethod === 'COD' ? 'Collect & Deliver' : 'Mark Delivered' }}
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     .dashboard-container {
// //       background: #f8fafc;
// //       min-height: 100vh;
// //       font-family: 'Inter', sans-serif;
// //       position: relative;
// //       overflow-x: hidden;
// //     }
    
// //     .header {
// //       padding: 20px; background: linear-gradient(135deg, #4c1d95 0%, #0f172a 100%); color: white;
// //       display: flex; justify-content: space-between; align-items: center;
// //       border-radius: 0 0 20px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
// //     }
    
// //     .brand { display: flex; align-items: center; gap: 10px; }
// //     .brand-icon { color: #a78bfa; font-size: 1.5rem; }
// //     h1 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    
// //     .icon-btn {
// //       background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 40px; height: 40px;
// //       border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
// //     }
// //     .icon-btn:hover { background: rgba(255, 255, 255, 0.2); }
    
// //     .content { padding: 15px; padding-bottom: 90px; }
    
// //     .status-tabs {
// //       display: flex; background: white; border-radius: 12px; padding: 4px;
// //       box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;
// //     }
// //     .status-tabs button {
// //       flex: 1; padding: 10px; border: none; background: transparent; border-radius: 8px;
// //       font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
// //     }
// //     .status-tabs button.active { background: #eff6ff; color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    
// //     .loading-state, .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
// //     .loading-state i { font-size: 2rem; color: #38bdf8; margin-bottom: 10px; }
    
// //     .empty-icon {
// //       width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex;
// //       align-items: center; justify-content: center; margin: 0 auto 15px; color: #94a3b8; font-size: 2.5rem;
// //     }
    
// //     .orders-list { display: flex; flex-direction: column; gap: 15px; }
    
// //     .order-card {
// //       background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px;
// //       box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s ease;
// //       border-left: 4px solid #a78bfa;
// //     }
// //     .order-card:active { transform: scale(0.98); }
    
// //     .order-header {
// //       display: flex; justify-content: space-between; align-items: flex-start;
// //       margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0;
// //     }
// //     .header-left { display: flex; flex-direction: column; gap: 4px; }
// //     .order-number { font-weight: 700; color: #0f172a; font-size: 1.1rem; }
// //     .merchant-name { font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
    
// //     .status-badge {
// //       padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
// //       text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
// //     }
// //     .status-badge[data-status="unfulfilled"], .status-badge[data-status="processing"] { background: #fffbeb; color: #d97706; }
// //     .status-badge[data-status="shipped"] { background: #eff6ff; color: #2563eb; }
// //     .status-badge[data-status="delivered"] { background: #f0fdf4; color: #16a34a; }
    
// //     .order-body { display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px; }
// //     .info-row { display: flex; align-items: flex-start; gap: 12px; color: #475569; font-size: 0.9rem; }
// //     .info-row i { color: #94a3b8; margin-top: 3px; }
// //     .address-details p, .info-row p { margin: 0; color: #64748b; line-height: 1.4; }
// //     .address-details strong { color: #1e293b; display: block; margin-bottom: 2px; }
    
// //     .cod-highlight {
// //       background: #f0fdf4; padding: 8px 12px; border-radius: 8px; align-items: center;
// //       border: 1px solid #bbf7d0; color: #16a34a;
// //     }
// //     .cod-highlight i { color: #16a34a; margin-top: 0; }
// //     .cod-highlight strong { color: #16a34a; }
    
// //     .order-footer {
// //       display: flex; justify-content: space-between; align-items: center;
// //       padding-top: 15px; border-top: 1px solid #f1f5f9;
// //     }
// //     .items-count { color: #64748b; font-size: 0.9rem; font-weight: 500; background: #f8fafc; padding: 4px 10px; border-radius: 6px; }
    
// //     .action-btn { background: transparent; border: none; color: #2563eb; font-weight: 600; display: flex; align-items: center; gap: 5px; cursor: pointer;}
// //     .action-btn:disabled { opacity: 0.7; }
    
// //     /* Bottom Sheet */
// //     .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; backdrop-filter: blur(2px); }
    
// //     .detail-sheet {
// //       position: fixed; bottom: 0; left: 0; right: 0; background: white;
// //       border-radius: 24px 24px 0 0; z-index: 101; transform: translateY(100%);
// //       transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-height: 90vh;
// //       overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
// //     }
// //     .detail-sheet.open { transform: translateY(0); }
    
// //     .drag-handle { width: 40px; height: 5px; background: #cbd5e1; border-radius: 3px; margin: 15px auto; cursor: pointer; }
// //     .sheet-content { padding: 0 20px 30px; }
    
// //     .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
// //     .sheet-header-left h2 { margin: 0 0 4px 0; color: #0f172a; font-size: 1.4rem; }
// //     .merchant-tag { font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 6px; }
    
// //     .customer-info, .notes, .items-summary, .timeline-section {
// //       background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #f1f5f9;
// //     }
// //     h3 { font-size: 0.85rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 0 0 15px 0; font-weight: 700; }
    
// //     .info-group { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #334155; font-size: 0.95rem; }
// //     .info-group.address { align-items: flex-start; }
// //     .info-group i { color: #94a3b8; }
// //     .info-group a { color: #2563eb; text-decoration: none; font-weight: 500; }
// //     .info-group p { margin: 0 0 4px 0; line-height: 1.4; }
    
// //     .notes p { margin: 0; color: #475569; line-height: 1.5; }
    
// //     /* Enhanced Items List */
// //     .item-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
// //     .item-row { display: flex; gap: 15px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
// //     .item-row:last-child { border-bottom: none; padding-bottom: 0; }
// //     .item-img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; background: white; }
// //     .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
// //     .item-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
// //     .item-meta { display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; }
// //     .item-price { font-weight: 600; color: #0f172a; }
    
// //     /* Vertical Timeline */
// //     .timeline-container { margin-left: 8px; border-left: 2px solid #e2e8f0; padding-left: 20px; margin-top: 10px; }
// //     .timeline-item { position: relative; margin-bottom: 16px; }
// //     .timeline-item:last-child { margin-bottom: 0; }
// //     .timeline-dot { position: absolute; left: -27px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #a78bfa; border: 2px solid white; box-shadow: 0 0 0 1px #e2e8f0; }
// //     .timeline-content p { margin: 0 0 4px 0; color: #334155; font-size: 0.9rem; font-weight: 500; }
// //     .timeline-content span { font-size: 0.75rem; color: #94a3b8; }
    
// //     .action-buttons { display: flex; flex-direction: column; gap: 12px; margin-top: 25px; }
// //     .action-btn { width: 100%; padding: 15px; border-radius: 12px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; border: none; transition: transform 0.1s; }
// //     .action-btn:active { transform: scale(0.98); }
    
// //     .out-for-delivery { background: #eff6ff; color: #2563eb; }
// //     .delivered { background: #16a34a; color: white; box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3); }

// //     /* Floating Action Button & Modals... (Kept the same as original) */
// //     .fab-scan {
// //       position: fixed; bottom: 30px; right: 20px; width: 60px; height: 60px;
// //       border-radius: 50%; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
// //       color: white; border: none; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
// //       display: flex; align-items: center; justify-content: center; cursor: pointer;
// //       z-index: 50; transition: transform 0.2s;
// //     }
// //     .fab-scan:active { transform: scale(0.9); }
// //     .fab-scan i { font-size: 1.5rem; }

// //     .modal-overlay {
// //       position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
// //       z-index: 200; display: flex; align-items: center; justify-content: center;
// //       padding: 20px; backdrop-filter: blur(4px);
// //     }
// //     .modal-card {
// //       background: white; border-radius: 20px; width: 100%; max-width: 400px;
// //       padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
// //     }
    
// //     .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
// //     .modal-header h3 { margin: 0; color: #0f172a; font-size: 1.25rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
// //     .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
    
// //     .scan-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
// //     .scan-tabs button { flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600; color: #64748b; cursor: pointer; }
// //     .scan-tabs button.active { background: #eff6ff; border-color: #3b82f6; color: #2563eb; }

// //     .premium-input {
// //       width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc;
// //       border: 1px solid #cbd5e1; color: #0f172a; font-size: 1rem; transition: all 0.3s ease; box-sizing: border-box;
// //     }
// //     .premium-input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2); }
    
// //     .premium-btn { padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; }
// //     .primary-btn { background: #2563eb; color: white; }
// //     .secondary-btn { background: #f1f5f9; color: #475569; }
// //     .success-btn { background: #16a34a; color: white; }
// //     .full-width { width: 100%; }
    
// //     .scan-error { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 10px; margin-top: 15px; font-size: 0.9rem; text-align: center; }

// //     #qr-reader { border-radius: 16px; overflow: hidden; border: none !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
// //     #qr-reader__scan_region { background: #000; }
    
// //     .payment-modal { text-align: center; }
// //     .payment-icon { width: 64px; height: 64px; border-radius: 50%; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px; }
// //     .payment-modal h3 { margin: 0 0 10px 0; color: #0f172a; font-size: 1.25rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
// //     .payment-modal p { color: #64748b; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; }
// //     .amount-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; font-size: 2.5rem; font-weight: 700; color: #16a34a; margin-bottom: 25px; }
// //     .payment-actions { display: flex; gap: 15px; }
// //     .payment-actions .premium-btn { flex: 1; }
// //   `]
// // })
// // export class PlatformDashboardComponent implements OnInit, OnDestroy {
// //   private platformService = inject(PlatformDeliveryService);
// //   private router = inject(Router);
// //   private route = inject(ActivatedRoute);

// //   orders: any[] = [];
// //   loading = true;
// //   updating = false;
// //   filter: 'active' | 'delivered' = 'active';
// //   selectedOrder: any | null = null;
// //   orgSlug = '';

// //   // Scanner state
// //   showScanner = false;
// //   scanMode: 'camera' | 'manual' = 'camera';
// //   manualIdentifier = '';
// //   scanError = '';
// //   searchingScan = false;
// //   private html5QrcodeScanner: Html5QrcodeScanner | null = null;

// //   // Payment Collection state
// //   showPaymentModal = false;

// //   // Password Update State
// //   showPasswordModal = false;
// //   passwordForm = { oldPassword: '', newPassword: '' };
// //   updatingPassword = false;
// //   passwordError = '';
// //   passwordSuccess = '';

// //   ngOnInit() {
// //     this.loadOrders();
// //   }

// //   ngOnDestroy() {
// //     this.cleanupScanner();
// //   }

// //   loadOrders() {
// //     this.loading = true;
// //     this.platformService.getOrders().subscribe({
// //       next: (res) => {
// //         this.orders = res.data || [];
// //         this.loading = false;
// //       },
// //       error: (err) => {
// //         console.error('Failed to load orders', err);
// //         if (err.status === 401 || err.status === 403) {
// //           this.logout();
// //         }
// //         this.loading = false;
// //       }
// //     });
// //   }

// //   get filteredOrders() {
// //     if (this.filter === 'active') {
// //       return this.orders.filter(o => o.fulfillmentStatus !== 'delivered');
// //     }
// //     return this.orders.filter(o => o.fulfillmentStatus === 'delivered');
// //   }

// //   openDetails(order: any) {
// //     this.selectedOrder = order;
// //   }

// //   closeDetails() {
// //     this.selectedOrder = null;
// //   }

// //   // -------------------------------------------------------------
// //   // SCANNER LOGIC
// //   // -------------------------------------------------------------

// //   openScanner() {
// //     this.showScanner = true;
// //     this.scanMode = 'camera';
// //     this.scanError = '';
// //     this.manualIdentifier = '';

// //     setTimeout(() => {
// //       this.initScanner();
// //     }, 100);
// //   }

// //   closeScanner() {
// //     this.showScanner = false;
// //     this.cleanupScanner();
// //   }

// //   private initScanner() {
// //     if (this.html5QrcodeScanner) return;

// //     this.html5QrcodeScanner = new Html5QrcodeScanner(
// //       "qr-reader",
// //       { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
// //       false
// //     );

// //     this.html5QrcodeScanner.render(
// //       (decodedText) => this.onScanSuccess(decodedText),
// //       (error) => { /* Ignore background scan errors */ }
// //     );
// //   }

// //   private cleanupScanner() {
// //     if (this.html5QrcodeScanner) {
// //       try {
// //         this.html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner", e));
// //       } catch (e) { }
// //       this.html5QrcodeScanner = null;
// //     }
// //   }

// //   onScanSuccess(decodedText: string) {
// //     this.cleanupScanner();
// //     this.scanMode = 'manual';
// //     this.manualIdentifier = decodedText;
// //     this.searchManual();
// //   }

// //   searchManual() {
// //     if (!this.manualIdentifier.trim()) return;

// //     this.searchingScan = true;
// //     this.scanError = '';

// //     this.platformService.scanOrder(this.manualIdentifier.trim()).subscribe({
// //       next: (res) => {
// //         this.searchingScan = false;
// //         this.closeScanner();

// //         // Add to local array if not already present
// //         const exists = this.orders.find(o => o._id === res.data._id);
// //         if (!exists) {
// //           this.orders.unshift(res.data);
// //         }

// //         // Open the details sheet
// //         this.openDetails(res.data);
// //       },
// //       error: (err) => {
// //         this.searchingScan = false;
// //         this.scanError = err?.error?.message || 'Order not found or not assigned to you';
// //       }
// //     });
// //   }

// //   // -------------------------------------------------------------
// //   // DELIVERY & COD LOGIC
// //   // -------------------------------------------------------------

// //   handleDeliverClick(order: any) {
// //     if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
// //       this.showPaymentModal = true;
// //     } else {
// //       this.updateStatus(order._id, 'delivered');
// //     }
// //   }

// //   confirmDeliverWithPayment() {
// //     if (!this.selectedOrder) return;
// //     this.showPaymentModal = false;
// //     this.updateStatus(this.selectedOrder._id, 'delivered', true);
// //   }

// //   updateStatus(orderId: string, status: string, paymentCollected = false) {
// //     this.updating = true;
// //     this.platformService.updateOrderStatus(orderId, status, paymentCollected).subscribe({
// //       next: (res) => {
// //         this.updating = false;
// //         const idx = this.orders.findIndex(o => o._id === orderId);
// //         if (idx !== -1) {
// //           this.orders[idx] = res.data;
// //           this.selectedOrder = res.data;

// //           if (status === 'delivered') {
// //             setTimeout(() => this.closeDetails(), 1500);
// //           }
// //         }
// //       },
// //       error: (err) => {
// //         console.error('Update failed', err);
// //         this.updating = false;
// //         alert(err?.error?.message || 'Failed to update status');
// //       }
// //     });
// //   }

// //   updatePassword() {
// //     this.passwordError = '';
// //     this.passwordSuccess = '';
// //     this.updatingPassword = true;

// //     this.platformService.updatePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword).subscribe({
// //       next: (res) => {
// //         this.updatingPassword = false;
// //         this.passwordSuccess = 'Password updated successfully!';
// //         setTimeout(() => {
// //           this.showPasswordModal = false;
// //           this.passwordForm = { oldPassword: '', newPassword: '' };
// //           this.passwordSuccess = '';
// //         }, 1500);
// //       },
// //       error: (err) => {
// //         this.updatingPassword = false;
// //         this.passwordError = err?.error?.message || 'Failed to update password';
// //       }
// //     });
// //   }

// //   logout() {
// //     this.platformService.logout();
// //     this.router.navigate(['/apex-delivery/login']);
// //   }
// // }// import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute, Router } from '@angular/router';
// // // import { FormsModule } from '@angular/forms';
// // // import { PlatformDeliveryService } from '../../services/platform-delivery.service';
// // // import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

// // // @Component({
// // //   selector: 'app-platform-dashboard',
// // //   standalone: true,
// // //   imports: [CommonModule, FormsModule],
// // //   template: `
// // //     <div class="dashboard-container">
// // //       <header class="header">
// // //         <div class="brand">
// // //           <i class="pi pi-globe brand-icon"></i>
// // //           <h1>Platform Deliveries</h1>
// // //         </div>
// // //         <div class="header-actions" style="display: flex; gap: 10px;">
// // //           <button class="icon-btn" (click)="showPasswordModal = true" title="Change Password">
// // //             <i class="pi pi-key"></i>
// // //           </button>
// // //           <button class="icon-btn logout-btn" (click)="logout()" title="Logout">
// // //             <i class="pi pi-power-off"></i>
// // //           </button>
// // //         </div>
// // //       </header>

// // //       <main class="content">
// // //         <div class="status-tabs">
// // //           <button [class.active]="filter === 'active'" (click)="filter = 'active'">Active</button>
// // //           <button [class.active]="filter === 'delivered'" (click)="filter = 'delivered'">Delivered</button>
// // //         </div>

// // //         <div *ngIf="loading" class="loading-state">
// // //           <i class="pi pi-spin pi-spinner"></i>
// // //           <p>Loading orders...</p>
// // //         </div>

// // //         <div *ngIf="!loading && filteredOrders.length === 0" class="empty-state">
// // //           <div class="empty-icon"><i class="pi pi-check-circle"></i></div>
// // //           <h3>All Caught Up!</h3>
// // //           <p>You have no {{ filter }} deliveries at the moment.</p>
// // //         </div>

// // //         <div class="orders-list" *ngIf="!loading && filteredOrders.length > 0">
// // //           <div class="order-card" *ngFor="let order of filteredOrders" (click)="openDetails(order)">
// // //             <div class="order-header">
// // //               <span class="order-number">{{ order.orderNumber }}</span>
// // //               <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus | titlecase }}</span>
// // //             </div>
            
// // //             <div class="order-body">
// // //               <div class="info-row">
// // //                 <i class="pi pi-map-marker"></i>
// // //                 <div class="address-details" *ngIf="order.shippingAddress">
// // //                   <strong>{{ order.shippingAddress.fullName || order.customerId?.firstName || 'Customer' }}</strong>
// // //                   <p>{{ order.shippingAddress.addressLine1 }}, {{ order.shippingAddress.city }}</p>
// // //                 </div>
// // //               </div>
              
// // //               <div class="info-row">
// // //                 <i class="pi pi-phone"></i>
// // //                 <p>{{ order.shippingAddress?.phone || 'No phone provided' }}</p>
// // //               </div>
              
// // //               <!-- Payment Info on Card -->
// // //               <div class="info-row" *ngIf="order.paymentMethod === 'COD'">
// // //                 <i class="pi pi-money-bill" style="color: #16a34a;"></i>
// // //                 <strong style="color: #16a34a;">Collect: {{ order.totalAmount | currency:'INR' }}</strong>
// // //               </div>
// // //             </div>
            
// // //             <div class="order-footer">
// // //               <div class="items-count">{{ order.items?.length || 0 }} items</div>
// // //               <button class="action-btn">
// // //                 <span>View Details</span>
// // //                 <i class="pi pi-angle-right"></i>
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>
      
// // //       <!-- Floating Action Button for Scanner -->
// // //       <button class="fab-scan" (click)="openScanner()">
// // //         <i class="pi pi-camera"></i>
// // //       </button>
      
// // //       <!-- Scanner Modal -->
// // //       <div class="modal-overlay" *ngIf="showScanner">
// // //         <div class="modal-card scanner-modal">
// // //           <div class="modal-header">
// // //             <h3>Scan Parcel</h3>
// // //             <button class="close-btn" (click)="closeScanner()"><i class="pi pi-times"></i></button>
// // //           </div>
// // //           <div class="scan-tabs">
// // //             <button [class.active]="scanMode === 'camera'" (click)="scanMode = 'camera'">Camera</button>
// // //             <button [class.active]="scanMode === 'manual'" (click)="scanMode = 'manual'">Manual</button>
// // //           </div>
          
// // //           <div class="scanner-container" [hidden]="scanMode !== 'camera'">
// // //             <div id="qr-reader"></div>
// // //           </div>
          
// // //           <div class="manual-input-container" *ngIf="scanMode === 'manual'">
// // //             <input type="text" [(ngModel)]="manualIdentifier" class="premium-input" placeholder="Tracking ID or Order #">
// // //             <button class="premium-btn primary-btn full-width" style="margin-top: 15px;" (click)="searchManual()" [disabled]="searchingScan">
// // //               <i class="pi pi-spin pi-spinner" *ngIf="searchingScan"></i>
// // //               {{ searchingScan ? 'Searching...' : 'Search' }}
// // //             </button>
// // //           </div>
          
// // //           <div class="scan-error" *ngIf="scanError">{{ scanError }}</div>
// // //         </div>
// // //       </div>
      
// // //       <!-- COD Payment Collection Modal -->
// // //       <div class="modal-overlay" *ngIf="showPaymentModal" style="z-index: 1000;">
// // //         <div class="modal-card payment-modal">
// // //           <div class="payment-icon"><i class="pi pi-wallet"></i></div>
// // //           <h3>Collect Cash on Delivery</h3>
// // //           <p>This is a COD order. Please collect the exact amount below from the customer before completing the delivery.</p>
          
// // //           <div class="amount-box">
// // //              {{ selectedOrder?.totalAmount | currency:'INR' }}
// // //           </div>
          
// // //           <div class="payment-actions">
// // //              <button class="premium-btn secondary-btn" (click)="showPaymentModal = false">Cancel</button>
// // //              <button class="premium-btn success-btn" (click)="confirmDeliverWithPayment()">
// // //                <i class="pi pi-check"></i> Cash Collected
// // //              </button>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <!-- Change Password Modal -->
// // //       <div class="modal-overlay" *ngIf="showPasswordModal" style="z-index: 1000;">
// // //         <div class="modal-card">
// // //           <div class="modal-header">
// // //             <h3>Change Password</h3>
// // //             <button class="close-btn" (click)="showPasswordModal = false"><i class="pi pi-times"></i></button>
// // //           </div>
          
// // //           <div class="form-group" style="margin-bottom: 15px;">
// // //             <label style="display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Current Password</label>
// // //             <input type="password" [(ngModel)]="passwordForm.oldPassword" class="premium-input" placeholder="Enter current password">
// // //           </div>
          
// // //           <div class="form-group" style="margin-bottom: 15px;">
// // //             <label style="display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">New Password</label>
// // //             <input type="password" [(ngModel)]="passwordForm.newPassword" class="premium-input" placeholder="Enter new password">
// // //           </div>
          
// // //           <div class="error-message" *ngIf="passwordError" style="color: #ef4444; margin-bottom: 15px; font-size: 0.9rem;">{{ passwordError }}</div>
// // //           <div class="success-message" *ngIf="passwordSuccess" style="color: #16a34a; margin-bottom: 15px; font-size: 0.9rem;">{{ passwordSuccess }}</div>
          
// // //           <button class="premium-btn primary-btn full-width" (click)="updatePassword()" [disabled]="updatingPassword || !passwordForm.oldPassword || !passwordForm.newPassword">
// // //             <i class="pi pi-spin pi-spinner" *ngIf="updatingPassword"></i>
// // //             {{ updatingPassword ? 'Updating...' : 'Update Password' }}
// // //           </button>
// // //         </div>
// // //       </div>

// // //       <!-- Slide Up Detail View -->
// // //       <div class="detail-overlay" *ngIf="selectedOrder && !showScanner && !showPaymentModal && !showPasswordModal" (click)="closeDetails()"></div>
// // //       <div class="detail-sheet" [class.open]="selectedOrder && !showScanner && !showPaymentModal && !showPasswordModal">
// // //         <div class="drag-handle" (click)="closeDetails()"></div>
// // //         <div class="sheet-content" *ngIf="selectedOrder as order">
// // //           <div class="sheet-header">
// // //             <h2>{{ order.orderNumber }}</h2>
// // //             <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus | titlecase }}</span>
// // //           </div>
          
// // //           <div class="customer-info">
// // //             <h3>Delivery Details</h3>
// // //             <div class="info-group">
// // //               <i class="pi pi-user"></i>
// // //               <span>{{ order.shippingAddress?.fullName || 'Customer' }}</span>
// // //             </div>
// // //             <div class="info-group">
// // //               <i class="pi pi-phone"></i>
// // //               <a [href]="'tel:' + order.shippingAddress?.phone">{{ order.shippingAddress?.phone || 'No phone' }}</a>
// // //             </div>
// // //             <div class="info-group address">
// // //               <i class="pi pi-map-marker"></i>
// // //               <div>
// // //                 <p>{{ order.shippingAddress?.addressLine1 }}</p>
// // //                 <p *ngIf="order.shippingAddress?.addressLine2">{{ order.shippingAddress?.addressLine2 }}</p>
// // //                 <p>{{ order.shippingAddress?.city }}, {{ order.shippingAddress?.state }} {{ order.shippingAddress?.pincode }}</p>
// // //               </div>
// // //             </div>
            
// // //             <div class="info-group">
// // //                <i class="pi pi-credit-card"></i>
// // //                <span>
// // //                   {{ order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid' }}
// // //                   <strong *ngIf="order.paymentMethod === 'COD'" style="color: #16a34a; margin-left: 5px;">
// // //                     ({{ order.totalAmount | currency:'INR' }})
// // //                   </strong>
// // //                </span>
// // //             </div>
            
// // //             <div class="info-group" *ngIf="order.deliveryFee">
// // //                <i class="pi pi-truck"></i>
// // //                <span>Delivery Fee: {{ order.deliveryFee | currency:'INR' }}</span>
// // //             </div>
// // //           </div>
          
// // //           <div class="notes" *ngIf="order.deliveryNotes">
// // //             <h3>Notes</h3>
// // //             <p>{{ order.deliveryNotes }}</p>
// // //           </div>
          
// // //           <div class="items-summary">
// // //             <h3>Items ({{ order.items?.length }})</h3>
// // //             <ul>
// // //               <li *ngFor="let item of order.items">
// // //                 {{ item.quantity }}x {{ item.snapshot?.name || item.name || 'Product' }}
// // //               </li>
// // //             </ul>
// // //           </div>
          
// // //           <div class="action-buttons">
// // //             <button class="action-btn out-for-delivery" 
// // //                     *ngIf="order.fulfillmentStatus !== 'shipped' && order.fulfillmentStatus !== 'delivered'"
// // //                     (click)="updateStatus(order._id, 'shipped')" [disabled]="updating">
// // //               <i class="pi pi-truck" *ngIf="!updating"></i>
// // //               <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
// // //               Mark Out for Delivery
// // //             </button>
            
// // //             <button class="action-btn delivered" 
// // //                     *ngIf="order.fulfillmentStatus !== 'delivered'"
// // //                     (click)="handleDeliverClick(order)" [disabled]="updating">
// // //               <i class="pi pi-check-circle" *ngIf="!updating"></i>
// // //               <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
// // //               {{ order.paymentMethod === 'COD' ? 'Collect & Deliver' : 'Mark Delivered' }}
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     .dashboard-container {
// // //       background: #f8fafc;
// // //       min-height: 100vh;
// // //       font-family: 'Inter', sans-serif;
// // //       position: relative;
// // //       overflow-x: hidden;
// // //     }
    
// // //     .header {
// // //       padding: 20px; background: linear-gradient(135deg, #4c1d95 0%, #0f172a 100%); color: white;
// // //       display: flex; justify-content: space-between; align-items: center;
// // //       border-radius: 0 0 20px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
// // //     }
    
// // //     .brand { display: flex; align-items: center; gap: 10px; }
// // //     .brand-icon { color: #a78bfa; font-size: 1.5rem; }
// // //     h1 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    
// // //     .icon-btn {
// // //       background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 40px; height: 40px;
// // //       border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
// // //     }
// // //     .icon-btn:hover { background: rgba(255, 255, 255, 0.2); }
    
// // //     .content { padding: 15px; padding-bottom: 90px; }
    
// // //     .status-tabs {
// // //       display: flex; background: white; border-radius: 12px; padding: 4px;
// // //       box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;
// // //     }
// // //     .status-tabs button {
// // //       flex: 1; padding: 10px; border: none; background: transparent; border-radius: 8px;
// // //       font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
// // //     }
// // //     .status-tabs button.active { background: #eff6ff; color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    
// // //     .loading-state, .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
// // //     .loading-state i { font-size: 2rem; color: #38bdf8; margin-bottom: 10px; }
    
// // //     .empty-icon {
// // //       width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex;
// // //       align-items: center; justify-content: center; margin: 0 auto 15px; color: #94a3b8; font-size: 2.5rem;
// // //     }
    
// // //     .orders-list { display: flex; flex-direction: column; gap: 15px; }
    
// // //     .order-card {
// // //       background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px;
// // //       box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s ease;
// // //       border-left: 4px solid #a78bfa;
// // //     }
// // //     .order-card:active { transform: scale(0.98); }
    
// // //     .order-header {
// // //       display: flex; justify-content: space-between; align-items: center;
// // //       margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0;
// // //     }
// // //     .order-number { font-weight: 700; color: #0f172a; font-size: 1.1rem; }
    
// // //     .status-badge {
// // //       padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
// // //       text-transform: uppercase; letter-spacing: 0.5px;
// // //     }
// // //     .status-badge[data-status="unfulfilled"], .status-badge[data-status="processing"] { background: #fffbeb; color: #d97706; }
// // //     .status-badge[data-status="shipped"] { background: #eff6ff; color: #2563eb; }
// // //     .status-badge[data-status="delivered"] { background: #f0fdf4; color: #16a34a; }
    
// // //     .order-body { display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px; }
// // //     .info-row { display: flex; align-items: flex-start; gap: 12px; color: #475569; font-size: 0.9rem; }
// // //     .info-row i { color: #94a3b8; margin-top: 3px; }
// // //     .address-details p, .info-row p { margin: 0; color: #64748b; line-height: 1.4; }
// // //     .address-details strong { color: #1e293b; display: block; margin-bottom: 2px; }
    
// // //     .order-footer {
// // //       display: flex; justify-content: space-between; align-items: center;
// // //       padding-top: 15px; border-top: 1px solid #f1f5f9;
// // //     }
// // //     .items-count { color: #64748b; font-size: 0.9rem; font-weight: 500; background: #f8fafc; padding: 4px 10px; border-radius: 6px; }
    
// // //     .action-btn { background: transparent; border: none; color: #2563eb; font-weight: 600; display: flex; align-items: center; gap: 5px; cursor: pointer;}
// // //     .action-btn:disabled { opacity: 0.7; }
    
// // //     /* Bottom Sheet */
// // //     .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; backdrop-filter: blur(2px); }
    
// // //     .detail-sheet {
// // //       position: fixed; bottom: 0; left: 0; right: 0; background: white;
// // //       border-radius: 24px 24px 0 0; z-index: 101; transform: translateY(100%);
// // //       transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-height: 90vh;
// // //       overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
// // //     }
// // //     .detail-sheet.open { transform: translateY(0); }
    
// // //     .drag-handle { width: 40px; height: 5px; background: #cbd5e1; border-radius: 3px; margin: 15px auto; cursor: pointer; }
// // //     .sheet-content { padding: 0 20px 30px; }
// // //     .sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
// // //     .sheet-header h2 { margin: 0; color: #0f172a; }
    
// // //     .customer-info, .notes, .items-summary {
// // //       background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #f1f5f9;
// // //     }
// // //     h3 { font-size: 0.85rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 0 0 15px 0; }
    
// // //     .info-group { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #334155; font-size: 0.95rem; }
// // //     .info-group.address { align-items: flex-start; }
// // //     .info-group i { color: #94a3b8; }
// // //     .info-group a { color: #2563eb; text-decoration: none; font-weight: 500; }
// // //     .info-group p { margin: 0 0 4px 0; line-height: 1.4; }
    
// // //     .notes p { margin: 0; color: #475569; line-height: 1.5; }
// // //     .items-summary ul { margin: 0; padding: 0; list-style: none; }
// // //     .items-summary li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #334155; }
// // //     .items-summary li:last-child { border-bottom: none; padding-bottom: 0; }
    
// // //     .action-buttons { display: flex; flex-direction: column; gap: 12px; margin-top: 25px; }
// // //     .action-btn { width: 100%; padding: 15px; border-radius: 12px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; border: none; }
    
// // //     .out-for-delivery { background: #eff6ff; color: #2563eb; }
// // //     .delivered { background: #16a34a; color: white; box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3); }

// // //     /* FAB and Modals */
// // //     .fab-scan {
// // //       position: fixed; bottom: 30px; right: 20px; width: 60px; height: 60px;
// // //       border-radius: 50%; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
// // //       color: white; border: none; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
// // //       display: flex; align-items: center; justify-content: center; cursor: pointer;
// // //       z-index: 50; transition: transform 0.2s;
// // //     }
// // //     .fab-scan:active { transform: scale(0.9); }
// // //     .fab-scan i { font-size: 1.5rem; }

// // //     .modal-overlay {
// // //       position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
// // //       z-index: 200; display: flex; align-items: center; justify-content: center;
// // //       padding: 20px; backdrop-filter: blur(4px);
// // //     }
// // //     .modal-card {
// // //       background: white; border-radius: 20px; width: 100%; max-width: 400px;
// // //       padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
// // //     }
    
// // //     .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
// // //     .modal-header h3 { margin: 0; color: #0f172a; font-size: 1.25rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
// // //     .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
    
// // //     .scan-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
// // //     .scan-tabs button { flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600; color: #64748b; cursor: pointer; }
// // //     .scan-tabs button.active { background: #eff6ff; border-color: #3b82f6; color: #2563eb; }

// // //     .premium-input {
// // //       width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc;
// // //       border: 1px solid #cbd5e1; color: #0f172a; font-size: 1rem; transition: all 0.3s ease; box-sizing: border-box;
// // //     }
// // //     .premium-input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2); }
    
// // //     .premium-btn { padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; }
// // //     .primary-btn { background: #2563eb; color: white; }
// // //     .secondary-btn { background: #f1f5f9; color: #475569; }
// // //     .success-btn { background: #16a34a; color: white; }
// // //     .full-width { width: 100%; }
    
// // //     .scan-error { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 10px; margin-top: 15px; font-size: 0.9rem; text-align: center; }

// // //     /* Scanner override for html5-qrcode */
// // //     #qr-reader { border-radius: 16px; overflow: hidden; border: none !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
// // //     #qr-reader__scan_region { background: #000; }
    
// // //     /* Payment Modal */
// // //     .payment-modal { text-align: center; }
// // //     .payment-icon { width: 64px; height: 64px; border-radius: 50%; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px; }
// // //     .payment-modal h3 { margin: 0 0 10px 0; color: #0f172a; font-size: 1.25rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
// // //     .payment-modal p { color: #64748b; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; }
// // //     .amount-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; font-size: 2.5rem; font-weight: 700; color: #16a34a; margin-bottom: 25px; }
// // //     .payment-actions { display: flex; gap: 15px; }
// // //     .payment-actions .premium-btn { flex: 1; }
// // //   `]
// // // })
// // // export class PlatformDashboardComponent implements OnInit, OnDestroy {
// // //   private platformService = inject(PlatformDeliveryService);
// // //   private router = inject(Router);
// // //   private route = inject(ActivatedRoute);

// // //   orders: any[] = [];
// // //   loading = true;
// // //   updating = false;
// // //   filter: 'active' | 'delivered' = 'active';
// // //   selectedOrder: any | null = null;
// // //   orgSlug = '';

// // //   // Scanner state
// // //   showScanner = false;
// // //   scanMode: 'camera' | 'manual' = 'camera';
// // //   manualIdentifier = '';
// // //   scanError = '';
// // //   searchingScan = false;
// // //   private html5QrcodeScanner: Html5QrcodeScanner | null = null;

// // //   // Payment Collection state
// // //   showPaymentModal = false;

// // //   // Password Update State
// // //   showPasswordModal = false;
// // //   passwordForm = { oldPassword: '', newPassword: '' };
// // //   updatingPassword = false;
// // //   passwordError = '';
// // //   passwordSuccess = '';

// // //   ngOnInit() {
// // //     this.loadOrders();
// // //   }

// // //   ngOnDestroy() {
// // //     this.cleanupScanner();
// // //   }

// // //   loadOrders() {
// // //     this.loading = true;
// // //     this.platformService.getOrders().subscribe({
// // //       next: (res) => {
// // //         this.orders = res.data || [];
// // //         this.loading = false;
// // //       },
// // //       error: (err) => {
// // //         console.error('Failed to load orders', err);
// // //         if (err.status === 401 || err.status === 403) {
// // //           this.logout();
// // //         }
// // //         this.loading = false;
// // //       }
// // //     });
// // //   }

// // //   get filteredOrders() {
// // //     if (this.filter === 'active') {
// // //       return this.orders.filter(o => o.fulfillmentStatus !== 'delivered');
// // //     }
// // //     return this.orders.filter(o => o.fulfillmentStatus === 'delivered');
// // //   }

// // //   openDetails(order: any) {
// // //     this.selectedOrder = order;
// // //   }

// // //   closeDetails() {
// // //     this.selectedOrder = null;
// // //   }

// // //   // -------------------------------------------------------------
// // //   // SCANNER LOGIC
// // //   // -------------------------------------------------------------

// // //   openScanner() {
// // //     this.showScanner = true;
// // //     this.scanMode = 'camera';
// // //     this.scanError = '';
// // //     this.manualIdentifier = '';

// // //     setTimeout(() => {
// // //       this.initScanner();
// // //     }, 100);
// // //   }

// // //   closeScanner() {
// // //     this.showScanner = false;
// // //     this.cleanupScanner();
// // //   }

// // //   private initScanner() {
// // //     if (this.html5QrcodeScanner) return;

// // //     this.html5QrcodeScanner = new Html5QrcodeScanner(
// // //       "qr-reader",
// // //       { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
// // //       false
// // //     );

// // //     this.html5QrcodeScanner.render(
// // //       (decodedText) => this.onScanSuccess(decodedText),
// // //       (error) => { /* Ignore background scan errors */ }
// // //     );
// // //   }

// // //   private cleanupScanner() {
// // //     if (this.html5QrcodeScanner) {
// // //       try {
// // //         this.html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner", e));
// // //       } catch (e) { }
// // //       this.html5QrcodeScanner = null;
// // //     }
// // //   }

// // //   onScanSuccess(decodedText: string) {
// // //     this.cleanupScanner();
// // //     this.scanMode = 'manual'; // switch UI so camera stops
// // //     this.manualIdentifier = decodedText;
// // //     this.searchManual();
// // //   }

// // //   searchManual() {
// // //     if (!this.manualIdentifier.trim()) return;

// // //     this.searchingScan = true;
// // //     this.scanError = '';

// // //     this.platformService.scanOrder(this.manualIdentifier.trim()).subscribe({
// // //       next: (res) => {
// // //         this.searchingScan = false;
// // //         this.closeScanner();

// // //         // Add to local array if not already present
// // //         const exists = this.orders.find(o => o._id === res.data._id);
// // //         if (!exists) {
// // //           this.orders.unshift(res.data);
// // //         }

// // //         // Open the details sheet
// // //         this.openDetails(res.data);
// // //       },
// // //       error: (err) => {
// // //         this.searchingScan = false;
// // //         this.scanError = err?.error?.message || 'Order not found or not assigned to you';
// // //       }
// // //     });
// // //   }

// // //   // -------------------------------------------------------------
// // //   // DELIVERY & COD LOGIC
// // //   // -------------------------------------------------------------

// // //   handleDeliverClick(order: any) {
// // //     if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
// // //       this.showPaymentModal = true;
// // //     } else {
// // //       this.updateStatus(order._id, 'delivered');
// // //     }
// // //   }

// // //   confirmDeliverWithPayment() {
// // //     if (!this.selectedOrder) return;
// // //     this.showPaymentModal = false;
// // //     this.updateStatus(this.selectedOrder._id, 'delivered', true);
// // //   }

// // //   updateStatus(orderId: string, status: string, paymentCollected = false) {
// // //     this.updating = true;
// // //     this.platformService.updateOrderStatus(orderId, status, paymentCollected).subscribe({
// // //       next: (res) => {
// // //         this.updating = false;
// // //         // Update local array
// // //         const idx = this.orders.findIndex(o => o._id === orderId);
// // //         if (idx !== -1) {
// // //           this.orders[idx] = res.data;
// // //           this.selectedOrder = res.data;

// // //           if (status === 'delivered') {
// // //             setTimeout(() => this.closeDetails(), 1500);
// // //           }
// // //         }
// // //       },
// // //       error: (err) => {
// // //         console.error('Update failed', err);
// // //         this.updating = false;
// // //         alert(err?.error?.message || 'Failed to update status');
// // //       }
// // //     });
// // //   }

// // //   updatePassword() {
// // //     this.passwordError = '';
// // //     this.passwordSuccess = '';
// // //     this.updatingPassword = true;

// // //     this.platformService.updatePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword).subscribe({
// // //       next: (res) => {
// // //         this.updatingPassword = false;
// // //         this.passwordSuccess = 'Password updated successfully!';
// // //         setTimeout(() => {
// // //           this.showPasswordModal = false;
// // //           this.passwordForm = { oldPassword: '', newPassword: '' };
// // //           this.passwordSuccess = '';
// // //         }, 1500);
// // //       },
// // //       error: (err) => {
// // //         this.updatingPassword = false;
// // //         this.passwordError = err?.error?.message || 'Failed to update password';
// // //       }
// // //     });
// // //   }

// // //   logout() {
// // //     this.platformService.logout();
// // //     this.router.navigate(['/apex-delivery/login']);
// // //   }
// // // }
