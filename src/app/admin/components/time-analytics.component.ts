import { Component, OnInit, signal, computed, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';

import { TabsModule } from 'primeng/tabs';
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

@Component({
  selector: 'app-time-analytics',
  standalone: true,
  imports: [
    TabsModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    AgShareGrid,
    UniversalFilterComponent
  ],
  template: `
    <div class="time-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">
            <i class="pi pi-calendar-clock header-icon"></i>
            Revenue Chronology
          </h2>
          <p class="page-subtitle">
            Multi-dimensional time analysis of sales volume
          </p>
        </div>
        <p-button label="Refresh Timeline" icon="pi pi-history" [outlined]="true" severity="secondary" size="small" (onClick)="loadData()" [loading]="loading()"></p-button>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'time-analytics'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      @if (!loading()) {
        
        <div class="kpi-grid">
           
           <div class="kpi-card hour-card">
             <p class="kpi-label">Peak Hour</p>
             <p class="kpi-value">{{ topHour()?.hourLabel || '--' }}</p>
             <p class="kpi-sub success">{{ commonService.formatCurrency(topHour()?.totalRevenue) }} Revenue</p>
           </div>

           <div class="kpi-card day-card">
             <p class="kpi-label">Strongest Day</p>
             <p class="kpi-value">{{ topDay()?.dayLabel || '--' }}</p>
             <p class="kpi-sub primary">{{ topDay()?.transactionCount || 0 }} Transactions</p>
           </div>

           <div class="kpi-card ticket-card">
             <p class="kpi-label">Avg Ticket (Monthly)</p>
             <p class="kpi-value">{{ commonService.formatCurrency(avgMonthlyTicket()) }}</p>
             <p class="kpi-sub warning">Based on Jan 2026</p>
           </div>

           <div class="kpi-card total-card">
             <div class="total-content">
                <p class="total-label">Total Period Rev</p>
                <p class="total-value">{{ commonService.formatCurrency(totalPeriodRevenue()) }}</p>
             </div>
             <div class="glow-effect"></div>
           </div>
        </div>

        <div class="tabs-card">
              
          <p-tabs [value]="'0'">
            <p-tablist styleClass="custom-tablist">
              <p-tab value="0"><i class="pi pi-clock tab-icon"></i> <span class="tab-label">Hourly</span></p-tab>
              <p-tab value="1"><i class="pi pi-calendar tab-icon"></i> <span class="tab-label">Daily</span></p-tab>
              <p-tab value="2"><i class="pi pi-calendar-plus tab-icon"></i> <span class="tab-label">Weekly</span></p-tab>
              <p-tab value="3"><i class="pi pi-chart-line tab-icon"></i> <span class="tab-label">Monthly</span></p-tab>
            </p-tablist>

            <p-tabpanels class="p-0">
              
              <p-tabpanel value="0">
                 <div class="grid-container">
                    <app-ag-share-grid 
                      [columns]="hourlyColumns" 
                      [data]="timeData()?.hourly || []"
                      class="full-size-grid">
                    </app-ag-share-grid>
                 </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                 <div class="grid-container">
                    <app-ag-share-grid 
                      [columns]="dailyColumns" 
                      [data]="timeData()?.daily || []"
                      class="full-size-grid">
                    </app-ag-share-grid>
                 </div>
              </p-tabpanel>

              <p-tabpanel value="2">
                 <div class="grid-container">
                    <app-ag-share-grid 
                      [columns]="weeklyColumns" 
                      [data]="timeData()?.weekly || []"
                      class="full-size-grid">
                    </app-ag-share-grid>
                 </div>
              </p-tabpanel>

              <p-tabpanel value="3">
                 <div class="grid-container">
                    <app-ag-share-grid 
                      [columns]="monthlyColumns" 
                      [data]="timeData()?.monthly || []"
                      class="full-size-grid">
                    </app-ag-share-grid>
                 </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </div>

      } @else {
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Compiling Time Series...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .time-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* HEADER */
    .header-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    
    .filter-section { margin-bottom: var(--spacing-lg); }

    .page-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }

    .header-icon { color: var(--accent-primary); }

    .page-subtitle {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin: 0;
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    /* KPI CARDS */
    .kpi-card {
      padding: var(--spacing-lg);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      transition: var(--transition-base);
    }
    .kpi-card:hover { transform: translateY(-2px); border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

    .kpi-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-tertiary);
      margin: 0 0 4px 0;
    }

    .kpi-value {
      font-size: var(--font-size-lg);
      font-weight: bold;
      color: var(--text-primary);
      margin: 0;
      font-family: var(--font-mono);
    }

    .kpi-sub {
      font-size: 10px;
      font-weight: bold;
      margin-top: 4px;
    }
    .kpi-sub.success { color: var(--color-success); }
    .kpi-sub.primary { color: var(--accent-primary); }
    .kpi-sub.warning { color: var(--color-warning); }

    /* TOTAL CARD (Gradient) */
    .total-card {
      position: relative;
      overflow: hidden;
      background: var(--accent-gradient);
      border: 1px solid var(--accent-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .total-content { position: relative; z-index: 10; }

    .total-label {
      color: #fff;
      font-weight: 900;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.9;
      margin: 0 0 2px 0;
    }

    .total-value {
      font-size: var(--font-size-2xl);
      font-weight: bold;
      color: #fff;
      margin: 0;
    }

    .glow-effect {
      position: absolute;
      right: -1rem; bottom: -1rem;
      width: 5rem; height: 5rem;
      background: rgba(255,255,255,0.2);
      filter: blur(24px);
      border-radius: 50%;
    }

    /* TABS CARD */
    .tabs-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .tab-icon { margin-right: 8px; font-size: 0.9rem; }
    .tab-label { font-size: var(--font-size-sm); font-weight: bold; }

    /* GRID CONTAINER */
    .grid-container { position: relative; min-height: 400px; width: 100%; }
    .full-size-grid { width: 100%; height: 100%; display: block; position: absolute; inset: 0; }

    /* LOADER */
    .loader-container {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class TimeAnalyticsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  timeData = signal<any>(null);
  loading = signal<boolean>(false);

  // Column Definitions
  hourlyColumns: any[] = [];
  dailyColumns: any[] = [];
  weeklyColumns: any[] = [];
  monthlyColumns: any[] = [];

  // Filter State
  private currentFilters: any = {};

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Scope',
      type: 'select',
      dataSourceKey: 'branches', // Binds to MasterListService
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Chronology'
    }
  ];

  // Computed Insights
  totalPeriodRevenue = computed(() => {
    return this.timeData()?.monthly?.reduce((acc: number, m: any) => acc + m.totalRevenue, 0) || 0;
  });

  topHour = computed(() => {
    if (!this.timeData()?.hourly?.length) return null;
    return [...this.timeData().hourly].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  });

  topDay = computed(() => {
    if (!this.timeData()?.daily?.length) return null;
    return [...this.timeData().daily].sort((a, b) => b.transactionCount - a.transactionCount)[0];
  });

  avgMonthlyTicket = computed(() => {
    const month = this.timeData()?.monthly?.[0];
    if (!month || !month.transactionCount) return 0;
    return month.totalRevenue / month.transactionCount;
  });

  ngOnInit() {
    this.setupColumns();
    // loadData triggered by filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Pass branch context
    const branchId = this.currentFilters.branchId;

    this.analyticsService.getTimeBasedAnalytics(branchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.timeData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns() {
    // Grid columns using CSS Variables for Theming

    // 1. Hourly
    this.hourlyColumns = [
      { field: 'hourLabel', headerName: 'Time Slot', sortable: true, flex: 1, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'color': 'var(--text-secondary)' } },
      { field: 'avgTicketSize', headerName: 'Avg Ticket', sortable: true, width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '700', 'text-align': 'right' } },
      { field: 'totalRevenue', headerName: 'Total Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': 'var(--color-success)', 'font-weight': '700', 'text-align': 'right' } }
    ];

    // 2. Daily
    this.dailyColumns = [
      { field: 'dayLabel', headerName: 'Day', sortable: true, flex: 1, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'color': 'var(--text-secondary)' } },
      { field: 'totalRevenue', headerName: 'Daily Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': 'var(--color-success)', 'font-weight': '700', 'text-align': 'right' } }
    ];

    // 3. Weekly
    this.weeklyColumns = [
      { field: 'week', headerName: 'Week Number', sortable: true, flex: 1, valueFormatter: (p: any) => `Week ${p.value}`, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'color': 'var(--text-secondary)' } },
      { field: 'totalRevenue', headerName: 'Weekly Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '700', 'text-align': 'right' } }
    ];

    // 4. Monthly
    this.monthlyColumns = [
      { field: 'monthLabel', headerName: 'Period', sortable: true, flex: 1, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'color': 'var(--text-secondary)' } },
      { field: 'totalRevenue', headerName: 'Monthly Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': 'var(--color-warning)', 'font-weight': '700', 'text-align': 'right' } }
    ];

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
