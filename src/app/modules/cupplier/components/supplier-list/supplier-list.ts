// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-supplier-list',
//   imports: [],
//   templateUrl: './supplier-list.html',
//   styleUrl: './supplier-list.scss',
// })
// export class SupplierList {

// }
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
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
import { SupplierService } from '../../services/supplier-service';

// Shared


@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
})
export class SupplierListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
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
  supplierFilter = {
    companyName: '',
    phone: '',
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
    this.supplierFilter = {
      companyName: '',
      phone: '',
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
      ...this.supplierFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.supplierService.getAllSuppliers(filterParams).subscribe({
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
        this.messageService.showError('Error', 'Failed to fetch suppliers.');
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
    if (event.eventType === 'onRowClicked') {
      const supplierId = event.event.data._id;
      if (supplierId) {
        this.router.navigate([supplierId], { relativeTo: this.route });
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'companyName',
        headerName: 'Company Name',
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
        field: 'contactPerson',
        headerName: 'Contact Person',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'phone',
        headerName: 'Phone',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'email',
        headerName: 'Email',
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
        field: 'outstandingBalance',
        headerName: 'Outstanding',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
        cellStyle: (params: any) => {
          if (params.value > 0) {
            return { color: 'var(--theme-error-primary)', fontWeight: 'bold' };
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