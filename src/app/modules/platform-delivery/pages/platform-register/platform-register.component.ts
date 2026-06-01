import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PlatformDeliveryService } from '../../services/platform-delivery.service';

@Component({
  selector: 'app-platform-register',
  standalone: true,
  imports: [FormsModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="auth-root">
  <aside class="brand-panel">
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="orb orb-1" aria-hidden="true"></div>
    <div class="orb orb-2" aria-hidden="true"></div>

    <div class="brand-inner">
      <div class="wordmark">
        <div class="logo-glyph">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 28 L16 4 L28 28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.5 20 L23.5 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
        <span class="wordmark-text">Apex</span>
      </div>

      <div class="hero-copy">
        <p class="overline-text">Join Apex Global</p>
        <h1 class="hero-headline">
          Scale<br>
          your<br>
          <em>network.</em>
        </h1>
        <p class="hero-body">
          Become a partner and scale your logistics network across the globe.
        </p>
      </div>

      <footer class="brand-footer">
        <span>© 2026 Apex Inc.</span>
      </footer>
    </div>
  </aside>

  <main class="form-panel" id="main-content" style="overflow-y: auto;">
    <div class="form-inner" style="margin-top: 2rem; margin-bottom: 2rem;">
      <div class="form-header">
        <h2 class="form-title">Sign up</h2>
        <p class="form-subtitle">Small step for your knowledge, giant leap for your network.</p>
      </div>

      @if (error) {
        <div class="error-banner" role="alert">
          <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ error }}</span>
        </div>
      }

      <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="auth-form" novalidate>
        
        <div class="field-group">
          <label class="field-label">Full Name</label>
          <input type="text" name="name" [(ngModel)]="form.name" required class="apex-input" placeholder="e.g. John Doe">
        </div>

        <div class="field-group">
          <label class="field-label">Phone Number</label>
          <input type="tel" name="phone" [(ngModel)]="form.phone" required class="apex-input" placeholder="e.g. 9876543210" autocomplete="tel">
        </div>

        <div class="field-group">
          <label class="field-label">Password</label>
          <input type="password" name="password" [(ngModel)]="form.password" required class="apex-input" placeholder="Create a strong password">
        </div>

        <div style="display: flex; gap: 1rem;">
          <div class="field-group" style="flex: 1;">
            <label class="field-label">City</label>
            <input type="text" name="city" [(ngModel)]="form.city" required class="apex-input" placeholder="City">
          </div>
          <div class="field-group" style="flex: 1;">
            <label class="field-label">State</label>
            <input type="text" name="state" [(ngModel)]="form.state" required class="apex-input" placeholder="State">
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Zip/Postal Code</label>
          <input type="text" name="zipCode" [(ngModel)]="form.zipCode" required class="apex-input" placeholder="e.g. 110001">
        </div>

        <button type="submit" class="submit-btn" [class.loading]="loading" [disabled]="regForm.invalid || loading">
          @if (loading) {
            <span class="spinner" aria-hidden="true"></span>
            <span>Signing up…</span>
          } @else {
            <span>Sign up</span>
            <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          }
        </button>
      </form>

      <p class="signup-nudge">
        Already a partner? <a routerLink="/apex-delivery/login" class="signup-link">Log in</a>
      </p>
    </div>
  </main>
</div>
  `,
  styleUrl: '../../../../modules/auth/_auth.shared.scss'
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
