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

// Shared Components
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';

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
    SelectModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule,
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
  
  // Computed: Should we show the filter bar?
  showFilterBar = computed(() => {
    const tab = this.currentTab();
    return tab === 'customer' || tab === 'supplier';
  });

  filterForm!: FormGroup;
  data = signal<any[]>([]);
  column = signal<any[]>([]);
  isLoading = signal(false);

  // Options
  customerOptions = computed(() => this.masterList.customers().map(c => ({ label: c.name, value: c._id })));
  supplierOptions = computed(() => this.masterList.suppliers().map((s: any) => ({ label: s.companyName, value: s._id })));

  constructor() {
    // Effect: Reload data when tab changes
    effect(() => {
      const tab = this.currentTab();
      this.initColumns(tab);
      
      // Only auto-load if not dependent on a filter, or if filter is already set
      if (tab !== 'customer' && tab !== 'supplier') {
        this.loadData(tab);
      } else {
        // For customer/supplier, clear data initially until filter selected
        // Unless we want to persist previous selection (optional enhancement)
        this.data.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.initFilterForm();
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      customerId: [null],
      supplierId: [null]
    });
  }

  getTabType(index: number): LedgerTab {
    const tabs: LedgerTab[] = ['all', 'customer', 'supplier', 'orgSummary', 'pnl', 'balanceSheet', 'trialBalance'];
    return tabs[index] || 'all';
  }

  onTabChange(event: any) {
    this.tabValue.set(event);
  }

  // --- Columns ---
  private getTransactionLedgerColumns() {
    return [
      { field: 'entryDate', headerName: 'Date', sortable: true, flex: 1, valueFormatter: (p: any) => this.common.formatDate(p.value) },
      { field: 'type', headerName: 'Type', sortable: true, width: 100, cellRenderer: (p:any) => `<span class="badge ${p.value}">${p.value}</span>` },
      { field: 'description', headerName: 'Description', sortable: true, flex: 2 },
      { 
        field: 'amount', headerName: 'Amount', sortable: true, flex: 1, 
        type: 'rightAligned',
        cellStyle: (p: any) => p.data.type === 'debit' ? { color: 'var(--color-error)', fontWeight: '600' } : { color: 'var(--color-success)', fontWeight: '600' },
        valueFormatter: (p: any) => this.common.formatCurrency(p.value)
      }
    ];
  }

  private getStatementColumns() {
    return [
      { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
      { field: 'account', headerName: 'Account', flex: 2 },
      { field: 'amount', headerName: 'Total', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
    ];
  }

  // Simple Trial Balance
  private getTrialColumns() {
    return [
      { field: 'account', headerName: 'Account', flex: 2 },
      { field: 'debit', headerName: 'Debit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
      { field: 'credit', headerName: 'Credit', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
    ];
  }

  initColumns(tab: LedgerTab) {
    let cols: any[] = [];
    if (['all', 'customer', 'supplier'].includes(tab)) {
      cols = this.getTransactionLedgerColumns();
    } else if (tab === 'trialBalance') {
      cols = this.getTrialColumns();
    } else {
      // P&L, Balance Sheet, Org Summary share a similar "Account -> Amount" structure
      cols = [
        { field: 'category', headerName: 'Category', width: 150, cellStyle: { fontWeight: 'bold', color: 'var(--text-secondary)' } },
        { field: 'account', headerName: 'Description', flex: 2, cellStyle: { fontWeight: '500' } },
        { field: 'value', headerName: 'Amount', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
      ];
      
      // Small adjustments for specific APIs structure
      if(tab === 'balanceSheet') {
         cols = [
            { field: 'category', headerName: 'Category', rowGroup: true, hide: true },
            { field: 'account', headerName: 'Account Head', flex: 2 },
            { field: 'amount', headerName: 'Balance', flex: 1, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value) }
         ];
      }
    }
    this.column.set(cols);
  }

  // --- Data Loading ---

  applyFilters() {
    this.loadData(this.currentTab());
  }

  loadData(tab: LedgerTab) {
    this.isLoading.set(true);
    let apiCall: Observable<any>;
    const filters = this.filterForm.value;

    switch (tab) {
      case 'all': apiCall = this.financialService.getAllLedgers(); break;
      case 'customer': 
        if (!filters.customerId) { this.isLoading.set(false); return; }
        apiCall = this.financialService.getCustomerLedger(filters.customerId); 
        break;
      case 'supplier': 
        if (!filters.supplierId) { this.isLoading.set(false); return; }
        apiCall = this.financialService.getSupplierLedger(filters.supplierId); 
        break;
      case 'orgSummary': apiCall = this.financialService.getOrgLedgerSummary(); break;
      case 'pnl': apiCall = this.financialService.getProfitAndLoss(filters); break;
      case 'balanceSheet': apiCall = this.financialService.getBalanceSheet(filters); break;
      case 'trialBalance': apiCall = this.financialService.getTrialBalance(filters); break;
      default: this.isLoading.set(false); return;
    }

    apiCall.pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          this.processResponse(tab, res);
        },
        error: (err) => {
          this.common.createErrorHandler(`Load ${tab}`)(err).subscribe();
          this.data.set([]);
        }
      });
  }

  private processResponse(tab: LedgerTab, res: any) {
    let rows: any[] = [];
    
    if (tab === 'customer' || tab === 'supplier') {
      rows = res.data.history || [];
    } else if (tab === 'all') {
      rows = res.data.data || [];
    } else if (tab === 'orgSummary') {
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
      // Simplified mapping for grid
      rows = [
         ...this.mapObjToRows(b.assets, 'Assets'),
         ...this.mapObjToRows(b.liabilities, 'Liabilities'),
         ...this.mapObjToRows(b.equity, 'Equity'),
      ];
    } else if (tab === 'trialBalance') {
      rows = res.data.rows || [];
    }

    this.data.set(rows);
  }

  private mapObjToRows(obj: any, category: string) {
     if(!obj) return [];
     return Object.keys(obj).map(key => ({
        category,
        account: key.replace(/([A-Z])/g, ' $1').trim(), // camelCase to Space
        amount: obj[key]
     }));
  }

  // Helper for Trial Balance Footer
  getTrialTotal(type: 'debit' | 'credit'): number {
    if (this.currentTab() !== 'trialBalance') return 0;
    // Assuming backend returns a totals row or we calc it. 
    // For now, summing client side:
    return this.data().reduce((acc, row) => acc + (row[type] || 0), 0);
  }
}
