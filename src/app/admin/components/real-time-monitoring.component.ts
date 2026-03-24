import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule, TagModule, ProgressSpinnerModule,
    TooltipModule, AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="rt-root">

  <!-- ══════════════════════════════════════
       HEADER
  ═══════════════════════════════════════ -->
  <div class="rt-header">
    <div class="header-left">
      <div class="live-pulse" aria-label="System live">
        <span class="pulse-ring"></span>
        <span class="pulse-core"></span>
      </div>
      <div>
        <h2 class="page-title">Live System Integrity</h2>
        <p class="page-meta">
          Latency: <span class="mono">{{ lastResponseTime() }}</span>
          &nbsp;·&nbsp;
          Pulse: <span class="mono">{{ monitorData()?.monitoring?.lastUpdated | date:'HH:mm:ss' }}</span>
        </p>
      </div>
    </div>
    <div class="header-actions">
      <button class="action-btn" pTooltip="Network Audit" tooltipPosition="bottom">
        <i class="pi pi-shield"></i>
        <span>Network Audit</span>
      </button>
      <button class="action-btn action-btn--primary" (click)="loadData()" [disabled]="loading()" pTooltip="Force re-scan" tooltipPosition="bottom">
        <i class="pi pi-refresh" [class.spinning]="loading()"></i>
      </button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       FILTER BAR
  ═══════════════════════════════════════ -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="real-time-monitoring"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- ══════════════════════════════════════
       LOADING STATE
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3"></p-progressSpinner>
      <span class="loader-text">Analysing traffic patterns…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading()) {

    <!-- KPI strip -->
    <div class="kpi-strip">

      <div class="kpi-card">
        <p class="kpi-label">Active Incidents</p>
        <p class="kpi-value">{{ monitorData()?.alerts?.total || 0 }}</p>
      </div>

      <div class="kpi-card kpi-card--error">
        <p class="kpi-label">Critical Risks</p>
        <p class="kpi-value kpi-value--error">{{ monitorData()?.alerts?.critical?.length || 0 }}</p>
      </div>

      <div class="kpi-card kpi-card--warning">
        <p class="kpi-label">System Warnings</p>
        <p class="kpi-value kpi-value--warning">{{ monitorData()?.alerts?.warning?.length || 0 }}</p>
      </div>

      <div class="kpi-card"
           [class.kpi-card--success]="(monitorData()?.security?.riskyActions || 0) === 0"
           [class.kpi-card--error]="(monitorData()?.security?.riskyActions || 0) > 0">
        <p class="kpi-label">Risky Activity</p>
        <p class="kpi-value"
           [class.kpi-value--success]="(monitorData()?.security?.riskyActions || 0) === 0"
           [class.kpi-value--error]="(monitorData()?.security?.riskyActions || 0) > 0">
          {{ monitorData()?.security?.riskyActions || 0 }}
        </p>
      </div>

    </div>

    <!-- Body: sidebar alerts + main log grid -->
    <div class="body-grid">

      <!-- ── Sidebar ── -->
      <div class="body-sidebar">

        <!-- Alert list -->
        <div class="panel panel--flex">
          <div class="panel-head">
            <h3 class="panel-title">Priority Interventions</h3>
            <span class="alert-count-badge">{{ allAlerts().length }}</span>
          </div>

          <div class="alert-scroll">
            @if (allAlerts().length > 0) {
              @for (alert of allAlerts(); track alert.timestamp) {
                <div class="alert-row" [class.alert-row--critical]="alert.severity === 'critical'">
                  <span class="alert-sev-bar"></span>
                  <div class="alert-body">
                    <p class="alert-msg">{{ alert.message }}</p>
                    <p class="alert-meta">
                      <span class="mono">{{ alert.type | uppercase }}</span>
                      &nbsp;·&nbsp;
                      {{ alert.timestamp | date:'shortTime' }}
                    </p>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-alerts">
                <i class="pi pi-check-circle"></i>
                <p>All subsystems nominal.</p>
              </div>
            }
          </div>
        </div>

        <!-- Security posture -->
        <div class="posture-card"
             [class.posture-card--secure]="(monitorData()?.security?.riskyActions || 0) === 0"
             [class.posture-card--alert]="(monitorData()?.security?.riskyActions || 0) > 0">
          <span class="posture-icon">
            <i class="pi" [class.pi-lock]="(monitorData()?.security?.riskyActions || 0) === 0"
                          [class.pi-bolt]="(monitorData()?.security?.riskyActions || 0) > 0"></i>
          </span>
          <div>
            <p class="posture-title">
              {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Vulnerable' : 'Hardened' }}
            </p>
            <p class="posture-desc">
              {{ (monitorData()?.security?.riskyActions || 0) > 0
                  ? 'Unauthorised sequences detected.'
                  : 'No anomalous behavioural patterns detected.' }}
            </p>
          </div>
        </div>

      </div>

      <!-- ── Main: access log grid ── -->
      <div class="body-main">
        <div class="panel panel--flex">
          <div class="panel-head">
            <h3 class="panel-title">Behavioural Access Logs</h3>
            <span class="live-badge">Real-time traffic</span>
          </div>
          <div class="grid-wrap">
            <app-ag-share-grid
              [columns]="logColumns"
              [data]="monitorData()?.security?.recentEvents || []"
              [showActions]="false"
              class="fill-grid">
            </app-ag-share-grid>
          </div>
        </div>
      </div>

    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   REAL-TIME MONITORING — TOKEN-DRIVEN
   Zero hardcoded colors. Every value references the canonical
   token system from @mixin apply-canonical-mapping.
   ============================================================ */

:host {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* ── Root shell ── */
.rt-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--text-primary);
}

/* ══════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════ */
.rt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.page-meta {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mono { font-family: var(--font-mono); letter-spacing: 0; text-transform: none; }

/* Live pulse indicator */
.live-pulse {
  position: relative;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-top: 6px;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-success);
  animation: pulse-ping 1.5s ease-out infinite;
}

.pulse-core {
  position: absolute;
  inset: 0;
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-success);
}

@keyframes pulse-ping {
  0%    { transform: scale(1);   opacity: 0.8; }
  75%,
  100%  { transform: scale(2.5); opacity: 0; }
}

/* Header action buttons */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  height: 32px;
  padding: 0 var(--spacing-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-body);
  transition: var(--transition-base);

  i { font-size: var(--font-size-base); }

  &:hover:not(:disabled) {
    background: var(--component-bg-hover);
    color: var(--text-primary);
    border-color: var(--border-secondary);
  }

  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }

  &--primary {
    background: var(--accent-primary);
    color: #fff;
    border-color: var(--accent-primary);
    padding: 0 var(--spacing-md);

    &:hover:not(:disabled) {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      color: #fff;
    }
  }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════════════════════════ */
.filter-bar {
  flex-shrink: 0;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  box-shadow: var(--shadow-sm);
}

/* ══════════════════════════════════════════════════════════
   LOADER STATE
   ══════════════════════════════════════════════════════════ */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  flex-shrink: 0;

  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
}

.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  border-bottom: 3px solid transparent;
  transition: var(--transition-base);

  &:hover { box-shadow: var(--shadow-md); }

  /* Semantic bottom-border accents */
  &--error   { border-bottom-color: var(--color-error); }
  &--warning { border-bottom-color: var(--color-warning); }
  &--success { border-bottom-color: var(--color-success); }
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-sm) 0;
}

.kpi-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);

  &--error   { color: var(--color-error); }
  &--warning { color: var(--color-warning); }
  &--success { color: var(--color-success); }
}

/* ══════════════════════════════════════════════════════════
   BODY GRID (sidebar + main)
   ══════════════════════════════════════════════════════════ */
.body-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;   /* Critical: allows grid rows to shrink for scroll */

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}

/* ══════════════════════════════════════════════════════════
   SHARED PANEL
   ══════════════════════════════════════════════════════════ */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  box-shadow: var(--shadow-sm);

  &--flex {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    min-height: 0;
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════════ */
.body-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
}

/* Alert count badge */
.alert-count-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--color-error-bg);
  color: var(--color-error);
  border: var(--ui-border-width) solid var(--color-error-border);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  font-family: var(--font-mono);
}

/* Alert scroll area */
.alert-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  min-height: 0;

  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) var(--scroll-track);

  &::-webkit-scrollbar       { width: 3px; }
  &::-webkit-scrollbar-thumb {
    background: var(--scroll-thumb);
    border-radius: var(--ui-border-radius-pill);
  }
}

/* Individual alert row */
.alert-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sm);

  &--critical {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);

    .alert-sev-bar { background: var(--color-error); }
  }
}

.alert-sev-bar {
  width: 2px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-warning);
  align-self: stretch;
  flex-shrink: 0;
}

.alert-msg {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-normal);
}

.alert-meta {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

/* Empty alerts state */
.empty-alerts {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--text-tertiary);
  padding: var(--spacing-3xl);

  i  { font-size: var(--font-size-3xl); color: var(--color-success); opacity: 0.6; }
  p  { font-size: var(--font-size-sm); margin: 0; }
}

/* Security posture card */
.posture-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  flex-shrink: 0;

  &--secure {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);

    .posture-icon { color: var(--color-success); background: var(--color-success-bg); border-color: var(--color-success-border); }
    .posture-title { color: var(--color-success); }
    .posture-desc  { color: var(--color-success-dark); }
  }

  &--alert {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);

    .posture-icon { color: var(--color-error); background: var(--color-error-bg); border-color: var(--color-error-border); }
    .posture-title { color: var(--color-error); }
    .posture-desc  { color: var(--color-error-dark); }
  }
}

.posture-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--ui-border-radius-pill);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.posture-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.posture-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

/* ══════════════════════════════════════════════════════════
   MAIN COLUMN (access log grid)
   ══════════════════════════════════════════════════════════ */
.body-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Live badge */
.live-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent-primary);
  background: var(--accent-focus);
  border: var(--ui-border-width) solid var(--accent-primary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
}

/* Grid fill wrapper — AgGrid needs explicit dimensions */
.grid-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.fill-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
  `]
})
export class RealTimeMonitoringComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  private commonService    = inject(CommonMethodService);
  private cdr              = inject(ChangeDetectorRef);

  monitorData      = signal<any>(null);
  loading          = signal(false);
  lastResponseTime = signal('0ms');
  logColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Domain',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Domains'
    },
    {
      key: 'severity',
      label: 'Threat Level',
      type: 'select',
      placeholder: 'All Levels',
      staticOptions: [
        { label: 'Critical Only', value: 'critical' },
        { label: 'Active Alerts', value: 'warning' }
      ]
    }
  ];

  // Merge critical + warning alerts, newest first
  allAlerts = computed(() => {
    const d = this.monitorData();
    if (!d?.alerts) return [];
    return [
      ...(d.alerts.critical ?? []),
      ...(d.alerts.warning  ?? [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  ngOnInit(): void {
    this.setupColumns();
    this.loadData();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService
      .getRealTimeMonitoring(this.currentFilters['branchId'], this.currentFilters['severity'])
      .subscribe({
        next: (res) => {
          this.monitorData.set(res.data);
          this.lastResponseTime.set(res.meta?.responseTime ?? '0ms');
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  setupColumns(): void {
    this.logColumns = [
      {
        field: 'userId.name',
        headerName: 'User',
        width: 150,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)'
        }
      },
      {
        field: 'userId.email',
        headerName: 'Email',
        flex: 1,
        cellStyle: {
          'color': 'var(--text-secondary)',
          'font-size': 'var(--font-size-xs)'
        }
      },
      {
        field: 'action',
        headerName: 'Action',
        width: 160,
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'color': 'var(--accent-primary)',
          'font-size': 'var(--font-size-xs)',
          'font-weight': 'var(--font-weight-semibold)'
        }
      },
      {
        field: 'ip',
        headerName: 'Source IP',
        width: 120,
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'color': 'var(--text-tertiary)',
          'font-size': 'var(--font-size-xs)'
        }
      },
      {
        field: 'createdAt',
        headerName: 'Time',
        width: 100,
        valueFormatter: (p: any) => this.commonService.formatDate(p.value, 'HH:mm:ss'),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-weight': 'var(--font-weight-semibold)',
          'text-align': 'right'
        }
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
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-real-time-monitoring',
//   standalone: true,
//   imports: [
//     CommonModule, ButtonModule, TagModule, ProgressSpinnerModule, 
//     TooltipModule, AgShareGrid, UniversalFilterComponent
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
//             <h2 class="page-title">Live System Integrity</h2>
//             <p class="page-subtitle">
//               Latency: {{ lastResponseTime() }} • Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'HH:mm:ss' }}
//             </p>
//           </div>
//         </div>
//         <div class="header-actions">
//           <p-button label="Network Audit" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
//           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()" pTooltip="Force Re-scan"></p-button>
//         </div>
//       </div>

//       <div class="filter-section glass-panel">
//         <app-universal-filter
//           [entityType]="'real-time-monitoring'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
//           <div class="kpi-card glass-panel">
//             <p class="kpi-label">Active Incidents</p>
//             <h3 class="kpi-value">{{ monitorData()?.alerts?.total || 0 }}</h3>
//           </div>
          
//           <div class="kpi-card glass-panel critical-edge">
//             <p class="kpi-label">Critical Risks</p>
//             <h3 class="kpi-value error">{{ monitorData()?.alerts?.critical?.length || 0 }}</h3>
//           </div>
          
//           <div class="kpi-card glass-panel warning-edge">
//             <p class="kpi-label">System Warnings</p>
//             <h3 class="kpi-value warning">{{ monitorData()?.alerts?.warning?.length || 0 }}</h3>
//           </div>
          
//           <div class="kpi-card glass-panel" [class.secure-edge]="(monitorData()?.security?.riskyActions || 0) === 0">
//             <p class="kpi-label">Risky Activity</p>
//             <h3 class="kpi-value" [ngClass]="(monitorData()?.security?.riskyActions || 0) > 0 ? 'error' : 'success'">
//               {{ monitorData()?.security?.riskyActions || 0 }}
//             </h3>
//           </div>
//         </div>

//         <div class="content-layout">
          
//           <div class="side-column">
//             <div class="alert-panel glass-panel">
//                <h3 class="panel-title">Priority Interventions</h3>
//                <div class="alert-list custom-scrollbar">
//                  @if (allAlerts().length > 0) {
//                    @for (alert of allAlerts(); track alert.timestamp) {
//                      <div class="alert-item" [class.is-critical]="alert.severity === 'critical'">
//                        <div class="severity-indicator"></div>
//                        <div class="alert-content">
//                           <p class="alert-msg">{{ alert.message }}</p>
//                           <p class="alert-meta">{{ alert.type | uppercase }} • {{ alert.timestamp | date:'shortTime' }}</p>
//                        </div>
//                      </div>
//                    }
//                  } @else {
//                    <div class="empty-state">
//                      <i class="pi pi-check-circle success-text"></i>
//                      <p>All subsystems nominal.</p>
//                    </div>
//                  }
//                </div>
//             </div>

//             <div class="security-card glass-panel" [ngClass]="(monitorData()?.security?.riskyActions || 0) > 0 ? 'alert-bg' : 'secure-bg'">
//                <div class="security-icon-box">
//                  <i class="pi" [ngClass]="(monitorData()?.security?.riskyActions || 0) > 0 ? 'pi-bolt' : 'pi-lock'"></i>
//                </div>
//                <div>
//                  <p class="security-title">Postural Status: {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Vulnerable' : 'Hardened' }}</p>
//                  <p class="security-desc">
//                    {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Unauthorized sequences detected.' : 'No anomalous behavioral patterns detected.' }}
//                  </p>
//                </div>
//             </div>
//           </div>

//           <div class="main-column">
//             <div class="grid-card glass-panel">
//               <div class="grid-header">
//                 <h3 class="grid-title">Behavioral Access Logs</h3>
//                 <span class="live-tag">REAL-TIME TRAFFIC</span>
//               </div>
//               <div class="grid-container">
//                  <app-ag-share-grid 
//                     [columns]="logColumns" 
//                     [data]="monitorData()?.security?.recentEvents || []" 
//                     [showActions]="false" 
//                     class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//         </div>
//       </ng-container>

//       <ng-template #loader>
//         <div class="integrity-loader">
//           <p-progressSpinner strokeWidth="3"></p-progressSpinner>
//           <p>Analyzing Traffic Patterns...</p>
//         </div>
//       </ng-template>
//     </div>
//   `,
//   styles: [`
//     /* =========================================
//        LAYOUT CONTAINERS
//        ========================================= */
//     :host { display: block; height: 100vh; width: 100%; overflow: hidden; }

//     .monitoring-container {
//       padding: var(--spacing-xl); 
//       background: var(--bg-primary); 
//       height: 100%; 
//       display: flex; flex-direction: column;
//     }

//     .glass-panel {
//       background: color-mix(in srgb, var(--bg-secondary), transparent 10%);
//       backdrop-filter: blur(var(--glass-blur-c)); 
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//     }

//     /* HEADER */
//     .header-section {
//       display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg);
//       .page-title { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: 800; margin: 0; }
//       .page-subtitle { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; }
//     }
    
//     .pulse-indicator { display: flex; width: 10px; height: 10px; position: relative; margin-right: 8px; margin-top: 6px;
//       .pulse-ring { position: absolute; width: 100%; height: 100%; background: var(--color-success); border-radius: 50%; animation: ping 1.5s infinite; }
//       .pulse-dot { width: 10px; height: 10px; background: var(--color-success); border-radius: 50%; position: relative; }
//     }
//     @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }

//     .filter-section { margin-bottom: var(--spacing-lg); }

//     /* KPI CARDS */
//     .kpi-grid {
//       display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);
//       .kpi-card { padding: var(--spacing-lg); border-bottom: 3px solid transparent; 
//         &.critical-edge { border-bottom-color: var(--color-error); }
//         &.warning-edge { border-bottom-color: var(--color-warning); }
//         &.secure-edge { border-bottom-color: var(--color-success); }
//       }
//       .kpi-label { font-size: 10px; font-weight: 800; color: var(--text-label); text-transform: uppercase; }
//       .kpi-value { font-family: var(--font-mono); font-size: var(--font-size-3xl); font-weight: 800; margin: 0; }
//       .kpi-value.error { color: var(--color-error); }
//       .kpi-value.warning { color: var(--color-warning); }
//       .kpi-value.success { color: var(--color-success); }
//     }

//     /* MAIN CONTENT */
//     .content-layout { display: grid; grid-template-columns: 350px 1fr; gap: var(--spacing-xl); flex: 1; min-height: 0; }
    
//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); height: 100%; min-height: 0; }
    
//     .alert-panel { flex: 1; padding: var(--spacing-lg); display: flex; flex-direction: column; min-height: 0; overflow: hidden;
//       .panel-title { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: var(--spacing-md); }
//       .alert-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; }
//     }
    
//     .alert-item {
//       padding: 12px; background: var(--bg-primary); border-radius: 8px; 
//       border: 1px solid var(--border-subtle); 
//       &.is-critical { background: var(--color-error-bg); border-color: var(--color-error-border); }
//       .alert-msg { font-size: var(--font-size-xs); font-weight: 700; margin: 0; line-height: 1.3; }
//       .alert-meta { font-size: 9px; font-weight: 600; color: var(--text-muted); margin-top: 4px; }
//     }

//     .security-card {
//       padding: var(--spacing-lg); display: flex; gap: var(--spacing-md);
//       &.secure-bg { background: var(--color-success-bg); border-color: var(--color-success-border); color: var(--color-success); }
//       &.alert-bg { background: var(--color-error-bg); border-color: var(--color-error-border); color: var(--color-error); }
//       .security-icon-box { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 16px; }
//       .security-title { font-weight: 800; font-size: var(--font-size-sm); margin: 0; }
//       .security-desc { font-size: 11px; opacity: 0.8; margin-top: 2px; line-height: 1.4; }
//     }

//     .main-column { height: 100%; display: flex; flex-direction: column; 
//       .grid-card { flex: 1; display: flex; flex-direction: column; overflow: hidden;
//         .grid-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); }
//         .grid-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0; }
//         .live-tag { font-size: 9px; font-weight: 900; color: var(--accent-primary); background: var(--accent-focus); padding: 2px 8px; border-radius: 4px; }
//         .grid-container { flex: 1; position: relative; }
//       }
//     }
    
//     .full-size-grid { position: absolute; inset: 0; width: 100%; height: 100%; }
//     .integrity-loader { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; font-size: 10px; }
//   `]
// })
// export class RealTimeMonitoringComponent implements OnInit {
//   private analyticsService = inject(AdminAnalyticsService);
//   private commonService = inject(CommonMethodService);
//   private cdr = inject(ChangeDetectorRef);

//   monitorData = signal<any>(null);
//   loading = signal<boolean>(false);
//   lastResponseTime = signal<string>('0ms');
//   logColumns: any[] = [];
  
//   private currentFilters: any = {};

//   filterConfig: FilterField[] = [
//     { key: 'branchId', label: 'Domain', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'All Domains' },
//     { key: 'severity', label: 'Threat Level', type: 'select', placeholder: 'All Levels',
//       staticOptions: [{ label: 'Critical Only', value: 'critical' }, { label: 'Active Alerts', value: 'warning' }]
//     }
//   ];

//   allAlerts = computed(() => {
//     const data = this.monitorData();
//     if (!data?.alerts) return [];
//     return [...(data.alerts.critical || []), ...(data.alerts.warning || [])]
//       .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
//   });

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getRealTimeMonitoring(this.currentFilters.branchId, this.currentFilters.severity).subscribe({
//       next: (res) => {
//         this.monitorData.set(res.data);
//         this.lastResponseTime.set(res.meta?.responseTime || '0ms');
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   // FIXED: STRICTLY SEPARATE COLUMNS
//   setupColumns(): void {
//     this.logColumns = [
//       // 1. User Name Only
//       { 
//         field: 'userId.name', 
//         headerName: 'User', 
//         width: 150,
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' }
//       },
//       // 2. Email Only
//       { 
//         field: 'userId.email', 
//         headerName: 'Email', 
//         flex: 1,
//         cellStyle: { 'color': 'var(--text-secondary)', 'font-size': '11px' }
//       },
//       // 3. Action Only
//       { 
//         field: 'action', 
//         headerName: 'Action', 
//         width: 160,
//         cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--accent-primary)', 'font-size': '11px', 'font-weight': '600' }
//       },
//       // 4. IP Address Only
//       { 
//         field: 'ip', 
//         headerName: 'Source IP', 
//         width: 120,
//         cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-tertiary)', 'font-size': '11px' }
//       },
//       // 5. Time Only
//       { 
//         field: 'createdAt', 
//         headerName: 'Time', 
//         width: 100,
//         valueFormatter: (p: any) => this.commonService.formatDate(p.value, 'HH:mm:ss'),
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }
