import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';


import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { Toast } from "primeng/toast";
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { CommonMethodService } from '@core/utils/common-method.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    AutoCompleteModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    RouterModule,
    InputTextModule,
    Toast,
    AgShareGrid,
    HasPermissionDirective
  ],
  providers: [CustomerService, ConfirmationService],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  private customerService = inject(CustomerService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private dialogServices = inject(DynamicDialogServices);
  private confirmationService = inject(ConfirmationService);
  private common = inject(CommonMethodService);

  PERMISSIONS = PERMISSIONS;

  readonly customerActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.CUSTOMER.READ,
    editPermission: PERMISSIONS.CUSTOMER.UPDATE,
    deletePermission: PERMISSIONS.CUSTOMER.DELETE,
  };

  private gridApi!: GridApi;

  // Selected rows
  selectedRows: any[] = [];

  // Pagination State
  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;
  private totalCount = 0;
  private hasNextPage = true; // Default true to allow initial load

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
    this.getColumn(); // Initialize columns first
    this.getData(true);
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
      ...this.customerFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.customerService.getAllCustomerData(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];

        // 1. Extract Data safely
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
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

        // 4. Update Grid if not resetting (Reset is handled by [rowData] binding usually)
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
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
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
      const customerId = event.row._id;
      if (customerId) {
        this.router.navigate(['/customer', customerId]);
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
    if (event.type === 'selectionChanged') {
      this.selectedRows = event.rows || [];
    }
    if (event.type === 'save') {
      const limitVal = Number(event.row.creditLimit) || 0;
      this.customerService.updateCreditLimit(event.row._id, { creditLimit: limitVal }).subscribe({
        next: () => this.messageService.showSuccess('Credit limit updated successfully'),
        error: (err: any) => this.messageService.handleHttpError(err)
      });
    }
    if (event.type === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  confirmDelete(customer: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the customer "${customer.name}"? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.customerService.deleteCustomer(customer._id).subscribe({
          next: () => {
            this.messageService.showSuccess('Customer deleted successfully');
            this.getData(true);
          },
          error: (err: any) => {
            this.messageService.handleHttpError(err);
          }
        });
      }
    });
  }

  openPhotoUpload() {
    if (this.selectedRows.length !== 1) return;
    const custId = this.selectedRows[0]._id;

    this.dialogServices.openImageUpload({
      header: 'Update Customer Photo',
      description: `Upload a new avatar for ${this.selectedRows[0].name}.`,
      uploadFn: (file: File) => this.customerService.uploadCustomerPhoto(custId, file)
    })?.onClose.subscribe((res: any) => {
      if (res?.data?.customer?.photo) {
        this.messageService.showSuccess('Photo updated successfully.');
        this.getData(true); // Refresh grid to show new avatar
      }
    });
  }

  openBulkImport() {
    this.dialogServices.openBulkCustomer();
  }

  // getColumn(): void {
  //   this.column = [
  //     {
  //       headerName: 'Customer Identity',
  //       children: [
  //         {
  //           field: 'name',
  //           headerName: 'Name & Type',
  //           pinned: 'left',
  //           minWidth: 240,
  //           flex: 2,
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '';
  //             const data = params.data;
  //             const initials = data.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  //             const subText = data.contactPerson && data.contactPerson !== data.name
  //               ? `<i class="pi pi-user" style="font-size:10px; margin-right:4px"></i>${data.contactPerson}`
  //               : `<span style="text-transform:capitalize">${data.type}</span>`;

  //             return `
  //             <div style="display:flex; align-items:center; gap:12px; height:100%;">
  //               <div style="
  //                 width:36px; height:36px; border-radius:50%; 
  //                 background:var(--bg-ternary); color:var(--text-secondary);
  //                 display:flex; align-items:center; justify-content:center; 
  //                 font-weight:700; font-size:11px; border:1px solid var(--border-secondary);">
  //                 ${initials}
  //               </div>
  //               <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.3;">
  //                 <span style="font-weight:600; color:var(--text-primary); font-size:13px;">${data.name}</span>
  //                 <span style="font-size:11px; color:var(--text-tertiary); display:flex; align-items:center;">${subText}</span>
  //               </div>
  //             </div>
  //           `;
  //           }
  //         },
  //         {
  //           field: 'isActive',
  //           headerName: 'Status',
  //           width: 110,
  //           cellRenderer: (params: any) => {
  //             const isDeleted = params.data.isDeleted;
  //             if (isDeleted) {
  //               return `<span style="background:var(--color-error-bg); color:var(--color-error); padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">DELETED</span>`;
  //             }
  //             const status = params.value ? 'ACTIVE' : 'INACTIVE';
  //             const bg = params.value ? 'var(--color-success-bg)' : 'var(--bg-ternary)';
  //             const color = params.value ? 'var(--color-success)' : 'var(--text-tertiary)';
  //             return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.5px;">${status}</span>`;
  //           }
  //         },
  //         {
  //           field: 'tags',
  //           headerName: 'Tags',
  //           width: 140,
  //           cellRenderer: (params: any) => {
  //             if (!params.value || !params.value.length || params.value[0] === "") return '<span style="color:var(--text-disabled);">-</span>';
  //             // Render max 2 tags
  //             return params.value.slice(0, 2).map((tag: string) =>
  //               `<span style="
  //               background:var(--bg-secondary); border:1px solid var(--border-secondary); 
  //               padding:1px 6px; border-radius:10px; font-size:10px; 
  //               color:var(--text-secondary); margin-right:4px; white-space:nowrap;">
  //               ${tag}
  //             </span>`
  //             ).join('') + (params.value.length > 2 ? '...' : '');
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       headerName: 'Contact Details',
  //       children: [
  //         {
  //           headerName: 'Email & Phone',
  //           width: 230,
  //           cellRenderer: (params: any) => {
  //             const email = params.data.email || '';
  //             const phone = params.data.phone || '';
  //             if (!email && !phone) return '<span style="color:var(--text-disabled);">-</span>';

  //             return `
  //             <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:2px;">
  //               ${email ? `<div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden;"><i class="pi pi-envelope" style="color:var(--text-tertiary); font-size:10px;"></i> ${email}</div>` : ''}
  //               ${phone ? `<div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary);"><i class="pi pi-phone" style="color:var(--text-tertiary); font-size:10px;"></i> ${phone} ${params.data.altPhone ? '<span style="font-size:9px; color:var(--text-tertiary)">(+1)</span>' : ''}</div>` : ''}
  //             </div>
  //           `;
  //           }
  //         }
  //       ]
  //     },

  //     // 4. Financial Group
  //     {
  //       headerName: 'Financial Overview',
  //       children: [
  //         {
  //           field: 'outstandingBalance',
  //           headerName: 'Outstanding',
  //           width: 140,
  //           type: 'numericColumn',
  //           cellRenderer: (params: any) => {
  //             const val = params.value || 0;
  //             // Orange if positive debt, Green if 0 or negative (credit)
  //             const color = val > 0 ? 'var(--color-warning)' : 'var(--color-success)';
  //             const weight = val > 0 ? '700' : '500';
  //             const formatted = this.currencyFormatter(val);
  //             return `<span style="color:${color}; font-weight:${weight};">${formatted}</span>`;
  //           }
  //         },
  //         {
  //           field: 'creditLimit',
  //           headerName: 'Limit',
  //           width: 110,
  //           type: 'numericColumn',
  //           valueFormatter: (params: any) => this.currencyFormatter(params.value),
  //           cellStyle: { color: 'var(--text-tertiary)' }
  //         },
  //         {
  //           field: 'paymentTerms',
  //           headerName: 'Terms',
  //           width: 120,
  //           valueFormatter: (p: any) => p.value || 'Standard'
  //         }
  //       ]
  //     },

  //     // 5. Compliance & Address
  //     {
  //       headerName: 'Compliance & Location',
  //       children: [
  //         {
  //           field: 'gstNumber',
  //           headerName: 'GST / Tax ID',
  //           width: 150,
  //           cellRenderer: (params: any) => {
  //             const gst = params.value;
  //             const pan = params.data.panNumber;
  //             if (!gst && !pan) return '<span style="color:var(--text-disabled);">-</span>';

  //             return `
  //              <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.2;">
  //                <span style="font-size:12px; font-weight:500;">${gst || '-'}</span>
  //                <span style="font-size:10px; color:var(--text-tertiary);">PAN: ${pan || 'N/A'}</span>
  //              </div>
  //            `;
  //           }
  //         },
  //         {
  //           headerName: 'Billing City',
  //           field: 'billingAddress.city',
  //           width: 140,
  //           valueGetter: (params: any) => {
  //             const addr = params.data.billingAddress;
  //             return addr ? `${addr.city}, ${addr.state}` : '';
  //           },
  //           tooltipValueGetter: (params: any) => {
  //             const addr = params.data.billingAddress;
  //             if (!addr) return '';
  //             return `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zipCode}, ${addr.country}`;
  //           }
  //         }
  //       ]
  //     },

  //     // 6. System Info
  //     {
  //       headerName: 'System',
  //       children: [
  //         {
  //           field: 'notes',
  //           headerName: 'Notes',
  //           width: 150,
  //           tooltipField: 'notes',
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '';
  //             return `<i class="pi pi-file-o" style="margin-right:6px; color:var(--text-tertiary)"></i>${params.value}`;
  //           }
  //         },
  //         {
  //           field: 'createdAt',
  //           headerName: 'Since',
  //           width: 110,
  //           valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
  //           cellStyle: { color: 'var(--text-tertiary)', fontSize: '11px' }
  //         }
  //       ]
  //     }
  //   ];
  //   this.cdr.detectChanges();
  // }
  private badge(
    label: string,
    bg: string, color: string, border: string
  ): string {
    return `<span style="
    background:${bg};
    color:${color};
    border:1px solid ${border};
    padding:1px 6px;
    border-radius:3px;
    font-size:10px;
    font-weight:700;
    letter-spacing:0.3px;
    text-transform:uppercase;
    white-space:nowrap;
    line-height:1.4;
    display:inline-block;">
    ${label}
  </span>`;
  }

  private twoLine(
    top: string,
    bottom: string,
    topStyle = 'font-size:11px; color:var(--text-secondary);',
    bottomStyle = 'font-size:10px; color:var(--text-tertiary);'
  ): string {
    return `
    <div style="
      display:flex; flex-direction:column;
      justify-content:center; gap:0px;
      line-height:1.25; overflow:hidden;">
      <span style="${topStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${top}</span>
      <span style="${bottomStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bottom}</span>
    </div>`;
  }
  getColumn(): void {
    this.column = [
      {
        headerName: 'Customer Identity',
        children: [

          {
            field: 'name',
            headerName: 'Name & Type',
            pinned: 'left',
            minWidth: 210,
            flex: 2,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
            cellRenderer: (params: any) => {
              if (!params.value) return '';
              const d = params.data;
              const initials = this.common.getInitials(d.name);
              const avatar = this.common.getAvatarStyle(d.name);
              const isIndiv = d.type === 'individual';
              const icon = isIndiv ? 'pi-user' : 'pi-building';
              const sub = d.contactPerson && d.contactPerson !== d.name
                ? d.contactPerson
                : this.common.toTitleCase(d.type || '');

              return `
              <div style="display:flex; align-items:center; gap:8px; width:100%; overflow:hidden;">
                <span style="
                  width:26px; height:26px; border-radius:50%; flex-shrink:0;
                  background:${avatar.background}; color:${avatar.color};
                  display:inline-flex; align-items:center; justify-content:center;
                  font-size:9px; font-weight:700;">
                  ${initials}
                </span>
                ${this.twoLine(
                d.name,
                `<i class="pi ${icon}" style="font-size:8px; margin-right:3px;"></i>${sub}`,
                'font-size:12px; font-weight:600; color:var(--text-primary);',
                'font-size:10px; color:var(--text-tertiary);'
              )}
              </div>`;
            }
          },

          {
            field: 'isActive',
            headerName: 'Status',
            width: 90,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (params: any) => {
              if (params.data.isDeleted) {
                return this.badge('Deleted',
                  'var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)');
              }
              return params.value
                ? this.badge('Active',
                  'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)')
                : this.badge('Inactive',
                  'var(--bg-secondary)', 'var(--text-tertiary)', 'var(--border-primary)');
            }
          },
          {
            field: 'tags',
            headerName: 'Tags',
            width: 135,
            cellRenderer: (params: any) => {
              const tags: string[] = (params.value || []).filter((t: string) => t?.trim());

              if (!tags.length) {
                return `<span class="tag-empty">—</span>`;
              }

              const chips = tags.slice(0, 2).map(tag =>
                `<span class="tag-chip">${this.common.toTitleCase(tag)}</span>`
              ).join('');

              const more = tags.length > 2
                ? `<span class="tag-more">+${tags.length - 2}</span>`
                : '';

              return `<div class="tag-container">${chips}${more}</div>`;
            }
          }
          // {
          //   field: 'tags',
          //   headerName: 'Tags',
          //   width: 135,
          //   cellStyle: { display: 'flex', alignItems: 'center', gap: '3px' },
          //   cellRenderer: (params: any) => {
          //     const tags: string[] = (params.value || []).filter((t: string) => t?.trim());
          //     if (!tags.length) return `<span style="color:var(--text-tertiary); font-size:10px;">—</span>`;
          //     const chips = tags.slice(0, 2).map(tag => `
          //     <span style="
          //       background:var(--bg-secondary);
          //       border:1px solid var(--border-primary);
          //       padding:1px 5px; border-radius:3px;
          //       font-size:10px; color:var(--text-secondary);
          //       white-space:nowrap;">
          //       ${this.common.toTitleCase(tag)}
          //     </span>`).join('');
          //     const more = tags.length > 2
          //       ? `<span style="font-size:10px; color:var(--text-tertiary);">+${tags.length - 2}</span>`
          //       : '';
          //     return `<div style="display:flex; align-items:center; gap:3px;">${chips}${more}</div>`;
          //   }
          // }
        ]
      },

      {
        headerName: 'Contact Details',
        children: [

          {
            headerName: 'Email',
            field: 'email',
            width: 195,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (params: any) => {
              if (!params.value) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `
              <div style="display:flex; align-items:center; gap:5px; overflow:hidden; width:100%;">
                <i class="pi pi-envelope" style="font-size:9px; color:var(--text-tertiary); flex-shrink:0;"></i>
                <span style="font-size:11px; color:var(--text-secondary);
                  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${params.value}
                </span>
              </div>`;
            }
          },

          {
            headerName: 'Phone',
            field: 'phone',
            width: 145,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (params: any) => {
              const phone = params.value;
              const alt = params.data?.altPhone;
              if (!phone) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;

              const top = `<i class="pi pi-phone" style="font-size:8px; margin-right:3px;"></i>${this.common.formatPhone(phone)}`;
              const bot = alt ? `Alt: ${this.common.formatPhone(alt)}` : '';
              return bot
                ? this.twoLine(top, bot)
                : `<div style="display:flex; align-items:center; gap:4px;">
                   <i class="pi pi-phone" style="font-size:9px; color:var(--text-tertiary);"></i>
                   <span style="font-size:11px; color:var(--text-secondary);">
                     ${this.common.formatPhone(phone)}
                   </span>
                 </div>`;
            }
          },

          {
            headerName: 'Location',
            field: 'billingAddress.city',
            width: 145,
            cellStyle: { display: 'flex', alignItems: 'center' },
            valueGetter: (p: any) => {
              const a = p.data?.billingAddress;
              return a?.city ? `${a.city}, ${a.state}` : '';
            },
            tooltipValueGetter: (p: any) => {
              const a = p.data?.billingAddress;
              return a ? this.common.formatAddress(a) : '';
            },
            cellRenderer: (params: any) => {
              if (!params.value) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `
              <div style="display:flex; align-items:center; gap:4px; overflow:hidden;">
                <i class="pi pi-map-marker" style="font-size:9px; color:var(--text-tertiary); flex-shrink:0;"></i>
                <span style="font-size:11px; color:var(--text-secondary);
                  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${params.value}
                </span>
              </div>`;
            }
          }
        ]
      },

      {
        headerName: 'Financial Overview',
        children: [

          {
            field: 'outstandingBalance',
            headerName: 'Outstanding',
            width: 125,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              if (val <= 0) {
                return this.badge('✓ Clear',
                  'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
              }
              return `<span style="
              color:var(--color-warning); font-weight:700;
              font-family:var(--font-mono); font-size:11px;">
              ${this.common.formatCurrency(val)}
            </span>`;
            }
          },

          {
            field: 'creditLimit',
            headerName: 'Credit Limit',
            width: 115,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              if (!val) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `<span style="color:var(--text-secondary); font-family:var(--font-mono); font-size:11px;">
              ${this.common.formatCurrency(val)}
            </span>`;
            }
          },

          {
            field: 'invoiceCount',
            headerName: 'Invoices',
            width: 85,
            type: 'rightAligned',
            cellStyle: {
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              fontWeight: '600', fontSize: '12px',
            },
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              return `<span style="
              font-weight:600; font-size:12px;
              color:${val > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)'};">
              ${val}
            </span>`;
            }
          },

          {
            field: 'totalPurchases',
            headerName: 'Purchases',
            width: 125,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              if (!val) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `<span style="font-weight:700; color:var(--text-primary);
              font-family:var(--font-mono); font-size:11px;">
              ${this.common.formatCurrency(val)}
            </span>`;
            }
          },

          {
            field: 'paymentTerms',
            headerName: 'Terms',
            width: 90,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (params: any) => {
              const val = params.value && params.value !== '0' ? params.value : 'Standard';
              return `<span style="
              font-size:10px; color:var(--text-secondary);
              background:var(--bg-secondary);
              border:1px solid var(--border-primary);
              padding:1px 6px; border-radius:3px;">
              ${val}
            </span>`;
            }
          }
        ]
      },

      {
        headerName: 'Compliance',
        children: [
          {
            field: 'gstNumber',
            headerName: 'GST / PAN',
            width: 155,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            cellRenderer: (params: any) => {
              const gst = params.value;
              const pan = params.data?.panNumber;
              if (!gst && !pan) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;

              const top = gst
                ? `<span style="font-size:11px; font-weight:600; font-family:var(--font-mono); color:var(--text-primary);">${this.common.formatGSTIN(gst)}</span>`
                : '';
              const bot = pan
                ? `<i class="pi pi-id-card" style="font-size:8px; margin-right:2px;"></i>${this.common.formatPAN(pan)}`
                : '';

              if (top && bot) return this.twoLine(
                gst,
                bot,
                'font-size:11px; font-weight:600; font-family:var(--font-mono); color:var(--text-primary);',
                'font-size:10px; color:var(--text-tertiary);'
              );
              return top || `<span style="font-size:11px; color:var(--text-secondary);">${bot}</span>`;
            }
          }
        ]
      },

      {
        headerName: 'System',
        children: [
          {
            field: 'notes',
            headerName: 'Notes',
            width: 135,
            tooltipField: 'notes',
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (params: any) => {
              if (!params.value) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `
              <div style="display:flex; align-items:center; gap:5px; overflow:hidden;">
                <i class="pi pi-file-o" style="font-size:9px; color:var(--text-tertiary); flex-shrink:0;"></i>
                <span style="font-size:11px; color:var(--text-secondary);
                  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${this.common.truncateText(params.value, 25)}
                </span>
              </div>`;
            }
          },

          {
            field: 'createdAt',
            headerName: 'Since',
            width: 110,
            sortable: true,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              return this.twoLine(
                this.common.formatDate(params.value),
                this.common.timeAgoText(params.value)
              );
            }
          }
        ]
      }
    ];

    this.cdr.detectChanges();
  }
}
