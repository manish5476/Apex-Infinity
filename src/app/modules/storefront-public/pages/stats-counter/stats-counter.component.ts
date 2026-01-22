import { Component, Input, ElementRef, ViewChildren, QueryList, AfterViewInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-counter.component.html',
  styleUrls: ['./stats-counter.component.scss']
})
export class StatsCounterComponent implements AfterViewInit {
  @Input() config: any = {};
  
  @ViewChildren('statItem') statItems!: QueryList<ElementRef>;
  
  // Track display values for animation
  displayValues = signal<number[]>([]);

  backgroundStyle = computed(() => {
    const style: any = {};
    if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;
    const paddingMap: any = { 'sm': '2rem', 'md': '4rem', 'lg': '6rem' };
    style['padding-top'] = paddingMap[this.config.paddingTop] || '4rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '4rem';
    return style;
  });

  ngAfterViewInit() {
    // Initialize array with zeros
    this.displayValues.set(new Array(this.config.stats.length).fill(0));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounters();
          observer.disconnect(); // Run once
        }
      });
    }, { threshold: 0.2 });

    if (this.statItems.first) {
      observer.observe(this.statItems.first.nativeElement.parentElement);
    }
  }

  animateCounters() {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const intervalTime = duration / steps;

    this.config.stats.forEach((stat: any, index: number) => {
      const target = parseInt(stat.value, 10) || 0;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        
        // Update signal immutably
        this.displayValues.update(vals => {
          const newVals = [...vals];
          newVals[index] = Math.floor(current);
          return newVals;
        });
      }, intervalTime);
    });
  }
}