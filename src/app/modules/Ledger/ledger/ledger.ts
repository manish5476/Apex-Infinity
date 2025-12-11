import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Services
import { MasterListService } from '../../../core/services/master-list.service';
import { FinancialService } from '../financial.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog'; // ✅ NEW: Dialog
import { RadioButtonModule } from 'primeng/radiobutton'; // ✅ NEW: For Export Options

// Shared Components
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';

type LedgerTab = 'all' | 'customer' | 'supplier' | 'orgSummary' | 'pnl' | 'balanceSheet' | 'trialBalance';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TabsModule,
    ButtonModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule,
    SharedGridComponent,
    DatePickerModule,
    DialogModule,
    RadioButtonModule
  ],
  templateUrl: './ledger.html',
  styleUrl: './ledger.scss'
})
export class LedgerComponent implements OnInit {
  // --- Services ---
  private fb = inject(FormBuilder);
  private masterList = inject(MasterListService);
  private financialService = inject(FinancialService);
  public common = inject(CommonMethodService);

  // --- State ---
  tabValue = signal<number>(0);
  currentTab = computed<LedgerTab>(() => this.getTabType(this.tabValue()));

  // Forms
  filterForm!: FormGroup; // Main Header Filters
  exportForm!: FormGroup; // Dialog Filters

  // Export Dialog State
  showExportDialog = signal(false);
  isExporting = signal(false);

  // Data Signals
  data = signal<any[]>([]);
  column = signal<any[]>([]);
  isLoading = signal(false);

  // Options
  customerOptions = computed(() => this.masterList.customers().map(c => ({ label: c.name, value: c._id })));
  supplierOptions = computed(() => this.masterList.suppliers().map((s: any) => ({ label: s.companyName, value: s._id })));

  constructor() {
    effect(() => {
      const tab = this.currentTab();
      this.initColumns(tab);
      
      // Auto-load if filters are valid
      if (this.canLoadData(tab)) {
        this.loadData(tab);
      } else {
        this.data.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
  }

  initForms() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Main Header Filter
    this.filterForm = this.fb.group({
      customerId: [null],
      supplierId: [null],
      dateRange: [[firstDay, lastDay]]
    });

    // 2. Export Dialog Form (For Tab 0 specific exports)
    this.exportForm = this.fb.group({
      exportType: ['all'], // 'all', 'customer', 'supplier'
      specificId: [null],
      dateRange: [[firstDay, lastDay]]
    });
  }

  getTabType(index: number): LedgerTab {
    const tabs: LedgerTab[] = ['all', 'customer', 'supplier', 'orgSummary', 'pnl', 'balanceSheet', 'trialBalance'];
    return tabs[index] || 'all';
  }

  onTabChange(event: any) {
    this.tabValue.set(event);
  }

  // --- 🛠️ Helpers ---

  private canLoadData(tab: LedgerTab): boolean {
    const v = this.filterForm.value;
    if (tab === 'customer' && !v.customerId) return false;
    if (tab === 'supplier' && !v.supplierId) return false;
    return true;
  }

  private getApiParams(formValue: any) {
    const { customerId, supplierId, dateRange } = formValue;
    const params: any = {};

    if (dateRange && dateRange[0]) params.startDate = dateRange[0].toISOString();
    if (dateRange && dateRange[1]) params.endDate = dateRange[1].toISOString();
    
    // For Header Filters, context is strict
    if (this.currentTab() === 'customer') params.customerId = customerId;
    if (this.currentTab() === 'supplier') params.supplierId = supplierId;

    return params;
  }

  // --- 📡 API Actions ---

  applyFilters() {
    if (this.canLoadData(this.currentTab())) {
      this.loadData(this.currentTab());
    }
  }

  loadData(tab: LedgerTab) {
    this.isLoading.set(true);
    let apiCall: Observable<any>;
    const params = this.getApiParams(this.filterForm.value);

    switch (tab) {
      case 'all': apiCall = this.financialService.getAllLedgers(params); break;
      case 'customer': apiCall = this.financialService.getCustomerLedger(params.customerId, params); break;
      case 'supplier': apiCall = this.financialService.getSupplierLedger(params.supplierId, params); break;
      case 'orgSummary': apiCall = this.financialService.getOrgLedgerSummary(params); break;
      case 'pnl': apiCall = this.financialService.getProfitAndLoss(params); break;
      case 'balanceSheet': apiCall = this.financialService.getBalanceSheet(params); break;
      case 'trialBalance': apiCall = this.financialService.getTrialBalance(params); break;
      default: this.isLoading.set(false); return;
    }

    this.common.apiCall(apiCall, (res) => {
      this.processResponse(tab, res);
      this.isLoading.set(false);
    }, `Load ${tab}`);
  }

  // --- 📤 EXPORT LOGIC ---

  handleExportClick() {
    const tab = this.currentTab();

    // Condition 1: If on "All Transactions", Open Dialog for advanced options
    if (tab === 'all') {
      // Pre-fill dialog with current header dates
      this.exportForm.patchValue({
        dateRange: this.filterForm.get('dateRange')?.value,
        exportType: 'all',
        specificId: null
      });
      this.showExportDialog.set(true);
    } 
    // Condition 2: Contextual Tabs (Direct Export)
    else {
      this.executeExport(this.filterForm.value, tab);
    }
  }

  // Called from Dialog Submit
  submitExportDialog() {
    const formVal = this.exportForm.value;
    const type = formVal.exportType;
    let params = { ...formVal };

    // Map 'specificId' to correct param key based on radio selection
    if (type === 'customer') params.customerId = formVal.specificId;
    if (type === 'supplier') params.supplierId = formVal.specificId;

    this.executeExport(params, 'all'); // 'all' logic in service handles filters
    this.showExportDialog.set(false);
  }

  private executeExport(formSource: any, context: string) {
    this.isExporting.set(true);
    
    // 1. Build Params
    const params: any = { format: 'csv' };
    if (formSource.dateRange?.[0]) params.startDate = formSource.dateRange[0].toISOString();
    if (formSource.dateRange?.[1]) params.endDate = formSource.dateRange[1].toISOString();
    if (formSource.customerId) params.customerId = formSource.customerId;
    if (formSource.supplierId) params.supplierId = formSource.supplierId;

    let apiCall: Observable<Blob>;

    // 2. Select Service Call
    if (['all', 'customer', 'supplier'].includes(context) || context === 'all') {
      apiCall = this.financialService.exportLedgers(params);
    } else {
      apiCall = this.financialService.exportStatement(context as any, params);
    }

    // 3. Execute
    apiCall.pipe(finalize(() => this.isExporting.set(false))).subscribe({
      next: (blob) => {
        const filename = `Ledger_Report_${new Date().toISOString().slice(0,10)}.csv`;
        this.common.downloadBlob(blob, filename);
      },
      error: (err) => this.common['messageService'].showError('Export Failed', err.message)
    });
  }

  // --- 📊 Data Mapping ---
  private processResponse(tab: LedgerTab, res: any) {
    let rows: any[] = [];
    if (tab === 'customer' || tab === 'supplier') rows = res.data.history || [];
    else if (tab === 'all') rows = res.data.data || [];
    else if (tab === 'orgSummary') {
      const s = res.data;
      rows = [
        { category: 'Revenue', account: 'Total Income', value: s.income },
        { category: 'Expenses', account: 'Total Expense', value: s.expense },
        { category: 'Net', account: 'Net Balance', value: s.netBalance }
      ];
    } else if (tab === 'pnl') {
      const p = res.data;
      rows = [
        { category: 'Revenue', account: 'Total Sales', value: p.sales.totalSales },
        { category: 'COGS', account: 'Purchases', value: p.purchases.totalPurchases },
        { category: 'Operating Expenses', account: 'Expenses', value: p.totalExpenses },
        { category: 'Result', account: 'Net Profit', value: p.netProfit },
      ];
    } else if (tab === 'balanceSheet') {
      const b = res.data;
      rows = [...this.mapObjToRows(b.assets, 'Assets'), ...this.mapObjToRows(b.liabilities, 'Liabilities'), ...this.mapObjToRows(b.equity, 'Equity')];
    } else if (tab === 'trialBalance') rows = res.data.rows || [];

    this.data.set(rows);
  }

  private mapObjToRows(obj: any, category: string) {
    if (!obj) return [];
    return Object.keys(obj).map(key => ({ category, account: key.replace(/([A-Z])/g, ' $1').trim(), amount: obj[key] }));
  }

  initColumns(tab: LedgerTab) {
    let cols: any[] = [];
    if (['all', 'customer', 'supplier'].includes(tab)) {
      cols = [
        { field: tab === 'all' ? 'entryDate' : 'date', headerName: 'Date', sortable: true, flex: 1, valueFormatter: (p: any) => this.common.formatDate(p.value) },
        { field: 'type', headerName: 'Type', width: 100, cellRenderer: (p: any) => `<span class="badge ${p.value}">${p.value}</span>` },
        { field: 'description', headerName: 'Description', flex: 2 },
        { field: 'amount', headerName: 'Amount', flex: 1, type: 'rightAligned', 
          cellStyle: (p: any) => p.data.type === 'debit' ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' },
          valueFormatter: (p: any) => this.common.formatCurrency(p.value) 
        }
      ];
      if (tab !== 'all') cols.push({ field: 'balance', headerName: 'Running Bal', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) });
    } else if (tab === 'trialBalance') {
      cols = [
        { field: 'account', headerName: 'Account', flex: 2 },
        { field: 'debit', headerName: 'Debit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
        { field: 'credit', headerName: 'Credit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
      ];
    } else {
      cols = [
        { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
        { field: 'account', headerName: 'Description', flex: 2 },
        { field: 'value', headerName: 'Amount', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
      ];
      if (tab === 'balanceSheet') {
         cols = [
           { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
           { field: 'account', headerName: 'Account Head', flex: 2 },
           { field: 'amount', headerName: 'Balance', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
         ];
      }
    }
    this.column.set(cols);
  }

  getTrialTotal(type: 'debit' | 'credit'): number {
    if (this.currentTab() !== 'trialBalance') return 0;
    return this.data().reduce((acc, row) => acc + (row[type] || 0), 0);
  }
}

// import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// import { Observable } from 'rxjs';
// import { finalize } from 'rxjs/operators';

// // Services
// import { MasterListService } from '../../../core/services/master-list.service';
// import { FinancialService } from '../financial.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';

// // PrimeNG Modules
// import { ButtonModule } from 'primeng/button';
// import { TabsModule } from 'primeng/tabs';
// import { SelectModule } from 'primeng/select';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { InputTextModule } from 'primeng/inputtext';
// import { TooltipModule } from 'primeng/tooltip';
// import { SkeletonModule } from 'primeng/skeleton';
// import { DatePickerModule } from 'primeng/datepicker'; // ✅ NEW: For Date Range

// // Shared Components
// import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';

// type LedgerTab = 'all' | 'customer' | 'supplier' | 'orgSummary' | 'pnl' | 'balanceSheet' | 'trialBalance';

// @Component({
//   selector: 'app-ledger',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     TabsModule,
//     ButtonModule,
//     SelectModule,
//     IconFieldModule,
//     InputIconModule,
//     InputTextModule,
//     TooltipModule,
//     SkeletonModule,
//     SharedGridComponent,
//     DatePickerModule // ✅ Import DatePicker
//   ],
//   templateUrl: './ledger.html',
//   styleUrl: './ledger.scss'
// })
// export class LedgerComponent implements OnInit {
//   // --- Services ---
//   private fb = inject(FormBuilder);
//   private masterList = inject(MasterListService);
//   private financialService = inject(FinancialService);
//   public common = inject(CommonMethodService);

//   // --- State ---
//   tabValue = signal<number>(0);
//   currentTab = computed<LedgerTab>(() => this.getTabType(this.tabValue()));

//   // Filter Form
//   filterForm!: FormGroup;

//   // Data Signals
//   data = signal<any[]>([]);
//   column = signal<any[]>([]);
//   isLoading = signal(false);

//   // Options
//   customerOptions = computed(() => this.masterList.customers().map(c => ({ label: c.name, value: c._id })));
//   supplierOptions = computed(() => this.masterList.suppliers().map((s: any) => ({ label: s.companyName, value: s._id })));

//   constructor() {
//     effect(() => {
//       const tab = this.currentTab();
//       this.initColumns(tab);

//       // Auto-load if filters are valid
//       if (this.canLoadData(tab)) {
//         this.loadData(tab);
//       } else {
//         this.data.set([]);
//       }
//     });
//   }

//   ngOnInit(): void {
//     this.initFilterForm();
//   }

//   initFilterForm() {
//     // Default to current month
//     const now = new Date();
//     const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
//     const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//     this.filterForm = this.fb.group({
//       customerId: [null],
//       supplierId: [null],
//       dateRange: [[firstDay, lastDay]] // ✅ Date Range Control
//     });
//   }

//   getTabType(index: number): LedgerTab {
//     const tabs: LedgerTab[] = ['all', 'customer', 'supplier', 'orgSummary', 'pnl', 'balanceSheet', 'trialBalance'];
//     return tabs[index] || 'all';
//   }

//   onTabChange(event: any) {
//     this.tabValue.set(event);
//     // Reset specific filters when switching tabs (optional)
//     // this.filterForm.patchValue({ customerId: null, supplierId: null }); 
//   }

//   // --- 🛠️ Helpers ---

//   // Check if we have enough info to call API
//   private canLoadData(tab: LedgerTab): boolean {
//     const v = this.filterForm.value;
//     if (tab === 'customer' && !v.customerId) return false;
//     if (tab === 'supplier' && !v.supplierId) return false;
//     return true;
//   }

//   // Extract pure params for API
//   private getApiParams() {
//     const { customerId, supplierId, dateRange } = this.filterForm.value;
//     const params: any = {};

//     if (dateRange && dateRange[0]) params.startDate = dateRange[0].toISOString();
//     if (dateRange && dateRange[1]) params.endDate = dateRange[1].toISOString();

//     if (this.currentTab() === 'customer') params.customerId = customerId;
//     if (this.currentTab() === 'supplier') params.supplierId = supplierId;

//     return params;
//   }

//   // --- 📡 API Actions ---

//   applyFilters() {
//     if (this.canLoadData(this.currentTab())) {
//       this.loadData(this.currentTab());
//     }
//   }

//   loadData(tab: LedgerTab) {
//     this.isLoading.set(true);
//     let apiCall: Observable<any>;
//     const params = this.getApiParams();

//     // 1. Select API Call based on Tab
//     switch (tab) {
//       case 'all': apiCall = this.financialService.getAllLedgers(params); break;
//       case 'customer': apiCall = this.financialService.getCustomerLedger(params.customerId, params); break;
//       case 'supplier': apiCall = this.financialService.getSupplierLedger(params.supplierId, params); break;
//       case 'orgSummary': apiCall = this.financialService.getOrgLedgerSummary(params); break;
//       case 'pnl': apiCall = this.financialService.getProfitAndLoss(params); break;
//       case 'balanceSheet': apiCall = this.financialService.getBalanceSheet(params); break;
//       case 'trialBalance': apiCall = this.financialService.getTrialBalance(params); break;
//       default: this.isLoading.set(false); return;
//     }

//     // 2. Execute
//     this.common.apiCall(apiCall, (res) => {
//       this.processResponse(tab, res);
//       this.isLoading.set(false);
//     }, `Load ${tab}`);
//   }

//   exportReport() {
//     const tab = this.currentTab();
//     const params = { ...this.getApiParams(), format: 'csv' };
//     let apiCall: Observable<Blob>;

//     // 1. Determine Export Endpoint
//     if (['all', 'customer', 'supplier'].includes(tab)) {
//       apiCall = this.financialService.exportLedgers(params);
//     } else if (['pnl', 'balanceSheet', 'trialBalance'].includes(tab)) {
//       apiCall = this.financialService.exportStatement(tab as any, params);
//     } else {
//       this.common['messageService'].showInfo('Info', 'Export not available for this view.');
//       return;
//     }

//     // 2. Download
//     this.common.apiCall(apiCall, (blob) => {
//       const filename = `${tab}_report_${new Date().toISOString().slice(0, 10)}.csv`;
//       this.common.downloadBlob(blob, filename);
//     }, 'Export Report');
//   }

//   // --- 📊 Data Mapping ---

//   private processResponse(tab: LedgerTab, res: any) {
//     let rows: any[] = [];

//     if (tab === 'customer' || tab === 'supplier') {
//       rows = res.data.history || [];
//     } else if (tab === 'all') {
//       rows = res.data.data || [];
//     } else if (tab === 'orgSummary') {
//       const s = res.data;
//       rows = [
//         { category: 'Revenue', account: 'Total Income', value: s.income },
//         { category: 'Expenses', account: 'Total Expense', value: s.expense },
//         { category: 'Net', account: 'Net Balance', value: s.netBalance }
//       ];
//     } else if (tab === 'pnl') {
//       const p = res.data;
//       rows = [
//         { category: 'Revenue', account: 'Total Sales', value: p.sales.totalSales },
//         { category: 'COGS', account: 'Purchases', value: p.purchases.totalPurchases },
//         { category: 'Operating Expenses', account: 'Expenses', value: p.totalExpenses },
//         { category: 'Result', account: 'Net Profit', value: p.netProfit },
//       ];
//     } else if (tab === 'balanceSheet') {
//       const b = res.data;
//       rows = [
//         ...this.mapObjToRows(b.assets, 'Assets'),
//         ...this.mapObjToRows(b.liabilities, 'Liabilities'),
//         ...this.mapObjToRows(b.equity, 'Equity'),
//       ];
//     } else if (tab === 'trialBalance') {
//       rows = res.data.rows || [];
//     }

//     this.data.set(rows);
//   }

//   private mapObjToRows(obj: any, category: string) {
//     if (!obj) return [];
//     return Object.keys(obj).map(key => ({
//       category,
//       account: key.replace(/([A-Z])/g, ' $1').trim(),
//       amount: obj[key]
//     }));
//   }

//   // ... (Keep existing Column Definitions and getTrialTotal) ...

//   // --- Columns (Same as before) ---
//   initColumns(tab: LedgerTab) {
//     let cols: any[] = [];
//     if (['all', 'customer', 'supplier'].includes(tab)) {
//       cols = [
//         { field: tab === 'all' ? 'entryDate' : 'date', headerName: 'Date', sortable: true, flex: 1, valueFormatter: (p: any) => this.common.formatDate(p.value) },
//         { field: 'type', headerName: 'Type', width: 100, cellRenderer: (p: any) => `<span class="badge ${p.value}">${p.value}</span>` },
//         { field: 'description', headerName: 'Description', flex: 2 },
//         {
//           field: 'amount', headerName: 'Amount', flex: 1, type: 'rightAligned',
//           cellStyle: (p: any) => p.data.type === 'debit' ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' },
//           valueFormatter: (p: any) => this.common.formatCurrency(p.value)
//         }
//       ];
//       // Add balance column for specific ledgers
//       if (tab !== 'all') {
//         cols.push({ field: 'balance', headerName: 'Running Bal', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) });
//       }
//     } else if (tab === 'trialBalance') {
//       cols = [
//         { field: 'account', headerName: 'Account', flex: 2 },
//         { field: 'debit', headerName: 'Debit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
//         { field: 'credit', headerName: 'Credit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
//       ];
//     } else {
//       cols = [
//         { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
//         { field: 'account', headerName: 'Description', flex: 2 },
//         { field: 'value', headerName: 'Amount', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
//       ];
//       if (tab === 'balanceSheet') {
//         cols = [
//           { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
//           { field: 'account', headerName: 'Account Head', flex: 2 },
//           { field: 'amount', headerName: 'Balance', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
//         ];
//       }
//     }
//     this.column.set(cols);
//   }

//   getTrialTotal(type: 'debit' | 'credit'): number {
//     if (this.currentTab() !== 'trialBalance') return 0;
//     return this.data().reduce((acc, row) => acc + (row[type] || 0), 0);
//   }
  
// }