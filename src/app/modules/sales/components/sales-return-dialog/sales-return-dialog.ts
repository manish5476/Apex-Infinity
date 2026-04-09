import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

// Services
import { SalesReturnService, CreateSalesReturnPayload } from '@core/services/sales.return.service';
import { InvoiceService } from '../../../../modules/invoice/services/invoice-service';
import { AppMessageService } from '@core/services/message.service';
import { CommonMethodService } from '@core/utils/common-method.service';
import { Subject } from "rxjs";

@Component({
  selector: 'app-sales-return-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    SelectModule,
    TextareaModule
  ],
  templateUrl: './sales-return-dialog.html',
  styleUrl: './sales-return-dialog.scss'
})
export class SalesReturnDialogComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private fb = inject(FormBuilder);
  private salesReturnService = inject(SalesReturnService);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // States
  isLoading = signal(true);
  isSubmitting = signal(false);
  invoice = signal<any | null>(null);
  returnItems = signal<any[]>([]);

  returnForm: FormGroup;

  reasons = [
    { label: 'Damaged Product', value: 'damaged' },
    { label: 'Incorrect Item', value: 'incorrect_item' },
    { label: 'Expired Product', value: 'expired' },
    { label: 'Customer Dissatisfaction', value: 'dissatisfied' },
    { label: 'Order Correction', value: 'correction' },
    { label: 'Other', value: 'other' }
  ];

  // Computed
  selectedItemsCount = computed(() => this.returnItems().filter(i => i.isSelected).length);

  totalReturnAmount = computed(() => {
    return this.returnItems()
      .filter(i => i.isSelected)
      .reduce((acc, item) => {
        const subtotal = (item.returnQuantity || 0) * (item.price || 0);
        const taxAmount = subtotal * ((item.taxRate || 0) / 100);
        return acc + subtotal + taxAmount;
      }, 0);
  });

  isValid = computed(() => {
    const hasSelectedItems = this.returnItems().some(i => i.isSelected && i.returnQuantity > 0);
    return hasSelectedItems && this.returnForm.valid;
  });

  constructor() {
    this.returnForm = this.fb.group({
      reason: ['correction', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const data = this.config.data;
    console.log(data);

    if (data?.invoice) {
      this.setupInvoice(data.invoice);
    } else if (data?.invoiceId) {
      this.loadInvoice(data.invoiceId);
    } else {
      this.messageService.showError('No invoice context provided for return.');
      this.ref.close();
    }
  }

  private loadInvoice(id: string): void {
    this.isLoading.set(true);
    this.invoiceService.getInvoiceById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res.data?.data || res.data?.invoice || res.data;
        this.setupInvoice(data);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
        this.ref.close();
      }
    });
  }

  private setupInvoice(invoice: any): void {
    this.invoice.set(invoice);

    // Initialize return items with 0 quantity
    // Ensure we handle potentially missing fields gracefully
    const items = (invoice.items || []).map((item: any, index: number) => ({
      ...item,
      // CRITICAL: Ensure unique ID for tracking in the signal. 
      // If the item doesn't have an _id, use productId._id or its index.
      _id: item._id || (typeof item.productId === 'string' ? item.productId : item.productId?._id) || `item-${index}`,

      // Fallback for name if it's nested in productId
      name: item.name || item.productId?.name || 'Unknown Product',
      returnQuantity: 0,
      isSelected: false,

      // Ensure numeric values for safe calculations
      price: Number(item.price || 0),
      taxRate: Number(item.taxRate || 0),
      quantity: Number(item.quantity || 0)
    }));

    this.returnItems.set(items);
    this.isLoading.set(false);
  }

  toggleItem(item: any): void {
    this.returnItems.update(items =>
      items.map(i => {
        if (i._id === item._id) {
          const isSelected = !i.isSelected;
          return {
            ...i,
            isSelected,
            // If selecting, default to 1 if it was 0
            returnQuantity: isSelected && i.returnQuantity === 0 ? 1 : (isSelected ? i.returnQuantity : 0)
          };
        }
        return i;
      })
    );
  }

  onQuantityChange(item: any, value: number | null): void {
    const qty = value || 0;
    this.returnItems.update(items =>
      items.map(i => {
        if (i._id === item._id) {
          return {
            ...i,
            returnQuantity: qty,
            isSelected: qty > 0
          };
        }
        return i;
      })
    );
  }

  submitReturn(): void {
    if (!this.isValid()) return;

    this.isSubmitting.set(true);
    const selectedItems = this.returnItems().filter(i => i.isSelected && i.returnQuantity > 0);

    const payload: CreateSalesReturnPayload = {
      invoiceId: this.invoice()._id,
      items: selectedItems.map(i => ({
        productId: i.productId?._id || i.productId,
        quantity: i.returnQuantity
      })),
      reason: this.returnForm.value.reason,
      notes: this.returnForm.value.notes
    };

    this.salesReturnService.createSalesReturn(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Sales return processed successfully');
          this.ref.close(true);
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
  }

  cancel(): void {
    this.ref.close();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
