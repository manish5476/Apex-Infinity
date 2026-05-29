import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';

interface CommandCenterData {
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
    totalOrders: 0,
    grossRevenue: 0,
    averageOrderValue: 0,
    shippingRevenue: 0,
    storefrontCustomers: 0,
    convertedCustomers: 0,
    guestCustomers: 0,
    abandonedCarts: 0,
    unfulfilledAccepted: 0,
    ghostRisk: 0
  },
  byStatus: [],
  byPayment: [],
  pages: [],
  recentOrders: [],
  workQueues: []
};

@Component({
  selector: 'app-storefront-command-center',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <main class="command-center">
      <section class="hero">
        <div>
          <span class="eyebrow"><i class="pi pi-shop"></i> Storefront Command Center</span>
          <h1>Commerce operations, sales health, and customer quality.</h1>
          <p>Track storefront revenue, order lifecycle, fulfillment queues, customer conversion, invoice integrity, abandoned carts, and publishing health from one admin surface.</p>
        </div>
        <div class="hero-actions">
          <a routerLink="../orders" class="hero-button primary"><i class="pi pi-shopping-bag"></i> Orders</a>
          <a routerLink="../customers" class="hero-button"><i class="pi pi-users"></i> Customers</a>
          <button type="button" class="icon-button" (click)="load()"><i class="pi pi-refresh" [class.pi-spin]="loading()"></i></button>
        </div>
      </section>

      <section class="integrity-alert" [class.clean]="data().kpis.ghostRisk === 0">
        <div>
          <span class="eyebrow muted">Data integrity</span>
          <h2>{{ data().kpis.ghostRisk === 0 ? 'No ghost-record risk detected' : data().kpis.ghostRisk + ' records need attention' }}</h2>
          <p>Delivered storefront orders should be linked to CRM customers and invoices. This keeps customer history, accounting, stock, and analytics consistent.</p>
        </div>
        <a routerLink="../orders" class="hero-button primary">{{ data().kpis.ghostRisk === 0 ? 'Review orders' : 'Fix now' }}</a>
      </section>

      <section class="kpi-grid">
        <article class="kpi-card">
          <span>Gross storefront sales</span>
          <strong>{{ data().kpis.grossRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
          <p>{{ data().period.label }} across accepted storefront orders</p>
        </article>
        <article class="kpi-card">
          <span>Average order value</span>
          <strong>{{ data().kpis.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
          <p>Total order value divided by active order count</p>
        </article>
        <article class="kpi-card">
          <span>Total orders</span>
          <strong>{{ data().kpis.totalOrders | number }}</strong>
          <p>All storefront order records for this organization</p>
        </article>
        <article class="kpi-card">
          <span>Shipping revenue</span>
          <strong>{{ data().kpis.shippingRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
          <p>Customer shipping collected from storefront checkout</p>
        </article>
      </section>

      <section class="ops-layout">
        <article class="panel large">
          <div class="panel-head">
            <div>
              <span class="eyebrow muted">Sales lifecycle</span>
              <h2>Orders by status</h2>
            </div>
            <a routerLink="../orders">Open orders</a>
          </div>
          <div class="status-bars">
            @for (item of data().byStatus; track item._id) {
              <div class="bar-row">
                <div>
                  <strong>{{ label(item._id) }}</strong>
                  <span>{{ item.count }} orders · {{ item.value | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="bar-track"><span [style.width.%]="statusWidth(item.count)"></span></div>
              </div>
            } @empty {
              <div class="empty">No order lifecycle data yet.</div>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow muted">Customer actions</span>
              <h2>Customer quality</h2>
            </div>
            <a routerLink="../customers">Open customers</a>
          </div>
          <div class="customer-meter">
            <strong>{{ conversionRate() }}%</strong>
            <span>CRM conversion</span>
            <div><span [style.width.%]="conversionRate()"></span></div>
          </div>
          <div class="mini-list">
            <div><span>Storefront customers</span><strong>{{ data().kpis.storefrontCustomers }}</strong></div>
            <div><span>CRM linked</span><strong>{{ data().kpis.convertedCustomers }}</strong></div>
            <div><span>Guest customers</span><strong>{{ data().kpis.guestCustomers }}</strong></div>
          </div>
        </article>
      </section>

      <section class="ops-layout bottom">
        <article class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow muted">Work queues</span>
              <h2>Needs action</h2>
            </div>
          </div>
          <div class="queue-list">
            @for (queue of data().workQueues; track queue.key) {
              <a [routerLink]="queue.route" class="queue-row" [attr.data-severity]="queue.severity">
                <span>{{ queue.title }}</span>
                <strong>{{ queue.count }}</strong>
              </a>
            }
          </div>
        </article>

        <article class="panel large">
          <div class="panel-head">
            <div>
              <span class="eyebrow muted">Recent demand</span>
              <h2>Latest storefront orders</h2>
            </div>
          </div>
          <div class="orders-list">
            @for (order of data().recentOrders; track order._id) {
              <a routerLink="../orders" class="order-row">
                <div>
                  <strong>{{ order.orderNumber }}</strong>
                  <span>{{ customerName(order) }} · {{ order.createdAt | date:'mediumDate' }}</span>
                </div>
                <div>
                  <span>{{ order.orderStatus }} / {{ order.fulfillmentStatus }}</span>
                  <strong>{{ order.totals?.grandTotal | currency:'INR':'symbol':'1.0-0' }}</strong>
                </div>
              </a>
            } @empty {
              <div class="empty">No recent storefront orders.</div>
            }
          </div>
        </article>
      </section>

      <section class="ops-layout bottom">
        <article class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow muted">Payments</span>
              <h2>Payment mix</h2>
            </div>
          </div>
          <div class="mini-list">
            @for (payment of data().byPayment; track payment._id) {
              <div><span>{{ label(payment._id) }}</span><strong>{{ payment.value | currency:'INR':'symbol':'1.0-0' }}</strong></div>
            } @empty {
              <div class="empty">No payment data.</div>
            }
          </div>
        </article>

        <article class="panel large">
          <div class="panel-head">
            <div>
              <span class="eyebrow muted">Publishing health</span>
              <h2>Storefront pages</h2>
            </div>
            <a routerLink="../pages">Open pages</a>
          </div>
          <div class="page-grid">
            @for (page of data().pages; track page._id) {
              <div>
                <span>{{ label(page._id) }}</span>
                <strong>{{ page.count }}</strong>
                <p>{{ page.views || 0 }} views</p>
              </div>
            } @empty {
              <div class="empty">No storefront pages yet.</div>
            }
          </div>
        </article>
      </section>
    </main>
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

  conversionRate(): number {
    const total = this.data().kpis.storefrontCustomers || 0;
    if (!total) return 0;
    return Math.round(((this.data().kpis.convertedCustomers || 0) / total) * 100);
  }

  statusWidth(count: number): number {
    return Math.max(8, Math.round((count / this.maxStatusCount()) * 100));
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
}
