import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

// Services
import { MasterService } from '../../../../core/services/master.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';

// Grid Components & Types
import { AppSharedGrid, SharedGridEvent } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
import { GridColDef } from "../../AgGrid/grid/grid.types";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AppSharedGridActionButton } from '../../AgGrid/grid/app-shared-grid-action-button/app-shared-grid-action-button';
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
import { ButtonComponent } from '../../../../shared/ui/form/button.component';

// --- Interface based on Mongoose Schema ---
export interface Master {
  _id: string;
  type: string;
  name: string;
  code?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive: boolean;
  metadata?: {
    isFeatured: boolean;
    sortOrder: number;
  };
  _tempId?: string; // Helper for new rows from AppSharedGrid
}

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    AppSharedGrid,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    ButtonComponent
  ],
  providers: [ConfirmationService],
  template: `
    <app-page>
      <app-page-header density="compact" title="Master Data" subtitle="Manage your master reference data across all modules">
        <div class="flex items-center gap-3">
          <p-iconfield iconPosition="left">
            <input pInputText type="text" (input)="onQuickFilter($event)"
              placeholder="Search..." class="p-inputtext-sm w-64" />
          </p-iconfield>
          <div class="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>

          @if (selectedRows().length > 0) {
            <app-button
              variant="danger"
              size="sm"
              [rounded]="true"
              icon="pi pi-trash"
              [label]="'Delete (' + selectedRows().length + ')'"
              (onClick)="confirmBulkDelete()">
            </app-button>
          }
          
          @if (!isBulkEditing()) {
            <app-button
              variant="secondary"
              size="sm"
              [rounded]="true"
              icon="pi pi-pencil"
              label="Bulk Edit"
              (onClick)="toggleBulkEdit()">
            </app-button>
          } @else {
            <app-button 
              variant="secondary" 
              size="sm" 
              [rounded]="true"
              icon="pi pi-times" 
              label="Cancel" 
              (onClick)="cancelBulkEdit()">
            </app-button>
            <app-button 
              variant="primary" 
              size="sm" 
              [rounded]="true"
              icon="pi pi-check" 
              label="Save All" 
              (onClick)="saveBulkEdit()">
            </app-button>
          }

          <div class="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>

          <app-button 
            variant="secondary" 
            size="sm" 
            [rounded]="true"
            icon="pi pi-upload" 
            label="Import" 
            (onClick)="openBulkDialog()">
          </app-button>

          <app-button 
            variant="secondary" 
            size="sm" 
            [rounded]="true"
            [icon]="loading() ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" 
            (onClick)="loadMasters()">
          </app-button>

          <app-button 
            variant="primary" 
            size="sm" 
            [rounded]="true"
            icon="pi pi-plus" 
            label="Add New" 
            (onClick)="onAddNew()">
          </app-button>
        </div>
      </app-page-header>

      <app-page-content>
        <div class="flex flex-col w-full h-[calc(100vh-220px)]">
          <!-- <div class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] mb-3 flex items-center justify-between">
            <span>Total records: {{ masters().length }}</span>
          </div> -->
          <app-shared-grid
            class="flex-1 block w-full h-full"
            #mainGrid
            [columns]="columns"
            [data]="masters()"
            [selectionMode]="'multiple'"
            [showActions]="true"
            (gridEvent)="onGridEvent($event)">
          </app-shared-grid>
        </div>
      </app-page-content>
    </app-page>

      <p-dialog [modal]="true" header="Bulk Import" [(visible)]="isBulkDialogVisible" [modal]="true"
        [style]="{ width: '95vw', height: '90vh' }" [draggable]="false" [resizable]="false"
        [maximizable]="true" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
    
        <div class="flex flex-col h-full gap-2">
          <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100 flex items-center">
            <i class="pi pi-info-circle mr-2"></i>
            <span>
              Enter details below. <b>Name</b> and <b>Type</b> are required.
              Rows without a Name will be ignored.
            </span>
          </div>
    
          <!-- Reusing AppSharedGrid for Bulk Entry -->
          <div class="flex-1 overflow-hidden border rounded-md">
            <app-shared-grid
              #bulkGrid
              [columns]="columns"
              [data]="bulkData()"
              [selectionMode]="'multiple'"
              [showActions]="true"
              (gridEvent)="onBulkGridEvent($event)">
            </app-shared-grid>
          </div>
        </div>
    
        <ng-template pTemplate="footer">
          <div class="flex justify-between w-full">
            <!-- Left Side: Add Row Button -->
            <app-button 
              label="Add Empty Row" 
              icon="pi pi-plus" 
              variant="secondary"
              (onClick)="addBulkRow()">
            </app-button>
    
            <!-- Right Side: Actions -->
            <div class="flex gap-2">
              <app-button 
                label="Cancel" 
                icon="pi pi-times" 
                variant="secondary" 
                (onClick)="isBulkDialogVisible = false">
              </app-button>
              <app-button 
                label="Create All" 
                icon="pi pi-check" 
                variant="primary"
                [loading]="isBulkSaving"
                (onClick)="saveBulkImport()">
              </app-button>
            </div>
          </div>
        </ng-template>
      </p-dialog>
    
      <p-toast></p-toast>
      <p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>
    `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasterList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  // --- Services ---
  private masterService = inject(MasterService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);

  // --- ViewChilds for calling Grid Methods ---
  @ViewChild('mainGrid') mainGrid!: AppSharedGrid<Master>;
  @ViewChild('bulkGrid') bulkGrid!: AppSharedGrid<Master>;

  // --- Signals ---
  masters = signal<Master[]>([]);
  bulkData = signal<Master[]>([]);
  selectedRows = signal<Master[]>([]);
  loading = signal(false);
  isBulkEditing = signal(false);

  // --- Bulk Dialog State ---
  isBulkDialogVisible = false;
  isBulkSaving = false;

  gridApi: any;
  bulkGridApi: any;

  // --- Master Types Definition ---
  readonly masterTypes = [
    { label: 'Department', value: 'department' },
    { label: 'Category', value: 'category' },
    { label: 'Sub Category', value: 'sub_category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Tax Rate', value: 'tax_rate' },
    { label: 'Warranty Plan', value: 'warranty_plan' },
    { label: 'Product Condition', value: 'product_condition' },
    { label: 'Supplier Category', value: 'supplier_category' }
  ];

  columns: GridColDef<Master>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      pinned: 'left',
      cellConfig: {
        type: 'select',
        options: this.masterTypes,
        optionLabel: 'label',
        optionValue: 'value',
        selectAsBadge: true, // MasterCell renders this as a semantic badge
        placeholder: 'Select Type'
      }
    },
    {
      field: 'name',
      headerName: 'Master Name',
      flex: 1,
      minWidth: 200,
      pinned: 'left',
      cellConfig: {
        type: 'text',
        placeholder: 'Enter name...',
        truncateAt: 40
      }
    },
    {
      field: 'imageUrl',
      headerName: 'Media',
      width: 120,
      cellConfig: {
        type: 'avatar', // MasterCell renders image or initials
        labelField: 'name'
      }
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      cellConfig: {
        type: 'text',
        placeholder: 'CODE-001'
      }
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      cellConfig: {
        type: 'boolean' // MasterCell renders as Yes/No chips
      }
    },
    {
      field: 'metadata.isFeatured',
      headerName: 'Featured',
      width: 110,
      valueGetter: (p) => p.data?.metadata?.isFeatured,
      cellConfig: {
        type: 'boolean'
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      cellConfig: {
        type: 'textarea',
        rows: 2,
        placeholder: 'Internal notes...'
      }
    },
  ];
  constructor() {
    effect(() => { });
  }

  ngOnInit() {
    this.loadMasters();
  }

  // --- Load Data ---
  loadMasters() {
    this.loading.set(true);
    this.masterService.getMasters().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const data = res.data?.masters || res.data || [];
        this.masters.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loading.set(false);
      }
    });
  }

  // --- 1. MAIN GRID EVENT HANDLER ---
  onGridEvent(event: SharedGridEvent<Master>) {
    switch (event.type) {
      case 'init':
        this.gridApi = event.api;
        break;

      case 'selectionChanged':
        if (event.rows) {
          this.selectedRows.set(event.rows);
        }
        break;

      // Handle Single Row Save (Create or Update)
      // Your grid emits 'save' with { data: T } which is the merged final row
      case 'save':
        if (event.data) {
          this.handleSingleSave(event.data);
        }
        break;

      // Handle Single Row Delete
      case 'delete':
        if (event.row) {
          this.handleSingleDelete(event.row);
        }
        break;

      // Handle Bulk Save (Inline Edit)
      case 'bulkSave':
        if (event.rows) {
          this.handleBulkUpdate(event.rows);
        }
        break;

      // Handle Bulk Delete (Triggered by grid)
      case 'bulkDelete':
        if (event.rows) {
          this.handleBulkDelete(event.rows);
        }
        break;
    }
  }

  // --- 2. SINGLE ROW ACTIONS ---

  onAddNew() {
    // Call method directly on your shared grid via ViewChild
    this.mainGrid.addNewRow();
  }

  handleSingleSave(row: Master) {
    if (!row.name || !row.type) {
      this.appMessage.showWarn('Name and Type are required');
      return;
    }

    const payload = this.preparePayload(row);

    // Check if it's a new row based on temp ID logic
    if (row._id.startsWith('new_') || row._tempId) {
      this.masterService.createMaster(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.appMessage.showSuccess('Master created successfully');
          this.loadMasters();
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
    } else {
      this.masterService.updateMaster(row._id, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.appMessage.showSuccess('Master updated successfully'),
        error: (err) => this.appMessage.handleHttpError(err)
      });
    }
  }

  handleSingleDelete(row: Master) {
    // If it was a temp row, the grid already removed it from UI.
    if (row._id.startsWith('new_')) return;

    this.masterService.deleteMaster(row._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.appMessage.showSuccess(`${row.name} removed successfully`);
        // Grid already updated via transaction, but we can sync signal if needed
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters(); // Revert on error
      }
    });
  }

  // --- 3. BULK ACTIONS (IN-GRID) ---

  toggleBulkEdit() {
    this.isBulkEditing.set(true);
    // Call grid method to enable edit mode for selected rows
    this.mainGrid.enableBulkEdit();
  }

  cancelBulkEdit() {
    this.isBulkEditing.set(false);
    this.mainGrid.cancelBulkEdit();
  }

  saveBulkEdit() {
    // This triggers the grid to gather data and emit 'bulkSave' event
    this.mainGrid.saveBulkEdit();
  }

  handleBulkUpdate(rows: Master[]) {
    // Prepare items for API
    const items = rows.map(r => ({
      _id: r._id,
      ...this.preparePayload(r)
    }));

    this.loading.set(true);
    this.masterService.bulkUpdateMasters(items).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.appMessage.showSuccess(res.message || 'Bulk Update Completed');
        this.loadMasters();
        this.isBulkEditing.set(false);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters(); // Revert
      }
    });
  }

  // --- 4. BULK DELETE ---

  confirmBulkDelete() {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${selected.length}</b> items?`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      accept: () => {
        // Trigger grid method to remove from UI and emit 'bulkDelete'
        this.mainGrid.deleteSelected();
      }
    });
  }

  handleBulkDelete(rows: Master[]) {
    const ids = rows.map(m => m._id).filter(id => !id.startsWith('new_'));

    if (ids.length === 0) return;

    this.loading.set(true);
    this.masterService.bulkDeleteMasters(ids).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.appMessage.showSuccess(res.message || 'Items deleted');
        this.selectedRows.set([]);
        this.loading.set(false);
        this.loadMasters();

        // UI is already updated by grid
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters(); // Revert
      }
    });
  }

  // --- 5. BULK IMPORT (DIALOG) ---

  openBulkDialog() {
    const initialRows = Array.from({ length: 5 }, () => this.createEmptyMaster());
    this.bulkData.set(initialRows);
    this.isBulkDialogVisible = true;
  }

  addBulkRow() {
    if (this.bulkGrid) {
      this.bulkGrid.addNewRow(); // Use grid method for smooth add
    } else {
      // Fallback if viewchild not ready
      const newRow = this.createEmptyMaster();
      this.bulkData.update(d => [newRow, ...d]);
    }
  }

  onBulkGridEvent(event: SharedGridEvent<Master>) {
    if (event.type === 'init') {
      this.bulkGridApi = event.api;
    }
  }

  saveBulkImport() {
    if (!this.bulkGrid) return;
    if (this.bulkGridApi) this.bulkGridApi.stopEditing();
    const validItems: any[] = [];

    this.bulkGridApi.forEachNode((node: any) => {
      const data = node.data;
      if (!data) return;

      const name = data.name;
      const type = (typeof data.type === 'object' && data.type !== null) ? data.type.value : data.type;

      if (name && name.trim() !== '' && type) {
        const payload = this.preparePayload(data);
        if (!payload.slug) {
          payload['slug'] = this.generateSlug(payload.name);
        }
        validItems.push(payload);
      }
    });

    if (validItems.length === 0) {
      this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.');
      return;
    }

    this.isBulkSaving = true;

    this.masterService.createBulkMasters(validItems).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'partial_success') {
          this.appMessage.showWarn('Partial Import. Check duplicates.');
        } else {
          this.appMessage.showSuccess(`${validItems.length} items imported successfully`);
        }
        this.isBulkDialogVisible = false;
        this.loadMasters();
      },
      error: (err) => this.appMessage.handleHttpError(err),
      complete: () => this.isBulkSaving = false
    });
  }

  // --- HELPERS ---

  onQuickFilter(event: any) {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', event.target.value);
    }
  }

  private createEmptyMaster(): Master {
    const tempId = `new_${Date.now()}_${Math.random()}`;
    return {
      _id: tempId,
      _tempId: tempId, // Match grid expectation
      type: 'category',
      name: '',
      code: '',
      description: '',
      imageUrl: '',
      isActive: true,
      metadata: { isFeatured: false, sortOrder: 0 },
    };
  }

  private preparePayload(row: any): any {
    const typeValue = (row.type && typeof row.type === 'object') ? row.type.value : row.type;
    const isFeatured = row['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false;
    const sortOrder = row.metadata?.sortOrder ?? 0;

    return {
      type: typeValue,
      name: row.name,
      code: row.code ? row.code.toUpperCase() : null,
      description: row.description,
      imageUrl: row.imageUrl,
      isActive: row.isActive,
      metadata: {
        isFeatured: isFeatured,
        sortOrder: sortOrder
      }
    };
  }

  private generateSlug(text: string): string {
    if (!text) return '';
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `${slug}-${random}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
