import { Component, OnInit, inject, signal, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

// AG Grid
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

// Services
import { SupplierService } from '../../services/supplier-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { TransactionService } from '../../../transactions/transaction.service';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, TagModule, SkeletonModule, AvatarModule,
    InputTextModule, DatePickerModule, SelectModule,
    AgShareGrid
  ],
  templateUrl: './supplier-detail.html',
  styleUrls: ['./supplier-detail.scss'],
  providers: [DialogService]
})
export class SupplierDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  // Injections
  private dialogHelper = inject(DynamicDialogServices);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private supplierService = inject(SupplierService);
  private transactionService = inject(TransactionService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private dropdownService = inject(MasterDropdownService);

  // --- Supplier State ---
  supplier = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);
  branchNames = signal('N/A');

  // --- Transaction Grid State ---
  gridApi!: GridApi;
  txnData: any[] = [];
  txnColumns: any[] = [];
  txnLoading = false;
  txnPage = 1;
  txnTotal = 0;
  txnLimit = 100;

  // Filters
  rangeDates: Date[] | undefined;
  txnFilter = { type: null, effect: null, search: '' };
  
  txnTypes = [
    { label: 'Purchase', value: 'purchase' }, 
    { label: 'Payment', value: 'payment' },
    { label: 'Ledger', value: 'ledger' }
  ];
  
  txnEffects = [
    { label: 'Credit (+)', value: 'credit' }, 
    { label: 'Debit (-)', value: 'debit' }
  ];

  ngOnInit(): void {
    this.initGridColumns();

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
            this.router.navigate(['/suppliers']);
            return of(null);
        }
        this.loading.set(true);
        this.isError.set(false);
        return this.supplierService.getSupplierById(id).pipe(
          finalize(() => this.loading.set(false))
        );
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const s = res.data.data || res.data;
          this.supplier.set(s);
          this.resolveBranchNames(s.branchesSupplied);
          this.getTransactions(true); 
        } else {
          this.isError.set(true);
        }
      },
      error: () => this.isError.set(true)
    });
  }

  applyTxnFilters() { this.getTransactions(true); }
  
  resetTxnFilters() {
    this.txnFilter = { type: null, effect: null, search: '' };
    this.rangeDates = undefined;
    this.getTransactions(true);
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom' && this.txnData.length < this.txnTotal) {
      this.getTransactions(false);
    }
  }

  initGridColumns(): void {
    this.txnColumns = [
      { 
        field: 'date', headerName: 'Date', width: 140, pinned: 'left',
        valueFormatter: (p:any) => this.common.formatDate(p.value, 'dd MMM yyyy'),
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'font-weight': '600' }
      },
      { 
        field: 'type', headerName: 'Type', width: 120,
        cellRenderer: (p:any) => {
           const type = p.value?.toLowerCase() || '-';
           let color = type === 'purchase' ? '#0ea5e9' : (type === 'payment' ? '#22c55e' : '#eab308');
           return `<span style="color:${color}; font-weight:700; text-transform:uppercase; font-size:11px;">${type}</span>`;
        }
      },
      { 
        field: 'description', headerName: 'Description', minWidth: 200, flex: 1,
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      { 
        field: 'effect', headerName: 'Effect', width: 110, 
        cellRenderer: (p:any) => {
          const isCredit = p.value?.toLowerCase() === 'credit';
          const color = isCredit ? '#16a34a' : '#dc2626';
          const icon = isCredit ? 'pi-arrow-down' : 'pi-arrow-up';
          return `<span style="color:${color}; font-weight:700; font-size:11px; text-transform:uppercase;">
                    <i class="pi ${icon}" style="font-size:10px;"></i> ${p.value}
                  </span>`;
        }
      },
      { 
        field: 'amount', headerName: 'Amount', width: 140, type: 'rightAligned',
        valueFormatter: (p:any) => this.common.formatCurrency(p.value),
        cellStyle: (p:any) => ({ 
            'color': p.data.effect === 'credit' ? '#16a34a' : '#dc2626', 
            'font-weight': '700', 'text-align': 'right', 'display': 'flex', 'justify-content': 'flex-end', 'align-items': 'center' 
        })
      }
    ];
  }

  private formatDateForApi(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  private resolveBranchNames(branchIds: any[]) {
    if (!branchIds?.length) {
      this.branchNames.set('N/A');
      return;
    }

    if (typeof branchIds[0] === 'object' && branchIds[0].name) {
      this.branchNames.set(branchIds.map(b => b.name).join(', '));
    } else {
      this.dropdownService.getDropdownData('branches', '', 1, 100, branchIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          if (res.data && res.data.length > 0) {
            this.branchNames.set(res.data.map(d => d.label).join(', '));
          } else {
            this.branchNames.set('Multiple Branches');
          }
        });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatAddress(addr: any): string {
    if (!addr) return 'No address';
    return [addr.street, addr.city, addr.state].filter(p => p).join(', ');
  }

  openSupplierKyc(supplier: any) {
    const ref = this.dialogHelper.openSupplierKyc(supplier._id);
    if (ref) {
      ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
        if (result === 'success') {
          this.messageService.showSuccess('Supplier KYC updated successfully.');
        }
      });
    }
  }

  openSupplierLedger(supplier: any) {
    const ref = this.dialogHelper.openSupplierLedger(supplier._id);
    if (ref) {
      ref.onClose.pipe(takeUntil(this.destroy$)).subscribe(() => {});
    }
  }

  openSupplierDashboard(supplier: any) {
    const ref = this.dialogHelper.openSupplierDashboard(supplier);
    if (ref) {
      ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((success: boolean) => {
        if (success) {
          this.getTransactions(true);
        }
      });
    }
  }

  getTransactions(isReset: boolean = false) {
    const supplierId = this.supplier()?._id;
    if (!supplierId || this.txnLoading) return;

    this.txnLoading = true;

    if (isReset) {
      this.txnPage = 1;
      this.txnData = [];
      this.txnTotal = 0;
    }

    const queryParams: any = {
      ...this.txnFilter,
      page: this.txnPage,
      limit: this.txnLimit
    };

    if (this.rangeDates && this.rangeDates.length > 0) {
      if (this.rangeDates[0]) queryParams.startDate = this.formatDateForApi(this.rangeDates[0]);
      if (this.rangeDates[1]) queryParams.endDate = this.formatDateForApi(this.rangeDates[1]);
    }

    this.transactionService.getSupplierTransactions(supplierId, queryParams).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        let newData = res.results || [];
        this.txnTotal = res.total || this.txnTotal;
        this.txnData = isReset ? newData : [...this.txnData, ...newData];
        
        if (newData.length > 0) this.txnPage++;
        
        this.txnLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.txnLoading = false;
        console.error(err);
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck(); 
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}