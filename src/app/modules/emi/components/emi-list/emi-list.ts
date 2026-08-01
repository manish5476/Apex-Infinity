import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { GridApi } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectFilterComponent } from '@shared/ui/filters/select-filter.component';
// Services & Shared
import { AppMessageService } from '../../../../core/services/message.service';
import { EmiService } from '../../services/emi-service';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CommonMethodService } from '@core/utils/common-method.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { DataGridComponent } from '@shared/ui/grid';
import { GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { ConfirmationService } from 'primeng/api';
@Component({
  selector: 'app-emi-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SelectModule,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DataGridComponent,
    HasPermissionDirective,
    ConfirmDialogModule,
    MasterDropdownComponent,
    PageComponent, PageHeaderComponent, PageContentComponent,
    SelectFilterComponent
  ],
  providers: [EmiService, ConfirmationService],
  templateUrl: './emi-list.html',
  styles: [`
    .stat-card {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      transition: var(--transition-base);

      &:hover { border-color: var(--border-secondary); box-shadow: var(--elevation-2); }

      .stat-icon {
        width: 2.5rem; height: 2.5rem;
        border-radius: var(--ui-border-radius-md);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; font-size: var(--font-size-lg);
      }

      .stat-body {
        display: flex; flex-direction: column; gap: 2px; min-width: 0;
      }

      .stat-label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .stat-value {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        font-family: var(--font-mono);
        color: var(--text-primary);
        line-height: var(--line-height-tight);
      }

      .stat-value-sm {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        font-family: var(--font-mono);
        color: var(--text-primary);
      }

      .stat-total { font-size: var(--font-size-sm); color: var(--text-tertiary); margin-left: 4px; }
      .stat-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px;}
      .stat-pct { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--accent-primary); }

      &.outstanding-card .stat-icon { background: var(--color-error-bg); color: var(--color-error-dark); }
      &.plans-card .stat-icon { background: var(--color-info-bg); color: var(--color-info-dark); }
      &.progress-card .stat-icon { background: var(--color-success-bg); color: var(--color-success-dark); }
      &.overdue-card .stat-icon { background: var(--bg-ternary); color: var(--text-secondary); }
      
      &.alert-state {
        border-color: var(--color-error-border);
        background: color-mix(in srgb, var(--color-error-bg) 40%, var(--bg-secondary) 60%);
        .stat-icon { background: var(--color-error); color: var(--bg-primary); }
        .stat-value, .stat-sub { color: var(--color-error-dark); }
      }
    }

    .plan-badges {
      display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap; margin-top: var(--spacing-xs);
    }

    .progress-track {
      height: 4px;
      border-radius: var(--ui-border-radius-pill);
      background: var(--border-primary);
      margin-top: var(--spacing-sm);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      transition: width 0.4s ease;
    }

    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 10px; border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
      text-transform: uppercase; letter-spacing: 0.05em;
      border: var(--ui-border-width) solid transparent;
      .dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
    }

    .badge-success-soft { background: var(--color-success-bg); color: var(--color-success-dark); border-color: var(--color-success-border); }
    .badge-danger-soft { background: var(--color-error-bg); color: var(--color-error-dark); border-color: var(--color-error-border); }
    .badge-warning-soft { background: var(--color-warning-bg); color: var(--color-warning-dark); border-color: var(--color-warning-border); }
    .badge-info-soft { background: var(--color-info-bg); color: var(--color-info-dark); border-color: var(--color-info-border); }
    .badge-neutral-soft { background: var(--bg-ternary); color: var(--text-secondary); border-color: var(--border-primary); }
  `]
})
export class EmiList implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS;

  rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      label: 'View',
      callback: (row: any) => this.router.navigate(['/emis', row._id])
    },
    {
      id: 'delete',
      icon: 'pi pi-trash',
      label: 'Delete',
      variant: 'danger',
      callback: (row: any) => this.confirmDeleteEmi(row)
    }
  ];

  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Defaulted', value: 'defaulted' },
  ];

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly emiService = inject(EmiService);
  private readonly messageService = inject(AppMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  public readonly common = inject(CommonMethodService);
  private readonly destroy$ = new Subject<void>();
  private currentPage = 1;
  private readonly pageSize = 50;
  isLoading = false;
  totalCount = 0;
  private hasNextPage = true;

  readonly emiAnalytics = signal<any>(null);

  emiFilter: { customerId: string | null; status: string | null } = {
    customerId: null,
    status: null,
  };

  data: any[] = [];
  column: any[] = [];
  readonly rowSelectionMode = 'single';

  ngOnInit(): void {
    this.buildColumns();
    this.loadData(true);
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    this.loadData(true);
    this.loadAnalytics();
  }

  resetFilters(): void {
    this.emiFilter = { customerId: null, status: null };
    this.loadData(true);
    this.loadAnalytics();
  }

  
  onRowDoubleClick(row: any): void {
    if (row && row._id) this.router.navigate(['/emis', row._id]);
  }

  onPageChange(event: any): void {
    // Standard data grid emits pageChange. We just load the next page if needed.
    // If the grid handles its own page numbers, we update our currentPage.
    if (event?.pageIndex !== undefined) {
      this.currentPage = event.pageIndex + 1;
    }
    if (!this.isLoading && this.hasNextPage) {
      this.loadData(false);
    }
  }
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

      
    }

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
          }

          if (this.hasNextPage) this.currentPage++;
        },
        error: (err) => this.messageService.handleHttpError(err),
      });
  }

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

  // ─── Inline Cell Renderers using Theme Tokens ──────────────────────────────
  private badge(label: string, themeClass: string): string {
    return `<span class="grid-badge ${themeClass}">${label}</span>`;
  }

  private twoLine(top: string, bottom: string, topClass = 'text-sm font-bold text-primary', bottomClass = 'text-xs text-tertiary'): string {
    return `<div class="cell-stack"><span class="ellipsis ${topClass}">${top}</span><span class="ellipsis ${bottomClass}">${bottom}</span></div>`;
  }

  private buildColumns(): void {
    this.column = [
      { field: 'invoiceId.invoiceNumber', header: 'Invoice', width: '130px',
        formatter: (val: any, row: any) => row.invoiceId?.invoiceNumber ?? '—'
      },
      { field: 'customerId.name', header: 'Customer', width: '150px',
        formatter: (val: any, row: any) => row.customerId?.name ?? '—'
      },
      { field: 'customerId.phone', header: 'Phone', width: '130px',
        formatter: (val: any, row: any) => row.customerId?.phone ?? '—'
      },
      { field: 'status', header: 'Status', width: '110px', type: 'status' },
      { field: 'totalAmount', header: 'Total Amt', width: '120px', type: 'currency' },
      { field: 'balanceAmount', header: 'Outstanding', width: '120px', type: 'currency' },
      { field: 'interestRate', header: 'Interest', width: '90px', type: 'percentage' },
      { field: 'progress', header: 'Progress', width: '150px', type: 'slider',
        formatter: (val: any, row: any) => {
          const list = row.installments ?? [];
          const total = list.reduce((s: any, i: any) => s + (i.totalAmount ?? 0), 0);
          const paid = list.reduce((s: any, i: any) => s + (i.paidAmount ?? 0), 0);
          return total > 0 ? Math.round((paid / total) * 100) : 0;
        }
      },
      { field: 'emiStartDate', header: 'Start Date', width: '110px', type: 'date' },
      { field: 'emiEndDate', header: 'End Date', width: '110px', type: 'date' },
    ];
    this.cdr.markForCheck();
  }
}