import { Component, OnInit, signal, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface PeakHour {
  count: number;
  day: number;
  hour: number;
}

@Component({
  selector: 'app-operational-metrics',
  standalone: true,
  imports: [
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    TagModule,
    DataGridComponent,
    UniversalFilterComponent
],
  template: `
    <div class="metrics-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Operational Efficiency Center</h2>
          <p class="page-subtitle">Real-time workforce, traffic, and discount analysis</p>
        </div>
        <div class="header-actions">
           <p-button label="Download Report" icon="pi pi-file-pdf" [outlined]="true" severity="secondary" size="small"></p-button>
        </div>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'operational-metrics'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      @if (!loading()) {
        
        <div class="kpi-grid">
          
          <div class="kpi-card aov-card">
            <p class="kpi-label">Average Order Value</p>
            <h2 class="kpi-value primary">{{ commonService.formatCurrency(opData()?.metrics?.orderEfficiency?.averageOrderValue) }}</h2>
            <div class="kpi-footer">
              <i class="pi pi-check-circle footer-icon success"></i>
              <span class="footer-text">Cancellation Rate: {{ opData()?.metrics?.orderEfficiency?.cancellationRate }}%</span>
            </div>
          </div>

          <div class="kpi-card discount-card">
            <p class="kpi-label">Discounts Granted</p>
            <h2 class="kpi-value warning">{{ commonService.formatCurrency(opData()?.metrics?.discountMetrics?.totalDiscount) }}</h2>
            <p class="footer-text">Avg Rate: {{ opData()?.metrics?.discountMetrics?.discountRate }}%</p>
          </div>

          <div class="kpi-card peak-card">
            <div class="peak-content">
              <p class="peak-label">Peak Traffic Window</p>
              <h3 class="peak-value">{{ getFormattedPeakHour() }}</h3>
              <p class="peak-sub">Based on recent transaction density</p>
            </div>
            <i class="pi pi-chart-bar peak-bg-icon"></i>
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <h3 class="grid-title">Workforce Productivity Leaderboard</h3>
                <p-button icon="pi pi-users" [text]="true" size="small" severity="secondary" pTooltip="Manage Staff"></p-button>
              </div>
              
              <div class="grid-container">
                 <app-data-grid [viewOnly]="true" [pagination]="true" [enableExport]="true" class="full-size-grid" 
                   [columns]="staffColumns" 
                   [data]="opData()?.metrics?.topStaff || []" 
                   class="full-size-grid">
                 </app-data-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            
            <div class="side-card recs-card">
              <div class="side-header mb-md">
                <i class="pi pi-bolt header-icon warning"></i>
                <h4 class="side-title">AI Staffing Recommendations</h4>
              </div>
              <div class="recs-list custom-scrollbar">
                @for (rec of opData()?.operations?.recommendations; track rec) {
                  <div class="rec-item">
                    <p class="rec-text">{{ rec }}</p>
                  </div>
                } @empty {
                   <p class="empty-text">No active recommendations.</p>
                }
              </div>
            </div>

            <div class="side-card peaks-list-card">
              <h4 class="side-title mb-md muted">Upcoming Peak Windows</h4>
              <div class="peaks-list custom-scrollbar">
                @for (peak of opData()?.operations?.peakHours; track peak.hour) {
                  <div class="peak-item group">
                    <div class="peak-info">
                      <div class="peak-bar"></div>
                      <div>
                        <p class="peak-time">
                          {{ getDayName(peak.day) }}, {{ peak.hour }}:00
                        </p>
                        <p class="peak-label-sm">Projected Load</p>
                      </div>
                    </div>
                    <span class="peak-count highlight">{{ peak.count }} Orders</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

      } @else {
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p class="loader-text">Synchronizing operational logs...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .metrics-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* HEADER */
    .header-section {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-lg);
    }
    .page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
    .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }
    .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

    .filter-section { margin-bottom: var(--spacing-lg); }

    /* KPI GRID */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);
    }

    .kpi-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl); padding: var(--spacing-lg);
      position: relative; overflow: hidden; transition: var(--transition-base);
    }
    .kpi-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

    .kpi-label {
      font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-label); margin: 0 0 4px 0;
    }

    .kpi-value {
      font-size: var(--font-size-3xl); font-weight: 800; margin: 0; font-family: var(--font-heading);
    }
    .kpi-value.primary { color: var(--text-primary); }
    .kpi-value.warning { color: var(--color-warning); }
    .kpi-value.error { color: var(--color-error); }

    .kpi-footer { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
    .footer-icon.success { color: var(--color-success); font-size: 14px; }
    .footer-text { font-size: 11px; color: var(--text-tertiary); font-weight: 500; }

    /* PEAK CARD */
    .peak-card { background: var(--accent-gradient); border: none; color: #ffffff; }
    .peak-content { position: relative; z-index: 2; }
    .peak-bg-icon { position: absolute; right: -10px; bottom: -10px; font-size: 5rem; opacity: 0.1; color: #ffffff; pointer-events: none; }
    .peak-sub { font-size: 10px; font-weight: 700; opacity: 0.8; text-transform: uppercase; margin-top: 4px; }

    /* CONTENT GRID */
    .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
    @media(min-width: 1024px) { .content-grid { grid-template-columns: 2fr 1fr; } }

    /* GRID CARD */
    .grid-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl); overflow: hidden;
      height: 100%; min-height: 400px; display: flex; flex-direction: column;
    }
    .grid-header {
      padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center;
    }
    .grid-title { font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* SIDEBAR */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .side-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); padding: var(--spacing-lg); }
    
    .side-header { display: flex; align-items: center; gap: 8px; }
    .header-icon.warning { color: var(--color-warning); }
    .side-title { font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .side-title.muted { color: var(--text-label); }
    .mb-md { margin-bottom: var(--spacing-md); }

    /* RECS LIST */
    .recs-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
    .rec-item { padding: 10px; background: var(--bg-ternary); border-radius: 6px; border-left: 3px solid var(--color-info); }
    .rec-text { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin: 0; }
    .empty-text { font-size: 11px; color: var(--text-tertiary); font-style: italic; }

    /* PEAKS LIST */
    .peaks-list { display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto; }
    .peak-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px dashed var(--border-secondary); }
    .peak-info { display: flex; align-items: center; gap: 10px; }
    .peak-bar { width: 4px; height: 28px; background: var(--accent-primary); border-radius: 4px; }
    .peak-time { font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px 0; }
    .peak-label-sm { font-size: 10px; color: var(--text-tertiary); margin: 0; }
    .peak-count { font-size: 12px; font-weight: 800; color: var(--text-primary); }
    .highlight { color: var(--accent-primary); }

    /* SCROLLBAR */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-secondary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }

    /* LOADER */
    .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    .loader-text { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-tertiary); }
  `]
})
export class OperationalMetricsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  opData = signal<any>(null);
  loading = signal<boolean>(false);
  staffColumns: any[] = [];

  private currentFilters: any = {};

  filterConfig: FilterField[] = [
    { key: 'branchId', label: 'Branch Context', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'Global Operations' },
    { key: 'date', label: 'Metric Period', type: 'date-range' }
  ];

  ngOnInit() {
    this.setupColumns();
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const [startDate, endDate] = this.resolveDateRange();
    const branchId = this.currentFilters.branchId;

    this.analyticsService.getOperationalMetrics(startDate, endDate, branchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.opData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private resolveDateRange(): [string | undefined, string | undefined] {
    const start = this.currentFilters.startDate ?? this.currentFilters.date?.[0];
    const end = this.currentFilters.endDate ?? this.currentFilters.date?.[1];
    return [this.toIsoDate(start), this.toIsoDate(end)];
  }

  private toIsoDate(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  getFormattedPeakHour(): string {
    const peaks = this.opData()?.operations?.peakHours;
    if (!peaks || peaks.length === 0) return '--';

    // Sort by count descending to find highest peak
    const topPeak = [...peaks].sort((a: any, b: any) => b.count - a.count)[0];
    return `${this.getDayName(topPeak.day)} @ ${topPeak.hour}:00`;
  }

  getDayName(day: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[day] || 'Unknown';
  }

  // UPDATED: Strictly Separate Columns
  setupColumns(): void {
    this.staffColumns = [
      // 1. STAFF ID
      {
        field: '_id',
        headerName: 'System ID',
        width: 100,
        // Shows last 6 chars for brevity
        valueFormatter: (params: any) => params.value ? '...' + params.value.slice(-6) : '--',
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-tertiary)', 'font-size': '11px', 'display': 'flex', 'align-items': 'center' }
      },
      // 2. NAME
      {
        field: 'name',
        headerName: 'Associate Name',
        flex: 1.5,
        minWidth: 180,
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          const initials = this.commonService.getInitials(name);
          return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--bg-ternary); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border: 1px solid var(--border-secondary);">
                      ${initials}
                    </div>
                    <span style="font-weight: 700; color: var(--text-primary); font-size: 13px;">${name}</span>
                  </div>`;
        }
      },
      // 3. TRANSACTION COUNT
      {
        field: 'count',
        headerName: 'Orders',
        width: 100,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'font-weight': '600', 'text-align': 'right', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      },
      // 4. TOTAL REVENUE
      {
        field: 'revenue',
        headerName: 'Total Sales',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)', 'text-align': 'right', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      },
      // 5. EFFICIENCY (Derived)
      {
        headerName: 'Avg Ticket',
        width: 120,
        type: 'rightAligned',
        valueGetter: (params: any) => {
          const rev = params.data.revenue || 0;
          const cnt = params.data.count || 1;
          return rev / cnt;
        },
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'color': 'var(--accent-primary)', 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}


