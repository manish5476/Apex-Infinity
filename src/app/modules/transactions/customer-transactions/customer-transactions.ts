import { ChangeDetectorRef, Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { Toast } from "primeng/toast";
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { TransactionService } from '../transaction.service';

@Component({
  selector: 'app-customer-transactions',
  standalone: true,
  imports: [
    CommonModule,  SelectModule, FormsModule, 
    ButtonModule, InputTextModule, Toast, DatePickerModule
  ],
  templateUrl: './customer-transactions.html',
  styleUrl: './customer-transactions.scss',
})
export class CustomerTransactions implements OnInit {
eventFromGrid($event: Event) {
throw new Error('Method not implemented.');
}
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute); // Inject Route
  private transactionService = inject(TransactionService);
  public common = inject(CommonMethodService);

  // 1. Allow Parent to pass ID directly (Critical for Dialog)
  @Input() inputCustomerId: string | undefined;

  customerId: string = ''; // To store the ID
  gridApi!: GridApi;
  currentPage = 1;
  totalCount = 0;
  pageSize = 100;
  data: any[] = [];
  column: any = [];
  
  // Filters
  rangeDates: Date[] | undefined;
  filterParams: any = { type: null, effect: null, search: '' };
  
  transactionTypes = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Payment', value: 'payment' },
    { label: 'Ledger', value: 'ledger' }
  ];
  transactionEffects = [{ label: 'Credit', value: 'credit' }, { label: 'Debit', value: 'debit' }];

  ngOnInit(): void {
    // 2. Logic: Prefer Input (Dialog), fallback to Route (Page)
    if (this.inputCustomerId) {
      this.customerId = this.inputCustomerId;
    } else {
      // Check current route or parent route (in case of nesting)
      this.customerId = this.route.snapshot.paramMap.get('id') || 
                        this.route.parent?.snapshot.paramMap.get('id') || '';
    }
    
    this.getColumn();
    
    if(this.customerId) {
        this.getData(true);
    } else {
        console.error("Customer Transactions: No Customer ID provided via Input or Route.");
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

    // Call CUSTOMER specific service
    this.common.apiCall(
      this.transactionService.getCustomerTransactions(this.customerId, queryParams),
      (res: any) => {
        let newData: any[] = [];
        if (res.results && Array.isArray(res.results)) { newData = res.results; }
        this.totalCount = res.total || this.totalCount;
        this.data = [...this.data, ...newData];
        this.currentPage++;
        this.cdr.markForCheck();
      },
      'Fetch Customer Transactions'
    );
  }

  private formatDateForApi(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  onScrolledToBottom(_: any) {
    if (this.data.length < this.totalCount) this.getData(false);
  }

  onGridReady(params: GridReadyEvent) { this.gridApi = params.api; }

  getColumn(): void {
    this.column = [
      { field: 'date', headerName: 'Date', sortable: true, width: 180, valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy, hh:mm a') },
      { field: 'type', headerName: 'Type', sortable: true, width: 120, cellStyle: { 'text-transform': 'capitalize', 'font-weight': '600' } },
      { field: 'description', headerName: 'Description', sortable: true, flex: 1 },
      { field: 'refNumber', headerName: 'Ref #', sortable: true, width: 150, valueGetter: (params: any) => params.data.refNumber || params.data.refId || '-' },
      { field: 'amount', headerName: 'Amount', sortable: true, width: 140, valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
           const color = params.data.effect === 'credit' ? '#006400' : '#8b0000';
           const bg = params.data.effect === 'credit' ? '#ccffcc' : '#ffcccc';
           return { color: color, fontWeight: 'bold', backgroundColor: bg };
        }
      },
      { field: 'effect', headerName: 'Effect', sortable: true, width: 100, valueFormatter: (params: any) => params.value ? params.value.toUpperCase() : '' },
      { field: 'meta.status', headerName: 'Status', sortable: true, width: 130, valueGetter: (params: any) => params.data.meta?.status || '-' }
    ];
    this.cdr.detectChanges();
  }
}