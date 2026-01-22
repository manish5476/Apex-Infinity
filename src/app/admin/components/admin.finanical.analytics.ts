import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressSpinnerModule,
    AgShareGrid
  ],
  template: `
    <div class="financial-container">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="metrics-grid">
          
          <div class="metric-card profitability-card">
            <div class="card-header">
              <h3 class="card-title">Profitability Engine</h3>
              <span class="status-badge success">
                {{ financialData()?.profitability?.marginPercent | number:'1.1-1' }}% Margin
              </span>
            </div>
            
            <div class="stats-row">
              <div class="stat-item">
                <p class="stat-label">Revenue</p>
                <p class="stat-value">₹{{ financialData()?.profitability?.totalRevenue | number }}</p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Cost of Goods (COGS)</p>
                <p class="stat-value error">₹{{ financialData()?.profitability?.totalCOGS | number }}</p>
              </div>
              <div class="stat-item highlight">
                <p class="stat-label">Gross Profit</p>
                <p class="stat-value success">₹{{ financialData()?.profitability?.grossProfit | number }}</p>
              </div>
            </div>

            <ng-container *ngIf="financialData()?.recommendations?.recommendations?.length > 0">
               <div class="alert-box warning">
                 <i class="pi pi-exclamation-circle alert-icon"></i>
                 <div class="alert-content">
                   <p class="alert-title">Action Required: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
                   <p class="alert-subtitle">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
                 </div>
               </div>
            </ng-container>
          </div>

          <div class="metric-card cashflow-card">
            <div class="card-section">
              <h3 class="card-title">Cash Flow Sources</h3>
              
              <div class="flow-list">
                @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
                  <div class="flow-item">
                    <div class="flow-header">
                      <span class="flow-name">{{ mode.name }}</span>
                      <span class="flow-amount">₹{{ mode.value | number }}</span>
                    </div>
                    <div class="progress-track">
                       <div class="progress-fill success" 
                            [style.width]="((mode.value / (financialData()?.profitability?.totalRevenue || 1)) * 100) + '%'"></div>
                    </div>
                  </div>
                }
                @if (!financialData()?.cashFlow?.paymentModes?.length) {
                  <p class="empty-text">No cash flow data recorded.</p>
                }
              </div>
            </div>
            
            <div class="card-footer">
               <p class="footer-label">Net Payable Tax</p>
               <p class="footer-value error">₹{{ financialData()?.tax?.netPayable | number }}</p>
            </div>
          </div>
        </div>

        <div class="details-grid">
          
          <div class="detail-card credit-card">
            <div class="card-header">
              <div class="header-icon-box">
                <i class="pi pi-credit-card"></i>
              </div>
              <h3 class="card-title">EMI Credit Monitoring</h3>
            </div>

            @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
              <div class="emi-layout">
                <div class="emi-stat-box">
                  <p class="big-number">{{ emi.activeEMIs }}</p>
                  <p class="mini-label">Active EMIs</p>
                </div>
                
                <div class="emi-details">
                  <div class="details-row">
                    <div>
                      <p class="detail-label">Total Credit Exposure</p>
                      <p class="detail-value">₹{{ emi.totalAmount | number }}</p>
                    </div>
                    <div class="text-right">
                      <p class="detail-label">Interest Earned</p>
                      <p class="detail-value success">+₹{{ emi.totalInterestEarned | number }}</p>
                    </div>
                  </div>

                  <div class="progress-section">
                    <div class="progress-header">
                      <span class="mini-label">Repayment Progress</span>
                      <span class="progress-text">{{ emi.paidInstallments }} / {{ emi.totalInstallments }} Paid</span>
                    </div>
                    <div class="progress-track border">
                      <div class="progress-fill gradient" [style.width]="emi.completionRate + '%'"></div>
                    </div>
                  </div>

                  <div class="stats-footer">
                    <div class="mini-stat">
                      <div class="dot success"></div>
                      <span>Default Rate: {{ emi.defaultRate | number:'1.1-1' }}%</span>
                    </div>
                    <div class="mini-stat">
                      <div class="dot warning"></div>
                      <span>Overdue: {{ emi.overdueInstallments }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
            @if (!financialData()?.credit?.emiAnalytics?.length) {
                <div class="empty-state">
                    <i class="pi pi-check-circle empty-icon"></i>
                    <p class="empty-title">No Active Credit Lines</p>
                    <p class="empty-subtitle">There are no active EMIs or pending credit installments.</p>
                </div>
            }
          </div>

          <div class="side-column">
            
            <div class="detail-card grid-card">
               <div class="card-header small">
                  <h4 class="card-subtitle">Receivables Aging</h4>
               </div>
               
               <div class="grid-container">
                  <app-ag-share-grid 
                    [columns]="agingColumns" 
                    [data]="financialData()?.receivables?.aging || []" 
                    [showActions]="false" 
                    class="full-size-grid">
                  </app-ag-share-grid>
               </div>
            </div>

            <div class="detail-card actions-card">
              <h4 class="card-subtitle mb-md">Priority Actions</h4>
              <div class="actions-list">
                @for (rec of financialData()?.recommendations?.recommendations; track rec.action) {
                  <div class="action-item">
                    <div class="action-header">
                      <span class="action-tag info">{{ rec.timeframe }} Term</span>
                      <span class="action-tag error">Impact: {{ rec.impact }}</span>
                    </div>
                    <p class="action-text">{{ rec.action }}</p>
                  </div>
                }
                @if (!financialData()?.recommendations?.recommendations?.length) {
                    <p class="empty-text center">No urgent actions required.</p>
                }
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p class="loader-text">Reconciling financial statements...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .financial-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* TOP METRICS GRID */
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .metrics-grid { grid-template-columns: 2fr 1fr; }
    }

    /* SHARED CARD STYLES */
    .metric-card, .detail-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }
    .card-header.small {
      margin-bottom: 0;
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      margin: calc(var(--spacing-lg) * -1); /* Full bleed header */
      margin-bottom: 0;
      padding: var(--spacing-md) var(--spacing-lg);
    }

    .card-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0;
    }

    .card-subtitle {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-label);
      margin: 0;
    }
    .mb-md { margin-bottom: var(--spacing-md); }

    /* PROFITABILITY CARD SPECIFIC */
    .status-badge {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      padding: 4px 12px;
      border-radius: 99px;
      background: var(--bg-ternary);
    }
    .status-badge.success { color: var(--color-success); }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-item.highlight {
      background: var(--bg-ternary);
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-heading);
      margin: 0;
    }
    .stat-value.error { color: var(--color-error); }
    .stat-value.success { color: var(--color-success); }

    /* ALERT BOX */
    .alert-box {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      border: 1px dashed var(--color-warning);
      border-radius: var(--ui-border-radius);
      background: var(--color-warning-bg);
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }
    .alert-icon { color: var(--color-warning); font-size: 1.2rem; }
    .alert-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
    .alert-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

    /* CASH FLOW CARD */
    .cashflow-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .flow-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .flow-item {
      width: 100%;
    }

    .flow-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .flow-name { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); text-transform: capitalize; }
    .flow-amount { font-weight: bold; color: var(--color-success); font-family: var(--font-mono); }

    .progress-track {
      width: 100%;
      height: 6px;
      background: var(--bg-ternary);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-track.border { border: 1px solid var(--border-primary); height: 10px; padding: 1px; }

    .progress-fill { height: 100%; border-radius: 99px; }
    .progress-fill.success { background: var(--color-success); }
    .progress-fill.gradient { background: var(--accent-gradient); transition: width 1s ease; }

    .card-footer {
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--border-primary);
    }
    .footer-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0 0 2px 0; }
    .footer-value { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-error); margin: 0; }

    /* DETAILS GRID */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .details-grid { grid-template-columns: 2fr 1fr; }
    }

    /* CREDIT CARD */
    .header-icon-box {
      color: var(--accent-primary);
      margin-right: var(--spacing-sm);
    }

    .emi-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media(min-width: 768px) {
      .emi-layout { grid-template-columns: 1fr 3fr; }
    }

    .emi-stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-right: 1px solid var(--border-primary);
      padding-right: var(--spacing-lg);
    }
    .big-number { font-size: var(--font-size-4xl); font-weight: bold; color: var(--text-primary); margin: 0; }
    .mini-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }

    .emi-details { display: flex; flex-direction: column; gap: var(--spacing-md); }

    .details-row { display: flex; justify-content: space-between; align-items: flex-end; }
    .detail-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
    .detail-value { font-size: var(--font-size-xl); font-weight: bold; color: var(--text-primary); margin: 0; }
    .detail-value.success { color: var(--color-success); font-size: var(--font-size-lg); }

    .progress-section { margin-top: var(--spacing-xs); }
    .progress-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: var(--text-primary); }

    .stats-footer { display: flex; gap: var(--spacing-xl); margin-top: var(--spacing-xs); }
    .mini-stat { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--text-secondary); }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.success { background: var(--color-success); }
    .dot.warning { background: var(--color-warning); }

    /* SIDE COLUMN */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

    .grid-card {
      padding: 0; /* Override default padding for grid container */
      overflow: hidden;
      height: 300px;
      display: flex;
      flex-direction: column;
    }
    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* ACTIONS CARD */
    .actions-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    
    .action-item {
      padding: var(--spacing-sm);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      background: var(--bg-ternary);
      transition: background 0.2s;
      cursor: pointer;
    }
    .action-item:hover { background: var(--component-bg-hover); }

    .action-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .action-tag { font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 1px 4px; border-radius: 4px; }
    .action-tag.info { color: var(--accent-primary); }
    .action-tag.error { background: var(--color-error-bg); color: var(--color-error); }

    .action-text { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0; }

    /* EMPTY STATES & LOADER */
    .empty-state { text-align: center; padding: var(--spacing-xl); opacity: 0.6; }
    .empty-icon { font-size: 2rem; color: var(--color-success); margin-bottom: var(--spacing-sm); }
    .empty-title { font-weight: bold; font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; }
    .empty-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

    .empty-text { font-size: var(--font-size-xs); font-style: italic; color: var(--text-tertiary); text-align: center; margin: 0; }
    .empty-text.center { padding: var(--spacing-md); }

    .loader-container { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
    .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }
  `]
})
export class FinancialDashboardComponent implements OnInit {
  financialData = signal<any>(null);
  loading = signal<boolean>(true);
  agingColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupAgingColumns();
    this.loadData();
  }

  setupAgingColumns(): void {
    // Grid columns using CSS Variables for theme adaptability
    this.agingColumns = [
        {
            field: 'range',
            headerName: 'Age',
            sortable: true,
            flex: 1,
            cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-size': 'var(--font-size-sm)' }
        },
        {
            field: 'count',
            headerName: 'Count',
            sortable: true,
            width: 80,
            type: 'rightAligned',
            cellStyle: { 'text-align': 'right', 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)' }
        },
        {
            field: 'amount',
            headerName: 'Value',
            sortable: true,
            width: 110,
            type: 'rightAligned',
            valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
            cellStyle: { 'font-weight': '700', 'color': 'var(--color-error)', 'text-align': 'right' }
        }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getFinancialDashboard().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.financialData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
