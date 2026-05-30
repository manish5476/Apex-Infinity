import { Component, Input, computed, signal, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[] | string;
  isPopular: boolean;
  ctaText: string;
  ctaLink?: string;
}

export interface PricingTableConfig {
  title?: string;
  plans?: PricingPlan[];
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = { 
  none: '0', sm: '3rem', md: '5rem', lg: '7rem', xl: '10rem' 
};

const MOCK_PLANS: PricingPlan[] = [
  { name: 'Basic', price: '$9', period: '/month', features: ['1 User Account', '5GB Secure Storage', 'Basic Email Support'], isPopular: false, ctaText: 'Get Started' },
  { name: 'Professional', price: '$29', period: '/month', features: ['5 User Accounts', '50GB Secure Storage', 'Priority 24/7 Support', 'Advanced Analytics'], isPopular: true, ctaText: 'Start Free Trial' },
  { name: 'Enterprise', price: '$99', period: '/month', features: ['Unlimited Users', '500GB Secure Storage', 'Dedicated Account Manager', 'Custom API Integrations'], isPopular: false, ctaText: 'Contact Sales' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-pricing-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="pt-root" [ngStyle]="sectionStyle()">
      <div class="pt-container">
        
        @if (cfg().title) {
          <div class="pt-header-group">
            <h2 class="pt-section-title animate-in" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
            <div class="pt-divider-pill animate-in delay-1" [ngStyle]="{'background-color': cfg().typography?.headingColor || 'var(--accent-primary)'}"></div>
          </div>
        }
        
        <div class="pt-pricing-grid">
          @for (plan of displayPlans(); track $index) {
            <div class="pt-pricing-card animate-in delay-1"
                 [class.is-popular]="plan.isPopular"
                 [ngStyle]="cardStyle(plan.isPopular)">
                 
              @if (plan.isPopular) {
                <div class="pt-popular-badge" [ngStyle]="{'background': badgeBackground()}">
                  Most Popular
                </div>
              }
              
              <div class="pt-card-header">
                <h3 class="pt-plan-name" [ngStyle]="headingStyle(plan.isPopular)">{{ plan.name }}</h3>
                <div class="pt-price-box">
                  <span class="pt-price-amount" [ngStyle]="headingStyle(plan.isPopular)">{{ plan.price }}</span>
                  <span class="pt-price-period" [ngStyle]="bodyStyle(plan.isPopular, true)">{{ plan.period }}</span>
                </div>
              </div>
              
              <ul class="pt-features-list">
                @for (feature of parseFeatures(plan.features); track $index) {
                  <li class="pt-feature-item" [ngStyle]="bodyStyle(plan.isPopular)">
                    <i class="pi pi-check-circle pt-check-icon" [ngStyle]="{'color': plan.isPopular ? 'var(--color-success-light, #4ade80)' : 'var(--color-success)'}"></i>
                    {{ feature }}
                  </li>
                }
              </ul>
              
              <a [routerLink]="!isExternal(plan.ctaLink) ? getLink(plan.ctaLink) : null"
                 [attr.href]="isExternal(plan.ctaLink) ? plan.ctaLink : null"
                 [target]="isExternal(plan.ctaLink) ? '_blank' : '_self'"
                 class="pt-cta-btn"
                 [ngStyle]="buttonStyle(plan.isPopular)">
                {{ plan.ctaText || 'Select Plan' }}
              </a>
            </div>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .pt-root { position: relative; overflow: hidden; background-color: transparent; }
    
    .pt-container { position: relative; z-index: 10; margin: 0 auto; padding: 0 var(--spacing-2xl); max-width: 1280px; }

    /* --- HEADER --- */
    .pt-header-group { text-align: center; margin-bottom: var(--spacing-5xl); max-width: 700px; margin-left: auto; margin-right: auto; }
    
    .pt-section-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; margin-bottom: var(--spacing-md); line-height: 1.1; letter-spacing: -0.02em; }
    
    .pt-divider-pill { width: 60px; height: 4px; border-radius: 100px; margin: 0 auto; opacity: 0.8; }

    /* --- PRICING GRID --- */
    .pt-pricing-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-2xl); align-items: stretch; }
    @media (min-width: 768px) { .pt-pricing-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .pt-pricing-grid { grid-template-columns: repeat(3, 1fr); } }

    /* --- PRICING CARD --- */
    .pt-pricing-card { position: relative; display: flex; flex-direction: column; padding: var(--spacing-3xl); background: var(--bg-primary); border: 1px solid var(--border-secondary); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .pt-pricing-card:hover { transform: translateY(-8px); }

    /* POPULAR STATE */
    .pt-pricing-card.is-popular { z-index: 1; transform: scale(1.05); border-color: transparent; }
    .pt-pricing-card.is-popular:hover { transform: scale(1.05) translateY(-8px); }
    @media (max-width: 1023px) { .pt-pricing-card.is-popular { transform: scale(1); } .pt-pricing-card.is-popular:hover { transform: translateY(-8px); } }

    .pt-popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); color: #ffffff; padding: 6px 16px; border-radius: 100px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }

    /* Card Header */
    .pt-card-header { text-align: center; padding-bottom: var(--spacing-xl); margin-bottom: var(--spacing-xl); border-bottom: 1px solid var(--border-secondary); }
    .pt-pricing-card.is-popular .pt-card-header { border-color: rgba(255,255,255,0.1); }

    .pt-plan-name { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: var(--spacing-md); opacity: 0.7; margin-top: 0; }
    .pt-price-box { display: flex; justify-content: center; align-items: baseline; gap: 4px; }
    .pt-price-amount { font-size: 3rem; font-weight: 700; line-height: 1; }
    .pt-price-period { font-size: var(--font-size-sm); }

    /* Features List */
    .pt-features-list { list-style: none; padding: 0; margin: 0 0 var(--spacing-2xl) 0; display: flex; flex-direction: column; gap: var(--spacing-md); flex-grow: 1; }
    .pt-feature-item { display: flex; align-items: center; gap: 12px; font-size: var(--font-size-sm); font-weight: 500; }
    .pt-check-icon { font-size: 1.1rem; flex-shrink: 0; }

    /* CTA Button */
    .pt-cta-btn { display: block; width: 100%; text-align: center; padding: 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; transition: all 0.2s ease; cursor: pointer; }
    .pt-cta-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

    /* Animation Utilities */
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .delay-1 { animation-delay: 100ms; }
  `]
})
export class PricingTableComponent {
  @Input() set config(v: PricingTableConfig) { this._config.set(v ?? {}); }
  private _config = signal<PricingTableConfig>({});

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Pricing Plans',
    plans:         this._config().plans,
    design:        this._config().design,
    typography:    this._config().typography,
    paddingTop:    this._config().paddingTop    ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md'
  }));

  readonly displayPlans = computed(() => {
    const src = this.cfg().plans;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK_PLANS;
  });

  // --- Dynamic Style Mappings ---

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['md'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['md'],
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  cardStyle(isPopular: boolean) {
    const base: any = {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`,
      'background-color': isPopular ? 'var(--text-primary)' : 'var(--bg-primary)'
    };
    
    // Apply Box Shadow
    const shadowToken = this.cfg().design?.boxShadow || 'md';
    if (shadowToken !== 'none') {
      base['box-shadow'] = `var(--shadow-${isPopular ? '2xl' : shadowToken})`;
    } else if (isPopular) {
      // Always give popular card at least some depth
      base['box-shadow'] = 'var(--shadow-xl)';
    }

    return base;
  }

  badgeBackground() {
    const accent = this.cfg().typography?.headingColor || 'var(--accent-primary)';
    return `linear-gradient(135deg, ${accent} 0%, var(--accent-secondary, #f43f5e) 100%)`;
  }

  headingStyle(isPopular: boolean = false) {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': isPopular ? 'var(--bg-primary)' : (this.cfg().typography?.headingColor || 'var(--text-primary)')
    };
  }

  bodyStyle(isPopular: boolean = false, isTertiary: boolean = false) {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': isPopular 
        ? (isTertiary ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)')
        : (this.cfg().typography?.bodyColor || (isTertiary ? 'var(--text-tertiary)' : 'var(--text-secondary)'))
    };
  }

  buttonStyle(isPopular: boolean) {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || 'md'})`,
      'background-color': isPopular ? 'var(--bg-primary)' : (this.cfg().typography?.headingColor || 'var(--text-primary)'),
      'color': isPopular ? 'var(--text-primary)' : 'var(--bg-primary)'
    };
  }

  // --- Utility Methods ---

  parseFeatures(features: string | string[] | undefined): string[] {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return features.split(',').map(s => s.trim());
    return [];
  }

  getLink(url: string | undefined): string[] {
    if (!url || url.startsWith('http') || url.startsWith('www')) return [];
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : [];
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}// // src/app/modules/storefront-public/pages/pricing-table/pricing-table.component.ts
