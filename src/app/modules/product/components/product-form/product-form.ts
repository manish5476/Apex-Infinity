import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
import { AccordionModule } from 'primeng/accordion';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';

// Custom Components & Services
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
    ToastModule,
    ChipModule,
    ChipsComponent,
    ButtonModule,
    ToggleButtonModule,
    AccordionModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TextareaModule,
    SelectModule,
    DividerModule,
    TooltipModule,
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
public bulkDialogVisible:boolean=false
  // --- Form & State ---
  productForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  productId = signal<string | null>(null);
  formTitle = computed(() => this.editMode() ? 'Edit Product' : 'Create New Product');

  // --- Master Data ---
  branchOptions = computed(() => this.masterList.branches());

  ngOnInit(): void {
    this.buildForm();
    this.initDataFetch();
  }

  private initDataFetch(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.productId.set(id);
          this.editMode.set(true);
          // this.loadingService.show();
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
        this.messageService.showError('Fetch Error', err.error?.message || 'Could not load product details');
      }
    });
  }

  private buildForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.pattern('^[a-zA-Z0-9-_]+$')]],
      description: [''],

      // Categorization
      departmentId: [null],
      categoryId: [null],
      subCategoryId: [null],
      brandId: [null],
      unitId: [null],

      // Pricing (Synced with product.model.js)
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      purchasePrice: [0, [Validators.min(0)]],
      discountedPrice: [null, [Validators.min(0)]],
      taxRate: [0, [Validators.min(0), Validators.max(100)]],
      isTaxInclusive: [false],

      // Inventory
      inventory: this.fb.array([]),

      // Meta
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
      departmentId: product.departmentId?._id || product.departmentId,
      categoryId: product.categoryId?._id || product.categoryId,
      subCategoryId: product.subCategoryId?._id || product.subCategoryId,
      brandId: product.brandId?._id || product.brandId,
      unitId: product.unitId?._id || product.unitId,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice || 0,
      discountedPrice: product.discountedPrice,
      taxRate: product.taxRate || 0,
      isTaxInclusive: product.isTaxInclusive || false,
      defaultSupplierId: product.defaultSupplierId?._id || product.defaultSupplierId,
      tags: product.tags || [],
      isActive: product.isActive ?? true
    });

    this.inventory.clear();
    if (product.inventory?.length) {
      product.inventory.forEach((item: any) => {
        this.inventory.push(this.fb.group({
          branchId: [item.branchId?._id || item.branchId, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(0)]],
          reorderLevel: [item.reorderLevel || 10, [Validators.min(0)]]
        }));
      });
    }
  }

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

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.messageService.showError('Validation Failed', 'Please complete all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const rawData = this.productForm.getRawValue();

    // 🟢 Payload Security:
    // When editing, we don't send inventory updates to prevent accidental stock overwrites.
    // Stock is managed via specific Transactions (Purchase/Sale/Adjustment).
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
        this.messageService.showError('Operation Failed', err.error?.message || 'Server returned an error');
      }
    });
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectModule } from 'primeng/select';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { AccordionModule } from 'primeng/accordion';
// import { TextareaModule } from 'primeng/textarea';
// import { ChipModule } from 'primeng/chip';
// import { ToggleButtonModule } from 'primeng/togglebutton';

// // Custom Components & Services
// import { ProductService } from '../../services/product-service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { ChipsComponent } from '../../../shared/components/chips.component';

// @Component({
//   selector: 'app-product-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     ToastModule,
//     ChipModule,
//     ChipsComponent,
//     ButtonModule,
//     ToggleButtonModule,
//     AccordionModule,
//     InputTextModule,
//     InputNumberModule,
//     CheckboxModule,
//     TextareaModule,
//     SelectModule,
//     DividerModule
//   ],
//   templateUrl: './product-form.html',
//   styleUrls: ['./product-form.scss']
// })
// export class ProductFormComponent implements OnInit {
//   // --- Injected Services ---
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private productService = inject(ProductService);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);
//   public masterList = inject(MasterListService);

//   // --- Form & State ---
//   productForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   productId: string | null = null;
//   formTitle = signal('Create New Product');

//   // --- Master Data Signals ---
//   branchOptions = signal<any[]>([]);
//   // We use the masterList service directly in HTML, but you can assign them here if needed for filtering
  
//   constructor() {
//     this.branchOptions.set(this.masterList.branches());
//   }

//   ngOnInit(): void {
//     this.buildForm();
//     this.checkRouteForEditMode();
//   }

//   private checkRouteForEditMode(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         this.productId = params.get('id');

//         if (this.productId) {
//           this.editMode.set(true);
//           this.formTitle.set('Edit Product');
//           this.loadingService.show();
//           return this.productService.getProductById(this.productId);
//         }

//         return of(null); // Create mode
//       }),
//       finalize(() => this.loadingService.hide())
//     ).subscribe({
//       next: (response) => {
//         const productData = response?.data?.data || response?.data || response;

//         if (productData && this.productId) {
//           this.patchForm(productData);
//         } else if (this.productId) {
//           this.messageService.showError('Error', 'Failed to load product data');
//         }
//       },
//       error: (err) => {
//         if (this.productId) {
//           this.messageService.showError('Error', err.error?.message || 'Could not load product');
//         }
//       }
//     });
//   }

//   private buildForm(): void {
//     this.productForm = this.fb.group({
//       // Basic Details
//       name: ['', Validators.required],
//       sku: [''],
//       description: [''],

//       // Categorization (Updated to match New Schema References)
//       departmentId: [null],
//       categoryId: [null],
//       subCategoryId: [null],
//       brandId: [null],
//       unitId: [null],

//       // Pricing
//       sellingPrice: [null, [Validators.required, Validators.min(0)]],
//       purchasePrice: [null, [Validators.min(0)]],
//       discountedPrice: [null, [Validators.min(0)]],
//       taxRate: [0, [Validators.min(0)]],
//       isTaxInclusive: [false],

//       // Inventory (FormArray)
//       inventory: this.fb.array([]),

//       // Supplier
//       defaultSupplierId: [null],

//       // Meta
//       tags: [''],
//       isActive: [true]
//     });
//   }

//   private patchForm(product: any): void {
//     this.productForm.patchValue({
//       name: product.name,
//       sku: product.sku,
//       description: product.description,
      
//       // Handle Populated Objects or ID strings
//       departmentId: product.departmentId?._id || product.departmentId,
//       categoryId: product.categoryId?._id || product.categoryId,
//       subCategoryId: product.subCategoryId?._id || product.subCategoryId,
//       brandId: product.brandId?._id || product.brandId,
//       unitId: product.unitId?._id || product.unitId,

//       sellingPrice: product.sellingPrice,
//       purchasePrice: product.purchasePrice,
//       discountedPrice: product.discountedPrice,
//       taxRate: product.taxRate,
//       isTaxInclusive: product.isTaxInclusive,
//       defaultSupplierId: product.defaultSupplierId?._id || product.defaultSupplierId,
//       tags: Array.isArray(product.tags) ? product.tags : [],
//       isActive: product.isActive
//     });

//     // Clear and patch inventory
//     this.inventory.clear();
//     if (product.inventory && Array.isArray(product.inventory)) {
//       product.inventory.forEach((item: any) => {
//         const bId = item.branchId?._id || item.branchId;
//         this.inventory.push(this.fb.group({
//           branchId: [bId, Validators.required],
//           quantity: [item.quantity, [Validators.required, Validators.min(0)]],
//           reorderLevel: [item.reorderLevel || 10, [Validators.min(0)]]
//         }));
//       });
//     }
//   }

//   // --- FormArray Getters & Methods ---
//   get inventory(): FormArray {
//     return this.productForm.get('inventory') as FormArray;
//   }

//   addInventoryItem(): void {
//     this.inventory.push(this.fb.group({
//       branchId: [null, Validators.required],
//       quantity: [0, [Validators.required, Validators.min(0)]],
//       reorderLevel: [10, [Validators.min(0)]]
//     }));
//   }

//   removeInventoryItem(index: number): void {
//     this.inventory.removeAt(index);
//   }

//   onSubmit(): void {
//     if (this.productForm.invalid) {
//       this.productForm.markAllAsTouched();
//       this.messageService.showError('Invalid Form', 'Please check all required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const rawValue = this.productForm.getRawValue();

//     // Prepare payload
//     let payload: any = {
//       ...rawValue,
//       tags: Array.isArray(rawValue.tags) ? rawValue.tags : (rawValue.tags ? rawValue.tags.split(',').map((t: string) => t.trim()) : [])
//     };

//     // Remove restricted fields in Edit Mode
//     if (this.editMode()) {
//       delete payload.inventory;
//       delete payload.quantity; // Virtual field if present
//       // delete payload.purchasePrice; // Only if you want to restrict price editing
//     }

//     const saveObservable = this.editMode()
//       ? this.productService.updateProduct(this.productId!, payload)
//       : this.productService.createProduct(payload);

//     saveObservable.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: (res) => {
//         this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         this.router.navigate(['/product']);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
//       }
//     });
//   }
// }

// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// // import { finalize, switchMap } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { SelectModule } from 'primeng/select';
// // import { DividerModule } from 'primeng/divider';
// // import { ToastModule } from 'primeng/toast';
// // import { AccordionModule } from 'primeng/accordion';
// // import { TextareaModule } from 'primeng/textarea'; // Changed from Textarea to TextareaModule for consistency
// // import { ChipModule } from 'primeng/chip';
// // import { ToggleButtonModule } from 'primeng/togglebutton'; // Changed to Module

// // // Custom Components & Services
// // import { ProductService } from '../../services/product-service';
// // import { LoadingService } from '../../../../core/services/loading.service';
// // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { ChipsComponent } from '../../../shared/components/chips.component';

// // @Component({
// //   selector: 'app-product-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     RouterModule,
// //     ToastModule,
// //     ChipModule,
// //     ChipsComponent,
// //     ButtonModule,
// //     ToggleButtonModule,
// //     AccordionModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     CheckboxModule,
// //     TextareaModule,
// //     SelectModule,
// //     DividerModule
// //   ],
// //   templateUrl: './product-form.html',
// //   styleUrls: ['./product-form.scss']
// // })
// // export class ProductFormComponent implements OnInit {
// //   // --- Injected Services ---
// //   private fb = inject(FormBuilder);
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private productService = inject(ProductService);
// //   private messageService = inject(AppMessageService);
// //   private loadingService = inject(LoadingService);
// //   public masterList = inject(MasterListService);

// //   // --- Form & State ---
// //   productForm!: FormGroup;
// //   isSubmitting = signal(false);
// //   editMode = signal(false);
// //   productId: string | null = null;
// //   formTitle = signal('Create New Product');

// //   // --- Master Data Signals ---
// //   branchOptions = signal<any[]>([]);
// //   categoryOptions = signal<any[]>([]);
// //   brandOptions = signal<any[]>([]);
// //   departmentOptions = signal<any[]>([]);
// //   unitOptions = signal<any[]>([]);
// //   supplierOptions = signal<any[]>([]);

// //   constructor() {
// //     this.branchOptions.set(this.masterList.branches());
// //     this.categoryOptions.set(this.masterList.categories());
// //     this.brandOptions.set(this.masterList.brands());
// //     this.departmentOptions.set(this.masterList.department());
// //     this.unitOptions.set(this.masterList.units());
// //     this.supplierOptions.set(this.masterList.suppliers());

// //   }

// //   ngOnInit(): void {
// //     this.buildForm();
// //     this.checkRouteForEditMode();
// //         console.log( this.departmentOptions,
// // this.unitOptions);
// //   }

// //   private checkRouteForEditMode(): void {
// //     this.route.paramMap.pipe(
// //       switchMap(params => {
// //         this.productId = params.get('id');

// //         if (this.productId) {
// //           // --- FIX START: Correctly set edit mode ---
// //           this.editMode.set(true);
// //           this.formTitle.set('Edit Product');
// //           // --- FIX END ---

// //           this.loadingService.show();
// //           return this.productService.getProductById(this.productId);
// //         }

// //         return of(null); // Create mode
// //       }),
// //       finalize(() => this.loadingService.hide())
// //     ).subscribe({
// //       next: (response) => {
// //         // Handle response structure carefully (e.g. response.data.data or response.data)
// //         const productData = response?.data?.data || response?.data || response;

// //         if (productData && this.productId) {
// //           this.patchForm(productData);
// //         } else if (this.productId) {
// //           this.messageService.showError('Error', 'Failed to load product data');
// //         }
// //       },
// //       error: (err) => {
// //         if (this.productId) {
// //           this.messageService.showError('Error', err.error?.message || 'Could not load product');
// //         }
// //       }
// //     });
// //   }

// //   private buildForm(): void {
// //     this.productForm = this.fb.group({
// //       // Basic Details
// //       name: ['', Validators.required],
// //       sku: [''],
// //       description: [''],
// //       // Categorization
// //       brand: [''],
// //       category: [''],
// //       // Pricing
// //       sellingPrice: [null, [Validators.required, Validators.min(0)]],
// //       purchasePrice: [null, [Validators.min(0)]],
// //       discountedPrice: [null, [Validators.min(0)]],
// //       taxRate: [0, [Validators.min(0)]],
// //       isTaxInclusive: [false],
// //       // Inventory (FormArray)
// //       inventory: this.fb.array([]),
// //       // Supplier
// //       defaultSupplierId: [null],
// //       // Meta
// //       tags: [''], // Will be converted to array/string as needed
// //       isActive: [true]
// //     });
// //   }

// //   private patchForm(product: any): void {
// //     this.productForm.patchValue({
// //       name: product.name,
// //       sku: product.sku,
// //       description: product.description,
// //       brand: product.brand,
// //       category: product.category,
// //       sellingPrice: product.sellingPrice,
// //       purchasePrice: product.purchasePrice,
// //       discountedPrice: product.discountedPrice,
// //       taxRate: product.taxRate,
// //       isTaxInclusive: product.isTaxInclusive,
// //       defaultSupplierId: product.defaultSupplierId?._id || product.defaultSupplierId, // Handle populated object
// //       tags: Array.isArray(product.tags) ? product.tags : [], // Pass array to chips component usually
// //       isActive: product.isActive
// //     });

// //     // Clear existing inventory items
// //     this.inventory.clear();

// //     // Add inventory items from the loaded product
// //     if (product.inventory && Array.isArray(product.inventory)) {
// //       product.inventory.forEach((item: any) => {
// //         // Extract ID if branchId is populated
// //         const bId = item.branchId?._id || item.branchId;

// //         this.inventory.push(this.fb.group({
// //           branchId: [bId, Validators.required],
// //           quantity: [item.quantity, [Validators.required, Validators.min(0)]],
// //           reorderLevel: [item.reorderLevel || 10, [Validators.min(0)]]
// //         }));
// //       });
// //     }
// //   }

// //   // --- FormArray Getters & Methods ---
// //   get inventory(): FormArray {
// //     return this.productForm.get('inventory') as FormArray;
// //   }

// //   addInventoryItem(): void {
// //     this.inventory.push(this.fb.group({
// //       branchId: [null, Validators.required],
// //       quantity: [0, [Validators.required, Validators.min(0)]],
// //       reorderLevel: [10, [Validators.min(0)]]
// //     }));
// //   }

// //   removeInventoryItem(index: number): void {
// //     this.inventory.removeAt(index);
// //   }

// //   onSubmit(): void {
// //     if (this.productForm.invalid) {
// //       this.productForm.markAllAsTouched();
// //       this.messageService.showError('Invalid Form', 'Please check all required fields.');
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const rawValue = this.productForm.getRawValue();

// //     // Prepare payload
// //     let payload: any = {
// //       ...rawValue,
// //       // If chips component returns array, keep it. If string, split it.
// //       tags: Array.isArray(rawValue.tags) ? rawValue.tags : (rawValue.tags ? rawValue.tags.split(',').map((t: string) => t.trim()) : [])
// //     };

// //     // --- FIX START: Remove restricted fields in Edit Mode ---
// //     if (this.editMode()) {
// //       // The backend forbids updating these fields directly
// //       delete payload.inventory;
// //       delete payload.quantity;
// //       delete payload.purchasePrice;
// //       // Add any other restricted fields if necessary
// //     }
// //     // --- FIX END ---

// //     // Determine Action based on Edit Mode
// //     const saveObservable = this.editMode()
// //       ? this.productService.updateProduct(this.productId!, payload)
// //       : this.productService.createProduct(payload);

// //     saveObservable.pipe(
// //       finalize(() => this.isSubmitting.set(false))
// //     ).subscribe({
// //       next: (res) => {
// //         // Handle response safely
// //         const id = res.data?._id || res.data?.id || this.productId;
// //         this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
// //         this.router.navigate(['/products']);
// //       },
// //       error: (err) => {
// //         this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
// //       }
// //     });
// //   }
// // }

// // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// // // import { ActivatedRoute, Router } from '@angular/router';

// // // import { finalize, switchMap } from 'rxjs/operators';
// // // import { of } from 'rxjs';

// // // // PrimeNG
// // // import { ButtonModule } from 'primeng/button';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { InputNumberModule } from 'primeng/inputnumber';
// // // import { CheckboxModule } from 'primeng/checkbox';
// // // import { SelectModule } from 'primeng/select';
// // // import { DividerModule } from 'primeng/divider';
// // // import { ToastModule } from 'primeng/toast';
// // // import { AccordionModule } from 'primeng/accordion'; // Added import
// // // import { ProductService } from '../../services/product-service';
// // // import { LoadingService } from '../../../../core/services/loading.service';
// // // import { MasterListService } from '../../../../core/services/master-list.service';
// // // import { AppMessageService } from '../../../../core/services/message.service';
// // // import { Textarea } from 'primeng/textarea';
// // // import { ChipModule } from 'primeng/chip';
// // // import { ChipsComponent } from '../../../shared/components/chips.component';
// // // import { ToggleButton } from 'primeng/togglebutton';
// // // @Component({
// // //   selector: 'app-product-form',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     ReactiveFormsModule,
// // //     ToastModule,ChipModule,ChipsComponent,
// // //     ButtonModule,ToggleButton,
// // //     AccordionModule, // Added import
// // //     InputTextModule,
// // //     InputNumberModule,
// // //     CheckboxModule,
// // //     Textarea, // Corrected import
// // //     SelectModule,
// // //     DividerModule
// // //   ],
// // //   templateUrl: './product-form.html',
// // //   styleUrls: ['./product-form.scss']
// // // })
// // // export class ProductFormComponent implements OnInit {
// // //   // --- Injected Services ---
// // //   private fb = inject(FormBuilder);
// // //   private route = inject(ActivatedRoute);
// // //   private router = inject(Router);
// // //   private productService = inject(ProductService);
// // //   private messageService = inject(AppMessageService);
// // //   private loadingService = inject(LoadingService);
// // //   public masterList = inject(MasterListService);

// // //   // --- Form & State ---
// // //   productForm!: FormGroup;
// // //   isSubmitting = signal(false);
// // //   editMode = signal(false);
// // //   productId: string | null = null;
// // //   formTitle = signal('Create New Product');

// // //   // --- Master Data Signals ---
// // //   branchOptions = signal<any[]>([]);
// // //   categoryOptions = signal<any[]>([]);
// // //   brandOptions = signal<any[]>([]);
// // //   supplierOptions = signal<any[]>([]);

// // //   constructor() {
// // //     this.branchOptions.set(this.masterList.branches());
// // //     // Example:
// // //     this.categoryOptions.set(this.masterList.categories());
// // //     this.brandOptions.set(this.masterList.brands());
// // //     this.supplierOptions.set(this.masterList.suppliers());
// // //     console.log(this.supplierOptions);
// // //     console.log(this.masterList.brands(),this.masterList.categories());
// // //   }

// // //   ngOnInit(): void {
// // //     this.buildForm();
// // //     this.checkRouteForEditMode();
// // //   }

// // //   private checkRouteForEditMode(): void {
// // //     this.route.paramMap.pipe(
// // //       switchMap(params => {
// // //         this.productId = params.get('id');
// // //         if (this.productId) {
// // //           // this.editMode.set(true)set(true);
// // //           this.formTitle.set('Edit Product');
// // //           this.loadingService.show();
// // //           return this.productService.getProductById(this.productId);
// // //         }
// // //         return of(null); // Create mode
// // //       }),
// // //       finalize(() => this.loadingService.hide())
// // //     ).subscribe({
// // //       next: (response) => {
// // //         if (response && response.data && response.data.data) {
// // //           this.patchForm(response.data.data);
// // //         } else if (response) {
// // //           this.messageService.showError('Error', 'Failed to load product data');
// // //         }
// // //       },
// // //       error: (err) => this.messageService.showError('Error', err.error?.message)
// // //     });
// // //   }

// // //   private buildForm(): void {
// // //     this.productForm = this.fb.group({
// // //       // Basic Details
// // //       name: ['', Validators.required],
// // //       sku: [''],
// // //       description: [''],
// // //       // Categorization
// // //       brand: [''],
// // //       category: [''],
// // //       // Pricing
// // //       sellingPrice: [null, [Validators.required, Validators.min(0)]],
// // //       purchasePrice: [null, [Validators.min(0)]],
// // //       discountedPrice: [null, [Validators.min(0)]], // You had this in patchForm, adding it here
// // //       taxRate: [0, [Validators.min(0)]],
// // //       isTaxInclusive: [false],
// // //       // Inventory (FormArray)
// // //       inventory: this.fb.array([]),
// // //       // Media
// // //       // images: this.fb.array([]), // Image uploads are complex, usually handled separately
// // //       // Supplier
// // //       defaultSupplierId: [null],
// // //       // Meta
// // //       tags: [''], // Will be converted to array
// // //       isActive: [true]
// // //     });
// // //   }

// // //   private patchForm(product: any): void {
// // //     this.productForm.patchValue({
// // //       name: product.name,
// // //       sku: product.sku,
// // //       description: product.description,
// // //       brand: product.brand,
// // //       category: product.category,
// // //       sellingPrice: product.sellingPrice,
// // //       purchasePrice: product.purchasePrice,
// // //       discountedPrice: product.discountedPrice,
// // //       taxRate: product.taxRate,
// // //       isTaxInclusive: product.isTaxInclusive,
// // //       defaultSupplierId: product.defaultSupplierId,
// // //       tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
// // //       isActive: product.isActive
// // //     });

// // //     // Clear existing inventory items
// // //     this.inventory.clear();
// // //     // Add inventory items from the loaded product
// // //     if (product.inventory && Array.isArray(product.inventory)) {
// // //       product.inventory.forEach((item: any) => {
// // //         this.inventory.push(this.fb.group({
// // //           branchId: [item.branchId, Validators.required],
// // //           quantity: [item.quantity, [Validators.required, Validators.min(0)]],
// // //           reorderLevel: [item.reorderLevel || 10, [Validators.min(0)]]
// // //         }));
// // //       });
// // //     }
// // //   }

// // //   // --- FormArray Getters & Methods ---
// // //   get inventory(): FormArray {
// // //     return this.productForm.get('inventory') as FormArray;
// // //   }

// // //   addInventoryItem(): void {
// // //     this.inventory.push(this.fb.group({
// // //       branchId: [null, Validators.required],
// // //       quantity: [0, [Validators.required, Validators.min(0)]],
// // //       reorderLevel: [10, [Validators.min(0)]]
// // //     }));
// // //   }

// // //   removeInventoryItem(index: number): void {
// // //     this.inventory.removeAt(index);
// // //   }

// // //   // --- Form Submission ---
// // //   onSubmit(): void {
// // //     if (this.productForm.invalid) {
// // //       this.productForm.markAllAsTouched();
// // //       this.messageService.showError('Invalid Form', 'Please check all required fields.');
// // //       return;
// // //     }

// // //     // this.isSubmitting.set(true);
// // //     const rawValue = this.productForm.getRawValue();

// // //     // Prepare payload
// // //     const payload = {
// // //       ...rawValue,
// // //       tags: rawValue.tags
// // //     };

// // //     const saveObservable = this.editMode()
// // //       ? this.productService.updateProduct(this.productId!, payload)
// // //       : this.productService.createProduct(payload);

// // //     saveObservable.pipe(
// // //       finalize(() => this.isSubmitting.set(false))
// // //     ).subscribe({
// // //       next: (res) => {
// // //         this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
// // //         this.router.navigate(['/products', res.data._id]);
// // //       },
// // //       error: (err) => {
// // //         this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
// // //       }
// // //     });
// // //   }
// // // }
