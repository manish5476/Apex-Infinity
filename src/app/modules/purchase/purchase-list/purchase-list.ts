import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker'; // Use correct module
import { PurchaseService } from '../purchase.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';

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
  private common = inject(CommonMethodService); // Injected

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;

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

  // getData(isReset: boolean = false) {
  //   if (this.isLoading) return;
  //   this.isLoading = true;
  //   if (isReset) { this.currentPage = 1; this.data = []; this.totalCount = 0 }
    
  //   let startDate, endDate;
  //   if (this.purchaseFilter.dateRange && Array.isArray(this.purchaseFilter.dateRange)) {
  //     if (this.purchaseFilter.dateRange[0]) startDate = (this.purchaseFilter.dateRange[0] as Date)?.toISOString();
  //     if (this.purchaseFilter.dateRange[1]) endDate = (this.purchaseFilter.dateRange[1] as Date)?.toISOString();
  //   }

  //   const filterParams = { 
  //       ...this.purchaseFilter, 
  //       startDate, 
  //       endDate, 
  //       page: this.currentPage, 
  //       limit: this.pageSize 
  //   };
  //   delete (filterParams as any).dateRange;

  //   this.purchaseService.getAllPurchases(filterParams).subscribe({
  //     next: (res: any) => {
  //       let newData: any[] = [];
  //       if (res.data && Array.isArray(res.data.purchases)) { newData = res.data.purchases }
  //       this.totalCount = res.results || this.totalCount;
  //       this.data = [...this.data, ...newData];
        
  //       if (this.gridApi && !isReset) {
  //          this.gridApi.applyTransaction({ add: newData });
  //       }

  //       this.currentPage++;
  //       this.isLoading = false;
  //       this.cdr.markForCheck();
  //     },
  //     error: (err: any) => {
  //       this.isLoading = false;
  //       this.messageService.showError('Error', 'Failed to fetch purchases.');
  //     }
  //   });
  // }
getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;
    
    if (isReset) { 
      this.currentPage = 1; 
      this.data = []; 
      this.totalCount = 0; 
    }
    
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
    delete (filterParams as any).dateRange;

    this.purchaseService.getAllPurchases(filterParams).subscribe({
      next: (res: any) => {
        // UPDATED: Mapping to res.data.data as per your JSON
        const newData = res.data?.data || []; 
        
        // Results count often comes from res.pagination.total or res.results
        this.totalCount = res.pagination?.total || res.results || 0;
        
        if (isReset) {
          this.data = newData;
        } else {
          this.data = [...this.data, ...newData];
          if (this.gridApi) {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.detectChanges(); // Use detectChanges to ensure grid updates
      },
      error: (err: any) => {
        this.isLoading = false;
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
    // GROUP 1: PURCHASE INFORMATION
    {
      headerName: 'Purchase Details',
      headerClass: 'header-group-purchase',
      children: [
        {
          field: 'invoiceNumber',
          headerName: 'Invoice #',
          width: 130,
          pinned: 'left',
          cellStyle: { 'font-weight': 'var(--font-weight-bold)', 'color': 'var(--accent-primary)' }
        },
        {
          field: 'purchaseDate',
          headerName: 'Date',
          width: 120,
          valueFormatter: (params: any) => this.common.formatDate(params.value)
        },
        {
          field: 'status',
          headerName: 'Status',
          width: 110,
          cellRenderer: (params: any) => {
             const status = params.value?.toLowerCase() || 'draft';
             return `<span class="badge-status status-${status}">${params.value.toUpperCase()}</span>`;
          }
        }
      ]
    },

    // GROUP 2: SUPPLIER INFORMATION (The expanded data you requested)
    {
      headerName: 'Supplier Details',
      headerClass: 'header-group-supplier',
      children: [
        {
          field: 'supplierId.companyName',
          headerName: 'Company',
          width: 180,
          valueGetter: (params: any) => params.data.supplierId?.companyName || 'N/A',
          cellStyle: { 'font-weight': 'var(--font-weight-semibold)' }
        },
        {
          field: 'supplierId.contactPerson',
          headerName: 'Contact Person',
          width: 150,
          valueGetter: (params: any) => params.data.supplierId?.contactPerson || '-'
        },
        {
          field: 'supplierId.email',
          headerName: 'Email Address',
          width: 200,
          valueGetter: (params: any) => params.data.supplierId?.email || '-',
          cellStyle: { 'color': 'var(--text-secondary)', 'font-size': 'var(--font-size-xs)' }
        },
        {
          field: 'supplierId.phone',
          headerName: 'Phone',
          width: 130,
          valueGetter: (params: any) => params.data.supplierId?.phone || '-'
        }
      ]
    },

    // GROUP 3: FINANCIALS
    {
      headerName: 'Financial Summary',
      headerClass: 'header-group-finance',
      children: [
        {
          field: 'grandTotal',
          headerName: 'Grand Total',
          width: 130,
          type: 'rightAligned',
          valueFormatter: (params: any) => this.common.formatCurrency(params.value),
          cellStyle: { 'font-weight': 'var(--font-weight-bold)' }
        },
        {
          field: 'balanceAmount',
          headerName: 'Balance Due',
          width: 130,
          type: 'rightAligned',
          valueFormatter: (params: any) => this.common.formatCurrency(params.value),
          cellStyle: (params: any) => ({
            'color': params.value > 0 ? 'var(--color-error)' : 'var(--color-success)',
            'font-weight': 'var(--font-weight-bold)'
          })
        },
        {
          field: 'paymentStatus',
          headerName: 'Payment',
          width: 120,
          cellRenderer: (params: any) => {
             const payStatus = params.value?.toLowerCase() || 'unpaid';
             return `<span class="badge-payment pay-${payStatus}">${params.value.toUpperCase()}</span>`;
          }
        }
      ]
    }
  ];
  this.cdr.detectChanges();
}
  // getColumn(): void {
  //   this.column = [
  //     {
  //       field: 'invoiceNumber',
  //       headerName: 'Invoice #',
  //       sortable: true,
  //       filter: true,
  //       width: 150,
  //       cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'cursor': 'pointer' }
  //     },
  //     {
  //       field: 'purchaseDate',
  //       headerName: 'Date',
  //       sortable: true,
  //       width: 120,
  //       valueFormatter: (params: any) => this.common.formatDate(params.value)
  //     },
  //     {
  //       field: 'supplierId.companyName', 
  //       headerName: 'Supplier',
  //       sortable: true,
  //       flex: 1,
  //       minWidth: 200,
  //       valueGetter: (params: any) => params.data.supplierId?.companyName || 'N/A'
  //     },
  //     {
  //       field: 'grandTotal',
  //       headerName: 'Total',
  //       sortable: true,
  //       width: 130,
  //       type: 'rightAligned',
  //       valueFormatter: (params: any) => this.common.formatCurrency(params.value),
  //       cellStyle: { 'font-weight': 'bold' }
  //     },
  //     {
  //       field: 'balanceAmount',
  //       headerName: 'Balance',
  //       sortable: true,
  //       width: 130,
  //       type: 'rightAligned',
  //       valueFormatter: (params: any) => this.common.formatCurrency(params.value),
  //       cellClass: (params: any) => params.value > 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'
  //     },
  //     {
  //       field: 'status',
  //       headerName: 'Order Status',
  //       sortable: true,
  //       width: 130,
  //       cellClass: (params: any) => params.value ? `cell-status status-${params.value.toLowerCase()}` : ''
  //     },
  //     {
  //       field: 'paymentStatus',
  //       headerName: 'Payment',
  //       sortable: true,
  //       width: 130,
  //       cellClass: (params: any) => params.value ? `cell-status pay-${params.value.toLowerCase()}` : ''
  //     }
  //   ];
  //   this.cdr.detectChanges();
  // }
}

