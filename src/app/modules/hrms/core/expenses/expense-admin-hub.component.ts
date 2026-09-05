import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { ExpenseClaim, HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-expense-admin-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TooltipModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    SearchFilterComponent,
    SelectFilterComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Expense Claims & Reimbursements"
        subtitle="Manage business expense reimbursement pipelines, approve claims, and link to monthly payroll">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="searchFilter()"
            (valueChange)="onSearchChange($event)"
            placeholder="Search claim ID or title...">
          </app-search-filter>

          <app-select-filter
            [options]="statusFilterOptions"
            [value]="statusFilter()"
            (valueChange)="onStatusChange($event)"
            placeholder="Status">
          </app-select-filter>

          <p-button
            label="Submit Expense Claim"
            icon="pi pi-plus"
            (onClick)="openCreateModal()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <div class="flex flex-col gap-4 h-full">
          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Total Claims</span>
              <span class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ totalClaims() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Total Claimed Value</span>
              <span class="text-xl font-bold text-amber-600 mt-1">₹{{ totalClaimed() | number:'1.0-0' }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Approved for Payout</span>
              <span class="text-xl font-bold text-emerald-600 mt-1">₹{{ totalApproved() | number:'1.0-0' }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Reimbursed Count</span>
              <span class="text-xl font-bold text-[var(--primary-color)] mt-1">{{ reimbursedCount() }}</span>
            </div>
          </div>

          <!-- Claims Grid -->
          <div class="flex-1 min-h-0">
            <app-data-grid
              [columns]="columns"
              [data]="claims()"
              [loading]="isLoading()"
              [rowActions]="rowActions"
              (gridEvent)="onGridEvent($event)">
            </app-data-grid>
          </div>
        </div>
      </app-page-content>
    </app-page>

    <!-- Create Claim Modal -->
    <p-dialog
      header="Submit Expense Claim"
      [(visible)]="showCreateModal"
      [modal]="true"
      [style]="{ width: '560px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Claim Title</label>
          <input type="text" pInputText [(ngModel)]="newClaim.title" placeholder="e.g. Client Visit Travel & Food" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Category</label>
            <p-select
              [options]="categoryOptions"
              [(ngModel)]="newItem.category"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Amount (₹)</label>
            <p-inputNumber
              [(ngModel)]="newItem.amount"
              mode="currency"
              currency="INR"
              locale="en-IN"
              class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Expense Description</label>
          <input type="text" pInputText [(ngModel)]="newItem.description" placeholder="Travel tickets, meal receipt, etc." class="w-full" />
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showCreateModal.set(false)"></p-button>
          <p-button label="Submit Claim" icon="pi pi-send" [loading]="isSubmitting()" (onClick)="submitCreate()"></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Review / Decision Modal -->
    <p-dialog
      header="Review Expense Claim"
      [(visible)]="showReviewModal"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      @if (selectedClaim(); as c) {
        <div class="flex flex-col gap-4 py-2">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
            <div>
              <h3 class="text-sm font-bold text-[var(--text-primary)] m-0">{{ c.title }}</h3>
              <p class="text-xs text-[var(--text-secondary)] m-0 font-mono">{{ c.claimNumber }}</p>
            </div>
            <span class="text-base font-black text-[var(--primary-color)]">₹{{ c.totalAmount | number:'1.0-0' }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Approved Amount (₹)</label>
            <p-inputNumber
              [(ngModel)]="approvalPayload.approvedAmount"
              mode="currency"
              currency="INR"
              locale="en-IN"
              class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Review Remarks</label>
            <textarea
              pInputText
              [(ngModel)]="approvalPayload.comments"
              rows="3"
              placeholder="Verified receipts and budget eligibility..."
              class="w-full"></textarea>
          </div>
        </div>
      }

      <ng-template #footer>
        <div class="flex justify-between items-center w-full pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showReviewModal.set(false)"></p-button>
          <div class="flex gap-2">
            <p-button label="Reject" icon="pi pi-times" severity="danger" [loading]="isSubmitting()" (onClick)="submitDecision('reject')"></p-button>
            <p-button label="Approve Claim" icon="pi pi-check" severity="success" [loading]="isSubmitting()" (onClick)="submitDecision('approve')"></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
  `],
})
export class ExpenseAdminHubComponent implements OnInit {
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly claims = signal<ExpenseClaim[]>([]);
  readonly totalCount = signal(0);

  readonly searchFilter = signal('');
  readonly statusFilter = signal<string | null>(null);

  readonly showCreateModal = signal(false);
  readonly showReviewModal = signal(false);
  readonly selectedClaim = signal<ExpenseClaim | null>(null);

  readonly totalClaims = computed(() => this.claims().length);
  readonly totalClaimed = computed(() => this.claims().reduce((sum, c) => sum + (c.totalAmount || 0), 0));
  readonly totalApproved = computed(() => this.claims().reduce((sum, c) => sum + (c.approvedAmount || 0), 0));
  readonly reimbursedCount = computed(() => this.claims().filter(c => c.status === 'reimbursed').length);

  readonly statusFilterOptions: SelectFilterOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Submitted / Pending', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Partially Approved', value: 'partially_approved' },
    { label: 'Reimbursed in Payroll', value: 'reimbursed' },
    { label: 'Rejected', value: 'rejected' },
  ];

  readonly categoryOptions = [
    { label: 'Travel & Transport', value: 'travel' },
    { label: 'Meals & Food', value: 'food' },
    { label: 'Hotel & Lodging', value: 'lodging' },
    { label: 'Fuel / Mileage', value: 'fuel' },
    { label: 'Phone & Internet', value: 'phone' },
    { label: 'Office Supplies', value: 'office' },
    { label: 'Client Entertainment', value: 'client' },
    { label: 'Other', value: 'other' },
  ];

  newClaim = { title: '' };
  newItem = { category: 'travel', amount: 1500, description: '' };

  approvalPayload = {
    approvedAmount: 0,
    comments: '',
  };

  readonly columns: GridColumn[] = [
    {
      field: 'claimNumber',
      header: 'Claim ID',
      minWidth: '130px',
      sortable: true,
      formatter: (v: string) => `<span class="font-mono font-semibold text-[var(--primary-color)] text-xs">${v || '—'}</span>`,
    },
    {
      field: 'title',
      header: 'Claim Title',
      minWidth: '220px',
      formatter: (v: string, row: ExpenseClaim) => `
        <div class="flex flex-col">
          <span class="font-semibold text-xs text-[var(--text-primary)]">${v}</span>
          <span class="text-[11px] text-[var(--text-secondary)]">${(row.items || []).length} item(s)</span>
        </div>
      `,
    },
    {
      field: 'user',
      header: 'Claimant',
      minWidth: '180px',
      formatter: (_v: any, row: any) => {
        const name = (typeof row.user === 'object' ? row.user?.name : null) || (typeof row.employeeId === 'object' ? row.employeeId?.displayName : null) || 'Staff';
        return `<span class="font-medium text-xs text-[var(--text-primary)]">${name}</span>`;
      },
    },
    {
      field: 'totalAmount',
      header: 'Claim Amount',
      width: '130px',
      formatter: (v: number) => `<span class="font-bold text-xs text-[var(--text-primary)]">₹${(v || 0).toLocaleString()}</span>`,
    },
    {
      field: 'approvedAmount',
      header: 'Approved',
      width: '130px',
      formatter: (v: number, row: ExpenseClaim) => {
        if (!['approved', 'partially_approved', 'reimbursed'].includes(row.status)) return '<span class="text-[var(--text-muted)] italic text-xs">—</span>';
        return `<span class="font-bold text-xs text-emerald-600">₹${(v || 0).toLocaleString()}</span>`;
      },
    },
    {
      field: 'status',
      header: 'Status',
      width: '130px',
      type: 'badge',
      formatter: (v: string) => (v || 'draft').replace(/_/g, ' ').toUpperCase(),
    },
    {
      field: 'createdAt',
      header: 'Submitted On',
      width: '120px',
      formatter: (v: any) => {
        if (!v) return '—';
        try {
          return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
          return '—';
        }
      },
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'review',
      icon: 'pi pi-check-square',
      tooltip: 'Review and Approve Claim',
      variant: 'primary',
      callback: (row: ExpenseClaim) => this.openReviewModal(row),
    },
    {
      id: 'delete',
      icon: 'pi pi-trash',
      tooltip: 'Delete Claim',
      variant: 'ghost',
      callback: (row: ExpenseClaim) => this.deleteClaim(row._id),
    },
  ];

  ngOnInit(): void {
    this.loadClaims();
  }

  onSearchChange(val: string): void {
    this.searchFilter.set(val);
    this.loadClaims();
  }

  onStatusChange(val: string | null): void {
    this.statusFilter.set(val);
    this.loadClaims();
  }

  private loadClaims(): void {
    this.isLoading.set(true);
    const params: any = {};
    if (this.searchFilter()) params.search = this.searchFilter();
    if (this.statusFilter()) params.status = this.statusFilter();

    this.hrmsService.getExpenseClaims(params).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const list = res.data?.expenseClaims || (Array.isArray(res.data) ? res.data : []);
        this.claims.set(list);
        this.totalCount.set(res.pagination?.totalResults ?? list.length);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openCreateModal(): void {
    this.newClaim = { title: '' };
    this.newItem = { category: 'travel', amount: 1500, description: '' };
    this.showCreateModal.set(true);
  }

  submitCreate(): void {
    if (!this.newClaim.title) {
      this.messageService.showError('Claim Title is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.hrmsService.createExpenseClaim({
      title: this.newClaim.title,
      status: 'submitted',
      items: [{
        category: this.newItem.category as any,
        amount: this.newItem.amount,
        description: this.newItem.description,
        expenseDate: new Date(),
      }],
    }).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.messageService.showSuccess('Expense claim submitted for approval.');
        this.loadClaims();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openReviewModal(claim: ExpenseClaim): void {
    this.selectedClaim.set(claim);
    this.approvalPayload = {
      approvedAmount: claim.approvedAmount || claim.totalAmount,
      comments: '',
    };
    this.showReviewModal.set(true);
  }

  submitDecision(decision: 'approve' | 'reject'): void {
    const claim = this.selectedClaim();
    if (!claim) return;

    this.isSubmitting.set(true);
    const req$ = decision === 'approve'
      ? this.hrmsService.approveExpenseClaim(claim._id, this.approvalPayload)
      : this.hrmsService.rejectExpenseClaim(claim._id, { comments: this.approvalPayload.comments });

    req$.pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showReviewModal.set(false);
        this.messageService.showSuccess(`Expense claim ${decision === 'approve' ? 'approved' : 'rejected'}.`);
        this.loadClaims();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  deleteClaim(id: string): void {
    this.hrmsService.deleteExpenseClaim(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Claim deleted.');
        this.loadClaims();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  onGridEvent(_event: any): void {}
}
