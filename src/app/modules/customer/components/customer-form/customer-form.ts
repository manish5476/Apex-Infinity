import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, of, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

// Shared
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

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
  imports: [ReactiveFormsModule, FormsModule, RouterModule, DatePipe, InputTextModule, FileUploadModule, ButtonModule, CheckboxModule, CardModule, InputNumberModule, DividerModule, ToastModule, SelectModule, TextareaModule, SkeletonModule, AvatarModule, MasterDropdownComponent],
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
  // Fix NG0203: inject DestroyRef as a field so takeUntilDestroyed() can be
  // called from any method, not just the constructor / injection context.
  private readonly destroyRef = inject(DestroyRef);

  // Signals
  isSubmitting = signal(false);
  loadingData = signal(false);
  editMode = signal(false);
  customerId = signal<string | null>(null);
  duplicateCustomer = signal<any>(null);

  // Guarantors signals
  guarantors = signal<any[]>([]);           // populated list from server
  addingGuarantor = signal(false);          // is the add-form visible
  savingGuarantor = signal(false);          // API call in progress
  removingGuarantorId = signal<string | null>(null); // which row is being removed
  pendingGuarantorId: string | null = null; // selected from dropdown
  pendingGuarantorNotes = '';               // notes input

  // Guaranteed Customers
  guaranteedCustomers = signal<any[]>([]);
  loadingGuaranteed = signal(false);

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
    this.setupDuplicateCheck();
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
      avatar: [null], // Stores the File object

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

  // === Duplicate Check Component ===
  private setupDuplicateCheck(): void {
    this.customerForm.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged((prev, curr) =>
        prev.name === curr.name &&
        prev.email === curr.email &&
        prev.phone === curr.phone
      ),
      // Pass destroyRef so this works when called outside the constructor
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(values => {
      this.performDuplicateCheck(values);
    });
  }

  private performDuplicateCheck(values: any): void {
    const { name, email, phone } = values;

    if (!name?.trim() && !email?.trim() && !phone?.trim()) {
      this.duplicateCustomer.set(null);
      return;
    }

    const params: any = {};
    if (name?.trim()) params.name = name.trim();
    if (email?.trim()) params.email = email.trim();
    if (phone?.trim()) params.phone = phone.trim();

    this.customerService.checkDuplicate(params).subscribe({
      next: (res: any) => {
        if (res.isDuplicate && res.existingCustomer) {
          if (this.editMode() && res.existingCustomer._id === this.customerId()) {
            this.duplicateCustomer.set(null);
          } else {
            this.duplicateCustomer.set(res.existingCustomer);
          }
        } else {
          this.duplicateCustomer.set(null);
        }
      },
      error: () => this.duplicateCustomer.set(null)
    });
  }


  // === 1. Edit Mode Logic ===
  private checkEditMode(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const queryId = this.route.snapshot.queryParamMap.get('id');
    const id = routeId || queryId;

    if (id) {
      this.customerId.set(id);
      // Fix NG0100: defer the signal write past the current CD cycle so
      // Angular does not see a value change after it has already checked.
      setTimeout(() => this.editMode.set(true));
      this.loadCustomerData(id);
    }
  }

  private loadCustomerData(id: string): void {
    this.loadingData.set(true);
    this.common.apiCall(
      this.customerService.getCustomerWithGuarantors(id),
      (response: any) => {
        const data = response.data?.customer || response.data?.data || response.data || response;
        if (data) {
          this.customerForm.patchValue(data);
          if (data.avatar) this.currentAvatarUrl = data.avatar;

          // Patch nested addresses safely
          if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
          if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);

          // Hydrate guarantors list — each entry has customerId populated with name/phone/isActive
          if (data.guarantors) this.guarantors.set(data.guarantors);
        }
        this.loadingData.set(false);
      }
    );

    // Also fetch guaranteed customers
    this.loadingGuaranteed.set(true);
    this.customerService.getGuaranteedCustomers(id).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        if (Array.isArray(data)) {
          this.guaranteedCustomers.set(data);
        }
        this.loadingGuaranteed.set(false);
      },
      error: (error) => {
        console.error('Failed to load guaranteed customers:', error);
        this.loadingGuaranteed.set(false);
      }
    });
  }

  onFileUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      this.customerForm.patchValue({ avatar: file });
      this.customerForm.get('avatar')?.markAsDirty();

      const reader = new FileReader();
      reader.onload = (e: any) => this.currentAvatarUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // === 3. Updated Submit Handler (Two-Step Process) ===
  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      // Combined the title and detail into a single warning string
      this.messageService.showWarn('Validation Error: Please check the highlighted fields.');
      return;
    }

    this.isSubmitting.set(true);

    // 1. Extract pure JSON data
    const formValue = this.customerForm.getRawValue();
    const avatarFile = formValue.avatar;

    // 2. Remove avatar from the JSON payload (it's handled separately)
    delete formValue.avatar;

    if (this.editMode()) {
      this.handleUpdate(this.customerId()!, formValue, avatarFile);
    } else {
      this.handleCreate(formValue, avatarFile);
    }
  }
  private handleCreate(jsonData: any, file: File | null) {
    this.customerService.createNewCustomer(jsonData).pipe(
      switchMap((response: any) => {
        const newCustomerId = response.data.customer._id;
        if (file && file instanceof File) {
          return this.customerService.uploadCustomerPhoto(newCustomerId, file);
        } else {
          return of(response);
        }
      })
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess(res.message);
        this.finishSubmit();
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private handleUpdate(id: string, jsonData: any, file: File | null) {
    this.customerService.updateCustomer(id, jsonData).pipe(
      switchMap((response: any) => {
        if (file && file instanceof File) {
          return this.customerService.uploadCustomerPhoto(id, file);
        } else {
          return of(response);
        }
      })
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Customer updated successfully.');
        this.finishSubmit();
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private finishSubmit() {
    this.isSubmitting.set(false);
    setTimeout(() => this.router.navigate(['/customer']), 500);
  }

  private handleError(err: any) {
    this.isSubmitting.set(false);
    console.error('Error:', err);

    // Completely replaced the manual extraction with your robust global handler
    this.messageService.handleHttpError(err);
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

  isFieldInvalid(field: string): boolean {
    const control = this.customerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // ─── Guarantors UI Helpers ─────────────────────────────────────────────────

  /** Show the guarantor add-form */
  showAddGuarantorForm(): void {
    this.pendingGuarantorId = null;
    this.pendingGuarantorNotes = '';
    this.addingGuarantor.set(true);
  }

  cancelAddGuarantor(): void {
    this.addingGuarantor.set(false);
    this.pendingGuarantorId = null;
    this.pendingGuarantorNotes = '';
  }

  /** Called when the operator confirms adding a guarantor */
  confirmAddGuarantor(): void {
    const id = this.customerId();
    if (!id || !this.pendingGuarantorId) {
      this.messageService.showWarn('Please select a guarantor customer first.');
      return;
    }

    this.savingGuarantor.set(true);
    this.customerService.addGuarantor(id, {
      guarantorId: this.pendingGuarantorId,
      notes: this.pendingGuarantorNotes || undefined,
    }).subscribe({
      next: (res: any) => {
        this.messageService.showSuccess(res.message || 'Guarantor added.');
        // Reload guarantors from the enriched endpoint
        this.reloadGuarantors(id);
        this.cancelAddGuarantor();
        this.savingGuarantor.set(false);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
        this.savingGuarantor.set(false);
      },
    });
  }

  /** Remove a guarantor entry */
  removeGuarantor(guarantorCustomerId: string): void {
    const id = this.customerId();
    if (!id) return;

    this.removingGuarantorId.set(guarantorCustomerId);
    this.customerService.removeGuarantor(id, guarantorCustomerId).subscribe({
      next: () => {
        this.messageService.showSuccess('Guarantor removed.');
        this.guarantors.update(list =>
          list.filter(g => (g.customerId?._id || g.customerId) !== guarantorCustomerId)
        );
        this.removingGuarantorId.set(null);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
        this.removingGuarantorId.set(null);
      },
    });
  }

  private reloadGuarantors(customerId: string): void {
    this.customerService.getCustomerWithGuarantors(customerId).subscribe({
      next: (res: any) => {
        const data = res.data?.customer || res.data;
        if (data?.guarantors) this.guarantors.set(data.guarantors);
      },
      error: () => { },
    });
  }

  /** Resolve display name from a populated or raw guarantor entry */
  getGuarantorName(entry: any): string {
    return entry.customerId?.name ?? 'Unknown';
  }

  getGuarantorPhone(entry: any): string {
    return entry.customerId?.phone ?? '';
  }

  isGuarantorInactive(entry: any): boolean {
    return entry.customerId?.isActive === false;
  }
}