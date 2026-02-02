import { Component, Input, ElementRef, ViewChild, AfterViewInit, computed, signal, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-counter.component.html',
  styleUrls: ['./stats-counter.component.scss']
})
export class StatsCounterComponent implements AfterViewInit, OnDestroy {
  @Input() config: any = {};
  
  @ViewChild('container') containerRef!: ElementRef;
  
  // Track display values for animation
  displayValues = signal<string[]>([]);
  
  private observer: IntersectionObserver | undefined;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  backgroundStyle = computed(() => {
    const style: any = {};
    style['background-color'] = this.config.backgroundColor || 'var(--bg-secondary)';
    
    const paddingMap: any = { 
      'sm': 'var(--spacing-3xl)', 
      'md': 'var(--spacing-5xl)', 
      'lg': 'var(--spacing-7xl)' 
    };
    
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-5xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-5xl)';
    
    return style;
  });

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize with zeros
      this.displayValues.set(this.config.stats.map(() => '0'));

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

    this.config.stats.forEach((stat: any, index: number) => {
      // Parse targets (handle "10.5" vs "1000")
      const targetValue = parseFloat(stat.value) || 0;
      const isFloat = stat.value.includes('.');
      
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

// import { Component, Input, ElementRef, ViewChildren, QueryList, AfterViewInit, computed, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-stats-counter',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './stats-counter.component.html',
//   styleUrls: ['./stats-counter.component.scss']
// })
// export class StatsCounterComponent implements AfterViewInit {
//   @Input() config: any = {};
  
//   @ViewChildren('statItem') statItems!: QueryList<ElementRef>;
  
//   // Track display values for animation
//   displayValues = signal<number[]>([]);

//   backgroundStyle = computed(() => {
//     const style: any = {};
//     if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;
//     const paddingMap: any = { 'sm': '2rem', 'md': '4rem', 'lg': '6rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '4rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '4rem';
//     return style;
//   });

//   ngAfterViewInit() {
//     // Initialize array with zeros
//     this.displayValues.set(new Array(this.config.stats.length).fill(0));

//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           this.animateCounters();
//           observer.disconnect(); // Run once
//         }
//       });
//     }, { threshold: 0.2 });

//     if (this.statItems.first) {
//       observer.observe(this.statItems.first.nativeElement.parentElement);
//     }
//   }

//   animateCounters() {
//     const duration = 2000; // 2 seconds
//     const steps = 60;
//     const intervalTime = duration / steps;

//     this.config.stats.forEach((stat: any, index: number) => {
//       const target = parseInt(stat.value, 10) || 0;
//       const increment = target / steps;
//       let current = 0;

//       const timer = setInterval(() => {
//         current += increment;
//         if (current >= target) {
//           current = target;
//           clearInterval(timer);
//         }
        
//         // Update signal immutably
//         this.displayValues.update(vals => {
//           const newVals = [...vals];
//           newVals[index] = Math.floor(current);
//           return newVals;
//         });
//       }, intervalTime);
//     });
//   }
// }