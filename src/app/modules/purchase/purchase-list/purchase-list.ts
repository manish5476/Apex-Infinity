import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker'; // Use correct module
import { PurchaseService } from '../purchase.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    RouterModule,
    AgShareGrid
  ],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.scss',
})
export class PurchaseListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService); // Injected

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  supplierOptions = signal<any[]>([]);

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Received', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Unpaid', value: 'unpaid' }
  ];

  purchaseFilter = {
    invoiceNumber: null,
    supplierId: null,
    status: null,
    paymentStatus: null,
    dateRange: null 
  };

  constructor() {
    effect(() => {
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
    this.purchaseFilter = {
      invoiceNumber: null,
      supplierId: null,
      status: null,
      paymentStatus: null,
      dateRange: null
    };
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
    
    let startDate, endDate;
    if (this.purchaseFilter.dateRange && Array.isArray(this.purchaseFilter.dateRange)) {
      if (this.purchaseFilter.dateRange[0]) startDate = (this.purchaseFilter.dateRange[0] as Date)?.toISOString();
      if (this.purchaseFilter.dateRange[1]) endDate = (this.purchaseFilter.dateRange[1] as Date)?.toISOString();
    }

    const filterParams = { 
        ...this.purchaseFilter, 
        startDate, 
        endDate, 
        page: this.currentPage, 
        limit: this.pageSize 
    };
    delete (filterParams as any).dateRange;

    this.purchaseService.getAllPurchases(filterParams).subscribe({
      next: (res: any) => {
        // UPDATED: Mapping to res.data.data as per your JSON
        const newData = res.data?.data || []; 
        
        // Results count often comes from res.pagination.total or res.results
        this.totalCount = res.pagination?.total || res.results || 0;
        
        if (isReset) {
          this.data = newData;
        } else {
          this.data = [...this.data, ...newData];
          if (this.gridApi) {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.detectChanges(); // Use detectChanges to ensure grid updates
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch purchases.');
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
    console.log(event)
    if (event.type=== 'cellClicked') {
      const purchaseId = event.row._id;
      if (purchaseId) {
        this.router.navigate([purchaseId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }
  getColumn(): void {
  this.column = [
    // --- 1. CORE IDENTIFIERS (Pinned) ---
    {
      headerName: '',
      field: '_id',
      width: 50,
      pinned: 'left',
      cellRenderer: ActionViewRenderer,
      lockPosition: true,
      suppressMenu: true
    },
    {
      field: 'invoiceNumber',
      headerName: 'Invoice #',
      width: 140,
      pinned: 'left',
      filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => {
        const val = params.value || 'N/A';
        return `<span style="font-weight: 700; color: var(--color-primary); cursor: pointer; letter-spacing: 0.5px;">${val}</span>`;
      }
    },
    {
      field: 'purchaseDate',
      headerName: 'Date',
      width: 120,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-',
      cellStyle: { color: 'var(--text-secondary)' }
    },

    // --- 2. SUPPLIER DETAILS (Split into individual columns) ---
    {
      field: 'supplierId.companyName',
      headerName: 'Supplier Name',
      width: 200,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => {
        const name = params.value || 'Unknown';
        // Tiny avatar for visual flair
        const char = name.charAt(0).toUpperCase();
        return `
          <div style="display:flex; align-items:center; gap:8px; height:100%;">
            <div style="width:24px; height:24px; border-radius:4px; background:var(--bg-ternary); color:var(--text-secondary); display:grid; place-items:center; font-size:10px; font-weight:700; border:1px solid var(--border-secondary);">${char}</div>
            <span style="font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden;">${name}</span>
          </div>
        `;
      }
    },
    {
      field: 'supplierId.contactPerson',
      headerName: 'Contact Person',
      width: 150,
      valueGetter: (p: any) => p.data.supplierId?.contactPerson || '-',
      cellStyle: { color: 'var(--text-secondary)' }
    },
    {
      field: 'supplierId.email',
      headerName: 'Email',
      width: 200,
      cellRenderer: (params: any) => {
        const email = params.data.supplierId?.email;
        if (!email) return '-';
        return `<a href="mailto:${email}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-envelope" style="font-size:10px"></i> ${email}</a>`;
      }
    },
    {
      field: 'supplierId.phone',
      headerName: 'Phone',
      width: 130,
      cellRenderer: (params: any) => {
        const phone = params.data.supplierId?.phone;
        if (!phone) return '-';
        return `<a href="tel:${phone}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-phone" style="font-size:10px"></i> ${phone}</a>`;
      }
    },

    // --- 3. PURCHASE DETAILS ---
    {
      field: 'branchId.name',
      headerName: 'Branch',
      width: 130,
      filter: true,
      cellRenderer: (params: any) => {
        const branch = params.data.branchId?.name || 'Main';
        return `<span style="background:var(--bg-ternary); padding:2px 8px; border-radius:4px; font-size:11px; color:var(--text-secondary); border:1px solid var(--border-secondary);">${branch}</span>`;
      }
    },
    {
      headerName: 'Items',
      field: 'items', // Array
      width: 100,
      cellRenderer: (params: any) => {
        const count = params.data.items?.length || 0;
        return `<span style="font-weight:600; color:var(--text-primary);"><i class="pi pi-box" style="font-size:10px; color:var(--text-tertiary); margin-right:4px;"></i> ${count}</span>`;
      }
    },

    // --- 4. FINANCIALS (Separate Columns) ---
    {
      field: 'subTotal',
      headerName: 'Sub Total',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: { color: 'var(--text-tertiary)' }
    },
    {
      field: 'totalTax',
      headerName: 'Tax',
      width: 100,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: { color: 'var(--text-tertiary)' }
    },
    {
      field: 'grandTotal',
      headerName: 'Grand Total',
      width: 130,
      type: 'rightAligned',
      cellStyle: { fontWeight: '700', color: 'var(--text-primary)' },
      valueFormatter: (p: any) => this.formatCurrency(p.value)
    },
    {
      field: 'paidAmount',
      headerName: 'Paid',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: { color: 'var(--color-success)' }
    },
    {
      field: 'balanceAmount',
      headerName: 'Balance',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value),
      cellStyle: (params: any) => {
        return params.value > 0 
          ? { color: 'var(--color-error)', fontWeight: '700' } // Due
          : { color: 'var(--text-tertiary)', opacity: 0.7 };   // Cleared
      }
    },

    // --- 5. STATUSES ---
    {
      field: 'status',
      headerName: 'Order Status',
      width: 130,
      cellRenderer: (params: any) => {
        const status = params.value || 'draft';
        // Map colors manually to ensure they match theme tokens without extra CSS
        const colors: any = {
          received: { bg: '#ecfdf5', text: '#059669' },
          draft: { bg: '#f3f4f6', text: '#4b5563' },
          cancelled: { bg: '#fef2f2', text: '#dc2626' }
        };
        const c = colors[status] || colors.draft;
        return `<span style="background:${c.bg}; color:${c.text}; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">${status}</span>`;
      }
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 140,
      cellRenderer: (params: any) => {
        const status = params.value || 'unpaid';
        const icons: any = { paid: 'pi-check-circle', unpaid: 'pi-times-circle', partial: 'pi-exclamation-circle' };
        const colors: any = {
          paid: { color: '#10b981' },
          unpaid: { color: '#ef4444' },
          partial: { color: '#f59e0b' }
        };
        const c = colors[status] || colors.unpaid;
        return `
          <div style="display:flex; align-items:center; gap:6px; color:${c.color}; font-weight:600; font-size:11px; text-transform:uppercase;">
            <i class="pi ${icons[status] || 'pi-info-circle'}"></i> ${status}
          </div>
        `;
      }
    },
    {
      field: 'paymentMethod',
      headerName: 'Method',
      width: 110,
      valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : '-',
      cellStyle: { color: 'var(--text-secondary)', fontSize: '11px' }
    },

    // --- 6. META ---
    {
      field: 'createdBy.name',
      headerName: 'Created By',
      width: 140,
      cellRenderer: (params: any) => {
        const name = params.data.createdBy?.name || 'System';
        return `<span style="font-size:11px; color:var(--text-secondary);"><i class="pi pi-user" style="font-size:9px; margin-right:4px;"></i>${name}</span>`;
      }
    }
  ];
  this.cdr.detectChanges();
}

// Helper to ensure currency formatting works perfectly
private formatCurrency(value: number): string {
  return value !== undefined && value !== null 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value)
    : '₹ 0.00';
}
//   getColumn(): void {
//   this.column = [
//     // 1. Actions (Pinned)
//     {
//       headerName: '',
//       field: '_id',
//       width: 50,
//       pinned: 'left',
//       cellRenderer: ActionViewRenderer,
//       lockPosition: true,
//       suppressMenu: true
//     },

//     // GROUP 1: PURCHASE INFO
//     {
//       headerName: 'Purchase Info',
//       children: [
//         {
//           field: 'invoiceNumber',
//           headerName: 'Invoice Details',
//           width: 200,
//           pinned: 'left',
//           cellRenderer: (params: any) => {
//             const invoice = params.value || 'N/A';
//             const date = params.data.purchaseDate ? new Date(params.data.purchaseDate).toLocaleDateString() : '-';
            
//             return `
//               <div style="display: flex; flex-direction: column; justify-content: center; height: 100%; line-height: 1.3;">
//                 <span style="font-weight: 700; color: var(--color-primary); font-size: 13px; letter-spacing: 0.5px; cursor: pointer;">${invoice}</span>
//                 <span style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center; gap: 4px;">
//                   <i class="pi pi-calendar" style="font-size: 10px;"></i> ${date}
//                 </span>
//               </div>
//             `;
//           }
//         },
//         {
//           field: 'status',
//           headerName: 'Status',
//           width: 120,
//           cellRenderer: (params: any) => {
//             const status = params.value?.toLowerCase() || 'draft';
//             const styles: any = {
//               received: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
//               draft:    { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
//               pending:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
//               cancelled:{ bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
//             };
//             const style = styles[status] || styles.draft;
            
//             return `
//               <span style="
//                 background: ${style.bg}; color: ${style.color}; border: 1px solid ${style.border};
//                 padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
//                 ${status}
//               </span>
//             `;
//           }
//         }
//       ]
//     },

//     // GROUP 2: SUPPLIER DETAILS (Merged for better UI)
//     {
//       headerName: 'Supplier & Contact',
//       children: [
//         {
//           headerName: 'Supplier Profile',
//           width: 260,
//           cellRenderer: (params: any) => {
//             const company = params.data.supplierId?.companyName || 'Unknown';
//             const contact = params.data.supplierId?.contactPerson || 'N/A';
//             const initials = company.substring(0, 2).toUpperCase();

//             return `
//               <div style="display: flex; align-items: center; gap: 10px; height: 100%;">
//                 <div style="
//                   width: 36px; height: 36px; border-radius: 8px; 
//                   background: var(--bg-ternary); color: var(--text-secondary); border: 1px solid var(--border-secondary);
//                   display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">
//                   ${initials}
//                 </div>
//                 <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.3;">
//                   <span style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${company}</span>
//                   <span style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center; gap: 3px;">
//                     <i class="pi pi-user" style="font-size: 10px;"></i> ${contact}
//                   </span>
//                 </div>
//               </div>
//             `;
//           }
//         },
//         {
//           headerName: 'Contact Info',
//           width: 220,
//           cellRenderer: (params: any) => {
//             const email = params.data.supplierId?.email;
//             const phone = params.data.supplierId?.phone;
            
//             if (!email && !phone) return '<span style="color:var(--text-tertiary);">-</span>';

//             return `
//               <div style="display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 2px;">
//                 ${email ? `<a href="mailto:${email}" style="font-size: 11px; color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 6px;"><i class="pi pi-envelope" style="font-size: 10px; color: var(--text-tertiary);"></i> ${email}</a>` : ''}
//                 ${phone ? `<a href="tel:${phone}" style="font-size: 11px; color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 6px;"><i class="pi pi-phone" style="font-size: 10px; color: var(--text-tertiary);"></i> ${phone}</a>` : ''}
//               </div>
//             `;
//           }
//         }
//       ]
//     },

//     // GROUP 3: FINANCIALS
//     {
//       headerName: 'Financial Summary',
//       children: [
//         {
//           field: 'grandTotal',
//           headerName: 'Total',
//           width: 120,
//           type: 'rightAligned',
//           cellRenderer: (params: any) => {
//              return `<span style="font-weight: 600; color: var(--text-primary); font-family: var(--font-mono);">${this.common.formatCurrency(params.value)}</span>`;
//           }
//         },
//         {
//           field: 'balanceAmount',
//           headerName: 'Balance',
//           width: 120,
//           type: 'rightAligned',
//           cellRenderer: (params: any) => {
//              const val = params.value || 0;
//              const color = val > 0 ? 'var(--color-error)' : 'var(--color-success)'; // Red if unpaid
//              return `<span style="font-weight: 700; color: ${color}; font-family: var(--font-mono);">${this.common.formatCurrency(val)}</span>`;
//           }
//         },
//         {
//           field: 'paymentStatus',
//           headerName: 'Payment',
//           width: 110,
//           cellRenderer: (params: any) => {
//             const status = params.value?.toLowerCase() || 'unpaid';
//             let color = '#ef4444'; // Red
//             let icon = 'pi-times-circle';
            
//             if (status === 'paid') { color = '#10b981'; icon = 'pi-check-circle'; } // Green
//             if (status === 'partial') { color = '#f59e0b'; icon = 'pi-exclamation-circle'; } // Orange

//             return `
//               <div style="display: flex; align-items: center; gap: 4px; height: 100%;">
//                 <i class="pi ${icon}" style="color: ${color}; font-size: 12px;"></i>
//                 <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">${status}</span>
//               </div>
//             `;
//           }
//         }
//       ]
//     }
//   ];
//   this.cdr.detectChanges();
// }
// getColumn(): void {
//   this.column = [
//     // GROUP 1: PURCHASE INFORMATION
//     {
//       headerName: 'Purchase Details',
//       headerClass: 'header-group-purchase',
//       children: [
//         {
//           field: 'invoiceNumber',
//           headerName: 'Invoice #',
//           width: 130,
//           pinned: 'left',
//           cellStyle: { 'font-weight': 'var(--font-weight-bold)', 'color': 'var(--accent-primary)' }
//         },
//         {
//           field: 'purchaseDate',
//           headerName: 'Date',
//           width: 120,
//           valueFormatter: (params: any) => this.common.formatDate(params.value)
//         },
//         {
//           field: 'status',
//           headerName: 'Status',
//           width: 110,
//           cellRenderer: (params: any) => {
//              const status = params.value?.toLowerCase() || 'draft';
//              return `<span class="badge-status status-${status}">${params.value.toUpperCase()}</span>`;
//           }
//         }
//       ]
//     },

//     // GROUP 2: SUPPLIER INFORMATION (The expanded data you requested)
//     {
//       headerName: 'Supplier Details',
//       headerClass: 'header-group-supplier',
//       children: [
//         {
//           field: 'supplierId.companyName',
//           headerName: 'Company',
//           width: 180,
//           valueGetter: (params: any) => params.data.supplierId?.companyName || 'N/A',
//           cellStyle: { 'font-weight': 'var(--font-weight-semibold)' }
//         },
//         {
//           field: 'supplierId.contactPerson',
//           headerName: 'Contact Person',
//           width: 150,
//           valueGetter: (params: any) => params.data.supplierId?.contactPerson || '-'
//         },
//         {
//           field: 'supplierId.email',
//           headerName: 'Email Address',
//           width: 200,
//           valueGetter: (params: any) => params.data.supplierId?.email || '-',
//           cellStyle: { 'color': 'var(--text-secondary)', 'font-size': 'var(--font-size-xs)' }
//         },
//         {
//           field: 'supplierId.phone',
//           headerName: 'Phone',
//           width: 130,
//           valueGetter: (params: any) => params.data.supplierId?.phone || '-'
//         }
//       ]
//     },

//     // GROUP 3: FINANCIALS
//     {
//       headerName: 'Financial Summary',
//       headerClass: 'header-group-finance',
//       children: [
//         {
//           field: 'grandTotal',
//           headerName: 'Grand Total',
//           width: 130,
//           type: 'rightAligned',
//           valueFormatter: (params: any) => this.common.formatCurrency(params.value),
//           cellStyle: { 'font-weight': 'var(--font-weight-bold)' }
//         },
//         {
//           field: 'balanceAmount',
//           headerName: 'Balance Due',
//           width: 130,
//           type: 'rightAligned',
//           valueFormatter: (params: any) => this.common.formatCurrency(params.value),
//           cellStyle: (params: any) => ({
//             'color': params.value > 0 ? 'var(--color-error)' : 'var(--color-success)',
//             'font-weight': 'var(--font-weight-bold)'
//           })
//         },
//         {
//           field: 'paymentStatus',
//           headerName: 'Payment',
//           width: 120,
//           cellRenderer: (params: any) => {
//              const payStatus = params.value?.toLowerCase() || 'unpaid';
//              return `<span class="badge-payment pay-${payStatus}">${params.value.toUpperCase()}</span>`;
//           }
//         }
//       ]
//     }
//   ];
//   this.cdr.detectChanges();
// }

}

