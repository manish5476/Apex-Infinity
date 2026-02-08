import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select'; // Confirm module based on PrimeNG version
import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    FloatLabelModule,
    SelectModule,
    InputTextModule
  ],
  templateUrl: './stoct-transfer.html',
  styleUrls: ['./stoct-transfer.scss'],
})
export class StockTransferComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  
  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  // State
  transferForm!: FormGroup;
  branches: any[] = [];
  loading = false;

  ngOnInit(): void {
    // 1. Load Data
    this.branches = this.masterList.branches() || [];
    
    // 2. Init Form
    this.transferForm = this.fb.group({
      fromBranchId: [null, [Validators.required]],
      toBranchId: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      description: ['']
    }, { validators: this.branchConflictValidator });
  }

  // Getters for cleaner HTML
  get fromCtrl() { return this.transferForm.get('fromBranchId'); }
  get toCtrl() { return this.transferForm.get('toBranchId'); }
  get qtyCtrl() { return this.transferForm.get('quantity'); }

  // Custom Validator for same branch selection
  branchConflictValidator(group: AbstractControl) {
    const from = group.get('fromBranchId')?.value;
    const to = group.get('toBranchId')?.value;
    
    // If both are selected and same, set error on 'toBranchId'
    if (from && to && from === to) {
      group.get('toBranchId')?.setErrors({ sameBranch: true });
      return { sameBranch: true };
    }
    
    // Clear error if they are different (and if the only error was sameBranch)
    if (group.get('toBranchId')?.hasError('sameBranch')) {
      group.get('toBranchId')?.setErrors(null);
    }
    return null;
  }

  onSubmit() {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const productId = this.config.data?.id;

    if (!productId) {
        this.messageService.showError('Product context missing');
        this.loading = false;
        return;
    }

    const payload = this.transferForm.value;

    this.productService.transferProductStock(productId, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Transfer initiated successfully');
        this.ref.close(true);
      },
      error: (err) => {
        this.messageService.showError(err.error?.message || 'Transfer failed');
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.ref.close(false);
  }
}
