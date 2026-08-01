import { Component, OnInit, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

// Services
// import { MasterListService } from '../../../core/services/master-list.service';
import { FinancialService } from '../financial.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';

// Shared Components
import { DataGridComponent, GridColumn } from '../../../shared/ui/grid';
import { PageComponent } from '../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../shared/ui/layout/page-content/page-content.component';
import { TabBarComponent, TabItem } from '../../../shared/ui/tabs/tab-bar.component';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { AppMessageService } from '../../../core/services/message.service';

type LedgerTab =
  | 'all'
  | 'customer'
  | 'supplier'
  | 'orgSummary'
  | 'pnl'
  | 'balanceSheet'
  | 'trialBalance';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, SelectModule, IconFieldModule,
    InputTextModule, TooltipModule, SkeletonModule,
    DatePickerModule, DialogModule, RadioButtonModule,
    TagModule, CardModule, ToastModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    MasterDropdownComponent,
    TabBarComponent
  ],
  templateUrl: './ledger.html',
  styleUrls: ['./ledger.scss']
})
export class LedgerComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  // private master = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private financial = inject(FinancialService);
  private router = inject(Router);
  public common = inject(CommonMethodService);

  ledgerTabs: TabItem[] = [
    { id: 'all', label: 'Transactions', icon: 'pi pi-list' },
    { id: 'customer', label: 'Customer', icon: 'pi pi-users' },
    { id: 'supplier', label: 'Supplier', icon: 'pi pi-truck' },
    { id: 'orgSummary', label: 'Summary', icon: 'pi pi-chart-pie' },
    { id: 'pnl', label: 'P & L', icon: 'pi pi-chart-line' },
    { id: 'balanceSheet', label: 'Balance Sheet', icon: 'pi pi-book' },
    { id: 'trialBalance', label: 'Trial Balance', icon: 'pi pi-balance-scale' }
  ];

  activeTabId = signal<string>('all');
  currentTab = computed<LedgerTab>(() => this.activeTabId() as LedgerTab);
  gridData = signal<any[]>([]);
  reportData = signal<any>(null);
  entityDetails = signal<any>(null);
  gridColumns = signal<GridColumn[]>([]);
  isLoading = signal(false);
  nextCursor: { lastDate: string | null; lastId: string | null } | null = null;
  hasMore = true;
  showExportDialog = signal(false);
  isExporting = signal(false);
  filterForm!: FormGroup;
  exportForm!: FormGroup;

  pinnedBottomRowData = signal<any>(null);

  constructor() {
    effect(() => {
      this.initColumns(this.currentTab());
    });
  }

  onTabChange(tabId: any) {
    this.activeTabId.set(tabId);
    this.loadData(tabId as LedgerTab, true);
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadData(this.currentTab(), true);
  }

  private initializeForms() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.filterForm = this.fb.group({
      branchId: [null],
      dateRange: [[first, last]],
      customerId: [null],
      supplierId: [null],
      search: [""],
      accountId: [null],
      txnType: [null],
      minAmount: [null],
      maxAmount: [null],
      reference: [""]
    });
    this.exportForm = this.fb.group({
      exportType: ['all'],
      dateRange: [[first, last]],
      branchId: [null],
      specificId: [null]
    });
  }

  applyFilters() {
    this.loadData(this.currentTab(), true);
  }

  onDateClear() {
    this.filterForm.patchValue({ dateRange: null });
    this.applyFilters();
  }

  resetFilters() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.filterForm.reset({
      dateRange: [first, last],
      branchId: null,
      customerId: null,
      supplierId: null,
      search: "",
      accountId: null,
      txnType: null
    });
    this.applyFilters();
  }

  private getParams(resetCursor: boolean = false) {
    const v = this.filterForm.value;
    const params: any = {};
    if (v.branchId) params.branchId = v.branchId;
    if (v.dateRange && v.dateRange[0]) {
      params.startDate = v.dateRange[0].toISOString();
      params.endDate = v.dateRange[1]?.toISOString() || v.dateRange[0].toISOString();
    }
    if (this.currentTab() === 'customer' && v.customerId) params.customerId = v.customerId;
    if (this.currentTab() === 'supplier' && v.supplierId) params.supplierId = v.supplierId;
    if (v.search) params.search = v.search;
    if (v.accountId) params.accountId = v.accountId;
    if (v.txnType) params.txnType = v.txnType;
    if (v.minAmount) params.minAmount = v.minAmount;
    if (v.maxAmount) params.maxAmount = v.maxAmount;
    if (v.reference) params.reference = v.reference;
    if (!resetCursor && this.nextCursor) {
      params.lastDate = this.nextCursor.lastDate;
      params.lastId = this.nextCursor.lastId;
    }
    return params;
  }

  loadData(tab: LedgerTab, reset = false) {
    if (reset) {
      this.gridData.set([]);
      this.reportData.set(null);
      this.entityDetails.set(null);
      this.nextCursor = null;
      this.hasMore = true;
    }
    if (this.isLoading()) return;
    if (!this.canQuery(tab)) {
      const entity = tab === 'customer' ? 'Customer' : 'Supplier';
      this.messageService.showWarn(`Selection Required: Please select a ${entity} to view their ledger.`);
      return;
    }
    this.isLoading.set(true);
    const params = this.getParams(reset);
    let request: Observable<any>;
    switch (tab) {
      case 'all': request = this.financial.getAllLedgers(params); break;
      case 'customer': request = this.financial.getCustomerLedger(params.customerId, params); break;
      case 'supplier': request = this.financial.getSupplierLedger(params.supplierId, params); break;
      case 'orgSummary': request = this.financial.getOrgLedgerSummary(params); break;
      case 'pnl': request = this.financial.getProfitAndLoss(params); break;
      case 'balanceSheet': request = this.financial.getBalanceSheet(params); break;
      case 'trialBalance': request = this.financial.getTrialBalance(params); break;
      default: this.isLoading.set(false); return;
    }
    request.pipe(finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.processResponse(tab, res),
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  private processResponse(tab: LedgerTab, res: any) {
    if (res.status !== 'success') {
      this.messageService.showError(res.message || 'Failed to process ledger data.');
      return;
    }

    if (tab === 'all') {
      const rows = res.data ?? [];
      const formattedRows = rows.map((r: any) => ({ ...r, accountName: r.account?.name }));
      const merged = [...this.gridData(), ...formattedRows];
      this.gridData.set(merged);
      this.pinnedBottomRowData.set(this.computePinnedTotals('all', merged));
      this.nextCursor = res.nextCursor || null;
      this.hasMore = !!res.nextCursor;
      return;
    }

    if (tab === 'customer' || tab === 'supplier') {
      const history = res.history ?? [];
      this.gridData.set(history);
      this.pinnedBottomRowData.set(this.computePinnedTotals(tab, history));
      this.entityDetails.set({
        details: tab === 'customer' ? res.customer : res.supplier,
        openingBalance: res.openingBalance,
        closingBalance: res.closingBalance
      });
      return;
    }

    if (tab === 'trialBalance') {
      const rows = res.data.rows ?? [];
      this.gridData.set(rows);
      this.pinnedBottomRowData.set(this.computePinnedTotals('trialBalance', rows));
      this.reportData.set(res.data.totals);
      return;
    }

    if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
      this.reportData.set(res.data);
      return;
    }
  }

  private canQuery(tab: LedgerTab): boolean {
    const f = this.filterForm.value;
    if (tab === 'customer' && !f.customerId) return false;
    if (tab === 'supplier' && !f.supplierId) return false;
    return true;
  }

  private initColumns(tab: LedgerTab) {
    let cols: GridColumn[] = [];

    switch (tab) {
      case 'all':
        cols = [
          {
            field: 'date',
            header: 'Date',
            sortable: true,
            width: '140px',
            formatter: (val: any, row: any) =>
              row.date === null ? 'TOTALS' : this.common.formatDate(val, 'dd MMM yyyy')
          },
          {
            field: 'referenceNumber',
            header: 'Ref #',
            sortable: true,
            width: '160px'
          },
          {
            field: 'accountName',
            header: 'Account',
            sortable: true,
            width: '1fr',
            minWidth: '150px'
          },
          {
            field: 'description',
            header: 'Description',
            width: '2fr',
            minWidth: '250px'
          },
          {
            field: 'debit',
            header: 'Debit',
            sortable: true,
            width: '140px',
            type: 'number',
            formatter: (val) => val ? this.common.formatCurrency(val) : '—'
          },
          {
            field: 'credit',
            header: 'Credit',
            sortable: true,
            width: '140px',
            type: 'number',
            formatter: (val) => val ? this.common.formatCurrency(val) : '—'
          }
        ];
        break;

      case 'customer':
      case 'supplier':
        cols = [
          {
            field: 'date',
            header: 'Date',
            sortable: true,
            width: '140px',
            formatter: (val: any, row: any) =>
              row.date === null ? 'TOTALS' : this.common.formatDate(val, 'dd MMM yyyy')
          },
          {
            field: 'referenceNumber',
            header: 'Ref #',
            width: '160px'
          },
          {
            field: 'description',
            header: 'Description',
            width: '2fr',
            minWidth: '250px'
          },
          {
            field: 'debit',
            header: 'Debit',
            width: '140px',
            type: 'number',
            formatter: (val) => val ? this.common.formatCurrency(val) : '—'
          },
          {
            field: 'credit',
            header: 'Credit',
            width: '140px',
            type: 'number',
            formatter: (val) => val ? this.common.formatCurrency(val) : '—'
          },
          {
            field: 'balance',
            header: 'Balance',
            width: '150px',
            type: 'number',
            formatter: (val: any, row: any) =>
              (row.balance === null && !val) ? '' : String(this.common.formatCurrency(val))
          }
        ];
        break;

      case 'trialBalance':
        cols = [
          {
            field: 'accountCode',
            header: 'Code',
            width: '100px',
            formatter: (val: any, row: any) => row.accountCode === '' ? '' : String(val)
          },
          {
            field: 'accountName',
            header: 'Account Name',
            width: '2fr',
            sortable: true
          },
          {
            field: 'type',
            header: 'Type',
            width: '140px',
            type: 'status',
            formatter: (val: any, row: any) => {
              if (row.accountCode === '') return '';
              if (!val) return '—';
              return String(val);
            }
          },
          {
            field: 'debit',
            header: 'Debit',
            width: '160px',
            type: 'number',
            formatter: (val) => val ? this.common.formatCurrency(val) : '—'
          },
          {
            field: 'credit',
            header: 'Credit',
            width: '160px',
            type: 'number',
            formatter: (val) => val ? this.common.formatCurrency(val) : '—'
          }
        ];
        break;
    }

    this.gridColumns.set(cols);
  }

  private computePinnedTotals(tab: LedgerTab, rows: any[]): any[] {
    if (!rows.length) return [];

    if (tab === 'all') {
      const totalDebit = rows.reduce((s, r) => s + (r.debit || 0), 0);
      const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
      return [{ date: null, referenceNumber: '', accountName: 'TOTALS', description: '', debit: totalDebit, credit: totalCredit }];
    }

    if (tab === 'customer' || tab === 'supplier') {
      const totalDebit = rows.reduce((s, r) => s + (r.debit || 0), 0);
      const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
      return [{ date: null, referenceNumber: '', description: 'TOTALS', debit: totalDebit, credit: totalCredit, balance: null }];
    }

    if (tab === 'trialBalance') {
      const totalDebit = rows.reduce((s, r) => s + (r.debit || 0), 0);
      const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
      return [{ accountCode: '', accountName: 'TOTALS', type: null, debit: totalDebit, credit: totalCredit }];
    }

    return [];
  }

  onPageChange() {
    if (this.currentTab() === 'all' && this.hasMore) {
      this.loadData('all', false);
    }
  }

  onRowClick(row: any) {
    if (this.currentTab() === 'all') {
      if (row.invoiceId) {
        this.router.navigate(['/invoices', row.invoiceId]);
      }
    }
  }


  handleExportClick() {
    const tab = this.currentTab();
    const currentValues = this.filterForm.value;
    this.exportForm.patchValue({
      dateRange: currentValues.dateRange,
      branchId: currentValues.branchId
    });
    if (tab === 'customer' && currentValues.customerId) {
      this.exportForm.patchValue({ exportType: 'customer', specificId: currentValues.customerId });
      this.submitExportDialog();
    } else if (tab === 'supplier' && currentValues.supplierId) {
      this.exportForm.patchValue({ exportType: 'supplier', specificId: currentValues.supplierId });
      this.submitExportDialog();
    } else {
      this.exportForm.patchValue({ exportType: tab === 'all' ? 'all' : tab });
      this.showExportDialog.set(true);
    }
  }

  submitExportDialog() {
    this.showExportDialog.set(false);
    this.isExporting.set(true);

    const v = this.exportForm.value;
    const params: any = { format: 'csv' };

    if (v.dateRange?.[0]) params.startDate = v.dateRange[0].toISOString();
    if (v.dateRange?.[1]) params.endDate = v.dateRange[1].toISOString();
    if (v.branchId) params.branchId = v.branchId;

    const type = v.exportType;
    if (type === 'customer' || type === 'supplier') {
      params[`${type}Id`] = v.specificId;
    }

    let req$: Observable<Blob>;
    if (['all', 'customer', 'supplier'].includes(type)) {
      req$ = this.financial.exportLedgers(params);
    } else {
      req$ = this.financial.exportStatement(type, params);
    }

    req$.pipe(finalize(() => this.isExporting.set(false)), takeUntil(this.destroy$))
      .subscribe(blob => this.common.downloadBlob(blob, `ledger_${type}_${new Date().getTime()}.csv`));
  }

  get isReportView() { return ['orgSummary', 'pnl', 'balanceSheet'].includes(this.currentTab()); }
  get isEntityView() { return ['customer', 'supplier'].includes(this.currentTab()); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}