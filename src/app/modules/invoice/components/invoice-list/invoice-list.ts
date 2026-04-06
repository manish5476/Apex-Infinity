
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, ITooltipParams } from 'ag-grid-community';
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
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { AgShareGrid, ActionColumnConfig } from "../../../shared/components/ag-shared-grid";

import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

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
    AgShareGrid,
    HasPermissionDirective
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
  encapsulation: ViewEncapsulation.None
})
export class InvoiceListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService);
  private dialogServices = inject(DynamicDialogServices);


  PERMISSIONS = PERMISSIONS;

  readonly invoiceActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    showReturn: true,
    viewPermission: PERMISSIONS.INVOICE.READ,
    returnPermission: PERMISSIONS.SALES_RETURN.MANAGE
  };

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

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
      return;
    }
    if (event.type === 'cellClicked') {
      const invoiceId = event.row._id;
      this.router.navigate([invoiceId], { relativeTo: this.route });
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
    if (event.type === 'return') {
      this.dialogServices.openSalesReturn({ invoice: event.row })?.onClose.subscribe(res => {
        if (res) this.getData(true);
      });
    }
  }


  getColumn(): void {
    this.column = [
      // ═══════════════════════════════════════════════════════
      // GROUP 1 — IDENTITY
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Identity',
        children: [
          {
            field: 'invoiceNumber',
            headerName: 'Invoice #',
            pinned: 'left',
            width: 175,
            filter: 'agTextColumnFilter',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const isOverdue = params.data?.dueDate &&
                this.common.isPast(params.data.dueDate) &&
                params.data?.paymentStatus !== 'paid';

              const overdueIcon = isOverdue ? `<i class="pi pi-exclamation-circle icon-overdue" title="Overdue"></i>` : '';

              return `
                <div class="cell-flex-center gap-xs">
                  <i class="pi pi-file-text icon-accent-muted"></i>
                  <span class="text-accent font-mono font-bold cursor-pointer hover-underline">${params.value}</span>
                  ${overdueIcon}
                </div>`;
            }
          },
          {
            field: 'branchId.name',
            headerName: 'Branch',
            width: 120,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              return `
                <div class="cell-flex-center gap-xs">
                  <i class="pi pi-building text-tertiary icon-xs"></i>
                  <span class="text-secondary ellipsis">${params.value}</span>
                </div>`;
            }
          },
          {
            field: 'createdBy.name',
            headerName: 'Created By',
            width: 130,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const name = params.value || params.data?.createdBy?.name;
              if (!name) return '-';
              const initials = this.common.getInitials(name);
              const avatarStyle = this.common.getAvatarStyle(name);

              return `
                <div class="cell-flex-center gap-sm">
                  <span class="avatar-xs" style="background: ${avatarStyle.background}; color: ${avatarStyle.color};">
                    ${initials}
                  </span>
                  <span class="text-secondary ellipsis">${name}</span>
                </div>`;
            }
          }
        ]
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 2 — CUSTOMER
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Customer',
        children: [
          {
            headerName: 'Name',
            field: 'customerId.name',
            width: 185,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              const customer = params.data?.customerId;
              if (!customer) return '-';

              const name = customer.name || '-';
              const contact = customer.phone ? this.common.formatPhone(customer.phone) : customer.email || '';
              const contactIcon = customer.phone ? 'pi-phone' : 'pi-envelope';
              const initials = this.common.getInitials(name);
              const avatarStyle = this.common.getAvatarStyle(name);

              return `
                <div class="cell-customer">
                  <span class="avatar-sm" style="background: ${avatarStyle.background}; color: ${avatarStyle.color};">
                    ${initials}
                  </span>
                  <div class="customer-info">
                    <span class="customer-name">${name}</span>
                    ${contact ? `
                      <span class="customer-contact">
                        <i class="pi ${contactIcon} icon-xxs"></i> ${contact}
                      </span>` : ''}
                  </div>
                </div>`;
            }
          },
          {
            field: 'placeOfSupply',
            headerName: 'Supply State',
            width: 120,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return `<span class="text-tertiary">—</span>`;
              return `
                <div class="cell-flex-center gap-xs">
                  <i class="pi pi-map-marker text-tertiary icon-xs"></i>
                  <span class="text-secondary text-xs">${params.value}</span>
                </div>`;
            }
          },
          {
            field: 'gstType',
            headerName: 'GST Type',
            width: 115,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const label = this.common.toTitleCase(params.value.replace(/-/g, ' '));
              const isIntra = params.value?.toLowerCase().includes('intra');
              const badgeClass = isIntra ? 'badge-info-soft' : 'badge-warning-soft';

              return `<span class="grid-badge ${badgeClass}">${label}</span>`;
            }
          }
        ]
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 3 — TIMELINE & STATUS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Status & Timeline',
        children: [
          {
            field: 'invoiceDate',
            headerName: 'Invoice Date',
            width: 125,
            sort: 'desc',
            valueGetter: (p: any) => p.data?.invoiceDate ? new Date(p.data.invoiceDate) : null,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              return `
                <div class="cell-stack">
                  <span class="text-secondary text-xs line-tight">${this.common.formatDate(params.value)}</span>
                  <span class="text-tertiary text-xxs line-tight">${this.common.timeAgoText(params.value)}</span>
                </div>`;
            }
          },
          {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 125,
            valueGetter: (p: any) => p.data?.dueDate ? new Date(p.data.dueDate) : null,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const isPaid = params.data?.paymentStatus === 'paid';
              const isOverdue = this.common.isPast(params.value) && !isPaid;
              const isNear = !isOverdue && this.common.isWithinDays(params.value, 3) && !isPaid;

              const colorClass = isOverdue ? 'text-error' : isNear ? 'text-warning' : 'text-secondary';
              const weightClass = isOverdue ? 'font-bold' : '';

              const tag = isOverdue ? `<span class="tag-alert text-error">⚠ Overdue</span>` :
                isNear ? `<span class="tag-alert text-warning">Due soon</span>` : '';

              return `
                <div class="cell-stack">
                  <span class="text-xs line-tight ${colorClass} ${weightClass}">
                    ${this.common.formatDate(params.value)}
                  </span>
                  ${tag}
                </div>`;
            }
          },
          {
            field: 'status',
            headerName: 'Status',
            width: 105,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
              return `<span class="grid-badge badge-dynamic" style="background: ${theme.bg}; color: ${theme.text};">${params.value}</span>`;
            }
          },
          {
            field: 'paymentStatus',
            headerName: 'Payment',
            width: 105,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
              return `<span class="grid-badge badge-dynamic" style="background: ${theme.bg}; color: ${theme.text};">${params.value}</span>`;
            }
          },
          {
            field: 'paymentMethod',
            headerName: 'Method',
            width: 105,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const iconMap: Record<string, string> = {
                cash: 'pi-wallet', cheque: 'pi-file', neft: 'pi-send', rtgs: 'pi-send',
                imps: 'pi-send', upi: 'pi-mobile', card: 'pi-credit-card', bank_transfer: 'pi-building', dd: 'pi-file',
              };
              const icon = iconMap[params.value?.toLowerCase()] || 'pi-credit-card';

              return `
                <div class="cell-flex-center gap-xs">
                  <i class="pi ${icon} icon-accent-muted icon-xs"></i>
                  <span class="text-secondary text-xs">${this.common.toTitleCase(params.value)}</span>
                </div>`;
            }
          }
        ]
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 4 — FINANCIALS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Financials',
        children: [
          {
            field: 'subTotal',
            headerName: 'Subtotal',
            width: 120,
            type: 'rightAligned',
            cellClass: 'cell-flex-end text-secondary font-mono text-xs',
            valueFormatter: (p: any) => this.common.formatCurrency(p.value)
          },
          {
            field: 'totalTax',
            headerName: 'GST',
            width: 105,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              const colorClass = val > 0 ? 'text-info' : 'text-tertiary';
              return `<span class="font-mono text-xs ${colorClass}">${val > 0 ? this.common.formatCurrency(val) : '—'}</span>`;
            }
          },
          {
            field: 'totalDiscount',
            headerName: 'Discount',
            width: 105,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              if (val <= 0) return `<span class="text-tertiary text-xs">—</span>`;
              return `<span class="text-success font-mono font-semibold text-xs">-${this.common.formatCurrency(val)}</span>`;
            }
          },
          {
            field: 'grandTotal',
            headerName: 'Grand Total',
            width: 130,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              return `<span class="text-primary font-mono font-bold text-sm tracking-tight">${this.common.formatCurrency(params.value || 0)}</span>`;
            }
          },
          {
            field: 'paidAmount',
            headerName: 'Paid',
            width: 115,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              if (val <= 0) return `<span class="text-tertiary text-xs">—</span>`;
              return `<span class="text-success font-mono font-semibold text-xs">${this.common.formatCurrency(val)}</span>`;
            }
          },
          {
            field: 'balanceAmount',
            headerName: 'Balance Due',
            width: 135,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const balance = params.value || 0;
              const grandTotal = params.data?.grandTotal || 0;

              // Fully paid
              if (balance <= 0) {
                return `<span class="badge-success-solid">✓ Paid</span>`;
              }

              const pct = grandTotal > 0 ? this.common.percent(grandTotal - balance, grandTotal, 0) : 0;
              const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate);
              const colorClass = isOverdue ? 'text-error' : 'text-warning';

              return `
                <div class="cell-stack align-end w-full gap-xs">
                  <span class="${colorClass} font-mono font-bold text-xs">${this.common.formatCurrency(balance)}</span>
                  ${pct > 0 ? `
                    <div class="progress-track">
                      <div class="progress-fill" style="width: ${pct}%;"></div>
                    </div>` : ''}
                </div>`;
            }
          }
        ]
      }
    ];

    this.cdr.detectChanges();
  }

  // getColumn(): void {
  //   this.column = [

  //     // ═══════════════════════════════════════════════════════
  //     // GROUP 1 — IDENTITY
  //     // ═══════════════════════════════════════════════════════
  //     {
  //       headerName: 'Identity',
  //       children: [

  //         {
  //           field: 'invoiceNumber',
  //           headerName: 'Invoice #',
  //           pinned: 'left',
  //           width: 175,
  //           filter: 'agTextColumnFilter',
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             const isOverdue =
  //               params.data?.dueDate &&
  //               this.common.isPast(params.data.dueDate) &&
  //               params.data?.paymentStatus !== 'paid';

  //             const overdueIcon = isOverdue
  //               ? `<i class="pi pi-exclamation-circle"
  //                   style="color:var(--color-error); font-size:9px; margin-left:5px;"
  //                   title="Overdue"></i>`
  //               : '';

  //             return `
  //             <div style="display:flex; align-items:center; gap:5px;">
  //               <i class="pi pi-file-text"
  //                  style="font-size:10px; color:var(--accent-primary); opacity:0.6;"></i>
  //               <span style="
  //                 color: var(--accent-primary);
  //                 font-weight: 700;
  //                 font-family: var(--font-mono);
  //                 font-size: 11px;
  //                 cursor: pointer;
  //                 letter-spacing: 0.4px;">
  //                 ${params.value}
  //               </span>
  //               ${overdueIcon}
  //             </div>`;
  //           }
  //         },

  //         {
  //           field: 'branchId.name',
  //           headerName: 'Branch',
  //           width: 120,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             return `
  //             <div style="display:flex; align-items:center; gap:4px;">
  //               <i class="pi pi-building"
  //                  style="font-size:9px; color:var(--text-tertiary);"></i>
  //               <span style="
  //                 color: var(--text-secondary);
  //                 font-size: 11px;
  //                 white-space: nowrap;
  //                 overflow: hidden;
  //                 text-overflow: ellipsis;">
  //                 ${params.value}
  //               </span>
  //             </div>`;
  //           }
  //         },

  //         {
  //           field: 'createdBy.name',
  //           headerName: 'Created By',
  //           width: 130,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             const name = params.value || params.data?.createdBy?.name;
  //             if (!name) return '-';
  //             const initials = this.common.getInitials(name);
  //             const avatarStyle = this.common.getAvatarStyle(name);
  //             return `
  //             <div style="display:flex; align-items:center; gap:6px;">
  //               <span style="
  //                 width: 22px; height: 22px;
  //                 border-radius: 50%;
  //                 background: ${avatarStyle.background};
  //                 color: ${avatarStyle.color};
  //                 display: inline-flex;
  //                 align-items: center;
  //                 justify-content: center;
  //                 font-size: 8px;
  //                 font-weight: 700;
  //                 flex-shrink: 0;
  //                 text-transform: uppercase;">
  //                 ${initials}
  //               </span>
  //               <span style="
  //                 color: var(--text-secondary);
  //                 font-size: 11px;
  //                 white-space: nowrap;
  //                 overflow: hidden;
  //                 text-overflow: ellipsis;">
  //                 ${name}
  //               </span>
  //             </div>`;
  //           }
  //         }
  //       ]
  //     },

  //     // ═══════════════════════════════════════════════════════
  //     // GROUP 2 — CUSTOMER
  //     // ═══════════════════════════════════════════════════════
  //     {
  //       headerName: 'Customer',
  //       children: [

  //         {
  //           headerName: 'Name',
  //           field: 'customerId.name',
  //           width: 185,
  //           cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
  //           cellRenderer: (params: any) => {
  //             const customer = params.data?.customerId;
  //             if (!customer) return '-';

  //             const name = customer.name || '-';
  //             const contact = customer.phone
  //               ? this.common.formatPhone(customer.phone)
  //               : customer.email || '';
  //             const contactIcon = customer.phone ? 'pi-phone' : 'pi-envelope';
  //             const initials = this.common.getInitials(name);
  //             const avatarStyle = this.common.getAvatarStyle(name);

  //             return `
  //             <div style="display:flex; align-items:center; gap:7px; width:100%; overflow:hidden;">
  //               <span style="
  //                 width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  //                 background: ${avatarStyle.background};
  //                 color: ${avatarStyle.color};
  //                 display: inline-flex; align-items: center; justify-content: center;
  //                 font-size: 9px; font-weight: 700; text-transform: uppercase;">
  //                 ${initials}
  //               </span>
  //               <div style="
  //                 display: flex;
  //                 flex-direction: column;
  //                 justify-content: center;
  //                 min-width: 0;
  //                 gap: 1px;">
  //                 <span style="
  //                   font-weight: 600;
  //                   color: var(--text-primary);
  //                   font-size: 12px;
  //                   white-space: nowrap;
  //                   overflow: hidden;
  //                   text-overflow: ellipsis;
  //                   line-height: 1.2;">
  //                   ${name}
  //                 </span>
  //                 ${contact ? `
  //                 <span style="
  //                   font-size: 10px;
  //                   color: var(--text-tertiary);
  //                   display: flex;
  //                   align-items: center;
  //                   gap: 3px;
  //                   line-height: 1.2;
  //                   white-space: nowrap;
  //                   overflow: hidden;
  //                   text-overflow: ellipsis;">
  //                   <i class="pi ${contactIcon}" style="font-size:8px; flex-shrink:0;"></i>
  //                   ${contact}
  //                 </span>` : ''}
  //               </div>
  //             </div>`;
  //           }
  //         },

  //         {
  //           field: 'placeOfSupply',
  //           headerName: 'Supply State',
  //           width: 120,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return `<span style="color:var(--text-tertiary);">—</span>`;
  //             return `
  //             <div style="display:flex; align-items:center; gap:4px;">
  //               <i class="pi pi-map-marker"
  //                  style="font-size:9px; color:var(--text-tertiary);"></i>
  //               <span style="color:var(--text-secondary); font-size:11px;">
  //                 ${params.value}
  //               </span>
  //             </div>`;
  //           }
  //         },

  //         {
  //           field: 'gstType',
  //           headerName: 'GST Type',
  //           width: 115,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             const label = this.common.toTitleCase(params.value.replace(/-/g, ' '));
  //             const isIntra = params.value?.toLowerCase().includes('intra');
  //             // Compact inline chip — no pillBadgeHtml (too big), hand-crafted small
  //             const bg = isIntra ? 'var(--color-info-bg)' : 'var(--color-warning-bg)';
  //             const text = isIntra ? 'var(--color-info)' : 'var(--color-warning)';
  //             const bdr = isIntra ? 'var(--color-info-border)' : 'var(--color-warning-border)';
  //             return `
  //             <span style="
  //               background: ${bg};
  //               color: ${text};
  //               border: 1px solid ${bdr};
  //               padding: 2px 7px;
  //               border-radius: 4px;
  //               font-size: 10px;
  //               font-weight: 600;
  //               letter-spacing: 0.2px;
  //               white-space: nowrap;">
  //               ${label}
  //             </span>`;
  //           }
  //         }
  //       ]
  //     },

  //     // ═══════════════════════════════════════════════════════
  //     // GROUP 3 — TIMELINE & STATUS
  //     // ═══════════════════════════════════════════════════════
  //     {
  //       headerName: 'Status & Timeline',
  //       children: [

  //         {
  //           field: 'invoiceDate',
  //           headerName: 'Invoice Date',
  //           width: 125,
  //           sort: 'desc',
  //           valueGetter: (p: any) => p.data?.invoiceDate ? new Date(p.data.invoiceDate) : null,
  //           cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             const formatted = this.common.formatDate(params.value);
  //             const ago = this.common.timeAgoText(params.value);
  //             return `
  //             <div style="display:flex; flex-direction:column; justify-content:center; gap:1px;">
  //               <span style="color:var(--text-secondary); font-size:11px; line-height:1.2;">
  //                 ${formatted}
  //               </span>
  //               <span style="font-size:10px; color:var(--text-tertiary); line-height:1.2;">
  //                 ${ago}
  //               </span>
  //             </div>`;
  //           }
  //         },

  //         {
  //           field: 'dueDate',
  //           headerName: 'Due Date',
  //           width: 125,
  //           valueGetter: (p: any) => p.data?.dueDate ? new Date(p.data.dueDate) : null,
  //           cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             const isPaid = params.data?.paymentStatus === 'paid';
  //             const isOverdue = this.common.isPast(params.value) && !isPaid;
  //             const isNear = !isOverdue && this.common.isWithinDays(params.value, 3) && !isPaid;

  //             const color = isOverdue
  //               ? 'var(--color-error)'
  //               : isNear
  //                 ? 'var(--color-warning)'
  //                 : 'var(--text-secondary)';

  //             const tag = isOverdue
  //               ? `<span style="font-size:9px; color:var(--color-error); font-weight:600; line-height:1.2;">
  //                  ⚠ Overdue
  //                </span>`
  //               : isNear
  //                 ? `<span style="font-size:9px; color:var(--color-warning); font-weight:600; line-height:1.2;">
  //                    Due soon
  //                  </span>`
  //                 : '';

  //             return `
  //             <div style="display:flex; flex-direction:column; justify-content:center; gap:1px;">
  //               <span style="
  //                 color: ${color};
  //                 font-size: 11px;
  //                 font-weight: ${isOverdue ? 600 : 400};
  //                 line-height: 1.2;">
  //                 ${this.common.formatDate(params.value)}
  //               </span>
  //               ${tag}
  //             </div>`;
  //           }
  //         },

  //         {
  //           field: 'status',
  //           headerName: 'Status',
  //           width: 105,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             // Compact badge — override common method's padding for tighter look
  //             const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
  //             return `
  //             <span style="
  //               background: ${theme.bg};
  //               color: ${theme.text};
  //               padding: 2px 8px;
  //               border-radius: 4px;
  //               font-size: 10px;
  //               font-weight: 700;
  //               text-transform: uppercase;
  //               letter-spacing: 0.4px;
  //               white-space: nowrap;">
  //               ${params.value}
  //             </span>`;
  //           }
  //         },

  //         {
  //           field: 'paymentStatus',
  //           headerName: 'Payment',
  //           width: 105,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
  //             return `
  //             <span style="
  //               background: ${theme.bg};
  //               color: ${theme.text};
  //               padding: 2px 8px;
  //               border-radius: 4px;
  //               font-size: 10px;
  //               font-weight: 700;
  //               text-transform: uppercase;
  //               letter-spacing: 0.4px;
  //               white-space: nowrap;">
  //               ${params.value}
  //             </span>`;
  //           }
  //         },

  //         {
  //           field: 'paymentMethod',
  //           headerName: 'Method',
  //           width: 105,
  //           cellStyle: { display: 'flex', alignItems: 'center' },
  //           cellRenderer: (params: any) => {
  //             if (!params.value) return '-';
  //             const iconMap: Record<string, string> = {
  //               cash: 'pi-wallet', cheque: 'pi-file',
  //               neft: 'pi-send', rtgs: 'pi-send',
  //               imps: 'pi-send', upi: 'pi-mobile',
  //               card: 'pi-credit-card', bank_transfer: 'pi-building',
  //               dd: 'pi-file',
  //             };
  //             const icon = iconMap[params.value?.toLowerCase()] || 'pi-credit-card';
  //             const label = this.common.toTitleCase(params.value);
  //             return `
  //             <div style="display:flex; align-items:center; gap:5px;">
  //               <i class="pi ${icon}"
  //                  style="font-size:10px; color:var(--accent-primary); opacity:0.75;"></i>
  //               <span style="color:var(--text-secondary); font-size:11px;">
  //                 ${label}
  //               </span>
  //             </div>`;
  //           }
  //         }
  //       ]
  //     },

  //     // ═══════════════════════════════════════════════════════
  //     // GROUP 4 — FINANCIALS
  //     // ═══════════════════════════════════════════════════════
  //     {
  //       headerName: 'Financials',
  //       children: [

  //         {
  //           field: 'subTotal',
  //           headerName: 'Subtotal',
  //           width: 120,
  //           type: 'rightAligned',
  //           cellStyle: {
  //             display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
  //             color: 'var(--text-secondary)',
  //             fontFamily: 'var(--font-mono)',
  //             fontSize: '11px'
  //           },
  //           valueFormatter: (p: any) => this.common.formatCurrency(p.value)
  //         },

  //         {
  //           field: 'totalTax',
  //           headerName: 'GST',
  //           width: 105,
  //           type: 'rightAligned',
  //           cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  //           cellRenderer: (params: any) => {
  //             const val = params.value || 0;
  //             const color = val > 0 ? 'var(--color-info)' : 'var(--text-tertiary)';
  //             return `
  //             <span style="
  //               color: ${color};
  //               font-family: var(--font-mono);
  //               font-size: 11px;">
  //               ${val > 0 ? this.common.formatCurrency(val) : '—'}
  //             </span>`;
  //           }
  //         },

  //         {
  //           field: 'totalDiscount',
  //           headerName: 'Discount',
  //           width: 105,
  //           type: 'rightAligned',
  //           cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  //           cellRenderer: (params: any) => {
  //             const val = params.value || 0;
  //             if (val <= 0) {
  //               return `<span style="color:var(--text-tertiary); font-size:11px;">—</span>`;
  //             }
  //             return `
  //             <span style="
  //               color: var(--color-success);
  //               font-family: var(--font-mono);
  //               font-size: 11px;
  //               font-weight: 600;">
  //               -${this.common.formatCurrency(val)}
  //             </span>`;
  //           }
  //         },

  //         {
  //           field: 'grandTotal',
  //           headerName: 'Grand Total',
  //           width: 130,
  //           type: 'rightAligned',
  //           cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  //           cellRenderer: (params: any) => {
  //             return `
  //             <span style="
  //               font-weight: 700;
  //               color: var(--text-primary);
  //               font-family: var(--font-mono);
  //               font-size: 12px;
  //               letter-spacing: 0.2px;">
  //               ${this.common.formatCurrency(params.value || 0)}
  //             </span>`;
  //           }
  //         },

  //         {
  //           field: 'paidAmount',
  //           headerName: 'Paid',
  //           width: 115,
  //           type: 'rightAligned',
  //           cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  //           cellRenderer: (params: any) => {
  //             const val = params.value || 0;
  //             if (val <= 0) {
  //               return `<span style="color:var(--text-tertiary); font-size:11px;">—</span>`;
  //             }
  //             return `
  //             <span style="
  //               color: var(--color-success);
  //               font-family: var(--font-mono);
  //               font-size: 11px;
  //               font-weight: 600;">
  //               ${this.common.formatCurrency(val)}
  //             </span>`;
  //           }
  //         },

  //         {
  //           field: 'balanceAmount',
  //           headerName: 'Balance Due',
  //           width: 135,
  //           type: 'rightAligned',
  //           cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  //           cellRenderer: (params: any) => {
  //             const balance = params.value || 0;
  //             const grandTotal = params.data?.grandTotal || 0;

  //             // Fully paid
  //             if (balance <= 0) {
  //               return `
  //               <span style="
  //                 color: var(--color-success);
  //                 font-weight: 700;
  //                 font-size: 10px;
  //                 background: var(--color-success-bg);
  //                 border: 1px solid var(--color-success-border);
  //                 padding: 2px 7px;
  //                 border-radius: 4px;
  //                 letter-spacing: 0.3px;
  //                 text-transform: uppercase;">
  //                 ✓ Paid
  //               </span>`;
  //             }

  //             const pct = grandTotal > 0
  //               ? this.common.percent(grandTotal - balance, grandTotal, 0)
  //               : 0;
  //             const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate);
  //             const color = isOverdue ? 'var(--color-error)' : 'var(--color-warning)';

  //             return `
  //             <div style="
  //               display: flex;
  //               flex-direction: column;
  //               align-items: flex-end;
  //               justify-content: center;
  //               gap: 3px;
  //               width: 100%;">
  //               <span style="
  //                 color: ${color};
  //                 font-weight: 700;
  //                 font-family: var(--font-mono);
  //                 font-size: 11px;">
  //                 ${this.common.formatCurrency(balance)}
  //               </span>
  //               ${pct > 0 ? `
  //               <div style="
  //                 width: 70px; height: 2px;
  //                 background: var(--border-primary);
  //                 border-radius: 99px;
  //                 overflow: hidden;">
  //                 <div style="
  //                   width: ${pct}%;
  //                   height: 100%;
  //                   background: var(--color-success);
  //                   border-radius: 99px;">
  //                 </div>
  //               </div>` : ''}
  //             </div>`;
  //           }
  //         }
  //       ]
  //     }
  //   ];

  //   this.cdr.detectChanges();
  // }

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
