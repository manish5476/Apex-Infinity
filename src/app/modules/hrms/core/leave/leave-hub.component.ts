import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-leave-hub',
  standalone: true,
  imports: [
    CommonModule, TabsModule, TableModule, CardModule,
    ButtonModule, TagModule, SkeletonModule, AvatarModule,
    TooltipModule, ProgressBarModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-calendar-minus"></i></div>
          <div class="header-titles">
            <h1 class="page-title">Leave & Time Off</h1>
            <p class="page-subtitle">Manage your time off requests, balances, and team approvals.</p>
          </div>
        </div>
        <div class="header-right">
          <p-button 
            label="Apply for Leave" 
            icon="pi pi-plus" 
            styleClass="p-button-primary shadow-md"
            (onClick)="onApplyLeave()">
          </p-button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="flex-col gap-4">
          <div class="grid-3">
            <p-skeleton height="8rem" borderRadius="12px"></p-skeleton>
            <p-skeleton height="8rem" borderRadius="12px"></p-skeleton>
            <p-skeleton height="8rem" borderRadius="12px"></p-skeleton>
          </div>
          <p-skeleton height="400px" borderRadius="12px"></p-skeleton>
        </div>
      } @else {
        
        <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
          <p-tabs value="0">
            <p-tablist styleClass="hub-tablist">
              <p-tab value="0"><div class="tab-label"><i class="pi pi-user"></i> My Leave Requests</div></p-tab>
              <p-tab value="1">
                <div class="tab-label flex-align gap-2">
                  <i class="pi pi-inbox"></i> Pending Approvals
                  @if (pendingApprovals().length > 0) {
                    <p-tag severity="danger" [value]="pendingApprovals().length.toString()" [rounded]="true"></p-tag>
                  }
                </div>
              </p-tab>
            </p-tablist>

            <p-tabpanels styleClass="hub-tabpanels p-0">
              
              <p-tabpanel value="0">
                <div class="panel-inner p-4">
                  
                  @if (balances(); as bal) {
                    <div class="balance-grid mb-5">
                      <div class="balance-card casual-card">
                        <div class="b-header">
                          <span class="b-title">Casual Leave (CL)</span>
                          <i class="pi pi-sun b-icon"></i>
                        </div>
                        <div class="b-body">
                          <div class="b-value">{{ bal.casual?.available || 0 }} <span class="b-total">/ {{ bal.casual?.total || 0 }}</span></div>
                          <p-progressBar [value]="getPercentage(bal.casual?.available, bal.casual?.total)" [showValue]="false" styleClass="mt-2 h-2"></p-progressBar>
                        </div>
                      </div>

                      <div class="balance-card sick-card">
                        <div class="b-header">
                          <span class="b-title">Sick Leave (SL)</span>
                          <i class="pi pi-heart-fill b-icon"></i>
                        </div>
                        <div class="b-body">
                          <div class="b-value">{{ bal.sick?.available || 0 }} <span class="b-total">/ {{ bal.sick?.total || 0 }}</span></div>
                          <p-progressBar [value]="getPercentage(bal.sick?.available, bal.sick?.total)" [showValue]="false" styleClass="mt-2 h-2"></p-progressBar>
                        </div>
                      </div>

                      <div class="balance-card earned-card">
                        <div class="b-header">
                          <span class="b-title">Earned Leave (EL)</span>
                          <i class="pi pi-star-fill b-icon"></i>
                        </div>
                        <div class="b-body">
                          <div class="b-value">{{ bal.earned?.available || 0 }} <span class="b-total">/ {{ bal.earned?.total || 0 }}</span></div>
                          <p-progressBar [value]="getPercentage(bal.earned?.available, bal.earned?.total)" [showValue]="false" styleClass="mt-2 h-2"></p-progressBar>
                        </div>
                      </div>
                    </div>
                  }

                  <h3 class="font-heading mb-3 mt-0 text-primary-color flex-align gap-2">
                    <i class="pi pi-history text-tertiary"></i> Request History
                  </h3>
                  
                  <p-table 
                    [value]="myRequests()" 
                    [paginator]="true" 
                    [rows]="10" 
                    responsiveLayout="scroll"
                    styleClass="premium-table border-round-xl overflow-hidden border-1 surface-border">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Request ID & Type</th>
                        <th>Duration</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th class="text-right">Applied On</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-req>
                      <tr class="table-row-hover cursor-pointer" (click)="viewDetails(req.leaveRequestId)">
                        <td>
                          <div class="flex-col gap-1">
                            <span class="font-bold text-primary-color capitalize">{{ req.leaveType }} Leave</span>
                            <span class="badge-mono-sm w-max">{{ req.leaveRequestId }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="flex-align gap-2 text-sm text-secondary font-medium">
                            <i class="pi pi-calendar text-tertiary"></i>
                            <span>{{ req.startDate | date:'dd MMM yyyy' }}</span>
                            <i class="pi pi-arrow-right text-xs text-tertiary mx-1"></i>
                            <span>{{ req.endDate | date:'dd MMM yyyy' }}</span>
                          </div>
                          @if (req.daysCount === 0.5) {
                            <div class="text-xs text-tertiary mt-1">Half Day ({{ req.startSession | titlecase }})</div>
                          }
                        </td>
                        <td>
                          <span class="font-bold text-lg">{{ req.daysCount }}</span> <span class="text-secondary text-sm">day(s)</span>
                        </td>
                        <td>
                          <p-tag [severity]="getStatusSeverity(req.status)" [value]="req.status | titlecase"></p-tag>
                        </td>
                        <td class="text-right text-sm text-tertiary font-medium">
                          {{ req.appliedAt | date:'mediumDate' }}
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr>
                        <td colspan="5" class="text-center py-6">
                          <div class="empty-glass-state">
                            <i class="pi pi-file-o text-4xl text-tertiary mb-3"></i>
                            <h4 class="m-0 mb-1 text-primary-color">No Leave Requests</h4>
                            <p class="m-0 text-secondary">You haven't applied for any leaves yet.</p>
                          </div>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-inner p-4 bg-surface h-full">
                  @if (pendingApprovals().length > 0) {
                    <div class="approvals-grid">
                      @for (approval of pendingApprovals(); track approval._id) {
                        <p-card styleClass="approval-card">
                          <div class="flex-col gap-3">
                            
                            <div class="flex-between border-bottom pb-3">
                              <div class="flex-align gap-3">
                                <p-avatar [label]="getInitials(approval.user?.name)" shape="circle" size="large" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}"></p-avatar>
                                <div class="flex-col">
                                  <span class="font-bold text-primary-color">{{ approval.user?.name || 'Employee' }}</span>
                                  <span class="text-xs text-secondary">{{ approval.user?.employeeProfile?.employeeId || 'ID N/A' }}</span>
                                </div>
                              </div>
                              <span class="badge-mono-sm">{{ approval.leaveRequestId }}</span>
                            </div>

                            <div class="grid-2 gap-3">
                              <div class="info-group">
                                <span class="info-label text-tertiary">Leave Type</span>
                                <div class="flex-align gap-2 mt-1">
                                  <div class="type-dot" [ngClass]="approval.leaveType"></div>
                                  <span class="font-bold capitalize">{{ approval.leaveType }} Leave</span>
                                </div>
                              </div>
                              <div class="info-group">
                                <span class="info-label text-tertiary">Duration</span>
                                <span class="font-medium mt-1">{{ approval.daysCount }} Day(s)</span>
                              </div>
                              <div class="info-group span-2 bg-primary-light p-2 border-radius-md">
                                <span class="text-sm font-medium text-primary-color flex-align gap-2">
                                  <i class="pi pi-calendar"></i>
                                  {{ approval.startDate | date:'dd MMM yyyy' }} - {{ approval.endDate | date:'dd MMM yyyy' }}
                                </span>
                              </div>
                              <div class="info-group span-2">
                                <span class="info-label text-tertiary">Reason</span>
                                <p class="m-0 text-sm text-secondary mt-1 line-clamp-2" [pTooltip]="approval.reason">{{ approval.reason }}</p>
                              </div>
                            </div>

                            <div class="flex-align gap-2 pt-3 border-top mt-auto">
                              <p-button label="Approve" icon="pi pi-check" styleClass="p-button-success w-full" size="small" (onClick)="actionRequest(approval._id, 'approve')"></p-button>
                              <p-button label="Reject" icon="pi pi-times" styleClass="p-button-danger p-button-outlined w-full" size="small" (onClick)="actionRequest(approval._id, 'reject')"></p-button>
                            </div>
                          </div>
                        </p-card>
                      }
                    </div>
                  } @else {
                    <div class="empty-glass-state h-full flex-center py-6">
                      <div class="icon-circle-large mb-3 bg-success-light text-success"><i class="pi pi-check-circle"></i></div>
                      <h3 class="m-0 mb-1 text-primary-color font-heading">All Caught Up!</h3>
                      <p class="m-0 text-secondary">There are no pending leave requests requiring your approval.</p>
                    </div>
                  }
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
  `,
  styles: [`
    /* --------------------------------------------------------------------------
       GLOBAL & VARIABLES
       -------------------------------------------------------------------------- */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }

    /* Utility */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .h-full { height: 100%; }
    .h-2 { height: 0.5rem; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl); }
    .span-2 { grid-column: span 2; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mt-0 { margin-top: 0; }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-auto { margin-top: auto; }
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mx-1 { margin-left: var(--spacing-xs); margin-right: var(--spacing-xs); }
    
    .p-0 { padding: 0 !important; }
    .p-2 { padding: var(--spacing-sm); }
    .p-4 { padding: var(--spacing-xl); }
    .pt-3 { padding-top: var(--spacing-md); }
    .pb-3 { padding-bottom: var(--spacing-md); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-heading { font-family: var(--font-heading); }
    .capitalize { text-transform: capitalize; }
    .cursor-pointer { cursor: pointer; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    /* --------------------------------------------------------------------------
       HEADER & TABS
       -------------------------------------------------------------------------- */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); border: 1px solid var(--color-primary-border); }
    .header-titles { display: flex; flex-direction: column; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }

    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
    .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

    /* --------------------------------------------------------------------------
       BALANCE CARDS
       -------------------------------------------------------------------------- */
    .balance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-xl); }
    .balance-card { padding: var(--spacing-xl); border-radius: var(--ui-border-radius-lg); border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; gap: var(--spacing-lg); box-shadow: var(--shadow-sm); transition: transform 0.2s ease; }
    .balance-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    
    .b-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .b-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9; }
    .b-icon { font-size: 1.5rem; opacity: 0.8; }
    
    .b-value { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); line-height: 1; margin-bottom: var(--spacing-xs); }
    .b-total { font-size: var(--font-size-lg); opacity: 0.7; font-weight: var(--font-weight-medium); }

    /* Theming the cards */
    .casual-card { background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); color: #475569; border-color: #cbd5e1; }
    .casual-card ::ng-deep .p-progressbar-value { background: #64748b; }
    
    .sick-card { background: linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%); color: #0284c7; border-color: #bae6fd; }
    .sick-card ::ng-deep .p-progressbar-value { background: #0ea5e9; }
    
    .earned-card { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: #c2410c; border-color: #fed7aa; }
    .earned-card ::ng-deep .p-progressbar-value { background: #f97316; }

    ::ng-deep .p-progressbar { background: rgba(0,0,0,0.1) !important; }

    /* --------------------------------------------------------------------------
       TABLE
       -------------------------------------------------------------------------- */
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--color-primary-bg) !important; }

    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

    /* --------------------------------------------------------------------------
       APPROVALS GRID
       -------------------------------------------------------------------------- */
    .approvals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-xl); }
    ::ng-deep .approval-card.p-card { height: 100%; border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); transition: var(--transition-base); }
    ::ng-deep .approval-card.p-card:hover { box-shadow: var(--shadow-lg); border-color: var(--color-primary-border); transform: translateY(-2px); }
    ::ng-deep .approval-card .p-card-body { padding: var(--spacing-lg); height: 100%; display: flex; flex-direction: column; }
    ::ng-deep .approval-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

    .info-group { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }

    .type-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--text-tertiary); }
    .type-dot.sick { background: #ef4444; }
    .type-dot.casual { background: #3b82f6; }
    .type-dot.earned { background: #f59e0b; }

    /* --------------------------------------------------------------------------
       EMPTY STATES
       -------------------------------------------------------------------------- */
    .empty-glass-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .icon-circle-large { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .header-right { margin-top: var(--spacing-xs); }
      .balance-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class LeaveHubComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  // State
  isLoading = signal<boolean>(true);
  myRequests = signal<any[]>([]);
  pendingApprovals = signal<any[]>([]);
  balances = signal<any>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.isLoading.set(true);

    forkJoin({
      balances: this.hrmsService.getLeaveBalanceSummary().pipe(
        map(res => res?.data || {}),
        catchError(() => of({}))
      ),
      myReqs: this.hrmsService.getMyLeaveRequests().pipe(
        map(res => res?.data?.leaveRequests || []),
        catchError(() => of([]))
      ),
      approvals: this.hrmsService.getPendingApprovals().pipe(
        map(res => res?.data || []),
        catchError(() => of([]))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ balances, myReqs, approvals }) => {
      this.balances.set(balances);
      this.myRequests.set(myReqs);
      this.pendingApprovals.set(approvals);
    });
  }

  // --- Actions ---
  onApplyLeave() {
    this.router.navigate(['/leave/apply']);
  }

  viewDetails(id: string) {
    this.router.navigate(['/leave/details', id]);
  }

  actionRequest(id: string, action: 'approve' | 'reject') {
    // Stub for approval workflow endpoint integration
    const summaryMsg = action === 'approve' ? 'Leave Approved' : 'Leave Rejected';
    const severity = action === 'approve' ? 'success' : 'warn';

    // Optimistic UI update
    this.pendingApprovals.update(apps => apps.filter(a => a._id !== id));
    // this.messageService.add({ severity, summary: summaryMsg, detail: `The request has been processed.` });
  }

  // --- Helpers ---
  getPercentage(available: number = 0, total: number = 0): number {
    if (total === 0) return 0;
    return Math.round((available / total) * 100);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warn';
      case 'rejected':
      case 'cancelled': return 'danger';
      case 'escalated': return 'info';
      default: return 'secondary';
    }
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}