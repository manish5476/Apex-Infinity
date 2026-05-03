import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { forkJoin, Subject } from 'rxjs';
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
      this.isLoading.set(true);
      this.salesReturnService.getSalesReturns({ invoiceId: data.invoice._id, limit: 100 })
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            const priorReturns = res.data?.returns || res.data || [];
            this.setupInvoice(data.invoice, priorReturns);
          },
          error: (err: any) => {
            this.messageService.handleHttpError(err);
            this.ref.close();
          }
        });
    } else if (data?.invoiceId) {
      this.loadInvoice(data.invoiceId);
    } else {
      this.messageService.showError('No invoice context provided for return.');
      this.ref.close();
    }
  }

  private loadInvoice(id: string): void {
    this.isLoading.set(true);

    forkJoin({
      invoiceRes: this.invoiceService.getInvoiceById(id),
      returnsRes: this.salesReturnService.getSalesReturns({ invoiceId: id, limit: 100 })
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ invoiceRes, returnsRes }: any) => {
        const data = invoiceRes.data?.data || invoiceRes.data?.invoice || invoiceRes.data;
        const priorReturns = returnsRes.data?.returns || returnsRes.data || [];
        this.setupInvoice(data, priorReturns);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
        this.ref.close();
      }
    });
  }

  private setupInvoice(invoice: any, priorReturns: any[] = []): void {
    this.invoice.set(invoice);

    const returnedQtyMap: { [key: string]: number } = {};
    for (const r of priorReturns) {
      if (r.status !== 'rejected') {
        for (const i of r.items) {
          const key = i.productId?._id || i.productId;
          returnedQtyMap[key] = (returnedQtyMap[key] || 0) + i.quantity;
        }
      }
    }

    // Initialize return items with 0 quantity
    // Ensure we handle potentially missing fields gracefully
    const items = (invoice.items || []).map((item: any, index: number) => {
      const prodId = item._id || (typeof item.productId === 'string' ? item.productId : item.productId?._id) || `item-${index}`;
      const qty = Number(item.quantity || 0);
      const alreadyReturned = returnedQtyMap[prodId] || 0;
      const maxReturnable = Math.max(0, qty - alreadyReturned);

      return {
        ...item,
        _id: prodId,
        name: item.name || item.productId?.name || 'Unknown Product',
        returnQuantity: 0,
        isSelected: false,
        price: Number(item.price || 0),
        taxRate: Number(item.taxRate || 0),
        quantity: qty,
        alreadyReturned,
        maxReturnable
      };
    }).filter((i: any) => i.maxReturnable > 0);

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
    // Cap to max returnable
    const validQty = Math.min(qty, item.maxReturnable);

    this.returnItems.update(items =>
      items.map(i => {
        if (i._id === item._id) {
          return {
            ...i,
            returnQuantity: validQty,
            isSelected: validQty > 0
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
