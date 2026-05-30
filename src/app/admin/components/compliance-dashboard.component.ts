import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface HealthIssue {
  check: string;
  status: 'healthy' | 'warning' | 'error';
  details: string;
}

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    AgShareGrid,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="compliance-container">

      <div class="main-card">

        <div class="header-row">
          <div>
            <h2 class="page-title">
              <i class="pi pi-shield header-icon"></i>
              Compliance & Governance
            </h2>
            <p class="page-subtitle">
              Audit logs, Tax compliance tracking, and Data integrity diagnostics
            </p>
          </div>
          <div class="header-actions">
             <p-button label="Validation Report" icon="pi pi-check-square" [outlined]="true" severity="secondary" size="small"></p-button>
             <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadData()" [loading]="loading()"></p-button>
          </div>
        </div>

        <div class="filter-wrapper">
           <app-universal-filter
             [entityType]="'compliance-dashboard'"
             [config]="filterConfig"
             (filterChange)="onFilterUpdate($event)">
           </app-universal-filter>
        </div>

        @if (!loading()) {
          
          <div class="metrics-grid">
            
            <div class="metric-card health-card">
              <p class="card-label">Data Health Score</p>
              
              <div class="score-circle">
                 <svg class="progress-ring" viewBox="0 0 128 128">
                   <circle cx="64" cy="64" r="58" class="ring-track" />
                   <circle cx="64" cy="64" r="58" class="ring-value"
                     stroke-dasharray="364.4"
                     [attr.stroke-dashoffset]="364.4 - (364.4 * (complianceData()?.dataHealth?.score || 0) / 100)"
                   />
                 </svg>
                 <div class="score-text">
                    <span class="score-number">{{ complianceData()?.dataHealth?.score }}%</span>
                 </div>
              </div>
              <p class="score-status">System Optimal</p>
            </div>

            <div class="metric-card diagnostics-card">
               <h3 class="card-title mb-md">System Integrity Diagnostics</h3>
               
               <div class="diagnostics-list custom-scrollbar">
                 @for (issue of complianceData()?.dataHealth?.issues; track issue.check) {
                   <div class="diagnostic-item" [ngClass]="issue.status">
                      <div class="status-icon">
                        <i class="pi" 
                           [ngClass]="issue.status === 'healthy' ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
                      </div>
                      <div>
                        <p class="issue-title">{{ issue.check }}</p>
                        <p class="issue-detail">{{ issue.details }}</p>
                      </div>
                   </div>
                 }
               </div>
            </div>

            <div class="metric-card tax-card">
              <div class="card-header-mini">
                <h3 class="card-title">Tax Ledger</h3>
                <span class="status-badge success">{{ complianceData()?.tax?.compliance }}</span>
              </div>

              <div class="tax-rows">
                <div class="tax-row">
                  <span class="tax-label">Input GST</span>
                  <span class="tax-value">{{ commonService.formatCurrency(complianceData()?.tax?.inputTax) }}</span>
                </div>
                <div class="tax-row">
                  <span class="tax-label">Output GST</span>
                  <span class="tax-value">{{ commonService.formatCurrency(complianceData()?.tax?.outputTax) }}</span>
                </div>
                <div class="tax-row border-top">
                  <span class="tax-label highlight">Net Payable</span>
                  <span class="tax-value highlight">{{ commonService.formatCurrency(complianceData()?.tax?.netPayable) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="audit-section">
            <div class="audit-header">
              <h3 class="card-title">Audit Trail (Recent Events)</h3>
              <span class="meta-label">Immutable Logs</span>
            </div>

            <div class="grid-wrapper">
               <app-ag-share-grid 
                 [columns]="auditColumns" 
                 [data]="complianceData()?.audit?.recentEvents || []" 
                 class="full-size-grid">
               </app-ag-share-grid>
            </div>
          </div>

        } @else {
          <div class="loader-container">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
            <p class="loader-text">Validating Governance Data...</p>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .compliance-container { padding: var(--spacing-sm); font-family: var(--font-body); }
    .main-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); padding: var(--spacing-xl); backdrop-filter: blur(16px); box-shadow: var(--shadow-lg); }

    .header-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
    .filter-wrapper { margin-bottom: var(--spacing-xl); }

    .page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); display: flex; align-items: center; gap: var(--spacing-sm); margin: 0 0 4px 0; letter-spacing: -0.01em; }
    .header-icon { color: var(--color-success); }
    .page-subtitle { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin: 0; }
    .header-actions { display: flex; gap: var(--spacing-sm); }

    /* METRICS GRID */
    .metrics-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
    @media (min-width: 1024px) { .metrics-grid { grid-template-columns: 3fr 5fr 4fr; } }

    .metric-card { background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); display: flex; flex-direction: column; }
    .card-label { font-size: 10px; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: var(--spacing-lg); text-align: center; }
    .card-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin: 0; }
    .mb-md { margin-bottom: var(--spacing-md); }

    /* HEALTH SCORE */
    .health-card { align-items: center; justify-content: center; text-align: center; }
    .score-circle { position: relative; width: 128px; height: 128px; margin-bottom: var(--spacing-md); }
    .progress-ring { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-track { fill: transparent; stroke: var(--border-primary); stroke-width: 8; }
    .ring-value { fill: transparent; stroke: var(--color-success); stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1s ease-in-out; }
    .score-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-number { font-size: var(--font-size-3xl); font-weight: 900; color: var(--text-primary); font-family: var(--font-heading); }
    .score-status { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--color-success); margin: 0; }

    /* DIAGNOSTICS */
    .diagnostics-list { display: flex; flex-direction: column; gap: var(--spacing-sm); height: 180px; overflow-y: auto; padding-right: 4px; }
    .diagnostic-item { padding: var(--spacing-sm); border: 1px solid transparent; border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-sm); align-items: flex-start; background: var(--bg-secondary); transition: background 0.2s; }
    .diagnostic-item:hover { background: var(--component-bg-hover); }
    .diagnostic-item.healthy { border-color: var(--border-secondary); }
    .diagnostic-item.warning { border-color: var(--color-warning-border); background: var(--color-warning-bg); }
    .diagnostic-item.error { border-color: var(--color-error-border); background: var(--color-error-bg); }
    .status-icon { margin-top: 2px; }
    .healthy .status-icon i { color: var(--color-success); }
    .warning .status-icon i { color: var(--color-warning); }
    .error .status-icon i { color: var(--color-error); }
    .issue-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-xs); color: var(--text-primary); margin: 0 0 2px 0; }
    .issue-detail { font-size: 10px; color: var(--text-secondary); margin: 0; line-height: 1.3; }

    /* TAX */
    .tax-card { justify-content: space-between; }
    .card-header-mini { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md); }
    .status-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: var(--ui-border-radius-sm); border: 1px solid transparent; }
    .status-badge.success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-border); }
    .tax-rows { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .tax-row { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: var(--spacing-xs); border-bottom: 1px solid var(--border-secondary); }
    .tax-row.border-top { border-bottom: none; padding-top: var(--spacing-xs); padding-bottom: 0; }
    .tax-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); }
    .tax-label.highlight { color: var(--color-success); }
    .tax-value { font-size: var(--font-size-lg); font-weight: bold; color: var(--text-primary); }
    .tax-value.highlight { color: var(--color-success); font-size: var(--font-size-xl); }

    /* AUDIT */
    .audit-section { border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); background: var(--bg-ternary); overflow: hidden; display: flex; flex-direction: column; height: 400px; }
    .audit-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-secondary); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; }
    .meta-label { font-size: 9px; font-family: var(--font-mono); text-transform: uppercase; opacity: 0.7; color: var(--text-tertiary); }
    .grid-wrapper { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; position: absolute; inset: 0; }

    /* UTILS */
    .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
    .loader-text { color: var(--text-tertiary); font-size: var(--font-size-sm); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
  `]
})
export class ComplianceDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  complianceData = signal<any>(null);
  loading = signal<boolean>(false);
  auditColumns: any[] = [];

  // Stored Filters
  private currentFilters: any = {};

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches', // Connects to MasterListService
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global System Scope'
    },
    {
      key: 'date', // Used for startDate/endDate logic
      label: 'Audit Period',
      type: 'date-range'
    }
  ];

  constructor(private analyticsService: AdminAnalyticsService, public commonService: CommonMethodService, private cdr: ChangeDetectorRef) { }

  ngOnInit() { this.setupColumns(); this.loadData(); }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const [startDate, endDate] = this.resolveDateRange();
    const params = {
      startDate,
      endDate,
      branchId: this.currentFilters.branchId
    };
    this.analyticsService.getComplianceDashboard(params.startDate, params.endDate, params.branchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.complianceData.set(res.data);
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

  setupColumns(): void {
    // Grid columns using Theme Tokens via CSS Variables
    this.auditColumns = [
      {
        field: 'userId.name',
        headerName: 'Administrator',
        sortable: true,
        flex: 1,
        minWidth: 140,
        cellRenderer: (params: any) => {
          const name = params.data.userId?.name || 'System';
          return `<span style="font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${name}
                  </span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'ip',
        headerName: 'Source IP',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const ip = params.value === '::1' ? 'Localhost' : params.value;
          return `<span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-secondary);">
                      ${ip}
                    </span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'action',
        headerName: 'Action',
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => {
          const raw = params.value || '';
          const displayAction = raw.includes(':') ? raw.split(':')[1] : raw;
          // Using Accent Color variables for badge
          return `<span style="text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: var(--accent-primary); background: var(--accent-focus); border: 1px solid var(--accent-secondary); padding: 2px 6px; border-radius: 4px;">
                    ${displayAction}
                  </span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'entityType',
        headerName: 'Target',
        width: 110,
        cellRenderer: (params: any) => {
          const entity = params.value || 'System';
          return `<span style="font-size: 11px; color: var(--text-tertiary); text-transform: capitalize;">${entity}</span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'createdAt',
        headerName: 'Time',
        sortable: true,
        width: 90,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'HH:mm:ss'),
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '600', 'font-size': '11px', 'color': 'var(--text-tertiary)', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      }
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
