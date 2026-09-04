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
            <p>{{ data().period.label }} Â· Synced {{ data().generatedAt | date:'shortTime' }}</p>
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
          <strong class="kpi-value">{{ data().kpis.grossRevenue | currency:currencyCode():'symbol':'1.0-0' }}</strong>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Avg. Order Value</span>
            <div class="kpi-icon info-kit"><i class="pi pi-chart-pie"></i></div>
          </div>
          <strong class="kpi-value">{{ data().kpis.averageOrderValue | currency:currencyCode():'symbol':'1.0-0' }}</strong>
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
                      <td class="align-right fw-bold">{{ order.totals?.grandTotal | currency:currencyCode():'symbol':'1.0-0' }}</td>
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

          <div class="classic-panel">
            <div class="panel-header">
              <h2>Pages & Content</h2>
              <a routerLink="../pages" class="link-action">Manage <i class="pi pi-arrow-right"></i></a>
            </div>
            <div class="queue-list">
              @for (p of data().pages; track p._id) {
                <div class="queue-card" data-severity="info">
                  <div class="queue-info">
                    <span class="q-title">{{ label(p._id) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-[var(--text-muted)]">{{ p.views | number }} views</span>
                    <span class="q-badge">{{ p.count }}</span>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">No pages data available.</div>
              }
            </div>
          </div>

        </div>
      </section>
    </div>
  `,
  styleUrls: ['./storefront-command-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontCommandCenterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontAdminService);

  readonly surfaceKey = signal('overview');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<CommandCenterData>(fallbackData);
  readonly currencyCode = signal(this.resolveCurrency());

  private resolveCurrency(): string {
    try {
      const raw = localStorage.getItem('orgCurrency') || localStorage.getItem('currency');
      return raw ? JSON.parse(raw) : 'INR';
    } catch {
      return localStorage.getItem('orgCurrency') || localStorage.getItem('currency') || 'INR';
    }
  }

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
