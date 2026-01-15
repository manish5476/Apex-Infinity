import { Component, Input, HostBinding, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type HeroHeight = 'small' | 'medium' | 'large' | 'full' | 'auto';
export type TextAlign = 'left' | 'center' | 'right';
export type ContentPosition = 'top-left' | 'top-center' | 'top-right' | 
                              'center-left' | 'center' | 'center-right' | 
                              'bottom-left' | 'bottom-center' | 'bottom-right';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
export type OverlayType = 'solid' | 'gradient' | 'gradient-radial' | 'none';

export interface CTAButton {
  text: string;
  url: string;
  variant: ButtonVariant;
  icon?: string;
  external?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface HeroConfig {
  // Layout & Dimensions
  height: HeroHeight;
  minHeight?: string;
  maxHeight?: string;
  fullWidth?: boolean;
  container?: boolean;
  
  // Background
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  parallax?: boolean;
  videoBackground?: string;
  
  // Overlay
  overlayType: OverlayType;
  overlayColor?: string;
  overlayGradient?: string;
  overlayOpacity: number;
  blurOverlay?: boolean;
  
  // Content
  title: string;
  subtitle?: string;
  tagline?: string;
  textAlign: TextAlign;
  contentPosition: ContentPosition;
  maxContentWidth?: string;
  textColor?: string;
  
  // Typography
  titleSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  subtitleSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  
  // Call to Action
  ctaButtons?: CTAButton[];
  ctaButtonsAlignment?: 'start' | 'center' | 'end' | 'stretch';
  
  // Badge/Indicator
  badge?: {
    text: string;
    color: string;
    position: 'top-left' | 'top-right';
  };
  
  // Animation
  animateTitle?: boolean;
  animateSubtitle?: boolean;
  staggerButtons?: boolean;
  
  // Advanced
  customClasses?: string;
  contentPadding?: string;
  borderRadius?: string;
  shadow?: boolean;
  glassEffect?: boolean;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section 
      class="hero-banner relative overflow-hidden transition-all duration-300"
      [ngClass]="[
        config?.customClasses || '',
        config?.shadow ? 'shadow-2xl' : '',
        config?.glassEffect ? 'backdrop-blur-sm bg-white/5' : '',
        config?.fullWidth ? 'w-full' : 'mx-auto',
        config?.borderRadius || 'rounded-none'
      ]"
      [style.min-height]="config?.minHeight"
      [style.max-height]="config?.maxHeight"
    >
      <!-- Badge -->
      @if (config?.badge) {
        <div class="absolute z-20 {{getBadgePosition(config.badge.position)}} m-4">
          <span class="px-3 py-1 text-xs font-semibold rounded-full {{config.badge.color}}">
            {{config.badge.text}}
          </span>
        </div>
      }

      <!-- Video Background -->
      @if (config?.videoBackground) {
        <div class="absolute inset-0 z-0 overflow-hidden">
          <video 
            class="w-full h-full object-cover"
            [autoplay]="true"
            [muted]="true"
            [loop]="true"
            [playsinline]="true"
            [src]="config.videoBackground"
          ></video>
        </div>
      }

      <!-- Image Background -->
      @if (config?.backgroundImage && !config.videoBackground) {
        <div 
          class="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700"
          [style.background-image]="'url(' + config.backgroundImage + ')'"
          [style.background-size]="config.backgroundSize || 'cover'"
          [style.background-position]="config.backgroundPosition || 'center'"
          [class.parallax]="config.parallax"
        ></div>
      }

      <!-- Color Background -->
      @if (config?.backgroundColor && !config.backgroundImage && !config.videoBackground) {
        <div 
          class="absolute inset-0 z-0"
          [style.background]="config.backgroundColor"
        ></div>
      }

      <!-- Overlay -->
      @if (config?.overlayType !== 'none') {
        <div 
          class="absolute inset-0 z-1 transition-all duration-300"
          [ngClass]="{
            'backdrop-blur-xs': config.blurOverlay
          }"
          [style]="getOverlayStyle()"
        ></div>
      }

      <!-- Content Container -->
      <div 
        class="relative z-10 h-full w-full"
        [ngClass]="{
          'container mx-auto': config?.container !== false,
          'px-4 sm:px-6 lg:px-8': config?.container !== false
        }"
        [style.padding]="config?.contentPadding || '2rem'"
      >
        <div class="h-full flex {{getContentPositionClasses()}}">
          <div 
            class="{{getAnimationClasses()}}"
            [style.max-width]="config?.maxContentWidth || '42rem'"
          >
            <!-- Tagline -->
            @if (config?.tagline) {
              <div class="mb-3">
                <span class="inline-block px-3 py-1 text-sm font-semibold {{getTextColor('muted')}} bg-white/20 rounded-full backdrop-blur-sm">
                  {{config.tagline}}
                </span>
              </div>
            }

            <!-- Title -->
            <h1 
              class="font-bold leading-tight tracking-tight {{getTitleSize()}} {{getTitleWeight()}} {{getTextColor()}} mb-4"
              [class.animate-fade-in-up]="config?.animateTitle"
            >
              {{ config?.title }}
            </h1>

            <!-- Subtitle -->
            @if (config?.subtitle) {
              <p 
                class="{{getSubtitleSize()}} {{getTextColor('muted')}} mb-8 leading-relaxed"
                [class.animate-fade-in-up]="config?.animateSubtitle"
                [style.animation-delay]="config?.animateTitle ? '0.2s' : '0s'"
              >
                {{ config.subtitle }}
              </p>
            }

            <!-- CTA Buttons -->
            @if (config?.ctaButtons?.length) {
              <div 
                class="flex flex-wrap gap-3 {{getCTAAlignment()}}"
                [class.stagger-animation]="config?.staggerButtons"
              >
                @for (btn of config.ctaButtons; track $index; let i = $index) {
                  <button
                    *ngIf="btn.onClick"
                    type="button"
                    (click)="btn.onClick?.()"
                    [disabled]="btn.disabled"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed {{getButtonClasses(btn)}}"
                    [style.animation-delay]="config?.staggerButtons ? (i * 0.1) + 's' : '0s'"
                  >
                    @if (btn.icon) {
                      <i class="{{btn.icon}}"></i>
                    }
                    {{ btn.text }}
                  </button>
                  
                  <a
                    *ngIf="!btn.onClick"
                    [href]="btn.url"
                    [target]="btn.external ? '_blank' : '_self'"
                    [rel]="btn.external ? 'noopener noreferrer' : null"
                    [attr.aria-label]="btn.text"
                    [disabled]="btn.disabled"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed {{getButtonClasses(btn)}}"
                    [style.animation-delay]="config?.staggerButtons ? (i * 0.1) + 's' : '0s'"
                  >
                    @if (btn.icon) {
                      <i class="{{btn.icon}}"></i>
                    }
                    {{ btn.text }}
                    @if (btn.external) {
                      <i class="fas fa-external-link-alt text-xs"></i>
                    }
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-banner {
      box-sizing: border-box;
    }
    
    .parallax {
      will-change: transform;
      transform: translateZ(0);
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .stagger-animation > * {
      opacity: 0;
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    /* Button Variants */
    .btn-primary {
      @apply bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800;
    }
    
    .btn-secondary {
      @apply bg-white text-gray-900 shadow-lg hover:shadow-xl hover:bg-gray-50;
    }
    
    .btn-outline {
      @apply border-2 border-white text-white hover:bg-white/10;
    }
    
    .btn-ghost {
      @apply text-white hover:bg-white/10;
    }
    
    .btn-gradient {
      @apply bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700;
    }
  `]
})
export class HeroBannerComponent implements OnInit {
  @Input() config: Partial<HeroConfig> = {
    height: 'medium',
    overlayType: 'solid',
    overlayOpacity: 0.5,
    textAlign: 'center',
    contentPosition: 'center',
    titleSize: '3xl',
    subtitleSize: 'lg',
    titleWeight: 'bold'
  };

  @HostBinding('class') get hostClasses() {
    return `block ${this.getHeightClass()}`;
  }

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.applyDefaultConfig();
  }

  private applyDefaultConfig() {
    this.config = {
      ...{
        height: 'medium',
        overlayType: 'solid',
        overlayOpacity: 0.5,
        textAlign: 'center',
        contentPosition: 'center',
        container: true,
        backgroundSize: 'cover',
        titleSize: '3xl',
        subtitleSize: 'lg',
        titleWeight: 'bold',
        ctaButtonsAlignment: 'start'
      },
      ...this.config
    };
  }

  getHeightClass(): string {
    const heights = {
      small: 'h-[400px] md:h-[500px]',
      medium: 'h-[500px] md:h-[600px] lg:h-[700px]',
      large: 'h-[600px] md:h-[700px] lg:h-[800px]',
      full: 'min-h-screen',
      auto: 'min-h-[300px]'
    };
    return heights[this.config.height || 'medium'];
  }

  getOverlayStyle(): string {
    if (!this.config.overlayType || this.config.overlayType === 'none') {
      return '';
    }

    const opacity = this.config.overlayOpacity ?? 0.5;
    
    switch (this.config.overlayType) {
      case 'gradient':
        return `background: linear-gradient(to bottom, ${this.config.overlayColor || '#000000'}00 0%, ${this.config.overlayColor || '#000000'}${Math.round(opacity * 255).toString(16)} 100%); opacity: 1;`;
      
      case 'gradient-radial':
        return `background: radial-gradient(circle at center, transparent 0%, ${this.config.overlayColor || '#000000'}${Math.round(opacity * 255).toString(16)} 100%); opacity: 1;`;
      
      case 'solid':
      default:
        return `background-color: ${this.config.overlayColor || '#000000'}; opacity: ${opacity};`;
    }
  }

  getContentPositionClasses(): string {
    const positions = {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      'center': 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-left': 'items-end justify-start',
      'bottom-center': 'items-end justify-center',
      'bottom-right': 'items-end justify-end',
    };
    return positions[this.config.contentPosition || 'center'];
  }

  getTextColor(type: 'normal' | 'muted' = 'normal'): string {
    const color = this.config.textColor || '#ffffff';
    const isLight = this.isLightColor(color);
    
    if (type === 'muted') {
      return isLight ? 'text-gray-800' : 'text-gray-200';
    }
    
    return isLight ? 'text-gray-900' : 'text-white';
  }

  private isLightColor(color: string): boolean {
    // Simple check - if overlay is light, use dark text
    const opacity = this.config.overlayOpacity || 0.5;
    return opacity < 0.3;
  }

  getTitleSize(): string {
    const sizes = {
      xs: 'text-2xl md:text-3xl',
      sm: 'text-3xl md:text-4xl',
      md: 'text-4xl md:text-5xl',
      lg: 'text-5xl md:text-6xl',
      xl: 'text-6xl md:text-7xl',
      '2xl': 'text-7xl md:text-8xl',
      '3xl': 'text-8xl md:text-9xl',
      '4xl': 'text-9xl md:text-10xl'
    };
    return sizes[this.config.titleSize || '3xl'];
  }

  getSubtitleSize(): string {
    const sizes = {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl'
    };
    return sizes[this.config.subtitleSize || 'lg'];
  }

  getTitleWeight(): string {
    const weights = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold'
    };
    return weights[this.config.titleWeight || 'bold'];
  }

  getButtonClasses(btn: CTAButton): string {
    const base = 'btn-';
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      gradient: 'btn-gradient'
    };
    return variants[btn.variant] || 'btn-primary';
  }

  getCTAAlignment(): string {
    const alignments = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      stretch: 'justify-stretch'
    };
    return alignments[this.config.ctaButtonsAlignment || 'start'];
  }

  getBadgePosition(position: 'top-left' | 'top-right'): string {
    return position === 'top-right' ? 'top-0 right-0' : 'top-0 left-0';
  }

  getAnimationClasses(): string {
    if (this.config.animateTitle || this.config.animateSubtitle) {
      return 'will-change-transform';
    }
    return '';
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
