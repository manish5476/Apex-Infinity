import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Interfaces & Data Models
// ---------------------------------------------------------------------------
type ExperienceKind = 'cart' | 'checkout' | 'auth' | 'account' | 'content' | 'wishlist' | 'compare' | 'blog' | 'utility' | 'order' | 'store';

interface ExperiencePage {
  title: string;
  eyebrow: string;
  description: string;
  kind: ExperienceKind;
  primaryAction: string;
  secondaryAction: string;
  icon: string;
  metrics: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; body: string; icon: string }>;
}

const PAGE_LIBRARY: Record<string, ExperiencePage> = {
  cart: {
    title: 'Your Cart', eyebrow: 'Checkout ready', kind: 'cart',
    description: 'A calm cart experience with trust signals, delivery estimates, saved items, and a sticky order summary.',
    primaryAction: 'Continue checkout', secondaryAction: 'Keep shopping', icon: 'pi pi-shopping-bag',
    metrics: [{ label: 'Items', value: '0' }, { label: 'Shipping', value: 'Smart' }, { label: 'Protection', value: 'On' }],
    sections: [
      { title: 'Empty cart state', body: 'Personalized recommendations and recently viewed products keep shoppers moving.', icon: 'pi pi-sparkles' },
      { title: 'Sticky summary', body: 'Totals, discounts, tax, shipping, and payment confidence stay visible without layout jump.', icon: 'pi pi-receipt' },
      { title: 'Express actions', body: 'Wishlist, compare, and save-for-later patterns are ready for real cart data.', icon: 'pi pi-bolt' }
    ]
  },
  // ... (Other entries remain consistent with your provided library)
  checkout: {
    title: 'Secure Checkout', eyebrow: 'Conversion path', kind: 'checkout',
    description: 'A Stripe-quality checkout scaffold with stepped progression, wallet readiness, and clear payment trust.',
    primaryAction: 'Review payment', secondaryAction: 'Return to cart', icon: 'pi pi-credit-card',
    metrics: [{ label: 'Steps', value: '3' }, { label: 'Wallets', value: 'Ready' }, { label: 'CLS', value: 'Stable' }],
    sections: [
      { title: 'Step structure', body: 'Contact, delivery, payment, and review states are visually distinct and easy to resume.', icon: 'pi pi-check-square' },
      { title: 'Sticky order card', body: 'Totals and policy reassurance remain available while forms stay sectioned.', icon: 'pi pi-wallet' },
      { title: 'Failure handling', body: 'Declines, retries, and alternate payment paths are planned as first-class UX.', icon: 'pi pi-exclamation-circle' }
    ]
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-storefront-experience',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <main class="sf-experience">
      <section class="sf-hero apx-page-wide">
        <div class="sf-hero-copy">
          <span class="apx-kicker"><i [class]="page().icon"></i>{{ page().eyebrow }}</span>
          <h1>{{ page().title }}</h1>
          <p>{{ page().description }}</p>
          <div class="sf-actions">
            <a class="apx-button-primitive primary" [routerLink]="['../products']">
              <i class="pi pi-arrow-right"></i>{{ page().primaryAction }}
            </a>
            <a class="apx-button-primitive secondary" [routerLink]="['../home']">
              <i class="pi pi-home"></i>{{ page().secondaryAction }}
            </a>
          </div>
        </div>

        <div class="sf-preview apx-glass" [attr.data-kind]="page().kind">
          <div class="preview-topbar"><span></span><span></span><span></span></div>
          <div class="preview-body">
            <div class="preview-icon"><i [class]="page().icon"></i></div>
            <div class="preview-lines">
              <span class="apx-skeleton"></span>
              <span class="apx-skeleton short"></span>
            </div>
          </div>
          <div class="preview-grid">
            @for (metric of page().metrics; track metric.label) {
              <div class="metric-card">
                <strong>{{ metric.value }}</strong>
                <span>{{ metric.label }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="sf-content apx-page">
        <div class="sf-panel apx-section-card">
          <div class="panel-heading">
            <span class="apx-kicker">Experience blueprint</span>
            <h2>Designed for launch quality, ready for real data</h2>
          </div>
          <div class="section-grid">
            @for (section of page().sections; track section.title) {
              <article class="section-card">
                <div class="section-icon"><i [class]="section.icon"></i></div>
                <h3>{{ section.title }}</h3>
                <p>{{ section.body }}</p>
              </article>
            }
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .sf-experience { min-height: 100vh; padding: clamp(5rem, 8vw, 8rem) 0 clamp(4rem, 7vw, 7rem); color: var(--text-primary); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-primary) 7%, transparent), transparent 28rem), var(--bg-primary); }
    .sf-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr); gap: clamp(2rem, 5vw, 5rem); align-items: center; }
    
    .sf-hero h1 { margin: 0; max-width: 14ch; font-family: var(--font-heading); font-size: clamp(3rem, 8vw, 6.75rem); line-height: 0.92; }
    .sf-hero p { max-width: 62ch; margin: 0; color: var(--text-secondary); font-size: clamp(1rem, 2vw, 1.2rem); line-height: 1.75; }

    .sf-preview { position: relative; overflow: hidden; min-height: 480px; border-radius: var(--ui-border-radius-3xl, 2rem); padding: 1rem; }
    .sf-preview::before { content: ""; position: absolute; inset: -25%; background: var(--accent-primary); opacity: 0.18; transform: rotate(-12deg); }
    
    .preview-body { min-height: 300px; border-radius: 1.5rem; background: rgba(255,255,255,0.9); display: grid; align-content: end; gap: 1rem; padding: 1.4rem; box-shadow: var(--shadow-md); }
    .metric-card { min-height: 5.5rem; display: grid; align-content: center; gap: 0.25rem; padding: 1rem; border-radius: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-secondary); }
    
    .section-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 3rem; }
    .section-card { min-height: 14rem; padding: 1.25rem; border-radius: var(--ui-border-radius-lg); background: var(--bg-secondary); border: 1px solid var(--border-secondary); transition: transform 0.3s ease; }
    .section-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    
    @media (max-width: 920px) { .sf-hero, .section-grid { grid-template-columns: 1fr; } }
  `]
})
export class StorefrontExperienceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly pageKey = signal('content');
  readonly page = computed(() => PAGE_LIBRARY[this.pageKey()] ?? PAGE_LIBRARY['cart']); // Fallback logic

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.pageKey.set(typeof data['pageKey'] === 'string' ? data['pageKey'] : 'content');
    });
  }
}
