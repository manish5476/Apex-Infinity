import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';
import { CommonModule } from '@angular/common';

// UI Components
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { FloatingSplitLayoutComponent } from '@shared/ui/layout/floating-split-layout.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { ButtonComponent } from '@shared/ui/form/button.component';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-delivery-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    PageComponent,
    FloatingSplitLayoutComponent,
    FieldComponent,
    ButtonComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page>
      <app-floating-split-layout
        imageSrc="https://images.pexels.com/photos/16846298/pexels-photo-16846298.jpeg"
        imageAlt="Apex Delivery Network"
        [reverse]="true">

        <!-- ========================================== -->
        <!-- BRAND OVERLAY: Left side                   -->
        <!-- ========================================== -->
        <div brand-overlay class="relative z-10 flex flex-col h-full justify-between text-white">

          <!-- Top: Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm">
              <i class="pi pi-box text-xl"></i>
            </div>
            <span class="text-2xl font-[var(--font-heading)] font-bold tracking-tight">Apex</span>
          </div>

          <!-- Bottom: Hero Content -->
          <div>
            <i class="pi pi-quote-left text-4xl opacity-40 mb-4 block"></i>
            <h2 class="text-4xl xl:text-5xl font-[var(--font-heading)] font-bold leading-tight mb-6 max-w-lg">
              Get back<br>
              on the<br>
              <em>road.</em>
            </h2>

            <p class="text-[length:var(--font-size-lg)] opacity-80 max-w-md font-light leading-relaxed mb-8">
              If you don't have an email address associated with your account, please contact your store admin directly to reset your password.
            </p>

            <div class="flex gap-3">
              <app-status-badge status="active" label="Secure Recovery" variant="solid" size="sm"></app-status-badge>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- RECOVERY FORM: Right side                   -->
        <!-- ========================================== -->
        <div class="w-full flex flex-col justify-center py-6">

          <!-- Header -->
          <div class="mb-5">
            <h1 class="text-[length:var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)] tracking-tight">
              Forgot Password
            </h1>
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] mt-1">
              Enter your phone or email to receive a password reset link for <span class="font-semibold text-[var(--text-primary)]">{{ orgSlug || 'your store' }}</span>.
            </p>
          </div>

          @if (!successMessage) {
            <!-- Error Banner -->
            @if (error) {
              <div class="mb-4 p-3 rounded-[var(--ui-border-radius)] bg-[var(--color-error-bg)] border border-[var(--color-error-border)] flex items-start gap-3 animate-fade-in">
                <i class="pi pi-exclamation-circle text-[var(--color-error)] text-lg mt-0.5"></i>
                <div class="flex-1">
                  <p class="text-[length:var(--font-size-xs)] text-[var(--color-error-dark)] m-0 font-medium">
                    {{ error }}
                  </p>
                </div>
              </div>
            }

            <!-- Form -->
            <form (ngSubmit)="onSubmit()" #forgotForm="ngForm" class="flex flex-col w-full">

              <!-- Phone or Email -->
              <div class="mb-5">
                <app-field label="Phone Number or Email" [required]="true">
                  <input 
                    pInputText 
                    type="text" 
                    id="phoneOrEmail" 
                    name="phoneOrEmail" 
                    [(ngModel)]="phoneOrEmail" 
                    required
                    placeholder="e.g. agent@example.com or 9876543210" 
                    autocomplete="off"
                    class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
                </app-field>
              </div>

              <!-- Submit Button -->
              <app-button 
                type="submit" 
                variant="primary" 
                [label]="loading ? 'Sending...' : 'Send Reset Link'"
                [icon]="loading ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'" 
                iconPosition="right"
                [loading]="loading" 
                [disabled]="forgotForm.invalid || loading" 
                class="w-full mb-4">
              </app-button>
              
              <app-button 
                type="button" 
                variant="secondary" 
                label="Back to Login"
                [disabled]="loading" 
                (onClick)="goToLogin()"
                class="w-full">
              </app-button>

            </form>
          }

          @if (successMessage) {
            <div class="text-center py-8 animate-fade-in">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success)] mb-6">
                <i class="pi pi-check text-2xl"></i>
              </div>
              <h3 class="text-[length:var(--font-size-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-2">
                Link Sent!
              </h3>
              <p class="text-[length:var(--font-size-md)] text-[var(--text-secondary)] mb-8">
                {{ successMessage }}
              </p>
              
              <app-button 
                type="button" 
                variant="secondary" 
                label="Back to Login"
                (onClick)="goToLogin()"
                class="w-full">
              </app-button>
            </div>
          }

        </div>

      </app-floating-split-layout>
    </app-page>
  `,
  styleUrls: []
})
export class DeliveryForgotPasswordComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  phoneOrEmail = '';
  orgSlug = '';
  loading = false;
  error = '';
  successMessage = '';

  ngOnInit() {
    let currentRoute: import('@angular/router').ActivatedRouteSnapshot | null = this.route.snapshot;
    while (currentRoute) {
      if (currentRoute.paramMap.has('orgSlug')) {
        this.orgSlug = currentRoute.paramMap.get('orgSlug') || '';
        break;
      }
      currentRoute = currentRoute.parent;
    }
  }

  onSubmit() {
    if (!this.orgSlug) {
      this.error = 'Invalid organization scope. Please use your specific store login link.';
      return;
    }

    if (!this.phoneOrEmail) {
      this.error = 'Please enter your phone number or email';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.deliveryService.forgotPassword(this.orgSlug, this.phoneOrEmail)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.message || 'Password reset link sent! Check your email or SMS.';
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to process request';
        }
      });
  }

  goToLogin() {
    if (this.orgSlug) {
      this.router.navigate(['/store', this.orgSlug, 'delivery', 'login']);
    } else {
      this.router.navigate(['/delivery-agent/login']);
    }
  }
}
