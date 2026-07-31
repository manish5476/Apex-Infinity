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

// New Enterprise UI Components
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
import { ButtonComponent } from '../../../../shared/ui/form/button.component';
import { DataGridComponent } from '../../../../shared/ui/grid/data-grid.component';
import { GridColumn } from '../../../../shared/ui/grid/grid-types';

export interface Master {
  _id: string;
  type: string;
  name: string;
  code?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured?: boolean; // Flattened for the grid
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
    ButtonComponent,
    DataGridComponent
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page>
      <app-page-header density="compact" title="Master Data" subtitle="Manage your master reference data across all modules">
        <!-- Optional Global Header Actions can go here -->
      </app-page-header>

      <app-page-content>
        <div class="h-[calc(100vh-140px)] w-full">
          
          <!-- The New Enterprise Data Grid -->
          <app-data-grid
            [data]="masters()"
            [columns]="columns"
            [rowSelection]="true"
            [multipleSelection]="true"
            [enableBatchEdit]="true"
            [pagination]="true"
            [pageSize]="15"
            [selectedRows]="selectedRows()"
            (selectedRowsChange)="selectedRows.set($event)"
            (batchSave)="saveBulkEdit($event)">
            
            <!-- Projected Filters / Search -->
            <div grid-filters class="flex items-center gap-2">
              <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] px-2">
                {{ masters().length }} Records
              </span>
            </div>

            <!-- Projected Actions -->
            <div grid-actions class="flex items-center gap-2">
              @if (selectedRows().length > 0) {
                <app-button 
                  variant="danger" 
                  size="sm" 
                  icon="pi pi-trash" 
                  [label]="'Delete (' + selectedRows().length + ')'" 
                  (clicked)="confirmBulkDelete()">
                </app-button>
              }
              
              <app-button 
                variant="ghost" 
                size="sm" 
                [icon]="loading() ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" 
                (clicked)="loadMasters()">
              </app-button>

              <app-button 
                variant="primary" 
                size="sm" 
                icon="pi pi-plus" 
                label="Add New" 
                (clicked)="onAddNew()">
              </app-button>
            </div>

          </app-data-grid>
        </div>
      </app-page-content>
    </app-page>

    <p-toast></p-toast>
    <p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>
  `
})
export class MasterList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // --- Services ---
  private masterService = inject(MasterService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // --- State Signals ---
  masters = signal<Master[]>([]);
  selectedRows = signal<Master[]>([]);
  loading = signal(false);

  // --- Master Types Definition ---
  readonly masterTypes = [
    { label: 'Department', value: 'department' },
    { label: 'Category', value: 'category' },
    { label: 'Sub Category', value: 'sub_category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Tax Rate', value: 'tax_rate' }
  ];

  // --- The New Grid Column Definition ---
  columns: GridColumn[] = [
    {
      field: 'type',
      header: 'Type',
      type: 'select',
      options: this.masterTypes,
      editable: true,
      width: '180px'
    },
    {
      field: 'name',
      header: 'Master Name',
      type: 'text',
      editable: true,
      width: '250px'
    },
    {
      field: 'code',
      header: 'Code',
      type: 'text',
      editable: true,
      width: '150px'
    },
    {
      field: 'description',
      header: 'Description',
      type: 'textarea',
      editable: true,
      width: '300px'
    },
    {
      field: 'isActive',
      header: 'Status',
      type: 'boolean',
      editable: true,
      width: '100px'
    },
    {
      field: 'isFeatured',
      header: 'Featured',
      type: 'boolean',
      editable: true,
      width: '100px'
    }
  ];

  ngOnInit() {
    this.loadMasters();
  }

  // --- Load Data ---
  loadMasters() {
    this.loading.set(true);
    this.masterService.getMasters().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const data = res.data?.masters || res.data || [];
        
        // Map nested fields to top-level for easy grid editing
        const mappedData = data.map((d: any) => ({
          ...d,
          isFeatured: d.metadata?.isFeatured ?? false
        }));

        this.masters.set(mappedData);
        this.selectedRows.set([]);
        this.loading.set(false);
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loading.set(false);
      }
    });
  }

  // --- Add New Row Directly to Grid ---
  onAddNew() {
    // Pushes a new empty row to the top of the grid data
    this.masters.update(currentData => [this.createEmptyMaster(), ...currentData]);
    
    // Suggestion: In a real app, you might programmatically trigger the grid's `toggleBatchEdit()`
    // method here so the user is immediately in edit mode when adding a row.
  }

  // --- Save Batch Edits ---
  saveBulkEdit(updatedData: Master[]) {
    // Filter out rows that are empty or invalid
    const validItems = updatedData
      .filter(r => r.name && r.name.trim() !== '' && r.type)
      .map(r => this.preparePayload(r));

    if (validItems.length === 0) return;

    this.loading.set(true);

    // Call your bulk creation/update endpoint
    this.masterService.bulkUpdateMasters(validItems).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.appMessage.showSuccess(res.message || 'Records updated successfully');
        this.loadMasters();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters();
      }
    });
  }

  // --- Delete Handling ---
  confirmBulkDelete() {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${selected.length}</b> records?`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      accept: () => this.handleBulkDelete(selected)
    });
  }

  handleBulkDelete(rows: Master[]) {
    // Filter out un-saved 'new' rows
    const ids = rows.map(m => m._id).filter(id => !id.startsWith('new_'));

    if (ids.length === 0) {
      this.loadMasters(); // Just refresh to clear unsaved rows
      return;
    }

    this.loading.set(true);
    this.masterService.bulkDeleteMasters(ids).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.appMessage.showSuccess(res.message || 'Items deleted');
        this.loadMasters();
      },
      error: (err) => {
        this.appMessage.handleHttpError(err);
        this.loadMasters();
      }
    });
  }

  // --- Helpers ---
  private createEmptyMaster(): Master {
    return {
      _id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'category',
      name: '',
      code: '',
      description: '',
      isActive: true,
      isFeatured: false
    };
  }

  private preparePayload(row: Master): any {
    return {
      _id: row._id.startsWith('new_') ? undefined : row._id, // Strip temp IDs
      type: row.type,
      name: row.name,
      code: row.code ? row.code.toUpperCase() : null,
      description: row.description,
      isActive: row.isActive,
      metadata: {
        isFeatured: row.isFeatured ?? false,
        sortOrder: row.metadata?.sortOrder ?? 0
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


// import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
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
// import { TableModule } from 'primeng/table';
// import { CheckboxModule } from 'primeng/checkbox';

// // Services
// import { MasterService } from '../../../../core/services/master.service';
// import { AppMessageService } from '../../../../core/services/message.service';

// // Grid Components & Types
// import { AppSharedGrid, SharedGridEvent } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
// import { GridColDef } from "../../AgGrid/grid/grid.types";
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// // UI Components
// import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
// import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
// import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
// import { ButtonComponent } from '../../../../shared/ui/form/button.component';

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
//   _tempId?: string; // Helper for new rows
// }

// @Component({
//   selector: 'app-master-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ConfirmDialogModule,
//     IconFieldModule,
//     InputIconModule,
//     InputTextModule,
//     DialogModule,
//     SelectModule,
//     TableModule,
//     CheckboxModule,
//     AppSharedGrid,
//     PageComponent,
//     PageHeaderComponent,
//     PageContentComponent,
//     ButtonComponent
//   ],
//   providers: [ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <app-page>
//       <app-page-header density="compact" title="Master Data" subtitle="Manage your master reference data across all modules">
//         <div class="flex items-center gap-3">
//           <p-iconfield iconPosition="left">
//             <input pInputText type="text" (input)="onQuickFilter($event)"
//               placeholder="Search..." class="p-inputtext-sm w-64" />
//           </p-iconfield>
//           <div class="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>

//           @if (selectedRows().length > 0) {
//             <app-button
//               variant="danger"
//               size="sm"
//               [rounded]="true"
//               icon="pi pi-trash"
//               [label]="'Delete (' + selectedRows().length + ')'"
//               (clicked)="confirmBulkDelete()">
//             </app-button>
//           }
          
//           @if (!isBulkEditing()) {
//             <app-button
//               variant="secondary"
//               size="sm"
//               [rounded]="true"
//               icon="pi pi-pencil"
//               label="Bulk Edit"
//               (clicked)="toggleBulkEdit()">
//             </app-button>
//           } @else {
//             <app-button 
//               variant="secondary" 
//               size="sm" 
//               [rounded]="true"
//               icon="pi pi-times" 
//               label="Cancel" 
//               (clicked)="cancelBulkEdit()">
//             </app-button>
//             <app-button 
//               variant="primary" 
//               size="sm" 
//               [rounded]="true"
//               icon="pi pi-check" 
//               label="Save All" 
//               (clicked)="saveBulkEdit()">
//             </app-button>
//           }

//           <div class="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>

//           <app-button 
//             variant="secondary" 
//             size="sm" 
//             [rounded]="true"
//             icon="pi pi-upload" 
//             label="Import" 
//             (clicked)="openBulkDialog()">
//           </app-button>

//           <app-button 
//             variant="secondary" 
//             size="sm" 
//             [rounded]="true"
//             [icon]="loading() ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" 
//             (clicked)="loadMasters()">
//           </app-button>

//           <app-button 
//             variant="primary" 
//             size="sm" 
//             [rounded]="true"
//             icon="pi pi-plus" 
//             label="Add New" 
//             (clicked)="onAddNew()">
//           </app-button>
//         </div>
//       </app-page-header>

//       <app-page-content>
//         <div class="flex flex-col w-full h-[calc(100vh-190px)]">
//           <app-shared-grid
//             class="flex-1 block w-full h-full"
//             #mainGrid
//             [columns]="columns"
//             [data]="masters()"
//             [selectionMode]="'multiple'"
//             [showActions]="true"
//             (gridEvent)="onGridEvent($event)">
//           </app-shared-grid>
//         </div>
//       </app-page-content>
//     </app-page>

//     <!-- ============================================ -->
//     <!-- BULK IMPORT DIALOG (Using p-table for Forms)  -->
//     <!-- ============================================ -->
//     <p-dialog [modal]="true" header="Bulk Import" [(visible)]="isBulkDialogVisible" 
//       [style]="{ width: '95vw', height: '90vh' }" [draggable]="false" [resizable]="false"
//       [maximizable]="true" appendTo="body" [blockScroll]="true" 
//       [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">

//       <div class="flex flex-col h-full gap-2">
//         <div class="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100 flex items-center">
//           <i class="pi pi-info-circle mr-2"></i>
//           <span>
//             Enter details below. <b>Name</b> and <b>Type</b> are required.
//             Rows without a Name will be ignored.
//           </span>
//         </div>

//         <!-- PRIME TABLE FOR BULK INPUT (THIS WORKS FOR DATA ENTRY) -->
//         <div class="flex-1 overflow-hidden border rounded-md">
//           <p-table [value]="bulkData()" styleClass="p-datatable-sm bulk-table" 
//             [scrollable]="true" scrollHeight="flex" responsiveLayout="scroll">
            
//             <ng-template pTemplate="header">
//               <tr>
//                 <th style="width: 50px">#</th>
//                 <th style="width: 160px">Type *</th>
//                 <th style="min-width: 200px">Name *</th>
//                 <th style="width: 140px">Code</th>
//                 <th style="min-width: 200px">Description</th>
//                 <th style="width: 100px">Status</th>
//                 <th style="width: 60px"></th>
//               </tr>
//             </ng-template>

//             <ng-template pTemplate="body" let-row let-index="rowIndex">
//               <tr [pEditableRow]="row">
//                 <td>{{ index + 1 }}</td>
//                 <td>
//                   <p-select 
//                     [options]="masterTypes" 
//                     optionLabel="label" 
//                     optionValue="value" 
//                     [(ngModel)]="row.type" 
//                     [editable]="true" 
//                     placeholder="Select type"
//                     styleClass="w-full p-inputtext-sm">
//                   </p-select>
//                 </td>
//                 <td>
//                   <input pInputText [(ngModel)]="row.name" placeholder="Enter name" class="w-full p-inputtext-sm">
//                 </td>
//                 <td>
//                   <input pInputText [(ngModel)]="row.code" placeholder="Optional" class="w-full p-inputtext-sm">
//                 </td>
//                 <td>
//                   <input pInputText [(ngModel)]="row.description" placeholder="Optional" class="w-full p-inputtext-sm">
//                 </td>
//                 <td>
//                   <p-select 
//                     [options]="statusOptions" 
//                     optionLabel="label" 
//                     optionValue="value" 
//                     [(ngModel)]="row.isActive" 
//                     placeholder="Status"
//                     styleClass="w-full p-inputtext-sm">
//                   </p-select>
//                 </td>
//                 <td>
//                   <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
//                     (click)="removeBulkRow(index)">
//                   </button>
//                 </td>
//               </tr>
//             </ng-template>
//           </p-table>
//         </div>
//       </div>

//       <ng-template pTemplate="footer">
//         <div class="flex justify-between w-full pt-2">
//           <app-button label="Add Empty Row" icon="pi pi-plus" variant="secondary" (clicked)="addBulkRow()"></app-button>
//           <div class="flex gap-2">
//             <app-button label="Cancel" icon="pi pi-times" variant="secondary" (clicked)="isBulkDialogVisible = false"></app-button>
//             <app-button label="Create All" icon="pi pi-check" variant="primary" [loading]="isBulkSaving" (clicked)="saveBulkImport()"></app-button>
//           </div>
//         </div>
//       </ng-template>
//     </p-dialog>

//     <p-toast></p-toast>
//     <p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>
//   `
// })
// export class MasterList implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();

//   // --- Services ---
//   private masterService = inject(MasterService);
//   private appMessage = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);

//   // --- ViewChilds ---
//   @ViewChild('mainGrid') mainGrid!: AppSharedGrid<Master>;

//   // --- Signals ---
//   masters = signal<Master[]>([]);
//   bulkData = signal<Master[]>([]);
//   selectedRows = signal<Master[]>([]);
//   loading = signal(false);
//   isBulkEditing = signal(false);

//   // --- Bulk Dialog State ---
//   isBulkDialogVisible = false;
//   isBulkSaving = false;

//   gridApi: any;

//   // --- Master Types Definition ---
//   readonly masterTypes = [
//     { label: 'Department', value: 'department' },
//     { label: 'Category', value: 'category' },
//     { label: 'Sub Category', value: 'sub_category' },
//     { label: 'Brand', value: 'brand' },
//     { label: 'Unit', value: 'unit' },
//     { label: 'Tax Rate', value: 'tax_rate' },
//     { label: 'Warranty Plan', value: 'warranty_plan' },
//     { label: 'Product Condition', value: 'product_condition' },
//     { label: 'Supplier Category', value: 'supplier_category' }
//   ];

//   readonly statusOptions = [
//     { label: 'Active', value: true },
//     { label: 'Inactive', value: false }
//   ];

//   // --- Grid Column Definition ---
//   columns: GridColDef<Master>[] = [
//     {
//       field: 'type',
//       headerName: 'Type',
//       width: 150,
//       pinned: 'left',
//       cellConfig: {
//         type: 'select',
//         options: this.masterTypes,
//         optionLabel: 'label',
//         optionValue: 'value',
//         selectAsBadge: true,
//         placeholder: 'Select Type'
//       }
//     },
//     {
//       field: 'name',
//       headerName: 'Master Name',
//       flex: 1,
//       minWidth: 200,
//       pinned: 'left',
//       cellConfig: {
//         type: 'text',
//         placeholder: 'Enter name...',
//         truncateAt: 40
//       }
//     },
//     {
//       field: 'imageUrl',
//       headerName: 'Media',
//       width: 120,
//       cellConfig: {
//         type: 'avatar',
//         labelField: 'name'
//       }
//     },
//     {
//       field: 'code',
//       headerName: 'Code',
//       width: 120,
//       cellConfig: {
//         type: 'text',
//         placeholder: 'CODE-001'
//       }
//     },
//     {
//       field: 'isActive',
//       headerName: 'Status',
//       width: 120,
//       cellConfig: {
//         type: 'boolean'
//       }
//     },
//     {
//       field: 'metadata.isFeatured',
//       headerName: 'Featured',
//       width: 110,
//       valueGetter: (p) => p.data?.metadata?.isFeatured,
//       cellConfig: {
//         type: 'boolean'
//       }
//     },
//     {
//       field: 'description',
//       headerName: 'Description',
//       width: 250,
//       cellConfig: {
//         type: 'textarea',
//         rows: 2,
//         placeholder: 'Internal notes...'
//       }
//     },
//   ];

//   ngOnInit() {
//     this.loadMasters();
//   }

//   // --- Load Data ---
//   loadMasters() {
//     this.loading.set(true);
//     this.masterService.getMasters().pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => {
//         const data = res.data?.masters || res.data || [];
//         this.masters.set(data);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err);
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- GRID EVENT HANDLER ---
//   onGridEvent(event: SharedGridEvent<Master>) {
//     switch (event.type) {
//       case 'init':
//         this.gridApi = event.api;
//         break;
//       case 'selectionChanged':
//         if (event.rows) this.selectedRows.set(event.rows);
//         break;
//       case 'save':
//         if (event.data) this.handleSingleSave(event.data);
//         break;
//       case 'delete':
//         if (event.row) this.handleSingleDelete(event.row);
//         break;
//       case 'bulkSave':
//         if (event.rows) this.handleBulkUpdate(event.rows);
//         break;
//       case 'bulkDelete':
//         if (event.rows) this.handleBulkDelete(event.rows);
//         break;
//     }
//   }

//   // --- SINGLE ROW ACTIONS ---
//   onAddNew() {
//     this.mainGrid.addNewRow();
//   }

//   handleSingleSave(row: Master) {
//     if (!row.name || !row.type) {
//       this.appMessage.showWarn('Name and Type are required');
//       return;
//     }

//     const payload = this.preparePayload(row);

//     if (row._id.startsWith('new_') || row._tempId) {
//       this.masterService.createMaster(payload).pipe(takeUntil(this.destroy$)).subscribe({
//         next: () => {
//           this.appMessage.showSuccess('Master created successfully');
//           this.loadMasters();
//         },
//         error: (err) => this.appMessage.handleHttpError(err)
//       });
//     } else {
//       this.masterService.updateMaster(row._id, payload).pipe(takeUntil(this.destroy$)).subscribe({
//         next: () => this.appMessage.showSuccess('Master updated successfully'),
//         error: (err) => this.appMessage.handleHttpError(err)
//       });
//     }
//   }

//   handleSingleDelete(row: Master) {
//     if (row._id.startsWith('new_')) return;

//     this.masterService.deleteMaster(row._id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => this.appMessage.showSuccess(`${row.name} removed successfully`),
//       error: (err) => {
//         this.appMessage.handleHttpError(err);
//         this.loadMasters();
//       }
//     });
//   }

//   // --- BULK ACTIONS ---
//   toggleBulkEdit() {
//     this.isBulkEditing.set(true);
//     this.mainGrid.enableBulkEdit();
//   }

//   cancelBulkEdit() {
//     this.isBulkEditing.set(false);
//     this.mainGrid.cancelBulkEdit();
//   }

//   saveBulkEdit() {
//     this.mainGrid.saveBulkEdit();
//   }

//   handleBulkUpdate(rows: Master[]) {
//     const items = rows.map(r => ({
//       _id: r._id,
//       ...this.preparePayload(r)
//     }));

//     this.loading.set(true);
//     this.masterService.bulkUpdateMasters(items).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => {
//         this.appMessage.showSuccess(res.message || 'Bulk Update Completed');
//         this.loadMasters();
//         this.isBulkEditing.set(false);
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err);
//         this.loadMasters();
//       }
//     });
//   }

//   // --- BULK DELETE ---
//   confirmBulkDelete() {
//     const selected = this.selectedRows();
//     if (selected.length === 0) return;

//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete <b>${selected.length}</b> items?`,
//       header: 'Confirm Bulk Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       accept: () => this.mainGrid.deleteSelected()
//     });
//   }

//   handleBulkDelete(rows: Master[]) {
//     const ids = rows.map(m => m._id).filter(id => !id.startsWith('new_'));

//     if (ids.length === 0) return;

//     this.loading.set(true);
//     this.masterService.bulkDeleteMasters(ids).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => {
//         this.appMessage.showSuccess(res.message || 'Items deleted');
//         this.selectedRows.set([]);
//         this.loading.set(false);
//         this.loadMasters();
//       },
//       error: (err) => {
//         this.appMessage.handleHttpError(err);
//         this.loadMasters();
//       }
//     });
//   }

//   // --- BULK IMPORT (WORKS NOW!) ---
//   openBulkDialog() {
//     const initialRows = Array.from({ length: 5 }, () => this.createEmptyMaster());
//     this.bulkData.set(initialRows);
//     this.isBulkDialogVisible = true;
//   }

//   addBulkRow() {
//     this.bulkData.update(d => [...d, this.createEmptyMaster()]);
//   }

//   removeBulkRow(index: number) {
//     this.bulkData.update(d => {
//       const newData = [...d];
//       newData.splice(index, 1);
//       return newData;
//     });
//   }

//   saveBulkImport() {
//     const validItems: any[] = [];

//     this.bulkData().forEach(data => {
//       const name = data.name?.trim();
//       const type = data.type;

//       if (name && type) {
//         const payload = this.preparePayload(data);
//         if (!payload.slug) {
//           payload['slug'] = this.generateSlug(payload.name);
//         }
//         validItems.push(payload);
//       }
//     });

//     if (validItems.length === 0) {
//       this.appMessage.showWarn('Please enter valid details (Name & Type) for at least one item.');
//       return;
//     }

//     this.isBulkSaving = true;

//     this.masterService.createBulkMasters(validItems).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => {
//         if (res.status === 'partial_success') {
//           this.appMessage.showWarn('Partial Import. Check duplicates.');
//         } else {
//           this.appMessage.showSuccess(`${validItems.length} items imported successfully`);
//         }
//         this.isBulkDialogVisible = false;
//         this.loadMasters();
//       },
//       error: (err) => this.appMessage.handleHttpError(err),
//       complete: () => this.isBulkSaving = false
//     });
//   }

//   // --- HELPERS ---
//   onQuickFilter(event: any) {
//     if (this.gridApi) {
//       this.gridApi.setGridOption('quickFilterText', event.target.value);
//     }
//   }

//   private createEmptyMaster(): Master {
//     return {
//       _id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       type: 'category',
//       name: '',
//       code: '',
//       description: '',
//       imageUrl: '',
//       isActive: true,
//       metadata: { isFeatured: false, sortOrder: 0 },
//     };
//   }

//   private preparePayload(row: any): any {
//     const typeValue = (row.type && typeof row.type === 'object') ? row.type.value : row.type;
//     const isFeatured = row['metadata.isFeatured'] ?? row.metadata?.isFeatured ?? false;
//     const sortOrder = row.metadata?.sortOrder ?? 0;

//     return {
//       type: typeValue || row.type,
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

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
