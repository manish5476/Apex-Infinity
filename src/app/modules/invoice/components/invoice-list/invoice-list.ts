
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent, ITooltipParams } from 'ag-grid-community';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

// Services
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { ActionViewRenderer } from '../../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

// -------------------------------------------------------------------------
// 2. Main Invoice List Component
// -------------------------------------------------------------------------
@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    ToastModule,
    DatePickerModule,
    AgShareGrid
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService);

  private gridApi!: GridApi;


  private currentPage = 1;
  private pageSize = 50;
  hasNextPage = true;
  isLoading = false;
  isExporting = false;
  totalCount = 0;

  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  customerOptions = signal<any[]>([]);

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  paymentStatusOptions = [
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
  ];

  invoiceFilter = {
    invoiceNumber: null,
    customerId: null,
    status: null,
    paymentStatus: null,
  };

  dateRange: Date[] | undefined;

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
    this.invoiceFilter = {
      invoiceNumber: null,
      customerId: null,
      status: null,
      paymentStatus: null,
    };
    this.dateRange = undefined;
    this.getData(true);
  }


  onScrolledToBottom(_: any) {
    //
    if (!this.isLoading && this.hasNextPage) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked') {
      const invoiceId = event.row._id;
      if (event.field === '_id') {

      } else {
        this.router.navigate([invoiceId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
    this.column = [

      {
        headerName: 'Identity',
        children: [

          {
            field: 'invoiceNumber',
            headerName: 'Invoice #',
            pinned: 'left',
            width: 150,
            filter: 'agTextColumnFilter',
            cellStyle: { 'display': 'flex', 'align-items': 'center' },
            cellRenderer: (params: any) => {
              return `<span style="color:var(--accent-primary); font-weight:700; font-family:var(--font-mono); cursor:pointer; letter-spacing:0.5px;">
                      ${params.value}
                    </span>`;
            }
          },

          {
            field: 'branchId.name',
            headerName: 'Branch',
            width: 110,
            cellStyle: { 'display': 'flex', 'align-items': 'center', 'color': 'var(--text-secondary)' }
          }
        ]
      },


      {
        headerName: 'Customer Information',
        children: [
          {
            headerName: 'Customer',
            field: 'customerId.name',
            width: 200,
            cellRenderer: (params: any) => {
              const customer = params.data.customerId;
              if (!customer) return '-';

              const name = customer.name;
              const contact = customer.phone || customer.email || '';


              return `
              <div style="display:flex; flex-direction:column; justify-content:center; height:100%; line-height:1.3;">
                <span style="font-weight:600; color:var(--text-primary); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${name}
                </span>
                <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center; gap:4px;">
                  ${contact ? `<i class="pi pi-user" style="font-size:9px"></i> ${contact}` : ''}
                </span>
              </div>`;
            }
          },
          {
            field: 'placeOfSupply',
            headerName: 'Location',
            width: 110,
            cellStyle: { 'color': 'var(--text-secondary)', 'font-size': '12px', 'display': 'flex', 'align-items': 'center' }
          }
        ]
      },


      {
        headerName: 'Status & Timeline',
        children: [
          {
            field: 'invoiceDate',
            headerName: 'Date',
            width: 110,
            valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
            cellStyle: { 'color': 'var(--text-secondary)', 'font-size': '12px', 'display': 'flex', 'align-items': 'center' }
          },
          {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 110,
            valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
            cellStyle: (params: any) => {

              const isOverdue = new Date(params.value) < new Date() && params.data.paymentStatus !== 'paid';
              return {
                'color': isOverdue ? 'var(--color-error)' : 'var(--text-secondary)',
                'font-size': '12px',
                'font-weight': isOverdue ? '600' : '400',
                'display': 'flex',
                'align-items': 'center'
              };
            }
          },
          {
            field: 'status',
            headerName: 'Status',
            width: 120,
            cellRenderer: (p: any) => this.statusBadgeRenderer(p.value, 'status'),
          },
          {
            field: 'paymentStatus',
            headerName: 'Payment',
            width: 120,
            cellRenderer: (p: any) => this.statusBadgeRenderer(p.value, 'payment'),
          }
        ]
      },


      {
        headerName: 'Financials',
        children: [
          {
            field: 'grandTotal',
            headerName: 'Total',
            width: 130,
            type: 'rightAligned',
            valueFormatter: (p: any) => this.currencyFormatter(p.value),
            cellStyle: {
              'font-weight': '600',
              'color': 'var(--text-primary)',
              'font-family': 'var(--font-mono)',
              'display': 'flex',
              'align-items': 'center',
              'justify-content': 'flex-end'
            }
          },
          {
            field: 'balanceAmount',
            headerName: 'Balance',
            width: 130,
            type: 'rightAligned',
            valueFormatter: (p: any) => this.currencyFormatter(p.value),
            cellRenderer: (params: any) => {
              const balance = params.value;
              if (balance <= 0) {
                return `<span style="color:#15803d; font-weight:700; font-size:11px; background:#ecfdf5; padding:2px 6px; border-radius:4px;">PAID</span>`;
              }
              return `<span style="color:#b91c1c; font-weight:700; font-family:var(--font-mono);">${this.currencyFormatter(balance)}</span>`;
            },
            cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
          }
        ]
      },


      {
        headerName: 'Actions',
        field: '_id',
        width: 50,
        cellRenderer: ActionViewRenderer,
      }
    ];
    this.cdr.detectChanges();
  }

  currencyFormatter(value: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  }

  statusBadgeRenderer(val: string, type: 'status' | 'payment') {
    if (!val) return '';
    const colors: any = {
      draft: { bg: '#f3f4f6', text: '#374151' },
      paid: { bg: '#dcfce7', text: '#15803d' },
      unpaid: { bg: '#fee2e2', text: '#b91c1c' },
      partial: { bg: '#fef9c3', text: '#854d0e' },
      issued: { bg: '#e0f2fe', text: '#0369a1' },
      cancelled: { bg: '#f1f5f9', text: '#64748b' }
    };
    const theme = colors[val.toLowerCase()] || colors.draft;
    return `<span style="background:${theme.bg}; color:${theme.text}; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">${val}</span>`;
  }

  exportReport() {
    if (this.isExporting) return;
    this.isExporting = true;
    
    const params: any = { ...this.invoiceFilter, format: 'csv' };
    if (this.dateRange && this.dateRange[0]) {
      params.start = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      params.end = this.dateRange[1].toISOString();
    }

    this.invoiceService.exportInvoices(params)
      .pipe(finalize(() => this.isExporting = false))
      .subscribe({
        next: (blob) => {
          const filename = `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`;
          this.common.downloadBlob(blob, filename);
          
          // Added a simple success notification
          this.messageService.showSuccess('Invoice report exported successfully.');
        },
        error: (err) => {
          // Replaced manual showError with the global HTTP error handler
          this.messageService.handleHttpError(err);
        }
      });
  }

  getData(isReset: boolean = false) {
    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
      this.hasNextPage = true; 
    }

    if (this.isLoading || (!isReset && !this.hasNextPage)) return;

    this.isLoading = true;

    const filterParams: any = {
      ...this.invoiceFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.dateRange && this.dateRange[0]) {
      filterParams['invoiceDate[gte]'] = this.dateRange[0].toISOString();
    }

    if (this.dateRange && this.dateRange[1]) {
      const endDate = new Date(this.dateRange[1]);
      filterParams['invoiceDate[lte]'] = endDate.toISOString();
    }

    this.invoiceService.getAllInvoices(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        if (res.pagination) {
            this.hasNextPage = res.pagination.hasNextPage;
            this.totalCount = res.pagination.totalResults;
        } else {
            this.hasNextPage = newData.length >= this.pageSize;
            this.totalCount = res.results || 0;
        }

        if (isReset) {
            this.data = newData;
        } else {
            this.data = [...this.data, ...newData];
        }

        if (this.gridApi && !isReset && newData.length > 0) {
          this.gridApi.applyTransaction({ add: newData });
        }

        if (this.hasNextPage) {
            this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        
        // Replaced manual string with global handler for precise error reporting
        this.messageService.handleHttpError(err);
        
        // Vital to ensure the UI updates if the request fails
        this.cdr.markForCheck();
      }
    });
  }
}
