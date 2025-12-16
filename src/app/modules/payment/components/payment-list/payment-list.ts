import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from "primeng/toast";
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

@Component({
  selector: 'app-payment-list',
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
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private paymentService = inject(PaymentService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService); // Injected helper

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;
  
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  customerOptions = signal<any[]>([]);
  supplierOptions = signal<any[]>([]);

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
    this.paymentFilter = { type: null, customerId: null, supplierId: null, paymentMethod: null, status: null };
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

        if (this.gridApi && !isReset) {
           this.gridApi.applyTransaction({ add: newData });
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
    if (event.type === 'cellClicked') {
      const paymentId = event.row._id;
      if (paymentId) {
        this.router.navigate([paymentId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'type',
        headerName: 'Type',
        sortable: true,
        filter: true,
        width: 120,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'amount',
        headerName: 'Amount',
        sortable: true,
        type: 'rightAligned',
        width: 130,
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
          const type = params.data.type;
          if (type === 'inflow') return { color: 'var(--color-success)', fontWeight: 'bold' };
          if (type === 'outflow') return { color: 'var(--color-error)', fontWeight: 'bold' };
          return {};
        }
      },
      {
        field: 'paymentDate',
        headerName: 'Date',
        sortable: true,
        width: 140,
        valueFormatter: (params: any) => this.common.formatDate(params.value)
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        width: 130,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'customer.name',
        headerName: 'Customer',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 200,
        valueGetter: (params: any) => params.data.customer?.name || 'N/A',
      },
      {
        field: 'supplier.companyName',
        headerName: 'Supplier',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 200,
        valueGetter: (params: any) => params.data.supplier?.companyName || 'N/A',
      },
      {
        field: 'paymentMethod',
        headerName: 'Method',
        sortable: true,
        width: 120,
        cellStyle: { 'text-transform': 'capitalize' }
      },
      {
        field: 'referenceNumber',
        headerName: 'Ref #',
        sortable: true,
        width: 150,
      },
    ];
    this.cdr.detectChanges();
  }
}