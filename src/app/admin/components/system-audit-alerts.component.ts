import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-system-audit-alerts',
  standalone: true,
  imports: [
    CommonModule, TagModule, TooltipModule, ProgressSpinnerModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="audit-root">

  <!-- ══════════════════════════════════════
       HEADER
  ═══════════════════════════════════════ -->
  <div class="audit-header">
    <div class="header-left">
      <div class="header-icon-wrap">
        <i class="pi pi-shield"></i>
      </div>
      <div>
        <h2 class="page-title">System Integrity &amp; Audit Log</h2>
        <p class="page-sub">
          Live monitoring of {{ securityData()?.recentEvents?.length || 0 }} administrative events
        </p>
      </div>
    </div>

    <div class="header-right">
      <!-- Threat level badge -->
      <div class="threat-badge"
           [class.threat-badge--secure]="(securityData()?.riskyActions || 0) === 0"
           [class.threat-badge--risk]="(securityData()?.riskyActions || 0) > 0">
        <i class="pi"
           [class.pi-check-circle]="(securityData()?.riskyActions || 0) === 0"
           [class.pi-exclamation-triangle]="(securityData()?.riskyActions || 0) > 0">
        </i>
        <div class="badge-text">
          <span class="badge-label">Threat Level</span>
          <span class="badge-value">
            {{ (securityData()?.riskyActions || 0) > 0
                ? (securityData()?.riskyActions + ' Risky Actions')
                : 'System Secure' }}
          </span>
        </div>
      </div>

      <button class="refresh-btn" (click)="refreshAll()" [disabled]="loading()" pTooltip="Refresh" tooltipPosition="bottom">
        <i class="pi pi-refresh" [class.spinning]="loading()"></i>
      </button>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       FILTER BAR
  ═══════════════════════════════════════ -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="system-audit"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- ══════════════════════════════════════
       LOADING
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" styleClass="w-10 h-10"></p-progressSpinner>
      <span class="loader-text">Auditing security protocols…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       GRID
  ═══════════════════════════════════════ -->
  @if (!loading()) {
    <div class="grid-panel">

      <div class="grid-panel-head">
        <div class="head-left">
          <h3 class="grid-title">Access Log Stream</h3>
          <span class="live-badge">Live monitoring</span>
        </div>
        @if (meta()) {
          <span class="meta-time">
            Response: <span class="mono">{{ meta()?.responseTime }}</span>
          </span>
        }
      </div>

      <div class="grid-body">
        <app-ag-share-grid
          [columns]="auditColumns"
          [data]="securityData()?.recentEvents || []"
          [showActions]="false"
          class="fill-grid">
        </app-ag-share-grid>
      </div>

    </div>
  }

</div>
  `,
  styles: [`
/* ============================================================
   SYSTEM AUDIT ALERTS — TOKEN-DRIVEN
   The only intentional non-token value is the pulse-border
   keyframe rgba(239,68,68,…) — Chart.js / CSS animations
   cannot consume CSS custom properties in rgba() stops on
   all browsers. Everything else is fully tokenised.
   ============================================================ */

:host { display: block; width: 100%; height: 100%; }

.audit-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ══════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════ */
.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.header-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius-sm);
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  margin-top: 2px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);
}

.page-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

/* Threat badge */
.threat-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--ui-border-radius);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  transition: var(--transition-base);
  font-size: var(--font-size-base);

  &--secure {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
    color: var(--color-success);
  }

  &--risk {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);
    color: var(--color-error);
    // Pulse animation uses a fixed rgba because CSS variables
    // cannot be interpolated inside keyframe rgba() stops.
    animation: risk-pulse 2s ease-in-out infinite;
  }
}

.badge-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.badge-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
}

.badge-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: inherit;
}

@keyframes risk-pulse {
  0%   { box-shadow: 0 0 0 0   rgba(239, 68, 68, 0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);   }
  100% { box-shadow: 0 0 0 0   rgba(239, 68, 68, 0);   }
}

/* Refresh button */
.refresh-btn {
  width: 32px;
  height: 32px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  transition: var(--transition-base);

  &:hover:not(:disabled) {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--border-secondary);
  }

  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════════════════════════ */
.filter-bar {
  flex-shrink: 0;
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
  padding: var(--spacing-5xl);
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   GRID PANEL
   ══════════════════════════════════════════════════════════ */
.grid-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.grid-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.head-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.grid-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

.live-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-success);
  background: var(--color-success-bg);
  border: var(--ui-border-width) solid var(--color-success-border);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
}

.meta-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.mono { font-family: var(--font-mono); }

/* Grid body — AgGrid needs a positioned container */
.grid-body {
  flex: 1;
  position: relative;
  background: var(--bg-primary);
  min-height: 0;
}

.fill-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
  `]
})
export class SystemAuditAlertsComponent implements OnInit {
  securityData = signal<any>(null);
  meta         = signal<any>(null);
  loading      = signal(false);
  auditColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Scope',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    {
      key: 'actionType',
      label: 'Action Type',
      type: 'select',
      placeholder: 'All Actions',
      staticOptions: [
        { label: 'Reads',  value: 'read'  },
        { label: 'Writes', value: 'write' }
      ]
    },
    { key: 'date', label: 'Audit Period', type: 'date-range' }
  ];

  private analyticsService = inject(AdminAnalyticsService);
  public  commonService    = inject(CommonMethodService);
  private cdr              = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.setupColumns();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.refreshAll();
  }

  refreshAll(): void {
    this.loading.set(true);
    this.analyticsService.getSecurityAuditLog(
      this.currentFilters['date']?.[0]?.toISOString(),
      this.currentFilters['date']?.[1]?.toISOString(),
      this.currentFilters['branchId']
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.securityData.set(res.data);
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.auditColumns = [
      {
        field: 'userId.name',
        headerName: 'User Name',
        width: 140,
        filter: true,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)'
        }
      },
      {
        field: 'userId.email',
        headerName: 'Email Address',
        width: 200,
        cellStyle: {
          'color': 'var(--text-secondary)',
          'font-size': 'var(--font-size-xs)'
        }
      },
      {
        headerName: 'Method',
        width: 100,
        valueGetter: (p: any) => (p.data?.action?.split(':')[0] ?? 'SYSTEM').toUpperCase(),
        cellRenderer: (p: any) => {
          const isRead = p.value === 'READ';
          const bg     = isRead ? 'var(--accent-focus)'    : 'var(--bg-ternary)';
          const color  = isRead ? 'var(--accent-primary)'  : 'var(--color-warning)';
          const border = isRead ? 'var(--accent-primary)'  : 'var(--border-secondary)';
          return `<span style="background:${bg};color:${color};border:1px solid ${border};padding:2px 8px;border-radius:var(--ui-border-radius-sm);font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);">${p.value}</span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      {
        headerName: 'Resource',
        width: 160,
        valueGetter: (p: any) => {
          const raw = p.data?.action ?? '';
          return raw.split(':')[1] ?? raw;
        },
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)',
          'text-transform': 'capitalize'
        }
      },
      {
        field: 'ip',
        headerName: 'IP Address',
        width: 120,
        valueFormatter: (p: any) => p.value === '::1' ? '127.0.0.1' : p.value,
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'color': 'var(--text-secondary)',
          'font-size': 'var(--font-size-xs)'
        }
      },
      {
        headerName: 'OS',
        width: 110,
        valueGetter: (p: any) => {
          const ua = p.data?.userAgent ?? '';
          if (ua.includes('Windows')) return 'Windows';
          if (ua.includes('Mac'))     return 'MacOS';
          if (ua.includes('Linux'))   return 'Linux';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
          return 'Other';
        },
        cellRenderer: (p: any) => {
          const isMobile = p.value === 'Android' || p.value === 'iOS';
          const icon = isMobile ? 'pi-mobile' : 'pi-desktop';
          return `<i class="pi ${icon}" style="font-size:var(--font-size-xs);margin-right:6px;color:var(--text-tertiary);"></i>${p.value}`;
        },
        cellStyle: { 'color': 'var(--text-secondary)', 'display': 'flex', 'align-items': 'center' }
      },
      {
        headerName: 'Browser',
        width: 110,
        valueGetter: (p: any) => {
          const ua = p.data?.userAgent ?? '';
          if (ua.includes('Edg'))     return 'Edge';
          if (ua.includes('Chrome'))  return 'Chrome';
          if (ua.includes('Firefox')) return 'Firefox';
          if (ua.includes('Safari'))  return 'Safari';
          return 'Other';
        },
        cellStyle: {
          'color': 'var(--text-tertiary)',
          'font-size': 'var(--font-size-xs)'
        }
      },
      {
        field: 'createdAt',
        headerName: 'Time',
        width: 110,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatDate(p.value, 'HH:mm:ss'),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-weight': 'var(--font-weight-semibold)',
          'text-align': 'right',
          'color': 'var(--text-primary)'
        }
      }
    ];
    this.cdr.detectChanges();
  }
}
// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { forkJoin } from 'rxjs';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-system-audit-alerts',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TagModule, 
//     TooltipModule, 
//     ProgressSpinnerModule,
//     AgShareGrid,
//     UniversalFilterComponent
//   ],
//   template: `
//     <div class="audit-container">

//       <div class="header-section">
//         <div>
//           <h2 class="page-title">
//             <i class="pi pi-shield header-icon"></i>
//             System Integrity & Audit Log
//           </h2>
//           <p class="page-subtitle">
//             Live monitoring of {{ securityData()?.recentEvents?.length || 0 }} administrative events
//           </p>
//         </div>
        
//         <div class="header-actions">
//           <div class="status-badge" 
//                [class.secure]="(securityData()?.riskyActions || 0) === 0" 
//                [class.risk]="(securityData()?.riskyActions || 0) > 0">
//             <i class="pi" [ngClass]="(securityData()?.riskyActions || 0) === 0 ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
//             <div class="badge-content">
//               <span class="status-label">Threat Level</span>
//               <span class="status-value">
//                 {{ (securityData()?.riskyActions || 0) > 0 ? (securityData()?.riskyActions + ' Risky Actions') : 'System Secure' }}
//               </span>
//             </div>
//           </div>
          
//           <p-button icon="pi pi-refresh" severity="secondary" [outlined]="true" size="small" (onClick)="refreshAll()"></p-button>
//         </div>
//       </div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'system-audit'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid-card">
//           <div class="grid-header">
//             <div class="header-left">
//               <h3 class="grid-title">Access Log Stream</h3>
//               <span class="grid-tag success">LIVE MONITORING</span>
//             </div>
//             <div class="header-right">
//                <span class="meta-info" *ngIf="meta()">Response: {{ meta()?.responseTime }}</span>
//             </div>
//           </div>

//           <div class="grid-container">
//              <app-ag-share-grid 
//                [columns]="auditColumns" 
//                [data]="securityData()?.recentEvents || []" 
//                [showActions]="false" 
//                class="full-size-grid">
//              </app-ag-share-grid>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Auditing Security Protocols...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; height: 100%; }

//     .audit-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100vh;
//       display: flex; flex-direction: column;
//     }

//     /* HEADER */
//     .header-section {
//       display: flex; justify-content: space-between; align-items: center;
//       margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-md);
//     }

//     .page-title {
//       font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary);
//       display: flex; align-items: center; gap: var(--spacing-sm); margin: 0 0 4px 0;
//     }
//     .header-icon { color: var(--accent-primary); }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; font-weight: 500; }

//     .header-actions { display: flex; align-items: center; gap: var(--spacing-md); }

//     /* SECURITY BADGE */
//     .status-badge {
//       padding: 6px 16px; border-radius: var(--ui-border-radius-lg);
//       display: flex; align-items: center; gap: 12px;
//       background: var(--bg-secondary); border: 1px solid var(--border-primary);
//       transition: all 0.3s ease;
//     }
//     .status-badge.secure { border-color: var(--color-success); background: var(--color-success-bg); color: var(--color-success-dark); }
//     .status-badge.risk { border-color: var(--color-error); background: var(--color-error-bg); color: var(--color-error); animation: pulse-border 2s infinite; }
    
//     .badge-content { display: flex; flex-direction: column; line-height: 1.1; }
//     .status-label { font-size: 9px; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
//     .status-value { font-size: 13px; font-weight: 800; }

//     @keyframes pulse-border { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

//     .filter-section { margin-bottom: var(--spacing-lg); }

//     /* GRID CARD */
//     .grid-card {
//       background: var(--bg-secondary); border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl); overflow: hidden;
//       flex: 1; display: flex; flex-direction: column; min-height: 500px;
//       box-shadow: var(--shadow-sm);
//     }

//     .grid-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-primary);
//       display: flex; justify-content: space-between; align-items: center;
//     }
    
//     .header-left { display: flex; align-items: center; gap: 12px; }
//     .grid-title { font-size: var(--font-size-md); font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: 0.5px; text-transform: uppercase; }
    
//     .grid-tag { 
//       font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;
//       &.success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); } 
//     }

//     .meta-info { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); }

//     .grid-container { flex: 1; position: relative; background: var(--bg-primary); }
//     .full-size-grid { position: absolute; inset: 0; width: 100%; height: 100%; }

//     /* LOADER */
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//     .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
//   `]
// })
// export class SystemAuditAlertsComponent implements OnInit {
//   alertsData = signal<any>(null); // Kept for future extension
//   securityData = signal<any>(null);
//   meta = signal<any>(null);
//   loading = signal<boolean>(false);
//   auditColumns: any[] = [];

//   private currentFilters: any = {};

//   filterConfig: FilterField[] = [
//     { key: 'branchId', label: 'Branch Scope', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'All Branches' },
//     { key: 'actionType', label: 'Action Type', type: 'select', placeholder: 'All Actions', staticOptions: [{label: 'Reads', value: 'read'}, {label: 'Writes', value: 'write'}] },
//     { key: 'date', label: 'Audit Period', type: 'date-range' }
//   ];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     // loadData calls triggered via filter init or manual
//   }

//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.refreshAll();
//   }

// setupColumns(): void {
//     this.auditColumns = [
//       // 1. USER NAME
//       {
//         field: 'userId.name',
//         headerName: 'User Name',
//         width: 140,
//         filter: true,
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' }
//       },

//       // 2. EMAIL
//       {
//         field: 'userId.email',
//         headerName: 'Email Address',
//         width: 200,
//         cellStyle: { 'color': 'var(--text-secondary)', 'font-size': '12px' }
//       },

//       // 3. ACTION TYPE (e.g., READ, WRITE) - Derived
//       {
//         headerName: 'Method',
//         width: 100,
//         valueGetter: (params: any) => {
//           const raw = params.data?.action || '';
//           return (raw.split(':')[0] || 'system').toUpperCase();
//         },
//         cellRenderer: (params: any) => {
//           const val = params.value;
//           const isRead = val === 'READ';
//           // Inline styles for the badge look
//           const bg = isRead ? 'var(--accent-focus)' : 'var(--bg-ternary)';
//           const color = isRead ? 'var(--accent-primary)' : 'var(--color-warning)';
//           const border = isRead ? 'var(--accent-secondary)' : 'var(--border-secondary)';
          
//           return `<span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800;">${val}</span>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center' }
//       },

//       // 4. ACTION TARGET (e.g., TRANSACTIONS) - Derived
//       {
//         headerName: 'Resource',
//         width: 160,
//         valueGetter: (params: any) => {
//           const raw = params.data?.action || '';
//           return raw.split(':')[1] || raw;
//         },
//         cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)', 'text-transform': 'capitalize' }
//       },

//       // 5. IP ADDRESS
//       {
//         field: 'ip',
//         headerName: 'IP Address',
//         width: 120,
//         cellRenderer: (params: any) => {
//           const val = params.value === '::1' ? '127.0.0.1' : params.value;
//           return val;
//         },
//         cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'font-size': '11px' }
//       },

//       // 6. OPERATING SYSTEM - Derived from UserAgent
//       {
//         headerName: 'OS',
//         width: 110,
//         valueGetter: (params: any) => {
//           const ua = params.data?.userAgent || '';
//           if (ua.includes('Windows')) return 'Windows';
//           if (ua.includes('Mac')) return 'MacOS';
//           if (ua.includes('Linux')) return 'Linux';
//           if (ua.includes('Android')) return 'Android';
//           if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
//           return 'Other';
//         },
//         cellRenderer: (params: any) => {
//            let icon = 'pi-desktop';
//            if (params.value === 'Android' || params.value === 'iOS') icon = 'pi-mobile';
//            return `<i class="pi ${icon}" style="font-size: 10px; margin-right: 6px; color: var(--text-tertiary);"></i>${params.value}`;
//         },
//         cellStyle: { 'color': 'var(--text-secondary)' }
//       },

//       // 7. BROWSER - Derived from UserAgent
//       {
//         headerName: 'Browser',
//         width: 110,
//         valueGetter: (params: any) => {
//           const ua = params.data?.userAgent || '';
//           if (ua.includes('Edg')) return 'Edge';
//           if (ua.includes('Chrome')) return 'Chrome';
//           if (ua.includes('Firefox')) return 'Firefox';
//           if (ua.includes('Safari')) return 'Safari';
//           return 'Other';
//         },
//         cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': '12px' }
//       },

//       // 8. TIMESTAMP
//       {
//         field: 'createdAt',
//         headerName: 'Time',
//         width: 110,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'HH:mm:ss'),
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--text-primary)' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
//   refreshAll() {
//     this.loading.set(true);
    
//     // Using forkJoin if you still intend to fetch Inventory Alerts alongside this,
//     // otherwise just fetch the security logs directly.
//     // Based on your data snippet, we are simulating the security part here.
    
//     this.analyticsService.getSecurityAuditLog(
//       this.currentFilters.date?.[0]?.toISOString(), 
//       this.currentFilters.date?.[1]?.toISOString(), 
//       this.currentFilters.branchId
//     ).subscribe({
//       next: (res) => {
//         // Mapping the provided JSON structure
//         if (res.status === 'success') {
//           this.securityData.set(res.data); // data contains { recentEvents: [], riskyActions: 0 }
//           this.meta.set(res.meta);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
