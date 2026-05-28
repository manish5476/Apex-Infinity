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
import { ConfirmationService } from 'primeng/api';

// Services & Shared
import { AppMessageService } from '../../../../core/services/message.service';
import { EmiService } from '../../services/emi-service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CommonMethodService } from '@core/utils/common-method.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

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
    AgShareGrid,
    HasPermissionDirective,
    ConfirmDialogModule,
    MasterDropdownComponent
  ],
  providers: [EmiService, ConfirmationService],
  template: `
    <p-toast position="bottom-right"></p-toast>
    <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>

    <div class="page-layout">
      
      <header class="list-header elevation-card">
        <div class="header-left">
          <div class="icon-box">
            <i class="pi pi-calendar-clock"></i>
          </div>
          <div class="header-titles">
            <h1>EMI Schedules</h1>
            <p>Track installment payments & recovery</p>
          </div>
        </div>

        <div class="header-actions">
          <p-button *hasPermission="PERMISSIONS.EMI.CREATE" 
            label="New EMI Plan" icon="pi pi-plus" 
            routerLink="create"
            styleClass="p-button-primary">
          </p-button>
        </div>
      </header>

      @if (emiAnalytics()) {
        <div class="analytics-strip">
          
          <div class="stat-card elevation-card outstanding-card">
            <div class="stat-icon"><i class="pi pi-indian-rupee"></i></div>
            <div class="stat-body">
              <span class="stat-label">Total Outstanding</span>
              <span class="stat-value text-error">{{ common.formatCurrency(emiAnalytics().totalOutstanding) }}</span>
            </div>
          </div>

          <div class="stat-card elevation-card plans-card">
            <div class="stat-icon"><i class="pi pi-list-check"></i></div>
            <div class="stat-body">
              <span class="stat-label">EMI Plans</span>
              <div class="plan-badges">
                <span class="status-pill badge-success-soft">
                  <span class="dot"></span>{{ emiAnalytics().active }} Active
                </span>
                <span class="status-pill badge-info-soft">
                  <span class="dot"></span>{{ emiAnalytics().completed }} Done
                </span>
                <span class="status-pill" [ngClass]="emiAnalytics().defaulted > 0 ? 'badge-danger-soft' : 'badge-neutral-soft'">
                  <span class="dot"></span>{{ emiAnalytics().defaulted }} Late
                </span>
              </div>
            </div>
          </div>

          <div class="stat-card elevation-card progress-card">
            <div class="stat-icon"><i class="pi pi-chart-pie"></i></div>
            <div class="stat-body flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <span class="stat-label">Installments Paid</span>
                <span class="stat-pct">{{ installmentPct(emiAnalytics()).toFixed(1) }}%</span>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="stat-value-sm">{{ emiAnalytics().installments.paid }}</span>
                <span class="stat-total">/ {{ installmentTotal(emiAnalytics()) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="installmentPct(emiAnalytics())"></div>
              </div>
            </div>
          </div>

          <div class="stat-card elevation-card overdue-card" [class.alert-state]="emiAnalytics().installments.overdue > 0">
            <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
            <div class="stat-body">
              <span class="stat-label">Overdue</span>
              <span class="stat-value">{{ emiAnalytics().installments.overdue }}</span>
              @if (emiAnalytics().installments.overdue > 0) {
                <span class="stat-sub">installments pending</span>
              }
            </div>
          </div>

        </div>
      }

      <div class="filter-panel elevation-card">
        <div class="filter-grid">
          
          <div class="filter-field">
            <label>Customer</label>
            <app-master-dropdown 
              endpoint="customers" 
              [(ngModel)]="emiFilter.customerId" 
              (ngModelChange)="applyFilters()" 
              placeholder="All customers">
            </app-master-dropdown>
          </div>

          <div class="filter-field">
            <label>Status</label>
            <p-select 
              appendTo="body" 
              [options]="statusOptions" 
              [(ngModel)]="emiFilter.status"
              (onChange)="applyFilters()" 
              optionLabel="label" 
              optionValue="value" 
              [showClear]="true" 
              placeholder="All statuses"
              styleClass="w-full theme-control" 
              [filter]="true" 
              filterBy="label">
            </p-select>
          </div>

        </div>

        <div class="filter-actions">
          <p-button label="Reset" icon="pi pi-refresh" 
            styleClass="p-button-text theme-btn-secondary"
            (onClick)="resetFilters()">
          </p-button>
        </div>
      </div>

      <div class="grid-wrapper elevation-card">
        <app-ag-share-grid 
          class="full-size-grid"
          [columns]="column" 
          [data]="data" 
          [actionColumn]="emiActionColumn" 
          selectionMode="multiple"
          (gridEvent)="eventFromGrid($event)">
        </app-ag-share-grid>
      </div>

    </div>
  `,
  styles: [`
    /* =========================================================
       EMI LIST - SINGLE FILE COMPONENT STYLES
       ========================================================= */

    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: var(--font-body);
    }

    /* Layout Skeleton */
    .page-layout {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      padding: var(--spacing-2xl);
      gap: var(--spacing-xl);
      overflow: hidden;
    }

    /* Shared Card Styles */
    .elevation-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-sm);
    }

    /* ── HEADER ── */
    .list-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-2xl);
      flex-wrap: wrap;
      gap: var(--spacing-lg);

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);

        .icon-box {
          width: 3rem;
          height: 3rem;
          background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
          color: var(--accent-primary);
          border-radius: var(--ui-border-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xl);
        }

        .header-titles {
          h1 {
            font-family: var(--font-heading);
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            color: var(--text-primary);
            margin: 0 0 2px 0;
          }
          p {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin: 0;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-md);
      }
    }

    /* ── ANALYTICS STRIP ── */
    .analytics-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-xl);
      flex-shrink: 0;

      @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

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

      /* Variants */
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

    /* ── FILTER PANEL ── */
    .filter-panel {
      flex-shrink: 0;
      padding: var(--spacing-lg) var(--spacing-2xl);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-xl);
      flex-wrap: wrap;

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--spacing-lg);
        flex: 1;
      }

      .filter-field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);

        label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin: 0;
        }
      }

      .filter-actions {
        display: flex;
        align-items: center;
      }
    }

    /* ── AG GRID WRAPPER ── */
    .grid-wrapper {
      flex: 1;           /* Take all remaining space */
      min-height: 0;     /* CRITICAL: Prevent grid blowout */
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .full-size-grid {
        flex: 1;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        ::ng-deep ag-grid-angular {
          width: 100%;
          height: 100%;
          flex: 1;
        }

        ::ng-deep .ag-root-wrapper {
          border: none !important;
          border-radius: var(--ui-border-radius-lg);
        }
      }
    }

    /* ==========================================================================
       GLOBAL INJECTED STYLES FOR CELL RENDERERS
       ========================================================================== */
    ::ng-deep {
      
      /* Layout & Alignments */
      .cell-flex-center { display: flex; align-items: center; height: 100%; }
      .cell-flex-end { display: flex; align-items: center; justify-content: flex-end; height: 100%; }
      .cell-stack { display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 2px; }
      
      /* Spacing & Utilities */
      .gap-xs { gap: var(--spacing-xs); }
      .gap-sm { gap: var(--spacing-sm); }
      .px-sm { padding: 0 var(--spacing-sm) !important; }
      .w-full { width: 100%; }
      .flex-1 { flex: 1; }
      .justify-between { justify-content: space-between; }
      .items-center { align-items: center; }
      .items-baseline { align-items: baseline; }
      .mb-1 { margin-bottom: var(--spacing-xs); }
      .min-w-0 { min-width: 0; }

      /* Typography */
      .font-mono { font-family: var(--font-mono); }
      .font-semibold { font-weight: var(--font-weight-semibold); }
      .font-bold { font-weight: var(--font-weight-bold); }
      .text-right { text-align: right; }
      
      .text-xs { font-size: var(--font-size-xs); }
      .text-sm { font-size: var(--font-size-sm); }

      .text-primary { color: var(--text-primary); }
      .text-secondary { color: var(--text-secondary); }
      .text-tertiary { color: var(--text-tertiary); }
      .text-accent { color: var(--accent-primary); }
      .text-success { color: var(--color-success); }
      .text-warning { color: var(--color-warning); }
      .text-error { color: var(--color-error); }
      .text-info { color: var(--color-info); }

      .ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%; }

      /* Buttons & Utilities */
      .theme-btn-secondary {
        color: var(--text-secondary) !important;
        border-color: var(--border-secondary) !important;
        &:hover { background: var(--bg-ternary) !important; color: var(--text-primary) !important; }
      }

      /* Pill / Badges */
      .grid-badge {
        padding: 3px 10px;
        border-radius: var(--ui-border-radius-sm);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: var(--ui-border-width) solid transparent;
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

      .grid-progress-track {
        height: 4px; border-radius: 99px; background: var(--border-primary); overflow: hidden; width: 100%;
      }
      .grid-progress-fill {
        height: 100%; border-radius: 99px;
      }
    }
  `]
})
export class EmiList implements OnInit, OnDestroy {
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

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly emiService = inject(EmiService);
  private readonly messageService = inject(AppMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  public readonly common = inject(CommonMethodService);

  private readonly destroy$ = new Subject<void>();
  private gridApi!: GridApi;

  private currentPage = 1;
  private readonly pageSize = 50;
  private isLoading = false;
  private totalCount = 0;
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

      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', []);
      }
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
            if (this.gridApi && newRows.length > 0) {
              this.gridApi.applyTransaction({ add: newRows });
            }
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
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 48,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        pinned: 'left',
        cellClass: 'cell-flex-center text-tertiary text-xs justify-center'
      },
      {
        headerName: 'Loan Identity',
        children: [
          {
            headerName: 'Invoice / Customer',
            minWidth: 230,
            flex: 2,
            pinned: 'left',
            cellClass: 'cell-flex-center px-sm',
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
                <div style="display:flex;align-items:center;gap:12px;width:100%;overflow:hidden;">
                  <span style="width:32px;height:32px;border-radius:50%;flex-shrink:0;background:${avatar.background};color:${avatar.color};display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:var(--font-weight-bold);border:1px solid rgba(0,0,0,0.05);">${initials}</span>
                  ${this.twoLine(inv, cust + (location ? ' · ' + location : ''), 'text-sm font-bold text-accent font-mono', 'text-xs text-tertiary')}
                </div>`;
            },
          },
          {
            headerName: 'Contact',
            width: 160,
            cellClass: 'cell-flex-center px-sm',
            valueGetter: (p: any) => p.data?.customerId,
            cellRenderer: (p: any) => {
              const phone = p.value?.phone ?? '—';
              const email = p.value?.email ?? '';
              return this.twoLine(phone, email, 'text-sm font-semibold text-secondary font-mono', 'text-xs text-tertiary ellipsis');
            },
            tooltipValueGetter: (p: any) => `${p.data?.customerId?.phone ?? ''}\n${p.data?.customerId?.email ?? ''}`,
          },
          {
            field: 'status',
            headerName: 'Status',
            width: 130,
            sortable: true,
            cellClass: 'cell-flex-center',
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const map: Record<string, string> = {
                active: 'badge-success-soft',
                completed: 'badge-info-soft',
                closed: 'badge-neutral-soft',
                overdue: 'badge-danger-soft',
                defaulted: 'badge-danger-soft',
              };
              const themeClass = map[p.value?.toLowerCase()] ?? 'badge-neutral-soft';
              const icons: Record<string, string> = { active: '●', completed: '✓', closed: '○', overdue: '⚠', defaulted: '✗' };
              const icon = icons[p.value?.toLowerCase()] ?? '●';
              return this.badge(`${icon} ${p.value ?? '—'}`, themeClass);
            },
          },
        ],
      },
      {
        headerName: 'Loan Financials',
        children: [
          {
            headerName: 'Total / Down',
            width: 160,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            valueGetter: (p: any) => p.data,
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return `<span class="text-sm font-bold font-mono text-primary">${this.common.formatCurrency(p.value?.totalAmount ?? 0)}</span>`;
              const total = p.value?.totalAmount ?? 0;
              const down = p.value?.downPayment ?? 0;
              return this.twoLine(
                this.common.formatCurrency(total),
                down ? `↓ Down: ${this.common.formatCurrency(down)}` : 'No down payment',
                'text-sm font-bold text-primary font-mono text-right',
                'text-xs text-tertiary text-right'
              );
            },
          },
          {
            field: 'balanceAmount',
            headerName: 'Outstanding',
            width: 140,
            sortable: true,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            cellRenderer: (p: any) => {
              const val = p.value ?? 0;
              if (p.node?.rowPinned) return `<span class="text-sm font-bold font-mono text-error">${this.common.formatCurrency(val)}</span>`;
              if (val === 0) return this.badge('✓ Cleared', 'badge-success-soft');
              return `<span class="text-sm font-bold text-error font-mono">${this.common.formatCurrency(val)}</span>`;
            },
          },
          {
            field: 'interestRate',
            headerName: 'Interest',
            width: 105,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const rate = p.value ?? 0;
              return rate > 0 
                ? `<span class="text-sm text-warning font-bold">${rate}%</span>` 
                : `<span class="text-xs text-success font-bold">0% · Free</span>`;
            },
          },
          {
            field: 'advanceBalance',
            headerName: 'Advance',
            width: 125,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const val = p.value ?? 0;
              if (!val) return `<span class="text-xs text-tertiary">—</span>`;
              return `<span class="text-sm text-info font-bold font-mono">${this.common.formatCurrency(val)}</span>`;
            },
          },
          {
            headerName: 'Inv. Balance',
            width: 140,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            valueGetter: (p: any) => p.data?.invoiceId?.balanceAmount ?? null,
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const val = p.value;
              if (val === null) return `<span class="text-xs text-tertiary">—</span>`;
              if (val < 0) return this.twoLine(
                this.common.formatCurrency(Math.abs(val)), 'Overpaid',
                'text-sm font-bold text-success font-mono text-right', 'text-xs text-success text-right'
              );
              if (val === 0) return this.badge('✓ Settled', 'badge-success-soft');
              return `<span class="text-sm font-bold text-error font-mono">${this.common.formatCurrency(val)}</span>`;
            },
            tooltipValueGetter: (p: any) => {
              const val = p.data?.invoiceId?.balanceAmount;
              if (val === null || val === undefined) return '';
              return val < 0 ? `Overpaid by ${this.common.formatCurrency(Math.abs(val))}` : `Due: ${this.common.formatCurrency(val)}`;
            }
          },
        ],
      },
      {
        headerName: 'Installment Progress',
        children: [
          {
            field: 'numberOfInstallments',
            headerName: 'EMIs',
            width: 80,
            type: 'rightAligned',
            cellClass: 'cell-flex-end font-bold text-sm text-secondary',
          },
          {
            headerName: 'EMI / Month',
            width: 130,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            valueGetter: (p: any) => {
              const installments: any[] = p.data?.installments ?? [];
              return installments[0]?.totalAmount ?? 0;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              return `<span class="font-mono text-sm font-bold text-primary">${this.common.formatCurrency(p.value ?? 0)}</span>`;
            },
          },
          {
            headerName: 'Paid / Total',
            width: 165,
            type: 'rightAligned',
            cellClass: 'cell-flex-end px-sm',
            valueGetter: (p: any) => {
              const list: any[] = p.data?.installments ?? [];
              const paid = list.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
              const total = list.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
              return { paid, total };
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return `<span class="font-mono text-sm font-bold text-success">${this.common.formatCurrency(p.value?.paid ?? 0)}</span>`;
              const { paid, total } = p.value;
              return this.twoLine(
                this.common.formatCurrency(paid), `of ${this.common.formatCurrency(total)}`,
                'text-sm font-bold text-success font-mono text-right', 'text-xs text-tertiary text-right'
              );
            },
          },
          {
            headerName: 'Progress',
            minWidth: 170,
            cellClass: 'cell-flex-center px-sm w-full',
            valueGetter: (p: any) => {
              const list: any[] = p.data?.installments ?? [];
              const total = list.length;
              const paid = list.filter((i) => i.paymentStatus === 'paid').length;
              const overdue = list.filter((i) => i.paymentStatus !== 'paid' && this.common.isPast(i.dueDate)).length;
              return { total, paid, overdue, pct: this.common.percent(paid, total, 0) };
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const { total, paid, overdue, pct } = p.value;
              const barColor = overdue > 0 ? 'var(--color-warning)' : pct === 100 ? 'var(--color-success)' : 'var(--accent-primary)';
              const overdueTag = overdue > 0 ? `<span class="text-error text-xs font-bold ml-1">${overdue} late</span>` : '';
              return `
                <div class="w-full flex-center-col align-stretch justify-center h-full">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-primary">${paid}/${total} ${overdueTag}</span>
                    <span class="text-xs text-tertiary">${pct}%</span>
                  </div>
                  <div class="grid-progress-track">
                    <div class="grid-progress-fill" style="width:${pct}%; background:${barColor};"></div>
                  </div>
                </div>`;
            },
          },
          {
            headerName: 'Next Due',
            minWidth: 165,
            cellClass: 'cell-flex-center px-sm',
            valueGetter: (p: any) => {
              const pending = (p.data?.installments ?? [])
                .filter((i: any) => i.paymentStatus !== 'paid')
                .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
              return pending[0] ?? null;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              if (!p.value) return this.badge('✓ All Paid', 'badge-success-soft');
              const isOverdue = this.common.isPast(p.value.dueDate);
              const isNear = !isOverdue && this.common.isWithinDays(p.value.dueDate, 7);
              const colorClass = isOverdue ? 'text-error' : isNear ? 'text-warning' : 'text-secondary';
              const tag = isOverdue ? '⚠ Overdue' : isNear ? '⏰ Soon' : `#${p.value.installmentNumber}`;
              return this.twoLine(
                `<span class="${colorClass} text-xs font-bold">${tag}</span>`,
                `${this.common.formatDate(p.value.dueDate)} · ${this.common.formatCurrency(p.value.totalAmount)}`,
                '', `${colorClass} text-xs`
              );
            },
          },
          {
            headerName: 'Last Paid',
            width: 130,
            cellClass: 'cell-flex-center px-sm',
            valueGetter: (p: any) => {
              const paid = (p.data?.installments ?? [])
                .filter((i: any) => i.paymentStatus === 'paid')
                .sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
              return paid[0]?.dueDate ?? null;
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              if (!p.value) return `<span class="text-xs text-tertiary">No payments</span>`;
              return this.twoLine(
                this.common.formatDate(p.value), this.common.timeAgoText(p.value),
                'text-sm text-primary font-semibold', 'text-xs text-tertiary'
              );
            },
          },
        ],
      },
      {
        headerName: 'Tenure',
        children: [
          {
            headerName: 'Start → End',
            minWidth: 200,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned) return '';
              const start = this.common.formatDate(p.data?.emiStartDate);
              const end = this.common.formatDate(p.data?.emiEndDate);
              const days = p.data?.emiStartDate && p.data?.emiEndDate ? this.common.daysBetween(p.data.emiStartDate, p.data.emiEndDate) : 0;
              const months = Math.round(days / 30);
              return this.twoLine(
                `${start} <span class="text-tertiary mx-1">→</span> ${end}`,
                `${days} days · ~${months} months`,
                'text-xs text-primary font-semibold', 'text-xs text-tertiary'
              );
            },
          },
          {
            headerName: 'Elapsed',
            width: 125,
            cellClass: 'cell-flex-center px-sm w-full',
            valueGetter: (p: any) => {
              const start = p.data?.emiStartDate ? new Date(p.data.emiStartDate).getTime() : null;
              const end = p.data?.emiEndDate ? new Date(p.data.emiEndDate).getTime() : null;
              if (!start || !end) return null;
              const now = Date.now();
              return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
            },
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned || p.value === null) return '';
              const pct = p.value;
              const color = pct >= 100 ? 'var(--color-success)' : 'var(--accent-primary)';
              return `
                <div class="w-full flex-center-col align-stretch justify-center h-full">
                  <div class="flex justify-end items-center mb-1">
                    <span class="text-xs font-bold" style="color:${color}">${pct}%</span>
                  </div>
                  <div class="grid-progress-track">
                    <div class="grid-progress-fill" style="width:${pct}%; background:${color};"></div>
                  </div>
                </div>`;
            },
          },
          {
            field: 'createdAt',
            headerName: 'Created',
            width: 125,
            sortable: true,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (p: any) => {
              if (p.node?.rowPinned || !p.value) return '—';
              return this.twoLine(
                this.common.formatDate(p.value), this.common.timeAgoText(p.value),
                'text-sm text-primary font-semibold', 'text-xs text-tertiary'
              );
            },
          },
        ],
      },
    ];

    this.cdr.markForCheck();
  }
}// import {
//   ChangeDetectionStrategy,
//   ChangeDetectorRef,
//   Component,
//   OnDestroy,
//   OnInit,
//   computed,
//   inject,
//   signal,
// } from '@angular/core';

// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { GridApi } from 'ag-grid-community';
// import { Subject } from 'rxjs';
// import { takeUntil, finalize } from 'rxjs/operators';

// import { AppMessageService } from '../../../../core/services/message.service';
// // import { MasterListService } from '../../../../core/services/master-list.service';
// import { EmiService } from '../../services/emi-service';
// import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
// import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '@core/auth/permissions.constants';
// import { CommonMethodService } from '@core/utils/common-method.service';
// import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

// @Component({
//   selector: 'app-emi-list',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     FormsModule,
//     RouterModule,
//     SelectModule,
//     AutoCompleteModule,
//     ButtonModule,
//     InputTextModule,
//     ToastModule,
//     AgShareGrid,
//     HasPermissionDirective,
//     ConfirmDialogModule,
//     MasterDropdownComponent
//   ],
//   providers: [EmiService, ConfirmationService],
//   templateUrl: './emi-list.html',
//   styleUrl: './emi-list.scss',
// })
// export class EmiList implements OnInit, OnDestroy {
//   // ─── Constants ───────────────────────────────────────────────────────────────
//   readonly PERMISSIONS = PERMISSIONS;

//   readonly emiActionColumn: ActionColumnConfig = {
//     showView: true,
//     showEdit: false,
//     showDelete: true,
//     viewPermission: PERMISSIONS.EMI.READ,
//     deletePermission: PERMISSIONS.EMI.MANAGE,
//   };

//   readonly statusOptions = [
//     { label: 'Active', value: 'active' },
//     { label: 'Completed', value: 'completed' },
//     { label: 'Defaulted', value: 'defaulted' },
//   ];

//   // ─── DI ──────────────────────────────────────────────────────────────────────
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly emiService = inject(EmiService);
//   private readonly messageService = inject(AppMessageService);
//   private readonly confirmationService = inject(ConfirmationService);
//   private readonly router = inject(Router);
//   // public readonly masterList = inject(MasterListService);
//   public readonly common = inject(CommonMethodService);

//   // ─── Lifecycle subjects ───────────────────────────────────────────────────────
//   private readonly destroy$ = new Subject<void>();

//   // ─── Grid API ────────────────────────────────────────────────────────────────
//   private gridApi!: GridApi;

//   // ─── Pagination state ────────────────────────────────────────────────────────
//   private currentPage = 1;
//   private readonly pageSize = 50;
//   private isLoading = false;
//   private totalCount = 0;
//   private hasNextPage = true;

//   // ─── Signals / state ─────────────────────────────────────────────────────────
//   /**
//    * Derived from masterList signal via computed — no effect() needed.
//    * This eliminates the signal-write-inside-effect memory/stack bug.
//    */
//   // readonly customerOptions = computed(() => this.masterList.customers());

//   readonly emiAnalytics = signal<any>(null);

//   emiFilter: { customerId: string | null; status: string | null } = {
//     customerId: null,
//     status: null,
//   };

//   data: any[] = [];
//   column: any[] = [];
//   readonly rowSelectionMode = 'single';

//   // ─── Lifecycle ───────────────────────────────────────────────────────────────
//   ngOnInit(): void {
//     this.buildColumns();
//     this.loadData(true);
//     this.loadAnalytics();
//   }

//   ngOnDestroy(): void {
//     // Completes all takeUntil pipes — no lingering subscriptions
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // ─── Filter actions ──────────────────────────────────────────────────────────
//   applyFilters(): void {
//     this.loadData(true);
//     this.loadAnalytics();
//   }

//   resetFilters(): void {
//     this.emiFilter = { customerId: null, status: null };
//     this.loadData(true);
//     this.loadAnalytics();
//   }

//   // ─── Grid events ─────────────────────────────────────────────────────────────
//   eventFromGrid(event: any): void {
//     switch (event.type) {
//       case 'init':
//         this.gridApi = event.api;
//         break;

//       case 'cellClicked': {
//         const id = event.row?._id;
//         if (id) this.router.navigate(['/emis', id]);
//         break;
//       }

//       case 'delete':
//         this.confirmDeleteEmi(event.row);
//         break;

//       case 'reachedBottom':
//         this.onScrolledToBottom();
//         break;
//     }
//   }

//   private onScrolledToBottom(): void {
//     if (!this.isLoading && this.hasNextPage) this.loadData(false);
//   }

//   // ─── Delete ──────────────────────────────────────────────────────────────────
//   private confirmDeleteEmi(row: any): void {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to delete this EMI plan? This action cannot be undone.',
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       rejectButtonStyleClass: 'p-button-text',
//       accept: () => this.deleteEmi(row),
//     });
//   }

//   private deleteEmi(row: any): void {
//     this.emiService
//       .deleteEmi(row._id)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           this.messageService.showSuccess('EMI plan deleted successfully.');
//           this.loadData(true);
//           this.loadAnalytics();
//         },
//         error: (err) => this.messageService.handleHttpError(err),
//       });
//   }

//   // ─── Data loading ────────────────────────────────────────────────────────────
//   private loadAnalytics(): void {
//     this.emiService
//       .getEmiAnalytics(this.emiFilter)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (res: any) => {
//           if (res?.status === 'success') {
//             this.emiAnalytics.set(res.data);
//           }
//         },
//         error: (err) => this.messageService.handleHttpError(err),
//       });
//   }

//   private loadData(isReset: boolean): void {
//     if (isReset) {
//       this.currentPage = 1;
//       this.hasNextPage = true;
//       this.totalCount = 0;
//       this.data = [];

//       // Clear the grid rows on reset to keep grid & data in sync
//       if (this.gridApi) {
//         this.gridApi.setGridOption('rowData', []);
//       }
//     }

//     // Guard: skip if already loading or nothing left to fetch
//     if (this.isLoading || !this.hasNextPage) return;

//     this.isLoading = true;

//     const params = {
//       ...this.emiFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     this.emiService
//       .getAllEmiData(params)
//       .pipe(
//         takeUntil(this.destroy$),
//         finalize(() => {
//           // Always reset loading flag whether success or error
//           this.isLoading = false;
//           this.cdr.markForCheck();
//         })
//       )
//       .subscribe({
//         next: (res: any) => {
//           const newRows: any[] = Array.isArray(res?.data?.data)
//             ? res.data.data
//             : Array.isArray(res?.data)
//               ? res.data
//               : [];

//           if (res?.pagination) {
//             this.hasNextPage = res.pagination.hasNextPage ?? false;
//             this.totalCount = res.pagination.totalResults ?? 0;
//           } else {
//             this.hasNextPage = newRows.length >= this.pageSize;
//             this.totalCount = res?.results ?? 0;
//           }

//           if (isReset) {
//             this.data = newRows;
//           } else {
//             this.data = [...this.data, ...newRows];
//             if (this.gridApi && newRows.length > 0) {
//               this.gridApi.applyTransaction({ add: newRows });
//             }
//           }

//           if (this.hasNextPage) this.currentPage++;
//         },
//         error: (err) => this.messageService.handleHttpError(err),
//       });
//   }

//   // ─── Template helpers ────────────────────────────────────────────────────────
//   installmentTotal(a: any): number {
//     return (
//       (a?.installments?.paid ?? 0) +
//       (a?.installments?.pending ?? 0) +
//       (a?.installments?.overdue ?? 0)
//     );
//   }

//   installmentPct(a: any): number {
//     const total = this.installmentTotal(a);
//     return total > 0 ? (a.installments.paid / total) * 100 : 0;
//   }

//   private buildColumns(): void {
//     this.column = [

//       // ── Row Index ─────────────────────────────────────────────────────────
//       {
//         headerName: '#',
//         valueGetter: 'node.rowIndex + 1',
//         width: 48,
//         sortable: false,
//         filter: false,
//         suppressHeaderMenuButton: true,
//         pinned: 'left',
//         cellStyle: {
//           color: 'var(--text-tertiary)',
//           fontSize: '11px',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//         },
//       },

//       // ═══════════════════════════════════════════════════════════════════════
//       // GROUP: LOAN IDENTITY
//       // ═══════════════════════════════════════════════════════════════════════
//       {
//         headerName: 'Loan Identity',
//         children: [

//           // Invoice + Customer stacked
//           {
//             headerName: 'Invoice / Customer',
//             minWidth: 210,
//             flex: 2,
//             pinned: 'left',
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => p.data,
//             cellRenderer: (p: any) => {
//               const inv = p.value?.invoiceId?.invoiceNumber ?? '—';
//               const cust = p.value?.customerId?.name ?? '—';
//               const city = p.value?.customerId?.billingAddress?.city ?? '';
//               const state = p.value?.customerId?.billingAddress?.state ?? '';
//               const location = [city, state].filter(Boolean).join(', ');
//               const avatar = this.common.getAvatarStyle(cust);
//               const initials = this.common.getInitials(cust);
//               return `
//               <div style="display:flex;align-items:center;gap:8px;width:100%;overflow:hidden;">
//                 <span style="
//                   width:26px;height:26px;border-radius:50%;flex-shrink:0;
//                   background:${avatar.background};color:${avatar.color};
//                   display:inline-flex;align-items:center;justify-content:center;
//                   font-size:9px;font-weight:700;">
//                   ${initials}
//                 </span>
//                 ${this.twoLine(
//                 inv,
//                 cust + (location ? ' · ' + location : ''),
//                 'font-size:11px;font-weight:700;color:var(--accent-primary);font-family:var(--font-mono);',
//                 'font-size:10px;color:var(--text-tertiary);'
//               )}
//               </div>`;
//             },
//           },

//           // Customer contact
//           {
//             headerName: 'Contact',
//             width: 145,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => p.data?.customerId,
//             cellRenderer: (p: any) => {
//               const phone = p.value?.phone ?? '—';
//               const email = p.value?.email ?? '';
//               return this.twoLine(
//                 `<span style="font-family:var(--font-mono);font-size:11px;">${phone}</span>`,
//                 `<span style="font-size:10px;color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;">${email}</span>`,
//               );
//             },
//             tooltipValueGetter: (p: any) =>
//               `${p.data?.customerId?.phone ?? ''}\n${p.data?.customerId?.email ?? ''}`,
//           },

//           // Status badge
//           {
//             field: 'status',
//             headerName: 'Status',
//             width: 115,
//             sortable: true,
//             cellStyle: { display: 'flex', alignItems: 'center' },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const map: Record<string, [string, string, string]> = {
//                 active: ['var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)'],
//                 completed: ['var(--color-info-bg)', 'var(--color-info)', 'var(--color-info-border)'],
//                 closed: ['var(--bg-secondary)', 'var(--text-tertiary)', 'var(--border-primary)'],
//                 overdue: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
//                 defaulted: ['var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)'],
//               };
//               const [bg, color, bdr] = map[p.value?.toLowerCase()] ?? ['var(--bg-secondary)', 'var(--text-secondary)', 'var(--border-primary)'];
//               const icons: Record<string, string> = {
//                 active: '●', completed: '✓', closed: '○', overdue: '⚠', defaulted: '✗'
//               };
//               const icon = icons[p.value?.toLowerCase()] ?? '●';
//               return this.badge(`${icon} ${p.value ?? '—'}`, bg, color, bdr);
//             },
//           },
//         ],
//       },

//       // ═══════════════════════════════════════════════════════════════════════
//       // GROUP: LOAN FINANCIALS
//       // ═══════════════════════════════════════════════════════════════════════
//       {
//         headerName: 'Loan Financials',
//         children: [

//           // Total + Down Payment stacked
//           {
//             headerName: 'Total / Down',
//             width: 150,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             valueGetter: (p: any) => p.data,
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) {
//                 return `<span style="font-weight:700;font-family:var(--font-mono);font-size:12px;color:var(--text-primary);">
//                 ${this.common.formatCurrency(p.value?.totalAmount ?? 0)}
//               </span>`;
//               }
//               const total = p.value?.totalAmount ?? 0;
//               const down = p.value?.downPayment ?? 0;
//               return this.twoLine(
//                 this.common.formatCurrency(total),
//                 down ? `↓ Down: ${this.common.formatCurrency(down)}` : 'No down payment',
//                 'font-size:12px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);text-align:right;',
//                 'font-size:10px;color:var(--text-tertiary);text-align:right;'
//               );
//             },
//           },

//           // Outstanding balance
//           {
//             field: 'balanceAmount',
//             headerName: 'Outstanding',
//             width: 130,
//             sortable: true,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) {
//                 return `<span style="font-weight:700;font-family:var(--font-mono);font-size:12px;color:var(--color-error);">
//                 ${this.common.formatCurrency(p.value ?? 0)}
//               </span>`;
//               }
//               const val = p.value ?? 0;
//               if (val === 0) return this.badge('✓ Cleared', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
//               return `<span style="font-weight:700;color:var(--color-error);font-family:var(--font-mono);font-size:12px;">
//               ${this.common.formatCurrency(val)}
//             </span>`;
//             },
//           },

//           // Interest rate
//           {
//             field: 'interestRate',
//             headerName: 'Interest',
//             width: 95,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const rate = p.value ?? 0;
//               return rate > 0
//                 ? `<span style="font-size:12px;color:var(--color-warning);font-weight:700;">${rate}%</span>`
//                 : `<span style="font-size:10px;color:var(--color-success);font-weight:600;">0% · Free</span>`;
//             },
//           },

//           // Advance balance
//           {
//             field: 'advanceBalance',
//             headerName: 'Advance',
//             width: 110,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const val = p.value ?? 0;
//               if (!val) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
//               return `<span style="color:var(--color-info);font-weight:700;font-family:var(--font-mono);font-size:12px;">
//               ${this.common.formatCurrency(val)}
//             </span>`;
//             },
//           },

//           // Invoice outstanding (from invoiceId.balanceAmount — negative means overpaid)
//           {
//             headerName: 'Inv. Balance',
//             width: 120,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             valueGetter: (p: any) => p.data?.invoiceId?.balanceAmount ?? null,
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const val = p.value;
//               if (val === null) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
//               if (val < 0) return this.twoLine(
//                 this.common.formatCurrency(Math.abs(val)),
//                 'Overpaid',
//                 'font-size:11px;font-weight:700;color:var(--color-success);font-family:var(--font-mono);text-align:right;',
//                 'font-size:10px;color:var(--color-success);text-align:right;'
//               );
//               if (val === 0) return this.badge('✓ Settled', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
//               return `<span style="font-weight:700;color:var(--color-error);font-family:var(--font-mono);font-size:11px;">
//               ${this.common.formatCurrency(val)}
//             </span>`;
//             },
//             tooltipValueGetter: (p: any) => {
//               const val = p.data?.invoiceId?.balanceAmount;
//               if (val === null || val === undefined) return '';
//               return val < 0 ? `Overpaid by ${this.common.formatCurrency(Math.abs(val))}` : `Due: ${this.common.formatCurrency(val)}`;
//             }
//           },
//         ],
//       },

//       // ═══════════════════════════════════════════════════════════════════════
//       // GROUP: INSTALLMENT PROGRESS
//       // ═══════════════════════════════════════════════════════════════════════
//       {
//         headerName: 'Installment Progress',
//         children: [

//           // EMI count
//           {
//             field: 'numberOfInstallments',
//             headerName: 'EMIs',
//             width: 70,
//             type: 'rightAligned',
//             cellStyle: {
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'flex-end',
//               fontWeight: '600',
//               fontSize: '12px',
//               color: 'var(--text-secondary)',
//             },
//           },

//           // EMI amount per installment (derived)
//           {
//             headerName: 'EMI / Month',
//             width: 120,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const installments: any[] = p.data?.installments ?? [];
//               return installments[0]?.totalAmount ?? 0;
//             },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const val = p.value ?? 0;
//               return `<span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text-primary);">
//               ${this.common.formatCurrency(val)}
//             </span>`;
//             },
//           },

//           // Paid vs total amount
//           {
//             headerName: 'Paid / Total',
//             width: 155,
//             type: 'rightAligned',
//             cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const list: any[] = p.data?.installments ?? [];
//               const paid = list.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
//               const total = list.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
//               return { paid, total };
//             },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) {
//                 return `<span style="font-weight:700;font-family:var(--font-mono);font-size:12px;color:var(--color-success);">
//                 ${this.common.formatCurrency(p.value?.paid ?? 0)}
//               </span>`;
//               }
//               const { paid, total } = p.value;
//               return this.twoLine(
//                 this.common.formatCurrency(paid),
//                 `of ${this.common.formatCurrency(total)}`,
//                 'font-size:12px;font-weight:700;color:var(--color-success);font-family:var(--font-mono);text-align:right;',
//                 'font-size:10px;color:var(--text-tertiary);text-align:right;'
//               );
//             },
//           },

//           // Visual progress bar
//           {
//             headerName: 'Progress',
//             minWidth: 160,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const list: any[] = p.data?.installments ?? [];
//               const total = list.length;
//               const paid = list.filter((i) => i.paymentStatus === 'paid').length;
//               const overdue = list.filter(
//                 (i) => i.paymentStatus !== 'paid' && this.common.isPast(i.dueDate)
//               ).length;
//               return { total, paid, overdue, pct: this.common.percent(paid, total, 0) };
//             },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const { total, paid, overdue, pct } = p.value;
//               const barColor = overdue > 0
//                 ? 'var(--color-warning)'
//                 : pct === 100
//                   ? 'var(--color-success)'
//                   : 'var(--accent-primary)';
//               const overdueTag = overdue > 0
//                 ? `<span style="color:var(--color-warning);font-size:9px;font-weight:700;margin-left:4px;">${overdue} late</span>`
//                 : '';
//               return `
//               <div style="width:100%;">
//                 <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
//                   <span style="font-size:11px;font-weight:600;color:var(--text-primary);">
//                     ${paid}/${total}${overdueTag}
//                   </span>
//                   <span style="font-size:10px;color:var(--text-tertiary);">${pct}%</span>
//                 </div>
//                 <div style="height:4px;border-radius:99px;background:var(--border-primary);overflow:hidden;">
//                   <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;transition:width .3s;"></div>
//                 </div>
//               </div>`;
//             },
//           },

//           // Next due installment
//           {
//             headerName: 'Next Due',
//             minWidth: 155,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const pending = (p.data?.installments ?? [])
//                 .filter((i: any) => i.paymentStatus !== 'paid')
//                 .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
//               return pending[0] ?? null;
//             },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               if (!p.value) return this.badge('✓ All Paid', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)');
//               const isOverdue = this.common.isPast(p.value.dueDate);
//               const isNear = !isOverdue && this.common.isWithinDays(p.value.dueDate, 7);
//               const color = isOverdue ? 'var(--color-error)' : isNear ? 'var(--color-warning)' : 'var(--text-secondary)';
//               const tag = isOverdue ? '⚠ Overdue' : isNear ? '⏰ Soon' : `#${p.value.installmentNumber}`;
//               return this.twoLine(
//                 `<span style="color:${color};font-size:11px;font-weight:600;">${tag}</span>`,
//                 `${this.common.formatDate(p.value.dueDate)} · ${this.common.formatCurrency(p.value.totalAmount)}`,
//                 '',
//                 `font-size:10px;color:${color};`
//               );
//             },
//           },

//           // Last payment date
//           {
//             headerName: 'Last Paid',
//             width: 120,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const paid = (p.data?.installments ?? [])
//                 .filter((i: any) => i.paymentStatus === 'paid')
//                 .sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
//               return paid[0]?.dueDate ?? null;
//             },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               if (!p.value) return `<span style="color:var(--text-tertiary);font-size:10px;">No payments</span>`;
//               return this.twoLine(
//                 this.common.formatDate(p.value),
//                 this.common.timeAgoText(p.value),
//                 'font-size:11px;color:var(--text-primary);',
//                 'font-size:10px;color:var(--text-tertiary);'
//               );
//             },
//           },
//         ],
//       },

//       // ═══════════════════════════════════════════════════════════════════════
//       // GROUP: TENURE
//       // ═══════════════════════════════════════════════════════════════════════
//       {
//         headerName: 'Tenure',
//         children: [

//           // Start → End date range
//           {
//             headerName: 'Start → End',
//             minWidth: 190,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned) return '';
//               const start = this.common.formatDate(p.data?.emiStartDate);
//               const end = this.common.formatDate(p.data?.emiEndDate);
//               const days = p.data?.emiStartDate && p.data?.emiEndDate
//                 ? this.common.daysBetween(p.data.emiStartDate, p.data.emiEndDate)
//                 : 0;
//               const months = Math.round(days / 30);
//               return this.twoLine(
//                 `${start} <span style="color:var(--text-tertiary);margin:0 3px;">→</span> ${end}`,
//                 `${days} days · ~${months} months`,
//                 'font-size:11px;color:var(--text-primary);',
//                 'font-size:10px;color:var(--text-tertiary);'
//               );
//             },
//           },

//           // Tenure completion %
//           {
//             headerName: 'Elapsed',
//             width: 115,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             valueGetter: (p: any) => {
//               const start = p.data?.emiStartDate ? new Date(p.data.emiStartDate).getTime() : null;
//               const end = p.data?.emiEndDate ? new Date(p.data.emiEndDate).getTime() : null;
//               if (!start || !end) return null;
//               const now = Date.now();
//               const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
//               return pct;
//             },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned || p.value === null) return '';
//               const pct = p.value;
//               const color = pct >= 100 ? 'var(--color-success)' : 'var(--accent-primary)';
//               return `
//               <div style="width:100%;">
//                 <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
//                   <span style="font-size:10px;font-weight:600;color:${color};">${pct}%</span>
//                 </div>
//                 <div style="height:4px;border-radius:99px;background:var(--border-primary);overflow:hidden;">
//                   <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;"></div>
//                 </div>
//               </div>`;
//             },
//           },

//           // Created at
//           {
//             field: 'createdAt',
//             headerName: 'Created',
//             width: 115,
//             sortable: true,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
//             cellRenderer: (p: any) => {
//               if (p.node?.rowPinned || !p.value) return '—';
//               return this.twoLine(
//                 this.common.formatDate(p.value),
//                 this.common.timeAgoText(p.value),
//                 'font-size:11px;color:var(--text-primary);',
//                 'font-size:10px;color:var(--text-tertiary);'
//               );
//             },
//           },
//         ],
//       },
//     ];

//     this.cdr.markForCheck();
//   }


//   // ─── Private renderer helpers ────────────────────────────────────────────────
//   private badge(label: string, bg: string, color: string, border: string): string {
//     return `<span style="
//       background:${bg};
//       color:${color};
//       border:1px solid ${border};
//       padding:1px 6px;
//       border-radius:3px;
//       font-size:10px;
//       font-weight:700;
//       letter-spacing:0.3px;
//       text-transform:uppercase;
//       white-space:nowrap;
//       line-height:1.4;
//       display:inline-block;">
//       ${label}
//     </span>`;
//   }

//   private twoLine(
//     top: string,
//     bottom: string,
//     topStyle = 'font-size:11px;color:var(--text-secondary);',
//     bottomStyle = 'font-size:10px;color:var(--text-tertiary);'
//   ): string {
//     return `
//       <div style="
//         display:flex;flex-direction:column;
//         justify-content:center;gap:0px;
//         line-height:1.25;overflow:hidden;">
//         <span style="${topStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top}</span>
//         <span style="${bottomStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bottom}</span>
//       </div>`;
//   }
// }
