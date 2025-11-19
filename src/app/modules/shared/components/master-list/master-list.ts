import { MasterListService } from './../../../../core/services/master-list.service';
import { Component, OnInit, inject, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormArray, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { Select, SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Tag } from "primeng/tag";
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

import { ConfirmationService, MessageService } from 'primeng/api';
import { MasterService } from '../../../../core/services/master.service';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-master-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    Textarea,
    Select,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    Tag,
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
  private MasterListService = inject(MasterListService);

  // --- State ---
  masters = signal<any[]>([]);
  loading = signal(false);

  // Dialogs
  singleDialogVisible = signal(false);
  bulkDialogVisible = signal(false);
  isEdit = signal(false);
  selectedId: string | null = null;

  // Forms
  singleForm!: FormGroup;
  bulkForm!: FormGroup;

  // Master Data (Values are lowercase to match Model requirements)
  masterTypes = [
    { label: 'Category', value: 'category' },
    { label: 'Brand', value: 'brand' },
    { label: 'Unit', value: 'unit' },
    { label: 'Department', value: 'department' }
  ];

  private subs = new Subscription();

  ngOnInit() {
    this.buildForms();
    this.loadMasters();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // --- Helper for Tag Colors ---
  getSeverity(type: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    if (!type) return 'secondary';
    switch (type.toLowerCase()) {
      case 'category': return 'info';
      case 'brand': return 'success';
      case 'unit': return 'warn';
      case 'department': return 'help' as any;
      default: return 'secondary';
    }
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

  // --- Data Loading ---
  loadMasters() {
    this.loading.set(true);
    this.subs.add(this.masterService.getMasters().subscribe({
      next: (res) => {
        this.masters.set(res.data.masters || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load master data' });
        this.loading.set(false);
      },
    }));
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
    // Transform for Model (Uppercase Code)
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
        this.MasterListService.load()
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed.' });
      }
    }));
  }

  // saveBulk() {
  //   if (this.bulkForm.invalid || this.bulkData.length === 0) {
  //     this.bulkForm.markAllAsTouched();
  //     this.messageService.add({ 
  //       severity: 'warn', 
  //       summary: 'Warning', 
  //       detail: 'Select a Type and ensure all Name fields are filled.' 
  //     });
  //     return;
  //   }

  //   const { type, bulkData } = this.bulkForm.value;

  //   // Transform for Controller & Model
  //   const items = bulkData.map((item: any) => ({
  //       type: type, // Apply selected type to all
  //       name: item.name,
  //       code: item.code ? item.code.toUpperCase() : null, // Ensure Uppercase for Model
  //       description: item.description
  //   }));

  //   this.loadingService.show();

  //   // Calls the JSON Bulk Method
  //   this.subs.add(this.masterService.createBulkMasters(items).subscribe({
  //     next: (res) => {
  //       const count = res.insertedCount || items.length;  

  //       if (res.status === 'partial_success') {
  //            this.messageService.add({ 
  //               severity: 'warn', 
  //               summary: 'Partial Success', 
  //               detail: `Added ${count} masters. ${res.failedCount} failed (duplicates).` 
  //           });
  //       } else {
  //           this.messageService.add({ 
  //               severity: 'success', 
  //               summary: 'Success', 
  //               detail: `${count} masters added successfully.` 
  //           });
  //       }

  //       this.bulkDialogVisible.set(false);
  //       this.loadMasters();
  //     },
  //     error: (err) => {
  //       this.messageService.add({ 
  //           severity: 'error', 
  //           summary: 'Error', 
  //           detail: err.error?.message || 'Bulk creation failed.' 
  //       });
  //     },
  //     complete: () => this.loadingService.hide()
  //   }));
  // }
  saveBulk() {
    // 1. SMART CLEANUP: Remove empty rows automatically before validating
    // This fixes the issue where an extra empty row blocks the save
    const rawData = this.bulkForm.getRawValue();
    let rows = rawData.bulkData;

    // Filter out rows where 'name' is empty
    const validRows = rows.filter((row: any) => row.name);

    // 2. CHECK TYPE SELECTION
    const selectedType = this.bulkForm.get('type')?.value;

    // 3. FINAL VALIDATION
    if (!selectedType) {
      this.bulkForm.get('type')?.markAsTouched(); // Highlight the dropdown red
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Type',
        detail: 'Please select a Master Type at the top.'
      });
      return;
    }

    if (validRows.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'Please enter at least one valid Name.'
      });
      return;
    }

    // 4. PREPARE PAYLOAD (Using the valid rows only)
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
          this.messageService.add({
            severity: 'warn',
            summary: 'Partial Success',
            detail: `Added ${count} masters. ${res.failedCount} failed (duplicates).`
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${count} masters added successfully.`
          });
          this.MasterListService.load()

        }

        this.bulkDialogVisible.set(false);
        this.loadMasters();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Bulk creation failed.'
        });
      },
      complete: () => this.loadingService.hide()
    }));
  }

  // --- Deletion Handler ---
  deleteMaster(master: any) {
    this.confirmService.confirm({
      message: `Are you sure you want to delete ${master.name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.loadingService.show();
        this.subs.add(this.masterService.deleteMaster(master._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted' });
            this.loadMasters();
            this.MasterListService.load()

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
