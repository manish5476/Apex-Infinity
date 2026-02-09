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
  private pageSize = 50;
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
    // 1. Actions (Pinned Left for quick access)
    {
      headerName: '',
      field: '_id',
      width: 50,
      pinned: 'left',
      cellRenderer: ActionViewRenderer,
      suppressMenu: true,
      sortable: false,
      lockPosition: true
    },

    // 2. Identity Group
    {
      headerName: 'Customer Identity',
      children: [
        {
          field: 'name',
          headerName: 'Name & Type',
          pinned: 'left',
          minWidth: 240,
          flex: 2,
          cellRenderer: (params: any) => {
            if (!params.value) return '';
            const data = params.data;
            const initials = data.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
            // Show Contact Person if different from Entity Name, otherwise show Type
            const subText = data.contactPerson && data.contactPerson !== data.name 
              ? `<i class="pi pi-user" style="font-size:10px; margin-right:4px"></i>${data.contactPerson}` 
              : `<span style="text-transform:capitalize">${data.type}</span>`;
            
            return `
              <div style="display:flex; align-items:center; gap:12px; height:100%;">
                <div style="
                  width:36px; height:36px; border-radius:50%; 
                  background:var(--bg-ternary); color:var(--text-secondary);
                  display:flex; align-items:center; justify-content:center; 
                  font-weight:700; font-size:11px; border:1px solid var(--border-secondary);">
                  ${initials}
                </div>
                <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.3;">
                  <span style="font-weight:600; color:var(--text-primary); font-size:13px;">${data.name}</span>
                  <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center;">${subText}</span>
                </div>
              </div>
            `;
          }
        },
        {
          field: 'isActive',
          headerName: 'Status',
          width: 110,
          cellRenderer: (params: any) => {
            const isDeleted = params.data.isDeleted;
            if (isDeleted) {
                return `<span style="background:var(--color-error-bg); color:var(--color-error); padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">DELETED</span>`;
            }
            const status = params.value ? 'ACTIVE' : 'INACTIVE';
            const bg = params.value ? 'var(--color-success-bg)' : 'var(--bg-ternary)';
            const color = params.value ? 'var(--color-success)' : 'var(--text-tertiary)';
            return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.5px;">${status}</span>`;
          }
        },
        {
          field: 'tags',
          headerName: 'Tags',
          width: 140,
          cellRenderer: (params: any) => {
            if (!params.value || !params.value.length || params.value[0] === "") return '<span style="color:var(--text-disabled);">-</span>';
            // Render max 2 tags
            return params.value.slice(0, 2).map((tag: string) => 
              `<span style="
                background:var(--bg-secondary); border:1px solid var(--border-secondary); 
                padding:1px 6px; border-radius:10px; font-size:10px; 
                color:var(--text-secondary); margin-right:4px; white-space:nowrap;">
                ${tag}
              </span>`
            ).join('') + (params.value.length > 2 ? '...' : '');
          }
        }
      ]
    },

    // 3. Contact Group (Combined for space efficiency)
    {
      headerName: 'Contact Details',
      children: [
        {
          headerName: 'Email & Phone',
          width: 230,
          cellRenderer: (params: any) => {
            const email = params.data.email || '';
            const phone = params.data.phone || '';
            if(!email && !phone) return '<span style="color:var(--text-disabled);">-</span>';
            
            return `
              <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:2px;">
                ${email ? `<div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden;"><i class="pi pi-envelope" style="color:var(--text-tertiary); font-size:10px;"></i> ${email}</div>` : ''}
                ${phone ? `<div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary);"><i class="pi pi-phone" style="color:var(--text-tertiary); font-size:10px;"></i> ${phone} ${params.data.altPhone ? '<span style="font-size:9px; color:var(--text-tertiary)">(+1)</span>' : ''}</div>` : ''}
              </div>
            `;
          }
        }
      ]
    },

    // 4. Financial Group
    {
      headerName: 'Financial Overview',
      children: [
        {
          field: 'outstandingBalance',
          headerName: 'Outstanding',
          width: 140,
          type: 'numericColumn',
          cellRenderer: (params: any) => {
            const val = params.value || 0;
            // Orange if positive debt, Green if 0 or negative (credit)
            const color = val > 0 ? 'var(--color-warning)' : 'var(--color-success)';
            const weight = val > 0 ? '700' : '500';
            const formatted = this.currencyFormatter(val); 
            return `<span style="color:${color}; font-weight:${weight};">${formatted}</span>`;
          }
        },
        {
          field: 'creditLimit',
          headerName: 'Limit',
          width: 110,
          type: 'numericColumn',
          valueFormatter: (params: any) => this.currencyFormatter(params.value),
          cellStyle: { color: 'var(--text-tertiary)' }
        },
        {
          field: 'paymentTerms',
          headerName: 'Terms',
          width: 120,
          valueFormatter: (p: any) => p.value || 'Standard'
        }
      ]
    },

    // 5. Compliance & Address
    {
      headerName: 'Compliance & Location',
      children: [
        {
          field: 'gstNumber',
          headerName: 'GST / Tax ID',
          width: 150,
          cellRenderer: (params: any) => {
             const gst = params.value;
             const pan = params.data.panNumber;
             if (!gst && !pan) return '<span style="color:var(--text-disabled);">-</span>';
             
             return `
               <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.2;">
                 <span style="font-size:12px; font-weight:500;">${gst || '-'}</span>
                 <span style="font-size:10px; color:var(--text-tertiary);">PAN: ${pan || 'N/A'}</span>
               </div>
             `;
          }
        },
        {
          headerName: 'Billing City',
          field: 'billingAddress.city',
          width: 140,
          valueGetter: (params: any) => {
            const addr = params.data.billingAddress;
            return addr ? `${addr.city}, ${addr.state}` : '';
          },
          tooltipValueGetter: (params: any) => {
             const addr = params.data.billingAddress;
             if(!addr) return '';
             return `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zipCode}, ${addr.country}`;
          }
        }
      ]
    },

    // 6. System Info
    {
      headerName: 'System',
      children: [
        {
          field: 'notes',
          headerName: 'Notes',
          width: 150,
          tooltipField: 'notes',
          cellRenderer: (params: any) => {
             if(!params.value) return '';
             return `<i class="pi pi-file-o" style="margin-right:6px; color:var(--text-tertiary)"></i>${params.value}`;
          }
        },
        {
          field: 'createdAt',
          headerName: 'Since',
          width: 110,
          valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
          cellStyle: { color: 'var(--text-tertiary)', fontSize: '11px' }
        }
      ]
    }
  ];
  this.cdr.detectChanges();
}

  // getColumn(): void {
  //   this.column = [
  //     {
  //       headerName: 'Actions',
  //       field: '_id',
  //       width: 150,
  //       cellRenderer: ActionViewRenderer,
  //     },
  //     {
  //       headerName: 'Basic Info',
  //       children: [
  //         {
  //           field: 'name',
  //           headerName: 'Name',
  //           pinned: 'left',
  //           minWidth: 180,
  //           flex: 1,
  //           cellStyle: {
  //             'color': 'var(--theme-accent-primary)',
  //             'font-weight': '600',
  //             'cursor': 'pointer'
  //           }
  //         },
  //         {
  //           field: 'isActive',
  //           headerName: 'Status',
  //           width: 120,
  //           cellRenderer: (params: any) => {
  //             const status = params.value ? 'Active' : 'Inactive';
  //             const color = params.value ? '#28a745' : '#dc3545';
  //             const bgColor = params.value ? '#e6f4ea' : '#fce8e8';
  //             return `<span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; background-color: ${bgColor}; color: ${color};">${status}</span>`;
  //           }
  //         },
  //       ]
  //     },
  //     {
  //       headerName: 'Contact Details',
  //       children: [
  //         { field: 'email', headerName: 'Email', minWidth: 200, tooltipField: 'email' },
  //         { field: 'phone', headerName: 'Phone', width: 130 },
  //         { field: 'billingAddress.city', headerName: 'City', width: 120, valueGetter: (p: any) => p.data.billingAddress?.city },
  //       ]
  //     },
  //     {
  //       headerName: 'Financials',
  //       children: [
  //         {
  //           field: 'outstandingBalance',
  //           headerName: 'Outstanding',
  //           width: 150,
  //           type: 'numericColumn',
  //           valueFormatter: (params: any) => this.currencyFormatter(params.value),
  //           cellStyle: (params: any) => {
  //             if (params.value > 0) return { color: '#e67e22', fontWeight: 'bold' };
  //             return { color: '#2ecc71' };
  //           }
  //         },
  //         {
  //           field: 'creditLimit',
  //           headerName: 'Credit Limit',
  //           width: 140,
  //           type: 'numericColumn',
  //           valueFormatter: (params: any) => this.currencyFormatter(params.value),
  //         }
  //       ]
  //     },
  //     {
  //       headerName: 'System Info',
  //       children: [
  //         {
  //           field: 'type',
  //           headerName: 'Type',
  //           width: 110,
  //           valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : ''
  //         },
  //         {
  //           field: 'createdAt',
  //           headerName: 'Created On',
  //           width: 160,
  //           valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
  //           filter: 'agDateColumnFilter'
  //         }
  //       ]
  //     }
  //   ];
  //   this.cdr.detectChanges();
  // }


  currencyFormatter(value: number) {
    if (value === undefined || value === null) return '₹ 0.00';
    return '₹ ' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
