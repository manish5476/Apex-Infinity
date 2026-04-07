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
  private commonService = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  monitorData = signal<any>(null);
  loading = signal(false);
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
      ...(d.alerts.warning ?? [])
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
