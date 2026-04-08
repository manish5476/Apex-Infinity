import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';

// AG Grid & Shared
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { GridApi } from 'ag-grid-community';

// Services
import { EmiService } from '../../services/emi-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-emi-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, ButtonModule, TagModule, 
    CardModule, DividerModule, ProgressBarModule, DialogModule, InputNumberModule, 
    InputTextModule, SelectModule, ToastModule, ConfirmDialogModule, SkeletonModule, 
    AgShareGrid, HasPermissionDirective
  ],
  providers: [ConfirmationService, DatePipe],
  templateUrl: './emi-details.html',
  styleUrl: './emi-details.scss'
})
export class EmiDetailsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  // --- Injections ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);
  public common = inject(CommonMethodService);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);
  readonly PERMISSIONS = PERMISSIONS;

  // --- State ---
  emiData = signal<any | null>(null);
  isLoading = signal(true);

  // Grid
  column: any[] = [];
  gridData: any[] = [];
  historyColumn: any[] = [];
  historyData = signal<any[]>([]);
  activeTab = signal<'schedule' | 'history'>('schedule');

  // Payment Dialog
  showPaymentDialog = false;
  paymentForm!: FormGroup;
  selectedInstallment: any = null;
  isSubmittingPayment = signal(false);

  // --- Computed Stats ---
  progress = computed(() => {
    const data = this.emiData();
    if (!data) return 0;
    const totalPaid = data.installments.reduce((acc: number, curr: any) => acc + (curr.paidAmount || 0), 0);
    const totalLoanAmount = data.totalAmount;
    if (totalLoanAmount === 0) return 0;
    return Math.min(100, Math.round((totalPaid / totalLoanAmount) * 100));
  });

  totalPaidAmount = computed(() => {
    const data = this.emiData();
    return data ? data.installments.reduce((acc: number, curr: any) => acc + (curr.paidAmount || 0), 0) : 0;
  });

  remainingAmount = computed(() => {
    const data = this.emiData();
    if (!data || !data.installments) return 0;
    const totalInstallmentValue = data.installments.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);
    const totalPaidAgainstInstallments = data.installments.reduce((acc: number, curr: any) => acc + (curr.paidAmount || 0), 0);
    return totalInstallmentValue - totalPaidAgainstInstallments;
  });

  paymentModes = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'UPI', value: 'upi' },
    { label: 'Credit', value: 'credit' },
    { label: 'Cheque', value: 'other' }
  ];

  constructor() {
    this.initPaymentForm();
  }

  ngOnInit() {
    this.setupColumns();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchEmiDetails(id);
        this.fetchEmiHistory(id);
      } else {
        this.router.navigate(['/emis']);
      }
    });
  }

  deletePlan() {
    const data = this.emiData();
    if (!data) return;

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this EMI plan? This will remove all associated schedules. This action cannot be undone.',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.common.apiCall(
          this.emiService.deleteEmi(data._id),
          (res: any) => {
            this.messageService.showSuccess('EMI plan deleted successfully.');
            this.router.navigate(['/emis']);
          }
        );
      }
    });
  }

  // --- Grid Configuration ---
  setupColumns() {
    this.column = [
      {
        headerName: '#',
        field: 'installmentNumber',
        width: 70,
        sortable: true,
        cellClass: 'font-bold text-gray-600 text-center'
      },
      {
        headerName: 'Due Date',
        field: 'dueDate',
        width: 150,
        valueFormatter: (params: any) => this.datePipe.transform(params.value, 'mediumDate'),
        cellRenderer: (params: any) => {
          const dateStr = this.datePipe.transform(params.value, 'mediumDate');
          const isOverdue = this.isOverdue(params.data);
          return isOverdue
            ? `<div>${dateStr} <span style="color: #ef4444; font-size: 10px; font-weight: 800; margin-left: 4px;">OVERDUE</span></div>`
            : dateStr;
        }
      },
      {
        headerName: 'Amount',
        field: 'totalAmount',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value)
      },
      {
        headerName: 'Paid',
        field: 'paidAmount',
        width: 130,
        type: 'rightAligned',
        cellStyle: { color: '#16a34a', fontWeight: 'bold' },
        valueFormatter: (params: any) => params.value > 0 ? this.common.formatCurrency(params.value) : '-'
      },
      {
        headerName: 'Status',
        field: 'paymentStatus',
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value || 'pending';
          const color = status === 'paid' ? '#16a34a' : (status === 'partial' ? '#f59e0b' : '#dc2626');
          const bg = status === 'paid' ? '#dcfce7' : (status === 'partial' ? '#fef3c7' : '#fee2e2');

          return `<span style="background:${bg}; color:${color}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${status}</span>`;
        }
      },
      {
        headerName: 'Action',
        field: 'action',
        width: 100,
        cellRenderer: (params: any) => {
          if (params.data.paymentStatus === 'paid') {
            return `<i class="pi pi-check-circle text-green-500" style="font-size: 1.2rem;"></i>`;
          }
          return `<button class="action-pay-btn p-button-rounded p-button-text" style="cursor: pointer; background: var(--bg-secondary); border: none; color: #3b82f6;">
                     <i class="pi pi-wallet" style="font-size: 1.2rem;"></i>
                   </button>`;
        }
      }
    ];

    this.historyColumn = [
      {
        headerName: 'Inst #',
        field: 'installmentNumber',
        width: 80,
        sortable: true,
        cellClass: 'font-semibold text-center'
      },
      {
        headerName: 'Paid Date',
        field: 'paidAt',
        width: 150,
        valueFormatter: (params: any) => params.value ? this.datePipe.transform(params.value, 'mediumDate') : '—',
        cellStyle: { color: 'var(--accent-primary)', fontWeight: '600' }
      },
      {
        headerName: 'Amount Paid',
        field: 'paidAmount',
        width: 140,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: { color: 'var(--color-success)', fontWeight: 'bold' }
      },
      {
        headerName: 'Status',
        field: 'paymentStatus',
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value || 'pending';
          const color = status === 'paid' ? '#16a34a' : (status === 'partial' ? '#f59e0b' : '#dc2626');
          const bg = status === 'paid' ? '#dcfce7' : (status === 'partial' ? '#fef3c7' : '#fee2e2');
          return `<span style="background:${bg}; color:${color}; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${status}</span>`;
        }
      },
      {
        headerName: 'Reference',
        field: 'paymentId',
        flex: 1,
        minWidth: 150,
        cellRenderer: (params: any) => params.value ? `<span class="font-mono text-xs text-gray-500">ID: ${params.value.slice(-8).toUpperCase()}</span>` : '—'
      }
    ];
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      const target = event.field;
      if (target === 'action') {
        this.openPaymentDialog(event.row);
      }
    }
  }

  initPaymentForm() {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentId: ['', Validators.required],
      paymentMode: ['cash', Validators.required],
      notes: ['']
    });
  }

  openPaymentDialog(installment: any) {
    if (installment.paymentStatus === 'paid') return;
    this.selectedInstallment = installment;

    const dueAmount = installment.totalAmount - (installment.paidAmount || 0);
    this.paymentForm.patchValue({
      amount: dueAmount,
      paymentId: '',
      paymentMode: 'cash',
      notes: ''
    });
    this.showPaymentDialog = true;
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Reference ID is required.');
      return;
    }

    const emiId = this.emiData()._id;
    const { amount, paymentId, paymentMode } = this.paymentForm.value;
    this.isSubmittingPayment.set(true);

    const payload = {
      emiId: emiId,
      installmentNumber: this.selectedInstallment.installmentNumber,
      amount: amount,
      paymentMethod: paymentMode,
      referenceNumber: `${paymentMode.toUpperCase()}-${paymentId}`
    };

    this.common.apiCall(
      this.emiService.payEmiInstallment(emiId, payload),
      (res: any) => {
        this.messageService.showSuccess('Payment recorded successfully.');
        this.showPaymentDialog = false;
        this.isSubmittingPayment.set(false);
        this.fetchEmiDetails(emiId);
        this.fetchEmiHistory(emiId);
      }
    );
  }

  private fetchEmiDetails(id: string) {
    this.isLoading.set(true);
    this.common.apiCall(
      this.emiService.getEmiById(id),
      (res: any) => {
        const data = res.data?.emi || res.data;
        this.emiData.set(data);
        this.gridData = data.installments || [];
        this.isLoading.set(false);
      }
    );
  }

  fetchEmiHistory(emiId: string) {
    this.emiService.getEmiHistory(emiId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.historyData.set(res.data?.history || []);
        this.cdr.markForCheck();
      }
    });
  }

  isOverdue(installment: any): boolean {
    if (!installment || installment.paymentStatus === 'paid') return false;
    const dueDate = new Date(installment.dueDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}