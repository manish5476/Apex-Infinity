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
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from "@shared/ui/layout/page/page.component";
import { PageHeaderComponent } from "@shared/ui/layout/page-header/page-header.component";
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';

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
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent
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
  column: GridColumn[] = [];

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

    if (this.rangeDates?.length) {
      const [start, end] = this.rangeDates;
      if (start) queryParams.startDate = this.formatDateForApi(start);
      if (end) queryParams.endDate = this.formatDateForApi(end);
    }

    this.common.apiCall(
      this.transactionService.getAllTransactions(queryParams),
      (res: any) => {
        this.loading.set(false);
        // API shape: { status, total, page, limit, results, data: { data: [...] } }
        const newData: any[] = res.data?.data ?? [];
        this.totalCount = res.total ?? this.totalCount;
        this.data = [...this.data, ...newData];
        if (newData.length > 0) this.currentPage++;
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
  getColumn(): void {
    this.column = [
      {
        field: 'date',
        header: 'Date',
        sortable: true,
        width: '150px',
        formatter: (val: any) => val ? this.common.formatDate(val, 'dd MMM yyyy') : '—'
      },
      {
        field: 'type',
        header: 'Type',
        type: 'badge',
        width: '140px',
        sortable: true
      },
      {
        field: 'effect',
        header: 'Dr / Cr',
        type: 'badge',
        width: '75px',
        sortable: true,
        align: 'center',
        formatter: (val: any) => {
          const effect = (val ?? '').toLowerCase();
          return effect === 'debit' ? 'Dr' : (effect === 'credit' ? 'Cr' : val);
        }
      },
      {
        field: 'description',
        header: 'Description',
        width: '1fr',
        minWidth: '220px',
        formatter: (val: any, row: any) => val || 'System Entry'
      },
      {
        field: 'partyName',
        header: 'Party',
        type: 'user',
        width: '1fr',
        minWidth: '170px'
      },
      {
        field: 'debit',
        header: 'Debit',
        sortable: true,
        width: '140px',
        type: 'currency',
        currencyCode: 'INR',
        align: 'right'
      },
      {
        field: 'credit',
        header: 'Credit',
        sortable: true,
        width: '140px',
        type: 'currency',
        currencyCode: 'INR',
        align: 'right'
      },
      {
        field: 'amount',
        header: 'Amount',
        sortable: true,
        width: '140px',
        type: 'currency',
        currencyCode: 'INR',
        align: 'right'
      }
    ];
  }
}
