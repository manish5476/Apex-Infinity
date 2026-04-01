import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-machine-hub',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, CardModule, TableModule,
    ButtonModule, TagModule, TooltipModule, SkeletonModule,
    DialogModule, SelectModule, IconFieldModule, InputIconModule, InputTextModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-4">
        <div class="header-left">
          <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-server"></i></div>
          <div class="header-titles">
            <h1 class="page-title m-0">Device Fleet Management</h1>
            <p class="page-subtitle mt-1">Monitor, configure, and manage biometric and RFID attendance machines.</p>
          </div>
        </div>
        <div class="header-right flex-align gap-3">
          <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" pTooltip="Refresh Fleet" (onClick)="loadData()"></p-button>
          <p-button label="Register Device" icon="pi pi-plus" styleClass="p-button-primary" (onClick)="onAddMachine()"></p-button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="grid-4 mb-4">
          <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
        </div>
        <p-skeleton height="400px" borderRadius="12px"></p-skeleton>
      } @else {
        
        @if (analytics(); as a) {
          <div class="grid-4 mb-4 slide-down" styleClass="animation-delay: 0.1s">
            <p-card styleClass="stat-card border-left-primary">
              <span class="stat-label">Total Devices</span>
              <div class="stat-val text-primary mt-2">{{ a.totalMachines || 0 }}</div>
            </p-card>
            <p-card styleClass="stat-card border-left-success">
              <span class="stat-label">Online & Active</span>
              <div class="flex-align gap-2 mt-2">
                <div class="pulse-dot bg-success"></div>
                <span class="stat-val text-success">{{ a.onlineMachines || 0 }}</span>
              </div>
            </p-card>
            <p-card styleClass="stat-card border-left-error">
              <span class="stat-label">Offline / Errors</span>
              <div class="flex-align gap-2 mt-2">
                <i class="pi pi-exclamation-triangle text-error text-xl"></i>
                <span class="stat-val text-error">{{ a.offlineMachines || 0 }}</span>
              </div>
            </p-card>
            <p-card styleClass="stat-card border-left-info">
              <span class="stat-label">Transactions (24h)</span>
              <div class="stat-val text-info mt-2">{{ a.transactions24h || 0 }}</div>
            </p-card>
          </div>
        }

        <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.2s">
          <p-table 
            #dt
            [value]="machines()" 
            [(selection)]="selectedMachines"
            dataKey="_id"
            [paginator]="true" 
            [rows]="10" 
            [globalFilterFields]="['name', 'serialNumber', 'ipAddress', 'model']"
            responsiveLayout="scroll"
            styleClass="premium-table border-round-xl manish-border-1 surface-border">
            
            <ng-template pTemplate="caption">
              <div class="table-toolbar flex-between p-3 bg-surface border-bottom">
                <div class="flex-align gap-3">
                  <h3 class="m-0 font-heading text-primary-color flex-align gap-2"><i class="pi pi-list"></i> Registered Devices</h3>
                  @if (selectedMachines.length > 0) {
                    <p-button label="Bulk Action" icon="pi pi-cog" severity="warn" size="small" (onClick)="displayBulkDialog = true"></p-button>
                  }
                </div>
                <p-iconField iconPosition="left">
                  <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                  <input type="text" pInputText placeholder="Search IP, Serial..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
                </p-iconField>
              </div>
            </ng-template>

            <ng-template pTemplate="header">
              <tr>
                <th styleClass="width: 3rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                <th>Device Info</th>
                <th>Network & Protocol</th>
                <th class="text-center">Connection</th>
                <th>Last Sync</th>
                <th class="text-right">Manage</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-machine>
              <tr class="table-row-hover">
                <td><p-tableCheckbox [value]="machine"></p-tableCheckbox></td>
                <td>
                  <div class="flex-col gap-1">
                    <span class="font-bold text-primary-color flex-align gap-2">
                      <i class="pi" [ngClass]="getProviderIcon(machine.providerType)"></i> {{ machine.name }}
                    </span>
                    <span class="badge-mono-sm w-max">SN: {{ machine.serialNumber }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex-col gap-1">
                    <span class="font-mono text-sm text-secondary">{{ machine.ipAddress || 'DHCP' }}<span *ngIf="machine.port">:{{ machine.port }}</span></span>
                    <span class="text-xs text-tertiary uppercase font-bold">{{ machine.connectionProtocol }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <p-tag [severity]="getConnectionSeverity(machine.connectionStatus)" styleClass="status-tag">
                    <div class="flex-align gap-1">
                      <div class="status-dot" [ngClass]="machine.connectionStatus"></div>
                      {{ machine.connectionStatus | uppercase }}
                    </div>
                  </p-tag>
                </td>
                <td>
                  <div class="flex-col gap-1 text-sm text-secondary font-medium">
                    <span *ngIf="machine.lastSyncAt"><i class="pi pi-clock text-xs text-tertiary mr-1"></i> {{ machine.lastSyncAt | date:'dd MMM, HH:mm' }}</span>
                    <span *ngIf="!machine.lastSyncAt" class="text-tertiary italic">Never synced</span>
                    <span class="text-xs text-tertiary" *ngIf="machine.lastPingAt">Ping: {{ machine.lastPingAt | date:'HH:mm:ss' }}</span>
                  </div>
                </td>
                <td class="text-right">
                  <p-button icon="pi pi-cog" [text]="true" [rounded]="true" severity="secondary" pTooltip="Inspect & Map" (onClick)="onInspect(machine._id)"></p-button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="6" class="text-center py-6 text-secondary">No devices registered. Click 'Register Device' to begin.</td></tr>
            </ng-template>
          </p-table>
        </p-card>
      }
    </div>

    <p-dialog header="Bulk Device Status Update" [(visible)]="displayBulkDialog" [modal]="true" [style]="{width: '400px'}" styleClass="premium-dialog">
      <p class="text-sm text-secondary mb-4">Change the administrative status for <b>{{ selectedMachines.length }}</b> selected devices.</p>
      <div class="flex-col gap-4">
        <div class="input-group">
          <label class="info-label">New Status</label>
          <p-select [(ngModel)]="bulkStatus" [options]="statusOptions" placeholder="Select Status" appendTo="body" styleClass="w-full premium-select" [filter]="true" filterBy="label"></p-select>

        </div>
        <div class="flex-align justify-end gap-3 pt-4 border-top mt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayBulkDialog = false"></p-button>
          <p-button label="Apply Update" icon="pi pi-check" severity="warn" [loading]="isProcessing()" [disabled]="!bulkStatus" (onClick)="submitBulkUpdate()"></p-button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1500px; margin: 0 auto; }
    
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing-xl); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mr-1 { margin-right: var(--spacing-xs); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .pt-4 { padding-top: var(--spacing-xl); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    .bg-success { background: var(--color-success); }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .manish-border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-round-xl { border-radius: var(--radius-2xl); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-xl { font-size: var(--font-size-xl); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-warning { color: var(--color-warning); }
    .text-error { color: var(--color-error); }
    .text-info { color: #0ea5e9; }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); }
    .uppercase { text-transform: uppercase; }
    .italic { font-style: italic; }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

    /* KPIs */
    ::ng-deep .stat-card.p-card { border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); }
    ::ng-deep .stat-card .p-card-body { padding: var(--spacing-xl); }
    .border-left-primary { border-left: 4px solid var(--color-primary) !important; }
    .border-left-success { border-left: 4px solid var(--color-success) !important; }
    .border-left-warning { border-left: 4px solid var(--color-warning) !important; }
    .border-left-error { border-left: 4px solid var(--color-error) !important; }
    .border-left-info { border-left: 4px solid #0ea5e9 !important; }
    .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-val { font-size: 2.2rem; font-weight: var(--font-weight-bold); line-height: 1; }

    /* Table */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

    ::ng-deep .premium-search-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-md) !important; width: 250px; }
    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

    /* Connection Indicators */
    ::ng-deep .status-tag { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.online { background-color: var(--color-success); box-shadow: 0 0 0 2px var(--color-success-bg); }
    .status-dot.offline { background-color: var(--color-error); box-shadow: 0 0 0 2px var(--color-error-bg); }
    .status-dot.connecting { background-color: var(--color-warning); animation: pulse 1s infinite; }
    
    .pulse-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); animation: pulse-success 2s infinite; }
    @keyframes pulse-success { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    /* Dialog */
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); }
    ::ng-deep .premium-select .p-select { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class MachineHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  isLoading = signal(true);
  machines = signal<any[]>([]);
  analytics = signal<any>(null);

  // Bulk actions
  selectedMachines: any[] = [];
  displayBulkDialog = false;
  bulkStatus: string | null = null;
  isProcessing = signal(false);

  statusOptions = [
    { label: 'Active (Allow Sync)', value: 'active' },
    { label: 'Maintenance Mode', value: 'maintenance' },
    { label: 'Inactive (Block Sync)', value: 'inactive' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.selectedMachines = [];

    forkJoin({
      list: this.hrmsService.getMachines().pipe(catchError(() => of({ data: { machines: [] } }))),
      stats: this.hrmsService.getMachineAnalytics().pipe(catchError(() => of({ data: { totalMachines: 0, onlineMachines: 0, offlineMachines: 0, transactions24h: 0 } })))
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ list, stats }) => {
      this.machines.set(list?.data?.machines || []);
      this.analytics.set(stats?.data || {});
    });
  }

  onAddMachine() {
    this.router.navigate(['hrms/attendance/machines/new']);
  }

  onInspect(id: string) {
    this.router.navigate(['hrms/attendance/machines/details', id]);
  }

  submitBulkUpdate() {
    if (!this.bulkStatus || this.selectedMachines.length === 0) return;
    this.isProcessing.set(true);

    const ids = this.selectedMachines.map(m => m._id);

    this.hrmsService.bulkUpdateMachineStatus({ machineIds: ids, status: this.bulkStatus }).pipe(
      finalize(() => {
        this.isProcessing.set(false);
        this.displayBulkDialog = false;
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      })
    ).subscribe((res: any) => {
      if (res) {
        this.loadData();
      }
    });
  }

  // --- UI Helpers ---
  getProviderIcon(provider: string): string {
    switch (provider) {
      case 'zkteco': return 'pi-box';
      case 'hikvision': return 'pi-camera';
      case 'essl': return 'pi-id-card';
      default: return 'pi-server';
    }
  }

  getConnectionSeverity(status: string): any {
    switch (status) {
      case 'online': return 'success';
      case 'connecting': return 'warning';
      case 'offline': case 'disconnected': return 'danger';
      default: return 'info';
    }
  }
}