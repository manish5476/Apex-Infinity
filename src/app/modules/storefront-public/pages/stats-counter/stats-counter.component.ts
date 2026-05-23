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
