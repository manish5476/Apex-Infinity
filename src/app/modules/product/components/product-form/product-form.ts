import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select'; // Confirm Select vs Dropdown based on version
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';

// Custom
import { ProductService } from '../../services/product-service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { ChipsComponent } from '../../../shared/components/chips.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    ToggleButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TextareaModule,
    SelectModule,
    DividerModule,
    ChipsComponent
  ],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss']
})
export class ProductFormComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  public masterList = inject(MasterListService);

  // State
  productForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  productId = signal<string | null>(null);
  
  // Computed
  formTitle = computed(() => this.editMode() ? 'Edit Product' : 'New Product Entry');
  branchOptions = computed(() => this.masterList.branches());

  ngOnInit(): void {
    this.buildForm();
    this.initDataFetch();
  }

  // ... (Rest of your Logic remains largely the same, it was already solid)
  // Just ensure get inventory() returns FormArray properly typed
  get inventory(): FormArray {
    return this.productForm.get('inventory') as FormArray;
  }
  
  // ... buildForm, patchForm, submit logic ...
  private buildForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.pattern('^[a-zA-Z0-9-_]+$')]],
      description: [''],
      departmentId: [null],
      categoryId: [null],
      brandId: [null],
      unitId: [null],
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      purchasePrice: [0, [Validators.min(0)]],
      taxRate: [0, [Validators.min(0), Validators.max(100)]],
      isTaxInclusive: [false],
      inventory: this.fb.array([]),
      defaultSupplierId: [null],
      tags: [[]],
      isActive: [true]
    });
  }

  // ... Data Fetching logic ...
  private initDataFetch(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.productId.set(id);
          this.editMode.set(true);
          return this.productService.getProductById(id);
        }
        return of(null);
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        const productData = response?.data?.data || response?.data || response;
        if (productData && this.editMode()) {
          this.patchForm(productData);
        }
      },
      error: (err) => {
        this.messageService.showError('Fetch Error', 'Could not load product details');
      }
    });
  }
  
  private patchForm(product: any): void {
     // ... Your existing patch logic ...
     this.productForm.patchValue({
         // ... simple fields
         name: product.name,
         sku: product.sku,
         description: product.description,
         sellingPrice: product.sellingPrice,
         purchasePrice: product.purchasePrice,
         taxRate: product.taxRate,
         isTaxInclusive: product.isTaxInclusive,
         tags: product.tags,
         isActive: product.isActive,
         // ... object ID fields
         departmentId: product.departmentId?._id || product.departmentId,
         categoryId: product.categoryId?._id || product.categoryId,
         brandId: product.brandId?._id || product.brandId,
         unitId: product.unitId?._id || product.unitId,
         defaultSupplierId: product.defaultSupplierId?._id || product.defaultSupplierId,
     });
     
     // Handle Inventory patch if needed (though usually we don't patch inventory in edit)
  }

  addInventoryItem(): void {
    this.inventory.push(this.fb.group({
      branchId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [10, [Validators.min(0)]]
    }));
  }

  removeInventoryItem(index: number): void {
    this.inventory.removeAt(index);
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const rawData = this.productForm.getRawValue();

    // Remove inventory from payload if editing
    const payload = { ...rawData };
    if (this.editMode()) {
      delete payload.inventory;
    }

    const request = this.editMode()
      ? this.productService.updateProduct(this.productId()!, payload)
      : this.productService.createProduct(payload);

    request.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully`);
        this.router.navigate(['/inventory/products']);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Operation failed');
      }
    });
  }
}
