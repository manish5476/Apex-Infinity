import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { AttendanceService } from '../services/attendance.service';

import { AuthService } from '../../auth/services/auth-service';
import { LoadingService } from '../../../core/services/loading.service';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService, Severity } from '../../../core/utils/common-method.service';
import { TableModule } from "primeng/table";

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TabsModule,
    ProgressSpinnerModule,
    TableModule
  ],
  templateUrl: './attendance-dashboard.component.html',
  providers: [DatePipe]
})
export class AttendanceDashboardComponent implements OnInit {
  // Services
  private attendanceService = inject(AttendanceService);
  public commonService = inject(CommonMethodService);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private appMessageService = inject(AppMessageService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);
  today = new Date();

  // State
  isLoading = signal(false);
  activeTab: any = signal(0);
  currentUser = signal<any>(null);

  // Data
  todayStatus = signal<any>(null);
  attendanceSummary = signal<any>(null);
  recentPunches = signal<any[]>([]);
  weeklyData = signal<any[]>([]);
  monthlyStats = signal<any>({});
  teamAttendance = signal<any[]>([]);
  liveAttendance = signal<any[]>([]);

  // Location
  currentLocation = signal<{ lat: number, lng: number, accuracy: number } | null>(null);

  // Modals
  showPunchModal = signal(false);
  showRegularizeModal = signal(false);
  showHistoryModal = signal(false);
  showTeamAttendanceModal = signal(false);

  // Forms
  punchForm!: FormGroup;
  regularizeForm!: FormGroup;
  filterForm!: FormGroup;

  // Timer
  workDuration = signal('00:00:00');
  private timerInterval: any;

  // Computed properties
  todayDate = computed(() => {
    return this.commonService.formatDate(new Date(), 'fullDate');
  });

  canPunchIn = computed(() => {
    const status = this.todayStatus();
    return !status?.firstIn;
  });

  canPunchOut = computed(() => {
    const status = this.todayStatus();
    return status?.firstIn && !status?.lastOut;
  });

  workHoursPercentage = computed(() => {
    const status = this.todayStatus();
    const workHours = status?.totalWorkHours || 0;
    return Math.min((workHours / 8) * 100, 100); // Assuming 8-hour work day
  });

  currentStatusSeverity = computed((): Severity => {
    const status = this.todayStatus()?.status;
    return this.commonService.mapAttendanceStatusToSeverity(status);
  });

  currentStatusText = computed(() => {
    const status = this.todayStatus()?.status;
    return this.commonService.getAttendanceStatusText(status);
  });

  ngOnInit() {
    this.initForms();
    this.loadCurrentUser();
    this.loadDashboardData();
    this.startWorkTimer();
    this.trackLocation();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser.set(user);
      });
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
      urgency: ['medium']
    });

    this.filterForm = this.fb.group({
      startDate: [new Date(new Date().setDate(new Date().getDate() - 7))],
      endDate: [new Date()],
      department: [''],
      status: [[]]
    });
  }

  private loadDashboardData() {
    // Load today's status
    this.loadTodayStatus();

    // Load attendance summary
    this.loadAttendanceSummary();

    // Load recent punches
    this.loadRecentPunches();

    // Load weekly data
    this.loadWeeklyData();
  }

  private loadTodayStatus() {
    const today = new Date().toISOString().split('T')[0];

    this.commonService.apiCall(
      this.attendanceService.getMyAttendance({
        startDate: today,
        endDate: today,
        limit: 1
      }),
      (response) => {
        if (response.data && response.data.length > 0) {
          this.todayStatus.set(response.data[0]);
          this.updateWorkTimer(response.data[0]?.firstIn);
        }
      },
      'Load Today Status'
    );
  }

  private loadAttendanceSummary() {
    const currentMonth = this.getCurrentMonth();

    this.commonService.apiCall(
      this.attendanceService.getAttendanceSummary({ month: currentMonth }),
      (response) => {
        this.attendanceSummary.set(response.data?.summary);
        this.monthlyStats.set(response.data);
      },
      'Load Attendance Summary'
    );
  }

  private loadRecentPunches() {
    this.commonService.apiCall(
      this.attendanceService.getMyAttendance({ limit: 5 }),
      (response) => {
        this.recentPunches.set(response.data || []);
      },
      'Load Recent Punches'
    );
  }

  private loadWeeklyData() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    this.commonService.apiCall(
      this.attendanceService.getMyAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 7
      }),
      (response) => {
        if (response.data) {
          const weeklyStats = response.data.map((day: any) => ({
            day: this.commonService.formatDate(day.date, 'EEE'),
            hours: day.totalWorkHours || 0,
            status: day.status,
            date: day.date
          }));
          this.weeklyData.set(weeklyStats);
        }
      },
      'Load Weekly Data'
    );
  }

  loadTeamAttendance() {
    const filters = {
      date: new Date().toISOString().split('T')[0],
      includeSubordinates: true
    };

    this.commonService.apiCall(
      this.attendanceService.getTeamAttendance(filters),
      (response) => {
        this.teamAttendance.set(response.data || []);
      },
      'Load Team Attendance'
    );
  }

  private loadLiveAttendance() {
    this.commonService.apiCall(
      this.attendanceService.getLiveAttendance({}),
      (response) => {
        this.liveAttendance.set(response.data || []);
      },
      'Load Live Attendance'
    );
  }

  private startWorkTimer() {
    this.timerInterval = setInterval(() => {
      if (this.todayStatus()?.firstIn && !this.todayStatus()?.lastOut) {
        const startTime = new Date(this.todayStatus().firstIn).getTime();
        const now = Date.now();
        const diff = now - startTime;
        this.workDuration.set(this.formatDuration(diff));
      }
    }, 1000);
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
        (error) => {
          console.warn('Location permission denied:', error);
          this.appMessageService.showWarn(
            'Location Access',
            'Location services are required for attendance marking'
          );
        }
      );
    }
  }

  // Public Methods
  onTabChange(event: any) {
    this.activeTab.set(event.index);

    switch (event.index) {
      case 1: // Team tab
        this.loadTeamAttendance();
        break;
      case 2: // Live tab
        this.loadLiveAttendance();
        break;
    }
  }

  handlePunch() {
    if (!this.currentLocation()) {
      this.appMessageService.showWarn(
        'Location Required',
        'Please enable location services to record attendance'
      );
      return;
    }

    const formValue = this.punchForm.value;
    const payload = {
      type: formValue.type,
      latitude: this.currentLocation()!.lat,
      longitude: this.currentLocation()!.lng,
      accuracy: this.currentLocation()!.accuracy,
      notes: formValue.notes,
      deviceId: 'web'
    };

    this.commonService.apiCall(
      this.attendanceService.markAttendance(payload),
      () => {
        this.appMessageService.showSuccess(
          'Success',
          `Punched ${formValue.type === 'in' ? 'IN' : 'OUT'} successfully`
        );
        this.showPunchModal.set(false);
        this.punchForm.reset({ type: 'in', deviceId: 'web' });
        this.loadTodayStatus();
        this.loadRecentPunches();
      },
      'Record Punch'
    );
  }

  submitRegularization() {
    if (this.regularizeForm.invalid) {
      this.commonService.markFormGroupTouched(this.regularizeForm);
      this.appMessageService.showWarn(
        'Validation',
        'Please fill all required fields correctly'
      );
      return;
    }

    const formValue = this.regularizeForm.value;
    const payload = {
      targetDate: this.commonService.formatDate(formValue.targetDate, 'yyyy-MM-dd'),
      type: formValue.type,
      newFirstIn: formValue.newFirstIn ?
        `${this.commonService.formatDate(formValue.targetDate, 'yyyy-MM-dd')}T${formValue.newFirstIn}:00` :
        undefined,
      newLastOut: formValue.newLastOut ?
        `${this.commonService.formatDate(formValue.targetDate, 'yyyy-MM-dd')}T${formValue.newLastOut}:00` :
        undefined,
      reason: formValue.reason,
      urgency: formValue.urgency
    };

    // Validate the request
    const validation = this.commonService.validateRegularizationRequest(payload);
    if (!validation.valid) {
      this.appMessageService.showWarn('Validation', validation.errors.join(', '));
      return;
    }

    this.commonService.apiCall(
      this.attendanceService.submitRegularization(payload),
      () => {
        this.appMessageService.showSuccess(
          'Submitted',
          'Regularization request submitted for approval'
        );
        this.showRegularizeModal.set(false);
        this.regularizeForm.reset({
          targetDate: new Date(),
          type: 'missed_punch',
          urgency: 'medium'
        });
      },
      'Submit Regularization'
    );
  }

  exportAttendance() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const options = {
      startDate: this.commonService.formatDate(firstDay, 'yyyy-MM-dd')!,
      endDate: this.commonService.formatDate(lastDay, 'yyyy-MM-dd')!,
      format: 'excel' as const
    };

    this.commonService.apiCall(
      this.attendanceService.exportAttendance(options),
      (blob) => {
        const filename = `attendance_export_${options.startDate}_to_${options.endDate}.xlsx`;
        this.commonService.downloadBlob(blob, filename);
        this.appMessageService.showSuccess(
          'Exported',
          'Attendance data exported successfully'
        );
      },
      'Export Attendance'
    );
  }

  // Helper Methods
  formatTime(time: string | undefined): string {
    return this.commonService.formatPunchTime(time);
  }

  formatDate(date: string | Date): string {
    return this.commonService.formatDate(date, 'mediumDate');
  }

  getStatusClass(status: string): string {
    return this.commonService.getAttendanceStatusClass(status);
  }

  getStatusText(status: string): string {
    return this.commonService.getAttendanceStatusText(status);
  }

  getStatusSeverity(status: string): Severity {
    return this.commonService.mapAttendanceStatusToSeverity(status);
  }

  getEmployeeInitials(name: string): string {
    return this.commonService.getInitials(name);
  }

  getEmployeeColor(name: string): string {
    return this.commonService.stringToColor(name);
  }

  refreshData() {
    this.loadDashboardData();
    this.appMessageService.showSuccess('Refreshed', 'Dashboard data updated');
  }

  applyFilters() {
    const filters = this.filterForm.value;
    console.log('Applying filters:', filters);
    // Implement filter logic
  }

  // Computed properties for UI
  get currentlyWorkingCount() {
    return this.liveAttendance().filter(a =>
      a.firstIn && !a.lastOut && !a.isOnBreak
    ).length;
  }

  get onBreakCount() {
    return this.liveAttendance().filter(a =>
      a.isOnBreak || (a.breakStart && !a.breakEnd)
    ).length;
  }

  get notCheckedInCount() {
    const currentHour = new Date().getHours();
    return this.liveAttendance().filter(a =>
      !a.firstIn && currentHour >= 9
    ).length;
  }

  get wfhCount() {
    return this.liveAttendance().filter(a =>
      a.workType === 'wfh'
    ).length;
  }
}
