import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-leave-balance-detail',
  standalone: true,
  imports: [
    CommonModule, DatePipe, CardModule, ButtonModule, TableModule,
    TagModule, SkeletonModule, AvatarModule, TooltipModule,
    DividerModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

    <div class="page-wrapper fade-in">
      
      @if (isLoading()) {
        <div class="flex-col gap-4">
          <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
          <div class="grid-3"><p-skeleton height="120px" borderRadius="12px"></p-skeleton><p-skeleton height="120px" borderRadius="12px"></p-skeleton><p-skeleton height="120px" borderRadius="12px"></p-skeleton></div>
          <p-skeleton height="400px" borderRadius="12px"></p-skeleton>
        </div>
      } @else if (balance(); as bal) {
        
        <header class="dashboard-header slide-down mb-5">
          <div class="header-left">
            <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onBack()"></p-button>
            <div class="header-titles">
              <div class="flex-align gap-3">
                <p-avatar [label]="getInitials(bal.user?.name)" shape="circle" size="large" [style]="{'background-color': 'var(--color-primary-bg)', 'color': 'var(--color-primary)'}"></p-avatar>
                <div class="flex-col">
                  <h1 class="page-title m-0">{{ bal.user?.name || 'Employee Profile' }}</h1>
                  <p class="page-subtitle mt-1">Financial Year: <span class="badge-mono-sm ml-1">{{ bal.financialYear }}</span></p>
                </div>
              </div>
            </div>
          </div>
          <div class="header-right flex-align gap-2">
            <p-button 
              label="Initialize Next Year" 
              icon="pi pi-forward" 
              [outlined]="true" 
              severity="secondary"
              (onClick)="onInitializeNextYear(bal.user?._id, bal.financialYear)">
            </p-button>
            <p-button 
              label="Manual Adjustment" 
              icon="pi pi-sliders-h" 
              styleClass="p-button-primary"
              (onClick)="openAdjustModal()">
            </p-button>
          </div>
        </header>

        <div class="balance-grid mb-5 slide-down" styleClass="animation-delay: 0.1s">
          
          <p-card styleClass="premium-card glass-card b-card">
            <div class="b-header">
              <span class="b-title text-secondary">Casual Leave (CL)</span>
              <div class="icon-circle bg-primary-light text-primary"><i class="pi pi-sun"></i></div>
            </div>
            <div class="b-body mt-3">
              <div class="flex-align gap-2 align-baseline">
                <span class="b-value text-primary">{{ (bal.casualLeave?.total || 0) - (bal.casualLeave?.used || 0) }}</span>
                <span class="b-total text-tertiary">/ {{ bal.casualLeave?.total || 0 }} Available</span>
              </div>
              <div class="text-xs text-secondary mt-2"><span class="font-bold text-error">{{ bal.casualLeave?.used || 0 }}</span> days utilized this year.</div>
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card b-card">
            <div class="b-header">
              <span class="b-title text-secondary">Sick Leave (SL)</span>
              <div class="icon-circle bg-error-light text-error"><i class="pi pi-heart-fill"></i></div>
            </div>
            <div class="b-body mt-3">
              <div class="flex-align gap-2 align-baseline">
                <span class="b-value text-error">{{ (bal.sickLeave?.total || 0) - (bal.sickLeave?.used || 0) }}</span>
                <span class="b-total text-tertiary">/ {{ bal.sickLeave?.total || 0 }} Available</span>
              </div>
              <div class="text-xs text-secondary mt-2"><span class="font-bold text-error">{{ bal.sickLeave?.used || 0 }}</span> days utilized this year.</div>
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card b-card">
            <div class="b-header">
              <span class="b-title text-secondary">Earned Leave (EL)</span>
              <div class="icon-circle bg-warning-light text-warning"><i class="pi pi-star-fill"></i></div>
            </div>
            <div class="b-body mt-3">
              <div class="flex-align gap-2 align-baseline">
                <span class="b-value text-warning">{{ (bal.earnedLeave?.total || 0) - (bal.earnedLeave?.used || 0) }}</span>
                <span class="b-total text-tertiary">/ {{ bal.earnedLeave?.total || 0 }} Available</span>
              </div>
              <div class="text-xs text-secondary mt-2">Accruing at <span class="font-bold">{{ bal.accrualRate?.earnedLeavePerMonth || 0 }}</span> / month.</div>
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card b-card bg-surface shadow-none border-dashed">
            <div class="b-header mb-2"><span class="b-title text-secondary">Special Leaves Taken</span></div>
            <ul class="special-leaves-list">
              <li class="flex-between py-1 border-bottom-subtle">
                <span class="text-sm text-tertiary">Compensatory Off</span>
                <span class="font-bold">{{ bal.compensatoryOff?.used || 0 }} / {{ bal.compensatoryOff?.total || 0 }}</span>
              </li>
              <li class="flex-between py-1 border-bottom-subtle">
                <span class="text-sm text-tertiary">Loss of Pay (LWP)</span>
                <span class="font-bold text-error">{{ bal.unpaidLeave?.used || 0 }}</span>
              </li>
              <li class="flex-between py-1">
                <span class="text-sm text-tertiary">Maternity/Paternity</span>
                <span class="font-bold">{{ (bal.maternityLeave?.used || 0) + (bal.paternityLeave?.used || 0) }}</span>
              </li>
            </ul>
          </p-card>
        </div>

        <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.2s">
          <h3 class="font-heading m-0 mb-4 text-primary-color flex-align gap-2">
            <i class="pi pi-list text-tertiary"></i> Balance Transaction Ledger
          </h3>
          
          <p-table 
            [value]="bal.transactions" 
            [paginator]="true" 
            [rows]="10" 
            [sortField]="'date'" 
            [sortOrder]="-1"
            responsiveLayout="scroll"
            styleClass="premium-table border-round-xl border-1 surface-border">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="date">Transaction Date <p-sortIcon field="date"></p-sortIcon></th>
                <th pSortableColumn="leaveType">Leave Type <p-sortIcon field="leaveType"></p-sortIcon></th>
                <th pSortableColumn="changeType">Operation <p-sortIcon field="changeType"></p-sortIcon></th>
                <th class="text-right">Amount</th>
                <th class="text-right">Running Bal.</th>
                <th>Description / Reference</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-txn>
              <tr class="table-row-hover">
                <td class="font-medium text-secondary">{{ txn.date | date:'dd MMM yyyy, HH:mm' }}</td>
                <td>
                  <span class="font-bold capitalize text-primary-color">
                    {{ formatLeaveType(txn.leaveType) }}
                  </span>
                </td>
                <td>
                  <p-tag [severity]="getTxnSeverity(txn.changeType)" [value]="txn.changeType | uppercase"></p-tag>
                </td>
                <td class="text-right">
                  <span class="font-bold text-lg" [ngClass]="getTxnAmountColor(txn.changeType)">
                    {{ txn.changeType === 'debited' || txn.changeType === 'expired' ? '-' : '+' }}{{ txn.amount }}
                  </span>
                </td>
                <td class="text-right font-mono font-bold text-secondary bg-surface">{{ txn.runningBalance }}</td>
                <td>
                  <div class="flex-col gap-1">
                    <span class="text-sm text-secondary">{{ txn.description || 'System Update' }}</span>
                    @if (txn.referenceId) {
                      <span class="text-xs text-tertiary font-mono">Ref: {{ txn.referenceId }}</span>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr><td colspan="6" class="text-center py-5 text-secondary">No transactions logged for this financial year yet.</td></tr>
            </ng-template>
          </p-table>
        </p-card>

      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }

    /* Utility */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .align-baseline { align-items: baseline; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-3 { margin-top: var(--spacing-md); }
    .ml-1 { margin-left: var(--spacing-xs); }
    
    .py-1 { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
    
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
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .capitalize { text-transform: capitalize; }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-error-light { background: var(--color-error-bg, #fef2f2); }
    .bg-warning-light { background: #fff7ed; }
    
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-round-xl { border-radius: var(--radius-2xl); }
    .border-dashed { border: 1px dashed var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid rgba(0,0,0,0.05); }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }
    .badge-mono-sm { font-family: var(--font-mono); font-size: 11px; background: var(--bg-primary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-primary); color: var(--text-secondary); }

    /* Cards */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm); }
    ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); }
    ::ng-deep .premium-card .p-card-content { padding: 0; }
    
    /* Balance Grid */
    .balance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-xl); }
    ::ng-deep .b-card .p-card-body { padding: var(--spacing-xl); height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .b-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .b-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.05em; }
    .icon-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .b-value { font-size: 3rem; font-weight: var(--font-weight-bold); line-height: 1; letter-spacing: -0.03em; }
    .b-total { font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); }
    .special-leaves-list { list-style: none; padding: 0; margin: 0; }

    /* Table */
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
      .header-right { flex-direction: column; align-items: stretch; }
      ::ng-deep .p-button { width: 100%; justify-content: center; }
    }
  `]
})
export class LeaveBalanceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  balanceId: string = '';
  balance = signal<any>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.balanceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.balanceId) {
      this.loadBalanceDetails();
    } else {
      this.onBack();
    }
  }

  private loadBalanceDetails() {
    this.isLoading.set(true);
    this.hrmsService.getLeaveBalance(this.balanceId).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        this.onBack();
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      if (res?.data?.leaveBalance) {
        this.balance.set(res.data.leaveBalance);
      }
    });
  }

  // --- Actions ---

  /**
   * Initializes the balance for the specified user for the upcoming financial year.
   * This covers the 'initializeLeaveBalance' API.
   */
  onInitializeNextYear(userId: string, currentFy: string) {
    if (!userId) return;

    // Simple logic to parse "2024-2025" to "2025-2026"
    const years = currentFy.split('-');
    const nextFy = `${parseInt(years[0]) + 1}-${parseInt(years[1]) + 1}`;

    this.confirmationService.confirm({
      message: `Are you sure you want to initialize a new balance ledger for <b>${nextFy}</b> for this employee? Carry-forward rules will be applied automatically.`,
      header: 'Initialize New Year',
      icon: 'pi pi-calendar-plus',
      acceptButtonStyleClass: 'p-button-primary',
      accept: () => {
        this.hrmsService.initializeLeaveBalance(userId, nextFy).subscribe({
          next: () => {
            // this.messageService.add({ severity: 'success', summary: 'Initialized', detail: `Ledger for ${nextFy} created successfully.` });
            // Optionally route them to the new ledger ID returned by the API
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  openAdjustModal() {
    // Navigates or emits event to parent if you want to use the dialog from the Admin component,
    // or you can implement the standalone dialog here exactly as done in Admin.
    // this.messageService.add({ severity: 'info', summary: 'Manual Adjustment', detail: 'Use the admin hub to perform manual credits/debits.' });
  }

  // --- Formatting Helpers ---

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatLeaveType(type: string): string {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // 'casualLeave' -> 'Casual Leave'
  }

  getTxnSeverity(changeType: string): any {
    switch (changeType) {
      case 'credited': return 'success';
      case 'debited': return 'danger';
      case 'adjusted': return 'info';
      case 'expired': return 'secondary';
      case 'carry_forward': return 'warning';
      default: return 'secondary';
    }
  }

  getTxnAmountColor(changeType: string): string {
    switch (changeType) {
      case 'credited':
      case 'carry_forward': return 'text-success';
      case 'debited':
      case 'expired': return 'text-error';
      case 'adjusted': return 'text-primary';
      default: return 'text-secondary';
    }
  }

  onBack() {
    this.router.navigate(['/leave-balances']);
  }
}