// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-hero-banner',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="relative w-full overflow-hidden group isolate" 
//          [ngClass]="{
//            'h-[500px]': config.height === 'small',
//            'h-[700px]': config.height === 'medium' || !config.height,
//            'h-[900px]': config.height === 'large',
//            'h-screen': config.height === 'full'
//          }">
      
//       <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] ease-out group-hover:scale-105"
//            [style.background-image]="'url(' + config.backgroundImage + ')'">
//       </div>
      
//       <div class="absolute inset-0 transition-opacity duration-500"
//            [style.background-color]="config.overlayColor || '#000000'"
//            [style.opacity]="config.overlayOpacity ?? 0.4">
//       </div>

//       <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 pointer-events-none"></div>

//       <div class="relative h-full container mx-auto px-6 md:px-12 flex flex-col justify-center z-10"
//            [ngClass]="{
//              'items-start text-left': config.textAlign === 'left',
//              'items-center text-center': config.textAlign === 'center',
//              'items-end text-right': config.textAlign === 'right'
//            }">
        
//         <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 max-w-4xl leading-tight tracking-tight drop-shadow-lg animate-fade-in-up">
//           {{ config.title }}
//         </h1>
        
//         @if (config.subtitle) {
//           <p class="text-lg md:text-2xl text-gray-100 mb-10 max-w-2xl leading-relaxed font-light drop-shadow-md opacity-90">
//             {{ config.subtitle }}
//           </p>
//         }

//         @if (config.ctaButtons?.length) {
//           <div class="flex flex-wrap gap-4" 
//                [ngClass]="{'justify-center': config.textAlign === 'center'}">
            
//             @for (btn of config.ctaButtons; track $index) {
//               <a [href]="btn.url" 
//                  class="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:-translate-y-1 focus:ring-4"
//                  [ngClass]="{
//                    'bg-primary-600 text-white shadow-lg shadow-primary-900/20 hover:bg-primary-500 hover:shadow-primary-600/40 border border-transparent': btn.variant === 'primary',
                   
//                    'bg-white text-gray-900 shadow-xl hover:bg-gray-50 border border-transparent': btn.variant === 'secondary',
                   
//                    'bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 hover:border-white/50': btn.variant === 'outline'
//                  }">
                
//                 @if (btn.icon) {
//                   <i [class]="'mr-2 pi pi-' + btn.icon"></i>
//                 }
                
//                 {{ btn.text }}
//               </a>
//             }
//           </div>
//         }
//       </div>
//     </div>
//   `,
//   styles: [`
//     @keyframes fade-in-up {
//       from { opacity: 0; transform: translateY(20px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
//     .animate-fade-in-up {
//       animation: fade-in-up 0.8s ease-out forwards;
//     }
//   `]
// })
// export class HeroBannerComponent {
//   @Input() config: any;
// }
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
