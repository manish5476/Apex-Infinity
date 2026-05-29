import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-split-screen-slider',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="split-slider-section w-full relative"
             [ngStyle]="{'background-color': config.design?.customBackground || 'var(--bg-primary)'}">
      
      <div class="flex flex-col md:flex-row w-full min-h-screen"
           [class.md:flex-row-reverse]="config.textSide === 'right'">
        
        <div class="split-text-col w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex items-center justify-center">
          <div class="sticky top-[20vh] max-w-lg">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                [ngStyle]="{
                  'font-family': config.typography?.headingFont || 'var(--font-heading)',
                  'color': config.typography?.headingColor || 'var(--text-primary)'
                }">
              {{ config.typography?.headingText || 'Gallery Showcase' }}
            </h2>
            <p class="text-lg leading-relaxed"
               [ngStyle]="{
                 'font-family': config.typography?.bodyFont || 'var(--font-body)',
                 'color': config.typography?.bodyColor || 'var(--text-secondary)'
               }">
              {{ config.typography?.subText }}
            </p>
          </div>
        </div>

        <div class="split-media-col w-full md:w-1/2 p-4 md:p-8 flex flex-col gap-4 md:gap-8">
          @for (slide of config.slides; track slide.image) {
            <div class="split-slide-card rounded-2xl overflow-hidden relative shadow-lg">
              <img [src]="slide.image" alt="Gallery slide" class="w-full h-auto object-cover" />
              
              @if (slide.caption) {
                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <span class="text-white font-medium text-lg">{{ slide.caption }}</span>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    .split-slider-section {
      overflow: visible; 
    }
    .split-text-col {
      height: 100%; 
    }
    .sticky {
      position: -webkit-sticky;
      position: sticky;
    }
    .split-slide-card {
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-secondary);
    }
  `]
})
export class SplitScreenSliderComponent {
  @Input() config: any = {};
}
