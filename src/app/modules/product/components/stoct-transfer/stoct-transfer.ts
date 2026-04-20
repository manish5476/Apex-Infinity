import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select'; // Confirm module based on PrimeNG version
import { ProductService } from '../../services/product-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../../core/services/message.service';
import { InputTextModule } from 'primeng/inputtext';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputNumberModule, FloatLabelModule, SelectModule, InputTextModule, MasterDropdownComponent],
  templateUrl: './stoct-transfer.html',
  styleUrls: ['./stoct-transfer.scss'],
})
export class StockTransferComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  // Services
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  // private masterList = inject(MasterListService);

  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  transferForm!: FormGroup;
  branches: any[] = [];
  loading = false;

  ngOnInit(): void {
    // this.branches = this.masterList.branches() || [];
    this.transferForm = this.fb.group({
      fromBranchId: [null, [Validators.required]],
      toBranchId: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      description: ['']
    }, { validators: this.branchConflictValidator });
  }

  get fromCtrl() { return this.transferForm.get('fromBranchId'); }
  get toCtrl() { return this.transferForm.get('toBranchId'); }
  get qtyCtrl() { return this.transferForm.get('quantity'); }
  
  branchConflictValidator(group: AbstractControl) {
    const from = group.get('fromBranchId')?.value;
    const to = group.get('toBranchId')?.value;
    if (from && to && from === to) {
      group.get('toBranchId')?.setErrors({ sameBranch: true });
      return { sameBranch: true };
    }
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
    this.productService.transferProductStock(productId, payload).pipe(takeUntil(this.destroy$)).subscribe({
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
