import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="app-header">
        <div class="brand">
          <i class="pi pi-box brand-icon"></i>
          <h1>My Deliveries</h1>
        </div>
        <button class="logout-btn" (click)="logout()">
          <i class="pi pi-power-off"></i>
        </button>
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
      
      <!-- Slide Up Detail View -->
      <div class="detail-overlay" *ngIf="selectedOrder" (click)="closeDetails()"></div>
      <div class="detail-sheet" [class.open]="selectedOrder">
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
          </div>
          
          <div class="notes" *ngIf="order.deliveryNotes">
            <h3>Notes</h3>
            <p>{{ order.deliveryNotes }}</p>
          </div>
          
          <div class="items-summary">
            <h3>Items ({{ order.items?.length }})</h3>
            <ul>
              <li *ngFor="let item of order.items">
                {{ item.quantity }}x {{ item.snapshot?.name }}
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
                    (click)="updateStatus(order._id, 'delivered')" [disabled]="updating">
              <i class="pi pi-check-circle" *ngIf="!updating"></i>
              <i class="pi pi-spin pi-spinner" *ngIf="updating"></i>
              Mark Delivered
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
    
    .app-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .brand-icon {
      color: #38bdf8;
      font-size: 1.5rem;
    }
    
    h1 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .content {
      padding: 15px;
      padding-bottom: 80px;
    }
    
    .status-tabs {
      display: flex;
      background: white;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .status-tabs button {
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .status-tabs button.active {
      background: #eff6ff;
      color: #2563eb;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    
    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }
    
    .loading-state i {
      font-size: 2rem;
      color: #38bdf8;
      margin-bottom: 10px;
    }
    
    .empty-icon {
      width: 80px;
      height: 80px;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      color: #94a3b8;
      font-size: 2.5rem;
    }
    
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .order-card {
      background: white;
      border-radius: 16px;
      padding: 15px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid #f1f5f9;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    
    .order-card:active {
      transform: scale(0.98);
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px dashed #e2e8f0;
    }
    
    .order-number {
      font-weight: 700;
      color: #0f172a;
      font-size: 1.1rem;
    }
    
    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-badge[data-status="unfulfilled"], .status-badge[data-status="processing"] {
      background: #fffbeb;
      color: #d97706;
    }
    
    .status-badge[data-status="shipped"] {
      background: #eff6ff;
      color: #2563eb;
    }
    
    .status-badge[data-status="delivered"] {
      background: #f0fdf4;
      color: #16a34a;
    }
    
    .order-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: #475569;
      font-size: 0.9rem;
    }
    
    .info-row i {
      color: #94a3b8;
      margin-top: 3px;
    }
    
    .address-details p, .info-row p {
      margin: 0;
      color: #64748b;
      line-height: 1.4;
    }
    
    .address-details strong {
      color: #1e293b;
      display: block;
      margin-bottom: 2px;
    }
    
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 15px;
      border-top: 1px solid #f1f5f9;
    }
    
    .items-count {
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
      background: #f8fafc;
      padding: 4px 10px;
      border-radius: 6px;
    }
    
    .action-btn {
      background: transparent;
      border: none;
      color: #2563eb;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    /* Bottom Sheet */
    .detail-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 100;
      backdrop-filter: blur(2px);
    }
    
    .detail-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-radius: 24px 24px 0 0;
      z-index: 101;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
    }
    
    .detail-sheet.open {
      transform: translateY(0);
    }
    
    .drag-handle {
      width: 40px;
      height: 5px;
      background: #cbd5e1;
      border-radius: 3px;
      margin: 15px auto;
      cursor: pointer;
    }
    
    .sheet-content {
      padding: 0 20px 30px;
    }
    
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    
    .sheet-header h2 {
      margin: 0;
      color: #0f172a;
    }
    
    .customer-info, .notes, .items-summary {
      background: #f8fafc;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
      border: 1px solid #f1f5f9;
    }
    
    h3 {
      font-size: 0.85rem;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin: 0 0 15px 0;
    }
    
    .info-group {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      color: #334155;
      font-size: 0.95rem;
    }
    
    .info-group.address {
      align-items: flex-start;
    }
    
    .info-group i {
      color: #94a3b8;
    }
    
    .info-group a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    
    .info-group p {
      margin: 0 0 4px 0;
      line-height: 1.4;
    }
    
    .notes p {
      margin: 0;
      color: #475569;
      line-height: 1.5;
    }
    
    .items-summary ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .items-summary li {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    
    .items-summary li:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 25px;
    }
    
    .action-btn {
      width: 100%;
      padding: 15px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      border: none;
    }
    
    .action-btn:disabled {
      opacity: 0.7;
    }
    
    .out-for-delivery {
      background: #eff6ff;
      color: #2563eb;
    }
    
    .delivered {
      background: #16a34a;
      color: white;
      box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3);
    }
  `]
})
export class DeliveryDashboardComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);

  orders: any[] = [];
  loading = true;
  updating = false;
  filter: 'active' | 'delivered' = 'active';
  selectedOrder: any | null = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.deliveryService.getOrders().subscribe({
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

  updateStatus(orderId: string, status: string) {
    this.updating = true;
    this.deliveryService.updateOrderStatus(orderId, status).subscribe({
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
      }
    });
  }

  logout() {
    localStorage.removeItem('delivery_token');
    this.router.navigate(['/delivery/login']);
  }
}
