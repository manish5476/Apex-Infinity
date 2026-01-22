import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

// Services
import { MasterService } from '../../../../core/services/master.service';
import { LoadingService } from '../../../../core/services/loading.service';

// Grid Components & Types
// Assuming GridColDef is exported from your shared types
import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";
import { GridColDef } from "../../AgGrid/grid/grid.types"; 

// Define Interface for Master Data
export interface Master {
  _id: string;
  type: string;
  name: string;
  code: string;
  description: string;
  isNew?: boolean; // Helper flag for new rows
}

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    AppSharedGrid
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="master-page-container">
      <div class="themed-card master-card">
        
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
             <div class="stats mr-4 align-content-center">
              <span class="text-sm text-gray-500">Total: {{ masters().length }}</span>
            </div>
            <p-button label="Refresh" icon="pi pi-refresh" styleClass="p-button-text" 
                      (click)="loadMasters()" [loading]="loading()"></p-button>
            <p-button label="Add New" icon="pi pi-plus" (click)="onAddNew()"></p-button>
          </div>
        </p-toolbar>

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

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styleUrls: ['./master-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MasterList implements OnInit {
  // --- Services ---
  private masterService = inject(MasterService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);

  // --- Signals ---
  masters = signal<Master[]>([]);
  loading = signal(false);
  
  // --- Grid Configuration ---
  gridApi: any;

  // Define Columns using the "cellConfig" pattern from your example
  columns: GridColDef<Master>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      cellConfig: {
        type: 'select',
        placeholder: 'Select Type',
        // Mapping your masterTypes to the format the grid expects
        options: [
          { label: 'Category', value: 'category' },
          { label: 'Brand', value: 'brand' },
          { label: 'Unit', value: 'unit' },
          { label: 'Department', value: 'department' }
        ],
        optionLabel: 'label' // Optional, depends on your grid implementation
      }
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      cellConfig: { 
        type: 'text', 
        placeholder: 'Enter Name' 
      }
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
      cellConfig: { 
        type: 'text', 
        placeholder: 'CODE' // You can handle uppercase in the grid or onSave
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      cellConfig: { 
        type: 'text', 
        placeholder: 'Optional description' 
      }
    }
  ];

  constructor() {
    // Optional: Log changes for debugging
    effect(() => {
      // console.log('Masters list updated:', this.masters());
    });
  }

  ngOnInit() {
    this.loadMasters();
  }

  // --- Load Data ---
  loadMasters() {
    this.loading.set(true);
    this.masterService.getMasters().subscribe({
      next: (res) => {
        this.masters.set(res.data.masters || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
        this.loading.set(false);
      }
    });
  }

  // --- Grid Event Handler (The Core Logic) ---
  onGridEvent(event: any) {
    console.log(event);
    switch (event.type) {
      case 'init':
        this.gridApi = event.api;
        break;
      case 'cellEdited':
        console.log(`Field ${event.field} changed to ${event.value}`);
        break;
      case 'save':
        this.handleSave(event.row);
        break;
      case 'Entersave':
        this.handleSave(event.row);
        break;
      case 'delete':
        this.handleDelete(event.row);
        break;
      case 'editStart':
        console.log('Editing started for:', event.row._id);
        break;
    }
  }

  // --- Action Handlers ---

  onAddNew() {
    // Create a temporary new row
    const newMaster: Master = {
      _id: `new_${Date.now()}`, // Temporary ID
      type: 'category', // Default value
      name: '',
      code: '',
      description: '',
      isNew: true
    };

    // Update signal to add row to top
    this.masters.update(current => [newMaster, ...current]);
    
    this.messageService.add({severity:'info', summary:'New Row', detail:'Please fill details and click Save'});
  }

  handleSave(row: Master) {
    if (!row.name || !row.type) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and Type are required' });
      return;
    }

    // Prepare payload
    const payload = {
      type: row.type,
      name: row.name,
      code: row.code ? row.code.toUpperCase() : null,
      description: row.description
    };

    this.loadingService.show();

    if (row.isNew || row._id.startsWith('new_')) {
      // --- CREATE ---
      this.masterService.createMaster(payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Master created successfully' });
          this.loadMasters(); // Reload to get real ID
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Create failed' });
        },
        complete: () => this.loadingService.hide()
      });
    } else {
      // --- UPDATE ---
      this.masterService.updateMaster(row._id, payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Master updated successfully' });
          // Optional: Update local signal if you don't want to reload the whole list
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed' });
        },
        complete: () => this.loadingService.hide()
      });
    }
  }

  handleDelete(row: Master) {
    // If it's a local new row that hasn't been saved yet
    if (row.isNew || row._id.startsWith('new_')) {
      this.masters.update(current => current.filter(m => m._id !== row._id));
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b>${row.name}</b>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.loadingService.show();
        this.masterService.deleteMaster(row._id).subscribe({
          next: () => {
            this.masters.update(users => users.filter(u => u._id !== row._id));
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${row.name} removed` });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
          },
          complete: () => this.loadingService.hide()
        });
      }
    });
  }

  onQuickFilter(event: any) {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', event.target.value);
    }
  }
}

// import { Component, OnInit, inject, signal, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
// import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormArray, FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { finalize } from 'rxjs/operators';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';

// // PrimeNG Modules
// import { DialogModule } from 'primeng/dialog';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToolbarModule } from 'primeng/toolbar';
// import { SelectModule } from 'primeng/select';
// import { TextareaModule } from 'primeng/textarea';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { TooltipModule } from 'primeng/tooltip';

// // Core Services
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { MasterService } from '../../../../core/services/master.service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from './../../../../core/services/master-list.service';
// import { AgShareGrid } from '../ag-shared-grid';
// import { AppSharedGrid } from "../../AgGrid/grid/app-shared-grid/app-shared-grid";

// // --- SHARED GRID ---

// @Component({
//   selector: 'app-master-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     FormsModule,
//     DialogModule,
//     ButtonModule,
//     InputTextModule,
//     TextareaModule,
//     SelectModule,
//     ToastModule,
//     ConfirmDialogModule,
//     ToolbarModule,
//     IconFieldModule,
//     InputIconModule,
//     TooltipModule,
//     AgShareGrid,
//     AppSharedGrid
// ],
//   providers: [ConfirmationService, MessageService],
//   templateUrl: './master-list.html',
//   styleUrls: ['./master-list.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class MasterList implements OnInit, OnDestroy {
//   // --- Injected Services ---
//   private masterService = inject(MasterService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private confirmService = inject(ConfirmationService);
//   private loadingService = inject(LoadingService);
//   private masterListService = inject(MasterListService);
//   private cdr = inject(ChangeDetectorRef);

//   // --- State ---
//   loading = signal(false);

//   // --- Grid State ---
//   private gridApi!: GridApi;
//   data: any[] = []; // Data for AgGrid
//   column: any[] = []; // Column Defs
//   rowSelectionMode: 'single' | 'multiple' = 'single';

//   // Dialogs
//   singleDialogVisible = signal(false);
//   bulkDialogVisible = signal(false);
//   isEdit = signal(false);
//   selectedId: string | null = null;

//   // Forms
//   singleForm!: FormGroup;
//   bulkForm!: FormGroup;

//   // Master Data
//   masterTypes = [
//     { label: 'Category', value: 'category' },
//     { label: 'Brand', value: 'brand' },
//     { label: 'Unit', value: 'unit' },
//     { label: 'Department', value: 'department' }
//   ];

//   private subs = new Subscription();

//   ngOnInit() {
//     this.buildForms();
//     this.getColumn(); // Initialize Columns
//     this.loadMasters();
//   }

//   ngOnDestroy(): void {
//     this.subs.unsubscribe();
//   }

//   // --- Grid Logic ---

// getColumn(): void {
//   this.column = [
//     {
//       field: 'type',
//       headerName: 'Type',
//       sortable: true,
//       filter: true,
//       width: 130,
//       cellClass: 'd-flex-center', // Vertical centering helper
//       cellRenderer: (params: any) => {
//         if (!params.value) return '';
//         const val = params.value.toLowerCase();
//         // Dynamic class based on value: badge-category, badge-brand, etc.
//         return `
//           <div class="badge-container">
//             <span class="pill-badge badge-${val}">${params.value}</span>
//           </div>`;
//       }
//     },
//     { 
//       field: 'name', 
//       headerName: 'Name', 
//       sortable: true, 
//       filter: true, 
//       flex: 1, 
//       minWidth: 200, 
//       cellStyle: { 
//         'font-family': 'var(--font-heading)', 
//         'font-weight': 'var(--font-weight-semibold)',
//         'color': 'var(--text-primary)' 
//       } 
//     },
//     { 
//       field: 'code', 
//       headerName: 'Code', 
//       sortable: true, 
//       filter: true, 
//       width: 140,
//       cellStyle: { 
//         'font-family': 'var(--font-mono)', 
//         'font-size': 'var(--font-size-xs)',
//         'color': 'var(--text-tertiary)'
//       }
//     },
//     { 
//       field: 'description', 
//       headerName: 'Description', 
//       sortable: true, 
//       filter: true, 
//       flex: 1, 
//       minWidth: 250,
//       cellStyle: { 'color': 'var(--text-secondary)', 'font-size': 'var(--font-size-sm)' }
//     },
//   ];
//   this.cdr.detectChanges();
// }
//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   onQuickFilter(event: any) {
//     if (this.gridApi) {
//       this.gridApi.setGridOption('quickFilterText', event.target.value);
//     }
//   }

//   // Handle Edit/Delete events from Shared Grid
//   eventFromGrid(event: any) {
//     const action = event.type;
//     const data = event.data;
//     if (action === 'edit') {
//       this.openEdit(data);
//     } else if (action === 'Delete') {
//       this.deleteMaster(data);
//     }
//   }

//   loadMasters() {
//     this.subs.add(this.masterService.getMasters().subscribe({
//       next: (res) => {
//         this.data = res.data.masters || [];
//         this.loading.set(false);
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load master data' });
//         this.loading.set(false);
//       },
//     }));
//   }

//   // --- Form Initialization ---
//   buildForms() {
//     this.singleForm = this.fb.group({
//       type: ['', Validators.required],
//       name: ['', Validators.required],
//       code: [''],
//       description: [''],
//     });

//     this.bulkForm = this.fb.group({
//       type: [null, Validators.required],
//       bulkData: this.fb.array([this.createBulkDataItem()])
//     });
//   }

//   // --- Bulk Data Logic ---
//   get bulkData(): FormArray {
//     return this.bulkForm.get('bulkData') as FormArray;
//   }

//   createBulkDataItem(): FormGroup {
//     return this.fb.group({
//       name: ['', Validators.required],
//       code: [''],
//       description: ['']
//     });
//   }

//   addBulkDataItem() {
//     this.bulkData.push(this.createBulkDataItem());
//   }

//   removeBulkDataItem(index: number) {
//     this.bulkData.removeAt(index);
//   }

//   // --- Dialog Management ---
//   openCreate() {
//     this.isEdit.set(false);
//     this.selectedId = null;
//     this.singleForm.reset();
//     this.singleDialogVisible.set(true);
//   }

//   openBulkCreate() {
//     this.bulkForm.reset({ type: null });
//     this.bulkData.clear();
//     this.addBulkDataItem();
//     this.bulkDialogVisible.set(true);
//   }

//   openEdit(master: any) {
//     this.selectedId = master._id;
//     this.isEdit.set(true);

//     this.singleForm.patchValue({
//       type: master.type,
//       name: master.name,
//       code: master.code,
//       description: master.description,
//     });
//     this.singleDialogVisible.set(true);
//   }

//   // --- Submission Handlers ---
//   saveSingle() {
//     if (this.singleForm.invalid) {
//       this.singleForm.markAllAsTouched();
//       this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in required fields.' });
//       return;
//     }
//     const rawValue = this.singleForm.value;
//     const payload = {
//       ...rawValue,
//       code: rawValue.code ? rawValue.code.toUpperCase() : null
//     };
//     const saveObservable = this.isEdit() && this.selectedId
//       ? this.masterService.updateMaster(this.selectedId, payload)
//       : this.masterService.createMaster(payload);
    
//     this.loadingService.show();
//     this.subs.add(saveObservable.pipe(
//       finalize(() => this.loadingService.hide())
//     ).subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: this.isEdit() ? 'Updated' : 'Created', detail: 'Master data saved successfully.' });
//         this.singleDialogVisible.set(false);
//         this.loadMasters();
//         this.masterListService.load();
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed.' });
//       }
//     }));
//   }

//   saveBulk() {
//     const rawData = this.bulkForm.getRawValue();
//     let rows = rawData.bulkData;
//     const validRows = rows.filter((row: any) => row.name);
//     const selectedType = this.bulkForm.get('type')?.value;

//     if (!selectedType) {
//       this.bulkForm.get('type')?.markAsTouched();
//       this.messageService.add({ severity: 'warn', summary: 'Missing Type', detail: 'Please select a Master Type at the top.' });
//       return;
//     }

//     if (validRows.length === 0) {
//       this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'Please enter at least one valid Name.' });
//       return;
//     }

//     const items = validRows.map((item: any) => ({
//       type: selectedType,
//       name: item.name,
//       code: item.code ? item.code.toUpperCase() : null,
//       description: item.description
//     }));

//     this.loadingService.show();

//     this.subs.add(this.masterService.createBulkMasters(items).subscribe({
//       next: (res) => {
//         const count = res.insertedCount || items.length;
//         if (res.status === 'partial_success') {
//           this.messageService.add({ severity: 'warn', summary: 'Partial Success', detail: `Added ${count} masters. ${res.failedCount} failed (duplicates).` });
//         } else {
//           this.messageService.add({ severity: 'success', summary: 'Success', detail: `${count} masters added successfully.` });
//           this.masterListService.load();
//         }
//         this.bulkDialogVisible.set(false);
//         this.loadMasters();
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Bulk creation failed.' });
//       },
//       complete: () => this.loadingService.hide()
//     }));
//   }

//   deleteMaster(master: any) {
//     this.confirmService.confirm({
//       message: `Are you sure you want to delete <b>${master.name}</b>?`,
//       header: 'Delete Confirmation',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-text p-button-secondary',
//       accept: () => {
//         this.loadingService.show();
//         this.subs.add(this.masterService.deleteMaster(master._id).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted' });
//             this.loadMasters();
//             this.masterListService.load();
//           },
//           error: (err) => {
//             this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Deletion failed.' });
//           },
//           complete: () => this.loadingService.hide()
//         }));
//       },
//     });
//   }
// }
