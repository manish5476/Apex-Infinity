import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-customer-intelligence',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    TagModule, 
    ProgressSpinnerModule,
    AgShareGrid
  ],
  template: `
    <div class="intelligence-container">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="stats-grid">
          
          <div class="stat-card ltv-card">
            <p class="card-label">Total Network LTV</p>
            <h2 class="card-value">₹{{ intelligenceData()?.valueAnalysis?.totalLTV | number }}</h2>
            <div class="card-footer">
              <span class="footer-metric success">AVG: ₹{{ intelligenceData()?.valueAnalysis?.avgLTV | number:'1.0-0' }}</span>
            </div>
          </div>

          <div class="stat-card segments-card">
            @for (segment of intelligenceData()?.segmentation | keyvalue; track segment.key) {
              <div class="segment-item">
                <p class="segment-value" 
                   [class.active]="$any(segment.value) > 0">
                  {{ segment.value }}
                </p>
                <p class="segment-label">{{ segment.key }}</p>
              </div>
            }
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <h3 class="grid-title">Top Value Performers (LTV)</h3>
                <p-button icon="pi pi-star" [text]="true" severity="warn" size="small"></p-button>
              </div>
              
              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="ltvColumns" 
                   [data]="intelligenceData()?.valueAnalysis?.topLTV || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            
            <div class="side-card">
              <div class="side-header">
                <h4 class="side-title">Credit Risk Monitor</h4>
                <span class="flag-badge">FLAGGED: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length || 0 }}</span>
              </div>
              
              <div class="risk-list">
                @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
                  <div class="risk-item">
                    <div class="risk-header">
                      <p class="risk-name">{{ risk.name }}</p>
                      <i class="pi pi-exclamation-triangle risk-icon"></i>
                    </div>
                    
                    <div class="risk-details">
                      <div class="detail-row">
                        <span class="detail-label">Outstanding Balance</span>
                        <span class="detail-value error">₹{{ risk.outstandingBalance | number }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Limit Restricted To</span>
                        <span class="detail-value primary">₹{{ risk.creditLimit | number }}</span>
                      </div>
                    </div>

                    <div class="risk-bar">
                       <div class="bar-fill error" style="width: 100%"></div>
                    </div>
                  </div>
                }
                
                @if (!intelligenceData()?.riskAnalysis?.creditRisk?.length) {
                   <div class="empty-state">
                      <p class="empty-title">No High-Risk Accounts</p>
                      <p class="empty-text">Credit portfolio is healthy.</p>
                   </div>
                }
              </div>

              <p-button label="Freeze High Risk Accounts" severity="danger" [text]="true" size="small" styleClass="w-full mt-4" 
                        [disabled]="!intelligenceData()?.riskAnalysis?.creditRisk?.length"></p-button>
            </div>

            <div class="side-card strategy-card">
              <h4 class="side-title highlight">Loyalty Strategy</h4>
              
              <div class="strategy-content">
                @if (intelligenceData()?.valueAnalysis?.topLTV?.length) {
                   <p class="strategy-text">
                     <i class="pi pi-info-circle strategy-icon"></i>
                     {{ intelligenceData()?.valueAnalysis?.topLTV[0]?.name }} has a Value Score of 100. Consider offering an exclusive service plan.
                   </p>
                } @else {
                   <p class="strategy-text empty">
                     Not enough transaction data to generate loyalty strategies yet.
                   </p>
                }
              </div>
            </div>

            <div class="side-card">
               <h4 class="side-title mb-md">Payment Behavior Analysis</h4>
               
               <div class="placeholder-content">
                  <i class="pi pi-chart-pie placeholder-icon"></i>
                  <span class="placeholder-title">Coming Soon</span>
                  <p class="placeholder-text">Advanced behavioral segmentation based on payment punctuality is currently processing.</p>
               </div>
            </div>

          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p class="loader-text">Computing behavioral patterns...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .intelligence-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* TOP STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .stats-grid { grid-template-columns: 1fr 3fr; }
    }

    /* SHARED CARD STYLES */
    .stat-card, .side-card, .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
    }

    /* LTV CARD */
    .ltv-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .card-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0 0 4px 0;
    }
    .card-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }
    .card-footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-xs);
    }
    .footer-metric.success {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-success);
    }

    /* SEGMENTS CARD */
    .segments-card {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .segment-item { text-align: center; padding: 0 var(--spacing-md); }

    .segment-value {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xl);
      color: var(--text-tertiary);
      margin: 0;
    }
    .segment-value.active { color: var(--accent-primary); }

    .segment-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 2px 0 0 0;
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

    /* GRID CARD (TABLE) */
    .grid-card {
      padding: 0; /* Reset for grid */
      overflow: hidden;
      height: 100%;
      min-height: 500px;
      display: flex;
      flex-direction: column;
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

    .side-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .side-title {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .side-title.highlight { color: var(--accent-primary); }
    .side-title.mb-md { margin-bottom: var(--spacing-md); }

    .flag-badge {
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    /* RISK LIST */
    .risk-list { display: flex; flex-direction: column; gap: var(--spacing-md); }

    .risk-item {
      padding: var(--spacing-md);
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      transition: background 0.2s;
    }
    .risk-item:hover { background: var(--component-bg-hover); }

    .risk-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    .risk-name { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
    .risk-icon { font-size: var(--font-size-xs); color: var(--color-error); }

    .risk-details { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--spacing-md); }
    .detail-row { display: flex; justify-content: space-between; font-size: 11px; }
    .detail-label { color: var(--text-tertiary); }
    .detail-value { font-weight: var(--font-weight-bold); }
    .detail-value.error { color: var(--color-error); }
    .detail-value.primary { color: var(--text-secondary); }

    .risk-bar {
      width: 100%; height: 4px;
      background: var(--bg-primary);
      border-radius: 99px;
      overflow: hidden;
    }
    .bar-fill.error { background: var(--color-error); height: 100%; }

    /* EMPTY STATE */
    .empty-state {
      padding: var(--spacing-lg);
      text-align: center;
      border: 1px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius);
      opacity: 0.6;
    }
    .empty-title { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0 0 2px 0; }
    .empty-text { font-size: 10px; color: var(--text-tertiary); margin: 0; }

    /* STRATEGY CARD */
    .strategy-card {
      border: 1px dashed var(--accent-primary);
      background: var(--color-primary-bg); /* Mix token */
    }

    .strategy-content { margin-top: var(--spacing-md); }
    .strategy-text {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
    .strategy-text.empty { font-style: italic; color: var(--text-tertiary); }
    .strategy-icon { margin-right: var(--spacing-sm); color: var(--accent-primary); }

    /* PLACEHOLDER CARD */
    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg) 0;
      opacity: 0.6;
      text-align: center;
    }
    .placeholder-icon { font-size: 1.5rem; margin-bottom: var(--spacing-sm); color: var(--accent-primary); }
    .placeholder-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-primary); }
    .placeholder-text { font-size: 10px; margin-top: 4px; max-width: 200px; color: var(--text-secondary); }

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
export class CustomerIntelligenceComponent implements OnInit {
  intelligenceData = signal<any>(null);
  loading = signal<boolean>(true);
  ltvColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns(): void {
    // Grid Columns using CSS Variables for Theming
    this.ltvColumns = [
      {
        field: 'name', 
        headerName: 'Customer', 
        sortable: true, 
        flex: 1,
        minWidth: 180,
        cellRenderer: (params: any) => {
          return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
                    <span style="font-weight: 700; color: var(--text-primary);">${params.value}</span>
                    <span style="font-size: 10px; color: var(--text-label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${params.data.email || ''}</span>
                  </div>`;
        }
      },
      {
        field: 'tier', 
        headerName: 'Tier', 
        sortable: true, 
        width: 100,
        cellRenderer: (params: any) => {
          const tier = params.value || 'Standard';
          
          // Use CSS vars if possible, or fallbacks that match theme palette
          // Note: Ideally, these colors should come from data or utility class
          let styleClass = 'tier-standard';
          let colorStyle = 'color: var(--text-secondary); background: var(--bg-ternary);';

          if(tier === 'Platinum') colorStyle = 'color: #a78bfa; background: rgba(167, 139, 250, 0.1);';
          else if(tier === 'Gold') colorStyle = 'color: #facc15; background: rgba(250, 204, 21, 0.1);';
          
          return `<span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; ${colorStyle}">
                    ${tier}
                  </span>`;
        }
      },
      {
        field: 'transactionCount', 
        headerName: 'Orders', 
        sortable: true, 
        width: 80,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'color': 'var(--text-primary)' }
      },
      {
        field: 'totalSpent', 
        headerName: 'Total Spent', 
        sortable: true, 
        width: 120,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'text-align': 'right' }
      },
      {
        field: 'valueScore', 
        headerName: 'Value Score', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        cellRenderer: (params: any) => {
           const val = params.value || 0;
           return `<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; height: 100%;">
                    <div style="width: 60px; height: 4px; background: var(--bg-ternary); border-radius: 2px;">
                       <div style="width: ${val}%; height: 100%; background: var(--color-success); border-radius: 2px;"></div>
                    </div>
                    <span style="font-size: 10px; font-family: var(--font-mono); width: 25px; text-align: right; color: var(--text-secondary);">${val.toFixed(0)}</span>
                   </div>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getCustomerIntelligence().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.intelligenceData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
