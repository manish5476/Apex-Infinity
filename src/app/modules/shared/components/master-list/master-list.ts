import { Component, OnInit, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG Imports
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services
import { MasterService } from '../../../../core/services/master.service';
import { AppMessageService } from '../../../../core/services/message.service';

// Layout Components
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';

// Enterprise DataGrid
import { DataGridComponent } from '../../../../shared/ui/grid/data-grid.component';
import {
  GridColumn,
  GridRowAction,
  GridBulkAction,
  GridRowSaveEvent,
  GridContext,
} from '../../../../shared/ui/grid/grid-types';

export interface Master {
  _id: string;
  type: string;
  name: string;
  code?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured?: boolean;
  metadata?: {
    isFeatured: boolean;
    sortOrder: number;
  };
}

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    DataGridComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page class="bg-[color-mix(in_srgb,var(--accent-primary)_2%,var(--bg-secondary))]">
      <app-page-header
        variant="transparent"
        density="compact"
        title="Master Data"
        subtitle="Manage your master reference data across all modules"
        class="!m-0 !mb-4">
      </app-page-header>

      <app-page-content  [density]="'compact'"  [fullWidth]="true">
        <div class="flex flex-col flex-1 min-h-0 w-full px-6 pb-6">
          <!-- Enterprise DataGrid -->
          <app-data-grid
            gridId="master-data"
            dataKey="_id"
            [data]="masters()"
            [columns]="columns"
            [rowSelection]="true"
            [multipleSelection]="true"
            [pagination]="true"
            [pageSize]="15"
            [loading]="loading()"
            [rowActions]="rowActions"
            [bulkActions]="bulkActions"
            [enableExport]="true"
            [enableAdd]="true"
            [enableUndo]="true"
            [enableContextMenu]="true"
            [persistState]="true"
            (rowSave)="onRowSave($event)"
            (rowDelete)="onRowDelete($event)"
            (rowDuplicate)="onRowDuplicate($event)"
            (selectionChange)="onSelectionChange($event)"
            (addNew)="onAddNew()"
            (refresh)="loadMasters()">
          </app-data-grid>

        </div>
      </app-page-content>
    </app-page>

    <p-toast></p-toast>
    <p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}">
    </p-confirmDialog>
  `,
})
export class MasterList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Services
  private masterService = inject(MasterService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // State
  masters = signal<Master[]>([]);
  selectedRows = signal<Master[]>([]);
  loading = signal(false);

  // Master type options (used in 'type' column)
  readonly masterTypes = [
    { label: 'Department', value: 'department' },
    { label: 'Category', value: 'category' },
    { label: 'Sub Category', value: 'sub_category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Tax Rate', value: 'tax_rate' },
  ];

  // ─── Column Definitions ─────────────────────────────────────────────────
  columns: GridColumn[] = [
    {
      field: 'type',
      header: 'Type',
      type: 'select',
      options: this.masterTypes,
      editable: true,
      width: '160px',
      sortable: true,
      filterable: true,
    },
    {
      field: 'name',
      header: 'Master Name',
      type: 'text',
      editable: true,
      width: '240px',
      sortable: true,
      filterable: true,
      searchable: true,
      required: true,
    },
    {
      field: 'code',
      header: 'Code',
      type: 'text',
      editable: true,
      width: '120px',
      sortable: true,
      filterable: true,
    },
    {
      field: 'description',
      header: 'Description',
      type: 'textarea',
      editable: true,
      width: '80px',
      align: 'center',
      sortable: true,
      filterable: true,
    },
    {
      field: 'isFeatured',
      header: 'Featured',
      type: 'boolean',
      editable: true,
      width: '80px',
      align: 'center',
    },
  ];

  // ─── Row Actions ────────────────────────────────────────────────────────
  rowActions: GridRowAction[] = [
    {
      id: 'archive',
      icon: 'pi pi-inbox',
      label: 'Archive',
      tooltip: 'Archive this record',
      variant: 'ghost',
      showWhen: 'hover',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (row: any) => {
        this.appMessage.showInfo?.('Archive feature coming soon for: ' + row['name']);
      },
    },
  ];

  // ─── Bulk Actions ────────────────────────────────────────────────────────
  bulkActions: GridBulkAction[] = [
    {
      id: 'bulk-delete',
      icon: 'pi pi-trash',
      label: 'Delete',
      variant: 'danger',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (rows: any[], _ctx: GridContext) => {
        this.confirmBulkDelete(rows as Master[]);
      },
    },
    {
      id: 'bulk-activate',
      icon: 'pi pi-check-circle',
      label: 'Activate',
      variant: 'primary',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (rows: any[]) => {
        // Mark all selected rows as active then save
        rows.forEach(r => (r['isActive'] = true));
        this.appMessage.showSuccess?.(`${rows.length} records activated`);
      },
    },
  ];

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void { this.loadMasters(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Load ────────────────────────────────────────────────────────────────

  loadMasters(): void {
    this.loading.set(true);
    this.masterService.getMasters().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = res.data?.masters || res.data || [];
        const mapped = data.map((d: Master) => ({
          ...d,
          isFeatured: d.metadata?.isFeatured ?? false,
        }));
        this.masters.set(mapped);
        this.selectedRows.set([]);
        this.loading.set(false);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loading.set(false);
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectionChange(rows: any[]): void {
    this.selectedRows.set(rows as Master[]);
  }


  // ─── Add New Row ─────────────────────────────────────────────────────────

  onAddNew(): void {
    this.masters.update(data => [this.createEmptyMaster(), ...data]);
  }

  // ─── Single Row Save ─────────────────────────────────────────────────────

  onRowSave(event: GridRowSaveEvent): void {
    const row = event.row as Master;

    if (!row.name?.trim() || !row.type) {
      this.appMessage.showError?.('Name and Type are required.');
      return;
    }

    const payload = this.preparePayload(row);

    this.masterService.bulkUpdateMasters([payload]).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.appMessage.showSuccess?.(res.message || 'Record saved successfully');
        this.loadMasters();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters();
      },
    });
  }

  // ─── Delete ─────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowDelete(row: any): void {
    const master = row as Master;
    this.confirmationService.confirm({
      message: `Delete <b>${master.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      accept: () => this.deleteMasters([master]),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowDuplicate(row: any): void {
    const dup = { ...row as Master, _id: `new_${Date.now()}`, name: (row as Master).name + ' (Copy)' };
    this.masters.update(data => [dup, ...data]);
  }

  confirmBulkDelete(rows: Master[]): void {
    if (!rows.length) return;
    this.confirmationService.confirm({
      message: `Delete <b>${rows.length}</b> records?`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      accept: () => this.deleteMasters(rows),
    });
  }

  private deleteMasters(rows: Master[]): void {
    const ids = rows.map(r => r._id).filter(id => !id.startsWith('new_'));
    if (!ids.length) { this.loadMasters(); return; }

    this.loading.set(true);
    this.masterService.bulkDeleteMasters(ids).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.appMessage.showSuccess?.(res.message || 'Records deleted');
        this.loadMasters();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters();
      },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private createEmptyMaster(): Master {
    return {
      _id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'category',
      name: '',
      code: '',
      description: '',
      isActive: true,
      isFeatured: false,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private preparePayload(row: Master): any {
    return {
      _id: row._id.startsWith('new_') ? undefined : row._id,
      type: row.type,
      name: row.name,
      code: row.code ? row.code.toUpperCase() : null,
      description: row.description,
      isActive: row.isActive,
      metadata: {
        isFeatured: row.isFeatured ?? false,
        sortOrder: row.metadata?.sortOrder ?? 0,
      },
    };
  }
}