import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion'; // Added import
import { ProductService } from '../../services/product-service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { Textarea } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { ChipsComponent } from '../../../shared/components/chips.component';
import { ToggleButton } from 'primeng/togglebutton';
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,ChipModule,ChipsComponent,
    ButtonModule,ToggleButton,
    AccordionModule, // Added import
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    Textarea, // Corrected import
    SelectModule,
    DividerModule
  ],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss']
})
export class ProductFormComponent implements OnInit {
  // --- Injected Services ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  public masterList = inject(MasterListService);

  // --- Form & State ---
  productForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  productId: string | null = null;
  formTitle = signal('Create New Product');

  // --- Master Data Signals ---
  branchOptions = signal<any[]>([]);
  categoryOptions = signal<any[]>([]);
  brandOptions = signal<any[]>([]);
  supplierOptions = signal<any[]>([]);

  constructor() {
    this.branchOptions.set(this.masterList.branches());
    // Example:
    this.categoryOptions.set(this.masterList.categories());
    this.brandOptions.set(this.masterList.brands());
    this.supplierOptions.set(this.masterList.suppliers());
    console.log(this.masterList.brands(),this.masterList.categories());
  }

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();
  }

  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.productId = params.get('id');
        if (this.productId) {
          // this.editMode.set(true)set(true);
          this.formTitle.set('Edit Product');
          this.loadingService.show();
          return this.productService.getProductById(this.productId);
        }
        return of(null); // Create mode
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data && response.data.data) {
          this.patchForm(response.data.data);
        } else if (response) {
          this.messageService.showError('Error', 'Failed to load product data');
        }
      },
      error: (err) => this.messageService.showError('Error', err.error?.message)
    });
  }

  private buildForm(): void {
    this.productForm = this.fb.group({
      // Basic Details
      name: ['', Validators.required],
      sku: [''],
      description: [''],
      // Categorization
      brand: [''],
      category: [''],
      // Pricing
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      purchasePrice: [null, [Validators.min(0)]],
      discountedPrice: [null, [Validators.min(0)]], // You had this in patchForm, adding it here
      taxRate: [0, [Validators.min(0)]],
      isTaxInclusive: [false],
      // Inventory (FormArray)
      inventory: this.fb.array([]),
      // Media
      // images: this.fb.array([]), // Image uploads are complex, usually handled separately
      // Supplier
      defaultSupplierId: [null],
      // Meta
      tags: [''], // Will be converted to array
      isActive: [true]
    });
  }

  private patchForm(product: any): void {
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      description: product.description,
      brand: product.brand,
      category: product.category,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      discountedPrice: product.discountedPrice,
      taxRate: product.taxRate,
      isTaxInclusive: product.isTaxInclusive,
      defaultSupplierId: product.defaultSupplierId,
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      isActive: product.isActive
    });

    // Clear existing inventory items
    this.inventory.clear();
    // Add inventory items from the loaded product
    if (product.inventory && Array.isArray(product.inventory)) {
      product.inventory.forEach((item: any) => {
        this.inventory.push(this.fb.group({
          branchId: [item.branchId, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(0)]],
          reorderLevel: [item.reorderLevel || 10, [Validators.min(0)]]
        }));
      });
    }
  }

  // --- FormArray Getters & Methods ---
  get inventory(): FormArray {
    return this.productForm.get('inventory') as FormArray;
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

  // --- Form Submission ---
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched(); 
      this.messageService.showError('Invalid Form', 'Please check all required fields.');
      return;
    }

    // this.isSubmitting.set(true);
    const rawValue = this.productForm.getRawValue();

    // Prepare payload
    const payload = {
      ...rawValue,
      tags: rawValue.tags
    };

    const saveObservable = this.editMode()
      ? this.productService.updateProduct(this.productId!, payload)
      : this.productService.createProduct(payload);

    saveObservable.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
        this.router.navigate(['/products', res.data._id]);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
      }
    });
  }
}
