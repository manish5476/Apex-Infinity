import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-product-performance',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressSpinnerModule, 
    TagModule, 
    AgShareGrid,
    UniversalFilterComponent
  ],
  template: `
    <div class="performance-container">

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'product-performance'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="top-section">
          <div class="section-header">
            <div>
              <h2 class="page-title">Profitability Champions</h2>
              <p class="page-subtitle">Products delivering the highest net margin per unit</p>
            </div>
            <div class="header-actions">
               <span class="scroll-hint">SCROLL &rarr;</span>
               <p-button label="Export CSV" icon="pi pi-file-excel" [text]="true" size="small" severity="secondary"></p-button>
            </div>
          </div>

          <div class="cards-scroller custom-scrollbar">
            @for (prod of performanceData()?.highMargin; track prod._id) {
              <div class="margin-card">
                <div class="card-top">
                  <span class="badge success">High Margin</span>
                  <i class="pi pi-arrow-up-right trend-icon"></i>
                </div>
                
                <h3 class="prod-name" [title]="prod.name">{{ prod.name }}</h3>
                <p class="prod-sku">{{ prod.sku }}</p>
                
                <div class="card-stats">
                  <div>
                    <p class="stat-label">Margin/Unit</p>
                    <p class="stat-value success">{{ commonService.formatCurrency(prod.margin) }}</p>
                  </div>
                  <div class="stat-right">
                    <p class="percent-value">{{ prod.marginPercent | number:'1.1-1' }}%</p>
                    <div class="progress-track">
                       <div class="progress-fill success" [style.width]="(prod.marginPercent > 100 ? 100 : prod.marginPercent) + '%'"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <div>
                   <h3 class="grid-title">Dead Stock Inventory</h3>
                   <p class="grid-sub">Items with zero movement (Liquidation Candidates)</p>
                </div>
                <span class="badge error">{{ performanceData()?.deadStock?.length || 0 }} ITEMS FOUND</span>
              </div>
              
              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="deadStockColumns" 
                   [data]="performanceData()?.deadStock || []" 
                   [showActions]="true" 
                   (gridEvent)="handleGridAction($event)"
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            <div class="side-card">
               <h4 class="side-title">Asset Efficiency</h4>
               <p class="side-text mb-md">Total capital locked in non-moving stock:</p>
               <div class="mb-lg">
                 <p class="locked-value">{{ commonService.formatCurrency(calculateTotalDeadStockValue()) }}</p>
                 <p class="risk-label">High Risk Exposure</p>
               </div>
               <p-button label="Liquidate Strategy" severity="danger" [fluid]="true" size="small"></p-button>
            </div>

            <div class="side-card tip-card">
              <div class="tip-content">
                <i class="pi pi-info-circle tip-icon"></i>
                <div>
                  <p class="tip-title">Stock Rotation Tip</p>
                  <p class="tip-text">
                    <span class="highlight">Bundle Offer:</span> Combine dead stock items with high-margin champions to clear inventory faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p class="loader-text">Auditing product performance...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .performance-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100%; }

    /* Filter Section */
    .filter-section { margin-bottom: var(--spacing-lg); }

    /* TOP SECTION */
    .top-section { margin-bottom: var(--spacing-2xl); }
    .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-lg); }
    .page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0 0 4px 0; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; }
    .header-actions { display: flex; gap: var(--spacing-sm); align-items: center; }
    .scroll-hint { font-size: 10px; opacity: 0.6; font-weight: bold; color: var(--text-tertiary); display: none; }
    @media(min-width: 768px) { .scroll-hint { display: block; } }

    /* CARDS SCROLLER */
    .cards-scroller { display: flex; gap: var(--spacing-lg); overflow-x: auto; padding-bottom: var(--spacing-md); scroll-snap-type: x mandatory; }
    .margin-card { min-width: 280px; padding: var(--spacing-lg); background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); transition: var(--transition-base); scroll-snap-align: start; display: flex; flex-direction: column; }
    .margin-card:hover { transform: translateY(-2px); border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md); }
    
    .badge { font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; border: 1px solid transparent; }
    .badge.success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-border); }
    .badge.error { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error-border); }

    .trend-icon { color: var(--color-success); font-size: var(--font-size-xs); }
    .prod-name { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prod-sku { font-size: var(--font-size-xs); color: var(--text-label); font-family: var(--font-mono); margin: 0 0 var(--spacing-lg) 0; }
    .card-stats { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
    .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
    .stat-value { font-size: var(--font-size-lg); font-weight: bold; margin: 0; }
    .stat-value.success { color: var(--color-success); }
    .stat-right { text-align: right; }
    .percent-value { font-weight: bold; color: var(--text-primary); font-size: var(--font-size-sm); margin: 0; }
    .progress-track { width: 3rem; height: 4px; background: var(--bg-ternary); border-radius: 99px; margin-top: 4px; overflow: hidden; }
    .progress-fill.success { background: var(--color-success); height: 100%; }

    /* CONTENT GRID */
    .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
    @media(min-width: 1024px) { .content-grid { grid-template-columns: 2fr 1fr; } }

    /* GRID CARD */
    .grid-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); overflow: hidden; height: 100%; min-height: 400px; display: flex; flex-direction: column; box-shadow: var(--shadow-sm); }
    .grid-header { padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center; }
    .grid-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .grid-sub { font-size: 10px; color: var(--text-tertiary); margin: 2px 0 0 0; }
    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* SIDEBAR */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .side-card { background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-xl); padding: var(--spacing-lg); }
    .side-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-label); margin: 0 0 var(--spacing-sm) 0; }
    .side-text { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-lg { margin-bottom: var(--spacing-lg); }
    .locked-value { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-error); margin: 0; line-height: 1; }
    .risk-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--color-error); opacity: 0.8; margin-top: 4px; }

    /* TIP CARD */
    .tip-card { background: var(--color-info-bg); border: 1px dashed var(--color-info); }
    .tip-content { display: flex; gap: var(--spacing-sm); }
    .tip-icon { color: var(--color-info); margin-top: 2px; }
    .tip-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); color: var(--color-info); margin: 0 0 4px 0; }
    .tip-text { font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4; margin: 0; }
    .highlight { font-weight: bold; color: var(--text-primary); }

    /* SCROLLBAR */
    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-secondary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 4px; }

    /* LOADER */
    .loader-container { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
    .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }
  `]
})
export class ProductPerformanceComponent implements OnInit {
  performanceData = signal<any>(null);
  loading = signal<boolean>(false);
  deadStockColumns: any[] = [];

  private currentFilters: any = {};

  filterConfig: FilterField[] = [
    { 
      key: 'branchId', 
      label: 'Branch Context', 
      type: 'select', 
      dataSourceKey: 'branches', 
      optionLabel: 'name', 
      optionValue: '_id', 
      placeholder: 'Global Inventory' 
    }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  // FIXED: Separated Columns
  setupColumns(): void {
    this.deadStockColumns = [
      // 1. PRODUCT NAME
      { 
        field: 'name', 
        headerName: 'Product Name', 
        sortable: true, 
        flex: 1.5, 
        minWidth: 180,
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': '12px' }
      },
      // 2. SKU CODE
      { 
        field: 'sku', 
        headerName: 'SKU', 
        sortable: true, 
        width: 140, 
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'font-size': '11px', 'letter-spacing': '0.5px' }
      },
      // 3. QUANTITY
      { 
        field: 'stockQuantity', 
        headerName: 'Qty', 
        sortable: true, 
        width: 100, 
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '600', 'text-align': 'right', 'color': 'var(--text-primary)' }
      },
      // 4. TIED CAPITAL (Value)
      { 
        field: 'value', 
        headerName: 'Tied Capital', 
        sortable: true, 
        width: 140, 
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-error)', 'text-align': 'right', 'font-family': 'var(--font-mono)' }
      },
      // 5. ACTION
      { 
        headerName: 'Action',
        width: 110,
        cellRenderer: (params: any) => {
           return `<button style="background: var(--bg-primary); border: 1px solid var(--color-error-border); color: var(--color-error); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer; text-transform: uppercase; transition: all 0.2s;">
                     Liquidate
                   </button>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      }
    ];
    this.cdr.detectChanges();
  }

  handleGridAction(event: any) {
    console.log('Grid Action:', event);
  }

  calculateTotalDeadStockValue(): number {
    const stock = this.performanceData()?.deadStock || [];
    return stock.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
  }

  loadData() {
    this.loading.set(true);
    const branchId = this.currentFilters.branchId;

    this.analyticsService.getProductPerformance(branchId).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.performanceData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}