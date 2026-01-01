import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';

// Services
import { AttendanceService } from '../services/attendance.service';

// Interfaces
interface AttendanceFilter {
  startDate: string;
  endDate: string;
  department: string;
  branchId: string;
}

interface Metric {
  label: string;
  value: string;
  colorClass: string;
}

interface DepartmentStat {
  name: string;
  attendance: number;
  late: number;
  overtime: number;
}

interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
}

interface TopPerformer {
  name: string;
  department: string;
  attendance: string;
}

interface LateArrival {
  name: string;
  department: string;
  lateDays: number;
  avgDelay: string;
}

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TabsModule
  ],
  providers: [DatePipe],
  templateUrl: './attendance-reports.component.html'
})
export class AttendanceReportsComponent implements OnInit {
onTabChange($event: string|number|undefined) {
throw new Error('Method not implemented.');
}
  private attendanceService = inject(AttendanceService);
  private datePipe = inject(DatePipe);

  // State
  isLoading = signal(false);
  activeTabIndex = signal(0);
  
  // Filters with string dates
  filters:any = signal<AttendanceFilter>({
    startDate: this.formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    endDate: this.formatDate(new Date()),
    department: '',
    branchId: ''
  });

  // Chart Data
  summaryChartData = signal<any>(null);
  attendanceTrendData = signal<any>(null);
  
  // Report Data
  summaryData = signal<any>(null);
  analyticsData = signal<any>(null);
  monthlyReportData = signal<any[]>([]);
  dashboardData = signal<any>(null);

  // Computed properties for UI data
  analyticsMetrics = computed<Metric[]>(() => {
    const data = this.analyticsData();
    return [
      {
        label: 'Punctuality Rate',
        value: data?.punctualityRate ? `${data.punctualityRate}%` : '92.5%',
        colorClass: 'text-green-600'
      },
      {
        label: 'Early Departures',
        value: data?.earlyDepartures?.toString() || '4',
        colorClass: 'text-red-600'
      },
      {
        label: 'Avg Overtime',
        value: data?.avgOvertime ? `${data.avgOvertime} hrs` : '1.2 hrs',
        colorClass: 'text-purple-600'
      },
      {
        label: 'WFH Days',
        value: data?.wfhDays?.toString() || '8',
        colorClass: 'text-blue-600'
      }
    ];
  });

  departmentStats = computed<DepartmentStat[]>(() => {
    const data = this.analyticsData();
    return data?.departmentStats || [
      { name: 'Engineering', attendance: 95, late: 2, overtime: 12 },
      { name: 'Sales', attendance: 88, late: 8, overtime: 5 },
      { name: 'Marketing', attendance: 92, late: 5, overtime: 8 },
      { name: 'HR', attendance: 96, late: 1, overtime: 3 },
      { name: 'Operations', attendance: 90, late: 7, overtime: 15 }
    ];
  });

  dashboardStats = computed<DashboardStat[]>(() => {
    const data = this.dashboardData();
    return [
      {
        label: 'Employees Present',
        value: data?.presentCount?.toString() || '142',
        icon: 'pi pi-users',
        iconClass: 'text-green-500'
      },
      {
        label: 'Currently Working',
        value: data?.workingCount?.toString() || '128',
        icon: 'pi pi-desktop',
        iconClass: 'text-blue-500'
      },
      {
        label: 'On Break',
        value: data?.breakCount?.toString() || '14',
        icon: 'pi pi-coffee',
        iconClass: 'text-orange-500'
      },
      {
        label: 'Work From Home',
        value: data?.wfhCount?.toString() || '24',
        icon: 'pi pi-home',
        iconClass: 'text-purple-500'
      }
    ];
  });

  topPerformers = computed<TopPerformer[]>(() => {
    const data = this.dashboardData();
    return data?.topPerformers || [
      { name: 'Alex Johnson', department: 'Engineering', attendance: '100%' },
      { name: 'Sarah Miller', department: 'Sales', attendance: '98%' },
      { name: 'David Chen', department: 'Marketing', attendance: '96%' },
      { name: 'Maria Garcia', department: 'HR', attendance: '95%' }
    ];
  });

  lateArrivals = computed<LateArrival[]>(() => {
    const data = this.dashboardData();
    return data?.lateArrivals || [
      { name: 'John Doe', department: 'Engineering', lateDays: 3, avgDelay: '15min' },
      { name: 'Jane Smith', department: 'Sales', lateDays: 2, avgDelay: '8min' },
      { name: 'Bob Wilson', department: 'Marketing', lateDays: 4, avgDelay: '22min' }
    ];
  });

  // Computed percentages for summary cards
  getPresentPercentage = computed(() => {
    const data = this.summaryData();
    return data?.presentDays && data?.totalDays 
      ? (data.presentDays / data.totalDays) * 100 
      : 0;
  });

  getAbsentPercentage = computed(() => {
    const data = this.summaryData();
    return data?.absentDays && data?.totalDays 
      ? (data.absentDays / data.totalDays) * 100 
      : 0;
  });

  // Chart Options
  chartOptions = {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  ngOnInit() {
    this.loadSummaryReport();
    this.initCharts();
  }

  // Helper method to format dates as strings
  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  // Load Summary Report
  loadSummaryReport() {
    this.isLoading.set(true);
    this.attendanceService.getAttendanceSummary(this.filters())
      .subscribe({
        next: (res) => {
          this.summaryData.set(res.data);
          this.updateSummaryChart(res.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load summary report:', err);
          this.isLoading.set(false);
        }
      });
  }

  // Load Analytics
  loadAnalytics() {
    this.attendanceService.getAnalytics(this.filters())
      .subscribe({
        next: (res) => {
          this.analyticsData.set(res.data);
          this.updateAnalyticsCharts(res.data);
        },
        error: (err) => {
          console.error('Failed to load analytics:', err);
        }
      });
  }

  // Load Monthly Report
  loadMonthlyReport() {
    this.attendanceService.getMonthlyReport({
      month: this.datePipe.transform(new Date(), 'yyyy-MM')
    })
      .subscribe({
        next: (res) => this.monthlyReportData.set(res.data || []),
        error: (err) => {
          console.error('Failed to load monthly report:', err);
          this.monthlyReportData.set([]);
        }
      });
  }

  // Load Dashboard
  loadDashboard() {
    this.attendanceService.getDashboard(this.filters())
      .subscribe({
        next: (res) => this.dashboardData.set(res.data),
        error: (err) => {
          console.error('Failed to load dashboard:', err);
        }
      });
  }

  // Initialize Charts
  initCharts() {
    // Summary Pie Chart
    this.summaryChartData.set({
      labels: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
      datasets: [
        {
          data: [65, 15, 10, 5, 5],
          backgroundColor: [
            '#10b981',
            '#ef4444',
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6'
          ],
          hoverBackgroundColor: [
            '#059669',
            '#dc2626',
            '#d97706',
            '#2563eb',
            '#7c3aed'
          ]
        }
      ]
    });

    // Attendance Trend
    this.attendanceTrendData.set({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Attendance Rate',
          data: [92, 95, 88, 94, 96, 45, 20],
          fill: true,
          borderColor: '#3b82f6',
          tension: 0.4,
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }
      ]
    });
  }

  // Update Charts with Real Data
  updateSummaryChart(data: any) {
    if (!data) return;
    
    this.summaryChartData.set({
      labels: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
      datasets: [
        {
          data: [
            data.presentDays || 0,
            data.absentDays || 0,
            data.lateDays || 0,
            data.halfDays || 0,
            data.leaveDays || 0
          ],
          backgroundColor: [
            '#10b981',
            '#ef4444',
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6'
          ],
          hoverBackgroundColor: [
            '#059669',
            '#dc2626',
            '#d97706',
            '#2563eb',
            '#7c3aed'
          ]
        }
      ]
    });
  }

  updateAnalyticsCharts(data: any) {
    // Update analytics charts with real data
    if (data && data.trendData) {
      this.attendanceTrendData.set({
        labels: data.trendData.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Attendance Rate',
            data: data.trendData.values || [92, 95, 88, 94, 96, 45, 20],
            fill: true,
            borderColor: '#3b82f6',
            tension: 0.4,
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }
        ]
      });
    }
  }

  // Export Report
  exportReport() {
    const options = {
      startDate: this.filters().startDate,
      endDate: this.filters().endDate,
      format: 'excel' as const,
      department: this.filters().department,
      reportType: this.getActiveReportType()
    };

    this.attendanceService.exportAttendance(options)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance_report_${options.startDate}_to_${options.endDate}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Export failed:', err);
        }
      });
  }

  // Apply Filters
  applyFilters() {
    // Convert Date objects to strings if needed
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

    switch (this.activeTabIndex()) {
      case 0: // Summary
        this.loadSummaryReport();
        break;
      case 1: // Analytics
        this.loadAnalytics();
        break;
      case 2: // Monthly
        this.loadMonthlyReport();
        break;
      case 3: // Dashboard
        this.loadDashboard();
        break;
    }
  }

  // Get active report type based on tab index
  private getActiveReportType(): string {
    switch (this.activeTabIndex()) {
      case 0: return 'summary';
      case 1: return 'analytics';
      case 2: return 'monthly';
      case 3: return 'dashboard';
      default: return 'summary';
    }
  }
}


// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG
// import { ChartModule } from 'primeng/chart';
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { DropdownModule } from 'primeng/dropdown';
// import { CalendarModule } from 'primeng/calendar';
// import { TabViewModule } from 'primeng/tabview';
// import { ProgressBarModule } from 'primeng/progressbar';

// // Services
// import { AttendanceService } from '../services/attendance.service';
// import { DatePicker } from 'primeng/datepicker';
// import { Tabs } from 'primeng/tabs';

// @Component({
//   selector: 'app-attendance-reports',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ChartModule,
//     CardModule,
//     ButtonModule,
//     DatePicker,
//     SelectModule,
//     SelectModule,
//     Tabs,
//     ProgressBarModule
//   ],
//   providers: [DatePipe],
//   templateUrl: './attendance-reports.component.html'
// })
// export class AttendanceReportsComponent implements OnInit {
//   private attendanceService = inject(AttendanceService);
//   private datePipe = inject(DatePipe);

//   // State
//   isLoading = signal(false);
//   activeReport = signal<'summary' | 'analytics' | 'monthly' | 'dashboard'>('summary');
  
//   // Filters
//   filters = signal({
//     startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
//     endDate: new Date(),
//     department: '',
//     branchId: ''
//   });

//   // Chart Data
//   summaryChartData = signal<any>(null);
//   attendanceTrendData = signal<any>(null);
//   departmentStatsData = signal<any>(null);
//   overtimeChartData = signal<any>(null);
  
//   // Report Data
//   summaryData = signal<any>(null);
//   analyticsData = signal<any>(null);
//   monthlyReportData = signal<any>(null);
//   dashboardData = signal<any>(null);

//   // Chart Options
//   chartOptions = {
//     plugins: {
//       legend: {
//         labels: {
//           usePointStyle: true,
//         },
//       },
//     },
//     responsive: true,
//     maintainAspectRatio: false,
//   };

//   ngOnInit() {
//     this.loadSummaryReport();
//     this.initCharts();
//   }

//   // Load Summary Report
//   loadSummaryReport() {
//     this.isLoading.set(true);
//     this.attendanceService.getAttendanceSummary(this.filters())
//       .subscribe({
//         next: (res) => {
//           this.summaryData.set(res.data);
//           this.updateSummaryChart(res.data);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   // Load Analytics
//   loadAnalytics() {
//     this.attendanceService.getAnalytics(this.filters())
//       .subscribe({
//         next: (res) => {
//           this.analyticsData.set(res.data);
//           this.updateAnalyticsCharts(res.data);
//         }
//       });
//   }

//   // Load Monthly Report
//   loadMonthlyReport() {
//     this.attendanceService.getMonthlyReport({
//       month: this.datePipe.transform(new Date(), 'yyyy-MM')
//     })
//       .subscribe({
//         next: (res) => this.monthlyReportData.set(res.data)
//       });
//   }

//   // Load Dashboard
//   loadDashboard() {
//     this.attendanceService.getDashboard(this.filters())
//       .subscribe({
//         next: (res) => this.dashboardData.set(res.data)
//       });
//   }

//   // Initialize Charts
//   initCharts() {
//     // Summary Pie Chart
//     this.summaryChartData.set({
//       labels: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'],
//       datasets: [
//         {
//           data: [65, 15, 10, 5, 5],
//           backgroundColor: [
//             '#10b981',
//             '#ef4444',
//             '#f59e0b',
//             '#3b82f6',
//             '#8b5cf6'
//           ],
//           hoverBackgroundColor: [
//             '#059669',
//             '#dc2626',
//             '#d97706',
//             '#2563eb',
//             '#7c3aed'
//           ]
//         }
//       ]
//     });

//     // Attendance Trend
//     this.attendanceTrendData.set({
//       labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
//       datasets: [
//         {
//           label: 'Attendance Rate',
//           data: [92, 95, 88, 94, 96, 45, 20],
//           fill: true,
//           borderColor: '#3b82f6',
//           tension: 0.4,
//           backgroundColor: 'rgba(59, 130, 246, 0.1)'
//         }
//       ]
//     });
//   }

//   // Update Charts with Real Data
//   updateSummaryChart(data: any) {
//     if (!data) return;
    
//     this.summaryChartData.set({
//       ...this.summaryChartData(),
//       datasets: [{
//         ...this.summaryChartData().datasets[0],
//         data: [
//           data.presentDays || 0,
//           data.absentDays || 0,
//           data.lateDays || 0,
//           data.halfDays || 0,
//           data.leaveDays || 0
//         ]
//       }]
//     });
//   }

//   updateAnalyticsCharts(data: any) {
//     // Update charts with analytics data
//   }

//   // Export Report
//   exportReport() {
//     const options = {
//       startDate: this.datePipe.transform(this.filters().startDate, 'yyyy-MM-dd')!,
//       endDate: this.datePipe.transform(this.filters().endDate, 'yyyy-MM-dd')!,
//       format: 'excel' as const,
//       department: this.filters().department
//     };

//     this.attendanceService.exportAttendance(options)
//       .subscribe({
//         next: (blob) => {
//           const url = window.URL.createObjectURL(blob);
//           const a = document.createElement('a');
//           a.href = url;
//           a.download = `attendance_report_${options.startDate}_to_${options.endDate}.xlsx`;
//           a.click();
//           window.URL.revokeObjectURL(url);
//         }
//       });
//   }

//   // Apply Filters
//   applyFilters() {
//     switch (this.activeReport()) {
//       case 'summary':
//         this.loadSummaryReport();
//         break;
//       case 'analytics':
//         this.loadAnalytics();
//         break;
//       case 'monthly':
//         this.loadMonthlyReport();
//         break;
//       case 'dashboard':
//         this.loadDashboard();
//         break;
//     }
//   }
// }