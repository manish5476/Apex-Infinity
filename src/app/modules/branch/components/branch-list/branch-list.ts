import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AppMessageService } from '../../../../core/services/message.service';
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { BranchService } from '../../services/branch-service';
import { Toast } from "primeng/toast";

// Shared


@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    Toast
],
  templateUrl: './branch-list.html',
  styleUrl: './branch-list.scss',
})
export class BranchListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private branchService = inject(BranchService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Filters ---
  branchFilter = {
    name: '',
  };

  constructor() { }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.branchFilter = {
      name: '',
    };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const filterParams = {
      ...this.branchFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    // Using 'getAllBranches' as the default list
    this.branchService.getAllBranches(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData];

        if (this.gridApi) {
          // if (isReset) this.gridApi.setRowData(this.data);
          // else this.gridApi.applyTransaction({ add: newData });
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch branches.');
      }
    });
  }

  onScrolledToBottom(_: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.eventType === 'RowSelectedEvent') {
      const branchId = event.event.data._id;
      if (branchId) {
        this.router.navigate([branchId], { relativeTo: this.route });
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'name',
        headerName: 'Branch Name',
        sortable: true,
        filter: true,
        resizable: true,
        cellStyle: {
          'color': 'var(--theme-accent-primary)',
          'font-weight': '600',
          'cursor': 'pointer'
        }
      },
      {
        field: 'branchCode',
        headerName: 'Code',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'address.city',
        headerName: 'City',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.address?.city || 'N/A',
      },
      {
        field: 'address.state',
        headerName: 'State',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.address?.state || 'N/A',
      },
      {
        field: 'phoneNumber',
        headerName: 'Phone',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'manager.name', // Assuming backend populates manager
        headerName: 'Manager',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.manager?.name || 'N/A',
      },
      {
        field: 'isMainBranch',
        headerName: 'Main',
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params: any) => params.value ? 'Yes' : 'No',
        cellStyle: (params: any) => {
          if (params.value) {
            return { color: 'var(--theme-accent-primary)', fontWeight: 'bold' };
          }
          return {};
        }
      },
      {
        field: 'isActive',
        headerName: 'Status',
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params: any) => params.value ? 'Active' : 'Inactive',
        cellStyle: (params: any) => {
          return params.value
            ? { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold' }
            : { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold' };
        },
      },
    ];
    this.cdr.detectChanges();
  }
}