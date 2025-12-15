import { Component, OnInit, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, takeUntil, finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Services
import { InvoiceService } from '../../services/invoice-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    DividerModule,
    TooltipModule,
    TextareaModule,
    SkeletonModule
  ],
  templateUrl: './invoice-form.html',
  styleUrls: ['./invoice-form.scss']
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  // --- Dependencies ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // --- State ---
  isLoading = signal(true);
  isSubmitting = signal(false);
  editMode = signal(false);
  invoiceId: string | null = null;
  private destroy$ = new Subject<void>();

  // --- Computed ---
  formTitle = computed(() => this.editMode() ? `Edit Invoice #${this.invoiceForm.get('invoiceNumber')?.value || ''}` : 'New Invoice');
  submitLabel = computed(() => this.editMode() ? 'Update Invoice' : 'Generate Invoice');

  // --- Master Data ---
  customerOptions = computed(() => this.masterList.customers());
  productOptions = computed(() => this.masterList.products());
  branchOptions = computed(() => this.masterList.branches());

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  gstTypeOptions = [
    { label: 'Intra-State (CGST/SGST)', value: 'intra-state' },
    { label: 'Inter-State (IGST)', value: 'inter-state' },
    { label: 'Export / SEZ', value: 'export' },
  ];

  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'Credit', value: 'credit' },
    { label: 'UPI', value: 'upi' },
    { label: 'Other', value: 'other' },
  ];

  // --- Totals (Reactive) ---
  subTotal = signal(0);
  totalDiscount = signal(0);
  totalTax = signal(0);
  grandTotal = signal(0);
  balanceAmount = signal(0);

  invoiceForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.setupTotalsCalculation();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.invoiceId = id;
        this.editMode.set(true); // FIX: Ensure Edit Mode is ON
        this.loadInvoiceData(id);
      } else {
        this.isLoading.set(false);
        this.generateInvoiceNumber(); // Auto-gen on create
        this.addItem(); // Add 1st row
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.invoiceForm = this.fb.group({
      // Core Links
      customerId: [null, Validators.required],
      branchId: [null],

      // Meta
      invoiceNumber: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],
      dueDate: [null],
      status: ['draft', Validators.required],

      // Billing
      billingAddress: [''],
      shippingAddress: [''],
      placeOfSupply: [''],

      // Data
      items: this.fb.array([], [Validators.required]),

      // Financials
      roundOff: [0],
      paidAmount: [0, Validators.min(0)],
      paymentMethod: ['cash'],
      gstType: ['intra-state', Validators.required],
      notes: [''],
    });
  }

  // === Logic: Auto Generate Invoice Number ===
  generateInvoiceNumber() {
    // Only generate if we are NOT in edit mode
    if (this.editMode()) return;

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.invoiceForm.patchValue({ invoiceNumber: `INV-${dateStr}-${random}` });
  }

  private loadInvoiceData(id: string): void {
    this.common.apiCall(
      this.invoiceService.getInvoiceById(id),
      (response: any) => {
        // ✅ FIX: Check for 'response.data.data' first based on your JSON structure
        const data = response.data?.data || response.data?.invoice || response.data || response;

        if (data) {
          // Optional: Log to verify you have the correct object now
          console.log('Patching Invoice Data:', data);
          this.patchForm(data);
        }
        this.isLoading.set(false);
      },
      'Load Invoice'
    );
  }
  private patchForm(data: any): void {
    // FIX: Extract ID strings from populated objects
    const customerValue = data.customerId?._id || data.customerId || null;
    const branchValue = data.branchId?._id || data.branchId || null;

    // Patch basic fields
    this.invoiceForm.patchValue({
      customerId: customerValue,
      branchId: branchValue,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      placeOfSupply: data.placeOfSupply,
      roundOff: data.roundOff,
      paidAmount: data.paidAmount,
      paymentMethod: data.paymentMethod,
      gstType: data.gstType,
      notes: data.notes
    });

    // Patch Items
    const itemControl = this.items;
    itemControl.clear();
    if (data.items?.length) {
      data.items.forEach((item: any) => {
        itemControl.push(this.createItem(item));
      });
    }

    // Force recalculation
    this.invoiceForm.updateValueAndValidity();
  }

  // === Logic: Items ===
  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(data?: any): FormGroup {
    // FIX: Extract ID string from populated productId object
    const productValue = data?.productId?._id || data?.productId || null;

    return this.fb.group({
      productId: [productValue, Validators.required],
      name: [data?.name || '', Validators.required],
      hsnCode: [data?.hsnCode || ''],
      quantity: [data?.quantity || 1, [Validators.required, Validators.min(1)]],
      unit: [data?.unit || 'pcs'],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      discount: [data?.discount || 0, Validators.min(0)],
      taxRate: [data?.taxRate || 0, [Validators.required, Validators.min(0)]]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // === Logic: Auto-Fill ===
  onCustomerSelect(event: any): void {
    const customer = this.customerOptions().find(c => c._id === event.value);
    if (customer) {
      // Auto-fill addresses
      const billAddr = this.formatAddress(customer['billingAddress']);
      this.invoiceForm.patchValue({
        billingAddress: billAddr,
        shippingAddress: this.formatAddress(customer['shippingAddress']) || billAddr,
        placeOfSupply: customer['billingAddress']?.state || ''
      });

      // Smart Due Date (e.g., +30 days based on terms)
      const terms = customer['paymentTerms'] || 0;
      const days = parseInt(terms as string);
      if (!isNaN(days)) {
        const due = new Date();
        due.setDate(due.getDate() + days);
        this.invoiceForm.patchValue({ dueDate: due });
      }
    }
  }

  onProductSelect(event: any, index: number): void {
    const product = this.productOptions().find(p => p._id === event.value);
    if (product) {
      const itemGroup = this.items.at(index) as FormGroup;
      itemGroup.patchValue({
        name: product.name,
        price: product['sellingPrice'],
        taxRate: product['taxRate'] || 0,
        hsnCode: product['sku'] || '',
        unit: product['unit'] || 'pcs'
      });
    }
  }

  private formatAddress(addr: any): string {
    if (!addr) return '';
    return [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ');
  }

  // === Logic: Calculations ===
  private setupTotalsCalculation(): void {
    this.invoiceForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(50)
    ).subscribe(val => {
      let subTotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      const items = val.items || [];
      items.forEach((item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const discount = Number(item.discount) || 0;
        const taxRate = Number(item.taxRate) || 0;

        const lineTotal = price * qty;

        // Tax Calculation (On Discounted Value)
        const taxableValue = lineTotal - discount;
        const taxAmount = (taxableValue * taxRate) / 100;

        subTotal += lineTotal;
        totalDiscount += discount;
        totalTax += taxAmount;
      });

      const roundOff = Number(val.roundOff) || 0;
      const grand = (subTotal - totalDiscount + totalTax) + roundOff;
      const paid = Number(val.paidAmount) || 0;

      // Update Signals
      this.subTotal.set(subTotal);
      this.totalDiscount.set(totalDiscount);
      this.totalTax.set(totalTax);
      this.grandTotal.set(Math.round(grand));
      this.balanceAmount.set(Math.round(grand) - paid);
    });
  }

  // === Logic: Submit ===
  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.showWarn('Missing Data', 'Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);

    // Prepare Payload
    const formValue = this.invoiceForm.getRawValue();
    const payload = {
      ...formValue,
      subTotal: this.subTotal(),
      totalDiscount: this.totalDiscount(),
      totalTax: this.totalTax(),
      grandTotal: this.grandTotal(),
      balanceAmount: this.balanceAmount(),
      // Determine payment status logic
      paymentStatus: this.balanceAmount() <= 0 ? 'paid' : (formValue.paidAmount > 0 ? 'partial' : 'unpaid')
    };

    // 1. Create the observable
    const req$ = this.editMode()
      ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
      : this.invoiceService.createInvoice(payload);

    // 2. Add finalize to handle loading state
    const finalReq$ = req$.pipe(
      finalize(() => this.isSubmitting.set(false))
    );

    // 3. Call API
    this.common.apiCall(
      finalReq$,
      (res: any) => {
        this.messageService.showSuccess(
          'Success',
          `Invoice ${this.editMode() ? 'updated' : 'created'} successfully.`
        );
        setTimeout(() => {
          const id = res.data?._id || res.data?.invoice?._id || this.invoiceId;
          this.router.navigate(['/invoices', id]);
        }, 500);
      },
      this.editMode() ? 'Update Invoice' : 'Create Invoice'
    );
  }
}
