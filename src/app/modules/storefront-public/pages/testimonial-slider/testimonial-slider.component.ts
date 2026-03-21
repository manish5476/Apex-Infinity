import { Component, Input, OnInit, OnDestroy, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestimonialSliderConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-testimonial-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial-slider.component.html',
  styleUrls: ['./testimonial-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestimonialSliderComponent implements OnInit, OnDestroy {
  @Input() set config(v: TestimonialSliderConfig) { this._config.set(v ?? {}); }
  private _config = signal<TestimonialSliderConfig>({});

  readonly cfg = computed(() => ({
    title:           this._config().title           ?? 'What Our Customers Say',
    subtitle:        this._config().subtitle,
    layout:          this._config().layout          ?? 'single',
    autoPlay:        this._config().autoPlay        ?? true,
    paddingTop:      this._config().paddingTop      ?? 'lg',
    paddingBottom:   this._config().paddingBottom   ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? '#0f172a',
    themeMode:       this._config().themeMode       ?? 'dark',
    items:           this._config().items           ?? []
  }));

  currentSlide = signal(0);
  autoplayInterval: any;

  // Background Style Logic
  readonly paddingMap: Record<string, string> = { 
    'none': '0',
    'sm': 'var(--spacing-3xl)', 
    'md': 'var(--spacing-6xl)', 
    'lg': 'var(--spacing-9xl)' 
  };
  
  readonly sectionStyle = computed(() => ({
    'background-color': this.cfg().backgroundColor,
    'padding-top':      this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['lg'],
    'padding-bottom':   this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['lg']
  }));

  // Rating Helper
  getStars(rating: number | undefined): number[] {
    const count = Math.round(rating ?? 5); 
    return Array(count).fill(0);
  }

  ngOnInit() {
    if (this.cfg().autoPlay) {
      this.startAutoplay();
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  // --- Navigation ---
  next() {
    const total = this.cfg().items.length;
    if (total === 0) return;
    this.currentSlide.update(i => (i + 1) % total);
  }

  prev() {
    const total = this.cfg().items.length;
    if (total === 0) return;
    this.currentSlide.update(i => (i - 1 + total) % total);
  }

  goTo(index: number) {
    this.currentSlide.set(index);
  }

  // --- Autoplay ---
  startAutoplay() {
    this.stopAutoplay();
    const interval = 6000;
    this.autoplayInterval = setInterval(() => {
      this.next();
    }, interval);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
}