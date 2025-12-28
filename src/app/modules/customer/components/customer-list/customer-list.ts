import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterModule } from '@angular/router';


import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { Toast } from "primeng/toast";
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { ActionViewRenderer } from '../../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,

    SelectModule,
    AutoCompleteModule,
    FormsModule,
    ButtonModule, RouterModule,
    InputTextModule,
    Toast,
    AgShareGrid
  ],
  providers: [CustomerService],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  private customerService = inject(CustomerService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);


  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';


  customerOptions = signal<any[]>([]);


  customerFilter = {
    _id: null,
    email: null,
    phone: null,
  };

  emailSuggestions: string[] = [];
  private readonly domains: string[] = [
    '@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com',
  ];

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
    });
  }

  ngOnInit(): void {
    this.getData(true);
    this.getColumn();
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.customerFilter = {
      _id: null,
      email: null,
      phone: null,
    };
    this.getData(true);
  }

  filterEmails(event: AutoCompleteCompleteEvent) {
    const query = event.query;
    if (!query) {
      this.emailSuggestions = [];
      return;
    }
    this.emailSuggestions = query.includes('@')
      ? []
      : this.domains.map(domain => query + domain);
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
      ...this.customerFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.customerService.getAllCustomerData(filterParams).subscribe(
      (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) { newData = res.data.data; }
        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData]; if (this.gridApi) { }
        this.currentPage++; this.isLoading = false; this.cdr.markForCheck();
      },
      (err: any) => {
        this.isLoading = false; this.messageService.showError('Error', 'Failed to fetch customer data.'); console.error('❌ Error fetching data:', err);
      }
    );
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
      const customerId = event.row._id;
      if (customerId) {
        this.router.navigate(['/customer', customerId]);
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom()
    }
  }

  getColumn(): void {
    this.column = [
      {
        headerName: 'Actions',
        field: '_id',
        width: 150,
        cellRenderer: ActionViewRenderer,
      },
      {
        headerName: 'Basic Info',
        children: [
          {
            field: 'name',
            headerName: 'Name',
            pinned: 'left',
            minWidth: 180,
            flex: 1,
            cellStyle: {
              'color': 'var(--theme-accent-primary)',
              'font-weight': '600',
              'cursor': 'pointer'
            }
          },
          {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            cellRenderer: (params: any) => {
              const status = params.value ? 'Active' : 'Inactive';
              const color = params.value ? '#28a745' : '#dc3545';
              const bgColor = params.value ? '#e6f4ea' : '#fce8e8';
              return `<span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; background-color: ${bgColor}; color: ${color};">${status}</span>`;
            }
          },
        ]
      },
      {
        headerName: 'Contact Details',
        children: [
          { field: 'email', headerName: 'Email', minWidth: 200, tooltipField: 'email' },
          { field: 'phone', headerName: 'Phone', width: 130 },
          { field: 'billingAddress.city', headerName: 'City', width: 120, valueGetter: (p: any) => p.data.billingAddress?.city },
        ]
      },
      {
        headerName: 'Financials',
        children: [
          {
            field: 'outstandingBalance',
            headerName: 'Outstanding',
            width: 150,
            type: 'numericColumn',
            valueFormatter: (params: any) => this.currencyFormatter(params.value),
            cellStyle: (params: any) => {
              if (params.value > 0) return { color: '#e67e22', fontWeight: 'bold' };
              return { color: '#2ecc71' };
            }
          },
          {
            field: 'creditLimit',
            headerName: 'Credit Limit',
            width: 140,
            type: 'numericColumn',
            valueFormatter: (params: any) => this.currencyFormatter(params.value),
          }
        ]
      },
      {
        headerName: 'System Info',
        children: [
          {
            field: 'type',
            headerName: 'Type',
            width: 110,
            valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : ''
          },
          {
            field: 'createdAt',
            headerName: 'Created On',
            width: 160,
            valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
            filter: 'agDateColumnFilter'
          }
        ]
      }
    ];
    this.cdr.detectChanges();
  }


  currencyFormatter(value: number) {
    if (value === undefined || value === null) return '₹ 0.00';
    return '₹ ' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
