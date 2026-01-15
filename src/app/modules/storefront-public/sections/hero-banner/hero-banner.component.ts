import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type HeroHeight = 'small' | 'medium' | 'large' | 'full' | 'auto';
export type TextAlign = 'left' | 'center' | 'right';
export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export interface CTAButton {
  text: string;
  url: string;
  variant: ButtonVariant;
  icon?: string;
  external?: boolean;
}

export interface HeroConfig {
  // Layout
  height: HeroHeight;
  fullWidth?: boolean;
  
  // Background
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundPosition?: string;
  
  // Overlay
  overlayColor?: string;
  overlayOpacity: number;
  
  // Content
  title: string;
  subtitle?: string;
  textAlign: TextAlign;
  maxContentWidth?: string;
  
  // CTA
  ctaButtons?: CTAButton[];
  
  // Animation
  animateContent?: boolean;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="hero-banner relative overflow-hidden"
      [ngClass]="{
        'w-full': config?.fullWidth,
        'container mx-auto': !config?.fullWidth
      }"
    >
      <!-- Background -->
      @if (config?.backgroundImage) {
        <div 
          class="absolute inset-0 bg-cover bg-center"
          [style]="getBackgroundStyle()"
        ></div>
      }
      @if (config?.backgroundColor && !config?.backgroundImage) {
        <div 
          class="absolute inset-0"
          [style.background]="config.backgroundColor"
        ></div>
      }

      <!-- Overlay -->
      <div 
        class="absolute inset-0"
        [style.background-color]="config?.overlayColor || 'var(--color-overlay)'"
        [style.opacity]="config?.overlayOpacity || 0.5"
      ></div>

      <!-- Content -->
      <div 
        class="relative h-full px-var(--spacing-xl) flex flex-col"
        [ngClass]="getContentClasses()"
        [style.max-width]="config?.maxContentWidth"
      >
        <!-- Title -->
        <h1 
          class="font-heading font-bold text-white mb-var(--spacing-lg) leading-tight"
          [ngClass]="getTitleClasses()"
          [class.animate-fade-in-up]="config?.animateContent"
        >
          {{ config?.title }}
        </h1>

        <!-- Subtitle -->
        @if (config?.subtitle) {
          <p 
            class="font-body text-white/90 mb-var(--spacing-2xl) leading-relaxed"
            [ngClass]="getSubtitleClasses()"
            [class.animate-fade-in-up]="config?.animateContent"
            [style.animation-delay]="'0.1s'"
          >
            {{ config.subtitle }}
          </p>
        }

        <!-- CTA Buttons -->
        @if (config?.ctaButtons?.length) {
          <div 
            class="flex flex-wrap gap-var(--spacing-lg)"
            [ngClass]="getCTAAlignment()"
          >
            @for (btn of config.ctaButtons; track $index) {
              <a 
                [href]="btn.url"
                [target]="btn.external ? '_blank' : '_self'"
                [rel]="btn.external ? 'noopener noreferrer' : null"
                class="inline-flex items-center gap-var(--spacing-sm) px-var(--spacing-2xl) py-var(--spacing-lg) rounded-var(--ui-border-radius) font-medium transition-colors"
                [ngClass]="getButtonClasses(btn)"
              >
                @if (btn.icon) {
                  <i [class]="btn.icon"></i>
                }
                {{ btn.text }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hero-banner {
      font-family: var(--font-body);
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-up {
      animation: fadeInUp var(--transition-base) forwards;
    }
  `]
})
export class HeroBannerComponent {
  @Input() config: HeroConfig = {
    height: 'medium',
    overlayOpacity: 0.5,
    textAlign: 'center',
    title: ''
  };

  @HostBinding('class') get hostClasses() {
    return `block ${this.getHeightClass()}`;
  }

  private getHeightClass(): string {
    const heights = {
      small: 'h-[300px]',
      medium: 'h-[450px]',
      large: 'h-[600px]',
      full: 'min-h-screen',
      auto: 'min-h-[250px]'
    };
    return heights[this.config.height || 'medium'];
  }

  getBackgroundStyle(): string {
    const styles: string[] = [
      `background-image: url(${this.config.backgroundImage})`,
      `background-position: ${this.config.backgroundPosition || 'center'}`,
      `background-size: cover`
    ];
    return styles.join('; ');
  }

  getContentClasses(): string {
    const alignments = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right'
    };
    return `justify-center ${alignments[this.config.textAlign || 'center']}`;
  }

  getTitleClasses(): string {
    const sizes = {
      small: 'text-var(--font-size-4xl) md:text-var(--font-size-5xl)',
      medium: 'text-var(--font-size-4xl) md:text-var(--font-size-5xl)',
      large: 'text-var(--font-size-5xl) md:text-6xl',
      full: 'text-var(--font-size-5xl) md:text-6xl',
      auto: 'text-var(--font-size-4xl) md:text-var(--font-size-5xl)'
    };
    return sizes[this.config.height || 'medium'];
  }

  getSubtitleClasses(): string {
    const sizes = {
      small: 'text-var(--font-size-lg)',
      medium: 'text-var(--font-size-lg)',
      large: 'text-var(--font-size-xl)',
      full: 'text-var(--font-size-xl)',
      auto: 'text-var(--font-size-lg)'
    };
    return sizes[this.config.height || 'medium'];
  }

  getButtonClasses(btn: CTAButton): string {
    const base = 'border-var(--ui-border-width) ';
    
    const variants = {
      primary: 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700',
      secondary: 'bg-white text-gray-900 border-white hover:bg-gray-100',
      outline: 'bg-transparent text-white border-white hover:bg-white/10'
    };
    
    return base + (variants[btn.variant] || variants.primary);
  }

  getCTAAlignment(): string {
    const alignments = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end'
    };
    return alignments[this.config.textAlign || 'center'];
  }
}
// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-hero-banner',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="relative w-full overflow-hidden" 
//          [ngClass]="{
//            'h-[400px]': config.height === 'small',
//            'h-[600px]': config.height === 'medium' || !config.height,
//            'h-[800px]': config.height === 'large',
//            'h-screen': config.height === 'full'
//          }">
      
//       <div class="absolute inset-0 bg-cover bg-center"
//            [style.background-image]="'url(' + config.backgroundImage + ')'"></div>
      
//       <div class="absolute inset-0"
//            [style.background-color]="config.overlayColor || '#000000'"
//            [style.opacity]="config.overlayOpacity ?? 0.5"></div>

//       <div class="relative h-full container mx-auto px-4 flex flex-col justify-center"
//            [ngClass]="{
//              'items-start text-left': config.textAlign === 'left',
//              'items-center text-center': config.textAlign === 'center',
//              'items-end text-right': config.textAlign === 'right'
//            }">
        
//         <h1 class="text-4xl md:text-6xl font-bold text-white mb-4 max-w-3xl leading-tight">
//           {{ config.title }}
//         </h1>
        
//         @if (config.subtitle) {
//           <p class="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
//             {{ config.subtitle }}
//           </p>
//         }

//         @if (config.ctaButtons?.length) {
//           <div class="flex flex-wrap gap-4" 
//                [ngClass]="{'justify-center': config.textAlign === 'center'}">
//             @for (btn of config.ctaButtons; track $index) {
//               <a [href]="btn.url" 
//                  class="px-8 py-3 rounded-full font-semibold transition-all transform hover:-translate-y-0.5"
//                  [ngClass]="{
//                    'bg-primary-600 text-white hover:bg-primary-700': btn.variant === 'primary',
//                    'bg-white text-gray-900 hover:bg-gray-100': btn.variant === 'secondary',
//                    'border-2 border-white text-white hover:bg-white/10': btn.variant === 'outline'
//                  }">
//                 {{ btn.text }}
//               </a>
//             }
//           </div>
//         }
//       </div>
//     </div>
//   `
// })
// export class HeroBannerComponent {
//   @Input() config: any;
// }
