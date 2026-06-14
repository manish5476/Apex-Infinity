import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// --- PrimeNG Imports ---
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

// --- Services ---
import { MasterService } from '../../../../core/services/master.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';

// --- Grid Components & Types ---
import { AppSharedGrid, SharedGridEvent } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
import { GridColDef } from "../../AgGrid/grid/grid.types";

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
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    AppSharedGrid
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./master-list.scss'],
  template: `
    <!-- MAIN APPLICATION CONTAINER -->
    <div class="app-container h-full flex flex-col absolute inset-0">
      
      <!-- Premium Header Section -->
      <div class="container-header shrink-0">
        <div class="header-titles">
          <h2 class="container-title flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600">
              <i class="pi pi-server text-xl"></i>
            </div>
            Master Data Dictionary
          </h2>
          <p class="container-subtitle ml-13">Centralized repository for system lookups, classifications, and global variables.</p>
        </div>
        
        <div class="header-actions flex items-center gap-3">
          <!-- Total Stats Badge -->
          <div class="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            <i class="pi pi-chart-bar text-[var(--accent-primary)]"></i>
            <span class="text-sm font-semibold text-gray-700">Total Entries: {{ masters().length }}</span>
          </div>
          <div class="hidden md:block w-px h-6 bg-gray-300 mx-1"></div>
          
          <!-- Core Action Buttons -->
          <p-button label="Import Data" icon="pi pi-cloud-upload" outlined="true" severity="secondary" (click)="openBulkDialog()"></p-button>
          <p-button label="Refresh" icon="pi pi-sync" outlined="true" severity="secondary" (click)="loadMasters()" [loading]="loading()"></p-button>
          <p-button label="Add New Entry" icon="pi pi-plus" (click)="onAddNew()"></p-button>
        </div>
      </div>

      <!-- Advanced Toolbar / Filter Area -->
      <div class="bg-white border-b border-[var(--border-secondary)] p-4 shrink-0 flex flex-wrap items-center justify-between gap-4 z-10 relative">
        <div class="flex items-center gap-4 w-full max-w-md">
          <span class="relative w-full">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
            <input pInputText type="text" (input)="onQuickFilter($event)" placeholder="Search across all master data..." 
                   class="w-full pl-10 bg-gray-50 hover:bg-white focus:bg-white transition-colors" />
          </span>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <!-- Contextual Bulk Delete Actions -->
          @if (selectedRows().length > 0) {
            <div class="flex items-center bg-red-50 border border-red-100 rounded-lg px-2 py-1 gap-2 transition-all duration-300">
               <span class="text-sm font-semibold text-red-700 ml-2 whitespace-nowrap">{{ selectedRows().length }} Selected</span>
               <p-button label="Delete" icon="pi pi-trash" severity="danger" size="small" [text]="true" (click)="confirmBulkDelete()"></p-button>
            </div>
            <div class="w-px h-6 bg-gray-300 mx-1"></div>
          }

          <!-- Contextual Bulk Edit Actions -->
          @if (!isBulkEditing()) {
            <p-button label="Enable Bulk Edit" icon="pi pi-file-edit" [text]="true" severity="secondary" (click)="toggleBulkEdit()"></p-button>
          } @else {
            <p-button label="Discard Changes" icon="pi pi-times" severity="secondary" [text]="true" (click)="cancelBulkEdit()"></p-button>
            <p-button label="Commit Changes" icon="pi pi-save" severity="success" (click)="saveBulkEdit()"></p-button>
          }
        </div>
      </div>

      <!-- Main Data Grid Area -->
      <div class="container-body no-padding flex-1 relative bg-gray-50/50">
        <app-shared-grid
          #mainGrid
          [columns]="columns"
          [data]="masters()"
          [selectionMode]="'multiple'"
          [showActions]="true"
          (gridEvent)="onGridEvent($event)"
          class="absolute inset-0 w-full h-full">
        </app-shared-grid>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- BULK DATA ENTRY WORKSPACE (MODAL)                                       -->
    <!-- ======================================================================= -->
    <p-dialog appendTo="body" [visible]="isBulkDialogVisible()" (visibleChange)="isBulkDialogVisible.set($event)" [modal]="true"
      [style]="{ width: '90vw', height: '85vh', 'max-width': '1400px' }" 
      [contentStyle]="{ 'padding': '0', 'background': 'var(--bg-primary)', 'overflow': 'hidden', 'display': 'flex', 'flex-direction': 'column' }"
      header="Bulk Data Import Workspace" 
      [draggable]="false" [resizable]="false" [maximizable]="true"
      styleClass="shadow-3xl">

      <div class="flex flex-col h-full bg-gray-50/50">
        
        <!-- Import Instructions Banner -->
        <div class="p-5 bg-white border-b border-gray-200 shrink-0 flex items-start gap-4">
           <div class="mt-0.5 text-blue-600 bg-blue-50 p-2 rounded-lg shadow-sm"><i class="pi pi-info-circle text-xl"></i></div>
           <div>
             <h4 class="text-base font-bold text-gray-900 tracking-tight">Import Instructions</h4>
             <p class="text-sm text-gray-600 mt-1 leading-relaxed">Enter multiple master records directly into the grid below. <strong>Name</strong> and <strong>Type</strong> are strictly required fields. Rows left entirely blank or lacking a valid name will be automatically ignored during the import process.</p>
           </div>
        </div>

        <!-- Bulk Data Grid -->
        <div class="flex-1 relative no-padding">
           <app-shared-grid
             #bulkGrid
             [columns]="columns"
             [data]="bulkData()"
             [selectionMode]="'multiple'"
             [showActions]="true"
             (gridEvent)="onBulkGridEvent($event)"
             class="absolute inset-0 w-full h-full">
           </app-shared-grid>
        </div>
      </div>

      <!-- Premium Footer Actions -->
      <ng-template pTemplate="footer">
         <div class="flex justify-between items-center w-full px-6 py-4 bg-white border-t border-[var(--border-primary)] shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]">
           <p-button label="Insert Empty Row" icon="pi pi-plus" [text]="true" severity="secondary" (click)="addBulkRow()"></p-button>
           <div class="flex gap-3">
             <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text !text-gray-600 hover:!bg-gray-100" (click)="isBulkDialogVisible.set(false)"></p-button>
             <p-button label="Execute Import" icon="pi pi-check-circle" [loading]="isBulkSaving()" (click)="saveBulkImport()"></p-button>
           </div>
         </div>
      </ng-template>
    </p-dialog>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `
})
export class MasterList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // --- Services ---
  private masterService = inject(MasterService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);

  // --- ViewChilds for Grid Control ---
  @ViewChild('mainGrid') mainGrid!: AppSharedGrid<Master>;
  @ViewChild('bulkGrid') bulkGrid!: AppSharedGrid<Master>;

  // --- Reactive Signals State Management ---
  masters = signal<Master[]>([]);
  bulkData = signal<Master[]>([]);
  selectedRows = signal<Master[]>([]);

  loading = signal(false);
  isBulkEditing = signal(false);
  isBulkDialogVisible = signal(false);
  isBulkSaving = signal(false);

  // --- Grid APIs ---
  gridApi: any;
  bulkGridApi: any;

  // --- Master Lookup Definition ---
  readonly masterTypes = [
    { label: 'Department', value: 'department' },
    { label: 'Category', value: 'category' },
    { label: 'Sub Category', value: 'sub_category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Tax Rate', value: 'tax_rate' },
    { label: 'Warranty Plan', value: 'warranty_plan' },
    { label: 'Product Condition', value: 'product_condition' }
  ];

  // --- Enterprise Grid Columns ---
  columns: GridColDef<Master>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 160,
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
      minWidth: 220,
      pinned: 'left',
      cellConfig: {
        type: 'text',
        placeholder: 'Enter name...',
        truncateAt: 50
      }
    },
    {
      field: 'imageUrl',
      headerName: 'Media',
      width: 100,
      cellConfig: {
        type: 'avatar', // MasterCell renders image or initials
        labelField: 'name'
      }
    },
    {
      field: 'code',
      headerName: 'Code Ref',
      width: 140,
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
      width: 300,
      cellConfig: {
        type: 'textarea',
        rows: 2,
        placeholder: 'Internal notes and descriptions...'
      }
    }
  ];

  ngOnInit() {
    this.loadMasters();
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================
  loadMasters() {
    this.loading.set(true);
    this.masterService.getMasters().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => {
        const data = res.data?.masters || res.data || [];
        this.masters.set(data);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
      }
    });
  }

  // ==========================================================================
  // MAIN GRID EVENT HANDLER
  // ==========================================================================
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

      case 'save':
        if (event.data) {
          this.handleSingleSave(event.data);
        }
        break;

      case 'delete':
        if (event.row) {
          this.handleSingleDelete(event.row);
        }
        break;

      case 'bulkSave':
        if (event.rows) {
          this.handleBulkUpdate(event.rows);
        }
        break;

      case 'bulkDelete':
        if (event.rows) {
          this.handleBulkDelete(event.rows);
        }
        break;
    }
  }

  // ==========================================================================
  // SINGLE ROW ACTIONS
  // ==========================================================================
  onAddNew() {
    this.mainGrid.addNewRow();
  }

  handleSingleSave(row: Master) {
    if (!row.name?.trim() || !row.type) {
      this.appMessage.showWarn('Validation Error: Master Name and Type are strictly required fields.');
      return;
    }

    const payload = this.preparePayload(row);

    // Identify if it's a completely new row (temp ID)
    if (row._id.startsWith('new_') || row._tempId) {
      this.masterService.createMaster(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.appMessage.showSuccess('Master record created successfully');
          this.loadMasters();
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
    } else {
      this.masterService.updateMaster(row._id, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.appMessage.showSuccess('Master record updated successfully');
        },
        error: (err) => this.appMessage.handleHttpError(err)
      });
    }
  }

  handleSingleDelete(row: Master) {
    if (row._id.startsWith('new_')) return;

    this.masterService.deleteMaster(row._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.appMessage.showSuccess(`'${row.name}' was removed successfully.`);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters(); // Revert UI visually on API error
      }
    });
  }

  // ==========================================================================
  // BULK GRID ACTIONS (Inline Editing)
  // ==========================================================================
  toggleBulkEdit() {
    this.isBulkEditing.set(true);
    this.mainGrid.enableBulkEdit();
  }

  cancelBulkEdit() {
    this.isBulkEditing.set(false);
    this.mainGrid.cancelBulkEdit();
  }

  saveBulkEdit() {
    // Command the grid component to dispatch the 'bulkSave' event back up
    this.mainGrid.saveBulkEdit();
  }

  handleBulkUpdate(rows: Master[]) {
    const items = rows.map(r => ({
      _id: r._id,
      ...this.preparePayload(r)
    }));

    this.loading.set(true);
    this.masterService.bulkUpdateMasters(items).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => {
        this.appMessage.showSuccess(res.message || 'Bulk Update Completed Successfully.');
        this.loadMasters();
        this.isBulkEditing.set(false);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters();
      }
    });
  }

  // ==========================================================================
  // BULK DELETION
  // ==========================================================================
  confirmBulkDelete() {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `Are you entirely certain you want to delete <b>${selected.length}</b> records? This action cannot be undone.`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.mainGrid.deleteSelected();
      }
    });
  }

  handleBulkDelete(rows: Master[]) {
    const ids = rows.map(m => m._id).filter(id => !id.startsWith('new_'));
    if (ids.length === 0) return;

    this.loading.set(true);
    this.masterService.bulkDeleteMasters(ids).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => {
        this.appMessage.showSuccess(res.message || 'Selected records deleted successfully.');
        this.selectedRows.set([]);
        this.loadMasters();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters();
      }
    });
  }

  // ==========================================================================
  // BULK ENTRY IMPORT DIALOG
  // ==========================================================================
  openBulkDialog() {
    // Generate empty ghost rows to easily accept paste/typing
    const initialRows = Array.from({ length: 5 }, () => this.createEmptyMaster());
    this.bulkData.set(initialRows);
    this.isBulkDialogVisible.set(true);
  }

  addBulkRow() {
    if (this.bulkGrid) {
      this.bulkGrid.addNewRow();
    } else {
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

      // Extract valid rows (Rows left blank by user are ignored)
      if (name && name.trim() !== '' && type) {
        const payload = this.preparePayload(data);
        if (!payload.slug) {
          payload['slug'] = this.generateSlug(payload.name || '');
        }
        validItems.push(payload);
      }
    });

    if (validItems.length === 0) {
      this.appMessage.showWarn('Validation Error: No valid rows detected. Ensure you populate the Name and Type columns.');
      return;
    }

    this.isBulkSaving.set(true);

    this.masterService.createBulkMasters(validItems).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isBulkSaving.set(false))
    ).subscribe({
      next: (res) => {
        if (res.status === 'partial_success') {
          this.appMessage.showWarn('Partial Import: Process completed with some duplicate or invalid rows ignored.');
        } else {
          this.appMessage.showSuccess(`Bulk Import Successful: ${validItems.length} records processed.`);
        }
        this.isBulkDialogVisible.set(false);
        this.loadMasters();
      },
      error: (err) => this.appMessage.handleHttpError(err)
    });
  }

  // ==========================================================================
  // HELPERS & UTILITIES
  // ==========================================================================
  onQuickFilter(event: any) {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', event.target.value);
    }
  }

  private createEmptyMaster(): Master {
    const tempId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      _id: tempId,
      _tempId: tempId, // Match AG Grid internal expectation
      type: 'category',
      name: '',
      code: '',
      description: '',
      imageUrl: '',
      isActive: true,
      metadata: { isFeatured: false, sortOrder: 0 },
    };
  }

  private preparePayload(row: any): Partial<Master> {
    const typeValue = (row.type && typeof row.type === 'object') ? row.type.value : row.type;
    const isFeatured = row['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false;
    const sortOrder = row.metadata?.sortOrder ?? 0;

    return {
      type: typeValue,
      name: row.name,
      code: row.code ? String(row.code).toUpperCase() : '',
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      isActive: row.isActive ?? true,
      metadata: {
        isFeatured: isFeatured,
        sortOrder: sortOrder
      }
    };
  }

  private generateSlug(text: any): string {
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