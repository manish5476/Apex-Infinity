import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';

import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    FloatLabelModule
  ],
  templateUrl: './stock-adjustment.html',
  styleUrls: ['./stock-adjustment.scss'],
})
export class StockAdjustmentComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  // Data & Form
  adjustmentForm!: FormGroup;
  branches: any[] = [];
  isLoading = false;

  adjustmentTypes = [
    { label: 'Add Stock (+)', value: 'add' },
    { label: 'Remove Stock (-)', value: 'subtract' }
  ];

  ngOnInit(): void {
    this.branches = this.masterList.branches() || [];

    // 2. Initialize Form
    this.adjustmentForm = this.fb.group({
      branchId: [null, [Validators.required]],
      type: ['add', [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(3)]]
    });

    // 3. Set default branch if available (Optional)
    if (this.branches.length > 0) {
      this.adjustmentForm.patchValue({ branchId: this.branches[0]._id });
    }
  }

  onSubmit() {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.adjustmentForm.value;
    const productId = this.config.data?.id;

    if (!productId) {
      this.messageService.showError('Product ID is missing');
      this.ref.close();
      return;
    }

    const payload = {
      branchId: formValue.branchId,
      type: formValue.type,
      quantity: formValue.quantity,
      reason: formValue.reason
    };

    this.productService.adjustProductStock(productId, payload).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Stock adjusted successfully');
        this.ref.close(true); // Close dialog and pass 'true' to trigger refresh in parent
        this.isLoading = false;
      },
      error: (err) => {
        // Error is handled by global interceptor usually, but safe to handle here too
        this.messageService.showError(err.error?.message || 'Failed to adjust stock');
        this.isLoading = false;
      }
    });
  }

  onCancel() {
    this.ref.close(false);
  }
}