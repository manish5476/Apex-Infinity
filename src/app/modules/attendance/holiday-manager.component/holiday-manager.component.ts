import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePicker } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select'; // ✅ Added for Dropdowns
import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';
import { AgShareGrid } from '../../shared/components/ag-shared-grid';
import { HolidayService } from '../services/holiday.service';


@Component({
  selector: 'app-holiday-manager',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, DialogModule, ToastModule, 
    ConfirmDialogModule, ToggleSwitchModule, DatePicker, SelectModule,
    AgShareGrid
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './holiday-manager.component.html',
  styleUrls: ['./holiday-manager.component.scss'] // Use existing shared styles
})
export class HolidayManagerComponent implements OnInit {
  
  // ... (Injections remain the same)
  private holidayService = inject(HolidayService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  // Data State
  rawData: any[] = []; // Stores original API data
  filteredData: any[] = []; // Stores data shown in grid
  column: any[] = [];
  isLoading = false;

  // Form State
  showDialog = false;
  isEditMode = false;
  holidayForm!: FormGroup;
  currentId: string | null = null;

  // 🔍 FILTERS STATE
  filter = {
    year: new Date().getFullYear(),
    search: '',
    type: 'all' // 'all', 'mandatory', 'optional'
  };

  // Filter Options
  yearOptions: any[] = [];
  typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Mandatory', value: 'mandatory' },
    { label: 'Optional (RH)', value: 'optional' }
  ];

  ngOnInit() {
    this.initForm();
    this.initColumns();
    this.generateYearOptions();
    this.fetchData();
  }

  // --- INIT HELPERS ---
  private generateYearOptions() {
    const current = new Date().getFullYear();
    this.yearOptions = [
      { label: (current - 1).toString(), value: current - 1 },
      { label: current.toString(), value: current },
      { label: (current + 1).toString(), value: current + 1 },
      { label: (current + 2).toString(), value: current + 2 },
    ];
  }

  // ... (initForm and initColumns remain the same) ...
  private initForm() {
    this.holidayForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      date: [null, [Validators.required]],
      description: [''],
      isOptional: [false]
    });
  }

  private initColumns() {
    this.column = [
      { headerName: 'Actions', field: '_id', width: 100, cellRenderer: ActionViewRenderer },
      { field: 'name', headerName: 'Holiday Name', flex: 1, sortable: true },
      { 
        field: 'date', headerName: 'Date', width: 150, sortable: true,
        valueFormatter: (p: any) => this.datePipe.transform(p.value, 'mediumDate') 
      },
      { 
        field: 'isOptional', headerName: 'Type', width: 130,
        cellRenderer: (p: any) => p.value ? 
          `<span style="color: #e67e22; font-weight:600; background:#fff7ed; padding:2px 8px; border-radius:12px;">Optional</span>` : 
          `<span style="color: #16a34a; font-weight:600; background:#f0fdf4; padding:2px 8px; border-radius:12px;">Mandatory</span>`
      },
      { field: 'description', headerName: 'Description', flex: 2 }
    ];
  }

  // --- DATA FETCHING & FILTERING ---
  fetchData() {
    this.isLoading = true;
    // Server Filter: Year
    this.holidayService.getHolidays({ year: this.filter.year }).subscribe({
      next: (res: any) => {
        this.rawData = res.data || res.results || [];
        this.applyLocalFilters(); // Apply client-side filters immediately
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', detail: 'Could not load holidays' });
      }
    });
  }

  // ⚡ Client-Side Filter Logic (Fast)
  applyLocalFilters() {
    let result = [...this.rawData];

    // 1. Search Text (Name)
    if (this.filter.search) {
      const term = this.filter.search.toLowerCase();
      result = result.filter(h => h.name.toLowerCase().includes(term));
    }

    // 2. Type Filter
    if (this.filter.type !== 'all') {
      const isOptional = this.filter.type === 'optional';
      result = result.filter(h => h.isOptional === isOptional);
    }

    this.filteredData = result;
  }

  // Called when Year changes (Server call needed)
  onYearChange() {
    this.fetchData();
  }

  // Called when Text/Type changes (Local filter)
  resetFilters() {
    this.filter = { year: new Date().getFullYear(), search: '', type: 'all' };
    this.fetchData();
  }

  // ... (CRUD Actions: openCreate, openEdit, deleteHoliday, onSubmit remain the same) ...
  openCreate() {
    this.isEditMode = false;
    this.holidayForm.reset({ isOptional: false });
    this.showDialog = true;
  }

  openEdit(rowData: any) {
    this.isEditMode = true;
    this.currentId = rowData._id;
    this.holidayForm.patchValue({
      name: rowData.name,
      date: new Date(rowData.date),
      description: rowData.description,
      isOptional: rowData.isOptional
    });
    this.showDialog = true;
  }

  deleteHoliday(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this holiday?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.holidayService.deleteHoliday(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Holiday removed' });
            this.fetchData();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' })
        });
      }
    });
  }

  onSubmit() {
    if (this.holidayForm.invalid) return;
    const payload = { ...this.holidayForm.value };
    payload.date = this.datePipe.transform(payload.date, 'yyyy-MM-dd');

    const request$ = this.isEditMode 
      ? this.holidayService.updateHoliday(this.currentId!, payload)
      : this.holidayService.createHoliday(payload);

    request$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Holiday Saved' });
        this.showDialog = false;
        this.fetchData();
      },
      error: (err: any) => this.messageService.add({ severity: 'error', detail: err.error?.message })
    });
  }

  handleGridEvent(event: any) {
    if (event.type === 'cellClicked' && event.colDef.headerName === 'Actions') {
      this.openEdit(event.data);
    }
  }
}
