import { Component, Inject, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../../core/services/api';
import { AuthService, LoginResponse } from '../../../auth/services/auth-service';
import { PasswordModule } from 'primeng/password'; // Import PasswordModule
import { MasterListService } from '../../../../core/services/master-list.service';
@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    InputTextModule,
    ButtonModule,
    PasswordModule // Add PasswordModule
    ,
    RouterLink
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
  providers: [MessageService] // ToastModule requires this
})
export class CreateOrganization implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private masterList = inject(MasterListService); // Inject MasterListService

  // --- State Signals ---
  isLoading = signal(false);

  // --- Forms ---
  organizationForm!: FormGroup;

  public isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initializes the reactive form based on the organization schema.
   */
  private initForm(): void {
    this.organizationForm = this.fb.group({
      // --- Organization Fields ---
      organizationName: ['', [Validators.required]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required]],
      gstNumber: [''],
      // secondaryEmail: ['', [Validators.email]], // Optional
      // secondaryPhone: [''], // Optional

      // --- Owner (Super Admin) Fields ---
      ownerName: ['', [Validators.required]],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPassword: ['', [Validators.required, Validators.minLength(8)]],

      // --- Main Branch Fields ---
      mainBranchName: ['Main Branch', [Validators.required]],
      mainBranchAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
      })
    });
  }


  // --- Form Getters ---
  get form() {
    return this.organizationForm.controls;
  }

  get branchForm() {
    return (this.organizationForm.get('mainBranchAddress') as FormGroup).controls;
  }

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

    formData.uniqueShopId = formData.uniqueShopId.toUpperCase();
    if (formData.gstNumber) {
      formData.gstNumber = formData.gstNumber.toUpperCase();
    }

    this.apiService.createNewOrganization(formData).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Organization Created',
          detail: `Welcome, ${response?.data.owner}!`
        });
        
        // Use the injected MasterListService
        this.masterList.load(); 
        this.authService.handleLoginSuccess(response);
      },
      error: (err: any) => {
        this.isLoading.set(false);
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
