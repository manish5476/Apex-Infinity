import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { PurchaseService } from '../purchase.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    RouterModule,
    AgShareGrid
  ],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.scss',
})
export class PurchaseListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService);

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  supplierOptions = signal<any[]>([]);

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Received', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Unpaid', value: 'unpaid' }
  ];

  purchaseFilter = {
    invoiceNumber: null,
    supplierId: null,
    status: null,
    paymentStatus: null,
    dateRange: null
  };

  constructor() {
    effect(() => {
      this.supplierOptions.set(this.masterList.suppliers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.purchaseFilter = {
      invoiceNumber: null,
      supplierId: null,
      status: null,
      paymentStatus: null,
      dateRange: null
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
      // Clear the grid immediately if resetting to prevent stale data display
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', []);
      }
    }

    // Handle Date Range
    let startDate, endDate;
    if (this.purchaseFilter.dateRange && Array.isArray(this.purchaseFilter.dateRange)) {
      if (this.purchaseFilter.dateRange[0]) startDate = (this.purchaseFilter.dateRange[0] as Date)?.toISOString();
      if (this.purchaseFilter.dateRange[1]) endDate = (this.purchaseFilter.dateRange[1] as Date)?.toISOString();
    }

    const filterParams = {
      ...this.purchaseFilter,
      startDate,
      endDate,
      page: this.currentPage,
      limit: this.pageSize
    };
    // Remove the raw object from params to avoid sending [object Object] in query
    delete (filterParams as any).dateRange;

    this.purchaseService.getAllPurchases(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];

        // 1. EXTRACT DATA (Structure: res.data.data)
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        // 2. EXTRACT PAGINATION (Structure: res.pagination.totalResults)
        if (res.pagination) {
          this.totalCount = res.pagination.totalResults;
        } else {
            this.totalCount = 0;
        }

        // 3. UPDATE LOCAL STATE
        this.data = [...this.data, ...newData];

        // 4. UPDATE AG-GRID
        if (this.gridApi) {
          if (isReset) {
            this.gridApi.setGridOption('rowData', this.data);
          } else {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.messageService.showError('Error', 'Failed to fetch purchases.');
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
    console.log(event)
    if (event.type=== 'cellClicked') {
      const purchaseId = event.row._id;
      if (purchaseId) {
        this.router.navigate([purchaseId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

   getColumn(): void {
  this.column = [
    // --- 1. CORE IDENTIFIERS (Pinned) ---
    {
      headerName: '',
      field: '_id',
      width: 50,
      pinned: 'left',
      cellRenderer: ActionViewRenderer,
      lockPosition: true,
      suppressMenu: true
    },
    {
      field: 'invoiceNumber',
      headerName: 'Invoice #',
      width: 140,
      pinned: 'left',
      filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => {
        const val = params.value || 'N/A';
        return `<span style="font-weight: 700; color: var(--color-primary); cursor: pointer; letter-spacing: 0.5px;">${val}</span>`;
      }
    },
    {
      field: 'purchaseDate',
      headerName: 'Date',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-',
      cellStyle: { color: 'var(--text-secondary)' }
    },

    // --- 2. SUPPLIER DETAILS (Split into individual columns) ---
    {
      field: 'supplierId.companyName',
      headerName: 'Supplier Name',
      width: 200,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => {
        const name = params.value || 'Unknown';
        // Tiny avatar for visual flair
        const char = name.charAt(0).toUpperCase();
        return `
          <div style="display:flex; align-items:center; gap:8px; height:100%;">
            <div style="width:24px; height:24px; border-radius:4px; background:var(--bg-ternary); color:var(--text-secondary); display:grid; place-items:center; font-size:10px; font-weight:700; border:1px solid var(--border-secondary);">${char}</div>
            <span style="font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden;">${name}</span>
          </div>
        `;
      }
    },
    {
      field: 'supplierId.contactPerson',
      headerName: 'Contact Person',
      width: 150,
      valueGetter: (p: any) => p.data.supplierId?.contactPerson || '-',
      cellStyle: { color: 'var(--text-secondary)' }
    },
    {
      field: 'supplierId.email',
      headerName: 'Email',
      width: 200,
      cellRenderer: (params: any) => {
        const email = params.data.supplierId?.email;
        if (!email) return '-';
        return `<a href="mailto:${email}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-envelope" style="font-size:10px"></i> ${email}</a>`;
      }
    },
    {
      field: 'supplierId.phone',
      headerName: 'Phone',
      width: 130,
      cellRenderer: (params: any) => {
        const phone = params.data.supplierId?.phone;
        if (!phone) return '-';
        return `<a href="tel:${phone}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-phone" style="font-size:10px"></i> ${phone}</a>`;
      }
    },

    // --- 3. PURCHASE DETAILS ---
    {
      field: 'branchId.name',
      headerName: 'Branch',
      width: 130,
      filter: true,
      cellRenderer: (params: any) => {
        const branch = params.data.branchId?.name || 'Main';
        return `<span style="background:var(--bg-ternary); padding:2px 8px; border-radius:4px; font-size:11px; color:var(--text-secondary); border:1px solid var(--border-secondary);">${branch}</span>`;
      }
    },
    {
      headerName: 'Items',
      field: 'items', // Array
      width: 100,
      cellRenderer: (params: any) => {
        const count = params.data.items?.length || 0;
        return `<span style="font-weight:600; color:var(--text-primary);"><i class="pi pi-box" style="font-size:10px; color:var(--text-tertiary); margin-right:4px;"></i> ${count}</span>`;
      }
    },

    // --- 4. FINANCIALS (Separate Columns) ---
    {
      field: 'subTotal',
      headerName: 'Sub Total',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: { color: 'var(--text-tertiary)' }
    },
    {
      field: 'totalTax',
      headerName: 'Tax',
      width: 100,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: { color: 'var(--text-tertiary)' }
    },
    {
      field: 'grandTotal',
      headerName: 'Grand Total',
      width: 130,
      type: 'rightAligned',
      cellStyle: { fontWeight: '700', color: 'var(--text-primary)' },
      valueFormatter: (p: any) => this.formatCurrency(p.value)
    },
    {
      field: 'paidAmount',
      headerName: 'Paid',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: { color: 'var(--color-success)' }
    },
    {
      field: 'balanceAmount',
      headerName: 'Balance',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: (params: any) => {
        return params.value > 0 
          ? { color: 'var(--color-error)', fontWeight: '700' } // Due
          : { color: 'var(--text-tertiary)', opacity: 0.7 };   // Cleared
      }
    },

    // --- 5. STATUSES ---
    {
      field: 'status',
      headerName: 'Order Status',
      width: 130,
      cellRenderer: (params: any) => {
        const status = params.value || 'draft';
        // Map colors manually to ensure they match theme tokens without extra CSS
        const colors: any = {
          received: { bg: '#ecfdf5', text: '#059669' },
          draft: { bg: '#f3f4f6', text: '#4b5563' },
          cancelled: { bg: '#fef2f2', text: '#dc2626' }
        };
        const c = colors[status] || colors.draft;
        return `<span style="background:${c.bg}; color:${c.text}; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">${status}</span>`;
      }
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 140,
      cellRenderer: (params: any) => {
        const status = params.value || 'unpaid';
        const icons: any = { paid: 'pi-check-circle', unpaid: 'pi-times-circle', partial: 'pi-exclamation-circle' };
        const colors: any = {
          paid: { color: '#10b981' },
          unpaid: { color: '#ef4444' },
          partial: { color: '#f59e0b' }
        };
        const c = colors[status] || colors.unpaid;
        return `
          <div style="display:flex; align-items:center; gap:6px; color:${c.color}; font-weight:600; font-size:11px; text-transform:uppercase;">
            <i class="pi ${icons[status] || 'pi-info-circle'}"></i> ${status}
          </div>
        `;
      }
    },
    {
      field: 'paymentMethod',
      headerName: 'Method',
      width: 110,
      valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : '-',
      cellStyle: { color: 'var(--text-secondary)', fontSize: '11px' }
    },

    // --- 6. META ---
    {
      field: 'createdBy.name',
      headerName: 'Created By',
      width: 140,
      cellRenderer: (params: any) => {
        const name = params.data.createdBy?.name || 'System';
        return `<span style="font-size:11px; color:var(--text-secondary);"><i class="pi pi-user" style="font-size:9px; margin-right:4px;"></i>${name}</span>`;
      }
    }
  ];
  this.cdr.detectChanges();
}

  // getColumn(): void {
  //   this.column = [
  //     // --- 1. CORE IDENTIFIERS (Pinned) ---
  //     {
  //       headerName: '',
  //       field: '_id', // Used for ID access, usually Action buttons
  //       width: 50,
  //       pinned: 'left',
  //       cellRenderer: ActionViewRenderer,
  //       lockPosition: true,
  //       suppressMenu: true
  //     },
  //     {
  //       field: 'invoiceNumber',
  //       headerName: 'Invoice #',
  //       width: 140,
  //       pinned: 'left',
  //       filter: 'agTextColumnFilter',
  //       cellRenderer: (params: any) => {
  //         const val = params.value || 'N/A';
  //         return `<span style="font-weight: 700; color: var(--primary-color); cursor: pointer; letter-spacing: 0.5px;">${val}</span>`;
  //       }
  //     },
  //     {
  //       field: 'purchaseDate',
  //       headerName: 'Date',
  //       width: 120,
  //       filter: 'agDateColumnFilter',
  //       valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-',
  //       cellStyle: { color: 'var(--text-color-secondary)' }
  //     },

  //     // --- 2. SUPPLIER DETAILS ---
  //     {
  //       field: 'supplierId.companyName',
  //       headerName: 'Supplier Name',
  //       width: 200,
  //       filter: 'agTextColumnFilter',
  //       cellRenderer: (params: any) => {
  //         const name = params.value || 'Unknown';
  //         const char = name.charAt(0).toUpperCase();
  //         return `
  //           <div style="display:flex; align-items:center; gap:8px; height:100%;">
  //             <div style="width:24px; height:24px; border-radius:4px; background:var(--surface-ground); color:var(--text-color-secondary); display:grid; place-items:center; font-size:10px; font-weight:700; border:1px solid var(--surface-border);">${char}</div>
  //             <span style="font-weight:600; color:var(--text-color); text-overflow:ellipsis; overflow:hidden;">${name}</span>
  //           </div>
  //         `;
  //       }
  //     },
  //     {
  //       field: 'supplierId.contactPerson',
  //       headerName: 'Contact Person',
  //       width: 150,
  //       valueGetter: (p: any) => p.data.supplierId?.contactPerson || '-',
  //       cellStyle: { color: 'var(--text-color-secondary)' }
  //     },
  //     {
  //       field: 'supplierId.phone',
  //       headerName: 'Phone',
  //       width: 130,
  //       cellRenderer: (params: any) => {
  //         const phone = params.data.supplierId?.phone;
  //         if (!phone) return '-';
  //         return `<a href="tel:${phone}" style="color:var(--text-color-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-phone" style="font-size:10px"></i> ${phone}</a>`;
  //       }
  //     },

  //     // --- 3. PURCHASE DETAILS ---
  //     {
  //       field: 'branchId.name',
  //       headerName: 'Branch',
  //       width: 130,
  //       filter: true,
  //       cellRenderer: (params: any) => {
  //         const branch = params.data.branchId?.name || 'Main';
  //         return `<span style="background:var(--surface-ground); padding:2px 8px; border-radius:4px; font-size:11px; color:var(--text-color-secondary); border:1px solid var(--surface-border);">${branch}</span>`;
  //       }
  //     },
  //     {
  //       headerName: 'Items',
  //       field: 'items',
  //       width: 100,
  //       cellRenderer: (params: any) => {
  //         const count = params.data.items?.length || 0;
  //         return `<span style="font-weight:600; color:var(--text-color);"><i class="pi pi-box" style="font-size:10px; color:var(--text-color-secondary); margin-right:4px;"></i> ${count}</span>`;
  //       }
  //     },

  //     // --- 4. FINANCIALS ---
  //     {
  //       field: 'subTotal',
  //       headerName: 'Sub Total',
  //       width: 120,
  //       type: 'numericColumn',
  //       valueFormatter: (p: any) => this.formatCurrency(p.value),
  //       cellStyle: { color: 'var(--text-color-secondary)' }
  //     },
  //     {
  //       field: 'totalTax',
  //       headerName: 'Tax',
  //       width: 100,
  //       type: 'numericColumn',
  //       valueFormatter: (p: any) => this.formatCurrency(p.value),
  //       cellStyle: { color: 'var(--text-color-secondary)' }
  //     },
  //     {
  //       field: 'grandTotal',
  //       headerName: 'Grand Total',
  //       width: 130,
  //       type: 'numericColumn',
  //       cellStyle: { fontWeight: '700', color: 'var(--text-color)' },
  //       valueFormatter: (p: any) => this.formatCurrency(p.value)
  //     },
  //     {
  //       field: 'paidAmount',
  //       headerName: 'Paid',
  //       width: 120,
  //       type: 'numericColumn',
  //       valueFormatter: (p: any) => this.formatCurrency(p.value),
  //       cellStyle: { color: 'var(--green-600)' }
  //     },
  //     {
  //       field: 'balanceAmount',
  //       headerName: 'Balance',
  //       width: 120,
  //       type: 'numericColumn',
  //       valueFormatter: (p: any) => this.formatCurrency(p.value),
  //       cellStyle: (params: any) => {
  //         return params.value > 0
  //           ? { color: 'var(--red-600)', fontWeight: '700' } // Due
  //           : { color: 'var(--text-color-secondary)', opacity: 0.7 };   // Cleared
  //       }
  //     },

  //     // --- 5. STATUSES ---
  //     {
  //       field: 'status',
  //       headerName: 'Order Status',
  //       width: 130,
  //       cellRenderer: (params: any) => {
  //         const status = params.value || 'draft';
  //         const colors: any = {
  //           received: { bg: 'var(--green-50)', text: 'var(--green-700)' },
  //           draft: { bg: 'var(--gray-50)', text: 'var(--gray-600)' },
  //           cancelled: { bg: 'var(--red-50)', text: 'var(--red-700)' }
  //         };
  //         const c = colors[status] || colors.draft;
  //         return `<span style="background:${c.bg}; color:${c.text}; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">${status}</span>`;
  //       }
  //     },
  //     {
  //       field: 'paymentStatus',
  //       headerName: 'Payment Status',
  //       width: 140,
  //       cellRenderer: (params: any) => {
  //         const status = params.value || 'unpaid';
  //         const icons: any = { paid: 'pi-check-circle', unpaid: 'pi-times-circle', partial: 'pi-exclamation-circle' };
  //         const colors: any = {
  //           paid: { color: 'var(--green-500)' },
  //           unpaid: { color: 'var(--red-500)' },
  //           partial: { color: 'var(--orange-500)' }
  //         };
  //         const c = colors[status] || colors.unpaid;
  //         return `
  //           <div style="display:flex; align-items:center; gap:6px; color:${c.color}; font-weight:600; font-size:11px; text-transform:uppercase;">
  //             <i class="pi ${icons[status] || 'pi-info-circle'}"></i> ${status}
  //           </div>
  //         `;
  //       }
  //     },

  //     // --- 6. META ---
  //     {
  //       field: 'createdBy.name',
  //       headerName: 'Created By',
  //       width: 140,
  //       cellRenderer: (params: any) => {
  //         const name = params.data.createdBy?.name || 'System';
  //         return `<span style="font-size:11px; color:var(--text-color-secondary);"><i class="pi pi-user" style="font-size:9px; margin-right:4px;"></i>${name}</span>`;
  //       }
  //     }
  //   ];
  //   this.cdr.detectChanges();
  // }

  // Helper for Currency
  private formatCurrency(value: number): string {
    return value !== undefined && value !== null
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value)
      : '₹ 0.00';
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
// import { DatePickerModule } from 'primeng/datepicker'; // Use correct module
// import { PurchaseService } from '../purchase.service';
// import { AgShareGrid } from "../../shared/components/ag-shared-grid";
// import { MasterListService } from '../../../core/services/master-list.service';
// import { AppMessageService } from '../../../core/services/message.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';
// import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

// @Component({
//   selector: 'app-purchase-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     DatePickerModule,
//     RouterModule,
//     AgShareGrid
//   ],
//   templateUrl: './purchase-list.html',
//   styleUrl: './purchase-list.scss',
// })
// export class PurchaseListComponent implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private purchaseService = inject(PurchaseService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private common = inject(CommonMethodService); // Injected

//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 50;

//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   supplierOptions = signal<any[]>([]);

//   statusOptions = [
//     { label: 'Draft', value: 'draft' },
//     { label: 'Received', value: 'received' },
//     { label: 'Cancelled', value: 'cancelled' }
//   ];

//   paymentStatusOptions = [
//     { label: 'Paid', value: 'paid' },
//     { label: 'Partial', value: 'partial' },
//     { label: 'Unpaid', value: 'unpaid' }
//   ];

//   purchaseFilter = {
//     invoiceNumber: null,
//     supplierId: null,
//     status: null,
//     paymentStatus: null,
//     dateRange: null 
//   };

//   constructor() {
//     effect(() => {
//       this.supplierOptions.set(this.masterList.suppliers());
//     });
//   }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.purchaseFilter = {
//       invoiceNumber: null,
//       supplierId: null,
//       status: null,
//       paymentStatus: null,
//       dateRange: null
//     };
//     this.getData(true);
//   }

// getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;
    
//     if (isReset) { 
//       this.currentPage = 1; 
//       this.data = []; 
//       this.totalCount = 0; 
//     }
    
//     let startDate, endDate;
//     if (this.purchaseFilter.dateRange && Array.isArray(this.purchaseFilter.dateRange)) {
//       if (this.purchaseFilter.dateRange[0]) startDate = (this.purchaseFilter.dateRange[0] as Date)?.toISOString();
//       if (this.purchaseFilter.dateRange[1]) endDate = (this.purchaseFilter.dateRange[1] as Date)?.toISOString();
//     }

//     const filterParams = { 
//         ...this.purchaseFilter, 
//         startDate, 
//         endDate, 
//         page: this.currentPage, 
//         limit: this.pageSize 
//     };
//     delete (filterParams as any).dateRange;

//     this.purchaseService.getAllPurchases(filterParams).subscribe({
//       next: (res: any) => {
//         // UPDATED: Mapping to res.data.data as per your JSON
//         const newData = res.data?.data || []; 
        
//         // Results count often comes from res.pagination.total or res.results
//         this.totalCount = res.pagination.totalResults 
        
//         if (isReset) {
//           this.data = newData;
//         } else {
//           this.data = [...this.data, ...newData];
//           if (this.gridApi) {
//             this.gridApi.applyTransaction({ add: newData });
//           }
//         }

//         this.currentPage++;
//         this.isLoading = false;
//         this.cdr.detectChanges(); // Use detectChanges to ensure grid updates
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch purchases.');
//       }
//     });
//   }
//   onScrolledToBottom(_: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

  // eventFromGrid(event: any) {
  //   console.log(event)
  //   if (event.type=== 'cellClicked') {
  //     const purchaseId = event.row._id;
  //     if (purchaseId) {
  //       this.router.navigate([purchaseId], { relativeTo: this.route });
  //     }
  //   }
  //   if (event.type === 'reachedBottom') {
  //     this.onScrolledToBottom(event)
  //   }
  // }
//   getColumn(): void {
//   this.column = [
//     // --- 1. CORE IDENTIFIERS (Pinned) ---
//     {
//       headerName: '',
//       field: '_id',
//       width: 50,
//       pinned: 'left',
//       cellRenderer: ActionViewRenderer,
//       lockPosition: true,
//       suppressMenu: true
//     },
//     {
//       field: 'invoiceNumber',
//       headerName: 'Invoice #',
//       width: 140,
//       pinned: 'left',
//       filter: 'agTextColumnFilter',
//       cellRenderer: (params: any) => {
//         const val = params.value || 'N/A';
//         return `<span style="font-weight: 700; color: var(--color-primary); cursor: pointer; letter-spacing: 0.5px;">${val}</span>`;
//       }
//     },
//     {
//       field: 'purchaseDate',
//       headerName: 'Date',
//       width: 120,
//       filter: 'agDateColumnFilter',
//       valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-',
//       cellStyle: { color: 'var(--text-secondary)' }
//     },

//     // --- 2. SUPPLIER DETAILS (Split into individual columns) ---
//     {
//       field: 'supplierId.companyName',
//       headerName: 'Supplier Name',
//       width: 200,
//       filter: 'agTextColumnFilter',
//       cellRenderer: (params: any) => {
//         const name = params.value || 'Unknown';
//         // Tiny avatar for visual flair
//         const char = name.charAt(0).toUpperCase();
//         return `
//           <div style="display:flex; align-items:center; gap:8px; height:100%;">
//             <div style="width:24px; height:24px; border-radius:4px; background:var(--bg-ternary); color:var(--text-secondary); display:grid; place-items:center; font-size:10px; font-weight:700; border:1px solid var(--border-secondary);">${char}</div>
//             <span style="font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden;">${name}</span>
//           </div>
//         `;
//       }
//     },
//     {
//       field: 'supplierId.contactPerson',
//       headerName: 'Contact Person',
//       width: 150,
//       valueGetter: (p: any) => p.data.supplierId?.contactPerson || '-',
//       cellStyle: { color: 'var(--text-secondary)' }
//     },
//     {
//       field: 'supplierId.email',
//       headerName: 'Email',
//       width: 200,
//       cellRenderer: (params: any) => {
//         const email = params.data.supplierId?.email;
//         if (!email) return '-';
//         return `<a href="mailto:${email}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-envelope" style="font-size:10px"></i> ${email}</a>`;
//       }
//     },
//     {
//       field: 'supplierId.phone',
//       headerName: 'Phone',
//       width: 130,
//       cellRenderer: (params: any) => {
//         const phone = params.data.supplierId?.phone;
//         if (!phone) return '-';
//         return `<a href="tel:${phone}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-phone" style="font-size:10px"></i> ${phone}</a>`;
//       }
//     },

//     // --- 3. PURCHASE DETAILS ---
//     {
//       field: 'branchId.name',
//       headerName: 'Branch',
//       width: 130,
//       filter: true,
//       cellRenderer: (params: any) => {
//         const branch = params.data.branchId?.name || 'Main';
//         return `<span style="background:var(--bg-ternary); padding:2px 8px; border-radius:4px; font-size:11px; color:var(--text-secondary); border:1px solid var(--border-secondary);">${branch}</span>`;
//       }
//     },
//     {
//       headerName: 'Items',
//       field: 'items', // Array
//       width: 100,
//       cellRenderer: (params: any) => {
//         const count = params.data.items?.length || 0;
//         return `<span style="font-weight:600; color:var(--text-primary);"><i class="pi pi-box" style="font-size:10px; color:var(--text-tertiary); margin-right:4px;"></i> ${count}</span>`;
//       }
//     },

//     // --- 4. FINANCIALS (Separate Columns) ---
//     {
//       field: 'subTotal',
//       headerName: 'Sub Total',
//       width: 120,
//       type: 'rightAligned',
//       valueFormatter: (p: any) => this.formatCurrency(p.value),
//       cellStyle: { color: 'var(--text-tertiary)' }
//     },
//     {
//       field: 'totalTax',
//       headerName: 'Tax',
//       width: 100,
//       type: 'rightAligned',
//       valueFormatter: (p: any) => this.formatCurrency(p.value),
//       cellStyle: { color: 'var(--text-tertiary)' }
//     },
//     {
//       field: 'grandTotal',
//       headerName: 'Grand Total',
//       width: 130,
//       type: 'rightAligned',
//       cellStyle: { fontWeight: '700', color: 'var(--text-primary)' },
//       valueFormatter: (p: any) => this.formatCurrency(p.value)
//     },
//     {
//       field: 'paidAmount',
//       headerName: 'Paid',
//       width: 120,
//       type: 'rightAligned',
//       valueFormatter: (p: any) => this.formatCurrency(p.value),
//       cellStyle: { color: 'var(--color-success)' }
//     },
//     {
//       field: 'balanceAmount',
//       headerName: 'Balance',
//       width: 120,
//       type: 'rightAligned',
//       valueFormatter: (p: any) => this.formatCurrency(p.value),
//       cellStyle: (params: any) => {
//         return params.value > 0 
//           ? { color: 'var(--color-error)', fontWeight: '700' } // Due
//           : { color: 'var(--text-tertiary)', opacity: 0.7 };   // Cleared
//       }
//     },

//     // --- 5. STATUSES ---
//     {
//       field: 'status',
//       headerName: 'Order Status',
//       width: 130,
//       cellRenderer: (params: any) => {
//         const status = params.value || 'draft';
//         // Map colors manually to ensure they match theme tokens without extra CSS
//         const colors: any = {
//           received: { bg: '#ecfdf5', text: '#059669' },
//           draft: { bg: '#f3f4f6', text: '#4b5563' },
//           cancelled: { bg: '#fef2f2', text: '#dc2626' }
//         };
//         const c = colors[status] || colors.draft;
//         return `<span style="background:${c.bg}; color:${c.text}; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">${status}</span>`;
//       }
//     },
//     {
//       field: 'paymentStatus',
//       headerName: 'Payment Status',
//       width: 140,
//       cellRenderer: (params: any) => {
//         const status = params.value || 'unpaid';
//         const icons: any = { paid: 'pi-check-circle', unpaid: 'pi-times-circle', partial: 'pi-exclamation-circle' };
//         const colors: any = {
//           paid: { color: '#10b981' },
//           unpaid: { color: '#ef4444' },
//           partial: { color: '#f59e0b' }
//         };
//         const c = colors[status] || colors.unpaid;
//         return `
//           <div style="display:flex; align-items:center; gap:6px; color:${c.color}; font-weight:600; font-size:11px; text-transform:uppercase;">
//             <i class="pi ${icons[status] || 'pi-info-circle'}"></i> ${status}
//           </div>
//         `;
//       }
//     },
//     {
//       field: 'paymentMethod',
//       headerName: 'Method',
//       width: 110,
//       valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : '-',
//       cellStyle: { color: 'var(--text-secondary)', fontSize: '11px' }
//     },

//     // --- 6. META ---
//     {
//       field: 'createdBy.name',
//       headerName: 'Created By',
//       width: 140,
//       cellRenderer: (params: any) => {
//         const name = params.data.createdBy?.name || 'System';
//         return `<span style="font-size:11px; color:var(--text-secondary);"><i class="pi pi-user" style="font-size:9px; margin-right:4px;"></i>${name}</span>`;
//       }
//     }
//   ];
//   this.cdr.detectChanges();
// }

// // Helper to ensure currency formatting works perfectly
// private formatCurrency(value: number): string {
//   return value !== undefined && value !== null 
//     ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value)
//     : '₹ 0.00';
// }
// }

