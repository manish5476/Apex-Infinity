// src/app/modules/storefront-public/components/product-slider/product-slider.component.ts
import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, inject, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductSliderConfig } from '@core/models/storefront.model';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-product-slider',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-slider.component.html',
  styleUrls: ['./product-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSliderComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

  @Input() set config(v: ProductSliderConfig) { this._config.set(v ?? {}); }
  private _config = signal<ProductSliderConfig>({});
  
  @Input() products: any[] = [];
  
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  orgSlug = signal<string>('');

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Top Products',
    itemsPerView:  this._config().itemsPerView  ?? 4,
    showPrice:     this._config().showPrice     ?? true,
    showAddToCart: this._config().showAddToCart ?? true,
    autoPlay:      this._config().autoPlay      ?? false,
    paddingTop:    this._config().paddingTop    ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor ?? ''
  }));
  
  // Scroll State
  canScrollLeft = signal(false);
  canScrollRight = signal(true);
  autoSlideInterval: any;

  // Layout Mappers
  readonly paddingMap: Record<string, string> = {
    none: '0',
    sm: 'var(--spacing-3xl)', 
    md: 'var(--spacing-5xl)', 
    lg: 'calc(var(--spacing-5xl) * 1.5)',
    xl: 'calc(var(--spacing-5xl) * 2)'
  };

  readonly sectionStyle = computed(() => ({
    'padding-top':    this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
    'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md'],
    'background-color': this.cfg().backgroundColor || ''
  }));

  // Compute Card Flex Basis for Desktop
  cardFlexBasis = computed(() => {
    const items = this.cfg().itemsPerView;
    return `calc((100% - ${(items - 1) * 24}px) / ${items})`;
  });

  ngOnInit(): void {
    this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.orgSlug.set(params.get('orgSlug') || '');
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.checkScrollButtons(), 200);
    if (this.cfg().autoPlay) {
      this.startAutoSlide();
    }
  }

  ngOnDestroy() {
    this.pauseAutoSlide();
      this.destroy$.next();
      this.destroy$.complete();
  }

  scroll(direction: 'left' | 'right') {
    const container = this.sliderContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8; 
    
    container.scrollBy({ 
      left: direction === 'left' ? -scrollAmount : scrollAmount, 
      behavior: 'smooth' 
    });
    
    setTimeout(() => this.checkScrollButtons(), 500);
  }

  checkScrollButtons() {
    const el = this.sliderContainer?.nativeElement;
    if (el) {
      this.canScrollLeft.set(el.scrollLeft > 10);
      this.canScrollRight.set(el.scrollLeft < (el.scrollWidth - el.clientWidth - 10));
    }
  }

  startAutoSlide() {
    const delay = 4000;
    this.autoSlideInterval = setInterval(() => {
      if (this.canScrollRight()) {
        this.scroll('right');
      } else {
        this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        setTimeout(() => this.checkScrollButtons(), 500);
      }
    }, delay);
  }

  pauseAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  handleAddToCart(product: any) {
    console.log('Add to cart clicked:', product.name);
  }
}
