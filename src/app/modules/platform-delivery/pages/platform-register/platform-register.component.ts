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

// PrimeNG
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-platform-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    PasswordModule,
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
              Scale<br>
              your<br>
              <em>network.</em>
            </h2>

            <div class="flex items-center justify-between mt-8">
              <div class="flex items-center gap-4 text-sm font-medium tracking-widest opacity-80">
                <span>Global</span>
                <span class="w-12 border-b border-white/30"></span>
                <span>Partners</span>
              </div>
              <div class="flex gap-3">
                <app-status-badge status="active" label="Join" variant="solid" size="sm"></app-status-badge>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- REGISTER FORM: Right side                   -->
        <!-- ========================================== -->
        <div class="w-full flex flex-col justify-center py-6">

          <!-- Header -->
          <div class="mb-5">
            <h1 class="text-[length:var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)] tracking-tight">
              Sign up
            </h1>
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] mt-1">
              Small step for your knowledge, giant leap for your network.
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
          <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="flex flex-col w-full">

            <!-- Row 1: Name -->
            <div class="mb-3">
              <app-field label="Full Name" [required]="true">
                <input 
                  pInputText 
                  type="text" 
                  name="name" 
                  [(ngModel)]="form.name" 
                  required
                  placeholder="e.g. John Doe"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Row 2: Phone -->
            <div class="mb-3">
              <app-field label="Phone Number" [required]="true">
                <input 
                  pInputText 
                  type="tel" 
                  name="phone" 
                  [(ngModel)]="form.phone" 
                  required
                  placeholder="e.g. 9876543210" 
                  autocomplete="tel"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Row 3: Password -->
            <div class="mb-3">
              <app-field label="Password" [required]="true">
                <p-password 
                  name="password" 
                  [(ngModel)]="form.password" 
                  required
                  [toggleMask]="true" 
                  [feedback]="false"
                  placeholder="Create a strong password" 
                  styleClass="w-full"
                  inputStyleClass="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5">
                </p-password>
              </app-field>
            </div>

            <!-- Row 4: City + State (Split) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <app-field label="City" [required]="true">
                <input 
                  pInputText 
                  type="text" 
                  name="city" 
                  [(ngModel)]="form.city" 
                  required
                  placeholder="City"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>

              <app-field label="State" [required]="true">
                <input 
                  pInputText 
                  type="text" 
                  name="state" 
                  [(ngModel)]="form.state" 
                  required
                  placeholder="State"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Row 5: Zip Code -->
            <div class="mb-4">
              <app-field label="Zip / Postal Code" [required]="true">
                <input 
                  pInputText 
                  type="text" 
                  name="zipCode" 
                  [(ngModel)]="form.zipCode" 
                  required
                  placeholder="e.g. 110001"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Submit -->
            <app-button 
              type="submit" 
              variant="primary" 
              [label]="loading ? 'Signing up...' : 'Sign up'"
              [icon]="loading ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'" 
              iconPosition="right"
              [loading]="loading" 
              [disabled]="regForm.invalid || loading" 
              class="w-full">
            </app-button>

          </form>

          <!-- Footer Links -->
          <div class="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 w-full text-[length:var(--font-size-xs)]">
            <div class="flex items-center gap-1">
              <span class="text-[var(--text-tertiary)]">Already a partner?</span>
              <a routerLink="/apex-delivery/login" class="text-[var(--accent-primary)] font-medium hover:underline transition-colors focus:outline-none">
                Log in
              </a>
            </div>
          </div>

        </div>

      </app-floating-split-layout>
    </app-page>
  `,
  styleUrls: ['./platform-register.component.scss']
})
export class PlatformRegisterComponent {
  private platformService = inject(PlatformDeliveryService);
  private router = inject(Router);

  form = { name: '', phone: '', password: '', city: '', state: '', zipCode: '' };
  loading = false;
  error = '';

  onSubmit() {
    this.loading = true;
    this.error = '';

    this.platformService.register(this.form).subscribe({
      next: (res) => {
        this.platformService.setToken(res.token);
        this.router.navigate(['/apex-delivery/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}