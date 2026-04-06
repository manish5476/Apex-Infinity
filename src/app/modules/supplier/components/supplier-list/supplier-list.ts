import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AppMessageService } from '../../../../core/services/message.service';
import { SupplierService } from '../../services/supplier-service';
import { Toast } from "primeng/toast";
import { AgShareGrid, ActionColumnConfig } from "../../../shared/components/ag-shared-grid";
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule,SelectModule,FormsModule,ButtonModule,InputTextModule,RouterModule,Toast,AgShareGrid,
    HasPermissionDirective
  ],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
})
export class SupplierListComponent implements OnInit {
  readonly PERMISSIONS = PERMISSIONS;

  readonly supplierActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.SUPPLIER.READ,
  };

  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Filters ---
  supplierFilter = {companyName: null,
    phone: null,
  };

  constructor() { }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.supplierFilter = {
      companyName: null,
      phone: null,
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
      // Clear grid to avoid stale data
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', []);
      }
    }

    const filterParams = {
      ...this.supplierFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.supplierService.getAllSuppliers(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        
        // 1. EXTRACT DATA (Nested: res.data.data)
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        // 2. EXTRACT PAGINATION (Sibling: res.pagination)
        if (res.pagination) {
            this.totalCount = res.pagination.totalResults;
        } else {
            this.totalCount = 0;
        }

        // 3. UPDATE LOCAL STATE
        this.data = [...this.data, ...newData];

        // 4. UPDATE GRID
        if (this.gridApi) {
          if (isReset) {
            this.gridApi.setGridOption('rowData', newData);
          } else {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        
        // I kept your console.error for debugging!
        console.error('Failed to fetch suppliers', err);
        
        // Handed off the error formatting to the global HTTP error handler
        this.messageService.handleHttpError(err);
        
        // Added markForCheck so your UI loading spinner correctly disappears on failure
        this.cdr.markForCheck();
      }
    });
  }
  onScrolledToBottom(_?: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

   eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
      return;
    }
    if (event.type=== 'cellClicked') {
      const supplierId = event.row._id;
      if (supplierId) {
        this.router.navigate([supplierId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom()
    }
  }


  getColumn(): void {
  const compactCell = {
    fontSize: 'var(--font-size-sm)',
    padding: '0 var(--spacing-md)',
    display: 'flex',
    alignItems: 'center'
  };

  this.column = [
    // ========================
    // 1. COMPANY IDENTITY
    // ========================
    {
      headerName: 'Company',
      field: 'companyName',
      flex: 2,
      minWidth: 220,
      pinned: 'left',
      cellRenderer: (p: any) => {
        const category = p.data.category || 'General';
        const avatar = p.data.avatar ? `<img src="${p.data.avatar}" style="width:20px; height:20px; border-radius:50%; margin-right:8px;">` : '';
        
        return `
          <div style="display: flex; align-items: center; line-height: var(--line-height-tight); padding: var(--spacing-xs) 0;">
            ${avatar}
            <div>
              <div style="color: var(--accent-primary); font-weight: var(--font-weight-semibold); font-size: var(--font-size-md);">
                ${p.value}
              </div>
              <div style="color: var(--text-tertiary); font-size: var(--font-size-xs);">
                ${category} • ${p.data.phone || 'No Phone'}
              </div>
            </div>
          </div>
        `;
      }
    },

    // ========================
    // 2. PRIMARY CONTACT (Array Extraction)
    // ========================
    {
      headerName: 'Primary Contact',
      field: 'contacts',
      flex: 1.5,
      cellRenderer: (p: any) => {
        // Find the primary contact object from the array
        const primary = p.value?.find((c: any) => c.isPrimary) || (p.value ? p.value[0] : null);
        if (!primary) return '<span style="color:var(--text-tertiary)">—</span>';
        
        return `
          <div style="line-height: var(--line-height-tight)">
            <div style="font-size: var(--font-size-sm); color: var(--text-primary); font-weight: var(--font-weight-medium);">
              ${primary.name}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--accent-secondary);">
              ${primary.email}
            </div>
          </div>
        `;
      }
    },

    // ========================
    // 3. FINANCIALS (Outstanding & Terms)
    // ========================
    {
      headerName: 'Outstanding',
      field: 'outstandingBalance',
      width: 140,
      sortable: true,
      filter: 'agNumberColumnFilter',
      headerClass: 'ag-right-aligned-header',
      cellStyle: (p: any) => ({
        ...compactCell,
        justifyContent: 'flex-end',
        fontWeight: 'var(--font-weight-bold)',
        color: p.value > 0 ? 'var(--color-error)' : 'var(--color-success)'
      }),
      valueFormatter: (p: any) => p.value ? `₹${p.value.toLocaleString('en-IN')}` : '₹0'
    },
    {
      headerName: 'Terms',
      field: 'paymentTerms',
      width: 100,
      cellRenderer: (p: any) => `
        <span style="
          background: var(--color-info-bg);
          color: var(--color-info-dark);
          border: 1px solid var(--color-info-border);
          padding: 1px 6px;
          border-radius: var(--ui-border-radius-sm);
          font-size: var(--font-size-xs);
        ">
          ${p.value || 'Net 0'}
        </span>
      `
    },

    // ========================
    // 4. TAX & COMPLIANCE
    // ========================
    {
      headerName: 'Tax Details',
      width: 160,
      cellRenderer: (p: any) => {
        const gst = p.data.gstNumber || 'N/A';
        const pan = p.data.panNumber || 'N/A';
        return `
          <div style="font-family: var(--font-mono); font-size: var(--font-size-xs); line-height: 1.1">
            <div style="color: var(--text-secondary)">GST: <span style="color:var(--text-primary)">${gst}</span></div>
            <div style="color: var(--text-tertiary)">PAN: ${pan}</div>
          </div>
        `;
      }
    },

    // ========================
    // 5. LOCATION (Nested Object)
    // ========================
    {
      headerName: 'Location',
      field: 'address',
      flex: 1.2,
      valueGetter: (p: any) => {
        if (!p.data.address) return '—';
        const { city, state } = p.data.address;
        return city ? `${city}, ${state || ''}` : '—';
      },
      cellStyle: { ...compactCell, color: 'var(--text-tertiary)' }
    },

    // ========================
    // 6. BANK INFO
    // ========================
    {
      headerName: 'Bank',
      field: 'bankDetails',
      width: 150,
      cellRenderer: (p: any) => {
        if (!p.value) return '—';
        return `
          <div style="line-height: 1.1; font-size: var(--font-size-xs);">
            <div style="color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis;">${p.value.bankName}</div>
            <div style="color:var(--text-tertiary); font-family:var(--font-mono)">${p.value.ifscCode}</div>
          </div>
        `;
      }
    },

    // ========================
    // 7. STATUS & CREATION
    // ========================
    {
      headerName: 'Status',
      field: 'isActive',
      width: 100,
      cellRenderer: (p: any) => {
        const active = p.value;
        return `
          <span style="
            background: ${active ? 'var(--color-success-bg)' : 'var(--color-error-bg)'};
            color: ${active ? 'var(--color-success-dark)' : 'var(--color-error-dark)'};
            padding: 2px 8px;
            border-radius: 10px;
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
          ">
            ${active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        `;
      }
    },
    {
      headerName: 'Updated',
      field: 'updatedAt',
      width: 110,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString() : '—',
      cellStyle: { ...compactCell, color: 'var(--text-label)' }
    }
  ];

  this.cdr.detectChanges();
}
  
//   getColumn(): void {
//   const compactCell = {
//     fontSize: 'var(--font-size-sm)',
//     padding: '0 var(--spacing-md)',
//     display: 'flex',
//     alignItems: 'center'
//   };

//   this.column = [

//     // ========================
//     // COMPANY (Identity block)
//     // ========================
//     {
//       headerName: 'Company',
//       field: 'companyName',
//       flex: 2,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       cellRenderer: (p: any) => {
//         const city = p.data.address?.city || '';
//         const phone = p.data.phone || '';

//         return `
//           <div style="line-height:1.2">
//             <div style="
//               color:var(--accent-primary);
//               font-weight:var(--font-weight-semibold);
//               font-size:var(--font-size-md);
//             ">
//               ${p.value}
//             </div>
//             <div style="
//               color:var(--text-tertiary);
//               font-size:var(--font-size-xs);
//             ">
//               ${city} • ${phone}
//             </div>
//           </div>
//         `;
//       }
//     },

//     // ========================
//     // CONTACT
//     // ========================
//     {
//       headerName: 'Contact',
//       field: 'contactPerson',
//       flex: 1.4,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       cellStyle: compactCell,
//       valueFormatter: (p: any) =>
//         `${p.value || '—'}`
//     },

//     // ========================
//     // EMAIL
//     // ========================
//     {
//       headerName: 'Email',
//       field: 'email',
//       flex: 1.8,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       cellStyle: {
//         ...compactCell,
//         color: 'var(--text-secondary)'
//       }
//     },

//     // ========================
//     // LOCATION
//     // ========================
//     {
//       headerName: 'Location',
//       flex: 1.2,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       valueGetter: (p: any) => {
//         const a = p.data.address || {};
//         return `${a.city || ''}, ${a.state || ''}`;
//       },
//       cellStyle: compactCell
//     },

//     // ========================
//     // OPENING BALANCE
//     // ========================
//     {
//       headerName: 'Opening',
//       field: 'openingBalance',
//       width: 130,
//       sortable: true,
//       filter: 'agNumberColumnFilter',
//       valueFormatter: (p: any) =>
//         typeof p.value === 'number'
//           ? `₹ ${p.value.toFixed(2)}`
//           : '—',
//       cellStyle: compactCell
//     },

//     // ========================
//     // OUTSTANDING
//     // ========================
//     {
//       headerName: 'Outstanding',
//       field: 'outstandingBalance',
//       width: 150,
//       sortable: true,
//       filter: 'agNumberColumnFilter',
//       valueFormatter: (p: any) =>
//         typeof p.value === 'number'
//           ? `₹ ${p.value.toFixed(2)}`
//           : '—',
//       cellStyle: (p: any) => ({
//         ...compactCell,
//         fontWeight: 'var(--font-weight-semibold)',
//         color:
//           p.value > 0
//             ? 'var(--color-error)'
//             : 'var(--color-success)'
//       })
//     },

//     // ========================
//     // PAYMENT TERMS
//     // ========================
//     {
//       headerName: 'Terms',
//       field: 'paymentTerms',
//       width: 100,
//       sortable: true,
//       filter: true,
//       cellRenderer: (p: any) =>
//         `<span style="
//           background:var(--color-info-bg);
//           color:var(--color-info-dark);
//           padding:2px 8px;
//           border-radius:var(--ui-border-radius);
//           font-size:var(--font-size-xs);
//         ">
//           ${p.value || 0} days
//         </span>`
//     },

//     // ========================
//     // STATUS BADGE
//     // ========================
//     {
//       headerName: 'Status',
//       field: 'isActive',
//       width: 110,
//       sortable: true,
//       filter: true,
//       cellRenderer: (p: any) => {
//         const active = p.value;

//         return `
//           <span style="
//             padding:2px 10px;
//             border-radius:var(--ui-border-radius);
//             font-size:var(--font-size-xs);
//             font-weight:var(--font-weight-medium);
//             background:${
//               active
//                 ? 'var(--color-success-bg)'
//                 : 'var(--color-error-bg)'
//             };
//             color:${
//               active
//                 ? 'var(--color-success-dark)'
//                 : 'var(--color-error-dark)'
//             };
//           ">
//             ${active ? 'Active' : 'Inactive'}
//           </span>
//         `;
//       }
//     },

//     // ========================
//     // CREATED DATE
//     // ========================
//     {
//       headerName: 'Created',
//       field: 'createdAt',
//       width: 130,
//       sortable: true,
//       valueFormatter: (p: any) =>
//         p.value
//           ? new Date(p.value).toLocaleDateString()
//           : '—',
//       cellStyle: compactCell
//     }

//   ];

//   this.cdr.detectChanges();
// }
}

// import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { SupplierService } from '../../services/supplier-service';
// import { Toast } from "primeng/toast";
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

// // Shared


// @Component({
//   selector: 'app-supplier-list',
//   standalone: true,
//   imports: [
//     CommonModule,

//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule,
//     Toast,
//     AgShareGrid
//   ],
//   templateUrl: './supplier-list.html',
//   styleUrl: './supplier-list.scss',
// })
// export class SupplierListComponent implements OnInit {
//   // --- Injected Services ---
//   private cdr = inject(ChangeDetectorRef);
//   private supplierService = inject(SupplierService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   // --- Grid & Data ---
//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 50;
//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   // --- Filters ---
//   supplierFilter = {
//     companyName: null,
//     phone: null,
//   };

//   constructor() { }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.supplierFilter = {
//       companyName: null,
//       phone: null,
//     };
//     this.getData(true);
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const filterParams = {
//       ...this.supplierFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     this.supplierService.getAllSuppliers(filterParams).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) {
//           newData = res.data.data;
//         }

//         this.totalCount =  res.pagination.totalResults 
//         this.data = [...this.data, ...newData];

//         if (this.gridApi) {
//           // if (isReset) this.gridApi.setRowData(this.data);
//           // else this.gridApi.applyTransaction({ add: newData });
//         }

//         this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch suppliers.');
//       }
//     });
//   }

//   onScrolledToBottom(_?: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   eventFromGrid(event: any) {
//     if (event.type=== 'cellClicked') {
//       const supplierId = event.row._id;
//       if (supplierId) {
//         this.router.navigate([supplierId], { relativeTo: this.route });
//       }
//     }
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom()
//     }
//   }

//   getColumn(): void {
//   const compactCell = {
//     fontSize: 'var(--font-size-sm)',
//     padding: '0 var(--spacing-md)',
//     display: 'flex',
//     alignItems: 'center'
//   };

//   this.column = [

//     // ========================
//     // COMPANY (Identity block)
//     // ========================
//     {
//       headerName: 'Company',
//       field: 'companyName',
//       flex: 2,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       cellRenderer: (p: any) => {
//         const city = p.data.address?.city || '';
//         const phone = p.data.phone || '';

//         return `
//           <div style="line-height:1.2">
//             <div style="
//               color:var(--accent-primary);
//               font-weight:var(--font-weight-semibold);
//               font-size:var(--font-size-md);
//             ">
//               ${p.value}
//             </div>
//             <div style="
//               color:var(--text-tertiary);
//               font-size:var(--font-size-xs);
//             ">
//               ${city} • ${phone}
//             </div>
//           </div>
//         `;
//       }
//     },

//     // ========================
//     // CONTACT
//     // ========================
//     {
//       headerName: 'Contact',
//       field: 'contactPerson',
//       flex: 1.4,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       cellStyle: compactCell,
//       valueFormatter: (p: any) =>
//         `${p.value || '—'}`
//     },

//     // ========================
//     // EMAIL
//     // ========================
//     {
//       headerName: 'Email',
//       field: 'email',
//       flex: 1.8,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       cellStyle: {
//         ...compactCell,
//         color: 'var(--text-secondary)'
//       }
//     },

//     // ========================
//     // LOCATION
//     // ========================
//     {
//       headerName: 'Location',
//       flex: 1.2,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       valueGetter: (p: any) => {
//         const a = p.data.address || {};
//         return `${a.city || ''}, ${a.state || ''}`;
//       },
//       cellStyle: compactCell
//     },

//     // ========================
//     // OPENING BALANCE
//     // ========================
//     {
//       headerName: 'Opening',
//       field: 'openingBalance',
//       width: 130,
//       sortable: true,
//       filter: 'agNumberColumnFilter',
//       valueFormatter: (p: any) =>
//         typeof p.value === 'number'
//           ? `₹ ${p.value.toFixed(2)}`
//           : '—',
//       cellStyle: compactCell
//     },

//     // ========================
//     // OUTSTANDING
//     // ========================
//     {
//       headerName: 'Outstanding',
//       field: 'outstandingBalance',
//       width: 150,
//       sortable: true,
//       filter: 'agNumberColumnFilter',
//       valueFormatter: (p: any) =>
//         typeof p.value === 'number'
//           ? `₹ ${p.value.toFixed(2)}`
//           : '—',
//       cellStyle: (p: any) => ({
//         ...compactCell,
//         fontWeight: 'var(--font-weight-semibold)',
//         color:
//           p.value > 0
//             ? 'var(--color-error)'
//             : 'var(--color-success)'
//       })
//     },

//     // ========================
//     // PAYMENT TERMS
//     // ========================
//     {
//       headerName: 'Terms',
//       field: 'paymentTerms',
//       width: 100,
//       sortable: true,
//       filter: true,
//       cellRenderer: (p: any) =>
//         `<span style="
//           background:var(--color-info-bg);
//           color:var(--color-info-dark);
//           padding:2px 8px;
//           border-radius:var(--ui-border-radius);
//           font-size:var(--font-size-xs);
//         ">
//           ${p.value || 0} days
//         </span>`
//     },

//     // ========================
//     // STATUS BADGE
//     // ========================
//     {
//       headerName: 'Status',
//       field: 'isActive',
//       width: 110,
//       sortable: true,
//       filter: true,
//       cellRenderer: (p: any) => {
//         const active = p.value;

//         return `
//           <span style="
//             padding:2px 10px;
//             border-radius:var(--ui-border-radius);
//             font-size:var(--font-size-xs);
//             font-weight:var(--font-weight-medium);
//             background:${
//               active
//                 ? 'var(--color-success-bg)'
//                 : 'var(--color-error-bg)'
//             };
//             color:${
//               active
//                 ? 'var(--color-success-dark)'
//                 : 'var(--color-error-dark)'
//             };
//           ">
//             ${active ? 'Active' : 'Inactive'}
//           </span>
//         `;
//       }
//     },

//     // ========================
//     // CREATED DATE
//     // ========================
//     {
//       headerName: 'Created',
//       field: 'createdAt',
//       width: 130,
//       sortable: true,
//       valueFormatter: (p: any) =>
//         p.value
//           ? new Date(p.value).toLocaleDateString()
//           : '—',
//       cellStyle: compactCell
//     }

//   ];

//   this.cdr.detectChanges();
// }

// }
