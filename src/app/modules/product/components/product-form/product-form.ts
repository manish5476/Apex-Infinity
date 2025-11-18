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

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
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
  private masterList = inject(MasterListService);

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
    // this.categoryOptions.set(this.masterList.categories());
    // this.brandOptions.set(this.masterList.brands());
    // this.supplierOptions.set(this.masterList.suppliers());
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
          this.editMode.set(true);
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

    this.isSubmitting.set(true);
    const rawValue = this.productForm.getRawValue();

    // Prepare payload
    const payload = {
      ...rawValue,
      tags: rawValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    };

    // Determine if creating or updating
    const saveObservable = this.editMode()
      ? this.productService.updateProduct(this.productId!, payload)
      : this.productService.createProduct(payload);

    saveObservable.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
        // Navigate to the details page of the saved product
        this.router.navigate(['/products', res.data._id]);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
      }
    });
  }
}




// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-product-form',
// //   imports: [],
// //   templateUrl: './product-form.html',
// //   styleUrl: './product-form.scss',
// // })
// // export class ProductForm {

// // }
// import { AccordionModule } from 'primeng/accordion';
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';

// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TextareaModule } from 'primeng/textarea';
// import { SelectModule } from 'primeng/select';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { ProductService } from '../../services/product-service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';

// @Component({
//   selector: 'app-product-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ButtonModule,AccordionModule,
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
//   private masterList = inject(MasterListService);

//   // --- Form & State ---
//   productForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   productId: string | null = null;
//   formTitle = signal('Create New Product');

//   // --- Master Data Signals ---
//   branchOptions = signal<any[]>([]);
//   categoryOptions = signal<any[]>([]);
//   brandOptions = signal<any[]>([]);
//   supplierOptions = signal<any[]>([]);

//   constructor() {
//     this.branchOptions.set(this.masterList.branches());
//     // Example:
//     // this.categoryOptions.set(this.masterList.categories());
//     // this.brandOptions.set(this.masterList.brands());
//     // this.supplierOptions.set(this.masterList.suppliers());
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
//         if (response && response.data && response.data.data) {
//           this.patchForm(response.data.data);
//         } else if (response) {
//           this.messageService.showError('Error', 'Failed to load product data');
//         }
//       },
//       error: (err) => this.messageService.showError('Error', err.error?.message)
//     });
//   }

//   private buildForm(): void {
//     this.productForm = this.fb.group({
//       // Basic Details
//       name: ['', Validators.required],
//       sku: [''],
//       description: [''],
//       // Categorization
//       brand: [''],
//       category: [''],
//       // Pricing
//       sellingPrice: [null, [Validators.required, Validators.min(0)]],
//       purchasePrice: [null, [Validators.min(0)]],
//       discountedPrice: [null, [Validators.min(0)]],
//       taxRate: [0, [Validators.min(0)]],
//       isTaxInclusive: [false],
//       // Inventory (FormArray)
//       inventory: this.fb.array([]),
//       // Media
//       // images: this.fb.array([]), // Image uploads are complex, usually handled separately
//       // Supplier
//       defaultSupplierId: [null],
//       // Meta
//       tags: [''], // Will be converted to array
//       isActive: [true]
//     });
//   }

//   private patchForm(product: any): void {
//     this.productForm.patchValue({
//       name: product.name,
//       sku: product.sku,
//       description: product.description,
//       brand: product.brand,
//       category: product.category,
//       sellingPrice: product.sellingPrice,
//       purchasePrice: product.purchasePrice,
//       discountedPrice: product.discountedPrice,
//       taxRate: product.taxRate,
//       isTaxInclusive: product.isTaxInclusive,
//       defaultSupplierId: product.defaultSupplierId,
//       tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
//       isActive: product.isActive
//     });

//     // Clear existing inventory items
//     this.inventory.clear();
//     // Add inventory items from the loaded product
//     if (product.inventory && Array.isArray(product.inventory)) {
//       product.inventory.forEach((item: any) => {
//         this.inventory.push(this.fb.group({
//           branchId: [item.branchId, Validators.required],
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

//   // --- Form Submission ---
//   onSubmit(): void {
//     if (this.productForm.invalid) {
//       this.productForm.markAllAsTouched(); // Trigger validation messages
//       this.messageService.showError('Invalid Form', 'Please check all required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const rawValue = this.productForm.getRawValue();

//     // Prepare payload
//     const payload = {
//       ...rawValue,
//       // Convert tags string to array, filtering out empty strings
//       tags: rawValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
//     };

//     // Determine if creating or updating
//     const saveObservable = this.editMode()
//       ? this.productService.updateProduct(this.productId!, payload)
//       : this.productService.createProduct(payload);

//     saveObservable.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: (res) => {
//         this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         // Navigate to the details page of the saved product
//         this.router.navigate(['/products', res.data._id]);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
//       }
//     });
//   }
// }
/**import { ChipModule } from 'primeng/chip';
import { Component, OnInit, inject, signal, effect } from '@angular/core';
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
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload'; // Required for Images
import { ToggleSwitchModule } from 'primeng/toggleswitch'; // For Active Status
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
// Services
import { ProductService } from '../../services/product-service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    Textarea,
    SelectModule,
    DividerModule,
    ChipModule,
    FileUploadModule,
    ToggleSwitchModule,
    TooltipModule
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
  private masterList = inject(MasterListService);

  productForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  productId: string | null = null;
  formTitle = signal('Create New Product');
  branchOptions = this.masterList.branches;
  categoryOptions = this.masterList.categories || signal([]);
  brandOptions = this.masterList.brands || signal([]);
  supplierOptions = this.masterList.suppliers || signal([]);

  constructor() {
    // Optional: Log to check data availability
    effect(() => {
      // console.log('Branches loaded:', this.branchOptions());
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();
  }

  private buildForm(): void {
    this.productForm = this.fb.group({
      // Basic Details
      name: ['', Validators.required],
      sku: ['', Validators.required],
      description: [''],

      // Categorization
      brand: [null],
      category: [null],

      // Pricing
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      purchasePrice: [null, [Validators.min(0)]],
      taxRate: [0, [Validators.min(0), Validators.max(100)]],
      isTaxInclusive: [false],

      // Inventory (FormArray)
      inventory: this.fb.array([]),

      // Media
      images: [[]], // Array to store image files or URLs

      // Meta
      defaultSupplierId: [null],
      tags: [[]], // Initialize as empty array for p-chips
      isActive: [true]
    });
  }

  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.productId = params.get('id');

        if (this.productId) {
          this.editMode.set(true);
          this.formTitle.set('Edit Product');
          this.loadingService.show();
          return this.productService.getProductById(this.productId);
        }

        return of(null); // Create mode
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          // Handle case where response structure might vary (response.data or response.data.data)
          const productData = response.data.data || response.data;
          this.patchForm(productData);
        }
      },
      error: (err) => {
        console.error(err);
        this.messageService.showError('Error', 'Failed to load product data');
        this.router.navigate(['/products']);
      }
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
      taxRate: product.taxRate,
      isTaxInclusive: product.isTaxInclusive,
      defaultSupplierId: product.defaultSupplierId,

      // Handle Tags: Ensure it's an array for p-chips
      tags: Array.isArray(product.tags) ? product.tags : [],

      isActive: product.isActive
    });

    // Handle Inventory Patching
    this.inventory.clear(); // Clear empty rows from buildForm
    if (product.inventory && Array.isArray(product.inventory)) {
      product.inventory.forEach((item: any) => {
        const group = this.fb.group({
          branchId: [item.branchId, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(0)]],
          reorderLevel: [item.reorderLevel || 10, [Validators.min(0)]]
        });
        this.inventory.push(group);
      });
    }

    // If editing and no inventory, maybe add one empty row?
    // if (this.inventory.length === 0) this.addInventoryItem();
  }

  // --- FormArray Getters & Methods ---
  get inventory(): FormArray {
    return this.productForm.get('inventory') as FormArray;
  }

  addInventoryItem(): void {
    const group = this.fb.group({
      branchId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [10, [Validators.min(0)]]
    });
    this.inventory.push(group);
  }

  removeInventoryItem(index: number): void {
    this.inventory.removeAt(index);
  }

  // --- File Upload Handler ---
  onFileSelect(event: any): void {
    // PrimeNG FileUpload emits { files: File[] }
    if (event.files && event.files.length > 0) {
      // Store the actual File objects in the form control
      // You might want to append to existing, or replace
      this.productForm.patchValue({ images: event.files });
      this.productForm.markAsDirty();
    }
  }

  // --- Form Submission ---
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.messageService.showError('Validation Error', 'Please check all required fields.');
      return;
    }

    this.isSubmitting.set(true);

    // Prepare FormData for File Upload support
    const formData = this.preparePayload(this.productForm.getRawValue());

    // Determine Create or Update
    const request$ = this.editMode()
      ? this.productService.updateProduct(this.productId!, formData)
      : this.productService.createProduct(formData);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
        // Navigate to list or details
        setTimeout(() => this.router.navigate(['/products']), 500);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
      }
    });
  }

  private preparePayload(rawValue: any): FormData | any {
    // If you are NOT uploading files, you can return simple JSON:
    // return rawValue;

    // If you ARE uploading files, use FormData:
    const fd = new FormData();

    // Append simple fields
    Object.keys(rawValue).forEach(key => {
      if (key === 'images') {
        // Handle File Array
        if (Array.isArray(rawValue.images)) {
          rawValue.images.forEach((file: File) => {
            // Only append if it's actually a File object (not a URL string from edit mode)
            if (file instanceof File) {
              fd.append('images', file);
            }
          });
        }
      } else if (key === 'inventory' || key === 'tags') {
        // Stringify complex arrays/objects for backend parsing
        fd.append(key, JSON.stringify(rawValue[key]));
      } else if (rawValue[key] !== null && rawValue[key] !== undefined) {
        fd.append(key, rawValue[key]);
      }
    });

    return fd;
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';

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
// import { AccordionModule } from 'primeng/accordion'; // Added import
// import { ProductService } from '../../services/product-service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { Textarea } from 'primeng/textarea';

// @Component({
//   selector: 'app-product-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ButtonModule,
//     AccordionModule, // Added import
//     InputTextModule,
//     InputNumberModule,
//     CheckboxModule,
//     Textarea, // Corrected import
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
//   private masterList = inject(MasterListService);

//   // --- Form & State ---
//   productForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   productId: string | null = null;
//   formTitle = signal('Create New Product');

//   // --- Master Data Signals ---
//   branchOptions = signal<any[]>([]);
//   categoryOptions = signal<any[]>([]);
//   brandOptions = signal<any[]>([]);
//   supplierOptions = signal<any[]>([]);

//   constructor() {
//     this.branchOptions.set(this.masterList.branches());
//     // Example:
//     // this.categoryOptions.set(this.masterList.categories());
//     // this.brandOptions.set(this.masterList.brands());
//     // this.supplierOptions.set(this.masterList.suppliers());
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
//         if (response && response.data && response.data.data) {
//           this.patchForm(response.data.data);
//         } else if (response) {
//           this.messageService.showError('Error', 'Failed to load product data');
//         }
//       },
//       error: (err) => this.messageService.showError('Error', err.error?.message)
//     });
//   }

//   private buildForm(): void {
//     this.productForm = this.fb.group({
//       // Basic Details
//       name: ['', Validators.required],
//       sku: [''],
//       description: [''],
//       // Categorization
//       brand: [''],
//       category: [''],
//       // Pricing
//       sellingPrice: [null, [Validators.required, Validators.min(0)]],
//       purchasePrice: [null, [Validators.min(0)]],
//       discountedPrice: [null, [Validators.min(0)]], // You had this in patchForm, adding it here
//       taxRate: [0, [Validators.min(0)]],
//       isTaxInclusive: [false],
//       // Inventory (FormArray)
//       inventory: this.fb.array([]),
//       // Media
//       // images: this.fb.array([]), // Image uploads are complex, usually handled separately
//       // Supplier
//       defaultSupplierId: [null],
//       // Meta
//       tags: [''], // Will be converted to array
//       isActive: [true]
//     });
//   }

//   private patchForm(product: any): void {
//     this.productForm.patchValue({
//       name: product.name,
//       sku: product.sku,
//       description: product.description,
//       brand: product.brand,
//       category: product.category,
//       sellingPrice: product.sellingPrice,
//       purchasePrice: product.purchasePrice,
//       discountedPrice: product.discountedPrice,
//       taxRate: product.taxRate,
//       isTaxInclusive: product.isTaxInclusive,
//       defaultSupplierId: product.defaultSupplierId,
//       tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
//       isActive: product.isActive
//     });

//     // Clear existing inventory items
//     this.inventory.clear();
//     // Add inventory items from the loaded product
//     if (product.inventory && Array.isArray(product.inventory)) {
//       product.inventory.forEach((item: any) => {
//         this.inventory.push(this.fb.group({
//           branchId: [item.branchId, Validators.required],
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

//   // --- Form Submission ---
//   onSubmit(): void {
//     if (this.productForm.invalid) {
//       this.productForm.markAllAsTouched(); // Trigger validation messages
//       this.messageService.showError('Invalid Form', 'Please check all required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const rawValue = this.productForm.getRawValue();

//     // Prepare payload
//     const payload = {
//       ...rawValue,
//       // Convert tags string to array, filtering out empty strings
//       tags: rawValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
//     };

//     // Determine if creating or updating
//     const saveObservable = this.editMode()
//       ? this.productService.updateProduct(this.productId!, payload)
//       : this.productService.createProduct(payload);

//     saveObservable.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: (res) => {
//         this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         // Navigate to the details page of the saved product
//         this.router.navigate(['/products', res.data._id]);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
//       }
//     });
//   }
// }




// // // import { Component } from '@angular/core';

// // // @Component({
// // //   selector: 'app-product-form',
// // //   imports: [],
// // //   templateUrl: './product-form.html',
// // //   styleUrl: './product-form.scss',
// // // })
// // // export class ProductForm {

// // // }
// // import { AccordionModule } from 'primeng/accordion';
// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { ActivatedRoute, Router } from '@angular/router';

// // import { finalize, switchMap } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { TextareaModule } from 'primeng/textarea';
// // import { SelectModule } from 'primeng/select';
// // import { DividerModule } from 'primeng/divider';
// // import { ToastModule } from 'primeng/toast';
// // import { ProductService } from '../../services/product-service';
// // import { LoadingService } from '../../../../core/services/loading.service';
// // import { MasterListService } from '../../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../../core/services/message.service';

// // @Component({
// //   selector: 'app-product-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     ToastModule,
// //     ButtonModule,AccordionModule,
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
// //   private masterList = inject(MasterListService);

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
// //   supplierOptions = signal<any[]>([]);

// //   constructor() {
// //     this.branchOptions.set(this.masterList.branches());
// //     // Example:
// //     // this.categoryOptions.set(this.masterList.categories());
// //     // this.brandOptions.set(this.masterList.brands());
// //     // this.supplierOptions.set(this.masterList.suppliers());
// //   }

// //   ngOnInit(): void {
// //     this.buildForm();
// //     this.checkRouteForEditMode();
// //   }

// //   private checkRouteForEditMode(): void {
// //     this.route.paramMap.pipe(
// //       switchMap(params => {
// //         this.productId = params.get('id');
// //         if (this.productId) {
// //           this.editMode.set(true);
// //           this.formTitle.set('Edit Product');
// //           this.loadingService.show();
// //           return this.productService.getProductById(this.productId);
// //         }
// //         return of(null); // Create mode
// //       }),
// //       finalize(() => this.loadingService.hide())
// //     ).subscribe({
// //       next: (response) => {
// //         if (response && response.data && response.data.data) {
// //           this.patchForm(response.data.data);
// //         } else if (response) {
// //           this.messageService.showError('Error', 'Failed to load product data');
// //         }
// //       },
// //       error: (err) => this.messageService.showError('Error', err.error?.message)
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
// //       // Media
// //       // images: this.fb.array([]), // Image uploads are complex, usually handled separately
// //       // Supplier
// //       defaultSupplierId: [null],
// //       // Meta
// //       tags: [''], // Will be converted to array
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
// //       defaultSupplierId: product.defaultSupplierId,
// //       tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
// //       isActive: product.isActive
// //     });

// //     // Clear existing inventory items
// //     this.inventory.clear();
// //     // Add inventory items from the loaded product
// //     if (product.inventory && Array.isArray(product.inventory)) {
// //       product.inventory.forEach((item: any) => {
// //         this.inventory.push(this.fb.group({
// //           branchId: [item.branchId, Validators.required],
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

// //   // --- Form Submission ---
// //   onSubmit(): void {
// //     if (this.productForm.invalid) {
// //       this.productForm.markAllAsTouched(); // Trigger validation messages
// //       this.messageService.showError('Invalid Form', 'Please check all required fields.');
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const rawValue = this.productForm.getRawValue();

// //     // Prepare payload
// //     const payload = {
// //       ...rawValue,
// //       // Convert tags string to array, filtering out empty strings
// //       tags: rawValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
// //     };

// //     // Determine if creating or updating
// //     const saveObservable = this.editMode()
// //       ? this.productService.updateProduct(this.productId!, payload)
// //       : this.productService.createProduct(payload);

// //     saveObservable.pipe(
// //       finalize(() => this.isSubmitting.set(false))
// //     ).subscribe({
// //       next: (res) => {
// //         this.messageService.showSuccess('Success', `Product ${this.editMode() ? 'updated' : 'created'} successfully.`);
// //         // Navigate to the details page of the saved product
// //         this.router.navigate(['/products', res.data._id]);
// //       },
// //       error: (err) => {
// //         this.messageService.showError('Error', err.error?.message || 'Failed to save product.');
// //       }
// //     });
// //   }
// // } */