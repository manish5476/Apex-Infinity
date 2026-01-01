// attendance-manager.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToolbarModule } from 'primeng/toolbar';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AttendanceService } from '../services/attendance.service';

// Interfaces
interface AttendanceFilter {
  startDate: string;
  endDate: string;
  department: string;
  status: string;
  branchId: string;
  includeSubordinates: boolean;
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
    TabsModule,
    ToolbarModule,
    CheckboxModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './attendance-manager.component.html'
})
export class AttendanceManagerComponent implements OnInit {
onTabChange($event: string|number|undefined) {
throw new Error('Method not implemented.');
}
  public attendanceService = inject(AttendanceService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private datePipe = inject(DatePipe);

  // State
  activeTab = signal(0);
  isLoading = signal(false);
  
  // Data
  pendingRequests = signal<any[]>([]);
  teamAttendance = signal<any[]>([]);
  liveAttendance = signal<any[]>([]);
  
  // Filters with string dates to match API expectations
  filters:any = signal<AttendanceFilter>({
    startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
    endDate: this.formatDate(new Date()),
    department: '',
    status: '',
    branchId: '',
    includeSubordinates: true
  });

  // Export Options
  exportOptions = signal({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    format: 'excel' as const,
    branchId: '',
    department: ''
  });

  // Departments
  departments = signal([
    { label: 'All Departments', value: '' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'HR', value: 'hr' },
    { label: 'Operations', value: 'operations' }
  ]);

  // Status Options
  statusOptions = signal([
    { label: 'All Status', value: '' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'On Leave', value: 'on_leave' }
  ]);

  // Computed properties for live monitoring cards (fixes the filter assignment error)
  getCurrentlyWorking = computed(() => {
    return this.liveAttendance().filter(a => a.firstIn && !a.lastOut).length;
  });

  getOnBreak = computed(() => {
    return this.liveAttendance().filter(a => a.breakStart && !a.breakEnd).length;
  });

  getNotCheckedIn = computed(() => {
    return this.liveAttendance().filter(a => !a.firstIn).length;
  });

  getWFHCount = computed(() => {
    return this.liveAttendance().filter(a => a.isWFH).length;
  });

  ngOnInit() {
    this.loadPendingRequests();
    this.loadTeamAttendance();
    this.startLiveUpdates();
  }

  // Helper method to format dates as strings
  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  // Load Pending Requests
  loadPendingRequests() {
    this.isLoading.set(true);
    this.attendanceService.getPendingRequests(this.filters())
      .subscribe({
        next: (res) => {
          this.pendingRequests.set(res.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load pending requests'
          });
          this.isLoading.set(false);
        }
      });
  }

  // Load Team Attendance
  loadTeamAttendance() {
    this.attendanceService.getTeamAttendance(this.filters())
      .subscribe({
        next: (res) => {
          this.teamAttendance.set(res.data || []);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load team attendance'
          });
        }
      });
  }

  // Live Attendance Updates
  startLiveUpdates() {
    // Poll every 30 seconds for live data
    setInterval(() => {
      this.attendanceService.getLiveAttendance(this.filters())
        .subscribe({
          next: (res) => this.liveAttendance.set(res.data || []),
          error: (err) => console.error('Live update error:', err)
        });
    }, 30000);

    // Initial load
    this.attendanceService.getLiveAttendance(this.filters())
      .subscribe({
        next: (res) => this.liveAttendance.set(res.data || [])
      });
  }

  // Approve/Reject Request
  handleRequest(requestId: string, status: 'approved' | 'rejected') {
    const message = status === 'approved' 
      ? 'Approve this request?' 
      : 'Reject this request?';
    
    this.confirmationService.confirm({
      message: message,
      header: 'Confirm Action',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.attendanceService.decideRegularization(requestId, { status })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Request ${status} successfully`
              });
              this.loadPendingRequests();
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: err.error?.message || 'Action failed'
              });
            }
          });
      }
    });
  }

  // Apply Filters
  applyFilters() {
    // Convert Date objects to strings for API
    const currentFilters = this.filters();
    this.filters.set({
      ...currentFilters,
      startDate: currentFilters.startDate instanceof Date 
        ? this.formatDate(currentFilters.startDate)
        : currentFilters.startDate,
      endDate: currentFilters.endDate instanceof Date
        ? this.formatDate(currentFilters.endDate)
        : currentFilters.endDate
    });

    if (this.activeTab() === 0) {
      this.loadPendingRequests();
    } else if (this.activeTab() === 1) {
      this.loadTeamAttendance();
    }
  }

  // Reset Filters
  resetFilters() {
    this.filters.set({
      startDate: this.formatDate(new Date(new Date().setDate(new Date().getDate() - 30))),
      endDate: this.formatDate(new Date()),
      department: '',
      status: '',
      branchId: '',
      includeSubordinates: true
    });
    this.applyFilters();
  }

  // Export Data
  exportData() {
    const options = {
      ...this.exportOptions(),
      startDate: this.datePipe.transform(this.exportOptions().startDate, 'yyyy-MM-dd')!,
      endDate: this.datePipe.transform(this.exportOptions().endDate, 'yyyy-MM-dd')!
    };

    this.attendanceService.exportAttendance(options)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_export_${options.startDate}_to_${options.endDate}.${options.format}`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Exported',
            detail: 'Attendance data exported successfully'
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: err.error?.message || 'Export failed'
          });
        }
      });
  }

  // Get Status Badge Class
  getStatusClass(status: string): string {
    return this.attendanceService.getStatusBadgeClass(status);
  }

  // Format Time
  formatTime(time: string): string {
    return time ? this.attendanceService.formatPunchTime(time) : '--:--';
  }
}

// // attendance-manager.component.ts
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ConfirmationService, MessageService } from 'primeng/api';

// // PrimeNG
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { DialogModule } from 'primeng/dialog';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToolbarModule } from 'primeng/toolbar';
// // import { TabViewModule } from 'primeng/tabview';
// // import { CalendarModule } from 'primeng/calendar';
// // import { DropdownModule } from 'primeng/dropdown';

// // Services
// import { AttendanceService } from '../services/attendance.service';
// import { DatePicker } from 'primeng/datepicker';
// import { Tabs, TabsModule } from 'primeng/tabs';

// @Component({
//   selector: 'app-attendance-manager',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     ButtonModule,
//     DialogModule,
//     ToastModule,
//     ConfirmDialogModule,
//     DatePicker,
//     InputTextModule,
//     SelectModule,
//     MultiSelectModule,
//     TabsModule,
//     ToolbarModule,
//     SelectModule
//   ],
//   providers: [MessageService, ConfirmationService, DatePipe],
//   templateUrl: './attendance-manager.component.html'
// })
// export class AttendanceManagerComponent implements OnInit {
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
  
//   // Filters
//   filters = signal({
//     startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
//     endDate: new Date(),
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

//   // Departments (would come from API)
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

//   ngOnInit() {
//     this.loadPendingRequests();
//     this.loadTeamAttendance();
//     this.startLiveUpdates();
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
//         }
//       });
//   }

//   // Live Attendance Updates
//   startLiveUpdates() {
//     // Poll every 30 seconds for live data
//     setInterval(() => {
//       this.attendanceService.getLiveAttendance(this.filters())
//         .subscribe({
//           next: (res) => this.liveAttendance.set(res.data || [])
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
//     if (this.activeTab() === 0) {
//       this.loadPendingRequests();
//     } else if (this.activeTab() === 1) {
//       this.loadTeamAttendance();
//     }
//   }

//   // Reset Filters
//   resetFilters() {
//     this.filters.set({
//       startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
//       endDate: new Date(),
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