import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

interface EMIData {
  _id: string;
  totalAmount: number;
  activeEMIs: number;
  completedEMIs: number;
  defaultedEMIs: number;
  totalInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;
  totalInterestEarned: number;
  status: string;
  completionRate: number;
  defaultRate: number;
}

@Component({
  selector: 'app-emi-analytics',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    TooltipModule,
    AgShareGrid
  ],
  template: `
    <div class="emi-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Credit & EMI Intelligence</h2>
          <p class="page-subtitle">
            Monitoring credit exposure, repayment health, and interest yield
          </p>
        </div>
        <div class="action-group">
           <p-button label="Credit Limits" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
           <p-button label="Sync Portfolio" icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          
          <div class="kpi-card exposure-card">
            <p class="kpi-label">Total Credit Exposure</p>
            <h2 class="kpi-value primary">₹{{ emiSummary()?.totalAmount | number }}</h2>
            <p class="kpi-subtext">Across {{ emiSummary()?.activeEMIs }} active plans</p>
            <i class="pi pi-credit-card kpi-bg-icon"></i>
          </div>

          <div class="kpi-card revenue-card">
            <p class="kpi-label">Interest Revenue</p>
            <h2 class="kpi-value success">₹{{ emiSummary()?.totalInterestEarned | number }}</h2>
            <div class="kpi-badge-row">
               <span class="badge success">Realized Gain</span>
            </div>
          </div>

          <div class="kpi-card health-card">
            <p class="kpi-label dark">Portfolio Health</p>
            <h2 class="kpi-value dark">{{ 100 - (emiSummary()?.defaultRate || 0) | number:'1.0-1' }}%</h2>
            <p class="kpi-subtext dark">Default Rate: {{ emiSummary()?.defaultRate | number:'1.1-2' }}%</p>
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
               <div class="grid-header">
                 <h3 class="grid-title">Portfolio Segments</h3>
                 <span class="grid-tag">DATA VIEW</span>
               </div>

               <div class="grid-container">
                  <app-ag-share-grid 
                    [columns]="emiColumns" 
                    [data]="emiRawData()" 
                    [showActions]="false" 
                    class="full-size-grid">
                  </app-ag-share-grid>
               </div>
            </div>
          </div>

          <div class="side-column">
            <div class="pipeline-card">
              <div class="pipeline-header">
                <h3 class="card-title">Repayment Pipeline</h3>
                <span class="status-indicator">SYNCED: LIVE</span>
              </div>

              <div class="progress-section">
                <div class="progress-labels">
                  <div>
                    <p class="mini-label">Cycle Completion</p>
                    <p class="completion-value">{{ emiSummary()?.completionRate | number:'1.1-1' }}%</p>
                  </div>
                  <div class="text-right">
                    <p class="mini-label">Installments Paid</p>
                    <p class="installments-value">{{ emiSummary()?.paidInstallments }} / {{ emiSummary()?.totalInstallments }}</p>
                  </div>
                </div>
                <div class="progress-track">
                  <div class="progress-fill gradient" [style.width]="emiSummary()?.completionRate + '%'"></div>
                </div>
              </div>

              <div class="stats-box-grid">
                <div class="stat-box">
                  <p class="stat-label">Overdue</p>
                  <p class="stat-value" [class.error]="emiSummary()?.overdueInstallments > 0">
                    {{ emiSummary()?.overdueInstallments }}
                  </p>
                </div>
                <div class="stat-box">
                  <p class="stat-label">Defaults</p>
                  <p class="stat-value error">{{ emiSummary()?.defaultedEMIs }}</p>
                </div>
              </div>

              <div class="risk-box">
                  <div class="risk-content">
                    <i class="pi pi-shield-check risk-icon"></i>
                    <div>
                      <p class="risk-title">Credit Risk Observation</p>
                      <p class="risk-desc">
                        Default rate is maintaining a healthy <span class="highlight">{{ emiSummary()?.defaultRate | number:'1.1-2' }}%</span>. 
                      </p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Auditing Credit Portfolio...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .emi-container {
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
      margin-bottom: var(--spacing-xl);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-heading);
      letter-spacing: -0.01em;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .action-group { display: flex; align-items: center; gap: var(--spacing-sm); }

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
      position: relative;
      overflow: hidden;
    }

    .kpi-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0 0 4px 0;
    }
    .kpi-label.dark { color: rgba(255,255,255,0.8); }

    .kpi-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-heading);
      margin: 0;
      color: var(--text-primary);
    }
    .kpi-value.success { color: var(--color-success); }
    .kpi-value.primary { color: var(--text-primary); } /* Default text color */
    .kpi-value.dark { color: #ffffff; }

    .kpi-subtext {
      margin-top: var(--spacing-sm);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }
    .kpi-subtext.dark { color: rgba(255,255,255,0.9); font-weight: bold; }

    .kpi-bg-icon {
      position: absolute;
      right: -10px;
      bottom: -10px;
      font-size: 4rem;
      opacity: 0.05;
      color: var(--text-primary);
      pointer-events: none;
    }

    .kpi-badge-row {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-sm);
    }

    .badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.success { background: var(--color-success-bg); color: var(--color-success); }

    /* HEALTH CARD (Gradient) */
    .health-card {
      background: var(--accent-gradient);
      border: none;
      color: #ffffff;
      box-shadow: var(--shadow-lg);
    }

    /* LAYOUT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media (min-width: 1024px) {
      .content-grid { grid-template-columns: 7fr 5fr; }
    }

    /* GRID CARD */
    .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
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
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }

    .grid-tag { font-size: 10px; font-weight: bold; color: var(--text-label); }

    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* PIPELINE CARD */
    .pipeline-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .pipeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .card-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }

    .status-indicator { font-size: 10px; font-weight: bold; color: var(--text-label); }

    /* PROGRESS SECTION */
    .progress-section { margin-bottom: var(--spacing-2xl); }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--spacing-sm);
    }

    .mini-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-tertiary);
      margin: 0 0 2px 0;
    }

    .completion-value {
      font-size: var(--font-size-3xl);
      font-weight: 900;
      color: var(--accent-primary);
      margin: 0;
      font-family: var(--font-mono);
    }

    .installments-value {
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-mono);
      margin: 0;
    }

    .progress-track {
      width: 100%;
      height: 1rem;
      border-radius: 99px;
      background: var(--bg-ternary);
      border: 1px solid var(--border-primary);
      padding: 2px;
      overflow: hidden;
    }

    .progress-fill.gradient {
      height: 100%;
      border-radius: 99px;
      background: var(--accent-gradient);
      transition: width 1s ease-out;
    }

    /* STATS BOX GRID */
    .stats-box-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
      margin-top: auto;
    }

    .stat-box {
      padding: var(--spacing-sm);
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      text-align: center;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-label);
      margin: 0 0 2px 0;
    }

    .stat-value {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-lg);
      color: var(--text-label);
      margin: 0;
    }
    .stat-value.error { color: var(--color-error); }

    /* RISK BOX */
    .risk-box {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      border: 1px dashed var(--color-success);
      border-radius: var(--ui-border-radius-lg);
      background: var(--color-success-bg);
    }

    .risk-content { display: flex; gap: var(--spacing-sm); }
    .risk-icon { color: var(--color-success); margin-top: 2px; }

    .risk-title {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
      color: var(--color-success);
      margin: 0 0 4px 0;
    }

    .risk-desc {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.4;
      margin: 0;
    }
    
    .highlight { font-weight: bold; color: var(--text-primary); }

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
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
    }
  `]
})
export class EmiAnalyticsComponent implements OnInit {
  emiRawData = signal<EMIData[]>([]);
  loading = signal<boolean>(true);
  emiColumns: any[] = [];

  // Computed Summary
  emiSummary: any = computed(() => this.emiRawData().length ? this.emiRawData()[0] : null);

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
    // Grid columns using Theme Tokens
    this.emiColumns = [
      {
        field: '_id', 
        headerName: 'Category', 
        sortable: true, 
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value || 'Unknown';
          // Using style attributes for dynamic pills, but colors map to theme variables
          // Ideally move this logic to a shared utility or CSS class mapping
          let colorStyle = 'color: var(--text-secondary); background: var(--bg-ternary);';
          
          if(status === 'active') {
             colorStyle = 'color: var(--color-success); background: var(--color-success-bg);';
          }
          
          return `<span style="font-size: 10px; font-weight: 700; text-transform: uppercase; px: 8px; py: 2px; border-radius: 4px; ${colorStyle} padding: 2px 8px;">
                    ${status}
                  </span>`;
        }
      },
      {
        field: 'totalAmount', 
        headerName: 'Exposure', 
        sortable: true, 
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' }
      },
      {
        field: 'activeEMIs', 
        headerName: 'Plans', 
        sortable: true, 
        width: 80,
        type: 'rightAligned',
        cellStyle: { 'color': 'var(--text-secondary)' }
      },
      {
        field: 'completionRate', 
        headerName: 'Progress', 
        sortable: true, 
        width: 140,
        cellRenderer: (params: any) => {
           const val = params.value || 0;
           return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
                    <div style="flex: 1; height: 4px; background: var(--bg-ternary); border-radius: 2px;">
                       <div style="width: ${val}%; height: 100%; background: var(--accent-primary); border-radius: 2px;"></div>
                    </div>
                    <span style="font-size: 10px; width: 30px; font-family: var(--font-mono); color: var(--text-secondary);">${val.toFixed(0)}%</span>
                   </div>`;
        }
      },
      {
        field: 'totalInterestEarned', 
        headerName: 'Interest', 
        sortable: true, 
        width: 120,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)' }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getEMIAnalytics().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.emiRawData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
