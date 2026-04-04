
import { ProductService } from "./../../../product/services/product-service";
import { Component, OnInit, inject, signal, OnDestroy, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, takeUntil, finalize, concatMap, catchError } from 'rxjs/operators';
import { Subject, EMPTY } from 'rxjs';

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
  selector: 'app-pos-invoice',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    ToastModule, ButtonModule, InputTextModule, InputNumberModule,
    DatePickerModule, SelectModule, DividerModule, TooltipModule,
    TextareaModule, SkeletonModule, TagModule, ConfirmDialogModule,
    ProgressSpinnerModule
  ],
  providers: [ConfirmationService],
  templateUrl: './pos-invoice.component.html',
  styleUrls: ['./pos-invoice.component.scss']
})
export class PosInvoiceComponent implements OnInit, OnDestroy {
  // --- Dependencies ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  private productService = inject(ProductService);
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService);
  @ViewChild('scannerInput') scannerInput!: ElementRef;

  // --- State ---  
  isLoading = signal(true);
  isSubmitting = signal(false);
  editMode = signal(false);
  invoiceId: string | null = null;
  stockWarnings = signal<any[]>([]);
  private destroy$ = new Subject<void>();

  // POS Specific State
  selectionMode = signal<'scan' | 'manual'>('scan');
  isScanning = signal(false);
  private scanSubject = new Subject<string>();
  manualSearchValue = signal<any>(null); // Used to clear the manual dropdown after selection

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
  manualSearchControl = new FormControl(null);
  ngOnInit(): void {
    this.buildForm();
    this.setupTotalsCalculation();
    this.setupScannerQueue();

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
        // Removed this.addItem() - A POS starts with an empty cart until an item is scanned
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // HYBRID POS SELECTION ARCHITECTURE
  // ==========================================

  // 1. Setup RXJS Queue for rapid scanning
  private setupScannerQueue(): void {
    this.scanSubject.pipe(
      takeUntil(this.destroy$),
      concatMap(code => {
        this.isScanning.set(true);
        const branchId = this.invoiceForm.get('branchId')?.value;

        if (!branchId) {
          this.messageService.showWarn('Branch Required: Please select a branch before scanning.');
          this.isScanning.set(false);
          return EMPTY;
        }

        return this.productService.scanProduct({ barcode: code, branchId: branchId }).pipe(
          catchError(err => {
            this.messageService.showError(err);
            return EMPTY;
          }),
          finalize(() => {
            this.isScanning.set(false);
            this.focusScanner();
          })
        );
      })
    ).subscribe((res: any) => {
      if (res?.data) {
        this.addProductToInvoice(res.data.product, res.data.availableStock);
      }
    });
  }

  // 2. Scan Event Handler
  onScan(event: Event, inputElement: HTMLInputElement): void {
    event.preventDefault(); // <-- ADD THIS: Stops the form from submitting or routing!
    const code = inputElement.value.trim();
    if (code) {
      this.scanSubject.next(code);
      inputElement.value = ''; // Instant clear
    }
  }

  // 3. Mode Toggle Handler
  toggleSelectionMode(mode: 'scan' | 'manual'): void {
    this.selectionMode.set(mode);
    if (mode === 'scan') {
      this.focusScanner();
    }
  }
  onManualProductSelect(event: any): void {
    const productId = event.value;
    const product = this.productOptions().find(p => p._id === productId);
    const branchId = this.invoiceForm.get('branchId')?.value;

    if (product && branchId) {
      this.invoiceService.checkStock({ branchId, items: [{ productId, quantity: 1 }] }).subscribe({
        next: (res: any) => {
          let availableQty = 0;
          if (res.stock?.items && res.stock.items.length > 0) {
            availableQty = res.stock.items[0].available;
          } else if (res.stock?.summary?.totalStock !== undefined) {
            availableQty = res.stock.summary.totalStock;
          }

          this.addProductToInvoice(product, availableQty);

          // 3. Reset the form control instead of the signal
          this.manualSearchControl.reset();
        },
        error: (err) => {
          this.messageService.showError('Stock Check: Failed to verify current availability.');
          this.manualSearchControl.reset();
        }
      });
    } else if (!branchId) {
      this.messageService.showWarn('Branch Required: Please select a branch to check stock.');
      this.manualSearchControl.reset();
    }
  }
  // // 4. Manual Dropdown Handler
  // onManualProductSelect(event: any): void {
  //   const productId = event.value;
  //   const product = this.productOptions().find(p => p._id === productId);
  //   const branchId = this.invoiceForm.get('branchId')?.value;

  //   if (product && branchId) {
  //     this.invoiceService.checkStock({ branchId, items: [{ productId, quantity: 1 }] }).subscribe({
  //       next: (res: any) => {
  //         let availableQty = 0;
  //         if (res.stock?.items && res.stock.items.length > 0) {
  //           availableQty = res.stock.items[0].available;
  //         } else if (res.stock?.summary?.totalStock !== undefined) {
  //           availableQty = res.stock.summary.totalStock;
  //         }

  //         this.addProductToInvoice(product, availableQty);
  //         this.manualSearchValue.set(null); // Clear the PrimeNG dropdown for next selection
  //       },
  //       error: (err) => {
  //         this.messageService.showError('Stock Check: Failed to verify current availability.');
  //         this.manualSearchValue.set(null);
  //       }
  //     });
  //   } else if (!branchId) {
  //      this.messageService.showWarn('Branch Required: Please select a branch to check stock.');
  //      this.manualSearchValue.set(null);
  //   }
  // }


  // 5. Unified method to process any product (from scanner or manual)
  private addProductToInvoice(product: any, stock: number): void {
    const itemsArray = this.items;
    const existingIndex = itemsArray.controls.findIndex(
      ctrl => ctrl.get('productId')?.value === (product._id || product.id)
    );

    if (existingIndex > -1) {
      const existingGroup = itemsArray.at(existingIndex) as FormGroup;
      const currentQty = existingGroup.get('quantity')?.value || 0;
      existingGroup.patchValue({ quantity: currentQty + 1 });
      this.messageService.showInfo(`Updated quantity for ${product.name}`);
    } else {
      const newItem = this.createItem({
        productId: product._id || product.id,
        name: product.name,
        hsnCode: product.sku || product.hsnCode,
        price: product.sellingPrice || product.price,
        taxRate: product.taxRate || 0,
        unit: product.unit || 'pcs',
        currentStock: stock,
        willBeLow: stock < 10
      });
      itemsArray.push(newItem);
      this.messageService.showSuccess(`Added ${product.name} to cart`);
    }
  }

  // 6. Focus Utility
  private focusScanner(): void {
    setTimeout(() => {
      if (this.scannerInput?.nativeElement) {
        this.scannerInput.nativeElement.focus();
      }
    }, 50);
  }

  // ==========================================
  // FORM & CALCULATION LOGIC
  // ==========================================

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
      isCheckingStock: [false]
    });
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.focusScanner(); // Snap back to scanner after deleting an item
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

  private loadInvoiceData(id: string): void {
    this.invoiceService.getInvoiceWithStock(id).subscribe({
      next: (res: any) => { const data = res.data?.invoice || res.data; if (data) this.patchForm(data); this.isLoading.set(false); },
      error: (err) => {
        this.messageService.handleHttpError(err); this.router.navigate(['/invoices']);
      }
    });
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
