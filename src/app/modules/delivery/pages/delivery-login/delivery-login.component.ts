import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
        <p class="overline-text">Store Fleet</p>
        <h1 class="hero-headline">
          Deliver<br>
          with<br>
          <em>precision.</em>
        </h1>
        <p class="hero-body">
          Access real-time order tracking, customer delivery details, and instant proof-of-delivery tools on the go.
        </p>
      </div>

      <footer class="brand-footer">
        <span>© 2026 Apex Inc.</span>
      </footer>
    </div>
  </aside>

  <main class="form-panel" id="main-content">
    <div class="form-inner">
      <div class="form-header">
        <h2 class="form-title">Agent Login</h2>
        <p class="form-subtitle">Login to manage assigned orders for <span style="font-weight: 600; color: var(--text-primary);">{{ orgSlug || 'your store' }}</span></p>
      </div>

      @if (error) {
        <div class="error-banner" role="alert">
          <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ error }}</span>
        </div>
      }

      <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form" novalidate>
        <div class="field-group">
          <label class="field-label" for="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" [(ngModel)]="credentials.phone" required class="apex-input" placeholder="e.g. 9876543210" autocomplete="tel">
        </div>

        <div class="field-group">
          <div class="field-label-row">
            <label class="field-label" for="password">Password</label>
            <a (click)="goToForgotPassword()" style="cursor:pointer" class="forgot-link">Forgot?</a>
          </div>
          <input type="password" id="password" name="password" [(ngModel)]="credentials.password" required class="apex-input" placeholder="Enter password">
        </div>

        <button type="submit" class="submit-btn" [class.loading]="loading" [disabled]="loginForm.invalid || loading">
          @if (loading) {
            <span class="spinner" aria-hidden="true"></span>
            <span>Signing in…</span>
          } @else {
            <span>Secure Login</span>
            <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          }
        </button>
      </form>

      <p class="signup-nudge">
        Not an agent? <a routerLink="/" class="signup-link">Back to Home</a>
      </p>
    </div>
  </main>
</div>
`,
  styleUrl: '../../../../modules/auth/_auth.shared.scss'
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