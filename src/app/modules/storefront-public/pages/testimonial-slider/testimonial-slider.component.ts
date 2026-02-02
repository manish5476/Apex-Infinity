import { Component, Input, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonial-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial-slider.component.html',
  styleUrls: ['./testimonial-slider.component.scss']
})
export class TestimonialSliderComponent implements OnInit, OnDestroy {
  @Input() config: any = {};

  currentSlide = signal(0);
  autoplayInterval: any;

  // Background Style Logic
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Background Color
    style['background-color'] = this.config.backgroundColor || '#0f172a';
    
    // Background Image
    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }
    
    // Padding Logic
    const paddingMap: any = { 
      'sm': 'var(--spacing-3xl)', 
      'md': 'var(--spacing-6xl)', 
      'lg': 'var(--spacing-9xl)' 
    };
    
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-7xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-7xl)';
    
    return style;
  });

  // Rating Helper
  getStars(rating: number): number[] {
    // Default to 5 stars if not provided
    const count = Math.round(rating) || 5; 
    return Array(count).fill(0);
  }

  ngOnInit() {
    if (this.config.autoSlide !== false) { // Default to true
      this.startAutoplay();
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  // --- Navigation ---
  next() {
    const total = this.config.testimonials?.length || 0;
    if (total === 0) return;
    this.currentSlide.update(i => (i + 1) % total);
  }

  prev() {
    const total = this.config.testimonials?.length || 0;
    if (total === 0) return;
    this.currentSlide.update(i => (i - 1 + total) % total);
  }

  goTo(index: number) {
    this.currentSlide.set(index);
  }

  // --- Autoplay ---
  startAutoplay() {
    this.stopAutoplay();
    // Default 6 seconds
    const interval = this.config.interval || 6000;
    this.autoplayInterval = setInterval(() => {
      this.next();
    }, interval);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }
}

// import { Component, Input, OnInit, OnDestroy, computed, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-testimonial-slider',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './testimonial-slider.component.html',
//   styleUrls: ['./testimonial-slider.component.scss']
// })
// export class TestimonialSliderComponent implements OnInit, OnDestroy {
//   @Input() config: any = {};

//   currentSlide = signal(0);
//   autoplayInterval: any;

//   // Generate an array for star ratings (e.g. 5 -> [1,2,3,4,5])
//   getStars(rating: number): number[] {
//     return Array(Math.round(rating || 5)).fill(0);
//   }

//   // Background Logic
//   backgroundStyle = computed(() => {
//     const style: any = {};
//     if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;
//     if (this.config.backgroundImage) {
//       style['background-image'] = `url(${this.config.backgroundImage})`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//     }
    
//     // Padding
//     const paddingMap: any = { 'sm': '3rem', 'md': '6rem', 'lg': '9rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '6rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '6rem';
    
//     return style;
//   });

//   ngOnInit() {
//     if (this.config.autoSlide) {
//       this.startAutoplay();
//     }
//   }

//   ngOnDestroy() {
//     this.stopAutoplay();
//   }

//   // --- Navigation Logic ---

//   next() {
//     const total = this.config.testimonials?.length || 0;
//     this.currentSlide.update(i => (i + 1) % total);
//   }

//   prev() {
//     const total = this.config.testimonials?.length || 0;
//     this.currentSlide.update(i => (i - 1 + total) % total);
//   }

//   goTo(index: number) {
//     this.currentSlide.set(index);
//   }

//   // --- Autoplay Logic ---

//   startAutoplay() {
//     this.stopAutoplay(); // Clear existing to be safe
//     this.autoplayInterval = setInterval(() => {
//       this.next();
//     }, 5000); // 5 Seconds per slide
//   }

//   stopAutoplay() {
//     if (this.autoplayInterval) {
//       clearInterval(this.autoplayInterval);
//     }
//   }
// }