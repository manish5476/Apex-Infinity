import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-system-audit-alerts',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TagModule, 
    TooltipModule, 
    ProgressSpinnerModule,
    AgShareGrid,
    UniversalFilterComponent
  ],
  template: `
    <div class="audit-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">
            <i class="pi pi-shield header-icon"></i>
            System Integrity & Audit Log
          </h2>
          <p class="page-subtitle">
            Live monitoring of {{ securityData()?.recentEvents?.length || 0 }} administrative events
          </p>
        </div>
        
        <div class="header-actions">
          <div class="status-badge" 
               [class.secure]="(securityData()?.riskyActions || 0) === 0" 
               [class.risk]="(securityData()?.riskyActions || 0) > 0">
            <i class="pi" [ngClass]="(securityData()?.riskyActions || 0) === 0 ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
            <div class="badge-content">
              <span class="status-label">Threat Level</span>
              <span class="status-value">
                {{ (securityData()?.riskyActions || 0) > 0 ? (securityData()?.riskyActions + ' Risky Actions') : 'System Secure' }}
              </span>
            </div>
          </div>
          
          <p-button icon="pi pi-refresh" severity="secondary" [outlined]="true" size="small" (onClick)="refreshAll()"></p-button>
        </div>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'system-audit'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid-card">
          <div class="grid-header">
            <div class="header-left">
              <h3 class="grid-title">Access Log Stream</h3>
              <span class="grid-tag success">LIVE MONITORING</span>
            </div>
            <div class="header-right">
               <span class="meta-info" *ngIf="meta()">Response: {{ meta()?.responseTime }}</span>
            </div>
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

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Auditing Security Protocols...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }

    .audit-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100vh;
      display: flex; flex-direction: column;
    }

    /* HEADER */
    .header-section {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-md);
    }

    .page-title {
      font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary);
      display: flex; align-items: center; gap: var(--spacing-sm); margin: 0 0 4px 0;
    }
    .header-icon { color: var(--accent-primary); }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; font-weight: 500; }

    .header-actions { display: flex; align-items: center; gap: var(--spacing-md); }

    /* SECURITY BADGE */
    .status-badge {
      padding: 6px 16px; border-radius: var(--ui-border-radius-lg);
      display: flex; align-items: center; gap: 12px;
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      transition: all 0.3s ease;
    }
    .status-badge.secure { border-color: var(--color-success); background: var(--color-success-bg); color: var(--color-success-dark); }
    .status-badge.risk { border-color: var(--color-error); background: var(--color-error-bg); color: var(--color-error); animation: pulse-border 2s infinite; }
    
    .badge-content { display: flex; flex-direction: column; line-height: 1.1; }
    .status-label { font-size: 9px; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
    .status-value { font-size: 13px; font-weight: 800; }

    @keyframes pulse-border { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

    .filter-section { margin-bottom: var(--spacing-lg); }

    /* GRID CARD */
    .grid-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); overflow: hidden;
      flex: 1; display: flex; flex-direction: column; min-height: 500px;
      box-shadow: var(--shadow-sm);
    }

    .grid-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-primary);
      display: flex; justify-content: space-between; align-items: center;
    }
    
    .header-left { display: flex; align-items: center; gap: 12px; }
    .grid-title { font-size: var(--font-size-md); font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .grid-tag { 
      font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;
      &.success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); } 
    }

    .meta-info { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); }

    .grid-container { flex: 1; position: relative; background: var(--bg-primary); }
    .full-size-grid { position: absolute; inset: 0; width: 100%; height: 100%; }

    /* LOADER */
    .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
    .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  `]
})
export class SystemAuditAlertsComponent implements OnInit {
  alertsData = signal<any>(null); // Kept for future extension
  securityData = signal<any>(null);
  meta = signal<any>(null);
  loading = signal<boolean>(false);
  auditColumns: any[] = [];

  private currentFilters: any = {};

  filterConfig: FilterField[] = [
    { key: 'branchId', label: 'Branch Scope', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'All Branches' },
    { key: 'actionType', label: 'Action Type', type: 'select', placeholder: 'All Actions', staticOptions: [{label: 'Reads', value: 'read'}, {label: 'Writes', value: 'write'}] },
    { key: 'date', label: 'Audit Period', type: 'date-range' }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    // loadData calls triggered via filter init or manual
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.refreshAll();
  }

setupColumns(): void {
    this.auditColumns = [
      // 1. USER NAME
      {
        field: 'userId.name',
        headerName: 'User Name',
        width: 140,
        filter: true,
        cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' }
      },

      // 2. EMAIL
      {
        field: 'userId.email',
        headerName: 'Email Address',
        width: 200,
        cellStyle: { 'color': 'var(--text-secondary)', 'font-size': '12px' }
      },

      // 3. ACTION TYPE (e.g., READ, WRITE) - Derived
      {
        headerName: 'Method',
        width: 100,
        valueGetter: (params: any) => {
          const raw = params.data?.action || '';
          return (raw.split(':')[0] || 'system').toUpperCase();
        },
        cellRenderer: (params: any) => {
          const val = params.value;
          const isRead = val === 'READ';
          // Inline styles for the badge look
          const bg = isRead ? 'var(--accent-focus)' : 'var(--bg-ternary)';
          const color = isRead ? 'var(--accent-primary)' : 'var(--color-warning)';
          const border = isRead ? 'var(--accent-secondary)' : 'var(--border-secondary)';
          
          return `<span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800;">${val}</span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },

      // 4. ACTION TARGET (e.g., TRANSACTIONS) - Derived
      {
        headerName: 'Resource',
        width: 160,
        valueGetter: (params: any) => {
          const raw = params.data?.action || '';
          return raw.split(':')[1] || raw;
        },
        cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)', 'text-transform': 'capitalize' }
      },

      // 5. IP ADDRESS
      {
        field: 'ip',
        headerName: 'IP Address',
        width: 120,
        cellRenderer: (params: any) => {
          const val = params.value === '::1' ? '127.0.0.1' : params.value;
          return val;
        },
        cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)', 'font-size': '11px' }
      },

      // 6. OPERATING SYSTEM - Derived from UserAgent
      {
        headerName: 'OS',
        width: 110,
        valueGetter: (params: any) => {
          const ua = params.data?.userAgent || '';
          if (ua.includes('Windows')) return 'Windows';
          if (ua.includes('Mac')) return 'MacOS';
          if (ua.includes('Linux')) return 'Linux';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
          return 'Other';
        },
        cellRenderer: (params: any) => {
           let icon = 'pi-desktop';
           if (params.value === 'Android' || params.value === 'iOS') icon = 'pi-mobile';
           return `<i class="pi ${icon}" style="font-size: 10px; margin-right: 6px; color: var(--text-tertiary);"></i>${params.value}`;
        },
        cellStyle: { 'color': 'var(--text-secondary)' }
      },

      // 7. BROWSER - Derived from UserAgent
      {
        headerName: 'Browser',
        width: 110,
        valueGetter: (params: any) => {
          const ua = params.data?.userAgent || '';
          if (ua.includes('Edg')) return 'Edge';
          if (ua.includes('Chrome')) return 'Chrome';
          if (ua.includes('Firefox')) return 'Firefox';
          if (ua.includes('Safari')) return 'Safari';
          return 'Other';
        },
        cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': '12px' }
      },

      // 8. TIMESTAMP
      {
        field: 'createdAt',
        headerName: 'Time',
        width: 110,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'HH:mm:ss'),
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--text-primary)' }
      }
    ];
    this.cdr.detectChanges();
  }
  refreshAll() {
    this.loading.set(true);
    
    // Using forkJoin if you still intend to fetch Inventory Alerts alongside this,
    // otherwise just fetch the security logs directly.
    // Based on your data snippet, we are simulating the security part here.
    
    this.analyticsService.getSecurityAuditLog(
      this.currentFilters.date?.[0]?.toISOString(), 
      this.currentFilters.date?.[1]?.toISOString(), 
      this.currentFilters.branchId
    ).subscribe({
      next: (res) => {
        // Mapping the provided JSON structure
        if (res.status === 'success') {
          this.securityData.set(res.data); // data contains { recentEvents: [], riskyActions: 0 }
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="audit-container">

//       <div class="header-section">
//         <div>
//           <h2 class="page-title">
//             <i class="pi pi-shield header-icon"></i>
//             System Integrity & Alerts
//           </h2>
//           <p class="page-subtitle">
//             Monitoring administrative access and critical business bottlenecks
//           </p>
//         </div>
//         <div class="header-actions">
//           <div class="status-badge" [class.secure]="securityData()?.riskyActions === 0" [class.risk]="securityData()?.riskyActions > 0">
//             <span class="status-label">Security Status</span>
//             <span class="status-value">
//               {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
//             </span>
//           </div>
//           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
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
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card inventory-card">
//             <div class="card-header">
//               <span class="kpi-label">Inventory Health</span>
//               <i class="pi pi-box kpi-icon error"></i>
//             </div>
//             <div class="card-body">
//               <h2 class="kpi-value error">{{ alertsData()?.lowStockCount }}</h2>
//               <span class="kpi-sub">Low Stock Items</span>
//             </div>
//             <div class="priority-box error">
//                <span class="priority-label">Top Priority:</span>
//                <span class="priority-value">{{ alertsData()?.itemsToReorder[0] || 'None' }}</span>
//             </div>
//           </div>

//           <div class="kpi-card debt-card">
//             <div class="card-header">
//               <span class="kpi-label">Financial Exposure</span>
//               <i class="pi pi-exclamation-triangle kpi-icon warning"></i>
//             </div>
//             <div class="card-body">
//               <h2 class="kpi-value warning">{{ alertsData()?.highRiskDebtCount }}</h2>
//               <span class="kpi-sub">High Risk Debts</span>
//             </div>
//             <p class="action-text">Action: Immediate payment follow-up recommended.</p>
//           </div>

//           <div class="kpi-card audit-card">
//             <div>
//               <p class="audit-label">Audit Trail</p>
//               <h2 class="audit-value">{{ securityData()?.recentEvents?.length }} Events</h2>
//               <p class="audit-sub">Logged in selected period</p>
//             </div>
//             <div class="audit-actions">
//                <p-button label="Review Logs" [text]="true" size="small" styleClass="light-btn"></p-button>
//             </div>
//           </div>
//         </div>

//         <div class="content-grid">
          
//           <div class="main-column">
//             <div class="grid-card">
//               <div class="grid-header">
//                 <h3 class="grid-title">Administrative Access Log</h3>
//                 <span class="grid-tag">IP TRAFFIC: MONITORING</span>
//               </div>

//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="auditColumns" 
//                    [data]="securityData()?.recentEvents || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//           <div class="side-column">
            
//             <div class="side-card checklist-card">
//                <h4 class="side-title mb-sm">Re-order Checklist</h4>
//                <div class="checklist">
//                  @for (item of alertsData()?.itemsToReorder; track item) {
//                    <div class="check-item">
//                      <span class="item-name" [title]="item">{{ item }}</span>
//                      <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small" styleClass="icon-btn"></p-button>
//                    </div>
//                  }
//                  @if (!alertsData()?.itemsToReorder?.length) {
//                    <p class="empty-text">No immediate stock-outs detected.</p>
//                  }
//                </div>
//             </div>

//             <div class="side-card secure-card">
//                <div class="secure-icon-box">
//                   <i class="pi pi-check-circle secure-icon"></i>
//                </div>
//                <h4 class="secure-title">Environment Secure</h4>
//                <p class="secure-text">
//                  Zero unauthorized requests. Checked at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
//                </p>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Fetching Security Tokens...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }

//     .audit-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* HEADER */
//     .header-section {
//       display: flex;
//       flex-wrap: wrap;
//       justify-content: space-between;
//       align-items: center;
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-md);
//     }
    
//     .filter-section { margin-bottom: var(--spacing-lg); }

//     .page-title {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       margin: 0 0 4px 0;
//       letter-spacing: -0.01em;
//     }

//     .header-icon { color: var(--accent-primary); }

//     .page-subtitle {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//       margin: 0;
//     }

//     .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

//     .status-badge {
//       padding: 4px 12px;
//       border: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }
//     .status-badge.secure .status-value { color: var(--color-success); }
//     .status-badge.risk .status-value { color: var(--color-error); }

//     .status-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); }
//     .status-value { font-weight: bold; font-variant-numeric: tabular-nums; }

//     /* KPI GRID */
//     .kpi-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-lg);
//     }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//       display: flex;
//       flex-direction: column;
//     }
//     .kpi-card:hover { transform: translateY(-2px); border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

//     .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    
//     .kpi-label {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-label);
//     }

//     .kpi-icon { font-size: 1rem; }
//     .kpi-icon.error { color: var(--color-error); }
//     .kpi-icon.warning { color: var(--color-warning); }

//     .card-body { display: flex; align-items: baseline; gap: var(--spacing-sm); }

//     .kpi-value {
//       font-size: var(--font-size-2xl);
//       font-weight: bold;
//       font-family: var(--font-heading);
//       margin: 0;
//       line-height: 1;
//     }
//     .kpi-value.error { color: var(--color-error); }
//     .kpi-value.warning { color: var(--color-warning); }

//     .kpi-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); }

//     .priority-box {
//       margin-top: var(--spacing-sm);
//       padding: 4px 8px;
//       border-radius: 4px;
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       font-size: 10px;
//       font-weight: bold;
//     }
//     .priority-box.error { background: var(--color-error-bg); border: 1px solid var(--color-error-border); }
//     .priority-label { color: var(--color-error); text-transform: uppercase; }
//     .priority-value { color: var(--text-primary); max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

//     .action-text {
//       font-size: 10px;
//       color: var(--text-secondary);
//       opacity: 0.8;
//       margin-top: var(--spacing-sm);
//       line-height: 1.2;
//     }

//     /* AUDIT CARD (Gradient) */
//     .audit-card {
//       background: var(--accent-gradient);
//       border: none;
//       color: #ffffff;
//       justify-content: space-between;
//     }

//     .audit-label { font-size: var(--font-size-xs); font-weight: 900; text-transform: uppercase; opacity: 0.8; margin: 0 0 4px 0; }
//     .audit-value { font-size: var(--font-size-2xl); font-weight: bold; margin: 0; line-height: 1; }
//     .audit-sub { font-size: 10px; font-weight: bold; text-transform: uppercase; opacity: 0.9; font-style: italic; margin-top: 4px; }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .content-grid { grid-template-columns: 2fr 1fr; }
//     }

//     /* GRID CARD (Table) */
//     .grid-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       overflow: hidden;
//       height: 100%;
//       min-height: 350px;
//       display: flex;
//       flex-direction: column;
//     }

//     .grid-header {
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       flex-shrink: 0;
//     }

//     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
//     .grid-tag { font-size: 9px; font-family: var(--font-mono); color: var(--text-label); opacity: 0.8; }

//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* SIDE COLUMN */
//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-md); }

//     .side-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-md);
//     }

//     .side-title {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin: 0;
//     }
//     .mb-sm { margin-bottom: var(--spacing-sm); }

//     .checklist { display: flex; flex-direction: column; gap: var(--spacing-xs); }

//     .check-item {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-xs) var(--spacing-sm);
//       border-radius: var(--ui-border-radius);
//       border: 1px solid var(--border-secondary);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//     }
//     .check-item:hover { background: var(--component-bg-hover); }

//     .item-name {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-primary);
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       max-width: 150px;
//     }

//     .empty-text { text-align: center; padding: var(--spacing-sm); font-size: 10px; color: var(--text-tertiary); }

//     /* SECURE CARD */
//     .secure-card {
//       border: 1px dashed var(--color-success);
//       background: var(--color-success-bg);
//       text-align: center;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//     }

//     .secure-icon-box {
//       width: 2rem; height: 2rem;
//       border-radius: 50%;
//       background: rgba(16, 185, 129, 0.1);
//       color: var(--color-success);
//       display: flex; align-items: center; justify-content: center;
//       margin-bottom: var(--spacing-xs);
//     }
//     .secure-icon { font-size: 0.9rem; }

//     .secure-title { font-size: var(--font-size-sm); font-weight: bold; color: var(--text-primary); margin: 0 0 2px 0; }
//     .secure-text { font-size: 10px; color: var(--text-secondary); line-height: 1.4; margin: 0; }

//     /* LOADER */
//     .loader-container {
//       height: 60vh;
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
// export class SystemAuditAlertsComponent implements OnInit {
//   alertsData = signal<any>(null);
//   securityData = signal<any>(null);
//   loading = signal<boolean>(false);
//   auditColumns: any[] = [];

//   // Filter State
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
//       placeholder: 'Global System'
//     },
//     {
//       key: 'date',
//       label: 'Audit Period',
//       type: 'date-range'
//     }
//   ];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     // refreshAll triggered by filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.refreshAll();
//   }

//   setupColumns(): void {
//     this.auditColumns = [
//       {
//         field: 'userId.name',
//         headerName: 'Administrator',
//         sortable: true,
//         flex: 1.5,
//         minWidth: 200,
//         cellRenderer: (params: any) => {
//           const user = params.data?.userId || {};
//           const name = user.name || 'Unknown';
//           const email = user.email || '';
//           const initials = this.commonService.getInitials(name);

//           return `<div style="display: flex; align-items: center; gap: 10px; height: 100%;">
//                     <div style="width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; background: var(--accent-focus); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; border: 1px solid var(--accent-secondary);">
//                       ${initials}
//                     </div>
//                     <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.1;">
//                       <span style="font-weight: 700; color: var(--text-primary); font-size: 12px; margin-bottom: 2px;">${name}</span>
//                       <span style="font-size: 10px; color: var(--text-tertiary);">${email}</span>
//                     </div>
//                   </div>`;
//         }
//       },
//       {
//         field: 'action',
//         headerName: 'Action',
//         sortable: true,
//         flex: 1,
//         minWidth: 160,
//         cellRenderer: (params: any) => {
//           const fullAction = params.value || '';
//           const parts = fullAction.split(':');
//           const category = parts[0] ? parts[0].trim() : 'System'; 
//           const actionName = parts[1] ? parts[1].trim() : fullAction;

//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 4px;">
//                     <span style="width: fit-content; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); color: var(--accent-primary); text-transform: uppercase; line-height: 1;">
//                       ${category}
//                     </span>
//                     <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
//                       ${actionName}
//                     </span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'ip',
//         headerName: 'IP Address',
//         sortable: true,
//         width: 140,
//         cellRenderer: (params: any) => {
//           const ip = params.value === '::1' ? 'Localhost' : (params.value || 'Unknown');
//           return `<div style="display: flex; align-items: center; height: 100%;">
//                     <span style="font-family: var(--font-mono); font-size: 10px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-primary); color: var(--text-secondary); display: flex; gap: 6px; align-items: center; line-height: 1;">
//                       <i class="pi pi-globe" style="font-size: 9px; opacity: 0.6;"></i> ${ip}
//                     </span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'createdAt',
//         headerName: 'Time',
//         sortable: true,
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM, HH:mm'),
//         cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end', 'height': '100%', 'font-family': 'var(--font-mono)', 'font-size': '11px', 'color': 'var(--text-tertiary)' }
//       }
//     ];
//     this.cdr.detectChanges();
//   } 
 
//   refreshAll() {
//     this.loading.set(true);
    
//     // Filters applied
//     const branchId = this.currentFilters.branchId;
//     const startDate = this.currentFilters.startDate;
//     const endDate = this.currentFilters.endDate;

//     forkJoin({
//       alerts: this.analyticsService.getCriticalAlerts(branchId),
//       security: this.analyticsService.getSecurityAuditLog(startDate, endDate, branchId)
//     }).subscribe({
//       next: (results) => {
//         if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
//         if (results.security.status === 'success') this.securityData.set(results.security.data);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }

// // import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { forkJoin } from 'rxjs';
// // import { CommonMethodService } from '../../core/utils/common-method.service';
// // import { AdminAnalyticsService } from '../admin-analytics.service';
// // import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// // @Component({
// //   selector: 'app-system-audit-alerts',
// //   standalone: true,
// //   imports: [
// //     CommonModule, 
// //     ButtonModule, 
// //     TagModule, 
// //     TooltipModule, 
// //     ProgressSpinnerModule,
// //     AgShareGrid
// //   ],
// //   template: `
// //     <div class="audit-container">

// //       <div class="header-section">
// //         <div>
// //           <h2 class="page-title">
// //             <i class="pi pi-shield header-icon"></i>
// //             System Integrity & Alerts
// //           </h2>
// //           <p class="page-subtitle">
// //             Monitoring administrative access and critical business bottlenecks
// //           </p>
// //         </div>
// //         <div class="header-actions">
// //           <div class="status-badge" [class.secure]="securityData()?.riskyActions === 0" [class.risk]="securityData()?.riskyActions > 0">
// //             <span class="status-label">Security Status</span>
// //             <span class="status-value">
// //               {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
// //             </span>
// //           </div>
// //           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
// //         </div>
// //       </div>

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="kpi-grid">
          
// //           <div class="kpi-card inventory-card">
// //             <div class="card-header">
// //               <span class="kpi-label">Inventory Health</span>
// //               <i class="pi pi-box kpi-icon error"></i>
// //             </div>
// //             <div class="card-body">
// //               <h2 class="kpi-value error">{{ alertsData()?.lowStockCount }}</h2>
// //               <span class="kpi-sub">Low Stock Items</span>
// //             </div>
// //             <div class="priority-box error">
// //                <span class="priority-label">Top Priority:</span>
// //                <span class="priority-value">{{ alertsData()?.itemsToReorder[0] || 'None' }}</span>
// //             </div>
// //           </div>

// //           <div class="kpi-card debt-card">
// //             <div class="card-header">
// //               <span class="kpi-label">Financial Exposure</span>
// //               <i class="pi pi-exclamation-triangle kpi-icon warning"></i>
// //             </div>
// //             <div class="card-body">
// //               <h2 class="kpi-value warning">{{ alertsData()?.highRiskDebtCount }}</h2>
// //               <span class="kpi-sub">High Risk Debts</span>
// //             </div>
// //             <p class="action-text">Action: Immediate payment follow-up recommended.</p>
// //           </div>

// //           <div class="kpi-card audit-card">
// //             <div>
// //               <p class="audit-label">Audit Trail</p>
// //               <h2 class="audit-value">{{ securityData()?.recentEvents?.length }} Events</h2>
// //               <p class="audit-sub">Logged in last 72 hours</p>
// //             </div>
// //             <div class="audit-actions">
// //                <p-button label="Review Logs" [text]="true" size="small" styleClass="light-btn"></p-button>
// //             </div>
// //           </div>
// //         </div>

// //         <div class="content-grid">
          
// //           <div class="main-column">
// //             <div class="grid-card">
// //               <div class="grid-header">
// //                 <h3 class="grid-title">Administrative Access Log</h3>
// //                 <span class="grid-tag">IP TRAFFIC: MONITORING</span>
// //               </div>

// //               <div class="grid-container">
// //                  <app-ag-share-grid 
// //                    [columns]="auditColumns" 
// //                    [data]="securityData()?.recentEvents || []" 
// //                    [showActions]="false" 
// //                    class="full-size-grid">
// //                  </app-ag-share-grid>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="side-column">
            
// //             <div class="side-card checklist-card">
// //                <h4 class="side-title mb-sm">Re-order Checklist</h4>
// //                <div class="checklist">
// //                  @for (item of alertsData()?.itemsToReorder; track item) {
// //                    <div class="check-item">
// //                      <span class="item-name" [title]="item">{{ item }}</span>
// //                      <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small" styleClass="icon-btn"></p-button>
// //                    </div>
// //                  }
// //                  @if (!alertsData()?.itemsToReorder?.length) {
// //                    <p class="empty-text">No immediate stock-outs detected.</p>
// //                  }
// //                </div>
// //             </div>

// //             <div class="side-card secure-card">
// //               <div class="secure-icon-box">
// //                  <i class="pi pi-check-circle secure-icon"></i>
// //               </div>
// //               <h4 class="secure-title">Environment Secure</h4>
// //               <p class="secure-text">
// //                 Zero unauthorized requests. Checked at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
// //               </p>
// //             </div>
// //           </div>
// //         </div>

// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="loader-container">
// //           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
// //           <p class="loader-text">Fetching Security Tokens...</p>
// //         </div>
// //       </ng-template>

// //     </div>
// //   `,
// //   styles: [`
// //     /* HOST & LAYOUT */
// //     :host { display: block; width: 100%; }

// //     .audit-container {
// //       padding: var(--spacing-lg) var(--spacing-xl);
// //       background: var(--bg-primary);
// //       font-family: var(--font-body);
// //       min-height: 100%;
// //     }

// //     /* HEADER */
// //     .header-section {
// //       display: flex;
// //       flex-wrap: wrap;
// //       justify-content: space-between;
// //       align-items: center;
// //       gap: var(--spacing-md);
// //       margin-bottom: var(--spacing-xl);
// //     }

// //     .page-title {
// //       font-size: var(--font-size-2xl);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--text-primary);
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //       margin: 0 0 4px 0;
// //       letter-spacing: -0.01em;
// //     }

// //     .header-icon { color: var(--accent-primary); }

// //     .page-subtitle {
// //       font-size: var(--font-size-sm);
// //       color: var(--text-tertiary);
// //       margin: 0;
// //     }

// //     .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

// //     .status-badge {
// //       padding: 4px 12px;
// //       border: 1px solid var(--border-primary);
// //       background: var(--bg-secondary);
// //       border-radius: var(--ui-border-radius);
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //     }
// //     .status-badge.secure .status-value { color: var(--color-success); }
// //     .status-badge.risk .status-value { color: var(--color-error); }

// //     .status-label { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-label); }
// //     .status-value { font-weight: bold; font-variant-numeric: tabular-nums; }

// //     /* KPI GRID */
// //     .kpi-grid {
// //       display: grid;
// //       grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
// //       gap: var(--spacing-md);
// //       margin-bottom: var(--spacing-lg);
// //     }

// //     /* KPI CARDS */
// //     .kpi-card {
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-lg);
// //       transition: var(--transition-base);
// //       display: flex;
// //       flex-direction: column;
// //     }
// //     .kpi-card:hover { transform: translateY(-2px); border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

// //     .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs); }
    
// //     .kpi-label {
// //       font-size: var(--font-size-xs);
// //       font-weight: bold;
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //       color: var(--text-label);
// //     }

// //     .kpi-icon { font-size: 1rem; }
// //     .kpi-icon.error { color: var(--color-error); }
// //     .kpi-icon.warning { color: var(--color-warning); }

// //     .card-body { display: flex; align-items: baseline; gap: var(--spacing-sm); }

// //     .kpi-value {
// //       font-size: var(--font-size-2xl);
// //       font-weight: bold;
// //       font-family: var(--font-heading);
// //       margin: 0;
// //       line-height: 1;
// //     }
// //     .kpi-value.error { color: var(--color-error); }
// //     .kpi-value.warning { color: var(--color-warning); }

// //     .kpi-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); }

// //     .priority-box {
// //       margin-top: var(--spacing-sm);
// //       padding: 4px 8px;
// //       border-radius: 4px;
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       font-size: 10px;
// //       font-weight: bold;
// //     }
// //     .priority-box.error { background: var(--color-error-bg); border: 1px solid var(--color-error-border); }
// //     .priority-label { color: var(--color-error); text-transform: uppercase; }
// //     .priority-value { color: var(--text-primary); max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

// //     .action-text {
// //       font-size: 10px;
// //       color: var(--text-secondary);
// //       opacity: 0.8;
// //       margin-top: var(--spacing-sm);
// //       line-height: 1.2;
// //     }

// //     /* AUDIT CARD (Gradient) */
// //     .audit-card {
// //       background: var(--accent-gradient);
// //       border: none;
// //       color: #ffffff;
// //       justify-content: space-between;
// //     }

// //     .audit-label { font-size: var(--font-size-xs); font-weight: 900; text-transform: uppercase; opacity: 0.8; margin: 0 0 4px 0; }
// //     .audit-value { font-size: var(--font-size-2xl); font-weight: bold; margin: 0; line-height: 1; }
// //     .audit-sub { font-size: 10px; font-weight: bold; text-transform: uppercase; opacity: 0.9; font-style: italic; margin-top: 4px; }

// //     /* CONTENT GRID */
// //     .content-grid {
// //       display: grid;
// //       grid-template-columns: 1fr;
// //       gap: var(--spacing-lg);
// //     }
// //     @media(min-width: 1024px) {
// //       .content-grid { grid-template-columns: 2fr 1fr; }
// //     }

// //     /* GRID CARD (Table) */
// //     .grid-card {
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       overflow: hidden;
// //       height: 100%;
// //       min-height: 350px;
// //       display: flex;
// //       flex-direction: column;
// //     }

// //     .grid-header {
// //       padding: var(--spacing-sm) var(--spacing-md);
// //       border-bottom: 1px solid var(--border-primary);
// //       background: var(--bg-ternary);
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       flex-shrink: 0;
// //     }

// //     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
// //     .grid-tag { font-size: 9px; font-family: var(--font-mono); color: var(--text-label); opacity: 0.8; }

// //     .grid-container { flex: 1; position: relative; }
// //     .full-size-grid { width: 100%; height: 100%; display: block; }

// //     /* SIDE COLUMN */
// //     .side-column { display: flex; flex-direction: column; gap: var(--spacing-md); }

// //     .side-card {
// //       background: var(--bg-secondary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-xl);
// //       padding: var(--spacing-md);
// //     }

// //     .side-title {
// //       font-size: var(--font-size-xs);
// //       font-weight: bold;
// //       text-transform: uppercase;
// //       color: var(--text-label);
// //       margin: 0;
// //     }
// //     .mb-sm { margin-bottom: var(--spacing-sm); }

// //     .checklist { display: flex; flex-direction: column; gap: var(--spacing-xs); }

// //     .check-item {
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: center;
// //       padding: var(--spacing-xs) var(--spacing-sm);
// //       border-radius: var(--ui-border-radius);
// //       border: 1px solid var(--border-secondary);
// //       background: var(--bg-ternary);
// //       transition: background 0.2s;
// //     }
// //     .check-item:hover { background: var(--component-bg-hover); }

// //     .item-name {
// //       font-size: var(--font-size-xs);
// //       font-weight: bold;
// //       color: var(--text-primary);
// //       white-space: nowrap;
// //       overflow: hidden;
// //       text-overflow: ellipsis;
// //       max-width: 150px;
// //     }

// //     .empty-text { text-align: center; padding: var(--spacing-sm); font-size: 10px; color: var(--text-tertiary); }

// //     /* SECURE CARD */
// //     .secure-card {
// //       border: 1px dashed var(--color-success);
// //       background: var(--color-success-bg);
// //       text-align: center;
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //     }

// //     .secure-icon-box {
// //       width: 2rem; height: 2rem;
// //       border-radius: 50%;
// //       background: rgba(16, 185, 129, 0.1);
// //       color: var(--color-success);
// //       display: flex; align-items: center; justify-content: center;
// //       margin-bottom: var(--spacing-xs);
// //     }
// //     .secure-icon { font-size: 0.9rem; }

// //     .secure-title { font-size: var(--font-size-sm); font-weight: bold; color: var(--text-primary); margin: 0 0 2px 0; }
// //     .secure-text { font-size: 10px; color: var(--text-secondary); line-height: 1.4; margin: 0; }

// //     /* LOADER */
// //     .loader-container {
// //       height: 60vh;
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
// // export class SystemAuditAlertsComponent implements OnInit {
// //   alertsData = signal<any>(null);
// //   securityData = signal<any>(null);
// //   loading = signal<boolean>(true);
// //   auditColumns: any[] = [];

// //   constructor(
// //     private analyticsService: AdminAnalyticsService,
// //     public commonService: CommonMethodService,
// //     private cdr: ChangeDetectorRef
// //   ) {}

// //   ngOnInit() {
// //     this.setupColumns();
// //     this.refreshAll();
// //   }

// //   setupColumns(): void {
// //   this.auditColumns = [
// //     // 1. ADMINISTRATOR (Compact Profile)
// //     {
// //       field: 'userId.name',
// //       headerName: 'Administrator',
// //       sortable: true,
// //       flex: 1.5,
// //       minWidth: 200,
// //       cellRenderer: (params: any) => {
// //         const user = params.data?.userId || {};
// //         const name = user.name || 'Unknown';
// //         const email = user.email || '';
// //         const initials = this.commonService.getInitials(name);

// //         // Adjusted: Avatar 28px, tighter text spacing
// //         return `<div style="display: flex; align-items: center; gap: 10px; height: 100%;">
// //                   <div style="width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; background: var(--accent-focus); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; border: 1px solid var(--accent-secondary);">
// //                     ${initials}
// //                   </div>
// //                   <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.1;">
// //                     <span style="font-weight: 700; color: var(--text-primary); font-size: 12px; margin-bottom: 2px;">${name}</span>
// //                     <span style="font-size: 10px; color: var(--text-tertiary);">${email}</span>
// //                   </div>
// //                 </div>`;
// //       }
// //     },

// //   // 2. ACTION (Vertically Stacked & Centered)
// //     {
// //       field: 'action',
// //       headerName: 'Action',
// //       sortable: true,
// //       flex: 1,
// //       minWidth: 160,
// //       cellRenderer: (params: any) => {
// //         const fullAction = params.value || '';
// //         const parts = fullAction.split(':');
// //         // Fallback to 'System' if no category exists
// //         const category = parts[0] ? parts[0].trim() : 'System'; 
// //         const actionName = parts[1] ? parts[1].trim() : fullAction;

// //         // Key Fix: 'justify-content: center' pushes the stack to the vertical middle
// //         return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 4px;">
// //                   <span style="width: fit-content; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); color: var(--accent-primary); text-transform: uppercase; line-height: 1;">
// //                     ${category}
// //                   </span>
// //                   <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
// //                     ${actionName}
// //                   </span>
// //                 </div>`;
// //       }
// //     },

// //     // 3. IP ADDRESS (Vertically Centered Pill)
// //     {
// //       field: 'ip',
// //       headerName: 'IP Address',
// //       sortable: true,
// //       width: 140,
// //       cellRenderer: (params: any) => {
// //         const ip = params.value === '::1' ? 'Localhost' : (params.value || 'Unknown');

// //         // Key Fix: 'align-items: center' ensures the pill sits exactly in the middle of 60px
// //         return `<div style="display: flex; align-items: center; height: 100%;">
// //                   <span style="font-family: var(--font-mono); font-size: 10px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-primary); color: var(--text-secondary); display: flex; gap: 6px; align-items: center; line-height: 1;">
// //                      <i class="pi pi-globe" style="font-size: 9px; opacity: 0.6;"></i> ${ip}
// //                   </span>
// //                 </div>`;
// //       }
// //     },

// //     // 4. TIME (Simple Right Align)
// //     {
// //       field: 'createdAt',
// //       headerName: 'Time',
// //       sortable: true,
// //       width: 120,
// //       type: 'rightAligned',
// //       valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM, HH:mm'),
// //       cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end', 'height': '100%', 'font-family': 'var(--font-mono)', 'font-size': '11px', 'color': 'var(--text-tertiary)' }
// //     }
// //   ];
// //   this.cdr.detectChanges();
// // } 
 
// //   refreshAll() {
// //     this.loading.set(true);
// //     forkJoin({
// //       alerts: this.analyticsService.getCriticalAlerts(),
// //       security: this.analyticsService.getSecurityAuditLog()
// //     }).subscribe({
// //       next: (results) => {
// //         if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
// //         if (results.security.status === 'success') this.securityData.set(results.security.data);
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }
// // }
