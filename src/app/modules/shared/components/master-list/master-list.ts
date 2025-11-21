import { Component, OnInit, inject, signal, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormArray, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

// Core Services
import { ConfirmationService, MessageService } from 'primeng/api';
import { MasterService } from '../../../../core/services/master.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from './../../../../core/services/master-list.service';

// --- SHARED GRID ---
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedGridComponent, // Import Shared Grid
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './master-list.html',
  styleUrls: ['./master-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterList implements OnInit, OnDestroy {
  // --- Injected Services ---
  private masterService = inject(MasterService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private loadingService = inject(LoadingService);
  private masterListService = inject(MasterListService);
  private cdr = inject(ChangeDetectorRef);

  // --- State ---
  loading = signal(false);

  // --- Grid State ---
  private gridApi!: GridApi;
  data: any[] = []; // Data for AgGrid
  column: any[] = []; // Column Defs
  rowSelectionMode: 'single' | 'multiple' = 'single';

  // Dialogs
  singleDialogVisible = signal(false);
  bulkDialogVisible = signal(false);
  isEdit = signal(false);
  selectedId: string | null = null;

  // Forms
  singleForm!: FormGroup;
  bulkForm!: FormGroup;

  // Master Data
  masterTypes = [
    { label: 'Category', value: 'category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Department', value: 'department' }
  ];

  private subs = new Subscription();

  ngOnInit() {
    this.buildForms();
    this.getColumn(); // Initialize Columns
    this.loadMasters();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // --- Grid Logic ---

  getColumn(): void {
    this.column = [
      {
        field: 'type',
        headerName: 'Type',
        sortable: true,
        filter: true,
        width: 150,
        // Simulate Badge Styling via Cell Style
        cellStyle: (params: any) => {
          switch (params.value?.toLowerCase()) {
            case 'category': return { color: '#0ea5e9', fontWeight: '600', textTransform: 'uppercase' }; // Blue
            case 'brand': return { color: '#10b981', fontWeight: '600', textTransform: 'uppercase' }; // Green
            case 'unit': return { color: '#f59e0b', fontWeight: '600', textTransform: 'uppercase' }; // Orange
            default: return { color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }; // Gray
          }
        }
      },
      { field: 'name', headerName: 'Name', sortable: true, filter: true, flex: 1, minWidth: 200, cellStyle: { fontWeight: '500' } },
      { field: 'code', headerName: 'Code', sortable: true, filter: true, width: 150 },
      { field: 'description', headerName: 'Description', sortable: true, filter: true, flex: 1, minWidth: 250 },
    ];
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  onQuickFilter(event: any) {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', event.target.value);
    }
  }

  // Handle Edit/Delete events from Shared Grid
  eventFromGrid(event: any) {
    const action = event.eventType;
    const data = event.data;
    if (action === 'edit') {
      this.openEdit(data);
    } else if (action === 'Delete') {
      this.deleteMaster(data);
    }
  }

  loadMasters() {
    this.loading.set(true);
    this.subs.add(this.masterService.getMasters().subscribe({
      next: (res) => {
        // AgGrid expects a plain array
        this.data = res.data.masters || [];
        this.loading.set(false);
        this.cdr.markForCheck(); // Refresh view
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load master data' });
        this.loading.set(false);
      },
    }));
  }

  // --- Form Initialization ---
  buildForms() {
    this.singleForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      code: [''],
      description: [''],
    });

    this.bulkForm = this.fb.group({
      type: [null, Validators.required],
      bulkData: this.fb.array([this.createBulkDataItem()])
    });
  }

  // --- Bulk Data Logic ---
  get bulkData(): FormArray {
    return this.bulkForm.get('bulkData') as FormArray;
  }

  createBulkDataItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      code: [''],
      description: ['']
    });
  }

  addBulkDataItem() {
    this.bulkData.push(this.createBulkDataItem());
  }

  removeBulkDataItem(index: number) {
    this.bulkData.removeAt(index);
  }

  // --- Dialog Management ---
  openCreate() {
    this.isEdit.set(false);
    this.selectedId = null;
    this.singleForm.reset();
    this.singleDialogVisible.set(true);
  }

  openBulkCreate() {
    this.bulkForm.reset({ type: null });
    this.bulkData.clear();
    this.addBulkDataItem();
    this.bulkDialogVisible.set(true);
  }

  openEdit(master: any) {
    this.isEdit.set(true);
    this.selectedId = master._id;

    this.singleForm.patchValue({
      type: master.type,
      name: master.name,
      code: master.code,
      description: master.description,
    });
    this.singleDialogVisible.set(true);
  }

  // --- Submission Handlers ---
  saveSingle() {
    if (this.singleForm.invalid) {
      this.singleForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in required fields.' });
      return;
    }
    const rawValue = this.singleForm.value;
    const payload = {
      ...rawValue,
      code: rawValue.code ? rawValue.code.toUpperCase() : null
    };
    const saveObservable = this.isEdit() && this.selectedId
      ? this.masterService.updateMaster(this.selectedId, payload)
      : this.masterService.createMaster(payload);
    
    this.loadingService.show();
    this.subs.add(saveObservable.pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: this.isEdit() ? 'Updated' : 'Created', detail: 'Master data saved successfully.' });
        this.singleDialogVisible.set(false);
        this.loadMasters();
        this.masterListService.load();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed.' });
      }
    }));
  }

  saveBulk() {
    const rawData = this.bulkForm.getRawValue();
    let rows = rawData.bulkData;
    const validRows = rows.filter((row: any) => row.name);
    const selectedType = this.bulkForm.get('type')?.value;

    if (!selectedType) {
      this.bulkForm.get('type')?.markAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Missing Type', detail: 'Please select a Master Type at the top.' });
      return;
    }

    if (validRows.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'Please enter at least one valid Name.' });
      return;
    }

    const items = validRows.map((item: any) => ({
      type: selectedType,
      name: item.name,
      code: item.code ? item.code.toUpperCase() : null,
      description: item.description
    }));

    this.loadingService.show();

    this.subs.add(this.masterService.createBulkMasters(items).subscribe({
      next: (res) => {
        const count = res.insertedCount || items.length;
        if (res.status === 'partial_success') {
          this.messageService.add({ severity: 'warn', summary: 'Partial Success', detail: `Added ${count} masters. ${res.failedCount} failed (duplicates).` });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `${count} masters added successfully.` });
          this.masterListService.load();
        }
        this.bulkDialogVisible.set(false);
        this.loadMasters();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Bulk creation failed.' });
      },
      complete: () => this.loadingService.hide()
    }));
  }

  // --- Deletion Handler ---
  deleteMaster(master: any) {
    this.confirmService.confirm({
      message: `Are you sure you want to delete <b>${master.name}</b>?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.loadingService.show();
        this.subs.add(this.masterService.deleteMaster(master._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted' });
            this.loadMasters();
            this.masterListService.load();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Deletion failed.' });
          },
          complete: () => this.loadingService.hide()
        }));
      },
    });
  }
}

// import { MasterListService } from './../../../../core/services/master-list.service';
// import { Component, OnInit, inject, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
// import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormArray, FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { finalize } from 'rxjs/operators';

// // PrimeNG Modules
// import { TableModule } from 'primeng/table';
// import { DialogModule } from 'primeng/dialog';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToolbarModule } from 'primeng/toolbar';
// import { Select, SelectModule } from 'primeng/select';
// import { Textarea } from 'primeng/textarea';
// import { Tag } from "primeng/tag";
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { TooltipModule } from 'primeng/tooltip';

// import { ConfirmationService, MessageService } from 'primeng/api';
// import { MasterService } from '../../../../core/services/master.service';
// import { LoadingService } from '../../../../core/services/loading.service';

// @Component({
//   selector: 'app-master-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     FormsModule,
//     TableModule,
//     DialogModule,
//     ButtonModule,
//     InputTextModule,
//     Textarea,
//     Select,
//     SelectModule,
//     ToastModule,
//     ConfirmDialogModule,
//     ToolbarModule,
//     Tag,
//     IconFieldModule,
//     InputIconModule,
//     TooltipModule
//   ],
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
//   private MasterListService = inject(MasterListService);

//   // --- State ---
//   masters = signal<any[]>([]);
//   loading = signal(false);

//   // Dialogs
//   singleDialogVisible = signal(false);
//   bulkDialogVisible = signal(false);
//   isEdit = signal(false);
//   selectedId: string | null = null;

//   // Forms
//   singleForm!: FormGroup;
//   bulkForm!: FormGroup;

//   // Master Data (Values are lowercase to match Model requirements)
//   masterTypes = [
//     { label: 'Category', value: 'category' },
//     { label: 'Brand', value: 'brand' },
//     { label: 'Unit', value: 'unit' },
//     { label: 'Department', value: 'department' }
//   ];

//   private subs = new Subscription();

//   ngOnInit() {
//     this.buildForms();
//     this.loadMasters();
//   }

//   ngOnDestroy(): void {
//     this.subs.unsubscribe();
//   }

//   // --- Helper for Tag Colors ---
//   getSeverity(type: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
//     if (!type) return 'secondary';
//     switch (type.toLowerCase()) {
//       case 'category': return 'info';
//       case 'brand': return 'success';
//       case 'unit': return 'warn';
//       case 'department': return 'help' as any;
//       default: return 'secondary';
//     }
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

//   // --- Data Loading ---
//   loadMasters() {
//     this.loading.set(true);
//     this.subs.add(this.masterService.getMasters().subscribe({
//       next: (res) => {
//         this.masters.set(res.data.masters || []);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load master data' });
//         this.loading.set(false);
//       },
//     }));
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
//     this.isEdit.set(true);
//     this.selectedId = master._id;

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
//     // Transform for Model (Uppercase Code)
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
//         this.MasterListService.load()
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed.' });
//       }
//     }));
//   }

//   saveBulk() {
//     // 1. SMART CLEANUP: Remove empty rows automatically before validating
//     // This fixes the issue where an extra empty row blocks the save
//     const rawData = this.bulkForm.getRawValue();
//     let rows = rawData.bulkData;

//     // Filter out rows where 'name' is empty
//     const validRows = rows.filter((row: any) => row.name);

//     // 2. CHECK TYPE SELECTION
//     const selectedType = this.bulkForm.get('type')?.value;

//     // 3. FINAL VALIDATION
//     if (!selectedType) {
//       this.bulkForm.get('type')?.markAsTouched(); // Highlight the dropdown red
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Missing Type',
//         detail: 'Please select a Master Type at the top.'
//       });
//       return;
//     }

//     if (validRows.length === 0) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'No Data',
//         detail: 'Please enter at least one valid Name.'
//       });
//       return;
//     }

//     // 4. PREPARE PAYLOAD (Using the valid rows only)
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
//           this.messageService.add({
//             severity: 'warn',
//             summary: 'Partial Success',
//             detail: `Added ${count} masters. ${res.failedCount} failed (duplicates).`
//           });
//         } else {
//           this.messageService.add({
//             severity: 'success',
//             summary: 'Success',
//             detail: `${count} masters added successfully.`
//           });
//           this.MasterListService.load()

//         }

//         this.bulkDialogVisible.set(false);
//         this.loadMasters();
//       },
//       error: (err) => {
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Error',
//           detail: err.error?.message || 'Bulk creation failed.'
//         });
//       },
//       complete: () => this.loadingService.hide()
//     }));
//   }

//   // --- Deletion Handler ---
//   deleteMaster(master: any) {
//     this.confirmService.confirm({
//       message: `Are you sure you want to delete ${master.name}?`,
//       header: 'Delete Confirmation',
//       icon: 'pi pi-info-circle',
//       acceptButtonStyleClass: 'p-button-danger',
//       rejectButtonStyleClass: 'p-button-text p-button-secondary',
//       accept: () => {
//         this.loadingService.show();
//         this.subs.add(this.masterService.deleteMaster(master._id).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted' });
//             this.loadMasters();
//             this.MasterListService.load()

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
