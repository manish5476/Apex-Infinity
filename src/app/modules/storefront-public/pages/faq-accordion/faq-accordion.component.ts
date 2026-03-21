// src/app/modules/storefront-public/pages/faq-accordion/faq-accordion.component.ts
import {
  Component, Input, signal, computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ---------------------------------------------------------------------------
// Types — match SectionRegistry faq_accordion schema
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer:   string;
}

export interface FaqAccordionConfig {
  title?:        string;
  items?:        FaqItem[];
  // Style tokens
  paddingTop?:   'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?:'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  themeMode?:    'auto' | 'light' | 'dark' | 'glass';
}

// Only uses tokens that exist in the design system
const PADDING: Record<string, string> = {
  none: '0',
  sm:   'var(--spacing-3xl)',
  md:   'var(--spacing-5xl)',
  lg:   'calc(var(--spacing-5xl) * 1.5)',
  xl:   'calc(var(--spacing-5xl) * 2)'
};

const MOCK_ITEMS: FaqItem[] = [
  { question: 'What payment methods do you accept?',         answer: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), UPI, net banking, and popular wallets like Paytm and PhonePe. All transactions are secured with 256-bit SSL encryption.' },
  { question: 'How long does delivery take?',                 answer: 'Standard delivery takes 3–5 business days. Express delivery (1–2 days) is available in select cities for an additional charge. You will receive a tracking link as soon as your order ships.' },
  { question: 'What is your return and refund policy?',       answer: 'We offer a hassle-free 30-day return window for most products. Items must be unused, in original packaging, and accompanied by proof of purchase. Refunds are processed within 5–7 business days of receiving the returned item.' },
  { question: 'Do you offer warranty on products?',           answer: 'Yes. All electronics come with the manufacturer\'s warranty — typically 1 year for accessories and up to 2 years for main units. Extended warranty plans are available at checkout.' },
  { question: 'Can I track my order in real time?',           answer: 'Absolutely. Once your order is dispatched you will receive an SMS and email with a tracking link. You can also check order status directly from your account dashboard at any time.' }
];

@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-accordion.component.html',
  styleUrls:   ['./faq-accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqAccordionComponent {

  @Input() set config(v: FaqAccordionConfig) { this._config.set(v ?? {}); }

  private _config = signal<FaqAccordionConfig>({});

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Frequently Asked Questions',
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly items = computed(() => {
    const src = this._config().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK_ITEMS;
  });

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().backgroundColor || ''
  }));

  // Start with all panels closed (null)
  // Use Set for multi-open support — toggle individual items independently
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
}// import { Component, Input, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-faq-accordion',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <section class="section-root" 
//              [style.background-color]="  'var(--bg-secondary)'"
//              [style.padding-top]="paddingMap[config.paddingTop] || 'var(--spacing-5xl)'"
//              [style.padding-bottom]="paddingMap[config.paddingBottom] || 'var(--spacing-5xl)'">
      
//       <div class="container-wrapper">
        
//         <div class="header-group" *ngIf="config.title">
//           <h2 class="section-title animate-in">{{ config.title }}</h2>
//           <div class="divider-pill animate-in delay-1"></div>
//         </div>

//         <div class="accordion-list animate-in delay-2">
          
//           @for (item of config.items; track $index) {
//             <div class="accordion-item" 
//                  [class.is-open]="isOpen($index)">
              
//               <button class="toggle-btn" (click)="toggle($index)" 
//                       [attr.aria-expanded]="isOpen($index)">
//                 <span class="question-text">{{ item.question }}</span>
                
//                 <span class="icon-box">
//                   <i class="pi pi-chevron-down"></i>
//                 </span>
//               </button>

//               <div class="content-wrapper" 
//                    [class.expanded]="isOpen($index)">
//                 <div class="content-inner">
//                   <div class="answer-text">
//                     {{ item.answer }}
//                   </div>
//                 </div>
//               </div>

//             </div>
//           }

//         </div>

//       </div>
//     </section>
//   `,
//   styleUrls: ['./faq-accordion.component.scss']
// })
// export class FaqAccordionComponent {
//   @Input() config: any = {};
  
//   // Default: Open the first item (index 0), or null to start closed
//   openIndex = signal<number | null>(0);

//   // Layout Mappers
//   paddingMap: any = {
//     'none': '0',
//     'sm': 'var(--spacing-3xl)', 
//     'md': 'var(--spacing-5xl)', 
//     'lg': 'var(--spacing-7xl)'
//   };

//   isOpen(index: number): boolean {
//     return this.openIndex() === index;
//   }

//   toggle(index: number) {
//     this.openIndex.update(current => current === index ? null : index);
//   }
// }
