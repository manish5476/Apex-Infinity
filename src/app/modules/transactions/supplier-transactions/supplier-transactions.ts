import { ChangeDetectorRef, Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

import { CommonMethodService } from '../../../core/utils/common-method.service';
import { TransactionService } from '../transaction.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { Select } from 'primeng/select';

@Component({
  selector: 'app-supplier-transactions',
  standalone: true,
  imports: [
    CommonModule, Select
    , FormsModule, // Use DropdownModule
    ButtonModule, InputTextModule, ToastModule, DatePickerModule,
    AgShareGrid
  ],
  templateUrl: './supplier-transactions.html',
  styleUrl: './supplier-transactions.scss',
})
export class SupplierTransactions implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);
  public common = inject(CommonMethodService);

  @Input() inputSupplierId: string | undefined;

  supplierId: string = '';
  gridApi!: GridApi;
  currentPage = 1;
  totalCount = 0;
  pageSize = 100;
  data: any[] = [];
  column: any = [];
  
  rangeDates: Date[] | undefined;
  filterParams: any = { type: null, effect: null, search: '' };
  
  transactionTypes = [
    { label: 'Purchase', value: 'purchase' }, 
    { label: 'Payment', value: 'payment' },
    { label: 'Ledger', value: 'ledger' }
  ];
  transactionEffects = [
    { label: 'Credit (+)', value: 'credit' }, 
    { label: 'Debit (-)', value: 'debit' }
  ];

  ngOnInit(): void {
    if (this.inputSupplierId) {
      this.supplierId = this.inputSupplierId;
    } else {
      this.supplierId = this.route.snapshot.paramMap.get('id') || 
                        this.route.parent?.snapshot.paramMap.get('id') || '';
    }

    this.getColumn();
    
    if(this.supplierId) {
        this.getData(true);
    }
  }

  applyFilters() { this.getData(true); }

  resetFilters() {
    this.filterParams = { type: null, effect: null, search: '' };
    this.rangeDates = undefined;
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const queryParams: any = {
      ...this.filterParams,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.rangeDates && this.rangeDates.length > 0) {
      if (this.rangeDates[0]) queryParams.startDate = this.formatDateForApi(this.rangeDates[0]);
      if (this.rangeDates[1]) queryParams.endDate = this.formatDateForApi(this.rangeDates[1]);
    }

    this.common.apiCall(
      this.transactionService.getSupplierTransactions(this.supplierId, queryParams),
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

  private formatDateForApi(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  // Placeholder for export
  exportData() {
    this.gridApi.exportDataAsCsv({ fileName: 'Transactions.csv' });
  }

  onScrolledToBottom(_: any) {
    if (this.data.length < this.totalCount) this.getData(false);
  }
  
  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

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
        headerName: 'Type', 
        width: 130, 
        cellRenderer: (params: any) => {
            // Render a badge instead of plain text
            const type = params.value?.toLowerCase() || '';
            let styleClass = 'bg-gray-100 text-gray-700';
            if(type === 'purchase') styleClass = 'bg-blue-50 text-blue-700 border-blue-200';
            if(type === 'payment') styleClass = 'bg-green-50 text-green-700 border-green-200';
            
            return `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 700; border: 1px solid transparent;" class="${styleClass}">${params.value}</span>`;
        }
      },
      { 
        field: 'description', 
        headerName: 'Description', 
        flex: 1, 
        minWidth: 250 
      },
      { 
        field: 'refNumber', 
        headerName: 'Ref #', 
        width: 140, 
        valueGetter: (params: any) => params.data.refNumber || params.data.refId || '-' 
      },
      { 
        field: 'amount', 
        headerName: 'Amount', 
        width: 140, 
        type: 'rightAligned',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
           // Softer colors for enterprise look
           const isCredit = params.data.effect === 'credit';
           return { 
               color: isCredit ? 'var(--color-success)' : 'var(--color-error)', 
               fontWeight: '600'
           };
        }
      },
      { 
        field: 'effect', 
        headerName: 'Effect', 
        width: 100, 
        valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : '' 
      }
    ];
    this.cdr.detectChanges();
  }
}

// import { ChangeDetectorRef, Component, OnInit, inject, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute } from '@angular/router';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { DatePickerModule } from 'primeng/datepicker';
// import { Toast } from "primeng/toast";
// import { CommonMethodService } from '../../../core/utils/common-method.service'; // Adjust path if needed
// import { TransactionService } from '../transaction.service';
// import { AgShareGrid } from "../../shared/components/ag-shared-grid"; // Adjust path if needed

// @Component({
//   selector: 'app-supplier-transactions',
//   standalone: true,
//   imports: [
//     CommonModule, SelectModule, FormsModule,
//     ButtonModule, InputTextModule, Toast, DatePickerModule,
//     AgShareGrid
// ],
//   templateUrl: './supplier-transactions.html',
//   styleUrl: './supplier-transactions.scss',
// })
// export class SupplierTransactions implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private route = inject(ActivatedRoute);
//   private transactionService = inject(TransactionService);
//   public common = inject(CommonMethodService);

//   // 1. Allow Parent to pass ID directly (Critical for Dialog)
//   @Input() inputSupplierId: string | undefined; 

//   supplierId: string = '';
//   gridApi!: GridApi;
//   currentPage = 1;
//   totalCount = 0;
//   pageSize = 100;
//   data: any[] = [];
//   column: any = [];
  
//   rangeDates: Date[] | undefined;
//   filterParams: any = { type: null, effect: null, search: '' };
  
//   transactionTypes = [
//     { label: 'Purchase', value: 'purchase' }, 
//     { label: 'Payment', value: 'payment' },
//     { label: 'Ledger', value: 'ledger' }
//   ];
//   transactionEffects = [{ label: 'Credit', value: 'credit' }, { label: 'Debit', value: 'debit' }];

//   ngOnInit(): void {
//     // 2. Logic: Prefer Input (Dialog), fallback to Route (Page)
//     if (this.inputSupplierId) {
//       this.supplierId = this.inputSupplierId;
//     } else {
//       // Check current route or parent route (in case of nesting)
//       this.supplierId = this.route.snapshot.paramMap.get('id') || 
//                         this.route.parent?.snapshot.paramMap.get('id') || '';
//     }

//     this.getColumn();
    
//     if(this.supplierId) {
//         this.getData(true);
//     } else {
//         console.error("Supplier Transactions: No Supplier ID provided via Input or Route.");
//     }
//   }

//   applyFilters() { this.getData(true); }

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
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     if (this.rangeDates && this.rangeDates.length > 0) {
//       if (this.rangeDates[0]) queryParams.startDate = this.formatDateForApi(this.rangeDates[0]);
//       if (this.rangeDates[1]) queryParams.endDate = this.formatDateForApi(this.rangeDates[1]);
//     }

//     this.common.apiCall(
//       this.transactionService.getSupplierTransactions(this.supplierId, queryParams),
//       (res: any) => {
//         let newData: any[] = [];
//         if (res.results && Array.isArray(res.results)) { newData = res.results; }
//         this.totalCount = res.total || this.totalCount;
//         this.data = [...this.data, ...newData];
//         this.currentPage++;
//         this.cdr.markForCheck();
//       },
//       'Fetch Supplier Transactions'
//     );
//   }

//   private formatDateForApi(date: Date): string {
//     const offset = date.getTimezoneOffset();
//     const localDate = new Date(date.getTime() - (offset * 60 * 1000));
//     return localDate.toISOString().split('T')[0];
//   }

//   onScrolledToBottom(_: any) {
//     if (this.data.length < this.totalCount) this.getData(false);
//   }
//     eventFromGrid(event: any) {
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom(event)
//     }
//   }

//   onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

//   getColumn(): void {
//     this.column = [
//       { field: 'date', headerName: 'Date', sortable: true, width: 180, valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm a') },
//       { field: 'type', headerName: 'Type', sortable: true, width: 120, cellStyle: { 'text-transform': 'capitalize', 'font-weight': '600' } },
//       { field: 'description', headerName: 'Description', sortable: true, flex: 1 },
//       { field: 'refNumber', headerName: 'Ref #', sortable: true, width: 150, valueGetter: (params: any) => params.data.refNumber || params.data.refId || '-' },
//       { field: 'amount', headerName: 'Amount', sortable: true, width: 140, valueFormatter: (params: any) => this.common.formatCurrency(params.value),
//         cellStyle: (params: any) => {
//            const color = params.data.effect === 'credit' ? '#006400' : '#8b0000';
//            const bg = params.data.effect === 'credit' ? '#ccffcc' : '#ffcccc';
//            return { color: color, fontWeight: 'bold', backgroundColor: bg };
//         }
//       },
//       { field: 'effect', headerName: 'Effect', sortable: true, width: 100, valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : '' },
//       { field: 'meta.status', headerName: 'Status', sortable: true, width: 130, valueGetter: (params: any) => params.data.meta?.status || '-' }
//     ];
//     this.cdr.detectChanges();
//   }
// }
