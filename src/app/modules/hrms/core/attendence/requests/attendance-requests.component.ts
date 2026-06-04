import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, map, takeUntil } from 'rxjs/operators';

import { MessageService } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { AppMessageService } from '@core/services/message.service';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { HRMSService } from '../../../hrms.service';

@Component({
  selector: 'app-attendance-requests',
  standalone: true,
  imports: [
    CommonModule, TabsModule, TableModule, CardModule,
    ButtonModule, TagModule, SkeletonModule, AvatarModule,
    TooltipModule, DialogModule, InputTextModule, TextareaModule, FormsModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apex-page fade-in flex-col h-screen">
      
      <header class="apex-header apex-header--elevated flex-shrink-0">
        <div class="flex-align gap-4">
          <div class="apex-card__icon" style="width: 48px; height: 48px; font-size: 20px;"><i class="pi pi-calendar-plus"></i></div>
          <div class="flex-col">
            <h1 class="apex-page-header__title m-0" style="font-size: var(--font-size-2xl);">Attendance Regularization</h1>
            <p class="apex-page-header__subtitle m-0 text-sm text-tertiary">Manage missed punches and attendance corrections.</p>
          </div>
        </div>
        <div class="header-right ml-auto">
          <p-button 
            label="Apply for Regularization" 
            icon="pi pi-plus" 
            styleClass="apex-btn apex-btn--primary"
            (onClick)="onApplyRequest()">
          </p-button>
        </div>
      </header>

      <main class="apex-content flex-1 overflow-auto flex-col p-4 sm:p-5">
        @if (isLoading()) {
          <div class="flex-col gap-4 h-full">
            <p-skeleton height="400px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
          </div>
        } @else {
          
          <div class="apex-card apex-card--surface h-full flex-col p-0 border-0 shadow-none overflow-hidden slide-down">
            <p-tabs [value]="activeTab()" (valueChange)="activeTab.set($event)" styleClass="h-full flex-col w-full">
              <p-tablist styleClass="hub-tablist px-4 border-bottom bg-surface">
                <p-tab value="0"><div class="tab-label flex-align gap-2"><i class="pi pi-user"></i> My Requests</div></p-tab>
                <p-tab value="1">
                  <div class="tab-label flex-align gap-2">
                    <i class="pi pi-inbox"></i> Pending Approvals
                    @if (pendingApprovals().length > 0) {
                      <p-tag severity="danger" [value]="pendingApprovals().length.toString()" [rounded]="true"></p-tag>
                    }
                  </div>
                </p-tab>
              </p-tablist>

              <p-tabpanels styleClass="flex-1 relative overflow-hidden bg-surface p-0">
                
                <p-tabpanel value="0">
                  <div class="panel-inner p-4 sm:p-6 h-full overflow-auto">
                    
                    <h3 class="apex-section__title mb-4 mt-0">
                      <i class="pi pi-history text-tertiary"></i> Request History
                    </h3>
                    
                    <p-table 
                      [value]="myRequests()" 
                      [paginator]="true" 
                      [rows]="10" 
                      responsiveLayout="scroll"
                      styleClass="premium-table border-round-lg overflow-hidden border border-primary surface-border">
                      <ng-template pTemplate="header">
                        <tr>
                          <th>Target Date</th>
                          <th>Request Type</th>
                          <th>Status</th>
                          <th>Reason</th>
                          <th class="text-right">Applied On</th>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-req>
                        <tr class="table-row-hover">
                          <td>
                            <div class="flex-align gap-2 text-sm text-secondary font-medium">
                              <i class="pi pi-calendar text-tertiary"></i>
                              <span>{{ req.targetDate | date:'dd MMM yyyy' }}</span>
                            </div>
                          </td>
                          <td>
                            <span class="font-bold text-primary-color capitalize">{{ req.type?.replace('_', ' ') }}</span>
                          </td>
                          <td>
                            <p-tag [severity]="getStatusSeverity(req.status)" [value]="req.status | titlecase"></p-tag>
                          </td>
                          <td>
                            <span class="text-secondary text-sm line-clamp-1" [pTooltip]="req.correction?.reason">{{ req.correction?.reason || 'N/A' }}</span>
                          </td>
                          <td class="text-right text-sm text-tertiary font-medium">
                            {{ req.createdAt | date:'mediumDate' }}
                          </td>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="5" class="text-center py-6">
                            <div class="empty-glass-state">
                              <i class="pi pi-file-o text-4xl text-tertiary mb-3"></i>
                              <h4 class="m-0 mb-1 text-primary-color">No Requests Found</h4>
                              <p class="m-0 text-secondary">You haven't submitted any regularization requests.</p>
                            </div>
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </p-tabpanel>

                <p-tabpanel value="1">
                  <div class="panel-inner p-4 sm:p-6 bg-surface h-full overflow-auto">
                    @if (pendingApprovals().length > 0) {
                      <div class="apex-grid apex-grid--auto">
                        @for (approval of pendingApprovals(); track approval._id) {
                          <div class="apex-card apex-card--interactive flex-col h-full p-4">
                            <div class="flex-col gap-4 h-full">
                              
                              <div class="flex-between border-bottom pb-3">
                                <div class="flex-align gap-3">
                                  <p-avatar [label]="getInitials(approval.user?.name)" shape="circle" size="large" [style]="{'background-color': 'var(--accent-focus)', 'color': 'var(--accent-primary)'}"></p-avatar>
                                  <div class="flex-col">
                                    <span class="font-bold text-primary-color">{{ approval.user?.name || 'Employee' }}</span>
                                  </div>
                                </div>
                                <span class="badge-mono-sm">{{ approval.type }}</span>
                              </div>

                              <div class="grid-2 gap-3 flex-1">
                                <div class="info-group">
                                  <span class="info-label text-tertiary">Target Date</span>
                                  <span class="font-medium mt-1 text-sm"><i class="pi pi-calendar text-xs mr-1"></i> {{ approval.targetDate | date:'dd MMM yyyy' }}</span>
                                </div>
                                <div class="info-group">
                                  <span class="info-label text-tertiary">Reason</span>
                                  <span class="font-medium mt-1 text-sm line-clamp-1" [pTooltip]="approval.correction?.reason">{{ approval.correction?.reason || 'N/A' }}</span>
                                </div>
                                
                                @if(approval.type === 'missed_punch') {
                                  <div class="info-group span-2 bg-primary-light p-2 border-radius-sm">
                                    <span class="text-sm font-medium text-primary-color flex-align gap-2">
                                      <i class="pi pi-clock"></i>
                                      Proposed: IN {{ approval.correction?.inTime || '--:--' }} | OUT {{ approval.correction?.outTime || '--:--' }}
                                    </span>
                                  </div>
                                }
                              </div>

                              <div class="flex-align gap-2 pt-3 border-top mt-auto">
                                <p-button label="Approve" icon="pi pi-check" styleClass="apex-btn apex-btn--sm bg-success text-white border-0 w-full" (onClick)="openActionDialog(approval._id, 'approve')"></p-button>
                                <p-button label="Reject" icon="pi pi-times" styleClass="apex-btn apex-btn--sm apex-btn--secondary w-full" (onClick)="openActionDialog(approval._id, 'reject')"></p-button>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="empty-glass-state h-full flex-center py-6">
                        <div class="icon-circle-large mb-3 bg-success-light text-success"><i class="pi pi-check-circle"></i></div>
                        <h3 class="m-0 mb-1 text-primary-color font-heading">All Caught Up!</h3>
                        <p class="m-0 text-secondary">There are no pending requests requiring your approval.</p>
                      </div>
                    }
                  </div>
                </p-tabpanel>

              </p-tabpanels>
            </p-tabs>
          </div>
        }
      </main>

      <p-dialog [(visible)]="showActionDialog" [header]="dialogAction === 'approve' ? 'Approve Request' : 'Reject Request'" [modal]="true" [style]="{width: '450px'}" styleClass="apex-dialog">
        <div class="flex-col gap-4 pt-2">
          <p class="m-0 text-secondary">Please provide {{ dialogAction === 'approve' ? 'optional comments' : 'a mandatory reason' }} for this action.</p>
          <div class="field">
            <label class="apex-label block mb-2">{{ dialogAction === 'approve' ? 'Comments' : 'Reason *' }}</label>
            <textarea pTextarea [(ngModel)]="actionComments" rows="3" class="w-full apex-input" placeholder="Type here..."></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" (onClick)="showActionDialog = false" styleClass="p-button-text p-button-secondary"></p-button>
          <p-button [label]="dialogAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'" [icon]="dialogAction === 'approve' ? 'pi pi-check' : 'pi pi-times'" 
            [styleClass]="dialogAction === 'approve' ? 'p-button-success' : 'p-button-danger'" 
            (onClick)="confirmAction()" 
            [disabled]="dialogAction === 'reject' && !actionComments.trim()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; overflow: hidden; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1; }
    .ml-auto { margin-left: auto; }
    .w-full { width: 100%; }
    .h-screen { height: 100vh; }
    .h-full { height: 100%; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    .span-2 { grid-column: span 2; }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .m-0 { margin: 0; }
    .mt-0 { margin-top: 0; }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-auto { margin-top: auto; }
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-lg); }
    .mr-1 { margin-right: var(--spacing-xs); }
    .p-0 { padding: 0 !important; }
    .p-2 { padding: var(--spacing-sm); }
    .p-4 { padding: var(--spacing-xl); }
    .pt-2 { padding-top: var(--spacing-sm); }
    .pt-3 { padding-top: var(--spacing-md); }
    .pb-3 { padding-bottom: var(--spacing-md); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
    .bg-success { background: var(--color-success) !important; color: #fff !important; }
    .border-0 { border: none !important; }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .shadow-none { box-shadow: none !important; }
    .overflow-hidden { overflow: hidden; }
    .overflow-auto { overflow-y: auto; overflow-x: hidden; }
    .relative { position: relative; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .capitalize { text-transform: capitalize; }
    .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    
    ::ng-deep .hub-tablist .p-tablist-nav { background: transparent !important; border: none !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 3px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); background: transparent !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
    
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--color-primary-bg) !important; }
    
    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); text-transform: uppercase; }
    .info-group { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }
    .empty-glass-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .icon-circle-large { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class AttendanceRequestsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(true);
  myRequests = signal<any[]>([]);
  pendingApprovals = signal<any[]>([]);
  activeTab = signal<any>("0");

  showActionDialog = false;
  dialogAction: 'approve' | 'reject' = 'approve';
  actionComments = '';
  selectedRequestId = '';

  ngOnInit() {
    // If navigated from the hub as 'approvals', select the second tab
    this.route.url.subscribe(url => {
      if (url.length > 0 && url[url.length - 1].path === 'approvals') {
        this.activeTab.set("1");
      }
    });

    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);

    forkJoin({
      myReqs: this.hrmsService.getMyAttendanceRequests().pipe(
        map((res: any) => res?.data?.requests || []),
        catchError(() => of([]))
      ),
      approvals: this.hrmsService.getPendingAttendanceApprovals().pipe(
        map((res: any) => res?.data?.requests || []),
        catchError(() => of([]))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe(({ myReqs, approvals }) => {
      this.myRequests.set(myReqs);
      this.pendingApprovals.set(approvals);
    });
  }

  onApplyRequest() {
    this.router.navigate(['/hrms/attendance-requests/apply']);
  }

  openActionDialog(id: string, action: 'approve' | 'reject') {
    this.selectedRequestId = id;
    this.dialogAction = action;
    this.actionComments = '';
    this.showActionDialog = true;
  }

  confirmAction() {
    if (!this.selectedRequestId) return;
    this.showActionDialog = false;

    if (this.dialogAction === 'approve') {
      this.hrmsService.approveAttendanceRequest(this.selectedRequestId, { comments: this.actionComments }).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Request approved successfully.');
          this.loadData();
        },
        error: (err: any) => {
          this.messageService.showError(err.error?.message || 'Failed to approve request.');
        }
      });
    } else {
      this.hrmsService.rejectAttendanceRequest(this.selectedRequestId, { reason: this.actionComments }).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Request rejected successfully.');
          this.loadData();
        },
        error: (err: any) => {
          this.messageService.showError(err.error?.message || 'Failed to reject request.');
        }
      });
    }
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
