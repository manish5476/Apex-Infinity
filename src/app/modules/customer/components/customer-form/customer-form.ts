import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CustomerService } from '../../services/customer-service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { Select } from 'primeng/select';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,Select,
    FileUploadModule,
    ButtonModule,
    CheckboxModule,
    CardModule,
    InputNumberModule,
    DividerModule,
    ToastModule,
    RippleModule
  ],
  providers: [MessageService],
  templateUrl: './customer-form.html',
  styleUrls: ['./customer-form.scss']
})
export class CustomerForm implements OnInit {
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  isSubmitting = signal(false);
  customerForm!: FormGroup;
  customerTypes = [
    { label: 'Individual', value: 'individual' },
    { label: 'Business', value: 'business' }
  ];
  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
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

  onFileUpload(event: any): void {
    const file = event.files[0];
    if (file) this.customerForm.patchValue({ avatar: file });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.prepareFormData();

    this.customerService.createNewCustomer(formData).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Customer created successfully.' });
        this.customerForm.reset({ type: 'individual', isActive: true });
        this.isSubmitting.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create customer.' });
        this.isSubmitting.set(false);
      }
    });
  }

  private prepareFormData(): any {
    const raw = this.customerForm.getRawValue();
    if (raw.avatar instanceof File) {
      const fd = new FormData();
      Object.entries(raw).forEach(([key, value]) => {
        if (typeof value !== 'object' || value === null) fd.append(key, value as any);
      });
      fd.append('avatar', raw.avatar);
      return fd;
    }

    return raw;
  }
  
  copyBillingAddress(event: any): void {
    if (event.checked) {
      // Get the billing address values
      const billingAddress = this.customerForm.get('billingAddress')?.value;
      
      // Patch them into the shipping address
      this.customerForm.get('shippingAddress')?.patchValue(billingAddress);
    } else {
      // Clear the shipping address if unchecked
      this.customerForm.get('shippingAddress')?.reset({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      });
    }
  }
}
