import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface FaqItem {
  question: string;
  answer:   string;
}

export interface FaqAccordionConfig {
  title?: string;
  items?: FaqItem[];
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = {
  none: '0',
  sm:   'var(--spacing-3xl)',
  md:   'var(--spacing-5xl)',
  lg:   'calc(var(--spacing-5xl) * 1.5)',
  xl:   'calc(var(--spacing-5xl) * 2)'
};

const MOCK_ITEMS: FaqItem[] = [
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), UPI, net banking, and popular wallets like Paytm and PhonePe. All transactions are secured with 256-bit SSL encryption.' },
  { question: 'How long does delivery take?', answer: 'Standard delivery takes 3–5 business days. Express delivery (1–2 days) is available in select cities for an additional charge. You will receive a tracking link as soon as your order ships.' },
  { question: 'What is your return and refund policy?', answer: 'We offer a hassle-free 30-day return window for most products. Items must be unused, in original packaging, and accompanied by proof of purchase. Refunds are processed within 5–7 business days of receiving the returned item.' },
  { question: 'Do you offer warranty on products?', answer: 'Yes. All electronics come with the manufacturer\'s warranty — typically 1 year for accessories and up to 2 years for main units. Extended warranty plans are available at checkout.' },
  { question: 'Can I track my order in real time?', answer: 'Absolutely. Once your order is dispatched you will receive an SMS and email with a tracking link. You can also check order status directly from your account dashboard at any time.' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="faq-root" [ngStyle]="sectionStyle()">
      <div class="faq-container">
        
        <header class="faq-header">
          <span class="faq-eyebrow" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}">FAQ</span>
          <h2 class="faq-title" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)', 'color': cfg().typography?.headingColor || 'var(--text-primary)'}">
            {{ cfg().title }}
          </h2>
          <div class="faq-title-accent" aria-hidden="true"></div>
        </header>

        <div class="faq-layout">
          
          <div class="faq-list" role="list">
            @for (item of items(); track item.question; let i = $index) {
              <div class="faq-item" [class.faq-item-open]="isOpen(i)" role="listitem"
                   [ngStyle]="{
                     'border-radius': 'var(--ui-border-radius-' + (cfg().design?.borderRadius || 'lg') + ')',
                     'box-shadow': 'var(--shadow-' + (cfg().design?.boxShadow || 'sm') + ')'
                   }">
                
                <button class="faq-toggle" type="button" (click)="toggle(i)" [attr.aria-expanded]="isOpen(i)" [attr.aria-controls]="'faq-panel-' + i">
                  <span class="faq-question" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)', 'color': isOpen(i) ? 'var(--accent-primary)' : (cfg().typography?.headingColor || 'var(--text-primary)')}">
                    {{ item.question }}
                  </span>
                  <span class="faq-chevron" aria-hidden="true"><i class="pi pi-chevron-down"></i></span>
                </button>

                <div class="faq-panel" [class.faq-panel-open]="isOpen(i)" [id]="'faq-panel-' + i" role="region">
                  <div class="faq-panel-inner">
                    <p class="faq-answer" [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)', 'color': cfg().typography?.bodyColor || 'var(--text-secondary)'}">
                      {{ item.answer }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="faq-side" aria-hidden="true">
            <div class="faq-side-card"
                 [ngStyle]="{
                   'border-radius': 'var(--ui-border-radius-' + (cfg().design?.borderRadius || '2xl') + ')',
                   'box-shadow': 'var(--shadow-' + (cfg().design?.boxShadow || 'lg') + ')'
                 }">
              <div class="faq-side-icon"><i class="pi pi-question-circle"></i></div>
              <p class="faq-side-text" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)', 'color': cfg().typography?.headingColor || 'var(--text-primary)'}">
                Still have questions?
              </p>
              <p class="faq-side-sub" [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)', 'color': cfg().typography?.bodyColor || 'var(--text-secondary)'}">
                Our team is available 24/7 to help you find the answers you need.
              </p>
              <div class="faq-side-dot faq-side-dot-1"></div>
              <div class="faq-side-dot faq-side-dot-2"></div>
              <div class="faq-side-dot faq-side-dot-3"></div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .faq-root { position: relative; overflow: hidden; background-color: transparent; }
    .faq-root::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle, var(--border-secondary) 1px, transparent 1px); background-size: 24px 24px; opacity: 0.3; pointer-events: none; }
    
    .faq-container { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 0 var(--spacing-2xl); }
    
    .faq-header { text-align: center; margin-bottom: var(--spacing-5xl); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md); }
    .faq-eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: var(--accent-primary); }
    .faq-title { margin: 0; font-size: clamp(24px, 3.5vw, 40px); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
    .faq-title-accent { width: 40px; height: 3px; border-radius: 3px; background: var(--accent-primary); opacity: 0.85; }
    
    .faq-layout { display: grid; grid-template-columns: 1fr; gap: var(--spacing-4xl); align-items: start; }
    @media (min-width: 1024px) { .faq-layout { grid-template-columns: 1fr 320px; } }
    
    .faq-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
    
    .faq-item { background: var(--bg-primary); border: 1px solid var(--border-secondary); overflow: hidden; transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease; }
    .faq-item:hover:not(.faq-item-open) { border-color: var(--border-primary); transform: translateY(-1px); box-shadow: var(--shadow-md) !important; }
    .faq-item.faq-item-open { border-color: var(--accent-primary); box-shadow: 0 0 0 1px var(--accent-primary) !important; }
    
    .faq-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-xl) var(--spacing-xl); background: none; border: none; cursor: pointer; text-align: left; gap: var(--spacing-lg); outline: none; }
    .faq-toggle:focus-visible { box-shadow: inset 0 0 0 2px var(--accent-primary); }
    
    .faq-question { font-size: var(--font-size-md); font-weight: 600; line-height: 1.4; transition: color 0.2s ease; text-align: left; }
    .faq-item.faq-item-open .faq-question { color: var(--accent-primary) !important; }
    
    .faq-chevron { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s ease, background 0.2s ease; }
    .faq-chevron i { font-size: 10px; }
    .faq-item.faq-item-open .faq-chevron { transform: rotate(180deg); color: var(--accent-primary); }
    
    .faq-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
    .faq-panel.faq-panel-open { grid-template-rows: 1fr; }
    .faq-panel-inner { overflow: hidden; }
    .faq-answer { margin: 0; padding: var(--spacing-md) var(--spacing-xl) var(--spacing-xl); border-top: 1px solid var(--border-secondary); font-size: var(--font-size-sm); line-height: 1.75; }
    
    .faq-side { display: none; }
    @media (min-width: 1024px) { .faq-side { display: block; } }
    
    .faq-side-card { position: relative; background: var(--bg-primary); border: 1px solid var(--border-secondary); padding: var(--spacing-3xl); text-align: center; overflow: hidden; }
    .faq-side-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary, var(--accent-primary))); }
    
    .faq-side-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--spacing-lg); color: var(--accent-primary); }
    .faq-side-icon i { font-size: 1.75rem; }
    
    .faq-side-text { margin: 0 0 var(--spacing-sm); font-size: var(--font-size-xl); font-weight: 700; }
    .faq-side-sub { margin: 0; font-size: var(--font-size-sm); line-height: 1.65; }
    
    .faq-side-dot { position: absolute; border-radius: 50%; opacity: 0.12; background: var(--accent-primary); pointer-events: none; }
    .faq-side-dot-1 { width: 80px; height: 80px; bottom: -24px; right: -24px; }
    .faq-side-dot-2 { width: 48px; height: 48px; top: 20px; left: -16px; }
    .faq-side-dot-3 { width: 24px; height: 24px; bottom: 40px; left: 20px; }
  `]
})
export class FaqAccordionComponent {

  @Input() set config(v: FaqAccordionConfig) { this._config.set(v ?? {}); }

  private _config = signal<FaqAccordionConfig>({});

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Frequently Asked Questions',
    design:        this._config().design,
    typography:    this._config().typography,
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg'
  }));

  readonly items = computed(() => {
    const src = this._config().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK_ITEMS;
  });

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  readonly openIndices = signal<Set<number>>(new Set());

  isOpen(index: number): boolean {
    return this.openIndices().has(index);
  }

  toggle(index: number): void {
    this.openIndices.update(current => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }
}// // src/app/modules/storefront-public/pages/faq-accordion/faq-accordion.component.ts
// import {
//   Component, Input, signal, computed,
//   ChangeDetectionStrategy
// } from '@angular/core';
// import { CommonModule } from '@angular/common';

// // ---------------------------------------------------------------------------
// // Types — match SectionRegistry faq_accordion schema
// // ---------------------------------------------------------------------------

// export interface FaqItem {
//   question: string;
//   answer:   string;
// }

// export interface FaqAccordionConfig {
//   title?:        string;
//   items?:        FaqItem[];
//   // Style tokens
//   paddingTop?:   'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?:'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?: string;
//   themeMode?:    'auto' | 'light' | 'dark' | 'glass';
// }

// // Only uses tokens that exist in the design system
// const PADDING: Record<string, string> = {
//   none: '0',
//   sm:   'var(--spacing-3xl)',
//   md:   'var(--spacing-5xl)',
//   lg:   'calc(var(--spacing-5xl) * 1.5)',
//   xl:   'calc(var(--spacing-5xl) * 2)'
// };

// const MOCK_ITEMS: FaqItem[] = [
//   { question: 'What payment methods do you accept?',         answer: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), UPI, net banking, and popular wallets like Paytm and PhonePe. All transactions are secured with 256-bit SSL encryption.' },
//   { question: 'How long does delivery take?',                 answer: 'Standard delivery takes 3–5 business days. Express delivery (1–2 days) is available in select cities for an additional charge. You will receive a tracking link as soon as your order ships.' },
//   { question: 'What is your return and refund policy?',       answer: 'We offer a hassle-free 30-day return window for most products. Items must be unused, in original packaging, and accompanied by proof of purchase. Refunds are processed within 5–7 business days of receiving the returned item.' },
//   { question: 'Do you offer warranty on products?',           answer: 'Yes. All electronics come with the manufacturer\'s warranty — typically 1 year for accessories and up to 2 years for main units. Extended warranty plans are available at checkout.' },
//   { question: 'Can I track my order in real time?',           answer: 'Absolutely. Once your order is dispatched you will receive an SMS and email with a tracking link. You can also check order status directly from your account dashboard at any time.' }
// ];

// @Component({
//   selector: 'app-faq-accordion',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './faq-accordion.component.html',
//   styleUrls:   ['./faq-accordion.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class FaqAccordionComponent {

//   @Input() set config(v: FaqAccordionConfig) { this._config.set(v ?? {}); }

//   private _config = signal<FaqAccordionConfig>({});

//   readonly cfg = computed(() => ({
//     title:         this._config().title         ?? 'Frequently Asked Questions',
//     paddingTop:    this._config().paddingTop    ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? ''
//   }));

//   readonly items = computed(() => {
//     const src = this._config().items;
//     return (Array.isArray(src) && src.length > 0) ? src : MOCK_ITEMS;
//   });

//   readonly sectionStyle = computed(() => ({
//     'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   // Start with all panels closed (null)
//   // Use Set for multi-open support — toggle individual items independently
//   readonly openIndices = signal<Set<number>>(new Set());

//   isOpen(index: number): boolean {
//     return this.openIndices().has(index);
//   }

//   toggle(index: number): void {
//     this.openIndices.update(current => {
//       const next = new Set(current);
//       if (next.has(index)) {
//         next.delete(index);
//       } else {
//         next.add(index);
//       }
//       return next;
//     });
//   }
// }
