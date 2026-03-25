import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TimelineModule } from 'primeng/timeline';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-leave-details',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CardModule, ButtonModule, TagModule,
    SkeletonModule, DialogModule, SelectModule,
    AvatarModule, TimelineModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

    <div class="page-wrapper fade-in">
      @if (isLoading()) {
        <p-skeleton width="100%" height="200px" styleClass="mb-4"></p-skeleton>
        <p-skeleton width="100%" height="400px"></p-skeleton>
      } @else if (request(); as req) {
        
        <header class="dashboard-header slide-down mb-5">
          <div class="header-left">
            <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
            <div class="header-titles">
              <div class="flex-align gap-3">
                <h1 class="page-title m-0">{{ req.user?.name || 'Employee Leave' }}</h1>
                <p-tag [severity]="getStatusSeverity(req.status)" [value]="req.status | uppercase" styleClass="status-tag"></p-tag>
              </div>
              <p class="page-subtitle mt-1">Request ID: <span class="badge-mono-sm">{{ req.leaveRequestId }}</span> • Applied on {{ req.appliedAt | date:'mediumDate' }}</p>
            </div>
          </div>
          
          <div class="header-right flex-align gap-2">
            <p-button *ngIf="req.status === 'pending'" label="Cancel Request" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="onCancelRequest()"></p-button>
            
            <ng-container *ngIf="req.status === 'pending'">
              <p-button label="Escalate" icon="pi pi-arrow-up-right" severity="secondary" [outlined]="true" (onClick)="showDialog('escalate')"></p-button>
              <p-button label="Reject" icon="pi pi-ban" severity="danger" (onClick)="showDialog('reject')"></p-button>
              <p-button label="Approve" icon="pi pi-check" severity="success" (onClick)="showDialog('approve')"></p-button>
            </ng-container>
          </div>
        </header>

        <div class="grid-layout">
          <div class="flex-col gap-4">
            
            <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.1s">
              <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3"><i class="pi pi-file text-primary mr-2"></i> Leave Specifics</h3>
              <div class="grid-2 gap-4">
                <div class="info-group">
                  <span class="info-label text-tertiary">Leave Type</span>
                  <div class="flex-align gap-2 mt-1">
                    <div class="type-dot" [ngClass]="req.leaveType"></div>
                    <span class="font-bold capitalize text-primary-color">{{ req.leaveType }} Leave</span>
                  </div>
                </div>
                <div class="info-group">
                  <span class="info-label text-tertiary">Total Duration</span>
                  <span class="font-bold text-xl text-primary mt-1">{{ req.daysCount }} Days</span>
                </div>
                <div class="info-group span-2 bg-surface p-3 border-radius-md flex-align gap-3">
                  <div class="flex-col"><span class="text-xs text-tertiary uppercase">From</span><span class="font-bold">{{ req.startDate | date:'dd MMM yyyy' }}</span><span class="text-xs text-secondary">{{ req.startSession | titlecase }}</span></div>
                  <i class="pi pi-arrow-right text-tertiary"></i>
                  <div class="flex-col"><span class="text-xs text-tertiary uppercase">To</span><span class="font-bold">{{ req.endDate | date:'dd MMM yyyy' }}</span><span class="text-xs text-secondary">{{ req.endSession | titlecase }}</span></div>
                </div>
                <div class="info-group span-2">
                  <span class="info-label text-tertiary">Reason for Leave</span>
                  <p class="m-0 text-secondary mt-1 bg-surface p-3 border-radius-md">{{ req.reason }}</p>
                </div>
              </div>
            </p-card>

            <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.15s">
               <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3"><i class="pi pi-users text-primary mr-2"></i> Work & Contact</h3>
               <div class="grid-2 gap-4">
                 <div class="info-group">
                    <span class="info-label text-tertiary">Handover To</span>
                    <span class="font-medium mt-1">{{ req.handoverTo?.name || 'N/A' }}</span>
                 </div>
                 <div class="info-group">
                    <span class="info-label text-tertiary">Emergency Contact</span>
                    <span class="font-medium mt-1">{{ req.emergencyContact?.name || 'N/A' }} <span class="text-xs text-secondary">({{ req.emergencyContact?.phone }})</span></span>
                 </div>
                 <div class="info-group span-2">
                    <span class="info-label text-tertiary">Handover Notes</span>
                    <p class="m-0 text-secondary mt-1 text-sm">{{ req.handoverNotes || 'No specific instructions provided.' }}</p>
                 </div>
               </div>
            </p-card>

          </div>

          <div class="flex-col gap-4">
            
            <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.2s">
              <h3 class="font-heading text-lg m-0 mb-4"><i class="pi pi-chart-pie text-primary mr-2"></i> Impact on Balance</h3>
              <div class="balance-impact bg-surface p-3 border-radius-md flex-between">
                <div class="flex-col text-center"><span class="text-xs text-tertiary uppercase">Available</span><span class="font-bold text-xl text-success">{{ req.balanceSnapshot?.before[req.leaveType] || 0 }}</span></div>
                <div class="flex-col flex-center text-error"><span class="text-xs font-bold">- {{ req.daysCount }}</span><i class="pi pi-arrow-right"></i></div>
                <div class="flex-col text-center"><span class="text-xs text-tertiary uppercase">Remaining</span><span class="font-bold text-xl text-primary">{{ req.balanceSnapshot?.after[req.leaveType] || 0 }}</span></div>
              </div>
            </p-card>

            <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.25s">
              <h3 class="font-heading text-lg m-0 mb-4"><i class="pi pi-sitemap text-primary mr-2"></i> Approval Workflow</h3>
              
              <p-timeline [value]="getTimelineEvents(req)" align="alternate" styleClass="customized-timeline">
                <ng-template pTemplate="marker" let-event>
                  <span class="custom-marker p-shadow-2" [ngStyle]="{'background-color': event.color}">
                    <i [ngClass]="event.icon"></i>
                  </span>
                </ng-template>
                <ng-template pTemplate="content" let-event>
                  <div class="p-2">
                    <div class="font-bold text-sm">{{ event.status }}</div>
                    <div class="text-xs text-tertiary">{{ event.date | date:'dd MMM, HH:mm' }}</div>
                    <div class="text-xs text-secondary mt-1">{{ event.person }}</div>
                    <div *ngIf="event.comment" class="mt-1 text-xs italic opacity-80 bg-surface p-1 border-radius-sm">"{{ event.comment }}"</div>
                  </div>
                </ng-template>
              </p-timeline>
            </p-card>

          </div>
        </div>
      }
    </div>

    <p-dialog [header]="actionDialog.title" [(visible)]="displayActionDialog" [modal]="true" [style]="{width: '400px'}" styleClass="premium-dialog">
      <form [formGroup]="actionForm" class="flex-col gap-4 mt-2">
        
        <p class="m-0 text-secondary text-sm">{{ actionDialog.message }}</p>

        <div *ngIf="actionType === 'escalate'" class="input-group">
          <label class="info-label">Escalate To <span class="text-error">*</span></label>
          <p-select formControlName="escalateTo" [options]="managers" optionLabel="name" optionValue="id" [filter]="true" filterBy="name" styleClass="w-full premium-select" appendTo="body"></p-select>
        </div>

        <div class="input-group">
          <label class="info-label">{{ actionType === 'reject' || actionType === 'escalate' ? 'Reason (Required)' : 'Comments (Optional)' }}</label>
          <textarea pInputTextarea formControlName="comments" rows="3" class="w-full premium-input"></textarea>
        </div>

        <div class="flex-align justify-end gap-2 pt-3 border-top mt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayActionDialog = false"></p-button>
          <p-button [label]="actionDialog.btnLabel" [severity]="actionDialog.btnSeverity" [loading]="isProcessing()" [disabled]="actionForm.invalid" (onClick)="submitAction()"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-2xl); align-items: start; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
    .span-2 { grid-column: span 2; }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .justify-end { justify-content: flex-end; }
    
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    
    .p-1 { padding: var(--spacing-xs); }
    .p-2 { padding: var(--spacing-sm); }
    .p-3 { padding: var(--spacing-lg); }
    .pb-3 { padding-bottom: var(--spacing-md); }
    .pt-3 { padding-top: var(--spacing-md); }
    
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-heading { font-family: var(--font-heading); }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .italic { font-style: italic; }
    .opacity-80 { opacity: 0.8; }
    
    .bg-surface { background: var(--bg-secondary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); }
    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-primary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); }
    ::ng-deep .status-tag { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 4px 8px; border-radius: 6px; }

    /* Cards */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm); }
    ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); }
    ::ng-deep .premium-card .p-card-content { padding: 0; }
    
    .info-group { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

    .type-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--text-tertiary); }
    .type-dot.sick { background: #ef4444; }
    .type-dot.casual { background: #3b82f6; }
    .type-dot.earned { background: #f59e0b; }

    /* Timeline Customization */
    ::ng-deep .customized-timeline .p-timeline-event-opposite { display: none; }
    ::ng-deep .customized-timeline .p-timeline-event-content { padding-left: 1rem; padding-bottom: 1.5rem; }
    .custom-marker { display: flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; color: #ffffff; border-radius: 50%; z-index: 1; font-size: 0.8rem; }

    /* Forms & Dialogs */
    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); }
    ::ng-deep .premium-input, ::ng-deep .premium-select .p-select { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); }
    ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
  `]
})
export class LeaveDetailsComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  request = signal<any>(null);
  isLoading = signal(true);

  // Dialog State
  displayActionDialog = false;
  actionType: 'approve' | 'reject' | 'escalate' | '' = '';
  isProcessing = signal(false);
  actionForm!: FormGroup;
  actionDialog: any = {};

  managers = [{ id: 'mgr_1', name: 'VP of Engineering' }, { id: 'mgr_2', name: 'HR Director' }]; // Mock

  ngOnInit() {
    this.initActionForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequest(id);
    } else {
      this.onBack();
    }
  }

  private initActionForm() {
    this.actionForm = this.fb.group({
      comments: [''],
      escalateTo: [null]
    });
  }

  private loadRequest(id: string) {
    this.isLoading.set(true);
    this.hrmsService.getLeaveRequest(id).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      if (res?.data?.leaveRequest) {
        this.request.set(res.data.leaveRequest);
      }
    });
  }

  // --- Actions APIs ---

  onCancelRequest() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to cancel this leave request? This cannot be undone.',
      header: 'Cancel Leave',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.hrmsService.cancelLeaveRequest(this.request()._id).subscribe({
          next: (res: any) => {
            this.messageService.showSuccess(res.message)
            this.loadRequest(this.request()._id); // Refresh
          }
        });
      }
    });
  }

  showDialog(type: 'approve' | 'reject' | 'escalate') {
    this.actionType = type;
    this.actionForm.reset();

    // Setup validation rules dynamically based on action
    if (type === 'reject') {
      this.actionDialog = { title: 'Reject Request', message: 'Please provide a reason for rejecting this leave.', btnLabel: 'Reject Leave', btnSeverity: 'danger' };
      this.actionForm.get('comments')?.setValidators(Validators.required);
    } else if (type === 'escalate') {
      this.actionDialog = { title: 'Escalate Request', message: 'Select a senior manager and provide a reason for escalation.', btnLabel: 'Escalate', btnSeverity: 'secondary' };
      this.actionForm.get('comments')?.setValidators(Validators.required);
      this.actionForm.get('escalateTo')?.setValidators(Validators.required);
    } else {
      this.actionDialog = { title: 'Approve Request', message: 'Add optional comments to your approval.', btnLabel: 'Approve Leave', btnSeverity: 'success' };
      this.actionForm.clearValidators();
    }

    this.actionForm.updateValueAndValidity();
    this.displayActionDialog = true;
  }

  submitAction() {
    if (this.actionForm.invalid) return;
    this.isProcessing.set(true);

    const id = this.request()._id;
    const { comments, escalateTo } = this.actionForm.value;

    let req$;
    if (this.actionType === 'approve') req$ = this.hrmsService.approveLeaveRequest(id, comments);
    else if (this.actionType === 'reject') req$ = this.hrmsService.rejectLeaveRequest(id, comments);
    else req$ = this.hrmsService.escalateLeaveRequest(id, { reason: comments, escalateTo });

    req$.pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => {
        this.isProcessing.set(false);
        this.displayActionDialog = false;
      })
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        this.loadRequest(id);
      }
    });
  }

  // --- UI Helpers ---

  getTimelineEvents(req: any) {
    const events = [{
      status: 'Submitted', date: req.appliedAt, person: req.user?.name, icon: 'pi pi-file-o', color: '#64748b'
    }];

    if (req.approvalFlow && req.approvalFlow.length > 0) {
      req.approvalFlow.forEach((flow: any) => {
        events.push({
          status: flow.status === 'approved' ? 'Approved' : (flow.status === 'rejected' ? 'Rejected' : 'Reviewed'),
          date: flow.actionAt, person: 'Manager', // Resolve real name via API in prod
          // comment: flow.comments,
          icon: flow.status === 'approved' ? 'pi pi-check' : 'pi pi-times',
          color: flow.status === 'approved' ? '#10b981' : '#ef4444'
        });
      });
    } else if (req.status === 'pending') {
      events.push({ status: 'Awaiting Approval', date: new Date(), person: 'Reporting Manager', icon: 'pi pi-clock', color: '#f59e0b' });
    }
    return events;
  }

  getStatusSeverity(status: string): any {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': case 'cancelled': return 'danger';
      case 'escalated': return 'info';
      default: return 'secondary';
    }
  }

  onBack() { this.router.navigate(['/leave']); }
}