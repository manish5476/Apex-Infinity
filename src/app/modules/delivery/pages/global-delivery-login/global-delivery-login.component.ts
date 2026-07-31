import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// UI Components (Shared)
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { FloatingSplitLayoutComponent } from '@shared/ui/layout/floating-split-layout.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { ButtonComponent } from '@shared/ui/form/button.component';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';

@Component({
  selector: 'app-global-delivery-login',
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
        imageAlt="Apex Global Logistics"
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
              Route<br>
              with<br>
              <em>impact.</em>
            </h2>

            <div class="flex items-center justify-between mt-8">
              <div class="flex items-center gap-4 text-sm font-medium tracking-widest opacity-80">
                <span>Local</span>
                <span class="w-12 border-b border-white/30"></span>
                <span>Global</span>
              </div>
              <div class="flex gap-3">
                <app-status-badge status="info" label="Store Portal" variant="solid" size="sm"></app-status-badge>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- LOGIN FORM: Right side                      -->
        <!-- ========================================== -->
        <div class="w-full flex flex-col justify-center py-6">

          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-[length:var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)] tracking-tight">
              Store Delivery Portal
            </h1>
            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] mt-1">
              Enter your assigned Organization ID to manage dispatch, tracking, and local logistics.
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

            <!-- Store ID -->
            <div class="mb-6">
              <app-field label="Organization ID" [required]="true">
                <input 
                  pInputText 
                  type="text" 
                  name="storeId" 
                  [(ngModel)]="storeId" 
                  required
                  placeholder="e.g. apex-store-1" 
                  autocomplete="off" 
                  spellcheck="false"
                  class="w-full rounded-[var(--ui-border-radius)] bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all px-4 py-2.5" />
              </app-field>
            </div>

            <!-- Submit -->
            <app-button 
              type="submit" 
              variant="primary" 
              [label]="loading ? 'Locating...' : 'Continue to Login'"
              [icon]="loading ? 'pi pi-spinner pi-spin' : 'pi pi-arrow-right'" 
              iconPosition="right"
              [loading]="loading" 
              [disabled]="loginForm.invalid || loading" 
              class="w-full">
            </app-button>

            <!-- Return Button -->
            <app-button 
              type="button" 
              variant="secondary" 
              label="Return to Main ERP"
              (clicked)="goBack()"
              class="w-full mt-4">
            </app-button>

          </form>
        </div>

      </app-floating-split-layout>
    </app-page>
  `,
  styleUrls: ['./global-delivery-login.component.scss']
})
export class GlobalDeliveryLoginComponent {
  private router = inject(Router);

  storeId = '';
  loading = false;
  error = '';

  onSubmit() {
    if (!this.storeId) {
      this.error = 'Please enter a valid organization ID';
      return;
    }

    this.loading = true;
    this.error = '';

    // In a real app, this would verify the org exists via API
    // For now, assume it's valid and route to the store's delivery login
    setTimeout(() => {
      this.router.navigate(['/store', this.storeId, 'delivery', 'login']);
    }, 600);
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}