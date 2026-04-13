import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { GridApi } from 'ag-grid-community';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { EmiService } from '../../services/emi-service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CommonMethodService } from '@core/utils/common-method.service';

@Component({
  selector: 'app-emi-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    SelectModule,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    AgShareGrid,
    HasPermissionDirective,
    ConfirmDialogModule
  ],
  providers: [EmiService, ConfirmationService],
  templateUrl: './emi-list.html',
  styleUrl: './emi-list.scss',
})
export class EmiList implements OnInit, OnDestroy {
  // ─── Constants ───────────────────────────────────────────────────────────────
  readonly PERMISSIONS = PERMISSIONS;

  readonly emiActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: true,
    viewPermission: PERMISSIONS.EMI.READ,
    deletePermission: PERMISSIONS.EMI.MANAGE,
  };

  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Defaulted', value: 'defaulted' },
  ];

  // ─── DI ──────────────────────────────────────────────────────────────────────
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly emiService = inject(EmiService);
  private readonly messageService = inject(AppMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  public readonly masterList = inject(MasterListService);
  public readonly common = inject(CommonMethodService);

  // ─── Lifecycle subjects ───────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();

  // ─── Grid API ────────────────────────────────────────────────────────────────
  private gridApi!: GridApi;

  // ─── Pagination state ────────────────────────────────────────────────────────
  private currentPage = 1;
  private readonly pageSize = 50;
  private isLoading = false;
  private totalCount = 0;
  private hasNextPage = true;

  // ─── Signals / state ─────────────────────────────────────────────────────────
  /**
   * Derived from masterList signal via computed — no effect() needed.
   * This eliminates the signal-write-inside-effect memory/stack bug.
   */
  readonly customerOptions = computed(() => this.masterList.customers());

  readonly emiAnalytics = signal<any>(null);

  emiFilter: { customerId: string | null; status: string | null } = {
    customerId: null,
    status: null,
  };

  data: any[] = [];
  column: any[] = [];
  readonly rowSelectionMode = 'single';

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildColumns();
    this.loadData(true);
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    // Completes all takeUntil pipes — no lingering subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Filter actions ──────────────────────────────────────────────────────────
  applyFilters(): void {
    this.loadData(true);
    this.loadAnalytics();
  }

  resetFilters(): void {
    this.emiFilter = { customerId: null, status: null };
    this.loadData(true);
    this.loadAnalytics();
  }

  // ─── Grid events ─────────────────────────────────────────────────────────────
  eventFromGrid(event: any): void {
    switch (event.type) {
      case 'init':
        this.gridApi = event.api;
        break;

      case 'cellClicked': {
        const id = event.row?._id;
        if (id) this.router.navigate(['/emis', id]);
        break;
      }

      case 'delete':
        this.confirmDeleteEmi(event.row);
        break;

      case 'reachedBottom':
        this.onScrolledToBottom();
        break;
    }
  }

  private onScrolledToBottom(): void {
    if (!this.isLoading && this.hasNextPage) this.loadData(false);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  private confirmDeleteEmi(row: any): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this EMI plan? This action cannot be undone.',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.deleteEmi(row),
    });
  }

  private deleteEmi(row: any): void {
    this.emiService
      .deleteEmi(row._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('EMI plan deleted successfully.');
          this.loadData(true);
          this.loadAnalytics();
        },
        error: (err) => this.messageService.handleHttpError(err),
      });
  }

  // ─── Data loading ────────────────────────────────────────────────────────────
  private loadAnalytics(): void {
    this.emiService
      .getEmiAnalytics(this.emiFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.status === 'success') {
            this.emiAnalytics.set(res.data);
          }
        },
        error: (err) => this.messageService.handleHttpError(err),
      });
  }

  private loadData(isReset: boolean): void {
    if (isReset) {
      this.currentPage = 1;
      this.hasNextPage = true;
      this.totalCount = 0;
      this.data = [];

      // Clear the grid rows on reset to keep grid & data in sync
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', []);
      }
    }

    // Guard: skip if already loading or nothing left to fetch
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;

    const params = {
      ...this.emiFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.emiService
      .getAllEmiData(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Always reset loading flag whether success or error
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          const newRows: any[] = Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data)
              ? res.data
              : [];

          if (res?.pagination) {
            this.hasNextPage = res.pagination.hasNextPage ?? false;
            this.totalCount = res.pagination.totalResults ?? 0;
          } else {
            this.hasNextPage = newRows.length >= this.pageSize;
            this.totalCount = res?.results ?? 0;
          }

          if (isReset) {
            this.data = newRows;
          } else {
            this.data = [...this.data, ...newRows];
            if (this.gridApi && newRows.length > 0) {
              this.gridApi.applyTransaction({ add: newRows });
            }
          }

          if (this.hasNextPage) this.currentPage++;
        },
        error: (err) => this.messageService.handleHttpError(err),
      });
  }

  // ─── Template helpers ────────────────────────────────────────────────────────
  installmentTotal(a: any): number {
    return (
      (a?.installments?.paid ?? 0) +
      (a?.installments?.pending ?? 0) +
      (a?.installments?.overdue ?? 0)
    );
  }

  installmentPct(a: any): number {
    const total = this.installmentTotal(a);
    return total > 0 ? (a.installments.paid / total) * 100 : 0;
  }

  private buildColumns(): void {
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

      // ═══════════════════════════════════════════════════════════════════════
      // GROUP: LOAN IDENTITY
      // ═══════════════════════════════════════════════════════════════════════
      {
        headerName: 'Loan Identity',
        children: [

          // Invoice + Customer stacked
          {
            headerName: 'Invoice / Customer',
            minWidth: 210,
            flex: 2,
            pinned: 'left',
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => p.data,
            cellRenderer: (p: any) => {
              const inv = p.value?.invoiceId?.invoiceNumber ?? '—';
              const cust = p.value?.customerId?.name ?? '—';
              const city = p.value?.customerId?.billingAddress?.city ?? '';
              const state = p.value?.customerId?.billingAddress?.state ?? '';
              const location = [city, state].filter(Boolean).join(', ');
              const avatar = this.common.getAvatarStyle(cust);
              const initials = this.common.getInitials(cust);
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
                inv,
                cust + (location ? ' · ' + location : ''),
                'font-size:11px;font-weight:700;color:var(--accent-primary);font-family:var(--font-mono);',
                'font-size:10px;color:var(--text-tertiary);'
              )}
              </div>`;
            },
          },

          // Customer contact
          {
            headerName: 'Contact',
            width: 145,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => p.data?.customerId,
            cellRenderer: (p: any) => {
              const phone = p.value?.phone ?? '—';
              const email = p.value?.email ?? '';
              return this.twoLine(
                `<span style="font-family:var(--font-mono);font-size:11px;">${phone}</span>`,
                `<span style="font-size:10px;color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;">${email}</span>`,
              );
            },
            tooltipValueGetter: (p: any) =>
              `${p.data?.customerId?.phone ?? ''}\n${p.data?.customerId?.email ?? ''}`,
          },

          // Status badge
          {
            field: 'status',
            headerName: 'Status',
            width: 115,
            sortable: true,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const map: Record<string, [string, string, string]> = {
                active: ['var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)'],
                completed: ['var(--color-info-bg)', 'var(--color-info)', 'var(--color-info-border)'],
                closed: ['var(--bg-secondary)', 'var(--text-tertiary)', 'var(--border-primary)'],
                overdue: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
                defaulted: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
              };
              const [bg, color, bdr] = map[p.value?.toLowerCase()] ?? ['var(--bg-secondary)', 'var(--text-secondary)', 'var(--border-primary)'];
              const icons: Record<string, string> = {
                active: '●', completed: '✓', closed: '○', overdue: '⚠', defaulted: '✗'
              };
              const icon = icons[p.value?.toLowerCase()] ?? '●';
              return this.badge(`${icon} ${p.value ?? '—'}`, bg, color, bdr);
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // GROUP: LOAN FINANCIALS
      // ═══════════════════════════════════════════════════════════════════════
      {
        headerName: 'Loan Financials',
        children: [

          // Total + Down Payment stacked
          {
            headerName: 'Total / Down',
            width: 150,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            valueGetter: (p: any) => p.data,
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) {
                return `<span style="font-weight:700;font-family:var(--font-mono);font-size:12px;color:var(--text-primary);">
                ${this.common.formatCurrency(p.value?.totalAmount ?? 0)}
              </span>`;
              }
              const total = p.value?.totalAmount ?? 0;
              const down = p.value?.downPayment ?? 0;
              return this.twoLine(
                this.common.formatCurrency(total),
                down ? `↓ Down: ${this.common.formatCurrency(down)}` : 'No down payment',
                'font-size:12px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);text-align:right;',
                'font-size:10px;color:var(--text-tertiary);text-align:right;'
              );
            },
          },

          // Outstanding balance
          {
            field: 'balanceAmount',
            headerName: 'Outstanding',
            width: 130,
            sortable: true,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) {
                return `<span style="font-weight:700;font-family:var(--font-mono);font-size:12px;color:var(--color-error);">
                ${this.common.formatCurrency(p.value ?? 0)}
              </span>`;
              }
              const val = p.value ?? 0;
              if (val === 0) return this.badge('✓ Cleared', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
              return `<span style="font-weight:700;color:var(--color-error);font-family:var(--font-mono);font-size:12px;">
              ${this.common.formatCurrency(val)}
            </span>`;
            },
          },

          // Interest rate
          {
            field: 'interestRate',
            headerName: 'Interest',
            width: 95,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const rate = p.value ?? 0;
              return rate > 0
                ? `<span style="font-size:12px;color:var(--color-warning);font-weight:700;">${rate}%</span>`
                : `<span style="font-size:10px;color:var(--color-success);font-weight:600;">0% · Free</span>`;
            },
          },

          // Advance balance
          {
            field: 'advanceBalance',
            headerName: 'Advance',
            width: 110,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const val = p.value ?? 0;
              if (!val) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `<span style="color:var(--color-info);font-weight:700;font-family:var(--font-mono);font-size:12px;">
              ${this.common.formatCurrency(val)}
            </span>`;
            },
          },

          // Invoice outstanding (from invoiceId.balanceAmount — negative means overpaid)
          {
            headerName: 'Inv. Balance',
            width: 120,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            valueGetter: (p: any) => p.data?.invoiceId?.balanceAmount ?? null,
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const val = p.value;
              if (val === null) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              if (val < 0) return this.twoLine(
                this.common.formatCurrency(Math.abs(val)),
                'Overpaid',
                'font-size:11px;font-weight:700;color:var(--color-success);font-family:var(--font-mono);text-align:right;',
                'font-size:10px;color:var(--color-success);text-align:right;'
              );
              if (val === 0) return this.badge('✓ Settled', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
              return `<span style="font-weight:700;color:var(--color-error);font-family:var(--font-mono);font-size:11px;">
              ${this.common.formatCurrency(val)}
            </span>`;
            },
            tooltipValueGetter: (p: any) => {
              const val = p.data?.invoiceId?.balanceAmount;
              if (val === null || val === undefined) return '';
              return val < 0 ? `Overpaid by ${this.common.formatCurrency(Math.abs(val))}` : `Due: ${this.common.formatCurrency(val)}`;
            }
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // GROUP: INSTALLMENT PROGRESS
      // ═══════════════════════════════════════════════════════════════════════
      {
        headerName: 'Installment Progress',
        children: [

          // EMI count
          {
            field: 'numberOfInstallments',
            headerName: 'EMIs',
            width: 70,
            type: 'rightAligned',
            cellStyle: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontWeight: '600',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            },
          },

          // EMI amount per installment (derived)
          {
            headerName: 'EMI / Month',
            width: 120,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            valueGetter: (p: any) => {
              const installments: any[] = p.data?.installments ?? [];
              return installments[0]?.totalAmount ?? 0;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const val = p.value ?? 0;
              return `<span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text-primary);">
              ${this.common.formatCurrency(val)}
            </span>`;
            },
          },

          // Paid vs total amount
          {
            headerName: 'Paid / Total',
            width: 155,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
            valueGetter: (p: any) => {
              const list: any[] = p.data?.installments ?? [];
              const paid = list.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
              const total = list.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
              return { paid, total };
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) {
                return `<span style="font-weight:700;font-family:var(--font-mono);font-size:12px;color:var(--color-success);">
                ${this.common.formatCurrency(p.value?.paid ?? 0)}
              </span>`;
              }
              const { paid, total } = p.value;
              return this.twoLine(
                this.common.formatCurrency(paid),
                `of ${this.common.formatCurrency(total)}`,
                'font-size:12px;font-weight:700;color:var(--color-success);font-family:var(--font-mono);text-align:right;',
                'font-size:10px;color:var(--text-tertiary);text-align:right;'
              );
            },
          },

          // Visual progress bar
          {
            headerName: 'Progress',
            minWidth: 160,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => {
              const list: any[] = p.data?.installments ?? [];
              const total = list.length;
              const paid = list.filter((i) => i.paymentStatus === 'paid').length;
              const overdue = list.filter(
                (i) => i.paymentStatus !== 'paid' && this.common.isPast(i.dueDate)
              ).length;
              return { total, paid, overdue, pct: this.common.percent(paid, total, 0) };
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const { total, paid, overdue, pct } = p.value;
              const barColor = overdue > 0
                ? 'var(--color-warning)'
                : pct === 100
                  ? 'var(--color-success)'
                  : 'var(--accent-primary)';
              const overdueTag = overdue > 0
                ? `<span style="color:var(--color-warning);font-size:9px;font-weight:700;margin-left:4px;">${overdue} late</span>`
                : '';
              return `
              <div style="width:100%;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                  <span style="font-size:11px;font-weight:600;color:var(--text-primary);">
                    ${paid}/${total}${overdueTag}
                  </span>
                  <span style="font-size:10px;color:var(--text-tertiary);">${pct}%</span>
                </div>
                <div style="height:4px;border-radius:99px;background:var(--border-primary);overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;transition:width .3s;"></div>
                </div>
              </div>`;
            },
          },

          // Next due installment
          {
            headerName: 'Next Due',
            minWidth: 155,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => {
              const pending = (p.data?.installments ?? [])
                .filter((i: any) => i.paymentStatus !== 'paid')
                .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
              return pending[0] ?? null;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              if (!p.value) return this.badge('✓ All Paid', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
              const isOverdue = this.common.isPast(p.value.dueDate);
              const isNear = !isOverdue && this.common.isWithinDays(p.value.dueDate, 7);
              const color = isOverdue ? 'var(--color-error)' : isNear ? 'var(--color-warning)' : 'var(--text-secondary)';
              const tag = isOverdue ? '⚠ Overdue' : isNear ? '⏰ Soon' : `#${p.value.installmentNumber}`;
              return this.twoLine(
                `<span style="color:${color};font-size:11px;font-weight:600;">${tag}</span>`,
                `${this.common.formatDate(p.value.dueDate)} · ${this.common.formatCurrency(p.value.totalAmount)}`,
                '',
                `font-size:10px;color:${color};`
              );
            },
          },

          // Last payment date
          {
            headerName: 'Last Paid',
            width: 120,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => {
              const paid = (p.data?.installments ?? [])
                .filter((i: any) => i.paymentStatus === 'paid')
                .sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
              return paid[0]?.dueDate ?? null;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              if (!p.value) return `<span style="color:var(--text-tertiary);font-size:10px;">No payments</span>`;
              return this.twoLine(
                this.common.formatDate(p.value),
                this.common.timeAgoText(p.value),
                'font-size:11px;color:var(--text-primary);',
                'font-size:10px;color:var(--text-tertiary);'
              );
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════════════════
      // GROUP: TENURE
      // ═══════════════════════════════════════════════════════════════════════
      {
        headerName: 'Tenure',
        children: [

          // Start → End date range
          {
            headerName: 'Start → End',
            minWidth: 190,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const start = this.common.formatDate(p.data?.emiStartDate);
              const end = this.common.formatDate(p.data?.emiEndDate);
              const days = p.data?.emiStartDate && p.data?.emiEndDate
                ? this.common.daysBetween(p.data.emiStartDate, p.data.emiEndDate)
                : 0;
              const months = Math.round(days / 30);
              return this.twoLine(
                `${start} <span style="color:var(--text-tertiary);margin:0 3px;">→</span> ${end}`,
                `${days} days · ~${months} months`,
                'font-size:11px;color:var(--text-primary);',
                'font-size:10px;color:var(--text-tertiary);'
              );
            },
          },

          // Tenure completion %
          {
            headerName: 'Elapsed',
            width: 115,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => {
              const start = p.data?.emiStartDate ? new Date(p.data.emiStartDate).getTime() : null;
              const end = p.data?.emiEndDate ? new Date(p.data.emiEndDate).getTime() : null;
              if (!start || !end) return null;
              const now = Date.now();
              const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
              return pct;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned || p.value === null) return '';
              const pct = p.value;
              const color = pct >= 100 ? 'var(--color-success)' : 'var(--accent-primary)';
              return `
              <div style="width:100%;">
                <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
                  <span style="font-size:10px;font-weight:600;color:${color};">${pct}%</span>
                </div>
                <div style="height:4px;border-radius:99px;background:var(--border-primary);overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;"></div>
                </div>
              </div>`;
            },
          },

          // Created at
          {
            field: 'createdAt',
            headerName: 'Created',
            width: 115,
            sortable: true,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned || !p.value) return '—';
              return this.twoLine(
                this.common.formatDate(p.value),
                this.common.timeAgoText(p.value),
                'font-size:11px;color:var(--text-primary);',
                'font-size:10px;color:var(--text-tertiary);'
              );
            },
          },
        ],
      },
    ];

    this.cdr.markForCheck();
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
