import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
    <div class="dashboard-container">
      <header class="header">
        <div class="brand">
          <i class="pi pi-globe brand-icon"></i>
          <h1>Platform Deliveries</h1>
        </div>
        <div class="header-actions" style="display: flex; gap: 10px;">
          <button class="icon-btn" (click)="showPasswordModal = true" title="Change Password">
            <i class="pi pi-key"></i>
          </button>
          <button class="icon-btn logout-btn" (click)="logout()" title="Logout">
            <i class="pi pi-power-off"></i>
          </button>
        </div>
      </header>

      <main class="content">
        <div class="status-tabs">
          <button [class.active]="filter === 'active'" (click)="filter = 'active'">Active</button>
          <button [class.active]="filter === 'delivered'" (click)="filter = 'delivered'">Delivered</button>
        </div>

        <div *ngIf="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading orders...</p>
        </div>

        <div *ngIf="!loading && filteredOrders.length === 0" class="empty-state">
          <div class="empty-icon"><i class="pi pi-check-circle"></i></div>
          <h3>All Caught Up!</h3>
          <p>You have no {{ filter }} deliveries at the moment.</p>
        </div>

        <div class="orders-list" *ngIf="!loading && filteredOrders.length > 0">
          <div class="order-card" *ngFor="let order of filteredOrders" (click)="openDetails(order)">
            <div class="order-header">
              <span class="order-number">{{ order.orderNumber }}</span>
              <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus | titlecase }}</span>
            </div>
            
            <div class="order-body">
              <div class="info-row">
                <i class="pi pi-map-marker"></i>
                <div class="address-details" *ngIf="order.shippingAddress">
                  <strong>{{ order.shippingAddress.fullName || order.customerId?.firstName || 'Customer' }}</strong>
                  <p>{{ order.shippingAddress.addressLine1 }}, {{ order.shippingAddress.city }}</p>
                </div>
              </div>
              
              <div class="info-row">
                <i class="pi pi-phone"></i>
                <p>{{ order.shippingAddress?.phone || 'No phone provided' }}</p>
              </div>
              
              <!-- Payment Info on Card -->
              <div class="info-row" *ngIf="order.paymentMethod === 'COD'">
                <i class="pi pi-money-bill" style="color: #16a34a;"></i>
                <strong style="color: #16a34a;">Collect: {{ order.totalAmount | currency:'INR' }}</strong>
              </div>
            </div>
            
            <div class="order-footer">
              <div class="items-count">{{ order.items?.length || 0 }} items</div>
              <button class="action-btn">
                <span>View Details</span>
                <i class="pi pi-angle-right"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <!-- Floating Action Button for Scanner -->
      <button class="fab-scan" (click)="openScanner()">
        <i class="pi pi-camera"></i>
      </button>
      
      <!-- Scanner Modal -->
      <div class="modal-overlay" *ngIf="showScanner">
        <div class="modal-card scanner-modal">
          <div class="modal-header">
            <h3>Scan Parcel</h3>
            <button class="close-btn" (click)="closeScanner()"><i class="pi pi-times"></i></button>
          </div>
          <div class="scan-tabs">
            <button [class.active]="scanMode === 'camera'" (click)="scanMode = 'camera'">Camera</button>
            <button [class.active]="scanMode === 'manual'" (click)="scanMode = 'manual'">Manual</button>
          </div>
          
          <div class="scanner-container" [hidden]="scanMode !== 'camera'">
            <div id="qr-reader"></div>
          </div>
          
          <div class="manual-input-container" *ngIf="scanMode === 'manual'">
            <input type="text" [(ngModel)]="manualIdentifier" class="premium-input" placeholder="Tracking ID or Order #">
            <button class="premium-btn primary-btn full-width" style="margin-top: 15px;" (click)="searchManual()" [disabled]="searchingScan">
              <i class="pi pi-spin pi-spinner" *ngIf="searchingScan"></i>
              {{ searchingScan ? 'Searching...' : 'Search' }}
            </button>
          </div>
          
          <div class="scan-error" *ngIf="scanError">{{ scanError }}</div>
        </div>
      </div>
      
      <!-- COD Payment Collection Modal -->
      <div class="modal-overlay" *ngIf="showPaymentModal" style="z-index: 1000;">
        <div class="modal-card payment-modal">
          <div class="payment-icon"><i class="pi pi-wallet"></i></div>
          <h3>Collect Cash on Delivery</h3>
          <p>This is a COD order. Please collect the exact amount below from the customer before completing the delivery.</p>
          
          <div class="amount-box">
             {{ selectedOrder?.totalAmount | currency:'INR' }}
          </div>
          
          <div class="payment-actions">
             <button class="premium-btn secondary-btn" (click)="showPaymentModal = false">Cancel</button>
             <button class="premium-btn success-btn" (click)="confirmDeliverWithPayment()">
               <i class="pi pi-check"></i> Cash Collected
             </button>
          </div>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div class="modal-overlay" *ngIf="showPasswordModal" style="z-index: 1000;">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Change Password</h3>
            <button class="close-btn" (click)="showPasswordModal = false"><i class="pi pi-times"></i></button>
          </div>
          
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Current Password</label>
            <input type="password" [(ngModel)]="passwordForm.oldPassword" class="premium-input" placeholder="Enter current password">
          </div>
          
          <div class="form-group" style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">New Password</label>
            <input type="password" [(ngModel)]="passwordForm.newPassword" class="premium-input" placeholder="Enter new password">
          </div>
          
          <div class="error-message" *ngIf="passwordError" style="color: #ef4444; margin-bottom: 15px; font-size: 0.9rem;">{{ passwordError }}</div>
          <div class="success-message" *ngIf="passwordSuccess" style="color: #16a34a; margin-bottom: 15px; font-size: 0.9rem;">{{ passwordSuccess }}</div>
          
          <button class="premium-btn primary-btn full-width" (click)="updatePassword()" [disabled]="updatingPassword || !passwordForm.oldPassword || !passwordForm.newPassword">
            <i class="pi pi-spin pi-spinner" *ngIf="updatingPassword"></i>
            {{ updatingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </div>

      <!-- Slide Up Detail View -->
      <div class="detail-overlay" *ngIf="selectedOrder && !showScanner && !showPaymentModal && !showPasswordModal" (click)="closeDetails()"></div>
      <div class="detail-sheet" [class.open]="selectedOrder && !showScanner && !showPaymentModal && !showPasswordModal">
        <div class="drag-handle" (click)="closeDetails()"></div>
        <div class="sheet-content" *ngIf="selectedOrder as order">
          <div class="sheet-header">
            <h2>{{ order.orderNumber }}</h2>
            <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus | titlecase }}</span>
          </div>
          
          <div class="customer-info">
            <h3>Delivery Details</h3>
            <div class="info-group">
              <i class="pi pi-user"></i>
              <span>{{ order.shippingAddress?.fullName || 'Customer' }}</span>
            </div>
            <div class="info-group">
              <i class="pi pi-phone"></i>
              <a [href]="'tel:' + order.shippingAddress?.phone">{{ order.shippingAddress?.phone || 'No phone' }}</a>
            </div>
            <div class="info-group address">
              <i class="pi pi-map-marker"></i>
              <div>
                <p>{{ order.shippingAddress?.addressLine1 }}</p>
                <p *ngIf="order.shippingAddress?.addressLine2">{{ order.shippingAddress?.addressLine2 }}</p>
                <p>{{ order.shippingAddress?.city }}, {{ order.shippingAddress?.state }} {{ order.shippingAddress?.pincode }}</p>
              </div>
            </div>
            
            <div class="info-group">
               <i class="pi pi-credit-card"></i>
               <span>
                  {{ order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid' }}
                  <strong *ngIf="order.paymentMethod === 'COD'" style="color: #16a34a; margin-left: 5px;">
                    ({{ order.totalAmount | currency:'INR' }})
                  </strong>
               </span>
            </div>
            
            <div class="info-group" *ngIf="order.deliveryFee">
               <i class="pi pi-truck"></i>
               <span>Delivery Fee: {{ order.deliveryFee | currency:'INR' }}</span>
            </div>
          </div>
          
          <div class="notes" *ngIf="order.deliveryNotes">
            <h3>Notes</h3>
            <p>{{ order.deliveryNotes }}</p>
          </div>
          
          <div class="items-summary">
            <h3>Items ({{ order.items?.length }})</h3>
            <ul>
              <li *ngFor="let item of order.items">
                {{ item.quantity }}x {{ item.snapshot?.name || item.name || 'Product' }}
              </li>
            </ul>
          </div>
          
          <div class="action-buttons">
            <button class="action-btn out-for-delivery" 
                    *ngIf="order.fulfillmentStatus !== 'shipped' && order.fulfillmentStatus !== 'delivered'"
                    (click)="updateStatus(order._id, 'shipped')" [disabled]="updating">
              <i class="pi pi-truck" *ngIf="!updating"></i>
              <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
              Mark Out for Delivery
            </button>
            
            <button class="action-btn delivered" 
                    *ngIf="order.fulfillmentStatus !== 'delivered'"
                    (click)="handleDeliverClick(order)" [disabled]="updating">
              <i class="pi pi-check-circle" *ngIf="!updating"></i>
              <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
              {{ order.paymentMethod === 'COD' ? 'Collect & Deliver' : 'Mark Delivered' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      background: #f8fafc;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      position: relative;
      overflow-x: hidden;
    }
    
    .header {
      padding: 20px; background: linear-gradient(135deg, #4c1d95 0%, #0f172a 100%); color: white;
      display: flex; justify-content: space-between; align-items: center;
      border-radius: 0 0 20px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { color: #a78bfa; font-size: 1.5rem; }
    h1 { margin: 0; font-size: 1.2rem; font-weight: 600; }
    
    .icon-btn {
      background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 40px; height: 40px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .icon-btn:hover { background: rgba(255, 255, 255, 0.2); }
    
    .content { padding: 15px; padding-bottom: 90px; }
    
    .status-tabs {
      display: flex; background: white; border-radius: 12px; padding: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;
    }
    .status-tabs button {
      flex: 1; padding: 10px; border: none; background: transparent; border-radius: 8px;
      font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s;
    }
    .status-tabs button.active { background: #eff6ff; color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    
    .loading-state, .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
    .loading-state i { font-size: 2rem; color: #38bdf8; margin-bottom: 10px; }
    
    .empty-icon {
      width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; margin: 0 auto 15px; color: #94a3b8; font-size: 2.5rem;
    }
    
    .orders-list { display: flex; flex-direction: column; gap: 15px; }
    
    .order-card {
      background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s ease;
      border-left: 4px solid #a78bfa;
    }
    .order-card:active { transform: scale(0.98); }
    
    .order-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0;
    }
    .order-number { font-weight: 700; color: #0f172a; font-size: 1.1rem; }
    
    .status-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-badge[data-status="unfulfilled"], .status-badge[data-status="processing"] { background: #fffbeb; color: #d97706; }
    .status-badge[data-status="shipped"] { background: #eff6ff; color: #2563eb; }
    .status-badge[data-status="delivered"] { background: #f0fdf4; color: #16a34a; }
    
    .order-body { display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px; }
    .info-row { display: flex; align-items: flex-start; gap: 12px; color: #475569; font-size: 0.9rem; }
    .info-row i { color: #94a3b8; margin-top: 3px; }
    .address-details p, .info-row p { margin: 0; color: #64748b; line-height: 1.4; }
    .address-details strong { color: #1e293b; display: block; margin-bottom: 2px; }
    
    .order-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 15px; border-top: 1px solid #f1f5f9;
    }
    .items-count { color: #64748b; font-size: 0.9rem; font-weight: 500; background: #f8fafc; padding: 4px 10px; border-radius: 6px; }
    
    .action-btn { background: transparent; border: none; color: #2563eb; font-weight: 600; display: flex; align-items: center; gap: 5px; cursor: pointer;}
    .action-btn:disabled { opacity: 0.7; }
    
    /* Bottom Sheet */
    .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; backdrop-filter: blur(2px); }
    
    .detail-sheet {
      position: fixed; bottom: 0; left: 0; right: 0; background: white;
      border-radius: 24px 24px 0 0; z-index: 101; transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-height: 90vh;
      overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
    }
    .detail-sheet.open { transform: translateY(0); }
    
    .drag-handle { width: 40px; height: 5px; background: #cbd5e1; border-radius: 3px; margin: 15px auto; cursor: pointer; }
    .sheet-content { padding: 0 20px 30px; }
    .sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .sheet-header h2 { margin: 0; color: #0f172a; }
    
    .customer-info, .notes, .items-summary {
      background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 15px; border: 1px solid #f1f5f9;
    }
    h3 { font-size: 0.85rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 0 0 15px 0; }
    
    .info-group { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #334155; font-size: 0.95rem; }
    .info-group.address { align-items: flex-start; }
    .info-group i { color: #94a3b8; }
    .info-group a { color: #2563eb; text-decoration: none; font-weight: 500; }
    .info-group p { margin: 0 0 4px 0; line-height: 1.4; }
    
    .notes p { margin: 0; color: #475569; line-height: 1.5; }
    .items-summary ul { margin: 0; padding: 0; list-style: none; }
    .items-summary li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .items-summary li:last-child { border-bottom: none; padding-bottom: 0; }
    
    .action-buttons { display: flex; flex-direction: column; gap: 12px; margin-top: 25px; }
    .action-btn { width: 100%; padding: 15px; border-radius: 12px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; border: none; }
    
    .out-for-delivery { background: #eff6ff; color: #2563eb; }
    .delivered { background: #16a34a; color: white; box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3); }

    /* FAB and Modals */
    .fab-scan {
      position: fixed; bottom: 30px; right: 20px; width: 60px; height: 60px;
      border-radius: 50%; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
      color: white; border: none; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      z-index: 50; transition: transform 0.2s;
    }
    .fab-scan:active { transform: scale(0.9); }
    .fab-scan i { font-size: 1.5rem; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      z-index: 200; display: flex; align-items: center; justify-content: center;
      padding: 20px; backdrop-filter: blur(4px);
    }
    .modal-card {
      background: white; border-radius: 20px; width: 100%; max-width: 400px;
      padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h3 { margin: 0; color: #0f172a; font-size: 1.25rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
    
    .scan-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .scan-tabs button { flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600; color: #64748b; cursor: pointer; }
    .scan-tabs button.active { background: #eff6ff; border-color: #3b82f6; color: #2563eb; }

    .premium-input {
      width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc;
      border: 1px solid #cbd5e1; color: #0f172a; font-size: 1rem; transition: all 0.3s ease; box-sizing: border-box;
    }
    .premium-input:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2); }
    
    .premium-btn { padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; }
    .primary-btn { background: #2563eb; color: white; }
    .secondary-btn { background: #f1f5f9; color: #475569; }
    .success-btn { background: #16a34a; color: white; }
    .full-width { width: 100%; }
    
    .scan-error { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 10px; margin-top: 15px; font-size: 0.9rem; text-align: center; }

    /* Scanner override for html5-qrcode */
    #qr-reader { border-radius: 16px; overflow: hidden; border: none !important; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    #qr-reader__scan_region { background: #000; }
    
    /* Payment Modal */
    .payment-modal { text-align: center; }
    .payment-icon { width: 64px; height: 64px; border-radius: 50%; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px; }
    .payment-modal h3 { margin: 0 0 10px 0; color: #0f172a; font-size: 1.25rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
    .payment-modal p { color: #64748b; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; }
    .amount-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; font-size: 2.5rem; font-weight: 700; color: #16a34a; margin-bottom: 25px; }
    .payment-actions { display: flex; gap: 15px; }
    .payment-actions .premium-btn { flex: 1; }
  `]
})
export class PlatformDashboardComponent implements OnInit, OnDestroy {
  private platformService = inject(PlatformDeliveryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orders: any[] = [];
  loading = true;
  updating = false;
  filter: 'active' | 'delivered' = 'active';
  selectedOrder: any | null = null;
  orgSlug = '';

  // Scanner state
  showScanner = false;
  scanMode: 'camera' | 'manual' = 'camera';
  manualIdentifier = '';
  scanError = '';
  searchingScan = false;
  private html5QrcodeScanner: Html5QrcodeScanner | null = null;

  // Payment Collection state
  showPaymentModal = false;

  // Password Update State
  showPasswordModal = false;
  passwordForm = { oldPassword: '', newPassword: '' };
  updatingPassword = false;
  passwordError = '';
  passwordSuccess = '';

  ngOnInit() {
    this.loadOrders();
  }

  ngOnDestroy() {
    this.cleanupScanner();
  }

  loadOrders() {
    this.loading = true;
    this.platformService.getOrders().subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
        this.loading = false;
      }
    });
  }

  get filteredOrders() {
    if (this.filter === 'active') {
      return this.orders.filter(o => o.fulfillmentStatus !== 'delivered');
    }
    return this.orders.filter(o => o.fulfillmentStatus === 'delivered');
  }

  openDetails(order: any) {
    this.selectedOrder = order;
  }

  closeDetails() {
    this.selectedOrder = null;
  }

  // -------------------------------------------------------------
  // SCANNER LOGIC
  // -------------------------------------------------------------

  openScanner() {
    this.showScanner = true;
    this.scanMode = 'camera';
    this.scanError = '';
    this.manualIdentifier = '';

    setTimeout(() => {
      this.initScanner();
    }, 100);
  }

  closeScanner() {
    this.showScanner = false;
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
      (error) => { /* Ignore background scan errors */ }
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
    this.scanMode = 'manual'; // switch UI so camera stops
    this.manualIdentifier = decodedText;
    this.searchManual();
  }

  searchManual() {
    if (!this.manualIdentifier.trim()) return;

    this.searchingScan = true;
    this.scanError = '';

    this.platformService.scanOrder(this.manualIdentifier.trim()).subscribe({
      next: (res) => {
        this.searchingScan = false;
        this.closeScanner();

        // Add to local array if not already present
        const exists = this.orders.find(o => o._id === res.data._id);
        if (!exists) {
          this.orders.unshift(res.data);
        }

        // Open the details sheet
        this.openDetails(res.data);
      },
      error: (err) => {
        this.searchingScan = false;
        this.scanError = err?.error?.message || 'Order not found or not assigned to you';
      }
    });
  }

  // -------------------------------------------------------------
  // DELIVERY & COD LOGIC
  // -------------------------------------------------------------

  handleDeliverClick(order: any) {
    if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
      this.showPaymentModal = true;
    } else {
      this.updateStatus(order._id, 'delivered');
    }
  }

  confirmDeliverWithPayment() {
    if (!this.selectedOrder) return;
    this.showPaymentModal = false;
    this.updateStatus(this.selectedOrder._id, 'delivered', true);
  }

  updateStatus(orderId: string, status: string, paymentCollected = false) {
    this.updating = true;
    this.platformService.updateOrderStatus(orderId, status, paymentCollected).subscribe({
      next: (res) => {
        this.updating = false;
        // Update local array
        const idx = this.orders.findIndex(o => o._id === orderId);
        if (idx !== -1) {
          this.orders[idx] = res.data;
          this.selectedOrder = res.data;

          if (status === 'delivered') {
            setTimeout(() => this.closeDetails(), 1500);
          }
        }
      },
      error: (err) => {
        console.error('Update failed', err);
        this.updating = false;
        alert(err?.error?.message || 'Failed to update status');
      }
    });
  }

  updatePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';
    this.updatingPassword = true;

    this.platformService.updatePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword).subscribe({
      next: (res) => {
        this.updatingPassword = false;
        this.passwordSuccess = 'Password updated successfully!';
        setTimeout(() => {
          this.showPasswordModal = false;
          this.passwordForm = { oldPassword: '', newPassword: '' };
          this.passwordSuccess = '';
        }, 1500);
      },
      error: (err) => {
        this.updatingPassword = false;
        this.passwordError = err?.error?.message || 'Failed to update password';
      }
    });
  }

  logout() {
    localStorage.removeItem('platform_delivery_token');
    this.router.navigate(['/apex-delivery/login']);
  }
}
