
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// --- PrimeNG ---
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
// 👇 Import Confirmation Service and Module
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { ImageCellRendererComponent } from '../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { AgShareGrid } from '../../shared/components/ag-shared-grid';
import { UserManagementService } from '../user-management.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule, // 👈 Add to imports
    AgShareGrid
  ],
  // 👇 Add ConfirmationService to providers
  providers: [UserManagementService, ConfirmationService], 
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserListComponent implements OnInit {
  // --- Injections ---
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService); // 👈 Inject
  public masterList = inject(MasterListService);
  private router = inject(Router);

  // ... (Keep existing state variables: gridApi, currentPage, etc.) ...
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;

  data: any[] = [];
  column: any[] = [];

  roleOptions = signal<any[]>([]);
  branchOptions = signal<any[]>([]);

  userFilter = {
    role: null,
    branchId: null,
    search: ''
  };

  constructor() {
    effect(() => {
      this.roleOptions.set(this.masterList.roles());
      this.branchOptions.set(this.masterList.branches());
    });
  }

  ngOnInit(): void {
    this.setupColumns();
    this.getData(true);
  }

  // ... (Keep existing methods: applyFilters, resetFilters, createNew) ...
  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.userFilter = { role: null, branchId: null, search: '' };
    this.getData(true);
  }

  createNew() {
    this.router.navigate(['/user/create']);
  }

  // ... (Keep existing getData and onScrolledToBottom) ...
  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const params = {
      ...this.userFilter,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.userService.getAllUsers(params).subscribe({
      next: (res: any) => {
        let newData = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        this.totalCount = res.results || this.totalCount;
        this.data = isReset ? newData : [...this.data, ...newData];

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch users.');
      }
    });
  }

  onScrolledToBottom() {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }
  
  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  // 👇 UPDATED EVENT HANDLER
  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const userId = event.row._id;
      this.router.navigate(['/user/details', userId]);
    }

    if (event.type === 'editStart') {
      const userId = event.row._id;
      // Fixed navigation path to match the new Route
      this.router.navigate(['/user/edit', userId]); 
    }

    if (event.type === 'delete') {
      const userId = event.row._id;
      const userName = event.row.name;
      
      // Trigger confirmation before API call
      this.confirmationService.confirm({
        message: `Are you sure you want to permanently delete user <b>${userName}</b>?`,
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: 'p-button-danger p-button-text',
        rejectButtonStyleClass: 'p-button-secondary p-button-text',
        accept: () => {
          this.deleteUser(userId);
        }
      });
    }

    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }

  // 👇 NEW DELETE METHOD
  private deleteUser(id: string) {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.messageService.showSuccess('Deleted', 'User removed successfully');
        // Refresh the grid
        this.getData(true);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to delete user');
      }
    });
  }
setupColumns(): void {
    this.column = [
      // 1. AVATAR
      {
        field: 'avatar',
        headerName: '',
        cellRenderer: ImageCellRendererComponent,
        width: 60,
        pinned: 'left',
        sortable: false,
        filter: false,
        suppressMenu: true,
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      },

      // 2. NAME
      {
        field: 'name',
        headerName: 'Employee Name',
        width: 180,
        pinned: 'left',
        sortable: true,
        filter: true,
        cellStyle: {
          'display': 'flex',
          'align-items': 'center',
          'font-weight': '600',
          'color': 'var(--text-primary)',
          'font-size': '13px'
        }
      },

      // 3. ROLE (Fixed Border Issue)
      {
        headerName: 'Role',
        field: 'role.name',
        width: 140,
        filter: true,
        cellRenderer: (params: any) => {
          const role = params.value || 'N/A';
          // 🛠️ FIX: Reduced padding and line-height to fit inside row
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: var(--bg-secondary); 
                color: var(--accent-primary); 
                padding: 1px 8px; 
                border-radius: 4px; 
                font-weight: 600; 
                font-size: 10px; 
                text-transform: uppercase; 
                border: 1px solid var(--border-secondary);
                line-height: 1.2;
                letter-spacing: 0.5px;
                white-space: nowrap;
              ">
                ${role}
              </span>
            </div>`;
        }
      },

      // 4. CONTACT
      {
        headerName: 'Contact Info',
        width: 220,
        cellRenderer: (params: any) => {
          const email = params.data.email;
          const phone = params.data.phone ? `<span style="color:var(--text-tertiary);"> • ${params.data.phone}</span>` : '';
          
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; line-height:1.2;">
              <span style="color:var(--text-secondary); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${email}</span>
              <span style="font-size:10px; color:var(--text-tertiary);">${params.data.phone || ''}</span>
            </div>
          `;
        }
      },

      // 5. SHIFT NAME
      {
        headerName: 'Shift Name',
        width: 160,
        cellRenderer: (params: any) => {
          const config = params.data.attendanceConfig;
          
          if (!config?.isAttendanceEnabled) {
            return `<div style="display:flex; align-items:center; height:100%; color:#94a3b8; font-style:italic; font-size:12px;">Disabled</div>`;
          }

          if (config.shiftId && config.shiftId.name) {
            return `<div style="display:flex; align-items:center; height:100%; font-weight:600; color:var(--text-primary); font-size:12px; text-transform:capitalize;">
                      ${config.shiftId.name}
                    </div>`;
          }

          return `<div style="display:flex; align-items:center; height:100%; color:#ef4444; font-weight:600; font-size:12px;">
                    <i class="pi pi-exclamation-circle" style="margin-right:4px; font-size:10px;"></i> Assign Shift
                  </div>`;
        }
      },

      // 6. TIMING
      {
        headerName: 'Timing',
        width: 140,
        cellRenderer: (params: any) => {
          const shift = params.data.attendanceConfig?.shiftId;
          
          if (shift && shift.startTime && shift.endTime) {
            return `
              <div style="display:flex; align-items:center; height:100%; color:var(--text-secondary); font-size:12px; font-family:var(--font-mono, monospace);">
                ${shift.startTime} - ${shift.endTime}
              </div>
            `;
          }
          return `<div style="display:flex; align-items:center; height:100%; color:var(--text-tertiary);">-</div>`;
        }
      },

      // 7. BIOMETRIC / CONFIG (Fixed Badge Size)
      {
        headerName: 'Config',
        width: 150,
        cellRenderer: (params: any) => {
          const config = params.data.attendanceConfig || {};
          const machineId = config.machineUserId;
          
          if (machineId) {
            // 🛠️ FIX: Smaller padding and font size for the ID badge
            return `
              <div style="display:flex; align-items:center; height:100%;">
                <span style="
                  background:var(--bg-secondary); 
                  border:1px solid var(--border-secondary); 
                  color:var(--text-secondary); 
                  padding: 0px 6px; 
                  border-radius:4px; 
                  font-family:monospace; 
                  font-size:10px; 
                  line-height: 1.4;
                ">
                  ID: ${machineId}
                </span>
              </div>`;
          }
          
          const methods = [];
          if (config.allowWebPunch) methods.push('Web');
          if (config.allowMobilePunch) methods.push('App');
          
          return methods.length > 0 
            ? `<div style="display:flex; align-items:center; height:100%; font-size:11px; color:var(--text-tertiary);">${methods.join(', ')}</div>`
            : `<div style="display:flex; align-items:center; height:100%; color:var(--text-tertiary); font-size:11px;">-</div>`;
        }
      },

      // 8. BRANCH
      {
        headerName: 'Branch',
        field: 'branchId.name',
        width: 130,
        valueFormatter: (p: any) => p.value || 'Global',
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'color': 'var(--text-secondary)', 'font-size': '12px' }
      },

      // 9. STATUS
     // 9. STATUS (Refined Compact Style)
      {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
        sortable: true,
        cellRenderer: (params: any) => {
          const isActive = params.value;
          
          // Define Colors (Background, Text, Border)
          const bg = isActive ? '#ecfdf5' : '#fef2f2';     // Green-50 vs Red-50
          const color = isActive ? '#15803d' : '#b91c1c';  // Green-700 vs Red-700
          const border = isActive ? '#bbf7d0' : '#fecaca'; // Green-200 vs Red-200
          
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: ${bg}; 
                color: ${color}; 
                border: 1px solid ${border}; 
                padding: 1px 8px; 
                border-radius: 4px; 
                font-size: 10px; 
                font-weight: 700; 
                text-transform: uppercase; 
                line-height: 1.2; 
                white-space: nowrap;
                letter-spacing: 0.5px;
              ">
                ${isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }
// setupColumns(): void {
//     this.column = [
//       // 1. AVATAR
//       {
//         field: 'avatar',
//         headerName: '',
//         cellRenderer: ImageCellRendererComponent,
//         width: 60,
//         pinned: 'left',
//         filter: false,
//         sortable: false
//       },

//       // 2. EMPLOYEE IDENTITY (Name + Email + Role)
//       {
//         headerName: 'Employee',
//         width: 250,
//         pinned: 'left',
//         cellRenderer: (params: any) => {
//           const name = params.data.name;
//           const email = params.data.email;
//           const role = params.data.role?.name || 'No Role';
          
//           return `
//             <div style="display:flex; flex-direction:column; justify-content:center; height:100%; line-height:1.3;">
//               <div style="font-weight:600; color:var(--text-primary); font-size:13px;">${name}</div>
//               <div style="font-size:11px; color:var(--text-secondary);">${email}</div>
//               <div style="font-size:10px; color:var(--accent-primary); font-weight:700; text-transform:uppercase; margin-top:2px;">${role}</div>
//             </div>
//           `;
//         }
//       },

//       // 🟢 COL 3: SHIFT NAME (Separate Column)
//       {
//         headerName: 'Shift Name',
//         width: 160,
//         cellRenderer: (params: any) => {
//           const config = params.data.attendanceConfig;
          
//           // Case 1: Disabled
//           if (!config?.isAttendanceEnabled) {
//             return `<span style="color:#94a3b8; font-style:italic;">Tracking Disabled</span>`;
//           }

//           // Case 2: Shift Object Exists
//           if (config.shiftId && config.shiftId.name) {
//             return `<div style="font-weight:600; color:#0f172a; text-transform:capitalize;">
//                       ${config.shiftId.name}
//                     </div>`;
//           }

//           // Case 3: Missing Shift (Legacy Data)
//           return `<div style="color:#ef4444; font-weight:600; display:flex; align-items:center;">
//                     <i class="pi pi-exclamation-circle" style="margin-right:5px"></i> Assign Shift
//                   </div>`;
//         }
//       },

//       // 🟢 COL 4: TIMING (Separate Column)
//       {
//         headerName: 'Work Hours',
//         width: 140,
//         cellRenderer: (params: any) => {
//           const shift = params.data.attendanceConfig?.shiftId;
          
//           if (shift && shift.startTime && shift.endTime) {
//             return `
//               <div style="display:flex; align-items:center; color:#475569; font-weight:500; font-size:12px;">
//                 <i class="pi pi-clock" style="margin-right:6px; color:#94a3b8;"></i>
//                 ${shift.startTime} - ${shift.endTime}
//               </div>
//             `;
//           }
//           return `<span style="color:#cbd5e1;">-</span>`;
//         }
//       },

//       // 🟢 COL 5: MACHINE / CONFIG (Separate Column)
//       {
//         headerName: 'Biometric / Config',
//         width: 180,
//         cellRenderer: (params: any) => {
//           const config = params.data.attendanceConfig || {};
//           const machineId = config.machineUserId;
          
//           // Show Machine ID if present
//           if (machineId) {
//             return `
//               <div style="display:flex; align-items:center;">
//                 <span style="background:#f1f5f9; border:1px solid #e2e8f0; color:#334155; padding:2px 8px; border-radius:4px; font-family:monospace; font-size:11px;">
//                   BIO-ID: ${machineId}
//                 </span>
//               </div>`;
//           }
          
//           // Fallback: Show Punch Methods
//           const methods = [];
//           if (config.allowWebPunch) methods.push('Web');
//           if (config.allowMobilePunch) methods.push('App');
          
//           if (methods.length > 0) {
//              return `<span style="font-size:11px; color:#64748b;">${methods.join(', ')} Access</span>`;
//           }

//           return `<span style="color:#cbd5e1; font-size:11px;">Not Configured</span>`;
//         }
//       },

//       // 6. BRANCH
//       {
//         headerName: 'Branch',
//         field: 'branchId.name',
//         width: 130,
//         valueFormatter: (p: any) => p.value || 'Global'
//       },

//       // 7. STATUS
//       {
//         field: 'isActive',
//         headerName: 'Status',
//         width: 100,
//         cellRenderer: (params: any) => {
//           const isActive = params.value;
//           const bg = isActive ? '#dcfce7' : '#fee2e2';
//           const color = isActive ? '#166534' : '#991b1b';
          
//           return `<span style="background:${bg}; color:${color}; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700;">
//                     ${isActive ? 'ACTIVE' : 'INACTIVE'}
//                   </span>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// setupColumns(): void {
//     this.column = [
//       // 1. AVATAR (Fixed Left)
//       {
//         field: 'avatar',
//         headerName: '',
//         cellRenderer: ImageCellRendererComponent,
//         width: 70,
//         pinned: 'left',
//         sortable: false,
//         filter: false,
//         suppressMenu: true
//       },

//       // 2. EMPLOYEE PROFILE (Name + Email + Role)
//       {
//         headerName: 'Employee Profile',
//         width: 260,
//         pinned: 'left',
//         cellRenderer: (params: any) => {
//           const name = params.data.name;
//           const email = params.data.email;
//           const role = params.data.role?.name || 'No Role';
          
//           return `
//             <div style="display:flex; flex-direction:column; justify-content:center; height:100%; line-height:1.4;">
//               <div style="font-weight:600; color:var(--text-primary); font-size:14px;">${name}</div>
//               <div style="font-size:11px; color:var(--text-secondary);">${email}</div>
//               <div style="font-size:10px; color:var(--accent-primary); font-weight:700; text-transform:uppercase; margin-top:2px;">
//                 ${role}
//               </div>
//             </div>
//           `;
//         }
//       },

//       // 3. ATTENDANCE & SHIFT CONFIG (The Critical Upgrade)
//       {
//         headerName: 'Shift & Biometric',
//         width: 240,
//         cellRenderer: (params: any) => {
//           const config = params.data.attendanceConfig;
          
//           // Case A: Attendance Disabled
//           if (!config?.isAttendanceEnabled) {
//             return `<div style="display:flex; align-items:center; height:100%; color:#94a3b8; font-style:italic;">
//                       <i class="pi pi-ban" style="margin-right:6px"></i> Tracking Disabled
//                     </div>`;
//           }

//           // Case B: Check Shift Object (Populated vs Null)
//           const shiftObj = config.shiftId; // Might be null for old users
//           const hasShift = !!shiftObj && !!shiftObj.name;

//           const shiftName = hasShift ? shiftObj.name : '⚠️ No Shift Assigned';
//           const shiftTime = hasShift ? `${shiftObj.startTime} - ${shiftObj.endTime}` : 'Action Required';
//           const machineId = config.machineUserId ? `ID: <b>${config.machineUserId}</b>` : 'No Bio-ID';

//           // Visual Styling
//           const nameColor = hasShift ? 'var(--text-primary)' : '#ef4444'; // Red if missing
//           const timeColor = hasShift ? 'var(--text-secondary)' : '#f59e0b'; // Orange if missing

//           return `
//             <div style="display:flex; flex-direction:column; justify-content:center; height:100%; line-height:1.3;">
//               <div style="font-weight:600; color:${nameColor}; font-size:13px; text-transform:capitalize;">
//                 ${shiftName}
//               </div>
//               <div style="font-size:11px; color:${timeColor}; display:flex; align-items:center; gap:4px;">
//                 <i class="pi pi-clock" style="font-size:10px"></i> ${shiftTime}
//               </div>
//               <div style="font-size:10px; color:#475569; background:var(--bg-secondary); width:fit-content; padding:1px 6px; border-radius:4px; margin-top:3px; border:1px solid var(--border-secondary);">
//                 ${machineId}
//               </div>
//             </div>
//           `;
//         }
//       },

//       // 4. PUNCH PERMISSIONS (Icons)
//       {
//         headerName: 'Access Controls',
//         width: 160,
//         cellRenderer: (params: any) => {
//           const config = params.data.attendanceConfig || {};
          
//           const web = config.allowWebPunch;
//           const mobile = config.allowMobilePunch;
//           const geo = config.enforceGeoFence;
//           const radius = config.geoFenceRadius || 0;

//           // Helper to generate status icons
//           const icon = (active: boolean, ico: string, tooltip: string) => `
//             <div title="${tooltip}: ${active ? 'ON' : 'OFF'}" 
//                  style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:${active ? '#dcfce7' : '#f1f5f9'};">
//               <i class="pi ${ico}" style="font-size:12px; color:${active ? '#16a34a' : '#cbd5e1'};"></i>
//             </div>
//           `;

//           return `
//             <div style="display:flex; align-items:center; gap:8px; height:100%;">
//               ${icon(web, 'pi-globe', 'Web Punch')}
//               ${icon(mobile, 'pi-mobile', 'Mobile App')}
//               ${icon(geo, 'pi-map-marker', `Geo-Fencing (${radius}m)`)}
//             </div>
//           `;
//         }
//       },

//       // 5. BRANCH
//       {
//         headerName: 'Branch',
//         valueGetter: (params: any) => params.data.branchId?.name,
//         width: 140,
//         filter: true,
//         cellRenderer: (params: any) => {
//           const branch = params.value || 'Global Access';
//           return `<div style="display:flex; align-items:center; height:100%; color:var(--text-secondary);">
//                     <i class="pi pi-building" style="margin-right:6px; font-size:12px;"></i> ${branch}
//                   </div>`;
//         }
//       },

//       // 6. ACCOUNT STATUS
//       {
//         field: 'isActive',
//         headerName: 'Status',
//         width: 110,
//         sortable: true,
//         cellRenderer: (params: any) => {
//           const isActive = params.value === true;
//           const label = isActive ? 'Active' : 'Inactive';
//           const bg = isActive ? '#ecfdf5' : '#fef2f2'; // Green-50 vs Red-50
//           const color = isActive ? '#059669' : '#dc2626'; // Green-600 vs Red-600
          
//           return `<div style="display:flex; align-items:center; height:100%;">
//                     <span style="background-color:${bg}; color:${color}; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; letter-spacing:0.5px;">
//                       ${label.toUpperCase()}
//                     </span>
//                   </div>`;
//         }
//       },

//       // 7. PREFERENCES (Theme/Notifications)
//       {
//         headerName: 'Prefs',
//         width: 100,
//         valueGetter: (params: any) => {
//           const n = params.data.preferences?.notifications;
//           const modes = [];
//           if (n?.email) modes.push('Email');
//           if (n?.push) modes.push('Push');
//           return modes.join(', ');
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
  // ... (Keep existing setupColumns) ...
  // setupColumns(): void {
  //   this.column = [
  //     {
  //       field: 'avatar',
  //       headerName: 'Avatar',
  //       cellRenderer: ImageCellRendererComponent,
  //       width: 80,
  //       filter: false,
  //       sortable: false,
  //       autoHeight: true
  //     },
  //     {
  //       field: 'name',
  //       headerName: 'Name',
  //       sortable: true,
  //       filter: true,
  //       width: 220,
  //       cellStyle: {
  //         'color': 'var(--theme-accent-primary)',
  //         'font-weight': '600',
  //         'cursor': 'pointer',
  //         'display': 'flex',
  //         'align-items': 'center'
  //       }
  //     },
  //     {
  //       headerName: 'Role',
  //       valueGetter: (params: any) => params.data.role?.name,
  //       width: 150,
  //       filter: true,
  //       cellRenderer: (params: any) => {
  //         const role = params.value || 'N/A';
  //         return `<span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase;">${role}</span>`;
  //       }
  //     },
  //     {
  //       headerName: 'Branch',
  //       valueGetter: (params: any) => params.data.branchId?.name,
  //       width: 150,
  //       filter: true,
  //       valueFormatter: (params: any) => params.value || 'Global'
  //     },
  //     {
  //       field: 'isActive',
  //       headerName: 'Status',
  //       width: 120,
  //       sortable: true,
  //       filter: true,
  //       valueGetter: (params: any) => params.data.isActive ? 'Active' : 'Inactive',
  //       cellStyle: (params: any) => {
  //         return params.value === 'Active'
  //           ? { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px', margin: '4px' }
  //           : { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px', margin: '4px' };
  //       }
  //     },
  //     {
  //       field: 'email',
  //       headerName: 'Email',
  //       width: 250,
  //       filter: true
  //     },
  //     {
  //       field: 'createdAt',
  //       headerName: 'Created On',
  //       width: 150,
  //       sortable: true,
  //       valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : ''
  //     }
  //   ];
  //   this.cdr.detectChanges();
  // }
}