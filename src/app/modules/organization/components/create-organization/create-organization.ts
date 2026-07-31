import { Component, OnInit, inject, signal, DestroyRef, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';
import { AppMessageService } from '../../../../core/services/message.service';

import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { GradientBannerComponent } from '@shared/ui/data/gradient-banner.component';
import { TabBarComponent, TabItem } from '@shared/ui/tabs/tab-bar.component';
import { SectionComponent } from '@shared/ui/layout/section/section.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { PageActionsComponent } from '@shared/ui/layout/page-actions/page-actions.component';
import { ButtonComponent } from "@shared/ui/form/button.component";
import { FloatingSplitLayoutComponent } from "@shared/ui/layout/floating-split-layout.component";

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PasswordModule,
    InputTextModule,
    PageComponent,
    TabBarComponent,
    FieldComponent,
    ButtonComponent,
    FloatingSplitLayoutComponent
  ],
  providers: [AppMessageService],
  templateUrl: './create-organization.html',
})
export class CreateOrganizationComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(AppMessageService);
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);

  isLoading = signal(false);
  activeTab = signal('org');
  myTabs: TabItem[] = [
    { id: 'org', label: 'Organization', emoji: '🏢' },
    { id: 'hq', label: 'Headquarters', emoji: '📍' },
    { id: 'admin', label: 'Super Admin', emoji: '👤' }
  ];
  currentStepIndex = computed(() => this.myTabs.findIndex(t => t.id === this.activeTab()));

  nextStep(): void {
    const idx = this.currentStepIndex();
    if (idx < this.myTabs.length - 1) {
      this.activeTab.set(this.myTabs[idx + 1].id);
    }
  }

  prevStep(): void {
    const idx = this.currentStepIndex();
    if (idx > 0) {
      this.activeTab.set(this.myTabs[idx - 1].id);
    }
  }

  organizationForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.organizationForm = this.fb.group({
      organizationName: ['', [Validators.required, Validators.minLength(3)]],
      uniqueShopId: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i)]],
      mainBranchName: ['Head Office', [Validators.required]],
      mainBranchAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
      }),
      ownerName: ['', Validators.required],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get f() {
    return this.organizationForm.controls;
  }

  protected get step1Valid(): boolean {
    return !this.f['organizationName'].invalid
      && !this.f['uniqueShopId'].invalid
      && !this.f['primaryEmail'].invalid
      && !this.f['primaryPhone'].invalid
      && !this.f['gstNumber'].invalid;
  }

  protected get step2Valid(): boolean {
    return !this.f['mainBranchName'].invalid
      && !this.organizationForm.get('mainBranchAddress')!.invalid;
  }

  protected get step3Valid(): boolean {
    return !this.f['ownerName'].invalid
      && !this.f['ownerEmail'].invalid
      && !this.f['ownerPassword'].invalid;
  }

  generateShopId(): void {
    const name = this.f['organizationName'].value;
    const currentId = this.f['uniqueShopId'].value;
    if (name && !currentId) {
      const generated = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
      this.organizationForm.patchValue({ uniqueShopId: generated });
    }
  }

  onComplete(): void {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      this.messageService.showWarn('Please check all required fields.');
      return;
    }

    this.isLoading.set(true);
    const payload = { ...this.organizationForm.value };
    payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
    if (payload.gstNumber) payload.gstNumber = payload.gstNumber.toUpperCase();

    this.orgService.createNewOrganization(payload)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Organization created! Logging you in…');
          if (res.token) {
            this.authService.handleLoginSuccess(res);
            setTimeout(() => this.router.navigate(['/dashboard']), 1000);
          } else {
            this.router.navigate(['/auth/login']);
          }
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
        },
      });
  }

  getFieldError(controlName: string): string | null {
    const control = this.organizationForm.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'This field is required.';
      if (control.errors?.['email']) return 'Please enter a valid email address.';
      if (control.errors?.['minlength']) return `Minimum length is ${control.errors['minlength'].requiredLength} characters.`;
      if (control.errors?.['pattern']) return 'Invalid format.';
    }
    return null;
  }

  getBranchFieldError(controlName: string): string | null {
    if (controlName === 'mainBranchName') {
      const ctrl = this.organizationForm.get('mainBranchName');
      return ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched) ? 'Branch name is required.' : null;
    }
    const branchGroup = this.organizationForm.get('mainBranchAddress') as FormGroup;
    const control = branchGroup?.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'Field is required.';
    }
    return null;
  }
}