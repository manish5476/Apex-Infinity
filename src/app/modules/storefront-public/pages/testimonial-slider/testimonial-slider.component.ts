import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface TestimonialItem {
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  text: string;
}

export interface TestimonialConfig {
  title?: string;
  items?: TestimonialItem[];
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = { 
  none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' 
};

const MOCK: TestimonialItem[] = [
  { name: 'Priya Sharma', role: 'Product Designer', rating: 5, text: 'Absolutely incredible quality. The packaging alone tells you these products are made with care.', avatar: 'https://i.pravatar.cc/80?img=47' },
  { name: 'Rahul Mehta', role: 'Tech Entrepreneur', rating: 5, text: 'Fast shipping, honest descriptions, and the product exceeded expectations.', avatar: 'https://i.pravatar.cc/80?img=11' },
  { name: 'Ananya Patel', role: 'Content Creator', rating: 5, text: 'I was skeptical at first but the reviews don\'t lie. Every purchase has been flawless.', avatar: 'https://i.pravatar.cc/80?img=5' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-testimonial-slider',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="ts-root" [ngStyle]="sectionStyle()">
      <div class="ts-container">
        
        <header class="ts-header">
          <span class="ts-eyebrow" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}">Reviews</span>
          <h2 class="ts-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
        </header>

        <div class="ts-grid">
          @for (item of items(); track item.name; let i = $index) {
            <article class="ts-card" [class.ts-card-featured]="i === 0" [ngStyle]="cardStyle(i === 0)">
              
              <div class="ts-stars">
                @for (s of stars(item.rating); track s) { <i class="pi pi-star-fill ts-star"></i> }
              </div>

              <blockquote class="ts-quote" [ngStyle]="bodyStyle()">"{{ item.text }}"</blockquote>

              <footer class="ts-author">
                @if (item.avatar) {
                  <img [src]="item.avatar" [alt]="item.name" class="ts-avatar" loading="lazy" />
                } @else {
                  <div class="ts-avatar-placeholder">{{ item.name.charAt(0) }}</div>
                }
                <div>
                  <div class="ts-name" [ngStyle]="headingStyle()">{{ item.name }}</div>
                  @if (item.role) { <div class="ts-role" [ngStyle]="bodyStyle()">{{ item.role }}</div> }
                </div>
              </footer>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ts-root { position: relative; overflow: hidden; }
    .ts-container { max-width: 1300px; margin: 0 auto; padding: 0 var(--spacing-2xl, 1.5rem); }
    .ts-header { text-align: center; margin-bottom: var(--spacing-5xl, 3rem); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm); }
    .ts-eyebrow { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; }
    .ts-title { margin: 0; font-size: clamp(24px, 3.5vw, 40px); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
    
    .ts-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-xl, 1rem); }
    @media (min-width: 640px) { .ts-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .ts-grid { grid-template-columns: repeat(3, 1fr); } }

    .ts-card { position: relative; padding: var(--spacing-2xl, 1.5rem); display: flex; flex-direction: column; gap: var(--spacing-lg, 1rem); transition: transform 0.3s ease, box-shadow 0.3s ease; border: 1px solid var(--border-secondary); overflow: hidden; }
    .ts-card:hover { transform: translateY(-4px); }
    .ts-card::before { content: '\\201C'; position: absolute; top: 16px; right: 22px; font-family: Georgia, serif; font-size: 80px; line-height: 1; color: var(--accent-primary); opacity: 0.08; pointer-events: none; }
    
    .ts-stars { display: flex; gap: 3px; }
    .ts-star { font-size: 12px; color: var(--color-warning, #fbbf24); }
    .ts-quote { margin: 0; font-size: var(--font-size-sm, 0.9rem); line-height: 1.75; flex: 1; font-style: italic; }
    .ts-author { display: flex; align-items: center; gap: var(--spacing-md, 0.75rem); padding-top: var(--spacing-lg, 1rem); border-top: 1px solid var(--border-secondary); }
    
    .ts-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid var(--border-secondary); }
    .ts-avatar-placeholder { width: 42px; height: 42px; border-radius: 50%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0; }
    .ts-name { font-size: var(--font-size-sm, 0.9rem); font-weight: 700; }
    .ts-role { font-size: 11px; margin-top: 2px; opacity: 0.7; }
  `]
})
export class TestimonialSliderComponent {
  @Input() set config(v: TestimonialConfig) { this._config.set(v ?? {}); }
  private _config = signal<TestimonialConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'What our customers say',
    items: this._config().items,
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg'
  }));

  readonly items = computed(() => {
    const src = this.cfg().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK;
  });

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().typography?.headingColor || 'var(--text-primary)'
    };
  }

  bodyStyle(isFeatured: boolean = false) {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': isFeatured ? 'rgba(255,255,255,0.9)' : (this.cfg().typography?.bodyColor || 'var(--text-secondary)')
    };
  }

  cardStyle(isFeatured: boolean) {
    const base: any = {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`,
      'background-color': isFeatured ? 'var(--accent-primary)' : 'var(--bg-secondary)'
    };
    
    if (this.cfg().design?.boxShadow && this.cfg().design?.boxShadow !== 'none') {
      base['box-shadow'] = `var(--shadow-${this.cfg().design.boxShadow})`;
    }
    return base;
  }

  stars(n: number): number[] { return Array.from({ length: Math.max(0, Math.min(5, n)) }); }
}// // testimonial-slider.component.ts
