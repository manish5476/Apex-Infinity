import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-machine-details',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, CardModule, ButtonModule,
    TagModule, TabsModule, TableModule, SkeletonModule, TooltipModule,
    DialogModule, InputTextModule, ConfirmDialogModule,ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

    <div class="page-wrapper fade-in">
      
      @if (isLoading()) {
        <div class="flex-col gap-4">
          <p-skeleton height="120px" borderRadius="12px"></p-skeleton>
          <p-skeleton height="500px" borderRadius="12px"></p-skeleton>
        </div>
      } @else if (machine(); as dev) {
        
        <header class="dashboard-header slide-down mb-5">
          <div class="header-left flex-align gap-4">
            <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
            <div class="icon-brand bg-primary-light text-primary shadow-sm"><i class="pi pi-server"></i></div>
            <div class="header-titles">
              <div class="flex-align gap-3">
                <h1 class="page-title m-0">{{ dev.name }}</h1>
                <p-tag [severity]="getConnectionSeverity(dev.connectionStatus)" [value]="dev.connectionStatus | uppercase" styleClass="status-tag"></p-tag>
              </div>
              <p class="page-subtitle mt-1 font-mono text-xs">
                SN: {{ dev.serialNumber }} | IP: {{ dev.ipAddress || 'DHCP' }} | Last Ping: {{ dev.lastPingAt ? (dev.lastPingAt | date:'HH:mm:ss') : 'Never' }}
              </p>
            </div>
          </div>
          <div class="header-right flex-align gap-2">
            <p-button label="Test Connection" icon="pi pi-wifi" severity="info" [outlined]="true" [loading]="isTesting()" (onClick)="testConnection()"></p-button>
            <p-button icon="pi pi-cog" [text]="true" [rounded]="true" severity="secondary" pTooltip="Device Settings" (onClick)="onEdit()"></p-button>
            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" pTooltip="Delete Device" (onClick)="deleteDevice()"></p-button>
          </div>
        </header>

        <div class="grid-3 mb-5 slide-down" style="animation-delay: 0.1s">
          <p-card styleClass="premium-card p-3">
            <div class="flex-between">
              <div class="flex-col gap-1">
                <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Transactions</span>
                <span class="text-2xl font-bold text-primary">{{ dev.stats?.totalTransactions || 0 }}</span>
              </div>
              <i class="pi pi-database text-3xl text-primary opacity-20"></i>
            </div>
          </p-card>
          <p-card styleClass="premium-card p-3">
            <div class="flex-between h-full">
              <div class="flex-col gap-1">
                <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Device Status</span>
                <span class="text-lg font-bold" [ngClass]="dev.status === 'active' ? 'text-success' : 'text-warning'">{{ dev.status | titlecase }}</span>
              </div>
              <p-button label="Regenerate API Key" icon="pi pi-key" severity="warn" [text]="true" size="small" (onClick)="regenerateKey()"></p-button>
            </div>
          </p-card>
          <p-card styleClass="premium-card p-3">
            <div class="flex-col gap-1">
               <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Capabilities</span>
               <div class="flex-align flex-wrap gap-2 mt-2">
                 <p-tag *ngIf="dev.capabilities?.faceRecognition" value="Face" severity="info"></p-tag>
                 <p-tag *ngIf="dev.capabilities?.fingerprint" value="Fingerprint" severity="info"></p-tag>
                 <p-tag *ngIf="dev.capabilities?.rfid" value="RFID" severity="info"></p-tag>
               </div>
            </div>
          </p-card>
        </div>

        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.2s">
          <p-tabs value="0">
            <p-tablist styleClass="hub-tablist">
              <p-tab value="0"><div class="tab-label"><i class="pi pi-users"></i> User Mapping</div></p-tab>
              <p-tab value="1"><div class="tab-label"><i class="pi pi-list"></i> Raw Device Logs</div></p-tab>
            </p-tablist>

            <p-tabpanels styleClass="hub-tabpanels p-0">
              
              <p-tabpanel value="0">
                <div class="panel-inner p-4">
                  <div class="flex-between mb-4 bg-primary-light p-3 border-radius-md border-1 surface-border">
                    <div class="flex-col">
                      <h3 class="m-0 text-primary-color font-bold flex-align gap-2"><i class="pi pi-link"></i> Map HRMS Users to Machine IDs</h3>
                      <p class="m-0 text-sm text-secondary mt-1">Assign the physical machine ID (e.g., Biometric Enrolment ID) to unmapped system users.</p>
                    </div>
                    <p-button label="Save Mappings" icon="pi pi-save" styleClass="p-button-primary" [loading]="isMapping()" (onClick)="saveBulkMappings()"></p-button>
                  </div>

                  <p-table 
                    [value]="unmappedUsers()" 
                    [paginator]="true" 
                    [rows]="10" 
                    responsiveLayout="scroll"
                    styleClass="premium-table border-round-xl border-1 surface-border">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>HRMS Employee</th>
                        <th>Designation</th>
                        <th>Email / Phone</th>
                        <th style="width: 250px">Machine User ID <span class="text-error">*</span></th>
                        <th class="text-center" style="width: 5rem">Status</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-user>
                      <tr class="table-row-hover">
                        <td class="font-bold text-primary-color">{{ user.name }}</td>
                        <td class="text-sm text-secondary">{{ user.employeeProfile?.designation || 'N/A' }}</td>
                        <td class="text-sm text-secondary">{{ user.email }}</td>
                        <td>
                          <input pInputText type="text" [(ngModel)]="user.machineUserId" placeholder="Enter ID from Machine" class="w-full premium-input font-mono" />
                        </td>
                        <td class="text-center">
                          <i class="pi" [ngClass]="user.machineUserId ? 'pi-check-circle text-success' : 'pi-circle text-tertiary'"></i>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="5" class="text-center py-6 text-secondary">All active employees are mapped. No unmapped users found.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-inner p-4">
                  <p-table 
                    [value]="deviceLogs()" 
                    [paginator]="true" 
                    [rows]="10" 
                    responsiveLayout="scroll"
                    styleClass="premium-table border-round-xl border-1 surface-border">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Timestamp</th>
                        <th>Identified User</th>
                        <th>Punch Type</th>
                        <th class="text-center">Confidence</th>
                        <th class="text-right">Processing</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-log>
                      <tr class="table-row-hover">
                        <td class="font-mono text-sm text-secondary font-bold">{{ log.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}</td>
                        <td class="font-bold text-primary-color">{{ log.user?.name || 'Unknown User' }}</td>
                        <td class="capitalize font-bold flex-align gap-2">
                          <i class="pi" [ngClass]="log.type.includes('in') ? 'pi-sign-in text-success' : 'pi-sign-out text-error'"></i> 
                          {{ log.type.replace('_', ' ') }}
                        </td>
                        <td class="text-center font-mono" [ngClass]="{'text-success': log.biometricData?.confidence > 80, 'text-warning': log.biometricData?.confidence <= 80}">
                          {{ log.biometricData?.confidence || '100' }}%
                        </td>
                        <td class="text-right">
                          <p-tag [severity]="log.processingStatus === 'processed' ? 'success' : 'warn'" [value]="log.processingStatus | uppercase"></p-tag>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan=" 5" class="text-center py-6 text-secondary">No logs recorded by this device yet.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>

    <p-dialog header="New API Key Generated" [(visible)]="displayKeyModal" [modal]="true" [closable]="false" [style]="{width: '450px'}" styleClass="premium-dialog">
      <div class="text-center mb-4">
        <i class="pi pi-exclamation-triangle text-warning text-5xl mb-3"></i>
        <h3 class="m-0 font-heading">Security Key Rotated</h3>
      </div>
      <p class="text-sm text-secondary mb-4 text-center">
        The previous API key for this device has been invalidated. Please update your device/sync utility with this new key immediately.
      </p>
      <div class="bg-surface p-4 border-radius-md border-1 surface-border flex-between mb-4">
        <code class="font-bold text-primary-color break-all">{{ newApiKey }}</code>
        <p-button icon="pi pi-copy" [text]="true" [rounded]="true" pTooltip="Copy" (onClick)="copyKey()"></p-button>
      </div>
      <div class="flex-align justify-center border-top pt-4">
        <p-button label="Acknowledge & Close" styleClass="p-button-primary" (onClick)="displayKeyModal = false"></p-button>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-center { justify-content: center; }
    .flex-wrap { flex-wrap: wrap; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .m-0 { margin: 0; }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: 2rem; }
    .text-5xl { font-size: 3rem; }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); }
    .tracking-wide { letter-spacing: 0.05em; }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .break-all { word-break: break-all; }
    .opacity-20 { opacity: 0.2; }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
    .icon-brand { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; border: 1px solid var(--color-primary-border); }
    .header-titles { display: flex; flex-direction: column; }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    ::ng-deep .status-tag { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 4px 8px; border-radius: 6px; }

    /* Cards & Tabs */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .premium-card { border-radius: var(--ui-border-radius-lg); border: 1px solid var(--border-primary); box-shadow: var(--shadow-sm); }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    
    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

    /* Table & Inputs */
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }
    
    ::ng-deep .premium-input { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-mono); font-size: var(--font-size-sm); }
    ::ng-deep .premium-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .header-right { flex-direction: column; }
      ::ng-deep .p-button { width: 100%; justify-content: center; }
    }
  `]
})
export class MachineDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  machineId: string = '';
  machine = signal<any>(null);
  isLoading = signal<boolean>(true);

  // Connection State
  isTesting = signal<boolean>(false);

  // Tab 0 State (Mapping)
  unmappedUsers = signal<any[]>([]);
  isMapping = signal<boolean>(false);

  // Tab 1 State (Logs)
  deviceLogs = signal<any[]>([]);

  // Key Regeneration Modal
  displayKeyModal = false;
  newApiKey = '';

  ngOnInit() {
    this.machineId = this.route.snapshot.paramMap.get('id') || '';
    if (this.machineId) {
      this.loadAllData();
    } else {
      this.onBack();
    }
  }

  loadAllData() {
    this.isLoading.set(true);

    forkJoin({
      machineData: this.hrmsService.getMachine(this.machineId).pipe(catchError(() => of(null))),
      logsData: this.hrmsService.getMachineLogs(this.machineId).pipe(catchError(() => of({ data: { logs: [] } }))),
      unmappedData: this.hrmsService.getUnmappedUsers().pipe(catchError(() => of({ data: { users: [] } })))
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ machineData, logsData, unmappedData }) => {
      if (machineData?.data?.machine) {
        this.machine.set(machineData.data.machine);
      } else {
        this.messageService.showError( 'Device not found.' );
        this.onBack();
      }
      
      this.deviceLogs.set(logsData?.data?.logs || []);
      
      // Initialize unmapped users with an empty machineUserId field for the UI input
      const users = (unmappedData?.data?.users || []).map((u: any) => ({ ...u, machineUserId: '' }));
      this.unmappedUsers.set(users);
    });
  }

  // --- API Action: Test Connection ---
  testConnection() {
    this.isTesting.set(true);
    this.hrmsService.testMachineConnection(this.machineId).pipe(
      finalize(() => this.isTesting.set(false)),
      catchError(err => {
        this.messageService.handleHttpError(err)
        // Update local state to offline
        this.machine.update(m => ({ ...m, connectionStatus: 'offline' }));
        return of(null);
      })
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        // Optionally reload data to get updated lastPingAt
        this.loadAllData();
      }
    });
  }

  // --- API Action: Bulk Map Users ---
  saveBulkMappings() {
    // Filter out users where the admin actually typed in a machine ID
    const filledMappings = this.unmappedUsers()
      .filter(u => u.machineUserId && u.machineUserId.trim() !== '')
      .map(u => ({ userId: u._id, machineUserId: u.machineUserId.trim() }));

    if (filledMappings.length === 0) {
      this.messageService.showInfo('Please enter at least one Machine User ID to map.' ) 
      return;
    }

    this.isMapping.set(true);
    
    this.hrmsService.bulkMapUsers(filledMappings, this.machineId).pipe(
      finalize(() => this.isMapping.set(false)),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      })
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.loadAllData(); // Reload to clear mapped users from the unmapped list
      }
    });
  }

  // --- API Action: Regenerate Key ---
  regenerateKey() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to regenerate the API key? The device will instantly lose sync capabilities until you update it with the new key.',
      header: 'Security Warning',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrmsService.regenerateMachineApiKey(this.machineId).subscribe({
          next: (res: any) => {
            if (res?.data?.apiKey) {
              this.newApiKey = res.data.apiKey;
              this.displayKeyModal = true;
            }
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  // --- API Action: Delete ---
  deleteDevice() {
    this.confirmationService.confirm({
      message: 'Delete this device configuration permanently? This will not delete historical logs associated with it.',
      header: 'Confirm Deletion',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrmsService.deleteMachine(this.machineId).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message)
            this.onBack();
          }
        });
      }
    });
  }

  // --- Helpers ---
  copyKey() {
    navigator.clipboard.writeText(this.newApiKey).then(() => {
      this.messageService.showInfo('API Key copied to clipboard.')
    });
  }

  onBack() { this.router.navigate(['hrms/attendance/machines']); }
  onEdit() { this.router.navigate(['hrms/attendance/machines/edit', this.machineId]); }

  getConnectionSeverity(status: string): any {
    switch (status) {
      case 'online': return 'success';
      case 'connecting': return 'warning';
      case 'offline': case 'disconnected': return 'danger';
      default: return 'info';
    }
  }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { finalize } from 'rxjs';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-machine-details',
//   standalone: true,
//   imports: [CommonModule],
//   providers: [DatePipe],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
      
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" (click)="goBack()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
          
//           @if (machine(); as m) {
//             <div>
//               <div style="display: flex; align-items: center; gap: 12px;">
//                 <h1 class="page-title">{{ m.name }}</h1>
//                 <span class="status-badge" [class.online]="m.connectionStatus === 'online'" [class.offline]="m.connectionStatus !== 'online'">
//                   {{ m.connectionStatus | titlecase }}
//                 </span>
//               </div>
//               <p class="page-subtitle">{{ m.serialNumber }} • {{ m.branchId?.name || 'Unassigned Branch' }}</p>
//             </div>
//           }
//         </div>
        
//         <div class="header-right">
//           <button class="btn btn-outline" (click)="testConnection()">Test Connection</button>
//           <button class="btn btn-outline" (click)="regenerateKey()">Reset Key</button>
//           <button class="btn btn-primary" (click)="editMachine()">Edit</button>
//         </div>
//       </header>

//       <main class="dashboard-content">
//         @if (machine(); as m) {
//           <div class="bento-grid">
            
//             <div class="grid-card span-2 card-anim-1">
//               <div class="card-header">
//                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
//                 <h2 class="card-title">Device Information</h2>
//               </div>
//               <div class="card-body inner-grid-3">
//                 <div class="info-group"><label>Provider</label><p class="detail-text capitalize">{{ m.providerType }}</p></div>
//                 <div class="info-group"><label>Model</label><p class="detail-text">{{ m.model || 'N/A' }}</p></div>
//                 <div class="info-group"><label>Firmware</label><p class="detail-text">{{ m.firmwareVersion || 'Unknown' }}</p></div>
//                 <div class="info-group"><label>IP Address</label><p class="detail-text mono">{{ m.ipAddress || 'Dynamic' }}</p></div>
//                 <div class="info-group"><label>Port</label><p class="detail-text mono">{{ m.port || 'Default' }}</p></div>
//                 <div class="info-group"><label>Last Sync</label><p class="detail-text">{{ m.lastSyncAt ? (m.lastSyncAt | date:'medium') : 'Never' }}</p></div>
//               </div>
//             </div>

//             <div class="grid-card card-anim-2">
//               <div class="card-header">
//                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg></div>
//                 <h2 class="card-title">Statistics</h2>
//               </div>
//               <div class="card-body flex-col">
//                 <div class="stat-row">
//                   <span class="stat-label">Total Transactions</span>
//                   <span class="stat-val">{{ m.stats?.totalTransactions || 0 }}</span>
//                 </div>
//                 <div class="divider"></div>
//                 <div class="inner-grid-2">
//                   <div class="info-group"><label>Success</label><p class="detail-text color-success">{{ m.stats?.successfulReads || 0 }}</p></div>
//                   <div class="info-group"><label>Failed</label><p class="detail-text color-error">{{ m.stats?.failedReads || 0 }}</p></div>
//                 </div>
//               </div>
//             </div>

//             <div class="grid-card span-3 card-anim-3">
//               <div class="card-header">
//                 <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg></div>
//                 <h2 class="card-title">Supported Features</h2>
//               </div>
//               <div class="card-body flex-wrap-row">
//                 <span class="cap-tag" [class.enabled]="m.capabilities?.fingerprint">Fingerprint</span>
//                 <span class="cap-tag" [class.enabled]="m.capabilities?.faceRecognition">Face ID</span>
//                 <span class="cap-tag" [class.enabled]="m.capabilities?.rfid">RFID Card</span>
//                 <span class="cap-tag" [class.enabled]="m.capabilities?.maskDetection">Mask Detection</span>
//                 <span class="cap-tag" [class.enabled]="m.capabilities?.temperature">Thermal Scanner</span>
//               </div>
//             </div>

//           </div>
//         }
//       </main>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }
//     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); border-bottom: var(--ui-border-width) solid var(--border-primary); }
//     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    
//     .icon-btn { background: var(--component-bg); border: 1px solid var(--border-primary); color: var(--text-secondary); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: var(--ui-border-radius); cursor: pointer; }
//     .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: var(--ui-border-radius); cursor: pointer; border: 1px solid transparent; }
//     .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
//     .btn-primary { background: var(--color-primary); color: white; }
    
//     .page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
//     .page-subtitle { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }
    
//     .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
//     .status-badge.online { background: #ecfdf5; color: #15803d; }
//     .status-badge.offline { background: #fef2f2; color: #b91c1c; }

//     .dashboard-content { flex: 1; padding: var(--spacing-xl); background: var(--bg-primary); overflow-y: auto; }
//     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); max-width: 1400px; margin: 0 auto; }
//     .span-2 { grid-column: span 2; } .span-3 { grid-column: span 3; }
    
//     .grid-card { background: var(--component-bg); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px; }
//     .card-header { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-primary); padding-bottom: 8px; }
//     .card-icon { color: var(--color-primary); }
//     .card-title { font-weight: 600; margin: 0; font-size: 1rem; }
    
//     .inner-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
//     .info-group label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
//     .detail-text { font-size: 0.9rem; color: var(--text-primary); margin: 2px 0 0 0; }
//     .mono { font-family: var(--font-mono); } .capitalize { text-transform: capitalize; }
    
//     .stat-row { display: flex; justify-content: space-between; align-items: center; }
//     .stat-val { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
//     .color-success { color: #15803d; } .color-error { color: #b91c1c; }
//     .divider { height: 1px; background: var(--border-primary); margin: 8px 0; }
    
//     .flex-wrap-row { display: flex; gap: 8px; flex-wrap: wrap; }
//     .cap-tag { padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; background: var(--bg-secondary); color: var(--text-tertiary); border: 1px solid var(--border-secondary); opacity: 0.5; }
//     .cap-tag.enabled { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); border-color: var(--color-primary); opacity: 1; font-weight: 600; }
    
//     @media(max-width: 768px) { .bento-grid { grid-template-columns: 1fr; } .span-2, .span-3 { grid-column: span 1; } }
//   `]
// })
// export class MachineDetailsComponent implements OnInit {
//   private hrmsService = inject(HRMSService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private messageService = inject(AppMessageService);

//   machine = signal<any | null>(null);
//   machineId: string | null = null;

//   ngOnInit() {
//     this.route.paramMap.subscribe(params => {
//       this.machineId = params.get('id');
//       if(this.machineId) this.loadData();
//     });
//   }

//   loadData() {
//     this.hrmsService.getMachine(this.machineId!).subscribe({
//       next: (res: any) => this.machine.set(res.data?.machine || res.data),
//       error: () => this.messageService.showError('Error', 'Failed to load machine')
//     });
//   }

//   testConnection() {
//     this.messageService.showInfo('Testing', 'Pinging device...');
//     this.hrmsService.testMachineConnection(this.machineId!).subscribe({
//       next: () => this.messageService.showSuccess('Online', 'Device is reachable'),
//       error: () => this.messageService.showError('Offline', 'Device not responding')
//     });
//   }

//   regenerateKey() {
//     if(confirm('This will invalidate the current API key. Continue?')) {
//       this.hrmsService.regenerateMachineApiKey(this.machineId!).subscribe({
//         next: (res: any) => alert(`New Key: ${res.data.apiKey}`),
//         error: () => this.messageService.showError('Error', 'Failed to regenerate key')
//       });
//     }
//   }

//   editMachine() { this.router.navigate(['/hrms/attendance/machines/edit', this.machineId]); }
//   goBack() { this.router.navigate(['/hrms/attendance/machines']); }
// }