import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DatePicker } from 'primeng/datepicker';
import { Divider } from "primeng/divider";
import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { PurchaseService } from '../purchase.service';

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,ToastModule,ButtonModule,InputTextModule,InputNumberModule,SelectModule,DatePicker,TextareaModule,FileUploadModule,TooltipModule,ToggleButtonModule,RouterLink,Divider],
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.scss',
})

export class PurchaseFormComponent implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseService = inject(PurchaseService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);

  // --- State ---
  purchaseForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  purchaseId: string | null = null;
  formTitle = signal('New Purchase Entry');

  // --- Data Signals ---
  supplierOptions = signal<any[]>([]);
  branchOptions = signal<any[]>([]);
  productOptions = signal<any[]>([]); 

  // --- Enums ---
  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Received', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'Credit', value: 'credit' },
    { label: 'UPI', value: 'upi' },
    { label: 'Other', value: 'other' }
  ];

  // --- File Handling ---
  selectedFiles: File[] = [];

  constructor() {
    // Load Master Data
    this.branchOptions.set(this.masterList.branches());
    this.supplierOptions.set(this.masterList.suppliers());
    this.productOptions.set(this.masterList.products()); 
    console.log(this.masterList.products());
  }

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();
  }

  private buildForm(): void {
    this.purchaseForm = this.fb.group({
      // Core Links
      supplierId: [null, Validators.required],
      branchId: [null, Validators.required],
      
      // Details
      invoiceNumber: ['', Validators.required],
      purchaseDate: [new Date(), Validators.required],
      dueDate: [null],
      status: ['draft', Validators.required],
      
      // Items
      items: this.fb.array([]),

      // Totals (Read Only mostly, calculated)
      subTotal: [{ value: 0, disabled: true }],
      totalTax: [{ value: 0, disabled: true }],
      totalDiscount: [{ value: 0, disabled: true }],
      grandTotal: [{ value: 0, disabled: true }],

      // Payment
      paymentStatus: ['unpaid'], 
      paidAmount: [0, [Validators.min(0)]],
      paymentMethod: ['cash'],
      balanceAmount: [{ value: 0, disabled: true }],

      // Meta
      notes: [''],
    });

    // Add one empty row by default ONLY if not in edit mode (handled later)
    if (!this.editMode()) {
       this.addItem();
    }
    
    // Listen to changes for calculations
    this.purchaseForm.get('paidAmount')?.valueChanges.subscribe(() => this.calculateTotals());
  }

  // --- Items Management ---
  get items(): FormArray {
    return this.purchaseForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: [null, Validators.required],
      name: [''], // Hidden, filled on product select
      quantity: [1, [Validators.required, Validators.min(1)]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      taxRate: [0, [Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      // UI Helper for row total
      rowTotal: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    const itemGroup = this.createItem();
    
    // Listen to changes within the row to update row total & grand total
    itemGroup.valueChanges.subscribe(() => {
      this.calculateRowTotal(itemGroup);
      this.calculateTotals();
    });

    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  // --- Logic & Calculations ---

  onProductSelect(index: number, productId: string): void {
    const product = this.productOptions().find(p => p._id === productId);
    if (product) {
      const row = this.items.at(index);
      row.patchValue({
        name: product.name,
        purchasePrice: product.purchasePrice || 0,
        taxRate: product.taxRate || 0,
        discount: 0 
      }, { emitEvent: true });
    }
  }

  calculateRowTotal(group: FormGroup | any): void {
    const qty = group.get('quantity')?.value || 0;
    const price = group.get('purchasePrice')?.value || 0;
    const tax = group.get('taxRate')?.value || 0;
    const discount = group.get('discount')?.value || 0;

    const baseTotal = (qty * price) - discount;
    const taxAmount = baseTotal * (tax / 100);
    const final = baseTotal + taxAmount;

    group.get('rowTotal')?.setValue(final > 0 ? final : 0, { emitEvent: false });
  }

  calculateTotals(): void {
    let subTotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    this.items.controls.forEach(control => {
      const vals = control.value; 
      const qty = vals.quantity || 0;
      const price = vals.purchasePrice || 0;
      const taxRate = vals.taxRate || 0;
      const itemDiscount = vals.discount || 0;

      const lineTotal = qty * price;
      
      subTotal += lineTotal;
      totalDiscount += itemDiscount;
      
      const taxableAmount = lineTotal - itemDiscount;
      totalTax += taxableAmount * (taxRate / 100);
    });

    const grandTotal = subTotal + totalTax - totalDiscount;
    const paid = this.purchaseForm.get('paidAmount')?.value || 0;
    const balance = grandTotal - paid;

    let payStatus = 'unpaid';
    if (paid >= grandTotal && grandTotal > 0) payStatus = 'paid';
    else if (paid > 0) payStatus = 'partial';

    this.purchaseForm.patchValue({
      subTotal,
      totalTax,
      totalDiscount,
      grandTotal,
      balanceAmount: balance > 0 ? balance : 0,
      paymentStatus: payStatus
    }, { emitEvent: false });
  }

  // --- File Handling ---
  onFileSelect(event: any) {
    for (let file of event.files) {
      this.selectedFiles.push(file);
    }
  }

  onFileRemove(event: any) {
     this.selectedFiles = this.selectedFiles.filter(f => f.name !== event.file.name);
  }

  // --- Submission ---
  onSubmit(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      this.messageService.showError('Invalid Form', 'Please check required fields.');
      return;
    }

    // this.isSubmitting.set(true);
    const formValue = this.purchaseForm.getRawValue();
    const fd = new FormData();

    fd.append('supplierId', formValue.supplierId);
    fd.append('branchId', formValue.branchId);
    fd.append('invoiceNumber', formValue.invoiceNumber);
    fd.append('purchaseDate', new Date(formValue.purchaseDate).toISOString());
    if (formValue.dueDate) fd.append('dueDate', new Date(formValue.dueDate).toISOString());
    fd.append('status', formValue.status);
    fd.append('notes', formValue.notes || '');
    fd.append('grandTotal', formValue.grandTotal);
    fd.append('paidAmount', formValue.paidAmount);
    fd.append('paymentMethod', formValue.paymentMethod);
    fd.append('paymentStatus', formValue.paymentStatus);

    const cleanItems = formValue.items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      taxRate: item.taxRate,
      discount: item.discount
    }));
    fd.append('items', JSON.stringify(cleanItems));

    this.selectedFiles.forEach(file => {
      fd.append('attachments', file);
    });

    const request$ = this.editMode()
      ? this.purchaseService.updatePurchase(this.purchaseId!, fd)
      : this.purchaseService.createPurchase(fd);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', 'Purchase saved successfully');
        this.router.navigate(['/purchase']);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save purchase');
      }
    });
  }

  // --- Edit Mode Loading (UPDATED) ---
  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.purchaseId = params.get('id');
        if (this.purchaseId) {
          // this.editMode.set(true);
          this.formTitle.set('Edit Purchase');
          return this.purchaseService.getPurchaseById(this.purchaseId);
        }
        return of(null);
      })
    ).subscribe({
      next: (res: any) => {
        // Updated Check: Ensure we access res.data.purchase
        if (res && res.data && res.data.purchase) {
          this.patchData(res.data.purchase);
        } else if (res && res.data) {
           // Fallback if structure is flat
           this.patchData(res.data);
        }
      },
      error: (err) => {
        this.messageService.showError('Error', 'Failed to load purchase details');
      }
    });
  }

  // --- Patch Data (UPDATED) ---
  private patchData(data: any) {
    // We create a copy to avoid mutating the original data
    const patch = { ...data };

    // 1. Convert Strings to Date Objects for PrimeNG Datepicker
    if (patch.purchaseDate) patch.purchaseDate = new Date(patch.purchaseDate);
    if (patch.dueDate) patch.dueDate = new Date(patch.dueDate);

    // 2. Extract _id from Populated Objects for Dropdowns
    if (patch.supplierId && typeof patch.supplierId === 'object') {
        patch.supplierId = patch.supplierId._id;
    }
    if (patch.branchId && typeof patch.branchId === 'object') {
        patch.branchId = patch.branchId._id;
    }

    // 3. Patch the main form fields
    this.purchaseForm.patchValue(patch);

    // 4. Handle Items Array
    this.items.clear();
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        const group = this.createItem();
        
        // Prepare item patch data
        const itemPatch = { ...item };
        
        // Handle Populated Product inside Item
        if (itemPatch.productId && typeof itemPatch.productId === 'object') {
           // Ensure name is preserved
           itemPatch.name = itemPatch.productId.name || itemPatch.name;
           // Set ID for dropdown
           itemPatch.productId = itemPatch.productId._id;
        }

        group.patchValue(itemPatch);
        
        // Re-attach listener for calculations on this row
        group.valueChanges.subscribe(() => {
          this.calculateRowTotal(group);
          this.calculateTotals();
        });

        // Calculate initial row total
        this.calculateRowTotal(group);
        
        this.items.push(group);
      });
    }
    
    // 5. Recalculate global totals to ensure UI matches data
    this.calculateTotals();
  }
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { TextareaModule } from 'primeng/textarea';
// import { FileUploadModule } from 'primeng/fileupload'; // For Attachments
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToggleButtonModule } from 'primeng/togglebutton';
// import { DatePicker } from 'primeng/datepicker';
// import { MasterListService } from '../../../core/services/master-list.service';
// import { AppMessageService } from '../../../core/services/message.service';
// import { PurchaseService } from '../purchase.service';
// import { Divider } from "primeng/divider";

// @Component({
//   selector: 'app-purchase-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ButtonModule,
//     InputTextModule,
//     InputNumberModule,
//     SelectModule,
//     DatePicker,
//     TextareaModule,
//     FileUploadModule,
//     TooltipModule,
//     ToggleButtonModule,
//     RouterLink,
//     Divider
// ],
//   templateUrl: './purchase-form.html',
//   styleUrl: './purchase-form.scss',
// })
// export class PurchaseFormComponent implements OnInit {
//   // --- Injections ---
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private purchaseService = inject(PurchaseService);
//   private masterList = inject(MasterListService); // Assuming this holds suppliers/branches/products
//   private messageService = inject(AppMessageService);

//   // --- State ---
//   purchaseForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   purchaseId: string | null = null;
//   formTitle = signal('New Purchase Entry');

//   // --- Data Signals ---
//   supplierOptions = signal<any[]>([]);
//   branchOptions = signal<any[]>([]);
//   productOptions = signal<any[]>([]); // Should contain { _id, name, purchasePrice, taxRate }

//   // --- Enums ---
//   statusOptions = [
//     { label: 'Draft', value: 'draft' },
//     { label: 'Received', value: 'received' },
//     { label: 'Cancelled', value: 'cancelled' }
//   ];

//   paymentMethods = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'Bank Transfer', value: 'bank' },
//     { label: 'Credit', value: 'credit' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Other', value: 'other' }
//   ];

//   // --- File Handling ---
//   selectedFiles: File[] = [];

//   constructor() {
//     // Load Master Data
//     this.branchOptions.set(this.masterList.branches());
//     this.supplierOptions.set(this.masterList.suppliers());
//     this.productOptions.set(this.masterList.products()); 
//   }

//   ngOnInit(): void {
//     this.buildForm();
//     this.checkRouteForEditMode();
//   }

//   private buildForm(): void {
//     this.purchaseForm = this.fb.group({
//       // Core Links
//       supplierId: [null, Validators.required],
//       branchId: [null, Validators.required],
      
//       // Details
//       invoiceNumber: ['', Validators.required],
//       purchaseDate: [new Date(), Validators.required],
//       dueDate: [null],
//       status: ['draft', Validators.required],
      
//       // Items
//       items: this.fb.array([]),

//       // Totals (Read Only mostly, calculated)
//       subTotal: [{ value: 0, disabled: true }],
//       totalTax: [{ value: 0, disabled: true }],
//       totalDiscount: [{ value: 0, disabled: true }],
//       grandTotal: [{ value: 0, disabled: true }],

//       // Payment
//       paymentStatus: ['unpaid'], // logic handles this based on paidAmount
//       paidAmount: [0, [Validators.min(0)]],
//       paymentMethod: ['cash'],
//       balanceAmount: [{ value: 0, disabled: true }],

//       // Meta
//       notes: [''],
//     });

//     // Add one empty row by default
//     this.addItem();

//     // Listen to changes for calculations
//     this.purchaseForm.get('paidAmount')?.valueChanges.subscribe(() => this.calculateTotals());
//   }

//   // --- Items Management ---
//   get items(): FormArray {
//     return this.purchaseForm.get('items') as FormArray;
//   }

//   createItem(): FormGroup {
//     return this.fb.group({
//       productId: [null, Validators.required],
//       name: [''], // Hidden, filled on product select
//       quantity: [1, [Validators.required, Validators.min(1)]],
//       purchasePrice: [0, [Validators.required, Validators.min(0)]],
//       taxRate: [0, [Validators.min(0)]],
//       discount: [0, [Validators.min(0)]],
//       // UI Helper for row total
//       rowTotal: [{ value: 0, disabled: true }]
//     });
//   }

//   addItem(): void {
//     const itemGroup = this.createItem();
    
//     // Listen to changes within the row to update row total & grand total
//     itemGroup.valueChanges.subscribe(() => {
//       this.calculateRowTotal(itemGroup);
//       this.calculateTotals();
//     });

//     this.items.push(itemGroup);
//   }

//   removeItem(index: number): void {
//     this.items.removeAt(index);
//     this.calculateTotals();
//   }

//   // --- Logic & Calculations ---

//   // When a product is selected in dropdown
//   onProductSelect(index: number, productId: string): void {
//     const product = this.productOptions().find(p => p._id === productId);
//     if (product) {
//       const row = this.items.at(index);
//       row.patchValue({
//         name: product.name,
//         purchasePrice: product.purchasePrice || 0,
//         taxRate: product.taxRate || 0,
//         discount: 0 // Reset discount
//       }, { emitEvent: true }); // emitEvent triggers calculation
//     }
//   }

//   calculateRowTotal(group: FormGroup | any): void {
//     const qty = group.get('quantity')?.value || 0;
//     const price = group.get('purchasePrice')?.value || 0;
//     const tax = group.get('taxRate')?.value || 0;
//     const discount = group.get('discount')?.value || 0;

//     const baseTotal = (qty * price) - discount;
//     const taxAmount = baseTotal * (tax / 100);
//     const final = baseTotal + taxAmount;

//     group.get('rowTotal')?.setValue(final > 0 ? final : 0, { emitEvent: false });
//   }

//   calculateTotals(): void {
//     let subTotal = 0;
//     let totalTax = 0;
//     let totalDiscount = 0;

//     this.items.controls.forEach(control => {
//       const vals = control.value; // Note: getRawValue() if disabled fields involved
//       const qty = vals.quantity || 0;
//       const price = vals.purchasePrice || 0;
//       const taxRate = vals.taxRate || 0;
//       const itemDiscount = vals.discount || 0;

//       const lineTotal = qty * price;
      
//       subTotal += lineTotal;
//       totalDiscount += itemDiscount;
      
//       const taxableAmount = lineTotal - itemDiscount;
//       totalTax += taxableAmount * (taxRate / 100);
//     });

//     const grandTotal = subTotal + totalTax - totalDiscount;
//     const paid = this.purchaseForm.get('paidAmount')?.value || 0;
//     const balance = grandTotal - paid;

//     // Update Payment Status automatically based on math
//     let payStatus = 'unpaid';
//     if (paid >= grandTotal && grandTotal > 0) payStatus = 'paid';
//     else if (paid > 0) payStatus = 'partial';

//     this.purchaseForm.patchValue({
//       subTotal,
//       totalTax,
//       totalDiscount,
//       grandTotal,
//       balanceAmount: balance > 0 ? balance : 0,
//       paymentStatus: payStatus
//     }, { emitEvent: false });
//   }

//   // --- File Handling ---
//   onFileSelect(event: any) {
//     // PrimeNG FileUpload component event
//     for (let file of event.files) {
//       this.selectedFiles.push(file);
//     }
//   }

//   onFileRemove(event: any) {
//      this.selectedFiles = this.selectedFiles.filter(f => f.name !== event.file.name);
//   }

//   // --- Submisson ---
//   onSubmit(): void {
//     if (this.purchaseForm.invalid) {
//       this.purchaseForm.markAllAsTouched();
//       this.messageService.showError('Invalid Form', 'Please check required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
    
//     // 1. Get Raw Data
//     const formValue = this.purchaseForm.getRawValue();

//     // 2. Create FormData
//     const fd = new FormData();

//     // Append simple fields
//     fd.append('supplierId', formValue.supplierId);
//     fd.append('branchId', formValue.branchId);
//     fd.append('invoiceNumber', formValue.invoiceNumber);
//     fd.append('purchaseDate', new Date(formValue.purchaseDate).toISOString());
//     if (formValue.dueDate) fd.append('dueDate', new Date(formValue.dueDate).toISOString());
//     fd.append('status', formValue.status);
//     fd.append('notes', formValue.notes || '');
    
//     // Append Totals (Though backend calculates, sometimes good to send for validation)
//     fd.append('grandTotal', formValue.grandTotal);
//     fd.append('paidAmount', formValue.paidAmount);
//     fd.append('paymentMethod', formValue.paymentMethod);
//     fd.append('paymentStatus', formValue.paymentStatus);

//     // Append Items as Stringified JSON
//     // Clean up items to match Mongoose Schema exactly
//     const cleanItems = formValue.items.map((item: any) => ({
//       productId: item.productId,
//       name: item.name,
//       quantity: item.quantity,
//       purchasePrice: item.purchasePrice,
//       taxRate: item.taxRate,
//       discount: item.discount
//     }));
//     fd.append('items', JSON.stringify(cleanItems));

//     // Append Files
//     this.selectedFiles.forEach(file => {
//       fd.append('attachments', file);
//     });

//     // 3. API Call
//     const request$ = this.editMode()
//       ? this.purchaseService.updatePurchase(this.purchaseId!, fd)
//       : this.purchaseService.createPurchase(fd);

//     request$.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: (res) => {
//         this.messageService.showSuccess('Success', 'Purchase saved successfully');
//         this.router.navigate(['/purchase']);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save purchase');
//       }
//     });
//   }

//   // --- Edit Mode Loading (Simplified) ---
//   private checkRouteForEditMode(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         this.purchaseId = params.get('id');
//         if (this.purchaseId) {
//           this.editMode.set(true);
//           this.formTitle.set('Edit Purchase');
//           return this.purchaseService.getPurchaseById(this.purchaseId);
//         }
//         return of(null);
//       })
//     ).subscribe(res => {
//       if (res && res.data) {
//         this.patchData(res.data);
//       }
//     });
//   }

//   private patchData(data: any) {
//     // Standard patch
//     this.purchaseForm.patchValue({
//       ...data,
//       purchaseDate: new Date(data.purchaseDate),
//       dueDate: data.dueDate ? new Date(data.dueDate) : null
//     });

//     // Patch Items
//     this.items.clear();
//     data.items.forEach((item: any) => {
//       const group = this.createItem();
//       group.patchValue(item);
//       this.calculateRowTotal(group); // Calc total for UI
//       this.items.push(group);
//     });
    
//     this.calculateTotals();
//   }
// }