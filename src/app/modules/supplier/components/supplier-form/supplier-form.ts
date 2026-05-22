import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';

// Services
import { SupplierService } from '../../services/supplier-service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    DividerModule,
    InputNumberModule,
    MultiSelectModule,
    AutoCompleteModule,
    SelectModule,
    MasterDropdownComponent
  ],
  templateUrl: './supplier-form.html',
  styleUrls: ['./supplier-form.scss']
})
export class SupplierFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);

  supplierForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  supplierId: string | null = null;
  formTitle = signal('Create New Supplier');

  constructor() { }

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
      categoryId: [null],
      tags: [[]],
      contacts: this.fb.array([]),
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['India']
      }),
      openingBalance: [0],
      outstandingBalance: [0],
      paymentTerms: [''],
      creditLimit: [0],
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
      finalize(() => this.loadingService.hide()), takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          const data = response.data.data || response.data;
          this.patchForm(data);
        } else if (response !== null) {
          this.messageService.showError('Failed to load supplier data.');
        }
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private patchForm(supplier: any): void {
    while (this.contacts.length !== 0) {
      this.contacts.removeAt(0);
    }

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
      categoryId: supplier.categoryId || null,
      tags: supplier.tags || [],
      contacts: supplier.contacts || [],
      openingBalance: supplier.openingBalance,
      paymentTerms: supplier.paymentTerms,
      creditLimit: supplier.creditLimit,
      isActive: supplier.isActive,
      address: supplier.address || { street: '', city: '', state: '', zipCode: '', country: 'India' },
      bankDetails: supplier.bankDetails || { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' }
    });

    if (supplier.branchesSupplied && Array.isArray(supplier.branchesSupplied)) {
      const branchIds = supplier.branchesSupplied.map((b: any) => typeof b === 'object' ? b._id : b);
      this.supplierForm.get('branchesSupplied')?.setValue(branchIds);
    }
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form: Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.supplierForm.getRawValue();

    const request$ = this.editMode()
      ? this.supplierService.updateSupplier(this.supplierId!, payload)
      : this.supplierService.createSupplier(payload);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess(`Supplier ${this.editMode() ? 'updated' : 'created'} successfully.`);
        setTimeout(() => this.router.navigate(['/suppliers']), 500);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
