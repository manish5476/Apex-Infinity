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
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CommonMethodService } from '@core/utils/common-method.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-emi-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    SelectModule, AutoCompleteModule, ButtonModule,
    InputTextModule, ToastModule, AgShareGrid, HasPermissionDirective,
    ConfirmDialogModule
  ],
  providers: [EmiService, ConfirmationService],
  templateUrl: './emi-list.html',
  styleUrl: './emi-list.scss',
})
export class EmiList implements OnInit {
  readonly PERMISSIONS = PERMISSIONS;

  readonly emiActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: true,
    viewPermission: PERMISSIONS.EMI.READ,
    deletePermission: PERMISSIONS.EMI.MANAGE,
  };

  private cdr = inject(ChangeDetectorRef);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private gridApi!: GridApi;
  public common = inject(CommonMethodService);

  // Pagination State
  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;
  private totalCount = 0;
  private hasNextPage = true;

  data: any[] = [];
  column: any[] = [];
  rowSelectionMode: any = 'single';
  customerOptions = signal<any[]>([]);
  emiAnalytics = signal<any>(null);
  emiFilter = { customerId: null, status: null };

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Defaulted', value: 'defaulted' },
  ];

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
    this.fetchAnalytics();
  }

  fetchAnalytics() {
    this.emiService.getEmiAnalytics(this.emiFilter).subscribe({
      next: (res: any) => {
        if (res.status === 'success') this.emiAnalytics.set(res.data);
      },
    });
  }

  applyFilters() {
    this.getData(true);
    this.fetchAnalytics();
  }

  resetFilters() {
    this.emiFilter = { customerId: null, status: null };
    this.getData(true);
    this.fetchAnalytics();
  }

  onScrolledToBottom() {
    if (!this.isLoading && this.hasNextPage) this.getData(false);
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') { this.gridApi = event.api; return; }
    if (event.type === 'cellClicked') {
      const emiId = event.row._id;
      if (emiId) this.router.navigate(['/emis', emiId]);
    }
    if (event.type === 'delete') {
      this.onDeleteEmi(event.row);
    }
    if (event.type === 'reachedBottom') this.onScrolledToBottom();
  }

  onDeleteEmi(row: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this EMI plan? This action cannot be undone.',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.common.apiCall(
          this.emiService.deleteEmi(row._id),
          (res: any) => {
            this.messageService.showSuccess('EMI plan deleted successfully.');
            this.getData(true);
            this.fetchAnalytics();
          }
        );
      }
    });
  }

  private getInstallmentStats(row: any) {
    const list = row.installments || [];
    const paid = list.filter((i: any) => i.paymentStatus === 'paid').length;
    const next = list.find((i: any) => i.paymentStatus !== 'paid');
    return { paid, total: list.length, next };
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

    const filterParams = { ...this.emiFilter, page: this.currentPage, limit: this.pageSize };

    this.emiService.getAllEmiData(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) newData = res.data.data;
        else if (res.data && Array.isArray(res.data)) newData = res.data;

        if (res.pagination) {
          this.hasNextPage = res.pagination.hasNextPage;
          this.totalCount = res.pagination.totalResults;
        } else {
          this.hasNextPage = newData.length >= this.pageSize;
          this.totalCount = res.results || 0;
        }

        this.data = isReset ? newData : [...this.data, ...newData];

        if (this.gridApi && !isReset && newData.length > 0) {
          this.gridApi.applyTransaction({ add: newData });
        }

        if (this.hasNextPage) this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      },
    });
  }

  /** Safe installment total for template use */
  installmentTotal(a: any): number {
    return (a.installments?.paid ?? 0) + (a.installments?.pending ?? 0) + (a.installments?.overdue ?? 0);
  }

  installmentPct(a: any): number {
    const total = this.installmentTotal(a);
    return total > 0 ? (a.installments.paid / total) * 100 : 0;
  }

  getColumn(): void {
    const c = this.common; // alias

    this.column = [
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 52,
        sortable: false,
        filter: false,
        suppressMenu: true,
        pinned: 'left',
        cellStyle: { color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center' },
      },
      {
        headerName: 'Invoice / Customer',
        flex: 2.5,
        minWidth: 190,
        sortable: true,
        filter: true,
        valueGetter: (p: any) => p.data,
        cellRenderer: (p: any) => {
          const inv = p.value.invoiceId?.invoiceNumber || '—';
          const cust = p.value.customerId?.name || '—';
          const city = p.value.customerId?.billingAddress?.city || '';
          return `
            <div style="padding:4px 0;line-height:1.35">
              <div style="font-weight:600;font-size:13px;color:var(--accent-primary);letter-spacing:.01em">${inv}</div>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:1px">${cust}${city ? ' · ' + city : ''}</div>
            </div>`;
        },
      },
      {
        headerName: 'Loan Amount',
        minWidth: 150,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueGetter: (p: any) => ({ total: p.data.totalAmount, down: p.data.downPayment }),
        cellRenderer: (p: any) => `
          <div style="padding:4px 0;line-height:1.35">
            <div style="font-weight:600;font-size:13px">${c.formatCurrency(p.value.total)}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:1px">Down: ${c.formatCurrency(p.value.down)}</div>
          </div>`,
      },
      {
        headerName: 'Balance',
        field: 'balanceAmount',
        minWidth: 130,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (p: any) => {
          const isZero = !p.value || p.value === 0;
          const color = isZero ? 'var(--color-success)' : 'var(--color-error)';
          return `<span style="font-weight:700;font-size:13px;color:${color}">${c.formatCurrency(p.value)}</span>`;
        },
      },
      {
        headerName: 'Progress',
        minWidth: 140,
        valueGetter: (p: any) => this.getInstallmentStats(p.data),
        cellRenderer: (p: any) => {
          const pct = p.value.total > 0 ? Math.round((p.value.paid / p.value.total) * 100) : 0;
          return `
            <div style="padding:4px 0">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12px;font-weight:600">${p.value.paid}/${p.value.total}</span>
                <span style="font-size:10px;color:var(--text-secondary)">${pct}%</span>
              </div>
              <div style="height:4px;border-radius:4px;background:var(--bg-secondary);overflow:hidden">
                <div style="height:100%;width:${pct}%;background:var(--accent-primary);border-radius:4px;transition:width .3s"></div>
              </div>
            </div>`;
        },
      },
      {
        headerName: 'Next Due',
        minWidth: 150,
        valueGetter: (p: any) => this.getInstallmentStats(p.data).next,
        cellRenderer: (p: any) => {
          if (!p.value) return `<span style="font-size:11px;color:var(--color-success);font-weight:600">✓ Completed</span>`;
          const isPast = new Date(p.value.dueDate) < new Date();
          const dateColor = isPast ? 'var(--color-error)' : 'var(--text-primary)';
          return `
            <div style="padding:4px 0;line-height:1.35">
              <div style="font-size:12px;font-weight:600;color:${dateColor}">${c.formatDate(p.value.dueDate)}</div>
              <div style="font-size:11px;color:var(--text-secondary)">${c.formatCurrency(p.value.totalAmount)}</div>
            </div>`;
        },
      },
      {
        headerName: 'Tenure',
        minWidth: 180,
        cellRenderer: (p: any) => `
          <div style="font-size:11px;color:var(--text-secondary);padding:4px 0;line-height:1.5">
            <span>${c.formatDate(p.data.emiStartDate)}</span>
            <span style="color:var(--border-primary);margin:0 4px">→</span>
            <span>${c.formatDate(p.data.emiEndDate)}</span>
          </div>`,
      },
      {
        headerName: 'Inst.',
        field: 'numberOfInstallments',
        width: 75,
        type: 'rightAligned',
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellStyle: { fontWeight: '600', fontSize: '13px' },
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 110,
        sortable: true,
        filter: true,
        cellRenderer: (p: any) => {
          const map: any = {
            active: ['var(--color-success-bg)', 'var(--color-success-dark)'],
            completed: ['var(--color-info-bg)', 'var(--color-info-dark)'],
            closed: ['var(--color-info-bg)', 'var(--color-info-dark)'],
            overdue: ['var(--color-error-bg)', 'var(--color-error-dark)'],
            defaulted: ['var(--color-error-bg)', 'var(--color-error-dark)'],
          };
          const [bg, color] = map[p.value] || ['var(--bg-secondary)', 'var(--text-secondary)'];
          return `<span style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:${bg};color:${color}">${p.value}</span>`;
        },
      },
      {
        headerName: 'Created',
        field: 'createdAt',
        minWidth: 120,
        sortable: true,
        cellStyle: { fontSize: '12px', color: 'var(--text-secondary)' },
        valueFormatter: (p: any) => c.formatDate(p.value),
      },
    ];

    this.cdr.detectChanges();
  }
}
