import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
// import { SidebarModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
// import { HRMSService } from '../hrms.service';
import { Dialog } from 'primeng/dialog';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-user-attendance-details',
  standalone: true,
  imports: [
    CommonModule, CardModule, ButtonModule, TableModule, TagModule,
    Dialog, SkeletonModule, TooltipModule, AvatarModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-4">
        <div class="header-left">
          <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
          <div class="header-titles">
            <h1 class="page-title m-0">Employee Attendance Ledger</h1>
            <p class="page-subtitle mt-1">Detailed view of historical punch records.</p>
          </div>
        </div>
      </header>

      @if (isLoading()) {
        <p-card styleClass="premium-card glass-card"><p-skeleton width="100%" height="400px"></p-skeleton></p-card>
      } @else {
        
        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
          <p-table 
            [value]="userLogs()" 
            [paginator]="true" 
            [rows]="15" 
            responsiveLayout="scroll"
            styleClass="premium-table border-round-xl border-1 surface-border">
            
            <ng-template pTemplate="header">
              <tr>
                <th>Date & Time</th>
                <th>Punch Type</th>
                <th>Source</th>
                <th>Status</th>
                <th class="text-right">Inspection</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-log>
              <tr class="table-row-hover">
                <td>
                  <div class="flex-col gap-1">
                    <span class="font-bold text-primary-color">{{ log.timestamp | date:'EEE, dd MMM yyyy' }}</span>
                    <span class="font-mono text-sm text-secondary">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-bold capitalize flex-align gap-2" [ngClass]="getTypeColor(log.type)">
                    <i class="pi" [ngClass]="getTypeIcon(log.type)"></i> {{ formatType(log.type) }}
                  </span>
                </td>
                <td>
                  <span class="text-secondary text-sm capitalize flex-align gap-2">
                    <i class="pi" [ngClass]="getSourceIcon(log.source)"></i> {{ log.source }}
                  </span>
                </td>
                <td>
                  <p-tag [severity]="getStatusSeverity(log.processingStatus)" [value]="log.processingStatus | uppercase"></p-tag>
                  <i *ngIf="log.isCorrection" class="pi pi-info-circle text-warning ml-2" pTooltip="This is a corrected log"></i>
                </td>
                <td class="text-right">
                  <p-button icon="pi pi-search-plus" label="Inspect" [outlined]="true" size="small" (onClick)="inspectLog(log._id)"></p-button>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr><td colspan="5" class="text-center py-6 text-secondary">No attendance records found for this employee.</td></tr>
            </ng-template>
          </p-table>
        </p-card>
      }
    </div>

    <p-dialog [(visible)]="displayInspection" position="right" styleClass="premium-dialog w-full md:w-30rem">
      <ng-template pTemplate="header">
        <h2 class="font-heading m-0 flex-align gap-2 text-primary-color"><i class="pi pi-verified text-primary"></i> Punch Inspection</h2>
      </ng-template>
      
      @if (isInspecting()) {
        <div class="flex-col gap-4 mt-4"><p-skeleton height="100px"></p-skeleton><p-skeleton height="200px"></p-skeleton></div>
      } @else if (selectedLog(); as log) {
        
        <div class="inspection-content flex-col gap-4 mt-2">
          
          <div class="bg-surface p-4 border-radius-md border-1 surface-border flex-between">
            <div class="flex-col gap-1">
              <span class="text-xs text-tertiary uppercase font-bold">Server Timestamp</span>
              <span class="font-mono font-bold text-lg text-primary-color">{{ log.serverTimestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
            </div>
            <p-tag [severity]="getTypeSeverity(log.type)" [value]="log.type | uppercase"></p-tag>
          </div>

          <div class="detail-section">
            <h4 class="section-title"><i class="pi pi-map-marker"></i> Geolocation Data</h4>
            <div class="map-placeholder mt-2 border-radius-md">
              <div class="map-grid"></div>
              <div class="pin-marker"><i class="pi pi-map-marker text-error text-3xl"></i></div>
            </div>
            <div class="grid-2 mt-3 gap-3">
              <div class="flex-col"><span class="text-xs text-tertiary">Coordinates</span><span class="font-mono text-sm text-secondary">{{ log.location?.coordinates?.[1] || '0.0' }}, {{ log.location?.coordinates?.[0] || '0.0' }}</span></div>
              <div class="flex-col"><span class="text-xs text-tertiary">Geofence Status</span>
                <span class="font-bold" [ngClass]="log.location?.geofenceStatus === 'inside' ? 'text-success' : 'text-error'">
                  {{ log.location?.geofenceStatus | uppercase }}
                </span>
              </div>
              <div class="flex-col span-2"><span class="text-xs text-tertiary">Resolved Address</span><span class="text-sm text-secondary">{{ log.location?.address || 'Not resolved' }}</span></div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title"><i class="pi pi-cog"></i> Device & Network</h4>
            <div class="bg-surface p-3 border-radius-md border-1 surface-border grid-2 gap-3 mt-2">
              <div class="flex-col"><span class="text-xs text-tertiary">IP Address</span><span class="font-mono text-sm text-secondary">{{ log.ipAddress || 'Unknown' }}</span></div>
              <div class="flex-col"><span class="text-xs text-tertiary">Source</span><span class="text-sm text-secondary capitalize">{{ log.source }}</span></div>
              <div class="flex-col span-2"><span class="text-xs text-tertiary">Device/Agent</span><span class="text-xs text-secondary line-clamp-2">{{ log.userAgent || log.deviceName || 'N/A' }}</span></div>
            </div>
          </div>

          @if (log.biometricData?.method) {
            <div class="detail-section">
              <h4 class="section-title"><i class="pi pi-eye"></i> Biometric Verification</h4>
              <div class="bg-primary-light p-3 border-radius-md border-1 surface-border flex-between mt-2">
                <div class="flex-col gap-1">
                  <span class="text-xs text-tertiary uppercase font-bold">Method: {{ log.biometricData.method }}</span>
                  <span class="text-sm text-primary-color font-medium">Confidence Score</span>
                </div>
                <div class="text-2xl font-bold text-success">{{ log.biometricData.confidence }}%</div>
              </div>
            </div>
          }

          <div class="flex-col gap-1 mt-4 text-xs text-tertiary text-center">
            <span>Log ID: {{ log._id }}</span>
            <span>Verification Status: {{ log.isVerified ? 'Verified' : 'Unverified' }}</span>
          </div>
        </div>
      }
    </p-dialog>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); min-height: 100vh; background: var(--bg-primary); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    .span-2 { grid-column: span 2; }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-3 { margin-top: var(--spacing-md); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .ml-2 { margin-left: var(--spacing-sm); }
    
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: 2rem; }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .uppercase { text-transform: uppercase; letter-spacing: 0.05em; }
    .capitalize { text-transform: capitalize; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    /* Table */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

    /* Sidebar & Inspection */
    ::ng-deep .premium-dialog { background: var(--bg-primary); border-left: 1px solid var(--border-primary); }
    ::ng-deep .premium-dialog .p-dialog-header { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }
    
    .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; display: flex; align-items: center; gap: var(--spacing-sm); }
    
    .map-placeholder { width: 100%; height: 150px; background-color: #e2e8f0; position: relative; overflow: hidden; border: 1px solid var(--border-primary); display: flex; align-items: center; justify-content: center; }
    .map-grid { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 20px 20px; }
    .pin-marker { position: relative; z-index: 2; animation: bounce 2s infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class UserAttendanceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

  // State
  userId: string = '';
  userLogs = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Inspection Sidebar State
  displayInspection = false;
  isInspecting = signal<boolean>(false);
  selectedLog = signal<any>(null);

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUserLogs();
    } else {
      this.onBack();
    }
  }

  private loadUserLogs() {
    this.isLoading.set(true);
    this.hrmsService.getUserLogs(this.userId).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employee attendance ledger.' });
        return of({ data: { logs: [] } });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      this.userLogs.set(res?.data?.logs || []);
    });
  }

  // --- API Action: Get Single Log Details ---
  inspectLog(logId: string) {
    this.displayInspection = true;
    this.isInspecting.set(true);
    this.selectedLog.set(null);

    this.hrmsService.getAttendanceLog(logId).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Inspection Failed', detail: 'Could not retrieve deep log data.' });
        this.displayInspection = false;
        return of(null);
      }),
      finalize(() => this.isInspecting.set(false))
    ).subscribe((res: any) => {
      if (res?.data?.log) {
        this.selectedLog.set(res.data.log);
      }
    });
  }

  // --- UI Helpers ---
  onBack() {
    this.router.navigate(['/attendance/admin']); // Adjust route as necessary
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

  getTypeColor(type: string): string {
    if (type?.includes('in')) return 'text-success';
    if (type?.includes('out')) return 'text-error';
    if (type?.includes('break')) return 'text-warning';
    return 'text-secondary';
  }

  getTypeSeverity(type: string): any {
    if (type?.includes('in')) return 'success';
    if (type?.includes('out')) return 'danger';
    if (type?.includes('break')) return 'warning';
    return 'info';
  }

  getSourceIcon(source: string): string {
    switch (source) {
      case 'machine': case 'biometric': case 'rfid': return 'pi-server';
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
      default: return 'warning';
    }
  }
}