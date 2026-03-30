import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { GridApi } from 'ag-grid-community';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { EmiService } from '../../services/emi-service';
import { AgShareGrid, ActionColumnConfig } from "../../../shared/components/ag-shared-grid";
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';

@Component({
  selector: 'app-emi-list',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterModule,SelectModule,AutoCompleteModule,ButtonModule,InputTextModule,ToastModule,AgShareGrid, HasPermissionDirective],
  providers: [EmiService],
  templateUrl: './emi-list.html',
  styleUrl: './emi-list.scss',
})
export class EmiList implements OnInit {
  readonly PERMISSIONS = PERMISSIONS;

  readonly emiActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.EMI.READ,
  };

  private cdr = inject(ChangeDetectorRef);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private gridApi!: GridApi;

  // Pagination State
  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;
  private totalCount = 0;
  private hasNextPage = true; // Default true to allow initial load

  data: any[] = [];
  column: any[] = [];
  rowSelectionMode: any = 'single';
  customerOptions = signal<any[]>([]);
  emiFilter = {customerId: null,status: null,  };

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



  onScrolledToBottom(_?: any) {
    // strict check using the flag
    if (!this.isLoading && this.hasNextPage) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
      return;
    }
    if (event.type === 'cellClicked') {
      const emiId = event.row._id;
      if (emiId) {
        this.router.navigate(['/emis', emiId]);
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }


  private getInstallmentStats(row: any) {
    const list = row.installments || [];

    const paid = list.filter((i: any) => i.paymentStatus === 'paid').length;
    const next = list.find((i: any) => i.paymentStatus !== 'paid');

    return { paid, total: list.length, next };
  }

  private formatDate(d: any) {
    return d ? new Date(d).toLocaleDateString() : '—';
  }
getData(isReset: boolean = false) {
    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
      this.hasNextPage = true; // Reset flag
    }

    // Stop if loading OR (not resetting AND no next page)
    if (this.isLoading || (!isReset && !this.hasNextPage)) return;

    this.isLoading = true;

    const filterParams = {
      ...this.emiFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.emiService.getAllEmiData(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        
        // 1. Extract Data (Handling potential variations in API structure)
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        } else if (res.data && Array.isArray(res.data)) {
          newData = res.data;
        }

        // 2. Handle Pagination from Response
        if (res.pagination) {
            this.hasNextPage = res.pagination.hasNextPage;
            this.totalCount = res.pagination.totalResults;
        } else {
            // Fallback safety
            this.hasNextPage = newData.length >= this.pageSize;
            this.totalCount = res.results || 0;
        }

        // 3. Update Data Source
        if (isReset) {
            this.data = newData;
        } else {
            this.data = [...this.data, ...newData];
        }

        // 4. Update Grid if not resetting
        if (this.gridApi && !isReset && newData.length > 0) {
            this.gridApi.applyTransaction({ add: newData });
        }

        // 5. Prepare for next page
        if (this.hasNextPage) {
            this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        
        // Delegated to your global HTTP error handler
        this.messageService.handleHttpError(err);
        
        // Added change detection trigger to ensure the loading overlay disappears
        this.cdr.markForCheck();
      }
    });
  }
  

  getColumn(): void {
    this.column = [

      // ================= ROW INDEX =================
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 30,
        sortable: false,
        filter: false,
        suppressMenu: true,
        pinned: 'left'
      },

      // ================= IDENTITY =================
      {
        headerName: 'Invoice / Customer',
        flex: 2.5,
        width: 130,
        sortable: true,
        filter: true,
        valueGetter: (p: any) => p.data,
        cellRenderer: (p: any) => {
          const inv = p.value.invoiceId?.invoiceNumber || '—';
          const cust = p.value.customerId?.name || '—';
          const city = p.value.customerId?.billingAddress?.city || '';
          return `
        <div style="line-height:1.2">
          <div style="
            font-weight:600;
            color:var(--accent-primary);
          ">
            ${inv}
          </div>
          <div style="font-size:12px;color:var(--text-secondary)">
            ${cust}-${city}
          </div>
        </div>
      `;
        }
      },

      // ================= FINANCIAL SUMMARY =================
      {
        headerName: 'Loan',
        width: 160,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueGetter: (p: any) => ({
          total: p.data.totalAmount,
          down: p.data.downPayment
        }),
        cellRenderer: (p: any) => `
      <div>
        <div>${this.formatCurrency(p.value.total)}</div>
        <div style="font-size:11px;color:var(--text-secondary)">
          Down: ${this.formatCurrency(p.value.down)}
        </div>
      </div>
    `
      },

      // ================= BALANCE =================
      {
        headerName: 'Balance',
        field: 'balanceAmount',
        width: 140,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: (p: any) => ({
          fontWeight: 'bold',
          color: p.value > 0
            ? 'var(--color-error)'
            : 'var(--color-success)'
        })
      },

      // ================= INSTALLMENT PROGRESS =================
      {
        headerName: 'Progress',
        width: 130,
        valueGetter: (p: any) => this.getInstallmentStats(p.data),
        cellRenderer: (p: any) => `
      ${p.value.paid} / ${p.value.total}
    `
      },

      // ================= NEXT DUE =================
      {
        headerName: 'Next Due',
        width: 170,
        valueGetter: (p: any) =>
          this.getInstallmentStats(p.data).next,
        cellRenderer: (p: any) => {
          if (!p.value) return 'Completed';

          return `
        <div>
          ${this.formatDate(p.value.dueDate)}
          <div style="font-size:11px;color:var(--text-secondary)">
            ${this.formatCurrency(p.value.totalAmount)}
          </div>
        </div>
      `;
        }
      },

      // ================= TENURE =================
      {
        headerName: 'Tenure',
        width: 170,
        cellRenderer: (p: any) => `
      ${this.formatDate(p.data.emiStartDate)}
      →
      ${this.formatDate(p.data.emiEndDate)}
    `
      },

      // ================= INSTALLMENT COUNT =================
      {
        headerName: 'Inst.',
        field: 'numberOfInstallments',
        width: 90,
        type: 'rightAligned',
        sortable: true,
        filter: 'agNumberColumnFilter'
      },

      // ================= STATUS BADGE =================
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (p: any) => {
          const map: any = {
            active: ['var(--color-success-bg)', 'var(--color-success-dark)'],
            closed: ['var(--color-info-bg)', 'var(--color-info-dark)'],
            overdue: ['var(--color-error-bg)', 'var(--color-error-dark)']
          };

          const [bg, color] =
            map[p.value] || ['#eee', '#333'];

          return `
        <span style="
          padding:2px 10px;
          border-radius:12px;
          font-size:11px;
          font-weight:600;
          background:${bg};
          color:${color};
        ">
          ${p.value}
        </span>
      `;
        }
      },

      // ================= CREATED DATE =================
      {
        headerName: 'Created',
        field: 'createdAt',
        width: 130,
        sortable: true,
        valueFormatter: (p: any) => this.formatDate(p.value)
      }

    ];

    this.cdr.detectChanges();
  }

  private formatCurrency(value: number): string {
    return value !== undefined && value !== null ? `₹ ${value.toFixed(2)}` : '₹ 0.00';
  }
}

// import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { EmiService } from '../../services/emi-service';
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
// import { ActionViewRenderer } from '../../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';

// @Component({
//   selector: 'app-emi-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     RouterModule,
//     SelectModule,
//     AutoCompleteModule,
//     ButtonModule,
//     InputTextModule,
//     ToastModule,
//     AgShareGrid
//   ],
//   providers: [EmiService],
//   templateUrl: './emi-list.html',
//   styleUrl: './emi-list.scss',
// })
// export class EmiList implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private emiService = inject(EmiService);
//   private messageService = inject(AppMessageService);
//   public masterList = inject(MasterListService);
//   private router = inject(Router);

//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 50;
//   data: any[] = [];
//   column: any[] = [];
//   rowSelectionMode: any = 'single';

//   customerOptions = signal<any[]>([]);

//   emiFilter = {
//     customerId: null,
//     status: null,
//   };

//   statusOptions = [
//     { label: 'Active', value: 'active' },
//     { label: 'Completed', value: 'completed' },
//     { label: 'Defaulted', value: 'defaulted' }
//   ];

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
//     this.emiFilter = { customerId: null, status: null };
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
//       ...this.emiFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     this.emiService.getAllEmiData(filterParams).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) {
//           newData = res.data.data;
//         } else if (res.data && Array.isArray(res.data)) {
//           newData = res.data;
//         }

//         this.totalCount =  res.pagination.totalResults 
//         this.data = [...this.data, ...newData];

//         this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch EMI data.');
//       }
//     });
//   }

//   onScrolledToBottom(_?: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'cellClicked') {
//       const emiId = event.row._id;
//       if (emiId) {
//         this.router.navigate(['/emis', emiId]);
//       }
//     }
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom()
//     }
//   }


//   private getInstallmentStats(row: any) {
//     const list = row.installments || [];

//     const paid = list.filter((i: any) => i.paymentStatus === 'paid').length;
//     const next = list.find((i: any) => i.paymentStatus !== 'paid');

//     return { paid, total: list.length, next };
//   }

//   private formatDate(d: any) {
//     return d ? new Date(d).toLocaleDateString() : '—';
//   }


//   getColumn(): void {
//     this.column = [

//       // ================= ACTIONS =================
//       {
//         headerName: 'Actions',
//         field: '_id',
//         width: 30,
//         pinned: 'left',
//         cellRenderer: ActionViewRenderer
//       },

//       // ================= ROW INDEX =================
//       {
//         headerName: '#',
//         valueGetter: 'node.rowIndex + 1',
//         width: 30,
//         sortable: false,
//         filter: false,
//         suppressMenu: true,
//         pinned: 'left'
//       },

//       // ================= IDENTITY =================
//       {
//         headerName: 'Invoice / Customer',
//         flex: 2.5,
//         width: 130,
//         sortable: true,
//         filter: true,
//         valueGetter: (p: any) => p.data,
//         cellRenderer: (p: any) => {
//           const inv = p.value.invoiceId?.invoiceNumber || '—';
//           const cust = p.value.customerId?.name || '—';
//           const city = p.value.customerId?.billingAddress?.city || '';
//           return `
//         <div style="line-height:1.2">
//           <div style="
//             font-weight:600;
//             color:var(--accent-primary);
//           ">
//             ${inv}
//           </div>
//           <div style="font-size:12px;color:var(--text-secondary)">
//             ${cust}-${city}
//           </div>
//         </div>
//       `;
//         }
//       },

//       // ================= FINANCIAL SUMMARY =================
//       {
//         headerName: 'Loan',
//         width: 160,
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         valueGetter: (p: any) => ({
//           total: p.data.totalAmount,
//           down: p.data.downPayment
//         }),
//         cellRenderer: (p: any) => `
//       <div>
//         <div>${this.formatCurrency(p.value.total)}</div>
//         <div style="font-size:11px;color:var(--text-secondary)">
//           Down: ${this.formatCurrency(p.value.down)}
//         </div>
//       </div>
//     `
//       },

//       // ================= BALANCE =================
//       {
//         headerName: 'Balance',
//         field: 'balanceAmount',
//         width: 140,
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         valueFormatter: (p: any) => this.formatCurrency(p.value),
//         cellStyle: (p: any) => ({
//           fontWeight: 'bold',
//           color: p.value > 0
//             ? 'var(--color-error)'
//             : 'var(--color-success)'
//         })
//       },

//       // ================= INSTALLMENT PROGRESS =================
//       {
//         headerName: 'Progress',
//         width: 130,
//         valueGetter: (p: any) => this.getInstallmentStats(p.data),
//         cellRenderer: (p: any) => `
//       ${p.value.paid} / ${p.value.total}
//     `
//       },

//       // ================= NEXT DUE =================
//       {
//         headerName: 'Next Due',
//         width: 170,
//         valueGetter: (p: any) =>
//           this.getInstallmentStats(p.data).next,
//         cellRenderer: (p: any) => {
//           if (!p.value) return 'Completed';

//           return `
//         <div>
//           ${this.formatDate(p.value.dueDate)}
//           <div style="font-size:11px;color:var(--text-secondary)">
//             ${this.formatCurrency(p.value.totalAmount)}
//           </div>
//         </div>
//       `;
//         }
//       },

//       // ================= TENURE =================
//       {
//         headerName: 'Tenure',
//         width: 170,
//         cellRenderer: (p: any) => `
//       ${this.formatDate(p.data.emiStartDate)}
//       →
//       ${this.formatDate(p.data.emiEndDate)}
//     `
//       },

//       // ================= INSTALLMENT COUNT =================
//       {
//         headerName: 'Inst.',
//         field: 'numberOfInstallments',
//         width: 90,
//         type: 'rightAligned',
//         sortable: true,
//         filter: 'agNumberColumnFilter'
//       },

//       // ================= STATUS BADGE =================
//       {
//         headerName: 'Status',
//         field: 'status',
//         width: 120,
//         sortable: true,
//         filter: true,
//         cellRenderer: (p: any) => {
//           const map: any = {
//             active: ['var(--color-success-bg)', 'var(--color-success-dark)'],
//             closed: ['var(--color-info-bg)', 'var(--color-info-dark)'],
//             overdue: ['var(--color-error-bg)', 'var(--color-error-dark)']
//           };

//           const [bg, color] =
//             map[p.value] || ['#eee', '#333'];

//           return `
//         <span style="
//           padding:2px 10px;
//           border-radius:12px;
//           font-size:11px;
//           font-weight:600;
//           background:${bg};
//           color:${color};
//         ">
//           ${p.value}
//         </span>
//       `;
//         }
//       },

//       // ================= CREATED DATE =================
//       {
//         headerName: 'Created',
//         field: 'createdAt',
//         width: 130,
//         sortable: true,
//         valueFormatter: (p: any) => this.formatDate(p.value)
//       }

//     ];

//     this.cdr.detectChanges();

//     this.cdr.detectChanges();
//   }

//   private formatCurrency(value: number): string {
//     return value !== undefined && value !== null ? `₹ ${value.toFixed(2)}` : '₹ 0.00';
//   }
// }