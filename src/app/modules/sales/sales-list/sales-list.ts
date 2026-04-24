import { ChangeDetectorRef, Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';

import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';

// Services
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { SalesService } from '../sales-service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { Subject } from "rxjs";

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [SelectModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, RouterModule, TooltipModule, AgShareGrid, ToastModule, HasPermissionDirective],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private cdr = inject(ChangeDetectorRef);
  private salesService = inject(SalesService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  public common = inject(CommonMethodService);
  private gridApi!: GridApi;
  private currentPage = 1;
  public isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: any = [];
  rowSelectionMode: 'single' | 'multiple' = 'multiple';
  searchControl = new FormControl('');
  searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });
  salesFilter: any = {
    status: null,
    paymentStatus: null,
    dateRange: null
  };

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Draft', value: 'draft' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.salesFilter = { status: null, paymentStatus: null, dateRange: null };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading && !isReset) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const { dateRange, ...baseFilters } = this.salesFilter || {};
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (Array.isArray(dateRange)) {
      if (dateRange[0]) startDate = (dateRange[0] as Date).toISOString();
      if (dateRange[1]) endDate = (dateRange[1] as Date).toISOString();
    }

    const filterParams = {
      ...baseFilters,
      search: this.searchControl.value,
      startDate,
      endDate,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.salesService.getAllSales(filterParams)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          // --- UPGRADED DATA PARSING ---
          // Accessing res.data.data based on your shared JSON structure
          let newData: any[] = [];
          if (res.status === 'success' && res.data && Array.isArray(res.data.data)) {
            newData = res.data.data;
          } else if (res.results && Array.isArray(res.results)) {
            // Fallback if structure is flat
            newData = res.results;
          }

          // --- UPGRADED PAGINATION LOGIC ---
          // Getting total from pagination object or total property
          if (res.pagination) {
            this.totalCount = res.pagination.totalResults;
          } else {
            this.totalCount = res.results?.length || 0;
          }

          if (isReset) {
            this.data = newData;
          } else {
            // Append data for infinite scroll
            this.data = [...this.data, ...newData];
          }

          // Only increment page if we actually received data and haven't hit total
          if (newData.length > 0 && this.data.length < this.totalCount) {
            this.currentPage++;
          }
        },
        error: (err: any) => {
          // Delegated to global HTTP error handler
          this.messageService.handleHttpError(err);
        }
      });
  }

  onScrolledToBottom(event: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      if (event.field === 'invoiceNumber') {
        // Using invoiceId object from JSON or row ID if needed
        const invoiceId = event.row.invoiceId?._id || event.row._id;
        if (invoiceId) {
          this.router.navigate(['/invoices', invoiceId]);
        }
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event);
    }
  }

  getColumn(): void {
    this.column = [

      // ── Row Index ─────────────────────────────────────────────────────────
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 48,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        pinned: 'left',
        cellStyle: {
          color: 'var(--text-tertiary)',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },

      // ── Date ──────────────────────────────────────────────────────────────
      {
        field: 'createdAt',
        headerName: 'Date',
        sortable: true,
        width: 130,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned || !p.value) return '—';
          return this.twoLine(
            this.common.formatDate(p.value, 'dd MMM yyyy'),
            this.common.timeAgoText(p.value),
            'font-size:12px;color:var(--text-primary);',
            'font-size:10px;color:var(--text-tertiary);'
          );
        },
      },

      // ── Invoice # + Branch ────────────────────────────────────────────────
      {
        headerName: 'Invoice / Branch',
        minWidth: 195,
        flex: 1,
        pinned: 'left',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        valueGetter: (p: any) => p.data,
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const inv = p.value?.invoiceNumber ?? p.value?.invoiceId?.invoiceNumber ?? '—';
          const branch = p.value?.branchId?.name ?? '—';
          const invStatus = (p.value?.invoiceId?.status ?? '').toLowerCase();
          const invStatusColor = invStatus === 'paid'
            ? 'var(--color-success)'
            : invStatus === 'partial'
              ? 'var(--color-warning)'
              : 'var(--text-tertiary)';
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-weight:700;color:var(--accent-primary);cursor:pointer;">${inv}</span>`,
            `<span style="font-size:10px;color:var(--text-tertiary);">🏢 ${branch}</span>
            <span style="font-size:9px;font-weight:600;color:${invStatusColor};margin-left:6px;">${invStatus.toUpperCase()}</span>`,
          );
        },
      },

      // ── Customer ──────────────────────────────────────────────────────────
      {
        headerName: 'Customer',
        minWidth: 190,
        flex: 1,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        valueGetter: (p: any) => p.data?.customerId,
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const name = p.value?.name ?? 'Walk-in Customer';
          const phone = p.value?.phone ?? '';
          const email = p.value?.email ?? '';
          const avatar = this.common.getAvatarStyle(name);
          const initials = this.common.getInitials(name);
          return `
            <div style="display:flex;align-items:center;gap:8px;width:100%;overflow:hidden;">
              <span style="
                width:26px;height:26px;border-radius:50%;flex-shrink:0;
                background:${avatar.background};color:${avatar.color};
                display:inline-flex;align-items:center;justify-content:center;
                font-size:9px;font-weight:700;">
                ${initials}
              </span>
              ${this.twoLine(
            name,
            phone + (email ? ' · ' + email : ''),
            'font-size:12px;font-weight:600;color:var(--text-primary);',
            'font-size:10px;color:var(--text-tertiary);'
          )}
            </div>`;
        },
        tooltipValueGetter: (p: any) => {
          const c = p.data?.customerId;
          if (!c) return '';
          return `${c.name}\n${c.phone ?? ''}\n${c.email ?? ''}`;
        },
      },

      // ── Items summary ─────────────────────────────────────────────────────
      {
        headerName: 'Items',
        minWidth: 220,
        flex: 2,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        valueGetter: (p: any) => p.data?.items ?? [],
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const items: any[] = p.value;
          if (!items.length) return `<span style="color:var(--text-tertiary);font-size:11px;">—</span>`;
          const count = items.length;
          const preview = items.slice(0, 2).map((i: any) => i.name).join(', ');
          const more = count > 2 ? ` +${count - 2} more` : '';
          return this.twoLine(
            `<span style="font-weight:600;font-size:12px;">${count} item${count > 1 ? 's' : ''}</span>`,
            `<span style="font-size:10px;color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${preview}${more}</span>`,
          );
        },
        tooltipValueGetter: (p: any) => {
          const items: any[] = p.data?.items ?? [];
          return items.map((i: any) =>
            `${i.name} (SKU: ${i.sku ?? '—'}) × ${i.qty} @ ${this.common.formatCurrency(i.rate)} = ${this.common.formatCurrency(i.lineTotal)}`
          ).join('\n');
        },
      },

      // ── Financials: Sub / Tax / Discount ─────────────────────────────────
      {
        headerName: 'Sub / Tax / Disc',
        width: 150,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        valueGetter: (p: any) => p.data,
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const sub = p.value?.subTotal ?? 0;
          const tax = p.value?.taxTotal ?? 0;
          const disc = p.value?.discountTotal ?? 0;
          const parts = [
            `<span style="font-size:11px;font-weight:600;color:var(--text-primary);font-family:var(--font-mono);">${this.common.formatCurrency(sub)}</span>`,
            tax ? `<span style="font-size:10px;color:var(--color-warning);">+Tax ${this.common.formatCurrency(tax)}</span>` : '',
            disc ? `<span style="font-size:10px;color:var(--color-success);">-Disc ${this.common.formatCurrency(disc)}</span>` : '',
          ].filter(Boolean).join(' ');
          return `<div style="text-align:right;line-height:1.5;">${parts}</div>`;
        },
      },

      // ── Grand Total ───────────────────────────────────────────────────────
      {
        field: 'totalAmount',
        headerName: 'Grand Total',
        sortable: true,
        width: 135,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          return `<span style="
            font-family:var(--font-mono);font-size:13px;font-weight:700;
            color:var(--text-primary);">
            ${this.common.formatCurrency(val)}
          </span>`;
        },
      },

      // ── Paid Amount ───────────────────────────────────────────────────────
      {
        field: 'paidAmount',
        headerName: 'Paid',
        sortable: true,
        width: 120,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          if (!val) return `<span style="color:var(--text-tertiary);font-size:11px;">—</span>`;
          return `<span style="
            font-family:var(--font-mono);font-size:12px;font-weight:600;
            color:var(--color-success);">
            ${this.common.formatCurrency(val)}
          </span>`;
        },
      },

      // ── Due Amount ────────────────────────────────────────────────────────
      {
        field: 'dueAmount',
        headerName: 'Due',
        sortable: true,
        width: 120,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) {
            return `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--color-error);">
              ${this.common.formatCurrency(p.value ?? 0)}
            </span>`;
          }
          const val = p.value ?? 0;
          if (val === 0) return this.badge('✓ Cleared', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
          return `<span style="
            font-family:var(--font-mono);font-size:12px;font-weight:700;
            color:var(--color-error);">
            ${this.common.formatCurrency(val)}
          </span>`;
        },
      },

      // ── Payment progress bar ──────────────────────────────────────────────
      {
        headerName: 'Payment',
        width: 165,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        valueGetter: (p: any) => {
          const paid = p.data?.paidAmount ?? 0;
          const total = p.data?.totalAmount ?? 0;
          const pct = this.common.percent(paid, total, 0);
          return { paid, total, pct, status: p.data?.paymentStatus ?? 'unpaid' };
        },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const { pct, status } = p.value;
          const statusMap: Record<string, [string, string, string, string]> = {
            paid: ['var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)', '✓ Paid'],
            partial: ['var(--color-warning-bg)', 'var(--color-warning)', 'var(--color-warning-border)', '⏳ Partial'],
            unpaid: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)', '✗ Unpaid'],
          };
          const [bg, color, bdr, label] = statusMap[status] ?? statusMap['unpaid'];
          const barColor = status === 'paid' ? 'var(--color-success)' : status === 'partial' ? 'var(--color-warning)' : 'var(--color-error)';
          return `
            <div style="width:100%;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                ${this.badge(label, bg, color, bdr)}
                <span style="font-size:10px;color:var(--text-tertiary);">${pct}%</span>
              </div>
              <div style="height:4px;border-radius:99px;background:var(--border-primary);overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;"></div>
              </div>
            </div>`;
        },
      },

      // ── Order Status ──────────────────────────────────────────────────────
      {
        field: 'status',
        headerName: 'Order Status',
        sortable: true,
        width: 120,
        cellStyle: { display: 'flex', alignItems: 'center' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const statusMap: Record<string, [string, string, string]> = {
            active: ['var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)'],
            completed: ['var(--color-info-bg)', 'var(--color-info)', 'var(--color-info-border)'],
            cancelled: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
            pending: ['var(--color-warning-bg)', 'var(--color-warning)', 'var(--color-warning-border)'],
          };
          const [bg, color, bdr] = statusMap[(p.value ?? '').toLowerCase()] ?? ['var(--bg-secondary)', 'var(--text-secondary)', 'var(--border-primary)'];
          const icons: Record<string, string> = { active: '●', completed: '✓', cancelled: '✗', pending: '⏳' };
          const icon = icons[(p.value ?? '').toLowerCase()] ?? '●';
          return this.badge(`${icon} ${p.value ?? '—'}`, bg, color, bdr);
        },
      },

      // ── Margin (derived from purchasePriceAtSale) ─────────────────────────
      {
        headerName: 'Margin',
        width: 120,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        valueGetter: (p: any) => {
          const items: any[] = p.data?.items ?? [];
          const revenue = items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
          const cost = items.reduce((s, i) => s + ((i.purchasePriceAtSale ?? 0) * (i.qty ?? 1)), 0);
          const margin = revenue - cost;
          const pct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
          return { margin, pct };
        },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) {
            return `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--color-success);">
              ${this.common.formatCurrency(p.value?.margin ?? 0)}
            </span>`;
          }
          const { margin, pct } = p.value;
          const color = margin > 0 ? 'var(--color-success)' : margin < 0 ? 'var(--color-error)' : 'var(--text-tertiary)';
          return this.twoLine(
            this.common.formatCurrency(margin),
            `${pct}% margin`,
            `font-size:12px;font-weight:700;color:${color};font-family:var(--font-mono);text-align:right;`,
            `font-size:10px;color:${color};text-align:right;opacity:0.8;`
          );
        },
        tooltipValueGetter: (p: any) => {
          const items: any[] = p.data?.items ?? [];
          return items.map((i: any) => {
            const cost = (i.purchasePriceAtSale ?? 0) * (i.qty ?? 1);
            const profit = (i.lineTotal ?? 0) - cost;
            return `${i.name}: sell ${this.common.formatCurrency(i.lineTotal)} - cost ${this.common.formatCurrency(cost)} = ${this.common.formatCurrency(profit)}`;
          }).join('\n');
        },
      },

    ];

    this.cdr.detectChanges();
  }

  onCreateSales() {
    this.router.navigate(['/invoices/create']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  // ─── Private renderer helpers ────────────────────────────────────────────────
  private badge(label: string, bg: string, color: string, border: string): string {
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
    topStyle = 'font-size:11px;color:var(--text-secondary);',
    bottomStyle = 'font-size:10px;color:var(--text-tertiary);'
  ): string {
    return `
        <div style="
          display:flex;flex-direction:column;
          justify-content:center;gap:0px;
          line-height:1.25;overflow:hidden;">
          <span style="${topStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top}</span>
          <span style="${bottomStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bottom}</span>
        </div>`;
  }

}
