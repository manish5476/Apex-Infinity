import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-real-time-monitoring',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, TagModule, ProgressSpinnerModule, 
    TooltipModule, AgShareGrid, UniversalFilterComponent
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
            <h2 class="page-title">Live System Integrity</h2>
            <p class="page-subtitle">
              Response: {{ lastResponseTime() }} • Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'HH:mm:ss' }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <p-button label="Network Audit" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
          <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()" pTooltip="Force Re-scan"></p-button>
        </div>
      </div>

      <div class="filter-section glass-panel">
        <app-universal-filter
          [entityType]="'real-time-monitoring'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          <div class="kpi-card glass-panel">
            <p class="kpi-label">Active Incidents</p>
            <h3 class="kpi-value">{{ monitorData()?.alerts?.total || 0 }}</h3>
          </div>
          
          <div class="kpi-card glass-panel critical-edge">
            <p class="kpi-label">Critical Risks</p>
            <h3 class="kpi-value error">{{ monitorData()?.alerts?.critical?.length || 0 }}</h3>
          </div>
          
          <div class="kpi-card glass-panel warning-edge">
            <p class="kpi-label">System Warnings</p>
            <h3 class="kpi-value warning">{{ monitorData()?.alerts?.warning?.length || 0 }}</h3>
          </div>
          
          <div class="kpi-card glass-panel" [class.secure-edge]="(monitorData()?.security?.riskyActions || 0) === 0">
            <p class="kpi-label">Risky Activity</p>
            <h3 class="kpi-value" [ngClass]="(monitorData()?.security?.riskyActions || 0) > 0 ? 'error' : 'success'">
              {{ monitorData()?.security?.riskyActions || 0 }}
            </h3>
          </div>
        </div>

        <div class="content-layout">
          <div class="side-column">
            <div class="alert-panel glass-panel">
               <h3 class="panel-title">Priority Interventions</h3>
               <div class="alert-list custom-scrollbar">
                 @if (allAlerts().length > 0) {
                   @for (alert of allAlerts(); track alert.timestamp) {
                     <div class="alert-item" [class.is-critical]="alert.severity === 'critical'">
                       <div class="severity-indicator"></div>
                       <div class="alert-content">
                          <p class="alert-msg">{{ alert.message }}</p>
                          <p class="alert-meta">{{ alert.type | uppercase }} • {{ alert.timestamp | date:'shortTime' }}</p>
                       </div>
                       <i class="pi pi-chevron-right"></i>
                     </div>
                   }
                 } @else {
                   <div class="empty-state">
                     <i class="pi pi-check-circle success-text"></i>
                     <p>All subsystems nominal.</p>
                   </div>
                 }
               </div>
            </div>

            <div class="security-card glass-panel" [ngClass]="(monitorData()?.security?.riskyActions || 0) > 0 ? 'alert-bg' : 'secure-bg'">
               <div class="security-icon-box">
                 <i class="pi" [ngClass]="(monitorData()?.security?.riskyActions || 0) > 0 ? 'pi-bolt' : 'pi-lock'"></i>
               </div>
               <div>
                 <p class="security-title">Postural Status: {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Vulnerable' : 'Hardened' }}</p>
                 <p class="security-desc">
                   {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Unauthorized sequences detected. Review logs immediately.' : 'No anomalous behavioral patterns detected in live traffic.' }}
                 </p>
               </div>
            </div>
          </div>

          <div class="main-column">
            <div class="grid-card glass-panel">
              <div class="grid-header">
                <h3 class="grid-title">Behavioral Access Logs</h3>
                <span class="live-tag">REAL-TIME TRAFFIC</span>
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
        <div class="integrity-loader">
          <p-progressSpinner strokeWidth="3"></p-progressSpinner>
          <p>Analyzing Traffic Patterns...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .monitoring-container {
      padding: var(--spacing-xl); background: var(--bg-primary); height: 100vh; display: flex; flex-direction: column; overflow: hidden;
    }
    .glass-panel {
      background: color-mix(in srgb, var(--bg-secondary), transparent 10%);
      backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
    }
    .header-section {
      display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg);
      .page-title { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: 800; margin: 0; }
      .page-subtitle { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; }
    }
    .pulse-indicator { display: flex; width: 10px; height: 10px; position: relative; margin-right: 8px;
      .pulse-ring { position: absolute; width: 100%; height: 100%; background: var(--color-success); border-radius: 50%; animation: ping 1.5s infinite; }
      .pulse-dot { width: 10px; height: 10px; background: var(--color-success); border-radius: 50%; position: relative; }
    }
    @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);
      .kpi-card { padding: var(--spacing-lg); border-bottom: 3px solid transparent; 
        &.critical-edge { border-bottom-color: var(--color-error); }
        &.warning-edge { border-bottom-color: var(--color-warning); }
        &.secure-edge { border-bottom-color: var(--color-success); }
      }
      .kpi-label { font-size: 10px; font-weight: 800; color: var(--text-label); text-transform: uppercase; }
      .kpi-value { font-family: var(--font-mono); font-size: var(--font-size-3xl); font-weight: 800; margin: 0; }
    }

    .content-layout { display: grid; grid-template-columns: 4fr 8fr; gap: var(--spacing-xl); flex: 1; min-height: 0; }
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); height: 100%; }
    .alert-panel { flex: 1; padding: var(--spacing-lg); display: flex; flex-direction: column; min-height: 0;
      .panel-title { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: var(--spacing-md); }
      .alert-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    }
    .alert-item {
      display: flex; align-items: center; padding: 12px; background: var(--bg-primary); border-radius: 8px; gap: 12px;
      border: 1px solid var(--border-subtle); position: relative;
      &.is-critical { background: var(--color-error-bg); border-color: var(--color-error-border); }
      .alert-msg { font-size: var(--font-size-xs); font-weight: 700; margin: 0; line-height: 1.3; }
      .alert-meta { font-size: 9px; font-weight: 600; color: var(--text-muted); margin-top: 4px; }
      i { font-size: 10px; opacity: 0.5; }
    }

    .security-card {
      padding: var(--spacing-lg); display: flex; gap: var(--spacing-md);
      &.secure-bg { background: var(--color-success-bg); border-color: var(--color-success-border); color: var(--color-success); }
      &.alert-bg { background: var(--color-error-bg); border-color: var(--color-error-border); color: var(--color-error); }
      .security-icon-box { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 16px; }
      .security-title { font-weight: 800; font-size: var(--font-size-sm); margin: 0; }
      .security-desc { font-size: 11px; opacity: 0.8; margin-top: 2px; line-height: 1.4; }
    }

    .main-column { height: 100%; display: flex; flex-direction: column; 
      .grid-card { flex: 1; display: flex; flex-direction: column; overflow: hidden;
        .grid-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05); }
        .grid-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0; }
        .live-tag { font-size: 9px; font-weight: 900; color: var(--accent-primary); background: var(--accent-focus); padding: 2px 8px; border-radius: 4px; }
        .grid-container { flex: 1; position: relative; }
      }
    }
    .full-size-grid { position: absolute; inset: 0; width: 100%; height: 100%; }
    .integrity-loader { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; font-size: 10px; }
  `]
})
export class RealTimeMonitoringComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  private commonService = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  monitorData = signal<any>(null);
  loading = signal<boolean>(false);
  lastResponseTime = signal<string>('0ms');
  logColumns: any[] = [];
  private currentFilters: any = {};

  filterConfig: FilterField[] = [
    { key: 'branchId', label: 'Domain', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'All Domains' },
    { key: 'severity', label: 'Threat Level', type: 'select', placeholder: 'All Levels',
      staticOptions: [{ label: 'Critical Only', value: 'critical' }, { label: 'Active Alerts', value: 'warning' }]
    }
  ];

  allAlerts = computed(() => {
    const data = this.monitorData();
    if (!data?.alerts) return [];
    return [...(data.alerts.critical || []), ...(data.alerts.warning || [])]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getRealTimeMonitoring(this.currentFilters.branchId, this.currentFilters.severity).subscribe({
      next: (res) => {
        this.monitorData.set(res.data);
        this.lastResponseTime.set(res.meta?.responseTime || '0ms');
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.logColumns = [
      {
        field: 'userId.name', headerName: 'Subject', flex: 1,
        cellRenderer: (p: any) => `
          <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
            <span style="font-weight: 800; color: var(--text-primary); font-size: 12px;">${p.data?.userId?.name || 'SYSTEM'}</span>
            <span style="font-size: 9px; color: var(--text-muted);">${p.data?.userId?.email || 'INTERNAL'}</span>
          </div>`
      },
      {
        field: 'action', headerName: 'Protocol Action', width: 180,
        cellRenderer: (p: any) => {
          const [cat, act] = (p.value || '').split(':');
          return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
            <span style="background: var(--bg-ternary); color: var(--accent-primary); padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 9px; width: fit-content; border: 1px solid var(--border-secondary);">${(act || cat).toUpperCase()}</span>
            <span style="font-size: 8px; color: var(--text-tertiary); margin-top: 2px;">Scope: ${cat}</span>
          </div>`;
        }
      },
      {
        field: 'ip', headerName: 'Source Node', width: 140,
        cellRenderer: (p: any) => `<span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); font-weight: 600;">${p.value}</span>`
      },
      {
        field: 'createdAt', headerName: 'Timestamp', width: 100,
        valueFormatter: (p: any) => this.commonService.formatDate(p.value, 'HH:mm:ss'),
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '800', 'font-size': '11px', 'color': 'var(--accent-primary)', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }
}
// import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-real-time-monitoring',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TagModule, 
//     ProgressSpinnerModule, 
//     TooltipModule,
//     AgShareGrid,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="monitoring-container">

//       <div class="header-section">
//         <div class="header-title-row">
//           <div class="pulse-indicator">
//             <span class="pulse-ring"></span>
//             <span class="pulse-dot"></span>
//           </div>
//           <div>
//             <h2 class="page-title">Live System Monitor</h2>
//             <p class="page-subtitle">
//               Last Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'mediumTime' }}
//             </p>
//           </div>
//         </div>
//         <div class="header-actions">
//           <p-button label="Audit Logs" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
//           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
//         </div>
//       </div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'real-time-monitoring'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
//           <div class="kpi-card">
//             <p class="kpi-label">Total Alerts</p>
//             <h3 class="kpi-value">{{ monitorData()?.alerts?.total || 0 }}</h3>
//           </div>
          
//           <div class="kpi-card error-border">
//             <p class="kpi-label">Critical Risk</p>
//             <h3 class="kpi-value error">{{ monitorData()?.alerts?.critical?.length || 0 }}</h3>
//           </div>
          
//           <div class="kpi-card warning-border">
//             <p class="kpi-label">Warnings</p>
//             <h3 class="kpi-value warning">{{ monitorData()?.alerts?.warning?.length || 0 }}</h3>
//           </div>
          
//           <div class="kpi-card">
//             <p class="kpi-label">Risky Actions</p>
//             <h3 class="kpi-value" 
//                 [ngClass]="monitorData()?.security?.riskyActions > 0 ? 'error' : 'success'">
//               {{ monitorData()?.security?.riskyActions || 0 }}
//             </h3>
//           </div>
//         </div>

//         <div class="content-layout">
          
//           <div class="side-column">
            
//             <div class="alert-panel">
//                <h3 class="panel-title">Priority Intervention</h3>
               
//                <div class="alert-list custom-scrollbar">
//                  <ng-container *ngIf="allAlerts().length > 0; else noAlerts">
//                    @for (alert of allAlerts(); track alert.timestamp) {
//                      <div class="alert-item">
//                        <i class="pi alert-icon" 
//                           [ngClass]="alert.severity === 'critical' ? 'pi-exclamation-triangle error' : 'pi-info-circle warning'"></i>
//                        <div class="alert-content">
//                           <p class="alert-msg">{{ alert.message }}</p>
//                           <p class="alert-meta">{{ alert.type }} • {{ alert.timestamp | date:'shortTime' }}</p>
//                        </div>
//                        <i class="pi pi-arrow-right action-icon"></i>
//                      </div>
//                    }
//                  </ng-container>
//                  <ng-template #noAlerts>
//                    <div class="empty-state">
//                      <p class="empty-text">No active alerts requiring intervention.</p>
//                    </div>
//                  </ng-template>
//                </div>
//             </div>

//             <div class="security-card">
//                <div class="security-icon-box">
//                  <i class="pi pi-lock"></i>
//                </div>
//                <div>
//                  <p class="security-title">Security Posture: Secure</p>
//                  <p class="security-desc">
//                    No risky actions detected in current session.
//                  </p>
//                </div>
//             </div>
//           </div>

//           <div class="main-column">
//             <div class="grid-card">
              
//               <div class="grid-header">
//                 <h3 class="grid-title">Real-time Access Logs</h3>
//                 <span class="live-badge">LIVE STREAM</span>
//               </div>

//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="logColumns" 
//                    [data]="monitorData()?.security?.recentEvents || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>

//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Scanning System Integrity...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; height: 100vh; overflow: hidden; }

//     .monitoring-container {
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       overflow-y: auto; 
//     }

//     /* HEADER */
//     .header-section {
//       flex-shrink: 0;
//       margin-bottom: var(--spacing-md);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       flex-wrap: wrap;
//       gap: var(--spacing-md);
//     }
    
//     .filter-section { margin-bottom: var(--spacing-lg); }

//     .header-title-row { display: flex; align-items: center; gap: var(--spacing-md); }

//     /* Pulse Animation */
//     .pulse-indicator { position: relative; display: flex; height: 12px; width: 12px; }
//     .pulse-ring {
//       position: absolute; display: inline-flex; height: 100%; width: 100%;
//       border-radius: 50%; opacity: 0.75;
//       background-color: var(--color-success);
//       animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
//     }
//     .pulse-dot {
//       position: relative; display: inline-flex; border-radius: 50%; height: 12px; width: 12px;
//       background-color: var(--color-success);
//     }
//     @keyframes ping {
//       75%, 100% { transform: scale(2); opacity: 0; }
//     }

//     .page-title {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       line-height: 1.2;
//     }

//     .page-subtitle {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin: 0;
//     }

//     .header-actions { display: flex; gap: var(--spacing-sm); }

//     /* KPI GRID */
//     .kpi-grid {
//       flex-shrink: 0;
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-lg);
//     }

//     .kpi-card {
//       padding: var(--spacing-md);
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       transition: var(--transition-base);
//     }
//     .kpi-card.error-border { border-left: 4px solid var(--color-error); }
//     .kpi-card.warning-border { border-left: 4px solid var(--color-warning); }

//     .kpi-label {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin: 0 0 4px 0;
//     }

//     .kpi-value {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       font-family: var(--font-mono);
//     }
//     .kpi-value.error { color: var(--color-error); }
//     .kpi-value.warning { color: var(--color-warning); }
//     .kpi-value.success { color: var(--color-success); }

//     /* CONTENT LAYOUT */
//     .content-layout {
//       flex: 1;
//       min-height: 0; /* Important for flex child scrolling */
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media (min-width: 1024px) {
//       .content-layout { grid-template-columns: 5fr 7fr; }
//     }

//     /* LEFT COLUMN */
//     .side-column {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-lg);
//       height: 100%;
//       overflow: hidden;
//     }

//     /* Alert Panel */
//     .alert-panel {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       min-height: 0;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//     }

//     .panel-title {
//       flex-shrink: 0;
//       font-size: var(--font-size-sm);
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-md) 0;
//     }

//     .alert-list {
//       flex: 1;
//       overflow-y: auto;
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//       padding-right: 4px;
//     }

//     .alert-item {
//       display: flex;
//       align-items: flex-start;
//       gap: var(--spacing-md);
//       padding: var(--spacing-md);
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       transition: background 0.2s;
//       cursor: default;
//     }
//     .alert-item:hover { background: var(--component-bg-hover); }

//     .alert-icon { margin-top: 2px; font-size: 1rem; }
//     .alert-icon.error { color: var(--color-error); }
//     .alert-icon.warning { color: var(--color-warning); }

//     .alert-content { flex: 1; }
//     .alert-msg { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0; }
//     .alert-meta { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-label); margin-top: 2px; }

//     .action-icon { font-size: 0.8rem; color: var(--text-tertiary); opacity: 0; transition: opacity 0.2s; }
//     .alert-item:hover .action-icon { opacity: 1; }

//     .empty-state {
//       padding: var(--spacing-lg);
//       border: 1px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       text-align: center;
//       opacity: 0.6;
//     }
//     .empty-text { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

//     /* Security Card */
//     .security-card {
//       flex-shrink: 0;
//       padding: var(--spacing-lg);
//       border: 1px dashed var(--color-success-border);
//       background: var(--color-success-bg);
//       border-radius: var(--ui-border-radius-lg);
//       display: flex;
//       align-items: flex-start;
//       gap: var(--spacing-md);
//     }

//     .security-icon-box {
//       width: 2.5rem; height: 2.5rem;
//       border-radius: 50%;
//       background: rgba(16, 185, 129, 0.1); /* Emerald 10% */
//       color: var(--color-success);
//       display: flex; align-items: center; justify-content: center;
//       flex-shrink: 0;
//     }

//     .security-title { font-size: var(--font-size-sm); font-weight: bold; color: var(--text-primary); margin: 0; }
//     .security-desc { font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px; line-height: 1.4; }

//     /* RIGHT COLUMN (Logs Grid) */
//     .main-column {
//       height: 100%;
//       min-height: 0;
//     }

//     .grid-card {
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       overflow: hidden;
//     }

//     .grid-header {
//       flex-shrink: 0;
//       padding: var(--spacing-md);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    
//     .live-badge {
//       padding: 2px 6px;
//       border-radius: 4px;
//       font-size: 10px;
//       font-weight: bold;
//       background: var(--accent-focus);
//       color: var(--accent-primary);
//     }

//     .grid-container { flex: 1; position: relative; width: 100%; }
//     .full-size-grid { width: 100%; height: 100%; display: block; position: absolute; inset: 0; }

//     /* SCROLLBAR UTILITY */
//     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

//     /* LOADER */
//     .loader-container {
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//   `]
// })
// export class RealTimeMonitoringComponent implements OnInit {
//   public commonService = inject(CommonMethodService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr = inject(ChangeDetectorRef);

//   monitorData = signal<any>(null);
//   loading = signal<boolean>(false);
//   logColumns: any[] = [];

//   // Stored Filters
//   private currentFilters: any = {};

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Scope',
//       type: 'select',
//       dataSourceKey: 'branches', // Binds to MasterListService
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Monitor'
//     },
//     {
//       key: 'severity',
//       label: 'Alert Level',
//       type: 'select',
//       staticOptions: [
//         { label: 'Critical Only', value: 'critical' },
//         { label: 'Warnings & Above', value: 'warning' },
//         { label: 'All Events', value: 'info' }
//       ],
//       placeholder: 'All Levels'
//     }
//   ];

//   allAlerts = computed(() => {
//     const data = this.monitorData();
//     if (!data || !data.alerts) return [];
//     return [...(data.alerts.critical || []), ...(data.alerts.warning || [])].sort(
//       (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//     );
//   });

//   ngOnInit() {
//     this.setupColumns();
//     // loadData triggered by filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
    
//     // Pass filters to API
//     const branchId = this.currentFilters.branchId;
//     const severity = this.currentFilters.severity;

//     this.analyticsService.getRealTimeMonitoring(branchId, severity).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.monitorData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   setupColumns(): void {
//     // Grid Columns using CSS Variables
//     this.logColumns = [
//       {
//         field: 'userId.name', 
//         headerName: 'Admin Associate', 
//         sortable: true, 
//         flex: 1, 
//         minWidth: 160,
//         cellRenderer: (params: any) => {
//           const user = params.data?.userId || {}; 
//           const name = user.name || 'Unknown';
//           const email = user.email || 'No Email';

//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//                     <span style="font-weight: 700; color: var(--text-primary);">${name}</span>
//                     <span style="font-size: 10px; color: var(--text-label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${email}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'action', 
//         headerName: 'Action Performed', 
//         sortable: true, 
//         width: 160,
//         cellRenderer: (params: any) => {
//           const fullAction = params.value || '';
//           const parts = fullAction.split(':');
//           const category = parts[0] ? parts[0].trim() : '';
//           const actionName = parts[1] ? parts[1].trim() : fullAction;

//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 3px;">
//                     <span style="padding: 3px 8px; width: fit-content; border-radius: 4px; font-weight: 700; font-size: 10px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); text-transform: uppercase; color: var(--accent-primary); line-height: 1;">
//                       ${actionName}
//                     </span>
//                     <span style="font-size: 10px; opacity: 0.7; color: var(--text-tertiary); line-height: 1;">${category}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'ip', 
//         headerName: 'Network Details', 
//         sortable: true, 
//         width: 140,
//         cellRenderer: (params: any) => {
//           return `<div style="display: flex; flex-direction: column; font-size: 10px;">
//                     <span style="font-family: var(--font-mono); color: var(--text-secondary);">${params.value || '-'}</span>
//                     <span style="opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; color: var(--text-tertiary);">${params.data?.userAgent || '-'}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'createdAt', 
//         headerName: 'Time', 
//         sortable: true, 
//         width: 100,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => {
//           if (!params.value) return '-';
//           return this.commonService.formatDate(params.value, 'HH:mm:ss');
//         },
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'font-size': '11px', 'color': 'var(--text-primary)', 'text-align': 'right' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }

// // import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { CommonMethodService } from '../../core/utils/common-method.service';
// // import { AdminAnalyticsService } from '../admin-analytics.service';
// // import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// // @Component({
// //   selector: 'app-real-time-monitoring',
// //   standalone: true,
// //   imports: [
// //     CommonModule, 
// //     ButtonModule, 
// //     TagModule, 
// //     ProgressSpinnerModule, 
// //     TooltipModule,
// //     AgShareGrid
// //   ],
// //   template: `
// //     <div class="monitoring-container">

// //       <div class="header-section">
// //         <div class="header-title-row">
// //           <div class="pulse-indicator">
// //             <span class="pulse-ring"></span>
// //             <span class="pulse-dot"></span>
// //           </div>
// //           <div>
// //             <h2 class="page-title">Live System Monitor</h2>
// //             <p class="page-subtitle">
// //               Last Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'mediumTime' }}
// //             </p>
// //           </div>
// //         </div>
// //         <div class="header-actions">
// //           <p-button label="Audit Logs" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
// //           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
// //         </div>
// //       </div>

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="kpi-grid">
// //           <div class="kpi-card">
// //             <p class="kpi-label">Total Alerts</p>
// //             <h3 class="kpi-value">{{ monitorData()?.alerts?.total || 0 }}</h3>
// //           </div>
          
// //           <div class="kpi-card error-border">
// //             <p class="kpi-label">Critical Risk</p>
// //             <h3 class="kpi-value error">{{ monitorData()?.alerts?.critical?.length || 0 }}</h3>
// //           </div>
          
// //           <div class="kpi-card warning-border">
// //             <p class="kpi-label">Warnings</p>
// //             <h3 class="kpi-value warning">{{ monitorData()?.alerts?.warning?.length || 0 }}</h3>
// //           </div>
          
// //           <div class="kpi-card">
// //             <p class="kpi-label">Risky Actions</p>
// //             <h3 class="kpi-value" 
// //                 [ngClass]="monitorData()?.security?.riskyActions > 0 ? 'error' : 'success'">
// //               {{ monitorData()?.security?.riskyActions || 0 }}
// //             </h3>
// //           </div>
// //         </div>

// //         <div class="content-layout">
          
// //           <div class="side-column">
            
// //             <div class="alert-panel">
// //                <h3 class="panel-title">Priority Intervention</h3>
               
// //                <div class="alert-list custom-scrollbar">
// //                  <ng-container *ngIf="allAlerts().length > 0; else noAlerts">
// //                    @for (alert of allAlerts(); track alert.timestamp) {
// //                      <div class="alert-item">
// //                        <i class="pi alert-icon" 
// //                           [ngClass]="alert.severity === 'critical' ? 'pi-exclamation-triangle error' : 'pi-info-circle warning'"></i>
// //                        <div class="alert-content">
// //                           <p class="alert-msg">{{ alert.message }}</p>
// //                           <p class="alert-meta">{{ alert.type }} • {{ alert.timestamp | date:'shortTime' }}</p>
// //                        </div>
// //                        <i class="pi pi-arrow-right action-icon"></i>
// //                      </div>
// //                    }
// //                  </ng-container>
// //                  <ng-template #noAlerts>
// //                    <div class="empty-state">
// //                      <p class="empty-text">No active alerts requiring intervention.</p>
// //                    </div>
// //                  </ng-template>
// //                </div>
// //             </div>

// //             <div class="security-card">
// //                <div class="security-icon-box">
// //                  <i class="pi pi-lock"></i>
// //                </div>
// //                <div>
// //                  <p class="security-title">Security Posture: Secure</p>
// //                  <p class="security-desc">
// //                    No risky actions detected in current session.
// //                  </p>
// //                </div>
// //             </div>
// //           </div>

// //           <div class="main-column">
// //             <div class="grid-card">
              
// //               <div class="grid-header">
// //                 <h3 class="grid-title">Real-time Access Logs</h3>
// //                 <span class="live-badge">LIVE STREAM</span>
// //               </div>

// //               <div class="grid-container">
// //                  <app-ag-share-grid 
// //                    [columns]="logColumns" 
// //                    [data]="monitorData()?.security?.recentEvents || []" 
// //                    [showActions]="false" 
// //                    class="full-size-grid">
// //                  </app-ag-share-grid>
// //               </div>

// //             </div>
// //           </div>
// //         </div>

// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="loader-container">
// //           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
// //           <p class="loader-text">Scanning System Integrity...</p>
// //         </div>
// //       </ng-template>

// //     </div>
// //   `,
// //   styles: [`
// //     /* HOST & LAYOUT */
// //     :host { display: block; width: 100%; height: 100vh; overflow: hidden; }

// //     .monitoring-container {
// //       height: 100%;
// //       display: flex;
// //       flex-direction: column;
// //       padding: var(--spacing-lg) var(--spacing-xl);
// //       background: var(--bg-primary);
// //       font-family: var(--font-body);
// //       overflow-y: auto; /* Allow scrolling if content overflows vertically on small screens */
// //     }

// //     /* HEADER */
// //     .header-section {
// //       flex-shrink: 0;
// //       margin-bottom: var(--spacing-lg);
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       flex-wrap: wrap;
// //       gap: var(--spacing-md);
// //     }

// //     .header-title-row { display: flex; align-items: center; gap: var(--spacing-md); }

// //     /* Pulse Animation */
// //     .pulse-indicator { position: relative; display: flex; height: 12px; width: 12px; }
// //     .pulse-ring {
// //       position: absolute; display: inline-flex; height: 100%; width: 100%;
// //       border-radius: 50%; opacity: 0.75;
// //       background-color: var(--color-success);
// //       animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
// //     }
// //     .pulse-dot {
// //       position: relative; display: inline-flex; border-radius: 50%; height: 12px; width: 12px;
// //       background-color: var(--color-success);
// //     }
// //     @keyframes ping {
// //       75%, 100% { transform: scale(2); opacity: 0; }
// //     }

// //     .page-title {
// //       font-size: var(--font-size-2xl);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-primary);
// //       margin: 0;
// //       line-height: 1.2;
// //     }

// //     .page-subtitle {
// //       font-size: var(--font-size-xs);
// //       font-weight: bold;
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //       color: var(--text-tertiary);
// //       margin: 0;
// //     }

// //     .header-actions { display: flex; gap: var(--spacing-sm); }

// //     /* KPI GRID */
// //     .kpi-grid {
// //       flex-shrink: 0;
// //       display: grid;
// //       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
// //       gap: var(--spacing-md);
// //       margin-bottom: var(--spacing-lg);
// //     }

// //     .kpi-card {
// //       padding: var(--spacing-md);
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       transition: var(--transition-base);
// //     }
// //     .kpi-card.error-border { border-left: 4px solid var(--color-error); }
// //     .kpi-card.warning-border { border-left: 4px solid var(--color-warning); }

// //     .kpi-label {
// //       font-size: 10px;
// //       font-weight: bold;
// //       text-transform: uppercase;
// //       color: var(--text-label);
// //       margin: 0 0 4px 0;
// //     }

// //     .kpi-value {
// //       font-size: var(--font-size-2xl);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-primary);
// //       margin: 0;
// //       font-family: var(--font-mono);
// //     }
// //     .kpi-value.error { color: var(--color-error); }
// //     .kpi-value.warning { color: var(--color-warning); }
// //     .kpi-value.success { color: var(--color-success); }

// //     /* CONTENT LAYOUT */
// //     .content-layout {
// //       flex: 1;
// //       min-height: 0; /* Important for flex child scrolling */
// //       display: grid;
// //       grid-template-columns: 1fr;
// //       gap: var(--spacing-lg);
// //     }
// //     @media (min-width: 1024px) {
// //       .content-layout { grid-template-columns: 5fr 7fr; }
// //     }

// //     /* LEFT COLUMN */
// //     .side-column {
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-lg);
// //       height: 100%;
// //       overflow: hidden;
// //     }

// //     /* Alert Panel */
// //     .alert-panel {
// //       flex: 1;
// //       display: flex;
// //       flex-direction: column;
// //       min-height: 0;
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-lg);
// //     }

// //     .panel-title {
// //       flex-shrink: 0;
// //       font-size: var(--font-size-sm);
// //       font-weight: bold;
// //       text-transform: uppercase;
// //       color: var(--text-primary);
// //       margin: 0 0 var(--spacing-md) 0;
// //     }

// //     .alert-list {
// //       flex: 1;
// //       overflow-y: auto;
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-sm);
// //       padding-right: 4px;
// //     }

// //     .alert-item {
// //       display: flex;
// //       align-items: flex-start;
// //       gap: var(--spacing-md);
// //       padding: var(--spacing-md);
// //       background: var(--bg-ternary);
// //       border: 1px solid var(--border-secondary);
// //       border-radius: var(--ui-border-radius-lg);
// //       transition: background 0.2s;
// //       cursor: default;
// //     }
// //     .alert-item:hover { background: var(--component-bg-hover); }

// //     .alert-icon { margin-top: 2px; font-size: 1rem; }
// //     .alert-icon.error { color: var(--color-error); }
// //     .alert-icon.warning { color: var(--color-warning); }

// //     .alert-content { flex: 1; }
// //     .alert-msg { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-primary); margin: 0; }
// //     .alert-meta { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-label); margin-top: 2px; }

// //     .action-icon { font-size: 0.8rem; color: var(--text-tertiary); opacity: 0; transition: opacity 0.2s; }
// //     .alert-item:hover .action-icon { opacity: 1; }

// //     .empty-state {
// //       padding: var(--spacing-lg);
// //       border: 1px dashed var(--border-secondary);
// //       border-radius: var(--ui-border-radius);
// //       text-align: center;
// //       opacity: 0.6;
// //     }
// //     .empty-text { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }

// //     /* Security Card */
// //     .security-card {
// //       flex-shrink: 0;
// //       padding: var(--spacing-lg);
// //       border: 1px dashed var(--color-success-border);
// //       background: var(--color-success-bg);
// //       border-radius: var(--ui-border-radius-lg);
// //       display: flex;
// //       align-items: flex-start;
// //       gap: var(--spacing-md);
// //     }

// //     .security-icon-box {
// //       width: 2.5rem; height: 2.5rem;
// //       border-radius: 50%;
// //       background: rgba(16, 185, 129, 0.1); /* Emerald 10% */
// //       color: var(--color-success);
// //       display: flex; align-items: center; justify-content: center;
// //       flex-shrink: 0;
// //     }

// //     .security-title { font-size: var(--font-size-sm); font-weight: bold; color: var(--text-primary); margin: 0; }
// //     .security-desc { font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px; line-height: 1.4; }

// //     /* RIGHT COLUMN (Logs Grid) */
// //     .main-column {
// //       height: 100%;
// //       min-height: 0;
// //     }

// //     .grid-card {
// //       height: 100%;
// //       display: flex;
// //       flex-direction: column;
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       overflow: hidden;
// //     }

// //     .grid-header {
// //       flex-shrink: 0;
// //       padding: var(--spacing-md);
// //       border-bottom: 1px solid var(--border-primary);
// //       background: var(--bg-ternary);
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //     }

// //     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    
// //     .live-badge {
// //       padding: 2px 6px;
// //       border-radius: 4px;
// //       font-size: 10px;
// //       font-weight: bold;
// //       background: var(--accent-focus);
// //       color: var(--accent-primary);
// //     }

// //     .grid-container { flex: 1; position: relative; width: 100%; }
// //     .full-size-grid { width: 100%; height: 100%; display: block; position: absolute; inset: 0; }

// //     /* SCROLLBAR UTILITY */
// //     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
// //     .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
// //     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
// //     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

// //     /* LOADER */
// //     .loader-container {
// //       height: 100%;
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //       justify-content: center;
// //       gap: var(--spacing-md);
// //     }
// //     .loader-text {
// //       font-size: var(--font-size-sm);
// //       color: var(--text-tertiary);
// //       font-weight: bold;
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //     }
// //   `]
// // })
// // export class RealTimeMonitoringComponent implements OnInit {
// //   monitorData = signal<any>(null);
// //   loading = signal<boolean>(true);
// //   logColumns: any[] = [];

// //   allAlerts = computed(() => {
// //     const data = this.monitorData();
// //     if (!data || !data.alerts) return [];
// //     return [...(data.alerts.critical || []), ...(data.alerts.warning || [])].sort(
// //       (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
// //     );
// //   });

// //   constructor(
// //     private analyticsService: AdminAnalyticsService,
// //     public commonService: CommonMethodService,
// //     private cdr: ChangeDetectorRef
// //   ) {}

// //   ngOnInit() {
// //     this.setupColumns();
// //     this.loadData();
// //   }

// //   setupColumns(): void {
// //     // Grid Columns using CSS Variables
// //     this.logColumns = [
// //       {
// //         field: 'userId.name', 
// //         headerName: 'Admin Associate', 
// //         sortable: true, 
// //         flex: 1,
// //         minWidth: 160,
// //         cellRenderer: (params: any) => {
// //           const user = params.data?.userId || {}; 
// //           const name = user.name || 'Unknown';
// //           const email = user.email || 'No Email';

// //           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
// //                     <span style="font-weight: 700; color: var(--text-primary);">${name}</span>
// //                     <span style="font-size: 10px; color: var(--text-label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${email}</span>
// //                   </div>`;
// //         }
// //       },
// //  {
// //       field: 'action', 
// //       headerName: 'Action Performed', 
// //       sortable: true, 
// //       width: 160,
// //       cellRenderer: (params: any) => {
// //         const fullAction = params.value || '';
// //         const parts = fullAction.split(':');
// //         const category = parts[0] ? parts[0].trim() : '';
// //         const actionName = parts[1] ? parts[1].trim() : fullAction;

// //         // Added 'justify-content: center' and 'height: 100%' to center it vertically
// //         return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 3px;">
// //                   <span style="padding: 3px 8px; width: fit-content; border-radius: 4px; font-weight: 700; font-size: 10px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); text-transform: uppercase; color: var(--accent-primary); line-height: 1;">
// //                     ${actionName}
// //                   </span>
// //                   <span style="font-size: 10px; opacity: 0.7; color: var(--text-tertiary); line-height: 1;">${category}</span>
// //                 </div>`;
// //       }
// //     },
// //       {
// //         field: 'ip', 
// //         headerName: 'Network Details', 
// //         sortable: true, 
// //         width: 140,
// //         cellRenderer: (params: any) => {
// //           return `<div style="display: flex; flex-direction: column; font-size: 10px;">
// //                     <span style="font-family: var(--font-mono); color: var(--text-secondary);">${params.value || '-'}</span>
// //                     <span style="opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; color: var(--text-tertiary);">${params.data?.userAgent || '-'}</span>
// //                   </div>`;
// //         }
// //       },
// //       {
// //         field: 'createdAt', 
// //         headerName: 'Time', 
// //         sortable: true, 
// //         width: 100,
// //         type: 'rightAligned',
// //         valueFormatter: (params: any) => {
// //           if (!params.value) return '-';
// //           return this.commonService.formatDate(params.value, 'HH:mm:ss');
// //         },
// //         cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'font-size': '11px', 'color': 'var(--text-primary)', 'text-align': 'right' }
// //       }
// //     ];
// //     this.cdr.detectChanges();
// //   }

// //   loadData() {
// //     this.loading.set(true);
// //     this.analyticsService.getRealTimeMonitoring().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           this.monitorData.set(res.data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }
// // }
