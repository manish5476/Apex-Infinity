// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-stoct-transfer',
//   imports: [],
//   templateUrl: './stoct-transfer.html',
//   styleUrl: './stoct-transfer.scss',
// })
// export class StoctTransfer {

// }
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
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    FloatLabelModule,SelectModule,InputTextModule
  ],
  templateUrl: './stoct-transfer.html',
  styles: [`
    .field { margin-bottom: 1.5rem; }
    :host ::ng-deep .p-inputnumber { width: 100%; }
    :host ::ng-deep .p-inputnumber-input { width: 100%; }
  `]
})
export class StockTransferComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  
  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  transferForm!: FormGroup;
  branches: any[] = [];
  sourceBranches: any[] = []; // Filtered list if needed
  loading = false;

  ngOnInit(): void {
    this.branches = this.masterList.branches() || [];
    
    // Config Data (Current Product Inventory)
    // We can use this to smartly populate the "From" branch or limit max quantity
    const productData = this.config.data?.product;

    this.transferForm = this.fb.group({
      fromBranchId: [null, [Validators.required]],
      toBranchId: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      description: ['']
    });

    // Validations: prevent selecting same branch
    this.transferForm.valueChanges.subscribe(val => {
      if (val.fromBranchId && val.toBranchId && val.fromBranchId === val.toBranchId) {
        this.transferForm.get('toBranchId')?.setErrors({ sameBranch: true });
      } else {
        if (this.transferForm.get('toBranchId')?.hasError('sameBranch')) {
          this.transferForm.get('toBranchId')?.setErrors(null);
        }
      }
    });
  }

  onSubmit() {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const productId = this.config.data?.id;

    const payload = {
      fromBranchId: this.transferForm.value.fromBranchId,
      toBranchId: this.transferForm.value.toBranchId,
      quantity: this.transferForm.value.quantity,
      description: this.transferForm.value.description
    };

    this.productService.transferProductStock(productId, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Transfer Successful');
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