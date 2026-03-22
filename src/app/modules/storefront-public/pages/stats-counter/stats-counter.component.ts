import { Component, Input, ElementRef, ViewChild, AfterViewInit, computed, signal, Inject, PLATFORM_ID, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StatsCounterConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-counter.component.html',
  styleUrls: ['./stats-counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsCounterComponent implements AfterViewInit, OnDestroy {
  @Input() set config(v: StatsCounterConfig) { this._config.set(v ?? {}); }
  private _config = signal<StatsCounterConfig>({});

  @ViewChild('container') containerRef!: ElementRef;

  // Track display values for animation
  displayValues = signal<string[]>([]);

  private observer: IntersectionObserver | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  readonly cfg = computed(() => ({
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor ?? 'var(--bg-secondary)',
    themeMode: this._config().themeMode ?? 'auto',
    items: this._config().items ?? []
  }));

  readonly paddingMap: Record<string, string> = {
    'none': '0',
    'sm': 'var(--spacing-3xl)',
    'md': 'var(--spacing-5xl)',
    'lg': 'var(--spacing-7xl)'
  };

  readonly sectionStyle = computed(() => ({
    'background-color': this.cfg().backgroundColor,
    'padding-top': this.paddingMap[this.cfg().paddingTop] ?? this.paddingMap['md'],
    'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
  }));

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize with zeros
      this.displayValues.set(this.cfg().items.map(() => '0'));

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounters();
            this.observer?.disconnect(); // Run once
          }
        });
      }, { threshold: 0.2 });

      if (this.containerRef?.nativeElement) {
        this.observer.observe(this.containerRef.nativeElement);
      }
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  animateCounters() {
    const duration = 2500; // 2.5 seconds total
    const frameDuration = 1000 / 60; // 60 FPS
    const totalFrames = Math.round(duration / frameDuration);

    this.cfg().items.forEach((stat, index) => {
      // Parse targets (handle "10.5" vs "1000")
      const targetValue = stat.value || 0;
      const isFloat = !Number.isInteger(targetValue);

      let frame = 0;

      const counter = setInterval(() => {
        frame++;

        // Easing Function (EaseOutExpo) for premium feel
        const progress = frame / totalFrames;
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        const currentVal = targetValue * easeProgress;

        // Formatting
        let formattedVal;
        if (isFloat) {
          formattedVal = currentVal.toFixed(1);
        } else {
          formattedVal = Math.round(currentVal).toString();
        }

        this.displayValues.update(vals => {
          const newVals = [...vals];
          newVals[index] = formattedVal;
          return newVals;
        });

        if (frame === totalFrames) {
          clearInterval(counter);
        }
      }, frameDuration);
    });
  }
}