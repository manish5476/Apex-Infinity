import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select'; // Or DropdownModule depending on version
import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InputTextModule } from 'primeng/inputtext';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, InputNumberModule, InputTextModule, FloatLabelModule],
  templateUrl: './stock-adjustment.html',
  styleUrls: ['./stock-adjustment.scss'],
})
export class StockAdjustmentComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);
  adjustmentForm!: FormGroup;
  branches: any[] = [];
  isLoading = false;

  adjustmentTypes = [
    { label: 'Add Stock (+)', value: 'add' },
    { label: 'Remove Stock (-)', value: 'subtract' }
  ];

  ngOnInit(): void {
    this.branches = this.masterList.branches() || [];

    this.adjustmentForm = this.fb.group({
      branchId: [null, [Validators.required]],
      type: ['add', [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(3)]]
    });

    if (this.branches.length > 0) {
      this.adjustmentForm.patchValue({ branchId: this.branches[0]._id });
    }
  }
  get typeCtrl() { return this.adjustmentForm.get('type'); }
  get branchCtrl() { return this.adjustmentForm.get('branchId'); }
  get qtyCtrl() { return this.adjustmentForm.get('quantity'); }
  get reasonCtrl() { return this.adjustmentForm.get('reason'); }

  onSubmit() {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      // Added user feedback so silent failures don't happen
      this.messageService.showWarn('Validation Error: Please fill in all required adjustment fields.');
      return;
    }

    const { branchId, type, quantity, reason } = this.adjustmentForm.getRawValue();
    const productId = this.config.data?.id;

    if (!productId) {
      // Replaced local error handler with a specific global toast
      this.messageService.showError('Configuration Error: Product ID is missing. Cannot adjust stock.');
      return;
    }
    this.isLoading = true;
    const payload = { branchId, type, quantity, reason };
    this.productService.adjustProductStock(productId, payload)
      .pipe(finalize(() => this.isLoading = false), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Stock adjusted successfully.');
          this.ref.close(true);
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  private handleError(msg: string) {
    this.messageService.showError(msg);
    this.isLoading = false;
  }

  onCancel() {
    this.ref.close(false);
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
