import { Component, OnInit, signal, computed, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

// Services & Shared
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface DeadStockItem {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  value: number;
  daysInactive: number;
}

@Component({
  selector: 'app-dead-stock-analysis',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    TagModule,
    DataGridComponent,
    UniversalFilterComponent
  ],
  template: `
    <div class="deadstock-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Inventory Liquidity Audit</h2>
          <p class="page-subtitle">
            Items stagnant for {{ currentThreshold }}+ days requiring liquidation
          </p>
        </div>
        <div class="action-group">
           <p-button label="Export Report" icon="pi pi-file-pdf" severity="secondary" [outlined]="true" size="small"></p-button>
           <p-button label="Bulk Liquidation" icon="pi pi-bolt" severity="danger" size="small"></p-button>
        </div>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'dead-stock'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      @if (!loading()) {
        
        <div class="kpi-grid">
          
          <div class="kpi-card locked-card">
            <p class="kpi-label">Total Capital Locked</p>
            <h2 class="kpi-value error">{{ commonService.formatCurrency(totalValueLocked()) }}</h2>
            <p class="kpi-meta">Across {{ deadStock().length }} Unique SKUs</p>
            <i class="pi pi-lock kpi-bg-icon"></i>
          </div>

          <div class="kpi-card units-card">
            <p class="kpi-label">Idle Units</p>
            <h2 class="kpi-value primary">{{ totalUnits() | number }}</h2>
            <p class="kpi-alert">Avg Inactivity: {{ getAvgInactivity() | number:'1.0-0' }} Days</p>
          </div>

          <div class="kpi-card risk-card">
            <p class="kpi-label">Top Liquidation Target</p>
            <h3 class="risk-name" [title]="deadStock()[0]?.name">{{ deadStock()[0]?.name || '--' }}</h3>
            <div class="risk-footer">
               <span class="risk-value">{{ commonService.formatCurrency(deadStock()[0]?.value) }}</span>
               @if (deadStock().length) {
                 <span class="badge critical">Priority</span>
               }
            </div>
          </div>
        </div>

        <div class="table-card">
          <div class="card-header">
            <h3 class="card-title">Stagnant Inventory List</h3>
            <span class="header-tag">SORTED BY VALUE LOCKED</span>
          </div>

          <div class="grid-container">
             <app-data-grid [viewOnly]="true" [pagination]="true" [enableExport]="true" class="full-size-grid" 
               [columns]="stockColumns" 
               [data]="deadStock()" 
               class="full-size-grid">
             </app-data-grid>
          </div>
        </div>

        <div class="advisory-box">
          <i class="pi pi-exclamation-circle advisory-icon"></i>
          <div>
            <p class="advisory-title">Liquidation Strategy</p>
            <p class="advisory-text">
              Capital worth <span class="highlight">{{ commonService.formatCurrency(totalValueLocked()) }}</span> is tied up. 
              Recommended Action: Apply a <b>15-20% Flash Sale</b> on the top 5 high-value items like <span class="highlight-white">{{ deadStock()[0]?.name }}</span> to recover liquidity immediately.
            </p>
          </div>
        </div>

      } @else {
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Analyzing Inventory Aging...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }

    .deadstock-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* HEADER */
    .header-section {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end;
      gap: var(--spacing-md); margin-bottom: var(--spacing-md);
    }
    .page-title {
      font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);
      color: var(--text-primary); font-family: var(--font-heading); margin: 0 0 4px 0;
    }
    .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }
    .action-group { display: flex; align-items: center; gap: var(--spacing-sm); }
    
    .filter-section { margin-bottom: var(--spacing-lg); }

    /* KPI GRID */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);
    }

    .kpi-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl); padding: var(--spacing-lg);
      position: relative; overflow: hidden;
    }

    .kpi-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-label); margin: 0 0 4px 0;
    }
    .kpi-value {
      font-size: 2rem; font-weight: 700; margin: 0; line-height: 1;
      &.error { color: var(--color-error); }
      &.primary { color: var(--text-primary); }
    }
    .kpi-meta { margin-top: 8px; font-size: 12px; color: var(--text-tertiary); }
    .kpi-alert { margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--color-warning); }

    .kpi-bg-icon {
      position: absolute; bottom: -10px; right: -10px; opacity: 0.05;
      font-size: 4rem; pointer-events: none; color: var(--text-primary);
    }

    /* Risk Card Specifics */
    .risk-card { background: var(--bg-ternary); border-color: var(--border-secondary); }
    .risk-name {
      font-size: 1rem; font-weight: 700; color: var(--text-primary);
      margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .risk-footer {
      display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;
    }
    .risk-value { font-weight: 700; color: var(--color-error); font-family: var(--font-mono); }
    .badge.critical {
      background: rgba(239, 68, 68, 0.1); color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2); font-size: 10px;
      padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;
    }

    /* TABLE CARD */
    .table-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl); overflow: hidden;
      display: flex; flex-direction: column;
      height: 600px;
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .header-tag { font-size: 10px; font-weight: 700; color: var(--text-label); background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-secondary); }

    .grid-container { flex: 1; position: relative; min-height: 0; overflow: hidden; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* ADVISORY BOX */
    .advisory-box {
      margin-top: var(--spacing-lg); padding: var(--spacing-md);
      border: 1px dashed var(--border-secondary); background: rgba(239, 68, 68, 0.03);
      border-radius: var(--ui-border-radius-lg); display: flex; gap: var(--spacing-md);
    }
    .advisory-icon { color: var(--color-error); margin-top: 2px; }
    .advisory-title { font-weight: 700; font-size: 14px; color: var(--text-primary); margin: 0 0 2px 0; }
    .advisory-text { font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4; }
    .highlight { color: var(--color-error); font-weight: 700; }
    .highlight-white { color: var(--text-primary); font-weight: 700; }

    /* LOADER */
    .loader-container {
      height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    }
    .loader-text { font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class DeadStockAnalysisComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  deadStock = signal<DeadStockItem[]>([]);
  loading = signal<boolean>(true);
  stockColumns: any[] = [];

  // Data Computations
  totalValueLocked = computed(() => this.deadStock().reduce((acc, item) => acc + item.value, 0));
  totalUnits = computed(() => this.deadStock().reduce((acc, item) => acc + item.quantity, 0));

  // Current State
  currentThreshold = 90;
  private currentFilters: any = {};

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Inventory'
    },
    {
      key: 'days',
      label: 'Inactivity Threshold',
      type: 'select',
      staticOptions: [
        { label: '60 Days', value: 60 },
        { label: '90 Days', value: 90 },
        { label: '120 Days', value: 120 },
        { label: '180 Days', value: 180 }
      ],
      defaultValue: 90,
      optionLabel: 'label',
      optionValue: 'value'
    }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.setupColumns();
    // loadData triggered by filter init
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.currentThreshold = filters.days || 90;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const branchId = this.currentFilters.branchId;
    const days = this.currentFilters.days || 90;

    this.analyticsService.getDeadStockReport(branchId, days).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.deadStock.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getAvgInactivity(): number {
    const items = this.deadStock();
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + item.daysInactive, 0) / items.length;
  }

  setupColumns(): void {
    this.stockColumns = [
      {
        field: 'name',
        headerName: 'Product Name',
        sortable: true,
        flex: 1.2,
        minWidth: 180,
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': '12px', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'sku',
        headerName: 'SKU Code',
        sortable: true,
        width: 140,
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'font-size': '11px', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'quantity',
        headerName: 'Qty',
        sortable: true,
        width: 90,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '600', 'text-align': 'right', 'color': 'var(--text-secondary)', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      },
      {
        field: 'value',
        headerName: 'Value Locked',
        sortable: true,
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: (params: any) => ({
          'font-weight': '700',
          'color': 'var(--color-error)',
          'text-align': 'right',
          'font-family': 'var(--font-mono)',
          'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end'
        })
      },
      {
        headerName: 'Strategy',
        width: 130,
        cellRenderer: (params: any) => `
          <div style="display: flex; gap: 6px; align-items: center; height: 100%;">
            <button style="
              background: var(--bg-primary); 
              border: 1px solid var(--accent-primary); 
              color: var(--accent-primary); 
              padding: 0px 8px; 
              height: 22px; 
              border-radius: 4px; 
              font-size: 9px; 
              font-weight: 800; 
              cursor: pointer; 
              line-height: 20px;
              text-transform: uppercase;">
              SALE
            </button>
            <button style="
              background: var(--bg-primary); 
              border: 1px solid var(--color-warning); 
              color: var(--color-warning); 
              padding: 0px 8px; 
              height: 22px; 
              border-radius: 4px; 
              font-size: 9px; 
              font-weight: 800; 
              cursor: pointer; 
              line-height: 20px;
              text-transform: uppercase;">
              MOVE
            </button>
          </div>`,
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}


