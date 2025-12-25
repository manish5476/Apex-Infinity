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

// --- 1. Define Tooltip Component First (or in a separate file) ---
@Component({
  selector: 'item-tooltip',
  standalone: true, // Mark as standalone
  imports: [CommonModule], // Import CommonModule for *ngFor
  template: `
    <div class="custom-tooltip-card">
      <div class="tooltip-header">Invoice Items</div>
      <div class="tooltip-list">
        <div *ngFor="let item of items" class="tooltip-item">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-details">Qty: {{ item.quantity }} | ₹{{ item.price }}</span>
        </div>
        <div *ngIf="items.length === 0" class="tooltip-item">No items found</div>
      </div>
      <div class="tooltip-footer">Grand Total: {{ formatCurrency(params.data.grandTotal) }}</div>
    </div>
  `,
  styles: [`
    .custom-tooltip-card {
      background: white; border: 1px solid #ddd; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 12px; width: 250px; pointer-events: none;
    }
    .tooltip-header { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; color: #333; }
    .tooltip-item { margin-bottom: 6px; display: flex; flex-direction: column; }
    .item-name { font-size: 13px; font-weight: 500; color: #1a73e8; }
    .item-details { font-size: 11px; color: #666; }
    .tooltip-footer { margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 5px; font-weight: bold; font-size: 12px; text-align: right; }
  `]
})
export class ItemTooltipComponent implements ITooltipAngularComp {
  params!: ITooltipParams;
  items: any[] = [];

  agInit(params: ITooltipParams): void {
    this.params = params;
    this.items = params.data.items || [];
  }

  formatCurrency(value: number) {
     return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  }
}

// --- 2. Main Invoice List Component ---
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
    AgShareGrid,
    ItemTooltipComponent // Import the tooltip component here
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
  private pageSize = 20;
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
        },
        error: (err) => this.messageService.showError('Export Failed', 'Could not download report.')
      });
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const filterParams: any = {
      ...this.invoiceFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.dateRange && this.dateRange[0]) {
      filterParams.start = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      filterParams.end = this.dateRange[1].toISOString();
    }

    this.invoiceService.getAllInvoices(filterParams).subscribe({
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
        this.messageService.showError('Error', 'Failed to fetch invoices.');
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
      const invoiceId = event.row._id;
      if (invoiceId) {
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
        headerName: 'Invoice Details',
        children: [
          {
            field: 'invoiceNumber',
            headerName: 'INV #',
            pinned: 'left',
            width: 160,
            cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '700', 'cursor': 'pointer' },
            cellRenderer: 'agGroupCellRenderer', 
          },
          {
            field: 'items',
            headerName: 'Products',
            width: 220,
            tooltipField: 'items',
            tooltipComponent: ItemTooltipComponent,
            valueGetter: (params: any) => {
              const items = params.data.items || [];
              if (items.length === 0) return 'No items';
              return items.length === 1 
                ? items[0].name 
                : `${items[0].name} (+${items.length - 1} more)`;
            },
          }
        ]
      },
      {
        headerName: 'Status & Timeline',
        children: [
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
          },
          {
            field: 'invoiceDate',
            headerName: 'Date',
            width: 110,
            valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '',
          }
        ]
      },
      {
        headerName: 'Financial Summary',
        children: [
          {
            field: 'grandTotal',
            headerName: 'Total Amount',
            width: 140,
            type: 'rightAligned',
            cellStyle: { 'font-weight': 'bold', 'font-family': 'monospace', 'font-size': '14px' },
            valueFormatter: (p: any) => this.currencyFormatter(p.value)
          },
          {
            field: 'balanceAmount',
            headerName: 'Balance',
            width: 140,
            type: 'rightAligned',
            valueFormatter: (p: any) => this.currencyFormatter(p.value),
            cellStyle: (params: any) => ({
              'color': params.value > 0 ? '#e74c3c' : '#27ae60',
              'font-weight': 'bold',
              'font-family': 'monospace'
            })
          }
        ]
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
}
// import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { finalize } from 'rxjs/operators';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { DatePickerModule } from 'primeng/datepicker';
// import { ToastModule } from 'primeng/toast';

// // Services
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { InvoiceService } from '../../services/invoice-service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

// @Component({
//   selector: 'app-invoice-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule,
//     ToastModule,
//     DatePickerModule,
//     AgShareGrid
//   ],
//   templateUrl: './invoice-list.html',
//   styleUrl: './invoice-list.scss',
// })
// export class InvoiceListComponent implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private invoiceService = inject(InvoiceService);
//   private messageService = inject(AppMessageService);
//   public masterList = inject(MasterListService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private common = inject(CommonMethodService);

//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private pageSize = 20;
//   isLoading = false;
//   isExporting = false;
//   totalCount = 0;
  
//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   customerOptions = signal<any[]>([]);

//   statusOptions = [
//     { label: 'Draft', value: 'draft' },
//     { label: 'Issued', value: 'issued' },
//     { label: 'Paid', value: 'paid' },
//     { label: 'Cancelled', value: 'cancelled' },
//   ];
  
//   paymentStatusOptions = [
//     { label: 'Unpaid', value: 'unpaid' },
//     { label: 'Partial', value: 'partial' },
//     { label: 'Paid', value: 'paid' },
//   ];

//   invoiceFilter = {
//     invoiceNumber: null,
//     customerId: null,
//     status: null,
//     paymentStatus: null,
//   };
  
//   dateRange: Date[] | undefined;

//   constructor() {
//     effect(() => {
//       this.customerOptions.set(this.masterList.customers());
//     });
//   }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.invoiceFilter = {
//       invoiceNumber: null,
//       customerId: null,
//       status: null,
//       paymentStatus: null,
//     };
//     this.dateRange = undefined;
//     this.getData(true);
//   }

//   exportReport() {
//     if (this.isExporting) return;
//     this.isExporting = true;
//     const params: any = { ...this.invoiceFilter, format: 'csv' };
//     if (this.dateRange && this.dateRange[0]) {
//       params.start = this.dateRange[0].toISOString();
//     }
//     if (this.dateRange && this.dateRange[1]) {
//       params.end = this.dateRange[1].toISOString();
//     }

//     this.invoiceService.exportInvoices(params)
//       .pipe(finalize(() => this.isExporting = false))
//       .subscribe({
//         next: (blob) => {
//           const filename = `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`;
//           this.common.downloadBlob(blob, filename);
//         },
//         error: (err) => this.messageService.showError('Export Failed', 'Could not download report.')
//       });
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const filterParams: any = {
//       ...this.invoiceFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     if (this.dateRange && this.dateRange[0]) {
//       filterParams.start = this.dateRange[0].toISOString();
//     }
//     if (this.dateRange && this.dateRange[1]) {
//       filterParams.end = this.dateRange[1].toISOString();
//     }

//     this.invoiceService.getAllInvoices(filterParams).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) {
//           newData = res.data.data;
//         }

//         this.totalCount = res.results || this.totalCount;
//         this.data = [...this.data, ...newData];

//         if (this.gridApi && !isReset) {
//            this.gridApi.applyTransaction({ add: newData });
//         }

//         this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch invoices.');
//       }
//     });
//   }

//   onScrolledToBottom(_: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   eventFromGrid(event: any) {
//     console.log(event);
//     if (event.type === 'cellClicked') {
//       const invoiceId = event.row._id;
//       if (invoiceId) {
//         this.router.navigate([invoiceId], { relativeTo: this.route });
//       }
//     } 
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom(event)
//     }
//   }
// getColumn(): void {
//   this.column = [
//     {
//       headerName: 'Invoice Details',
//       children: [
//         {
//           field: 'invoiceNumber',
//           headerName: 'INV #',
//           pinned: 'left',
//           width: 160,
//           cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '700', 'cursor': 'pointer' },
//           // Adds the [+] icon for Master-Detail view
//           cellRenderer: 'agGroupCellRenderer', 
//         },
//         {
//           field: 'items',
//           headerName: 'Products',
//           width: 220,
//           // Custom Tooltip that renders as a List/Card
//           tooltipField: 'items',
//           tooltipComponent: ItemTooltipComponent, // Defined below
//           valueGetter: (params: any) => {
//             const items = params.data.items || [];
//             if (items.length === 0) return 'No items';
//             return items.length === 1 
//               ? items[0].name 
//               : `${items[0].name} (+${items.length - 1} more)`;
//           },
//         }
//       ]
//     },
//     {
//       headerName: 'Status & Timeline',
//       children: [
//         {
//           field: 'status',
//           headerName: 'Status',
//           width: 120,
//           cellRenderer: (p: any) => this.statusBadgeRenderer(p.value, 'status'),
//         },
//         {
//           field: 'paymentStatus',
//           headerName: 'Payment',
//           width: 120,
//           cellRenderer: (p: any) => this.statusBadgeRenderer(p.value, 'payment'),
//         },
//         {
//           field: 'invoiceDate',
//           headerName: 'Date',
//           width: 110,
//           valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '',
//         }
//       ]
//     },
//     {
//       headerName: 'Financial Summary',
//       children: [
//         {
//           field: 'grandTotal',
//           headerName: 'Total Amount',
//           width: 140,
//           type: 'rightAligned',
//           cellStyle: { 'font-weight': 'bold', 'font-family': 'monospace', 'font-size': '14px' },
//           valueFormatter: (p: any) => this.currencyFormatter(p.value)
//         },
//         {
//           field: 'balanceAmount',
//           headerName: 'Balance',
//           width: 140,
//           type: 'rightAligned',
//           valueFormatter: (p: any) => this.currencyFormatter(p.value),
//           cellStyle: (params: any) => ({
//             'color': params.value > 0 ? '#e74c3c' : '#27ae60',
//             'font-weight': 'bold',
//             'font-family': 'monospace'
//           })
//         }
//       ]
//     }
//   ];
//   this.cdr.detectChanges();
// }

// // Utility for clean currency
// currencyFormatter(value: number) {
//   return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
// }

// // Utility for modern badges
// statusBadgeRenderer(val: string, type: 'status' | 'payment') {
//   if (!val) return '';
//   const colors: any = {
//     draft: { bg: '#f3f4f6', text: '#374151' },
//     paid: { bg: '#dcfce7', text: '#15803d' },
//     unpaid: { bg: '#fee2e2', text: '#b91c1c' },
//     partial: { bg: '#fef9c3', text: '#854d0e' }
//   };
//   const theme = colors[val.toLowerCase()] || colors.draft;
//   return `<span style="background:${theme.bg}; color:${theme.text}; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">${val}</span>`;
// }

//   import { ITooltipAngularComp } from 'ag-grid-angular';
// import { ITooltipParams } from 'ag-grid-community';

// @Component({
//   selector: 'item-tooltip',
//   template: `
//     <div class="custom-tooltip-card">
//       <div class="tooltip-header">Invoice Items</div>
//       <div class="tooltip-list">
//         <div *ngFor="let item of items" class="tooltip-item">
//           <span class="item-name">{{ item.name }}</span>
//           <span class="item-details">Qty: {{ item.quantity }} | ₹{{ item.price }}</span>
//         </div>
//       </div>
//       <div class="tooltip-footer">Grand Total: ₹{{ params.data.grandTotal }}</div>
//     </div>
//   `,
//   styles: [`
//     .custom-tooltip-card {
//       background: white; border: 1px solid #ddd; border-radius: 8px;
//       box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 12px; width: 250px;
//     }
//     .tooltip-header { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; color: #333; }
//     .tooltip-item { margin-bottom: 6px; display: flex; flex-direction: column; }
//     .item-name { font-size: 13px; font-weight: 500; color: #1a73e8; }
//     .item-details { font-size: 11px; color: #666; }
//     .tooltip-footer { margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 5px; font-weight: bold; font-size: 12px; text-align: right; }
//   `]
// })
// export class ItemTooltipComponent implements ITooltipAngularComp {
//   params!: ITooltipParams;
//   items: any[] = [];

//   agInit(params: ITooltipParams): void {
//     this.params = params;
//     this.items = params.data.items || [];
//   }
// }

//   // getColumn(): void {
//   //   this.column = [
//   //     {
//   //       field: 'invoiceNumber',
//   //       headerName: 'Number',
//   //       sortable: true,
//   //       filter: true,
//   //       width: 150,
//   //       cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '600', 'cursor': 'pointer' }
//   //     },
//   //     {
//   //       field: 'customer.name',
//   //       headerName: 'Customer',
//   //       sortable: true,
//   //       filter: true,
//   //       flex: 1,
//   //       minWidth: 200,
//   //       valueGetter: (params: any) => params.data.customer?.name || 'N/A',
//   //     },
//   //     {
//   //       field: 'status',
//   //       headerName: 'Status',
//   //       sortable: true,
//   //       width: 130,
//   //       cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
//   //     },
//   //     {
//   //       field: 'paymentStatus',
//   //       headerName: 'Payment',
//   //       sortable: true,
//   //       width: 130,
//   //       cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
//   //     },
//   //     {
//   //       field: 'invoiceDate',
//   //       headerName: 'Date',
//   //       sortable: true,
//   //       width: 140,
//   //       valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
//   //     },
//   //     {
//   //       field: 'dueDate',
//   //       headerName: 'Due Date',
//   //       sortable: true,
//   //       width: 140,
//   //       valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
//   //     },
//   //     {
//   //       field: 'grandTotal',
//   //       headerName: 'Total',
//   //       sortable: true,
//   //       width: 130,
//   //       type: 'rightAligned',
//   //       valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
//   //       cellStyle: { 'font-weight': 'bold' }
//   //     },
//   //     {
//   //       field: 'balanceAmount',
//   //       headerName: 'Balance',
//   //       sortable: true,
//   //       width: 130,
//   //       type: 'rightAligned',
//   //       valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
//   //       cellStyle: (params: any) => params.value > 0 ? {'color': 'var(--color-error)'} : {'color': 'var(--color-success)'}
//   //     },
//   //   ];
//   //   this.cdr.detectChanges();
//   // }
// }
