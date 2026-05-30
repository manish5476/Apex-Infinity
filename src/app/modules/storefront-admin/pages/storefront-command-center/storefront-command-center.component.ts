import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';

export interface CommandCenterData {
  generatedAt: string;
  period: { label: string; since: string };
  kpis: {
    totalOrders: number;
    grossRevenue: number;
    averageOrderValue: number;
    shippingRevenue: number;
    storefrontCustomers: number;
    convertedCustomers: number;
    guestCustomers: number;
    abandonedCarts: number;
    unfulfilledAccepted: number;
    ghostRisk: number;
  };
  byStatus: Array<{ _id: string; count: number; value: number }>;
  byPayment: Array<{ _id: string; count: number; value: number }>;
  pages: Array<{ _id: string; count: number; views: number }>;
  recentOrders: any[];
  workQueues: Array<{ key: string; title: string; count: number; severity: string; route: string }>;
}

const fallbackData: CommandCenterData = {
  generatedAt: new Date().toISOString(),
  period: { label: 'Last 30 days', since: new Date().toISOString() },
  kpis: {
    totalOrders: 0, grossRevenue: 0, averageOrderValue: 0, shippingRevenue: 0,
    storefrontCustomers: 0, convertedCustomers: 0, guestCustomers: 0,
    abandonedCarts: 0, unfulfilledAccepted: 0, ghostRisk: 0
  },
  byStatus: [], byPayment: [], pages: [], recentOrders: [], workQueues: []
};

@Component({
  selector: 'app-storefront-command-center',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="dashboard-wrapper">
      
      <header class="dash-header">
        <div class="header-left">
          <h1>Storefront Command Center</h1>
          <p class="text-muted">
            {{ data().period.label }} · Last synced {{ data().generatedAt | date:'MMM d, h:mm a' }}
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="../orders" class="btn-secondary"><i class="pi pi-shopping-bag"></i> All Orders</a>
          <a routerLink="../customers" class="btn-secondary"><i class="pi pi-users"></i> Customers</a>
          <button type="button" class="btn-primary icon-only" (click)="load()" [disabled]="loading()">
            <i class="pi pi-refresh" [class.pi-spin]="loading()"></i>
          </button>
        </div>
      </header>

      <div class="integrity-banner" *ngIf="data().kpis.ghostRisk > 0">
        <div class="banner-content">
          <div class="banner-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div>
            <h4 class="banner-title">Data Integrity Warning</h4>
            <p class="banner-desc">{{ data().kpis.ghostRisk }} delivered orders are missing CRM customer links or invoices. Action required to maintain accounting sync.</p>
          </div>
        </div>
        <a routerLink="../orders" class="btn-danger-outline">Review Records</a>
      </div>

      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Gross Revenue</span>
          <strong class="kpi-value">{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Avg. Order Value</span>
          <strong class="kpi-value">{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Orders</span>
          <strong class="kpi-value">{{ data().kpis.totalOrders | number }}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Unfulfilled</span>
          <strong class="kpi-value text-warning">{{ data().kpis.unfulfilledAccepted | number }}</strong>
        </div>
      </section>

      <div class="bento-layout">
        
        <div class="bento-main">
          
          <div class="pro-panel">
            <div class="panel-header">
              <h2>Action Queues</h2>
            </div>
            <div class="queue-list">
              <a *ngFor="let queue of data().workQueues" [routerLink]="queue.route" class="queue-item" [attr.data-severity]="queue.severity">
                <span class="queue-title">{{ queue.title }}</span>
                <span class="queue-badge">{{ queue.count }}</span>
              </a>
            </div>
          </div>

          <div class="pro-panel table-panel">
            <div class="panel-header">
              <h2>Recent Storefront Orders</h2>
              <a routerLink="../orders" class="link-btn">View All</a>
            </div>
            
            <div class="table-container">
              <table class="pro-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of data().recentOrders">
                    <td class="font-mono fw-600">{{ order.orderNumber }}</td>
                    <td>
                      <div class="cell-stacked">
                        <span class="fw-500">{{ customerName(order) }}</span>
                        <span class="text-muted text-xs">{{ order.customerId?.email || 'Guest' }}</span>
                      </div>
                    </td>
                    <td class="text-muted">{{ order.createdAt | date:'dd MMM, HH:mm' }}</td>
                    <td>
                      <span class="status-pill" [attr.data-status]="order.fulfillmentStatus">
                        {{ order.fulfillmentStatus }}
                      </span>
                    </td>
                    <td class="text-right fw-600">{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</td>
                  </tr>
                  <tr *ngIf="data().recentOrders.length === 0">
                    <td colspan="5" class="empty-state">No recent orders found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        <div class="bento-side">
          
          <div class="pro-panel">
            <div class="panel-header">
              <h2>Orders by Status</h2>
            </div>
            <div class="stat-bars">
              <div class="stat-row" *ngFor="let item of data().byStatus">
                <div class="stat-labels">
                  <span class="stat-name">{{ label(item._id) }}</span>
                  <span class="stat-count">{{ item.count }} orders ({{ item.value | currency:'INR':'symbol':'1.0-0' }})</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="statusWidth(item.count)"></div>
                </div>
              </div>
              <div *ngIf="data().byStatus.length === 0" class="empty-state">No data</div>
            </div>
          </div>

          <div class="pro-panel">
            <div class="panel-header">
              <h2>Payment Mix</h2>
            </div>
            <div class="stat-bars">
              <div class="stat-row" *ngFor="let payment of data().byPayment">
                <div class="stat-labels">
                  <span class="stat-name">{{ label(payment._id) }}</span>
                  <span class="stat-count">{{ payment.count }} orders</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill bg-success" [style.width.%]="paymentWidth(payment.count)"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="pro-panel">
            <div class="panel-header">
              <h2>Customer Conversion</h2>
            </div>
            <div class="conversion-block">
              <div class="conversion-hero">
                <span class="hero-val">{{ conversionRate() }}%</span>
                <span class="text-muted text-sm">CRM Linked</span>
              </div>
              <div class="conversion-metrics">
                <div class="metric">
                  <span class="val">{{ data().kpis.storefrontCustomers }}</span>
                  <span class="lbl">Total Checkouts</span>
                </div>
                <div class="metric">
                  <span class="val">{{ data().kpis.guestCustomers }}</span>
                  <span class="lbl">Guest / Unlinked</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :root {
      --bg-body: #f8fafc;
      --bg-card: #ffffff;
      --border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --radius-sm: 6px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-card: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
    }

    .dashboard-wrapper {
      background: var(--bg-body);
      min-height: 100vh;
      padding: 24px;
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Utilities */
    .text-muted { color: var(--text-muted); }
    .text-right { text-align: right; }
    .text-sm { font-size: 0.85rem; }
    .text-xs { font-size: 0.75rem; }
    .fw-500 { font-weight: 500; }
    .fw-600 { font-weight: 600; }
    .font-mono { font-family: ui-monospace, 'Fira Code', monospace; font-size: 0.85rem; }
    .bg-success { background-color: var(--success) !important; }
    .text-warning { color: #d97706; }
    .empty-state { text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem; }

    /* Header */
    .dash-header {
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .header-left h1 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em; }
    .header-left p { margin: 0; font-size: 0.9rem; }
    
    .header-actions { display: flex; gap: 10px; }
    .btn-secondary, .btn-primary, .btn-danger-outline {
      padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
      transition: all 0.2s; border: 1px solid transparent;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { background: var(--bg-card); border-color: var(--border); color: var(--text-main); box-shadow: var(--shadow-sm); }
    .btn-secondary:hover { background: #f1f5f9; }
    .btn-danger-outline { background: transparent; border-color: var(--danger); color: var(--danger); }
    .btn-danger-outline:hover { background: #fef2f2; }
    .icon-only { padding: 8px 12px; }

    /* Alert Banner */
    .integrity-banner {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md);
      padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
    }
    .banner-content { display: flex; align-items: flex-start; gap: 16px; }
    .banner-icon { color: var(--danger); font-size: 1.5rem; }
    .banner-title { margin: 0 0 4px 0; color: #991b1b; font-size: 1rem; }
    .banner-desc { margin: 0; color: #b91c1c; font-size: 0.9rem; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .kpi-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 20px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm);
    }
    .kpi-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 1.75rem; font-weight: 700; color: var(--text-main); line-height: 1; }

    /* Layout */
    .bento-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    @media (max-width: 1024px) { .bento-layout { grid-template-columns: 1fr; } }
    .bento-main, .bento-side { display: flex; flex-direction: column; gap: 20px; }

    /* Panels */
    .pro-panel {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-card); overflow: hidden;
    }
    .panel-header {
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
      background: #fafafa;
    }
    .panel-header h2 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main); }
    .link-btn { font-size: 0.85rem; font-weight: 600; color: var(--primary); text-decoration: none; }
    .link-btn:hover { text-decoration: underline; }

    /* Queue List */
    .queue-list { display: flex; flex-direction: column; padding: 12px; gap: 8px; }
    .queue-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-radius: var(--radius-sm); text-decoration: none;
      background: var(--bg-body); border: 1px solid transparent; transition: all 0.2s;
    }
    .queue-item:hover { transform: translateX(2px); }
    .queue-title { font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
    .queue-badge { font-size: 0.85rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
    
    .queue-item[data-severity="danger"] { background: #fef2f2; border-color: #fecaca; }
    .queue-item[data-severity="danger"] .queue-title { color: #991b1b; }
    .queue-item[data-severity="danger"] .queue-badge { background: #fca5a5; color: #7f1d1d; }
    
    .queue-item[data-severity="warning"] { background: #fffbeb; border-color: #fde68a; }
    .queue-item[data-severity="warning"] .queue-title { color: #92400e; }
    .queue-item[data-severity="warning"] .queue-badge { background: #fcd34d; color: #78350f; }

    .queue-item[data-severity="success"] { background: #f0fdf4; border-color: #bbf7d0; }
    .queue-item[data-severity="success"] .queue-title { color: #166534; }
    .queue-item[data-severity="success"] .queue-badge { background: #86efac; color: #14532d; }

    /* Data Table (Based on Cart Reference) */
    .table-container { overflow-x: auto; }
    .pro-table { width: 100%; border-collapse: collapse; text-align: left; }
    .pro-table th { padding: 16px 20px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
    .pro-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 0.9rem; vertical-align: middle; }
    .pro-table tbody tr:hover { background: #f8fafc; }
    .pro-table tbody tr:last-child td { border-bottom: none; }
    
    .cell-stacked { display: flex; flex-direction: column; gap: 2px; }

    /* Status Pills */
    .status-pill {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 4px 10px; border-radius: 20px; white-space: nowrap;
    }
    .status-pill[data-status="unfulfilled"] { background: #fef3c7; color: #b45309; }
    .status-pill[data-status="shipped"] { background: #e0e7ff; color: #4338ca; }
    .status-pill[data-status="delivered"] { background: #dcfce7; color: #059669; }

    /* Progress Bars (Status / Payment) */
    .stat-bars { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .stat-row { display: flex; flex-direction: column; gap: 8px; }
    .stat-labels { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .stat-name { font-weight: 600; color: var(--text-main); }
    .stat-count { color: var(--text-muted); }
    .progress-track { width: 100%; height: 8px; background: var(--bg-body); border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--primary); border-radius: 4px; transition: width 0.5s ease; }

    /* Conversion Block */
    .conversion-block { padding: 20px; display: flex; flex-direction: column; gap: 20px; align-items: center; }
    .conversion-hero { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px; height: 140px; border-radius: 50%; border: 8px solid #e0e7ff; }
    .hero-val { font-size: 2.5rem; font-weight: 700; color: var(--primary); line-height: 1; margin-bottom: 4px; }
    .conversion-metrics { display: flex; width: 100%; gap: 12px; border-top: 1px solid var(--border); padding-top: 20px; }
    .metric { flex: 1; text-align: center; display: flex; flex-direction: column; background: var(--bg-body); padding: 12px; border-radius: var(--radius-sm); }
    .metric .val { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
    .metric .lbl { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 4px; }
  `]
})
export class StorefrontCommandCenterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontAdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<CommandCenterData>(fallbackData);

  readonly maxStatusCount = computed(() =>
    Math.max(1, ...this.data().byStatus.map(item => item.count || 0))
  );

  readonly maxPaymentCount = computed(() =>
    Math.max(1, ...this.data().byPayment.map(item => item.count || 0))
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.storefront.getCommandCenter().pipe(
      catchError(err => {
        this.error.set(err?.error?.message || 'Unable to load storefront command center.');
        return of({ data: fallbackData });
      })
    ).subscribe((res: any) => {
      this.data.set({ ...fallbackData, ...(res?.data || {}) });
      this.loading.set(false);
    });
  }

  conversionRate(): number {
    const total = this.data().kpis.storefrontCustomers || 0;
    if (!total) return 0;
    return Math.round(((this.data().kpis.convertedCustomers || 0) / total) * 100);
  }

  statusWidth(count: number): number {
    return Math.max(2, Math.round((count / this.maxStatusCount()) * 100));
  }

  paymentWidth(count: number): number {
    return Math.max(2, Math.round((count / this.maxPaymentCount()) * 100));
  }

  label(value: string): string {
    return String(value || 'unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  customerName(order: any): string {
    const customer = order?.customerId;
    if (!customer) return 'Guest customer';
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
  }
}// import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
// import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { StorefrontAdminService } from '@core/services/storefront-admin.service';
// import { catchError, of } from 'rxjs';

// interface CommandCenterData {
//   generatedAt: string;
//   period: { label: string; since: string };
//   kpis: {
//     totalOrders: number;
//     grossRevenue: number;
//     averageOrderValue: number;
//     shippingRevenue: number;
//     storefrontCustomers: number;
//     convertedCustomers: number;
//     guestCustomers: number;
//     abandonedCarts: number;
//     unfulfilledAccepted: number;
//     ghostRisk: number;
//   };
//   byStatus: Array<{ _id: string; count: number; value: number }>;
//   byPayment: Array<{ _id: string; count: number; value: number }>;
//   pages: Array<{ _id: string; count: number; views: number }>;
//   recentOrders: any[];
//   workQueues: Array<{ key: string; title: string; count: number; severity: string; route: string }>;
// }

// const fallbackData: CommandCenterData = {
//   generatedAt: new Date().toISOString(),
//   period: { label: 'Last 30 days', since: new Date().toISOString() },
//   kpis: {
//     totalOrders: 0,
//     grossRevenue: 0,
//     averageOrderValue: 0,
//     shippingRevenue: 0,
//     storefrontCustomers: 0,
//     convertedCustomers: 0,
//     guestCustomers: 0,
//     abandonedCarts: 0,
//     unfulfilledAccepted: 0,
//     ghostRisk: 0
//   },
//   byStatus: [],
//   byPayment: [],
//   pages: [],
//   recentOrders: [],
//   workQueues: []
// };

// @Component({
//   selector: 'app-storefront-command-center',
//   standalone: true,
//   imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, DecimalPipe],
//   template: `
//     <main class="command-center">
//       <section class="hero">
//         <div>
//           <span class="eyebrow"><i class="pi pi-shop"></i> Storefront Command Center</span>
//           <h1>Commerce operations, sales health, and customer quality.</h1>
//           <p>Track storefront revenue, order lifecycle, fulfillment queues, customer conversion, invoice integrity, abandoned carts, and publishing health from one admin surface.</p>
//         </div>
//         <div class="hero-actions">
//           <a routerLink="../orders" class="hero-button primary"><i class="pi pi-shopping-bag"></i> Orders</a>
//           <a routerLink="../customers" class="hero-button"><i class="pi pi-users"></i> Customers</a>
//           <button type="button" class="icon-button" (click)="load()"><i class="pi pi-refresh" [class.pi-spin]="loading()"></i></button>
//         </div>
//       </section>

//       <section class="integrity-alert" [class.clean]="data().kpis.ghostRisk === 0">
//         <div>
//           <span class="eyebrow muted">Data integrity</span>
//           <h2>{{ data().kpis.ghostRisk === 0 ? 'No ghost-record risk detected' : data().kpis.ghostRisk + ' records need attention' }}</h2>
//           <p>Delivered storefront orders should be linked to CRM customers and invoices. This keeps customer history, accounting, stock, and analytics consistent.</p>
//         </div>
//         <a routerLink="../orders" class="hero-button primary">{{ data().kpis.ghostRisk === 0 ? 'Review orders' : 'Fix now' }}</a>
//       </section>

//       <section class="kpi-grid">
//         <article class="kpi-card">
//           <span>Gross storefront sales</span>
//           <strong>{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
//           <p>{{ data().period.label }} across accepted storefront orders</p>
//         </article>
//         <article class="kpi-card">
//           <span>Average order value</span>
//           <strong>{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
//           <p>Total order value divided by active order count</p>
//         </article>
//         <article class="kpi-card">
//           <span>Total orders</span>
//           <strong>{{ data().kpis.totalOrders | number }}</strong>
//           <p>All storefront order records for this organization</p>
//         </article>
//         <article class="kpi-card">
//           <span>Shipping revenue</span>
//           <strong>{{ data().kpis.shippingRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
//           <p>Customer shipping collected from storefront checkout</p>
//         </article>
//       </section>

//       <section class="ops-layout">
//         <article class="panel large">
//           <div class="panel-head">
//             <div>
//               <span class="eyebrow muted">Sales lifecycle</span>
//               <h2>Orders by status</h2>
//             </div>
//             <a routerLink="../orders">Open orders</a>
//           </div>
//           <div class="status-bars">
//             @for (item of data().byStatus; track item._id) {
//               <div class="bar-row">
//                 <div>
//                   <strong>{{ label(item._id) }}</strong>
//                   <span>{{ item.count }} orders · {{ item.value | currency:'INR':'symbol':'1.0-0' }}</span>
//                 </div>
//                 <div class="bar-track"><span [style.width.%]="statusWidth(item.count)"></span></div>
//               </div>
//             } @empty {
//               <div class="empty">No order lifecycle data yet.</div>
//             }
//           </div>
//         </article>

//         <article class="panel">
//           <div class="panel-head">
//             <div>
//               <span class="eyebrow muted">Customer actions</span>
//               <h2>Customer quality</h2>
//             </div>
//             <a routerLink="../customers">Open customers</a>
//           </div>
//           <div class="customer-meter">
//             <strong>{{ conversionRate() }}%</strong>
//             <span>CRM conversion</span>
//             <div><span [style.width.%]="conversionRate()"></span></div>
//           </div>
//           <div class="mini-list">
//             <div><span>Storefront customers</span><strong>{{ data().kpis.storefrontCustomers }}</strong></div>
//             <div><span>CRM linked</span><strong>{{ data().kpis.convertedCustomers }}</strong></div>
//             <div><span>Guest customers</span><strong>{{ data().kpis.guestCustomers }}</strong></div>
//           </div>
//         </article>
//       </section>

//       <section class="ops-layout bottom">
//         <article class="panel">
//           <div class="panel-head">
//             <div>
//               <span class="eyebrow muted">Work queues</span>
//               <h2>Needs action</h2>
//             </div>
//           </div>
//           <div class="queue-list">
//             @for (queue of data().workQueues; track queue.key) {
//               <a [routerLink]="queue.route" class="queue-row" [attr.data-severity]="queue.severity">
//                 <span>{{ queue.title }}</span>
//                 <strong>{{ queue.count }}</strong>
//               </a>
//             }
//           </div>
//         </article>

//         <article class="panel large">
//           <div class="panel-head">
//             <div>
//               <span class="eyebrow muted">Recent demand</span>
//               <h2>Latest storefront orders</h2>
//             </div>
//           </div>
//           <div class="orders-list">
//             @for (order of data().recentOrders; track order._id) {
//               <a routerLink="../orders" class="order-row">
//                 <div>
//                   <strong>{{ order.orderNumber }}</strong>
//                   <span>{{ customerName(order) }} · {{ order.createdAt | date:'mediumDate' }}</span>
//                 </div>
//                 <div>
//                   <span>{{ order.orderStatus }} / {{ order.fulfillmentStatus }}</span>
//                   <strong>{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</strong>
//                 </div>
//               </a>
//             } @empty {
//               <div class="empty">No recent storefront orders.</div>
//             }
//           </div>
//         </article>
//       </section>

//       <section class="ops-layout bottom">
//         <article class="panel">
//           <div class="panel-head">
//             <div>
//               <span class="eyebrow muted">Payments</span>
//               <h2>Payment mix</h2>
//             </div>
//           </div>
//           <div class="mini-list">
//             @for (payment of data().byPayment; track payment._id) {
//               <div><span>{{ label(payment._id) }}</span><strong>{{ payment.value | currency:'INR':'symbol':'1.0-0' }}</strong></div>
//             } @empty {
//               <div class="empty">No payment data.</div>
//             }
//           </div>
//         </article>

//         <article class="panel large">
//           <div class="panel-head">
//             <div>
//               <span class="eyebrow muted">Publishing health</span>
//               <h2>Storefront pages</h2>
//             </div>
//             <a routerLink="../pages">Open pages</a>
//           </div>
//           <div class="page-grid">
//             @for (page of data().pages; track page._id) {
//               <div>
//                 <span>{{ label(page._id) }}</span>
//                 <strong>{{ page.count }}</strong>
//                 <p>{{ page.views || 0 }} views</p>
//               </div>
//             } @empty {
//               <div class="empty">No storefront pages yet.</div>
//             }
//           </div>
//         </article>
//       </section>
//     </main>
//   `,
//   styleUrls: ['./storefront-command-center.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class StorefrontCommandCenterComponent implements OnInit {
//   private readonly route = inject(ActivatedRoute);
//   private readonly storefront = inject(StorefrontAdminService);

//   readonly surfaceKey = signal('overview');
//   readonly loading = signal(false);
//   readonly error = signal<string | null>(null);
//   readonly data = signal<CommandCenterData>(fallbackData);

//   readonly maxStatusCount = computed(() =>
//     Math.max(1, ...this.data().byStatus.map(item => item.count || 0))
//   );

//   ngOnInit(): void {
//     this.route.data.subscribe(data => {
//       this.surfaceKey.set(typeof data['surfaceKey'] === 'string' ? data['surfaceKey'] : 'overview');
//     });
//     this.load();
//   }

//   load(): void {
//     this.loading.set(true);
//     this.error.set(null);
//     this.storefront.getCommandCenter().pipe(
//       catchError(err => {
//         this.error.set(err?.error?.message || 'Unable to load storefront command center.');
//         return of({ data: fallbackData });
//       })
//     ).subscribe((res: any) => {
//       this.data.set({ ...fallbackData, ...(res?.data || {}) });
//       this.loading.set(false);
//     });
//   }

//   conversionRate(): number {
//     const total = this.data().kpis.storefrontCustomers || 0;
//     if (!total) return 0;
//     return Math.round(((this.data().kpis.convertedCustomers || 0) / total) * 100);
//   }

//   statusWidth(count: number): number {
//     return Math.max(8, Math.round((count / this.maxStatusCount()) * 100));
//   }

//   label(value: string): string {
//     return String(value || 'unknown')
//       .replace(/_/g, ' ')
//       .replace(/\b\w/g, char => char.toUpperCase());
//   }

//   customerName(order: any): string {
//     const customer = order?.customerId;
//     if (!customer) return 'Guest customer';
//     return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
//   }
// }
