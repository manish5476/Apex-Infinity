import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-branch-comparison',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressBarModule, 
    ProgressSpinnerModule,
    AgShareGrid
  ],
  template: `
    <div class="branch-dashboard-container">
      
      <div class="stats-grid">
        
        <div class="stat-card leader-card">
          <div class="card-bg-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="card-header">
            <p class="card-label">Market Leader</p>
            <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
          </div>
          <div class="card-footer">
            <span class="metric-value success">₹{{ comparison()?.topPerformer?.revenue | number }}</span>
            <span class="metric-label">Revenue</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="card-header">
            <p class="card-label">Highest Basket Value</p>
            <h3 class="card-value-text">{{ comparison()?.topPerformer?.branchName || '--' }}</h3>
          </div>
          <div class="card-footer">
            <span class="metric-value primary">₹{{ comparison()?.topPerformer?.avgBasketValue | number }}</span>
            <span class="metric-label">/ Invoice</span>
          </div>
        </div>

        <div class="stat-card summary-card">
          <div class="summary-header">
            <span class="card-label">Network Reach</span>
            <i class="pi pi-map action-icon"></i>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="row-label">Total Active Branches</span>
              <span class="row-value">{{ comparison()?.total || 0 }}</span>
            </div>
            <div class="summary-row border-top">
              <span class="row-label">Total Network Revenue</span>
              <span class="row-value success">₹{{ comparison()?.topPerformer?.revenue | number }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-card">
        <div class="grid-header">
          <h3 class="grid-title">Branch-wise Performance Breakdown</h3>
          <div class="grid-actions">
            <p-button icon="pi pi-download" label="Export" size="small" [text]="true" severity="secondary"></p-button>
          </div>
        </div>

        <div class="grid-container">
           <app-ag-share-grid 
             [columns]="branchColumns" 
             [data]="comparison()?.branches || []" 
             [showActions]="false" 
             class="full-size-grid">
           </app-ag-share-grid>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* HOST LAYOUT */
    :host {
      display: block;
      width: 100%;
    }

    .branch-dashboard-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* STATS GRID LAYOUT */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    /* SHARED CARD STYLES */
    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: var(--transition-base);
    }

    .stat-card:hover {
      border-color: var(--border-secondary);
      box-shadow: var(--shadow-sm);
    }

    /* TYPOGRAPHY */
    .card-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-xs);
    }

    .card-value-text {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .card-footer {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-sm);
    }

    .metric-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-heading); /* often nicer for numbers */
      letter-spacing: -0.02em;
    }

    .metric-value.success { color: var(--theme-success); }
    .metric-value.primary { color: var(--accent-primary); }

    .metric-label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    /* LEADER CARD SPECIFIC */
    .leader-card .card-bg-icon {
      position: absolute;
      top: -10px;
      right: -10px;
      opacity: 0.05;
      pointer-events: none;
    }

    .leader-card .card-bg-icon i {
      font-size: 5rem;
      color: var(--theme-success);
    }

    /* SUMMARY CARD SPECIFIC */
    .stat-card.summary-card {
      background: var(--bg-ternary); /* Slightly distinct bg */
      border-color: var(--border-secondary);
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }
    
    .action-icon {
      color: var(--text-secondary);
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm);
    }

    .summary-row.border-top {
      border-top: 1px solid var(--border-primary);
      padding-top: var(--spacing-sm);
    }

    .row-label { color: var(--text-secondary); }
    .row-value { font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .row-value.success { color: var(--theme-success); }

    /* DATA GRID CONTAINER */
    .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 600px; /* Fixed height for table scrolling */
    }

    .grid-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .grid-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }

    .grid-container {
      flex: 1;
      position: relative;
      background: var(--bg-secondary);
    }

    .full-size-grid {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class BranchComparisonComponent implements OnInit {
  comparison = signal<any>(null);
  loading = signal<boolean>(true);
  branchColumns: any[] = [];

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
    // We used CSS variables inside the HTML strings to ensure 
    // the grid responds to Theme changes automatically.
    this.branchColumns = [
      {
        headerName: 'Rank',
        width: 80,
        sortable: false,
        cellRenderer: (params: any) => {
          const rank = (params.node.rowIndex || 0) + 1;
          // Use CSS Var for color
          const colorVar = rank === 1 ? 'var(--theme-warning)' : 'var(--text-tertiary)';
          return `<div style="text-align: center; font-weight: 700; color: ${colorVar}; display: flex; align-items: center; justify-content: center; height: 100%;">#${rank}</div>`;
        }
      },
      {
        field: 'branchName', 
        headerName: 'Branch Name', 
        sortable: true, 
        flex: 1,
        cellRenderer: (params: any) => {
          const rank = params.node.rowIndex;
          // Use CSS Var for status dot
          const dotColor = rank === 0 ? 'var(--theme-success)' : 'var(--theme-info)';
          const name = params.value || 'Unknown Branch';
          return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor};"></div>
                    <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-base);">${name}</span>
                  </div>`;
        }
      },
      {
        headerName: 'Revenue Share', 
        width: 160,
        sortable: false,
        cellRenderer: (params: any) => {
           // Logic placeholder
           const percentage = 100; 
           // Use CSS Vars for bars
           return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
                    <div style="flex: 1; height: 6px; border-radius: 4px; background: var(--bg-ternary); overflow: hidden;">
                      <div style="height: 100%; background: var(--accent-primary); width: ${percentage}%;"></div>
                    </div>
                    <span style="font-size: var(--font-size-xs); font-weight: 700; color: var(--text-secondary); width: 32px;">${percentage}%</span>
                   </div>`;
        }
      },
      {
        field: 'invoiceCount', 
        headerName: 'Invoices', 
        sortable: true, 
        width: 110,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-weight': '600', 'color': 'var(--text-secondary)' }
      },
      {
        field: 'avgBasketValue', 
        headerName: 'Avg Basket', 
        sortable: true, 
        width: 140,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'text-align': 'right' } 
      },
      {
        field: 'revenue', 
        headerName: 'Net Revenue', 
        sortable: true, 
        width: 150,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getBranchComparison().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.comparison.set(res.data.comparison);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
}
