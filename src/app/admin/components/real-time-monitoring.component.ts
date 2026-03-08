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
              Latency: {{ lastResponseTime() }} • Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'HH:mm:ss' }}
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
                   {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Unauthorized sequences detected.' : 'No anomalous behavioral patterns detected.' }}
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
    /* =========================================
       LAYOUT CONTAINERS
       ========================================= */
    :host { display: block; height: 100vh; width: 100%; overflow: hidden; }

    .monitoring-container {
      padding: var(--spacing-xl); 
      background: var(--bg-primary); 
      height: 100%; 
      display: flex; flex-direction: column;
    }

    .glass-panel {
      background: color-mix(in srgb, var(--bg-secondary), transparent 10%);
      backdrop-filter: blur(var(--glass-blur-c)); 
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
    }

    /* HEADER */
    .header-section {
      display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg);
      .page-title { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: 800; margin: 0; }
      .page-subtitle { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; }
    }
    
    .pulse-indicator { display: flex; width: 10px; height: 10px; position: relative; margin-right: 8px; margin-top: 6px;
      .pulse-ring { position: absolute; width: 100%; height: 100%; background: var(--color-success); border-radius: 50%; animation: ping 1.5s infinite; }
      .pulse-dot { width: 10px; height: 10px; background: var(--color-success); border-radius: 50%; position: relative; }
    }
    @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

    .filter-section { margin-bottom: var(--spacing-lg); }

    /* KPI CARDS */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);
      .kpi-card { padding: var(--spacing-lg); border-bottom: 3px solid transparent; 
        &.critical-edge { border-bottom-color: var(--color-error); }
        &.warning-edge { border-bottom-color: var(--color-warning); }
        &.secure-edge { border-bottom-color: var(--color-success); }
      }
      .kpi-label { font-size: 10px; font-weight: 800; color: var(--text-label); text-transform: uppercase; }
      .kpi-value { font-family: var(--font-mono); font-size: var(--font-size-3xl); font-weight: 800; margin: 0; }
      .kpi-value.error { color: var(--color-error); }
      .kpi-value.warning { color: var(--color-warning); }
      .kpi-value.success { color: var(--color-success); }
    }

    /* MAIN CONTENT */
    .content-layout { display: grid; grid-template-columns: 350px 1fr; gap: var(--spacing-xl); flex: 1; min-height: 0; }
    
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); height: 100%; min-height: 0; }
    
    .alert-panel { flex: 1; padding: var(--spacing-lg); display: flex; flex-direction: column; min-height: 0; overflow: hidden;
      .panel-title { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: var(--spacing-md); }
      .alert-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; }
    }
    
    .alert-item {
      padding: 12px; background: var(--bg-primary); border-radius: 8px; 
      border: 1px solid var(--border-subtle); 
      &.is-critical { background: var(--color-error-bg); border-color: var(--color-error-border); }
      .alert-msg { font-size: var(--font-size-xs); font-weight: 700; margin: 0; line-height: 1.3; }
      .alert-meta { font-size: 9px; font-weight: 600; color: var(--text-muted); margin-top: 4px; }
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
        .grid-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); }
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

  // FIXED: STRICTLY SEPARATE COLUMNS
  setupColumns(): void {
    this.logColumns = [
      // 1. User Name Only
      { 
        field: 'userId.name', 
        headerName: 'User', 
        width: 150,
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' }
      },
      // 2. Email Only
      { 
        field: 'userId.email', 
        headerName: 'Email', 
        flex: 1,
        cellStyle: { 'color': 'var(--text-secondary)', 'font-size': '11px' }
      },
      // 3. Action Only
      { 
        field: 'action', 
        headerName: 'Action', 
        width: 160,
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--accent-primary)', 'font-size': '11px', 'font-weight': '600' }
      },
      // 4. IP Address Only
      { 
        field: 'ip', 
        headerName: 'Source IP', 
        width: 120,
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-tertiary)', 'font-size': '11px' }
      },
      // 5. Time Only
      { 
        field: 'createdAt', 
        headerName: 'Time', 
        width: 100,
        valueFormatter: (p: any) => this.commonService.formatDate(p.value, 'HH:mm:ss'),
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right' }
      }
    ];
    this.cdr.detectChanges();
  }
}
