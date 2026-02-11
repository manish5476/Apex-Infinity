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
import { SupplierService } from '../../services/supplier-service';
import { Toast } from "primeng/toast";
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

// Shared


@Component({
  selector: 'app-supplier-list',
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
  private pageSize = 50;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Filters ---
  supplierFilter = {
    companyName: null,
    phone: null,
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
      companyName: null,
      phone: null,
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

        this.totalCount =  res.pagination.totalResults 
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

  onScrolledToBottom(_?: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type=== 'cellClicked') {
      const supplierId = event.row._id;
      if (supplierId) {
        this.router.navigate([supplierId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom()
    }
  }

  getColumn(): void {
  const compactCell = {
    fontSize: 'var(--font-size-sm)',
    padding: '0 var(--spacing-md)',
    display: 'flex',
    alignItems: 'center'
  };

  this.column = [

    // ========================
    // COMPANY (Identity block)
    // ========================
    {
      headerName: 'Company',
      field: 'companyName',
      flex: 2,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (p: any) => {
        const city = p.data.address?.city || '';
        const phone = p.data.phone || '';

        return `
          <div style="line-height:1.2">
            <div style="
              color:var(--accent-primary);
              font-weight:var(--font-weight-semibold);
              font-size:var(--font-size-md);
            ">
              ${p.value}
            </div>
            <div style="
              color:var(--text-tertiary);
              font-size:var(--font-size-xs);
            ">
              ${city} • ${phone}
            </div>
          </div>
        `;
      }
    },

    // ========================
    // CONTACT
    // ========================
    {
      headerName: 'Contact',
      field: 'contactPerson',
      flex: 1.4,
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: compactCell,
      valueFormatter: (p: any) =>
        `${p.value || '—'}`
    },

    // ========================
    // EMAIL
    // ========================
    {
      headerName: 'Email',
      field: 'email',
      flex: 1.8,
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: {
        ...compactCell,
        color: 'var(--text-secondary)'
      }
    },

    // ========================
    // LOCATION
    // ========================
    {
      headerName: 'Location',
      flex: 1.2,
      sortable: true,
      filter: true,
      resizable: true,
      valueGetter: (p: any) => {
        const a = p.data.address || {};
        return `${a.city || ''}, ${a.state || ''}`;
      },
      cellStyle: compactCell
    },

    // ========================
    // OPENING BALANCE
    // ========================
    {
      headerName: 'Opening',
      field: 'openingBalance',
      width: 130,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (p: any) =>
        typeof p.value === 'number'
          ? `₹ ${p.value.toFixed(2)}`
          : '—',
      cellStyle: compactCell
    },

    // ========================
    // OUTSTANDING
    // ========================
    {
      headerName: 'Outstanding',
      field: 'outstandingBalance',
      width: 150,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (p: any) =>
        typeof p.value === 'number'
          ? `₹ ${p.value.toFixed(2)}`
          : '—',
      cellStyle: (p: any) => ({
        ...compactCell,
        fontWeight: 'var(--font-weight-semibold)',
        color:
          p.value > 0
            ? 'var(--color-error)'
            : 'var(--color-success)'
      })
    },

    // ========================
    // PAYMENT TERMS
    // ========================
    {
      headerName: 'Terms',
      field: 'paymentTerms',
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) =>
        `<span style="
          background:var(--color-info-bg);
          color:var(--color-info-dark);
          padding:2px 8px;
          border-radius:var(--ui-border-radius);
          font-size:var(--font-size-xs);
        ">
          ${p.value || 0} days
        </span>`
    },

    // ========================
    // STATUS BADGE
    // ========================
    {
      headerName: 'Status',
      field: 'isActive',
      width: 110,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => {
        const active = p.value;

        return `
          <span style="
            padding:2px 10px;
            border-radius:var(--ui-border-radius);
            font-size:var(--font-size-xs);
            font-weight:var(--font-weight-medium);
            background:${
              active
                ? 'var(--color-success-bg)'
                : 'var(--color-error-bg)'
            };
            color:${
              active
                ? 'var(--color-success-dark)'
                : 'var(--color-error-dark)'
            };
          ">
            ${active ? 'Active' : 'Inactive'}
          </span>
        `;
      }
    },

    // ========================
    // CREATED DATE
    // ========================
    {
      headerName: 'Created',
      field: 'createdAt',
      width: 130,
      sortable: true,
      valueFormatter: (p: any) =>
        p.value
          ? new Date(p.value).toLocaleDateString()
          : '—',
      cellStyle: compactCell
    }

  ];

  this.cdr.detectChanges();
}


  // getColumn(): void {
  //   this.column = [
  //     {
  //       field: 'companyName',
  //       headerName: 'Company Name',
  //       sortable: true,
  //       filter: true,
  //       resizable: true,
  //       cellStyle: {
  //         'color': 'var(--theme-accent-primary)',
  //         'font-weight': '600',
  //         'cursor': 'pointer'
  //       }
  //     },
  //     {
  //       field: 'contactPerson',
  //       headerName: 'Contact Person',
  //       sortable: true,
  //       filter: true,
  //       resizable: true,
  //     },
  //     {
  //       field: 'phone',
  //       headerName: 'Phone',
  //       sortable: true,
  //       filter: true,
  //       resizable: true,
  //     },
  //     {
  //       field: 'email',
  //       headerName: 'Email',
  //       sortable: true,
  //       filter: true,
  //       resizable: true,
  //     },
  //     {
  //       field: 'address.city',
  //       headerName: 'City',
  //       sortable: true,
  //       filter: true,
  //       resizable: true,
  //       valueGetter: (params: any) => params.data.address?.city || 'N/A',
  //     },
  //     {
  //       field: 'outstandingBalance',
  //       headerName: 'Outstanding',
  //       sortable: true,
  //       filter: 'agNumberColumnFilter',
  //       resizable: true,
  //       valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
  //       cellStyle: (params: any) => {
  //         if (params.value > 0) {
  //           return { color: 'var(--theme-error-primary)', fontWeight: 'bold' };
  //         }
  //         return {};
  //       }
  //     },
  //     {
  //       field: 'isActive',
  //       headerName: 'Status',
  //       sortable: true,
  //       filter: true,
  //       resizable: true,
  //       valueFormatter: (params: any) => params.value ? 'Active' : 'Inactive',
  //       cellStyle: (params: any) => {
  //         return params.value
  //           ? { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold' }
  //           : { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold' };
  //       },
  //     },
  //   ];
  //   this.cdr.detectChanges();
  // }
}
