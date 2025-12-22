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
    if (!this.canQuery(tab)) return;

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
        error: (err) => console.error('Ledger Error:', err)
      });
  }

  private canQuery(tab: LedgerTab): boolean {
    const f = this.filterForm.value;
    // Don't fetch if ID is missing for entity tabs
    if (tab === 'customer' && !f.customerId) return false;
    if (tab === 'supplier' && !f.supplierId) return false;
    return true;
  }

  // --- RESPONSE PROCESSING ---
  private processResponse(tab: LedgerTab, res: any) {
    if (res.status !== 'success') return;

    // 1. All Transactions (Paginated Grid)
    if (tab === 'all') {
      const rows = res.data ?? [];
      const formattedRows = rows.map((r: any) => ({
        ...r,
        // Flat mapping for grid access
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
      const formattedHistory = history.map((h: any) => ({
        ...h,
        // No pre-formatting needed if using cellRenderers/valueFormatters
      }));

      this.gridData.set(formattedHistory);
      
      // Store entity summary data
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
      this.reportData.set(res.data.totals); // Store totals for footer
      return;
    }

    // 4. Summaries (Reports - Not Grids)
    if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
      this.reportData.set(res.data);
      return;
    }
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

  // --- EVENTS ---
  eventFromGrid(ev: any) {
    console.log(ev);
    if (ev.type === 'reachedBottom' && this.currentTab() === 'all' && this.hasMore) {
      this.loadData('all', false);
    }
    if (ev.type === 'cellClicked' && this.currentTab() === 'all') {
      const r = ev.row;
      if (ev.field==="referenceNumber") {
        
        this.router.navigate(['/invoices', r.invoiceId]); 
      }
    }
  }

  onTabChange(index: any) {
    this.tabIndex.set(index);
    this.loadData(this.resolveTab(index), true);
  }

  // --- EXPORT HANDLING ---
  handleExportClick() {
    const tab = this.currentTab();
    
    // Populate export form based on context
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
// import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { finalize } from 'rxjs/operators';
// import { CommonModule } from '@angular/common';

// // Services
// import { MasterListService } from '../../../core/services/master-list.service';
// import { FinancialService } from '../financial.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';

// // Shared Components
// import { AgShareGrid } from "../../shared/components/ag-shared-grid";

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DialogModule } from 'primeng/dialog';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputTextModule } from 'primeng/inputtext';
// import { RadioButtonModule } from 'primeng/radiobutton';
// import { SelectModule } from 'primeng/select';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TabsModule } from 'primeng/tabs';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { CardModule } from 'primeng/card';

// type LedgerTab =
//   | 'all'
//   | 'customer'
//   | 'supplier'
//   | 'orgSummary'
//   | 'pnl'
//   | 'balanceSheet'
//   | 'trialBalance';

// @Component({
//   selector: 'app-ledger',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ReactiveFormsModule,
//     TabsModule, ButtonModule, SelectModule, IconFieldModule,
//     InputTextModule, TooltipModule, SkeletonModule,
//     DatePickerModule, DialogModule, RadioButtonModule,
//     TagModule, CardModule,
//     AgShareGrid
//   ],
//   templateUrl: './ledger.html',
//   styleUrls: ['./ledger.scss']
// })
// export class LedgerComponent implements OnInit {

//   // --- DEPENDENCIES ---
//   private fb = inject(FormBuilder);
//   private master = inject(MasterListService);
//   private financial = inject(FinancialService);
//   private router = inject(Router);
//   public common = inject(CommonMethodService);

//   // --- STATE SIGNALS ---
//   tabIndex = signal(0);
//   currentTab = computed<LedgerTab>(() => this.resolveTab(this.tabIndex()));

//   // Data Containers
//   gridData = signal<any[]>([]); // For Lists (All, Customer History, etc.)
//   reportData = signal<any>(null); // For Summaries (Org, P&L, BS)
//   entityDetails = signal<any>(null); // For Customer/Supplier specific headers
  
//   gridColumns = signal<any[]>([]);
//   isLoading = signal(false);

//   // Pagination / Cursor
//   nextCursor: { lastDate: string | null; lastId: string | null } | null = null;
//   hasMore = true;

//   // Export State
//   showExportDialog = signal(false);
//   isExporting = signal(false);

//   // --- FORMS ---
//   filterForm!: FormGroup;
//   exportForm!: FormGroup;

//   // --- COMPUTED OPTIONS ---
//   customerOptions = computed(() => this.master.customers().map(c => ({ label: c.name, value: c._id })));
//   supplierOptions = computed(() => this.master.suppliers().map(s => ({ label: s['companyName'], value: s._id })));
//   branchOptions = computed(() => this.master.branches().map(b => ({ label: b.name, value: b._id })));
//   accountOptions = computed(() => this.master.accounts().map(a => ({ label: a.name, value: a._id })));

//   constructor() {
//     // React to tab changes to set columns
//     effect(() => {
//       this.initColumns(this.currentTab());
//     });
//   }

//   ngOnInit(): void {
//     this.initializeForms();
//     // Initial load
//     this.loadData(this.currentTab(), true);
//   }

//   // --- INITIALIZATION ---
//   private initializeForms() {
//     const now = new Date();
//     const first = new Date(now.getFullYear(), now.getMonth(), 1);
//     const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//     this.filterForm = this.fb.group({
//       branchId: [null],
//       dateRange: [[first, last]],
//       customerId: [null],
//       supplierId: [null],
//       search: [""],
//       accountId: [null],
//       txnType: [null],
//       minAmount: [null],
//       maxAmount: [null],
//       reference: [""]
//     });

//     this.exportForm = this.fb.group({
//       exportType: ['all'],
//       dateRange: [[first, last]],
//       branchId: [null],
//       specificId: [null]
//     });
//   }

//   private resolveTab(i: number): LedgerTab {
//     const map: LedgerTab[] = [
//       'all', 'customer', 'supplier', 'orgSummary',
//       'pnl', 'balanceSheet', 'trialBalance'
//     ];
//     return map[i] || 'all';
//   }

//   // --- FILTERING ---
//   applyFilters() {
//     this.loadData(this.currentTab(), true);
//   }

//   private getParams(resetCursor: boolean = false) {
//     const v = this.filterForm.value;
//     const params: any = {};

//     if (v.branchId) params.branchId = v.branchId;
//     if (v.dateRange && v.dateRange[0]) {
//       params.startDate = v.dateRange[0].toISOString();
//       params.endDate = v.dateRange[1]?.toISOString() || v.dateRange[0].toISOString();
//     }
    
//     // Tab specific params
//     if (this.currentTab() === 'customer' && v.customerId) params.customerId = v.customerId;
//     if (this.currentTab() === 'supplier' && v.supplierId) params.supplierId = v.supplierId;
    
//     // General filters
//     if (v.search) params.search = v.search;
//     if (v.accountId) params.accountId = v.accountId;
//     if (v.txnType) params.txnType = v.txnType;
//     if (v.minAmount) params.minAmount = v.minAmount;
//     if (v.maxAmount) params.maxAmount = v.maxAmount;
//     if (v.reference) params.reference = v.reference;

//     if (!resetCursor && this.nextCursor) {
//       params.lastDate = this.nextCursor.lastDate;
//       params.lastId = this.nextCursor.lastId;
//     }

//     return params;
//   }

//   // --- DATA LOADING ---
//   loadData(tab: LedgerTab, reset = false) {
//     if (reset) {
//       this.gridData.set([]);
//       this.reportData.set(null);
//       this.entityDetails.set(null);
//       this.nextCursor = null;
//       this.hasMore = true;
//     }

//     if (this.isLoading()) return;
//     if (!this.canQuery(tab)) return;

//     this.isLoading.set(true);
//     const params = this.getParams(reset);
//     let request: Observable<any>;

//     switch (tab) {
//       case 'all': request = this.financial.getAllLedgers(params); break;
//       case 'customer': request = this.financial.getCustomerLedger(params.customerId, params); break;
//       case 'supplier': request = this.financial.getSupplierLedger(params.supplierId, params); break;
//       case 'orgSummary': request = this.financial.getOrgLedgerSummary(params); break;
//       case 'pnl': request = this.financial.getProfitAndLoss(params); break;
//       case 'balanceSheet': request = this.financial.getBalanceSheet(params); break;
//       case 'trialBalance': request = this.financial.getTrialBalance(params); break;
//       default: this.isLoading.set(false); return;
//     }

//     request.pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (res) => this.processResponse(tab, res),
//         error: (err) => console.error('Ledger Error:', err)
//       });
//   }

//   private canQuery(tab: LedgerTab): boolean {
//     const f = this.filterForm.value;
//     // Don't fetch if ID is missing for entity tabs
//     if (tab === 'customer' && !f.customerId) return false;
//     if (tab === 'supplier' && !f.supplierId) return false;
//     return true;
//   }

//   // --- RESPONSE PROCESSING ---
//   private processResponse(tab: LedgerTab, res: any) {
//     if (res.status !== 'success') return;

//     // 1. All Transactions (Paginated Grid)
//     if (tab === 'all') {
//       const rows = res.data ?? [];
//       const formattedRows = rows.map((r: any) => ({
//         ...r,
//         // Flat mapping for grid access
//         accountName: r.account?.name,
//         formattedDebit: r.debit ? this.common.formatCurrency(r.debit) : '-',
//         formattedCredit: r.credit ? this.common.formatCurrency(r.credit) : '-'
//       }));
      
//       this.gridData.set([...this.gridData(), ...formattedRows]);
//       this.nextCursor = res.nextCursor || null;
//       this.hasMore = !!res.nextCursor;
//       return;
//     }

//     // 2. Entity Ledgers (History Grid + Header Details)
//     if (tab === 'customer' || tab === 'supplier') {
//       const history = res.history ?? [];
//       const formattedHistory = history.map((h: any) => ({
//         ...h,
//         formattedDebit: h.debit ? this.common.formatCurrency(h.debit) : '-',
//         formattedCredit: h.credit ? this.common.formatCurrency(h.credit) : '-',
//         formattedBalance: this.common.formatCurrency(h.balance)
//       }));

//       this.gridData.set(formattedHistory);
      
//       // Store entity summary data
//       this.entityDetails.set({
//         details: tab === 'customer' ? res.customer : res.supplier,
//         openingBalance: res.openingBalance,
//         closingBalance: res.closingBalance
//       });
//       return;
//     }

//     // 3. Trial Balance (Grid + Footer)
//     if (tab === 'trialBalance') {
//       const rows = res.data.rows ?? [];
//       const formattedRows = rows.map((r: any) => ({
//         ...r,
//         formattedDebit: r.debit ? this.common.formatCurrency(r.debit) : '-',
//         formattedCredit: r.credit ? this.common.formatCurrency(r.credit) : '-'
//       }));
//       this.gridData.set(formattedRows);
//       this.reportData.set(res.data.totals); // Store totals for footer
//       return;
//     }

//     // 4. Summaries (Reports - Not Grids)
//     if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
//       this.reportData.set(res.data);
//       return;
//     }
//   }

//   // --- GRID CONFIGURATION ---
//   private initColumns(tab: LedgerTab) {
//     let cols: any[] = [];

//     if (tab === 'all') {
//       cols = [
//         { field: 'date', headerName: 'Date', flex: 1, type: 'date' }, // Assuming Grid handles date type
//         { field: 'referenceNumber', headerName: 'Ref #', flex: 1 },
//         { field: 'accountName', headerName: 'Account', flex: 1 },
//         { field: 'description', headerName: 'Description', flex: 3 },
//         { field: 'formattedDebit', headerName: 'Debit', flex: 1, cellClass: 'text-right font-mono text-error' },
//         { field: 'formattedCredit', headerName: 'Credit', flex: 1, cellClass: 'text-right font-mono text-success' }
//       ];
//     } 
//     else if (tab === 'customer' || tab === 'supplier') {
//       cols = [
//         { field: 'date', headerName: 'Date', flex: 1, type: 'date' },
//         { field: 'referenceNumber', headerName: 'Ref #', flex: 1 },
//         { field: 'description', headerName: 'Description', flex: 3 },
//         { field: 'formattedDebit', headerName: 'Debit', flex: 1, cellClass: 'text-right font-mono text-error' },
//         { field: 'formattedCredit', headerName: 'Credit', flex: 1, cellClass: 'text-right font-mono text-success' },
//         { field: 'formattedBalance', headerName: 'Balance', flex: 1, cellClass: 'text-right font-mono font-bold' }
//       ];
//     }
//     else if (tab === 'trialBalance') {
//       cols = [
//         { field: 'accountCode', headerName: 'Code', flex: 0.5 },
//         { field: 'accountName', headerName: 'Account Name', flex: 2 },
//         { field: 'type', headerName: 'Type', flex: 1 },
//         { field: 'formattedDebit', headerName: 'Debit', flex: 1, cellClass: 'text-right font-mono' },
//         { field: 'formattedCredit', headerName: 'Credit', flex: 1, cellClass: 'text-right font-mono' }
//       ];
//     }

//     this.gridColumns.set(cols);
//   }

//   // --- EVENTS ---
//   eventFromGrid(ev: any) {
//     if (ev.type === 'reachedBottom' && this.currentTab() === 'all' && this.hasMore) {
//       this.loadData('all', false);
//     }
//     if (ev.type === 'cellClicked' && this.currentTab() === 'all') {
//       const r = ev.row;
//       if (r.referenceNumber?.startsWith("INV")) {
//         // Safe navigation to invoice
//         this.router.navigate(['/invoice/details', r.invoiceId || r.referenceNumber]); 
//       }
//     }
//   }

//   onTabChange(index: any) {
//     this.tabIndex.set(index);
//     this.loadData(this.resolveTab(index), true);
//   }

//   // --- EXPORT HANDLING ---
//   handleExportClick() {
//     const tab = this.currentTab();
    
//     // Populate export form based on context
//     const currentValues = this.filterForm.value;
//     this.exportForm.patchValue({
//       dateRange: currentValues.dateRange,
//       branchId: currentValues.branchId
//     });

//     if (tab === 'customer' && currentValues.customerId) {
//       this.exportForm.patchValue({ exportType: 'customer', specificId: currentValues.customerId });
//       this.submitExportDialog(); // Direct export if context is clear
//     } else if (tab === 'supplier' && currentValues.supplierId) {
//       this.exportForm.patchValue({ exportType: 'supplier', specificId: currentValues.supplierId });
//       this.submitExportDialog();
//     } else {
//       // Show dialog for complex choices
//       this.exportForm.patchValue({ exportType: tab === 'all' ? 'all' : tab });
//       this.showExportDialog.set(true);
//     }
//   }

//   submitExportDialog() {
//     this.showExportDialog.set(false);
//     this.isExporting.set(true);

//     const v = this.exportForm.value;
//     const params: any = { format: 'csv' };
    
//     if (v.dateRange?.[0]) params.startDate = v.dateRange[0].toISOString();
//     if (v.dateRange?.[1]) params.endDate = v.dateRange[1].toISOString();
//     if (v.branchId) params.branchId = v.branchId;
    
//     const type = v.exportType;
//     if (type === 'customer' || type === 'supplier') {
//       params[`${type}Id`] = v.specificId;
//     }

//     let req$: Observable<Blob>;
//     if (['all', 'customer', 'supplier'].includes(type)) {
//       req$ = this.financial.exportLedgers(params);
//     } else {
//       req$ = this.financial.exportStatement(type, params);
//     }

//     req$.pipe(finalize(() => this.isExporting.set(false)))
//       .subscribe(blob => this.common.downloadBlob(blob, `ledger_${type}_${new Date().getTime()}.csv`));
//   }

//   // --- HELPERS FOR TEMPLATE ---
//   get isReportView() {
//     return ['orgSummary', 'pnl', 'balanceSheet'].includes(this.currentTab());
//   }

//   get isEntityView() {
//     return ['customer', 'supplier'].includes(this.currentTab());
//   }
// }

// // import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
// // import { Router } from '@angular/router';
// // import { Observable } from 'rxjs';
// // import { finalize } from 'rxjs/operators';

// // import { MasterListService } from '../../../core/services/master-list.service';
// // import { FinancialService } from '../financial.service';
// // import { CommonMethodService } from '../../../core/utils/common-method.service';

// // import { AgShareGrid } from "../../shared/components/ag-shared-grid";
// // import { CommonModule } from '@angular/common';
// // import { ButtonModule } from 'primeng/button';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { DialogModule } from 'primeng/dialog';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { RadioButtonModule } from 'primeng/radiobutton';
// // import { SelectModule } from 'primeng/select';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { TabsModule } from 'primeng/tabs';
// // import { TooltipModule } from 'primeng/tooltip';

// // type LedgerTab =
// //   | 'all'
// //   | 'customer'
// //   | 'supplier'
// //   | 'orgSummary'
// //   | 'pnl'
// //   | 'balanceSheet'
// //   | 'trialBalance';

// // @Component({
// //   selector: 'app-ledger',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule, ReactiveFormsModule,
// //     TabsModule, ButtonModule, SelectModule, IconFieldModule,
// //     InputTextModule, TooltipModule, SkeletonModule,
// //     DatePickerModule, DialogModule, RadioButtonModule,
// //     AgShareGrid,

// //   ],
// //   templateUrl: './ledger.html',
// //   styleUrls: ['./ledger.scss']
// // })
// // export class LedgerComponent implements OnInit {

// //   // SERVICES
// //   private fb = inject(FormBuilder);
// //   private master = inject(MasterListService);
// //   private financial = inject(FinancialService);
// //   private router = inject(Router);
// //   public common = inject(CommonMethodService);

// //   // TAB + STATE
// //   tabIndex = signal(0);
// //   currentTab = computed<LedgerTab>(() => this.resolveTab(this.tabIndex()));

// //   data = signal<any[]>([]);
// //   column = signal<any[]>([]);
// //   isLoading = signal(false);

// //   nextCursor: { lastDate: string | null; lastId: string | null } | null = null;
// //   hasMore = true;

// //   // EXPORT DIALOG
// //   showExportDialog = signal(false);
// //   isExporting = signal(false);

// //   // FORMS
// //   filterForm!: FormGroup;
// //   exportForm!: FormGroup;

// //   // DROPDOWNS
// //   customerOptions = computed(() => this.master.customers().map(c => ({ label: c.name, value: c._id })));
// //   supplierOptions = computed(() => this.master.suppliers().map(s => ({ label: s['companyName'], value: s._id })));
// //   branchOptions = computed(() => this.master.branches().map(b => ({ label: b.name, value: b._id })));
// //   accountOptions = computed(() => this.master.accounts().map(a => ({ label: a.name, value: a._id })));

// //   constructor() {
// //     effect(() => {
// //       this.initColumns(this.currentTab());
// //     });
// //   }

// //   ngOnInit(): void {
// //     this.initializeForms();
// //     this.loadData(this.currentTab(), true);
// //   }

// //   // INIT
// //   private initializeForms() {
// //     const now = new Date();
// //     const first = new Date(now.getFullYear(), now.getMonth(), 1);
// //     const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// //     this.filterForm = this.fb.group({
// //       branchId: [null],
// //       dateRange: [[first, last]],
// //       customerId: [null],
// //       supplierId: [null],
// //       search: [""],
// //       accountId: [null],
// //       txnType: [null],
// //       minAmount: [null],
// //       maxAmount: [null],
// //       reference: [""]
// //     });

// //     this.exportForm = this.fb.group({
// //       exportType: ['all'],
// //       dateRange: [[first, last]],
// //       branchId: [null],
// //       specificId: [null]
// //     });
// //   }

// //   private resolveTab(i: number): LedgerTab {
// //     const map: LedgerTab[] = [
// //       'all', 'customer', 'supplier', 'orgSummary',
// //       'pnl', 'balanceSheet', 'trialBalance'
// //     ];
// //     return map[i] || 'all';
// //   }

// //   // FILTER SUPPORT
// //   applyFilters() {
// //     this.loadData(this.currentTab(), true);
// //   }

// //   private getParams(resetCursor: boolean = false) {
// //     const v = this.filterForm.value;
// //     const params: any = {};

// //     if (v.branchId) params.branchId = v.branchId;
// //     if (v.dateRange) {
// //       params.startDate = v.dateRange[0]?.toISOString();
// //       params.endDate = v.dateRange[1]?.toISOString();
// //     }
// //     if (v.customerId) params.customerId = v.customerId;
// //     if (v.supplierId) params.supplierId = v.supplierId;
// //     if (v.search) params.search = v.search;
// //     if (v.accountId) params.accountId = v.accountId;
// //     if (v.txnType) params.txnType = v.txnType;
// //     if (v.minAmount) params.minAmount = v.minAmount;
// //     if (v.maxAmount) params.maxAmount = v.maxAmount;
// //     if (v.reference) params.reference = v.reference;

// //     if (!resetCursor && this.nextCursor) {
// //       params.lastDate = this.nextCursor.lastDate;
// //       params.lastId = this.nextCursor.lastId;
// //     }

// //     return params;
// //   }

// //   // LOAD DATA
// //   loadData(tab: LedgerTab, reset = false) {
// //     if (reset) {
// //       this.data.set([]);
// //       this.nextCursor = null;
// //       this.hasMore = true;
// //     }

// //     if (this.isLoading() || !this.canQuery(tab)) return;

// //     this.isLoading.set(true);

// //     const params = this.getParams(reset);
// //     let request: Observable<any>;

// //     switch (tab) {
// //       case 'all':
// //         request = this.financial.getAllLedgers(params);
// //         break;
// //       case 'customer':
// //         request = this.financial.getCustomerLedger(params.customerId, params);
// //         break;
// //       case 'supplier':
// //         request = this.financial.getSupplierLedger(params.supplierId, params);
// //         break;
// //       case 'orgSummary':
// //         request = this.financial.getOrgLedgerSummary(params);
// //         break;
// //       case 'pnl':
// //         request = this.financial.getProfitAndLoss(params);
// //         break;
// //       case 'balanceSheet':
// //         request = this.financial.getBalanceSheet(params);
// //         break;
// //       case 'trialBalance':
// //         request = this.financial.getTrialBalance(params);
// //         break;
// //       default:
// //         return;
// //     }

// //     request.pipe(finalize(() => this.isLoading.set(false)))
// //       .subscribe(res => {
// //         this.processResponse(tab, res);
// //       });
// //   }

// //   private canQuery(tab: LedgerTab): boolean {
// //     const f = this.filterForm.value;
// //     if (tab === 'customer' && !f.customerId) return false;
// //     if (tab === 'supplier' && !f.supplierId) return false;
// //     return true;
// //   }

// //   // MAPPING
// //   private processResponse(tab: LedgerTab, res: any) {
// //     if (tab === 'all') {
// //       const rows = res.data ?? [];
// //       this.data.set([...this.data(), ...rows]);
// //       this.nextCursor = res.nextCursor || null;
// //       this.hasMore = !!res.nextCursor;
// //       return;
// //     }

// //     if (tab === 'customer' || tab === 'supplier') {
// //       this.data.set(res.history ?? []);
// //       return;
// //     }

// //     if (tab === 'trialBalance') {
// //       this.data.set(res.data.rows ?? []);
// //       return;
// //     }

// //     if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
// //       this.data.set([res.data]);
// //       return;
// //     }
// //   }

// //   // GRID EVENTS
// //   eventFromGrid(ev: any) {
// //     if (ev.type === 'reachedBottom' && this.currentTab() === 'all' && this.hasMore) {
// //       this.loadData('all', false);
// //       return;
// //     }

// //     if (ev.type === 'cellClicked' && this.currentTab() === 'all') {
// //       const r = ev.row;
// //       if (r.referenceNumber?.startsWith("INV")) {
// //         this.router.navigate(['/invoice', r.referenceNumber]);
// //       }
// //     }
// //   }

// //   // EXPORT
// //   openExportDialog() {
// //     const v = this.filterForm.value;
// //     this.exportForm.patchValue({
// //       dateRange: v.dateRange,
// //       branchId: v.branchId
// //     });
// //     this.showExportDialog.set(true);
// //   }

// //   submitExportDialog() {
// //     const v = this.exportForm.value;
// //     const params: any = {
// //       format: 'csv'
// //     };

// //     if (v.dateRange?.[0]) params.startDate = v.dateRange[0].toISOString();
// //     if (v.dateRange?.[1]) params.endDate = v.dateRange[1].toISOString();
// //     if (v.branchId) params.branchId = v.branchId;

// //     if (v.exportType === 'customer') params.customerId = v.specificId;
// //     if (v.exportType === 'supplier') params.supplierId = v.specificId;

// //     this.executeExport(params, v.exportType);
// //     this.showExportDialog.set(false);
// //   }

// //   private executeExport(params: any, type: string) {
// //     this.isExporting.set(true);

// //     let req$: Observable<Blob>;
// //     if (type === 'all' || type === 'customer' || type === 'supplier') {
// //       req$ = this.financial.exportLedgers(params);
// //     } else {
// //       req$ = this.financial.exportStatement(type as any, params);
// //     }

// //     req$
// //       .pipe(finalize(() => this.isExporting.set(false)))
// //       .subscribe(blob => {
// //         this.common.downloadBlob(blob, 'ledger.csv');
// //       });
// //   }

// //   // TABLE COLUMNS
// //   private initColumns(tab: LedgerTab) {
// //     if (tab === 'trialBalance') {
// //       this.column.set([
// //         { field: 'accountName', headerName: 'Account', flex: 2 },
// //         { field: 'debit', headerName: 'Debit', flex: 1 },
// //         { field: 'credit', headerName: 'Credit', flex: 1 }
// //       ]);
// //       return;
// //     }

// //     if (tab === 'all') {
// //       this.column.set([
// //         { field: 'date', headerName: 'Date', flex: 1 },
// //         { field: 'description', headerName: 'Description', flex: 2 },
// //         { field: 'debit', headerName: 'Debit', flex: 1 },
// //         { field: 'credit', headerName: 'Credit', flex: 1 },
// //         { field: 'account.name', headerName: 'Account', flex: 1 }
// //       ]);
// //       return;
// //     }

// //     if (tab === 'customer' || tab === 'supplier') {
// //       this.column.set([
// //         { field: 'date', headerName: 'Date', flex: 1 },
// //         { field: 'description', headerName: 'Description', flex: 2 },
// //         { field: 'debit', headerName: 'Debit', flex: 1 },
// //         { field: 'credit', headerName: 'Credit', flex: 1 },
// //         { field: 'balance', headerName: 'Balance', flex: 1 }
// //       ]);
// //       return;
// //     }

// //     this.column.set([{ field: 'value', headerName: 'Value' }]);
// //   }
// //   handleExportClick() {
// //   const tab = this.currentTab();

// //   // If on ALL tab → open dialog
// //   if (tab === 'all') {
// //     this.openExportDialog();
// //     return;
// //   }

// //   // If on customer / supplier → export directly
// //   if (tab === 'customer') {
// //     const customerId = this.filterForm.value.customerId;
// //     if (!customerId) return;
// //     this.executeExport({ customerId, format: 'csv' }, 'customer');
// //     return;
// //   }

// //   if (tab === 'supplier') {
// //     const supplierId = this.filterForm.value.supplierId;
// //     if (!supplierId) return;
// //     this.executeExport({ supplierId, format: 'csv' }, 'supplier');
// //     return;
// //   }

// //   // For summary / pnl / bs / trial
// //   this.executeExport({ format: 'csv' }, tab);
// // }


// //   // TRIAL BALANCE FOOTER
// //   getTrialTotal(type: 'debit' | 'credit') {
// //     return this.data().reduce((sum, r) => sum + (r[type] || 0), 0);
// //   }

// //   onTabChange(i: any) {
// //     this.tabIndex.set(i);
// //     this.loadData(this.currentTab(), true);
// //   }
// // }


// // // import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// // // import { Router } from '@angular/router';
// // // import { finalize } from 'rxjs/operators';
// // // import { Observable } from 'rxjs';

// // // // Services
// // // import { MasterListService } from '../../../core/services/master-list.service';
// // // import { FinancialService } from '../financial.service';
// // // import { CommonMethodService } from '../../../core/utils/common-method.service';

// // // // PrimeNG

// // // // Shared Grid
// // // import { AgShareGrid } from "../../shared/components/ag-shared-grid";
// // // import { ButtonModule } from 'primeng/button';
// // // import { DatePickerModule } from 'primeng/datepicker';
// // // import { DialogModule } from 'primeng/dialog';
// // // import { IconFieldModule } from 'primeng/iconfield';
// // // import { InputIconModule } from 'primeng/inputicon';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { RadioButtonModule } from 'primeng/radiobutton';
// // // import { SelectModule } from 'primeng/select';
// // // import { SkeletonModule } from 'primeng/skeleton';
// // // import { TabsModule } from 'primeng/tabs';
// // // import { TooltipModule } from 'primeng/tooltip';


// // // type LedgerTab = 'all' | 'customer' | 'supplier' | 'orgSummary' | 'pnl' | 'balanceSheet' | 'trialBalance';


// // // @Component({
// // //   selector: 'app-ledger',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     FormsModule,
// // //     ReactiveFormsModule,
// // //     TabsModule,
// // //     ButtonModule,
// // //     SelectModule,
// // //     IconFieldModule,
// // //     InputIconModule,
// // //     InputTextModule,
// // //     TooltipModule,
// // //     SkeletonModule,
// // //     DatePickerModule,
// // //     DialogModule,
// // //     RadioButtonModule,
// // //     AgShareGrid
// // //   ],
// // //   templateUrl: './ledger.html',
// // //   styleUrl: './ledger.scss'
// // // })
// // // export class LedgerComponent implements OnInit {

// // //   // inject services
// // //   private fb = inject(FormBuilder);
// // //   private masterList = inject(MasterListService);
// // //   private financial = inject(FinancialService);
// // //   public common = inject(CommonMethodService);
// // //   private router = inject(Router);

// // //   // signals
// // //   tabValue = signal<number>(0);
// // //   currentTab = computed<LedgerTab>(() => this.mapTab(this.tabValue()));

// // //   data = signal<any[]>([]);
// // //   column = signal<any[]>([]);
// // //   isLoading = signal(false);

// // //   filterForm!: FormGroup;
// // //   exportForm!: FormGroup;
// // //   showExportDialog = signal(false);
// // //   isExporting = signal(false);

// // //   // cursor state (for ALL tab)
// // //   private cursor: { lastDate: string | null; lastId: string | null } = { lastDate: null, lastId: null };
// // //   private hasMore = true;

// // //   // dropdown options
// // //   customerOptions = computed(() => this.masterList.customers().map(c => ({ label: c.name, value: c._id })));
// // //   supplierOptions = computed(() => this.masterList.suppliers().map(s => ({ label: s['companyName'], value: s._id })));
// // //   accountOptions = computed(() => this.masterList.accounts().map((a: any) => ({ label: a.name, value: a._id })));

// // //   constructor() {

// // //     effect(() => {
// // //       const tab = this.currentTab();
// // //       this.initColumns(tab);

// // //       if (this.canLoad(tab)) {
// // //         this.resetCursorState();
// // //         this.loadData(tab, true);
// // //       } else {
// // //         this.data.set([]);
// // //       }
// // //     });
// // //   }


// // //   ngOnInit(): void {
// // //     this.initForms();
// // //   }


// // //   private initForms() {
// // //     const now = new Date();
// // //     const first = new Date(now.getFullYear(), now.getMonth(), 1);
// // //     const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// // //     this.filterForm = this.fb.group({
// // //       customerId: [null],
// // //       supplierId: [null],
// // //       dateRange: [[first, last]],
// // //       accountId: [null],
// // //       txnType: [null],
// // //       minAmount: [null],
// // //       maxAmount: [null],
// // //       reference: ['']
// // //     });

// // //     this.exportForm = this.fb.group({
// // //       exportType: ['all'],
// // //       specificId: [null],
// // //       dateRange: [[first, last]]
// // //     });
// // //   }


// // //   private mapTab(i: number): LedgerTab {
// // //     const t: LedgerTab[] = ['all', 'customer', 'supplier', 'orgSummary', 'pnl', 'balanceSheet', 'trialBalance'];
// // //     return t[i] || 'all';
// // //   }


// // //   onTabChange(event:any) {
// // //     this.tabValue.set(event);
// // //   }

// // // submitExportDialog() {
// // //   const formVal = this.exportForm.value;
// // //   const type = formVal.exportType;

// // //   const params: any = {
// // //     format: 'csv'
// // //   };

// // //   if (formVal.dateRange?.[0]) params.startDate = formVal.dateRange[0].toISOString();
// // //   if (formVal.dateRange?.[1]) params.endDate = formVal.dateRange[1].toISOString();

// // //   if (type === 'customer') params.customerId = formVal.specificId;
// // //   if (type === 'supplier') params.supplierId = formVal.specificId;

// // //   this.executeExport(params, type);
// // //   this.showExportDialog.set(false);
// // // }


// // //   // ================= FILTER LOGIC =================

// // //   private canLoad(tab: LedgerTab): boolean {
// // //     const v = this.filterForm.value;
// // //     if (tab === 'customer' && !v.customerId) return false;
// // //     if (tab === 'supplier' && !v.supplierId) return false;
// // //     return true;
// // //   }


// // //   private resetCursorState() {
// // //     this.cursor = { lastDate: null, lastId: null };
// // //     this.hasMore = true;
// // //   }


// // //   applyFilters() {
// // //     if (this.canLoad(this.currentTab())) {
// // //       this.resetCursorState();
// // //       this.loadData(this.currentTab(), true);
// // //     }
// // //   }


// // //   private buildParams(form: any) {
// // //     const params: any = {};

// // //     if (form.dateRange?.[0]) params.startDate = form.dateRange[0].toISOString();
// // //     if (form.dateRange?.[1]) params.endDate = form.dateRange[1].toISOString();
// // //     if (form.customerId) params.customerId = form.customerId;
// // //     if (form.supplierId) params.supplierId = form.supplierId;
// // //     if (form.accountId) params.accountId = form.accountId;
// // //     if (form.txnType) params.txnType = form.txnType;
// // //     if (form.minAmount) params.minAmount = form.minAmount;
// // //     if (form.maxAmount) params.maxAmount = form.maxAmount;
// // //     if (form.reference) params.reference = form.reference;

// // //     if (this.cursor.lastDate) params.lastDate = this.cursor.lastDate;
// // //     if (this.cursor.lastId) params.lastId = this.cursor.lastId;

// // //     return params;
// // //   }


// // //   // ================== LOAD DATA =====================

// // //   loadData(tab: LedgerTab, reset: boolean = false) {

// // //     if (this.isLoading()) return;

// // //     this.isLoading.set(true);

// // //     const params = this.buildParams(this.filterForm.value);
// // //     let api: Observable<any>;

// // //     switch (tab) {
// // //       case 'all': api = this.financial.getAllLedgers(params); break;
// // //       case 'customer': api = this.financial.getCustomerLedger(params.customerId, params); break;
// // //       case 'supplier': api = this.financial.getSupplierLedger(params.supplierId, params); break;
// // //       case 'orgSummary': api = this.financial.getOrgLedgerSummary(params); break;
// // //       case 'pnl': api = this.financial.getProfitAndLoss(params); break;
// // //       case 'balanceSheet': api = this.financial.getBalanceSheet(params); break;
// // //       case 'trialBalance': api = this.financial.getTrialBalance(params); break;
// // //       default: return;
// // //     }

// // //     api.pipe(finalize(() => this.isLoading.set(false))).subscribe({
// // //       next: (res: any) => {
// // //         const newRows = this.mapResponse(tab, res);

// // //         if (tab === 'all') {
// // //           if (reset) this.data.set(newRows);
// // //           else this.data.set([...this.data(), ...newRows]);

// // //           if (res.nextCursor) {
// // //             this.cursor = res.nextCursor;
// // //           } else {
// // //             this.hasMore = false;
// // //           }
// // //         } else {
// // //           this.data.set(newRows);
// // //         }
// // //       },
// // //       error: () => {
// // //         this.data.set([]);
// // //       }
// // //     });
// // //   }


// // //   // ================= RESPONSE MAPPING ===============

// // //   private mapResponse(tab: LedgerTab, res: any): any[] {

// // //     if (tab === 'all') {
// // //       return (res.data || []).map((e: any) => ({
// // //         date: e.date,
// // //         type: e.debit > 0 ? 'debit' : 'credit',
// // //         description: e.description,
// // //         amount: e.debit > 0 ? e.debit : e.credit,
// // //         entryId: e._id,
// // //         account: e.account?.name,
// // //         accountCode: e.account?.code,
// // //         customer: e.customer?.name,
// // //         supplier: e.supplier?.companyName,
// // //         reference: e.referenceNumber
// // //       }));
// // //     }

// // //     if (tab === 'customer') {
// // //       return res.history || [];
// // //     }

// // //     if (tab === 'supplier') {
// // //       return res.history || [];
// // //     }

// // //     if (tab === 'orgSummary') {
// // //       const d = res.data;
// // //       return [
// // //         { category: 'Assets', value: d.asset },
// // //         { category: 'Liabilities', value: d.liability },
// // //         { category: 'Equity', value: d.equity },
// // //         { category: 'Income', value: d.income },
// // //         { category: 'Expenses', value: d.expense },
// // //         { category: 'Other', value: d.other },
// // //         { category: 'Net Profit', value: d.netProfit }
// // //       ];
// // //     }

// // //     if (tab === 'pnl') {
// // //       return [
// // //         { category: 'Income', value: res.data.income },
// // //         { category: 'Expenses', value: res.data.expenses },
// // //         { category: 'Net Profit', value: res.data.netProfit }
// // //       ];
// // //     }

// // //     if (tab === 'balanceSheet') {
// // //       return [
// // //         { category: 'Assets', value: res.data.assets },
// // //         { category: 'Liabilities', value: res.data.liabilities },
// // //         { category: 'Equity', value: res.data.equity }
// // //       ];
// // //     }

// // //     if (tab === 'trialBalance') {
// // //       return res.data.rows || [];
// // //     }

// // //     return [];
// // //   }



// // //   // ================== GRID EVENTS ===================

// // //   eventFromGrid(event: any) {

// // //     if (event.type === 'reachedBottom' && this.currentTab() === 'all' && this.hasMore) {
// // //       this.loadData('all', false);
// // //     }

// // //     if (event.type === 'cellClicked' && this.currentTab() === 'all') {
// // //       const r = event.row;

// // //       if (r.reference && r.reference.startsWith('INV')) {
// // //         this.router.navigate(['/invoice', r.reference]);
// // //         return;
// // //       }

// // //       if (r.customer) {
// // //         this.router.navigate(['/customer-ledger', r.customer]);
// // //         return;
// // //       }

// // //       if (r.supplier) {
// // //         this.router.navigate(['/supplier-ledger', r.supplier]);
// // //         return;
// // //       }
// // //     }
// // //   }



// // //   // ================= EXPORT ===================

// // //   handleExportClick() {
// // //     const tab = this.currentTab();

// // //     if (tab === 'all') {
// // //       this.exportForm.patchValue({
// // //         dateRange: this.filterForm.get('dateRange')?.value,
// // //         exportType: 'all',
// // //         specificId: null
// // //       });
// // //       this.showExportDialog.set(true);
// // //     } else {
// // //       this.exportSingleTab(tab);
// // //     }
// // //   }


// // //   private exportSingleTab(tab: LedgerTab) {
// // //     const params: any = { format: 'csv' };
// // //     const fv = this.filterForm.value;

// // //     if (fv.dateRange?.[0]) params.startDate = fv.dateRange[0].toISOString();
// // //     if (fv.dateRange?.[1]) params.endDate = fv.dateRange[1].toISOString();
// // //     if (fv.customerId) params.customerId = fv.customerId;
// // //     if (fv.supplierId) params.supplierId = fv.supplierId;

// // //     this.isExporting.set(true);

// // //     this.financial.exportLedgers(params)
// // //       .pipe(finalize(() => this.isExporting.set(false)))
// // //       .subscribe((blob: any) =>
// // //         this.common.downloadBlob(blob, `ledger_${new Date().toISOString()}.csv`)
// // //       );
// // //   }

// // //   // ================= COLUMNS =====================

// // //   initColumns(tab: LedgerTab) {

// // //     if (tab === 'all') {
// // //       this.column.set([
// // //         { field: 'date', headerName: 'Date', flex: 1, valueFormatter: (p: any) => this.common.formatDate(p.value) },
// // //         { field: 'description', headerName: 'Description', flex: 2 },
// // //         { field: 'account', headerName: 'Account', flex: 1 },
// // //         { field: 'amount', headerName: 'Amount', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
// // //         { field: 'type', headerName: 'Type', width: 120 }
// // //       ]);
// // //       return;
// // //     }

// // //     if (tab === 'customer' || tab === 'supplier') {
// // //       this.column.set([
// // //         { field: 'date', headerName: 'Date', flex: 1, valueFormatter: (p: any) => this.common.formatDate(p.value) },
// // //         { field: 'description', headerName: 'Description', flex: 2 },
// // //         { field: 'debit', headerName: 'Debit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
// // //         { field: 'credit', headerName: 'Credit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
// // //         { field: 'balance', headerName: 'Balance', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
// // //       ]);
// // //       return;
// // //     }

// // //     if (tab === 'orgSummary' || tab === 'pnl' || tab === 'balanceSheet') {
// // //       this.column.set([
// // //         { field: 'category', headerName: 'Category', flex: 2 },
// // //         { field: 'value', headerName: 'Amount', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
// // //       ]);
// // //       return;
// // //     }

// // //     if (tab === 'trialBalance') {
// // //       this.column.set([
// // //         { field: 'accountName', headerName: 'Account', flex: 2 },
// // //         { field: 'debit', headerName: 'Debit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
// // //         { field: 'credit', headerName: 'Credit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
// // //       ]);
// // //       return;
// // //     }
// // //   }


// // //   // trial balance footer support
// // //   getTrialTotal(type: 'debit' | 'credit'): number {
// // //     if (this.currentTab() !== 'trialBalance') return 0;
// // //     return this.data().reduce((acc, row) => acc + (row[type] || 0), 0);
// // //   }

// // // }

// // // // import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// // // // import { Observable } from 'rxjs';
// // // // import { finalize } from 'rxjs/operators';

// // // // // Services
// // // // import { MasterListService } from '../../../core/services/master-list.service';
// // // // import { FinancialService } from '../financial.service';
// // // // import { CommonMethodService } from '../../../core/utils/common-method.service';

// // // // // Shared
// // // // import { AgShareGrid } from "../../shared/components/ag-shared-grid";
// // // // import { ButtonModule } from 'primeng/button';
// // // // import { DatePickerModule } from 'primeng/datepicker';
// // // // import { DialogModule } from 'primeng/dialog';
// // // // import { InputTextModule } from 'primeng/inputtext';
// // // // import { RadioButtonModule } from 'primeng/radiobutton';
// // // // import { SelectModule } from 'primeng/select';
// // // // import { SkeletonModule } from 'primeng/skeleton';
// // // // import { TabsModule } from 'primeng/tabs';
// // // // import { TooltipModule } from 'primeng/tooltip';

// // // // type LedgerTab =
// // // //   | 'all'
// // // //   | 'customer'
// // // //   | 'supplier'
// // // //   | 'orgSummary'
// // // //   | 'pnl'
// // // //   | 'balanceSheet'
// // // //   | 'trialBalance';

// // // // @Component({
// // // //   selector: 'app-ledger',
// // // //   standalone: true,
// // // //   imports: [
// // // //     CommonModule,
// // // //     FormsModule,
// // // //     ReactiveFormsModule,
// // // //     TabsModule,
// // // //     ButtonModule,
// // // //     SelectModule,
// // // //     InputTextModule,
// // // //     TooltipModule,
// // // //     SkeletonModule,
// // // //     DatePickerModule,
// // // //     DialogModule,
// // // //     RadioButtonModule,
// // // //     AgShareGrid
// // // //   ],
// // // //   templateUrl: './ledger.html',
// // // //   styleUrl: './ledger.scss'
// // // // })
// // // // export class LedgerComponent implements OnInit {

// // // //   // SERVICES
// // // //   private fb = inject(FormBuilder);
// // // //   private masterList = inject(MasterListService);
// // // //   private financial = inject(FinancialService);
// // // //   public common = inject(CommonMethodService);

// // // //   // TAB STATE
// // // //   tabIndex = signal(0);
// // // //   currentTab = computed<LedgerTab>(() => {
// // // //     const tabs: LedgerTab[] = [
// // // //       'all',
// // // //       'customer',
// // // //       'supplier',
// // // //       'orgSummary',
// // // //       'pnl',
// // // //       'balanceSheet',
// // // //       'trialBalance'
// // // //     ];
// // // //     return tabs[this.tabIndex()] ?? 'all';
// // // //   });
  

// // // //   // FORMS
// // // //   filterForm!: FormGroup;
// // // //   exportForm!: FormGroup;

// // // //   // UI STATE
// // // //   showExportDialog = signal(false);
// // // //   isLoading = signal(false);
// // // //   isExporting = signal(false);

// // // //   // GRID SIGNALS
// // // //   data = signal<any[]>([]);
// // // //   column = signal<any[]>([]);

// // // //   // OPTIONS
// // // //   branchOptions = computed(() =>
// // // //     this.masterList.branches().map(b => ({ label: b.name, value: b._id }))
// // // //   );

// // // //   customerOptions = computed(() =>
// // // //     this.masterList.customers().map(c => ({ label: c.name, value: c._id }))
// // // //   );

// // // //   supplierOptions = computed(() =>
// // // //     this.masterList.suppliers().map((s: any) => ({
// // // //       label: s.companyName,
// // // //       value: s._id
// // // //     }))
// // // //   );

// // // //   constructor() {
// // // //     effect(() => {
// // // //       this.initColumns(this.currentTab());
// // // //       if (this.canLoadData(this.currentTab())) {
// // // //         this.loadData(this.currentTab());
// // // //       } else {
// // // //         this.data.set([]);
// // // //       }
// // // //     });
// // // //   }

// // // //   ngOnInit(): void {
// // // //     this.initForms();
// // // //   }

// // // //   // INITIAL FORMS
// // // //   initForms() {
// // // //     const now = new Date();
// // // //     const first = new Date(now.getFullYear(), now.getMonth(), 1);
// // // //     const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// // // //     this.filterForm = this.fb.group({
// // // //       branchId: [null],
// // // //       customerId: [null],
// // // //       supplierId: [null],
// // // //       search: [''],
// // // //       dateRange: [[first, last]]
// // // //     });

// // // //     this.exportForm = this.fb.group({
// // // //       exportType: ['all'],
// // // //       branchId: [null],
// // // //       specificId: [null],
// // // //       dateRange: [[first, last]]
// // // //     });
// // // //   }

// // // //   // TAB CHANGE
// // // //   onTabChange(i: any) {
// // // //     this.tabIndex.set(i);
// // // //   }

// // // //   getTrialTotal(type: 'debit' | 'credit'): number {
// // // //   if (this.currentTab() !== 'trialBalance') return 0;
// // // //   return this.data().reduce((acc, row) => acc + (row[type] || 0), 0);
// // // // }


// // // //   eventFromGrid(event:any){

// // // //   }

// // // //   // GUARD
// // // //   private canLoadData(tab: LedgerTab): boolean {
// // // //     const v = this.filterForm.value;
// // // //     if (tab === 'customer' && !v.customerId) return false;
// // // //     if (tab === 'supplier' && !v.supplierId) return false;
// // // //     return true;
// // // //   }

// // // //   // PARAM BUILDER
// // // //   private buildParams(form: any) {
// // // //     const params: any = {};

// // // //     if (form.dateRange?.[0]) params.startDate = form.dateRange[0].toISOString();
// // // //     if (form.dateRange?.[1]) params.endDate = form.dateRange[1].toISOString();

// // // //     if (form.branchId) params.branchId = form.branchId;
// // // //     if (form.search?.trim()) params.search = form.search.trim();

// // // //     if (this.currentTab() === 'customer') params.customerId = form.customerId;
// // // //     if (this.currentTab() === 'supplier') params.supplierId = form.supplierId;

// // // //     return params;
// // // //   }

// // // //   // MAIN LOAD
// // // //   applyFilters() {
// // // //     if (this.canLoadData(this.currentTab())) {
// // // //       this.loadData(this.currentTab());
// // // //     }
// // // //   }

// // // //   loadData(tab: LedgerTab) {
// // // //     this.isLoading.set(true);
// // // //     const params = this.buildParams(this.filterForm.value);
// // // //     let req$: Observable<any>;

// // // //     switch (tab) {
// // // //       case 'all':
// // // //         req$ = this.financial.getAllLedgers(params);
// // // //         break;
// // // //       case 'customer':
// // // //         req$ = this.financial.getCustomerLedger(params.customerId, params);
// // // //         break;
// // // //       case 'supplier':
// // // //         req$ = this.financial.getSupplierLedger(params.supplierId, params);
// // // //         break;
// // // //       case 'orgSummary':
// // // //         req$ = this.financial.getOrgLedgerSummary(params);
// // // //         break;
// // // //       case 'pnl':
// // // //         req$ = this.financial.getProfitAndLoss(params);
// // // //         break;
// // // //       case 'balanceSheet':
// // // //         req$ = this.financial.getBalanceSheet(params);
// // // //         break;
// // // //       case 'trialBalance':
// // // //         req$ = this.financial.getTrialBalance(params);
// // // //         break;
// // // //       default:
// // // //         this.isLoading.set(false);
// // // //         return;
// // // //     }

// // // //     this.common.apiCall(req$, (res) => {
// // // //       this.processResponse(tab, res);
// // // //       this.isLoading.set(false);
// // // //     });
// // // //   }

// // // //   // EXPORT
// // // //   openExportDialog() {
// // // //     const form = this.filterForm.value;
// // // //     this.exportForm.patchValue({
// // // //       dateRange: form.dateRange,
// // // //       branchId: form.branchId
// // // //     });
// // // //     this.showExportDialog.set(true);
// // // //   }

// // // //   submitExportDialog() {
// // // //     const f = this.exportForm.value;
// // // //     const params: any = {
// // // //       startDate: f.dateRange?.[0]?.toISOString(),
// // // //       endDate: f.dateRange?.[1]?.toISOString(),
// // // //       branchId: f.branchId
// // // //     };

// // // //     if (f.exportType === 'customer') params.customerId = f.specificId;
// // // //     if (f.exportType === 'supplier') params.supplierId = f.specificId;

// // // //     this.doExport(params);
// // // //     this.showExportDialog.set(false);
// // // //   }

// // // //   private doExport(params: any) {
// // // //     this.isExporting.set(true);

// // // //     const req = this.financial.exportLedgers({ ...params, format: 'csv' });

// // // //     req.pipe(finalize(() => this.isExporting.set(false))).subscribe({
// // // //       next: (blob) => {
// // // //         const name = `Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
// // // //         this.common.downloadBlob(blob, name);
// // // //       },
// // // //       error: (err) =>
// // // //         this.common['messageService'].showError('Export Failed', err.message)
// // // //     });
// // // //   }

// // // //   // RESPONSE MAPPING
// // // //   private processResponse(tab: LedgerTab, res: any) {
// // // //     if (tab === 'customer' || tab === 'supplier') {
// // // //       this.data.set(res.data.history ?? []);
// // // //       return;
// // // //     }

// // // //     if (tab === 'all') {
// // // //       this.data.set(res.data.ledgers ?? res.data.data ?? []);
// // // //       return;
// // // //     }

// // // //     if (tab === 'orgSummary') {
// // // //       const s = res.data;
// // // //       this.data.set([
// // // //         { category: 'Income', account: 'Total Income', amount: s.income },
// // // //         { category: 'Expense', account: 'Total Expense', amount: s.expense },
// // // //         { category: 'Net', account: 'Net Profit', amount: s.netProfit }
// // // //       ]);
// // // //       return;
// // // //     }

// // // //     if (tab === 'pnl') {
// // // //       const p = res.data;
// // // //       this.data.set([
// // // //         { category: 'Income', account: 'Income', amount: p.income },
// // // //         { category: 'Expense', account: 'Expenses', amount: p.expenses },
// // // //         { category: 'Net', account: 'Profit', amount: p.netProfit }
// // // //       ]);
// // // //       return;
// // // //     }

// // // //     if (tab === 'balanceSheet') {
// // // //       const b = res.data;
// // // //       this.data.set([
// // // //         { category: 'Assets', account: 'Assets', amount: b.assets },
// // // //         { category: 'Liabilities', account: 'Liabilities', amount: b.liabilities },
// // // //         { category: 'Equity', account: 'Equity', amount: b.equity }
// // // //       ]);
// // // //       return;
// // // //     }

// // // //     if (tab === 'trialBalance') {
// // // //       this.data.set(res.data.rows ?? []);
// // // //       return;
// // // //     }

// // // //     this.data.set([]);
// // // //   }

// // // //   // GRID COLUMNS
// // // //   initColumns(tab: LedgerTab) {
// // // //     let cols: any[] = [];

// // // //     if (['all', 'customer', 'supplier'].includes(tab)) {
// // // //       cols = [
// // // //         {
// // // //           field: tab === 'all' ? 'date' : 'date',
// // // //           headerName: 'Date',
// // // //           flex: 1,
// // // //           valueFormatter: (p: any) => this.common.formatDate(p.value)
// // // //         },
// // // //         {
// // // //           field: 'description',
// // // //           headerName: 'Description',
// // // //           flex: 2
// // // //         },
// // // //         {
// // // //           field: 'debit',
// // // //           headerName: 'Debit',
// // // //           type: 'rightAligned',
// // // //           flex: 1,
// // // //           valueFormatter: (p: any) => this.common.formatCurrency(p.value)
// // // //         },
// // // //         {
// // // //           field: 'credit',
// // // //           headerName: 'Credit',
// // // //           type: 'rightAligned',
// // // //           flex: 1,
// // // //           valueFormatter: (p: any) => this.common.formatCurrency(p.value)
// // // //         }
// // // //       ];

// // // //       if (tab !== 'all') {
// // // //         cols.push({
// // // //           field: 'balance',
// // // //           headerName: 'Balance',
// // // //           flex: 1,
// // // //           type: 'rightAligned',
// // // //           valueFormatter: (p: any) => this.common.formatCurrency(p.value)
// // // //         });
// // // //       }
// // // //     }

// // // //     else if (tab === 'trialBalance') {
// // // //       cols = [
// // // //         { field: 'accountName', headerName: 'Account', flex: 2 },
// // // //         { field: 'debit', headerName: 'Debit', type: 'rightAligned', flex: 1 },
// // // //         { field: 'credit', headerName: 'Credit', type: 'rightAligned', flex: 1 }
// // // //       ];
// // // //     }

// // // //     else {
// // // //       cols = [
// // // //         { field: 'category', headerName: 'Category', flex: 1 },
// // // //         { field: 'account', headerName: 'Account', flex: 2 },
// // // //         { field: 'amount', headerName: 'Amount', flex: 1, type: 'rightAligned' }
// // // //       ];
// // // //     }

// // // //     this.column.set(cols);
// // // //   }

// // // // }


// // // // import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// // // // import { Observable } from 'rxjs';
// // // // import { finalize } from 'rxjs/operators';

// // // // // Services
// // // // import { MasterListService } from '../../../core/services/master-list.service';
// // // // import { FinancialService } from '../financial.service';
// // // // import { CommonMethodService } from '../../../core/utils/common-method.service';

// // // // // PrimeNG Modules
// // // // import { ButtonModule } from 'primeng/button';
// // // // import { TabsModule } from 'primeng/tabs';
// // // // import { SelectModule } from 'primeng/select';
// // // // import { IconFieldModule } from 'primeng/iconfield';
// // // // import { InputIconModule } from 'primeng/inputicon';
// // // // import { InputTextModule } from 'primeng/inputtext';
// // // // import { TooltipModule } from 'primeng/tooltip';
// // // // import { SkeletonModule } from 'primeng/skeleton';
// // // // import { DatePickerModule } from 'primeng/datepicker';
// // // // import { DialogModule } from 'primeng/dialog';
// // // // import { RadioButtonModule } from 'primeng/radiobutton';

// // // // // Shared Components
// // // // import { AgShareGrid } from "../../shared/components/ag-shared-grid";

// // // // type LedgerTab = 'all' | 'customer' | 'supplier' | 'orgSummary' | 'pnl' | 'balanceSheet' | 'trialBalance';

// // // // @Component({
// // // //   selector: 'app-ledger',
// // // //   standalone: true,
// // // //   imports: [
// // // //     CommonModule,
// // // //     FormsModule,
// // // //     ReactiveFormsModule,
// // // //     TabsModule,
// // // //     ButtonModule,
// // // //     SelectModule,
// // // //     IconFieldModule,
// // // //     InputIconModule,
// // // //     InputTextModule,
// // // //     TooltipModule,
// // // //     SkeletonModule,
// // // //     DatePickerModule,
// // // //     DialogModule,
// // // //     RadioButtonModule,
// // // //     AgShareGrid
// // // //   ],
// // // //   templateUrl: './ledger.html',
// // // //   styleUrl: './ledger.scss'
// // // // })
// // // // export class LedgerComponent implements OnInit {

// // // //   // --- Services ---
// // // //   private fb = inject(FormBuilder);
// // // //   private masterList = inject(MasterListService);
// // // //   private financialService = inject(FinancialService);
// // // //   public common = inject(CommonMethodService);

// // // //   // --- State ---
// // // //   tabValue = signal<number>(0);
// // // //   currentTab = computed<LedgerTab>(() => this.getTabType(this.tabValue()));

// // // //   // Forms
// // // //   filterForm!: FormGroup; 
// // // //   exportForm!: FormGroup; 

// // // //   // Export Dialog State
// // // //   showExportDialog = signal(false);
// // // //   isExporting = signal(false);

// // // //   // Data Signals
// // // //   data = signal<any[]>([]);
// // // //   column = signal<any[]>([]);
// // // //   isLoading = signal(false);

// // // //   // Options
// // // //   customerOptions = computed(() => this.masterList.customers().map(c => ({ label: c.name, value: c._id })));
// // // //   supplierOptions = computed(() => this.masterList.suppliers().map((s: any) => ({ label: s.companyName, value: s._id })));

// // // //   constructor() {
// // // //     effect(() => {
// // // //       const tab = this.currentTab();
// // // //       this.initColumns(tab);
      
// // // //       if (this.canLoadData(tab)) {
// // // //         this.loadData(tab);
// // // //       } else {
// // // //         this.data.set([]);
// // // //       }
// // // //     });
// // // //   }

// // // //   ngOnInit(): void {
// // // //     this.initForms();
// // // //   }

// // // //   initForms() {
// // // //     const now = new Date();
// // // //     const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
// // // //     const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// // // //     this.filterForm = this.fb.group({
// // // //       customerId: [null],
// // // //       supplierId: [null],
// // // //       dateRange: [[firstDay, lastDay]]
// // // //     });

// // // //     this.exportForm = this.fb.group({
// // // //       exportType: ['all'], 
// // // //       specificId: [null],
// // // //       dateRange: [[firstDay, lastDay]]
// // // //     });
// // // //   }

// // // //   getTabType(index: number): LedgerTab {
// // // //     const tabs: LedgerTab[] = ['all', 'customer', 'supplier', 'orgSummary', 'pnl', 'balanceSheet', 'trialBalance'];
// // // //     return tabs[index] || 'all';
// // // //   }

// // // //   onTabChange(event: any) {
// // // //     this.tabValue.set(event);
// // // //   }

// // // //   // --- Helpers ---

// // // //   private canLoadData(tab: LedgerTab): boolean {
// // // //     const v = this.filterForm.value;
// // // //     if (tab === 'customer' && !v.customerId) return false;
// // // //     if (tab === 'supplier' && !v.supplierId) return false;
// // // //     return true;
// // // //   }

// // // //   private getApiParams(formValue: any) {
// // // //     const { customerId, supplierId, dateRange } = formValue;
// // // //     const params: any = {};

// // // //     if (dateRange && dateRange[0]) params.startDate = dateRange[0].toISOString();
// // // //     if (dateRange && dateRange[1]) params.endDate = dateRange[1].toISOString();
    
// // // //     if (this.currentTab() === 'customer') params.customerId = customerId;
// // // //     if (this.currentTab() === 'supplier') params.supplierId = supplierId;

// // // //     return params;
// // // //   }

// // // //   // --- API Actions ---

// // // //   applyFilters() {
// // // //     if (this.canLoadData(this.currentTab())) {
// // // //       this.loadData(this.currentTab());
// // // //     }
// // // //   }

// // // //   loadData(tab: LedgerTab) {
// // // //     this.isLoading.set(true);
// // // //     let apiCall: Observable<any>;
// // // //     const params = this.getApiParams(this.filterForm.value);

// // // //     switch (tab) {
// // // //       case 'all': apiCall = this.financialService.getAllLedgers(params); break;
// // // //       case 'customer': apiCall = this.financialService.getCustomerLedger(params.customerId, params); break;
// // // //       case 'supplier': apiCall = this.financialService.getSupplierLedger(params.supplierId, params); break;
// // // //       case 'orgSummary': apiCall = this.financialService.getOrgLedgerSummary(params); break;
// // // //       case 'pnl': apiCall = this.financialService.getProfitAndLoss(params); break;
// // // //       case 'balanceSheet': apiCall = this.financialService.getBalanceSheet(params); break;
// // // //       case 'trialBalance': apiCall = this.financialService.getTrialBalance(params); break;
// // // //       default: this.isLoading.set(false); return;
// // // //     }

// // // //     this.common.apiCall(apiCall, (res) => {
// // // //       this.processResponse(tab, res);
// // // //       this.isLoading.set(false);
// // // //     }, `Load ${tab}`);
// // // //   }

// // // //   // --- EXPORT LOGIC ---

// // // //   handleExportClick() {
// // // //     const tab = this.currentTab();

// // // //     if (tab === 'all') {
// // // //       this.exportForm.patchValue({
// // // //         dateRange: this.filterForm.get('dateRange')?.value,
// // // //         exportType: 'all',
// // // //         specificId: null
// // // //       });
// // // //       this.showExportDialog.set(true);
// // // //     } 
// // // //     else {
// // // //       this.executeExport(this.filterForm.value, tab);
// // // //     }
// // // //   }

// // // //   submitExportDialog() {
// // // //     const formVal = this.exportForm.value;
// // // //     const type = formVal.exportType;
// // // //     let params = { ...formVal };

// // // //     if (type === 'customer') params.customerId = formVal.specificId;
// // // //     if (type === 'supplier') params.supplierId = formVal.specificId;

// // // //     this.executeExport(params, 'all'); 
// // // //     this.showExportDialog.set(false);
// // // //   }

// // // //   private executeExport(formSource: any, context: string) {
// // // //     this.isExporting.set(true);
    
// // // //     const params: any = { format: 'csv' };
// // // //     if (formSource.dateRange?.[0]) params.startDate = formSource.dateRange[0].toISOString();
// // // //     if (formSource.dateRange?.[1]) params.endDate = formSource.dateRange[1].toISOString();
// // // //     if (formSource.customerId) params.customerId = formSource.customerId;
// // // //     if (formSource.supplierId) params.supplierId = formSource.supplierId;

// // // //     let apiCall: Observable<Blob>;

// // // //     if (['all', 'customer', 'supplier'].includes(context) || context === 'all') {
// // // //       apiCall = this.financialService.exportLedgers(params);
// // // //     } else {
// // // //       apiCall = this.financialService.exportStatement(context as any, params);
// // // //     }

// // // //     apiCall.pipe(finalize(() => this.isExporting.set(false))).subscribe({
// // // //       next: (blob) => {
// // // //         const filename = `Ledger_Report_${new Date().toISOString().slice(0,10)}.csv`;
// // // //         this.common.downloadBlob(blob, filename);
// // // //       },
// // // //       error: (err) => this.common['messageService'].showError('Export Failed', err.message)
// // // //     });
// // // //   }

// // // //   // --- Data Mapping ---
// // // //   private processResponse(tab: LedgerTab, res: any) {
// // // //     let rows: any[] = [];
// // // //     if (tab === 'customer' || tab === 'supplier') rows = res.data.history || [];
// // // //     else if (tab === 'all') rows = res.data.data || [];
// // // //     else if (tab === 'orgSummary') {
// // // //       const s = res.data;
// // // //       rows = [
// // // //         { category: 'Revenue', account: 'Total Income', value: s.income },
// // // //         { category: 'Expenses', account: 'Total Expense', value: s.expense },
// // // //         { category: 'Net', account: 'Net Balance', value: s.netBalance }
// // // //       ];
// // // //     } else if (tab === 'pnl') {
// // // //       const p = res.data;
// // // //       rows = [
// // // //         { category: 'Revenue', account: 'Total Sales', value: p.sales.totalSales },
// // // //         { category: 'COGS', account: 'Purchases', value: p.purchases.totalPurchases },
// // // //         { category: 'Operating Expenses', account: 'Expenses', value: p.totalExpenses },
// // // //         { category: 'Result', account: 'Net Profit', value: p.netProfit },
// // // //       ];
// // // //     } else if (tab === 'balanceSheet') {
// // // //       const b = res.data;
// // // //       rows = [...this.mapObjToRows(b.assets, 'Assets'), ...this.mapObjToRows(b.liabilities, 'Liabilities'), ...this.mapObjToRows(b.equity, 'Equity')];
// // // //     } else if (tab === 'trialBalance') rows = res.data.rows || [];

// // // //     this.data.set(rows);
// // // //   }

// // // //   private mapObjToRows(obj: any, category: string) {
// // // //     if (!obj) return [];
// // // //     return Object.keys(obj).map(key => ({ category, account: key.replace(/([A-Z])/g, ' $1').trim(), amount: obj[key] }));
// // // //   }

// // // //   initColumns(tab: LedgerTab) {
// // // //     let cols: any[] = [];
// // // //     if (['all', 'customer', 'supplier'].includes(tab)) {
// // // //       cols = [
// // // //         { field: tab === 'all' ? 'entryDate' : 'date', headerName: 'Date', sortable: true, flex: 1, valueFormatter: (p: any) => this.common.formatDate(p.value) },
// // // //         { field: 'type', headerName: 'Type', width: 100, cellRenderer: (p: any) => `<span class="badge ${p.value}">${p.value}</span>` },
// // // //         { field: 'description', headerName: 'Description', flex: 2 },
// // // //         { field: 'amount', headerName: 'Amount', flex: 1, type: 'rightAligned', 
// // // //           cellStyle: (p: any) => p.data.type === 'debit' ? { color: 'var(--color-error)', fontWeight: 'bold' } : { color: 'var(--color-success)', fontWeight: 'bold' },
// // // //           valueFormatter: (p: any) => this.common.formatCurrency(p.value) 
// // // //         }
// // // //       ];
// // // //       if (tab !== 'all') cols.push({ field: 'balance', headerName: 'Running Bal', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) });
// // // //     } else if (tab === 'trialBalance') {
// // // //       cols = [
// // // //         { field: 'account', headerName: 'Account', flex: 2 },
// // // //         { field: 'debit', headerName: 'Debit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
// // // //         { field: 'credit', headerName: 'Credit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
// // // //       ];
// // // //     } else {
// // // //       cols = [
// // // //         { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
// // // //         { field: 'account', headerName: 'Description', flex: 2 },
// // // //         { field: 'value', headerName: 'Amount', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
// // // //       ];
// // // //       if (tab === 'balanceSheet') {
// // // //          cols = [
// // // //            { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
// // // //            { field: 'account', headerName: 'Account Head', flex: 2 },
// // // //            { field: 'amount', headerName: 'Balance', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
// // // //          ];
// // // //       }
// // // //     }
// // // //     this.column.set(cols);
// // // //   }

// // // //   getTrialTotal(type: 'debit' | 'credit'): number {
// // // //     if (this.currentTab() !== 'trialBalance') return 0;
// // // //     return this.data().reduce((acc, row) => acc + (row[type] || 0), 0);
// // // //   }

// // // //   eventFromGrid(event: any) {
// // // //     // console.log(event);
// // // //   }
// // // // }
