import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToolbarModule } from 'primeng/toolbar';
import { Tabs, TabsModule, TabPanel, TabList, Tab, TabPanels } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AttendanceService } from '../services/attendance.service';

import { AuthService } from '../../auth/services/auth-service';
import { AppMessageService } from '../../../core/services/message.service';
import { LoadingService } from '../../../core/services/loading.service';
import { Severity, CommonMethodService } from '../../../core/utils/common-method.service';

// Interfaces
interface AttendanceFilter {
  startDate: string;
  endDate: string;
  department: string;
  status: string[];
  branchId: string;
  includeSubordinates: boolean;
  page?: number;
  limit?: number;
}

interface RequestType {
  label: string;
  value: string;
  severity: Severity;
  icon: string;
}

@Component({
  selector: 'app-attendance-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    Tabs,
    ToolbarModule,
    CheckboxModule,
    TooltipModule,
    TabPanel,
    TabList,
    Tab,
    TabPanels
],
  providers: [ConfirmationService, DatePipe],
  templateUrl: './attendance-manager.component.html'
})
export class AttendanceManagerComponent implements OnInit {
  // Services
  private attendanceService = inject(AttendanceService);
  public commonService = inject(CommonMethodService);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private appMessageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  // State
  activeTab = signal(0);
  isLoading = signal(false);
  isLiveUpdating = signal(false);
  
  // Data
  pendingRequests = signal<any[]>([]);
  teamAttendance = signal<any[]>([]);
  liveAttendance = signal<any[]>([]);
  currentUser = signal<any>(null);
  
  // Filters
  filters:any = signal<AttendanceFilter>({
    startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
    endDate: this.getDateString(new Date()),
    department: '',
    status: [],
    branchId: '',
    includeSubordinates: true,
    page: 1,
    limit: 10
  });

  // Pagination
  totalRecords = signal(0);
  currentPage = signal(1);
  rowsPerPage = signal(10);

  // Request Types with Severity
  requestTypes = signal<RequestType[]>([
    { label: 'Missed Punch', value: 'missed_punch', severity: 'danger', icon: 'pi pi-clock' },
    { label: 'Correction', value: 'correction', severity: 'warn', icon: 'pi pi-pencil' },
    { label: 'Work From Home', value: 'work_from_home', severity: 'info', icon: 'pi pi-home' },
    { label: 'On Duty', value: 'on_duty', severity: 'secondary', icon: 'pi pi-car' },
    { label: 'Leave Reversal', value: 'leave_reversal', severity: 'success', icon: 'pi pi-calendar-plus' },
    { label: 'Others', value: 'others', severity: 'contrast', icon: 'pi pi-question-circle' }
  ]);

  // Departments
  departments = signal([
    { label: 'All Departments', value: '' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'HR', value: 'hr' },
    { label: 'Operations', value: 'operations' },
    { label: 'Finance', value: 'finance' },
    { label: 'Customer Support', value: 'customer_support' }
  ]);

  // Status Options with Severity
  statusOptions = signal([
    { label: 'Present', value: 'present', severity: 'success' },
    { label: 'Absent', value: 'absent', severity: 'danger' },
    { label: 'Late', value: 'late', severity: 'warn' },
    { label: 'Half Day', value: 'half_day', severity: 'info' },
    { label: 'On Leave', value: 'on_leave', severity: 'secondary' },
    { label: 'Holiday', value: 'holiday', severity: 'contrast' }
  ]);

  // Computed properties
  getCurrentlyWorking = computed(() => {
    return this.liveAttendance().filter(a => 
      a.status === 'present' && !a.lastOut
    ).length;
  });

  getOnBreak = computed(() => {
    return this.liveAttendance().filter(a => 
      a.isOnBreak || a.breakStart && !a.breakEnd
    ).length;
  });

  getNotCheckedIn = computed(() => {
    const currentHour = new Date().getHours();
    return this.liveAttendance().filter(a => 
      !a.firstIn && currentHour >= 10 // After 10 AM
    ).length;
  });

  getWFHCount = computed(() => {
    return this.liveAttendance().filter(a => 
      a.workType === 'wfh'
    ).length;
  });

  // Export Options
  exportOptions = signal({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    format: 'excel' as const,
    branchId: '',
    department: ''
  });

  ngOnInit() {
    this.loadCurrentUser();
    this.loadInitialData();
    this.startLiveUpdates();
  }

  // Helper Methods
  private getDateString(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  private loadCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser.set(user);
      });
  }

  private loadInitialData() {
    switch (this.activeTab()) {
      case 0:
        this.loadPendingRequests();
        break;
      case 1:
        this.loadTeamAttendance();
        break;
      case 2:
        this.loadLiveAttendance();
        break;
    }
  }

  // Tab Navigation
  onTabChange(event: any) {
    this.activeTab.set(event);
    this.loadInitialData();
  }

  // Load Pending Requests
  loadPendingRequests() {
    const filters = this.filters();
    const requestFilters = {
      ...filters,
      status: filters.status.join(',')
    };

    this.commonService.apiCall(
      this.attendanceService.getPendingRequests(requestFilters),
      (response) => {
        this.pendingRequests.set(response.data || []);
        this.totalRecords.set(response.total || 0);
      },
      'Load Pending Requests'
    );
  }

  // Load Team Attendance
  loadTeamAttendance() {
    const filters = this.filters();
    const teamFilters = {
      ...filters,
      date: this.getDateString(new Date()), // Default to today
      status: filters.status.join(',')
    };

    this.commonService.apiCall(
      this.attendanceService.getTeamAttendance(teamFilters),
      (response) => {
        this.teamAttendance.set(response.data || []);
      },
      'Load Team Attendance'
    );
  }

  // Load Live Attendance
  loadLiveAttendance() {
    this.isLiveUpdating.set(true);
    const filters = this.filters();

    this.commonService.apiCall(
      this.attendanceService.getLiveAttendance(filters),
      (response) => {
        this.liveAttendance.set(response.data || []);
        this.isLiveUpdating.set(false);
      },
      'Load Live Attendance'
    );
  }

  // Start Live Updates
  private startLiveUpdates() {
    // Poll every 30 seconds for live data
    setInterval(() => {
      if (this.activeTab() === 2) {
        this.loadLiveAttendance();
      }
    }, 30000);
  }

  // Handle Request Approval/Rejection
  handleRequest(requestId: string, status: 'approved' | 'rejected') {
    const message = status === 'approved' 
      ? 'Approve this attendance request?' 
      : 'Reject this attendance request?';
    const severity = status === 'approved' ? 'success' : 'danger';

    this.confirmationService.confirm({
      message: message,
      header: 'Confirm Action',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.commonService.apiCall(
          this.attendanceService.decideRegularization(requestId, { status }),
          () => {
            this.appMessageService.showSuccess(
              'Success',
              `Request ${status} successfully`
            );
            this.loadPendingRequests();
          },
          `${status.charAt(0).toUpperCase() + status.slice(1)} Request`
        );
      }
    });
  }

  // Apply Filters
  applyFilters() {
    // Reset to first page when filters change
    this.currentPage.set(1);
    this.loadInitialData();
  }

  // Reset Filters
  resetFilters() {
    this.filters.set({
      startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
      endDate: this.getDateString(new Date()),
      department: '',
      status: [],
      branchId: '',
      includeSubordinates: true,
      page: 1,
      limit: 10
    });
    this.loadInitialData();
  }

  // Export Data
  exportData() {
    const options = {
      ...this.exportOptions(),
      startDate: this.getDateString(this.exportOptions().startDate),
      endDate: this.getDateString(this.exportOptions().endDate)
    };

    this.commonService.apiCall(
      this.attendanceService.exportAttendance(options),
      (blob) => {
        const filename = `attendance_export_${options.startDate}_to_${options.endDate}.${options.format}`;
        this.commonService.downloadBlob(blob, filename);
        this.appMessageService.showSuccess(
          'Exported',
          'Attendance data exported successfully'
        );
      },
      'Export Attendance Data'
    );
  }

  // Format Time
  formatTime(time: string | undefined): string {
    return this.commonService.formatPunchTime(time);
  }

  // Get Request Type Severity
  getRequestTypeSeverity(type: string): Severity {
    const requestType = this.requestTypes().find(t => t.value === type);
    return requestType?.severity || 'secondary';
  }

  // Get Status Severity
  getStatusSeverity(status: string): Severity {
    return this.commonService.mapAttendanceStatusToSeverity(status);
  }

  // Get Status Class
  getStatusClass(status: string): string {
    return this.commonService.getAttendanceStatusClass(status);
  }

  // Get Status Text
  getStatusText(status: string): string {
    return this.commonService.getAttendanceStatusText(status);
  }

  // Get Request Type Text
  getRequestTypeText(type: string): string {
    const requestType = this.requestTypes().find(t => t.value === type);
    return requestType?.label || type.replace('_', ' ');
  }

  // Get Request Type Icon
  getRequestTypeIcon(type: string): string {
    const requestType = this.requestTypes().find(t => t.value === type);
    return requestType?.icon || 'pi pi-question-circle';
  }

  // Pagination
  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.filters.update((filters:any) => ({
      ...filters,
      page: event.page + 1,
      limit: event.rows
    }));
    this.loadInitialData();
  }

  // View Request Details
  viewRequestDetails(request: any) {
    console.log('View request details:', request);
    // Implement modal or navigation to details page
  }

  // View Employee Profile
  viewEmployeeProfile(employeeId: string) {
    console.log('View employee profile:', employeeId);
    // Implement navigation to employee profile
  }

  // Get Employee Initials
  getEmployeeInitials(name: string): string {
    return this.commonService.getInitials(name);
  }

  // Format Date
  formatDate(date: string | Date): string {
    return this.commonService.formatDate(date, 'dd MMM yyyy');
  }

  // Get Employee Avatar Color
  getEmployeeColor(name: string): string {
    return this.commonService.stringToColor(name);
  }

  // Get Status Badge HTML
  getStatusBadgeHtml(status: string): string {
    return this.commonService.attendanceStatusBadgeHtml(status);
  }
}

// // attendance-manager.component.ts
// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ConfirmationService, MessageService } from 'primeng/api';

// // PrimeNG Components
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToolbarModule } from 'primeng/toolbar';
// import { TabsModule } from 'primeng/tabs';
// import { SelectModule } from 'primeng/select';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TooltipModule } from 'primeng/tooltip';

// // Services
// import { AttendanceService } from '../services/attendance.service';

// // Interfaces
// interface AttendanceFilter {
//   startDate: string;
//   endDate: string;
//   department: string;
//   status: string;
//   branchId: string;
//   includeSubordinates: boolean;
// }

// @Component({
//   selector: 'app-attendance-manager',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     ButtonModule,
//     ToastModule,
//     ConfirmDialogModule,
//     InputTextModule,
//     SelectModule,
//     MultiSelectModule,
//     TabsModule,
//     ToolbarModule,
//     CheckboxModule,
//     TooltipModule
//   ],
//   providers: [MessageService, ConfirmationService, DatePipe],
//   templateUrl: './attendance-manager.component.html'
// })
// export class AttendanceManagerComponent implements OnInit {
// onTabChange($event: string|number|undefined) {
// throw new Error('Method not implemented.');
// }
//   public attendanceService = inject(AttendanceService);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);
//   private datePipe = inject(DatePipe);

//   // State
//   activeTab = signal(0);
//   isLoading = signal(false);
  
//   // Data
//   pendingRequests = signal<any[]>([]);
//   teamAttendance = signal<any[]>([]);
//   liveAttendance = signal<any[]>([]);
  
//   // Filters with string dates to match API expectations
//   filters:any = signal<AttendanceFilter>({
//     startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
//     endDate: this.formatDate(new Date()),
//     department: '',
//     status: '',
//     branchId: '',
//     includeSubordinates: true
//   });

//   // Export Options
//   exportOptions = signal({
//     startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
//     endDate: new Date(),
//     format: 'excel' as const,
//     branchId: '',
//     department: ''
//   });

//   // Departments
//   departments = signal([
//     { label: 'All Departments', value: '' },
//     { label: 'Engineering', value: 'engineering' },
//     { label: 'Sales', value: 'sales' },
//     { label: 'Marketing', value: 'marketing' },
//     { label: 'HR', value: 'hr' },
//     { label: 'Operations', value: 'operations' }
//   ]);

//   // Status Options
//   statusOptions = signal([
//     { label: 'All Status', value: '' },
//     { label: 'Present', value: 'present' },
//     { label: 'Absent', value: 'absent' },
//     { label: 'Late', value: 'late' },
//     { label: 'Half Day', value: 'half_day' },
//     { label: 'On Leave', value: 'on_leave' }
//   ]);

//   // Computed properties for live monitoring cards (fixes the filter assignment error)
//   getCurrentlyWorking = computed(() => {
//     return this.liveAttendance().filter(a => a.firstIn && !a.lastOut).length;
//   });

//   getOnBreak = computed(() => {
//     return this.liveAttendance().filter(a => a.breakStart && !a.breakEnd).length;
//   });

//   getNotCheckedIn = computed(() => {
//     return this.liveAttendance().filter(a => !a.firstIn).length;
//   });

//   getWFHCount = computed(() => {
//     return this.liveAttendance().filter(a => a.isWFH).length;
//   });

//   ngOnInit() {
//     this.loadPendingRequests();
//     this.loadTeamAttendance();
//     this.startLiveUpdates();
//   }

//   // Helper method to format dates as strings
//   private formatDate(date: Date): string {
//     return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
//   }

//   // Load Pending Requests
//   loadPendingRequests() {
//     this.isLoading.set(true);
//     this.attendanceService.getPendingRequests(this.filters())
//       .subscribe({
//         next: (res) => {
//           this.pendingRequests.set(res.data || []);
//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Error',
//             detail: 'Failed to load pending requests'
//           });
//           this.isLoading.set(false);
//         }
//       });
//   }

//   // Load Team Attendance
//   loadTeamAttendance() {
//     this.attendanceService.getTeamAttendance(this.filters())
//       .subscribe({
//         next: (res) => {
//           this.teamAttendance.set(res.data || []);
//         },
//         error: (err) => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Error',
//             detail: 'Failed to load team attendance'
//           });
//         }
//       });
//   }

//   // Live Attendance Updates
//   startLiveUpdates() {
//     // Poll every 30 seconds for live data
//     setInterval(() => {
//       this.attendanceService.getLiveAttendance(this.filters())
//         .subscribe({
//           next: (res) => this.liveAttendance.set(res.data || []),
//           error: (err) => console.error('Live update error:', err)
//         });
//     }, 30000);

//     // Initial load
//     this.attendanceService.getLiveAttendance(this.filters())
//       .subscribe({
//         next: (res) => this.liveAttendance.set(res.data || [])
//       });
//   }

//   // Approve/Reject Request
//   handleRequest(requestId: string, status: 'approved' | 'rejected') {
//     const message = status === 'approved' 
//       ? 'Approve this request?' 
//       : 'Reject this request?';
    
//     this.confirmationService.confirm({
//       message: message,
//       header: 'Confirm Action',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.attendanceService.decideRegularization(requestId, { status })
//           .subscribe({
//             next: () => {
//               this.messageService.add({
//                 severity: 'success',
//                 summary: 'Success',
//                 detail: `Request ${status} successfully`
//               });
//               this.loadPendingRequests();
//             },
//             error: (err) => {
//               this.messageService.add({
//                 severity: 'error',
//                 summary: 'Error',
//                 detail: err.error?.message || 'Action failed'
//               });
//             }
//           });
//       }
//     });
//   }

//   // Apply Filters
//   applyFilters() {
//     // Convert Date objects to strings for API
//     const currentFilters = this.filters();
//     this.filters.set({
//       ...currentFilters,
//       startDate: currentFilters.startDate instanceof Date 
//         ? this.formatDate(currentFilters.startDate)
//         : currentFilters.startDate,
//       endDate: currentFilters.endDate instanceof Date
//         ? this.formatDate(currentFilters.endDate)
//         : currentFilters.endDate
//     });

//     if (this.activeTab() === 0) {
//       this.loadPendingRequests();
//     } else if (this.activeTab() === 1) {
//       this.loadTeamAttendance();
//     }
//   }

//   // Reset Filters
//   resetFilters() {
//     this.filters.set({
//       startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
//       endDate: this.formatDate(new Date()),
//       department: '',
//       status: '',
//       branchId: '',
//       includeSubordinates: true
//     });
//     this.applyFilters();
//   }

//   // Export Data
//   exportData() {
//     const options = {
//       ...this.exportOptions(),
//       startDate: this.datePipe.transform(this.exportOptions().startDate, 'yyyy-MM-dd')!,
//       endDate: this.datePipe.transform(this.exportOptions().endDate, 'yyyy-MM-dd')!
//     };

//     this.attendanceService.exportAttendance(options)
//       .subscribe({
//         next: (blob) => {
//           const url = window.URL.createObjectURL(blob);
//           const a = document.createElement('a');
//           a.href = url;
//           a.download = `attendance_export_${options.startDate}_to_${options.endDate}.${options.format}`;
//           a.click();
//           window.URL.revokeObjectURL(url);
          
//           this.messageService.add({
//             severity: 'success',
//             summary: 'Exported',
//             detail: 'Attendance data exported successfully'
//           });
//         },
//         error: (err) => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Export Failed',
//             detail: err.error?.message || 'Export failed'
//           });
//         }
//       });
//   }

//   // Get Status Badge Class
//   getStatusClass(status: string): string {
//     return this.attendanceService.getStatusBadgeClass(status);
//   }

//   // Format Time
//   formatTime(time: string): string {
//     return time ? this.attendanceService.formatPunchTime(time) : '--:--';
//   }
// }