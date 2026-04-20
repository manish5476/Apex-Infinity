import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

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
// import { MasterListService } from '../../../../core/services/master-list.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { ChipsComponent } from '../../../shared/components/chips.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ButtonModule,
    ToggleButtonModule, InputTextModule, InputNumberModule,
    CheckboxModule, TextareaModule, SelectModule, DividerModule,
    ChipsComponent, MasterDropdownComponent],

  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss']
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  // Services
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  // public masterList = inject(MasterListService);
  productForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  productId = signal<string | null>(null);
  formTitle = computed(() => this.editMode() ? 'Edit Product' : 'New Product Entry');
  // branchOptions = computed(() => this.masterList.branches());

  ngOnInit(): void {
    this.buildForm();
    this.initDataFetch();
  }

  get inventory(): FormArray {
    return this.productForm.get('inventory') as FormArray;
  }

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


  private patchForm(product: any): void {
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      description: product.description,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      taxRate: product.taxRate,
      isTaxInclusive: product.isTaxInclusive,
      tags: product.tags,
      isActive: product.isActive,
      departmentId: product.departmentId?._id || product.departmentId,
      categoryId: product.categoryId?._id || product.categoryId,
      brandId: product.brandId?._id || product.brandId,
      unitId: product.unitId?._id || product.unitId,
      defaultSupplierId: product.defaultSupplierId?._id || product.defaultSupplierId,
    });
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
  private initDataFetch(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.productId.set(id);
          this.editMode.set(true);

          // Attach finalize to the inner HTTP request which actually completes
          return this.productService.getProductById(id).pipe(
            finalize(() => this.loadingService.hide())
          );
        }

        // Ensure spinner hides if navigating directly to "Create New"
        this.loadingService.hide();
        return of(null);
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (!response) return; // Exit early if in create mode

        const productData = response?.data?.data || response?.data || response;
        if (productData && this.editMode()) {
          this.patchForm(productData);
        }
      },
      error: (err) => {
        // Fallback safety to hide loading if the stream breaks entirely
        this.loadingService.hide();

        // Routed to your global HTTP error handler
        this.messageService.handleHttpError(err);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Please check all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const rawData = this.productForm.getRawValue();
    const payload = { ...rawData };
    if (this.editMode()) {
      delete payload.inventory;
    }

    const request = this.editMode()
      ? this.productService.updateProduct(this.productId()!, payload)
      : this.productService.createProduct(payload);

    request.pipe(
      finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess(`Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
        this.router.navigate(['/product']);
      },
      error: (err) => {
        // Routed to global HTTP error handler
        this.messageService.handleHttpError(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
