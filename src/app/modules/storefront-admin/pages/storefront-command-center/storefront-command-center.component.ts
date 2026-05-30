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
      
      <header class="classic-header">
        <div class="header-titles">
          <div class="icon-brand"><i class="pi pi-sparkles"></i></div>
          <div>
            <h1>Command Center</h1>
            <p>{{ data().period.label }} · Synced {{ data().generatedAt | date:'shortTime' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <a routerLink="../orders" class="btn-pill outline"><i class="pi pi-shopping-bag"></i> Orders</a>
          <a routerLink="../customers" class="btn-pill outline"><i class="pi pi-users"></i> Customers</a>
          <button class="btn-pill primary icon-only" (click)="load()" [disabled]="loading()">
            <i class="pi pi-refresh" [class.pi-spin]="loading()"></i>
          </button>
        </div>
      </header>

      @if (data().kpis.ghostRisk > 0) {
        <div class="alert-banner error-kit">
          <div class="alert-content">
            <div class="alert-icon"><i class="pi pi-exclamation-circle"></i></div>
            <div class="alert-text">
              <h3>Action Needed: Data Sync</h3>
              <p>{{ data().kpis.ghostRisk }} delivered orders are missing CRM links or invoices. Fix to maintain ledger integrity.</p>
            </div>
          </div>
          <a routerLink="../orders" class="btn-pill solid-error">Review Now</a>
        </div>
      }

      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Gross Revenue</span>
            <div class="kpi-icon success-kit"><i class="pi pi-wallet"></i></div>
          </div>
          <strong class="kpi-value">{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Avg. Order Value</span>
            <div class="kpi-icon info-kit"><i class="pi pi-chart-pie"></i></div>
          </div>
          <strong class="kpi-value">{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Total Orders</span>
            <div class="kpi-icon primary-kit"><i class="pi pi-shopping-cart"></i></div>
          </div>
          <strong class="kpi-value">{{ data().kpis.totalOrders | number }}</strong>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Unfulfilled</span>
            <div class="kpi-icon warning-kit"><i class="pi pi-box"></i></div>
          </div>
          <strong class="kpi-value">{{ data().kpis.unfulfilledAccepted | number }}</strong>
        </div>
      </section>

      <section class="bento-layout">
        
        <div class="bento-main">
          <div class="classic-panel">
            <div class="panel-header">
              <h2>Recent Shipments</h2>
              <a routerLink="../orders" class="link-action">View All <i class="pi pi-arrow-right"></i></a>
            </div>
            
            <div class="table-wrapper">
              <table class="classic-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th class="align-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of data().recentOrders; track order._id) {
                    <tr>
                      <td>
                        <div class="customer-cell">
                          <div class="avatar" [style.background-color]="getAvatarColor(order)">
                            {{ getInitials(customerName(order)) }}
                          </div>
                          <div class="stack">
                            <span class="name">{{ customerName(order) }}</span>
                            <span class="order-num">{{ order.orderNumber }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="muted-cell">{{ order.createdAt | date:'MMM dd, HH:mm' }}</td>
                      <td>
                        <span class="status-badge" [attr.data-status]="order.fulfillmentStatus">
                          {{ order.fulfillmentStatus }}
                        </span>
                      </td>
                      <td class="align-right fw-bold">{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="empty-state">No recent orders to display.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="bento-side">
          
          <div class="classic-panel">
            <div class="panel-header">
              <h2>Action Queues</h2>
            </div>
            <div class="queue-list">
              @for (queue of data().workQueues; track queue.key) {
                <a [routerLink]="queue.route" class="queue-card" [attr.data-severity]="queue.severity">
                  <div class="queue-info">
                    <span class="q-title">{{ queue.title }}</span>
                  </div>
                  <span class="q-badge">{{ queue.count }}</span>
                </a>
              }
            </div>
          </div>

          <div class="classic-panel">
            <div class="panel-header">
              <h2>Fulfillment Status</h2>
            </div>
            <div class="progress-list">
              @for (item of data().byStatus; track item._id) {
                <div class="progress-item">
                  <div class="progress-labels">
                    <span class="p-name">{{ label(item._id) }}</span>
                    <span class="p-val">{{ item.count }}</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill gradient-accent" [style.width.%]="statusWidth(item.count)"></div>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">No status data available.</div>
              }
            </div>
          </div>

        </div>
      </section>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THE ULTIMATE CLASSIC UI - Fully mapped to provided tokens
       ========================================================================== */
    
    .dashboard-wrapper {
      background: var(--bg-secondary, #f4f7fb);
      min-height: 100vh;
      padding: var(--spacing-4xl, 2rem);
      font-family: var(--font-body, 'Inter', sans-serif);
      color: var(--text-primary, #0f172a);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4xl, 2rem);
    }

    /* Typography Utilities */
    h1, h2, h3 { font-family: var(--font-heading, sans-serif); margin: 0; }
    .fw-bold { font-weight: var(--font-weight-bold, 700); }
    .align-right { text-align: right; }
    .empty-state { padding: var(--spacing-3xl) 0; text-align: center; color: var(--text-muted, #64748b); font-size: var(--font-size-sm); }

    /* Header */
    .classic-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: var(--spacing-2xl);
    }
    .header-titles { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand {
      width: 48px; height: 48px; border-radius: var(--ui-border-radius-lg, 16px);
      background: var(--bg-primary, #fff); box-shadow: var(--elevation-1, 0 2px 8px rgba(0,0,0,0.05));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: var(--accent-primary, #6366f1);
    }
    .header-titles h1 { font-size: var(--font-size-3xl, 1.5rem); font-weight: var(--font-weight-bold, 700); color: var(--text-primary); }
    .header-titles p { margin: 4px 0 0 0; font-size: var(--font-size-sm, 0.85rem); color: var(--text-muted, #64748b); font-weight: var(--font-weight-medium, 500); }
    
    .header-actions { display: flex; gap: var(--spacing-md, 12px); }
    
    /* Beautiful Pill Buttons */
    .btn-pill {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 20px; border-radius: var(--ui-border-radius-pill, 9999px);
      font-size: var(--font-size-sm, 0.875rem); font-weight: var(--font-weight-semibold, 600);
      cursor: pointer; text-decoration: none; transition: var(--transition-base, all 0.2s);
      border: var(--ui-border-width, 1px) solid transparent;
    }
    .btn-pill.outline {
      background: var(--bg-primary, #fff); color: var(--text-primary, #0f172a);
      border-color: var(--border-primary, #e2e8f0); box-shadow: var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05));
    }
    .btn-pill.outline:hover { background: var(--bg-hover, #f8fafc); border-color: var(--border-secondary, #cbd5e1); }
    .btn-pill.primary {
      background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #4f46e5));
      color: #fff; box-shadow: 0 4px 12px var(--accent-focus, rgba(99, 102, 241, 0.3));
    }
    .btn-pill.primary:hover:not([disabled]) { transform: translateY(-2px); box-shadow: 0 6px 16px var(--accent-focus, rgba(99, 102, 241, 0.4)); }
    .btn-pill.icon-only { width: 42px; height: 42px; padding: 0; border-radius: 50%; }
    .btn-pill[disabled] { opacity: 0.6; cursor: not-allowed; }

    /* Color Full Kit Alert Banner */
    .alert-banner {
      border-radius: var(--ui-border-radius-xl, 24px); padding: var(--spacing-3xl, 20px) var(--spacing-4xl, 24px);
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
    }
    .error-kit { background: var(--color-error-bg, #fef2f2); border: var(--ui-border-width, 1px) solid var(--color-error-border, #fecaca); }
    .alert-content { display: flex; align-items: center; gap: var(--spacing-2xl, 16px); }
    .alert-icon { font-size: 2rem; color: var(--color-error, #ef4444); }
    .alert-text h3 { font-size: var(--font-size-md, 1rem); color: var(--color-error-dark, #991b1b); margin-bottom: 4px; }
    .alert-text p { margin: 0; font-size: var(--font-size-sm, 0.85rem); color: var(--color-error, #dc2626); }
    .btn-pill.solid-error { background: var(--color-error, #ef4444); color: white; }

    /* Semantic Color Kits for Icons */
    .success-kit { background: var(--color-success-bg, #dcfce7); color: var(--color-success, #10b981); }
    .info-kit { background: var(--color-info-bg, #e0f2fe); color: var(--color-info, #3b82f6); }
    .primary-kit { background: var(--color-primary-bg, #e0e7ff); color: var(--accent-primary, #6366f1); }
    .warning-kit { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning, #f59e0b); }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--spacing-3xl, 24px); }
    .kpi-card {
      background: var(--bg-primary, #fff); border-radius: var(--ui-border-radius-xl, 24px);
      padding: var(--spacing-3xl, 24px); border: var(--ui-border-width, 1px) solid var(--border-primary, #f1f5f9);
      box-shadow: var(--elevation-1, 0 4px 6px -1px rgba(0,0,0,0.05));
      display: flex; flex-direction: column; gap: var(--spacing-xl, 16px);
      transition: var(--transition-base, all 0.2s);
    }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: var(--elevation-2, 0 10px 15px -3px rgba(0,0,0,0.1)); }
    .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-label { font-size: var(--font-size-sm, 0.85rem); font-weight: var(--font-weight-semibold, 600); color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-icon { width: 48px; height: 48px; border-radius: var(--ui-border-radius-lg, 16px); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-value { font-size: var(--font-size-4xl, 2rem); font-weight: var(--font-weight-bold, 800); color: var(--text-primary, #0f172a); line-height: 1; }

    /* Bento Layout Panels */
    .bento-layout { display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-3xl, 24px); }
    @media (max-width: 1024px) { .bento-layout { grid-template-columns: 1fr; } }
    .bento-main, .bento-side { display: flex; flex-direction: column; gap: var(--spacing-3xl, 24px); }

    .classic-panel {
      background: var(--bg-primary, #fff); border-radius: var(--ui-border-radius-xl, 28px);
      border: var(--ui-border-width, 1px) solid var(--border-primary, #f1f5f9);
      box-shadow: var(--elevation-1, 0 4px 6px -1px rgba(0,0,0,0.05)); overflow: hidden;
    }
    .panel-header {
      padding: var(--spacing-3xl, 24px); display: flex; justify-content: space-between; align-items: center;
      border-bottom: var(--ui-border-width, 1px) solid var(--border-primary, #f1f5f9);
    }
    .panel-header h2 { font-size: var(--font-size-lg, 1.1rem); font-weight: var(--font-weight-bold, 700); color: var(--text-primary); }
    .link-action { font-size: var(--font-size-sm, 0.85rem); font-weight: var(--font-weight-semibold, 600); color: var(--accent-primary, #6366f1); text-decoration: none; display: flex; align-items: center; gap: 4px; }
    .link-action:hover { color: var(--accent-hover, #4f46e5); }

    /* Classic Table */
    .table-wrapper { overflow-x: auto; }
    .classic-table { width: 100%; border-collapse: collapse; text-align: left; }
    .classic-table th {
      padding: var(--spacing-xl, 16px) var(--spacing-3xl, 24px);
      font-size: var(--font-size-xs, 0.75rem); font-weight: var(--font-weight-bold, 700);
      color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.5px;
      background: var(--bg-secondary, #f8fafc);
    }
    .classic-table td {
      padding: var(--spacing-xl, 16px) var(--spacing-3xl, 24px);
      border-bottom: var(--ui-border-width, 1px) solid var(--border-primary, #f1f5f9);
      font-size: var(--font-size-sm, 0.9rem); vertical-align: middle;
    }
    .classic-table tr:hover td { background: var(--bg-hover, #f8fafc); }
    .classic-table tr:last-child td { border-bottom: none; }

    .customer-cell { display: flex; align-items: center; gap: var(--spacing-xl, 16px); }
    .avatar {
      width: 40px; height: 40px; border-radius: var(--ui-border-radius-pill, 50%);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: var(--font-weight-bold, 700); font-size: var(--font-size-sm, 0.85rem);
      box-shadow: var(--shadow-sm);
    }
    .stack { display: flex; flex-direction: column; gap: 2px; }
    .name { font-weight: var(--font-weight-bold, 700); color: var(--text-primary); }
    .order-num { font-family: var(--font-mono, monospace); font-size: var(--font-size-xs, 0.75rem); color: var(--text-muted); }
    .muted-cell { color: var(--text-muted); font-weight: var(--font-weight-medium, 500); }

    /* Colorful Pill Badges */
    .status-badge {
      font-size: var(--font-size-xs, 0.7rem); font-weight: var(--font-weight-bold, 800);
      text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 12px;
      border-radius: var(--ui-border-radius-pill, 9999px); white-space: nowrap;
      display: inline-block;
    }
    .status-badge[data-status="unfulfilled"] { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning-dark, #b45309); }
    .status-badge[data-status="shipped"] { background: var(--color-info-bg, #e0f2fe); color: var(--color-info-dark, #0369a1); }
    .status-badge[data-status="delivered"] { background: var(--color-success-bg, #dcfce7); color: var(--color-success-dark, #047857); }

    /* Action Queues */
    .queue-list { padding: var(--spacing-2xl, 16px); display: flex; flex-direction: column; gap: var(--spacing-md, 12px); }
    .queue-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--spacing-xl, 16px); border-radius: var(--ui-border-radius-lg, 16px);
      text-decoration: none; border: var(--ui-border-width, 1px) solid transparent;
      transition: var(--transition-base, all 0.2s);
    }
    .queue-card:hover { transform: translateX(4px); box-shadow: var(--elevation-1); }
    .q-title { font-size: var(--font-size-sm, 0.9rem); font-weight: var(--font-weight-bold, 700); }
    .q-badge { font-size: var(--font-size-xs, 0.8rem); font-weight: var(--font-weight-bold, 800); padding: 4px 12px; border-radius: var(--ui-border-radius-pill, 9999px); }

    .queue-card[data-severity="danger"] { background: var(--color-error-bg, #fef2f2); border-color: var(--color-error-border, #fecaca); }
    .queue-card[data-severity="danger"] .q-title { color: var(--color-error-dark, #991b1b); }
    .queue-card[data-severity="danger"] .q-badge { background: var(--color-error, #ef4444); color: white; }

    .queue-card[data-severity="warning"] { background: var(--color-warning-bg, #fffbeb); border-color: var(--color-warning-border, #fde68a); }
    .queue-card[data-severity="warning"] .q-title { color: var(--color-warning-dark, #92400e); }
    .queue-card[data-severity="warning"] .q-badge { background: var(--color-warning, #f59e0b); color: white; }

    .queue-card[data-severity="success"] { background: var(--color-success-bg, #f0fdf4); border-color: var(--color-success-border, #bbf7d0); }
    .queue-card[data-severity="success"] .q-title { color: var(--color-success-dark, #166534); }
    .queue-card[data-severity="success"] .q-badge { background: var(--color-success, #10b981); color: white; }

    /* Progress Bars */
    .progress-list { padding: var(--spacing-3xl, 24px); display: flex; flex-direction: column; gap: var(--spacing-2xl, 20px); }
    .progress-item { display: flex; flex-direction: column; gap: 8px; }
    .progress-labels { display: flex; justify-content: space-between; align-items: center; }
    .p-name { font-size: var(--font-size-sm, 0.85rem); font-weight: var(--font-weight-bold, 700); color: var(--text-primary); }
    .p-val { font-size: var(--font-size-xs, 0.8rem); font-weight: var(--font-weight-bold, 700); color: var(--text-muted); }
    
    .progress-track { width: 100%; height: 10px; background: var(--bg-secondary, #f1f5f9); border-radius: var(--ui-border-radius-pill, 9999px); overflow: hidden; }
    .progress-fill { height: 100%; border-radius: var(--ui-border-radius-pill, 9999px); transition: width 0.8s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .gradient-accent { background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #a855f7)); }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontCommandCenterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontAdminService);

  readonly surfaceKey = signal('overview');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<CommandCenterData>(fallbackData);

  readonly maxStatusCount = computed(() =>
    Math.max(1, ...this.data().byStatus.map(item => item.count || 0))
  );

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.surfaceKey.set(typeof data['surfaceKey'] === 'string' ? data['surfaceKey'] : 'overview');
    });
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

  statusWidth(count: number): number {
    return Math.max(4, Math.round((count / this.maxStatusCount()) * 100));
  }

  label(value: string): string {
    return String(value || 'unknown')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  customerName(order: any): string {
    const customer = order?.customerId;
    if (!customer) return 'Guest Customer';
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
  }

  getInitials(name: string): string {
    if (!name || name === 'Guest Customer') return 'G';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Generates a consistent pleasant color based on the order ID for the avatar
  getAvatarColor(order: any): string {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
    if (!order || !order._id) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < order._id.length; i++) {
      hash = order._id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}


// import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
// import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { StorefrontAdminService } from '@core/services/storefront-admin.service';
// import { catchError, of } from 'rxjs';

// export interface CommandCenterData {
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
//     totalOrders: 0, grossRevenue: 0, averageOrderValue: 0, shippingRevenue: 0,
//     storefrontCustomers: 0, convertedCustomers: 0, guestCustomers: 0,
//     abandonedCarts: 0, unfulfilledAccepted: 0, ghostRisk: 0
//   },
//   byStatus: [], byPayment: [], pages: [], recentOrders: [], workQueues: []
// };

// @Component({
//   selector: 'app-storefront-command-center',
//   standalone: true,
//   imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, DecimalPipe],
//   template: `
//     <div class="dashboard-root">
      
//       <header class="top-nav">
//         <div class="nav-left">
//           <div class="brand-logo">
//             <i class="pi pi-objects"></i>
//           </div>
//           <div class="page-titles">
//             <h1>Command Center</h1>
//             <p>{{ data().period.label }} Overview</p>
//           </div>
//         </div>
//         <div class="nav-right">
//           <a routerLink="../orders" class="nav-btn ghost">Orders</a>
//           <a routerLink="../customers" class="nav-btn ghost">Customers</a>
//           <button class="nav-btn primary icon-only" (click)="load()" [disabled]="loading()">
//             <i class="pi pi-refresh" [class.pi-spin]="loading()"></i>
//           </button>
//         </div>
//       </header>

//       <main class="dashboard-content">

//         @if (data().kpis.ghostRisk > 0) {
//           <div class="alert-card">
//             <div class="alert-info">
//               <div class="alert-icon"><i class="pi pi-exclamation-triangle"></i></div>
//               <div>
//                 <h3>Action Required: Data Integrity</h3>
//                 <p>{{ data().kpis.ghostRisk }} delivered orders are missing CRM customer links or invoices.</p>
//               </div>
//             </div>
//             <a routerLink="../orders" class="nav-btn outline-danger">Fix Records</a>
//           </div>
//         }

//         <div class="kpi-row">
//           <div class="kpi-card">
//             <div class="kpi-icon"><i class="pi pi-wallet"></i></div>
//             <div class="kpi-data">
//               <span class="kpi-label">Gross Revenue</span>
//               <strong class="kpi-value">{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
//             </div>
//           </div>
//           <div class="kpi-card">
//             <div class="kpi-icon blue"><i class="pi pi-chart-line"></i></div>
//             <div class="kpi-data">
//               <span class="kpi-label">Avg. Order Value</span>
//               <strong class="kpi-value">{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
//             </div>
//           </div>
//           <div class="kpi-card">
//             <div class="kpi-icon purple"><i class="pi pi-shopping-bag"></i></div>
//             <div class="kpi-data">
//               <span class="kpi-label">Total Orders</span>
//               <strong class="kpi-value">{{ data().kpis.totalOrders | number }}</strong>
//             </div>
//           </div>
//           <div class="kpi-card">
//             <div class="kpi-icon orange"><i class="pi pi-box"></i></div>
//             <div class="kpi-data">
//               <span class="kpi-label">Unfulfilled</span>
//               <strong class="kpi-value">{{ data().kpis.unfulfilledAccepted | number }}</strong>
//             </div>
//           </div>
//         </div>

//         <div class="bento-grid">
          
//           <div class="bento-main">
//             <div class="soft-panel">
//               <div class="panel-head">
//                 <h2>Recent Orders</h2>
//                 <a routerLink="../orders" class="link-muted">View all</a>
//               </div>
              
//               <div class="list-container">
//                 <div class="list-header">
//                   <div class="col-id">Order Info</div>
//                   <div class="col-date">Date</div>
//                   <div class="col-status">Status</div>
//                   <div class="col-total">Total</div>
//                   <div class="col-action"></div>
//                 </div>

//                 <div class="list-body">
//                   @for (order of data().recentOrders; track order._id) {
//                     <div class="list-row">
//                       <div class="col-id">
//                         <div class="avatar"><i class="pi pi-user"></i></div>
//                         <div class="stack">
//                           <strong class="text-main">{{ customerName(order) }}</strong>
//                           <span class="text-mono">{{ order.orderNumber }}</span>
//                         </div>
//                       </div>
//                       <div class="col-date text-muted">{{ order.createdAt | date:'MMM dd, HH:mm' }}</div>
//                       <div class="col-status">
//                         <span class="pill" [attr.data-status]="order.fulfillmentStatus">{{ order.fulfillmentStatus }}</span>
//                       </div>
//                       <div class="col-total">
//                         <strong class="text-main">{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</strong>
//                       </div>
//                       <div class="col-action">
//                         <button class="nav-btn ghost icon-only"><i class="pi pi-ellipsis-v"></i></button>
//                       </div>
//                     </div>
//                   } @empty {
//                     <div class="empty-state">
//                       <i class="pi pi-inbox"></i>
//                       <p>No recent orders found.</p>
//                     </div>
//                   }
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="bento-side">
            
//             <div class="soft-panel summary-panel">
//               <div class="panel-head">
//                 <h2>Work Queues</h2>
//               </div>
//               <div class="summary-list">
//                 @for (queue of data().workQueues; track queue.key) {
//                   <a [routerLink]="queue.route" class="summary-item" [attr.data-severity]="queue.severity">
//                     <span class="item-name">{{ queue.title }}</span>
//                     <span class="item-value badge">{{ queue.count }}</span>
//                   </a>
//                 }
//               </div>
//             </div>

//             <div class="soft-panel summary-panel">
//               <div class="panel-head">
//                 <h2>Orders by Status</h2>
//               </div>
//               <div class="metrics-list">
//                 @for (item of data().byStatus; track item._id) {
//                   <div class="metric-item">
//                     <div class="metric-labels">
//                       <span class="m-title">{{ label(item._id) }}</span>
//                       <span class="m-val">{{ item.count }} ({{ item.value | currency:'INR':'symbol':'1.0-0' }})</span>
//                     </div>
//                     <div class="progress-bg">
//                       <div class="progress-fill" [style.width.%]="statusWidth(item.count)"></div>
//                     </div>
//                   </div>
//                 } @empty {
//                   <div class="empty-state sm">No status data</div>
//                 }
//               </div>
//             </div>

//             <div class="soft-panel summary-panel">
//               <div class="panel-head">
//                 <h2>Customer CRM Conversion</h2>
//               </div>
//               <div class="conversion-wrap">
//                 <div class="meter-circle">
//                   <span>{{ conversionRate() }}%</span>
//                 </div>
//                 <div class="conversion-stats">
//                   <div>
//                     <span class="c-val">{{ data().kpis.storefrontCustomers }}</span>
//                     <span class="c-lbl">Total Checkouts</span>
//                   </div>
//                   <div>
//                     <span class="c-val">{{ data().kpis.guestCustomers }}</span>
//                     <span class="c-lbl">Unlinked Guests</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        "SOFT BENTO" THEME - Built on Canonical Tokens
//        ========================================================================== */
//     :root {
//       --bg-app: var(--bg-ternary, #f3f5f9);
//       --bg-surface: var(--bg-primary, #ffffff);
      
//       --text-bold: var(--text-primary, #111827);
//       --text-medium: var(--text-secondary, #4b5563);
//       --text-light: var(--text-tertiary, #9ca3af);
      
//       --accent: var(--accent-primary, #f97316); /* Utilizing ShipStat-like orange/red by default if no token */
//       --accent-soft: var(--accent-focus, #ffedd5);
      
//       --border-soft: var(--border-secondary, #f3f4f6);
      
//       --radius-xl: 24px;
//       --radius-lg: 20px;
//       --radius-md: 14px;
//       --radius-sm: 10px;
//       --radius-pill: 999px;
      
//       --shadow-float: 0 10px 40px -10px rgba(15, 23, 42, 0.06);
//       --shadow-inner: 0 2px 4px rgba(15, 23, 42, 0.02);
//     }

//     .dashboard-root {
//       background-color: var(--bg-app);
//       min-height: 100vh;
//       font-family: var(--font-heading, 'Plus Jakarta Sans', system-ui, sans-serif);
//       color: var(--text-bold);
//     }

//     /* Top Navigation (Floating & Clean) */
//     .top-nav {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 24px 40px;
//       background: var(--bg-app);
//     }
//     .nav-left { display: flex; align-items: center; gap: 16px; }
//     .brand-logo {
//       width: 48px; height: 48px; border-radius: var(--radius-md);
//       background: var(--bg-surface); box-shadow: var(--shadow-float);
//       display: flex; align-items: center; justify-content: center;
//       font-size: 1.5rem; color: var(--accent);
//     }
//     .page-titles h1 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
//     .page-titles p { margin: 0; font-size: 0.85rem; color: var(--text-light); font-weight: 500; }
    
//     .nav-right { display: flex; gap: 12px; }
//     .nav-btn {
//       padding: 10px 20px; border-radius: var(--radius-pill); font-size: 0.85rem; font-weight: 700;
//       border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
//       transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
//     }
//     .nav-btn.primary { background: var(--accent); color: white; box-shadow: 0 8px 20px -6px var(--accent); }
//     .nav-btn.primary:hover:not([disabled]) { transform: translateY(-2px); filter: brightness(1.1); }
//     .nav-btn.ghost { background: var(--bg-surface); color: var(--text-bold); box-shadow: var(--shadow-inner); }
//     .nav-btn.ghost:hover { box-shadow: var(--shadow-float); }
//     .nav-btn.icon-only { width: 40px; height: 40px; padding: 0; border-radius: 50%; }

//     /* Dashboard Content Padding */
//     .dashboard-content { padding: 0 40px 40px 40px; display: flex; flex-direction: column; gap: 24px; max-width: 1400px; margin: 0 auto; }

//     /* Alert Card */
//     .alert-card {
//       background: #fff1f2; border-radius: var(--radius-lg); padding: 20px 24px;
//       display: flex; justify-content: space-between; align-items: center;
//       box-shadow: var(--shadow-float);
//     }
//     .alert-info { display: flex; align-items: center; gap: 16px; }
//     .alert-icon { width: 48px; height: 48px; border-radius: 50%; background: #ffe4e6; color: #e11d48; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
//     .alert-info h3 { margin: 0 0 4px 0; color: #9f1239; font-size: 1.1rem; font-weight: 700; }
//     .alert-info p { margin: 0; color: #be123c; font-size: 0.9rem; font-weight: 500; }
//     .outline-danger { background: transparent; border: 2px solid #fda4af; color: #e11d48; }
//     .outline-danger:hover { background: #ffe4e6; }

//     /* KPI Row */
//     .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
//     .kpi-card {
//       background: var(--bg-surface); border-radius: var(--radius-xl); padding: 24px;
//       display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-float);
//       transition: transform 0.2s ease;
//     }
//     .kpi-card:hover { transform: translateY(-4px); }
    
//     .kpi-icon { width: 56px; height: 56px; border-radius: var(--radius-md); background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
//     .kpi-icon.blue { background: #e0e7ff; color: #4f46e5; }
//     .kpi-icon.purple { background: #fae8ff; color: #e11d48; }
//     .kpi-icon.orange { background: #ffedd5; color: #ea580c; }
    
//     .kpi-data { display: flex; flex-direction: column; gap: 4px; }
//     .kpi-label { font-size: 0.8rem; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; }
//     .kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text-bold); line-height: 1; }

//     /* Bento Grid */
//     .bento-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
//     @media (max-width: 1024px) { .bento-grid { grid-template-columns: 1fr; } }
    
//     .bento-main, .bento-side { display: flex; flex-direction: column; gap: 24px; }

//     /* Soft Panels */
//     .soft-panel { background: var(--bg-surface); border-radius: var(--radius-xl); padding: 28px; box-shadow: var(--shadow-float); }
//     .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
//     .panel-head h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-bold); }
//     .link-muted { color: var(--text-light); font-size: 0.85rem; font-weight: 700; text-decoration: none; transition: color 0.2s; }
//     .link-muted:hover { color: var(--text-bold); }

//     /* List Layout (Cart Style) */
//     .list-container { display: flex; flex-direction: column; }
//     .list-header { display: flex; align-items: center; padding-bottom: 16px; border-bottom: 2px solid var(--border-soft); margin-bottom: 8px; }
//     .list-header > div { font-size: 0.8rem; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; }
    
//     .list-body { display: flex; flex-direction: column; }
//     .list-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border-soft); transition: background 0.2s; }
//     .list-row:last-child { border-bottom: none; }
//     .list-row:hover { background: #fafafa; border-radius: var(--radius-md); padding-left: 8px; padding-right: 8px; margin: 0 -8px; }
    
//     .col-id { flex: 2; display: flex; align-items: center; gap: 16px; }
//     .col-date { flex: 1.5; font-size: 0.85rem; font-weight: 600; }
//     .col-status { flex: 1; }
//     .col-total { flex: 1; text-align: right; font-size: 1rem; }
//     .col-action { flex: 0.5; display: flex; justify-content: flex-end; }

//     .avatar { width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--bg-app); display: flex; align-items: center; justify-content: center; color: var(--text-medium); }
//     .stack { display: flex; flex-direction: column; gap: 2px; }
//     .text-main { font-weight: 700; color: var(--text-bold); }
//     .text-mono { font-family: var(--font-mono, monospace); font-size: 0.8rem; color: var(--text-light); font-weight: 600; }
//     .text-muted { color: var(--text-light); }

//     /* Pills / Badges */
//     .pill { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 12px; border-radius: var(--radius-pill); }
//     .pill[data-status="unfulfilled"] { background: #fffbeb; color: #b45309; }
//     .pill[data-status="shipped"] { background: #e0e7ff; color: #4338ca; }
//     .pill[data-status="delivered"] { background: #dcfce7; color: #059669; }

//     /* Summary Lists (Right Panel) */
//     .summary-panel { padding: 24px; }
//     .summary-list { display: flex; flex-direction: column; gap: 12px; }
//     .summary-item {
//       display: flex; justify-content: space-between; align-items: center;
//       padding: 14px 16px; border-radius: var(--radius-lg); text-decoration: none;
//       border: 1px solid var(--border-soft); transition: all 0.2s;
//     }
//     .summary-item:hover { transform: scale(1.02); box-shadow: var(--shadow-float); }
//     .item-name { font-size: 0.85rem; font-weight: 700; color: var(--text-medium); }
//     .item-value.badge { font-size: 0.8rem; font-weight: 800; padding: 4px 12px; border-radius: var(--radius-pill); }
    
//     .summary-item[data-severity="danger"] { background: #fff1f2; border-color: #ffe4e6; }
//     .summary-item[data-severity="danger"] .item-name { color: #e11d48; }
//     .summary-item[data-severity="danger"] .badge { background: #e11d48; color: white; }
    
//     .summary-item[data-severity="warning"] { background: #fff7ed; border-color: #ffedd5; }
//     .summary-item[data-severity="warning"] .item-name { color: #ea580c; }
//     .summary-item[data-severity="warning"] .badge { background: #ea580c; color: white; }

//     .summary-item[data-severity="success"] { background: #f0fdf4; border-color: #dcfce7; }
//     .summary-item[data-severity="success"] .item-name { color: #059669; }
//     .summary-item[data-severity="success"] .badge { background: #059669; color: white; }

//     /* Metrics Progress Bars */
//     .metrics-list { display: flex; flex-direction: column; gap: 16px; }
//     .metric-item { display: flex; flex-direction: column; gap: 8px; }
//     .metric-labels { display: flex; justify-content: space-between; align-items: flex-end; }
//     .m-title { font-size: 0.85rem; font-weight: 700; color: var(--text-medium); }
//     .m-val { font-size: 0.75rem; font-weight: 600; color: var(--text-light); }
//     .progress-bg { width: 100%; height: 8px; background: var(--border-soft); border-radius: var(--radius-pill); overflow: hidden; }
//     .progress-fill { height: 100%; background: var(--accent); border-radius: var(--radius-pill); transition: width 0.6s cubic-bezier(0.2, 0.9, 0.2, 1); }

//     /* Conversion Wrap */
//     .conversion-wrap { display: flex; align-items: center; gap: 24px; }
//     .meter-circle {
//       width: 100px; height: 100px; border-radius: 50%;
//       border: 8px solid var(--accent-soft);
//       display: flex; align-items: center; justify-content: center;
//       border-top-color: var(--accent); border-right-color: var(--accent);
//       transform: rotate(-45deg); /* Simple CSS trick for a meter look */
//     }
//     .meter-circle span { transform: rotate(45deg); font-size: 1.5rem; font-weight: 800; color: var(--accent); }
//     .conversion-stats { display: flex; flex-direction: column; gap: 16px; flex: 1; }
//     .conversion-stats > div { display: flex; flex-direction: column; gap: 2px; }
//     .c-val { font-size: 1.25rem; font-weight: 800; color: var(--text-bold); }
//     .c-lbl { font-size: 0.75rem; font-weight: 700; color: var(--text-light); text-transform: uppercase; }

//     /* Empty States */
//     .empty-state { padding: 40px 20px; text-align: center; color: var(--text-light); }
//     .empty-state i { font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5; }
//     .empty-state.sm { padding: 20px; font-size: 0.85rem; font-weight: 600; }

//     @media (max-width: 768px) {
//       .top-nav { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px; }
//       .dashboard-content { padding: 0 20px 20px 20px; }
//       .list-header { display: none; } /* Hide table headers on mobile */
//       .list-row { flex-direction: column; align-items: flex-start; gap: 12px; }
//       .col-total { text-align: left; }
//       .conversion-wrap { flex-direction: column; }
//     }
//   `],
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
//     return Math.max(4, Math.round((count / this.maxStatusCount()) * 100));
//   }

//   label(value: string): string {
//     return String(value || 'unknown')
//       .replace(/_/g, ' ')
//       .replace(/\b\w/g, char => char.toUpperCase());
//   }

//   customerName(order: any): string {
//     const customer = order?.customerId;
//     if (!customer) return 'Guest';
//     return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
//   }
// }// import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
// // import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
// // import { ActivatedRoute, RouterModule } from '@angular/router';
// // import { StorefrontAdminService } from '@core/services/storefront-admin.service';
// // import { catchError, of } from 'rxjs';

// // export interface CommandCenterData {
// //   generatedAt: string;
// //   period: { label: string; since: string };
// //   kpis: {
// //     totalOrders: number;
// //     grossRevenue: number;
// //     averageOrderValue: number;
// //     shippingRevenue: number;
// //     storefrontCustomers: number;
// //     convertedCustomers: number;
// //     guestCustomers: number;
// //     abandonedCarts: number;
// //     unfulfilledAccepted: number;
// //     ghostRisk: number;
// //   };
// //   byStatus: Array<{ _id: string; count: number; value: number }>;
// //   byPayment: Array<{ _id: string; count: number; value: number }>;
// //   pages: Array<{ _id: string; count: number; views: number }>;
// //   recentOrders: any[];
// //   workQueues: Array<{ key: string; title: string; count: number; severity: string; route: string }>;
// // }

// // const fallbackData: CommandCenterData = {
// //   generatedAt: new Date().toISOString(),
// //   period: { label: 'Last 30 days', since: new Date().toISOString() },
// //   kpis: {
// //     totalOrders: 0, grossRevenue: 0, averageOrderValue: 0, shippingRevenue: 0,
// //     storefrontCustomers: 0, convertedCustomers: 0, guestCustomers: 0,
// //     abandonedCarts: 0, unfulfilledAccepted: 0, ghostRisk: 0
// //   },
// //   byStatus: [], byPayment: [], pages: [], recentOrders: [], workQueues: []
// // };

// // @Component({
// //   selector: 'app-storefront-command-center',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, DecimalPipe],
// //   template: `
// //     <div class="dashboard-wrapper">
      
// //       <header class="dash-header">
// //         <div class="header-left">
// //           <h1>Storefront Command Center</h1>
// //           <p class="text-muted">
// //             {{ data().period.label }} · Last synced {{ data().generatedAt | date:'MMM d, h:mm a' }}
// //           </p>
// //         </div>
// //         <div class="header-actions">
// //           <a routerLink="../orders" class="btn-secondary"><i class="pi pi-shopping-bag"></i> All Orders</a>
// //           <a routerLink="../customers" class="btn-secondary"><i class="pi pi-users"></i> Customers</a>
// //           <button type="button" class="btn-primary icon-only" (click)="load()" [disabled]="loading()">
// //             <i class="pi pi-refresh" [class.pi-spin]="loading()"></i>
// //           </button>
// //         </div>
// //       </header>

// //       <div class="integrity-banner" *ngIf="data().kpis.ghostRisk > 0">
// //         <div class="banner-content">
// //           <div class="banner-icon"><i class="pi pi-exclamation-triangle"></i></div>
// //           <div>
// //             <h4 class="banner-title">Data Integrity Warning</h4>
// //             <p class="banner-desc">{{ data().kpis.ghostRisk }} delivered orders are missing CRM customer links or invoices. Action required to maintain accounting sync.</p>
// //           </div>
// //         </div>
// //         <a routerLink="../orders" class="btn-danger-outline">Review Records</a>
// //       </div>

// //       <section class="kpi-grid">
// //         <div class="kpi-card">
// //           <span class="kpi-label">Gross Revenue</span>
// //           <strong class="kpi-value">{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
// //         </div>
// //         <div class="kpi-card">
// //           <span class="kpi-label">Avg. Order Value</span>
// //           <strong class="kpi-value">{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
// //         </div>
// //         <div class="kpi-card">
// //           <span class="kpi-label">Total Orders</span>
// //           <strong class="kpi-value">{{ data().kpis.totalOrders | number }}</strong>
// //         </div>
// //         <div class="kpi-card">
// //           <span class="kpi-label">Unfulfilled</span>
// //           <strong class="kpi-value text-warning">{{ data().kpis.unfulfilledAccepted | number }}</strong>
// //         </div>
// //       </section>

// //       <div class="bento-layout">
        
// //         <div class="bento-main">
          
// //           <div class="pro-panel">
// //             <div class="panel-header">
// //               <h2>Action Queues</h2>
// //             </div>
// //             <div class="queue-list">
// //               <a *ngFor="let queue of data().workQueues" [routerLink]="queue.route" class="queue-item" [attr.data-severity]="queue.severity">
// //                 <span class="queue-title">{{ queue.title }}</span>
// //                 <span class="queue-badge">{{ queue.count }}</span>
// //               </a>
// //             </div>
// //           </div>

// //           <div class="pro-panel table-panel">
// //             <div class="panel-header">
// //               <h2>Recent Storefront Orders</h2>
// //               <a routerLink="../orders" class="link-btn">View All</a>
// //             </div>
            
// //             <div class="table-container">
// //               <table class="pro-table">
// //                 <thead>
// //                   <tr>
// //                     <th>Order ID</th>
// //                     <th>Customer</th>
// //                     <th>Date</th>
// //                     <th>Status</th>
// //                     <th class="text-right">Total</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   <tr *ngFor="let order of data().recentOrders">
// //                     <td class="font-mono fw-600">{{ order.orderNumber }}</td>
// //                     <td>
// //                       <div class="cell-stacked">
// //                         <span class="fw-500">{{ customerName(order) }}</span>
// //                         <span class="text-muted text-xs">{{ order.customerId?.email || 'Guest' }}</span>
// //                       </div>
// //                     </td>
// //                     <td class="text-muted">{{ order.createdAt | date:'dd MMM, HH:mm' }}</td>
// //                     <td>
// //                       <span class="status-pill" [attr.data-status]="order.fulfillmentStatus">
// //                         {{ order.fulfillmentStatus }}
// //                       </span>
// //                     </td>
// //                     <td class="text-right fw-600">{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</td>
// //                   </tr>
// //                   <tr *ngIf="data().recentOrders.length === 0">
// //                     <td colspan="5" class="empty-state">No recent orders found.</td>
// //                   </tr>
// //                 </tbody>
// //               </table>
// //             </div>
// //           </div>
          
// //         </div>

// //         <div class="bento-side">
          
// //           <div class="pro-panel">
// //             <div class="panel-header">
// //               <h2>Orders by Status</h2>
// //             </div>
// //             <div class="stat-bars">
// //               <div class="stat-row" *ngFor="let item of data().byStatus">
// //                 <div class="stat-labels">
// //                   <span class="stat-name">{{ label(item._id) }}</span>
// //                   <span class="stat-count">{{ item.count }} orders ({{ item.value | currency:'INR':'symbol':'1.0-0' }})</span>
// //                 </div>
// //                 <div class="progress-track">
// //                   <div class="progress-fill" [style.width.%]="statusWidth(item.count)"></div>
// //                 </div>
// //               </div>
// //               <div *ngIf="data().byStatus.length === 0" class="empty-state">No data</div>
// //             </div>
// //           </div>

// //           <div class="pro-panel">
// //             <div class="panel-header">
// //               <h2>Payment Mix</h2>
// //             </div>
// //             <div class="stat-bars">
// //               <div class="stat-row" *ngFor="let payment of data().byPayment">
// //                 <div class="stat-labels">
// //                   <span class="stat-name">{{ label(payment._id) }}</span>
// //                   <span class="stat-count">{{ payment.count }} orders</span>
// //                 </div>
// //                 <div class="progress-track">
// //                   <div class="progress-fill bg-success" [style.width.%]="paymentWidth(payment.count)"></div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="pro-panel">
// //             <div class="panel-header">
// //               <h2>Customer Conversion</h2>
// //             </div>
// //             <div class="conversion-block">
// //               <div class="conversion-hero">
// //                 <span class="hero-val">{{ conversionRate() }}%</span>
// //                 <span class="text-muted text-sm">CRM Linked</span>
// //               </div>
// //               <div class="conversion-metrics">
// //                 <div class="metric">
// //                   <span class="val">{{ data().kpis.storefrontCustomers }}</span>
// //                   <span class="lbl">Total Checkouts</span>
// //                 </div>
// //                 <div class="metric">
// //                   <span class="val">{{ data().kpis.guestCustomers }}</span>
// //                   <span class="lbl">Guest / Unlinked</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //         </div>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     :root {
// //       --bg-body: #f8fafc;
// //       --bg-card: #ffffff;
// //       --border: #e2e8f0;
// //       --text-main: #0f172a;
// //       --text-muted: #64748b;
// //       --primary: #2563eb;
// //       --primary-hover: #1d4ed8;
// //       --success: #10b981;
// //       --warning: #f59e0b;
// //       --danger: #ef4444;
// //       --radius-sm: 6px;
// //       --radius-md: 12px;
// //       --radius-lg: 16px;
// //       --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
// //       --shadow-card: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
// //     }

// //     .dashboard-wrapper {
// //       background: var(--bg-body);
// //       min-height: 100vh;
// //       padding: 24px;
// //       font-family: 'Inter', system-ui, sans-serif;
// //       color: var(--text-main);
// //       display: flex;
// //       flex-direction: column;
// //       gap: 20px;
// //     }

// //     /* Utilities */
// //     .text-muted { color: var(--text-muted); }
// //     .text-right { text-align: right; }
// //     .text-sm { font-size: 0.85rem; }
// //     .text-xs { font-size: 0.75rem; }
// //     .fw-500 { font-weight: 500; }
// //     .fw-600 { font-weight: 600; }
// //     .font-mono { font-family: ui-monospace, 'Fira Code', monospace; font-size: 0.85rem; }
// //     .bg-success { background-color: var(--success) !important; }
// //     .text-warning { color: #d97706; }
// //     .empty-state { text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.9rem; }

// //     /* Header */
// //     .dash-header {
// //       display: flex; justify-content: space-between; align-items: flex-end;
// //     }
// //     .header-left h1 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em; }
// //     .header-left p { margin: 0; font-size: 0.9rem; }
    
// //     .header-actions { display: flex; gap: 10px; }
// //     .btn-secondary, .btn-primary, .btn-danger-outline {
// //       padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 600;
// //       cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
// //       transition: all 0.2s; border: 1px solid transparent;
// //     }
// //     .btn-primary { background: var(--primary); color: white; }
// //     .btn-primary:hover { background: var(--primary-hover); }
// //     .btn-secondary { background: var(--bg-card); border-color: var(--border); color: var(--text-main); box-shadow: var(--shadow-sm); }
// //     .btn-secondary:hover { background: #f1f5f9; }
// //     .btn-danger-outline { background: transparent; border-color: var(--danger); color: var(--danger); }
// //     .btn-danger-outline:hover { background: #fef2f2; }
// //     .icon-only { padding: 8px 12px; }

// //     /* Alert Banner */
// //     .integrity-banner {
// //       background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md);
// //       padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
// //     }
// //     .banner-content { display: flex; align-items: flex-start; gap: 16px; }
// //     .banner-icon { color: var(--danger); font-size: 1.5rem; }
// //     .banner-title { margin: 0 0 4px 0; color: #991b1b; font-size: 1rem; }
// //     .banner-desc { margin: 0; color: #b91c1c; font-size: 0.9rem; }

// //     /* KPI Grid */
// //     .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
// //     .kpi-card {
// //       background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
// //       padding: 20px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm);
// //     }
// //     .kpi-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
// //     .kpi-value { font-size: 1.75rem; font-weight: 700; color: var(--text-main); line-height: 1; }

// //     /* Layout */
// //     .bento-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
// //     @media (max-width: 1024px) { .bento-layout { grid-template-columns: 1fr; } }
// //     .bento-main, .bento-side { display: flex; flex-direction: column; gap: 20px; }

// //     /* Panels */
// //     .pro-panel {
// //       background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
// //       box-shadow: var(--shadow-card); overflow: hidden;
// //     }
// //     .panel-header {
// //       padding: 16px 20px; border-bottom: 1px solid var(--border);
// //       display: flex; justify-content: space-between; align-items: center;
// //       background: #fafafa;
// //     }
// //     .panel-header h2 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main); }
// //     .link-btn { font-size: 0.85rem; font-weight: 600; color: var(--primary); text-decoration: none; }
// //     .link-btn:hover { text-decoration: underline; }

// //     /* Queue List */
// //     .queue-list { display: flex; flex-direction: column; padding: 12px; gap: 8px; }
// //     .queue-item {
// //       display: flex; justify-content: space-between; align-items: center;
// //       padding: 12px 16px; border-radius: var(--radius-sm); text-decoration: none;
// //       background: var(--bg-body); border: 1px solid transparent; transition: all 0.2s;
// //     }
// //     .queue-item:hover { transform: translateX(2px); }
// //     .queue-title { font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
// //     .queue-badge { font-size: 0.85rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
    
// //     .queue-item[data-severity="danger"] { background: #fef2f2; border-color: #fecaca; }
// //     .queue-item[data-severity="danger"] .queue-title { color: #991b1b; }
// //     .queue-item[data-severity="danger"] .queue-badge { background: #fca5a5; color: #7f1d1d; }
    
// //     .queue-item[data-severity="warning"] { background: #fffbeb; border-color: #fde68a; }
// //     .queue-item[data-severity="warning"] .queue-title { color: #92400e; }
// //     .queue-item[data-severity="warning"] .queue-badge { background: #fcd34d; color: #78350f; }

// //     .queue-item[data-severity="success"] { background: #f0fdf4; border-color: #bbf7d0; }
// //     .queue-item[data-severity="success"] .queue-title { color: #166534; }
// //     .queue-item[data-severity="success"] .queue-badge { background: #86efac; color: #14532d; }

// //     /* Data Table (Based on Cart Reference) */
// //     .table-container { overflow-x: auto; }
// //     .pro-table { width: 100%; border-collapse: collapse; text-align: left; }
// //     .pro-table th { padding: 16px 20px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
// //     .pro-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 0.9rem; vertical-align: middle; }
// //     .pro-table tbody tr:hover { background: #f8fafc; }
// //     .pro-table tbody tr:last-child td { border-bottom: none; }
    
// //     .cell-stacked { display: flex; flex-direction: column; gap: 2px; }

// //     /* Status Pills */
// //     .status-pill {
// //       font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
// //       padding: 4px 10px; border-radius: 20px; white-space: nowrap;
// //     }
// //     .status-pill[data-status="unfulfilled"] { background: #fef3c7; color: #b45309; }
// //     .status-pill[data-status="shipped"] { background: #e0e7ff; color: #4338ca; }
// //     .status-pill[data-status="delivered"] { background: #dcfce7; color: #059669; }

// //     /* Progress Bars (Status / Payment) */
// //     .stat-bars { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
// //     .stat-row { display: flex; flex-direction: column; gap: 8px; }
// //     .stat-labels { display: flex; justify-content: space-between; font-size: 0.85rem; }
// //     .stat-name { font-weight: 600; color: var(--text-main); }
// //     .stat-count { color: var(--text-muted); }
// //     .progress-track { width: 100%; height: 8px; background: var(--bg-body); border-radius: 4px; overflow: hidden; }
// //     .progress-fill { height: 100%; background: var(--primary); border-radius: 4px; transition: width 0.5s ease; }

// //     /* Conversion Block */
// //     .conversion-block { padding: 20px; display: flex; flex-direction: column; gap: 20px; align-items: center; }
// //     .conversion-hero { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px; height: 140px; border-radius: 50%; border: 8px solid #e0e7ff; }
// //     .hero-val { font-size: 2.5rem; font-weight: 700; color: var(--primary); line-height: 1; margin-bottom: 4px; }
// //     .conversion-metrics { display: flex; width: 100%; gap: 12px; border-top: 1px solid var(--border); padding-top: 20px; }
// //     .metric { flex: 1; text-align: center; display: flex; flex-direction: column; background: var(--bg-body); padding: 12px; border-radius: var(--radius-sm); }
// //     .metric .val { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
// //     .metric .lbl { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 4px; }
// //   `]
// // })
// // export class StorefrontCommandCenterComponent implements OnInit {
// //   private readonly route = inject(ActivatedRoute);
// //   private readonly storefront = inject(StorefrontAdminService);

// //   readonly loading = signal(false);
// //   readonly error = signal<string | null>(null);
// //   readonly data = signal<CommandCenterData>(fallbackData);

// //   readonly maxStatusCount = computed(() =>
// //     Math.max(1, ...this.data().byStatus.map(item => item.count || 0))
// //   );

// //   readonly maxPaymentCount = computed(() =>
// //     Math.max(1, ...this.data().byPayment.map(item => item.count || 0))
// //   );

// //   ngOnInit(): void {
// //     this.load();
// //   }

// //   load(): void {
// //     this.loading.set(true);
// //     this.error.set(null);
// //     this.storefront.getCommandCenter().pipe(
// //       catchError(err => {
// //         this.error.set(err?.error?.message || 'Unable to load storefront command center.');
// //         return of({ data: fallbackData });
// //       })
// //     ).subscribe((res: any) => {
// //       this.data.set({ ...fallbackData, ...(res?.data || {}) });
// //       this.loading.set(false);
// //     });
// //   }

// //   conversionRate(): number {
// //     const total = this.data().kpis.storefrontCustomers || 0;
// //     if (!total) return 0;
// //     return Math.round(((this.data().kpis.convertedCustomers || 0) / total) * 100);
// //   }

// //   statusWidth(count: number): number {
// //     return Math.max(2, Math.round((count / this.maxStatusCount()) * 100));
// //   }

// //   paymentWidth(count: number): number {
// //     return Math.max(2, Math.round((count / this.maxPaymentCount()) * 100));
// //   }

// //   label(value: string): string {
// //     return String(value || 'unknown')
// //       .replace(/_/g, ' ')
// //       .replace(/\b\w/g, char => char.toUpperCase());
// //   }

// //   customerName(order: any): string {
// //     const customer = order?.customerId;
// //     if (!customer) return 'Guest customer';
// //     return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
// //   }
// // }// import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
// // // import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
// // // import { ActivatedRoute, RouterModule } from '@angular/router';
// // // import { StorefrontAdminService } from '@core/services/storefront-admin.service';
// // // import { catchError, of } from 'rxjs';

// // // interface CommandCenterData {
// // //   generatedAt: string;
// // //   period: { label: string; since: string };
// // //   kpis: {
// // //     totalOrders: number;
// // //     grossRevenue: number;
// // //     averageOrderValue: number;
// // //     shippingRevenue: number;
// // //     storefrontCustomers: number;
// // //     convertedCustomers: number;
// // //     guestCustomers: number;
// // //     abandonedCarts: number;
// // //     unfulfilledAccepted: number;
// // //     ghostRisk: number;
// // //   };
// // //   byStatus: Array<{ _id: string; count: number; value: number }>;
// // //   byPayment: Array<{ _id: string; count: number; value: number }>;
// // //   pages: Array<{ _id: string; count: number; views: number }>;
// // //   recentOrders: any[];
// // //   workQueues: Array<{ key: string; title: string; count: number; severity: string; route: string }>;
// // // }

// // // const fallbackData: CommandCenterData = {
// // //   generatedAt: new Date().toISOString(),
// // //   period: { label: 'Last 30 days', since: new Date().toISOString() },
// // //   kpis: {
// // //     totalOrders: 0,
// // //     grossRevenue: 0,
// // //     averageOrderValue: 0,
// // //     shippingRevenue: 0,
// // //     storefrontCustomers: 0,
// // //     convertedCustomers: 0,
// // //     guestCustomers: 0,
// // //     abandonedCarts: 0,
// // //     unfulfilledAccepted: 0,
// // //     ghostRisk: 0
// // //   },
// // //   byStatus: [],
// // //   byPayment: [],
// // //   pages: [],
// // //   recentOrders: [],
// // //   workQueues: []
// // // };

// // // @Component({
// // //   selector: 'app-storefront-command-center',
// // //   standalone: true,
// // //   imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, DecimalPipe],
// // //   template: `
// // //     <main class="command-center">
// // //       <section class="hero">
// // //         <div>
// // //           <span class="eyebrow"><i class="pi pi-shop"></i> Storefront Command Center</span>
// // //           <h1>Commerce operations, sales health, and customer quality.</h1>
// // //           <p>Track storefront revenue, order lifecycle, fulfillment queues, customer conversion, invoice integrity, abandoned carts, and publishing health from one admin surface.</p>
// // //         </div>
// // //         <div class="hero-actions">
// // //           <a routerLink="../orders" class="hero-button primary"><i class="pi pi-shopping-bag"></i> Orders</a>
// // //           <a routerLink="../customers" class="hero-button"><i class="pi pi-users"></i> Customers</a>
// // //           <button type="button" class="icon-button" (click)="load()"><i class="pi pi-refresh" [class.pi-spin]="loading()"></i></button>
// // //         </div>
// // //       </section>

// // //       <section class="integrity-alert" [class.clean]="data().kpis.ghostRisk === 0">
// // //         <div>
// // //           <span class="eyebrow muted">Data integrity</span>
// // //           <h2>{{ data().kpis.ghostRisk === 0 ? 'No ghost-record risk detected' : data().kpis.ghostRisk + ' records need attention' }}</h2>
// // //           <p>Delivered storefront orders should be linked to CRM customers and invoices. This keeps customer history, accounting, stock, and analytics consistent.</p>
// // //         </div>
// // //         <a routerLink="../orders" class="hero-button primary">{{ data().kpis.ghostRisk === 0 ? 'Review orders' : 'Fix now' }}</a>
// // //       </section>

// // //       <section class="kpi-grid">
// // //         <article class="kpi-card">
// // //           <span>Gross storefront sales</span>
// // //           <strong>{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
// // //           <p>{{ data().period.label }} across accepted storefront orders</p>
// // //         </article>
// // //         <article class="kpi-card">
// // //           <span>Average order value</span>
// // //           <strong>{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
// // //           <p>Total order value divided by active order count</p>
// // //         </article>
// // //         <article class="kpi-card">
// // //           <span>Total orders</span>
// // //           <strong>{{ data().kpis.totalOrders | number }}</strong>
// // //           <p>All storefront order records for this organization</p>
// // //         </article>
// // //         <article class="kpi-card">
// // //           <span>Shipping revenue</span>
// // //           <strong>{{ data().kpis.shippingRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
// // //           <p>Customer shipping collected from storefront checkout</p>
// // //         </article>
// // //       </section>

// // //       <section class="ops-layout">
// // //         <article class="panel large">
// // //           <div class="panel-head">
// // //             <div>
// // //               <span class="eyebrow muted">Sales lifecycle</span>
// // //               <h2>Orders by status</h2>
// // //             </div>
// // //             <a routerLink="../orders">Open orders</a>
// // //           </div>
// // //           <div class="status-bars">
// // //             @for (item of data().byStatus; track item._id) {
// // //               <div class="bar-row">
// // //                 <div>
// // //                   <strong>{{ label(item._id) }}</strong>
// // //                   <span>{{ item.count }} orders · {{ item.value | currency:'INR':'symbol':'1.0-0' }}</span>
// // //                 </div>
// // //                 <div class="bar-track"><span [style.width.%]="statusWidth(item.count)"></span></div>
// // //               </div>
// // //             } @empty {
// // //               <div class="empty">No order lifecycle data yet.</div>
// // //             }
// // //           </div>
// // //         </article>

// // //         <article class="panel">
// // //           <div class="panel-head">
// // //             <div>
// // //               <span class="eyebrow muted">Customer actions</span>
// // //               <h2>Customer quality</h2>
// // //             </div>
// // //             <a routerLink="../customers">Open customers</a>
// // //           </div>
// // //           <div class="customer-meter">
// // //             <strong>{{ conversionRate() }}%</strong>
// // //             <span>CRM conversion</span>
// // //             <div><span [style.width.%]="conversionRate()"></span></div>
// // //           </div>
// // //           <div class="mini-list">
// // //             <div><span>Storefront customers</span><strong>{{ data().kpis.storefrontCustomers }}</strong></div>
// // //             <div><span>CRM linked</span><strong>{{ data().kpis.convertedCustomers }}</strong></div>
// // //             <div><span>Guest customers</span><strong>{{ data().kpis.guestCustomers }}</strong></div>
// // //           </div>
// // //         </article>
// // //       </section>

// // //       <section class="ops-layout bottom">
// // //         <article class="panel">
// // //           <div class="panel-head">
// // //             <div>
// // //               <span class="eyebrow muted">Work queues</span>
// // //               <h2>Needs action</h2>
// // //             </div>
// // //           </div>
// // //           <div class="queue-list">
// // //             @for (queue of data().workQueues; track queue.key) {
// // //               <a [routerLink]="queue.route" class="queue-row" [attr.data-severity]="queue.severity">
// // //                 <span>{{ queue.title }}</span>
// // //                 <strong>{{ queue.count }}</strong>
// // //               </a>
// // //             }
// // //           </div>
// // //         </article>

// // //         <article class="panel large">
// // //           <div class="panel-head">
// // //             <div>
// // //               <span class="eyebrow muted">Recent demand</span>
// // //               <h2>Latest storefront orders</h2>
// // //             </div>
// // //           </div>
// // //           <div class="orders-list">
// // //             @for (order of data().recentOrders; track order._id) {
// // //               <a routerLink="../orders" class="order-row">
// // //                 <div>
// // //                   <strong>{{ order.orderNumber }}</strong>
// // //                   <span>{{ customerName(order) }} · {{ order.createdAt | date:'mediumDate' }}</span>
// // //                 </div>
// // //                 <div>
// // //                   <span>{{ order.orderStatus }} / {{ order.fulfillmentStatus }}</span>
// // //                   <strong>{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</strong>
// // //                 </div>
// // //               </a>
// // //             } @empty {
// // //               <div class="empty">No recent storefront orders.</div>
// // //             }
// // //           </div>
// // //         </article>
// // //       </section>

// // //       <section class="ops-layout bottom">
// // //         <article class="panel">
// // //           <div class="panel-head">
// // //             <div>
// // //               <span class="eyebrow muted">Payments</span>
// // //               <h2>Payment mix</h2>
// // //             </div>
// // //           </div>
// // //           <div class="mini-list">
// // //             @for (payment of data().byPayment; track payment._id) {
// // //               <div><span>{{ label(payment._id) }}</span><strong>{{ payment.value | currency:'INR':'symbol':'1.0-0' }}</strong></div>
// // //             } @empty {
// // //               <div class="empty">No payment data.</div>
// // //             }
// // //           </div>
// // //         </article>

// // //         <article class="panel large">
// // //           <div class="panel-head">
// // //             <div>
// // //               <span class="eyebrow muted">Publishing health</span>
// // //               <h2>Storefront pages</h2>
// // //             </div>
// // //             <a routerLink="../pages">Open pages</a>
// // //           </div>
// // //           <div class="page-grid">
// // //             @for (page of data().pages; track page._id) {
// // //               <div>
// // //                 <span>{{ label(page._id) }}</span>
// // //                 <strong>{{ page.count }}</strong>
// // //                 <p>{{ page.views || 0 }} views</p>
// // //               </div>
// // //             } @empty {
// // //               <div class="empty">No storefront pages yet.</div>
// // //             }
// // //           </div>
// // //         </article>
// // //       </section>
// // //     </main>
// // //   `,
// // //   styleUrls: ['./storefront-command-center.component.scss'],
// // //   changeDetection: ChangeDetectionStrategy.OnPush
// // // })
// // // export class StorefrontCommandCenterComponent implements OnInit {
// // //   private readonly route = inject(ActivatedRoute);
// // //   private readonly storefront = inject(StorefrontAdminService);

// // //   readonly surfaceKey = signal('overview');
// // //   readonly loading = signal(false);
// // //   readonly error = signal<string | null>(null);
// // //   readonly data = signal<CommandCenterData>(fallbackData);

// // //   readonly maxStatusCount = computed(() =>
// // //     Math.max(1, ...this.data().byStatus.map(item => item.count || 0))
// // //   );

// // //   ngOnInit(): void {
// // //     this.route.data.subscribe(data => {
// // //       this.surfaceKey.set(typeof data['surfaceKey'] === 'string' ? data['surfaceKey'] : 'overview');
// // //     });
// // //     this.load();
// // //   }

// // //   load(): void {
// // //     this.loading.set(true);
// // //     this.error.set(null);
// // //     this.storefront.getCommandCenter().pipe(
// // //       catchError(err => {
// // //         this.error.set(err?.error?.message || 'Unable to load storefront command center.');
// // //         return of({ data: fallbackData });
// // //       })
// // //     ).subscribe((res: any) => {
// // //       this.data.set({ ...fallbackData, ...(res?.data || {}) });
// // //       this.loading.set(false);
// // //     });
// // //   }

// // //   conversionRate(): number {
// // //     const total = this.data().kpis.storefrontCustomers || 0;
// // //     if (!total) return 0;
// // //     return Math.round(((this.data().kpis.convertedCustomers || 0) / total) * 100);
// // //   }

// // //   statusWidth(count: number): number {
// // //     return Math.max(8, Math.round((count / this.maxStatusCount()) * 100));
// // //   }

// // //   label(value: string): string {
// // //     return String(value || 'unknown')
// // //       .replace(/_/g, ' ')
// // //       .replace(/\b\w/g, char => char.toUpperCase());
// // //   }

// // //   customerName(order: any): string {
// // //     const customer = order?.customerId;
// // //     if (!customer) return 'Guest customer';
// // //     return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
// // //   }
// // // }
