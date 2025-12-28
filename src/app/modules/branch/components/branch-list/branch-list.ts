import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AppMessageService } from '../../../../core/services/message.service';
import { BranchService } from '../../services/branch-service';
import { Toast } from "primeng/toast";
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    Toast,
    AgShareGrid
  ],
  templateUrl: './branch-list.html',
  styleUrl: './branch-list.scss',
})
export class BranchListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private branchService = inject(BranchService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;

  data: any[] = [];
  column: any = [];
  branchFilter = { name: '' };

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.branchFilter.name = '';
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading && !isReset) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    // Build params for the Backend ApiFeatures
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    };

    // FIX: Map UI 'name' to Backend 'search' if text exists
    if (this.branchFilter.name.trim()) {
      params.search = this.branchFilter.name.trim();
    }

    this.branchService.getAllBranches(params).subscribe({
      next: (res: any) => {
        // Correctly access nested data from Factory response
        const newData = res.data?.data || [];
        
        // Correctly handle pagination totals
        this.totalCount = res.pagination?.total || res.results || 0;

        this.data = isReset ? newData : [...this.data, ...newData];

        if (newData.length > 0) {
          this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.detectChanges(); // Vital for async updates
      },
      error: () => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch branches.');
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

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked' && event.field === 'name') {
      const branchId = event.row._id;
      if (branchId) {
        this.router.navigate([branchId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'name',
        headerName: 'Branch Name',
        flex: 1,
        minWidth: 200,
        cellStyle: {
          'color': 'var(--accent-primary)',
          'font-weight': '600',
          'cursor': 'pointer'
        }
      },
      { field: 'branchCode', headerName: 'Code', width: 120 },
      {
        headerName: 'City',
        valueGetter: (p: any) => p.data.address?.city || '-'
      },
      {
        field: 'phoneNumber',
        headerName: 'Phone',
        width: 150
      },
      {
        headerName: 'Status',
        field: 'isActive',
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value ? 'active' : 'inactive';
          const badgeClass = params.value ? 'badge-brand' : 'badge-unit';
          return `
            <div class="badge-wrapper">
              <span class="pill-badge ${badgeClass}">${status}</span>
            </div>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }
}
// import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { BranchService } from '../../services/branch-service';
// import { Toast } from "primeng/toast";
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

// // Shared


// @Component({
//   selector: 'app-branch-list',
//   standalone: true,
//   imports: [
//     CommonModule,

//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule,
//     Toast,
//     AgShareGrid
// ],
//   templateUrl: './branch-list.html',
//   styleUrl: './branch-list.scss',
// })
// export class BranchListComponent implements OnInit {
//   // --- Injected Services ---
//   private cdr = inject(ChangeDetectorRef);
//   private branchService = inject(BranchService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   // --- Grid & Data ---
//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 20;
//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   // --- Filters ---
//   branchFilter = {
//     name: '',
//   };

//   constructor() { }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.branchFilter = {
//       name: '',
//     };
//     this.getData(true);
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const filterParams = {
//       ...this.branchFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     // Using 'getAllBranches' as the default list
//     this.branchService.getAllBranches(filterParams).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) {
//           newData = res.data.data;
//         }

//         this.totalCount = res.results || this.totalCount;
//         this.data = [...this.data, ...newData];

//         if (this.gridApi) {
//           // if (isReset) this.gridApi.setRowData(this.data);
//           // else this.gridApi.applyTransaction({ add: newData });
//         }

//         this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch branches.');
//       }
//     });
//   }

//   onScrolledToBottom(_?: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   eventFromGrid(event: any) {
//     if (event.type=== 'cellClicked') {
//       const branchId = event.row._id;
//       if (branchId) {
//         this.router.navigate([branchId], { relativeTo: this.route });
//       }
//     }
//      if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom()
//     }
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         field: 'name',
//         headerName: 'Branch Name',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         cellStyle: {
//           'color': 'var(--theme-accent-primary)',
//           'font-weight': '600',
//           'cursor': 'pointer'
//         }
//       },
//       {
//         field: 'branchCode',
//         headerName: 'Code',
//         sortable: true,
//         filter: true,
//         resizable: true,
//       },
//       {
//         field: 'address.city',
//         headerName: 'City',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueGetter: (params: any) => params.data.address?.city || 'N/A',
//       },
//       {
//         field: 'address.state',
//         headerName: 'State',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueGetter: (params: any) => params.data.address?.state || 'N/A',
//       },
//       {
//         field: 'phoneNumber',
//         headerName: 'Phone',
//         sortable: true,
//         filter: true,
//         resizable: true,
//       },
//       {
//         field: 'manager.name', // Assuming backend populates manager
//         headerName: 'Manager',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueGetter: (params: any) => params.data.manager?.name || 'N/A',
//       },
//       {
//         field: 'isMainBranch',
//         headerName: 'Main',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueFormatter: (params: any) => params.value ? 'Yes' : 'No',
//         cellStyle: (params: any) => {
//           if (params.value) {
//             return { color: 'var(--theme-accent-primary)', fontWeight: 'bold' };
//           }
//           return {};
//         }
//       },
//       {
//         field: 'isActive',
//         headerName: 'Status',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueFormatter: (params: any) => params.value ? 'Active' : 'Inactive',
//         cellStyle: (params: any) => {
//           return params.value
//             ? { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold' }
//             : { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold' };
//         },
//       },
//     ];
//     this.cdr.detectChanges();
//   }
// }