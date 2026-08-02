import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { GridApi } from 'ag-grid-community';

// PrimeNG & Shared
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';

@Component({
  selector: 'app-user-attendance-details',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    ButtonModule, 
    TagModule,
    DialogModule, 
    SkeletonModule, 
    TooltipModule, 
    AvatarModule,
    DataGridComponent
  ],
  providers: [MessageService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true" 
            [rounded]="true" 
            size="large" 
            severity="secondary"
            (onClick)="onBack()">
          </p-button>
          
          <div class="header-titles flex-col gap-xs">
            <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Employee Attendance Ledger</h1>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">Detailed view of historical punch records.</p>
          </div>
        </div>
      </header>

      @if (isLoading()) {
        <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-xl">
          <p-skeleton width="100%" height="400px" borderRadius="12px"></p-skeleton>
        </p-card>
      } @else {
        <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0 flex-col h-full slide-down" styleClass="animation-delay: 0.1s">
          
          <div class="grid-wrapper w-full flex-grow-1" style="min-height: 600px;">
            <app-data-grid 
              [columns]="columns" 
              [data]="userLogs()"
              [rowActions]="rowActions"
              (rowClick)="onRowClick($event)">
            </app-data-grid>
          </div>

        </p-card>
      }
    </div>

    <p-dialog [modal]="true" 
      [(visible)]="displayInspection" 
      position="right" 
      [modal]="true"
      [draggable]="false"
      styleClass="glass-panel w-full md:w-30rem h-screen m-0 border-none border-left-1 border-solid border-primary border-radius-none" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
      
      <ng-template pTemplate="header">
        <h2 class="font-heading m-0 flex align-items-center gap-sm text-primary text-xl font-bold">
          <i class="pi pi-verified text-primary"></i> Punch Inspection
        </h2>
      </ng-template>
      
      <div class="p-xl h-full flex-col">
        @if (isInspecting()) {
          <div class="flex-col gap-xl">
            <p-skeleton width="100%" height="100px" borderRadius="12px"></p-skeleton>
            <p-skeleton width="100%" height="200px" borderRadius="12px"></p-skeleton>
          </div>
        } @else if (selectedLog(); as log) {
          
          <div class="flex-col gap-xl h-full">
            
            <div class="glass-inset p-xl border-radius-lg manish-border-1 border-solid border-secondary flex-between">
              <div class="flex-col gap-xs">
                <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Server Timestamp</span>
                <span class="font-mono font-bold text-xl text-primary">{{ log.serverTimestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
              <p-tag [severity]="getTypeSeverity(log.type)" [value]="(log.type || 'UNKNOWN') | uppercase"></p-tag>
            </div>

            <div class="detail-section flex-col gap-md">
              <h4 class="m-0 font-heading text-sm font-bold text-tertiary uppercase tracking-widest border-bottom-subtle pb-sm flex align-items-center gap-sm">
                <i class="pi pi-map-marker"></i> Geolocation Data
              </h4>
              
              <div class="map-placeholder border-radius-md manish-border-1 border-solid border-secondary">
                <div class="map-grid"></div>
                <div class="pin-marker"><i class="pi pi-map-marker text-error text-3xl"></i></div>
              </div>
              
              <div class="grid-2 gap-md mt-sm">
                <div class="flex-col gap-xs">
                  <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Coordinates</span>
                  <span class="font-mono text-sm font-bold text-secondary">{{ log.location?.coordinates?.[1] || '0.0' }}, {{ log.location?.coordinates?.[0] || '0.0' }}</span>
                </div>
                <div class="flex-col gap-xs">
                  <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Geofence</span>
                  <span class="font-bold text-sm" [ngClass]="log.location?.geofenceStatus === 'inside' ? 'text-success' : 'text-error'">
                    {{ (log.location?.geofenceStatus || 'UNKNOWN') | uppercase }}
                  </span>
                </div>
                <div class="flex-col gap-xs col-span-full">
                  <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Resolved Address</span>
                  <span class="text-sm font-medium text-secondary line-height-relaxed">{{ log.location?.address || 'Not resolved' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section flex-col gap-md">
              <h4 class="m-0 font-heading text-sm font-bold text-tertiary uppercase tracking-widest border-bottom-subtle pb-sm flex align-items-center gap-sm">
                <i class="pi pi-cog"></i> Device & Network
              </h4>
              <div class="glass-inset p-md border-radius-md manish-border-1 border-solid border-secondary grid-2 gap-md">
                <div class="flex-col gap-xs">
                  <span class="text-xs text-tertiary font-bold tracking-widest uppercase">IP Address</span>
                  <span class="font-mono text-sm font-bold text-secondary">{{ log.ipAddress || 'Unknown' }}</span>
                </div>
                <div class="flex-col gap-xs">
                  <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Source</span>
                  <span class="text-sm font-bold text-secondary capitalize">{{ log.source }}</span>
                </div>
                <div class="flex-col gap-xs col-span-full">
                  <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Device/Agent</span>
                  <span class="text-xs font-medium text-secondary line-height-relaxed">{{ log.userAgent || log.deviceName || 'N/A' }}</span>
                </div>
              </div>
            </div>

            @if (log.biometricData?.method) {
              <div class="detail-section flex-col gap-md">
                <h4 class="m-0 font-heading text-sm font-bold text-tertiary uppercase tracking-widest border-bottom-subtle pb-sm flex align-items-center gap-sm">
                  <i class="pi pi-eye"></i> Biometric Verification
                </h4>
                <div class="bg-primary-light p-md border-radius-md manish-border-1 border-solid border-primary flex-between">
                  <div class="flex-col gap-xs">
                    <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Method: {{ log.biometricData.method }}</span>
                    <span class="text-sm text-primary font-bold">Confidence Score</span>
                  </div>
                  <div class="text-3xl font-heading font-bold text-success">{{ log.biometricData.confidence }}%</div>
                </div>
              </div>
            }

            <div class="flex-col flex-center text-center gap-xs mt-auto pt-xl text-xs font-mono font-medium text-tertiary">
              <span>Log ID: {{ log._id }}</span>
              <span>Verification Status: {{ log.isVerified ? 'Verified' : 'Unverified' }}</span>
            </div>
            
          </div>
        }
      </div>
    </p-dialog>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
    .page-container { max-width: 1400px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .align-items-center { align-items: center; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-grow-1 { flex-grow: 1; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .h-screen { height: 100vh; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    .col-span-full { grid-column: 1 / -1; }

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-sm { margin-top: var(--spacing-sm); }
    .mt-auto { margin-top: auto; }
    
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .pb-sm { padding-bottom: var(--spacing-sm); }
    .pt-xl { padding-top: var(--spacing-xl); }
    
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-xl { gap: var(--spacing-xl); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .text-center { text-align: center; }
    
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }
    .max-w-prose { max-width: 65ch; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
    .border-radius-none { border-radius: 0 !important; }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    
    .border-none { border: none !important; }
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .manish-border-1 { border-width: 1px; }
    .border-left-1 { border-left-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* Component Specifics */
    .map-placeholder { width: 100%; height: 150px; background-color: var(--border-secondary); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .map-grid { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 20px 20px; }
    .pin-marker { position: relative; z-index: 2; animation: bounce 2s infinite; }
    
    /* Native AG Action Button */
    ::ng-deep .ag-action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 6px 12px; font-family: var(--font-body); font-weight: 600;
      border-radius: var(--ui-border-radius-md); cursor: pointer;
      transition: var(--transition-base); border: 1px solid var(--border-secondary);
      background: var(--bg-primary); color: var(--text-primary);
    }
    ::ng-deep .ag-action-btn:hover {
      background: var(--bg-secondary); border-color: var(--text-tertiary);
    }

    /* Animations */
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    /* Responsive */
    @media (max-width: 768px) {
      .page-container { padding: var(--spacing-xl) var(--spacing-md); }
    }
  `]
})
export class UserAttendanceDetailsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private datePipe = inject(DatePipe);

  private gridApi!: GridApi;

  // State
  userId: string = '';
  userLogs = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  columns: GridColumn[] = [];
  rowActions: GridRowAction[] = [];

  // Inspection Sidebar State
  displayInspection = false;
  isInspecting = signal<boolean>(false);
  selectedLog = signal<any>(null);

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.setupColumns();
      this.loadUserLogs();
    } else {
      this.onBack();
    }
  }

  // ==========================================================================
  // AG GRID SETUP & RENDERING
  // ==========================================================================
  private setupColumns() {
    this.columns = [
      {
        header: 'Date & Time',
        field: 'timestamp',
        width: '250px',
        sortable: true,
        formatter: (val: any) => {
          if (!val) return '';
          const date = this.datePipe.transform(val, 'EEE, dd MMM yyyy');
          const time = this.datePipe.transform(val, 'HH:mm:ss');
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px; padding:4px 0;">
              <span style="font-weight:700; color:var(--text-primary); font-size:13px; line-height:1;">${date}</span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); line-height:1;">${time}</span>
            </div>`;
        }
      },
      {
        header: 'Punch Type',
        field: 'type',
        width: '200px',
        formatter: (val: any) => {
          const type = val;
          const typeStr = this.formatType(type);
          const icon = this.getTypeIcon(type);
          
          let color = 'var(--text-secondary)';
          if (type?.includes('in')) color = 'var(--color-success, #16a34a)';
          if (type?.includes('out')) color = 'var(--color-error, #dc2626)';
          if (type?.includes('break')) color = 'var(--color-warning, #d97706)';
          
          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%; color:${color}; font-weight:700; text-transform:capitalize; font-size:13px;">
              <i class="pi ${icon}"></i> ${typeStr}
            </div>`;
        }
      },
      {
        header: 'Source',
        field: 'source',
        width: '150px',
        formatter: (val: any) => {
          const source = val || 'unknown';
          const icon = this.getSourceIcon(source);
          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%; color:var(--text-secondary); font-size:13px; text-transform:capitalize;">
              <i class="pi ${icon} text-tertiary"></i> ${source}
            </div>`;
        }
      },
      {
        header: 'Status',
        field: 'processingStatus',
        width: '180px',
        formatter: (val: any, row: any) => {
          const status = (val || 'UNKNOWN').toUpperCase();
          const severity = this.getStatusSeverity(val);
          const isCorrection = row?.isCorrection;
          
          let bg = 'var(--bg-secondary)', color = 'var(--text-secondary)', border = 'var(--border-secondary)';
          if(severity === 'success') { bg = 'var(--color-success-bg, #ecfdf5)'; color = 'var(--color-success, #16a34a)'; border = 'color-mix(in srgb, var(--color-success) 30%, transparent)'; }
          if(severity === 'danger') { bg = 'var(--color-error-bg, #fef2f2)'; color = 'var(--color-error, #dc2626)'; border = 'color-mix(in srgb, var(--color-error) 30%, transparent)'; }
          if(severity === 'warning') { bg = 'color-mix(in srgb, var(--color-warning) 10%, transparent)'; color = 'var(--color-warning)'; border = 'color-mix(in srgb, var(--color-warning) 30%, transparent)'; }
          if(severity === 'info') { bg = '#eff6ff'; color = '#0ea5e9'; border = '#bae6fd'; }

          let html = `<div style="display:flex; align-items:center; gap:8px; height:100%;">
            <span style="display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; line-height:1; background-color:${bg}; color:${color}; border:1px solid ${border}; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.5px;">${status}</span>`;
          if (isCorrection) {
            html += `<i class="pi pi-info-circle" style="color:var(--color-warning); font-size:14px;" title="Corrected Log"></i>`;
          }
          html += `</div>`;
          return html;
        }
      }
    ];

    this.rowActions = [
      {
        id: 'inspect',
        icon: 'pi pi-search-plus',
        label: 'Inspect',
        tooltip: 'Inspect Record',
        showWhen: 'always',
        callback: (row) => this.inspectLog(row._id)
      }
    ];
  }

  // ==========================================================================
  // DATA & EVENTS
  // ==========================================================================
  private loadUserLogs() {
    this.isLoading.set(true);
    this.hrmsService.getUserLogs(this.userId).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of({ data: { logs: [] } });
      }),
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.userLogs.set(res?.data?.logs || []);
    });
  }

  onRowClick(row: any) {
    if (row && row._id) {
      // By default if they click the row they might want to inspect
      this.inspectLog(row._id);
    }
  }

  inspectLog(logId: string) {
    this.displayInspection = true;
    this.isInspecting.set(true);
    this.selectedLog.set(null);

    this.hrmsService.getAttendanceLog(logId).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        this.displayInspection = false;
        return of(null);
      }),
      finalize(() => this.isInspecting.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res?.data?.log) {
        this.selectedLog.set(res.data.log);
      }
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  onBack() {
    this.router.navigate(['/hrms/attendance/admin']);
  }

  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Unknown';
  }

  getTypeIcon(type: string): string {
    if (type?.includes('in')) return 'pi-sign-in';
    if (type?.includes('out')) return 'pi-sign-out';
    if (type?.includes('break')) return 'pi-coffee';
    return 'pi-circle';
  }

  getTypeSeverity(type: string): any {
    if (type?.includes('in')) return 'success';
    if (type?.includes('out')) return 'danger';
    if (type?.includes('break')) return 'warning';
    return 'info';
  }

  getSourceIcon(source: string): string {
    switch (source) {
      case 'machine': 
      case 'biometric': 
      case 'rfid': return 'pi-server';
      case 'mobile': return 'pi-mobile';
      case 'web': return 'pi-desktop';
      case 'admin_manual': return 'pi-user-edit';
      default: return 'pi-cloud';
    }
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'processed': return 'success';
      case 'pending': return 'secondary';
      case 'flagged': return 'danger';
      case 'corrected': return 'info';
      default: return 'warn';
    }
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TableModule } from 'primeng/table';
// import { TagModule } from 'primeng/tag';
// // import { SidebarModule } from 'primeng/dialog';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { AvatarModule } from 'primeng/avatar';
// // import { HRMSService } from '../hrms.service';
// import { Dialog } from 'primeng/dialog';
// import { HRMSService } from '../../hrms.service';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-user-attendance-details',
//   standalone: true,
//   imports: [
//     CommonModule, CardModule, ButtonModule, TableModule, TagModule,
//     Dialog, SkeletonModule, TooltipModule, AvatarModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="page-wrapper fade-in">
      
//       <header class="dashboard-header slide-down mb-4">
//         <div class="header-left">
//           <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
//           <div class="header-titles">
//             <h1 class="page-title m-0">Employee Attendance Ledger</h1>
//             <p class="page-subtitle mt-1">Detailed view of historical punch records.</p>
//           </div>
//         </div>
//       </header>

//       @if (isLoading()) {
//         <p-card styleClass="premium-card glass-card"><p-skeleton width="100%" height="400px"></p-skeleton></p-card>
//       } @else {
        
//         <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
//           <p-table 
//             [value]="userLogs()" 
//             [paginator]="true" 
//             [rows]="15" 
//             responsiveLayout="scroll"
//             styleClass="premium-table border-round-xl manish-border-1 surface-border">
            
//             <ng-template pTemplate="header">
//               <tr>
//                 <th>Date & Time</th>
//                 <th>Punch Type</th>
//                 <th>Source</th>
//                 <th>Status</th>
//                 <th class="text-right">Inspection</th>
//               </tr>
//             </ng-template>

//             <ng-template pTemplate="body" let-log>
//               <tr class="table-row-hover">
//                 <td>
//                   <div class="flex-col gap-1">
//                     <span class="font-bold text-primary-color">{{ log.timestamp | date:'EEE, dd MMM yyyy' }}</span>
//                     <span class="font-mono text-sm text-secondary">{{ log.timestamp | date:'HH:mm:ss' }}</span>
//                   </div>
//                 </td>
//                 <td>
//                   <span class="font-bold capitalize flex-align gap-2" [ngClass]="getTypeColor(log.type)">
//                     <i class="pi" [ngClass]="getTypeIcon(log.type)"></i> {{ formatType(log.type) }}
//                   </span>
//                 </td>
//                 <td>
//                   <span class="text-secondary text-sm capitalize flex-align gap-2">
//                     <i class="pi" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source }}
//                   </span>
//                 </td>
//                 <td>
//                   <p-tag [severity]="getStatusSeverity(log.processingStatus)" [value]="log.processingStatus | uppercase"></p-tag>
//                   <i *ngIf="log.isCorrection" class="pi pi-info-circle text-warning ml-2" pTooltip="This is a corrected log"></i>
//                 </td>
//                 <td class="text-right">
//                   <p-button icon="pi pi-search-plus" label="Inspect" [outlined]="true" size="small" (onClick)="inspectLog(log._id)"></p-button>
//                 </td>
//               </tr>
//             </ng-template>

//             <ng-template pTemplate="emptymessage">
//               <tr><td colspan="5" class="text-center py-6 text-secondary">No attendance records found for this employee.</td></tr>
//             </ng-template>
//           </p-table>
//         </p-card>
//       }
//     </div>

//     <p-dialog [modal]="true" [(visible)]="displayInspection" position="right" styleClass="premium-dialog w-full md:w-30rem" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
//       <ng-template pTemplate="header">
//         <h2 class="font-heading m-0 flex-align gap-2 text-primary-color"><i class="pi pi-verified text-primary"></i> Punch Inspection</h2>
//       </ng-template>
      
//       @if (isInspecting()) {
//         <div class="flex-col gap-4 mt-4"><p-skeleton height="100px"></p-skeleton><p-skeleton height="200px"></p-skeleton></div>
//       } @else if (selectedLog(); as log) {
        
//         <div class="inspection-content flex-col gap-4 mt-2">
          
//           <div class="bg-surface p-4 border-radius-md manish-border-1 surface-border flex-between">
//             <div class="flex-col gap-1">
//               <span class="text-xs text-tertiary uppercase font-bold">Server Timestamp</span>
//               <span class="font-mono font-bold text-lg text-primary-color">{{ log.serverTimestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
//             </div>
//             <p-tag [severity]="getTypeSeverity(log.type)" [value]="log.type | uppercase"></p-tag>
//           </div>

//           <div class="detail-section">
//             <h4 class="section-title"><i class="pi pi-map-marker"></i> Geolocation Data</h4>
//             <div class="map-placeholder mt-2 border-radius-md">
//               <div class="map-grid"></div>
//               <div class="pin-marker"><i class="pi pi-map-marker text-error text-3xl"></i></div>
//             </div>
//             <div class="grid-2 mt-3 gap-3">
//               <div class="flex-col"><span class="text-xs text-tertiary">Coordinates</span><span class="font-mono text-sm text-secondary">{{ log.location?.coordinates?.[1] || '0.0' }}, {{ log.location?.coordinates?.[0] || '0.0' }}</span></div>
//               <div class="flex-col"><span class="text-xs text-tertiary">Geofence Status</span>
//                 <span class="font-bold" [ngClass]="log.location?.geofenceStatus === 'inside' ? 'text-success' : 'text-error'">
//                   {{ log.location?.geofenceStatus | uppercase }}
//                 </span>
//               </div>
//               <div class="flex-col span-2"><span class="text-xs text-tertiary">Resolved Address</span><span class="text-sm text-secondary">{{ log.location?.address || 'Not resolved' }}</span></div>
//             </div>
//           </div>

//           <div class="detail-section">
//             <h4 class="section-title"><i class="pi pi-cog"></i> Device & Network</h4>
//             <div class="bg-surface p-3 border-radius-md manish-border-1 surface-border grid-2 gap-3 mt-2">
//               <div class="flex-col"><span class="text-xs text-tertiary">IP Address</span><span class="font-mono text-sm text-secondary">{{ log.ipAddress || 'Unknown' }}</span></div>
//               <div class="flex-col"><span class="text-xs text-tertiary">Source</span><span class="text-sm text-secondary capitalize">{{ log.source }}</span></div>
//               <div class="flex-col span-2"><span class="text-xs text-tertiary">Device/Agent</span><span class="text-xs text-secondary line-clamp-2">{{ log.userAgent || log.deviceName || 'N/A' }}</span></div>
//             </div>
//           </div>

//           @if (log.biometricData?.method) {
//             <div class="detail-section">
//               <h4 class="section-title"><i class="pi pi-eye"></i> Biometric Verification</h4>
//               <div class="bg-primary-light p-3 border-radius-md manish-border-1 surface-border flex-between mt-2">
//                 <div class="flex-col gap-1">
//                   <span class="text-xs text-tertiary uppercase font-bold">Method: {{ log.biometricData.method }}</span>
//                   <span class="text-sm text-primary-color font-medium">Confidence Score</span>
//                 </div>
//                 <div class="text-2xl font-bold text-success">{{ log.biometricData.confidence }}%</div>
//               </div>
//             </div>
//           }

//           <div class="flex-col gap-1 mt-4 text-xs text-tertiary text-center">
//             <span>Log ID: {{ log._id }}</span>
//             <span>Verification Status: {{ log.isVerified ? 'Verified' : 'Unverified' }}</span>
//           </div>
//         </div>
//       }
//     </p-dialog>
//   `,
//   styles: [`
//     :host { display: block; font-family: var(--font-body); min-height: 100vh; background: var(--bg-primary); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
//     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
//     .span-2 { grid-column: span 2; }
    
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
    
//     .m-0 { margin: 0; }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-3 { margin-top: var(--spacing-md); }
//     .mt-4 { margin-top: var(--spacing-xl); }
//     .ml-2 { margin-left: var(--spacing-sm); }
    
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
//     .w-full { width: 100%; }
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
    
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-3xl { font-size: 2rem; }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-error { color: var(--color-error); }
//     .text-warning { color: var(--color-warning); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .uppercase { text-transform: uppercase; letter-spacing: 0.05em; }
//     .capitalize { text-transform: capitalize; }
//     .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .manish-border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

//     /* Table */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    
//     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
//     ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
//     ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
//     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

//     /* Sidebar & Inspection */
//     ::ng-deep .premium-dialog { background: var(--bg-primary); border-left: 1px solid var(--border-primary); }
//     ::ng-deep .premium-dialog .p-dialog-header { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
//     ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }
    
//     .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; display: flex; align-items: center; gap: var(--spacing-sm); }
    
//     .map-placeholder { width: 100%; height: 150px; background-color: #e2e8f0; position: relative; overflow: hidden; border: 1px solid var(--border-primary); display: flex; align-items: center; justify-content: center; }
//     .map-grid { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 20px 20px; }
//     .pin-marker { position: relative; z-index: 2; animation: bounce 2s infinite; }
//     @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
//   `]
// })
// export class UserAttendanceDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);

//   // State
//   userId: string = '';
//   userLogs = signal<any[]>([]);
//   isLoading = signal<boolean>(true);

//   // Inspection Sidebar State
//   displayInspection = false;
//   isInspecting = signal<boolean>(false);
//   selectedLog = signal<any>(null);

//   ngOnInit() {
//     this.userId = this.route.snapshot.paramMap.get('id') || '';
//     if (this.userId) {
//       this.loadUserLogs();
//     } else {
//       this.onBack();
//     }
//   }

//   private loadUserLogs() {
//     this.isLoading.set(true);
//     this.hrmsService.getUserLogs(this.userId).pipe(
//       catchError((err) => {
//         this.messageService.handleHttpError(err)
//         return of({ data: { logs: [] } });
//       }),
//       finalize(() => this.isLoading.set(false))
//     ).subscribe((res: any) => {
//       this.userLogs.set(res?.data?.logs || []);
//     });
//   }

//   // --- API Action: Get Single Log Details ---
//   inspectLog(logId: string) {
//     this.displayInspection = true;
//     this.isInspecting.set(true);
//     this.selectedLog.set(null);

//     this.hrmsService.getAttendanceLog(logId).pipe(
//       catchError((err) => {
//         this.messageService.handleHttpError(err)
//         this.displayInspection = false;
//         return of(null);
//       }),
//       finalize(() => this.isInspecting.set(false))
//     ).subscribe((res: any) => {
//       if (res?.data?.log) {
//         this.selectedLog.set(res.data.log);
//       }
//     });
//   }

//   // --- UI Helpers ---
//   onBack() {
//     this.router.navigate(['hrms/attendance/admin']); // Adjust route as necessary
//   }

//   formatType(type: string): string {
//     return type?.replace('_', ' ') || 'Unknown';
//   }

//   getTypeIcon(type: string): string {
//     if (type?.includes('in')) return 'pi-sign-in';
//     if (type?.includes('out')) return 'pi-sign-out';
//     if (type?.includes('break')) return 'pi-coffee';
//     return 'pi-circle';
//   }

//   getTypeColor(type: string): string {
//     if (type?.includes('in')) return 'text-success';
//     if (type?.includes('out')) return 'text-error';
//     if (type?.includes('break')) return 'text-warning';
//     return 'text-secondary';
//   }

//   getTypeSeverity(type: string): any {
//     if (type?.includes('in')) return 'success';
//     if (type?.includes('out')) return 'danger';
//     if (type?.includes('break')) return 'warning';
//     return 'info';
//   }

//   getSourceIcon(source: string): string {
//     switch (source) {
//       case 'machine': case 'biometric': case 'rfid': return 'pi-server';
//       case 'mobile': return 'pi-mobile';
//       case 'web': return 'pi-desktop';
//       case 'admin_manual': return 'pi-user-edit';
//       default: return 'pi-cloud';
//     }
//   }

//   getStatusSeverity(status: string): any {
//     switch (status) {
//       case 'processed': return 'success';
//       case 'pending': return 'secondary';
//       case 'flagged': return 'danger';
//       case 'corrected': return 'info';
//       default: return 'warning';
//     }
//   }
// }
