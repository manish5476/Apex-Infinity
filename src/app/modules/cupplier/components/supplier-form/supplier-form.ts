import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Added RouterModule

import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select'; 

// Services
import { SupplierService } from '../../services/supplier-service'; // Ensure path
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    DividerModule,
    InputNumberModule,
    MultiSelectModule,
    SelectModule,
  ],
  templateUrl: './supplier-form.html',
  styleUrls: ['./supplier-form.scss']
})
export class SupplierFormComponent implements OnInit {
  // --- Injected Services ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  private masterList = inject(MasterListService);

  // --- Form & State ---
  supplierForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  supplierId: string | null = null;
  formTitle = signal('Create New Supplier');

  // --- Master Data Signals ---
  // Mapping branches to label/value for MultiSelect
  branchOptions = signal<any[]>([]);

  constructor() {
    // Transform master list branches for MultiSelect compatibility
    effect(() => {
       const branches = this.masterList.branches();
       if(branches && branches.length > 0) {
          this.branchOptions.set(branches.map(b => ({ label: b.name, value: b._id })));
       }
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEditMode();
  }

  private buildForm(): void {
    this.supplierForm = this.fb.group({
      // Business Details
      companyName: ['', Validators.required],
      contactPerson: [''],
      email: ['', [Validators.email]],
      phone: [''],
      altPhone: [''],
      gstNumber: [''],
      panNumber: [''],
      
      // Address Sub-Form
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['India']
      }),
      
      // Financials
      openingBalance: [0],
      paymentTerms: [''], // String, e.g. "Net 30"
      
      // Relationship (Array of IDs)
      branchesSupplied: [[]], 
      
      // Status
      isActive: [true]
    });
  }

  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.supplierId = params.get('id');
        if (this.supplierId) {
          // this.editMode.set(true);
          this.formTitle.set('Edit Supplier');
          this.loadingService.show();
          return this.supplierService.getSupplierById(this.supplierId);
        }
        return of(null); // Create mode
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          // Handle nested response if needed (response.data.data vs response.data)
          const data = response.data.data || response.data;
          this.patchForm(data);
        } else if (response !== null) {
          this.messageService.showError('Error', 'Failed to load supplier data');
        }
      },
      error: (err) => {
         console.error(err);
         this.messageService.showError('Error', err.error?.message);
      }
    });
  }

  private patchForm(supplier: any): void {
    // 1. Patch top-level fields
    this.supplierForm.patchValue({
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        altPhone: supplier.altPhone,
        gstNumber: supplier.gstNumber,
        panNumber: supplier.panNumber,
        openingBalance: supplier.openingBalance,
        paymentTerms: supplier.paymentTerms,
        isActive: supplier.isActive,
        
        // 2. Patch Nested Address
        address: supplier.address || {
            street: '', city: '', state: '', zipCode: '', country: 'India'
        }
    });

    // 3. Patch Branches (Ensure it's an array of IDs for MultiSelect)
    // The backend might populate them (objects), so we map back to IDs if necessary
    if (supplier.branchesSupplied && Array.isArray(supplier.branchesSupplied)) {
       const branchIds = supplier.branchesSupplied.map((b: any) => 
          typeof b === 'object' ? b._id : b
       );
       this.supplierForm.get('branchesSupplied')?.setValue(branchIds);
    }
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.messageService.showError('Invalid Form', 'Please fill in all required fields.');
      return;
    }

    // this.isSubmitting.set(true);
    const payload = this.supplierForm.getRawValue();

    const request$ = this.editMode()
      ? this.supplierService.updateSupplier(this.supplierId!, payload)
      : this.supplierService.createSupplier(payload);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Supplier ${this.editMode() ? 'updated' : 'created'} successfully.`);
        
        // Refresh master list if this service exists
        // this.masterList.refreshSuppliers(); 

        // Navigate to details or list
        setTimeout(() => this.router.navigate(['/suppliers']), 500);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save supplier.');
      }
    });
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// // 
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { CheckboxModule } from 'primeng/checkbox';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { SelectModule } from 'primeng/select'; // Added for peer dependency
// // import { InputTextareaModule } from 'primeng/inputtextarea'; // Added for consistency
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { SupplierService } from '../../services/supplier-service';
// import { Textarea } from 'primeng/textarea';

// @Component({
//   selector: 'app-supplier-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     ButtonModule,
//     InputTextModule,
//     CheckboxModule,
//     DividerModule,
//     InputNumberModule,
//     MultiSelectModule,
//     SelectModule, // Added
//   ],
//   templateUrl: './supplier-form.html',
//   styleUrls: ['./supplier-form.scss']
// })
// export class SupplierFormComponent implements OnInit {
//   // --- Injected Services ---
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private supplierService = inject(SupplierService);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);
//   private masterList = inject(MasterListService);

//   // --- Form & State ---
//   supplierForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   supplierId: string | null = null;
//   formTitle = signal('Create New Supplier');

//   // --- Master Data Signals ---
//   branchOptions = signal<any[]>([]);

//   constructor() {
//     // Format branches for MultiSelect
//     this.branchOptions.set(
//       this.masterList.branches().map(b => ({ label: b.name, value: b._id }))
//     );
//   }

//   ngOnInit(): void {
//     this.buildForm();
//     this.checkRouteForEditMode();
//   }

//   private checkRouteForEditMode(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         this.supplierId = params.get('id');
//         if (this.supplierId) {
          // this.editMode.set(true);
//           this.formTitle.set('Edit Supplier');
//           this.loadingService.show();
//           return this.supplierService.getSupplierById(this.supplierId);
//         }
//         return of(null); // Create mode
//       }),
//       finalize(() => this.loadingService.hide())
//     ).subscribe({
//       next: (response) => {
//         if (response && response.data && response.data.data) {
//           this.patchForm(response.data.data);
//         } else if (response) {
//           this.messageService.showError('Error', 'Failed to load supplier data');
//         }
//       },
//       error: (err) => this.messageService.showError('Error', err.error?.message)
//     });
//   }

//   private buildForm(): void {
//     this.supplierForm = this.fb.group({
//       // Business Details
//       companyName: ['', Validators.required],
//       contactPerson: [''],
//       email: ['', [Validators.email]],
//       phone: [''],
//       altPhone: [''],
//       gstNumber: [''],
//       panNumber: [''],
      
//       // Address Sub-Form
//       address: this.fb.group({
//         street: [''],
//         city: [''],
//         state: [''],
//         zipCode: [''],
//         country: ['India', Validators.required]
//       }),
      
//       // Financials
//       openingBalance: [0],
//       paymentTerms: [''],
      
//       // Relationship
//       branchesSupplied: [[]], // For p-multiSelect
      
//       // Status
//       isActive: [true]
//     });
//   }

//   private patchForm(supplier: any): void {
//     // patchValue is smart enough to set the nested 'address' group
//     this.supplierForm.patchValue(supplier);
//   }

//   onSubmit(): void {
//     if (this.supplierForm.invalid) {
//       this.supplierForm.markAllAsTouched();
//       this.messageService.showError('Invalid Form', 'Please check all required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const payload = this.supplierForm.getRawValue();

//     const saveObservable = this.editMode()
//       ? this.supplierService.updateSupplier(this.supplierId!, payload)
//       : this.supplierService.createSupplier(payload);

//     saveObservable.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: (res) => {
//         this.messageService.showSuccess('Success', `Supplier ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         // Notify master list that suppliers have changed
//         this.masterList.refresh();
//         // this.masterList.notifyDataChange('suppliers');
//         // Navigate to the details page
//         this.router.navigate(['/suppliers', res.data._id]); 
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save supplier.');
//       }
//     });
//   }
// }
