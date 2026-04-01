import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { GridApi } from 'ag-grid-community';

// PrimeNG & Shared
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-geofence-hub',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    ButtonModule, 
    TagModule, 
    TabsModule,
    SkeletonModule, 
    TooltipModule, 
    ConfirmDialogModule, 
    IconFieldModule, 
    InputIconModule, 
    InputTextModule,
    ToastModule,
    AgShareGrid
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog 
      styleClass="glass-panel border-radius-xl shadow-xl" 
      acceptButtonStyleClass="p-button-danger" 
      rejectButtonStyleClass="p-button-secondary p-button-text">
    </p-confirmDialog>

    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <div class="icon-brand flex-center bg-primary text-white border-radius-lg shadow-md flex-shrink-0" style="width: 56px; height: 56px;">
            <i class="pi pi-map text-3xl"></i>
          </div>
          <div class="header-titles flex-col gap-xs">
            <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Geofence Command Center</h1>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">Manage virtual boundaries, track location violations, and enforce site attendance.</p>
          </div>
        </div>
        <div class="header-actions flex align-items-center gap-md">
          <p-button 
            icon="pi pi-refresh" 
            [text]="true" 
            [rounded]="true" 
            severity="secondary" 
            (onClick)="loadData()">
          </p-button>
          <p-button 
            label="Create Boundary" 
            icon="pi pi-map-marker" 
            styleClass="p-button-primary shadow-sm" 
            (onClick)="onCreate()">
          </p-button>
        </div>
      </header>

      @if (isLoading()) {
        <p-skeleton width="100%" height="500px" borderRadius="16px"></p-skeleton>
      } @else {
        <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0 h-full flex-col slide-down" styleClass="animation-delay: 0.1s">
          <p-tabs value="0">
            
            <p-tablist>
              <p-tab value="0">
                <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                  <i class="pi pi-check-circle"></i> Active Geofences
                </div>
              </p-tab>
              <p-tab value="1">
                <div class="flex align-items-center gap-sm font-medium px-md py-sm text-error">
                  <i class="pi pi-exclamation-triangle"></i> Violation Reports
                </div>
              </p-tab>
            </p-tablist>

            <p-tabpanels styleClass="p-0">
              
              <p-tabpanel value="0">
                <div class="panel-content p-xl flex-col h-full">
                  
                  <div class="flex-between flex-wrap gap-md mb-md px-xl py-lg bg-secondary border-radius-lg manish-border-1 border-solid border-secondary">
                    <h3 class="m-0 font-heading text-lg font-bold text-primary">Established Boundaries</h3>
                    <p-iconField iconPosition="left">
                      <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
                      <input 
                        type="text" 
                        pInputText 
                        placeholder="Search fences..." 
                        (input)="onSearchFences($event)" 
                        class="w-full sm:w-20rem premium-input" />
                    </p-iconField>
                  </div>

                  <div class="grid-wrapper w-full flex-grow-1 border-radius-lg manish-border-1 border-solid border-primary overflow-hidden shadow-sm" style="min-height: 500px;">
                    <app-ag-share-grid 
                      [columns]="geofenceColumns" 
                      [data]="geofences()"
                      (gridEvent)="onGeofenceGridEvent($event)">
                    </app-ag-share-grid>
                  </div>
                  
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-content p-xl bg-error-faded h-full flex-col">
                  
                  <div class="flex-between flex-wrap gap-md mb-md">
                    <div class="flex align-items-center gap-sm">
                      <i class="pi pi-shield text-error text-2xl"></i>
                      <div class="flex-col">
                        <h3 class="m-0 font-heading text-lg font-bold text-error">Out-of-Bounds Punches</h3>
                        <span class="text-sm text-secondary">Showing violation data for the last 30 days.</span>
                      </div>
                    </div>
                  </div>

                  <div class="grid-wrapper w-full flex-grow-1 border-radius-lg manish-border-1 border-solid border-error overflow-hidden shadow-sm" style="min-height: 500px;">
                    <app-ag-share-grid 
                      [columns]="violationColumns" 
                      [data]="violations()"
                      (gridEvent)="onViolationGridEvent($event)">
                    </app-ag-share-grid>
                  </div>

                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
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

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .px-md { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
    .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
    
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
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    
    .uppercase { text-transform: uppercase; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .max-w-prose { max-width: 65ch; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-error { color: var(--color-error, #dc2626); }
    .text-white { color: #ffffff; }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-error-faded { background-color: rgba(239, 68, 68, 0.02); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    
    .manish-border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    .border-error { border-color: color-mix(in srgb, var(--color-error) 40%, transparent) !important; }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-md { box-shadow: var(--shadow-md); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    /* Responsive */
    @media (min-width: 640px) {
      .sm\\:w-20rem { width: 20rem; }
    }
    @media (max-width: 768px) {
      .page-container { padding: var(--spacing-xl) var(--spacing-md); }
      .header-actions { width: 100%; justify-content: flex-start; }
    }
  `]
})
export class GeofenceHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  // AG Grid Apis
  private geofenceGridApi!: GridApi;
  private violationGridApi!: GridApi;

  isLoading = signal(true);
  geofences = signal<any[]>([]);
  violations = signal<any[]>([]);

  geofenceColumns: any[] = [];
  violationColumns: any[] = [];

  ngOnInit() {
    this.setupGridColumns();
    this.loadData();
  }

  // ==========================================================================
  // AG GRID SETUP & RENDERING
  // ==========================================================================
  private setupGridColumns() {
    
    // 1. Geofence Active Definitions
    this.geofenceColumns = [
      {
        headerName: 'Boundary Identity',
        width: 280,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const name = params.data.name || 'Unknown';
          const code = params.data.code || 'N/A';
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:6px; padding:4px 0;">
              <span style="font-weight:700; color:var(--text-primary); font-size:14px; line-height:1;">${name}</span>
              <span style="font-family:var(--font-mono); font-size:11px; background:var(--bg-secondary); padding:2px 8px; border-radius:4px; border:1px solid var(--border-secondary); color:var(--text-secondary); width:max-content; line-height:1;">${code}</span>
            </div>`;
        }
      },
      {
        headerName: 'Type & Reach',
        width: 200,
        cellRenderer: (params: any) => {
          const type = params.data.type || 'circle';
          const icon = type === 'circle' ? 'pi-circle' : 'pi-stop';
          const radius = type === 'circle' ? `<span style="font-size:11px; color:var(--text-tertiary);">Radius: ${params.data.radius}m</span>` : '';
          
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px;">
              <span style="text-transform:capitalize; font-weight:700; color:var(--text-secondary); display:flex; align-items:center; gap:6px; font-size:13px;">
                <i class="pi ${icon}"></i> ${type}
              </span>
              ${radius}
            </div>`;
        }
      },
      {
        headerName: 'Address / Location',
        width: 280,
        cellRenderer: (params: any) => {
          const city = params.data.address?.city || 'Coordinates Only';
          const tooltip = params.data.address ? `${params.data.address.line1 || ''}, ${city}` : '';
          return `
            <div style="display:flex; align-items:center; gap:6px; height:100%; color:var(--text-secondary); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${tooltip}">
              <i class="pi pi-map-marker text-tertiary"></i> ${city}
            </div>`;
        }
      },
      {
        headerName: 'Status',
        field: 'isActive',
        width: 140,
        sortable: true,
        cellStyle: { 'display': 'flex', 'align-items': 'center' },
        cellRenderer: (params: any) => {
          const isActive = params.value;
          const bg = isActive ? 'var(--color-success-bg, #ecfdf5)' : 'var(--color-error-bg, #fef2f2)';
          const color = isActive ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)';
          const border = isActive ? 'color-mix(in srgb, var(--color-success) 30%, transparent)' : 'color-mix(in srgb, var(--color-error) 30%, transparent)';
          const text = isActive ? 'ACTIVE' : 'DISABLED';
          
          return `
            <span style="display:inline-flex; align-items:center; justify-content:center; line-height:1; background-color:${bg}; color:${color}; border:1px solid ${border}; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.5px;">
              ${text}
            </span>`;
        }
      },
      {
        headerName: 'Actions',
        colId: 'actions',
        width: 160,
        pinned: 'right',
        cellStyle: { 'padding-right': '1.5rem' },
        cellRenderer: () => {
          const btnStyle = `width:32px; height:32px; border-radius:50%; border:1px solid var(--border-secondary); background:var(--bg-secondary); color:var(--text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:13px; padding:0;`;
          return `
            <div style="display:flex; gap:8px; justify-content:flex-end; align-items:center; height:100%;">
              <button class="ag-action-btn" style="${btnStyle}" data-action="manage" title="Manage Assignments" onmouseover="this.style.background='var(--color-primary)'; this.style.color='#fff'; this.style.borderColor='var(--color-primary)';" onmouseout="this.style.background='var(--bg-secondary)'; this.style.color='var(--text-secondary)'; this.style.borderColor='var(--border-secondary)';"><i class="pi pi-cog"></i></button>
              <button class="ag-action-btn" style="${btnStyle}" data-action="edit" title="Edit Fence" onmouseover="this.style.background='var(--color-info, #0ea5e9)'; this.style.color='#fff'; this.style.borderColor='var(--color-info, #0ea5e9)';" onmouseout="this.style.background='var(--bg-secondary)'; this.style.color='var(--text-secondary)'; this.style.borderColor='var(--border-secondary)';"><i class="pi pi-pencil"></i></button>
              <button class="ag-action-btn" style="${btnStyle}" data-action="delete" title="Delete Fence" onmouseover="this.style.background='var(--color-error)'; this.style.color='#fff'; this.style.borderColor='var(--color-error)';" onmouseout="this.style.background='var(--bg-secondary)'; this.style.color='var(--text-secondary)'; this.style.borderColor='var(--border-secondary)';"><i class="pi pi-trash"></i></button>
            </div>`;
        }
      }
    ];

    // 2. Violation Columns
    this.violationColumns = [
      {
        headerName: 'Date & Time',
        field: 'timestamp',
        width: 200,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          return `<span style="font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-primary);">${this.datePipe.transform(params.value, 'dd MMM, HH:mm:ss')}</span>`;
        }
      },
      {
        headerName: 'Employee',
        field: 'user.name',
        width: 250,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => `<span style="font-weight:700; color:var(--text-primary); font-size:13px;">${params.value || 'Unknown'}</span>`
      },
      {
        headerName: 'Assigned Fence',
        field: 'expectedGeofence.name',
        width: 250,
        sortable: true,
        cellRenderer: (params: any) => `<span style="color:var(--text-secondary); font-size:13px;">${params.value || 'N/A'}</span>`
      },
      {
        headerName: 'Distance from Zone',
        field: 'distanceVariance',
        width: 200,
        pinned: 'right',
        cellStyle: { 'text-align': 'right', 'padding-right': '1.5rem' },
        cellRenderer: (params: any) => `<span style="font-weight:700; color:var(--color-error); font-size:14px;">${params.value || 0} meters</span>`
      }
    ];
  }

  // ==========================================================================
  // DATA & EVENTS
  // ==========================================================================
  loadData() {
    this.isLoading.set(true);

    forkJoin({
      fences: this.hrmsService.getGeoFences().pipe(catchError(() => of({ data: { geofences: [] } }))),
      viols: this.hrmsService.getGeoFenceViolations().pipe(catchError(() => of({ data: [] })))
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ fences, viols }) => {
      this.geofences.set(fences?.data?.geofences || []);
      this.violations.set(Array.isArray(viols?.data) ? viols.data : []); 
    });
  }

  onGeofenceGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.geofenceGridApi = event.api;
    } else if (event.type === 'cellClicked' && event.colId === 'actions') {
      const nativeEvent = event.event as MouseEvent;
      const target = nativeEvent.target as HTMLElement;
      const btn = target.closest('.ag-action-btn');
      
      if (btn) {
        const action = btn.getAttribute('data-action');
        if (action === 'manage') this.onManage(event.row._id);
        if (action === 'edit') this.onEdit(event.row._id);
        if (action === 'delete') this.onDelete(event.row);
      }
    }
  }

  onViolationGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.violationGridApi = event.api;
    }
  }

  onSearchFences(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (this.geofenceGridApi) this.geofenceGridApi.setGridOption('quickFilterText', val);
  }

  // ==========================================================================
  // ACTIONS
  // ==========================================================================
  onCreate() {
    this.router.navigate(['/hrms/geofence/new']);
  }

  onEdit(id: string) {
    this.router.navigate(['/hrms/geofence/edit', id]);
  }

  onManage(id: string) {
    this.router.navigate(['/hrms/geofence/details', id]);
  }

  onDelete(fence: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the geofence <b>${fence.name}</b>? Employees will no longer be restricted to this location.`,
      header: 'Delete Boundary',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.hrmsService.deleteGeoFence(fence._id).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message || 'Geofence deleted successfully.');
            this.loadData();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }
}


// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { catchError, finalize, forkJoin, of } from 'rxjs';

// // Services
// import { MessageService, ConfirmationService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { TabsModule } from 'primeng/tabs';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { InputTextModule } from 'primeng/inputtext';
// import { HRMSService } from '../../hrms.service';
// import { ToastModule } from 'primeng/toast';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-geofence-hub',
//   standalone: true,
//   imports: [
//     CommonModule, CardModule, TableModule, ButtonModule, TagModule, TabsModule,
//     SkeletonModule, TooltipModule, ConfirmDialogModule, IconFieldModule, 
//     InputIconModule, InputTextModule,ToastModule
//   ],
//   providers: [MessageService, ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>
//     <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

//     <div class="page-wrapper fade-in">
//       <header class="dashboard-header slide-down mb-5">
//         <div class="header-left">
//           <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-map"></i></div>
//           <div class="header-titles">
//             <h1 class="page-title m-0">Geofence Command Center</h1>
//             <p class="page-subtitle mt-1">Manage virtual boundaries, track location violations, and enforce site attendance.</p>
//           </div>
//         </div>
//         <div class="header-right flex-align gap-3">
//           <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" (onClick)="loadData()"></p-button>
//           <p-button label="Create Boundary" icon="pi pi-map-marker" styleClass="p-button-primary shadow-sm" (onClick)="onCreate()"></p-button>
//         </div>
//       </header>

//       @if (isLoading()) {
//         <p-skeleton width="100%" height="500px" borderRadius="12px"></p-skeleton>
//       } @else {
//         <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
//           <p-tabs value="0">
//             <p-tablist styleClass="hub-tablist">
//               <p-tab value="0"><div class="tab-label"><i class="pi pi-check-circle"></i> Active Geofences</div></p-tab>
//               <p-tab value="1"><div class="tab-label text-error"><i class="pi pi-exclamation-triangle"></i> Violation Reports</div></p-tab>
//             </p-tablist>

//             <p-tabpanels styleClass="hub-tabpanels p-0">
              
//               <p-tabpanel value="0">
//                 <div class="panel-inner p-4">
//                   <p-table 
//                     #dt
//                     [value]="geofences()" 
//                     [paginator]="true" 
//                     [rows]="10" 
//                     [globalFilterFields]="['name', 'code', 'type']"
//                     responsiveLayout="scroll"
//                     styleClass="premium-table border-round-xl manish-border-1 surface-border">
                    
//                     <ng-template pTemplate="caption">
//                       <div class="flex-between p-3 bg-surface border-bottom">
//                         <h3 class="m-0 font-heading text-primary-color">Established Boundaries</h3>
//                         <p-iconField iconPosition="left">
//                           <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
//                           <input type="text" pInputText placeholder="Search fences..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
//                         </p-iconField>
//                       </div>
//                     </ng-template>

//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th>Boundary Identity</th>
//                         <th>Type & Reach</th>
//                         <th>Address / Location</th>
//                         <th class="text-center">Status</th>
//                         <th class="text-right">Actions</th>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="body" let-fence>
//                       <tr class="table-row-hover">
//                         <td>
//                           <div class="flex-col gap-1">
//                             <span class="font-bold text-primary-color text-lg">{{ fence.name }}</span>
//                             <span class="badge-mono-sm w-max">{{ fence.code }}</span>
//                           </div>
//                         </td>
//                         <td>
//                           <div class="flex-col gap-1">
//                             <span class="capitalize font-bold text-secondary flex-align gap-2">
//                               <i class="pi" [ngClass]="fence.type === 'circle' ? 'pi-circle' : 'pi-stop'"></i> {{ fence.type }}
//                             </span>
//                             <span *ngIf="fence.type === 'circle'" class="text-xs text-tertiary">Radius: {{ fence.radius }}m</span>
//                           </div>
//                         </td>
//                         <td>
//                           <div class="text-sm text-secondary truncate w-15rem" [pTooltip]="fence.address?.line1 + ', ' + fence.address?.city">
//                             <i class="pi pi-map-marker text-tertiary mr-1"></i>
//                             {{ fence.address?.city || 'Coordinates Only' }}
//                           </div>
//                         </td>
//                         <td class="text-center">
//                           <p-tag [severity]="fence.isActive ? 'success' : 'danger'" [value]="fence.isActive ? 'Active' : 'Disabled'"></p-tag>
//                         </td>
//                         <td class="text-right">
//                           <div class="flex-align justify-end gap-2">
//                             <p-button icon="pi pi-cog" [text]="true" [rounded]="true" severity="secondary" pTooltip="Manage Assignments" (onClick)="onManage(fence._id)"></p-button>
//                             <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="info" pTooltip="Edit Fence" (onClick)="onEdit(fence._id)"></p-button>
//                             <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Delete Fence" (onClick)="onDelete(fence)"></p-button>
//                           </div>
//                         </td>
//                       </tr>
//                     </ng-template>
//                     <ng-template pTemplate="emptymessage">
//                       <tr><td colspan="5" class="text-center py-6 text-secondary">No geofences found. Create one to start securing check-ins.</td></tr>
//                     </ng-template>
//                   </p-table>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="1">
//                 <div class="panel-inner p-4 bg-error-faded h-full">
//                   <div class="flex-between mb-4">
//                     <h3 class="m-0 font-heading text-error flex-align gap-2"><i class="pi pi-shield"></i> Out-of-Bounds Punches</h3>
//                     <span class="text-sm text-secondary">Showing data for the last 30 days.</span>
//                   </div>
                  
//                   <p-table 
//                     [value]="violations()" 
//                     [paginator]="true" 
//                     [rows]="10" 
//                     styleClass="premium-table border-round-xl manish-border-1 border-error">
//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th>Date & Time</th>
//                         <th>Employee</th>
//                         <th>Assigned Fence</th>
//                         <th class="text-right">Distance from Zone</th>
//                       </tr>
//                     </ng-template>
//                     <ng-template pTemplate="body" let-v>
//                       <tr class="table-row-hover">
//                         <td class="font-mono text-sm font-bold">{{ v.timestamp | date:'dd MMM, HH:mm:ss' }}</td>
//                         <td class="font-bold text-primary-color">{{ v.user?.name }}</td>
//                         <td class="text-secondary">{{ v.expectedGeofence?.name || 'N/A' }}</td>
//                         <td class="text-right font-bold text-error">{{ v.distanceVariance }} meters</td>
//                       </tr>
//                     </ng-template>
//                     <ng-template pTemplate="emptymessage">
//                       <tr><td colspan="4" class="text-center py-6 text-success font-bold"><i class="pi pi-check-circle mr-2"></i> No violations recorded.</td></tr>
//                     </ng-template>
//                   </p-table>
//                 </div>
//               </p-tabpanel>

//             </p-tabpanels>
//           </p-tabs>
//         </p-card>
//       }
//     </div>
//   `,
//   styles: [`
//     /* Core layout styling matching previous components */
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .justify-end { justify-content: flex-end; }
    
//     .w-max { width: max-content; }
//     .w-15rem { width: 15rem; }
//     .h-full { height: 100%; }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
    
//     .m-0 { margin: 0; }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mr-1 { margin-right: var(--spacing-xs); }
//     .mr-2 { margin-right: var(--spacing-sm); }
    
//     .p-0 { padding: 0 !important; }
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .bg-primary { background: var(--color-primary); color: white; }
//     .bg-error-faded { background-color: rgba(239, 68, 68, 0.02); }
    
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .manish-border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-error { border-color: rgba(239, 68, 68, 0.2) !important; }
//     .border-round-xl { border-radius: var(--radius-2xl); }
    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-error { color: var(--color-error); }
//     .text-success { color: var(--color-success); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-heading { font-family: var(--font-heading); }
//     .capitalize { text-transform: capitalize; }
//     .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

//     /* Header & Cards */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
//     .header-titles { display: flex; flex-direction: column; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    
//     ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-bold) !important; transition: var(--transition-base); }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

//     /* Table */
//     ::ng-deep .premium-search-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-md) !important; width: 250px; }
//     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
//     ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
//     ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
//     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
//   `]
// })
// export class GeofenceHubComponent implements OnInit {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   private router = inject(Router);

//   isLoading = signal(true);
//   geofences = signal<any[]>([]);
//   violations = signal<any[]>([]);

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.isLoading.set(true);

//     forkJoin({
//       fences: this.hrmsService.getGeoFences().pipe(catchError(() => of({ data: { geofences: [] } }))),
//       viols: this.hrmsService.getGeoFenceViolations().pipe(catchError(() => of({ data: [] })))
//     }).pipe(
//       finalize(() => this.isLoading.set(false))
//     ).subscribe(({ fences, viols }) => {
//       this.geofences.set(fences?.data?.geofences || []);
//       // Assuming viols returns an array directly, adjust to API response
//       this.violations.set(Array.isArray(viols?.data) ? viols.data : []); 
//     });
//   }

//   onCreate() {
//     this.router.navigate(['/hrms/geofence/new']);
//   }

//   onEdit(id: string) {
//     this.router.navigate(['/hrms/geofence/edit', id]);
//   }

//   onManage(id: string) {
//     this.router.navigate(['/hrms/geofence/details', id]);
//   }

//   onDelete(fence: any) {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete the geofence <b>${fence.name}</b>? Employees will no longer be restricted to this location.`,
//       header: 'Delete Boundary',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.hrmsService.deleteGeoFence(fence._id).subscribe({
//           next: (res:any) => {
//             this.messageService.showSuccess(res.message);
//             this.loadData();
//           }
//         });
//       }
//     });
//   }
// }