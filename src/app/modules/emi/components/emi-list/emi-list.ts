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

  // ─── Column definitions ──────────────────────────────────────────────────────
  private buildColumns(): void {
    this.column = [
      // Row index
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

      // ── Group: Loan Identity ──────────────────────────────────────────────
      {
        headerName: 'Loan Identity',
        children: [
          {
            headerName: 'Invoice / Customer',
            minWidth: 195,
            flex: 2,
            pinned: 'left',
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => p.data,
            cellRenderer: (p: any) => {
              const inv = p.value?.invoiceId?.invoiceNumber ?? '—';
              const cust = p.value?.customerId?.name ?? '—';
              const city = p.value?.customerId?.billingAddress?.city ?? '';
              const avatar = this.common.getAvatarStyle(cust);
              const initials = this.common.getInitials(cust);

              return `
                <div style="display:flex;align-items:center;gap:7px;width:100%;overflow:hidden;">
                  <span style="
                    width:24px;height:24px;border-radius:50%;flex-shrink:0;
                    background:${avatar.background};color:${avatar.color};
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:8px;font-weight:700;">
                    ${initials}
                  </span>
                  ${this.twoLine(
                inv,
                cust + (city ? ' · ' + city : ''),
                'font-size:11px;font-weight:700;color:var(--accent-primary);font-family:var(--font-mono);',
                'font-size:10px;color:var(--text-tertiary);'
              )}
                </div>`;
            },
          },

          {
            field: 'status',
            headerName: 'Status',
            width: 100,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (p: any) => {
              const themeMap: Record<string, [string, string, string]> = {
                active: ['var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)'],
                completed: ['var(--color-info-bg)', 'var(--color-info)', 'var(--color-info-border)'],
                closed: ['var(--bg-secondary)', 'var(--text-tertiary)', 'var(--border-primary)'],
                overdue: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
                defaulted: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
              };
              const [bg, color, bdr] =
                themeMap[p.value?.toLowerCase()] ??
                ['var(--bg-secondary)', 'var(--text-secondary)', 'var(--border-primary)'];
              return this.badge(p.value ?? '—', bg, color, bdr);
            },
          },
        ],
      },

      // ── Group: Loan Financials ────────────────────────────────────────────
      {
        headerName: 'Loan Financials',
        children: [
          {
            headerName: 'Amount / Down',
            width: 140,
            type: 'rightAligned',
            cellStyle: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 8px',
            },
            valueGetter: (p: any) => p.data,
            cellRenderer: (p: any) => {
              const total = p.value?.totalAmount ?? 0;
              const down = p.value?.downPayment ?? 0;
              return this.twoLine(
                this.common.formatCurrency(total),
                down ? `Down: ${this.common.formatCurrency(down)}` : '',
                'font-size:11px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);text-align:right;',
                'font-size:10px;color:var(--text-tertiary);text-align:right;'
              );
            },
          },

          {
            field: 'balanceAmount',
            headerName: 'Balance',
            width: 120,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
            cellRenderer: (p: any) => {
              const val = p.value ?? 0;
              if (val === 0) {
                return this.badge(
                  '✓ Cleared',
                  'var(--color-success-bg)',
                  'var(--color-success)',
                  'var(--color-success-border)'
                );
              }
              return `<span style="font-weight:700;color:var(--color-error);font-family:var(--font-mono);font-size:11px;">
                ${this.common.formatCurrency(val)}
              </span>`;
            },
          },

          {
            field: 'interestRate',
            headerName: 'Interest',
            width: 95,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
            cellRenderer: (p: any) => {
              const rate = p.value ?? 0;
              return rate > 0
                ? `<span style="font-size:11px;color:var(--color-warning);font-weight:600;">${rate}%</span>`
                : `<span style="font-size:10px;color:var(--text-tertiary);">0% · Free</span>`;
            },
          },

          {
            field: 'advanceBalance',
            headerName: 'Advance',
            width: 105,
            type: 'rightAligned',
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
            cellRenderer: (p: any) => {
              const val = p.value ?? 0;
              if (!val)
                return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
              return `<span style="color:var(--color-info);font-weight:600;font-family:var(--font-mono);font-size:11px;">
                ${this.common.formatCurrency(val)}
              </span>`;
            },
          },
        ],
      },

      // ── Group: Installment Progress ───────────────────────────────────────
      {
        headerName: 'Installment Progress',
        children: [
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

          {
            headerName: 'Progress',
            minWidth: 150,
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
              const { total, paid, overdue, pct } = p.value;
              const barColor =
                overdue > 0
                  ? 'var(--color-warning)'
                  : pct === 100
                    ? 'var(--color-success)'
                    : 'var(--accent-primary)';

              const overdueTag =
                overdue > 0
                  ? `<span style="color:var(--color-warning);font-size:9px;margin-left:3px;">(${overdue} late)</span>`
                  : '';

              return `
                <div style="width:100%;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:var(--text-primary);">
                      ${paid}/${total}${overdueTag}
                    </span>
                    <span style="font-size:10px;color:var(--text-tertiary);">${pct}%</span>
                  </div>
                  <div style="height:3px;border-radius:99px;background:var(--border-primary);overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;"></div>
                  </div>
                </div>`;
            },
          },

          {
            headerName: 'Next Due',
            minWidth: 140,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            valueGetter: (p: any) => {
              const pending = (p.data?.installments ?? [])
                .filter((i: any) => i.paymentStatus !== 'paid')
                .sort(
                  (a: any, b: any) =>
                    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                );
              return pending[0] ?? null;
            },
            cellRenderer: (p: any) => {
              if (!p.value) {
                return this.badge(
                  '✓ Done',
                  'var(--color-success-bg)',
                  'var(--color-success)',
                  'var(--color-success-border)'
                );
              }
              const isOverdue = this.common.isPast(p.value.dueDate);
              const isNear = !isOverdue && this.common.isWithinDays(p.value.dueDate, 7);
              const color = isOverdue
                ? 'var(--color-error)'
                : isNear
                  ? 'var(--color-warning)'
                  : 'var(--text-secondary)';
              const tag = isOverdue ? '⚠ Overdue' : isNear ? 'Soon' : '';
              const tagHtml = tag
                ? `<span style="color:${color};font-size:9px;font-weight:700;margin-right:3px;">${tag}</span>`
                : '';

              return this.twoLine(
                `${tagHtml}<span style="color:${color};">${this.common.formatDate(p.value.dueDate)}</span>`,
                this.common.formatCurrency(p.value.totalAmount)
              );
            },
          },
        ],
      },

      // ── Group: Tenure ─────────────────────────────────────────────────────
      {
        headerName: 'Tenure',
        children: [
          {
            headerName: 'Start → End',
            minWidth: 185,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            cellRenderer: (p: any) => {
              const start = this.common.formatDate(p.data?.emiStartDate);
              const end = this.common.formatDate(p.data?.emiEndDate);
              const days =
                p.data?.emiStartDate && p.data?.emiEndDate
                  ? this.common.daysBetween(p.data.emiStartDate, p.data.emiEndDate)
                  : 0;
              return this.twoLine(
                `${start} <span style="color:var(--text-tertiary);margin:0 3px;">→</span> ${end}`,
                `${days} days total`
              );
            },
          },

          {
            field: 'createdAt',
            headerName: 'Created',
            width: 110,
            sortable: true,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
            cellRenderer: (p: any) => {
              if (!p.value) return '—';
              return this.twoLine(
                this.common.formatDate(p.value),
                this.common.timeAgoText(p.value)
              );
            },
          },
        ],
      },
    ];

    // markForCheck is safe here — no risk of ExpressionChangedAfterItHasBeenChecked
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

// import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { GridApi } from 'ag-grid-community';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { EmiService } from '../../services/emi-service';
// import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
// import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '@core/auth/permissions.constants';
// import { CommonMethodService } from '@core/utils/common-method.service';
// import { ConfirmationService } from 'primeng/api';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';

// @Component({
//   selector: 'app-emi-list',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, RouterModule,
//     SelectModule, AutoCompleteModule, ButtonModule,
//     InputTextModule, ToastModule, AgShareGrid, HasPermissionDirective,
//     ConfirmDialogModule
//   ],
//   providers: [EmiService, ConfirmationService],
//   templateUrl: './emi-list.html',
//   styleUrl: './emi-list.scss',
// })
// export class EmiList implements OnInit {
//   readonly PERMISSIONS = PERMISSIONS;

//   readonly emiActionColumn: ActionColumnConfig = {
//     showView: true,
//     showEdit: false,
//     showDelete: true,
//     viewPermission: PERMISSIONS.EMI.READ,
//     deletePermission: PERMISSIONS.EMI.MANAGE,
//   };

//   private cdr = inject(ChangeDetectorRef);
//   private emiService = inject(EmiService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   public masterList = inject(MasterListService);
//   private router = inject(Router);
//   private gridApi!: GridApi;
//   public common = inject(CommonMethodService);

//   // Pagination State
//   private currentPage = 1;
//   private pageSize = 50;
//   private isLoading = false;
//   private totalCount = 0;
//   private hasNextPage = true;

//   data: any[] = [];
//   column: any[] = [];
//   rowSelectionMode: any = 'single';
//   customerOptions = signal<any[]>([]);
//   emiAnalytics = signal<any>(null);
//   emiFilter = { customerId: null, status: null };

//   statusOptions = [
//     { label: 'Active', value: 'active' },
//     { label: 'Completed', value: 'completed' },
//     { label: 'Defaulted', value: 'defaulted' },
//   ];

//   constructor() {
//     effect(() => {
//       this.customerOptions.set(this.masterList.customers());
//     });
//   }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//     this.fetchAnalytics();
//   }

//   fetchAnalytics() {
//     this.emiService.getEmiAnalytics(this.emiFilter).subscribe({
//       next: (res: any) => {
//         if (res.status === 'success') this.emiAnalytics.set(res.data);
//       },
//     });
//   }

//   applyFilters() {
//     this.getData(true);
//     this.fetchAnalytics();
//   }

//   resetFilters() {
//     this.emiFilter = { customerId: null, status: null };
//     this.getData(true);
//     this.fetchAnalytics();
//   }

//   onScrolledToBottom() {
//     if (!this.isLoading && this.hasNextPage) this.getData(false);
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'init') { this.gridApi = event.api; return; }
//     if (event.type === 'cellClicked') {
//       const emiId = event.row._id;
//       if (emiId) this.router.navigate(['/emis', emiId]);
//     }
//     if (event.type === 'delete') {
//       this.onDeleteEmi(event.row);
//     }
//     if (event.type === 'reachedBottom') this.onScrolledToBottom();
//   }

//   onDeleteEmi(row: any) {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to delete this EMI plan? This action cannot be undone.',
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       rejectButtonStyleClass: 'p-button-text',
//       accept: () => {
//         this.common.apiCall(
//           this.emiService.deleteEmi(row._id),
//           (res: any) => {
//             this.messageService.showSuccess('EMI plan deleted successfully.');
//             this.getData(true);
//             this.fetchAnalytics();
//           }
//         );
//       }
//     });
//   }

//   private getInstallmentStats(row: any) {
//     const list = row.installments || [];
//     const paid = list.filter((i: any) => i.paymentStatus === 'paid').length;
//     const next = list.find((i: any) => i.paymentStatus !== 'paid');
//     return { paid, total: list.length, next };
//   }

//   getData(isReset: boolean = false) {
//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//       this.hasNextPage = true;
//     }
//     if (this.isLoading || (!isReset && !this.hasNextPage)) return;
//     this.isLoading = true;

//     const filterParams = { ...this.emiFilter, page: this.currentPage, limit: this.pageSize };

//     this.emiService.getAllEmiData(filterParams).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) newData = res.data.data;
//         else if (res.data && Array.isArray(res.data)) newData = res.data;

//         if (res.pagination) {
//           this.hasNextPage = res.pagination.hasNextPage;
//           this.totalCount = res.pagination.totalResults;
//         } else {
//           this.hasNextPage = newData.length >= this.pageSize;
//           this.totalCount = res.results || 0;
//         }

//         this.data = isReset ? newData : [...this.data, ...newData];

//         if (this.gridApi && !isReset && newData.length > 0) {
//           this.gridApi.applyTransaction({ add: newData });
//         }

//         if (this.hasNextPage) this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.handleHttpError(err);
//         this.cdr.markForCheck();
//       },
//     });
//   }

//   /** Safe installment total for template use */
//   installmentTotal(a: any): number {
//     return (a.installments?.paid ?? 0) + (a.installments?.pending ?? 0) + (a.installments?.overdue ?? 0);
//   }

//   installmentPct(a: any): number {
//     const total = this.installmentTotal(a);
//     return total > 0 ? (a.installments.paid / total) * 100 : 0;
//   }


//   getColumn(): void {
//     this.column = [

//       {
//         headerName: '#',
//         valueGetter: 'node.rowIndex + 1',
//         width: 48,
//         sortable: false, filter: false, suppressHeaderMenuButton: true,
//         pinned: 'left',
//         cellStyle: {
//           color: 'var(--text-tertiary)', fontSize: '11px',
//           display: 'flex', alignItems: 'center', justifyContent: 'center'
//         }
//       },

//       {
//         headerName: 'Loan Identity',
//         children: [

//           {
//             headerName: 'Invoice / Customer',
//             minWidth: 195,
//             flex: 2,
//             pinned: 'left',
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => p.data,
//             cellRenderer: (p: any) => {
//               const inv = p.value?.invoiceId?.invoiceNumber || '—';
//               const cust = p.value?.customerId?.name || '—';
//               const city = p.value?.customerId?.billingAddress?.city || '';
//               const avatar = this.common.getAvatarStyle(cust);
//               const initials = this.common.getInitials(cust);

//               return `
//               <div style="display:flex; align-items:center; gap:7px; width:100%; overflow:hidden;">
//                 <span style="
//                   width:24px; height:24px; border-radius:50%; flex-shrink:0;
//                   background:${avatar.background}; color:${avatar.color};
//                   display:inline-flex; align-items:center; justify-content:center;
//                   font-size:8px; font-weight:700;">
//                   ${initials}
//                 </span>
//                 ${this.twoLine(
//                 inv,
//                 cust + (city ? ' · ' + city : ''),
//                 'font-size:11px; font-weight:700; color:var(--accent-primary); font-family:var(--font-mono);',
//                 'font-size:10px; color:var(--text-tertiary);'
//               )}
//               </div>`;
//             }
//           },

//           {
//             field: 'status',
//             headerName: 'Status',
//             width: 100,
//             cellStyle: { display: 'flex', alignItems: 'center' },
//             cellRenderer: (p: any) => {
//               const themeMap: Record<string, [string, string, string]> = {
//                 active: ['var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)'],
//                 completed: ['var(--color-info-bg)', 'var(--color-info)', 'var(--color-info-border)'],
//                 closed: ['var(--bg-secondary)', 'var(--text-tertiary)', 'var(--border-primary)'],
//                 overdue: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
//                 defaulted: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
//               };
//               const [bg, color, bdr] = themeMap[p.value?.toLowerCase()] ||
//                 ['var(--bg-secondary)', 'var(--text-secondary)', 'var(--border-primary)'];
//               return this.badge(p.value || '—', bg, color, bdr);
//             }
//           }
//         ]
//       },

//       {
//         headerName: 'Loan Financials',
//         children: [

//           {
//             headerName: 'Amount / Down',
//             width: 140,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             valueGetter: (p: any) => p.data,
//             cellRenderer: (p: any) => {
//               const total = p.value?.totalAmount || 0;
//               const down = p.value?.downPayment || 0;
//               return this.twoLine(
//                 this.common.formatCurrency(total),
//                 down ? `Down: ${this.common.formatCurrency(down)}` : '',
//                 'font-size:11px; font-weight:700; color:var(--text-primary); font-family:var(--font-mono); text-align:right;',
//                 'font-size:10px; color:var(--text-tertiary); text-align:right;'
//               );
//             }
//           },

//           {
//             field: 'balanceAmount',
//             headerName: 'Balance',
//             width: 120,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
//             cellRenderer: (p: any) => {
//               const val = p.value || 0;
//               if (val === 0) {
//                 return this.badge('✓ Cleared',
//                   'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
//               }
//               return `<span style="font-weight:700; color:var(--color-error);
//               font-family:var(--font-mono); font-size:11px;">
//               ${this.common.formatCurrency(val)}
//             </span>`;
//             }
//           },

//           {
//             field: 'interestRate',
//             headerName: 'Interest',
//             width: 95,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
//             cellRenderer: (p: any) => {
//               const rate = p.value || 0;
//               return rate > 0
//                 ? `<span style="font-size:11px; color:var(--color-warning); font-weight:600;">${rate}%</span>`
//                 : `<span style="font-size:10px; color:var(--text-tertiary);">0% · Free</span>`;
//             }
//           },

//           {
//             field: 'advanceBalance',
//             headerName: 'Advance',
//             width: 105,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
//             cellRenderer: (p: any) => {
//               const val = p.value || 0;
//               if (!val) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
//               return `<span style="color:var(--color-info); font-weight:600;
//               font-family:var(--font-mono); font-size:11px;">
//               ${this.common.formatCurrency(val)}
//             </span>`;
//             }
//           }
//         ]
//       },

//       {
//         headerName: 'Installment Progress',
//         children: [

//           {
//             field: 'numberOfInstallments',
//             headerName: 'EMIs',
//             width: 70,
//             type: 'rightAligned',
//             cellStyle: {
//               display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
//               fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)'
//             }
//           },

//           {
//             headerName: 'Progress',
//             minWidth: 150,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const list: any[] = p.data?.installments || [];
//               const total = list.length;
//               const paid = list.filter((i: any) => i.paymentStatus === 'paid').length;
//               const overdue = list.filter((i: any) =>
//                 i.paymentStatus !== 'paid' && this.common.isPast(i.dueDate)
//               ).length;
//               return { total, paid, overdue, pct: this.common.percent(paid, total, 0) };
//             },
//             cellRenderer: (p: any) => {
//               const { total, paid, overdue, pct } = p.value;
//               const barColor = overdue > 0
//                 ? 'var(--color-warning)'
//                 : pct === 100 ? 'var(--color-success)' : 'var(--accent-primary)';

//               return `
//               <div style="width:100%;">
//                 <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:3px;">
//                   <span style="font-size:11px; font-weight:600; color:var(--text-primary);">
//                     ${paid}/${total}
//                     ${overdue > 0
//                   ? `<span style="color:var(--color-warning); font-size:9px; margin-left:3px;">(${overdue} late)</span>`
//                   : ''}
//                   </span>
//                   <span style="font-size:10px; color:var(--text-tertiary);">${pct}%</span>
//                 </div>
//                 <div style="height:3px; border-radius:99px; background:var(--border-primary); overflow:hidden;">
//                   <div style="height:100%; width:${pct}%;
//                     background:${barColor}; border-radius:99px;"></div>
//                 </div>
//               </div>`;
//             }
//           },

//           {
//             headerName: 'Next Due',
//             minWidth: 140,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const pending = (p.data?.installments || [])
//                 .filter((i: any) => i.paymentStatus !== 'paid')
//                 .sort((a: any, b: any) =>
//                   new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
//               return pending[0] || null;
//             },
//             cellRenderer: (p: any) => {
//               if (!p.value) {
//                 return this.badge('✓ Done',
//                   'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
//               }
//               const isOverdue = this.common.isPast(p.value.dueDate);
//               const isNear = !isOverdue && this.common.isWithinDays(p.value.dueDate, 7);
//               const color = isOverdue ? 'var(--color-error)'
//                 : isNear ? 'var(--color-warning)'
//                   : 'var(--text-secondary)';
//               const tag = isOverdue ? '⚠ Overdue' : isNear ? 'Soon' : '';

//               return this.twoLine(
//                 (tag ? `<span style="color:${color}; font-size:9px; font-weight:700; margin-right:3px;">${tag}</span>` : '')
//                 + `<span style="color:${color};">${this.common.formatDate(p.value.dueDate)}</span>`,
//                 this.common.formatCurrency(p.value.totalAmount)
//               );
//             }
//           }
//         ]
//       },

//       {
//         headerName: 'Tenure',
//         children: [

//           {
//             headerName: 'Start → End',
//             minWidth: 185,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               const start = this.common.formatDate(p.data?.emiStartDate);
//               const end = this.common.formatDate(p.data?.emiEndDate);
//               const days = p.data?.emiStartDate && p.data?.emiEndDate
//                 ? this.common.daysBetween(p.data.emiStartDate, p.data.emiEndDate) : 0;
//               return this.twoLine(
//                 `${start} <span style="color:var(--text-tertiary); margin:0 3px;">→</span> ${end}`,
//                 `${days} days total`
//               );
//             }
//           },

//           {
//             field: 'createdAt',
//             headerName: 'Created',
//             width: 110,
//             sortable: true,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               if (!p.value) return '-';
//               return this.twoLine(
//                 this.common.formatDate(p.value),
//                 this.common.timeAgoText(p.value)
//               );
//             }
//           }
//         ]
//       }
//     ];

//     this.cdr.detectChanges();
//   }
//   private badge(
//     label: string,
//     bg: string, color: string, border: string
//   ): string {
//     return `<span style="
//     background:${bg};
//     color:${color};
//     border:1px solid ${border};
//     padding:1px 6px;
//     border-radius:3px;
//     font-size:10px;
//     font-weight:700;
//     letter-spacing:0.3px;
//     text-transform:uppercase;
//     white-space:nowrap;
//     line-height:1.4;
//     display:inline-block;">
//     ${label}
//   </span>`;
//   }

//   private twoLine(
//     top: string,
//     bottom: string,
//     topStyle = 'font-size:11px; color:var(--text-secondary);',
//     bottomStyle = 'font-size:10px; color:var(--text-tertiary);'
//   ): string {
//     return `
//     <div style="
//       display:flex; flex-direction:column;
//       justify-content:center; gap:0px;
//       line-height:1.25; overflow:hidden;">
//       <span style="${topStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${top}</span>
//       <span style="${bottomStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bottom}</span>
//     </div>`;
//   }

//   // getColumn(): void {
//   //   const c = this.common; // alias

//   //   this.column = [
//   //     {
//   //       headerName: '#',
//   //       valueGetter: 'node.rowIndex + 1',
//   //       width: 52,
//   //       sortable: false,
//   //       filter: false,
//   //       suppressMenu: true,
//   //       pinned: 'left',
//   //       cellStyle: { color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center' },
//   //     },
//   //     {
//   //       headerName: 'Invoice / Customer',
//   //       flex: 2.5,
//   //       minWidth: 190,
//   //       sortable: true,
//   //       filter: true,
//   //       valueGetter: (p: any) => p.data,
//   //       cellRenderer: (p: any) => {
//   //         const inv = p.value.invoiceId?.invoiceNumber || '—';
//   //         const cust = p.value.customerId?.name || '—';
//   //         const city = p.value.customerId?.billingAddress?.city || '';
//   //         return `
//   //           <div style="padding:4px 0;line-height:1.35">
//   //             <div style="font-weight:600;font-size:13px;color:var(--accent-primary);letter-spacing:.01em">${inv}</div>
//   //             <div style="font-size:11px;color:var(--text-secondary);margin-top:1px">${cust}${city ? ' · ' + city : ''}</div>
//   //           </div>`;
//   //       },
//   //     },
//   //     {
//   //       headerName: 'Loan Amount',
//   //       minWidth: 150,
//   //       sortable: true,
//   //       filter: 'agNumberColumnFilter',
//   //       valueGetter: (p: any) => ({ total: p.data.totalAmount, down: p.data.downPayment }),
//   //       cellRenderer: (p: any) => `
//   //         <div style="padding:4px 0;line-height:1.35">
//   //           <div style="font-weight:600;font-size:13px">${c.formatCurrency(p.value.total)}</div>
//   //           <div style="font-size:11px;color:var(--text-secondary);margin-top:1px">Down: ${c.formatCurrency(p.value.down)}</div>
//   //         </div>`,
//   //     },
//   //     {
//   //       headerName: 'Balance',
//   //       field: 'balanceAmount',
//   //       minWidth: 130,
//   //       sortable: true,
//   //       filter: 'agNumberColumnFilter',
//   //       cellRenderer: (p: any) => {
//   //         const isZero = !p.value || p.value === 0;
//   //         const color = isZero ? 'var(--color-success)' : 'var(--color-error)';
//   //         return `<span style="font-weight:700;font-size:13px;color:${color}">${c.formatCurrency(p.value)}</span>`;
//   //       },
//   //     },
//   //     {
//   //       headerName: 'Progress',
//   //       minWidth: 140,
//   //       valueGetter: (p: any) => this.getInstallmentStats(p.data),
//   //       cellRenderer: (p: any) => {
//   //         const pct = p.value.total > 0 ? Math.round((p.value.paid / p.value.total) * 100) : 0;
//   //         return `
//   //           <div style="padding:4px 0">
//   //             <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
//   //               <span style="font-size:12px;font-weight:600">${p.value.paid}/${p.value.total}</span>
//   //               <span style="font-size:10px;color:var(--text-secondary)">${pct}%</span>
//   //             </div>
//   //             <div style="height:4px;border-radius:4px;background:var(--bg-secondary);overflow:hidden">
//   //               <div style="height:100%;width:${pct}%;background:var(--accent-primary);border-radius:4px;transition:width .3s"></div>
//   //             </div>
//   //           </div>`;
//   //       },
//   //     },
//   //     {
//   //       headerName: 'Next Due',
//   //       minWidth: 150,
//   //       valueGetter: (p: any) => this.getInstallmentStats(p.data).next,
//   //       cellRenderer: (p: any) => {
//   //         if (!p.value) return `<span style="font-size:11px;color:var(--color-success);font-weight:600">✓ Completed</span>`;
//   //         const isPast = new Date(p.value.dueDate) < new Date();
//   //         const dateColor = isPast ? 'var(--color-error)' : 'var(--text-primary)';
//   //         return `
//   //           <div style="padding:4px 0;line-height:1.35">
//   //             <div style="font-size:12px;font-weight:600;color:${dateColor}">${c.formatDate(p.value.dueDate)}</div>
//   //             <div style="font-size:11px;color:var(--text-secondary)">${c.formatCurrency(p.value.totalAmount)}</div>
//   //           </div>`;
//   //       },
//   //     },
//   //     {
//   //       headerName: 'Tenure',
//   //       minWidth: 180,
//   //       cellRenderer: (p: any) => `
//   //         <div style="font-size:11px;color:var(--text-secondary);padding:4px 0;line-height:1.5">
//   //           <span>${c.formatDate(p.data.emiStartDate)}</span>
//   //           <span style="color:var(--border-primary);margin:0 4px">→</span>
//   //           <span>${c.formatDate(p.data.emiEndDate)}</span>
//   //         </div>`,
//   //     },
//   //     {
//   //       headerName: 'Inst.',
//   //       field: 'numberOfInstallments',
//   //       width: 75,
//   //       type: 'rightAligned',
//   //       sortable: true,
//   //       filter: 'agNumberColumnFilter',
//   //       cellStyle: { fontWeight: '600', fontSize: '13px' },
//   //     },
//   //     {
//   //       headerName: 'Status',
//   //       field: 'status',
//   //       width: 110,
//   //       sortable: true,
//   //       filter: true,
//   //       cellRenderer: (p: any) => {
//   //         const map: any = {
//   //           active: ['var(--color-success-bg)', 'var(--color-success-dark)'],
//   //           completed: ['var(--color-info-bg)', 'var(--color-info-dark)'],
//   //           closed: ['var(--color-info-bg)', 'var(--color-info-dark)'],
//   //           overdue: ['var(--color-error-bg)', 'var(--color-error-dark)'],
//   //           defaulted: ['var(--color-error-bg)', 'var(--color-error-dark)'],
//   //         };
//   //         const [bg, color] = map[p.value] || ['var(--bg-secondary)', 'var(--text-secondary)'];
//   //         return `<span style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:${bg};color:${color}">${p.value}</span>`;
//   //       },
//   //     },
//   //     {
//   //       headerName: 'Created',
//   //       field: 'createdAt',
//   //       minWidth: 120,
//   //       sortable: true,
//   //       cellStyle: { fontSize: '12px', color: 'var(--text-secondary)' },
//   //       valueFormatter: (p: any) => c.formatDate(p.value),
//   //     },
//   //   ];

//   //   this.cdr.detectChanges();
//   // }
// }
