// shift-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
// import { Time } from 'primeng/time';
import { ToolbarModule } from 'primeng/toolbar';

// Services
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-shift-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    // Time,
    ToolbarModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './shift-manager.component.html'
})
export class ShiftManagerComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  // State
  shifts = signal<any[]>([]);
  isLoading = signal(false);
  showDialog = signal(false);
  isEditMode = signal(false);
  currentShiftId = signal<string | null>(null);
  
  // Form
  shiftForm!: FormGroup;
  
  // Days of week
  daysOfWeek = [
    { label: 'Monday', value: 1, checked: true },
    { label: 'Tuesday', value: 2, checked: true },
    { label: 'Wednesday', value: 3, checked: true },
    { label: 'Thursday', value: 4, checked: true },
    { label: 'Friday', value: 5, checked: true },
    { label: 'Saturday', value: 6, checked: false },
    { label: 'Sunday', value: 0, checked: false }
  ];

  // Shift types
  shiftTypes = [
    { label: 'Regular', value: 'regular' },
    { label: 'Rotational', value: 'rotational' },
    { label: 'Flexible', value: 'flexible' },
    { label: 'Night', value: 'night' },
    { label: 'Split', value: 'split' }
  ];

  ngOnInit() {
    this.initForm();
    this.loadShifts();
  }

  private initForm() {
    this.shiftForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['regular', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['18:00', Validators.required],
      gracePeriod: [15, [Validators.min(0), Validators.max(60)]],
      breakDuration: [60, [Validators.min(0), Validators.max(240)]],
      isActive: [true],
      workingDays: [this.daysOfWeek.filter(d => d.checked).map(d => d.value)],
      description: [''],
      overtimeAllowed: [true],
      autoApproval: [false]
    });
  }

  private loadShifts() {
    this.isLoading.set(true);
    this.attendanceService.getAllShifts()
      .subscribe({
        next: (res) => {
          this.shifts.set(res.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load shifts'
          });
          this.isLoading.set(false);
        }
      });
  }

  openCreate() {
    this.isEditMode.set(false);
    this.currentShiftId.set(null);
    this.shiftForm.reset({
      type: 'regular',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriod: 15,
      breakDuration: 60,
      isActive: true,
      workingDays: this.daysOfWeek.filter(d => d.checked).map(d => d.value),
      overtimeAllowed: true,
      autoApproval: false
    });
    this.showDialog.set(true);
  }

  openEdit(shift: any) {
    this.isEditMode.set(true);
    this.currentShiftId.set(shift._id);
    
    this.shiftForm.patchValue({
      name: shift.name,
      type: shift.type,
      startTime: this.formatTime(shift.startTime),
      endTime: this.formatTime(shift.endTime),
      gracePeriod: shift.gracePeriod,
      breakDuration: shift.breakDuration,
      isActive: shift.isActive,
      workingDays: shift.workingDays || [],
      description: shift.description,
      overtimeAllowed: shift.overtimeAllowed,
      autoApproval: shift.autoApproval
    });
    
    this.showDialog.set(true);
  }

  deleteShift(shiftId: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this shift?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.attendanceService.deleteShift(shiftId)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Shift deleted successfully'
              });
              this.loadShifts();
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: err.error?.message || 'Delete failed'
              });
            }
          });
      }
    });
  }

  onSubmit() {
    if (this.shiftForm.invalid) return;

    const formValue = this.shiftForm.value;
    const payload = {
      ...formValue,
      startTime: `${formValue.startTime}:00`,
      endTime: `${formValue.endTime}:00`,
      // Ensure workingDays is an array
      workingDays: Array.isArray(formValue.workingDays) 
        ? formValue.workingDays 
        : [formValue.workingDays]
    };

    const request$ = this.isEditMode()
      ? this.attendanceService.updateShift(this.currentShiftId()!, payload)
      : this.attendanceService.createShift(payload);

    this.isLoading.set(true);
    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Shift ${this.isEditMode() ? 'updated' : 'created'} successfully`
        });
        this.showDialog.set(false);
        this.loadShifts();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Operation failed'
        });
        this.isLoading.set(false);
      }
    });
  }

  toggleDay(dayValue: number) {
    const workingDays = [...this.shiftForm.get('workingDays')?.value || []];
    const index = workingDays.indexOf(dayValue);
    
    if (index > -1) {
      workingDays.splice(index, 1);
    } else {
      workingDays.push(dayValue);
    }
    
    this.shiftForm.patchValue({ workingDays });
  }

  isDaySelected(dayValue: number): boolean {
    const workingDays = this.shiftForm.get('workingDays')?.value || [];
    return workingDays.includes(dayValue);
  }

  private formatTime(timeString: string): string {
    if (!timeString) return '09:00';
    return timeString.substring(0, 5); // Extract HH:MM
  }

  calculateDuration(): string {
    const startTime = this.shiftForm.get('startTime')?.value;
    const endTime = this.shiftForm.get('endTime')?.value;
    
    if (!startTime || !endTime) return '0 hours';
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let durationHours = endHours - startHours;
    let durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes < 0) {
      durationHours--;
      durationMinutes += 60;
    }
    
    // Subtract break duration
    const breakHours = Math.floor(this.shiftForm.get('breakDuration')?.value / 60);
    const breakMinutes = this.shiftForm.get('breakDuration')?.value % 60;
    
    durationHours -= breakHours;
    durationMinutes -= breakMinutes;
    
    if (durationMinutes < 0) {
      durationHours--;
      durationMinutes += 60;
    }
    
    return `${durationHours}h ${durationMinutes}m`;
  }

  getShiftColor(type: string): string {
    const colors: any = {
      regular: 'bg-blue-100 text-blue-700',
      rotational: 'bg-purple-100 text-purple-700',
      flexible: 'bg-green-100 text-green-700',
      night: 'bg-indigo-100 text-indigo-700',
      split: 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  }
}

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-shift-manager.component',
// //   imports: [],
// //   templateUrl: './shift-manager.component.html',
// //   styleUrl: './shift-manager.component.scss',
// // })
// // export class ShiftManagerComponent {

// // }
// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ConfirmationService, MessageService } from 'primeng/api';


// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { DialogModule } from 'primeng/dialog';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';
// import { AgShareGrid } from '../../shared/components/ag-shared-grid';
// import { ShiftService } from '../services/shift.service';
// import { Select } from 'primeng/select';


// @Component({
//   selector: 'app-shift-manager',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, FormsModule, Select,
//     ButtonModule, InputTextModule, DialogModule, ToastModule,
//     ConfirmDialogModule, ToggleSwitchModule, InputNumberModule, MultiSelectModule,
//     AgShareGrid
//   ],
//   providers: [MessageService, ConfirmationService],
//   templateUrl: './shift-manager.component.html',
//   styleUrls: ['./shift-manager.component.scss'] // Re-use list SCSS
// })
// export class ShiftManagerComponent implements OnInit {

//   private shiftService = inject(ShiftService);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);
//   private fb = inject(FormBuilder);
//   rawData: any[] = [];
//   filteredData: any[] = [];
//   filter = {
//     search: '',
//     type: 'all' // 'all', 'day', 'night'
//   };
//   typeOptions = [
//     { label: 'All Shifts', value: 'all' },
//     { label: 'Day Shifts', value: 'day' },
//     { label: 'Night Shifts', value: 'night' }
//   ];
//   data: any[] = [];
//   column: any[] = [];
//   showDialog = false;
//   isEditMode = false;
//   shiftForm!: FormGroup;
//   currentId: string | null = null;

//   // Week Days Data
//   weekDays = [
//     { name: 'Sunday', value: 0 },
//     { name: 'Monday', value: 1 },
//     { name: 'Tuesday', value: 2 },
//     { name: 'Wednesday', value: 3 },
//     { name: 'Thursday', value: 4 },
//     { name: 'Friday', value: 5 },
//     { name: 'Saturday', value: 6 }
//   ];

//   ngOnInit() {
//     this.initForm();
//     this.initColumns();
//     this.fetchData();
//   }

//   private initForm() {
//     this.shiftForm = this.fb.group({
//       name: ['', Validators.required],
//       startTime: ['09:00', Validators.required], // HH:mm string
//       endTime: ['18:00', Validators.required],
//       gracePeriodMins: [15],
//       halfDayThresholdHrs: [4],
//       minFullDayHrs: [8],
//       weeklyOffs: [[0]], // Default Sunday
//       isNightShift: [false]
//     });
//   }

//   private initColumns() {
//     this.column = [
//       { headerName: 'Actions', field: '_id', width: 100, cellRenderer: ActionViewRenderer },
//       { field: 'name', headerName: 'Shift Name', flex: 1 },
//       { field: 'startTime', headerName: 'Start', width: 100 },
//       { field: 'endTime', headerName: 'End', width: 100 },
//       { field: 'gracePeriodMins', headerName: 'Grace (Min)', width: 120 },
//       {
//         field: 'weeklyOffs', headerName: 'Week Offs', flex: 1,
//         valueFormatter: (p: any) => p.value.map((d: number) => this.weekDays.find(w => w.value === d)?.name).join(', ')
//       }
//     ];
//   }

//   fetchData() {
//     this.shiftService.getAllShifts().subscribe({
//       next: (res: any) => {
//         this.rawData = res.data || res.results || [];
//         this.applyLocalFilters();
//       },
//       error: () => this.messageService.add({ severity: 'error', detail: 'Load failed' })
//     });
//   }

//   // ⚡ Client-Side Filter
//   applyLocalFilters() {
//     let result = [...this.rawData];

//     // Search
//     if (this.filter.search) {
//       const term = this.filter.search.toLowerCase();
//       result = result.filter(s => s.name.toLowerCase().includes(term));
//     }

//     // Type
//     if (this.filter.type !== 'all') {
//       const isNight = this.filter.type === 'night';
//       result = result.filter(s => !!s.isNightShift === isNight);
//     }

//     this.filteredData = result;
//   }

//   resetFilters() {
//     this.filter = { search: '', type: 'all' };
//     this.applyLocalFilters();
//   }

//   // fetchData() {
//   //   this.shiftService.getAllShifts().subscribe({
//   //     next: (res: any) => this.data = res.data || res.results || [],
//   //     error: () => this.messageService.add({ severity: 'error', detail: 'Load failed' })
//   //   });
//   // }

//   openCreate() {
//     this.isEditMode = false;
//     this.shiftForm.reset({
//       startTime: '09:00', endTime: '18:00',
//       gracePeriodMins: 15, halfDayThresholdHrs: 4, minFullDayHrs: 8,
//       weeklyOffs: [0], isNightShift: false
//     });
//     this.showDialog = true;
//   }

//   openEdit(row: any) {
//     this.isEditMode = true;
//     this.currentId = row._id;
//     this.shiftForm.patchValue(row);
//     this.showDialog = true;
//   }

//   deleteShift(id: string) {
//     this.confirmationService.confirm({
//       message: 'Delete this shift? Users assigned to it will be affected.',
//       header: 'Critical Action',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.shiftService.deleteShift(id).subscribe({
//           next: () => { this.fetchData(); this.messageService.add({ severity: 'success', detail: 'Deleted' }); }
//         });
//       }
//     });
//   }

//   onSubmit() {
//     if (this.shiftForm.invalid) return;
//     const request$ = this.isEditMode
//       ? this.shiftService.updateShift(this.currentId!, this.shiftForm.value)
//       : this.shiftService.createShift(this.shiftForm.value);

//     request$.subscribe({
//       next: () => {
//         this.showDialog = false;
//         this.fetchData();
//         this.messageService.add({ severity: 'success', detail: 'Shift Saved' });
//       }
//     });
//   }

//   handleGridEvent(event: any) {
//     if (event.type === 'cellClicked' && event.colDef.headerName === 'Actions') {
//       this.openEdit(event.data);
//     }
//   }
// }