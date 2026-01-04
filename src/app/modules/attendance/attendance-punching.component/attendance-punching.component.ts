import { Component, OnInit, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';

// Services & Interfaces
import { AttendanceService, AttendancePunchData, AttendanceFilter } from '../services/attendance.service';
import { AuthService } from '../../auth/services/auth-service';
import { LoadingService } from '../../../core/services/loading.service';
import { AppMessageService } from '../../../core/services/message.service';
import { Severity, CommonMethodService } from '../../../core/utils/common-method.service';

// Interfaces
interface PunchActivity {
  id: string;
  type: 'in' | 'out' | 'break_start' | 'break_end';
  time: string;
  notes?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity?: Severity;
}

interface PunchHistory {
  id: string;
  date: Date;
  checkIn: string;
  checkOut: string;
  breakCount: number;
  totalHours: number;
  status: string;
  statusSeverity?: Severity;
  statusClass?: string;
  statusText?: string;
}

interface TodaySummary {
  totalHours: number;
  breakHours: number;
  overtimeHours: number;
  lateMinutes: number;
  shiftStart: string;
  lastPunch: string;
  nextBreakIn: string;
  firstIn?: string;
  lastOut?: string;
}

interface PunchType {
  label: string;
  value: string;
  icon: string;
  severity: Severity;
}

interface EmergencyIssueType {
  label: string;
  value: string;
  severity: Severity;
}

@Component({
  selector: 'app-attendance-punching',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    TableModule,
    DialogModule,
    SelectModule,
    CheckboxModule,
    TextareaModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './attendance-punching.component.html'
})
export class AttendancePunchingComponent implements OnInit {
  // Services
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  public commonService = inject(CommonMethodService);
  private loadingService = inject(LoadingService);
  private appMessageService = inject(AppMessageService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  // State
  isLoading = signal(false);
  currentTime = signal('');
  currentDate = signal('');
  showEmergencyDialog = signal(false);

  // User Data
  currentUser = signal<any>(null);

  // Punch Data
  todayActivity = signal<PunchActivity[]>([]);
  punchHistory = signal<PunchHistory[]>([]);
  todaySummary = signal<TodaySummary>({
    totalHours: 0,
    breakHours: 0,
    overtimeHours: 0,
    lateMinutes: 0,
    shiftStart: '--:--',
    lastPunch: '--:--',
    nextBreakIn: '--:--',
    firstIn: undefined,
    lastOut: undefined
  });

  // Punch Controls
  selectedPunchType = signal<string>('regular');
  punchNotes = signal('');
  locationDetected = signal<string>('');

  // Emergency Request
  emergencyIssueType = signal<string>('');
  emergencyDescription = signal('');
  urgentRequest = signal(false);

  // Location
  currentLatitude = signal<number | undefined>(undefined);
  currentLongitude = signal<number | undefined>(undefined);
  locationAccuracy = signal<number | undefined>(undefined);

  // Options
  historyRange = signal('7days');
  historyRangeOptions = signal([
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'This Month', value: 'month' },
    { label: 'Custom Range', value: 'custom' }
  ]);

  emergencyIssueTypes = signal<EmergencyIssueType[]>([
    { label: 'System Error', value: 'system_error', severity: 'danger' },
    { label: 'Forgot to Punch', value: 'forgot_punch', severity: 'warn' },
    { label: 'Location Issue', value: 'location_issue', severity: 'info' },
    { label: 'Time Correction', value: 'time_correction', severity: 'secondary' },
    { label: 'Other', value: 'other', severity: 'secondary' }
  ]);

  punchTypes = signal<PunchType[]>([
    { label: 'Regular', value: 'regular', icon: 'pi pi-clock', severity: 'success' },
    { label: 'Work From Home', value: 'wfh', icon: 'pi pi-home', severity: 'info' },
    { label: 'On Duty', value: 'onduty', icon: 'pi pi-car', severity: 'warn' },
    { label: 'Field Work', value: 'field', icon: 'pi pi-map-marker', severity: 'secondary' }
  ]);

  // Computed properties using CommonService
  canCheckIn = computed(() => {
    const summary = this.todaySummary();
    return !summary.firstIn;
  });

  canCheckOut = computed(() => {
    const summary = this.todaySummary();
    return !!summary.firstIn && !summary.lastOut;
  });

  canStartBreak = computed(() => {
    const summary = this.todaySummary();
    const activity = this.todayActivity();

    if (!summary.firstIn || summary.lastOut) return false;

    if (activity.length > 0) {
      const lastActivity = activity[activity.length - 1];
      return lastActivity.type !== 'break_start';
    }

    return true;
  });

  canEndBreak = computed(() => {
    const activity = this.todayActivity();

    if (activity.length > 0) {
      const lastActivity = activity[activity.length - 1];
      return lastActivity.type === 'break_start';
    }

    return false;
  });

  currentStatus = computed(() => {
    const summary = this.todaySummary();
    const activity = this.todayActivity();

    if (!summary.firstIn) return 'out';
    if (summary.lastOut) return 'out';

    if (activity.length > 0) {
      const lastActivity = activity[activity.length - 1];
      if (lastActivity.type === 'break_start') return 'break';
    }

    return 'working';
  });

  currentStatusText = computed(() => {
    const status = this.currentStatus();
    switch (status) {
      case 'working': return 'Working';
      case 'break': return 'On Break';
      case 'out': return 'Not Checked In';
      default: return 'Unknown';
    }
  });

  currentStatusSeverity = computed((): Severity => {
    const status = this.currentStatus();
    switch (status) {
      case 'working': return 'success';
      case 'break': return 'warn';
      case 'out': return 'secondary';
      default: return 'secondary';
    }
  });

  constructor() {
    // Update time every second
    effect(() => {
      this.updateDateTime();
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // Load current user
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser.set(user);
      });

    // Start clock
    this.startClock();
    
    // Load data using CommonService's apiCall
    this.loadTodayActivity();
    this.loadPunchHistory();
    this.detectLocation();
  }

  // Time Functions
  private startClock() {
    setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  private updateDateTime() {
    const now = new Date();
    this.currentTime.set(this.commonService.formatDate(now, 'HH:mm:ss'));
    this.currentDate.set(this.commonService.formatDate(now, 'EEEE, MMMM d, yyyy'));
  }

async handlePunch(type: 'checkin' | 'checkout' | 'breakstart' | 'breakend') {
  if (this.isLoading()) return;

  // Prepare basic punch data
  const punchData: AttendancePunchData = {
    type: this.mapPunchType(type),
    notes: this.punchNotes(),
    deviceId: this.getDeviceId()
  };

  // Try to get location first
  try {
    if (this.currentLatitude() && this.currentLongitude()) {
      // Use already detected location
      punchData.latitude = this.currentLatitude();
      punchData.longitude = this.currentLongitude();
      punchData.accuracy = this.locationAccuracy();
    } else {
      // Try to get location now
      const position = await this.getCurrentPosition();
      punchData.latitude = position.coords.latitude;
      punchData.longitude = position.coords.longitude;
      punchData.accuracy = position.coords.accuracy;
      
      // Update UI with new location
      this.currentLatitude.set(punchData.latitude);
      this.currentLongitude.set(punchData.longitude);
      this.locationAccuracy.set(punchData.accuracy);
      this.locationDetected.set(
        `${punchData.latitude.toFixed(4)}, ${punchData.longitude.toFixed(4)} ` +
        `(Accuracy: ${punchData.accuracy?.toFixed(0)}m)`
      );
    }
  } catch (locationError: any) {
    // Handle location permission denied or timeout
    console.warn('Location access failed:', locationError);
    
    // Show warning but continue without location
    this.appMessageService.showWarn(
      'Location Access',
      'Unable to get precise location. Using approximate location.'
    );
    
    // Set approximate values (you might want to use IP-based location here)
    punchData.latitude = 0;
    punchData.longitude = 0;
    punchData.accuracy = 0;
    this.locationDetected.set('Using approximate location');
  }

  // Call the API with enhanced error handling
  this.commonService.apiCall(
    this.attendanceService.markAttendance(punchData),
    (response) => {
      this.appMessageService.showSuccess(
        'Success',
        `${this.getPunchLabel(type)} recorded successfully`
      );
      this.punchNotes.set('');
      this.loadTodayActivity();
      this.loadPunchHistory();
    },
    'Record Punch'
  );
}

// New method to get current position with timeout
private getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    let timeout = setTimeout(() => {
      reject(new Error('Location request timed out'));
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve(position);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Updated detectLocation method with better UX
async detectLocation() {
  try {
    this.isLoading.set(true);
    const position = await this.getCurrentPosition();
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const acc = position.coords.accuracy;

    this.currentLatitude.set(lat);
    this.currentLongitude.set(lng);
    this.locationAccuracy.set(acc);

    this.locationDetected.set(
      `${lat.toFixed(4)}, ${lng.toFixed(4)} ` +
      `(Accuracy: ${acc.toFixed(0)}m)`
    );
    
    this.appMessageService.showSuccess(
      'Location Updated',
      'Your location has been detected successfully'
    );
  } catch (error: any) {
    this.handleLocationError(error);
  } finally {
    this.isLoading.set(false);
  }
}

// New method to handle location errors
private handleLocationError(error: GeolocationPositionError | Error) {
  console.error('Location error:', error);
  
  if ('code' in error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.appMessageService.showError(
          'Location Permission Denied',
          'Please enable location access in your browser settings to mark attendance.'
        );
        this.locationDetected.set('Permission denied - Enable location access');
        break;
      case error.POSITION_UNAVAILABLE:
        this.appMessageService.showWarn(
          'Location Unavailable',
          'Unable to retrieve your location. Using approximate location.'
        );
        this.locationDetected.set('Location unavailable');
        break;
      case error.TIMEOUT:
        this.appMessageService.showWarn(
          'Location Timeout',
          'Location request took too long. Using approximate location.'
        );
        this.locationDetected.set('Location timeout');
        break;
    }
  } else {
    this.appMessageService.showWarn(
      'Location Error',
      error.message || 'Unknown location error'
    );
    this.locationDetected.set('Location error');
  }
}

  private mapPunchType(uiType: string): 'in' | 'out' | 'break_start' | 'break_end' {
    switch (uiType) {
      case 'checkin': return 'in';
      case 'checkout': return 'out';
      case 'breakstart': return 'break_start';
      case 'breakend': return 'break_end';
      default: return 'in';
    }
  }

  private getDeviceId(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    return btoa(`${userAgent}-${platform}-${language}`).substring(0, 32);
  }

  // Location Functions
  // async detectLocation() {
  //   if (!navigator.geolocation) {
  //     this.locationDetected.set('Geolocation not supported');
  //     return;
  //   }

  //   try {
  //     const position = await new Promise<GeolocationPosition>((resolve, reject) => {
  //       navigator.geolocation.getCurrentPosition(resolve, reject, {
  //         enableHighAccuracy: true,
  //         timeout: 5000,
  //         maximumAge: 0
  //       });
  //     });

  //     this.currentLatitude.set(position.coords.latitude);
  //     this.currentLongitude.set(position.coords.longitude);
  //     this.locationAccuracy.set(position.coords.accuracy);

  //     this.locationDetected.set(
  //       `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} ` +
  //       `(Accuracy: ${position.coords.accuracy.toFixed(0)}m)`
  //     );
  //   } catch (error: any) {
  //     console.error('Location error:', error);
  //     this.locationDetected.set('Location detection failed: ' + (error.message || 'Unknown error'));
  //     this.getApproximateLocation();
  //   }
  // }

  private async getApproximateLocation() {
    try {
      this.locationDetected.set('Using approximate location (IP-based)');
    } catch (error) {
      this.locationDetected.set('Location unavailable');
    }
  }

  // Data Loading Functions
  loadTodayActivity() {
    const today = new Date().toISOString().split('T')[0];
    const filterParams: AttendanceFilter = {
      startDate: today,
      endDate: today,
      limit: 50
    };

    this.commonService.apiCall(
      this.attendanceService.getMyAttendance(filterParams),
      (response) => {
        if (response?.data && response.data.length > 0) {
          const todayRecord = response.data[0];
          
          // Update summary
          this.todaySummary.set({
            totalHours: todayRecord.totalHours || 0,
            breakHours: todayRecord.breakHours || 0,
            overtimeHours: todayRecord.overtimeHours || 0,
            lateMinutes: todayRecord.lateMinutes || 0,
            shiftStart: this.formatTime(todayRecord.shiftStart) || '--:--',
            lastPunch: todayRecord.lastPunch ? this.formatTime(todayRecord.lastPunch) : '--:--',
            nextBreakIn: '--:--',
            firstIn: todayRecord.firstIn,
            lastOut: todayRecord.lastOut
          });

          // Load activities
          if (todayRecord.punchLogs) {
            const activities: PunchActivity[] = todayRecord.punchLogs.map((log: any) => ({
              id: log._id || log.id,
              type: log.type,
              time: this.formatTime(log.time),
              notes: log.notes,
              location: log.location,
              severity: this.commonService.mapPunchTypeToSeverity(log.type)
            }));
            this.todayActivity.set(activities);
          }
        }
      },
      'Load Today Activity'
    );
  }

  loadPunchHistory() {
    const endDate = new Date();
    let startDate = new Date();

    switch (this.historyRange()) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const filterParams: AttendanceFilter = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 50
    };

    this.commonService.apiCall(
      this.attendanceService.getMyAttendance(filterParams),
      (response) => {
        if (response?.data) {
          const history: PunchHistory[] = response.data.map((record: any) => {
            const statusSeverity = this.commonService.mapAttendanceStatusToSeverity(record.status);
            return {
              id: record._id || record.id,
              date: new Date(record.date),
              checkIn: this.formatTime(record.firstIn),
              checkOut: this.formatTime(record.lastOut),
              breakCount: record.breakCount || 0,
              totalHours: record.totalHours || 0,
              status: record.status || 'unknown',
              statusSeverity,
              statusClass: this.commonService.getAttendanceStatusClass(record.status),
              statusText: this.commonService.getAttendanceStatusText(record.status)
            };
          });
          this.punchHistory.set(history);
        }
      },
      'Load Punch History'
    );
  }

  // Helper Methods
  getPunchLabel(type: string): string {
    return this.commonService.getPunchTypeText(type);
  }

  getPunchTypeSeverity(type: string): Severity {
    return this.commonService.mapPunchTypeToSeverity(type);
  }

  getActivityLabel(type: string): string {
    return this.commonService.getPunchTypeText(type);
  }

  getActivityIcon(type: string): string {
    return this.commonService.getAttendanceIcon(type);
  }

  getActivitySeverity(type: string): Severity {
    return this.commonService.mapPunchTypeToSeverity(type);
  }

  getActivityClass(type: string): string {
    const severity = this.getActivitySeverity(type);
    switch (severity) {
      case 'success': return 'bg-green-100 text-green-600 border border-green-200';
      case 'warn': return 'bg-orange-100 text-orange-600 border border-orange-200';
      case 'danger': return 'bg-red-100 text-red-600 border border-red-200';
      case 'info': return 'bg-blue-100 text-blue-600 border border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  formatTime(time: string | undefined): string {
    return this.commonService.formatPunchTime(time);
  }

  getSelectedPunchTypeSeverity(): Severity {
    const selected = this.punchTypes().find(t => t.value === this.selectedPunchType());
    return selected?.severity || 'secondary';
  }

  // Emergency Request
  submitEmergencyRequest() {
    if (!this.emergencyIssueType() || !this.emergencyDescription()) {
      this.appMessageService.showWarn('Validation', 'Please fill in all required fields');
      return;
    }

    const validation = this.commonService.validateRegularizationRequest({
      targetDate: new Date().toISOString().split('T')[0],
      type: 'others',
      reason: `[${this.emergencyIssueType()}] ${this.emergencyDescription()}`
    });

    if (!validation.valid) {
      this.appMessageService.showWarn('Validation', validation.errors.join(', '));
      return;
    }

    const requestData = {
      targetDate: new Date().toISOString().split('T')[0],
      type: 'others' as const,
      reason: `[${this.emergencyIssueType()}] ${this.emergencyDescription()}`,
      urgency: this.urgentRequest() ? 'high' : 'medium' as const
    };

    this.commonService.apiCall(
      this.attendanceService.submitRegularization(requestData),
      () => {
        this.appMessageService.showSuccess('Success', 'Emergency request submitted successfully');
        this.showEmergencyDialog.set(false);
        this.resetEmergencyForm();
      },
      'Submit Emergency Request'
    );
  }

  private resetEmergencyForm() {
    this.emergencyIssueType.set('');
    this.emergencyDescription.set('');
    this.urgentRequest.set(false);
  }

  // Navigation Functions
  viewHistory() {
    console.log('Navigate to full history');
    // Implement navigation to full history page
  }

  viewPunchDetails(record: PunchHistory) {
    console.log('View punch details:', record);
    // Implement punch details view
  }

  checkCurrentStatus() {
    this.commonService.apiCall(
      this.attendanceService.hasPunchedInToday(),
      (response) => {
        console.log('Punch status:', response.hasPunchedIn ? 'Punched in today' : 'Not punched in');
      },
      'Check Punch Status'
    );
  }

  // Theme token utilities
  getSpacingClass(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' = 'md'): string {
    const spacingMap = {
      'xs': 'p-[var(--spacing-xs)]',
      'sm': 'p-[var(--spacing-sm)]',
      'md': 'p-[var(--spacing-md)]',
      'lg': 'p-[var(--spacing-lg)]',
      'xl': 'p-[var(--spacing-xl)]',
      '2xl': 'p-[var(--spacing-2xl)]',
      '3xl': 'p-[var(--spacing-3xl)]',
      '4xl': 'p-[var(--spacing-4xl)]',
      '5xl': 'p-[var(--spacing-5xl)]'
    };
    return spacingMap[size];
  }

  getBorderRadiusClass(size: 'sm' | 'base' | 'lg' | 'xl' = 'base'): string {
    const radiusMap = {
      'sm': 'rounded-[var(--ui-border-radius-sm)]',
      'base': 'rounded-[var(--ui-border-radius)]',
      'lg': 'rounded-[var(--ui-border-radius-lg)]',
      'xl': 'rounded-[var(--ui-border-radius-xl)]'
    };
    return radiusMap[size];
  }

  getShadowClass(level: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' = 'md'): string {
    const shadowMap = {
      'xs': 'shadow-[var(--shadow-xs)]',
      'sm': 'shadow-[var(--shadow-sm)]',
      'md': 'shadow-[var(--shadow-md)]',
      'lg': 'shadow-[var(--shadow-lg)]',
      'xl': 'shadow-[var(--shadow-xl)]',
      '2xl': 'shadow-[var(--shadow-2xl)]',
      '3xl': 'shadow-[var(--shadow-3xl)]',
      '4xl': 'shadow-[var(--shadow-4xl)]',
      '5xl': 'shadow-[var(--shadow-5xl)]',
      '6xl': 'shadow-[var(--shadow-6xl)]'
    };
    return shadowMap[level];
  }

  getTransitionClass(type: 'fast' | 'base' | 'slow' | 'slower' | 'colors' | 'transform' = 'base'): string {
    const transitionMap = {
      'fast': 'transition-[var(--transition-fast)]',
      'base': 'transition-[var(--transition-base)]',
      'slow': 'transition-[var(--transition-slow)]',
      'slower': 'transition-[var(--transition-slower)]',
      'colors': 'transition-[var(--transition-colors)]',
      'transform': 'transition-[var(--transition-transform)]'
    };
    return transitionMap[type];
  }
}
