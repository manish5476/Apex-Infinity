import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap, tap, startWith, debounceTime } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker'; // Corrected import for p-datepicker
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';
import { Textarea } from 'primeng/textarea';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule, // Corrected module
    SelectModule,
    DividerModule,
    TooltipModule,
  Textarea
  ],
  templateUrl: './invoice-form.html',
  styleUrls: ['./invoice-form.scss']
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  private masterList = inject(MasterListService);

  // --- Form & State ---
  invoiceForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  invoiceId: string | null = null;
  formTitle = signal('Create New Invoice');

  // --- Master Data Signals ---
  customerOptions = signal<any[]>([]);
  productOptions = signal<any[]>([]);
  branchOptions = signal<any[]>([]);
  
  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Cancelled', value: 'cancelled' },
  ];
  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'Credit', value: 'credit' },
    { label: 'UPI', value: 'upi' },
    { label: 'Other', value: 'other' },
  ];
  gstTypeOptions = [
    { label: 'Intra-State (CGST/SGST)', value: 'intra-state' },
    { label: 'Inter-State (IGST)', value: 'inter-state' },
    { label: 'Export (IGST)', value: 'export' },
  ];

  // --- Real-time Totals ---
  subTotal = signal(0);
  totalDiscount = signal(0);
  totalTax = signal(0);
  grandTotal = signal(0);
  balanceAmount = signal(0);
  private totalsSub!: Subscription;

  constructor() {
    this.customerOptions.set(this.masterList.customers());
    this.productOptions.set(this.masterList.products()); // Assumes products are loaded
    this.branchOptions.set(this.masterList.branches());
  }

  ngOnInit(): void {
    this.buildForm();
    this.setupTotalsCalculation();
    this.checkRouteForEditMode();
  }

  ngOnDestroy(): void {
    if (this.totalsSub) {
      this.totalsSub.unsubscribe();
    }
  }

  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.invoiceId = params.get('id');
        if (this.invoiceId) {
          this.editMode.set(true);
          this.formTitle.set('Edit Invoice');
          this.loadingService.show();
          return this.invoiceService.getInvoiceById(this.invoiceId);
        }
        return of(null); // Create mode
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data && response.data.data) {
          this.patchForm(response.data.data);
        } else if (response) {
          this.messageService.showError('Error', 'Failed to load invoice data');
        }
      },
      error: (err) => this.messageService.showError('Error', err.error?.message)
    });
  }

  private buildForm(): void {
    this.invoiceForm = this.fb.group({
      customerId: [null, Validators.required],
      branchId: [null],
      invoiceNumber: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],
      dueDate: [null],
      status: ['issued', Validators.required],
      
      billingAddress: [''], // Will auto-fill
      shippingAddress: [''], // Will auto-fill
      
      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      
      roundOff: [0],
      paidAmount: [0, Validators.min(0)],
      paymentMethod: ['cash', Validators.required],
      gstType: ['intra-state', Validators.required],
      notes: [''],
    });
  }

  private patchForm(invoice: any): void {
    this.invoiceForm.patchValue({
      customerId: invoice.customerId,
      branchId: invoice.branchId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
      status: invoice.status,
      billingAddress: invoice.billingAddress,
      shippingAddress: invoice.shippingAddress,
      roundOff: invoice.roundOff,
      paidAmount: invoice.paidAmount,
      paymentMethod: invoice.paymentMethod,
      gstType: invoice.gstType,
      notes: invoice.notes
    });

    // Patch FormArray
    this.items.clear();
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item: any) => {
        this.items.push(this.fb.group({
          productId: [item.productId, Validators.required],
          name: [item.name, Validators.required],
          hsnCode: [item.hsnCode],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          unit: [item.unit || 'pcs'],
          price: [item.price, [Validators.required, Validators.min(0)]],
          discount: [item.discount || 0, Validators.min(0)],
          taxRate: [item.taxRate || 0, Validators.min(0)]
        }));
      });
    }
  }

  // --- FormArray Getters & Methods ---
  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: [null, Validators.required],
      name: [{value: '', disabled: true}, Validators.required], // Disabled, auto-filled
      hsnCode: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['pcs'],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, Validators.min(0)],
      taxRate: [0, Validators.min(0)]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // --- Auto-fill Logic ---
  onCustomerSelect(event: any): void {
    const customer = this.customerOptions().find(c => c._id === event.value);
    if (customer) {
      // Auto-fill addresses (assuming simple string format)
      const billAddr = customer.billingAddress ? 
        `${customer.billingAddress.street}\n${customer.billingAddress.city}, ${customer.billingAddress.state} ${customer.billingAddress.zipCode}` : '';
      const shipAddr = customer.shippingAddress ?
        `${customer.shippingAddress.street}\n${customer.shippingAddress.city}, ${customer.shippingAddress.state} ${customer.shippingAddress.zipCode}` : '';

      this.invoiceForm.patchValue({
        billingAddress: billAddr,
        shippingAddress: shipAddr || billAddr
      });
    }
  }

  onProductSelect(event: any, itemGroup: FormGroup): void {
    const product = this.productOptions().find(p => p._id === event.value);
    if (product) {
      itemGroup.patchValue({
        name: product.name,
        price: product.sellingPrice,
        taxRate: product.taxRate || 0,
        hsnCode: product.sku || '' // Assuming SKU can be HSN
      });
    }
  }

  // --- Real-time Totals Calculation ---
  private setupTotalsCalculation(): void {
    this.totalsSub = this.invoiceForm.valueChanges.pipe(
      startWith(this.invoiceForm.value), // Calculate on init
      debounceTime(50) // Prevent rapid fire
    ).subscribe(value => {
      let subTotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      value.items.forEach((item: any) => {
        const qty = item.quantity || 0;
        const price = item.price || 0;
        const discount = item.discount || 0;
        const taxRate = item.taxRate || 0;

        const lineTotal = (qty * price) - discount;
        totalDiscount += discount;
        totalTax += (lineTotal * taxRate) / 100;
        subTotal += (qty * price);
      });

      const grand = subTotal - totalDiscount + totalTax + (value.roundOff || 0);
      const paid = value.paidAmount || 0;

      this.subTotal.set(subTotal);
      this.totalDiscount.set(totalDiscount);
      this.totalTax.set(totalTax);
      this.grandTotal.set(grand);
      this.balanceAmount.set(grand - paid);
    });
  }

  // --- Form Submission ---
  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.showError('Invalid Form', 'Please check all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    // Get raw value to include disabled fields like 'name'
    const payload = this.invoiceForm.getRawValue();

    // The backend pre-save hook calculates totals,
    // but we send our calculated values just in case.
    payload.subTotal = this.subTotal();
    payload.totalDiscount = this.totalDiscount();
    payload.totalTax = this.totalTax();
    payload.grandTotal = this.grandTotal();
    payload.balanceAmount = this.balanceAmount();

    const saveObservable = this.editMode()
      ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
      : this.invoiceService.createInvoice(payload);

    saveObservable.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Invoice ${this.editMode() ? 'updated' : 'created'} successfully.`);
        // Navigate to the new/edited invoice's detail page
        this.router.navigate(['/invoices', res.data._id]); 
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save invoice.');
      }
    });
  }
}

// import { TextareaModule } from 'primeng/textarea';
// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-invoice-form',
// //   imports: [],
// //   templateUrl: './invoice-form.html',
// //   styleUrl: './invoice-form.scss',
// // })
// // export class InvoiceForm {

// // }
// import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { finalize, switchMap, tap, startWith, debounceTime } from 'rxjs/operators';
// import { of, Subscription } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { DatePicker } from 'primeng/datepicker';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { InvoiceService } from '../../services/invoice-service';

// @Component({
//   selector: 'app-invoice-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ButtonModule,
//     InputTextModule,
//     InputNumberModule,
//     DatePicker,
//     TextareaModule,
//     SelectModule,
//     DividerModule,
//     TooltipModule
//   ],
//   templateUrl: './invoice-form.html',
//   styleUrls: ['./invoice-form.scss']
// })
// export class InvoiceFormComponent implements OnInit, OnDestroy {
//   // --- Injected Services ---
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invoiceService = inject(InvoiceService);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);
//   private masterList = inject(MasterListService);

//   // --- Form & State ---
//   invoiceForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   invoiceId: string | null = null;
//   formTitle = signal('Create New Invoice');

//   // --- Master Data Signals ---
//   customerOptions = signal<any[]>([]);
//   productOptions = signal<any[]>([]);
//   branchOptions = signal<any[]>([]);
  
//   statusOptions = [
//     { label: 'Draft', value: 'draft' },
//     { label: 'Issued', value: 'issued' },
//     { label: 'Cancelled', value: 'cancelled' },
//   ];
//   paymentMethodOptions = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'Bank Transfer', value: 'bank' },
//     { label: 'Credit', value: 'credit' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Other', value: 'other' },
//   ];
//   gstTypeOptions = [
//     { label: 'Intra-State (CGST/SGST)', value: 'intra-state' },
//     { label: 'Inter-State (IGST)', value: 'inter-state' },
//     { label: 'Export (IGST)', value: 'export' },
//   ];

//   // --- Real-time Totals ---
//   subTotal = signal(0);
//   totalDiscount = signal(0);
//   totalTax = signal(0);
//   grandTotal = signal(0);
//   balanceAmount = signal(0);
//   private totalsSub!: Subscription;

//   constructor() {
//     this.customerOptions.set(this.masterList.customers());
//     this.productOptions.set(this.masterList.products()); // Assumes products are loaded
//     this.branchOptions.set(this.masterList.branches());
//   }

//   ngOnInit(): void {
//     this.buildForm();
//     this.setupTotalsCalculation();
//     this.checkRouteForEditMode();
//   }

//   ngOnDestroy(): void {
//     if (this.totalsSub) {
//       this.totalsSub.unsubscribe();
//     }
//   }

//   private checkRouteForEditMode(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         this.invoiceId = params.get('id');
//         if (this.invoiceId) {
//           this.editMode.set(true);
//           this.formTitle.set('Edit Invoice');
//           this.loadingService.show();
//           return this.invoiceService.getInvoiceById(this.invoiceId);
//         }
//         return of(null); // Create mode
//       }),
//       finalize(() => this.loadingService.hide())
//     ).subscribe({
//       next: (response) => {
//         if (response && response.data && response.data.data) {
//           this.patchForm(response.data.data);
//         } else if (response) {
//           this.messageService.showError('Error', 'Failed to load invoice data');
//         }
//       },
//       error: (err) => this.messageService.showError('Error', err.error?.message)
//     });
//   }

//   private buildForm(): void {
//     this.invoiceForm = this.fb.group({
//       customerId: [null, Validators.required],
//       branchId: [null],
//       invoiceNumber: ['', Validators.required],
//       invoiceDate: [new Date(), Validators.required],
//       dueDate: [null],
//       status: ['issued', Validators.required],
      
//       billingAddress: [''], // Will auto-fill
//       shippingAddress: [''], // Will auto-fill
      
//       items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      
//       roundOff: [0],
//       paidAmount: [0, Validators.min(0)],
//       paymentMethod: ['cash', Validators.required],
//       gstType: ['intra-state', Validators.required],
//       notes: [''],
//     });
//   }

//   private patchForm(invoice: any): void {
//     this.invoiceForm.patchValue({
//       customerId: invoice.customerId,
//       branchId: invoice.branchId,
//       invoiceNumber: invoice.invoiceNumber,
//       invoiceDate: new Date(invoice.invoiceDate),
//       dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
//       status: invoice.status,
//       billingAddress: invoice.billingAddress,
//       shippingAddress: invoice.shippingAddress,
//       roundOff: invoice.roundOff,
//       paidAmount: invoice.paidAmount,
//       paymentMethod: invoice.paymentMethod,
//       gstType: invoice.gstType,
//       notes: invoice.notes
//     });

//     // Patch FormArray
//     this.items.clear();
//     if (invoice.items && Array.isArray(invoice.items)) {
//       invoice.items.forEach((item: any) => {
//         this.items.push(this.fb.group({
//           productId: [item.productId, Validators.required],
//           name: [item.name, Validators.required],
//           hsnCode: [item.hsnCode],
//           quantity: [item.quantity, [Validators.required, Validators.min(1)]],
//           unit: [item.unit || 'pcs'],
//           price: [item.price, [Validators.required, Validators.min(0)]],
//           discount: [item.discount || 0, Validators.min(0)],
//           taxRate: [item.taxRate || 0, Validators.min(0)]
//         }));
//       });
//     }
//   }

//   // --- FormArray Getters & Methods ---
//   get items(): FormArray {
//     return this.invoiceForm.get('items') as FormArray;
//   }

//   createItem(): FormGroup {
//     return this.fb.group({
//       productId: [null, Validators.required],
//       name: [{value: '', disabled: true}, Validators.required], // Disabled, auto-filled
//       hsnCode: [''],
//       quantity: [1, [Validators.required, Validators.min(1)]],
//       unit: ['pcs'],
//       price: [0, [Validators.required, Validators.min(0)]],
//       discount: [0, Validators.min(0)],
//       taxRate: [0, Validators.min(0)]
//     });
//   }

//   addItem(): void {
//     this.items.push(this.createItem());
//   }

//   removeItem(index: number): void {
//     this.items.removeAt(index);
//   }

//   // --- Auto-fill Logic ---
//   onCustomerSelect(event: any): void {
//     const customer = this.customerOptions().find(c => c._id === event.value);
//     if (customer) {
//       // Auto-fill addresses (assuming simple string format)
//       const billAddr = customer.billingAddress ? 
//         `${customer.billingAddress.street}\n${customer.billingAddress.city}, ${customer.billingAddress.state} ${customer.billingAddress.zipCode}` : '';
//       const shipAddr = customer.shippingAddress ?
//          `${customer.shippingAddress.street}\n${customer.shippingAddress.city}, ${customer.shippingAddress.state} ${customer.shippingAddress.zipCode}` : '';

//       this.invoiceForm.patchValue({
//         billingAddress: billAddr,
//         shippingAddress: shipAddr || billAddr
//       });
//     }
//   }

//   onProductSelect(event: any, itemGroup: FormGroup): void {
//     const product = this.productOptions().find(p => p._id === event.value);
//     if (product) {
//       itemGroup.patchValue({
//         name: product.name,
//         price: product.sellingPrice,
//         taxRate: product.taxRate || 0,
//         hsnCode: product.sku || '' // Assuming SKU can be HSN
//       });
//     }
//   }

//   // --- Real-time Totals Calculation ---
//   private setupTotalsCalculation(): void {
//     this.totalsSub = this.invoiceForm.valueChanges.pipe(
//       startWith(this.invoiceForm.value), // Calculate on init
//       debounceTime(50) // Prevent rapid fire
//     ).subscribe(value => {
//       let subTotal = 0;
//       let totalDiscount = 0;
//       let totalTax = 0;

//       value.items.forEach((item: any) => {
//         const qty = item.quantity || 0;
//         const price = item.price || 0;
//         const discount = item.discount || 0;
//         const taxRate = item.taxRate || 0;

//         const lineTotal = (qty * price) - discount;
//         totalDiscount += discount;
//         totalTax += (lineTotal * taxRate) / 100;
//         subTotal += (qty * price);
//       });

//       const grand = subTotal - totalDiscount + totalTax + (value.roundOff || 0);
//       const paid = value.paidAmount || 0;

//       this.subTotal.set(subTotal);
//       this.totalDiscount.set(totalDiscount);
//       this.totalTax.set(totalTax);
//       this.grandTotal.set(grand);
//       this.balanceAmount.set(grand - paid);
//     });
//   }

//   // --- Form Submission ---
//   onSubmit(): void {
//     if (this.invoiceForm.invalid) {
//       this.invoiceForm.markAllAsTouched();
//       this.messageService.showError('Invalid Form', 'Please check all required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     // Get raw value to include disabled fields like 'name'
//     const payload = this.invoiceForm.getRawValue();

//     // The backend pre-save hook calculates totals,
//     // but we send our calculated values just in case.
//     payload.subTotal = this.subTotal();
//     payload.totalDiscount = this.totalDiscount();
//     payload.totalTax = this.totalTax();
//     payload.grandTotal = this.grandTotal();
//     payload.balanceAmount = this.balanceAmount();

//     const saveObservable = this.editMode()
//       ? this.invoiceService.updateInvoice(this.invoiceId!, payload)
//       : this.invoiceService.createInvoice(payload);

//     saveObservable.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: (res) => {
//         this.messageService.showSuccess('Success', `Invoice ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         // Navigate to the new/edited invoice's detail page
//         this.router.navigate(['/invoices', res.data._id]); 
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save invoice.');
//       }
//     });
//   }
// }