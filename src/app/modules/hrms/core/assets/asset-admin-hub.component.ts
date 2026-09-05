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
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import { CompanyAsset, HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-asset-admin-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
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
        title="Company Equipment & Assets"
        subtitle="Manage hardware allocations, device tracking, and custodian handovers">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="searchFilter()"
            (valueChange)="onSearchChange($event)"
            placeholder="Search code, asset name, serial...">
          </app-search-filter>

          <app-select-filter
            [options]="statusFilterOptions"
            [value]="statusFilter()"
            (valueChange)="onStatusChange($event)"
            placeholder="Status">
          </app-select-filter>

          <p-button
            label="Register Equipment"
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
              <span class="text-xs text-[var(--text-secondary)] font-medium">Total Inventory</span>
              <span class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ totalAssets() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">In Custody (Assigned)</span>
              <span class="text-xl font-bold text-emerald-600 mt-1">{{ assignedCount() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">Available in Store</span>
              <span class="text-xl font-bold text-[var(--primary-color)] mt-1">{{ availableCount() }}</span>
            </div>
            <div class="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col">
              <span class="text-xs text-[var(--text-secondary)] font-medium">In Maintenance / Lost</span>
              <span class="text-xl font-bold text-rose-600 mt-1">{{ inRepairCount() }}</span>
            </div>
          </div>

          <!-- Asset Grid -->
          <div class="flex-1 min-h-0">
            <app-data-grid
              [columns]="columns"
              [data]="assets()"
              [loading]="isLoading()"
              [rowActions]="rowActions"
              (gridEvent)="onGridEvent($event)">
            </app-data-grid>
          </div>
        </div>
      </app-page-content>
    </app-page>

    <!-- Register Asset Dialog -->
    <p-dialog
      header="Register Company Equipment"
      [(visible)]="showCreateModal"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Asset Code / Tag</label>
          <input type="text" pInputText [(ngModel)]="newAsset.assetCode" placeholder="e.g. LAP-2026-001" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Equipment Name</label>
          <input type="text" pInputText [(ngModel)]="newAsset.name" placeholder="e.g. MacBook Pro 14 M3" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Category</label>
            <p-select
              [options]="categoryOptions"
              [(ngModel)]="newAsset.category"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Condition</label>
            <p-select
              [options]="conditionOptions"
              [(ngModel)]="newAsset.condition"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Manufacturer</label>
            <input type="text" pInputText [(ngModel)]="newAsset.manufacturer" placeholder="Apple, Dell, etc." class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Serial Number</label>
            <input type="text" pInputText [(ngModel)]="newAsset.serialNumber" placeholder="Serial or IMEI" class="w-full" />
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showCreateModal.set(false)"></p-button>
          <p-button label="Save Asset" icon="pi pi-check" [loading]="isSubmitting()" (onClick)="submitCreate()"></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Assign Asset Dialog -->
    <p-dialog
      header="Assign Equipment to Employee"
      [(visible)]="showAssignModal"
      [modal]="true"
      [style]="{ width: '440px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-[var(--text-secondary)] m-0">
          Assigning <strong class="text-[var(--text-primary)]">{{ selectedAsset()?.name }}</strong> ({{ selectedAsset()?.assetTag }})
        </p>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Select Employee</label>
          <p-select
            [options]="employeeOptions()"
            [(ngModel)]="assignPayload.employeeId"
            optionLabel="label"
            optionValue="value"
            placeholder="Select staff member..."
            styleClass="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-[var(--text-secondary)] uppercase">Handover Notes</label>
          <textarea
            pInputText
            [(ngModel)]="assignPayload.notes"
            rows="3"
            placeholder="Charger, bag, serial recorded..."
            class="w-full"></textarea>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="showAssignModal.set(false)"></p-button>
          <p-button label="Confirm Assignment" icon="pi pi-check" [loading]="isSubmitting()" (onClick)="submitAssign()"></p-button>
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
export class AssetAdminHubComponent implements OnInit {
  private readonly hrmsService = inject(HRMSService);
  private readonly masterDropdownService = inject(MasterDropdownService);
  private readonly messageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly assets = signal<CompanyAsset[]>([]);
  readonly totalCount = signal(0);

  readonly searchFilter = signal('');
  readonly statusFilter = signal<string | null>(null);

  readonly showCreateModal = signal(false);
  readonly showAssignModal = signal(false);
  readonly selectedAsset = signal<CompanyAsset | null>(null);

  readonly employeeOptions = signal<{ label: string; value: string }[]>([]);

  readonly totalAssets = computed(() => this.assets().length);
  readonly assignedCount = computed(() => this.assets().filter(a => a.status === 'assigned').length);
  readonly availableCount = computed(() => this.assets().filter(a => a.status === 'available').length);
  readonly inRepairCount = computed(() => this.assets().filter(a => ['in_repair', 'lost', 'retired'].includes(a.status)).length);

  readonly statusFilterOptions: SelectFilterOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Available', value: 'available' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'In Repair', value: 'in_repair' },
    { label: 'Retired', value: 'retired' },
  ];

  readonly categoryOptions = [
    { label: 'Laptop', value: 'laptop' },
    { label: 'Mobile Device', value: 'mobile' },
    { label: 'Desktop / Workstation', value: 'desktop' },
    { label: 'Tablet', value: 'tablet' },
    { label: 'Access Card / Key', value: 'access_card' },
    { label: 'Other Equipment', value: 'other' },
  ];

  readonly conditionOptions = [
    { label: 'Brand New', value: 'new' },
    { label: 'Good Working Condition', value: 'good' },
    { label: 'Fair / Usable', value: 'fair' },
    { label: 'Repair Needed', value: 'repair_needed' },
  ];

  newAsset: any = {
    assetCode: '',
    name: '',
    category: 'laptop',
    condition: 'new',
    manufacturer: '',
    serialNumber: '',
  };

  assignPayload = {
    employeeId: '',
    notes: '',
  };

  readonly columns: GridColumn[] = [
    {
      field: 'assetCode',
      header: 'Asset Tag',
      minWidth: '140px',
      sortable: true,
      formatter: (v: string, row: any) => `
        <span class="font-mono font-semibold text-[var(--primary-color)] text-xs">${v || row.assetTag || '—'}</span>
      `,
    },
    {
      field: 'name',
      header: 'Equipment Description',
      minWidth: '220px',
      formatter: (v: string, row: any) => `
        <div class="flex flex-col">
          <span class="font-semibold text-xs text-[var(--text-primary)]">${v}</span>
          <span class="text-[11px] text-[var(--text-secondary)]">${row.manufacturer || ''} ${row.model || ''}</span>
        </div>
      `,
    },
    {
      field: 'category',
      header: 'Category',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => v ? v.toUpperCase() : 'OTHER',
    },
    {
      field: 'assignedTo',
      header: 'Current Custodian',
      minWidth: '180px',
      formatter: (_v: any, row: any) => {
        if (!row.assignedTo && !row.employeeRef) return '<span class="text-[var(--text-muted)] italic text-xs">Unassigned (In Store)</span>';
        const name = (typeof row.employeeRef === 'object' ? row.employeeRef?.displayName : null) || (typeof row.assignedTo === 'object' ? row.assignedTo?.name : null) || 'Assigned Staff';
        return `<span class="font-semibold text-xs text-emerald-600">${name}</span>`;
      },
    },
    {
      field: 'condition',
      header: 'Condition',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => v ? v.toUpperCase() : 'GOOD',
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      type: 'badge',
      formatter: (v: string) => (v || 'available').toUpperCase(),
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'assign',
      icon: 'pi pi-user-plus',
      tooltip: 'Assign to Employee',
      variant: 'primary',
      callback: (row: CompanyAsset) => this.openAssignModal(row),
    },
    {
      id: 'return',
      icon: 'pi pi-undo',
      tooltip: 'Return to Store',
      variant: 'ghost',
      callback: (row: CompanyAsset) => this.returnAsset(row._id),
    },
  ];

  ngOnInit(): void {
    this.loadAssets();
    this.loadDropdowns();
  }

  onSearchChange(val: string): void {
    this.searchFilter.set(val);
    this.loadAssets();
  }

  onStatusChange(val: string | null): void {
    this.statusFilter.set(val);
    this.loadAssets();
  }

  private loadAssets(): void {
    this.isLoading.set(true);
    const params: any = {};
    if (this.searchFilter()) params.search = this.searchFilter();
    if (this.statusFilter()) params.status = this.statusFilter();

    this.hrmsService.getCompanyAssets(params).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        const list = res.data?.assets || (Array.isArray(res.data) ? res.data : []);
        this.assets.set(list);
        this.totalCount.set(res.pagination?.totalResults ?? list.length);
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  private loadDropdowns(): void {
    this.masterDropdownService.getDropdownData('users').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.employeeOptions.set((res.data || []).map(u => ({ label: u.label, value: u.value })));
    });
  }

  openCreateModal(): void {
    this.newAsset = {
      assetCode: '',
      name: '',
      category: 'laptop',
      condition: 'new',
      manufacturer: '',
      serialNumber: '',
    };
    this.showCreateModal.set(true);
  }

  submitCreate(): void {
    if (!this.newAsset.assetCode || !this.newAsset.name) {
      this.messageService.showError('Asset Code and Name are required.');
      return;
    }

    this.isSubmitting.set(true);
    this.hrmsService.createCompanyAsset(this.newAsset).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.messageService.showSuccess('Equipment registered successfully.');
        this.loadAssets();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  openAssignModal(asset: CompanyAsset): void {
    this.selectedAsset.set(asset);
    this.assignPayload = { employeeId: '', notes: '' };
    this.showAssignModal.set(true);
  }

  submitAssign(): void {
    const asset = this.selectedAsset();
    if (!asset || !this.assignPayload.employeeId) {
      this.messageService.showError('Please choose an employee.');
      return;
    }

    this.isSubmitting.set(true);
    this.hrmsService.assignCompanyAsset(asset._id, this.assignPayload).pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showAssignModal.set(false);
        this.messageService.showSuccess('Asset assigned to employee.');
        this.loadAssets();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  returnAsset(id: string): void {
    this.hrmsService.returnCompanyAsset(id, { conditionAfter: 'good', notes: 'Returned to inventory store' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Asset checked back into store.');
        this.loadAssets();
      },
      error: err => this.messageService.handleHttpError(err),
    });
  }

  onGridEvent(_event: any): void {}
}
