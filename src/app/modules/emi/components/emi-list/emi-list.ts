import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { EmiService } from '../../services/emi-service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

@Component({
  selector: 'app-emi-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SelectModule,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    AgShareGrid
  ],
  providers: [EmiService],
  templateUrl: './emi-list.html',
  styleUrl: './emi-list.scss',
})
export class EmiList implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;
  data: any[] = [];
  column: any[] = [];
  rowSelectionMode: any = 'single';

  customerOptions = signal<any[]>([]);

  emiFilter = {
    customerId: null,
    status: null,
  };

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Defaulted', value: 'defaulted' }
  ];

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
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
    this.emiFilter = { customerId: null, status: null };
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
      ...this.emiFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.emiService.getAllEmiData(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        } else if (res.data && Array.isArray(res.data)) {
          newData = res.data;
        }

        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData];

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch EMI data.');
      }
    });
  }

  onScrolledToBottom(_?: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const emiId = event.row._id;
      if (emiId) {
        this.router.navigate(['/emis', emiId]);
      }
    }
    if (event.eventType === 'reachedBottom') {
      this.onScrolledToBottom()
    }
  }

  getColumn(): void {
    this.column = [
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 60,
        suppressMenu: true,
        sortable: false,
        filter: false,
        pinned: 'left'
      },
      {
        field: 'invoiceId.invoiceNumber',
        headerName: 'Invoice #',
        sortable: true,
        filter: true,
        resizable: true,
        width: 140,
        valueGetter: (params: any) => params.data.invoiceId?.invoiceNumber || 'N/A',
        cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'cursor': 'pointer' }
      },
      {
        field: 'customerId.name',
        headerName: 'Customer',
        sortable: true,
        filter: true,
        resizable: true,
        width: 180,
        valueGetter: (params: any) => params.data.customerId?.name || 'Unknown'
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        sortable: true,
        filter: true,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'totalAmount',
        headerName: 'Total Loan',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.formatCurrency(params.value)
      },
      {
        field: 'downPayment',
        headerName: 'Down Pay',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.formatCurrency(params.value)
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 130,
        type: 'rightAligned',
        cellStyle: { 'color': 'var(--text-primary)', 'font-weight': 'bold' },
        valueFormatter: (params: any) => this.formatCurrency(params.value)
      },
      {
        field: 'numberOfInstallments',
        headerName: 'Inst.',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 90,
        type: 'rightAligned'
      },
      {
        field: 'emiStartDate',
        headerName: 'Start Date',
        sortable: true,
        filter: 'agDateColumnFilter',
        width: 130,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-'
      }
    ];
    this.cdr.detectChanges();
  }

  private formatCurrency(value: number): string {
    return value !== undefined && value !== null ? `₹ ${value.toFixed(2)}` : '₹ 0.00';
  }
}