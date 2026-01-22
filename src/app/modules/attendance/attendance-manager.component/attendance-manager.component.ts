import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Shared
import { AgShareGrid } from '../../shared/components/ag-shared-grid';
import { AttendanceService } from '../services/attendance.service';
import { AuthService } from '../../auth/services/auth-service';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';

@Component({
  selector: 'app-attendance-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, ToastModule, ConfirmDialogModule,
    InputTextModule, SelectModule, MultiSelectModule, TabsModule, CheckboxModule,
    TooltipModule, AgShareGrid
  ],
  providers: [ConfirmationService, DatePipe],
  templateUrl: './attendance-manager.component.html',
  styleUrls: ['./attendance-manager.component.scss']
})
export class AttendanceManagerComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  public commonService = inject(CommonMethodService);
  private authService = inject(AuthService);
  private appMessageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  activeTab:any = signal<number>(0);
  isLoading = signal(false);
  isLiveUpdating = signal(false);
  
  pendingData = signal<any[]>([]);
  teamData = signal<any[]>([]);
  liveAttendance = signal<any[]>([]);
  currentUser = signal<any>(null);

  pendingColumns: any[] = [];
  teamColumns: any[] = [];

  filters = signal<any>({
    startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
    endDate: this.getDateString(new Date()),
    department: '',
    status: [],
    includeSubordinates: true
  });

  departments = signal([
    { label: 'All Departments', value: '' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'HR', value: 'hr' }
  ]);

  statusOptions = signal([
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Late', value: 'late' },
    { label: 'Half Day', value: 'half_day' }
  ]);

  getCurrentlyWorking = computed(() => this.liveAttendance().filter(a => a.status === 'present' && !a.lastOut).length);
  getOnBreak = computed(() => this.liveAttendance().filter(a => a.isOnBreak).length);
  getNotCheckedIn = computed(() => {
    const currentHour = new Date().getHours();
    return this.liveAttendance().filter(a => !a.firstIn && currentHour >= 10).length;
  });
  getWFHCount = computed(() => this.liveAttendance().filter(a => a.workType === 'wfh').length);

  constructor() {
    this.setupGridColumns();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadInitialData();
    this.startLiveUpdates();
  }

  setupGridColumns() {
    // 1. Pending Grid
    this.pendingColumns = [
      {
        headerName: 'Employee',
        field: 'user.name',
        width: 220,
        pinned: 'left',
        cellRenderer: (params: any) => {
          const name = params.value;
          const empId = params.data.user?.employeeId || '';
          const initials = this.commonService.getInitials(name);
          const color = this.commonService.stringToColor(name);
          return `
            <div style="display:flex; align-items:center; gap:10px; height:100%;">
              <div style="width:32px; height:32px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">
                ${initials}
              </div>
              <div style="display:flex; flex-direction:column; line-height:1.2;">
                <span style="font-weight:600; font-size:13px; color:var(--text-primary);">${name}</span>
                <span style="font-size:11px; color:var(--text-tertiary);">${empId}</span>
              </div>
            </div>`;
        }
      },
      {
        headerName: 'Date',
        field: 'targetDate',
        width: 110,
        valueFormatter: (p: any) => this.datePipe.transform(p.value, 'dd MMM')
      },
      {
        headerName: 'Type',
        field: 'type',
        width: 130,
        cellRenderer: (params: any) => {
          const isLeave = params.value?.includes('leave');
          const bg = isLeave ? '#fffbeb' : '#eff6ff'; 
          const color = isLeave ? '#d97706' : '#3b82f6';
          return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">${params.value?.replace('_', ' ')}</span>`;
        }
      },
      {
        headerName: 'Details (In/Out)',
        width: 150,
        cellRenderer: (params: any) => {
          const inTime = params.data.newFirstIn ? this.commonService.formatPunchTime(params.data.newFirstIn) : '--:--';
          const outTime = params.data.newLastOut ? this.commonService.formatPunchTime(params.data.newLastOut) : '--:--';
          return `
            <div style="font-family:var(--font-mono); font-size:11px; line-height:1.3;">
              <div style="color:#16a34a;">IN: ${inTime}</div>
              <div style="color:#dc2626;">OUT: ${outTime}</div>
            </div>`;
        }
      },
      {
        headerName: 'Reason',
        field: 'reason',
        flex: 1,
        minWidth: 150,
        tooltipField: 'reason',
        cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis' }
      },
      {
        headerName: 'Submitted',
        field: 'createdAt',
        width: 120,
        cellRenderer: (params: any) => {
          const d = this.datePipe.transform(params.value, 'dd MMM');
          const t = this.datePipe.transform(params.value, 'shortTime');
          return `
            <div style="display:flex; flex-direction:column; line-height:1.2; font-size:11px;">
              <span style="font-weight:600; color:var(--text-primary);">${d}</span>
              <span style="color:var(--text-tertiary);">${t}</span>
            </div>`;
        }
      },
      {
        headerName: 'Actions',
        width: 130, // Increased width for 3 buttons
        pinned: 'right',
        cellRenderer: (params: any) => {
          return `
            <div style="display:flex; gap:6px; align-items:center; height:100%;">
              <button data-action="approve" title="Approve" style="
                background:#ecfdf5; color:#16a34a; border:1px solid #bbf7d0;
                width:26px; height:26px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="pi pi-check" style="font-size:10px; pointer-events:none;"></i>
              </button>
              <button data-action="reject" title="Reject" style="
                background:#fef2f2; color:#dc2626; border:1px solid #fecaca;
                width:26px; height:26px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="pi pi-times" style="font-size:10px; pointer-events:none;"></i>
              </button>
              <button data-action="view" title="View Details" style="
                background:#eff6ff; color:#3b82f6; border:1px solid #bfdbfe;
                width:26px; height:26px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <i class="pi pi-eye" style="font-size:10px; pointer-events:none;"></i>
              </button>
            </div>
          `;
        }
      }
    ];

    // 2. Team Grid
    this.teamColumns = [
      {
        headerName: 'Employee',
        field: 'user.name',
        width: 200,
        pinned: 'left',
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          const initials = this.commonService.getInitials(name);
          const color = this.commonService.stringToColor(name);
          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div style="width:28px; height:28px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">${initials}</div>
              <span style="font-weight:600; color:var(--text-primary); font-size:13px;">${name}</span>
            </div>`;
        }
      },
      {
        headerName: 'Date',
        field: 'date',
        width: 110,
        valueFormatter: (p: any) => this.datePipe.transform(p.value, 'dd MMM')
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        cellRenderer: (params: any) => {
          const s = params.value?.toLowerCase();
          let color = '#64748b'; let bg = '#f1f5f9';
          if(s === 'present') { color = '#15803d'; bg = '#ecfdf5'; }
          if(s === 'absent') { color = '#b91c1c'; bg = '#fef2f2'; }
          if(s === 'late') { color = '#b45309'; bg = '#fffbeb'; }
          return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">${s}</span>`;
        }
      },
      {
        headerName: 'In / Out',
        width: 140,
        cellRenderer: (params: any) => {
            const inTime = params.data.firstIn ? this.commonService.formatPunchTime(params.data.firstIn) : '-';
            const outTime = params.data.lastOut ? this.commonService.formatPunchTime(params.data.lastOut) : '-';
            return `<span style="font-family:var(--font-mono); font-size:12px; color:var(--text-secondary);">${inTime} - ${outTime}</span>`;
        }
      },
      {
        headerName: 'Hrs',
        field: 'totalWorkHours',
        width: 80,
        cellStyle: { 'font-weight': '600', 'text-align': 'center' }
      },
      {
        headerName: 'Flags',
        width: 140,
        cellRenderer: (params: any) => {
           let flags = '';
           if(params.data.isLate) flags += `<span style="color:#b45309; background:#fffbeb; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:700; margin-right:4px;">LATE ${params.data.lateMinutes}m</span>`;
           if(params.data.overtimeHours > 0) flags += `<span style="color:#15803d; background:#ecfdf5; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:700;">OT ${params.data.overtimeHours}h</span>`;
           return flags;
        }
      }
    ];
  }

  onPendingGridEvent(event: any) {
    if (event.type === 'cellClicked' && event.event?.target) {
       const btn = event.event.target.closest('button');
       if (btn) {
         const action = btn.getAttribute('data-action');
         if (action === 'approve') this.handleRequest(event.data._id, 'approved');
         if (action === 'reject') this.handleRequest(event.data._id, 'rejected');
         if (action === 'view') {
            console.log('View Request:', event.data);
            this.appMessageService.showInfo('Details', 'View details modal logic here');
         }
       }
    }
  }

  private getDateString(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  private loadCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => this.currentUser.set(user));
  }

  loadInitialData() {
    this.isLoading.set(true);
    if (this.activeTab() === 0) this.loadPendingRequests();
    if (this.activeTab() === 1) this.loadTeamAttendance();
    if (this.activeTab() === 2) this.loadLiveAttendance();
  }

  loadPendingRequests() {
    const filters = { ...this.filters(), status: this.filters().status.join(',') };
    this.attendanceService.getPendingRequests(filters).subscribe({
        next: (res: any) => {
            this.pendingData.set(res.data || []);
            this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
    });
  }

  loadTeamAttendance() {
     const filters = { ...this.filters(), status: this.filters().status.join(',') };
     this.attendanceService.getTeamAttendance(filters).subscribe({
        next: (res: any) => {
            this.teamData.set(res.data || []);
            this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
    });
  }

  loadLiveAttendance() {
    this.isLiveUpdating.set(true);
    this.attendanceService.getLiveAttendance(this.filters()).subscribe({
        next: (res: any) => {
            this.liveAttendance.set(res.data || []);
            this.isLiveUpdating.set(false);
            this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
    });
  }

  exportData() {
    const options = {
      ...this.filters(),
      startDate: this.filters().startDate,
      endDate: this.filters().endDate,
      format: 'excel'
    };

    this.commonService.apiCall(
      this.attendanceService.exportAttendance(options),
      (blob) => {
        const filename = `attendance_${options.startDate}_${options.endDate}.xlsx`;
        this.commonService.downloadBlob(blob, filename);
        this.appMessageService.showSuccess('Exported', 'Attendance data downloaded.');
      },
      'Export Data'
    );
  }

  private startLiveUpdates() {
    setInterval(() => {
      if (this.activeTab() === 2) this.loadLiveAttendance();
    }, 30000);
  }

  handleRequest(requestId: string, status: 'approved' | 'rejected') {
    this.confirmationService.confirm({
      message: `Are you sure you want to ${status} this request?`,
      header: 'Confirm Action',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.attendanceService.decideRegularization(requestId, { status }).subscribe(() => {
           this.appMessageService.showSuccess('Success', `Request ${status}`);
           this.loadPendingRequests();
        });
      }
    });
  }

  applyFilters() { this.loadInitialData(); }
  resetFilters() {
    this.filters.set({
      startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
      endDate: this.getDateString(new Date()),
      department: '',
      status: [],
      includeSubordinates: true
    });
    this.loadInitialData();
  }
}

// import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ConfirmationService } from 'primeng/api';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { TabsModule } from 'primeng/tabs';
// import { SelectModule } from 'primeng/select';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TooltipModule } from 'primeng/tooltip';

// // Shared
// import { AgShareGrid } from '../../shared/components/ag-shared-grid';
// import { AttendanceService } from '../services/attendance.service';
// import { AuthService } from '../../auth/services/auth-service';
// import { AppMessageService } from '../../../core/services/message.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';

// @Component({
//   selector: 'app-attendance-manager',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ButtonModule, ToastModule, ConfirmDialogModule,
//     InputTextModule, SelectModule, MultiSelectModule, TabsModule, CheckboxModule,
//     TooltipModule, AgShareGrid
//   ],
//   providers: [ConfirmationService, DatePipe],
//   templateUrl: './attendance-manager.component.html',
//   styleUrls: ['./attendance-manager.component.scss']
// })
// export class AttendanceManagerComponent implements OnInit {
//   // --- Injections ---
//   private attendanceService = inject(AttendanceService);
//   public commonService = inject(CommonMethodService);
//   private authService = inject(AuthService);
//   private appMessageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   private datePipe = inject(DatePipe);
//   private destroyRef = inject(DestroyRef);

//   // --- State ---
//   activeTab = signal<number>(0);
//   isLoading = signal(false);
//   isLiveUpdating = signal(false);
  
//   // --- Data ---
//   pendingData = signal<any[]>([]);
//   teamData = signal<any[]>([]);
//   liveAttendance = signal<any[]>([]);
//   currentUser = signal<any>(null);

//   // --- Columns ---
//   pendingColumns: any[] = [];
//   teamColumns: any[] = [];

//   // --- Filters ---
//   filters = signal<any>({
//     startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
//     endDate: this.getDateString(new Date()),
//     department: '',
//     status: [],
//     includeSubordinates: true
//   });

//   // Export Options
//   exportOptions = signal({
//     format: 'excel' as const
//   });

//   // --- Options ---
//   departments = signal([
//     { label: 'All Departments', value: '' },
//     { label: 'Engineering', value: 'engineering' },
//     { label: 'Sales', value: 'sales' },
//     { label: 'Marketing', value: 'marketing' },
//     { label: 'HR', value: 'hr' }
//   ]);

//   statusOptions = signal([
//     { label: 'Present', value: 'present' },
//     { label: 'Absent', value: 'absent' },
//     { label: 'Late', value: 'late' },
//     { label: 'Half Day', value: 'half_day' }
//   ]);

//   // --- Computed ---
//   getCurrentlyWorking = computed(() => this.liveAttendance().filter(a => a.status === 'present' && !a.lastOut).length);
//   getOnBreak = computed(() => this.liveAttendance().filter(a => a.isOnBreak).length);
//   getNotCheckedIn = computed(() => {
//     const currentHour = new Date().getHours();
//     return this.liveAttendance().filter(a => !a.firstIn && currentHour >= 10).length;
//   });
//   getWFHCount = computed(() => this.liveAttendance().filter(a => a.workType === 'wfh').length);

//   constructor() {
//     this.setupGridColumns();
//   }

//   ngOnInit() {
//     this.loadCurrentUser();
//     this.loadInitialData();
//     this.startLiveUpdates();
//   }

//   // --- GRID SETUP ---
//   setupGridColumns() {
//     // 1. Pending Requests (Restored Missing Columns)
//     this.pendingColumns = [
//       {
//         headerName: 'Employee',
//         field: 'user.name',
//         width: 220,
//         pinned: 'left',
//         cellRenderer: (params: any) => {
//           const name = params.value;
//           const empId = params.data.user?.employeeId || '';
//           const initials = this.commonService.getInitials(name);
//           const color = this.commonService.stringToColor(name);
//           return `
//             <div style="display:flex; align-items:center; gap:10px; height:100%;">
//               <div style="width:32px; height:32px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">
//                 ${initials}
//               </div>
//               <div style="display:flex; flex-direction:column; line-height:1.2;">
//                 <span style="font-weight:600; font-size:13px; color:var(--text-primary);">${name}</span>
//                 <span style="font-size:11px; color:var(--text-tertiary);">${empId}</span>
//               </div>
//             </div>`;
//         }
//       },
//       {
//         headerName: 'Date',
//         field: 'targetDate',
//         width: 110,
//         valueFormatter: (p: any) => this.datePipe.transform(p.value, 'dd MMM')
//       },
//       {
//         headerName: 'Type',
//         field: 'type',
//         width: 130,
//         cellRenderer: (params: any) => {
//           const isLeave = params.value?.includes('leave');
//           const bg = isLeave ? '#fffbeb' : '#eff6ff'; // var(--bg-warning-subtle) / var(--bg-info-subtle)
//           const color = isLeave ? '#d97706' : '#3b82f6';
//           return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">${params.value?.replace('_', ' ')}</span>`;
//         }
//       },
//       // 👇 RESTORED: Details Column (In/Out)
//       {
//         headerName: 'Details (In/Out)',
//         width: 150,
//         cellRenderer: (params: any) => {
//           const inTime = params.data.newFirstIn ? this.commonService.formatPunchTime(params.data.newFirstIn) : '--:--';
//           const outTime = params.data.newLastOut ? this.commonService.formatPunchTime(params.data.newLastOut) : '--:--';
//           return `
//             <div style="font-family:var(--font-mono); font-size:11px; line-height:1.3;">
//               <div style="color:#16a34a;">IN: ${inTime}</div>
//               <div style="color:#dc2626;">OUT: ${outTime}</div>
//             </div>`;
//         }
//       },
//       {
//         headerName: 'Reason',
//         field: 'reason',
//         flex: 1,
//         minWidth: 150,
//         tooltipField: 'reason',
//         cellStyle: { 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis' }
//       },
//       // 👇 RESTORED: Submitted Column
//       {
//         headerName: 'Submitted',
//         field: 'createdAt',
//         width: 120,
//         cellRenderer: (params: any) => {
//           const d = this.datePipe.transform(params.value, 'dd MMM');
//           const t = this.datePipe.transform(params.value, 'shortTime');
//           return `
//             <div style="display:flex; flex-direction:column; line-height:1.2; font-size:11px;">
//               <span style="font-weight:600; color:var(--text-primary);">${d}</span>
//               <span style="color:var(--text-tertiary);">${t}</span>
//             </div>`;
//         }
//       },
//       {
//         headerName: 'Actions',
//         width: 100,
//         pinned: 'right',
//         cellRenderer: (params: any) => {
//           return `
//             <div style="display:flex; gap:8px; align-items:center; height:100%;">
//               <button data-action="approve" title="Approve" style="
//                 background:#ecfdf5; color:#16a34a; border:1px solid #bbf7d0;
//                 width:26px; height:26px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
//                 <i class="pi pi-check" style="font-size:10px; pointer-events:none;"></i>
//               </button>
//               <button data-action="reject" title="Reject" style="
//                 background:#fef2f2; color:#dc2626; border:1px solid #fecaca;
//                 width:26px; height:26px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
//                 <i class="pi pi-times" style="font-size:10px; pointer-events:none;"></i>
//               </button>
//             </div>
//           `;
//         }
//       }
//     ];

//     // 2. Team Attendance (No changes needed, was mostly correct)
//     this.teamColumns = [
//       {
//         headerName: 'Employee',
//         field: 'user.name',
//         width: 200,
//         pinned: 'left',
//         cellRenderer: (params: any) => {
//           const name = params.value || 'Unknown';
//           const initials = this.commonService.getInitials(name);
//           const color = this.commonService.stringToColor(name);
//           return `
//             <div style="display:flex; align-items:center; gap:8px; height:100%;">
//               <div style="width:28px; height:28px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">${initials}</div>
//               <span style="font-weight:600; color:var(--text-primary); font-size:13px;">${name}</span>
//             </div>`;
//         }
//       },
//       {
//         headerName: 'Date',
//         field: 'date',
//         width: 110,
//         valueFormatter: (p: any) => this.datePipe.transform(p.value, 'dd MMM')
//       },
//       {
//         headerName: 'Status',
//         field: 'status',
//         width: 120,
//         cellRenderer: (params: any) => {
//           const s = params.value?.toLowerCase();
//           // Simplified inline styles for demo, ideally use var tokens
//           let color = '#64748b'; let bg = '#f1f5f9';
//           if(s === 'present') { color = '#15803d'; bg = '#ecfdf5'; }
//           if(s === 'absent') { color = '#b91c1c'; bg = '#fef2f2'; }
//           if(s === 'late') { color = '#b45309'; bg = '#fffbeb'; }
//           return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">${s}</span>`;
//         }
//       },
//       {
//         headerName: 'In / Out',
//         width: 140,
//         cellRenderer: (params: any) => {
//             const inTime = params.data.firstIn ? this.commonService.formatPunchTime(params.data.firstIn) : '-';
//             const outTime = params.data.lastOut ? this.commonService.formatPunchTime(params.data.lastOut) : '-';
//             return `<span style="font-family:var(--font-mono); font-size:12px; color:var(--text-secondary);">${inTime} - ${outTime}</span>`;
//         }
//       },
//       {
//         headerName: 'Hrs',
//         field: 'totalWorkHours',
//         width: 80,
//         cellStyle: { 'font-weight': '600', 'text-align': 'center' }
//       },
//       {
//         headerName: 'Flags',
//         width: 140,
//         cellRenderer: (params: any) => {
//            let flags = '';
//            if(params.data.isLate) flags += `<span style="color:#b45309; background:#fffbeb; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:700; margin-right:4px;">LATE ${params.data.lateMinutes}m</span>`;
//            if(params.data.overtimeHours > 0) flags += `<span style="color:#15803d; background:#ecfdf5; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:700;">OT ${params.data.overtimeHours}h</span>`;
//            return flags;
//         }
//       }
//     ];
//   }

//   // --- GRID EVENT HANDLER ---
//   onPendingGridEvent(event: any) {
//     if (event.type === 'cellClicked' && event.event?.target) {
//        // Check if clicked element is our custom button
//        const btn = event.event.target.closest('button');
//        if (btn) {
//          const action = btn.getAttribute('data-action');
//          if (action === 'approve') this.handleRequest(event.data._id, 'approved');
//          if (action === 'reject') this.handleRequest(event.data._id, 'rejected');
//        }
//     }
//   }

//   // --- LOGIC ---
//   private getDateString(date: Date): string {
//     return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
//   }

//   private loadCurrentUser() {
//     this.authService.currentUser$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(user => this.currentUser.set(user));
//   }

//   loadInitialData() {
//     this.isLoading.set(true);
//     if (this.activeTab() === 0) this.loadPendingRequests();
//     if (this.activeTab() === 1) this.loadTeamAttendance();
//     if (this.activeTab() === 2) this.loadLiveAttendance();
//   }

//   loadPendingRequests() {
//     const filters = { ...this.filters(), status: this.filters().status.join(',') };
//     this.attendanceService.getPendingRequests(filters).subscribe({
//         next: (res: any) => {
//             this.pendingData.set(res.data || []);
//             this.isLoading.set(false);
//         },
//         error: () => this.isLoading.set(false)
//     });
//   }

//   loadTeamAttendance() {
//      const filters = { ...this.filters(), status: this.filters().status.join(',') };
//      this.attendanceService.getTeamAttendance(filters).subscribe({
//         next: (res: any) => {
//             this.teamData.set(res.data || []);
//             this.isLoading.set(false);
//         },
//         error: () => this.isLoading.set(false)
//     });
//   }

//   loadLiveAttendance() {
//     this.isLiveUpdating.set(true);
//     this.attendanceService.getLiveAttendance(this.filters()).subscribe({
//         next: (res: any) => {
//             this.liveAttendance.set(res.data || []);
//             this.isLiveUpdating.set(false);
//             this.isLoading.set(false);
//         },
//         error: () => this.isLoading.set(false)
//     });
//   }

//   // 👇 RESTORED: Export Logic
//   exportData() {
//     const options = {
//       ...this.filters(),
//       startDate: this.filters().startDate,
//       endDate: this.filters().endDate,
//       format: 'excel'
//     };

//     this.commonService.apiCall(
//       this.attendanceService.exportAttendance(options),
//       (blob) => {
//         const filename = `attendance_${options.startDate}_${options.endDate}.xlsx`;
//         this.commonService.downloadBlob(blob, filename);
//         this.appMessageService.showSuccess('Exported', 'Attendance data downloaded.');
//       },
//       'Export Data'
//     );
//   }

//   private startLiveUpdates() {
//     setInterval(() => {
//       if (this.activeTab() === 2) this.loadLiveAttendance();
//     }, 30000);
//   }

//   handleRequest(requestId: string, status: 'approved' | 'rejected') {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to ${status} this request?`,
//       header: 'Confirm Action',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.attendanceService.decideRegularization(requestId, { status }).subscribe(() => {
//            this.appMessageService.showSuccess('Success', `Request ${status}`);
//            this.loadPendingRequests();
//         });
//       }
//     });
//   }

//   applyFilters() { this.loadInitialData(); }
//   resetFilters() {
//     this.filters.set({
//       startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
//       endDate: this.getDateString(new Date()),
//       department: '',
//       status: [],
//       includeSubordinates: true
//     });
//     this.loadInitialData();
//   }
// }

// // import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
// // import { CommonModule, DatePipe } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ConfirmationService } from 'primeng/api';
// // import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// // // PrimeNG Components
// // import { TableModule } from 'primeng/table';
// // import { ButtonModule } from 'primeng/button';
// // import { ToastModule } from 'primeng/toast';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { ToolbarModule } from 'primeng/toolbar';
// // import { Tabs, TabsModule, TabPanel, TabList, Tab, TabPanels } from 'primeng/tabs';
// // import { SelectModule } from 'primeng/select';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { TooltipModule } from 'primeng/tooltip';

// // // Services
// // import { AttendanceService } from '../services/attendance.service';

// // import { AuthService } from '../../auth/services/auth-service';
// // import { AppMessageService } from '../../../core/services/message.service';
// // import { LoadingService } from '../../../core/services/loading.service';
// // import { Severity, CommonMethodService } from '../../../core/utils/common-method.service';

// // // Interfaces
// // interface AttendanceFilter {
// //   startDate: string;
// //   endDate: string;
// //   department: string;
// //   status: string[];
// //   branchId: string;
// //   includeSubordinates: boolean;
// //   page?: number;
// //   limit?: number;
// // }

// // interface RequestType {
// //   label: string;
// //   value: string;
// //   severity: Severity;
// //   icon: string;
// // }

// // @Component({
// //   selector: 'app-attendance-manager',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     TableModule,
// //     ButtonModule,
// //     ToastModule,
// //     ConfirmDialogModule,
// //     InputTextModule,
// //     SelectModule,
// //     MultiSelectModule,
// //     Tabs,
// //     ToolbarModule,
// //     CheckboxModule,
// //     TooltipModule,
// //     TabPanel,
// //     TabList,
// //     Tab,
// //     TabPanels
// // ],
// //   providers: [ConfirmationService, DatePipe],
// //   templateUrl: './attendance-manager.component.html'
// // })
// // export class AttendanceManagerComponent implements OnInit {
// //   // Services
// //   private attendanceService = inject(AttendanceService);
// //   public commonService = inject(CommonMethodService);
// //   private authService = inject(AuthService);
// //   private loadingService = inject(LoadingService);
// //   private appMessageService = inject(AppMessageService);
// //   private confirmationService = inject(ConfirmationService);
// //   private datePipe = inject(DatePipe);
// //   private destroyRef = inject(DestroyRef);

// //   // State
// //   activeTab = signal(0);
// //   isLoading = signal(false);
// //   isLiveUpdating = signal(false);
  
// //   // Data
// //   pendingRequests = signal<any[]>([]);
// //   teamAttendance = signal<any[]>([]);
// //   liveAttendance = signal<any[]>([]);
// //   currentUser = signal<any>(null);
  
// //   // Filters
// //   filters:any = signal<AttendanceFilter>({
// //     startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
// //     endDate: this.getDateString(new Date()),
// //     department: '',
// //     status: [],
// //     branchId: '',
// //     includeSubordinates: true,
// //     page: 1,
// //     limit: 10
// //   });

// //   // Pagination
// //   totalRecords = signal(0);
// //   currentPage = signal(1);
// //   rowsPerPage = signal(10);

// //   // Request Types with Severity
// //   requestTypes = signal<RequestType[]>([
// //     { label: 'Missed Punch', value: 'missed_punch', severity: 'danger', icon: 'pi pi-clock' },
// //     { label: 'Correction', value: 'correction', severity: 'warn', icon: 'pi pi-pencil' },
// //     { label: 'Work From Home', value: 'work_from_home', severity: 'info', icon: 'pi pi-home' },
// //     { label: 'On Duty', value: 'on_duty', severity: 'secondary', icon: 'pi pi-car' },
// //     { label: 'Leave Reversal', value: 'leave_reversal', severity: 'success', icon: 'pi pi-calendar-plus' },
// //     { label: 'Others', value: 'others', severity: 'contrast', icon: 'pi pi-question-circle' }
// //   ]);

// //   // Departments
// //   departments = signal([
// //     { label: 'All Departments', value: '' },
// //     { label: 'Engineering', value: 'engineering' },
// //     { label: 'Sales', value: 'sales' },
// //     { label: 'Marketing', value: 'marketing' },
// //     { label: 'HR', value: 'hr' },
// //     { label: 'Operations', value: 'operations' },
// //     { label: 'Finance', value: 'finance' },
// //     { label: 'Customer Support', value: 'customer_support' }
// //   ]);

// //   // Status Options with Severity
// //   statusOptions = signal([
// //     { label: 'Present', value: 'present', severity: 'success' },
// //     { label: 'Absent', value: 'absent', severity: 'danger' },
// //     { label: 'Late', value: 'late', severity: 'warn' },
// //     { label: 'Half Day', value: 'half_day', severity: 'info' },
// //     { label: 'On Leave', value: 'on_leave', severity: 'secondary' },
// //     { label: 'Holiday', value: 'holiday', severity: 'contrast' }
// //   ]);

// //   // Computed properties
// //   getCurrentlyWorking = computed(() => {
// //     return this.liveAttendance().filter(a => 
// //       a.status === 'present' && !a.lastOut
// //     ).length;
// //   });

// //   getOnBreak = computed(() => {
// //     return this.liveAttendance().filter(a => 
// //       a.isOnBreak || a.breakStart && !a.breakEnd
// //     ).length;
// //   });

// //   getNotCheckedIn = computed(() => {
// //     const currentHour = new Date().getHours();
// //     return this.liveAttendance().filter(a => 
// //       !a.firstIn && currentHour >= 10 // After 10 AM
// //     ).length;
// //   });

// //   getWFHCount = computed(() => {
// //     return this.liveAttendance().filter(a => 
// //       a.workType === 'wfh'
// //     ).length;
// //   });

// //   // Export Options
// //   exportOptions = signal({
// //     startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
// //     endDate: new Date(),
// //     format: 'excel' as const,
// //     branchId: '',
// //     department: ''
// //   });

// //   ngOnInit() {
// //     this.loadCurrentUser();
// //     this.loadInitialData();
// //     this.startLiveUpdates();
// //   }

// //   // Helper Methods
// //   private getDateString(date: Date): string {
// //     return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
// //   }

// //   private loadCurrentUser() {
// //     this.authService.currentUser$
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe(user => {
// //         this.currentUser.set(user);
// //       });
// //   }

// //   private loadInitialData() {
// //     switch (this.activeTab()) {
// //       case 0:
// //         this.loadPendingRequests();
// //         break;
// //       case 1:
// //         this.loadTeamAttendance();
// //         break;
// //       case 2:
// //         this.loadLiveAttendance();
// //         break;
// //     }
// //   }

// //   // Tab Navigation
// //   onTabChange(event: any) {
// //     this.activeTab.set(event);
// //     this.loadInitialData();
// //   }

// //   // Load Pending Requests
// //   loadPendingRequests() {
// //     const filters = this.filters();
// //     const requestFilters = {
// //       ...filters,
// //       status: filters.status.join(',')
// //     };

// //     this.commonService.apiCall(
// //       this.attendanceService.getPendingRequests(requestFilters),
// //       (response) => {
// //         this.pendingRequests.set(response.data || []);
// //         this.totalRecords.set(response.total || 0);
// //       },
// //       'Load Pending Requests'
// //     );
// //   }

// //   // Load Team Attendance
// //   loadTeamAttendance() {
// //     const filters = this.filters();
// //     const teamFilters = {
// //       ...filters,
// //       date: this.getDateString(new Date()), // Default to today
// //       status: filters.status.join(',')
// //     };

// //     this.commonService.apiCall(
// //       this.attendanceService.getTeamAttendance(teamFilters),
// //       (response) => {
// //         this.teamAttendance.set(response.data || []);
// //       },
// //       'Load Team Attendance'
// //     );
// //   }

// //   // Load Live Attendance
// //   loadLiveAttendance() {
// //     this.isLiveUpdating.set(true);
// //     const filters = this.filters();

// //     this.commonService.apiCall(
// //       this.attendanceService.getLiveAttendance(filters),
// //       (response) => {
// //         this.liveAttendance.set(response.data || []);
// //         this.isLiveUpdating.set(false);
// //       },
// //       'Load Live Attendance'
// //     );
// //   }

// //   // Start Live Updates
// //   private startLiveUpdates() {
// //     // Poll every 30 seconds for live data
// //     setInterval(() => {
// //       if (this.activeTab() === 2) {
// //         this.loadLiveAttendance();
// //       }
// //     }, 30000);
// //   }

// //   // Handle Request Approval/Rejection
// //   handleRequest(requestId: string, status: 'approved' | 'rejected') {
// //     const message = status === 'approved' 
// //       ? 'Approve this attendance request?' 
// //       : 'Reject this attendance request?';
// //     const severity = status === 'approved' ? 'success' : 'danger';

// //     this.confirmationService.confirm({
// //       message: message,
// //       header: 'Confirm Action',
// //       icon: 'pi pi-exclamation-triangle',
// //       accept: () => {
// //         this.commonService.apiCall(
// //           this.attendanceService.decideRegularization(requestId, { status }),
// //           () => {
// //             this.appMessageService.showSuccess(
// //               'Success',
// //               `Request ${status} successfully`
// //             );
// //             this.loadPendingRequests();
// //           },
// //           `${status.charAt(0).toUpperCase() + status.slice(1)} Request`
// //         );
// //       }
// //     });
// //   }

// //   // Apply Filters
// //   applyFilters() {
// //     // Reset to first page when filters change
// //     this.currentPage.set(1);
// //     this.loadInitialData();
// //   }

// //   // Reset Filters
// //   resetFilters() {
// //     this.filters.set({
// //       startDate: this.getDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
// //       endDate: this.getDateString(new Date()),
// //       department: '',
// //       status: [],
// //       branchId: '',
// //       includeSubordinates: true,
// //       page: 1,
// //       limit: 10
// //     });
// //     this.loadInitialData();
// //   }

// //   // Export Data
// //   exportData() {
// //     const options = {
// //       ...this.exportOptions(),
// //       startDate: this.getDateString(this.exportOptions().startDate),
// //       endDate: this.getDateString(this.exportOptions().endDate)
// //     };

// //     this.commonService.apiCall(
// //       this.attendanceService.exportAttendance(options),
// //       (blob) => {
// //         const filename = `attendance_export_${options.startDate}_to_${options.endDate}.${options.format}`;
// //         this.commonService.downloadBlob(blob, filename);
// //         this.appMessageService.showSuccess(
// //           'Exported',
// //           'Attendance data exported successfully'
// //         );
// //       },
// //       'Export Attendance Data'
// //     );
// //   }

// //   // Format Time
// //   formatTime(time: string | undefined): string {
// //     return this.commonService.formatPunchTime(time);
// //   }

// //   // Get Request Type Severity
// //   getRequestTypeSeverity(type: string): Severity {
// //     const requestType = this.requestTypes().find(t => t.value === type);
// //     return requestType?.severity || 'secondary';
// //   }

// //   // Get Status Severity
// //   getStatusSeverity(status: string): Severity {
// //     return this.commonService.mapAttendanceStatusToSeverity(status);
// //   }

// //   // Get Status Class
// //   getStatusClass(status: string): string {
// //     return this.commonService.getAttendanceStatusClass(status);
// //   }

// //   // Get Status Text
// //   getStatusText(status: string): string {
// //     return this.commonService.getAttendanceStatusText(status);
// //   }

// //   // Get Request Type Text
// //   getRequestTypeText(type: string): string {
// //     const requestType = this.requestTypes().find(t => t.value === type);
// //     return requestType?.label || type.replace('_', ' ');
// //   }

// //   // Get Request Type Icon
// //   getRequestTypeIcon(type: string): string {
// //     const requestType = this.requestTypes().find(t => t.value === type);
// //     return requestType?.icon || 'pi pi-question-circle';
// //   }

// //   // Pagination
// //   onPageChange(event: any) {
// //     this.currentPage.set(event.page + 1);
// //     this.filters.update((filters:any) => ({
// //       ...filters,
// //       page: event.page + 1,
// //       limit: event.rows
// //     }));
// //     this.loadInitialData();
// //   }

// //   // View Request Details
// //   viewRequestDetails(request: any) {
// //     console.log('View request details:', request);
// //     // Implement modal or navigation to details page
// //   }

// //   // View Employee Profile
// //   viewEmployeeProfile(employeeId: string) {
// //     console.log('View employee profile:', employeeId);
// //     // Implement navigation to employee profile
// //   }

// //   // Get Employee Initials
// //   getEmployeeInitials(name: string): string {
// //     return this.commonService.getInitials(name);
// //   }

// //   // Format Date
// //   formatDate(date: string | Date): string {
// //     return this.commonService.formatDate(date, 'dd MMM yyyy');
// //   }

// //   // Get Employee Avatar Color
// //   getEmployeeColor(name: string): string {
// //     return this.commonService.stringToColor(name);
// //   }

// //   // Get Status Badge HTML
// //   getStatusBadgeHtml(status: string): string {
// //     return this.commonService.attendanceStatusBadgeHtml(status);
// //   }
// // }
