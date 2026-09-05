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
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { EmployeeDocument, HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-document-admin-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
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
        title="Employee Compliance & Documents"
        subtitle="Audit statutory KYC proofs, contracts, and identity verifications">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="searchFilter()"
            (valueChange)="onSearchChange($event)"
            placeholder="Search document title...">
          </app-search-filter>

          <app-select-filter
            [options]="statusFilterOptions"
            [value]="statusFilter()"
            (valueChange)="onStatusChange($event)"
            placeholder="Status">
          </app-select-filter>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <div class="flex flex-col gap-4 h-full">
          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Total Documents</span>
              <span class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ totalDocs() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Pending Verification</span>
              <span class="text-xl font-bold text-amber-600 mt-1">{{ pendingCount() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Verified Compliance</span>
              <span class="text-xl font-bold text-emerald-600 mt-1">{{ verifiedCount() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Rejected / Re-upload</span>
              <span class="text-xl font-bold text-rose-600 mt-1">{{ rejectedCount() }}</span>
            </div>
          </div>

          <!-- Documents DataGrid -->
          <div class="flex-1 min-h-0">
            <app-data-grid
              [columns]="columns"
              [data]="documents()"
              [loading]="isLoading()"
              [rowActions]="rowActions"
              (gridEvent)="onGridEvent($event)">
            </app-data-grid>
          </div>
        </div>
      </app-page-content>
    </app-page>

    <!-- Verification Dialog -->
    <p-dialog
      header="Document Verification Decision"
      [(visible)]="showVerifyModal"
      [modal]="true"
      [style]="{ width: '440px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-[var(--text-secondary)] m-0">
          Reviewing document: <strong class="text-[var(--text-primary)]">{{ selectedDoc()?.title }}</strong>
        </p>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Verification Notes / Reason</label>
          <textarea
            pInputText
            [(ngModel)]="verificationNotes"
            rows="3"
            placeholder="Official identity details match company records..."
            class="w-full"></textarea>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-between items-center w-full pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showVerifyModal.set(false)"></p-button>
          <div class="flex gap-2">
            <p-button label="Reject" icon="pi pi-times" severity="danger" [loading]="isSubmitting()" (onClick)="submitDecision('rejected')"></p-button>
            <p-button label="Verify" icon="pi pi-check" severity="success" [loading]="isSubmitting()" (onClick)="submitDecision('verified')"></p-button>
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
export class DocumentAdminHubComponent implements OnInit {
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly documents = signal<EmployeeDocument[]>([]);
  readonly totalCount = signal(0);

  readonly searchFilter = signal('');
  readonly statusFilter = signal<string | null>(null);

  readonly showVerifyModal = signal(false);
  readonly selectedDoc = signal<EmployeeDocument | null>(null);
  verificationNotes = '';

  readonly totalDocs = computed(() => this.documents().length);
  readonly verifiedCount = computed(() => this.documents().filter(d => d.status === 'verified').length);
  readonly pendingCount = computed(() => this.documents().filter(d => d.status === 'pending').length);
  readonly rejectedCount = computed(() => this.documents().filter(d => d.status === 'rejected').length);

  readonly statusFilterOptions: SelectFilterOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Pending HR Verification', value: 'pending' },
    { label: 'Verified', value: 'verified' },
    { label: 'Rejected', value: 'rejected' },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'title',
      header: 'Document Title',
      minWidth: '220px',
      sortable: true,
      formatter: (v: string, row: EmployeeDocument) => `
        <div class="flex flex-col">
          <span class="font-semibold text-xs text-[var(--text-primary)]">${v}</span>
          <span class="text-[11px] font-mono text-[var(--text-secondary)]">${row.documentNumber || 'Confidential ID'}</span>
        </div>
      `,
    },
    {
      field: 'documentType',
      header: 'Document Type',
      width: '150px',
      type: 'badge',
      formatter: (v: string) => v ? v.replace(/_/g, ' ').toUpperCase() : 'OTHER',
    },
    {
      field: 'employee',
      header: 'Employee Staff',
      minWidth: '180px',
      formatter: (_v: any, row: any) => {
        const name = (typeof row.user === 'object' ? row.user?.name : null) || (typeof row.employeeRef === 'object' ? row.employeeRef?.displayName : null) || 'Employee';
        return `<span class="font-medium text-xs text-[var(--text-primary)]">${name}</span>`;
      },
    },
    {
      field: 'status',
      header: 'Verification Status',
      width: '140px',
      type: 'badge',
      formatter: (v: string) => (v || 'pending').toUpperCase(),
    },
    {
      field: 'createdAt',
      header: 'Uploaded On',
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
      id: 'verify',
      icon: 'pi pi-shield',
      tooltip: 'Verify or Reject Document',
      variant: 'primary',
      callback: (row: EmployeeDocument) => this.openVerifyModal(row),
    },
    {
      id: 'delete',
      icon: 'pi pi-trash',
      tooltip: 'Delete Document',
      variant: 'ghost',
      callback: (row: EmployeeDocument) => this.deleteDoc(row._id),
    },
  ];

  ngOnInit(): void {
    this.loadDocuments();
  }

  onSearchChange(val: string): void {
    this.searchFilter.set(val);
    this.loadDocuments();
  }

  onStatusChange(val: string | null): void {
    this.statusFilter.set(val);
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.isLoading.set(true);
    const params: any = {};
    if (this.searchFilter()) params.search = this.searchFilter();
    if (this.statusFilter()) params.status = this.statusFilter();

    this.hrmsService.getEmployeeDocuments(params).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const list = res.data?.documents || (Array.isArray(res.data) ? res.data : []);
        this.documents.set(list);
        this.totalCount.set(res.pagination?.totalResults ?? list.length);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openVerifyModal(doc: EmployeeDocument): void {
    this.selectedDoc.set(doc);
    this.verificationNotes = doc.verificationNotes || '';
    this.showVerifyModal.set(true);
  }

  submitDecision(status: 'verified' | 'rejected'): void {
    const doc = this.selectedDoc();
    if (!doc) return;

    this.isSubmitting.set(true);
    this.hrmsService.verifyEmployeeDocument(doc._id, {
      status,
      verificationNotes: this.verificationNotes,
    }).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showVerifyModal.set(false);
        this.messageService.showSuccess(`Document marked as ${status}.`);
        this.loadDocuments();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  deleteDoc(id: string): void {
    this.hrmsService.deleteEmployeeDocument(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Document deleted.');
        this.loadDocuments();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  onGridEvent(_event: any): void {}
}
