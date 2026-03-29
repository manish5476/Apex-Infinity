// stats-counter.component.ts
import {
  Component, Input, signal, computed,
  OnInit, OnDestroy, ElementRef, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatItem {
  value: number;
  suffix?: string;   // e.g. '+', '%', 'k'
  label: string;
  prefix?: string;   // e.g. '₹', '$'
}

export interface StatsCounterConfig {
  items?: StatItem[];
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  themeMode?: 'light' | 'dark' | 'auto';
}

const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };

const MOCK: StatItem[] = [
  { value: 50000, suffix: '+', label: 'Happy Customers', prefix: '' },
  { value: 200, suffix: '+', label: 'Premium Products', prefix: '' },
  { value: 99, suffix: '%', label: 'Satisfaction Rate', prefix: '' },
  { value: 24, suffix: '/7', label: 'Customer Support', prefix: '' }
];

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-counter.component.html',
  styleUrls: ['./stats-counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsCounterComponent implements OnInit, OnDestroy {
  private el = inject(ElementRef);

  @Input() set config(v: StatsCounterConfig) { this._config.set(v ?? {}); }
  private _config = signal<StatsCounterConfig>({});

  readonly cfg = computed(() => ({
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? '',
    themeMode: this._config().themeMode ?? 'auto'
  }));

  readonly items = computed(() => {
    const src = this._config().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK;
  });

  // Animated display values — start at 0, count up on intersection
  displayValues = signal<number[]>([]);
  private _observer: IntersectionObserver | null = null;
  private _animated = false;

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().backgroundColor || ''
  }));

  ngOnInit(): void {
    // Initialise display values to 0
    this.displayValues.set(this.items().map(() => 0));

    this._observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !this._animated) {
        this._animated = true;
        this._animateCounts();
      }
    }, { threshold: 0.3 });

    this._observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }

  private _animateCounts(): void {
    const targets = this.items().map(i => i.value);
    const duration = 1800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(now - start, duration);
      const progress = this._easeOut(elapsed / duration);

      this.displayValues.set(targets.map(t => Math.round(t * progress)));

      if (elapsed < duration) requestAnimationFrame(tick);
      else this.displayValues.set([...targets]);
    };

    requestAnimationFrame(tick);
  }

  private _easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  formatValue(val: number): string {
    if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
    return val.toString();
  }
}

// import { Component, Input, ElementRef, ViewChild, AfterViewInit, computed, signal, Inject, PLATFORM_ID, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { StatsCounterConfig } from '@core/models/storefront.model';

// @Component({
//   selector: 'app-stats-counter',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './stats-counter.component.html',
//   styleUrls: ['./stats-counter.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class StatsCounterComponent implements AfterViewInit, OnDestroy {
//   @Input() set config(v: StatsCounterConfig) { this._config.set(v ?? {}); }
//   private _config = signal<StatsCounterConfig>({});

//   @ViewChild('container') containerRef!: ElementRef;

//   // Track display values for animation
//   displayValues = signal<string[]>([]);

//   private observer: IntersectionObserver | undefined;

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

//   readonly cfg = computed(() => ({
//     paddingTop: this._config().paddingTop ?? 'md',
//     paddingBottom: this._config().paddingBottom ?? 'md',
//     backgroundColor: this._config().backgroundColor ?? 'var(--bg-secondary)',
//     themeMode: this._config().themeMode ?? 'auto',
//     items: this._config().items ?? []
//   }));

//   readonly paddingMap: Record<string, string> = {
//     'none': '0',
//     'sm': 'var(--spacing-3xl)',
//     'md': 'var(--spacing-5xl)',
//     'lg': 'var(--spacing-7xl)'
//   };

//   readonly sectionStyle = computed(() => ({
//     'background-color': this.cfg().backgroundColor,
//     'padding-top': this.paddingMap[this.cfg().paddingTop] ?? this.paddingMap['md'],
//     'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
//   }));

//   ngAfterViewInit() {
//     if (isPlatformBrowser(this.platformId)) {
//       // Initialize with zeros
//       this.displayValues.set(this.cfg().items.map(() => '0'));

//       this.observer = new IntersectionObserver((entries) => {
//         entries.forEach(entry => {
//           if (entry.isIntersecting) {
//             this.animateCounters();
//             this.observer?.disconnect(); // Run once
//           }
//         });
//       }, { threshold: 0.2 });

//       if (this.containerRef?.nativeElement) {
//         this.observer.observe(this.containerRef.nativeElement);
//       }
//     }
//   }

//   ngOnDestroy() {
//     this.observer?.disconnect();
//   }

//   animateCounters() {
//     const duration = 2500; // 2.5 seconds total
//     const frameDuration = 1000 / 60; // 60 FPS
//     const totalFrames = Math.round(duration / frameDuration);

//     this.cfg().items.forEach((stat, index) => {
//       // Parse targets (handle "10.5" vs "1000")
//       const targetValue = stat.value || 0;
//       const isFloat = !Number.isInteger(targetValue);

//       let frame = 0;

//       const counter = setInterval(() => {
//         frame++;

//         // Easing Function (EaseOutExpo) for premium feel
//         const progress = frame / totalFrames;
//         const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

//         const currentVal = targetValue * easeProgress;

//         // Formatting
//         let formattedVal;
//         if (isFloat) {
//           formattedVal = currentVal.toFixed(1);
//         } else {
//           formattedVal = Math.round(currentVal).toString();
//         }

//         this.displayValues.update(vals => {
//           const newVals = [...vals];
//           newVals[index] = formattedVal;
//           return newVals;
//         });

//         if (frame === totalFrames) {
//           clearInterval(counter);
//         }
//       }, frameDuration);
//     });
//   }
// }