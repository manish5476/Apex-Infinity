import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
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

@Component({
  selector: 'app-emi-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    // PrimeNG
    ButtonModule, TagModule, CardModule, DividerModule,
    ProgressBarModule, DialogModule, InputNumberModule,
    InputTextModule, SelectModule, ToastModule,
    ConfirmDialogModule, SkeletonModule,
    // Shared
    AgShareGrid
  ],
  providers: [ConfirmationService, DatePipe], // Add DatePipe to providers
  templateUrl: './emi-details.html',
  styleUrl: './emi-details.scss'
})
export class EmiDetailsComponent implements OnInit {
  // --- Injections ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);
  public common = inject(CommonMethodService);
  private datePipe = inject(DatePipe); // Inject DatePipe
  private cdr = inject(ChangeDetectorRef);

  // --- State ---
  emiData = signal<any | null>(null);
  isLoading = signal(true);

  // Grid
  column: any[] = [];
  gridData: any[] = [];

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
    return data ? data.totalAmount - this.totalPaidAmount() : 0;
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
    this.setupColumns(); // Initialize Grid Cols
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchEmiDetails(id);
      } else {
        this.router.navigate(['/emis']);
      }
    });
  }

  private fetchEmiDetails(id: string) {
    this.isLoading.set(true);
    this.common.apiCall(
      this.emiService.getEmiById(id),
      (res: any) => {
        const data = res.data?.emi || res.data;
        this.emiData.set(data);
        this.gridData = data.installments || []; // Populate Grid Data
        this.isLoading.set(false);
      },
      'Fetch EMI Details'
    );
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
          return `<button class="action-pay-btn p-button-rounded p-button-text" style="cursor: pointer; background: transparent; border: none; color: #3b82f6;">
                     <i class="pi pi-wallet" style="font-size: 1.2rem;"></i>
                   </button>`;
        }
      }
    ];
  }

  // Handle Grid Clicks (Pay Button)
  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked') {
      const target = event.field;
      if (target === 'action') {
        this.openPaymentDialog(event.row);
      }
    }
  }

  // --- Payment Logic ---

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
      this.messageService.showError('Validation Error', 'Reference ID is required.');
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
      this.emiService.payEmiInstallment(payload),
      (res: any) => {
        this.messageService.showSuccess('Success', `Payment recorded.`);
        this.showPaymentDialog = false;
        this.isSubmittingPayment.set(false);
        this.fetchEmiDetails(emiId); // Refresh Data & Grid
      },
      'Record Payment'
    );
  }

  isOverdue(installment: any): boolean {
    if (!installment || installment.paymentStatus === 'paid') return false;
    const dueDate = new Date(installment.dueDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}