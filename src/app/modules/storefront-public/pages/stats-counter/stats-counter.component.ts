
import {
  Component, Input, signal, computed, OnInit, OnDestroy, 
  ElementRef, ChangeDetectionStrategy, ViewEncapsulation, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface StatItem {
  value: number;
  suffix?: string;   // e.g. '+', '%', 'k'
  label: string;
  prefix?: string;   // e.g. '₹', '$'
}

export interface StatsCounterConfig {
  items?: StatItem[];
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = { 
  none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' 
};

const MOCK: StatItem[] = [
  { value: 50000, suffix: '+', label: 'Happy Customers' },
  { value: 200, suffix: '+', label: 'Premium Products' },
  { value: 99, suffix: '%', label: 'Satisfaction Rate' },
  { value: 24, suffix: '/7', label: 'Customer Support' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="sc-root" [ngStyle]="sectionStyle()">
      <div class="sc-grid-bg" aria-hidden="true"></div>

      <div class="sc-container">
        <div class="sc-grid" [ngStyle]="gridCardStyle()">
          @for (item of items(); track item.label; let i = $index) {
            <div class="sc-stat">
              <div class="sc-value-row">
                @if (item.prefix) { <span class="sc-prefix" [ngStyle]="numberStyle()">{{ item.prefix }}</span> }
                <span class="sc-number" [ngStyle]="numberStyle()">{{ formatValue(displayValues()[i]) }}</span>
                @if (item.suffix) { <span class="sc-suffix" [ngStyle]="suffixStyle()">{{ item.suffix }}</span> }
              </div>
              <div class="sc-label" [ngStyle]="labelStyle()">{{ item.label }}</div>
              <div class="sc-accent" aria-hidden="true" [ngStyle]="{'background': cfg().typography?.headingColor || 'var(--accent-primary)'}"></div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .sc-root { position: relative; overflow: hidden; background-color: transparent; }
    
    .sc-grid-bg { position: absolute; inset: 0; background-image: radial-gradient(circle, var(--border-secondary) 1px, transparent 1px); background-size: 48px 48px; opacity: 0.15; pointer-events: none; }
    .sc-container { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 var(--spacing-2xl); }
    
    .sc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--border-secondary); border: 1px solid var(--border-secondary); overflow: hidden; }
    @media (min-width: 768px) { .sc-grid { grid-template-columns: repeat(4, 1fr); } }

    .sc-stat { position: relative; padding: var(--spacing-3xl) var(--spacing-2xl); background: var(--bg-primary); text-align: center; transition: background 0.3s ease; overflow: hidden; }
    .sc-stat:hover { background: var(--bg-secondary); }
    .sc-stat:hover .sc-accent { transform: scaleX(1); }

    .sc-value-row { display: flex; align-items: baseline; justify-content: center; gap: 2px; margin-bottom: var(--spacing-sm); }
    .sc-number { font-size: clamp(36px, 5vw, 60px); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .sc-suffix { font-size: clamp(20px, 3vw, 32px); font-weight: 700; align-self: flex-start; padding-top: 4px; }
    .sc-prefix { font-size: clamp(16px, 2.5vw, 24px); font-weight: 700; }
    
    .sc-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-tertiary); }
    
    .sc-accent { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
  `]
})
export class StatsCounterComponent implements OnInit, OnDestroy {
  private el = inject(ElementRef);

  @Input() set config(v: StatsCounterConfig) { this._config.set(v ?? {}); }
  private _config = signal<StatsCounterConfig>({});

  readonly cfg = computed(() => ({
    items: this._config().items,
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md'
  }));

  readonly items = computed(() => {
    const src = this.cfg().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK;
  });

  // Animated display values
  displayValues = signal<number[]>([]);
  private _observer: IntersectionObserver | null = null;
  private _animated = false;

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '5rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '5rem',
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  gridCardStyle() {
    return {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`
    };
  }

  numberStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-mono)',
      'color': this.cfg().typography?.headingColor || 'var(--text-primary)'
    };
  }

  suffixStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-mono)',
      'color': this.cfg().typography?.headingColor || 'var(--accent-primary)'
    };
  }

  labelStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-mono)',
      'color': this.cfg().typography?.bodyColor || 'var(--text-tertiary)'
    };
  }

  ngOnInit(): void {
    this.displayValues.set(this.items().map(() => 0));
    this._observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !this._animated) {
        this._animated = true;
        this._animateCounts();
      }
    }, { threshold: 0.3 });
    this._observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void { this._observer?.disconnect(); }

  private _animateCounts(): void {
    const targets = this.items().map(i => i.value);
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(now - start, duration);
      const progress = 1 - Math.pow(1 - (elapsed / duration), 3);
      this.displayValues.set(targets.map(t => Math.round(t * progress)));
      if (elapsed < duration) requestAnimationFrame(tick);
      else this.displayValues.set([...targets]);
    };
    requestAnimationFrame(tick);
  }

  formatValue(val: number): string {
    if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
    return val.toString();
  }
}



// // stats-counter.component.ts
// import {
//   Component, Input, signal, computed,
//   OnInit, OnDestroy, ElementRef, ChangeDetectionStrategy, inject
// } from '@angular/core';
// import { CommonModule } from '@angular/common';

// export interface StatItem {
//   value: number;
//   suffix?: string;   // e.g. '+', '%', 'k'
//   label: string;
//   prefix?: string;   // e.g. '₹', '$'
// }

// export interface StatsCounterConfig {
//   items?: StatItem[];
//   paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?: string;
//   themeMode?: 'light' | 'dark' | 'auto';
// }

// const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };

// const MOCK: StatItem[] = [
//   { value: 50000, suffix: '+', label: 'Happy Customers', prefix: '' },
//   { value: 200, suffix: '+', label: 'Premium Products', prefix: '' },
//   { value: 99, suffix: '%', label: 'Satisfaction Rate', prefix: '' },
//   { value: 24, suffix: '/7', label: 'Customer Support', prefix: '' }
// ];

// @Component({
//   selector: 'app-stats-counter',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './stats-counter.component.html',
//   styleUrls: ['./stats-counter.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class StatsCounterComponent implements OnInit, OnDestroy {
//   private el = inject(ElementRef);

//   @Input() set config(v: StatsCounterConfig) { this._config.set(v ?? {}); }
//   private _config = signal<StatsCounterConfig>({});

//   readonly cfg = computed(() => ({
//     paddingTop: this._config().paddingTop ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? '',
//     themeMode: this._config().themeMode ?? 'auto'
//   }));

//   readonly items = computed(() => {
//     const src = this._config().items;
//     return (Array.isArray(src) && src.length > 0) ? src : MOCK;
//   });

//   // Animated display values — start at 0, count up on intersection
//   displayValues = signal<number[]>([]);
//   private _observer: IntersectionObserver | null = null;
//   private _animated = false;

//   readonly sectionStyle = computed(() => ({
//     'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   ngOnInit(): void {
//     // Initialise display values to 0
//     this.displayValues.set(this.items().map(() => 0));

//     this._observer = new IntersectionObserver(entries => {
//       if (entries[0].isIntersecting && !this._animated) {
//         this._animated = true;
//         this._animateCounts();
//       }
//     }, { threshold: 0.3 });

//     this._observer.observe(this.el.nativeElement);
//   }

//   ngOnDestroy(): void {
//     this._observer?.disconnect();
//   }

//   private _animateCounts(): void {
//     const targets = this.items().map(i => i.value);
//     const duration = 1800;
//     const start = performance.now();

//     const tick = (now: number) => {
//       const elapsed = Math.min(now - start, duration);
//       const progress = this._easeOut(elapsed / duration);

//       this.displayValues.set(targets.map(t => Math.round(t * progress)));

//       if (elapsed < duration) requestAnimationFrame(tick);
//       else this.displayValues.set([...targets]);
//     };

//     requestAnimationFrame(tick);
//   }

//   private _easeOut(t: number): number {
//     return 1 - Math.pow(1 - t, 3);
//   }

//   formatValue(val: number): string {
//     if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
//     return val.toString();
//   }
// }
