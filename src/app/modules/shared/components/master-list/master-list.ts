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
  template: `
    <div class="master-page-container">
      <div class="themed-card master-card">
    
        <!-- TOOLBAR -->
        <p-toolbar styleClass="master-toolbar">
          <div class="p-toolbar-group-start gap-3">
            <h2 class="section-heading m-0">Master Data</h2>
    
            <p-iconfield iconPosition="left">
              <!-- <p-inputicon styleClass="pi pi-search"></p-inputicon> -->
              <input pInputText type="text" (input)="onQuickFilter($event)"
                placeholder="Search..." class="p-inputtext-sm w-64" />
              </p-iconfield>
            </div>
    
            <div class="p-toolbar-group-end flex gap-2">
    
              <!-- Bulk Actions for Selection -->
              @if (selectedRows().length > 0) {
                <div class="flex gap-2 mr-2 border-r pr-2 border-gray-300">
                  <p-button
                    label="Delete ({{selectedRows().length}})"
                    icon="pi pi-trash"
                    severity="danger"
                    (click)="confirmBulkDelete()">
                  </p-button>
                </div>
              }
    
              <!-- Bulk Edit Toggle -->
              <div class="flex gap-2 mr-2">
                @if (!isBulkEditing()) {
                  <p-button
label="Bulk Edit"
icon="pi pi-pencil"
[text]="true"
                    (click)="toggleBulkEdit()">
                  </p-button>
                }
    
                @if (isBulkEditing()) {
                  <p-button label="Cancel" icon="pi pi-times" severity="secondary" [text]="true" (click)="cancelBulkEdit()"></p-button>
                  <p-button label="Save All" icon="pi pi-check" (click)="saveBulkEdit()"></p-button>
                }
              </div>
    
              <div class="stats mr-4 align-content-center">
                <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
              </div>
    
              <!-- Bulk Import Button -->
              <p-button label="Import" icon="pi pi-upload" styleClass="p-button-outlined"
              (click)="openBulkDialog()"></p-button>
    
              <p-button icon="pi pi-refresh" styleClass="p-button-text"
              (click)="loadMasters()" [loading]="loading()"></p-button>
    
              <!-- ADD NEW: Calls Grid Method directly -->
              <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
            </div>
          </p-toolbar>
    
          <!-- MAIN DATA GRID -->
          <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
            <app-shared-grid
              #mainGrid
              [columns]="columns"
              [data]="masters()"
              [selectionMode]="'multiple'"
              [showActions]="true"
              (gridEvent)="onGridEvent($event)">
            </app-shared-grid>
          </div>
    
        </div>
      </div>
    
      <!-- BULK ENTRY DIALOG (Import) -->
      <p-dialog header="Bulk Import" [(visible)]="isBulkDialogVisible" [modal]="true"
        [style]="{ width: '95vw', height: '90vh' }" [draggable]="false" [resizable]="false"
        [maximizable]="true">
    
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
            <p-button label="Add Empty Row" icon="pi pi-plus" [text]="true" severity="secondary"
            (click)="addBulkRow()"></p-button>
    
            <!-- Right Side: Actions -->
            <div class="flex gap-2">
              <p-button label="Cancel" icon="pi pi-times" [text]="true" (click)="isBulkDialogVisible = false"></p-button>
              <p-button label="Create All" icon="pi pi-check" [loading]="isBulkSaving"
              (click)="saveBulkImport()"></p-button>
            </div>
          </div>
        </ng-template>
      </p-dialog>
    
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    `,
  styleUrls: ['./master-list.scss'],
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
    { label: 'Category', value: 'category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    // { label: 'Department', value: 'department' },
    { label: 'subcategory', value: 'subcategory' },
    { label: 'tag', value: 'tag' }
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
    // {
    //   headerName: 'Actions',
    //   width: 180,
    //   pinned: 'right',
    //   sortable: false,
    //   filter: false,
    //   resizable: false,
    //   cellClass: 'action-column-cell',
    //   cellRenderer: AppSharedGridActionButton,
    //   cellRendererParams: {
    //   }
    // }
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