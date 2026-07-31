import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PlatformDeliveryService } from '../../services/platform-delivery.service';

// UI Components (Shared)
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { FloatingSplitLayoutComponent } from '@shared/ui/layout/floating-split-layout.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { ButtonComponent } from '@shared/ui/form/button.component';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';

@Component({
  selector: 'app-platform-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    // UI Components
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
        imageAlt="Apex Network Global Logistics"
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
              Hit the road<br>
              with <em>impact.</em>
            </h2>

            <div class="flex items-center justify-between mt-8">
              <div class="flex items-center gap-4 text-sm font-medium tracking-widest opacity-80">
                <span>Global</span>
                <span class="w-12 border-b border-white/30"></span>
                <span>Secure</span>
              </div>
              <div class="flex gap-3">
                <app-status-badge status="active" label="Network" variant="solid" size="sm"></app-status-badge>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- LOGIN FORM: Right side                      -->
        <!-- ========================================== -->
        <div class="w-full flex flex-col justify-center py-6">

          <!-- Header -->
          <div class="mb-6">
            <h1 class="text-[length:var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)] tracking-tight">
              Network Login
            </h1>
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] mt-1">
              Welcome back! Please enter your details.
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

            <!-- Phone -->
            <div class="mb-4">
              <app-field label="Phone Number" [required]="true">
                <input 
                  pInputText 
                  type="tel" 
                  name="phone" 
                  [(ngModel)]="credentials.phone" 
                  required
                  placeholder="e.g. 9876543210" 
                  autocomplete="tel"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Password -->
            <div class="mb-4">
              <app-field label="Password" [required]="true">
                <div class="relative">
                  <p-password 
                    name="password" 
                    [(ngModel)]="credentials.password" 
                    required
                    placeholder="Enter password" 
                    styleClass="w-full"
                    inputStyleClass="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5">
                  </p-password>
                  <a routerLink="/apex-delivery/forgot-password" 
                     class="absolute right-12 top-1/2 -translate-y-1/2 text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors focus:outline-none">
                    Forgot?
                  </a>
                </div>
              </app-field>
            </div>

            <!-- Submit -->
            <app-button 
              type="submit" 
              variant="primary" 
              [label]="loading ? 'Logging in...' : 'Secure Login'"
              [icon]="loading ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'" 
              iconPosition="right"
              [loading]="loading" 
              [disabled]="loginForm.invalid || loading" 
              class="w-full">
            </app-button>

          </form>

          <!-- Footer Links -->
          <div class="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 w-full text-[length:var(--font-size-xs)]">
            <div class="flex items-center gap-1">
              <span class="text-[var(--text-tertiary)]">Don't have an account?</span>
              <a routerLink="/apex-delivery/register" class="text-[var(--accent-primary)] font-medium hover:underline transition-colors focus:outline-none">
                Sign up
              </a>
            </div>
          </div>

        </div>

      </app-floating-split-layout>
    </app-page>
  `,
  styleUrls: ['./platform-login.component.scss'] // We will create this cleaner SCSS file
})
export class PlatformLoginComponent {
  private platformService = inject(PlatformDeliveryService);
  private router = inject(Router);

  credentials = { phone: '', password: '' };
  loading = false;
  error = '';

  onSubmit() {
    this.loading = true;
    this.error = '';

    this.platformService.login(this.credentials.phone, this.credentials.password).subscribe({
      next: (res) => {
        this.platformService.setToken(res.token);
        this.router.navigate(['/apex-delivery/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}