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
    // PrimeNG
    SelectModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    // Shared
    AgShareGrid
  ],
  providers: [UserManagementService],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserListComponent implements OnInit {
  // --- Injections ---
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);

  // --- Grid State ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;

  data: any[] = [];
  column: any[] = [];

  // --- Master Data Signals ---
  roleOptions = signal<any[]>([]);
  branchOptions = signal<any[]>([]);

  // --- Filters ---
  userFilter = {
    role: null,
    branchId: null,
    search: ''
  };

  constructor() {
    // Sync filters with MasterList
    effect(() => {
      this.roleOptions.set(this.masterList.roles());
      this.branchOptions.set(this.masterList.branches());
    });
  }

  ngOnInit(): void {
    this.setupColumns();
    this.getData(true);
  }

  // --- Actions ---
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

  // --- Data Fetching ---
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

  // --- Grid Events ---
  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked') {
      const userId = event.row._id;
      // Navigate to details on name click or explicit action
      // if (event.colDef.field === 'name' || event.event.target.closest('.action-btn')) {
        this.router.navigate(['/user/details', userId]);
      // }
    }
    if (event.eventType === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }

  // --- Column Definition ---
 setupColumns(): void {
    this.column = [
      {
        field: 'avatar',
        headerName: 'Avatar',
        cellRenderer: ImageCellRendererComponent,
        width: 80,
        filter: false,
        sortable: false,
        autoHeight: true
      },
      {
        field: 'name',
        headerName: 'Name',
        sortable: true,
        filter: true,
        width: 220,
        cellStyle: {
          'color': 'var(--theme-accent-primary)',
          'font-weight': '600',
          'cursor': 'pointer',
          'display': 'flex',
          'align-items': 'center'
        }
      },
      {
        headerName: 'Role',
        // ✅ FIX: Use valueGetter for nested 'role.name'
        valueGetter: (params: any) => params.data.role?.name, 
        width: 150,
        filter: true,
        cellRenderer: (params: any) => {
           const role = params.value || 'N/A';
           // Using inline styles to match your system's look without extra CSS files
           return `<span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase;">${role}</span>`;
        }
      },
      {
        headerName: 'Branch',
        // ✅ FIX: Use valueGetter for nested 'branchId.name'
        valueGetter: (params: any) => params.data.branchId?.name,
        width: 150,
        filter: true,
        valueFormatter: (params: any) => params.value || 'Global'
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 120,
        sortable: true,
        filter: true,
        valueGetter: (params: any) => params.data.isActive ? 'Active' : 'Inactive',
        // ✅ Match CustomerList style exactly
        cellStyle: (params: any) => {
          return params.value === 'Active'
            ? { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px', margin: '4px' }
            : { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px', margin: '4px' };
        }
      },
      {
        field: 'email',
        headerName: 'Email',
        width: 250,
        filter: true
      },
      {
        field: 'createdAt',
        headerName: 'Created On',
        width: 150,
        sortable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : ''
      }
    ];
    this.cdr.detectChanges();
  }
}