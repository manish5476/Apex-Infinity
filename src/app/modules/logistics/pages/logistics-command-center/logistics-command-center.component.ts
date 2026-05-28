import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogisticsService, LogisticsShipment, LogisticsSummary } from '../../services/logistics.service';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  ready_for_fulfillment: 'Ready',
  pending_assignment: 'Pending assignment',
  assigned: 'Assigned',
  accepted: 'Accepted',
  pickup_scheduled: 'Pickup scheduled',
  pickup_started: 'Pickup started',
  arrived_at_pickup: 'At pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  near_destination: 'Near destination',
  delivery_attempted: 'Attempted',
  delivered: 'Delivered',
  failed: 'Failed',
  return_pending: 'Return pending',
  return_in_transit: 'Return in transit',
  returned: 'Returned',
  cancelled: 'Cancelled',
  escalated: 'Escalated'
};

@Component({
  selector: 'app-logistics-command-center',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="logistics-shell">
      <section class="hero">
        <div>
          <span class="eyebrow"><i class="pi pi-send"></i> Logistics OS</span>
          <h1>Apex Logistics Command Center</h1>
          <p>Live shipment orchestration for internal fleets, platform partners, dispatch teams, SLA risk, and parcel intelligence.</p>
        </div>
        <div class="hero-actions">
          <button type="button" class="icon-btn" title="Refresh" (click)="load()"><i class="pi pi-refresh"></i></button>
          <button type="button" class="primary-btn"><i class="pi pi-plus"></i>Shipment</button>
        </div>
      </section>

      <section class="kpi-grid">
        <article class="kpi">
          <span>Active shipments</span>
          <strong>{{ activeCount() }}</strong>
          <p>Non-terminal logistics workload</p>
        </article>
        <article class="kpi warning">
          <span>SLA risk</span>
          <strong>{{ summary()?.slaRisk || 0 }}</strong>
          <p>Due within the next hour</p>
        </article>
        <article class="kpi">
          <span>Delivered</span>
          <strong>{{ countFor('delivered') }}</strong>
          <p>Completed shipments</p>
        </article>
        <article class="kpi">
          <span>Exceptions</span>
          <strong>{{ exceptionCount() }}</strong>
          <p>Failed, attempted, or escalated</p>
        </article>
      </section>

      <section class="ops-layout">
        <aside class="status-panel">
          <div class="panel-head">
            <span class="eyebrow muted">Lifecycle</span>
            <h2>Status Distribution</h2>
          </div>
          @if (summary()?.byStatus?.length) {
            <div class="status-list">
              @for (item of summary()?.byStatus; track item._id) {
                <button type="button" class="status-row" (click)="filterStatus(item._id)">
                  <span>{{ labelFor(item._id) }}</span>
                  <strong>{{ item.count }}</strong>
                </button>
              }
            </div>
          } @else {
            <p class="empty">No shipment lifecycle data yet.</p>
          }
        </aside>

        <section class="shipments-panel">
          <div class="panel-head row">
            <div>
              <span class="eyebrow muted">Operations Queue</span>
              <h2>Shipments</h2>
            </div>
            <div class="filters">
              <input type="search" [(ngModel)]="search" (keyup.enter)="loadShipments()" placeholder="Search tracking, customer, source" />
              <button type="button" class="ghost-btn" (click)="clearFilters()">Clear</button>
            </div>
          </div>

          @if (loading()) {
            <div class="loading">Loading logistics telemetry...</div>
          } @else if (shipments().length) {
            <div class="shipment-table">
              @for (shipment of shipments(); track shipment._id) {
                <article class="shipment-row">
                  <div>
                    <strong>{{ shipment.shipmentNumber }}</strong>
                    <span>{{ shipment.trackingNumber }}</span>
                  </div>
                  <div>
                    <span>{{ shipment.customer?.name || 'Customer pending' }}</span>
                    <small>{{ shipment.customer?.phone || shipment.sourceNumber || shipment.sourceType }}</small>
                  </div>
                  <div>
                    <span>{{ shipment.pickupAddress?.city || 'Pickup' }} → {{ shipment.dropoffAddress?.city || 'Dropoff' }}</span>
                    <small>{{ shipment.fulfillmentMode }}</small>
                  </div>
                  <span class="state" [attr.data-state]="shipment.status">{{ labelFor(shipment.status) }}</span>
                  <time>{{ shipment.updatedAt | date:'short' }}</time>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">
              <i class="pi pi-compass"></i>
              <h3>No shipments yet</h3>
              <p>Create shipments through the logistics API or migrate storefront orders into first-class shipment records.</p>
            </div>
          }
        </section>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100%; background: #f6f7fb; color: #172033; }
    .logistics-shell { padding: 24px; display: grid; gap: 20px; }
    .hero { min-height: 220px; display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding: 28px; border-radius: 8px; color: #fff; background: linear-gradient(135deg, #102033 0%, #1d5b65 54%, #7a4f1f 100%); box-shadow: 0 18px 50px rgba(16, 32, 51, .24); }
    .hero h1 { margin: 10px 0 8px; max-width: 820px; font-size: 34px; line-height: 1.05; letter-spacing: 0; }
    .hero p { max-width: 760px; margin: 0; color: rgba(255,255,255,.82); font-size: 15px; line-height: 1.6; }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: .08em; color: rgba(255,255,255,.76); }
    .eyebrow.muted { color: #6d7789; }
    .hero-actions { display: flex; gap: 10px; }
    button { border: 0; cursor: pointer; font: inherit; }
    .icon-btn, .primary-btn, .ghost-btn { height: 38px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: transform .18s ease, box-shadow .18s ease; }
    .icon-btn { width: 38px; color: #fff; background: rgba(255,255,255,.14); }
    .primary-btn { padding: 0 14px; color: #102033; background: #ffffff; font-weight: 800; }
    .ghost-btn { padding: 0 12px; background: #edf1f7; color: #435168; font-weight: 700; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .kpi { min-height: 122px; padding: 18px; border: 1px solid #e3e8f0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(16, 32, 51, .06); }
    .kpi span { display: block; color: #6d7789; font-size: 12px; font-weight: 800; }
    .kpi strong { display: block; margin: 8px 0 4px; font-size: 32px; letter-spacing: 0; }
    .kpi p { margin: 0; color: #7b8596; font-size: 13px; }
    .kpi.warning strong { color: #ad6516; }
    .ops-layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; }
    .status-panel, .shipments-panel { border: 1px solid #e3e8f0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(16, 32, 51, .06); }
    .status-panel { padding: 18px; }
    .shipments-panel { overflow: hidden; }
    .panel-head { margin-bottom: 14px; }
    .panel-head.row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px; margin: 0; border-bottom: 1px solid #e9edf4; }
    h2 { margin: 4px 0 0; font-size: 18px; letter-spacing: 0; }
    .status-list { display: grid; gap: 8px; }
    .status-row { width: 100%; min-height: 42px; padding: 0 12px; border-radius: 8px; background: #f6f8fb; color: #263349; display: flex; align-items: center; justify-content: space-between; text-align: left; }
    .status-row:hover { background: #edf3f7; }
    .filters { display: flex; gap: 10px; align-items: center; }
    input { width: min(360px, 42vw); height: 38px; border: 1px solid #d9e0ea; border-radius: 8px; padding: 0 12px; outline: 0; }
    input:focus { border-color: #1d7784; box-shadow: 0 0 0 3px rgba(29, 119, 132, .12); }
    .shipment-table { display: grid; }
    .shipment-row { min-height: 76px; display: grid; grid-template-columns: 1.1fr 1fr 1.2fr 160px 120px; gap: 16px; align-items: center; padding: 12px 18px; border-bottom: 1px solid #edf1f6; }
    .shipment-row strong, .shipment-row span { display: block; font-size: 13px; }
    .shipment-row small, .shipment-row time { color: #7b8596; font-size: 12px; }
    .state { width: fit-content; max-width: 150px; padding: 6px 9px; border-radius: 999px; background: #e8f5f6; color: #17616c; font-weight: 800; white-space: nowrap; }
    .state[data-state="failed"], .state[data-state="escalated"], .state[data-state="delivery_attempted"] { background: #fff0e6; color: #9a4b0f; }
    .state[data-state="delivered"] { background: #e8f7ed; color: #1f7a3b; }
    .empty, .loading, .empty-state { padding: 26px; color: #6d7789; }
    .empty-state { min-height: 260px; display: grid; place-items: center; text-align: center; align-content: center; gap: 8px; }
    .empty-state i { font-size: 28px; color: #1d7784; }
    .empty-state h3, .empty-state p { margin: 0; }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ops-layout { grid-template-columns: 1fr; } .shipment-row { grid-template-columns: 1fr; gap: 6px; } }
    @media (max-width: 720px) { .logistics-shell { padding: 14px; } .hero { min-height: auto; flex-direction: column; } .hero h1 { font-size: 28px; } .kpi-grid { grid-template-columns: 1fr; } .panel-head.row, .filters { align-items: stretch; flex-direction: column; } input { width: 100%; } }
  `]
})
export class LogisticsCommandCenterComponent implements OnInit {
  private readonly logistics = inject(LogisticsService);

  readonly summary = signal<LogisticsSummary | null>(null);
  readonly shipments = signal<LogisticsShipment[]>([]);
  readonly loading = signal(false);
  readonly selectedStatus = signal('');
  search = '';

  readonly activeCount = computed(() => {
    const terminal = new Set(['delivered', 'returned', 'cancelled']);
    return (this.summary()?.byStatus || [])
      .filter(item => !terminal.has(item._id))
      .reduce((total, item) => total + item.count, 0);
  });

  readonly exceptionCount = computed(() =>
    this.countFor('failed') + this.countFor('delivery_attempted') + this.countFor('escalated')
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.logistics.getSummary().subscribe({
      next: response => this.summary.set(response.data),
      error: () => this.summary.set({ byStatus: [], slaRisk: 0, recent: [], generatedAt: new Date().toISOString() })
    });
    this.loadShipments();
  }

  loadShipments(): void {
    this.loading.set(true);
    this.logistics.getShipments({
      status: this.selectedStatus(),
      search: this.search,
      limit: 50
    }).subscribe({
      next: response => {
        this.shipments.set(response.data.items);
        this.loading.set(false);
      },
      error: () => {
        this.shipments.set([]);
        this.loading.set(false);
      }
    });
  }

  filterStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadShipments();
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.search = '';
    this.loadShipments();
  }

  countFor(status: string): number {
    return this.summary()?.byStatus.find(item => item._id === status)?.count || 0;
  }

  labelFor(status: string): string {
    return STATUS_LABELS[status] || status;
  }
}
