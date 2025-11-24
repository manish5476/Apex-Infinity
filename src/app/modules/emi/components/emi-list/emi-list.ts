import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';

// AG Grid
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// Shared
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { EmiService } from '../../services/emi-service'; // Ensure this path is correct

@Component({
  selector: 'app-emi-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedGridComponent,
    SelectModule,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [EmiService], // Ensure EmiService is provided here or in root
  templateUrl: './emi-list.html',
  styleUrl: './emi-list.scss',
})
export class EmiList implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;
  data: any[] = [];
  column: any[] = [];
  rowSelectionMode: any = 'single';

  // --- Filter Options ---
  // Using signals for reactive master data options if needed
  customerOptions = signal<any[]>([]);

  // --- Filter State ---
  // Matches backend dynamic filter requirements
  emiFilter = {
    customerId: null,
    status: null,
    // Add other filterable fields as per your backend (e.g., invoiceId, dates)
  };

  // Status Options for Dropdown
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Defaulted', value: 'defaulted' }
  ];

  constructor() {
    // Populate master list data
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  // --- Actions ---

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.emiFilter = {
      customerId: null,
      status: null
    };
    this.getData(true);
  }

  // --- Grid Data Fetching ---

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    // Build API payload
    const filterParams = {
      ...this.emiFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    // Assuming getAllEmiData method exists in your EmiService 
    // and accepts the dynamic filter object
    this.emiService.getAllEmiData(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        } else if (res.data && Array.isArray(res.data)) {
           // Handle case where data is directly an array
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
        console.error('❌ Error fetching EMI data:', err);
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
      const emiId = event.event.data._id;
      if (emiId) {
        // Navigate to EMI details page
        this.router.navigate(['/emis', emiId]); 
      }
    }
  }

  // --- Column Definition ---

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
        cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' }
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
        cellRenderer: (params: any) => {
           const status = params.value;
           let color = '#6c757d'; // default gray
           let bg = '#f8f9fa';
           
           if(status === 'active') { color = '#0284c7'; bg = '#e0f2fe'; } // blue
           else if(status === 'completed') { color = '#16a34a'; bg = '#dcfce7'; } // green
           else if(status === 'defaulted') { color = '#dc2626'; bg = '#fee2e2'; } // red

           return `<span style="background:${bg}; color:${color}; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">${status}</span>`;
        }
      },
      {
        field: 'totalAmount',
        headerName: 'Total Loan',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 130,
        valueFormatter: (params: any) => this.formatCurrency(params.value)
      },
      {
        field: 'downPayment',
        headerName: 'Down Pay',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 130,
        valueFormatter: (params: any) => this.formatCurrency(params.value)
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 130,
        cellStyle: { 'color': 'var(--text-primary)', 'font-weight': 'bold' },
        valueFormatter: (params: any) => this.formatCurrency(params.value)
      },
      {
        field: 'numberOfInstallments',
        headerName: 'Inst.',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 90
      },
      {
        field: 'emiStartDate',
        headerName: 'Start Date',
        sortable: true,
        filter: 'agDateColumnFilter',
        width: 130,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-'
      },
      {
        field: 'createdAt',
        headerName: 'Created On',
        sortable: true,
        filter: 'agDateColumnFilter',
        width: 150,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : ''
      }
    ];
    this.cdr.detectChanges();
  }

  // Helper for currency formatting
  private formatCurrency(value: number): string {
    return value !== undefined && value !== null 
      ? `₹ ${value.toFixed(2)}` 
      : '₹ 0.00';
  }
}


// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-emi-list',
//   imports: [],
//   templateUrl: './emi-list.html',
//   styleUrl: './emi-list.scss',
// })
// export class EmiList {

// }
