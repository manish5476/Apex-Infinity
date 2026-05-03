import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize, distinctUntilChanged } from 'rxjs/operators';
import { forkJoin, Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

import { AppMessageService } from '../../../core/services/message.service';
import { PurchaseService } from '../purchase.service';

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    CurrencyPipe, DatePipe, ButtonModule, CardModule, TableModule,
    InputNumberModule, TagModule, DividerModule, MessageModule,
    TooltipModule
  ],
  templateUrl: './purchase-return.html',
  styleUrls: ['./purchase-return.scss']
})
export class PurchaseReturnComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);

  // State
  purchaseId = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  originalPurchase = signal<any>(null);
  totalRefundAmount = signal<number>(0);

  private formSub: Subscription | null = null;

  // Form
  returnForm: FormGroup = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
    items: this.fb.array([]) // Will be populated dynamically
  });

  get returnItems() {
    return this.returnForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.purchaseId.set(this.route.snapshot.paramMap.get('id'));

    if (this.purchaseId()) {
      this.loadPurchase(this.purchaseId()!);
    } else {
      this.router.navigate(['/purchase']);
    }

    // ✅ THE FIX: Subscribe to form changes globally
    // This runs AFTER the form control updates, ensuring calculations are accurate
    this.formSub = this.returnForm.valueChanges
      .pipe(distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)))
      .subscribe(() => {
        this.recalculate();
      });
  }

  ngOnDestroy() {
    if (this.formSub) this.formSub.unsubscribe();
  }

  // ✅ Auto-calculation Logic
  recalculate() {
    // Get raw values to ensure we catch everything
    const items = this.returnForm.getRawValue().items || [];
    let total = 0;

    items.forEach((item: any) => {
      const qty = Number(item.returnQty) || 0;
      const price = Number(item.price) || 0;
      const tax = Number(item.taxRate) || 0;

      if (qty > 0) {
        // Formula: (Price * Qty) + Tax Portion
        const base = qty * price;
        const taxAmount = base * (tax / 100);
        total += base + taxAmount;
      }
    });

    this.totalRefundAmount.set(total);
  }

  // Helper for template display
  getRowTotal(control: any): number {
    const val = control.value; // Access reactive value directly
    const qty = Number(val.returnQty) || 0;
    const price = Number(val.price) || 0;
    const tax = Number(val.taxRate) || 0;
    const base = qty * price;
    return base + (base * tax / 100);
  }



  initFormItems(items: any[], priorReturns: any[] = []) {
    this.returnItems.clear();

    const returnedQtyMap: { [key: string]: number } = {};
    for (const r of priorReturns) {
      if (r.status !== 'rejected') {
        for (const i of r.items) {
          const key = i.productId?._id || i.productId;
          returnedQtyMap[key] = (returnedQtyMap[key] || 0) + i.quantity;
        }
      }
    }

    items.forEach(item => {
      const prodId = item.productId && item.productId._id ? item.productId._id : item.productId;
      const alreadyReturned = returnedQtyMap[prodId] || 0;
      const maxReturnable = Math.max(0, item.quantity - alreadyReturned);

      if (maxReturnable > 0) {
        const prodName = item.productId && item.productId.name ? item.productId.name : item.name;

        this.returnItems.push(this.fb.group({
          productId: [prodId],
          name: [prodName],
          purchasedQty: [item.quantity],
          alreadyReturned: [alreadyReturned],
          maxReturnable: [maxReturnable],
          price: [item.purchasePrice],
          taxRate: [item.taxRate || 0],
          // Min 0 required for typing, Max prevents over-return
          returnQty: [0, [Validators.required, Validators.min(0), Validators.max(maxReturnable)]]
        }));
      }
    });

    // Initial Calc
    this.recalculate();
  }
  loadPurchase(id: string) {
    this.isLoading.set(true);

    forkJoin({
      purchase: this.purchaseService.getPurchaseById(id),
      returns: this.purchaseService.getAllReturns({ purchaseId: id })
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const data = res.purchase.data?.data || res.purchase.data;
          const returnsData = res.returns.data?.returns || res.returns.data || [];
          if (data) {
            this.originalPurchase.set(data);
            this.initFormItems(data.items, returnsData);
          }
        },
        error: (err) => {
          // Replaced manual error string with your global handler
          this.messageService.handleHttpError(err);
          this.router.navigate(['/purchase']);
        }
      });
  }

  onSubmit() {
    if (this.returnForm.invalid) {
      this.returnForm.markAllAsTouched();
      // Added warning feedback for general form validation
      this.messageService.showWarn('Validation Error: Please check all required fields.');
      return;
    }

    if (this.totalRefundAmount() <= 0) {
      // Converted to showWarn and standardized string
      this.messageService.showWarn('Validation Error: Please select at least one item to return.');
      return;
    }

    // Safely extract all values, even if some form controls are disabled
    const formValue = this.returnForm.getRawValue();

    const itemsToReturn = formValue.items
      .filter((item: any) => item.returnQty > 0)
      .map((item: any) => ({
        productId: item.productId,
        quantity: item.returnQty
      }));

    const payload = {
      items: itemsToReturn,
      reason: formValue.reason
    };

    this.isSubmitting.set(true);

    this.purchaseService.partialReturn(this.purchaseId()!, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          // Standardized success message punctuation
          this.messageService.showSuccess('Debit Note created successfully.');
          this.router.navigate(['/purchase', this.purchaseId()]);
        },
        error: (err) => {
          // Delegated to global HTTP error handler
          this.messageService.handleHttpError(err);
        }
      });
  }
}