import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from "primeng/toast";
import { DatePickerModule } from 'primeng/datepicker'; 
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { TransactionService } from '../transaction.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DatePickerModule,
    AgShareGrid
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
  private pageSize = 50;

  data: any[] = [];
  column: any = [];
  
  // --- State ---
  viewMode = signal<'all' | 'mine'>('all');
  loading = signal(false);

  // --- Filter State ---
  rangeDates: Date[] | undefined;

  transactionTypes = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Payment', value: 'payment' },
    { label: 'Purchase', value: 'purchase' },
    { label: 'Journal', value: 'journal' },
    { label: 'EMI Payment', value: 'emi_payment' },
    { label: 'Opening Stock', value: 'opening_stock' }
  ];

  filterParams: any = {
    type: null,
    search: '',
  };

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  // --- Actions ---

  toggleViewMode(mode: 'all' | 'mine') {
    this.viewMode.set(mode);
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.filterParams = { type: null, search: '' };
    this.rangeDates = undefined;
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.loading()) return;
    
    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    this.loading.set(true);

    const queryParams: any = {
      ...this.filterParams,
      scope: this.viewMode(),
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.rangeDates && this.rangeDates.length > 0) {
      const start = this.rangeDates[0];
      const end = this.rangeDates[1];
      if (start) queryParams.startDate = this.formatDateForApi(start);
      if (end) queryParams.endDate = this.formatDateForApi(end);
    }

    this.common.apiCall(
      this.transactionService.getAllTransactions(queryParams),
      (res: any) => {
        this.loading.set(false);
        let newData: any[] = [];
        if (res.results && Array.isArray(res.results)) { newData = res.results; }
        
        this.totalCount = res.total || this.totalCount;
        this.data = [...this.data, ...newData];
        
        if (newData.length > 0) {
           this.currentPage++;
        }
        this.cdr.markForCheck();
      },
      'Fetch Transactions'
    );
  }

  private formatDateForApi(date: Date): string {
    // Simple ISO string creation handling timezone offset roughly
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  downloadCsv() {
    // Implementation for CSV download using current filters
    console.log("Download CSV triggered");
  }

  // Grid Events
  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom' && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }
  
  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  // --- Column Definition (Mapped to JSON) ---
  getColumn(): void {
    this.column = [
      {
        field: 'date', 
        headerName: 'Date', 
        width: 160,
        valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm a'),
        cellStyle: { color: 'var(--text-secondary)' }
      },
      {
        field: 'type', 
        headerName: 'Transaction Type', 
        width: 180,
        cellRenderer: (params: any) => {
          const type = params.value?.toLowerCase() || 'unknown';
          let icon = 'pi-file';
          let label = params.value;

          // Map types to icons and readable labels
          switch(type) {
            case 'payment': icon = 'pi-wallet'; label = 'Payment'; break;
            case 'emi_payment': icon = 'pi-percentage'; label = 'EMI Payment'; break;
            case 'invoice': icon = 'pi-file-pdf'; label = 'Invoice'; break;
            case 'purchase': icon = 'pi-shopping-cart'; label = 'Purchase'; break;
            case 'journal': icon = 'pi-book'; label = 'Journal'; break;
            case 'opening_stock': icon = 'pi-box'; label = 'Opening Stock'; break;
          }
          
          return `<div class="cell-type type-${type}">
                    <i class="pi ${icon}"></i>
                    <span>${label}</span>
                  </div>`;
        }
      },
      {
        field: 'partyName', 
        headerName: 'Party / Entity', 
        flex: 1,
        minWidth: 200,
        valueFormatter: (params: any) => params.value !== '-' ? params.value : 'System/Internal',
        cellStyle: { fontWeight: '500', color: 'var(--text-primary)' }
      },
      {
        field: 'referenceNumber', 
        headerName: 'Ref #', 
        width: 140,
        cellStyle: { fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }
      },
      {
        field: 'debit', 
        headerName: 'Debit', 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => params.value > 0 ? this.common.formatCurrency(params.value) : '-',
        cellStyle: { color: '#dc2626', fontWeight: '600' } // Red for Debit
      },
      {
        field: 'credit', 
        headerName: 'Credit', 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => params.value > 0 ? this.common.formatCurrency(params.value) : '-',
        cellStyle: { color: '#16a34a', fontWeight: '600' } // Green for Credit
      }
    ];
    this.cdr.detectChanges();
  }
}

// import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { Toast } from "primeng/toast";
// import { DatePickerModule } from 'primeng/datepicker'; 
// import { CommonMethodService } from '../../../core/utils/common-method.service';
// import { TransactionService } from '../transaction.service';
// import { AgShareGrid } from "../../shared/components/ag-shared-grid";

// @Component({
//   selector: 'app-transactions',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     Toast,
//     DatePickerModule,
//     AgShareGrid
//   ],
//   providers: [TransactionService],
//   templateUrl: './transactions.html',
//   styleUrl: './transactions.scss',
// })
// export class Transactions implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private transactionService = inject(TransactionService);
//   public common = inject(CommonMethodService);

//   // --- Grid & Data ---
//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private totalCount = 0;
//   private pageSize = 100;

//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   // --- State Signals ---
//   viewMode = signal<'all' | 'mine'>('all'); // <--- Added View Mode Signal

//   // --- Filter State ---
//   rangeDates: Date[] | undefined;

//   transactionTypes = [
//     { label: 'Invoice', value: 'invoice' },
//     { label: 'Payment', value: 'payment' },
//     { label: 'Ledger', value: 'ledger' }
//   ];

//   transactionEffects = [
//     { label: 'Credit', value: 'credit' },
//     { label: 'Debit', value: 'debit' }
//   ];

//   filterParams: any = {
//     type: null,
//     effect: null,
//     search: '',
//   };

//   constructor() { }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   // --- Actions ---

//   toggleViewMode(mode: 'all' | 'mine') {
//     this.viewMode.set(mode);
//     this.getData(true); // Reload data when mode changes
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.filterParams = { type: null, effect: null, search: '' };
//     this.rangeDates = undefined;
//     this.getData(true);
//   }

//   getData(isReset: boolean = false) {
//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const queryParams: any = {
//       ...this.filterParams,
//       scope: this.viewMode(), // <--- Pass scope to API
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     if (this.rangeDates && this.rangeDates.length > 0) {
//       const start = this.rangeDates[0];
//       const end = this.rangeDates[1];
//       if (start) queryParams.startDate = this.formatDateForApi(start);
//       if (end) queryParams.endDate = this.formatDateForApi(end);
//     }

//     this.common.apiCall(
//       this.transactionService.getAllTransactions(queryParams),
//       (res: any) => {
//         let newData: any[] = [];
//         if (res.results && Array.isArray(res.results)) { newData = res.results; }
//         this.totalCount = res.total || this.totalCount;
//         this.data = [...this.data, ...newData];
//         this.currentPage++;
//         this.cdr.markForCheck();
//       },
//       'Fetch Transactions'
//     );
//   }

//   private formatDateForApi(date: Date): string {
//     const offset = date.getTimezoneOffset();
//     const localDate = new Date(date.getTime() - (offset * 60 * 1000));
//     return localDate.toISOString().split('T')[0];
//   }

//   downloadCsv() {
//     const queryParams: any = {
//       ...this.filterParams,
//       scope: this.viewMode(),
//       page: 1,
//       limit: 10000
//     };

//     if (this.rangeDates && this.rangeDates.length > 0) {
//       if (this.rangeDates[0]) queryParams.startDate = this.formatDateForApi(this.rangeDates[0]);
//       if (this.rangeDates[1]) queryParams.endDate = this.formatDateForApi(this.rangeDates[1]);
//     }

//     this.common.apiCall(
//       this.transactionService.exportTransactionsCsv(queryParams),
//       (blob: Blob) => {
//         const fileName = `Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
//         this.common.downloadBlob(blob, fileName);
//       },
//       'Export CSV'
//     );
//   }

//   onScrolledToBottom(_: any) {
//     if (this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom(event)
//     }
//   }
  
//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         field: 'date', 
//         headerName: 'Date', 
//         sortable: true, 
//         width: 180,
//         valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm a'),
//       },
//       {
//         field: 'type', 
//         headerName: 'Type', 
//         sortable: true, 
//         width: 140,
//         cellRenderer: (params: any) => {
//           const type = params.value?.toLowerCase();
//           let icon = 'pi-file';
//           if(type === 'payment') icon = 'pi-wallet';
//           if(type === 'ledger') icon = 'pi-book';
          
//           return `<div class="cell-type type-${type}">
//                     <i class="pi ${icon}"></i>
//                     <span>${params.value || '-'}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'description', 
//         headerName: 'Description', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 200
//       },
//       {
//         field: 'refNumber', 
//         headerName: 'Reference', 
//         sortable: true, 
//         width: 150,
//         valueGetter: (params: any) => params.data.refNumber || params.data.refId || 'N/A',
//         cellStyle: { 'font-family': 'monospace', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'amount', 
//         headerName: 'Amount', 
//         sortable: true, 
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.common.formatCurrency(params.value),
//         cellClass: (params: any) => {
//           return params.data.effect === 'credit' ? 'amount-credit' : 'amount-debit';
//         }
//       },
//       {
//         field: 'effect', 
//         headerName: 'Effect', 
//         sortable: true, 
//         width: 100,
//         valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : ''
//       },
//       {
//         field: 'meta.status', 
//         headerName: 'Status', 
//         sortable: true, 
//         width: 140,
//         cellRenderer: (params: any) => {
//           const status = params.data.meta?.status || params.data.meta?.accountType || 'Completed';
//           const statusClass = status.toLowerCase();
//           return `<span class="status-badge status-${statusClass}">${status}</span>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }