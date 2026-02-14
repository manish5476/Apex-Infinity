import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
import { GridColDef } from "../../AgGrid/grid/grid.types";

// Only defining the Interface for the event structure locally if not exported from grid.types
// Ideally, import { SharedGridEvent } from "../../AgGrid/grid/grid.types";
export interface SharedGridEvent<T> {
  type: 'init' | 'rowAdded' | 'editStart' | 'save' | 'bulkSave' | 'cancel' | 'delete' | 'bulkDelete' | 'selectionChanged';
  api?: any;
  row?: T;
  data?: T;
  rows?: T[];
}

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
  isNew?: boolean; // Frontend helper flag
}

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    CommonModule,
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
              <p-inputicon styleClass="pi pi-search"></p-inputicon>
              <input pInputText type="text" (input)="onQuickFilter($event)" 
                     placeholder="Search..." class="p-inputtext-sm w-64" />
            </p-iconfield>
          </div>

          <div class="p-toolbar-group-end flex gap-2">
            <!-- Bulk Action Buttons (Visible when rows selected) -->
             <div *ngIf="selectedRows().length > 0" class="flex gap-2 mr-2 border-r pr-2 border-gray-300">
                <p-button 
                   label="Deactivate ({{selectedRows().length}})" 
                   icon="pi pi-ban" 
                   severity="warn" 
                   [outlined]="true"
                   (click)="bulkUpdateStatus(false)">
                </p-button>
                <p-button 
                   label="Delete ({{selectedRows().length}})" 
                   icon="pi pi-trash" 
                   severity="danger" 
                   (click)="bulkDeleteSelected()">
                </p-button>
             </div>

             <div class="stats mr-4 align-content-center">
              <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
            </div>
            
            <!-- Bulk Import Button -->
            <p-button label="Bulk Import" icon="pi pi-upload" styleClass="p-button-outlined" 
                      (click)="openBulkDialog()"></p-button>

            <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
                      (click)="loadMasters()" [loading]="loading()"></p-button>
            
            <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
          </div>
        </p-toolbar>

        <!-- MAIN DATA GRID -->
        <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
          <app-shared-grid
            [columns]="columns"
            [data]="masters()"
            [selectionMode]="'multiple'"
            [showActions]="true"
            (gridEvent)="onGridEvent($event)">
          </app-shared-grid>
        </div>

      </div>
    </div>

    <!-- BULK ENTRY DIALOG WITH GRID -->
    <p-dialog header="Bulk Entry" [(visible)]="isBulkDialogVisible" [modal]="true" 
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
                          (click)="saveBulkEntry()"></p-button>
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
export class MasterList implements OnInit {
  // --- Services ---
  private masterService = inject(MasterService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);

  // --- Signals ---
  masters = signal<Master[]>([]);
  bulkData = signal<Master[]>([]); // Data for the bulk dialog
  selectedRows = signal<Master[]>([]); // Track selected rows
  loading = signal(false);

  // --- Bulk Dialog State ---
  isBulkDialogVisible = false;
  isBulkSaving = false;

  gridApi: any;
  bulkGridApi: any; // Separate API reference for the bulk grid

  // --- Master Types Definition ---
  readonly masterTypes = [
    { label: 'Category', value: 'category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Department', value: 'department' }
  ];

  // --- Grid Definition ---
  columns: GridColDef<Master>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      cellConfig: {
        type: 'select',
        placeholder: 'Select Type',
        options: this.masterTypes,
        optionLabel: 'label',
        optionValue: 'value'
      }
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      cellConfig: { type: 'text', placeholder: 'Enter Name (Required)' }
    },
    {
      field: 'imageUrl', 
      headerName: 'Image URL',
      width: 150,
      cellConfig: { type: 'text', placeholder: 'https://example.com/img.png' }
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 100,
      cellConfig: { type: 'text', placeholder: 'CODE' }
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 90,
      cellConfig: { type: 'boolean' }
    },
    {
      field: 'metadata.isFeatured', 
      headerName: 'Featured',
      width: 90,
      valueGetter: (p) => p.data?.metadata?.isFeatured,
      cellConfig: { type: 'boolean' } 
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      cellConfig: { type: 'text', placeholder: 'Optional description' }
    }
  ];

  constructor() {
    effect(() => {});
  }

  ngOnInit() {
    this.loadMasters();
  }

  // --- Load Data ---
  loadMasters() {
    this.loading.set(true);
    this.masterService.getMasters().subscribe({
      next: (res) => {
        const data = res.data?.masters || res.data || [];
        this.masters.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err, 'Loading Masters');
        this.loading.set(false);
      }
    });
  }

  // --- Main Grid Event Handler (Using SharedGridEvent) ---
  onGridEvent(event: SharedGridEvent<Master>) {
    console.log(event)
    switch (event.type) {
      case 'init':
        this.gridApi = event.api;
        break;
      
      case 'selectionChanged':
        if (event.rows) {
          this.selectedRows.set(event.rows);
        }
        break;

      // Handle 'save' - event.data contains the updated object
      case 'save':
        if (event.data) {
          this.handleSave(event.data);
        }
        break;

      // Handle 'delete' - event.row contains the object to delete
      case 'delete':
        if (event.row) {
          this.handleDelete(event.row);
        }
        break;
        
      // Handle 'bulkDelete' triggered from within grid
      case 'bulkDelete':
        if (event.rows && event.rows.length > 0) {
           this.selectedRows.set(event.rows);
           this.bulkDeleteSelected();
        }
        break;
    }
  }

  // --- Bulk Grid Event Handler ---
  onBulkGridEvent(event: SharedGridEvent<Master>) {
    switch (event.type) {
      case 'init':
        this.bulkGridApi = event.api;
        break;
    }
  }

  // --- Single Row Actions ---

  onAddNew() {
    const newMaster = this.createEmptyMaster();
    this.masters.update(current => [newMaster, ...current]);    
    this.appMessage.showInfo('Please fill details and click Save', 'New Row Added');
  }

  handleSave(row: Master) {
    if (!row.name || !row.type) {
      this.appMessage.showWarn('Name and Type are required', 'Validation Error');
      return;
    }

    const payload = this.preparePayload(row);

    if (row.isNew || row._id.startsWith('new_')) {
      this.masterService.createMaster(payload).subscribe({
        next: () => {
          this.appMessage.showSuccess('Master created successfully');
          this.loadMasters(); 
        },
        error: (err) => this.appMessage.handleHttpError(err, 'Creation')
      });
    } else {
      this.masterService.updateMaster(row._id, payload).subscribe({
        next: () => this.appMessage.showSuccess('Master updated successfully'),
        error: (err) => this.appMessage.handleHttpError(err, 'Update')
      });
    }
  }

  handleDelete(row: Master) {
    if (row.isNew || row._id.startsWith('new_')) {
      this.masters.update(current => current.filter(m => m._id !== row._id));
      this.appMessage.showInfo('Unsaved row removed');
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${row.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.masterService.deleteMaster(row._id).subscribe({
          next: () => {
            this.masters.update(users => users.filter(u => u._id !== row._id));
            this.appMessage.showSuccess(`${row.name} removed successfully`);
          },
          error: (err) => this.appMessage.handleHttpError(err, 'Delete')
        });
      }
    });
  }

  // --- Bulk Actions (Frontend) ---

  bulkDeleteSelected() {
      const selected = this.selectedRows();
      if (selected.length === 0) return;

      const ids = selected.map(m => m._id);

      this.confirmationService.confirm({
        message: `Are you sure you want to delete <b>${ids.length}</b> items?`,
        header: 'Confirm Bulk Delete',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: 'p-button-danger p-button-text',
        accept: () => {
            this.loading.set(true);
            this.masterService.bulkDeleteMasters(ids).subscribe({
                next: (res) => {
                    this.appMessage.showSuccess(res.message || 'Items deleted');
                    this.loadMasters(); 
                    this.selectedRows.set([]); 
                    this.loading.set(false);
                },
                error: (err) => {
                    this.appMessage.handleHttpError(err, 'Bulk Delete');
                    this.loading.set(false);
                }
            });
        }
      });
  }

  bulkUpdateStatus(isActive: boolean) {
      const selected = this.selectedRows();
      if (selected.length === 0) return;

      const items = selected.map(m => ({ _id: m._id, isActive: isActive }));

      this.loading.set(true);
      this.masterService.bulkUpdateMasters(items).subscribe({
          next: (res) => {
              this.appMessage.showSuccess(res.message || 'Items updated');
              this.loadMasters();
              this.selectedRows.set([]);
              this.loading.set(false);
          },
          error: (err) => {
              this.appMessage.handleHttpError(err, 'Bulk Update');
              this.loading.set(false);
          }
      });
  }

  onQuickFilter(event: any) {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', event.target.value);
    }
  }

  // --- Bulk Entry Actions ---

  openBulkDialog() {
    const initialRows = Array.from({ length: 5 }, () => this.createEmptyMaster());
    this.bulkData.set(initialRows); 
    this.isBulkDialogVisible = true;
  }

  addBulkRow() {
    const newRow = this.createEmptyMaster();
    this.bulkData.update(data => [...data, newRow]);
  }

  saveBulkEntry() {
    if (!this.bulkGridApi) return;
    this.bulkGridApi.stopEditing();

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
      this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.', 'No Data Found');
      return;
    }

    this.isBulkSaving = true;
    
    this.masterService.createBulkMasters(validItems).subscribe({
      next: (res) => {
        if (res.status === 'partial_success' || (res.failedCount && res.failedCount > 0)) {
           const inserted = res.insertedCount || 0;
           const failed = res.failedCount || 0;
           this.appMessage.showWarn(
             `Imported: ${inserted}. Failed: ${failed}. Check duplicate names.`, 
             'Partial Import'
           );
        } else {
           this.appMessage.showSuccess(`${validItems.length} items imported successfully`, 'Bulk Import');
        }

        this.isBulkDialogVisible = false;
        this.loadMasters(); 
      },
      error: (err) => {
        this.appMessage.handleHttpError(err, 'Bulk Import');
      },
      complete: () => {
        this.isBulkSaving = false;
      }
    });
  }

  // --- Helpers ---

  private createEmptyMaster(): Master {
    return {
      _id: `new_${Date.now()}_${Math.random()}`,
      type: 'category', // Default type
      name: '',
      code: '',
      description: '',
      imageUrl: '', 
      isActive: true,
      metadata: { isFeatured: false, sortOrder: 0 },
      isNew: true
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
}
// import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ConfirmationService } from 'primeng/api';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToolbarModule } from 'primeng/toolbar';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { InputTextModule } from 'primeng/inputtext';
// import { DialogModule } from 'primeng/dialog';
// import { SelectModule } from 'primeng/select';

// // Services
// import { MasterService } from '../../../../core/services/master.service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { AppMessageService } from '../../../../core/services/message.service';

// // Grid Components & Types
// import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
// import { GridColDef } from "../../AgGrid/grid/grid.types";

// // --- Interface based on Mongoose Schema ---
// export interface Master {
//   _id: string;
//   type: string;
//   name: string;
//   code?: string;
//   slug?: string;
//   description?: string;
//   imageUrl?: string;
//   parentId?: string | null;
//   isActive: boolean;
//   metadata?: {
//     isFeatured: boolean;
//     sortOrder: number;
//   };
//   isNew?: boolean; // Frontend helper flag
// }

// @Component({
//   selector: 'app-master-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     ToastModule,
//     ConfirmDialogModule,
//     ToolbarModule,
//     IconFieldModule,
//     InputIconModule,
//     InputTextModule,
//     DialogModule,
//     SelectModule,
//     AppSharedGrid
//   ],
//   providers: [ConfirmationService],
//   template: `
//     <div class="master-page-container">
//       <div class="themed-card master-card">
        
//         <!-- TOOLBAR -->
//         <p-toolbar styleClass="master-toolbar">
//           <div class="p-toolbar-group-start gap-3">
//             <h2 class="section-heading m-0">Master Data</h2>
            
//             <p-iconfield iconPosition="left">
//               <p-inputicon styleClass="pi pi-search"></p-inputicon>
//               <input pInputText type="text" (input)="onQuickFilter($event)" 
//                      placeholder="Search..." class="p-inputtext-sm w-64" />
//             </p-iconfield>
//           </div>

//           <div class="p-toolbar-group-end flex gap-2">
//             <!-- Bulk Action Buttons (Visible when rows selected) -->
//              <div *ngIf="selectedRows().length > 0" class="flex gap-2 mr-2 border-r pr-2 border-gray-300">
//                 <p-button 
//                    label="Deactivate ({{selectedRows().length}})" 
//                    icon="pi pi-ban" 
//                    severity="warning" 
//                    [outlined]="true"
//                    (click)="bulkUpdateStatus(false)">
//                 </p-button>
//                 <p-button 
//                    label="Delete ({{selectedRows().length}})" 
//                    icon="pi pi-trash" 
//                    severity="danger" 
//                    (click)="bulkDeleteSelected()">
//                 </p-button>
//              </div>

//              <div class="stats mr-4 align-content-center">
//               <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
//             </div>
            
//             <!-- Bulk Import Button -->
//             <p-button label="Bulk Import" icon="pi pi-upload" styleClass="p-button-outlined" 
//                       (click)="openBulkDialog()"></p-button>

//             <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
//                       (click)="loadMasters()" [loading]="loading()"></p-button>
            
//             <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
//           </div>
//         </p-toolbar>

//         <!-- MAIN DATA GRID -->
//         <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
//           <app-shared-grid
//             [columns]="columns"
//             [data]="masters()"
//             [selectionMode]="'multiple'"
//             [showActions]="true"
//             (gridEvent)="onGridEvent($event)">
//           </app-shared-grid>
//         </div>

//       </div>
//     </div>

//     <!-- BULK ENTRY DIALOG WITH GRID -->
//     <p-dialog header="Bulk Entry" [(visible)]="isBulkDialogVisible" [modal]="true" 
//               [style]="{ width: '95vw', height: '90vh' }" [draggable]="false" [resizable]="false"
//               [maximizable]="true">
      
//       <div class="flex flex-col h-full gap-2">
//         <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100 flex items-center">
//           <i class="pi pi-info-circle mr-2"></i>
//           <span>
//             Enter details below. <b>Name</b> and <b>Type</b> are required. 
//             Rows without a Name will be ignored.
//           </span>
//         </div>

//         <!-- Reusing AppSharedGrid for Bulk Entry -->
//         <div class="flex-1 overflow-hidden border rounded-md">
//            <app-shared-grid
//             [columns]="columns"
//             [data]="bulkData()"
//             [selectionMode]="'multiple'"
//             [showActions]="true"
//             (gridEvent)="onBulkGridEvent($event)">
//           </app-shared-grid>
//         </div>
//       </div>
      
//       <ng-template pTemplate="footer">
//         <div class="flex justify-between w-full">
//             <!-- Left Side: Add Row Button -->
//             <p-button label="Add Empty Row" icon="pi pi-plus" [text]="true" severity="secondary" 
//                       (click)="addBulkRow()"></p-button>

//             <!-- Right Side: Actions -->
//             <div class="flex gap-2">
//                 <p-button label="Cancel" icon="pi pi-times" [text]="true" (click)="isBulkDialogVisible = false"></p-button>
//                 <p-button label="Create All" icon="pi pi-check" [loading]="isBulkSaving" 
//                           (click)="saveBulkEntry()"></p-button>
//             </div>
//         </div>
//       </ng-template>
//     </p-dialog>

//     <p-toast></p-toast> 
//     <p-confirmDialog></p-confirmDialog>
//   `,
//   styleUrls: ['./master-list.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class MasterList implements OnInit {
//   // --- Services ---
//   private masterService = inject(MasterService);
//   private appMessage = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   private loadingService = inject(LoadingService);

//   // --- Signals ---
//   masters = signal<Master[]>([]);
//   bulkData = signal<Master[]>([]); // Data for the bulk dialog
//   selectedRows = signal<Master[]>([]); // Track selected rows
//   loading = signal(false);

//   // --- Bulk Dialog State ---
//   isBulkDialogVisible = false;
//   isBulkSaving = false;

//   gridApi: any;
//   bulkGridApi: any; // Separate API reference for the bulk grid

//   // --- Master Types Definition ---
//   readonly masterTypes = [
//     { label: 'Category', value: 'category' },
//     { label: 'Brand', value: 'brand' },
//     { label: 'Unit', value: 'unit' },
//     { label: 'Department', value: 'department' }
//   ];

//   // --- Grid Definition ---
//   columns: GridColDef<Master>[] = [
//     {
//       field: 'type',
//       headerName: 'Type',
//       width: 130,
//       cellConfig: {
//         type: 'select',
//         placeholder: 'Select Type',
//         options: this.masterTypes,
//         optionLabel: 'label',
//         optionValue: 'value'
//       }
//     },
//     {
//       field: 'name',
//       headerName: 'Name',
//       flex: 1,
//       minWidth: 150,
//       cellConfig: { type: 'text', placeholder: 'Enter Name (Required)' }
//     },
//     {
//       field: 'imageUrl', 
//       headerName: 'Image URL',
//       width: 150,
//       cellConfig: { type: 'text', placeholder: 'https://example.com/img.png' }
//     },
//     {
//       field: 'code',
//       headerName: 'Code',
//       width: 100,
//       cellConfig: { type: 'text', placeholder: 'CODE' }
//     },
//     {
//       field: 'isActive',
//       headerName: 'Active',
//       width: 90,
//       cellConfig: { type: 'boolean' }
//     },
//     {
//       field: 'metadata.isFeatured', 
//       headerName: 'Featured',
//       width: 90,
//       valueGetter: (p) => p.data?.metadata?.isFeatured,
//       cellConfig: { type: 'boolean' } 
//     },
//     {
//       field: 'description',
//       headerName: 'Description',
//       width: 200,
//       cellConfig: { type: 'text', placeholder: 'Optional description' }
//     }
//   ];

//   constructor() {
//     effect(() => {});
//   }

//   ngOnInit() {
//     this.loadMasters();
//   }

//   // --- Load Data ---
//   loadMasters() {
//     this.loading.set(true);
//     this.masterService.getMasters().subscribe({
//       next: (res) => {
//         const data = res.data?.masters || res.data || [];
//         this.masters.set(data);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err, 'Loading Masters');
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- Main Grid Event Handler (Using SharedGridEvent) ---
//   onGridEvent(event: any) {
//     switch (event.type) {
//       case 'init':
//         this.gridApi = event.api;
//         break;
      
//       // Handle the 'selectionChanged' event directly from the shared grid
//       case 'selectionChanged':
//         this.selectedRows.set(event.rows);
//         break;

//       // Handle 'save' which provides { type: 'save', row: T, data: T }
//       // Using 'data' as it represents the updated record
//       case 'save':
//         this.handleSave(event.data);
//         break;

//       // Handle 'delete' which provides { type: 'delete', row: T }
//       case 'delete':
//         this.handleDelete(event.row);
//         break;
        
//       // Handle 'bulkDelete' if triggered from grid internal actions (optional)
//       case 'bulkDelete':
//         if (event.rows && event.rows.length > 0) {
//            this.selectedRows.set(event.rows);
//            this.bulkDeleteSelected();
//         }
//         break;
//     }
//   }

//   // --- Bulk Grid Event Handler ---
//   onBulkGridEvent(event: any) {
//     switch (event.type) {
//       case 'init':
//         this.bulkGridApi = event.api;
//         break;
//     }
//   }

//   // --- Single Row Actions ---

//   onAddNew() {
//     const newMaster = this.createEmptyMaster();
//     this.masters.update(current => [newMaster, ...current]);    
//     this.appMessage.showInfo('Please fill details and click Save', 'New Row Added');
//   }

//   handleSave(row: Master) {
//     if (!row.name || !row.type) {
//       this.appMessage.showWarn('Name and Type are required', 'Validation Error');
//       return;
//     }

//     const payload = this.preparePayload(row);

//     if (row.isNew || row._id.startsWith('new_')) {
//       this.masterService.createMaster(payload).subscribe({
//         next: () => {
//           this.appMessage.showSuccess('Master created successfully');
//           this.loadMasters(); 
//         },
//         error: (err) => this.appMessage.handleHttpError(err, 'Creation')
//       });
//     } else {
//       this.masterService.updateMaster(row._id, payload).subscribe({
//         next: () => this.appMessage.showSuccess('Master updated successfully'),
//         error: (err) => this.appMessage.handleHttpError(err, 'Update')
//       });
//     }
//   }

//   handleDelete(row: Master) {
//     if (row.isNew || row._id.startsWith('new_')) {
//       this.masters.update(current => current.filter(m => m._id !== row._id));
//       this.appMessage.showInfo('Unsaved row removed');
//       return;
//     }

//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete <b>${row.name}</b>?`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-text p-button-secondary',
//       accept: () => {
//         this.masterService.deleteMaster(row._id).subscribe({
//           next: () => {
//             this.masters.update(users => users.filter(u => u._id !== row._id));
//             this.appMessage.showSuccess(`${row.name} removed successfully`);
//           },
//           error: (err) => this.appMessage.handleHttpError(err, 'Delete')
//         });
//       }
//     });
//   }

//   // --- Bulk Actions (Frontend) ---

//   bulkDeleteSelected() {
//       const selected = this.selectedRows();
//       if (selected.length === 0) return;

//       const ids = selected.map(m => m._id);

//       this.confirmationService.confirm({
//         message: `Are you sure you want to delete <b>${ids.length}</b> items?`,
//         header: 'Confirm Bulk Delete',
//         icon: 'pi pi-exclamation-triangle',
//         acceptButtonStyleClass: 'p-button-danger p-button-text',
//         accept: () => {
//             this.loading.set(true);
//             this.masterService.bulkDeleteMasters(ids).subscribe({
//                 next: (res) => {
//                     this.appMessage.showSuccess(res.message || 'Items deleted');
//                     this.loadMasters(); 
//                     this.selectedRows.set([]); 
//                     this.loading.set(false);
//                 },
//                 error: (err) => {
//                     this.appMessage.handleHttpError(err, 'Bulk Delete');
//                     this.loading.set(false);
//                 }
//             });
//         }
//       });
//   }

//   bulkUpdateStatus(isActive: boolean) {
//       const selected = this.selectedRows();
//       if (selected.length === 0) return;

//       const items = selected.map(m => ({ _id: m._id, isActive: isActive }));

//       this.loading.set(true);
//       this.masterService.bulkUpdateMasters(items).subscribe({
//           next: (res) => {
//               this.appMessage.showSuccess(res.message || 'Items updated');
//               this.loadMasters();
//               this.selectedRows.set([]);
//               this.loading.set(false);
//           },
//           error: (err) => {
//               this.appMessage.handleHttpError(err, 'Bulk Update');
//               this.loading.set(false);
//           }
//       });
//   }

//   onQuickFilter(event: any) {
//     if (this.gridApi) {
//       this.gridApi.setGridOption('quickFilterText', event.target.value);
//     }
//   }

//   // --- Bulk Entry Actions ---

//   openBulkDialog() {
//     const initialRows = Array.from({ length: 5 }, () => this.createEmptyMaster());
//     this.bulkData.set(initialRows); 
//     this.isBulkDialogVisible = true;
//   }

//   addBulkRow() {
//     const newRow = this.createEmptyMaster();
//     this.bulkData.update(data => [...data, newRow]);
//   }

//   saveBulkEntry() {
//     if (!this.bulkGridApi) return;
//     this.bulkGridApi.stopEditing();

//     const validItems: any[] = [];
    
//     this.bulkGridApi.forEachNode((node: any) => {
//       const data = node.data;
//       if (!data) return;

//       const name = data.name;
//       const type = (typeof data.type === 'object' && data.type !== null) ? data.type.value : data.type;

//       if (name && name.trim() !== '' && type) {
//         const payload = this.preparePayload(data);
//         if (!payload.slug) {
//            payload['slug'] = this.generateSlug(payload.name);
//         }
//         validItems.push(payload);
//       }
//     });

//     if (validItems.length === 0) {
//       this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.', 'No Data Found');
//       return;
//     }

//     this.isBulkSaving = true;
    
//     this.masterService.createBulkMasters(validItems).subscribe({
//       next: (res) => {
//         if (res.status === 'partial_success' || (res.failedCount && res.failedCount > 0)) {
//            const inserted = res.insertedCount || 0;
//            const failed = res.failedCount || 0;
//            this.appMessage.showWarn(
//              `Imported: ${inserted}. Failed: ${failed}. Check duplicate names.`, 
//              'Partial Import'
//            );
//         } else {
//            this.appMessage.showSuccess(`${validItems.length} items imported successfully`, 'Bulk Import');
//         }

//         this.isBulkDialogVisible = false;
//         this.loadMasters(); 
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err, 'Bulk Import');
//       },
//       complete: () => {
//         this.isBulkSaving = false;
//       }
//     });
//   }

//   // --- Helpers ---

//   private createEmptyMaster(): Master {
//     return {
//       _id: `new_${Date.now()}_${Math.random()}`,
//       type: 'category', // Default type
//       name: '',
//       code: '',
//       description: '',
//       imageUrl: '', 
//       isActive: true,
//       metadata: { isFeatured: false, sortOrder: 0 },
//       isNew: true
//     };
//   }

//   private preparePayload(row: any): any {
//     const typeValue = (row.type && typeof row.type === 'object') ? row.type.value : row.type;
//     const isFeatured = row['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false;
//     const sortOrder = row.metadata?.sortOrder ?? 0;

//     return {
//       type: typeValue,
//       name: row.name,
//       code: row.code ? row.code.toUpperCase() : null,
//       description: row.description,
//       imageUrl: row.imageUrl,
//       isActive: row.isActive,
//       metadata: {
//         isFeatured: isFeatured,
//         sortOrder: sortOrder
//       }
//     };
//   }

//   private generateSlug(text: string): string {
//     if (!text) return '';
//     const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
//     const random = Math.random().toString(36).substring(2, 8);
//     return `${slug}-${random}`;
//   }
// }

// // import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ConfirmationService } from 'primeng/api';

// // // PrimeNG Imports
// // import { ButtonModule } from 'primeng/button';
// // import { ToastModule } from 'primeng/toast';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ToolbarModule } from 'primeng/toolbar';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputIconModule } from 'primeng/inputicon';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { DialogModule } from 'primeng/dialog';
// // import { SelectModule } from 'primeng/select';

// // // Services
// // import { MasterService } from '../../../../core/services/master.service';
// // import { LoadingService } from '../../../../core/services/loading.service';
// // import { AppMessageService } from '../../../../core/services/message.service';

// // // Grid Components & Types
// // import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
// // import { GridColDef } from "../../AgGrid/grid/grid.types";

// // // --- Interface based on Mongoose Schema ---
// // export interface Master {
// //   _id: string;
// //   type: string;
// //   name: string;
// //   code?: string;
// //   slug?: string;
// //   description?: string;
// //   imageUrl?: string; // Added Image URL
// //   parentId?: string | null;
// //   isActive: boolean;
// //   metadata?: {
// //     isFeatured: boolean;
// //     sortOrder: number;
// //   };
// //   isNew?: boolean; // Frontend helper flag
// // }

// // @Component({
// //   selector: 'app-master-list',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     ButtonModule,
// //     ToastModule,
// //     ConfirmDialogModule,
// //     ToolbarModule,
// //     IconFieldModule,
// //     InputIconModule,
// //     InputTextModule,
// //     DialogModule,
// //     SelectModule,
// //     AppSharedGrid
// //   ],
// //   providers: [ConfirmationService],
// //   template: `
// //     <div class="master-page-container">
// //       <div class="themed-card master-card">
        
// //         <!-- TOOLBAR -->
// //         <p-toolbar styleClass="master-toolbar">
// //           <div class="p-toolbar-group-start gap-3">
// //             <h2 class="section-heading m-0">Master Data</h2>
            
// //             <p-iconfield iconPosition="left">
// //               <p-inputicon styleClass="pi pi-search"></p-inputicon>
// //               <input pInputText type="text" (input)="onQuickFilter($event)" 
// //                      placeholder="Search..." class="p-inputtext-sm w-64" />
// //             </p-iconfield>
// //           </div>

// //           <div class="p-toolbar-group-end flex gap-2">
// //              <div class="stats mr-4 align-content-center">
// //               <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
// //             </div>
            
// //             <!-- Bulk Import Button -->
// //             <p-button label="Bulk Import" icon="pi pi-upload" styleClass="p-button-outlined" 
// //                       (click)="openBulkDialog()"></p-button>

// //             <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
// //                       (click)="loadMasters()" [loading]="loading()"></p-button>
            
// //             <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
// //           </div>
// //         </p-toolbar>

// //         <!-- MAIN DATA GRID -->
// //         <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
// //           <app-shared-grid
// //             [columns]="columns"
// //             [data]="masters()"
// //             [selectionMode]="'multiple'"
// //             [showActions]="true"
// //             (gridEvent)="onGridEvent($event)">
// //           </app-shared-grid>
// //         </div>

// //       </div>
// //     </div>

// //     <!-- BULK ENTRY DIALOG WITH GRID -->
// //     <p-dialog header="Bulk Entry" [(visible)]="isBulkDialogVisible" [modal]="true" 
// //               [style]="{ width: '95vw', height: '90vh' }" [draggable]="false" [resizable]="false"
// //               [maximizable]="true">
      
// //       <div class="flex flex-col h-full gap-2">
// //         <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100 flex items-center">
// //           <i class="pi pi-info-circle mr-2"></i>
// //           <span>
// //             Enter details below. <b>Name</b> and <b>Type</b> are required. 
// //             Rows without a Name will be ignored.
// //           </span>
// //         </div>

// //         <!-- Reusing AppSharedGrid for Bulk Entry -->
// //         <div class="flex-1 overflow-hidden border rounded-md">
// //            <app-shared-grid
// //             [columns]="columns"
// //             [data]="bulkData()"
// //             [selectionMode]="'multiple'"
// //             [showActions]="true"
// //             (gridEvent)="onBulkGridEvent($event)">
// //           </app-shared-grid>
// //         </div>
// //       </div>
      
// //       <ng-template pTemplate="footer">
// //         <div class="flex justify-between w-full">
// //             <!-- Left Side: Add Row Button -->
// //             <p-button label="Add Empty Row" icon="pi pi-plus" [text]="true" severity="secondary" 
// //                       (click)="addBulkRow()"></p-button>

// //             <!-- Right Side: Actions -->
// //             <div class="flex gap-2">
// //                 <p-button label="Cancel" icon="pi pi-times" [text]="true" (click)="isBulkDialogVisible = false"></p-button>
// //                 <p-button label="Create All" icon="pi pi-check" [loading]="isBulkSaving" 
// //                           (click)="saveBulkEntry()"></p-button>
// //             </div>
// //         </div>
// //       </ng-template>
// //     </p-dialog>

// //     <p-toast></p-toast> 
// //     <p-confirmDialog></p-confirmDialog>
// //   `,
// //   styleUrls: ['./master-list.scss'], // Ensure this file exists or remove property if not needed
// //   changeDetection: ChangeDetectionStrategy.OnPush
// // })
// // export class MasterList implements OnInit {
// //   // --- Services ---
// //   private masterService = inject(MasterService);
// //   private appMessage = inject(AppMessageService);
// //   private confirmationService = inject(ConfirmationService);
// //   private loadingService = inject(LoadingService);

// //   // --- Signals ---
// //   masters = signal<Master[]>([]);
// //   bulkData = signal<Master[]>([]); // Data for the bulk dialog
// //   loading = signal(false);

// //   // --- Bulk Dialog State ---
// //   isBulkDialogVisible = false;
// //   isBulkSaving = false;

// //   gridApi: any;
// //   bulkGridApi: any; // Separate API reference for the bulk grid

// //   // --- Master Types Definition ---
// //   readonly masterTypes = [
// //     { label: 'Category', value: 'category' },
// //     { label: 'Brand', value: 'brand' },
// //     { label: 'Unit', value: 'unit' },
// //     { label: 'Department', value: 'department' }
// //   ];

// //   // --- Grid Definition ---
// //   columns: GridColDef<Master>[] = [
// //     {
// //       field: 'type',
// //       headerName: 'Type',
// //       width: 130,
// //       cellConfig: {
// //         type: 'select',
// //         placeholder: 'Select Type',
// //         options: this.masterTypes,
// //         optionLabel: 'label',
// //         optionValue: 'value'
// //       }
// //     },
// //     {
// //       field: 'name',
// //       headerName: 'Name',
// //       flex: 1,
// //       minWidth: 150,
// //       cellConfig: { type: 'text', placeholder: 'Enter Name (Required)' }
// //     },
// //     {
// //       field: 'imageUrl', // NEW FIELD ADDED
// //       headerName: 'Image URL',
// //       width: 150,
// //       cellConfig: { type: 'text', placeholder: 'https://example.com/img.png' }
// //     },
// //     {
// //       field: 'code',
// //       headerName: 'Code',
// //       width: 100,
// //       cellConfig: { type: 'text', placeholder: 'CODE' }
// //     },
// //     {
// //       field: 'isActive',
// //       headerName: 'Active',
// //       width: 90,
// //       cellConfig: { type: 'boolean' }
// //     },
// //     {
// //       field: 'metadata.isFeatured', 
// //       headerName: 'Featured',
// //       width: 90,
// //       valueGetter: (p) => p.data?.metadata?.isFeatured,
// //       cellConfig: { type: 'boolean' } 
// //     },
// //     {
// //       field: 'description',
// //       headerName: 'Description',
// //       width: 200,
// //       cellConfig: { type: 'text', placeholder: 'Optional description' }
// //     }
// //   ];

// //   constructor() {
// //     effect(() => {});
// //   }

// //   ngOnInit() {
// //     this.loadMasters();
// //   }

// //   // --- Load Data ---
// //   loadMasters() {
// //     this.loading.set(true);
// //     this.masterService.getMasters().subscribe({
// //       next: (res) => {
// //         // Adjust this according to your actual API response structure
// //         const data = res.data?.masters || res.data || [];
// //         this.masters.set(data);
// //         this.loading.set(false);
// //       },
// //       error: (err) => {
// //         this.appMessage.handleHttpError(err, 'Loading Masters');
// //         this.loading.set(false);
// //       }
// //     });
// //   }

// //   // --- Main Grid Event Handler ---
// //   onGridEvent(event: any) {
// //     switch (event.type) {
// //       case 'init':
// //         this.gridApi = event.api;
// //         break;
// //       case 'save':
// //       case 'Entersave':
// //         this.handleSave(event.row);
// //         break;
// //       case 'delete':
// //         this.handleDelete(event.row);
// //         break;
// //     }
// //   }

// //   // --- Bulk Grid Event Handler ---
// //   onBulkGridEvent(event: any) {
// //     switch (event.type) {
// //       case 'init':
// //         this.bulkGridApi = event.api;
// //         break;
// //       // You can add logic here if you want to handle individual row saves inside bulk,
// //       // but usually bulk is saved all at once.
// //     }
// //   }

// //   // --- Single Row Actions ---

// //   onAddNew() {
// //     const newMaster = this.createEmptyMaster();
// //     this.masters.update(current => [newMaster, ...current]);    
// //     this.appMessage.showInfo('Please fill details and click Save', 'New Row Added');
// //   }

// //   handleSave(row: Master) {
// //     if (!row.name || !row.type) {
// //       this.appMessage.showWarn('Name and Type are required', 'Validation Error');
// //       return;
// //     }

// //     const payload = this.preparePayload(row);

// //     if (row.isNew || row._id.startsWith('new_')) {
// //       this.masterService.createMaster(payload).subscribe({
// //         next: () => {
// //           this.appMessage.showSuccess('Master created successfully');
// //           this.loadMasters(); 
// //         },
// //         error: (err) => this.appMessage.handleHttpError(err, 'Creation')
// //       });
// //     } else {
// //       this.masterService.updateMaster(row._id, payload).subscribe({
// //         next: () => this.appMessage.showSuccess('Master updated successfully'),
// //         error: (err) => this.appMessage.handleHttpError(err, 'Update')
// //       });
// //     }
// //   }

// //   handleDelete(row: Master) {
// //     if (row.isNew || row._id.startsWith('new_')) {
// //       this.masters.update(current => current.filter(m => m._id !== row._id));
// //       this.appMessage.showInfo('Unsaved row removed');
// //       return;
// //     }

// //     this.confirmationService.confirm({
// //       message: `Are you sure you want to delete <b>${row.name}</b>?`,
// //       header: 'Confirm Delete',
// //       icon: 'pi pi-exclamation-triangle',
// //       acceptButtonStyleClass: 'p-button-danger p-button-text',
// //       rejectButtonStyleClass: 'p-button-text p-button-secondary',
// //       accept: () => {
// //         this.masterService.deleteMaster(row._id).subscribe({
// //           next: () => {
// //             this.masters.update(users => users.filter(u => u._id !== row._id));
// //             this.appMessage.showSuccess(`${row.name} removed successfully`);
// //           },
// //           error: (err) => this.appMessage.handleHttpError(err, 'Delete')
// //         });
// //       }
// //     });
// //   }

// //   onQuickFilter(event: any) {
// //     if (this.gridApi) {
// //       this.gridApi.setGridOption('quickFilterText', event.target.value);
// //     }
// //   }

// //   // --- Bulk Entry Actions ---

// //   openBulkDialog() {
// //     // FIX: Initialize with 5 empty rows so the grid isn't empty when opening
// //     // This allows the user to start typing immediately without finding an "add" button first
// //     const initialRows = Array.from({ length: 5 }, () => this.createEmptyMaster());
// //     this.bulkData.set(initialRows); 
// //     this.isBulkDialogVisible = true;
// //   }

// //   addBulkRow() {
// //     // Helper to add another row manually to the bulk grid
// //     const newRow = this.createEmptyMaster();
// //     // We update the signal which should refresh the grid
// //     this.bulkData.update(data => [...data, newRow]);
    
// //     // Optionally focus the new row if your grid component supports it
// //     // if(this.bulkGridApi) ...
// //   }

// //   saveBulkEntry() {
// //     if (!this.bulkGridApi) return;

// //     // FIX 1: Stop Editing! 
// //     // This forces Ag-Grid to save the current cell value into the row data
// //     // before we loop through it. Without this, the last cell edited often returns empty.
// //     this.bulkGridApi.stopEditing();

// //     // 1. Harvest Data from Grid
// //     const validItems: any[] = [];
    
// //     this.bulkGridApi.forEachNode((node: any) => {
// //       const data = node.data;
// //       if (!data) return;

// //       // Extract Name and Type safely
// //       const name = data.name;
// //       // Handle case where Type might be an object {label, value} or a string
// //       const type = (typeof data.type === 'object' && data.type !== null) ? data.type.value : data.type;

// //       // Filter out empty rows (at least name is required, type has a default)
// //       if (name && name.trim() !== '' && type) {
        
// //         // Strip out the temp ID and format payload
// //         const payload = this.preparePayload(data);
        
// //         // Generate slug frontend-side to prevent duplicates on bulk insert
// //         if (!payload.slug) {
// //            payload['slug'] = this.generateSlug(payload.name);
// //         }
        
// //         validItems.push(payload);
// //       }
// //     });

// //     if (validItems.length === 0) {
// //       this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.', 'No Data Found');
// //       return;
// //     }

// //     this.isBulkSaving = true;
    
// //     // 2. Send to API
// //     this.masterService.createBulkMasters(validItems).subscribe({
// //       next: (res) => {
// //         // Handle Partial Success
// //         if (res.status === 'partial_success' || (res.failedCount && res.failedCount > 0)) {
// //            const inserted = res.insertedCount || 0;
// //            const failed = res.failedCount || 0;
// //            this.appMessage.showWarn(
// //              `Imported: ${inserted}. Failed: ${failed}. Check duplicate names.`, 
// //              'Partial Import'
// //            );
// //         } else {
// //            this.appMessage.showSuccess(`${validItems.length} items imported successfully`, 'Bulk Import');
// //         }

// //         this.isBulkDialogVisible = false;
// //         this.loadMasters(); 
// //       },
// //       error: (err) => {
// //         this.appMessage.handleHttpError(err, 'Bulk Import');
// //       },
// //       complete: () => {
// //         this.isBulkSaving = false;
// //       }
// //     });
// //   }

// //   // --- Helpers ---

// //   private createEmptyMaster(): Master {
// //     return {
// //       _id: `new_${Date.now()}_${Math.random()}`,
// //       type: 'category', // Default type
// //       name: '',
// //       code: '',
// //       description: '',
// //       imageUrl: '', // Initialized empty
// //       isActive: true,
// //       metadata: { isFeatured: false, sortOrder: 0 },
// //       isNew: true
// //     };
// //   }

// //   private preparePayload(row: any): any {
// //     // Handle potential object structure from Dropdowns (PrimeNG/AgGrid selects often return objects)
// //     const typeValue = (row.type && typeof row.type === 'object') ? row.type.value : row.type;

// //     // Handle nested metadata safely. 
// //     // AgGrid might flatten edits to row['metadata.isFeatured'] or keep them nested in row.metadata.isFeatured
// //     const isFeatured = row['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false;
// //     const sortOrder = row.metadata?.sortOrder ?? 0;

// //     return {
// //       type: typeValue,
// //       name: row.name,
// //       code: row.code ? row.code.toUpperCase() : null,
// //       description: row.description,
// //       imageUrl: row.imageUrl, // ADDED TO PAYLOAD
// //       isActive: row.isActive,
// //       metadata: {
// //         isFeatured: isFeatured,
// //         sortOrder: sortOrder
// //       }
// //     };
// //   }

// //   private generateSlug(text: string): string {
// //     if (!text) return '';
// //     const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// //     const random = Math.random().toString(36).substring(2, 8);
// //     return `${slug}-${random}`;
// //   }
// // }
// // // import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule } from '@angular/forms';
// // // import { ConfirmationService } from 'primeng/api';

// // // // PrimeNG Imports
// // // import { ButtonModule } from 'primeng/button';
// // // import { ToastModule } from 'primeng/toast';
// // // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // // import { ToolbarModule } from 'primeng/toolbar';
// // // import { IconFieldModule } from 'primeng/iconfield';
// // // import { InputIconModule } from 'primeng/inputicon';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { DialogModule } from 'primeng/dialog';

// // // // Services
// // // import { MasterService } from '../../../../core/services/master.service';
// // // import { LoadingService } from '../../../../core/services/loading.service';

// // // // Grid Components & Types
// // // import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
// // // import { GridColDef } from "../../AgGrid/grid/grid.types";
// // // import { SelectModule } from 'primeng/select';
// // // import { AppMessageService } from '../../../../core/services/message.service';

// // // // --- Updated Interface based on Mongoose Schema ---
// // // export interface Master {
// // //   _id: string;
// // //   type: string;
// // //   name: string;
// // //   code?: string;
// // //   slug?: string;
// // //   description?: string;
// // //   imageUrl?: string;
// // //   parentId?: string | null;
// // //   isActive: boolean;
// // //   metadata?: {
// // //     isFeatured: boolean;
// // //     sortOrder: number;
// // //   };
// // //   isNew?: boolean; // Frontend helper flag
// // // }

// // // @Component({
// // //   selector: 'app-master-list',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     FormsModule, // Required for ngModel in Dialog
// // //     ButtonModule,
// // //     ToastModule,
// // //     ConfirmDialogModule,
// // //     ToolbarModule,
// // //     IconFieldModule,
// // //     InputIconModule,
// // //     InputTextModule,
// // //     DialogModule,
// // // SelectModule,    AppSharedGrid
// // //   ],
// // //   providers: [ConfirmationService],
// // //   template: `
// // //     <div class="master-page-container">
// // //       <div class="themed-card master-card">
        
// // //         <!-- TOOLBAR -->
// // //         <p-toolbar styleClass="master-toolbar">
// // //           <div class="p-toolbar-group-start gap-3">
// // //             <h2 class="section-heading m-0">Master Data</h2>
            
// // //             <p-iconfield iconPosition="left">
// // //               <p-inputicon styleClass="pi pi-search"></p-inputicon>
// // //               <input pInputText type="text" (input)="onQuickFilter($event)" 
// // //                      placeholder="Search..." class="p-inputtext-sm w-64" />
// // //             </p-iconfield>
// // //           </div>

// // //           <div class="p-toolbar-group-end flex gap-2">
// // //              <div class="stats mr-4 align-content-center">
// // //               <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
// // //             </div>
            
// // //             <!-- Bulk Import Button -->
// // //             <p-button label="Bulk Import" icon="pi pi-upload" styleClass="p-button-outlined" 
// // //                       (click)="openBulkDialog()"></p-button>

// // //             <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
// // //                       (click)="loadMasters()" [loading]="loading()"></p-button>
            
// // //             <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
// // //           </div>
// // //         </p-toolbar>

// // //         <!-- MAIN DATA GRID -->
// // //         <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
// // //           <app-shared-grid
// // //             [columns]="columns"
// // //             [data]="masters()"
// // //             [selectionMode]="'multiple'"
// // //             [showActions]="true"
// // //             (gridEvent)="onGridEvent($event)">
// // //           </app-shared-grid>
// // //         </div>

// // //       </div>
// // //     </div>

// // //     <!-- BULK ENTRY DIALOG WITH GRID -->
// // //     <p-dialog header="Bulk Entry" [(visible)]="isBulkDialogVisible" [modal]="true" 
// // //               [style]="{ width: '90vw', height: '80vh' }" [draggable]="false" [resizable]="false"
// // //               [maximizable]="true">
      
// // //       <div class="flex flex-col h-full gap-2">
// // //         <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100 flex items-center">
// // //           <i class="pi pi-info-circle mr-2"></i>
// // //           <span>Click <b>"Add Row"</b> in the grid below to insert items. Click <b>"Create All"</b> to save.</span>
// // //         </div>

// // //         <!-- Reusing AppSharedGrid for Bulk Entry -->
// // //         <div class="flex-1 overflow-hidden border rounded-md">
// // //            <app-shared-grid
// // //             [columns]="columns"
// // //             [data]="bulkData()"
// // //             [selectionMode]="'multiple'"
// // //             [showActions]="true"
// // //             (gridEvent)="onBulkGridEvent($event)">
// // //           </app-shared-grid>
// // //         </div>
// // //       </div>
      
// // //       <ng-template pTemplate="footer">
// // //         <p-button label="Cancel" icon="pi pi-times" [text]="true" (click)="isBulkDialogVisible = false"></p-button>
// // //         <p-button label="Create All" icon="pi pi-check" [loading]="isBulkSaving" 
// // //                   (click)="saveBulkEntry()"></p-button>
// // //       </ng-template>
// // //     </p-dialog>

// // //     <p-toast></p-toast> 
// // //     <p-confirmDialog></p-confirmDialog>
// // //   `,
// // //   styleUrls: ['./master-list.scss'],
// // //   changeDetection: ChangeDetectionStrategy.OnPush
// // // })
// // // export class MasterList implements OnInit {
// // //   // --- Services ---
// // //   private masterService = inject(MasterService);
// // //   private appMessage = inject(AppMessageService);
// // //   private confirmationService = inject(ConfirmationService);
// // //   private loadingService = inject(LoadingService);

// // //   // --- Signals ---
// // //   masters = signal<Master[]>([]);
// // //   bulkData = signal<Master[]>([]); // Data for the bulk dialog
// // //   loading = signal(false);

// // //   // --- Bulk Dialog State ---
// // //   isBulkDialogVisible = false;
// // //   isBulkSaving = false;

// // //   gridApi: any;
// // //   bulkGridApi: any; // Separate API reference for the bulk grid

// // //   // --- Master Types Definition ---
// // //   readonly masterTypes = [
// // //     { label: 'Category', value: 'category' },
// // //     { label: 'Brand', value: 'brand' },
// // //     { label: 'Unit', value: 'unit' },
// // //     { label: 'Department', value: 'department' }
// // //   ];

// // //   // --- Grid Definition ---
// // //   columns: GridColDef<Master>[] = [
// // //     {
// // //       field: 'type',
// // //       headerName: 'Type',
// // //       width: 150,
// // //       cellConfig: {
// // //         type: 'select',
// // //         placeholder: 'Select Type',
// // //         options: this.masterTypes,
// // //         optionLabel: 'label',
// // //         optionValue: 'value'
// // //       }
// // //     },
// // //     {
// // //       field: 'name',
// // //       headerName: 'Name',
// // //       flex: 1,
// // //       cellConfig: { type: 'text', placeholder: 'Enter Name' }
// // //     },
// // //     {
// // //       field: 'code',
// // //       headerName: 'Code',
// // //       width: 120,
// // //       cellConfig: { type: 'text', placeholder: 'CODE' }
// // //     },
// // //     {
// // //       field: 'isActive',
// // //       headerName: 'Active',
// // //       width: 100,
// // //       cellConfig: { type: 'boolean' }
// // //     },
// // //     {
// // //       field: 'metadata.isFeatured', 
// // //       headerName: 'Featured',
// // //       width: 100,
// // //       valueGetter: (p) => p.data?.metadata?.isFeatured,
// // //       cellConfig: { type: 'boolean' } 
// // //     },
// // //     {
// // //       field: 'description',
// // //       headerName: 'Description',
// // //       flex: 1.5,
// // //       cellConfig: { type: 'text', placeholder: 'Optional description' }
// // //     }
// // //   ];

// // //   constructor() {
// // //     effect(() => {});
// // //   }

// // //   ngOnInit() {
// // //     this.loadMasters();
// // //   }

// // //   // --- Load Data ---
// // //   loadMasters() {
// // //     this.loading.set(true);
// // //     this.masterService.getMasters().subscribe({
// // //       next: (res) => {
// // //         this.masters.set(res.data.masters || []);
// // //         this.loading.set(false);
// // //       },
// // //       error: (err) => {
// // //         this.appMessage.handleHttpError(err, 'Loading Masters');
// // //         this.loading.set(false);
// // //       }
// // //     });
// // //   }

// // //   // --- Main Grid Event Handler ---
// // //   onGridEvent(event: any) {
// // //     switch (event.type) {
// // //       case 'init':
// // //         this.gridApi = event.api;
// // //         break;
// // //       case 'save':
// // //       case 'Entersave':
// // //         this.handleSave(event.row);
// // //         break;
// // //       case 'delete':
// // //         this.handleDelete(event.row);
// // //         break;
// // //     }
// // //   }

// // //   // --- Bulk Grid Event Handler ---
// // //   onBulkGridEvent(event: any) {
// // //     switch (event.type) {
// // //       case 'init':
// // //         this.bulkGridApi = event.api;
// // //         break;
// // //     }
// // //   }

// // //   // --- Single Row Actions ---

// // //   onAddNew() {
// // //     const newMaster = this.createEmptyMaster();
// // //     this.masters.update(current => [newMaster, ...current]);    
// // //     this.appMessage.showInfo('Please fill details and click Save', 'New Row Added');
// // //   }

// // //   handleSave(row: Master) {
// // //     if (!row.name || !row.type) {
// // //       this.appMessage.showWarn('Name and Type are required', 'Validation Error');
// // //       return;
// // //     }

// // //     const payload = this.preparePayload(row);

// // //     if (row.isNew || row._id.startsWith('new_')) {
// // //       this.masterService.createMaster(payload).subscribe({
// // //         next: () => {
// // //           this.appMessage.showSuccess('Master created successfully');
// // //           this.loadMasters(); 
// // //         },
// // //         error: (err) => this.appMessage.handleHttpError(err, 'Creation')
// // //       });
// // //     } else {
// // //       this.masterService.updateMaster(row._id, payload).subscribe({
// // //         next: () => this.appMessage.showSuccess('Master updated successfully'),
// // //         error: (err) => this.appMessage.handleHttpError(err, 'Update')
// // //       });
// // //     }
// // //   }

// // //   handleDelete(row: Master) {
// // //     if (row.isNew || row._id.startsWith('new_')) {
// // //       this.masters.update(current => current.filter(m => m._id !== row._id));
// // //       this.appMessage.showInfo('Unsaved row removed');
// // //       return;
// // //     }

// // //     this.confirmationService.confirm({
// // //       message: `Are you sure you want to delete <b>${row.name}</b>?`,
// // //       header: 'Confirm Delete',
// // //       icon: 'pi pi-exclamation-triangle',
// // //       acceptButtonStyleClass: 'p-button-danger p-button-text',
// // //       rejectButtonStyleClass: 'p-button-text p-button-secondary',
// // //       accept: () => {
// // //         this.masterService.deleteMaster(row._id).subscribe({
// // //           next: () => {
// // //             this.masters.update(users => users.filter(u => u._id !== row._id));
// // //             this.appMessage.showSuccess(`${row.name} removed successfully`);
// // //           },
// // //           error: (err) => this.appMessage.handleHttpError(err, 'Delete')
// // //         });
// // //       }
// // //     });
// // //   }

// // //   onQuickFilter(event: any) {
// // //     if (this.gridApi) {
// // //       this.gridApi.setGridOption('quickFilterText', event.target.value);
// // //     }
// // //   }

// // //   // --- Bulk Entry Actions ---

// // //   openBulkDialog() {
// // //     this.bulkData.set([]); 
// // //     this.isBulkDialogVisible = true;
// // //   }

// // //   saveBulkEntry() {
// // //     if (!this.bulkGridApi) return;

// // //     // 1. Harvest Data from Grid
// // //     const validItems: any[] = [];
// // //     this.bulkGridApi.forEachNode((node: any) => {
// // //       // Filter out empty rows (at least name and type required)
// // //       if (node.data && node.data.name && node.data.type) {
// // //         // Strip out the temp ID and format payload
// // //         const payload = this.preparePayload(node.data);
        
// // //         // Generate slug frontend-side to prevent "slug: null" duplicate errors on bulk insert
// // //         if (!payload.slug) {
// // //            payload['slug'] = this.generateSlug(payload.name);
// // //         }
        
// // //         validItems.push(payload);
// // //       }
// // //     });

// // //     if (validItems.length === 0) {
// // //       this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.', 'No Data');
// // //       return;
// // //     }

// // //     this.isBulkSaving = true;
    
// // //     // 2. Send to API
// // //     this.masterService.createBulkMasters(validItems).subscribe({
// // //       next: (res) => {
// // //         // Handle Partial Success
// // //         if (res.status === 'partial_success' || (res.failedCount && res.failedCount > 0)) {
// // //            const inserted = res.insertedCount || 0;
// // //            const failed = res.failedCount || 0;
// // //            this.appMessage.showWarn(
// // //              `Imported: ${inserted}. Failed: ${failed}. Check duplicate names.`, 
// // //              'Partial Import'
// // //            );
// // //         } else {
// // //            this.appMessage.showSuccess(`${validItems.length} items imported successfully`, 'Bulk Import');
// // //         }

// // //         this.isBulkDialogVisible = false;
// // //         this.loadMasters(); 
// // //       },
// // //       error: (err) => {
// // //         this.appMessage.handleHttpError(err, 'Bulk Import');
// // //       },
// // //       complete: () => {
// // //         this.isBulkSaving = false;
// // //       }
// // //     });
// // //   }

// // //   // --- Helpers ---

// // //   private createEmptyMaster(): Master {
// // //     return {
// // //       _id: `new_${Date.now()}_${Math.random()}`,
// // //       type: 'category', // Default type
// // //       name: '',
// // //       code: '',
// // //       description: '',
// // //       isActive: true,
// // //       metadata: { isFeatured: false, sortOrder: 0 },
// // //       isNew: true
// // //     };
// // //   }

// // //   private preparePayload(row: Master): any {
// // //     return {
// // //       type: row.type,
// // //       name: row.name,
// // //       code: row.code ? row.code.toUpperCase() : null,
// // //       description: row.description,
// // //       isActive: row.isActive,
// // //       metadata: {
// // //         isFeatured: (row as any)['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false,
// // //         sortOrder: row.metadata?.sortOrder ?? 0
// // //       }
// // //     };
// // //   }

// // //   private generateSlug(text: string): string {
// // //     const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// // //     const random = Math.random().toString(36).substring(2, 8);
// // //     return `${slug}-${random}`;
// // //   }
// // // }

// // // // import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { FormsModule } from '@angular/forms';
// // // // import { ConfirmationService } from 'primeng/api';

// // // // // PrimeNG Imports
// // // // import { ButtonModule } from 'primeng/button';
// // // // import { ToastModule } from 'primeng/toast';
// // // // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // // // import { ToolbarModule } from 'primeng/toolbar';
// // // // import { IconFieldModule } from 'primeng/iconfield';
// // // // import { InputIconModule } from 'primeng/inputicon';
// // // // import { InputTextModule } from 'primeng/inputtext';
// // // // import { DialogModule } from 'primeng/dialog';

// // // // // Services
// // // // import { MasterService } from '../../../../core/services/master.service';
// // // // import { LoadingService } from '../../../../core/services/loading.service';

// // // // // Grid Components & Types
// // // // import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
// // // // import { GridColDef } from "../../AgGrid/grid/grid.types";
// // // // import { SelectModule } from 'primeng/select';
// // // // import { AppMessageService } from '../../../../core/services/message.service';

// // // // // --- Updated Interface based on Mongoose Schema ---
// // // // export interface Master {
// // // //   _id: string;
// // // //   type: string;
// // // //   name: string;
// // // //   code?: string;
// // // //   slug?: string;
// // // //   description?: string;
// // // //   imageUrl?: string;
// // // //   parentId?: string | null;
// // // //   isActive: boolean;
// // // //   metadata?: {
// // // //     isFeatured: boolean;
// // // //     sortOrder: number;
// // // //   };
// // // //   isNew?: boolean; // Frontend helper flag
// // // // }

// // // // @Component({
// // // //   selector: 'app-master-list',
// // // //   standalone: true,
// // // //   imports: [
// // // //     CommonModule,
// // // //     FormsModule, // Required for ngModel in Dialog
// // // //     ButtonModule,
// // // //     ToastModule,
// // // //     ConfirmDialogModule,
// // // //     ToolbarModule,
// // // //     IconFieldModule,
// // // //     InputIconModule,
// // // //     InputTextModule,
// // // //     DialogModule,
// // // //     SelectModule,
// // // //     AppSharedGrid
// // // //   ],
// // // //   providers: [ConfirmationService],
// // // //   template: `
// // // //     <div class="master-page-container">
// // // //       <div class="themed-card master-card">
        
// // // //         <!-- TOOLBAR -->
// // // //         <p-toolbar styleClass="master-toolbar">
// // // //           <div class="p-toolbar-group-start gap-3">
// // // //             <h2 class="section-heading m-0">Master Data</h2>
            
// // // //             <p-iconfield iconPosition="left">
// // // //               <p-inputicon styleClass="pi pi-search"></p-inputicon>
// // // //               <input pInputText type="text" (input)="onQuickFilter($event)" 
// // // //                      placeholder="Search..." class="p-inputtext-sm w-64" />
// // // //             </p-iconfield>
// // // //           </div>

// // // //           <div class="p-toolbar-group-end flex gap-2">
// // // //              <div class="stats mr-4 align-content-center">
// // // //               <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
// // // //             </div>
            
// // // //             <!-- Bulk Import Button -->
// // // //             <p-button label="Bulk Import" icon="pi pi-upload" styleClass="p-button-outlined" 
// // // //                       (click)="openBulkDialog()"></p-button>

// // // //             <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
// // // //                       (click)="loadMasters()" [loading]="loading()"></p-button>
            
// // // //             <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
// // // //           </div>
// // // //         </p-toolbar>

// // // //         <!-- MAIN DATA GRID -->
// // // //         <div class="master-grid-wrapper" style="height: calc(100vh - 200px);">
// // // //           <app-shared-grid
// // // //             [columns]="columns"
// // // //             [data]="masters()"
// // // //             [selectionMode]="'multiple'"
// // // //             [showActions]="true"
// // // //             (gridEvent)="onGridEvent($event)">
// // // //           </app-shared-grid>
// // // //         </div>

// // // //       </div>
// // // //     </div>

// // // //     <!-- BULK ENTRY DIALOG WITH GRID -->
// // // //     <p-dialog header="Bulk Entry" [(visible)]="isBulkDialogVisible" [modal]="true" 
// // // //               [style]="{ width: '90vw', height: '80vh' }" [draggable]="false" [resizable]="false"
// // // //               [maximizable]="true">
      
// // // //       <div class="flex flex-col h-full gap-2">
// // // //         <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100 flex items-center">
// // // //           <i class="pi pi-info-circle mr-2"></i>
// // // //           <span>Click <b>"Add Row"</b> in the grid below to insert items. Click <b>"Create All"</b> to save.</span>
// // // //         </div>

// // // //         <!-- Reusing AppSharedGrid for Bulk Entry -->
// // // //         <div class="flex-1 overflow-hidden border rounded-md">
// // // //            <app-shared-grid
// // // //             [columns]="columns"
// // // //             [data]="bulkData()"
// // // //             [selectionMode]="'multiple'"
// // // //             [showActions]="false"
// // // //             (gridEvent)="onBulkGridEvent($event)">
// // // //           </app-shared-grid>
// // // //         </div>
// // // //       </div>
      
// // // //       <ng-template pTemplate="footer">
// // // //         <p-button label="Cancel" icon="pi pi-times" [text]="true" (click)="isBulkDialogVisible = false"></p-button>
// // // //         <p-button label="Create All" icon="pi pi-check" [loading]="isBulkSaving" 
// // // //                   (click)="saveBulkEntry()"></p-button>
// // // //       </ng-template>
// // // //     </p-dialog>

// // // //     <p-toast></p-toast> 
// // // //     <p-confirmDialog></p-confirmDialog>
// // // //   `,
// // // //   styleUrls: ['./master-list.scss'],
// // // //   changeDetection: ChangeDetectionStrategy.OnPush
// // // // })
// // // // export class MasterList implements OnInit {
// // // //   // --- Services ---
// // // //   private masterService = inject(MasterService);
// // // //   private appMessage = inject(AppMessageService);
// // // //   private confirmationService = inject(ConfirmationService);
// // // //   private loadingService = inject(LoadingService);

// // // //   // --- Signals ---
// // // //   masters = signal<Master[]>([]);
// // // //   bulkData = signal<Master[]>([]); // Data for the bulk dialog
// // // //   loading = signal(false);

// // // //   // --- Bulk Dialog State ---
// // // //   isBulkDialogVisible = false;
// // // //   isBulkSaving = false;

// // // //   gridApi: any;
// // // //   bulkGridApi: any; // Separate API reference for the bulk grid

// // // //   // --- Master Types Definition ---
// // // //   readonly masterTypes = [
// // // //     { label: 'Category', value: 'category' },
// // // //     { label: 'Brand', value: 'brand' },
// // // //     { label: 'Unit', value: 'unit' },
// // // //     { label: 'Department', value: 'department' }
// // // //   ];

// // // //   // --- Grid Definition ---
// // // //   columns: GridColDef<Master>[] = [
// // // //     {
// // // //       field: 'type',
// // // //       headerName: 'Type',
// // // //       width: 150,
// // // //       cellConfig: {
// // // //         type: 'select',
// // // //         placeholder: 'Select Type',
// // // //         options: this.masterTypes,
// // // //         optionLabel: 'label',
// // // //         optionValue: 'value'
// // // //       }
// // // //     },
// // // //     {
// // // //       field: 'name',
// // // //       headerName: 'Name',
// // // //       flex: 1,
// // // //       cellConfig: { type: 'text', placeholder: 'Enter Name' }
// // // //     },
// // // //     {
// // // //       field: 'code',
// // // //       headerName: 'Code',
// // // //       width: 120,
// // // //       cellConfig: { type: 'text', placeholder: 'CODE' }
// // // //     },
// // // //     {
// // // //       field: 'isActive',
// // // //       headerName: 'Active',
// // // //       width: 100,
// // // //       cellConfig: { type: 'boolean' }
// // // //     },
// // // //     {
// // // //       field: 'metadata.isFeatured', 
// // // //       headerName: 'Featured',
// // // //       width: 100,
// // // //       valueGetter: (p) => p.data?.metadata?.isFeatured,
// // // //       cellConfig: { type: 'boolean' } 
// // // //     },
// // // //     {
// // // //       field: 'description',
// // // //       headerName: 'Description',
// // // //       flex: 1.5,
// // // //       cellConfig: { type: 'text', placeholder: 'Optional description' }
// // // //     },{
// // // //       field: 'imageUrl',
// // // //       headerName: 'imageUrl',
// // // //       flex: 1.5,
// // // //       cellConfig: { type: 'text', placeholder: 'imageUrl' }
// // // //     }
// // // //   ];

// // // //   constructor() {
// // // //     effect(() => {});
// // // //   }

// // // //   ngOnInit() {
// // // //     this.loadMasters();
// // // //   }

// // // //   // --- Load Data ---
// // // //   loadMasters() {
// // // //     this.loading.set(true);
// // // //     this.masterService.getMasters().subscribe({
// // // //       next: (res) => {
// // // //         this.masters.set(res.data.masters || []);
// // // //         this.loading.set(false);
// // // //       },
// // // //       error: (err) => {
// // // //         this.appMessage.handleHttpError(err, 'Loading Masters');
// // // //         this.loading.set(false);
// // // //       }
// // // //     });
// // // //   }

// // // //   // --- Main Grid Event Handler ---
// // // //   onGridEvent(event: any) {
// // // //     switch (event.type) {
// // // //       case 'init':
// // // //         this.gridApi = event.api;
// // // //         break;
// // // //       case 'save':
// // // //       case 'Entersave':
// // // //         this.handleSave(event.row);
// // // //         break;
// // // //       case 'delete':
// // // //         this.handleDelete(event.row);
// // // //         break;
// // // //     }
// // // //   }

// // // //   // --- Bulk Grid Event Handler ---
// // // //   onBulkGridEvent(event: any) {
// // // //     switch (event.type) {
// // // //       case 'init':
// // // //         this.bulkGridApi = event.api;
// // // //         break;
// // // //     }
// // // //   }

// // // //   // --- Single Row Actions ---

// // // //   onAddNew() {
// // // //     const newMaster = this.createEmptyMaster();
// // // //     this.masters.update(current => [newMaster, ...current]);    
// // // //     this.appMessage.showInfo('Please fill details and click Save', 'New Row Added');
// // // //   }

// // // //   handleSave(row: Master) {
// // // //     if (!row.name || !row.type) {
// // // //       this.appMessage.showWarn('Name and Type are required', 'Validation Error');
// // // //       return;
// // // //     }

// // // //     const payload = this.preparePayload(row);

// // // //     if (row.isNew || row._id.startsWith('new_')) {
// // // //       this.masterService.createMaster(payload).subscribe({
// // // //         next: () => {
// // // //           this.appMessage.showSuccess('Master created successfully');
// // // //           this.loadMasters(); 
// // // //         },
// // // //         error: (err) => this.appMessage.handleHttpError(err, 'Creation')
// // // //       });
// // // //     } else {
// // // //       this.masterService.updateMaster(row._id, payload).subscribe({
// // // //         next: () => this.appMessage.showSuccess('Master updated successfully'),
// // // //         error: (err) => this.appMessage.handleHttpError(err, 'Update')
// // // //       });
// // // //     }
// // // //   }

// // // //   handleDelete(row: Master) {
// // // //     if (row.isNew || row._id.startsWith('new_')) {
// // // //       this.masters.update(current => current.filter(m => m._id !== row._id));
// // // //       this.appMessage.showInfo('Unsaved row removed');
// // // //       return;
// // // //     }

// // // //     this.confirmationService.confirm({
// // // //       message: `Are you sure you want to delete <b>${row.name}</b>?`,
// // // //       header: 'Confirm Delete',
// // // //       icon: 'pi pi-exclamation-triangle',
// // // //       acceptButtonStyleClass: 'p-button-danger p-button-text',
// // // //       rejectButtonStyleClass: 'p-button-text p-button-secondary',
// // // //       accept: () => {
// // // //         this.masterService.deleteMaster(row._id).subscribe({
// // // //           next: () => {
// // // //             this.masters.update(users => users.filter(u => u._id !== row._id));
// // // //             this.appMessage.showSuccess(`${row.name} removed successfully`);
// // // //           },
// // // //           error: (err) => this.appMessage.handleHttpError(err, 'Delete')
// // // //         });
// // // //       }
// // // //     });
// // // //   }

// // // //   onQuickFilter(event: any) {
// // // //     if (this.gridApi) {
// // // //       this.gridApi.setGridOption('quickFilterText', event.target.value);
// // // //     }
// // // //   }

// // // //   // --- Bulk Entry Actions ---

// // // //   openBulkDialog() {
// // // //     this.bulkData.set([]); 
// // // //     this.isBulkDialogVisible = true;
// // // //   }

// // // //   saveBulkEntry() {
// // // //     if (!this.bulkGridApi) return;

// // // //     // 1. Harvest Data from Grid
// // // //     const validItems: any[] = [];
// // // //     this.bulkGridApi.forEachNode((node: any) => {
// // // //       if (node.data && node.data.name && node.data.type) {
// // // //         const payload = this.preparePayload(node.data);
// // // //                 if (!payload.slug) {
// // // //            payload['slug'] = this.generateSlug(payload.name);
// // // //         }
        
// // // //         validItems.push(payload);
// // // //       }
// // // //     });

// // // //     if (validItems.length === 0) {
// // // //       this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.', 'No Data');
// // // //       return;
// // // //     }

// // // //     this.isBulkSaving = true;
    
// // // //     // 2. Send to API
// // // //     this.masterService.createBulkMasters(validItems).subscribe({
// // // //       next: (res) => {
// // // //         // Handle Partial Success
// // // //         if (res.status === 'partial_success' || (res.failedCount && res.failedCount > 0)) {
// // // //            const inserted = res.insertedCount || 0;
// // // //            const failed = res.failedCount || 0;
// // // //            this.appMessage.showWarn(
// // // //              `Imported: ${inserted}. Failed: ${failed}. Check duplicate names.`, 
// // // //              'Partial Import'
// // // //            );
// // // //         } else {
// // // //            this.appMessage.showSuccess(`${validItems.length} items imported successfully`, 'Bulk Import');
// // // //         }

// // // //         this.isBulkDialogVisible = false;
// // // //         this.loadMasters(); 
// // // //       },
// // // //       error: (err) => {
// // // //         this.appMessage.handleHttpError(err, 'Bulk Import');
// // // //       },
// // // //       complete: () => {
// // // //         this.isBulkSaving = false;
// // // //       }
// // // //     });
// // // //   }

// // // //   // --- Helpers ---

// // // //   private createEmptyMaster(): Master {
// // // //     return {
// // // //       _id: `new_${Date.now()}_${Math.random()}`,
// // // //       type: 'category', // Default type
// // // //       name: '',
// // // //       code: '',
// // // //       description: '',
// // // //       isActive: true,
// // // //       metadata: { isFeatured: false, sortOrder: 0 },
// // // //       isNew: true
// // // //     };
// // // //   }

// // // //   private preparePayload(row: Master): any {
// // // //     return {
// // // //       type: row.type,
// // // //       name: row.name,
// // // //       code: row.code ? row.code.toUpperCase() : null,
// // // //       description: row.description,
// // // //       isActive: row.isActive,
// // // //       metadata: {
// // // //         isFeatured: (row as any)['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false,
// // // //         sortOrder: row.metadata?.sortOrder ?? 0
// // // //       }
// // // //     };
// // // //   }

// // // //   private generateSlug(text: string): string {
// // // //     const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// // // //     const random = Math.random().toString(36).substring(2, 8);
// // // //     return `${slug}-${random}`;
// // // //   }
// // // // }
