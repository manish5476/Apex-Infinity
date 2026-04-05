import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
import { SupplierService } from '../../services/supplier-service'; 
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
    MultiSelectModule,AutoCompleteModule,
    SelectModule,
  ],
  templateUrl: './supplier-form.html',
  styleUrls: ['./supplier-form.scss']
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  private masterList = inject(MasterListService);

  supplierForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  supplierId: string | null = null;
  formTitle = signal('Create New Supplier');

  branchOptions = signal<any[]>([]);
  
  // Department options based on backend enum
  departmentOptions = [
    { label: 'Sales', value: 'Sales' },
    { label: 'Accounts', value: 'Accounts' },
    { label: 'Support', value: 'Support' },
    { label: 'Management', value: 'Management' },
    { label: 'Other', value: 'Other' }
  ];

  constructor() {
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
      companyName: ['', Validators.required],
      contactPerson: [''],
      email: ['', [Validators.email]],
      phone: [''],
      altPhone: [''],
      gstNumber: [''],
      panNumber: [''],
      
      // New Core Fields
      category: [''],
      tags: [[]],
      
      // Dynamic Contacts Array
      contacts: this.fb.array([]),

      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['India']
      }),
      
      // Financials & Credit Guard
      openingBalance: [0],
      outstandingBalance: [0],
      paymentTerms: [''],
      creditLimit: [0], 
      
      // New Bank Details FormGroup
      bankDetails: this.fb.group({
        accountName: [''],
        accountNumber: [''],
        bankName: [''],
        ifscCode: [''],
        branch: ['']
      }),

      branchesSupplied: [[]], 
      isActive: [true]
    });
  }

  // --- Dynamic Form Array Methods ---
  get contacts(): FormArray {
    return this.supplierForm.get('contacts') as FormArray;
  }

  createContactGroup(): FormGroup {
    return this.fb.group({
      name: [''],
      department: ['Other'],
      phone: [''],
      email: ['', Validators.email],
      isPrimary: [false]
    });
  }

  addContact(): void {
    this.contacts.push(this.createContactGroup());
  }

  removeContact(index: number): void {
    this.contacts.removeAt(index);
  }
private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.supplierId = params.get('id');
        if (this.supplierId) {
          this.editMode.set(true);
          this.formTitle.set('Edit Supplier');
          return this.supplierService.getSupplierById(this.supplierId);
        }
        return of(null);
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          const data = response.data.data || response.data;
          this.patchForm(data);
        } else if (response !== null) {
          // Simplified to a single string
          this.messageService.showError('Failed to load supplier data.');
        }
      },
      error: (err) => {
         console.error(err);
         // Let your global handler do the parsing!
         this.messageService.handleHttpError(err);
      }
    });
  }

  private patchForm(supplier: any): void {
    // Clear existing dynamic contacts
    while (this.contacts.length !== 0) {
      this.contacts.removeAt(0);
    }
    
    // Setup contact FormGroups based on backend data
    if (supplier.contacts && supplier.contacts.length > 0) {
      supplier.contacts.forEach(() => this.contacts.push(this.createContactGroup()));
    }

    this.supplierForm.patchValue({
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        altPhone: supplier.altPhone,
        gstNumber: supplier.gstNumber,
        panNumber: supplier.panNumber,
        
        category: supplier.category,
        tags: supplier.tags || [],
        contacts: supplier.contacts || [],

        openingBalance: supplier.openingBalance,
        paymentTerms: supplier.paymentTerms,
        creditLimit: supplier.creditLimit,
        isActive: supplier.isActive,
        
        address: supplier.address || {
            street: '', city: '', state: '', zipCode: '', country: 'India'
        },
        
        bankDetails: supplier.bankDetails || {
            accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: ''
        }
    });

    if (supplier.branchesSupplied && Array.isArray(supplier.branchesSupplied)) {
       const branchIds = supplier.branchesSupplied.map((b: any) => typeof b === 'object' ? b._id : b);
       this.supplierForm.get('branchesSupplied')?.setValue(branchIds);
    }
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      // Changed from showError to showWarn for validation, and combined into one string
      this.messageService.showWarn('Invalid Form: Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.supplierForm.getRawValue();

    const request$ = this.editMode()
      ? this.supplierService.updateSupplier(this.supplierId!, payload)
      : this.supplierService.createSupplier(payload);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        // Removed the extra 'Success' argument
        this.messageService.showSuccess(`Supplier ${this.editMode() ? 'updated' : 'created'} successfully.`);
        setTimeout(() => this.router.navigate(['/suppliers']), 500);
      },
      error: (err) => {
        // Replaced the manual extraction with the global HTTP error handler
        this.messageService.handleHttpError(err);
      }
    });
  }

  // private checkRouteForEditMode(): void {
  //   this.route.paramMap.pipe(
  //     switchMap(params => {
  //       this.supplierId = params.get('id');
  //       if (this.supplierId) {
  //         this.editMode.set(true);
  //         this.formTitle.set('Edit Supplier');
  //         return this.supplierService.getSupplierById(this.supplierId);
  //       }
  //       return of(null);
  //     }),
  //     finalize(() => this.loadingService.hide())
  //   ).subscribe({
  //     next: (response) => {
  //       if (response && response.data) {
  //         const data = response.data.data || response.data;
  //         this.patchForm(data);
  //       } else if (response !== null) {
  //         this.messageService.showError('Error', 'Failed to load supplier data');
  //       }
  //     },
  //     error: (err) => {
  //        console.error(err);
  //        this.messageService.showError('Error', err.error?.message);
  //     }
  //   });
  // }

  // private patchForm(supplier: any): void {
  //   // Clear existing dynamic contacts
  //   while (this.contacts.length !== 0) {
  //     this.contacts.removeAt(0);
  //   }
    
  //   // Setup contact FormGroups based on backend data
  //   if (supplier.contacts && supplier.contacts.length > 0) {
  //     supplier.contacts.forEach(() => this.contacts.push(this.createContactGroup()));
  //   }

  //   this.supplierForm.patchValue({
  //       companyName: supplier.companyName,
  //       contactPerson: supplier.contactPerson,
  //       email: supplier.email,
  //       phone: supplier.phone,
  //       altPhone: supplier.altPhone,
  //       gstNumber: supplier.gstNumber,
  //       panNumber: supplier.panNumber,
        
  //       category: supplier.category,
  //       tags: supplier.tags || [],
  //       contacts: supplier.contacts || [],

  //       openingBalance: supplier.openingBalance,
  //       paymentTerms: supplier.paymentTerms,
  //       creditLimit: supplier.creditLimit,
  //       isActive: supplier.isActive,
        
  //       address: supplier.address || {
  //           street: '', city: '', state: '', zipCode: '', country: 'India'
  //       },
        
  //       bankDetails: supplier.bankDetails || {
  //           accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: ''
  //       }
  //   });

  //   if (supplier.branchesSupplied && Array.isArray(supplier.branchesSupplied)) {
  //      const branchIds = supplier.branchesSupplied.map((b: any) => typeof b === 'object' ? b._id : b);
  //      this.supplierForm.get('branchesSupplied')?.setValue(branchIds);
  //   }
  // }

  // onSubmit(): void {
  //   if (this.supplierForm.invalid) {
  //     this.supplierForm.markAllAsTouched();
  //     this.messageService.showError('Invalid Form', 'Please fill in all required fields.');
  //     return;
  //   }

  //   this.isSubmitting.set(true);
  //   const payload = this.supplierForm.getRawValue();

  //   const request$ = this.editMode()
  //     ? this.supplierService.updateSupplier(this.supplierId!, payload)
  //     : this.supplierService.createSupplier(payload);

  //   request$.pipe(
  //     finalize(() => this.isSubmitting.set(false))
  //   ).subscribe({
  //     next: (res) => {
  //       this.messageService.showSuccess('Success', `Supplier ${this.editMode() ? 'updated' : 'created'} successfully.`);
  //       setTimeout(() => this.router.navigate(['/suppliers']), 500);
  //     },
  //     error: (err) => {
  //       this.messageService.showError('Error', err.error?.message || 'Failed to save supplier.');
  //     }
  //   });
  // }
}
