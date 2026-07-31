import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-delivery-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
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
              Deliver<br>
              with<br>
              <em>precision.</em>
            </h2>

            <p class="text-[length:var(--font-size-lg)] opacity-80 max-w-md font-light leading-relaxed mb-8">
              Access real-time order tracking, customer delivery details, and instant proof-of-delivery tools on the go.
            </p>

            <div class="flex gap-3">
              <app-status-badge status="active" label="Store Fleet" variant="solid" size="sm"></app-status-badge>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- LOGIN FORM: Right side                      -->
        <!-- ========================================== -->
        <div class="w-full flex flex-col justify-center py-6">

          <!-- Header -->
          <div class="mb-5">
            <h1 class="text-[length:var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)] tracking-tight">
              Agent Login
            </h1>
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] mt-1">
              Login to manage assigned orders for <span class="font-semibold text-[var(--text-primary)]">{{ orgSlug || 'your store' }}</span>
            </p>
          </div>

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
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="flex flex-col w-full">

            <!-- Phone Number -->
            <div class="mb-4">
              <app-field label="Phone Number" [required]="true">
                <input 
                  pInputText 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  [(ngModel)]="credentials.phone" 
                  required
                  placeholder="e.g. 9876543210" 
                  autocomplete="tel"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Password -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-1.5">
                <label for="password" class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">Password <span class="text-[var(--color-error)]">*</span></label>
                <a (click)="goToForgotPassword()" class="text-[length:var(--font-size-xs)] text-[var(--accent-primary)] hover:underline cursor-pointer font-medium focus:outline-none">Forgot?</a>
              </div>
              <p-password 
                name="password" 
                [(ngModel)]="credentials.password" 
                required
                [toggleMask]="true" 
                [feedback]="false"
                placeholder="Enter password" 
                styleClass="w-full"
                inputStyleClass="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5">
              </p-password>
            </div>

            <!-- Submit Button -->
            <app-button 
              type="submit" 
              variant="primary" 
              [label]="loading ? 'Signing in...' : 'Secure Login'"
              [icon]="loading ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'" 
              iconPosition="right"
              [loading]="loading" 
              [disabled]="loginForm.invalid || loading" 
              class="w-full">
            </app-button>

          </form>
          
          <!-- Footer Links -->
          <div class="mt-5 flex flex-col items-center justify-center gap-2 w-full text-[length:var(--font-size-xs)]">
            <div class="flex items-center gap-1">
              <span class="text-[var(--text-tertiary)]">Not an agent?</span>
              <a routerLink="/" class="text-[var(--accent-primary)] font-medium hover:underline transition-colors focus:outline-none">
                Back to Home
              </a>
            </div>
          </div>

        </div>

      </app-floating-split-layout>
    </app-page>
  `,
  styleUrls: []
})
export class DeliveryLoginComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials = {
    phone: '',
    password: ''
  };

  orgSlug = '';
  loading = false;
  error = '';

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

    if (!this.credentials.phone || !this.credentials.password) {
      this.error = 'Please fill all required fields';
      return;
    }

    this.loading = true;
    this.error = '';

    this.deliveryService.login(this.orgSlug, this.credentials.phone, this.credentials.password)
      .subscribe({
        next: (res) => {
          localStorage.setItem(`delivery_token_${this.orgSlug}`, res.token);
          this.router.navigate(['/store', this.orgSlug, 'delivery', 'dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Invalid credentials';
        }
      });
  }

  goToForgotPassword() {
    if (this.orgSlug) {
      this.router.navigate(['/store', this.orgSlug, 'delivery', 'forgot-password']);
    } else {
      this.router.navigate(['/delivery-agent/forgot-password']);
    }
  }
}