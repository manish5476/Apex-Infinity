import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { HRMSService } from '../../hrms.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-geofence-hub',
  standalone: true,
  imports: [
    CommonModule, CardModule, TableModule, ButtonModule, TagModule, TabsModule,
    SkeletonModule, TooltipModule, ConfirmDialogModule, IconFieldModule, 
    InputIconModule, InputTextModule,ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

    <div class="page-wrapper fade-in">
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-map"></i></div>
          <div class="header-titles">
            <h1 class="page-title m-0">Geofence Command Center</h1>
            <p class="page-subtitle mt-1">Manage virtual boundaries, track location violations, and enforce site attendance.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3">
          <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" (onClick)="loadData()"></p-button>
          <p-button label="Create Boundary" icon="pi pi-map-marker" styleClass="p-button-primary shadow-sm" (onClick)="onCreate()"></p-button>
        </div>
      </header>

      @if (isLoading()) {
        <p-skeleton width="100%" height="500px" borderRadius="12px"></p-skeleton>
      } @else {
        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
          <p-tabs value="0">
            <p-tablist styleClass="hub-tablist">
              <p-tab value="0"><div class="tab-label"><i class="pi pi-check-circle"></i> Active Geofences</div></p-tab>
              <p-tab value="1"><div class="tab-label text-error"><i class="pi pi-exclamation-triangle"></i> Violation Reports</div></p-tab>
            </p-tablist>

            <p-tabpanels styleClass="hub-tabpanels p-0">
              
              <p-tabpanel value="0">
                <div class="panel-inner p-4">
                  <p-table 
                    #dt
                    [value]="geofences()" 
                    [paginator]="true" 
                    [rows]="10" 
                    [globalFilterFields]="['name', 'code', 'type']"
                    responsiveLayout="scroll"
                    styleClass="premium-table border-round-xl border-1 surface-border">
                    
                    <ng-template pTemplate="caption">
                      <div class="flex-between p-3 bg-surface border-bottom">
                        <h3 class="m-0 font-heading text-primary-color">Established Boundaries</h3>
                        <p-iconField iconPosition="left">
                          <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                          <input type="text" pInputText placeholder="Search fences..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
                        </p-iconField>
                      </div>
                    </ng-template>

                    <ng-template pTemplate="header">
                      <tr>
                        <th>Boundary Identity</th>
                        <th>Type & Reach</th>
                        <th>Address / Location</th>
                        <th class="text-center">Status</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-fence>
                      <tr class="table-row-hover">
                        <td>
                          <div class="flex-col gap-1">
                            <span class="font-bold text-primary-color text-lg">{{ fence.name }}</span>
                            <span class="badge-mono-sm w-max">{{ fence.code }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="flex-col gap-1">
                            <span class="capitalize font-bold text-secondary flex-align gap-2">
                              <i class="pi" [ngClass]="fence.type === 'circle' ? 'pi-circle' : 'pi-stop'"></i> {{ fence.type }}
                            </span>
                            <span *ngIf="fence.type === 'circle'" class="text-xs text-tertiary">Radius: {{ fence.radius }}m</span>
                          </div>
                        </td>
                        <td>
                          <div class="text-sm text-secondary truncate w-15rem" [pTooltip]="fence.address?.line1 + ', ' + fence.address?.city">
                            <i class="pi pi-map-marker text-tertiary mr-1"></i>
                            {{ fence.address?.city || 'Coordinates Only' }}
                          </div>
                        </td>
                        <td class="text-center">
                          <p-tag [severity]="fence.isActive ? 'success' : 'danger'" [value]="fence.isActive ? 'Active' : 'Disabled'"></p-tag>
                        </td>
                        <td class="text-right">
                          <div class="flex-align justify-end gap-2">
                            <p-button icon="pi pi-cog" [text]="true" [rounded]="true" severity="secondary" pTooltip="Manage Assignments" (onClick)="onManage(fence._id)"></p-button>
                            <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="info" pTooltip="Edit Fence" (onClick)="onEdit(fence._id)"></p-button>
                            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Delete Fence" (onClick)="onDelete(fence)"></p-button>
                          </div>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="5" class="text-center py-6 text-secondary">No geofences found. Create one to start securing check-ins.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-inner p-4 bg-error-faded h-full">
                  <div class="flex-between mb-4">
                    <h3 class="m-0 font-heading text-error flex-align gap-2"><i class="pi pi-shield"></i> Out-of-Bounds Punches</h3>
                    <span class="text-sm text-secondary">Showing data for the last 30 days.</span>
                  </div>
                  
                  <p-table 
                    [value]="violations()" 
                    [paginator]="true" 
                    [rows]="10" 
                    styleClass="premium-table border-round-xl border-1 border-error">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Date & Time</th>
                        <th>Employee</th>
                        <th>Assigned Fence</th>
                        <th class="text-right">Distance from Zone</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-v>
                      <tr class="table-row-hover">
                        <td class="font-mono text-sm font-bold">{{ v.timestamp | date:'dd MMM, HH:mm:ss' }}</td>
                        <td class="font-bold text-primary-color">{{ v.user?.name }}</td>
                        <td class="text-secondary">{{ v.expectedGeofence?.name || 'N/A' }}</td>
                        <td class="text-right font-bold text-error">{{ v.distanceVariance }} meters</td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="4" class="text-center py-6 text-success font-bold"><i class="pi pi-check-circle mr-2"></i> No violations recorded.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
  `,
  styles: [`
    /* Core layout styling matching previous components */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    
    .w-max { width: max-content; }
    .w-15rem { width: 15rem; }
    .h-full { height: 100%; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    
    .m-0 { margin: 0; }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mr-1 { margin-right: var(--spacing-xs); }
    .mr-2 { margin-right: var(--spacing-sm); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    .bg-error-faded { background-color: rgba(239, 68, 68, 0.02); }
    
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-error { border-color: rgba(239, 68, 68, 0.2) !important; }
    .border-round-xl { border-radius: var(--ui-border-radius-xl); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-error { color: var(--color-error); }
    .text-success { color: var(--color-success); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); }
    .capitalize { text-transform: capitalize; }
    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

    /* Header & Cards */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .header-titles { display: flex; flex-direction: column; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    
    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-bold) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

    /* Table */
    ::ng-deep .premium-search-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-md) !important; width: 250px; }
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class GeofenceHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  isLoading = signal(true);
  geofences = signal<any[]>([]);
  violations = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      fences: this.hrmsService.getGeoFences().pipe(catchError(() => of({ data: { geofences: [] } }))),
      viols: this.hrmsService.getGeoFenceViolations().pipe(catchError(() => of({ data: [] })))
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ fences, viols }) => {
      this.geofences.set(fences?.data?.geofences || []);
      // Assuming viols returns an array directly, adjust to API response
      this.violations.set(Array.isArray(viols?.data) ? viols.data : []); 
    });
  }

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
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrmsService.deleteGeoFence(fence._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Geofence removed successfully.' });
            this.loadData();
          }
        });
      }
    });
  }
}