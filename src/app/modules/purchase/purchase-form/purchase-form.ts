import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule, ToastModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, DatePicker, TextareaModule, FileUploadModule, TooltipModule, ToggleButtonModule, RouterLink, Divider],
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.scss',
})

export class PurchaseFormComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
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
      supplierId: [null, Validators.required],
      branchId: [null, Validators.required],
      invoiceNumber: ['', Validators.required],
      purchaseDate: [new Date(), Validators.required],
      dueDate: [null],
      status: ['draft', Validators.required],
      items: this.fb.array([]),
      subTotal: [{ value: 0, disabled: true }],
      totalTax: [{ value: 0, disabled: true }],
      totalDiscount: [{ value: 0, disabled: true }],
      grandTotal: [{ value: 0, disabled: true }],
      paymentStatus: ['unpaid'],
      paidAmount: [0, [Validators.min(0)]],
      paymentMethod: ['cash'],
      balanceAmount: [{ value: 0, disabled: true }],
      notes: [''],
    });
    if (!this.editMode()) { this.addItem(); }
    this.purchaseForm.get('paidAmount')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.calculateTotals());
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
    itemGroup.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateRowTotal(itemGroup);
      this.calculateTotals();
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.calculateTotals();
  }

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

  onFileSelect(event: any) {
    for (let file of event.files) {
      this.selectedFiles.push(file);
    }
  }

  onFileRemove(event: any) {
    this.selectedFiles = this.selectedFiles.filter(f => f.name !== event.file.name);
  }

  // onSubmit(): void {
  //   if (this.purchaseForm.invalid) {
  //     this.purchaseForm.markAllAsTouched();
  //     this.messageService.showError('Invalid Form', 'Please check required fields.');
  //     return;
  //   }
  //   const formValue = this.purchaseForm.getRawValue();
  //   const fd = new FormData();
  //   fd.append('supplierId', formValue.supplierId);
  //   fd.append('branchId', formValue.branchId);
  //   fd.append('invoiceNumber', formValue.invoiceNumber);
  //   fd.append('purchaseDate', new Date(formValue.purchaseDate).toISOString());
  //   if (formValue.dueDate) fd.append('dueDate', new Date(formValue.dueDate).toISOString());
  //   fd.append('status', formValue.status);
  //   fd.append('notes', formValue.notes || '');
  //   fd.append('grandTotal', formValue.grandTotal);
  //   fd.append('paidAmount', formValue.paidAmount);
  //   fd.append('paymentMethod', formValue.paymentMethod);
  //   fd.append('paymentStatus', formValue.paymentStatus);
  //   const cleanItems = formValue.items.map((item: any) => ({
  //     productId: item.productId,
  //     name: item.name,
  //     quantity: item.quantity,
  //     purchasePrice: item.purchasePrice,
  //     taxRate: item.taxRate,
  //     discount: item.discount
  //   }));
  //   fd.append('items', JSON.stringify(cleanItems));
  //   this.selectedFiles.forEach(file => {
  //     fd.append('attachments', file);
  //   });

  //   const request$ = this.editMode()
  //     ? this.purchaseService.updatePurchase(this.purchaseId!, fd)
  //     : this.purchaseService.createPurchase(fd);
  //   request$.pipe(
  //     finalize(() => this.isSubmitting.set(false))
  //   ).subscribe({
  //     next: (res) => {
  //       this.messageService.showSuccess('Success', 'Purchase saved successfully');
  //       this.router.navigate(['/purchase']);
  //     },
  //     error: (err) => {
  //       this.messageService.showError('Error', err.error?.message || 'Failed to save purchase');
  //     }
  //   });
  // }
  // private checkRouteForEditMode(): void {
  //   this.route.paramMap.pipe(
  //     switchMap(params => {
  //       this.purchaseId = params.get('id');
  //       if (this.purchaseId) {
  //         this.formTitle.set('Edit Purchase');
  //         return this.purchaseService.getPurchaseById(this.purchaseId);
  //       }
  //       return of(null);
  //     })
  //   ).subscribe({
  //     next: (res: any) => {
  //       if (res && res.data && res.data.purchase) {
  //         this.patchData(res.data.purchase);
  //       } else if (res && res.data) {
  //         this.patchData(res.data);
  //       }
  //     },
  //     error: (err) => {
  //       this.messageService.showError('Error', 'Failed to load purchase details');
  //     }
  //   });
  // }
onSubmit(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      // Converted to a warning toast with a single string
      this.messageService.showWarn('Validation Error: Please check all required fields.');
      return;
    }

    // Activated the submitting state so the UI locks during the request
    this.isSubmitting.set(true);
    
    const formValue = this.purchaseForm.getRawValue();
    const fd = new FormData();
    
    // Append standard fields
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

    // Clean and stringify array data for multipart form submission
    const cleanItems = formValue.items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      taxRate: item.taxRate,
      discount: item.discount
    }));
    fd.append('items', JSON.stringify(cleanItems));

    // Append file attachments
    this.selectedFiles.forEach(file => {
      fd.append('attachments', file);
    });

    const request$ = this.editMode()
      ? this.purchaseService.updatePurchase(this.purchaseId!, fd)
      : this.purchaseService.createPurchase(fd);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess(`Purchase ${this.editMode() ? 'updated' : 'saved'} successfully.`);
        this.router.navigate(['/purchase']);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.purchaseId = params.get('id');
        if (this.purchaseId) {
          this.editMode.set(true);
          this.formTitle.set('Edit Purchase');
          return this.purchaseService.getPurchaseById(this.purchaseId);
        }
        return of(null);
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (!res) return; 
        const purchaseData = res.data?.purchase || res.data;
        if (purchaseData) {
          this.patchData(purchaseData);
        }
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private patchData(data: any) {
    const patch = { ...data };
    if (patch.purchaseDate) patch.purchaseDate = new Date(patch.purchaseDate);
    if (patch.dueDate) patch.dueDate = new Date(patch.dueDate);
    if (patch.supplierId && typeof patch.supplierId === 'object') {
      patch.supplierId = patch.supplierId._id;
    }
    if (patch.branchId && typeof patch.branchId === 'object') {
      patch.branchId = patch.branchId._id;
    }
    this.purchaseForm.patchValue(patch);
    this.items.clear();
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        const group = this.createItem();
        const itemPatch = { ...item };
        if (itemPatch.productId && typeof itemPatch.productId === 'object') {
          itemPatch.name = itemPatch.productId.name || itemPatch.name;
          itemPatch.productId = itemPatch.productId._id;
        }
        group.patchValue(itemPatch);
        group.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.calculateRowTotal(group);
          this.calculateTotals();
        });
        this.calculateRowTotal(group);
        this.items.push(group);
      });
    }
    this.calculateTotals();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
