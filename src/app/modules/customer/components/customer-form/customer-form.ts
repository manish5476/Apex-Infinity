
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// Services
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    FileUploadModule,
    ButtonModule,
    CheckboxModule,
    CardModule,
    InputNumberModule,
    DividerModule,
    ToastModule,
    SelectModule,
    TextareaModule,
    SkeletonModule,
    AvatarModule
  ],
  providers: [CustomerService],
  templateUrl: './customer-form.html',
  styleUrls: ['./customer-form.scss']
})
export class CustomerForm implements OnInit {
  // Dependencies
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public common = inject(CommonMethodService);
  private messageService = inject(AppMessageService);

  // Signals
  isSubmitting = signal(false);
  loadingData = signal(false);
  editMode = signal(false);
  customerId = signal<string | null>(null);
   
  // Computed
  pageTitle = computed(() => this.editMode() ? 'Edit Customer' : 'Create New Customer');
  submitLabel = computed(() => this.isSubmitting() ? 'Submitting...' : (this.editMode() ? 'Save Changes' : 'Create Customer'));

  customerForm!: FormGroup;
   
  // Dropdown Options
  customerTypes = [
    { label: 'Individual', value: 'individual' },
    { label: 'Business', value: 'business' }
  ];

  // Avatar Preview Helper
  currentAvatarUrl: string | null = null;

  ngOnInit(): void {
    this.buildForm();
    this.checkEditMode();
  }

  buildForm(): void {
    this.customerForm = this.fb.group({
      type: ['individual', Validators.required],
      name: ['', Validators.required],
      contactPerson: [''],
      email: ['', [Validators.email]],
      phone: ['', Validators.required],
      altPhone: [''],
      gstNumber: [''], // Validators.pattern can be added here
      panNumber: [''],
      avatar: [null], // Holds File object or URL string

      billingAddress: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['India']
      }),

      shippingAddress: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['India']
      }),

      openingBalance: [0],
      creditLimit: [0],
      paymentTerms: [''],
      tags: [''], // Managed as comma-separated string in UI
      notes: [''],
      isActive: [true]
    });
  }

  // === 1. Edit Mode Logic ===
  private checkEditMode(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const queryId = this.route.snapshot.queryParamMap.get('id');
    const id = routeId || queryId;

    if (id) {
      this.customerId.set(id);
      this.editMode.set(true);
      this.loadCustomerData(id);
    }
  }

  private loadCustomerData(id: string): void {
    this.loadingData.set(true);
    
    this.common.apiCall(
      this.customerService.getCustomerDataWithId(id),
      (response: any) => {
        const data = response.data?.data || response.data || response;
        if (data) {
          // 1. Handle Tags (DB Array -> Form String)
          if (Array.isArray(data.tags)) {
            data.tags = data.tags.join(', '); 
          }

          // 2. Patch Form
          this.customerForm.patchValue(data);
          
          // 3. Handle Avatar Preview
          if (data.avatar) {
            this.currentAvatarUrl = data.avatar;
            // Ensure the form control holds the URL so it's not null
            this.customerForm.get('avatar')?.setValue(data.avatar);
          }

          // 4. Patch addresses explicitly (safeguard)
          if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
          if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);
        }
        this.loadingData.set(false);
      },
      'Fetch Customer Data'
    );
  }

  // === 2. File Upload ===
  onFileUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      this.customerForm.patchValue({ avatar: file });
      this.customerForm.get('avatar')?.markAsDirty();
      
      // Create local preview
      const reader = new FileReader();
      reader.onload = (e: any) => this.currentAvatarUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // === 3. Submit Handler ===
  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
      return;
    }

    this.isSubmitting.set(true);
    
    // Convert Form Group to FormData
    const formData = this.prepareFormData();

    const request$ = this.editMode()
        ? this.customerService.updateCustomer(this.customerId()!, formData)
        : this.customerService.createNewCustomer(formData);

    this.common.apiCall(
      request$,
      (res: any) => {
        this.messageService.showSuccess(
          this.editMode() ? 'Updated' : 'Created', 
          `Customer saved successfully.`
        );
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigate(['/customer']), 500);
      },
      'Save Customer',
      () => this.isSubmitting.set(false) // On Error/Complete
    );
  }

  /**
   * Prepares the FormData object.
   * Handles nested objects (addresses) and files (avatar) correctly for Mongoose.
   */
  private prepareFormData(): FormData {
    const raw = this.customerForm.getRawValue();
    const fd = new FormData();
    
    // Helper to append data safely
    const append = (key: string, value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        fd.append(key, value);
      }
    };

    // 1. Handle Avatar
    if (raw.avatar instanceof File) {
      fd.append('avatar', raw.avatar);
    } 
    // If it's a string (existing URL), we usually don't need to send it back 
    // unless the backend explicitly clears it if missing. 
    // With Mongoose, if you don't send 'avatar', the old value persists.

    // 2. Handle Tags (Form String -> DB Array)
    if (raw.tags && typeof raw.tags === 'string') {
        const tagArray = raw.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        // Append loop for arrays
        tagArray.forEach((tag: string) => fd.append('tags[]', tag));
    }

    // 3. Handle Primitive Fields (with Schema Transformations)
    append('type', raw.type);
    append('name', raw.name.trim());
    append('contactPerson', raw.contactPerson?.trim());
    append('phone', raw.phone?.trim());
    append('altPhone', raw.altPhone?.trim());
    
    // Schema: Lowercase Email
    if (raw.email) append('email', raw.email.toLowerCase().trim());
    
    // Schema: Uppercase GST/PAN
    if (raw.gstNumber) append('gstNumber', raw.gstNumber.toUpperCase().trim());
    if (raw.panNumber) append('panNumber', raw.panNumber.toUpperCase().trim());

    // Schema: Numbers
    append('openingBalance', raw.openingBalance);
    append('creditLimit', raw.creditLimit);
    
    append('paymentTerms', raw.paymentTerms);
    append('notes', raw.notes);
    append('isActive', raw.isActive);

    // 4. Handle Nested Addresses (Flattening is safer than JSON.stringify for Multipart)
    // Converts { city: 'X', street: 'Y' } -> "billingAddress.city": "X"
    this.appendNestedObject(fd, 'billingAddress', raw.billingAddress);
    this.appendNestedObject(fd, 'shippingAddress', raw.shippingAddress);

    return fd;
  }
  
  /**
   * Recursively flattens objects for FormData
   * e.g. billingAddress: { city: 'NY' } becomes "billingAddress[city]" = "NY"
   * Depending on your backend body-parser settings, you might need dot notation "billingAddress.city"
   */
  private appendNestedObject(fd: FormData, prefix: string, object: any) {
    if (!object) return;
    
    Object.keys(object).forEach(key => {
      const value = object[key];
      if (value !== null && value !== undefined && value !== '') {
        // Using Bracket notation usually works best with Express + Multer + BodyParser
        fd.append(`${prefix}[${key}]`, value.toString().trim());
      }
    });
  }
   
  copyBillingAddress(event: any): void {
    if (event.checked) {
      const billingAddress = this.customerForm.get('billingAddress')?.value;
      this.customerForm.get('shippingAddress')?.patchValue(billingAddress);
    } else {
      this.customerForm.get('shippingAddress')?.reset({
        street: '', city: '', state: '', zipCode: '', country: 'India'
      });
    }
  }
   
  // Helper for validation messages
  isFieldInvalid(field: string): boolean {
    const control = this.customerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// // Services
// import { CustomerService } from '../../services/customer-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // PrimeNG Modules
// import { InputTextModule } from 'primeng/inputtext';
// import { FileUploadModule } from 'primeng/fileupload';
// import { ButtonModule } from 'primeng/button';
// import { CheckboxModule } from 'primeng/checkbox';
// import { CardModule } from 'primeng/card';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { SelectModule } from 'primeng/select'; // PrimeNG v18
// import { TextareaModule } from 'primeng/textarea';
// import { SkeletonModule } from 'primeng/skeleton';
// import { AvatarModule } from 'primeng/avatar';

// @Component({
//   selector: 'app-customer-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     InputTextModule,
//     FileUploadModule,
//     ButtonModule,
//     CheckboxModule,
//     CardModule,
//     InputNumberModule,
//     DividerModule,
//     ToastModule,
//     SelectModule,
//     TextareaModule,
//     SkeletonModule,
//     AvatarModule
//   ],
//   providers: [CustomerService],
//   templateUrl: './customer-form.html',
//   styleUrls: ['./customer-form.scss']
// })
// export class CustomerForm implements OnInit {
//   // Dependencies
//   private customerService = inject(CustomerService);
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   public common = inject(CommonMethodService);
//   private messageService = inject(AppMessageService);

//   // Signals
//   isSubmitting = signal(false);
//   loadingData = signal(false); 
//   editMode = signal(false);
//   customerId = signal<string | null>(null);
  
//   // Computed
//   pageTitle = computed(() => this.editMode() ? 'Edit Customer' : 'Create New Customer');
//   submitLabel = computed(() => this.isSubmitting() ? 'Submitting...' : (this.editMode() ? 'Save Changes' : 'Create Customer'));

//   customerForm!: FormGroup;
  
//   // Dropdown Options
//   customerTypes = [
//     { label: 'Individual', value: 'individual' },
//     { label: 'Business', value: 'business' }
//   ];

//   // Avatar Preview Helper
//   currentAvatarUrl: string | null = null;

//   ngOnInit(): void {
//     this.buildForm();
//     this.checkEditMode();
//   }

//   buildForm(): void {
//     this.customerForm = this.fb.group({
//       // BASIC INFO
//       type: ['individual', Validators.required],
//       name: ['', Validators.required],
//       contactPerson: [''],
//       email: ['', [Validators.email]],
//       phone: ['', Validators.required],
//       altPhone: [''],
//       // Added basic length/pattern validators for client-side UX
//       gstNumber: ['', [Validators.minLength(15), Validators.maxLength(15)]], 
//       panNumber: ['', [Validators.minLength(10), Validators.maxLength(10)]],
//       avatar: [null],

//       // ADDRESSES
//       billingAddress: this.fb.group({
//         street: [''],
//         city: [''],
//         state: [''],
//         zipCode: [''],
//         country: ['India']
//       }),

//       shippingAddress: this.fb.group({
//         street: [''],
//         city: [''],
//         state: [''],
//         zipCode: [''],
//         country: ['India']
//       }),

//       // FINANCIAL & OTHER
//       openingBalance: [0],
//       creditLimit: [0],
//       paymentTerms: [''],
//       tags: [''],
//       notes: [''],
//       isActive: [true] // Explicitly included the missing boolean control
//     });
//   }

//   // === 1. Edit Mode Logic ===
//   private checkEditMode(): void {
//     const routeId = this.route.snapshot.paramMap.get('id');
//     const queryId = this.route.snapshot.queryParamMap.get('id');
//     const id = routeId || queryId;

//     if (id) {
//       this.customerId.set(id);
//       this.editMode.set(true); // Set edit mode here
//       this.loadCustomerData(id);
//     }
//   }

//   private loadCustomerData(id: string): void {
//     this.loadingData.set(true); // Start loading state
    
//     this.common.apiCall(
//       this.customerService.getCustomerDataWithId(id),
//       (response: any) => {
//         // Assuming response structure might be nested
//         const data = response.data?.data || response.data || response;
//         if (data) {
//           // Patching data directly, including address subdocuments
//           this.customerForm.patchValue(data);
          
//           if (data.avatar) {
//             this.currentAvatarUrl = data.avatar;
//             // Ensure existing avatar URL is stored in the form control for submission payload
//             this.customerForm.get('avatar')?.setValue(data.avatar); 
//           }
//         }
//         this.loadingData.set(false);
//       },
//       'Fetch Customer Data'
//     );
//   }

//   onFileUpload(event: any): void {
//     const file = event.files[0];
//     if (file) {
//       this.customerForm.patchValue({ avatar: file });
//       this.customerForm.get('avatar')?.markAsDirty();
      
//       const reader = new FileReader();
//       reader.onload = (e: any) => this.currentAvatarUrl = e.target.result;
//       reader.readAsDataURL(file);
//     }
//   }

//   // === 3. Submit Handler ===
//   onSubmit(): void {
//     if (this.customerForm.invalid) {
//       this.customerForm.markAllAsTouched();
//       this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formData = this.prepareFormData(); // Use the fixed preparation logic
    
//     const request$ = this.editMode()
//       ? this.customerService.updateCustomer(this.customerId()!, formData)
//       : this.customerService.createNewCustomer(formData);

//     this.common.apiCall(
//       request$,
//       (res: any) => {
//         this.messageService.showSuccess(this.editMode() ? 'Updated' : 'Created', `Customer saved successfully.` );
//         this.isSubmitting.set(false);
//         setTimeout(() => this.router.navigate(['/customer']), 500);
//       },
//       'Save Customer',
//       () => {
//         this.isSubmitting.set(false);
//       } // Ensure submission state is reset on error
//     );
//   }

//   /**
//    * FIX: Prepares FormData by sending all non-file fields (including addresses) 
//    * as a single JSON string under the key 'data', and the file under 'avatar'.
//    * The backend must be configured to parse the 'data' field.
//    */
//   private prepareFormData(): FormData {
//     const raw = this.customerForm.getRawValue();
//     const fd = new FormData();
    
//     const avatarValue = raw.avatar;
    
//     // Remove avatar from the main data object
//     delete raw.avatar; 

//     // 1. Append all non-file data as a single JSON string
//     // This correctly handles nested objects like billingAddress and shippingAddress.
//     fd.append('data', JSON.stringify(raw)); 

//     // 2. Append the file separately
//     // The value must be a File object. We skip appending if it's the old URL string.
//     if (avatarValue instanceof File) {
//       fd.append('avatar', avatarValue);
//     }
    
//     // Note: If avatarValue is a URL string (old avatar), it's already in the 'data' JSON.

//     return fd;
//   }
  
//   copyBillingAddress(event: any): void {
//     if (event.checked) {
//       const billingAddress = this.customerForm.get('billingAddress')?.value;
//       this.customerForm.get('shippingAddress')?.patchValue(billingAddress);
//     } else {
//       this.customerForm.get('shippingAddress')?.reset({
//         street: '', city: '', state: '', zipCode: '', country: 'India'
//       });
//     }
//   }
  
//   // Helper for validation messages
//   isFieldInvalid(field: string): boolean {
//     const control = this.customerForm.get(field);
//     return !!(control && control.invalid && (control.dirty || control.touched));
//   }
// }
// // // import { Component, OnInit, inject, signal, computed } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
// // // import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// // // // Services
// // // import { CustomerService } from '../../services/customer-service';
// // // import { AppMessageService } from '../../../../core/services/message.service';
// // // import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // // // PrimeNG Modules
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { FileUploadModule } from 'primeng/fileupload';
// // // import { ButtonModule } from 'primeng/button';
// // // import { CheckboxModule } from 'primeng/checkbox';
// // // import { CardModule } from 'primeng/card';
// // // import { InputNumberModule } from 'primeng/inputnumber';
// // // import { DividerModule } from 'primeng/divider';
// // // import { ToastModule } from 'primeng/toast';
// // // import { SelectModule } from 'primeng/select'; // PrimeNG v18
// // // import { TextareaModule } from 'primeng/textarea';
// // // import { SkeletonModule } from 'primeng/skeleton';
// // // import { AvatarModule } from 'primeng/avatar';

// // // @Component({
// // //   selector: 'app-customer-form',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     ReactiveFormsModule,
// // //     RouterModule,
// // //     InputTextModule,
// // //     FileUploadModule,
// // //     ButtonModule,
// // //     CheckboxModule,
// // //     CardModule,
// // //     InputNumberModule,
// // //     DividerModule,
// // //     ToastModule,
// // //     SelectModule,
// // //     TextareaModule,
// // //     SkeletonModule,
// // //     AvatarModule
// // //   ],
// // //   providers: [CustomerService],
// // //   templateUrl: './customer-form.html',
// // //   styleUrls: ['./customer-form.scss']
// // // })
// // // export class CustomerForm implements OnInit {
// // //   // Dependencies
// // //   private customerService = inject(CustomerService);
// // //   private fb = inject(FormBuilder);
// // //   private router = inject(Router);
// // //   private route = inject(ActivatedRoute);
// // //   public common = inject(CommonMethodService);
// // //   private messageService = inject(AppMessageService);

// // //   // Signals
// // //   isSubmitting = signal(false);
// // //   loadingData = signal(false); // New: Handles Edit Mode loading state
// // //   editMode = signal(false);
// // //   customerId = signal<string | null>(null);
  
// // //   // Computed
// // //   pageTitle = computed(() => this.editMode() ? 'Edit Customer' : 'Create New Customer');
// // //   submitLabel = computed(() => this.isSubmitting() ? 'Submitting...' : (this.editMode() ? 'Save Changes' : 'Create Customer'));

// // //   customerForm!: FormGroup;
  
// // //   // Dropdown Options
// // //   customerTypes = [
// // //     { label: 'Individual', value: 'individual' },
// // //     { label: 'Business', value: 'business' }
// // //   ];

// // //   // Avatar Preview Helper
// // //   currentAvatarUrl: string | null = null;

// // //   ngOnInit(): void {
// // //     this.buildForm();
// // //     this.checkEditMode();
// // //   }

// // //   buildForm(): void {
// // //     this.customerForm = this.fb.group({
// // //       type: ['individual', Validators.required],
// // //       name: ['', Validators.required],
// // //       contactPerson: [''],
// // //       email: ['', [Validators.email]], // Optional but validated if present
// // //       phone: ['', Validators.required],
// // //       altPhone: [''],
// // //       gstNumber: [''],
// // //       panNumber: [''],
// // //       avatar: [null],

// // //       billingAddress: this.fb.group({
// // //         street: [''],
// // //         city: [''],
// // //         state: [''],
// // //         zipCode: [''],
// // //         country: ['India']
// // //       }),

// // //       shippingAddress: this.fb.group({
// // //         street: [''],
// // //         city: [''],
// // //         state: [''],
// // //         zipCode: [''],
// // //         country: ['India']
// // //       }),

// // //       openingBalance: [0],
// // //       creditLimit: [0],
// // //       paymentTerms: [''],
// // //       tags: [''],
// // //       notes: [''],
// // //       isActive: [true]
// // //     });
// // //   }

// // //   // === 1. Edit Mode Logic ===
// // //   private checkEditMode(): void {
// // //     const routeId = this.route.snapshot.paramMap.get('id');
// // //     const queryId = this.route.snapshot.queryParamMap.get('id');
// // //     const id = routeId || queryId;

// // //     if (id) {
// // //       this.customerId.set(id);
// // //       // this.editMode.set(true);
// // //       this.loadCustomerData(id);
// // //     }
// // //   }

// // //   private loadCustomerData(id: string): void {
// // //     // this.loadingData.set(true);
    
// // //     this.common.apiCall(
// // //       this.customerService.getCustomerDataWithId(id),
// // //       (response: any) => {
// // //         const data = response.data?.data || response.data || response;
// // //         if (data) {
// // //           this.customerForm.patchValue(data);
// // //           if (data.avatar) this.currentAvatarUrl = data.avatar;
// // //           if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
// // //           if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);
// // //         }
// // //         this.loadingData.set(false);
// // //       },
// // //       'Fetch Customer Data'
// // //     );
// // //   }

// // //   onFileUpload(event: any): void {
// // //     const file = event.files[0];
// // //     if (file) {
// // //       this.customerForm.patchValue({ avatar: file });
// // //       this.customerForm.get('avatar')?.markAsDirty();
// // //           const reader = new FileReader();
// // //       reader.onload = (e: any) => this.currentAvatarUrl = e.target.result;
// // //       reader.readAsDataURL(file);
// // //     }
// // //   }

// // //   // === 3. Submit Handler ===
// // //   onSubmit(): void {
// // //     if (this.customerForm.invalid) {
// // //       this.customerForm.markAllAsTouched();
// // //       this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
// // //       return;
// // //     }

// // //     // this.isSubmitting.set(true);
// // //     const formData = this.prepareFormData();
// // //     const request$ = this.editMode()
// // //         ? this.customerService.updateCustomer(this.customerId()!, formData)
// // //         : this.customerService.createNewCustomer(formData);

// // //     this.common.apiCall(
// // //       request$,
// // //       (res: any) => {
// // //         this.messageService.showSuccess(this.editMode() ? 'Updated' : 'Created', `Customer saved successfully.` );
// // //         // this.isSubmitting.set(false);
// // //         setTimeout(() => this.router.navigate(['/customer']), 500);
// // //       },
// // //       'Save Customer'
// // //     );
// // //   }

// // //   private prepareFormData(): FormData {
// // //     const raw = this.customerForm.getRawValue();
// // //     const fd = new FormData();
    
// // //     Object.keys(raw).forEach(key => {
// // //       const value = raw[key];

// // //       if (key === 'avatar') {
// // //         if (value instanceof File) fd.append(key, value);
// // //       } 
// // //       else if ((key === 'billingAddress' || key === 'shippingAddress') && value) {
// // //         fd.append(key, JSON.stringify(value));
// // //       }
// // //       else if (value !== null && value !== undefined) {
// // //         fd.append(key, value.toString());
// // //       }
// // //     });

// // //     return fd;
// // //   }
  
// // //   copyBillingAddress(event: any): void {
// // //     if (event.checked) {
// // //       const billingAddress = this.customerForm.get('billingAddress')?.value;
// // //       this.customerForm.get('shippingAddress')?.patchValue(billingAddress);
// // //     } else {
// // //       this.customerForm.get('shippingAddress')?.reset({
// // //         street: '', city: '', state: '', zipCode: '', country: 'India'
// // //       });
// // //     }
// // //   }
  
// // //   // Helper for validation messages
// // //   isFieldInvalid(field: string): boolean {
// // //     const control = this.customerForm.get(field);
// // //     return !!(control && control.invalid && (control.dirty || control.touched));
// // //   }
// // // }

// // // // import { Component, OnInit, inject, signal, computed } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
// // // // import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// // // // // Services
// // // // import { CustomerService } from '../../services/customer-service';
// // // // import { AppMessageService } from '../../../../core/services/message.service';

// // // // // PrimeNG Modules
// // // // import { InputTextModule } from 'primeng/inputtext';
// // // // import { FileUploadModule } from 'primeng/fileupload';
// // // // import { ButtonModule } from 'primeng/button';
// // // // import { CheckboxModule } from 'primeng/checkbox';
// // // // import { CardModule } from 'primeng/card';
// // // // import { InputNumberModule } from 'primeng/inputnumber';
// // // // import { DividerModule } from 'primeng/divider';
// // // // import { ToastModule } from 'primeng/toast';
// // // // import { SelectModule } from 'primeng/select';
// // // // import { TextareaModule } from 'primeng/textarea';
// // // // import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // // // @Component({
// // // //   selector: 'app-customer-form',
// // // //   standalone: true,
// // // //   imports: [
// // // //     CommonModule,
// // // //     ReactiveFormsModule,
// // // //     RouterModule,
// // // //     InputTextModule,
// // // //     FileUploadModule,
// // // //     ButtonModule,
// // // //     CheckboxModule,
// // // //     CardModule,
// // // //     InputNumberModule,
// // // //     DividerModule,
// // // //     ToastModule,
// // // //     SelectModule,
// // // //     TextareaModule
// // // //   ],
// // // //   providers: [CustomerService],
// // // //   templateUrl: './customer-form.html',
// // // //   styleUrls: ['./customer-form.scss']
// // // // })
// // // // export class CustomerForm implements OnInit {
// // // //   // Dependencies
// // // //   private customerService = inject(CustomerService);
// // // //   private fb = inject(FormBuilder);
// // // //   private router = inject(Router);
// // // //   private route = inject(ActivatedRoute);
// // // //   public common = inject(CommonMethodService);
// // // //   private messageService = inject(AppMessageService);

// // // //   // Signals
// // // //   isSubmitting = signal(false);
// // // //   editMode = signal(false);
// // // //   customerId = signal<string | null>(null);
  
// // // //   // Computed Title
// // // //   pageTitle = computed(() => this.editMode() ? 'Edit Customer' : 'Create New Customer');
// // // //   submitLabel = computed(() => this.isSubmitting() ? 'Submitting...' : (this.editMode() ? 'Save Changes' : 'Create Customer'));

// // // //   customerForm!: FormGroup;
  
// // // //   customerTypes = [
// // // //     { label: 'Individual', value: 'individual' },
// // // //     { label: 'Business', value: 'business' }
// // // //   ];

// // // //   ngOnInit(): void {
// // // //     this.buildForm();
// // // //     this.checkEditMode();
// // // //   }

// // // //   buildForm(): void {
// // // //     this.customerForm = this.fb.group({
// // // //       type: ['individual', Validators.required],
// // // //       name: ['', Validators.required],
// // // //       contactPerson: [''],
// // // //       email: ['', [Validators.email]],
// // // //       phone: ['', Validators.required],
// // // //       altPhone: [''],
// // // //       gstNumber: [''],
// // // //       panNumber: [''],
// // // //       avatar: [null],

// // // //       billingAddress: this.fb.group({
// // // //         street: [''],
// // // //         city: [''],
// // // //         state: [''],
// // // //         zipCode: [''],
// // // //         country: ['India']
// // // //       }),

// // // //       shippingAddress: this.fb.group({
// // // //         street: [''],
// // // //         city: [''],
// // // //         state: [''],
// // // //         zipCode: [''],
// // // //         country: ['India']
// // // //       }),

// // // //       openingBalance: [0],
// // // //       creditLimit: [0],
// // // //       paymentTerms: [''],
// // // //       tags: [''],
// // // //       notes: [''],
// // // //       isActive: [true]
// // // //     });
// // // //   }

// // // //   // === 1. Edit Mode Logic ===
// // // //   private checkEditMode(): void {
// // // //     // Check both route params (:id) and query params (?id=...)
// // // //     // Since routerLink was ['../edit', c._id] or queryParams depending on layout
// // // //     const routeId = this.route.snapshot.paramMap.get('id');
// // // //     const queryId = this.route.snapshot.queryParamMap.get('id');
// // // //     const id = routeId || queryId;

// // // //     if (id) {
// // // //       this.customerId.set(id);
// // // //       this.editMode.set(true);
// // // //       this.loadCustomerData(id);
// // // //     }
// // // //   }

// // // //   private loadCustomerData(id: string): void {
// // // //     this.common.apiCall(
// // // //       this.customerService.getCustomerDataWithId(id),
// // // //       (response: any) => {
// // // //         const data = response.data?.data || response.data || response;
// // // //         if (data) {
// // // //           this.customerForm.patchValue(data);
          
// // // //           // Ensure addresses are patched even if null in DB (prevents errors)
// // // //           if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
// // // //           if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);
// // // //         }
// // // //       },
// // // //       'Fetch Customer Data'
// // // //     );
// // // //   }

// // // //   // === 2. File Upload ===
// // // //   onFileUpload(event: any): void {
// // // //     const file = event.files[0];
// // // //     if (file) {
// // // //         this.customerForm.patchValue({ avatar: file });
// // // //         this.customerForm.get('avatar')?.markAsDirty();
// // // //     }
// // // //   }

// // // //   // === 3. Submit Handler (Create & Update) ===
// // // //   onSubmit(): void {
// // // //     if (this.customerForm.invalid) {
// // // //       this.customerForm.markAllAsTouched();
// // // //       this.messageService.showWarn('Validation Error', 'Please fill in all required fields.');
// // // //       return;
// // // //     }

// // // //     this.isSubmitting.set(true);
// // // //     const formData = this.prepareFormData();

// // // //     const request$ = this.editMode()
// // // //         ? this.customerService.updateCustomer(this.customerId()!, formData)
// // // //         : this.customerService.createNewCustomer(formData);

// // // //     // 🚀 Use Common API Call
// // // //     this.common.apiCall(
// // // //       request$,
// // // //       (res: any) => {
// // // //         this.messageService.showSuccess(
// // // //           this.editMode() ? 'Updated' : 'Created', 
// // // //           `Customer ${this.editMode() ? 'updated' : 'created'} successfully.`
// // // //         );
// // // //         this.isSubmitting.set(false);
// // // //         setTimeout(() => this.router.navigate(['/customer']), 500);
// // // //       },
// // // //       'Save Customer'
// // // //     );
// // // //   }

// // // //   private prepareFormData(): FormData {
// // // //     const raw = this.customerForm.getRawValue();
// // // //     const fd = new FormData();
    
// // // //     Object.keys(raw).forEach(key => {
// // // //       const value = raw[key];

// // // //       // 1. Handle File (Avatar)
// // // //       if (key === 'avatar' && value instanceof File) {
// // // //         fd.append(key, value);
// // // //       } 
// // // //       // 2. Handle Nested Objects (Addresses) -> Convert to JSON string
// // // //       else if ((key === 'billingAddress' || key === 'shippingAddress') && value) {
// // // //         fd.append(key, JSON.stringify(value));
// // // //       }
// // // //       // 3. Handle Regular Fields
// // // //       else if (value !== null && value !== undefined && key !== 'avatar') {
// // // //         fd.append(key, value.toString());
// // // //       }
// // // //     });

// // // //     return fd;
// // // //   }
  
// // // //   copyBillingAddress(event: any): void {
// // // //     if (event.checked) {
// // // //       const billingAddress = this.customerForm.get('billingAddress')?.value;
// // // //       this.customerForm.get('shippingAddress')?.patchValue(billingAddress);
// // // //     } else {
// // // //       this.customerForm.get('shippingAddress')?.reset({
// // // //         street: '', city: '', state: '', zipCode: '', country: 'India'
// // // //       });
// // // //     }
// // // //   }
// // // // }
