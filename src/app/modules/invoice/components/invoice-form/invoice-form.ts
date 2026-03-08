import { Component, OnInit, inject, signal, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, takeUntil, finalize, switchMap, filter } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

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
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    ToastModule, ButtonModule, InputTextModule, InputNumberModule,
    DatePickerModule, SelectModule, DividerModule, TooltipModule,
    TextareaModule, SkeletonModule, TagModule, ConfirmDialogModule,
    ProgressSpinnerModule
  ],
  providers: [ConfirmationService],
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
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService);

  // --- State ---
  isLoading = signal(true);
  isSubmitting = signal(false);
  editMode = signal(false);
  invoiceId: string | null = null;
  stockWarnings = signal<any[]>([]);
  private destroy$ = new Subject<void>();

  // --- Computed ---
  formTitle = computed(() => this.editMode() ? `Edit Invoice #${this.invoiceForm.get('invoiceNumber')?.value || ''}` : 'New Smart Invoice');

  // --- Master Data ---
  customerOptions = computed(() => this.masterList.customers());
  productOptions = computed(() => this.masterList.products());
  branchOptions = computed(() => this.masterList.branches());

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

  // --- Totals (Reactive Signals) ---
  subTotal = signal(0);
  totalDiscount = signal(0);
  totalTax = signal(0);
  grandTotal = signal(0);
  balanceAmount = signal(0);

  invoiceForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.setupTotalsCalculation();
    const defaultBranch = this.masterList.branches()[0]?._id;
    if (defaultBranch && !this.editMode()) {
      this.invoiceForm.patchValue({ branchId: defaultBranch });
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.invoiceId = id;
        this.editMode.set(true);
        this.loadInvoiceData(id);
      } else {
        this.isLoading.set(false);
        this.generateInvoiceNumber();
        this.addItem();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.invoiceForm = this.fb.group({
      customerId: [null, Validators.required],
      branchId: [null, Validators.required],
      invoiceNumber: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],
      dueDate: [null],
      status: ['draft', Validators.required],
      billingAddress: [''],
      shippingAddress: [''],
      placeOfSupply: [''],
      items: this.fb.array([], [Validators.required]),
      roundOff: [0],
      paidAmount: [0, Validators.min(0)],
      paymentMethod: ['cash'],
      gstType: ['intra-state', Validators.required],
      notes: [''],
    });
  }

  private patchForm(data: any): void {
    const customerValue = data.customerId?._id || data.customerId;
    const branchValue = data.branchId?._id || data.branchId;
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
    const itemControl = this.items;
    itemControl.clear();
    if (data.items?.length) {
      data.items.forEach((item: any) => itemControl.push(this.createItem(item)));
    }
    this.invoiceForm.updateValueAndValidity();
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(data?: any): FormGroup {
    const productValue = data?.productId?._id || data?.productId || null;
    return this.fb.group({
      productId: [productValue, Validators.required],
      name: [data?.name || '', Validators.required],
      hsnCode: [data?.hsnCode || ''],
      quantity: [data?.quantity || 1, [Validators.required, Validators.min(1)]],
      unit: [data?.unit || 'pcs'],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      discount: [data?.discount || 0, Validators.min(0)],
      taxRate: [data?.taxRate || 0, [Validators.required, Validators.min(0)]],
      currentStock: [data?.currentStock || 0],
      isLowStock: [data?.willBeLow || false],
      isCheckingStock: [false] // Loading state for stock
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onCustomerSelect(event: any): void {
    const customer = this.customerOptions().find(c => c._id === event.value);
    if (customer) {
      const billAddr = this.formatAddress(customer['billingAddress']);
      this.invoiceForm.patchValue({
        billingAddress: billAddr,
        shippingAddress: this.formatAddress(customer['shippingAddress']) || billAddr,
        placeOfSupply: customer['billingAddress']?.state || ''
      });
      const terms = parseInt(customer['paymentTerms'] as string) || 0;
      if (terms > 0) {
        const due = new Date();
        due.setDate(due.getDate() + terms);
        this.invoiceForm.patchValue({ dueDate: due });
      }
    }
  }

  private setupTotalsCalculation(): void {
    this.invoiceForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(100)
    ).subscribe(val => {
      let sub = 0, disc = 0, tax = 0;
      (val.items || []).forEach((item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const d = Number(item.discount) || 0;
        const tRate = Number(item.taxRate) || 0;
        const lineTotal = price * qty;
        const taxable = lineTotal - d;
        const tAmount = (taxable * tRate) / 100;
        sub += lineTotal;
        disc += d;
        tax += tAmount;
      });

      const round = Number(val.roundOff) || 0;
      const grand = (sub - disc + tax) + round;
      const paid = Number(val.paidAmount) || 0;
      this.subTotal.set(sub);
      this.totalDiscount.set(disc);
      this.totalTax.set(tax);
      this.grandTotal.set(Math.round(grand));
      this.balanceAmount.set(Math.round(grand) - paid);
    });
  }

  // === 5. Smart Submit Flow ===
  private preparePayload(): any {
    const formValue = this.invoiceForm.getRawValue();
    return {
      ...formValue,
      subTotal: this.subTotal(),
      totalDiscount: this.totalDiscount(),
      totalTax: this.totalTax(),
      grandTotal: this.grandTotal(),
      balanceAmount: this.balanceAmount(),
      items: formValue.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount, taxRate: i.taxRate, unit: i.unit }))
    };
  }

  generateInvoiceNumber(): void {
    if (this.editMode()) return;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.invoiceForm.patchValue({ invoiceNumber: `INV-${dateStr}-${random}` });
  }

  formatAddress(addr: any): string {
    if (!addr) return '';
    return [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
  }

  // === 1. Smart Load (With Stock Info) ===
  private loadInvoiceData(id: string): void {
    this.invoiceService.getInvoiceWithStock(id).subscribe({
      next: (res: any) => { const data = res.data?.invoice || res.data; if (data) this.patchForm(data); this.isLoading.set(false); },
      error: (err) => {
        this.messageService.handleHttpError(err); this.router.navigate(['/invoices']);
      }
    });
  }

  // === 3. Smart Selection Logic (Live Stock Check) ===
  onProductSelect(event: any, index: number): void {
    const productId = event.value;
    const branchId = this.invoiceForm.get('branchId')?.value;
    const product = this.productOptions().find(p => p._id === productId);

    if (product) {
      const itemGroup = this.items.at(index) as FormGroup;
      itemGroup.patchValue({
        name: product.name,
        price: product['sellingPrice'],
        taxRate: product['taxRate'] || 0,
        hsnCode: product['sku'] || '',
        unit: product['unit'] || 'pcs',
        isCheckingStock: true
      });

      if (branchId) {
        const checkPayload = {
          branchId: branchId,
          items: [{ productId: productId, quantity: 1 }]
        };
        this.invoiceService.checkStock(checkPayload).subscribe({
          next: (res: any) => {
            let availableQty = 0;
            if (res.stock?.items && res.stock.items.length > 0) {
              availableQty = res.stock.items[0].available;
            } else if (res.stock?.summary?.totalStock !== undefined) {
              availableQty = res.stock.summary.totalStock;
            }

            itemGroup.patchValue({
              currentStock: availableQty,
              isLowStock: availableQty < 10,
              isCheckingStock: false
            });
          },
          error: (err) => {
            console.error('Stock check failed', err);
            itemGroup.patchValue({ isCheckingStock: false, currentStock: 0 });
            this.messageService.showWarn('Stock Check: Failed to verify current availability.');
          }
        });
      } else {
        itemGroup.patchValue({ isCheckingStock: false });
        this.messageService.showWarn('Branch Required: Please select a branch to check stock.');
      }
    }
  }

  handleSubmit(status: 'draft' | 'issued'): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Please complete all required fields.');
      return;
    }

    this.invoiceForm.patchValue({ status });
    const payload = this.preparePayload();
    if (status === 'issued') {
      this.isSubmitting.set(true);
      const checkPayload = {
        branchId: payload.branchId,
        items: payload.items
      };
      this.invoiceService.checkStock(checkPayload).subscribe({
        next: (validation: any) => {
          const isValid = validation.isValid;
          if (isValid) {
            if (validation.warnings?.length > 0) {
              this.confirmSubmission(payload, 'Stock warnings detected. Continue?', 'pi pi-exclamation-triangle');
            } else {
              this.saveInvoice(payload);
            }
          } else {
            let msg = 'Insufficient stock for the following items: ';
            if (validation.stock?.items && validation.stock.items.length > 0) {
              const outOfStockItems = validation.stock.items.filter((i: any) => i.available < i.required);
              msg += outOfStockItems
                .map((i: any) => `${i.productName}: Need ${i.required}, have ${i.available}`)
                .join(' | ');
            } else {
              msg = validation.message || 'Items out of stock';
            }
            this.messageService.showError(`Stock Unavailable: ${msg}`);
            this.isSubmitting.set(false);
          }
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.saveInvoice(payload);
    }
  }
  private confirmSubmission(payload: any, message: string, icon: string): void {
    this.confirmationService.confirm({
      message: message,
      header: 'Stock Warning',
      icon: icon,
      accept: () => { this.saveInvoice(payload); },
      reject: () => {
        this.isSubmitting.set(false);
        this.messageService.showInfo('Submission cancelled by user.');
      }
    });
  }

  private saveInvoice(payload: any): void {
    this.isSubmitting.set(true);
    const request$ = this.editMode() ? this.invoiceService.updateInvoice(this.invoiceId!, payload) : this.invoiceService.createInvoice(payload);
    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (res) => {
        const invNum = res.data?.invoice?.invoiceNumber || 'New';
        const statusText = payload.status === 'draft' ? 'saved as draft' : 'issued';
        this.messageService.showSuccess(`Success: Invoice #${invNum} has been ${statusText}.`);
        this.router.navigate(['/invoices']);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }
}
