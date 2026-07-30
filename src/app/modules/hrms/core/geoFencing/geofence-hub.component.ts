import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, Subject } from 'rxjs';

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
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-geofence-hub',
  standalone: true,
  imports: [
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
      styleClass="apex-card border-0 shadow-xl" 
      acceptButtonStyleClass="apex-btn apex-btn--primary bg-error border-error" 
      rejectButtonStyleClass="apex-btn apex-btn--secondary" appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}">
    </p-confirmDialog>

    <div class="apex-page fade-in flex-col h-screen">
      
      <header class="apex-header apex-header--elevated flex-shrink-0 flex-wrap gap-4">
        <div class="flex-align gap-4">
          <div class="apex-card__icon bg-primary text-white" style="width: 48px; height: 48px; font-size: 20px;">
            <i class="pi pi-map"></i>
          </div>
          <div class="flex-col">
            <h1 class="apex-page-header__title m-0" style="font-size: var(--font-size-2xl);">Geofence Command Center</h1>
            <p class="apex-page-header__subtitle m-0 text-sm text-tertiary">Manage virtual boundaries, track location violations, and enforce site attendance.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3 ml-auto">
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
            styleClass="apex-btn apex-btn--primary" 
            (onClick)="onCreate()">
          </p-button>
        </div>
      </header>

      <main class="apex-content flex-1 overflow-auto flex-col p-4 sm:p-5">
        @if (isLoading()) {
          <p-skeleton width="100%" height="500px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
        } @else {
          <div class="apex-card apex-card--surface p-0 slide-down border-0 h-full flex-col" style="animation-delay: 0.1s">
            <p-tabs value="0" class="flex-col h-full">
              
              <p-tablist styleClass="hub-tablist">
                <p-tab value="0">
                  <div class="tab-label">
                    <i class="pi pi-check-circle"></i> Active Geofences
                  </div>
                </p-tab>
                <p-tab value="1">
                  <div class="tab-label text-error">
                    <i class="pi pi-exclamation-triangle"></i> Violation Reports
                  </div>
                </p-tab>
              </p-tablist>

              <p-tabpanels styleClass="hub-tabpanels p-0 flex-1 overflow-hidden">
                
                <p-tabpanel value="0" class="h-full">
                  <div class="panel-content p-4 flex-col h-full gap-4">
                    
                    <div class="flex-between flex-wrap gap-4 px-4 py-3 bg-secondary border-radius-lg border border-primary">
                      <h3 class="m-0 font-heading text-lg font-bold text-primary-color">Established Boundaries</h3>
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

                    <div class="grid-wrapper w-full flex-1 border-radius-lg border border-primary overflow-hidden" style="min-height: 400px;">
                      <app-ag-share-grid 
                        [columns]="geofenceColumns" 
                        [data]="geofences()"
                        (gridEvent)="onGeofenceGridEvent($event)">
                      </app-ag-share-grid>
                    </div>
                    
                  </div>
                </p-tabpanel>

                <p-tabpanel value="1" class="h-full">
                  <div class="panel-content p-4 bg-error-faded h-full flex-col gap-4">
                    
                    <div class="flex-between flex-wrap gap-4">
                      <div class="flex-align gap-3">
                        <i class="pi pi-shield text-error text-2xl"></i>
                        <div class="flex-col">
                          <h3 class="m-0 font-heading text-lg font-bold text-error">Out-of-Bounds Punches</h3>
                          <span class="text-sm text-secondary">Showing violation data for the last 30 days.</span>
                        </div>
                      </div>
                    </div>

                    <div class="grid-wrapper w-full flex-1 border-radius-lg border border-error overflow-hidden" style="min-height: 400px;">
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
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block; 
      width: 100%; 
      height: 100vh;
      overflow: hidden;
    }

    /* Utility Helpers */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1; }
    .flex-wrap { flex-wrap: wrap; }
    .ml-auto { margin-left: auto; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .h-screen { height: 100vh; }
    .h-full { height: 100%; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mx-2 { margin-left: var(--spacing-sm); margin-right: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .pb-3 { padding-bottom: var(--spacing-lg); }
    .py-3 { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .px-4 { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-error-faded { background-color: rgba(239, 68, 68, 0.02); }
    
    .border { border: 1px solid var(--border-primary); }
    .border-0 { border: none !important; }
    .border-error { border-color: color-mix(in srgb, var(--color-error) 40%, transparent) !important; }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .text-white { color: white; }
    
    .font-normal { font-weight: normal; }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-semibold { font-weight: var(--font-weight-semibold); }
    .font-heading { font-family: var(--font-heading); }
    
    .overflow-hidden { overflow: hidden; }
    .overflow-auto { overflow-y: auto; overflow-x: hidden; }

    /* Tabs Override */
    ::ng-deep .hub-tablist .p-tablist-nav { background: transparent !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab:nth-child(2).p-highlight { border-bottom-color: var(--color-error) !important; color: var(--color-error) !important; }
    ::ng-deep .hub-tabpanels { background: transparent !important; display: flex; flex-direction: column; }
    ::ng-deep .hub-tabpanels .p-tabpanel { display: flex; flex-direction: column; flex: 1; height: 100%; }
    .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

    /* Input */
    ::ng-deep .premium-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-lg) !important; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (min-width: 640px) {
      .sm\\:p-5 { padding: var(--spacing-2xl); }
      .sm\\:w-20rem { width: 20rem; }
    }
  `]
})
export class GeofenceHubComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
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
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
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
        this.hrmsService.deleteGeoFence(fence._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message || 'Geofence deleted successfully.');
            this.loadData();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}