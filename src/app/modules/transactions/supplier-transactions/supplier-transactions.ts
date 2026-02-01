import { ChangeDetectorRef, Component, OnInit, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip'; // Added Tooltip

import { TransactionService } from '../transaction.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { CommonMethodService } from '../../../core/utils/common-method.service';

@Component({
  selector: 'app-supplier-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DatePickerModule,
    SelectModule,
    TooltipModule,
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
  isLoading = false;

  // Data
  data: any[] = [];
  column: any[] = [];
  
  // Filters
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

    this.initColumns();
    if(this.supplierId) {
       this.getData(true);
    }
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.filterParams = { type: null, effect: null, search: '' };
    this.rangeDates = undefined;
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

    const queryParams: any = {
      ...this.filterParams,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.rangeDates && this.rangeDates.length > 0) {
      if (this.rangeDates[0]) queryParams.startDate = this.formatDateForApi(this.rangeDates[0]);
      // Handle strict or open-ended range
      if (this.rangeDates[1]) queryParams.endDate = this.formatDateForApi(this.rangeDates[1]);
    }

    this.common.apiCall(
      this.transactionService.getSupplierTransactions(this.supplierId, queryParams),
      (res: any) => {
        let newData: any[] = [];
        if (res.results && Array.isArray(res.results)) { 
          newData = res.results; 
        }
        
        this.totalCount = res.total || this.totalCount;
        this.data = isReset ? newData : [...this.data, ...newData];
        
        if (newData.length > 0) {
          this.currentPage++;
        }
        
        this.isLoading = false;
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

  exportData() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: `Transactions_${this.supplierId}.csv` });
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom') {
      if (!this.isLoading && this.data.length < this.totalCount) {
        this.getData(false);
      }
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  initColumns(): void {
    this.column = [
      { 
        field: 'date', 
        headerName: 'Date', 
        width: 140, 
        pinned: 'left',
        valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy'),
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'color': 'var(--text-primary)', 'font-weight': '600', 'font-size':'12px' }
      },
      { 
        field: 'type', 
        headerName: 'Type', 
        width: 120,
        cellRenderer: (params: any) => {
           const type = params.value?.toLowerCase() || 'unknown';
           let badgeClass = 'badge-neutral';
           if(type === 'purchase') badgeClass = 'badge-info';
           if(type === 'payment') badgeClass = 'badge-success';
           if(type === 'ledger') badgeClass = 'badge-warning';
           
           return `<div style="display:flex; align-items:center; height:100%;">
                     <span class="grid-badge ${badgeClass}">${params.value}</span>
                   </div>`;
        }
      },
      { 
        field: 'description', 
        headerName: 'Description', 
        minWidth: 220,
        flex: 1,
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis' }
      },
      { 
        field: 'effect', 
        headerName: 'Effect', 
        width: 110, 
        cellRenderer: (params: any) => {
          const effect = params.value?.toLowerCase();
          const color = effect === 'credit' ? '#15803d' : '#b91c1c'; // Green-700 / Red-700
          const icon = effect === 'credit' ? 'pi-arrow-down' : 'pi-arrow-up';
          
          return `<div style="display:flex; align-items:center; height:100%; color: ${color}; font-weight: 700; font-size: 11px; text-transform: uppercase;">
                    <i class="pi ${icon}" style="font-size: 9px; margin-right: 4px;"></i> ${params.value}
                  </div>`;
        }
      },
      { 
        field: 'amount', 
        headerName: 'Amount', 
        width: 140, 
        type: 'rightAligned',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
           const isCredit = params.data.effect === 'credit';
           return { 
               'display': 'flex', 
               'align-items': 'center', 
               'justify-content': 'flex-end',
               'color': isCredit ? '#15803d' : '#b91c1c', 
               'font-weight': 'bold',
               'font-family': 'monospace',
               'font-size': '13px'
           };
        }
      }
    ];
    this.cdr.detectChanges();
  }
}