// attendance-dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, interval, Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

// Services
import { AttendanceService } from '../services/attendance.service';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ToastModule,
    DialogModule,
    DatePicker,
    InputTextModule,
    TextareaModule,
    SelectModule
  ],
  templateUrl: './attendance-dashboard.component.html',
  styleUrls: ['./attendance-dashboard.component.scss'],
  providers: [DatePipe, MessageService]
})
export class AttendanceDashboardComponent implements OnInit, OnDestroy {
  public attendanceService = inject(AttendanceService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  public datePipe = inject(DatePipe);
  private destroy$ = new Subject<void>();

  // State
  isLoading = signal(false);
  todayStatus = signal<any>(null);
  currentLocation = signal<{lat: number, lng: number, accuracy: number} | null>(null);
  attendanceSummary = signal<any>(null);
  recentPunches = signal<any[]>([]);
  
  // Modals
  showPunchModal = signal(false);
  showRegularizeModal = signal(false);
  showHistoryModal = signal(false);
  
  // Forms
  punchForm!: FormGroup;
  regularizeForm!: FormGroup;
  
  // Live timer
  workDuration = signal('00:00:00');
  private timerSub?: Subscription;
  
  // Charts data
  weeklyData = signal<any[]>([]);
  monthlyStats = signal<any>({});
  todayDate:any

  ngOnInit() {
        this.todayDate = this.datePipe.transform(new Date(), 'fullDate');

    this.initForms();
    this.fetchDashboardData();
    this.startWorkTimer();
    this.trackLocation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.timerSub?.unsubscribe();
  }

  private initForms() {
    this.punchForm = this.fb.group({
      type: ['in', Validators.required],
      notes: [''],
      deviceId: ['web']
    });

    this.regularizeForm = this.fb.group({
      targetDate: [new Date(), Validators.required],
      type: ['missed_punch', Validators.required],
      newFirstIn: [''],
      newLastOut: [''],
      reason: ['', [Validators.required, Validators.minLength(20)]],
      supportingDocs: [[]],
      urgency: ['medium']
    });
  }

  private fetchDashboardData() {
    this.isLoading.set(true);
    
    // Fetch today's status
    // this.attendanceService.getCurrentStatus()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (res) => {
    //       this.todayStatus.set(res.data);
    //       this.updateWorkTimer(res.data?.firstIn);
    //     },
    //     error: (err) => console.error(err)
    //   });

    // Fetch summary
    this.attendanceService.getAttendanceSummary({ month: this.getCurrentMonth() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.attendanceSummary.set(res.data);
          this.processWeeklyData(res.data?.weeklyStats || []);
        }
      });

    // Fetch recent punches
    this.attendanceService.getMyAttendance({ limit: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.recentPunches.set(res.data || []),
        complete: () => this.isLoading.set(false)
      });
  }

  private startWorkTimer() {
    this.timerSub = interval(1000).subscribe(() => {
      if (this.todayStatus()?.firstIn && !this.todayStatus()?.lastOut) {
        const startTime = new Date(this.todayStatus().firstIn).getTime();
        const now = Date.now();
        const diff = now - startTime;
        this.workDuration.set(this.formatDuration(diff));
      }
    });
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private updateWorkTimer(firstIn: string) {
    if (firstIn && !this.todayStatus()?.lastOut) {
      const startTime = new Date(firstIn).getTime();
      const now = Date.now();
      this.workDuration.set(this.formatDuration(now - startTime));
    }
  }

  private processWeeklyData(weeklyStats: any[]) {
    this.weeklyData.set(
      weeklyStats.map(day => ({
        day: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
        hours: day.workHours || 0,
        status: day.status
      }))
    );
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private trackLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation.set({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => console.warn('Location permission denied')
      );
    }
  }

  // =========================================================
  // PUBLIC METHODS
  // =========================================================

  handlePunch() {
    if (!this.currentLocation()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Location Required',
        detail: 'Please enable location services to punch'
      });
      return;
    }

    const formValue = this.punchForm.value;
    const payload = {
      type: formValue.type,
      latitude: this.currentLocation()!.lat,
      longitude: this.currentLocation()!.lng,
      accuracy: this.currentLocation()!.accuracy,
      notes: formValue.notes,
      deviceId: formValue.deviceId
    };

    this.isLoading.set(true);
    this.attendanceService.markAttendance(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Punched ${formValue.type === 'in' ? 'IN' : 'OUT'} successfully`
          });
          this.showPunchModal.set(false);
          this.punchForm.reset({ type: 'in', deviceId: 'web' });
          this.fetchDashboardData();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Punch failed'
          });
          this.isLoading.set(false);
        }
      });
  }

  submitRegularization() {
    if (this.regularizeForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required fields'
      });
      return;
    }

    const formValue = this.regularizeForm.value;
    const payload = {
      targetDate: this.datePipe.transform(formValue.targetDate, 'yyyy-MM-dd'),
      type: formValue.type,
      newFirstIn: formValue.newFirstIn ? this.combineDateTime(formValue.targetDate, formValue.newFirstIn) : undefined,
      newLastOut: formValue.newLastOut ? this.combineDateTime(formValue.targetDate, formValue.newLastOut) : undefined,
      reason: formValue.reason,
      supportingDocs: formValue.supportingDocs,
      urgency: formValue.urgency
    };

    this.isLoading.set(true);
    this.attendanceService.submitRegularization(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Submitted',
            detail: 'Regularization request submitted for approval'
          });
          this.showRegularizeModal.set(false);
          this.regularizeForm.reset({
            type: 'missed_punch',
            urgency: 'medium'
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Submission failed'
          });
          this.isLoading.set(false);
        }
      });
  }

  private combineDateTime(date: Date, time: string): string {
    const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd');
    return `${dateStr}T${time}:00`;
  }

  exportAttendance() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const options = {
      startDate: this.datePipe.transform(firstDay, 'yyyy-MM-dd')!,
      endDate: this.datePipe.transform(lastDay, 'yyyy-MM-dd')!,
      format: 'excel' as const
    };

    this.attendanceService.exportAttendance(options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // Handle file download
          const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_${options.startDate}_to_${options.endDate}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      });
  }
}


// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CommonModule, DatePipe } from '@angular/common';
// import { AttendanceService } from '../services/attendance.service';

// @Component({
//   selector: 'app-attendance-dashboard',
//   imports: [CommonModule,FormsModule,ReactiveFormsModule   ],
//   templateUrl: './attendance-dashboard.component.html',
//   styleUrls: ['./attendance-dashboard.component.scss'],
//   providers: [DatePipe]
// })
// export class AttendanceDashboardComponent implements OnInit {
//   attendanceHistory: any[] = [];
//   todayStatus: string = 'Not Punched';
//   isLoading = false;
//   locationError: string = '';
//   regularizeForm: FormGroup;
//   showRegularizeModal = false;
//   constructor(
//     private attendanceService: AttendanceService,
//     private fb: FormBuilder,
//     private datePipe: DatePipe
//   ) {
//     // Initialize Regularization Form
//     this.regularizeForm = this.fb.group({
//       targetDate: ['', Validators.required],
//       type: ['missed_punch', Validators.required],
//       newFirstIn: [''],
//       newLastOut: [''],
//       reason: ['', [Validators.required, Validators.minLength(10)]]
//     });
//   }

//   ngOnInit(): void {
//     this.fetchHistory();
//   }

//   // ==========================================================
//   // 🟢 PUNCH IN / OUT LOGIC
//   // ==========================================================
//   handlePunch(type: 'in' | 'out') {
//     this.isLoading = true;
//     this.locationError = '';

//     if (!navigator.geolocation) {
//       this.locationError = 'Geolocation is not supported by your browser';
//       this.isLoading = false;
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const payload = {
//           type: type,
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//           accuracy: position.coords.accuracy
//         };

//         this.attendanceService.markAttendance(payload).subscribe({
//           next: (res) => {
//             alert(`Success: Punched ${type.toUpperCase()} at ${this.datePipe.transform(new Date(), 'shortTime')}`);
//             this.fetchHistory(); // Refresh table
//             this.isLoading = false;
//           },
//           error: (err) => {
//             alert(`Error: ${err.error.message || 'Punch failed'}`);
//             this.isLoading = false;
//           }
//         });
//       },
//       (err) => {
//         this.locationError = 'Location access denied. Please enable GPS.';
//         this.isLoading = false;
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }

//   // ==========================================================
//   // 📅 HISTORY & DATA
//   // ==========================================================
//   fetchHistory() {
//     // Get current month by default
//     const currentMonth = new Date().toISOString().slice(0, 7); // "2023-10"

//     this.attendanceService.getMyAttendance({ month: currentMonth }).subscribe({
//       next: (res) => {
//         this.attendanceHistory = res.data;
//         // Simple logic to check today's status from logs
//         const todayStr = new Date().toISOString().split('T')[0];
//         const todayRecord = this.attendanceHistory.find(r => r.date === todayStr);
//         if (todayRecord) {
//           this.todayStatus = todayRecord.lastOut ? 'Punched Out' : 'Punched In';
//         }
//       }
//     });
//   }

//   // ==========================================================
//   // 📝 REGULARIZATION SUBMISSION
//   // ==========================================================
//   submitRegularization() {
//     if (this.regularizeForm.invalid) return;

//     const formVal = this.regularizeForm.value;

//     // Construct Payload for Backend
//     const payload = {
//       targetDate: formVal.targetDate,
//       type: formVal.type,
//       correction: {
//         reason: formVal.reason,
//         // Convert time string "09:30" to Full Date Object if needed, or send time string based on backend expectation
//         newFirstIn: formVal.newFirstIn ? this.combineDateAndTime(formVal.targetDate, formVal.newFirstIn) : undefined,
//         newLastOut: formVal.newLastOut ? this.combineDateAndTime(formVal.targetDate, formVal.newLastOut) : undefined
//       }
//     };

//     this.attendanceService.submitRegularization(payload).subscribe({
//       next: () => {
//         alert('Request Submitted for Approval');
//         this.showRegularizeModal = false;
//         this.regularizeForm.reset();
//       },
//       error: (err) => alert(err.error.message)
//     });
//   }

//   // Helper: Combine "2023-10-25" and "09:00" into ISO String
//   private combineDateAndTime(date: string, time: string): string {
//     return new Date(`${date}T${time}:00`).toISOString();
//   }
// }