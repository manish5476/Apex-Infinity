// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-purchase-return',
//   imports: [],
//   templateUrl: './purchase-return.html',
//   styleUrl: './purchase-return.scss',
// })
// export class PurchaseReturn {

// }
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { AppMessageService } from '../../../core/services/message.service';
import { PurchaseService } from '../purchase.service';


@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    // PrimeNG
    ButtonModule,
    CardModule,
    TableModule,
    InputNumberModule,
    TagModule,
    DividerModule,
    MessageModule
  ],
  templateUrl: './purchase-return.html',
  styleUrl: './purchase-return.scss'
})
export class PurchaseReturnComponent implements OnInit {
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

  // Form
  returnForm: FormGroup = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
    items: this.fb.array([])
  });

  // Computed Values
  totalRefundAmount = computed(() => {
    const items = this.returnItems.controls;
    let total = 0;
    items.forEach(control => {
      const qty = control.get('returnQty')?.value || 0;
      const price = control.get('price')?.value || 0;
      const tax = control.get('taxRate')?.value || 0;
      
      const lineTotal = qty * price;
      const taxAmount = (lineTotal * tax) / 100;
      total += lineTotal + taxAmount;
    });
    return total;
  });

  get returnItems() {
    return this.returnForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.purchaseId.set(this.route.snapshot.paramMap.get('id'));
    
    if (this.purchaseId()) {
      this.loadPurchase(this.purchaseId()!);
    } else {
      this.messageService.showError('Error', 'Invalid Purchase ID');
      this.router.navigate(['/purchase']);
    }
  }

  loadPurchase(id: string) {
    this.isLoading.set(true);
    this.purchaseService.getPurchaseById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res && res.data.data) {
            const purchase = res.data.data;
            this.originalPurchase.set(purchase);
            this.initFormItems(purchase.items);
          }
        },
        error: () => {
          this.messageService.showError('Error', 'Could not load purchase details');
          this.router.navigate(['/purchase']);
        }
      });
  }

  initFormItems(items: any[]) {
    this.returnItems.clear();
    items.forEach(item => {
      // Only add items that have quantity > 0
      if (item.quantity > 0) {
        this.returnItems.push(this.fb.group({
          productId: [item.productId._id || item.productId],
          name: [item.name],
          purchasedQty: [item.quantity],
          price: [item.purchasePrice],
          taxRate: [item.taxRate || 0],
          returnQty: [0, [Validators.min(0), Validators.max(item.quantity)]]
        }));
      }
    });
  }

  onSubmit() {
    if (this.returnForm.invalid) {
      this.returnForm.markAllAsTouched();
      return;
    }

    const formValue = this.returnForm.value;
    
    const itemsToReturn = formValue.items
      .filter((item: any) => item.returnQty > 0)
      .map((item: any) => ({
        productId: item.productId,
        quantity: item.returnQty
      }));

    if (itemsToReturn.length === 0) {
      this.messageService.showError('Warning', 'Please specify at least one item to return');
      return;
    }

    const payload = {
      items: itemsToReturn,
      reason: formValue.reason
    };

    this.isSubmitting.set(true);
    this.purchaseService.partialReturn(this.purchaseId()!, payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Success', 'Purchase return processed successfully');
          this.router.navigate(['/purchase', this.purchaseId()]);
        },
        error: (err) => {
          this.messageService.showError('Failed', err.error?.message || 'Return processing failed');
        }
      });
  }
}