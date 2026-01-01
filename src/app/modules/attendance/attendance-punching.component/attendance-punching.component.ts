import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';

// Services & Interfaces
import { AttendanceService, AttendancePunchData, AttendanceFilter } from '../services/attendance.service';
import { AuthService } from '../../auth/services/auth-service';
import { Subject, takeUntil } from 'rxjs';

// Interfaces
interface PunchActivity {
  id: string;
  type: 'in' | 'out' | 'break_start' | 'break_end';
  time: string;
  notes?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface PunchActivity {
  id: string;
  type: 'in' | 'out' | 'break_start' | 'break_end';
  time: string;
  notes?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface PunchHistory {
  id: string;
  date: Date;
  checkIn: string;
  checkOut: string;
  breakCount: number;
  totalHours: number;
  status: string;
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
}

interface EmergencyIssueType {
  label: string;
  value: string;
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
    // InputTextareaModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './attendance-punching.component.html'
})
export class AttendancePunchingComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  // State
  isLoading = signal(false);
  currentTime = signal('');
  currentDate = signal('');
  showEmergencyDialog : boolean =false
  
  // User Data
  currentUser: any = null;
  
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
  historyRangeOptions:any = signal([
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'This Month', value: 'month' },
    { label: 'Custom Range', value: 'custom' }
  ]);
  
  emergencyIssueTypes:any = signal<EmergencyIssueType[]>([
    { label: 'System Error', value: 'system_error' },
    { label: 'Forgot to Punch', value: 'forgot_punch' },
    { label: 'Location Issue', value: 'location_issue' },
    { label: 'Time Correction', value: 'time_correction' },
    { label: 'Other', value: 'other' }
  ]);
  
  punchTypes:any = signal<PunchType[]>([
    { label: 'Regular', value: 'regular', icon: 'pi pi-clock' },
    { label: 'Work From Home', value: 'wfh', icon: 'pi pi-home' },
    { label: 'On Duty', value: 'onduty', icon: 'pi pi-car' },
    { label: 'Field Work', value: 'field', icon: 'pi pi-map-marker' }
  ]);

  // Computed properties
  canCheckIn:any = computed(() => {
    const summary = this.todaySummary();
    return !summary.firstIn; // Can check in if no first in today
  });

  canCheckOut:any = computed(() => {
    const summary = this.todaySummary();
    return !!summary.firstIn && !summary.lastOut; // Can check out if checked in but not out
  });

  canStartBreak = computed(() => {
    const summary = this.todaySummary();
    const activity = this.todayActivity();
    
    // Can start break if checked in and not already on break
    if (!summary.firstIn || summary.lastOut) return false;
    
    // Check if last activity was break_start without break_end
    if (activity.length > 0) {
      const lastActivity = activity[activity.length - 1];
      return lastActivity.type !== 'break_start';
    }
    
    return true;
  });

  canEndBreak = computed(() => {
    const activity = this.todayActivity();
    
    // Can end break if last activity was break_start
    if (activity.length > 0) {
      const lastActivity = activity[activity.length - 1];
      return lastActivity.type === 'break_start';
    }
    
    return false;
  });

  getCurrentStatus = computed(() => {
    const summary = this.todaySummary();
    const activity = this.todayActivity();
    
    if (!summary.firstIn) return 'out';
    if (summary.lastOut) return 'out';
    
    // Check if on break
    if (activity.length > 0) {
      const lastActivity = activity[activity.length - 1];
      if (lastActivity.type === 'break_start') return 'break';
    }
    
    return 'working';
  });

  getCurrentStatusText = computed(() => {
    const status = this.getCurrentStatus();
    switch (status) {
      case 'working': return 'Working';
      case 'break': return 'On Break';
      case 'out': return 'Not Checked In';
      default: return 'Unknown';
    }
  });

  constructor() {
    // Update time every second
    effect(() => {
      this.updateDateTime();
    });
  }
    private destroy$ = new Subject<void>();
  

  ngOnInit() {
        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);
    
    this.startClock();
    this.loadTodayActivity();
    this.loadPunchHistory();
    this.detectLocation();
  }

  // Time Functions
  startClock() {
    setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  updateDateTime() {
    const now = new Date();
    this.currentTime.set(this.datePipe.transform(now, 'HH:mm:ss') || '');
    this.currentDate.set(this.datePipe.transform(now, 'EEEE, MMMM d, yyyy') || '');
  }

  // Punch Functions
  async handlePunch(type: 'checkin' | 'checkout' | 'breakstart' | 'breakend') {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    
    try {
      // Map UI types to API types
      const apiType = this.mapPunchType(type);
      
      const punchData: AttendancePunchData = {
        type: apiType,
        latitude: this.currentLatitude(),
        longitude: this.currentLongitude(),
        accuracy: this.locationAccuracy(),
        notes: this.punchNotes(),
        deviceId: this.getDeviceId()
      };

      const response = await this.attendanceService.markAttendance(punchData).toPromise();
      
      if (response?.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${this.getPunchLabel(type)} recorded successfully`
        });
        
        this.punchNotes.set('');
        await this.loadTodayActivity();
        await this.loadPunchHistory();
      } else {
        throw new Error(response?.message || 'Failed to record punch');
      }
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to record punch'
      });
    } finally {
      this.isLoading.set(false);
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
    // Generate a unique device ID or use browser fingerprint
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    
    // Create a simple device ID hash
    return btoa(`${userAgent}-${platform}-${language}`).substring(0, 32);
  }

  // Location Functions
  async detectLocation() {
    if (!navigator.geolocation) {
      this.locationDetected.set('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy;
      
      this.currentLatitude.set(lat);
      this.currentLongitude.set(lng);
      this.locationAccuracy.set(acc);
      
      this.locationDetected.set(`${lat.toFixed(4)}, ${lng.toFixed(4)} (Accuracy: ${acc.toFixed(0)}m)`);
    } catch (error: any) {
      console.error('Location error:', error);
      this.locationDetected.set('Location detection failed: ' + (error.message || 'Unknown error'));
      
      // Fallback to IP-based location or manual entry
      this.getApproximateLocation();
    }
  }

  private async getApproximateLocation() {
    try {
      // You could use a free IP geolocation service here
      // Example: ipapi.co or ipinfo.io
      // For now, we'll set a default message
      this.locationDetected.set('Using approximate location (IP-based)');
    } catch (error) {
      this.locationDetected.set('Location unavailable');
    }
  }

  // Data Loading Functions
  async loadTodayActivity() {
    this.isLoading.set(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const filterParams: AttendanceFilter = {
        startDate: today,
        endDate: today,
        limit: 50
      };

      const response = await this.attendanceService.getMyAttendance(filterParams).toPromise();
      
      if (response?.data && response.data.length > 0) {
        const todayRecord = response.data[0];
        
        // Update today's summary
        this.todaySummary.set({
          totalHours: todayRecord.totalHours || 0,
          breakHours: todayRecord.breakHours || 0,
          overtimeHours: todayRecord.overtimeHours || 0,
          lateMinutes: todayRecord.lateMinutes || 0,
          shiftStart: this.attendanceService.formatPunchTime(todayRecord.shiftStart) || '--:--',
          lastPunch: todayRecord.lastPunch ? this.attendanceService.formatPunchTime(todayRecord.lastPunch) : '--:--',
          nextBreakIn: '--:--', // This would need to be calculated based on break rules
          firstIn: todayRecord.firstIn,
          lastOut: todayRecord.lastOut
        });
        
        // Load activity from punch logs if available
        if (todayRecord.punchLogs) {
          const activities: PunchActivity[] = todayRecord.punchLogs.map((log: any) => ({
            id: log._id || log.id,
            type: log.type,
            time: this.attendanceService.formatPunchTime(log.time),
            notes: log.notes,
            location: log.location
          }));
          this.todayActivity.set(activities);
        }
      }
    } catch (error) {
      console.error('Failed to load today activity:', error);
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Unable to load today\'s activity. Using local data.'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPunchHistory() {
    this.isLoading.set(true);
    try {
      // Calculate date range based on selected option
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

      const response = await this.attendanceService.getMyAttendance(filterParams).toPromise();
      
      if (response?.data) {
        const history: PunchHistory[] = response.data.map((record: any) => ({
          id: record._id || record.id,
          date: new Date(record.date),
          checkIn: record.firstIn ? this.attendanceService.formatPunchTime(record.firstIn) : '--:--',
          checkOut: record.lastOut ? this.attendanceService.formatPunchTime(record.lastOut) : '--:--',
          breakCount: record.breakCount || 0,
          totalHours: record.totalHours || 0,
          status: record.status || 'unknown'
        }));
        
        this.punchHistory.set(history);
      }
    } catch (error) {
      console.error('Failed to load punch history:', error);
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Unable to load punch history'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // UI Helper Functions
  getPunchLabel(type: string): string {
    switch (type) {
      case 'checkin': return 'Check In';
      case 'checkout': return 'Check Out';
      case 'breakstart': return 'Break Start';
      case 'breakend': return 'Break End';
      default: return 'Punch';
    }
  }

  
  // getActivityLabel(type: string): string {
  //   switch (type) {
  //     case 'in': return 'Check In';
  //     case 'out': return 'Check Out';
  //     case 'break_start': return 'Break Start';
  //     case 'break_end': return 'Break End';
  //     default: return type;
  //   }
  // }

  // getActivityIcon(type: string): string {
  //   switch (type) {
  //     case 'in': return 'pi pi-sign-in';
  //     case 'out': return 'pi pi-sign-out';
  //     case 'break_start': return 'pi pi-coffee';
  //     case 'break_end': return 'pi pi-play';
  //     default: return 'pi pi-clock';
  //   }
  // }

  getPunchTypeSeverity(type: string): string {
    switch (type) {
      case 'wfh': return 'info';
      case 'onduty': return 'warn';
      case 'field': return 'help';
      default: return 'primary';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'absent':
        return 'bg-red-100 text-red-700';
      case 'late':
        return 'bg-yellow-100 text-yellow-700';
      case 'half_day':
        return 'bg-blue-100 text-blue-700';
      case 'on_leave':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  // Emergency Functions
  async submitEmergencyRequest() {
    if (!this.emergencyIssueType() || !this.emergencyDescription()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    try {
      // In a real implementation, you would call a service method
      // For now, we'll simulate the request
      const requestData = {
        targetDate: new Date().toISOString().split('T')[0],
        type: 'others' as const,
        reason: `[${this.emergencyIssueType()}] ${this.emergencyDescription()}`,
        urgency: this.urgentRequest() ? 'high' : 'medium' as const
      };

      // This would be the actual service call
      // const response = await this.attendanceService.submitRegularization(requestData).toPromise();
      
      // Simulate success
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Emergency request submitted successfully'
        });
        
        this.showEmergencyDialog = false
        this.emergencyIssueType.set('');
        this.emergencyDescription.set('');
        this.urgentRequest.set(false);
      }, 1000);
      
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit emergency request'
      });
    }
  }

  // Navigation Functions
  viewHistory() {
    // Navigate to full history page
    console.log('Navigate to full history');
  }

  viewPunchDetails(record: PunchHistory) {
    console.log('View punch details:', record);
    // Show detailed modal or navigate to details page
  }

  // Get current status from attendance service
  async checkCurrentStatus() {
    try {
      const response = await this.attendanceService.hasPunchedInToday().toPromise();
      if (response?.hasPunchedIn) {
        console.log('User has punched in today at:', response.lastPunch);
      } else {
        console.log('User has not punched in today');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }

  // Format time for display
  formatTime(time: string | undefined): string {
    if (!time) return '--:--';
    return this.attendanceService.formatPunchTime(time);
  }




  // Update the PunchActivity interface and helper methods



// Update the getActivityLabel method to handle both API and UI types
getActivityLabel(type: string): string {
  switch (type) {
    case 'in':
    case 'checkin': 
      return 'Check In';
    case 'out':
    case 'checkout': 
      return 'Check Out';
    case 'break_start':
    case 'breakstart': 
      return 'Break Start';
    case 'break_end':
    case 'breakend': 
      return 'Break End';
    default: 
      return type;
  }
}

// Update the getActivityIcon method
getActivityIcon(type: string): string {
  switch (type) {
    case 'in':
    case 'checkin': 
      return 'pi pi-sign-in';
    case 'out':
    case 'checkout': 
      return 'pi pi-sign-out';
    case 'break_start':
    case 'breakstart': 
      return 'pi pi-coffee';
    case 'break_end':
    case 'breakend': 
      return 'pi pi-play';
    default: 
      return 'pi pi-clock';
  }
}

// Add helper method to get activity CSS class
getActivityClass(type: string): string {
  switch (type) {
    case 'in':
    case 'checkin': 
      return 'bg-green-100 text-green-600';
    case 'out':
    case 'checkout': 
      return 'bg-red-100 text-red-600';
    case 'break_start':
    case 'breakstart': 
      return 'bg-orange-100 text-orange-600';
    case 'break_end':
    case 'breakend': 
      return 'bg-purple-100 text-purple-600';
    default: 
      return 'bg-gray-100 text-gray-600';
  }
}

// Helper method to check if type is a specific activity
isActivityType(type: string, checkType: 'checkin' | 'checkout' | 'breakstart' | 'breakend'): boolean {
  const typeMap = {
    checkin: 'in',
    checkout: 'out',
    breakstart: 'break_start',
    breakend: 'break_end'
  };
  
  return type === typeMap[checkType];
}

}


// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-attendance-punching.component',
// //   imports: [],
// //   templateUrl: './attendance-punching.component.html',
// //   styleUrl: './attendance-punching.component.scss',
// // })
// // export class AttendancePunchingComponent {

// // }
// import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MessageService } from 'primeng/api';

// // PrimeNG Components
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { TableModule } from 'primeng/table';
// import { DialogModule } from 'primeng/dialog';
// import { SelectModule } from 'primeng/select';
// import { CheckboxModule } from 'primeng/checkbox';
// // import { InputTextareaModule } from 'primeng/inputtextarea';

// // Services
// import { AttendanceService } from '../services/attendance.service';
// import { AuthService } from '../services/.service';

// // Interfaces
// interface PunchActivity {
//   id: string;
//   type: 'checkin' | 'checkout' | 'breakstart' | 'breakend';
//   time: string;
//   notes?: string;
//   location?: string;
// }

// interface PunchHistory {
//   id: string;
//   date: Date;
//   checkIn: string;
//   checkOut: string;
//   breakCount: number;
//   totalHours: number;
//   status: string;
// }

// interface TodaySummary {
//   totalHours: number;
//   breakHours: number;
//   overtimeHours: number;
//   lateMinutes: number;
//   shiftStart: string;
//   lastPunch: string;
//   nextBreakIn: string;
// }

// interface PunchType {
//   label: string;
//   value: string;
//   icon: string;
// }

// interface EmergencyIssueType {
//   label: string;
//   value: string;
// }

// @Component({
//   selector: 'app-attendance-punching',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     ToastModule,
//     TableModule,
//     DialogModule,
//     SelectModule,
//     CheckboxModule,
//     InputTextareaModule
//   ],
//   providers: [MessageService, DatePipe],
//   templateUrl: './attendance-punching.component.html'
// })
// export class AttendancePunchingComponent implements OnInit {
//   private attendanceService = inject(AttendanceService);
//   private authService = inject(AuthService);
//   private messageService = inject(MessageService);
//   private datePipe = inject(DatePipe);

//   // State
//   isLoading = signal(false);
//   currentTime = signal('');
//   currentDate = signal('');
//   showEmergencyDialog = signal(false);
  
//   // User Data
//   currentUser = computed(() => this.authService.currentUser());
  
//   // Punch Data
//   todayActivity = signal<PunchActivity[]>([]);
//   punchHistory = signal<PunchHistory[]>([]);
//   todaySummary = signal<TodaySummary>({
//     totalHours: 0,
//     breakHours: 0,
//     overtimeHours: 0,
//     lateMinutes: 0,
//     shiftStart: '--:--',
//     lastPunch: '--:--',
//     nextBreakIn: '--:--'
//   });
  
//   // Punch Controls
//   selectedPunchType = signal<string>('regular');
//   punchNotes = signal('');
//   locationDetected = signal<string>('');
  
//   // Emergency Request
//   emergencyIssueType = signal<string>('');
//   emergencyDescription = signal('');
//   urgentRequest = signal(false);
  
//   // Options
//   historyRange = signal('7days');
//   historyRangeOptions = signal([
//     { label: 'Last 7 Days', value: '7days' },
//     { label: 'Last 30 Days', value: '30days' },
//     { label: 'This Month', value: 'month' },
//     { label: 'Custom Range', value: 'custom' }
//   ]);
  
//   emergencyIssueTypes = signal<EmergencyIssueType[]>([
//     { label: 'System Error', value: 'system_error' },
//     { label: 'Forgot to Punch', value: 'forgot_punch' },
//     { label: 'Location Issue', value: 'location_issue' },
//     { label: 'Time Correction', value: 'time_correction' },
//     { label: 'Other', value: 'other' }
//   ]);
  
//   punchTypes = signal<PunchType[]>([
//     { label: 'Regular', value: 'regular', icon: 'pi pi-clock' },
//     { label: 'Work From Home', value: 'wfh', icon: 'pi pi-home' },
//     { label: 'On Duty', value: 'onduty', icon: 'pi pi-car' },
//     { label: 'Field Work', value: 'field', icon: 'pi pi-map-marker' }
//   ]);

//   // Computed properties
//   canCheckIn = computed(() => {
//     const activity = this.todayActivity();
//     const lastPunch = activity[activity.length - 1];
//     return !lastPunch || lastPunch.type === 'checkout';
//   });

//   canCheckOut = computed(() => {
//     const activity = this.todayActivity();
//     const lastPunch = activity[activity.length - 1];
//     return lastPunch?.type === 'checkin' || lastPunch?.type === 'breakend';
//   });

//   canStartBreak = computed(() => {
//     const activity = this.todayActivity();
//     const lastPunch = activity[activity.length - 1];
//     return lastPunch?.type === 'checkin' || lastPunch?.type === 'breakend';
//   });

//   canEndBreak = computed(() => {
//     const activity = this.todayActivity();
//     const lastPunch = activity[activity.length - 1];
//     return lastPunch?.type === 'breakstart';
//   });

//   getCurrentStatus = computed(() => {
//     const activity = this.todayActivity();
//     if (activity.length === 0) return 'out';
    
//     const lastPunch = activity[activity.length - 1];
//     switch (lastPunch.type) {
//       case 'checkin':
//       case 'breakend':
//         return 'working';
//       case 'breakstart':
//         return 'break';
//       case 'checkout':
//         return 'out';
//       default:
//         return 'out';
//     }
//   });

//   getCurrentStatusText = computed(() => {
//     const status = this.getCurrentStatus();
//     switch (status) {
//       case 'working': return 'Working';
//       case 'break': return 'On Break';
//       case 'out': return 'Not Checked In';
//       default: return 'Unknown';
//     }
//   });

//   constructor() {
//     // Update time every second
//     effect(() => {
//       this.updateDateTime();
//     });
//   }

//   ngOnInit() {
//     this.startClock();
//     this.loadTodayActivity();
//     this.loadPunchHistory();
//     this.detectLocation();
//   }

//   // Time Functions
//   startClock() {
//     setInterval(() => {
//       this.updateDateTime();
//     }, 1000);
//   }

//   updateDateTime() {
//     const now = new Date();
//     this.currentTime.set(this.datePipe.transform(now, 'HH:mm:ss') || '');
//     this.currentDate.set(this.datePipe.transform(now, 'EEEE, MMMM d, yyyy') || '');
//   }

//   // Punch Functions
//   async handlePunch(type: 'checkin' | 'checkout' | 'breakstart' | 'breakend') {
//     if (this.isLoading()) return;

//     this.isLoading.set(true);
    
//     try {
//       const punchData = {
//         type: type,
//         punchType: this.selectedPunchType(),
//         notes: this.punchNotes(),
//         location: this.locationDetected(),
//         timestamp: new Date().toISOString()
//       };

//       const response = await this.attendanceService.recordPunch(punchData).toPromise();
      
//       if (response?.success) {
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Success',
//           detail: `${this.getPunchLabel(type)} recorded successfully`
//         });
        
//         this.punchNotes.set('');
//         await this.loadTodayActivity();
//       } else {
//         throw new Error(response?.message || 'Failed to record punch');
//       }
//     } catch (error: any) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Error',
//         detail: error.message || 'Failed to record punch'
//       });
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   // Location Functions
//   async detectLocation() {
//     if (!navigator.geolocation) {
//       this.locationDetected.set('Geolocation not supported');
//       return;
//     }

//     try {
//       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 5000,
//           maximumAge: 0
//         });
//       });

//       const location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
//       this.locationDetected.set(location);
//     } catch (error) {
//       console.error('Location error:', error);
//       this.locationDetected.set('Location detection failed');
//     }
//   }

//   // Data Loading Functions
//   async loadTodayActivity() {
//     this.isLoading.set(true);
//     try {
//       const response = await this.attendanceService.getTodayActivity().toPromise();
//       this.todayActivity.set(response?.data?.activities || []);
//       this.todaySummary.set(response?.data?.summary || this.todaySummary());
//     } catch (error) {
//       console.error('Failed to load today activity:', error);
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   async loadPunchHistory() {
//     this.isLoading.set(true);
//     try {
//       const response = await this.attendanceService.getPunchHistory({
//         range: this.historyRange()
//       }).toPromise();
//       this.punchHistory.set(response?.data || []);
//     } catch (error) {
//       console.error('Failed to load punch history:', error);
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   // UI Helper Functions
//   getPunchLabel(type: string): string {
//     switch (type) {
//       case 'checkin': return 'Check In';
//       case 'checkout': return 'Check Out';
//       case 'breakstart': return 'Break Start';
//       case 'breakend': return 'Break End';
//       default: return 'Punch';
//     }
//   }

//   getActivityLabel(type: string): string {
//     return this.getPunchLabel(type);
//   }

//   getActivityIcon(type: string): string {
//     switch (type) {
//       case 'checkin': return 'pi pi-sign-in';
//       case 'checkout': return 'pi pi-sign-out';
//       case 'breakstart': return 'pi pi-coffee';
//       case 'breakend': return 'pi pi-play';
//       default: return 'pi pi-clock';
//     }
//   }

//   getPunchTypeSeverity(type: string): string {
//     switch (type) {
//       case 'wfh': return 'info';
//       case 'onduty': return 'warning';
//       case 'field': return 'help';
//       default: return 'primary';
//     }
//   }

//   getStatusClass(status: string): string {
//     switch (status?.toLowerCase()) {
//       case 'present':
//       case 'completed':
//         return 'bg-green-100 text-green-700';
//       case 'absent':
//       case 'missed':
//         return 'bg-red-100 text-red-700';
//       case 'late':
//         return 'bg-yellow-100 text-yellow-700';
//       case 'halfday':
//         return 'bg-blue-100 text-blue-700';
//       default:
//         return 'bg-gray-100 text-gray-700';
//     }
//   }

//   // Emergency Functions
//   async submitEmergencyRequest() {
//     if (!this.emergencyIssueType() || !this.emergencyDescription()) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Validation',
//         detail: 'Please fill in all required fields'
//       });
//       return;
//     }

//     try {
//       const requestData = {
//         issueType: this.emergencyIssueType(),
//         description: this.emergencyDescription(),
//         urgent: this.urgentRequest(),
//         timestamp: new Date().toISOString()
//       };

//       const response = await this.attendanceService.submitEmergencyRequest(requestData).toPromise();
      
//       if (response?.success) {
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Success',
//           detail: 'Emergency request submitted successfully'
//         });
        
//         this.showEmergencyDialog.set(false);
//         this.emergencyIssueType.set('');
//         this.emergencyDescription.set('');
//         this.urgentRequest.set(false);
//       }
//     } catch (error) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Failed to submit emergency request'
//       });
//     }
//   }

//   // Navigation Functions
//   viewHistory() {
//     // Navigate to full history page
//     console.log('Navigate to full history');
//   }

//   viewPunchDetails(record: PunchHistory) {
//     console.log('View punch details:', record);
//     // Show detailed modal
//   }
// }