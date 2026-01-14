import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full overflow-hidden" 
         [ngClass]="{
           'h-[400px]': config.height === 'small',
           'h-[600px]': config.height === 'medium' || !config.height,
           'h-[800px]': config.height === 'large',
           'h-screen': config.height === 'full'
         }">
      
      <div class="absolute inset-0 bg-cover bg-center"
           [style.background-image]="'url(' + config.backgroundImage + ')'"></div>
      
      <div class="absolute inset-0"
           [style.background-color]="config.overlayColor || '#000000'"
           [style.opacity]="config.overlayOpacity ?? 0.5"></div>

      <div class="relative h-full container mx-auto px-4 flex flex-col justify-center"
           [ngClass]="{
             'items-start text-left': config.textAlign === 'left',
             'items-center text-center': config.textAlign === 'center',
             'items-end text-right': config.textAlign === 'right'
           }">
        
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-4 max-w-3xl leading-tight">
          {{ config.title }}
        </h1>
        
        @if (config.subtitle) {
          <p class="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
            {{ config.subtitle }}
          </p>
        }

        @if (config.ctaButtons?.length) {
          <div class="flex flex-wrap gap-4" 
               [ngClass]="{'justify-center': config.textAlign === 'center'}">
            @for (btn of config.ctaButtons; track $index) {
              <a [href]="btn.url" 
                 class="px-8 py-3 rounded-full font-semibold transition-all transform hover:-translate-y-0.5"
                 [ngClass]="{
                   'bg-primary-600 text-white hover:bg-primary-700': btn.variant === 'primary',
                   'bg-white text-gray-900 hover:bg-gray-100': btn.variant === 'secondary',
                   'border-2 border-white text-white hover:bg-white/10': btn.variant === 'outline'
                 }">
                {{ btn.text }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class HeroBannerComponent {
  @Input() config: any;
}