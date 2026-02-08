import { Component, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule, // Check if your version uses DropdownModule
    InputNumberModule,
    InputTextModule,
    FloatLabelModule
  ],
  templateUrl: './stock-adjustment.html',
  styleUrls: ['./stock-adjustment.scss'],
})
export class StockAdjustmentComponent implements OnInit {
  
  // Dependency Injection
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  // State
  adjustmentForm!: FormGroup;
  branches: any[] = [];
  isLoading = false;

  adjustmentTypes = [
    { label: 'Add Stock (+)', value: 'add' },
    { label: 'Remove Stock (-)', value: 'subtract' }
  ];

  ngOnInit(): void {
    // 1. Load Data
    this.branches = this.masterList.branches() || [];

    // 2. Initialize Form
    this.adjustmentForm = this.fb.group({
      branchId: [null, [Validators.required]],
      type: ['add', [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(3)]]
    });

    // 3. Set Defaults
    if (this.branches.length > 0) {
      this.adjustmentForm.patchValue({ branchId: this.branches[0]._id });
    }
  }

  // Helper Getters for Template
  get typeCtrl() { return this.adjustmentForm.get('type'); }
  get branchCtrl() { return this.adjustmentForm.get('branchId'); }
  get qtyCtrl() { return this.adjustmentForm.get('quantity'); }
  get reasonCtrl() { return this.adjustmentForm.get('reason'); }

  onSubmit() {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { branchId, type, quantity, reason } = this.adjustmentForm.value;
    const productId = this.config.data?.id;

    if (!productId) {
      this.handleError('Product ID is missing');
      return;
    }

    const payload = { branchId, type, quantity, reason };

    this.productService.adjustProductStock(productId, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Stock adjusted successfully');
        this.ref.close(true);
      },
      error: (err) => this.handleError(err.error?.message || 'Failed to adjust stock')
    });
  }

  private handleError(msg: string) {
    this.messageService.showError(msg);
    this.isLoading = false;
  }

  onCancel() {
    this.ref.close(false);
  }
}
