import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, of } from 'rxjs'; // <--- NEW: Required for chaining requests

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
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputTextModule, FileUploadModule, ButtonModule, CheckboxModule, CardModule, InputNumberModule, DividerModule, ToastModule, SelectModule, TextareaModule, SkeletonModule, AvatarModule],
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

  // === 1. Edit Mode Logic ===
  private checkEditMode(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const queryId = this.route.snapshot.queryParamMap.get('id');
    const id = routeId || queryId;

    if (id) {
      this.customerId.set(id);
      this.editMode.set(true); // Ensure we set this true
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
          this.customerForm.patchValue(data);
          if (data.avatar) this.currentAvatarUrl = data.avatar;

          // Patch nested addresses safely
          if (data.billingAddress) this.customerForm.get('billingAddress')?.patchValue(data.billingAddress);
          if (data.shippingAddress) this.customerForm.get('shippingAddress')?.patchValue(data.shippingAddress);
        }
        this.loadingData.set(false);
      },
      'Fetch Customer Data'
    );
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
      this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
      return;
    }

    this.isSubmitting.set(true);

    // 1. Extract pure JSON data
    const formValue = this.customerForm.getRawValue();
    const avatarFile = formValue.avatar;

    // 2. Remove avatar from the JSON payload (it's handled separately)
    delete formValue.avatar;

    // 3. Determine if Create or Update
    // Note: Update logic might differ slightly depending on if you want to support 2-step update too
    // For now, let's assume Create uses 2-step, and Update uses standard JSON (or 2-step if you adapt API)

    if (this.editMode()) {
      // --- UPDATE FLOW ---
      // If you updated your Update API to be JSON-only too, use this:
      this.handleUpdate(this.customerId()!, formValue, avatarFile);
    } else {
      // --- CREATE FLOW (2-Step) ---
      this.handleCreate(formValue, avatarFile);
    }
  }

  // Helper for Create Logic
  private handleCreate(jsonData: any, file: File | null) {
    this.customerService.createNewCustomer(jsonData).pipe(
      switchMap((response: any) => {
        // Step 1 Success: We have the new ID
        const newCustomerId = response.data.customer._id; // Adjust based on your actual API response structure

        // Step 2: Check if we need to upload an avatar
        if (file && file instanceof File) {
          return this.customerService.uploadCustomerPhoto(newCustomerId, file);
        } else {
          // No file? Return the original response to finish the chain
          return of(response);
        }
      })
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Created', 'Customer created successfully.');
        this.finishSubmit();
      },
      error: (err) => {
        this.handleError(err);
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
        this.messageService.showSuccess('Updated', 'Customer updated successfully.');
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
    this.messageService.showError('Error', err.error?.message);
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
}