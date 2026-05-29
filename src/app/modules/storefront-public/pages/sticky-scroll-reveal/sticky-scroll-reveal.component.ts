import { Component, Input, ViewEncapsulation, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sticky-scroll-reveal',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="sticky-reveal-section w-full relative"
             [ngStyle]="{'background-color': config.design?.customBackground || 'var(--bg-primary)'}">
      
      <div class="max-w-[1400px] mx-auto flex flex-col md:flex-row relative min-h-[150vh]"
           [class.md:flex-row-reverse]="config.mediaSide === 'right'">
        
        <div class="reveal-media-col w-full md:w-1/2 p-4 md:p-12 relative h-screen sticky top-0 flex items-center justify-center">
          <div class="media-frame w-full h-[60vh] md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-700">
            
            @for (block of config.blocks; track block.title; let i = $index) {
              <img [src]="block.image" 
                   [class.opacity-100]="activeIndex === i"
                   [class.opacity-0]="activeIndex !== i"
                   [class.scale-100]="activeIndex === i"
                   [class.scale-105]="activeIndex !== i"
                   class="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out" 
                   alt="Reveal visual" />
            }
          </div>
        </div>

        <div class="reveal-text-col w-full md:w-1/2 p-4 md:p-12 flex flex-col justify-center gap-[50vh] py-[50vh]">
          @for (block of config.blocks; track block.title; let i = $index) {
            <div #scrollBlock [attr.data-index]="i" 
                 class="scroll-text-block transition-opacity duration-500"
                 [class.opacity-100]="activeIndex === i"
                 [class.opacity-40]="activeIndex !== i">
                 
              <h2 class="text-4xl md:text-5xl font-bold mb-6"
                  [ngStyle]="{
                    'font-family': config.typography?.headingFont || 'var(--font-heading)',
                    'color': config.typography?.headingColor || 'var(--text-primary)'
                  }">
                {{ block.title }}
              </h2>
              
              <p class="text-xl leading-relaxed"
                 [ngStyle]="{
                   'font-family': config.typography?.bodyFont || 'var(--font-body)',
                   'color': config.typography?.bodyColor || 'var(--text-secondary)'
                 }">
                {{ block.content }}
              </p>
            </div>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    .sticky-reveal-section {
      position: relative;
    }
    .reveal-media-col {
      position: -webkit-sticky;
      position: sticky;
      top: 0;
      height: 100vh;
    }
  `]
})
export class StickyScrollRevealComponent implements AfterViewInit {
  @Input() config: any = {};
  @ViewChildren('scrollBlock') scrollBlocks!: QueryList<ElementRef>;
  
  activeIndex = 0;

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '-40% 0px -40% 0px', 
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          this.activeIndex = index;
        }
      });
    }, options);

    this.scrollBlocks.forEach(block => observer.observe(block.nativeElement));
  }
}
