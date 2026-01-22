import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

interface PeakHour {
  count: number;
  day: number;
  hour: number;
}

@Component({
  selector: 'app-operational-metrics',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressSpinnerModule, 
    TagModule,
    AgShareGrid
  ],
  template: `
    <div class="metrics-container">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          
          <div class="kpi-card aov-card">
            <p class="kpi-label">Avg Order Value</p>
            <h2 class="kpi-value primary">₹{{ opData()?.metrics?.orderEfficiency?.averageOrderValue | number:'1.0-0' }}</h2>
            <div class="kpi-footer">
              <i class="pi pi-check-circle footer-icon success"></i>
              <span class="footer-text">Cancellation Rate: {{ opData()?.metrics?.orderEfficiency?.cancellationRate }}%</span>
            </div>
          </div>

          <div class="kpi-card discount-card">
            <p class="kpi-label">Discounts Granted</p>
            <h2 class="kpi-value error">₹{{ opData()?.metrics?.discountMetrics?.totalDiscount | number }}</h2>
            <p class="footer-text">Avg Rate: {{ opData()?.metrics?.discountMetrics?.discountRate }}%</p>
          </div>

          <div class="kpi-card peak-card">
            <div class="peak-content">
              <p class="peak-label">Peak Store Traffic</p>
              <h3 class="peak-value">{{ getFormattedPeakHour() }}</h3>
              <p class="peak-sub">Most active timeframe detected</p>
            </div>
            <i class="pi pi-chart-bar peak-bg-icon"></i>
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <h3 class="grid-title">Workforce Productivity</h3>
                <p-button icon="pi pi-users" [text]="true" size="small" severity="secondary"></p-button>
              </div>
              
              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="staffColumns" 
                   [data]="opData()?.productivity?.staff || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            
            <div class="side-card recs-card">
              <div class="side-header mb-md">
                <i class="pi pi-bolt header-icon warning"></i>
                <h4 class="side-title">Staffing Recommendations</h4>
              </div>
              <div class="recs-list">
                @for (rec of opData()?.operations?.recommendations; track rec) {
                  <div class="rec-item">
                    <p class="rec-text">{{ rec }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="side-card peaks-list-card">
              <h4 class="side-title mb-md muted">Upcoming Peak Windows</h4>
              <div class="peaks-list">
                @for (peak of opData()?.operations?.peakHours; track peak.hour) {
                  <div class="peak-item group">
                    <div class="peak-info">
                      <div class="peak-bar"></div>
                      <div>
                        <p class="peak-time">
                          {{ getDayName(peak.day) }}, {{ peak.hour }}:00
                        </p>
                        <p class="peak-label-sm">Forecasted Volume</p>
                      </div>
                    </div>
                    <span class="peak-count highlight">{{ peak.count }} Trxn</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p class="loader-text">Synchronizing operational logs...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .metrics-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    /* KPI CARDS */
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
      position: relative;
      overflow: hidden;
    }
    .kpi-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

    .kpi-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0 0 4px 0;
    }

    .kpi-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-heading);
      margin: 0;
      color: var(--text-primary);
    }
    .kpi-value.primary { color: var(--text-primary); }
    .kpi-value.error { color: var(--color-error); }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-sm);
    }
    
    .footer-icon.success { color: var(--color-success); font-size: var(--font-size-xs); }
    .footer-text { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: var(--spacing-xs); }

    /* PEAK CARD (Gradient) */
    .peak-card {
      background: var(--accent-gradient);
      border: none;
      color: #ffffff;
    }
    
    .peak-content { position: relative; z-index: 1; }
    .peak-label { font-size: var(--font-size-xs); font-weight: 900; text-transform: uppercase; opacity: 0.8; margin: 0 0 4px 0; letter-spacing: 0.05em; }
    .peak-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: 0; }
    .peak-sub { font-size: 10px; font-weight: bold; text-transform: uppercase; opacity: 0.9; margin-top: var(--spacing-xs); }

    .peak-bg-icon {
      position: absolute;
      right: -10px;
      bottom: -10px;
      font-size: 5rem;
      opacity: 0.1;
      color: #ffffff;
      pointer-events: none;
    }

    /* CONTENT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .content-grid { grid-template-columns: 2fr 1fr; }
    }

    /* GRID CARD (Table) */
    .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
    }

    .grid-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .grid-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }

    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* SIDE COLUMN */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

    .side-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
    }

    .side-header { display: flex; align-items: center; gap: var(--spacing-sm); }
    .header-icon.warning { color: var(--color-warning); }
    .mb-md { margin-bottom: var(--spacing-md); }

    .side-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }
    .side-title.muted { color: var(--text-label); }

    /* RECS LIST */
    .recs-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }

    .rec-item {
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius);
      background: var(--bg-ternary);
      border: 1px dashed var(--border-secondary);
      transition: background 0.2s;
    }
    .rec-item:hover { background: var(--component-bg-hover); }

    .rec-text {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    /* PEAKS LIST */
    .peaks-list { display: flex; flex-direction: column; gap: var(--spacing-md); }

    .peak-item { display: flex; justify-content: space-between; align-items: center; }

    .peak-info { display: flex; align-items: center; gap: var(--spacing-sm); }

    .peak-bar {
      width: 6px; height: 32px;
      border-radius: 99px;
      background: var(--accent-primary);
    }

    .peak-time {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      line-height: 1;
      margin: 0 0 2px 0;
    }

    .peak-label-sm {
      font-size: var(--font-size-xs);
      color: var(--text-label);
      margin: 0;
    }

    .peak-count {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
    .peak-count.highlight { color: var(--accent-primary); }

    /* LOADER */
    .loader-container {
      height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
    }
  `]
})
export class OperationalMetricsComponent implements OnInit {
  opData = signal<any>(null);
  loading = signal<boolean>(true);
  staffColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns(): void {
    // Columns using CSS Variables for Theming
    this.staffColumns = [
      {
        field: 'name', 
        headerName: 'Sales Associate', 
        sortable: true, 
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          const initials = this.commonService.getInitials(name);

          return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">
                      ${initials}
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm);">${name}</span>
                      <span style="font-size: 10px; color: var(--text-tertiary); margin-top: 2px;">${params.data.email || ''}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'invoiceCount', 
        headerName: 'Invoices', 
        sortable: true, 
        width: 100,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--text-secondary)' }
      },
      {
        field: 'avgTicketSize', 
        headerName: 'Avg Ticket', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'text-align': 'right' }
      },
      {
        field: 'totalSales', 
        headerName: 'Total Contribution', 
        sortable: true, 
        width: 150,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getOperationalMetrics().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.opData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getFormattedPeakHour(): string {
    const peak = this.opData()?.operations?.peakHours[0];
    if (!peak) return 'No Peak Data';
    return `${this.getDayName(peak.day)} at ${peak.hour}:00`;
  }

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day] || 'Unknown';
  }
}
