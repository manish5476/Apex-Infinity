import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hover-reveal-list',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="hover-reveal-section w-full relative min-h-[70vh] flex items-center justify-center"
             [ngStyle]="{'background-color': config.design?.customBackground || 'var(--bg-primary)'}">
      
      <div class="reveal-bg-container fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ease-out"
           [class.opacity-0]="!activeImage"
           [class.opacity-100]="activeImage">
        @if (activeImage) {
          <img [src]="activeImage" class="w-full h-full object-cover" alt="Reveal Preview" />
          <div class="absolute inset-0 bg-black/40"></div>
        }
      </div>

      <div class="reveal-content-container relative z-10 w-full max-w-[1200px] mx-auto px-6 py-24">
        <ul class="flex flex-col gap-4 md:gap-8">
          @for (item of config.items; track item.title) {
            <li class="reveal-item group flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-surface-200/20 pb-4 cursor-pointer"
                (mouseenter)="setActiveItem(item.image)"
                (mouseleave)="clearActiveItem()">
              
              <h2 class="reveal-title transition-colors duration-300 group-hover:text-white"
                  [ngStyle]="{
                    'font-family': config.typography?.headingFont || 'var(--font-heading)',
                    'color': activeImage ? 'rgba(255,255,255,0.4)' : (config.typography?.headingColor || 'var(--text-primary)')
                  }">
                {{ item.title }}
              </h2>
              
              @if (item.subtitle) {
                <span class="reveal-subtitle text-sm md:text-lg transition-colors duration-300 group-hover:text-white/80"
                      [ngStyle]="{
                        'font-family': config.typography?.bodyFont || 'var(--font-body)',
                        'color': activeImage ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)'
                      }">
                  {{ item.subtitle }}
                </span>
              }
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: [`
    .hover-reveal-section {
      clip-path: inset(0); 
    }
    .reveal-bg-container {
      position: absolute; 
    }
    .reveal-title {
      font-size: clamp(3rem, 6vw, 6rem);
      font-weight: var(--font-weight-bold);
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: -0.03em;
      margin: 0;
    }
  `]
})
export class HoverRevealListComponent {
  @Input() config: any = {};
  
  activeImage: string | null = null;

  setActiveItem(imageUrl: string | undefined) {
    if (imageUrl) this.activeImage = imageUrl;
  }

  clearActiveItem() {
    this.activeImage = null;
  }
}
