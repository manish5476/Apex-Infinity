import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

// Services
import { MasterListService } from '../../../core/services/master-list.service';
import { FinancialService } from '../financial.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';

// Shared Components
import { AgShareGrid } from "../../shared/components/ag-shared-grid";

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
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
    TabsModule, ButtonModule, SelectModule, IconFieldModule,
    InputTextModule, TooltipModule, SkeletonModule,
    DatePickerModule, DialogModule, RadioButtonModule,
    TagModule, CardModule,
    AgShareGrid
  ],
  templateUrl: './ledger.html',
  styleUrls: ['./ledger.scss']
})
export class LedgerComponent implements OnInit {

  // --- DEPENDENCIES ---
  private fb = inject(FormBuilder);
  private master = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private financial = inject(FinancialService);
  private router = inject(Router);
  public common = inject(CommonMethodService);

  // --- STATE SIGNALS ---
  tabIndex = signal(0);
  currentTab = computed<LedgerTab>(() => this.resolveTab(this.tabIndex()));

  // Data Containers
  gridData = signal<any[]>([]); // For Lists (All, Customer History, etc.)
  reportData = signal<any>(null); // For Summaries (Org, P&L, BS)
  entityDetails = signal<any>(null); // For Customer/Supplier specific headers

  gridColumns = signal<any[]>([]);
  isLoading = signal(false);

  // Pagination / Cursor
  nextCursor: { lastDate: string | null; lastId: string | null } | null = null;
  hasMore = true;

  // Export State
  showExportDialog = signal(false);
  isExporting = signal(false);

  // --- FORMS ---
  filterForm!: FormGroup;
  exportForm!: FormGroup;

  // --- COMPUTED OPTIONS ---
  customerOptions = computed(() => this.master.customers().map(c => ({ label: c.name, value: c._id })));
  supplierOptions = computed(() => this.master.suppliers().map(s => ({ label: s['companyName'], value: s._id })));
  branchOptions = computed(() => this.master.branches().map(b => ({ label: b.name, value: b._id })));
  accountOptions = computed(() => this.master.accounts().map(a => ({ label: a.name, value: a._id })));

  constructor() {
    // React to tab changes to set columns
    effect(() => {
      this.initColumns(this.currentTab());
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    // Initial load
    this.loadData(this.currentTab(), true);
  }

  // --- INITIALIZATION ---
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

  private resolveTab(i: number): LedgerTab {
    const map: LedgerTab[] = [
      'all', 'customer', 'supplier', 'orgSummary',
      'pnl', 'balanceSheet', 'trialBalance'
    ];
    return map[i] || 'all';
  }

  // --- FILTERING ---
  applyFilters() {
    this.loadData(this.currentTab(), true);
  }

  private getParams(resetCursor: boolean = false) {
    const v = this.filterForm.value;
    const params: any = {};
    if (v.branchId) params.branchId = v.branchId;
    if (v.dateRange && v.dateRange[0]) {
      params.startDate = v.dateRange[0].toISOString();
      params.endDate = v.dateRange[1]?.toISOString() || v.dateRange[0].toISOString();
    }

    // Tab specific params
    if (this.currentTab() === 'customer' && v.customerId) params.customerId = v.customerId;
    if (this.currentTab() === 'supplier' && v.supplierId) params.supplierId = v.supplierId;

    // General filters
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

  // --- DATA LOADING ---
  loadData(tab: LedgerTab, reset = false) {
    if (reset) {
      this.gridData.set([]);
      this.reportData.set(null);
      this.entityDetails.set(null);
      this.nextCursor = null;
      this.hasMore = true;
    }

    if (this.isLoading()) return;

    // Check if the required IDs are present before making the call
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

    request.pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.processResponse(tab, res),
        error: (err) => {
          // Replaced console.error with the global HTTP error handler
          this.messageService.handleHttpError(err);
        }
      });
  }

  // --- RESPONSE PROCESSING ---
  private processResponse(tab: LedgerTab, res: any) {
    if (res.status !== 'success') {
      // Added feedback for non-success API statuses
      this.messageService.showError(res.message || 'Failed to process ledger data.');
      return;
    }

    // 1. All Transactions (Paginated Grid)
    if (tab === 'all') {
      const rows = res.data ?? [];
      const formattedRows = rows.map((r: any) => ({
        ...r,
        accountName: r.account?.name
      }));

      this.gridData.set([...this.gridData(), ...formattedRows]);
      this.nextCursor = res.nextCursor || null;
      this.hasMore = !!res.nextCursor;
      return;
    }

    // 2. Entity Ledgers (History Grid + Header Details)
    if (tab === 'customer' || tab === 'supplier') {
      const history = res.history ?? [];
      this.gridData.set(history);

      this.entityDetails.set({
        details: tab === 'customer' ? res.customer : res.supplier,
        openingBalance: res.openingBalance,
        closingBalance: res.closingBalance
      });
      return;
    }

    // 3. Trial Balance (Grid + Footer)
    if (tab === 'trialBalance') {
      const rows = res.data.rows ?? [];
      this.gridData.set(rows);
      this.reportData.set(res.data.totals); 
      return;
    }

    // 4. Summaries (Reports - Not Grids)
    if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
      this.reportData.set(res.data);
      return;
    }
  }

  // // --- DATA LOADING ---
  // loadData(tab: LedgerTab, reset = false) {
  //   if (reset) {
  //     this.gridData.set([]);
  //     this.reportData.set(null);
  //     this.entityDetails.set(null);
  //     this.nextCursor = null;
  //     this.hasMore = true;
  //   }

  //   if (this.isLoading()) return;
  //   if (!this.canQuery(tab)) return;

  //   this.isLoading.set(true);
  //   const params = this.getParams(reset);
  //   let request: Observable<any>;

  //   switch (tab) {
  //     case 'all': request = this.financial.getAllLedgers(params); break;
  //     case 'customer': request = this.financial.getCustomerLedger(params.customerId, params); break;
  //     case 'supplier': request = this.financial.getSupplierLedger(params.supplierId, params); break;
  //     case 'orgSummary': request = this.financial.getOrgLedgerSummary(params); break;
  //     case 'pnl': request = this.financial.getProfitAndLoss(params); break;
  //     case 'balanceSheet': request = this.financial.getBalanceSheet(params); break;
  //     case 'trialBalance': request = this.financial.getTrialBalance(params); break;
  //     default: this.isLoading.set(false); return;
  //   }

  //   request.pipe(finalize(() => this.isLoading.set(false)))
  //     .subscribe({
  //       next: (res) => this.processResponse(tab, res),
  //       error: (err) => console.error('Ledger Error:', err)
  //     });
  // }

  // // --- RESPONSE PROCESSING ---
  // private processResponse(tab: LedgerTab, res: any) {
  //   if (res.status !== 'success') return;

  //   // 1. All Transactions (Paginated Grid)
  //   if (tab === 'all') {
  //     const rows = res.data ?? [];
  //     const formattedRows = rows.map((r: any) => ({
  //       ...r,
  //       // Flat mapping for grid access
  //       accountName: r.account?.name
  //     }));

  //     this.gridData.set([...this.gridData(), ...formattedRows]);
  //     this.nextCursor = res.nextCursor || null;
  //     this.hasMore = !!res.nextCursor;
  //     return;
  //   }

  //   // 2. Entity Ledgers (History Grid + Header Details)
  //   if (tab === 'customer' || tab === 'supplier') {
  //     const history = res.history ?? [];
  //     const formattedHistory = history.map((h: any) => ({
  //       ...h,
  //       // No pre-formatting needed if using cellRenderers/valueFormatters
  //     }));

  //     this.gridData.set(formattedHistory);

  //     // Store entity summary data
  //     this.entityDetails.set({
  //       details: tab === 'customer' ? res.customer : res.supplier,
  //       openingBalance: res.openingBalance,
  //       closingBalance: res.closingBalance
  //     });
  //     return;
  //   }

  //   // 3. Trial Balance (Grid + Footer)
  //   if (tab === 'trialBalance') {
  //     const rows = res.data.rows ?? [];
  //     this.gridData.set(rows);
  //     this.reportData.set(res.data.totals); // Store totals for footer
  //     return;
  //   }

  //   // 4. Summaries (Reports - Not Grids)
  //   if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
  //     this.reportData.set(res.data);
  //     return;
  //   }
  // }

  private canQuery(tab: LedgerTab): boolean {
    const f = this.filterForm.value;
    // Don't fetch if ID is missing for entity tabs
    if (tab === 'customer' && !f.customerId) return false;
    if (tab === 'supplier' && !f.supplierId) return false;
    return true;
  }


  // --- GRID CONFIGURATION ---
  private initColumns(tab: LedgerTab) {
    let cols: any[] = [];

    if (tab === 'all') {
      cols = [
        {
          field: 'date',
          headerName: 'Date',
          sortable: true,
          width: 140,
          valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy'),
          cellStyle: { 'color': 'var(--text-secondary)' }
        },
        {
          field: 'referenceNumber',
          headerName: 'Ref #',
          sortable: true,
          width: 160,
          cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'cursor': 'pointer' }
        },
        {
          field: 'accountName',
          headerName: 'Account',
          sortable: true,
          flex: 1,
          minWidth: 150
        },
        {
          field: 'description',
          headerName: 'Description',
          flex: 2,
          minWidth: 250,
          cellStyle: { 'color': 'var(--text-secondary)' }
        },
        {
          field: 'debit',
          headerName: 'Debit',
          sortable: true,
          width: 130,
          type: 'rightAligned',
          valueFormatter: (params: any) => params.value ? this.common.formatCurrency(params.value) : '-',
          cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)' }
        },
        {
          field: 'credit',
          headerName: 'Credit',
          sortable: true,
          width: 130,
          type: 'rightAligned',
          valueFormatter: (params: any) => params.value ? this.common.formatCurrency(params.value) : '-',
          cellStyle: { 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)' }
        }
      ];
    }
    else if (tab === 'customer' || tab === 'supplier') {
      cols = [
        {
          field: 'date',
          headerName: 'Date',
          sortable: true,
          width: 140,
          valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy'),
          cellStyle: { 'color': 'var(--text-secondary)' }
        },
        {
          field: 'referenceNumber',
          headerName: 'Ref #',
          width: 160,
          cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' }
        },
        {
          field: 'description',
          headerName: 'Description',
          flex: 2,
          minWidth: 250,
          cellStyle: { 'color': 'var(--text-secondary)' }
        },
        {
          field: 'debit',
          headerName: 'Debit',
          width: 130,
          type: 'rightAligned',
          valueFormatter: (params: any) => params.value ? this.common.formatCurrency(params.value) : '-',
          cellStyle: { 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)' }
        },
        {
          field: 'credit',
          headerName: 'Credit',
          width: 130,
          type: 'rightAligned',
          valueFormatter: (params: any) => params.value ? this.common.formatCurrency(params.value) : '-',
          cellStyle: { 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)' }
        },
        {
          field: 'balance',
          headerName: 'Balance',
          width: 140,
          type: 'rightAligned',
          valueFormatter: (params: any) => this.common.formatCurrency(params.value),
          cellStyle: { 'font-weight': 'bold', 'font-family': 'var(--font-mono)' }
        }
      ];
    }
    else if (tab === 'trialBalance') {
      cols = [
        {
          field: 'accountCode',
          headerName: 'Code',
          width: 100,
          cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-secondary)' }
        },
        {
          field: 'accountName',
          headerName: 'Account Name',
          flex: 2,
          sortable: true,
          cellStyle: { 'font-weight': '500' }
        },
        {
          field: 'type',
          headerName: 'Type',
          width: 120,
          valueFormatter: (params: any) => (params.value || '').toUpperCase(),
          cellStyle: { 'font-size': '0.75rem', 'font-weight': '600', 'color': 'var(--text-secondary)' }
        },
        {
          field: 'debit',
          headerName: 'Debit',
          width: 150,
          type: 'rightAligned',
          valueFormatter: (params: any) => params.value ? this.common.formatCurrency(params.value) : '-',
          cellStyle: { 'color': 'var(--text-primary)', 'font-family': 'var(--font-mono)' }
        },
        {
          field: 'credit',
          headerName: 'Credit',
          width: 150,
          type: 'rightAligned',
          valueFormatter: (params: any) => params.value ? this.common.formatCurrency(params.value) : '-',
          cellStyle: { 'color': 'var(--text-primary)', 'font-family': 'var(--font-mono)' }
        }
      ];
    }
    this.gridColumns.set(cols);
  }

  eventFromGrid(ev: any) {
    if (ev.type === 'reachedBottom' && this.currentTab() === 'all' && this.hasMore) {
      this.loadData('all', false);
    }
    if (ev.type === 'cellClicked' && this.currentTab() === 'all') {
      const r = ev.row;
      if (ev.field === "referenceNumber") {
        this.router.navigate(['/invoices', r.invoiceId]);
      }
    }
  }

  onTabChange(index: any) {
    this.tabIndex.set(index);
    this.loadData(this.resolveTab(index), true);
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
      this.submitExportDialog(); // Direct export if context is clear
    } else if (tab === 'supplier' && currentValues.supplierId) {
      this.exportForm.patchValue({ exportType: 'supplier', specificId: currentValues.supplierId });
      this.submitExportDialog();
    } else {
      // Show dialog for complex choices
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

    req$.pipe(finalize(() => this.isExporting.set(false)))
      .subscribe(blob => this.common.downloadBlob(blob, `ledger_${type}_${new Date().getTime()}.csv`));
  }

  // --- HELPERS FOR TEMPLATE ---
  get isReportView() {
    return ['orgSummary', 'pnl', 'balanceSheet'].includes(this.currentTab());
  }

  get isEntityView() {
    return ['customer', 'supplier'].includes(this.currentTab());
  }
}