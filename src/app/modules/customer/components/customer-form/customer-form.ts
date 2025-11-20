import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// Services
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';

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
import { CommonMethodService } from '../../../../core/utils/common-method.service';

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
    TextareaModule
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
  editMode = signal(false);
  customerId = signal<string | null>(null);
  
  // Computed Title
  pageTitle = computed(() => this.editMode() ? 'Edit Customer' : 'Create New Customer');
  submitLabel = computed(() => this.isSubmitting() ? 'Submitting...' : (this.editMode() ? 'Save Changes' : 'Create Customer'));

  customerForm!: FormGroup;
  
  customerTypes = [
    { label: 'Individual', value: 'individual' },
    { label: 'Business', value: 'business' }
  ];

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
      gstNumber: [''],
      panNumber: [''],
      avatar: [null],

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
      tags: [''],
      notes: [''],
      isActive: [true]
    });
  }

  // === 1. Edit Mode Logic ===
  private checkEditMode(): void {
    // Check both route params (:id) and query params (?id=...)
    // Since routerLink was ['../edit', c._id] or queryParams depending on layout
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
    this.common.apiCall(
      this.customerService.getCustomerDataWithId(id),
      (response: any) => {
        const data = response.data?.data || response.data || response;
        if (data) {
          this.customerForm.patchValue(data);
          
          // Ensure addresses are patched even if null in DB (prevents errors)
          if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
          if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);
        }
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
    }
  }

  // === 3. Submit Handler (Create & Update) ===
  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error', 'Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.prepareFormData();

    const request$ = this.editMode()
        ? this.customerService.updateCustomer(this.customerId()!, formData)
        : this.customerService.createNewCustomer(formData);

    // 🚀 Use Common API Call
    this.common.apiCall(
      request$,
      (res: any) => {
        this.messageService.showSuccess(
          this.editMode() ? 'Updated' : 'Created', 
          `Customer ${this.editMode() ? 'updated' : 'created'} successfully.`
        );
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigate(['/customer']), 500);
      },
      'Save Customer'
    );
  }

  private prepareFormData(): FormData {
    const raw = this.customerForm.getRawValue();
    const fd = new FormData();
    
    Object.keys(raw).forEach(key => {
      const value = raw[key];

      // 1. Handle File (Avatar)
      if (key === 'avatar' && value instanceof File) {
        fd.append(key, value);
      } 
      // 2. Handle Nested Objects (Addresses) -> Convert to JSON string
      else if ((key === 'billingAddress' || key === 'shippingAddress') && value) {
        fd.append(key, JSON.stringify(value));
      }
      // 3. Handle Regular Fields
      else if (value !== null && value !== undefined && key !== 'avatar') {
        fd.append(key, value.toString());
      }
    });

    return fd;
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
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router'; // Added Router

// // Services
// import { CustomerService } from '../../services/customer-service';
// import { MessageService } from 'primeng/api';

// // PrimeNG Modules
// import { InputTextModule } from 'primeng/inputtext';
// import { FileUploadModule } from 'primeng/fileupload';
// import { ButtonModule } from 'primeng/button';
// import { CheckboxModule } from 'primeng/checkbox';
// import { CardModule } from 'primeng/card';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { SelectModule } from 'primeng/select';
// import { TextareaModule } from 'primeng/textarea'; // Corrected Module

// @Component({
//   selector: 'app-customer-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule, // For routerLink
//     InputTextModule,
//     FileUploadModule,
//     ButtonModule,
//     CheckboxModule,
//     CardModule,
//     InputNumberModule,
//     DividerModule,
//     ToastModule,
//     SelectModule,
//     TextareaModule
//   ],
//   providers: [MessageService, CustomerService],
//   templateUrl: './customer-form.html',
//   styleUrls: ['./customer-form.scss']
// })
// export class CustomerForm implements OnInit {
//   // Dependencies
//   private customerService = inject(CustomerService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   // Signals
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   customerId = signal<string | null>(null);
  
//   // Computed Title
//   pageTitle = computed(() => this.editMode() ? 'Edit Customer' : 'Create New Customer');
//   submitLabel = computed(() => this.isSubmitting() ? 'Submitting...' : (this.editMode() ? 'Save Changes' : 'Create Customer'));

//   customerForm!: FormGroup;
  
//   customerTypes = [
//     { label: 'Individual', value: 'individual' },
//     { label: 'Business', value: 'business' }
//   ];

//   ngOnInit(): void {
//     this.buildForm();
//     this.checkEditMode();
//   }

//   buildForm(): void {
//     this.customerForm = this.fb.group({
//       type: ['individual', Validators.required],
//       name: ['', Validators.required],
//       contactPerson: [''],
//       email: ['', [Validators.email]], // Removed required if optional, add back if needed
//       phone: ['', Validators.required],
//       altPhone: [''],
//       gstNumber: [''],
//       panNumber: [''],
//       avatar: [null],

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

//       openingBalance: [0],
//       creditLimit: [0],
//       paymentTerms: [''],
//       tags: [''],
//       notes: [''],
//       isActive: [true]
//     });
//   }

//   // === 1. Edit Mode Logic ===
//   private checkEditMode(): void {
//     const id = this.route.snapshot.paramMap.get('id');
//     if (id) {
//       this.customerId.set(id);
//       this.editMode.set(true);
//       this.loadCustomerData(id);
//     }
//   }

//   private loadCustomerData(id: string): void {
//     this.customerService.getCustomerDataWithId(id).subscribe({
//       next: (data:any) => {
//         // Patch data into form
//         this.customerForm.patchValue(data);
        
//         // Handle explicit address patching if structure differs slightly
//         if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
//         if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);
//       },
//       error: (err:any) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load customer data.' });
//         this.router.navigate(['/customer']);
//       }
//     });
//   }

//   // === 2. File Upload ===
//   onFileUpload(event: any): void {
//     const file = event.files[0];
//     if (file) {
//         this.customerForm.patchValue({ avatar: file });
//         this.customerForm.get('avatar')?.markAsDirty();
//     }
//   }

//   // === 3. Submit Handler (Create & Update) ===
//   onSubmit(): void {
//     if (this.customerForm.invalid) {
//       this.customerForm.markAllAsTouched();
//       this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill in all required fields.' });
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formData = this.prepareFormData();

//     const request$ = this.editMode()
//         ? this.customerService.updateCustomer(this.customerId()!, formData)
//         : this.customerService.createNewCustomer(formData);

//     request$.subscribe({
//       next: (res) => {
//         this.messageService.add({ 
//             severity: 'success', 
//             summary: 'Success', 
//             detail: this.editMode() ? 'Customer updated successfully.' : 'Customer created successfully.' 
//         });
        
//         // Optional: Navigate back after success
//         setTimeout(() => this.router.navigate(['/customer']), 1000);
//       },
//       error: (err) => {
//         console.error(err);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Operation failed.' });
//         this.isSubmitting.set(false);
//       },
//       complete: () => {
//           // Keep loading false only if staying on page, otherwise navigation handles it
//           if(this.editMode()) this.isSubmitting.set(false); 
//       }
//     });
//   }

//   private prepareFormData(): any {
//     const raw = this.customerForm.getRawValue();
    
//     // If we have a file, we must use FormData
//     // If we are editing and avatar is a string (URL), we might send JSON instead depending on backend
//     // Assuming backend always accepts FormData:
    
//     const fd = new FormData();
    
//     // Recursive function to append nested objects to FormData
//     const appendFormData = (data: any, rootKey: string) => {
//         if (data instanceof File) {
//             fd.append(rootKey, data);
//         } else if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
//             Object.keys(data).forEach(key => {
//                 appendFormData(data[key], rootKey ? `${rootKey}[${key}]` : key);
//             });
//         } else {
//             if (data !== null && data !== undefined) {
//                 fd.append(rootKey, data.toString());
//             }
//         }
//     };

//     // Simple flatten for top level, manual for addresses to match backend expectations
//     // Or use the raw loop you had, adjusted:
//     Object.keys(raw).forEach(key => {
//         if (key === 'billingAddress' || key === 'shippingAddress') {
//              fd.append(key, JSON.stringify(raw[key])); // Many backends prefer JSON string for nested objects in FormData
//         } else if (key === 'avatar') {
//             if (raw.avatar instanceof File) {
//                 fd.append('avatar', raw.avatar);
//             }
//             // If it's a string (existing URL), usually we don't send it back or send null
//         } else {
//              fd.append(key, raw[key]);
//         }
//     });

//     return fd;
//   }
  
//   copyBillingAddress(event: any): void {
//     if (event.checked) {
//       const billingAddress = this.customerForm.get('billingAddress')?.value;
//       this.customerForm.get('shippingAddress')?.patchValue(billingAddress);
//     } else {
//       this.customerForm.get('shippingAddress')?.reset({
//         street: '',
//         city: '',
//         state: '',
//         zipCode: '',
//         country: 'India'
//       });
//     }
//   }
// }
