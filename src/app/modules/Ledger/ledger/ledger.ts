import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MasterListService } from '../../../core/services/master-list.service';
import { FinancialService } from '../financial.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { Observable, forkJoin } from 'rxjs';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { TabsModule } from 'primeng/tabs';
import { Select } from 'primeng/select';

// Define Tab types
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
    Select,
    SharedGridComponent
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
  filterForm!: FormGroup;

  data = signal<any[]>([]);
  column = signal<any[]>([]);
  rowSelectionMode = 'single';
  isLoading = signal(false);

  // Master List Options (Using computed for reactive updates)
  customerOptions = computed(() => this.masterList.customers().map(c => ({ label: c.name, value: c._id })));
  supplierOptions = computed(() => this.masterList.suppliers().map((s:any) => ({ label: s.companyName, value: s._id })));
  activeid: any;

  constructor() {
    effect(() => {
      // Log the current tab and load data reactively
      const tab = this.currentTab();
      this.initColumns(tab);
      this.loadData(tab);
    });
  }

  getTrialBalanceTotal(type: 'debit' | 'credit'): number {
    const trialBalanceData = this.data();
    const totalsRow = trialBalanceData.find((d: any) => d.totals);
    return totalsRow?.totals?.[type] || 0;
  }

  ngOnInit(): void {
    this.initFilterForm();
  }

  // --- Initialization ---

  initFilterForm() {
    this.filterForm = this.fb.group({
      customerId: [null],
      supplierId: [null],
      // Add date/period filters here if needed for statements
    });
  }

  // Helper to map tab index to a key
  getTabType(index: number): LedgerTab {
    const tabs: LedgerTab[] = ['all', 'customer', 'supplier', 'orgSummary', 'pnl', 'balanceSheet', 'trialBalance'];
    return tabs[index] || 'all';
  }

  // --- Column Definitions ---

  // Shared columns for transactional ledgers (All, Customer, Supplier)
  private getTransactionLedgerColumns() {
    return [
      { field: '_id', headerName: 'ID', hide: true },
      {
        field: 'entryDate',
        headerName: 'Date',
        sortable: true,
        valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd/MM/yyyy')
      },
      {
        field: 'type',
        headerName: 'Type',
        sortable: true,
        valueFormatter: (params: any) => params.value.charAt(0).toUpperCase() + params.value.slice(1)
      },
      {
        field: 'description',
        headerName: 'Description',
        sortable: false,
        flex: 2
      },
      {
        field: 'customerId',
        headerName: 'Customer',
        sortable: true,
        // Resolve customer ID to name using masterList
        valueGetter: (params: any) => params.data.customerId ?
          this.masterList.customers().find(c => c._id === params.data.customerId)?.name || params.data.customerId : '-'
      },
      {
        field: 'amount',
        headerName: 'Amount',
        sortable: true,
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
          return params.data.type === 'debit' ? { color: 'red', fontWeight: 'bold' } : { color: 'green', fontWeight: 'bold' };
        }
      },
      {
        field: 'balance',
        headerName: 'Balance',
        sortable: true,
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        hide: this.currentTab() === 'all', // Balance is specific to customer/supplier ledger
        cellStyle: { fontWeight: 'bold' }
      }
    ];
  }

  // Columns for Org Summary (Income, Expense, Net Balance)
  private getOrgSummaryColumns() {
    return [
      { field: 'category', headerName: 'Category', cellStyle: { fontWeight: 'bold' } },
      {
        field: 'value',
        headerName: 'Amount',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => {
          return params.data.category === 'Expense' ? { color: 'red' } : { color: 'green' };
        }
      }
    ];
  }

  // Columns for Profit & Loss Statement (Sales, Purchases, Profit)
  private getProfitAndLossColumns() {
    return [
      { field: 'account', headerName: 'Account', cellStyle: { fontWeight: 'bold' } },
      { field: 'value', headerName: 'Amount', valueFormatter: (params: any) => this.common.formatCurrency(params.value) }
    ];
  }

  // Columns for Trial Balance
  private getTrialBalanceColumns() {
    return [
      { field: 'account', headerName: 'Account', cellStyle: { fontWeight: 'bold' } },
      { field: 'debit', headerName: 'Debit', valueFormatter: (params: any) => this.common.formatCurrency(params.value) },
      { field: 'credit', headerName: 'Credit', valueFormatter: (params: any) => this.common.formatCurrency(params.value) }
    ];
  }

  // Columns for Balance Sheet (Assets, Liabilities, Equity)
  private getBalanceSheetColumns() {
    return [
      { field: 'category', headerName: 'Category', width: 200, cellStyle: { fontWeight: 'bold', backgroundColor: '#f0f0f0' } },
      { field: 'account', headerName: 'Account', flex: 1 },
      { field: 'amount', headerName: 'Amount', valueFormatter: (params: any) => this.common.formatCurrency(params.value) }
    ];
  }

  initColumns(tab: LedgerTab) {
    let cols: any[] = [];
    switch (tab) {
      case 'all':
      case 'customer':
      case 'supplier':
        cols = this.getTransactionLedgerColumns();
        break;
      case 'orgSummary':
        cols = this.getOrgSummaryColumns();
        break;
      case 'pnl':
        cols = this.getProfitAndLossColumns();
        break;
      case 'balanceSheet':
        cols = this.getBalanceSheetColumns();
        break;
      case 'trialBalance':
        cols = this.getTrialBalanceColumns();
        break;
    }
    this.column.set(cols);
  }

  // --- Data Loading ---

  onTabChange(event: any) {
    this.activeid=event
    this.tabValue.set(event);
  }

  applyFilters() {
    this.loadData(this.currentTab());
  }

  loadData(tab: LedgerTab) {
    this.isLoading.set(true);
    let apiCall: Observable<any>;
    const filterParams = this.filterForm.value; // For P&L/Balance Sheet filters

    switch (tab) {
      case 'all':
        apiCall = this.financialService.getAllLedgers();
        break;
      case 'customer':
        const customerId = this.filterForm.value.customerId;
        if (!customerId) { this.data.set([]); this.isLoading.set(false); return; }
        apiCall = this.financialService.getCustomerLedger(customerId);
        break;
      case 'supplier':
        console.log(this.filterForm);
        const supplierId = this.filterForm.value.supplierId;
        if (!supplierId) { this.data.set([]); this.isLoading.set(false); return; }
        apiCall = this.financialService.getSupplierLedger(supplierId);
        break;
      case 'orgSummary':
        apiCall = this.financialService.getOrgLedgerSummary();
        break;
      case 'pnl':
        apiCall = this.financialService.getProfitAndLoss(filterParams);
        break;
      case 'balanceSheet':
        apiCall = this.financialService.getBalanceSheet(filterParams);
        break;
      case 'trialBalance':
        apiCall = this.financialService.getTrialBalance(filterParams);
        break;
    }

    apiCall.subscribe({
      next: (res: any) => {
        let processedData: any[] = [];

        // --- Data Mapping Logic for different APIs ---
        if (tab === 'customer' || tab === 'supplier') {
          // Flatten 'history' array
          processedData = res.data.history || [];
          // Add closing balance as a footer/summary row (Optional: handled outside grid normally)
          // processedData.push({ description: 'Closing Balance', amount: res.data.closingBalance, type: 'summary' });
        } else if (tab === 'all') {
          // Un-nest 'data' property
          processedData = res.data.data || [];
        } else if (tab === 'orgSummary') {
          // Transform summary object into array for grid
          const summary = res.data;
          processedData = [
            { category: 'Income', value: summary.income },
            { category: 'Expense', value: summary.expense },
            { category: 'Net Balance', value: summary.netBalance }
          ];
        } else if (tab === 'pnl') {
          // Flatten P&L structure
          const pnl = res.data;
          processedData = [
            { account: 'Total Sales', value: pnl.sales.totalSales, category: 'Income' },
            { account: 'Total Purchases', value: pnl.purchases.totalPurchases, category: 'COGS' },
            { account: 'Gross Profit', value: pnl.grossProfit, category: 'Profit' },
            { account: 'Total Expenses', value: pnl.totalExpenses, category: 'Expense' },
            { account: 'Net Profit', value: pnl.netProfit, category: 'Profit' },
          ];
        } else if (tab === 'balanceSheet') {
          // Flatten Balance Sheet structure
          const bs = res.data;
          processedData = [
            { category: 'Assets', account: 'Cash', amount: bs.assets.cash },
            { category: 'Assets', account: 'Receivables', amount: bs.assets.receivables },
            { category: 'Liabilities', account: 'Payables', amount: bs.liabilities.payables },
            { category: 'Liabilities', account: 'Other Liabilities', amount: bs.liabilities.other },
            { category: 'Equity', account: 'Retained Earnings', amount: bs.equity.retainedEarnings },
            { category: 'Equity', account: 'Other Equity', amount: bs.equity.otherEquity }
          ];
        } else if (tab === 'trialBalance') {
          // Use 'rows' directly
          processedData = res.data.rows || [];
        }

        this.data.set(processedData);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.common.createErrorHandler(`Load ${tab} Ledger`)(err).subscribe();
        this.data.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onGridEvent(event: any) {
    console.log('Grid event:', event);
  }
}


// import { Component, OnInit, inject, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// import { MasterListService } from '../../../core/services/master-list.service';
// import { FinancialService } from '../financial.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';

// // PrimeNG Modules
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { TabsModule } from 'primeng/tabs';
// import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';

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
//     SharedGridComponent
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
//   tabValue = 0;
//   currentTab = signal<'all' | 'customer' | 'supplier' | 'summary'>('all');
//   filterForm!: FormGroup;

//   data: any[] = [];
//   column: any[] = [];
//   rowSelectionMode = 'single';
//   isLoading = signal(false);

//   customerOptions = signal<any[]>([]);
//   supplierOptions = signal<any[]>([]);

//   constructor() {
//     effect(() => {
//       this.customerOptions.set(this.masterList.customers());
//       this.supplierOptions.set(this.masterList.suppliers());
//     });
//   }

//   ngOnInit(): void {
//     this.initFilterForm();
//     this.initColumns();
//     this.loadData(this.currentTab());
//   }

//   initFilterForm() {
//     this.filterForm = this.fb.group({
//       customerId: [null],
//       supplierId: [null]
//     });
//   }

//   initColumns() {
//     this.column = [
//   {
//     field: '_id',
//     headerName: 'ID',
//     hide: true // Internal ID, usually hidden
//   },
//   {
//     field: 'entryDate',
//     headerName: 'Date',
//     sortable: true,
//     filter: 'agDateColumnFilter',
//     valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd/MM/yyyy')
//   },
//   {
//     field: 'type',
//     headerName: 'Type',
//     sortable: true,
//     filter: true,
//     valueFormatter: (params: any) => params.value === 'debit' ? 'Debit' : 'Credit'
//   },
//   {
//     field: 'accountType',
//     headerName: 'Account Type',
//     sortable: true,
//     filter: true,
//     valueFormatter: (params: any) => params.value.charAt(0).toUpperCase() + params.value.slice(1)
//   },
//   {
//     field: 'customerId',
//     headerName: 'Customer',
//     sortable: true,
//     filter: true,
//     // valueGetter: (params: any) => {
//     //   // Convert ID to name using masterList
//     //   // return this.masterList.customerName(params.data.customerId);
//     // }
//   },
//   {
//     field: 'invoiceId',
//     headerName: 'Invoice ID',
//     sortable: true,
//     filter: true,
//     valueGetter: (params: any) => params.data.invoiceId || '-'
//   },
//   {
//     field: 'paymentId',
//     headerName: 'Payment ID',
//     sortable: true,
//     filter: true,
//     valueGetter: (params: any) => params.data.paymentId || '-'
//   },
//   {
//     field: 'description',
//     headerName: 'Description',
//     sortable: false,
//     filter: true,
//     flex: 2
//   },
//   {
//     field: 'amount',
//     headerName: 'Amount',
//     sortable: true,
//     filter: 'agNumberColumnFilter',
//     valueFormatter: (params: any) => this.common.formatCurrency(params.value),
//     cellStyle: (params: any) => {
//       // Optional: color-code debit/credit
//       return params.data.type === 'debit' ? { color: 'red' } : { color: 'green' };
//     }
//   },
//   {
//     field: 'isReversed',
//     headerName: 'Reversed',
//     sortable: true,
//     filter: true,
//     valueFormatter: (params: any) => params.value ? 'Yes' : 'No'
//   }
// ];

//     // this.column = [
//     //   { field: 'name', headerName: 'Ledger Name', sortable: true, filter: true },
//     //   { field: 'type', headerName: 'Type', sortable: true, filter: true },
//     //   { field: 'balance', headerName: 'Balance', sortable: true, filter: true, valueFormatter: (params: any) => this.common.formatCurrency(params.value) }
//     // ];
//   }

//   onTabChange(event: any) {
//     const tabs: ('all' | 'customer' | 'supplier' | 'summary')[] = ['all', 'customer', 'supplier', 'summary'];
//     this.currentTab.set(tabs[event.index]);
//     this.loadData(tabs[event.index]);
//   }

//   applyFilters() {
//     this.loadData(this.currentTab());
//   }

//   loadData(tab: 'all' | 'customer' | 'supplier' | 'summary') {
//     this.isLoading.set(true);
//     let apiCall;

//     switch(tab) {
//       case 'all':
//         apiCall = this.financialService.getAllLedgers();
//         break;
//       case 'customer':
//         const customerId = this.filterForm.value.customerId;
//         if (!customerId) { this.data = []; this.isLoading.set(false); return; }
//         apiCall = this.financialService.getCustomerLedger(customerId);
//         break;
//       case 'supplier':
//         const supplierId = this.filterForm.value.supplierId;
//         if (!supplierId) { this.data = []; this.isLoading.set(false); return; }
//         apiCall = this.financialService.getSupplierLedger(supplierId);
//         break;
//       case 'summary':
//         apiCall = this.financialService.getOrgLedgerSummary();
//         break;
//     }

//     apiCall.subscribe({
//       next: (res: any) => {
//         this.data = res.data.data || [];
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         this.common.createErrorHandler('Load Ledger')(err).subscribe();
//         this.data = [];
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onGridEvent(event: any) {
//     console.log('Grid event:', event);
//   }
// }

