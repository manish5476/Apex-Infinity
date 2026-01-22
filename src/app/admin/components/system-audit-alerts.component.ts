import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-system-audit-alerts',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TagModule, 
    TooltipModule, 
    ProgressSpinnerModule,
    AgShareGrid
  ],
  template: `
    <div class="audit-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">
            <i class="pi pi-shield header-icon"></i>
            System Integrity & Alerts
          </h2>
          <p class="page-subtitle">
            Monitoring administrative access and critical business bottlenecks
          </p>
        </div>
        <div class="header-actions">
          <div class="status-badge" [class.secure]="securityData()?.riskyActions === 0" [class.risk]="securityData()?.riskyActions > 0">
            <span class="status-label">Security Status</span>
            <span class="status-value">
              {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
            </span>
          </div>
          <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          
          <div class="kpi-card inventory-card">
            <div class="card-header">
              <span class="kpi-label">Inventory Health</span>
              <i class="pi pi-box kpi-icon error"></i>
            </div>
            <div class="card-body">
              <h2 class="kpi-value error">{{ alertsData()?.lowStockCount }}</h2>
              <span class="kpi-sub">Low Stock Items</span>
            </div>
            <div class="priority-box error">
               <span class="priority-label">Top Priority:</span>
               <span class="priority-value">{{ alertsData()?.itemsToReorder[0] || 'None' }}</span>
            </div>
          </div>

          <div class="kpi-card debt-card">
            <div class="card-header">
              <span class="kpi-label">Financial Exposure</span>
              <i class="pi pi-exclamation-triangle kpi-icon warning"></i>
            </div>
            <div class="card-body">
              <h2 class="kpi-value warning">{{ alertsData()?.highRiskDebtCount }}</h2>
              <span class="kpi-sub">High Risk Debts</span>
            </div>
            <p class="action-text">Action: Immediate payment follow-up recommended.</p>
          </div>

          <div class="kpi-card audit-card">
            <div>
              <p class="audit-label">Audit Trail</p>
              <h2 class="audit-value">{{ securityData()?.recentEvents?.length }} Events</h2>
              <p class="audit-sub">Logged in last 72 hours</p>
            </div>
            <div class="audit-actions">
               <p-button label="Review Logs" [text]="true" size="small" styleClass="light-btn"></p-button>
            </div>
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <h3 class="grid-title">Administrative Access Log</h3>
                <span class="grid-tag">IP TRAFFIC: MONITORING</span>
              </div>

              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="auditColumns" 
                   [data]="securityData()?.recentEvents || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            
            <div class="side-card checklist-card">
               <h4 class="side-title mb-sm">Re-order Checklist</h4>
               <div class="checklist">
                 @for (item of alertsData()?.itemsToReorder; track item) {
                   <div class="check-item">
                     <span class="item-name" [title]="item">{{ item }}</span>
                     <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small" styleClass="icon-btn"></p-button>
                   </div>
                 }
                 @if (!alertsData()?.itemsToReorder?.length) {
                   <p class="empty-text">No immediate stock-outs detected.</p>
                 }
               </div>
            </div>

            <div class="side-card secure-card">
              <div class="secure-icon-box">
                 <i class="pi pi-check-circle secure-icon"></i>
              </div>
              <h4 class="secure-title">Environment Secure</h4>
              <p class="secure-text">
                Zero unauthorized requests. Checked at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
              </p>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Fetching Security Tokens...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .audit-container {
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
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .page-title {
      font-size: var(--font-size-2xl);
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
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      margin: 0;
    }

    .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

    .status-badge {
      padding: 4px 12px;
      border: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    .status-badge.secure .status-value { color: var(--color-success); }
    .status-badge.risk .status-value { color: var(--color-error); }

    .status-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); }
    .status-value { font-weight: bold; font-variant-numeric: tabular-nums; }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    /* KPI CARDS */
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
      display: flex;
      flex-direction: column;
    }
    .kpi-card:hover { transform: translateY(-2px); border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    
    .kpi-label {
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
    }

    .kpi-icon { font-size: 1rem; }
    .kpi-icon.error { color: var(--color-error); }
    .kpi-icon.warning { color: var(--color-warning); }

    .card-body { display: flex; align-items: baseline; gap: var(--spacing-sm); }

    .kpi-value {
      font-size: var(--font-size-2xl);
      font-weight: bold;
      font-family: var(--font-heading);
      margin: 0;
      line-height: 1;
    }
    .kpi-value.error { color: var(--color-error); }
    .kpi-value.warning { color: var(--color-warning); }

    .kpi-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); }

    .priority-box {
      margin-top: var(--spacing-sm);
      padding: 4px 8px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-weight: bold;
    }
    .priority-box.error { background: var(--color-error-bg); border: 1px solid var(--color-error-border); }
    .priority-label { color: var(--color-error); text-transform: uppercase; }
    .priority-value { color: var(--text-primary); max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .action-text {
      font-size: 10px;
      color: var(--text-secondary);
      opacity: 0.8;
      margin-top: var(--spacing-sm);
      line-height: 1.2;
    }

    /* AUDIT CARD (Gradient) */
    .audit-card {
      background: var(--accent-gradient);
      border: none;
      color: #ffffff;
      justify-content: space-between;
    }

    .audit-label { font-size: var(--font-size-xs); font-weight: 900; text-transform: uppercase; opacity: 0.8; margin: 0 0 4px 0; }
    .audit-value { font-size: var(--font-size-2xl); font-weight: bold; margin: 0; line-height: 1; }
    .audit-sub { font-size: 10px; font-weight: bold; text-transform: uppercase; opacity: 0.9; font-style: italic; margin-top: 4px; }

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
      min-height: 350px;
      display: flex;
      flex-direction: column;
    }

    .grid-header {
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .grid-tag { font-size: 9px; font-family: var(--font-mono); color: var(--text-label); opacity: 0.8; }

    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* SIDE COLUMN */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-md); }

    .side-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-md);
    }

    .side-title {
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-label);
      margin: 0;
    }
    .mb-sm { margin-bottom: var(--spacing-sm); }

    .checklist { display: flex; flex-direction: column; gap: var(--spacing-xs); }

    .check-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
      background: var(--bg-ternary);
      transition: background 0.2s;
    }
    .check-item:hover { background: var(--component-bg-hover); }

    .item-name {
      font-size: var(--font-size-xs);
      font-weight: bold;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .empty-text { text-align: center; padding: var(--spacing-sm); font-size: 10px; color: var(--text-tertiary); }

    /* SECURE CARD */
    .secure-card {
      border: 1px dashed var(--color-success);
      background: var(--color-success-bg);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .secure-icon-box {
      width: 2rem; height: 2rem;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
      color: var(--color-success);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--spacing-xs);
    }
    .secure-icon { font-size: 0.9rem; }

    .secure-title { font-size: var(--font-size-sm); font-weight: bold; color: var(--text-primary); margin: 0 0 2px 0; }
    .secure-text { font-size: 10px; color: var(--text-secondary); line-height: 1.4; margin: 0; }

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
export class SystemAuditAlertsComponent implements OnInit {
  alertsData = signal<any>(null);
  securityData = signal<any>(null);
  loading = signal<boolean>(true);
  auditColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.refreshAll();
  }

  setupColumns(): void {
    // Grid columns using Theme Tokens via CSS Variables
    this.auditColumns = [
      {
        field: 'userId.name', 
        headerName: 'Administrator', 
        sortable: true, 
        flex: 1,
        minWidth: 180,
        cellRenderer: (params: any) => {
          const user = params.data?.userId || {};
          const name = user.name || 'Unknown';
          const email = user.email || '';
          const initials = this.commonService.getInitials(name);

          // Use accent color tokens for badge
          return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
                    <div style="width: 24px; height: 24px; border-radius: 4px; background: var(--accent-focus); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 9px;">
                      ${initials}
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 700; color: var(--text-primary); line-height: 1; font-size: 11px;">${name}</span>
                      <span style="font-size: 9px; opacity: 0.5; margin-top: 1px; color: var(--text-secondary);">${email}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'action', 
        headerName: 'Action performed', 
        sortable: true, 
        width: 160,
        cellRenderer: (params: any) => {
          const fullAction = params.value || '';
          const parts = fullAction.split(':');
          const category = parts[0] ? parts[0].trim() : '';
          const actionName = parts[1] ? parts[1].trim() : fullAction;
          const entity = params.data?.entityType || 'system';

          return `<div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="padding: 1px 4px; width: fit-content; border-radius: 3px; font-weight: 700; font-size: 8px; background: var(--accent-focus); border: 1px solid var(--accent-secondary); color: var(--accent-primary); text-transform: uppercase;">
                      ${actionName}
                    </span>
                    <span style="font-size: 9px; color: var(--text-label);">Entity: ${entity}</span>
                  </div>`;
        }
      },
      {
        field: 'ip', 
        headerName: 'Trace (IP)', 
        sortable: true, 
        width: 120,
        cellRenderer: (params: any) => {
          const ip = params.value === '::1' ? 'Localhost' : params.value;
          return `<span style="font-family: var(--font-mono); font-size: 9px; background: var(--bg-secondary); padding: 1px 4px; border-radius: 3px; border: 1px solid var(--border-secondary); color: var(--text-tertiary);">
                    ${ip}
                  </span>`;
        }
      },
      {
        field: 'createdAt', 
        headerName: 'Timestamp', 
        sortable: true, 
        width: 110,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM, HH:mm'),
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'font-size': '10px', 'color': 'var(--text-primary)', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }

  refreshAll() {
    this.loading.set(true);
    forkJoin({
      alerts: this.analyticsService.getCriticalAlerts(),
      security: this.analyticsService.getSecurityAuditLog()
    }).subscribe({
      next: (results) => {
        if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
        if (results.security.status === 'success') this.securityData.set(results.security.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
