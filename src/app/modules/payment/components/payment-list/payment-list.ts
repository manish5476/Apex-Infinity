import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-payment-list',
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
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private paymentService = inject(PaymentService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService); // Public for template
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

  // --- Master Data Signals ---
  customerOptions = signal<any[]>([]);
  supplierOptions = signal<any[]>([]);

  // --- Enums for Filters ---
  typeOptions = [
    { label: 'Inflow (Received)', value: 'inflow' },
    { label: 'Outflow (Made)', value: 'outflow' },
  ];
  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank', value: 'bank' },
    { label: 'Credit', value: 'credit' },
    { label: 'UPI', value: 'upi' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' },
  ];
  statusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  // --- Filters ---
  paymentFilter = {
    type: null,
    customerId: null,
    supplierId: null,
    paymentMethod: null,
    status: null,
  };

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
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
    this.paymentFilter = {
      type: null,
      customerId: null,
      supplierId: null,
      paymentMethod: null,
      status: null,
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
      ...this.paymentFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.paymentService.getAllPayments(filterParams).subscribe({
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
        this.messageService.showError('Error', 'Failed to fetch payments.');
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
      const paymentId = event.event.data._id;
      if (paymentId) {
        this.router.navigate([paymentId], { relativeTo: this.route });
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'type',
        headerName: 'Type',
        sortable: true,
        filter: true,
        resizable: true,
        cellClass: (params: any) => {
          if (!params.value) return '';
          return `cell-status status-${params.value}`; // 'status-inflow' or 'status-outflow'
        }
      },
      {
        field: 'amount',
        headerName: 'Amount',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
        cellStyle: (params: any) => {
          const type = params.data.type;
          if (type === 'inflow') {
            return { color: 'var(--color-success)', fontWeight: '600' };
          }
          if (type === 'outflow') {
            return { color: 'var(--color-error)', fontWeight: '600' };
          }
          return {};
        }
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        filter: true,
        resizable: true,
        cellClass: (params: any) => {
          if (!params.value) return '';
          return `cell-status status-${params.value}`; // 'status-completed', 'status-pending', etc.
        }
      },
      {
        field: 'paymentDate',
        headerName: 'Date',
        sortable: true,
        filter: 'agDateColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'customer.name',
        headerName: 'Customer',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.customer?.name || 'N/A',
      },
      {
        field: 'supplier.companyName',
        headerName: 'Supplier',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.supplier?.companyName || 'N/A',
      },
      {
        field: 'paymentMethod',
        headerName: 'Method',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'invoice.invoiceNumber',
        headerName: 'Invoice',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.invoice?.invoiceNumber || 'N/A',
      },
      {
        field: 'referenceNumber',
        headerName: 'Reference',
        sortable: true,
        filter: true,
        resizable: true,
      },
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
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
// import { PaymentService } from '../../services/payment-service';

// // Shared


// @Component({
//   selector: 'app-payment-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SharedGridComponent,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule
//   ],
//   templateUrl: './payment-list.html',
//   styleUrl: './payment-list.scss',
// })
// export class PaymentListComponent implements OnInit {
//   // --- Injected Services ---
//   private cdr = inject(ChangeDetectorRef);
//   private paymentService = inject(PaymentService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);
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

//   // --- Master List Signals ---
//   customerOptions = signal<any[]>([]);
//   supplierOptions = signal<any[]>([]);

//   // --- Enums for Filters ---
//   typeOptions = [
//     { label: 'Inflow (Received)', value: 'inflow' },
//     { label: 'Outflow (Paid)', value: 'outflow' },
//   ];
//   paymentMethodOptions = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'Bank', value: 'bank' },
//     { label: 'Credit', value: 'credit' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Cheque', value: 'cheque' },
//     { label: 'Other', value: 'other' },
//   ];
//   statusOptions = [
//     { label: 'Pending', value: 'pending' },
//     { label: 'Completed', value: 'completed' },
//     { label: 'Failed', value: 'failed' },
//     { label: 'Cancelled', value: 'cancelled' },
//   ];

//   // --- Filters ---
//   paymentFilter = {
//     type: null,
//     customerId: null,
//     supplierId: null,
//     paymentMethod: null,
//     status: null
//   };

//   constructor() {
//     effect(() => {
//       this.customerOptions.set(this.masterList.customers());
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
//     this.paymentFilter = {
//       type: null,
//       customerId: null,
//       supplierId: null,
//       paymentMethod: null,
//       status: null
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
//       ...this.paymentFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     this.paymentService.getAllPayments(filterParams).subscribe({
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
//         this.messageService.showError('Error', 'Failed to fetch payments.');
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

//   eventFromGrid(event: any) {
//     if (event.eventType === 'onRowClicked') {
//       const paymentId = event.event.data._id;
//       if (paymentId) {
//         // Open edit form on click
//         this.router.navigate([paymentId, 'edit'], { relativeTo: this.route });
//       }
//     }
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         field: 'paymentDate',
//         headerName: 'Date',
//         sortable: true,
//         filter: 'agDateColumnFilter',
//         resizable: true,
//         valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
//       },
//       {
//         field: 'type',
//         headerName: 'Type',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueFormatter: (params: any) => params.value === 'inflow' ? 'Inflow' : 'Outflow',
//         cellStyle: (params: any) => {
//           return params.value === 'inflow'
//             ? { color: 'var(--theme-success-primary)', fontWeight: 'bold' }
//             : { color: 'var(--theme-error-primary)', fontWeight: 'bold' };
//         },
//       },
//       {
//         headerName: 'Party', // Customer or Supplier
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueGetter: (params: any) => 
//           params.data.customer?.name || params.data.supplier?.name || 'N/A',
//         cellStyle: {
//           'color': 'var(--theme-accent-primary)',
//           'font-weight': '600',
//           'cursor': 'pointer'
//         }
//       },
//       {
//         headerName: 'Reference', // Invoice or Purchase
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueGetter: (params: any) => 
//           params.data.invoice?.invoiceNumber || params.data.purchase?.purchaseNumber || params.data.referenceNumber || 'N/A',
//       },
//       {
//         field: 'amount',
//         headerName: 'Amount',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         resizable: true,
//         valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
//       },
//       {
//         field: 'paymentMethod',
//         headerName: 'Method',
//         sortable: true,
//         filter: true,
//         resizable: true,
//       },
//       {
//         field: 'status',
//         headerName: 'Status',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         cellStyle: (params: any) => {
//           switch (params.value) {
//             case 'completed': return { color: 'var(--theme-success-primary)', fontWeight: 'bold' };
//             case 'pending': return { color: 'var(--theme-warning-primary)', fontWeight: 'bold' };
//             case 'failed': return { color: 'var(--theme-error-primary)', fontWeight: 'bold' };
//             default: return {};
//           }
//         }
//       },
//     ];
//     this.cdr.detectChanges();
//   }
// }

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-payment-list',
// //   imports: [],
// //   templateUrl: './payment-list.html',
// //   styleUrl: './payment-list.scss',
// // })
// // export class PaymentList {

// // }
