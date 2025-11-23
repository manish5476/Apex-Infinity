import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from "primeng/toast";
import { DatePickerModule } from 'primeng/datepicker'; // 👈 1. Import DatePicker
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { TransactionService } from '../transaction.service';


@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    Toast,
    DatePickerModule // 👈 2. Add to Imports
  ],
  providers: [TransactionService],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private transactionService = inject(TransactionService);
  public common = inject(CommonMethodService);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private totalCount = 0;
  private pageSize = 100;
  
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Filter State ---
  rangeDates: Date[] | undefined; // 👈 3. The Model for the Date Picker

  transactionTypes = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Payment', value: 'payment' },
    { label: 'Ledger', value: 'ledger' }
  ];

  transactionEffects = [
    { label: 'Credit', value: 'credit' },
    { label: 'Debit', value: 'debit' }
  ];

  filterParams: any = { // Changed to any to allow dynamic date props
    type: null,
    effect: null,
    search: '',
  };

  constructor() {}

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.filterParams = { type: null, effect: null, search: '' };
    this.rangeDates = undefined; // 👈 Reset dates
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    // 1. Base Query
    const queryParams: any = {
      ...this.filterParams,
      page: this.currentPage,
      limit: this.pageSize,
    };

    // 2. Handle Date Range Logic
    if (this.rangeDates && this.rangeDates.length > 0) {
      const start = this.rangeDates[0];
      const end = this.rangeDates[1];

      // Format to YYYY-MM-DD (Handling Local Timezone)
      if (start) {
        queryParams.startDate = this.formatDateForApi(start);
      }
      
      // Only send endDate if the user has selected the second date
      if (end) {
        queryParams.endDate = this.formatDateForApi(end);
      }
    }

    this.common.apiCall(
      this.transactionService.getAllTransactions(queryParams),
      (res: any) => {
        let newData: any[] = [];
        if (res.results && Array.isArray(res.results)) { newData = res.results; }
        this.totalCount = res.total || this.totalCount;
        this.data = [...this.data, ...newData];
        this.currentPage++;
        this.cdr.markForCheck();
      },
      'Fetch Transactions'
    );
  }

  // Helper to ensure date sends as YYYY-MM-DD in local time, not UTC
  private formatDateForApi(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  // ... (downloadCsv, onGridReady, getColumn remain the same)
  // Just ensure downloadCsv ALSO includes the date logic:
  
  downloadCsv() {
    const queryParams: any = {
      ...this.filterParams,
      page: 1,
      limit: 10000
    };

    // Add Date Logic to Export as well
    if (this.rangeDates && this.rangeDates.length > 0) {
      if (this.rangeDates[0]) queryParams.startDate = this.formatDateForApi(this.rangeDates[0]);
      if (this.rangeDates[1]) queryParams.endDate = this.formatDateForApi(this.rangeDates[1]);
    }

    this.common.apiCall(
      this.transactionService.exportTransactionsCsv(queryParams),
      (blob: Blob) => {
        const fileName = `Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        this.common.downloadBlob(blob, fileName);
      },
      'Export CSV'
    );
  }
  
  // ... onScrolledToBottom, onGridReady, getColumn ...
  onScrolledToBottom(_: any) {
    if (this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }
  
  getColumn(): void {
      // ... your existing getColumn logic
      this.column = [
      {
        field: 'date', headerName: 'Date', sortable: true, width: 180,
        valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm a'),
      },
      {
        field: 'type', headerName: 'Type', sortable: true, width: 120,
        cellStyle: { 'text-transform': 'capitalize', 'font-weight': '600' }
      },
      {
        field: 'description', headerName: 'Description', sortable: true, flex: 1,
      },
      {
        field: 'refNumber', headerName: 'Reference', sortable: true,
        valueGetter: (params: any) => params.data.refNumber || params.data.refId || 'N/A'
      },
      {
        field: 'amount', headerName: 'Amount', sortable: true, width: 140,
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
           const color = params.data.effect === 'credit' ? '#006400' : '#8b0000';
           const bg = params.data.effect === 'credit' ? '#ccffcc' : '#ffcccc';
           return { color: color, fontWeight: 'bold', backgroundColor: bg };
        },
      },
      {
        field: 'effect', headerName: 'Effect', sortable: true, width: 100,
        valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : ''
      },
      {
        field: 'meta.status', headerName: 'Status', sortable: true, width: 130,
        valueGetter: (params: any) => params.data.meta?.status || params.data.meta?.accountType || '-',
        cellStyle: { 'text-transform': 'capitalize' }
      }
    ];
    this.cdr.detectChanges();
  }
}

// import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { Toast } from "primeng/toast";
// import { MasterListService } from '../../../core/services/master-list.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';
// import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
// import { TransactionService } from '../transaction.service';


// @Component({
//   selector: 'app-transactions',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SharedGridComponent,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     Toast
//   ],
//   providers: [TransactionService], // MessageService is likely provided in root, removed from here if not needed locally
//   templateUrl: './transactions.html',
//   styleUrl: './transactions.scss',
// })
// export class Transactions implements OnInit {
//   // --- Injected Services ---
//   private cdr = inject(ChangeDetectorRef);
//   private transactionService = inject(TransactionService);
//   public masterList = inject(MasterListService);
//   public common = inject(CommonMethodService); // Inject CommonMethodService

//   // --- Grid & Data ---
//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private totalCount = 0;
//   private pageSize = 100;
  
//   // Note: We don't need 'isLoading' boolean anymore for API calls 
//   // because common.apiCall handles the LoadingService. 
//   // However, we keep it if you want to disable buttons explicitly.
//   isLoading = false; 
  
//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   // --- Filters ---
//   transactionTypes = [
//     { label: 'Invoice', value: 'invoice' },
//     { label: 'Payment', value: 'payment' },
//     { label: 'Ledger', value: 'ledger' }
//   ];

//   transactionEffects = [
//     { label: 'Credit', value: 'credit' },
//     { label: 'Debit', value: 'debit' }
//   ];

//   filterParams = {
//     type: null,
//     effect: null,
//     search: '',
//   };

//   constructor() {}

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.filterParams = { type: null, effect: null, search: '' };
//     this.getData(true);
//   }

//   /**
//    * Fetches data using CommonMethodService.apiCall
//    */
//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const queryParams = {
//       ...this.filterParams,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     // Use apiCall for automatic Error Handling & Loading Spinner
//     this.common.apiCall(
//       this.transactionService.getAllTransactions(queryParams),
//       (res: any) => {
//         let newData: any[] = [];
//         if (res.results && Array.isArray(res.results)) { 
//             newData = res.results; 
//         }
//         this.totalCount = res.total || this.totalCount;
//         this.data = [...this.data, ...newData]; 
//         this.currentPage++; 
//         this.isLoading = false; 
//         this.cdr.markForCheck();
//       },
//       'Fetch Transactions' // Context for error message
//     );
//   }

//   /**
//    * ✅ NEW: Download CSV using CommonMethodService
//    */
//   downloadCsv() {
//     // 1. Prepare Query (Get all records)
//     const queryParams = {
//       ...this.filterParams,
//       page: 1,
//       limit: 10000 // Large limit for export
//     };

//     // 2. Use apiCall to handle the Observable<Blob>
//     this.common.apiCall(
//       this.transactionService.exportTransactionsCsv(queryParams),
//       (blob: Blob) => {
//         // 3. Use common.downloadBlob to save the file
//         const fileName = `Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
//         this.common.downloadBlob(blob, fileName);
//       },
//       'Export CSV' // Context if it fails
//     );
//   }

//   onScrolledToBottom(_: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         field: 'date', headerName: 'Date', sortable: true, width: 180,
//         // Use CommonMethodService for formatting
//         valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm a'),
//       },
//       {
//         field: 'type', headerName: 'Type', sortable: true, width: 120,
//         cellStyle: { 'text-transform': 'capitalize', 'font-weight': '600' }
//       },
//       {
//         field: 'description', headerName: 'Description', sortable: true, flex: 1,
//       },
//       {
//         field: 'refNumber', headerName: 'Reference', sortable: true,
//         valueGetter: (params: any) => params.data.refNumber || params.data.refId || 'N/A'
//       },
//       {
//         field: 'amount', headerName: 'Amount', sortable: true, width: 140,
//         // Use CommonMethodService for currency
//         valueFormatter: (params: any) => this.common.formatCurrency(params.value),
//         cellStyle: (params: any) => {
//            // Use CommonMethodService for Severity mapping (optional logic adaptation)
//            const color = params.data.effect === 'credit' ? '#006400' : '#8b0000';
//            const bg = params.data.effect === 'credit' ? '#ccffcc' : '#ffcccc';
//            return { color: color, fontWeight: 'bold', backgroundColor: bg };
//         },
//       },
//       {
//         field: 'effect', headerName: 'Effect', sortable: true, width: 100,
//         valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : ''
//       },
//       {
//         field: 'meta.status', headerName: 'Status', sortable: true, width: 130,
//         valueGetter: (params: any) => params.data.meta?.status || params.data.meta?.accountType || '-',
//         cellStyle: { 'text-transform': 'capitalize' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }

// // import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { GridApi, GridReadyEvent } from 'ag-grid-community';
// // import { FormsModule } from '@angular/forms';
// // import { ButtonModule } from 'primeng/button';
// // import { SelectModule } from 'primeng/select';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { Toast } from "primeng/toast";
// // import { MasterListService } from '../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../core/services/message.service';
// // import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
// // import { TransactionService } from '../transaction.service';

// // @Component({
// //   selector: 'app-transactions',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     SharedGridComponent,
// //     SelectModule,
// //     FormsModule,
// //     ButtonModule,
// //     InputTextModule,
// //     Toast
// //   ],
// //   providers: [TransactionService],
// //   templateUrl: './transactions.html',
// //   styleUrl: './transactions.scss',
// // })
// // export class Transactions implements OnInit {
// //   // --- Injected Services ---
// //   private cdr = inject(ChangeDetectorRef);
// //   private transactionService = inject(TransactionService);
// //   private messageService = inject(AppMessageService);
// //   public masterList = inject(MasterListService);

// //   // --- Grid & Data ---
// //   private gridApi!: GridApi;
// //   private currentPage = 1;
// //   private isLoading = false;
// //   private totalCount = 0;
// //   private pageSize = 100; // Matches your JSON limit
// //   data: any[] = [];
// //   column: any = [];
// //   rowSelectionMode: any = 'single';

// //   // --- Filter Signals/State ---
// //   transactionTypes = [
// //     { label: 'Invoice', value: 'invoice' },
// //     { label: 'Payment', value: 'payment' },
// //     { label: 'Ledger', value: 'ledger' }
// //   ];

// //   transactionEffects = [
// //     { label: 'Credit', value: 'credit' },
// //     { label: 'Debit', value: 'debit' }
// //   ];

// //   // --- Filters ---
// //   filterParams = {
// //     type: null,
// //     effect: null,
// //     search: '', 
// //   };

// //   constructor() {}

// //   ngOnInit(): void {
// //     this.getColumn();
// //     this.getData(true);
// //   }

// //   /**
// //    * Applies the current filters and reloads the grid.
// //    */
// //   applyFilters() {
// //     this.getData(true);
// //   }

// //   /**
// //    * Resets all filters and reloads the grid.
// //    */
// //   resetFilters() {
// //     this.filterParams = {
// //       type: null,
// //       effect: null,
// //       search: '',
// //     };
// //     this.getData(true);
// //   }

// //   /**
// //    * Fetches data from the API based on filters and pagination.
// //    * @param isReset Resets data and pagination if true.
// //    */
// //   getData(isReset: boolean = false) {
// //     if (this.isLoading) return;
// //     this.isLoading = true;

// //     if (isReset) {
// //       this.currentPage = 1;
// //       this.data = [];
// //       this.totalCount = 0;
// //     }

// //     const queryParams = {
// //       ...this.filterParams,
// //       page: this.currentPage,
// //       limit: this.pageSize,
// //     };

// //     this.transactionService.getAllTransactions(queryParams).subscribe(
// //       (res: any) => {
// //         let newData: any[] = [];
        
// //         // --- FIX: Adapted to your specific JSON structure ---
// //         // Your JSON returns { "results": [...], "total": 6, ... }
// //         if (res.results && Array.isArray(res.results)) { 
// //             newData = res.results; 
// //         }

// //         this.totalCount = res.total || this.totalCount;
// //         this.data = [...this.data, ...newData]; 
        
// //         this.currentPage++; 
// //         this.isLoading = false; 
// //         this.cdr.markForCheck();
// //       },
// //       (err: any) => {
// //         this.isLoading = false; 
// //         this.messageService.showError('Error', 'Failed to fetch transactions.'); 
// //         console.error('❌ Error fetching data:', err);
// //       }
// //     );
// //   }

// //   /**
// //    * Triggered by the grid's infinite scroll.
// //    */
// //   onScrolledToBottom(_: any) {
// //     if (!this.isLoading && this.data.length < this.totalCount) {
// //       this.getData(false);
// //     }
// //   }

// //   onGridReady(params: GridReadyEvent) {
// //     this.gridApi = params.api;
// //   }

// //   getColumn(): void {
// //     this.column = [
// //       {
// //         field: 'date', 
// //         headerName: 'Date', 
// //         sortable: true, 
// //         filter: 'agDateColumnFilter', 
// //         width: 180,
// //         valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : '',
// //       },
// //       {
// //         field: 'type',
// //         headerName: 'Type',
// //         sortable: true,
// //         filter: true,
// //         width: 120,
// //         cellStyle: { 'text-transform': 'capitalize', 'font-weight': '600' }
// //       },
// //       {
// //         field: 'description',
// //         headerName: 'Description',
// //         sortable: true,
// //         filter: true,
// //         flex: 1, // Takes remaining space
// //         tooltipField: 'description',
// //       },
// //       {
// //         field: 'refNumber',
// //         headerName: 'Reference',
// //         sortable: true,
// //         filter: true,
// //         valueGetter: (params: any) => params.data.refNumber || params.data.refId || 'N/A'
// //       },
// //       {
// //         field: 'amount',
// //         headerName: 'Amount',
// //         sortable: true,
// //         filter: 'agNumberColumnFilter',
// //         width: 140,
// //         // Format currency
// //         valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : '₹ 0.00',
// //         // Logic for Credit (Green) vs Debit (Red) based on your JSON "effect" field
// //         cellStyle: (params: any) => {
// //            const effect = params.data.effect;
// //            if (effect === 'credit') {
// //                return { color: '#006400', fontWeight: 'bold', backgroundColor: '#ccffcc' }; // Greenish
// //            } else if (effect === 'debit') {
// //                return { color: '#8b0000', fontWeight: 'bold', backgroundColor: '#ffcccc' }; // Reddish
// //            }
// //            return {};
// //         },
// //       },
// //       {
// //         field: 'effect',
// //         headerName: 'Effect',
// //         sortable: true,
// //         width: 100,
// //         valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : ''
// //       },
// //       {
// //         field: 'meta.status',
// //         headerName: 'Status',
// //         sortable: true,
// //         width: 130,
// //         valueGetter: (params: any) => params.data.meta?.status || params.data.meta?.accountType || '-',
// //         cellStyle: { 'text-transform': 'capitalize' }
// //       }
// //     ];
// //     this.cdr.detectChanges();
// //   }
// // }