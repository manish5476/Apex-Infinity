import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../../core/services/api';
@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
  providers: [MessageService] // Provide MessageService here if not globally provided
})
export class CreateOrganization implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // --- State Signals ---
  isLoading = signal(false);

  // --- Forms ---
  organizationForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initializes the reactive form based on the organization schema.
   */
  private initForm(): void {
    this.organizationForm = this.fb.group({
      name: ['', [Validators.required]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required]],
      gstNumber: [''],
      secondaryEmail: ['', [Validators.email]],
      secondaryPhone: [''],
    });
  }

  /**
   * Helper getter for easy access to form controls in the template.
   */
  get form() {
    return this.organizationForm.controls;
  }

  /**
   * Handles the form submission.
   */
  onSubmit(): void {
    if (this.organizationForm.invalid) {
      // Mark all fields as touched to display validation errors
      this.organizationForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly.'
      });
      return;
    }

    this.isLoading.set(true);
    const formData = this.organizationForm.value;

    // Optional: Transform data before sending
    formData.uniqueShopId = formData.uniqueShopId.toUpperCase();
    if (formData.gstNumber) {
      formData.gstNumber = formData.gstNumber.toUpperCase();
    }

    this.apiService.createNewOrganization(formData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Organization Created',
          detail: `Organization "${response.name}" created successfully!`
        });

        // Navigate to the new organization's dashboard or a relevant page
        // You might need to adjust this path based on your routing
        setTimeout(() => {
          this.router.navigate(['/organization', response._id, 'dashboard']);
        }, 1500);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        // The error interceptor should ideally handle this,
        // but a fallback is good.
        this.messageService.add({
          severity: 'error',
          summary: 'Creation Failed',
          detail: err.error?.message || 'There was an error creating the organization.'
        });
        console.error('Create organization failed:', err);
      }
    });
  }
}
