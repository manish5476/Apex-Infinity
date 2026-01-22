import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-real-time-monitoring',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TagModule, 
    ProgressSpinnerModule, 
    TooltipModule,
    AgShareGrid
  ],
  template: `
    <div class="monitoring-container">

      <div class="header-section">
        <div class="header-title-row">
          <div class="pulse-indicator">
            <span class="pulse-ring"></span>
            <span class="pulse-dot"></span>
          </div>
          <div>
            <h2 class="page-title">Live System Monitor</h2>
            <p class="page-subtitle">
              Last Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'mediumTime' }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <p-button label="Audit Logs" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
          <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          <div class="kpi-card">
            <p class="kpi-label">Total Alerts</p>
            <h3 class="kpi-value">{{ monitorData()?.alerts?.total || 0 }}</h3>
          </div>
          
          <div class="kpi-card error-border">
            <p class="kpi-label">Critical Risk</p>
            <h3 class="kpi-value error">{{ monitorData()?.alerts?.critical?.length || 0 }}</h3>
          </div>
          
          <div class="kpi-card warning-border">
            <p class="kpi-label">Warnings</p>
            <h3 class="kpi-value warning">{{ monitorData()?.alerts?.warning?.length || 0 }}</h3>
          </div>
          
          <div class="kpi-card">
            <p class="kpi-label">Risky Actions</p>
            <h3 class="kpi-value" 
                [ngClass]="monitorData()?.security?.riskyActions > 0 ? 'error' : 'success'">
              {{ monitorData()?.security?.riskyActions || 0 }}
            </h3>
          </div>
        </div>

        <div class="content-layout">
          
          <div class="side-column">
            
            <div class="alert-panel">
               <h3 class="panel-title">Priority Intervention</h3>
               
               <div class="alert-list custom-scrollbar">
                 <ng-container *ngIf="allAlerts().length > 0; else noAlerts">
                   @for (alert of allAlerts(); track alert.timestamp) {
                     <div class="alert-item">
                       <i class="pi alert-icon" 
                          [ngClass]="alert.severity === 'critical' ? 'pi-exclamation-triangle error' : 'pi-info-circle warning'"></i>
                       <div class="alert-content">
                          <p class="alert-msg">{{ alert.message }}</p>
                          <p class="alert-meta">{{ alert.type }} • {{ alert.timestamp | date:'shortTime' }}</p>
                       </div>
                       <i class="pi pi-arrow-right action-icon"></i>
                     </div>
                   }
                 </ng-container>
                 <ng-template #noAlerts>
                   <div class="empty-state">
                     <p class="empty-text">No active alerts requiring intervention.</p>
                   </div>
                 </ng-template>
               </div>
            </div>

            <div class="security-card">
               <div class="security-icon-box">
                 <i class="pi pi-lock"></i>
               </div>
               <div>
                 <p class="security-title">Security Posture: Secure</p>
                 <p class="security-desc">
                   No risky actions detected in current session.
                 </p>
               </div>
            </div>
          </div>

          <div class="main-column">
            <div class="grid-card">
              
              <div class="grid-header">
                <h3 class="grid-title">Real-time Access Logs</h3>
                <span class="live-badge">LIVE STREAM</span>
              </div>

              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="logColumns" 
                   [data]="monitorData()?.security?.recentEvents || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>

            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Scanning System Integrity...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; height: 100vh; overflow: hidden; }

    .monitoring-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      overflow-y: auto; /* Allow scrolling if content overflows vertically on small screens */
    }

    /* HEADER */
    .header-section {
      flex-shrink: 0;
      margin-bottom: var(--spacing-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .header-title-row { display: flex; align-items: center; gap: var(--spacing-md); }

    /* Pulse Animation */
    .pulse-indicator { position: relative; display: flex; height: 12px; width: 12px; }
    .pulse-ring {
      position: absolute; display: inline-flex; height: 100%; width: 100%;
      border-radius: 50%; opacity: 0.75;
      background-color: var(--color-success);
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .pulse-dot {
      position: relative; display: inline-flex; border-radius: 50%; height: 12px; width: 12px;
      background-color: var(--color-success);
    }
    @keyframes ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .page-subtitle {
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin: 0;
    }

    .header-actions { display: flex; gap: var(--spacing-sm); }

    /* KPI GRID */
    .kpi-grid {
      flex-shrink: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .kpi-card {
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      transition: var(--transition-base);
    }
    .kpi-card.error-border { border-left: 4px solid var(--color-error); }
    .kpi-card.warning-border { border-left: 4px solid var(--color-warning); }

    .kpi-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-label);
      margin: 0 0 4px 0;
    }

    .kpi-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      font-family: var(--font-mono);
    }
    .kpi-value.error { color: var(--color-error); }
    .kpi-value.warning { color: var(--color-warning); }
    .kpi-value.success { color: var(--color-success); }

    /* CONTENT LAYOUT */
    .content-layout {
      flex: 1;
      min-height: 0; /* Important for flex child scrolling */
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media (min-width: 1024px) {
      .content-layout { grid-template-columns: 5fr 7fr; }
    }

    /* LEFT COLUMN */
    .side-column {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      height: 100%;
      overflow: hidden;
    }

    /* Alert Panel */
    .alert-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
    }

    .panel-title {
      flex-shrink: 0;
      font-size: var(--font-size-sm);
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-md) 0;
    }

    .alert-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding-right: 4px;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      transition: background 0.2s;
      cursor: default;
    }
    .alert-item:hover { background: var(--component-bg-hover); }

    .alert-icon { margin-top: 2px; font-size: 1rem; }
    .alert-icon.error { color: var(--color-error); }
    .alert-icon.warning { color: var(--color-warning); }

    .alert-content { flex: 1; }
    .alert-msg { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0; }
    .alert-meta { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-label); margin-top: 2px; }

    .action-icon { font-size: 0.8rem; color: var(--text-tertiary); opacity: 0; transition: opacity 0.2s; }
    .alert-item:hover .action-icon { opacity: 1; }

    .empty-state {
      padding: var(--spacing-lg);
      border: 1px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius);
      text-align: center;
      opacity: 0.6;
    }
    .empty-text { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

    /* Security Card */
    .security-card {
      flex-shrink: 0;
      padding: var(--spacing-lg);
      border: 1px dashed var(--color-success-border);
      background: var(--color-success-bg);
      border-radius: var(--ui-border-radius-lg);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .security-icon-box {
      width: 2.5rem; height: 2.5rem;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1); /* Emerald 10% */
      color: var(--color-success);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .security-title { font-size: var(--font-size-sm); font-weight: bold; color: var(--text-primary); margin: 0; }
    .security-desc { font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px; line-height: 1.4; }

    /* RIGHT COLUMN (Logs Grid) */
    .main-column {
      height: 100%;
      min-height: 0;
    }

    .grid-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
    }

    .grid-header {
      flex-shrink: 0;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    
    .live-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      background: var(--accent-focus);
      color: var(--accent-primary);
    }

    .grid-container { flex: 1; position: relative; width: 100%; }
    .full-size-grid { width: 100%; height: 100%; display: block; position: absolute; inset: 0; }

    /* SCROLLBAR UTILITY */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

    /* LOADER */
    .loader-container {
      height: 100%;
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
export class RealTimeMonitoringComponent implements OnInit {
  monitorData = signal<any>(null);
  loading = signal<boolean>(true);
  logColumns: any[] = [];

  allAlerts = computed(() => {
    const data = this.monitorData();
    if (!data || !data.alerts) return [];
    return [...(data.alerts.critical || []), ...(data.alerts.warning || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

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
    // Grid Columns using CSS Variables
    this.logColumns = [
      {
        field: 'userId.name', 
        headerName: 'Admin Associate', 
        sortable: true, 
        flex: 1,
        minWidth: 160,
        cellRenderer: (params: any) => {
          const user = params.data?.userId || {}; 
          const name = user.name || 'Unknown';
          const email = user.email || 'No Email';

          return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
                    <span style="font-weight: 700; color: var(--text-primary);">${name}</span>
                    <span style="font-size: 10px; color: var(--text-label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${email}</span>
                  </div>`;
        }
      },
 {
      field: 'action', 
      headerName: 'Action Performed', 
      sortable: true, 
      width: 160,
      cellRenderer: (params: any) => {
        const fullAction = params.value || '';
        const parts = fullAction.split(':');
        const category = parts[0] ? parts[0].trim() : '';
        const actionName = parts[1] ? parts[1].trim() : fullAction;

        // Added 'justify-content: center' and 'height: 100%' to center it vertically
        return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 3px;">
                  <span style="padding: 3px 8px; width: fit-content; border-radius: 4px; font-weight: 700; font-size: 10px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); text-transform: uppercase; color: var(--accent-primary); line-height: 1;">
                    ${actionName}
                  </span>
                  <span style="font-size: 10px; opacity: 0.7; color: var(--text-tertiary); line-height: 1;">${category}</span>
                </div>`;
      }
    },
      {
        field: 'ip', 
        headerName: 'Network Details', 
        sortable: true, 
        width: 140,
        cellRenderer: (params: any) => {
          return `<div style="display: flex; flex-direction: column; font-size: 10px;">
                    <span style="font-family: var(--font-mono); color: var(--text-secondary);">${params.value || '-'}</span>
                    <span style="opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; color: var(--text-tertiary);">${params.data?.userAgent || '-'}</span>
                  </div>`;
        }
      },
      {
        field: 'createdAt', 
        headerName: 'Time', 
        sortable: true, 
        width: 100,
        type: 'rightAligned',
        valueFormatter: (params: any) => {
          if (!params.value) return '-';
          return this.commonService.formatDate(params.value, 'HH:mm:ss');
        },
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'font-size': '11px', 'color': 'var(--text-primary)', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getRealTimeMonitoring().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.monitorData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
