// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-shift-manager.component',
//   imports: [],
//   templateUrl: './shift-manager.component.html',
//   styleUrl: './shift-manager.component.scss',
// })
// export class ShiftManagerComponent {

// }
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';


// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';
import { AgShareGrid } from '../../shared/components/ag-shared-grid';
import { ShiftService } from '../services/shift.service';
import { Select } from 'primeng/select';


@Component({
  selector: 'app-shift-manager',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, Select,
    ButtonModule, InputTextModule, DialogModule, ToastModule,
    ConfirmDialogModule, ToggleSwitchModule, InputNumberModule, MultiSelectModule,
    AgShareGrid
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './shift-manager.component.html',
  styleUrls: ['./shift-manager.component.scss'] // Re-use list SCSS
})
export class ShiftManagerComponent implements OnInit {

  private shiftService = inject(ShiftService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  rawData: any[] = [];
  filteredData: any[] = [];
  filter = {
    search: '',
    type: 'all' // 'all', 'day', 'night'
  };
  typeOptions = [
    { label: 'All Shifts', value: 'all' },
    { label: 'Day Shifts', value: 'day' },
    { label: 'Night Shifts', value: 'night' }
  ];
  data: any[] = [];
  column: any[] = [];
  showDialog = false;
  isEditMode = false;
  shiftForm!: FormGroup;
  currentId: string | null = null;

  // Week Days Data
  weekDays = [
    { name: 'Sunday', value: 0 },
    { name: 'Monday', value: 1 },
    { name: 'Tuesday', value: 2 },
    { name: 'Wednesday', value: 3 },
    { name: 'Thursday', value: 4 },
    { name: 'Friday', value: 5 },
    { name: 'Saturday', value: 6 }
  ];

  ngOnInit() {
    this.initForm();
    this.initColumns();
    this.fetchData();
  }

  private initForm() {
    this.shiftForm = this.fb.group({
      name: ['', Validators.required],
      startTime: ['09:00', Validators.required], // HH:mm string
      endTime: ['18:00', Validators.required],
      gracePeriodMins: [15],
      halfDayThresholdHrs: [4],
      minFullDayHrs: [8],
      weeklyOffs: [[0]], // Default Sunday
      isNightShift: [false]
    });
  }

  private initColumns() {
    this.column = [
      { headerName: 'Actions', field: '_id', width: 100, cellRenderer: ActionViewRenderer },
      { field: 'name', headerName: 'Shift Name', flex: 1 },
      { field: 'startTime', headerName: 'Start', width: 100 },
      { field: 'endTime', headerName: 'End', width: 100 },
      { field: 'gracePeriodMins', headerName: 'Grace (Min)', width: 120 },
      {
        field: 'weeklyOffs', headerName: 'Week Offs', flex: 1,
        valueFormatter: (p: any) => p.value.map((d: number) => this.weekDays.find(w => w.value === d)?.name).join(', ')
      }
    ];
  }

  fetchData() {
    this.shiftService.getAllShifts().subscribe({
      next: (res: any) => {
        this.rawData = res.data || res.results || [];
        this.applyLocalFilters();
      },
      error: () => this.messageService.add({ severity: 'error', detail: 'Load failed' })
    });
  }

  // ⚡ Client-Side Filter
  applyLocalFilters() {
    let result = [...this.rawData];

    // Search
    if (this.filter.search) {
      const term = this.filter.search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(term));
    }

    // Type
    if (this.filter.type !== 'all') {
      const isNight = this.filter.type === 'night';
      result = result.filter(s => !!s.isNightShift === isNight);
    }

    this.filteredData = result;
  }

  resetFilters() {
    this.filter = { search: '', type: 'all' };
    this.applyLocalFilters();
  }

  // fetchData() {
  //   this.shiftService.getAllShifts().subscribe({
  //     next: (res: any) => this.data = res.data || res.results || [],
  //     error: () => this.messageService.add({ severity: 'error', detail: 'Load failed' })
  //   });
  // }

  openCreate() {
    this.isEditMode = false;
    this.shiftForm.reset({
      startTime: '09:00', endTime: '18:00',
      gracePeriodMins: 15, halfDayThresholdHrs: 4, minFullDayHrs: 8,
      weeklyOffs: [0], isNightShift: false
    });
    this.showDialog = true;
  }

  openEdit(row: any) {
    this.isEditMode = true;
    this.currentId = row._id;
    this.shiftForm.patchValue(row);
    this.showDialog = true;
  }

  deleteShift(id: string) {
    this.confirmationService.confirm({
      message: 'Delete this shift? Users assigned to it will be affected.',
      header: 'Critical Action',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.shiftService.deleteShift(id).subscribe({
          next: () => { this.fetchData(); this.messageService.add({ severity: 'success', detail: 'Deleted' }); }
        });
      }
    });
  }

  onSubmit() {
    if (this.shiftForm.invalid) return;
    const request$ = this.isEditMode
      ? this.shiftService.updateShift(this.currentId!, this.shiftForm.value)
      : this.shiftService.createShift(this.shiftForm.value);

    request$.subscribe({
      next: () => {
        this.showDialog = false;
        this.fetchData();
        this.messageService.add({ severity: 'success', detail: 'Shift Saved' });
      }
    });
  }

  handleGridEvent(event: any) {
    if (event.type === 'cellClicked' && event.colDef.headerName === 'Actions') {
      this.openEdit(event.data);
    }
  }
}