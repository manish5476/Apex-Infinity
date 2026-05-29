import { Component, Input, computed, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionButton, PADDING_MAP } from '../../dynamic-page/section.types';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface HeroBannerConfig extends SectionBaseConfig {
  title?: string;
  titleTag?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  backgroundImage?: string;
  height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
  overlayOpacity?: number;
  ctaButtons?: SectionButton[];
  contentPosition?: 'left' | 'center' | 'right';
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="hero-banner" [ngStyle]="hostStyles()">
      @if (cfg().backgroundImage) {
        <div class="hero-bg" [style.backgroundImage]="'url(' + cfg().backgroundImage + ')'"></div>
      } @else {
        <div class="hero-bg hero-bg--fallback" [ngStyle]="fallbackBgStyle()"></div>
      }

      <div class="hero-overlay" [style.opacity]="(cfg().overlayOpacity ?? 30) / 100" [ngStyle]="{'background-color': cfg().design?.overlayColor || '#202124'}"></div>

      <div class="hero-inner" [ngClass]="'hero-inner--' + (cfg().contentPosition ?? 'center')">
        <div class="hero-content" [ngClass]="'hero-content--' + (cfg().alignment ?? 'center')">

          @if (cfg().title) {
            <ng-container [ngSwitch]="cfg().titleTag ?? 'h1'">
              <h1 *ngSwitchCase="'h1'" class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h1>
              <h2 *ngSwitchCase="'h2'" class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
              <h3 *ngSwitchCase="'h3'" class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h3>
              <h1 *ngSwitchDefault class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h1>
            </ng-container>
          }

          @if (cfg().subtitle) {
            <p class="hero-subtitle" [ngStyle]="bodyStyle()">{{ cfg().subtitle }}</p>
          }

          @if (cfg().ctaButtons?.length) {
            <div class="hero-actions">
              @for (btn of cfg().ctaButtons; track btn.text) {
                @if (btn.text) {
                  <a [href]="btn.link || '#'"
                     class="hero-btn"
                     [ngClass]="'hero-btn--' + (btn.variant ?? 'primary')"
                     [ngStyle]="buttonStyle(btn)">
                    @if (btn.icon) { <i [class]="btn.icon" aria-hidden="true"></i> }
                    <span [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">{{ btn.text }}</span>
                  </a>
                }
              }
            </div>
          }

        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    /* --- Material Design Standard Easing --- */
    :host {
      --md-sys-motion-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
      --md-sys-motion-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
      --md-sys-color-primary: var(--theme-accent-primary, #1a73e8); /* Google Blue */
    }

    .hero-banner {
      position: relative; width: 100%; overflow: hidden;
      font-family: var(--font-heading, 'Google Sans', Roboto, Arial, sans-serif);
      display: flex; flex-direction: column;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }

    /* --- Background --- */
    .hero-bg {
      position: absolute; inset: -2%; background-size: cover; background-position: center; background-repeat: no-repeat; z-index: 0;
      animation: md-scale-in 10s var(--md-sys-motion-easing-decelerate) forwards; will-change: transform;
    }

    /* Google Store style clean mesh fallback */
    .hero-bg--fallback {
      background: radial-gradient(circle at 15% 50%, color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent), transparent 50%),
                  radial-gradient(circle at 85% 30%, color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent), transparent 50%);
    }

    /* --- Overlay --- */
    .hero-overlay { position: absolute; inset: 0; z-index: 1; background-color: #202124; pointer-events: none; }
    .hero-bg--fallback + .hero-overlay { display: none; }

    /* --- Layout --- */
    .hero-inner { position: relative; z-index: 2; width: 100%; flex: 1; display: flex; align-items: center; padding: 0 5%; max-width: 1440px; margin: 0 auto; }
    .hero-inner--left { justify-content: flex-start; }
    .hero-inner--center { justify-content: center; }
    .hero-inner--right { justify-content: flex-end; }

    .hero-content { max-width: 840px; width: 100%; display: flex; flex-direction: column; }
    .hero-content--left { text-align: left; align-items: flex-start; }
    .hero-content--center { text-align: center; align-items: center; }
    .hero-content--right { text-align: right; align-items: flex-end; }

    /* --- Typography (Google Display Styles) --- */
    .hero-title {
      font-size: clamp(2.75rem, 5vw + 1rem, 4.5rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.04em; margin: 0 0 1rem;
      opacity: 0; animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) forwards;
    }

    .hero-subtitle {
      font-size: clamp(1.125rem, 2vw, 1.375rem); font-weight: 400; line-height: 1.6; margin: 0 0 2rem; max-width: 60ch;
      opacity: 0; animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.1s forwards;
    }

    /* --- Buttons (Material 3) --- */
    .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; opacity: 0; animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.2s forwards; }

    .hero-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      height: 48px; padding: 0 24px; border-radius: 100px; font-size: 1rem; font-weight: 500; text-decoration: none;
      transition: all 0.2s var(--md-sys-motion-easing-standard); letter-spacing: 0.01em;
    }

    /* M3 Filled Button */
    .hero-btn--primary {
      background-color: var(--md-sys-color-primary); color: var(--bg-primary); border: 1px solid transparent;
      box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    }
    .hero-btn--primary:hover { box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15); filter: brightness(0.95); }
    .hero-btn--primary:active { box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15); }

    /* M3 Outlined Button */
    .hero-btn--secondary, .hero-btn--outline {
      background-color: transparent; color: var(--md-sys-color-primary); border: 1px solid var(--border-secondary, #dadce0);
    }
    .hero-btn--secondary:hover, .hero-btn--outline:hover { background-color: var(--bg-secondary, #f8f9fa); border-color: var(--md-sys-color-primary, #d2e3fc); }

    /* M3 Text Button */
    .hero-btn--ghost { background-color: transparent; padding: 0 16px; }
    .hero-btn--ghost:hover { background-color: rgba(255, 255, 255, 0.08); }

    /* Adjust ghost button if on clean background */
    .hero-bg--fallback ~ .hero-inner .hero-btn--ghost { color: var(--md-sys-color-primary); }
    .hero-bg--fallback ~ .hero-inner .hero-btn--ghost:hover { background-color: rgba(26, 115, 232, 0.04); }

    /* --- Keyframes --- */
    @keyframes md-scale-in { 0% { transform: scale(1.04); } 100% { transform: scale(1); } }
    @keyframes md-fade-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  `]
})
export class HeroBannerComponent {
  @Input() set config(v: HeroBannerConfig) { this._config.set(v ?? {}); }
  private _config = signal<HeroBannerConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title,
    titleTag: this._config().titleTag ?? 'h1',
    subtitle: this._config().subtitle,
    alignment: this._config().alignment ?? 'center',
    backgroundImage: this._config().backgroundImage,
    height: this._config().height ?? 'medium',
    overlayOpacity: this._config().overlayOpacity ?? 30,
    ctaButtons: this._config().ctaButtons,
    contentPosition: this._config().contentPosition ?? 'center',
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor
  }));

  readonly hostStyles = computed(() => {
    const pt = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingTop] : '64px';
    const pb = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingBottom] : '64px';

    const heightMap: Record<string, string> = {
      small: '480px',
      medium: '640px',
      large: '800px',
      screen: '100vh',
      auto: 'auto'
    };

    return {
      'padding-top': pt,
      'padding-bottom': pb,
      'min-height': heightMap[this.cfg().height],
      'background-color': this.cfg().design?.customBackground || this.cfg().backgroundColor || 'var(--bg-primary, #f8f9fa)'
    };
  });

  fallbackBgStyle() {
    return {
      'background-color': this.cfg().design?.customBackground || this.cfg().backgroundColor || 'var(--bg-primary, #f8f9fa)'
    };
  }

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().backgroundImage 
        ? '#ffffff' 
        : (this.cfg().typography?.headingColor || 'var(--text-primary, #202124)'),
      'font-size': this.cfg().typography?.headingSize === '2xl' ? 'clamp(3.5rem, 6vw + 1rem, 5.5rem)' : undefined
    };
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().backgroundImage 
        ? '#e8eaed' 
        : (this.cfg().typography?.bodyColor || 'var(--text-secondary, #5f6368)')
    };
  }

  buttonStyle(btn: SectionButton) {
    if (btn.variant === 'primary') {
      return {
        'background-color': btn.buttonColor || this.cfg().typography?.headingColor || 'var(--md-sys-color-primary)',
        'color': this.cfg().backgroundImage ? 'var(--text-primary)' : 'var(--bg-primary)'
      };
    }
    
    if (btn.variant === 'secondary' || btn.variant === 'outline') {
      return {
        'color': btn.buttonColor || this.cfg().typography?.headingColor || (this.cfg().backgroundImage ? '#ffffff' : 'var(--md-sys-color-primary)'),
        'border-color': btn.buttonColor || this.cfg().typography?.headingColor || (this.cfg().backgroundImage ? '#ffffff' : 'var(--border-secondary)')
      };
    }

    return {
       'color': btn.buttonColor || this.cfg().typography?.headingColor || (this.cfg().backgroundImage ? '#ffffff' : 'var(--md-sys-color-primary)')
    };
  }
}// // hero-banner.component.ts
// import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { SectionBaseConfig, SectionButton, PADDING_MAP } from '../../dynamic-page/section.types';

// export interface HeroBannerConfig extends SectionBaseConfig {
//   title?: string;
//   titleTag?: 'h1' | 'h2' | 'h3';
//   subtitle?: string;
//   alignment?: 'left' | 'center' | 'right';
//   backgroundImage?: string;
//   height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
//   overlayOpacity?: number;
//   ctaButtons?: SectionButton[];
//   contentPosition?: 'left' | 'center' | 'right';
// }

// @Component({
//   selector: 'app-hero-banner',
//   standalone: true,
//   imports: [CommonModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
// <section class="hero-banner" [style]="hostStyles">
//   @if (config.backgroundImage) {
//     <div class="hero-bg"
//       [style.backgroundImage]="'url(' + config.backgroundImage + ')'">
//     </div>
//   } @else {
//     <div class="hero-bg hero-bg--fallback"></div>
//   }

//   <div class="hero-overlay"
//     [style.opacity]="(config.overlayOpacity ?? 30) / 100">
//   </div>

//   <div class="hero-inner" [ngClass]="'hero-inner--' + (config.contentPosition ?? 'center')">
//     <div class="hero-content" [ngClass]="'hero-content--' + (config.alignment ?? 'center')">

//       @if (config.title) {
//         <ng-container [ngSwitch]="config.titleTag ?? 'h1'">
//           <h1 *ngSwitchCase="'h1'" class="hero-title">{{ config.title }}</h1>
//           <h2 *ngSwitchCase="'h2'" class="hero-title">{{ config.title }}</h2>
//           <h3 *ngSwitchCase="'h3'" class="hero-title">{{ config.title }}</h3>
//           <h1 *ngSwitchDefault class="hero-title">{{ config.title }}</h1>
//         </ng-container>
//       }

//       @if (config.subtitle) {
//         <p class="hero-subtitle">{{ config.subtitle }}</p>
//       }

//       @if (config.ctaButtons?.length) {
//         <div class="hero-actions">
//           @for (btn of config.ctaButtons; track btn.text) {
//             @if (btn.text) {
//               <a [href]="btn.link || '#'"
//                 class="hero-btn"
//                 [ngClass]="'hero-btn--' + (btn.variant ?? 'primary')">
//                 @if (btn.icon) {
//                   <i [class]="btn.icon" aria-hidden="true"></i>
//                 }
//                 <span>{{ btn.text }}</span>
//               </a>
//             }
//           }
//         </div>
//       }

//     </div>
//   </div>
// </section>
//   `,
//   styles: [`
//     :host { 
//       display: block; 
//       width: 100%; 
//     }

//     /* --- Material Design Standard Easing --- */
//     :host {
//       --md-sys-motion-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
//       --md-sys-motion-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
//       --md-sys-color-primary: var(--theme-accent-primary, #1a73e8); /* Google Blue */
//     }

//     .hero-banner {
//       position: relative;
//       width: 100%;
//       overflow: hidden;
//       /* Google's signature font stack */
//       font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
//       background-color: var(--bg-primary, #f8f9fa);
//       display: flex;
//       flex-direction: column;
//       -webkit-font-smoothing: antialiased;
//       -moz-osx-font-smoothing: grayscale;
//     }

//     /* --- Background --- */
//     .hero-bg {
//       position: absolute;
//       inset: -2%; 
//       background-size: cover;
//       background-position: center;
//       background-repeat: no-repeat;
//       z-index: 0;
//       /* Subtle, professional scale-in rather than dramatic pan */
//       animation: md-scale-in 10s var(--md-sys-motion-easing-decelerate) forwards;
//       will-change: transform;
//     }

//     /* Google Store style clean mesh fallback */
//     .hero-bg--fallback {
//       background: radial-gradient(
//         circle at 15% 50%, 
//         color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent), 
//         transparent 50%
//       ),
//       radial-gradient(
//         circle at 85% 30%, 
//         color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent), 
//         transparent 50%
//       );
//       background-color: var(--bg-primary, #f8f9fa);
//     }

//     /* --- Overlay --- */
//     .hero-overlay {
//       position: absolute;
//       inset: 0;
//       z-index: 1;
//       /* Dark scrim only applied if there's an image, handled by opacity */
//       background-color: #202124; /* Google Dark Gray */
//       pointer-events: none;
//     }

//     /* If no image, hide the dark overlay to keep the clean M3 look */
//     .hero-bg--fallback + .hero-overlay {
//       display: none;
//     }

//     /* --- Layout --- */
//     .hero-inner {
//       position: relative;
//       z-index: 2;
//       width: 100%;
//       flex: 1;
//       display: flex;
//       align-items: center;
//       padding: 0 5%;
//       max-width: 1440px;
//       margin: 0 auto;
//     }

//     .hero-inner--left   { justify-content: flex-start; }
//     .hero-inner--center { justify-content: center; }
//     .hero-inner--right  { justify-content: flex-end; }

//     .hero-content {
//       max-width: 840px; /* Slightly wider for Google's readable line lengths */
//       width: 100%;
//       display: flex;
//       flex-direction: column;
//     }

//     .hero-content--left   { text-align: left; align-items: flex-start; }
//     .hero-content--center { text-align: center; align-items: center; }
//     .hero-content--right  { text-align: right; align-items: flex-end; }

//     /* --- Typography (Google Display Styles) --- */
//     .hero-title {
//       /* Fluid scaling matching Google Store headers */
//       font-size: clamp(2.75rem, 5vw + 1rem, 4.5rem);
//       font-weight: 700; /* Google Sans looks best at 700 */
//       color: var(--bg-primary);
//       line-height: 1.1;
//       letter-spacing: -0.04em;
//       margin: 0 0 1rem;
//       opacity: 0;
//       animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) forwards;
//     }

//     .hero-subtitle {
//       font-size: clamp(1.125rem, 2vw, 1.375rem);
//       color: #e8eaed; /* Google's specific light gray for dark backgrounds */
//       font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; /* Body font */
//       font-weight: 400;
//       line-height: 1.6;
//       margin: 0 0 2rem;
//       max-width: 60ch;
//       opacity: 0;
//       animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.1s forwards;
//     }

//     /* Auto-switch text colors if no background image is used */
//     .hero-bg--fallback ~ .hero-inner .hero-title {
//       color: var(--text-primary, #202124); /* Theme Text Primary */
//       text-shadow: none;
//     }
    
//     .hero-bg--fallback ~ .hero-inner .hero-subtitle {
//       color: var(--text-secondary, #5f6368); /* Theme Text Secondary */
//       text-shadow: none;
//     }

//     /* --- Buttons (Material 3) --- */
//     .hero-actions {
//       display: flex;
//       gap: 1rem;
//       flex-wrap: wrap;
//       opacity: 0;
//       animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.2s forwards;
//     }

//     .hero-btn {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       gap: 0.5rem;
//       height: 48px; /* Strict Material Touch Target Size */
//       padding: 0 24px;
//       border-radius: 100px; /* Fully rounded M3 buttons */
//       font-size: 1rem;
//       font-weight: 500; /* Material buttons use medium weight */
//       text-decoration: none;
//       transition: all 0.2s var(--md-sys-motion-easing-standard);
//       letter-spacing: 0.01em;
//     }

//     /* M3 Filled Button */
//     .hero-btn--primary {
//       background-color: var(--md-sys-color-primary);
//       color: var(--bg-primary);
//       border: 1px solid transparent;
//       /* M3 Elevation Level 1 */
//       box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
      
//       &:hover { 
//         /* M3 Elevation Level 2 */
//         box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
//         filter: brightness(0.95); /* State layer overlay */
//       }
      
//       &:active {
//         box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
//       }
//     }

//     /* M3 Outlined Button */
//     .hero-btn--secondary, .hero-btn--outline {
//       background-color: var(--bg-primary, var(--bg-primary));
//       color: var(--md-sys-color-primary);
//       border: 1px solid var(--border-secondary, #dadce0);
      
//       &:hover { 
//         background-color: var(--bg-secondary, #f8f9fa); /* Material hover state layer */
//         border-color: var(--md-sys-color-primary, #d2e3fc); /* Match primary tint on hover */
//       }
//     }

//     /* M3 Text Button */
//     .hero-btn--ghost {
//       background-color: transparent;
//       color: var(--bg-primary);
//       padding: 0 16px;
      
//       &:hover { 
//         background-color: rgba(255, 255, 255, 0.08); /* White state layer */
//       }
//     }

//     /* Adjust ghost button if on clean background */
//     .hero-bg--fallback ~ .hero-inner .hero-btn--ghost {
//       color: var(--md-sys-color-primary);
//       &:hover { background-color: rgba(26, 115, 232, 0.04); }
//     }

//     /* --- Keyframes --- */
//     @keyframes md-scale-in {
//       0% { transform: scale(1.04); }
//       100% { transform: scale(1); }
//     }

//     @keyframes md-fade-up {
//       0% { opacity: 0; transform: translateY(20px); }
//       100% { opacity: 1; transform: translateY(0); }
//     }
//   `]
// })
// export class HeroBannerComponent implements OnInit {
//   @Input() config: HeroBannerConfig = {};
//   @Input() data: any = null;

//   hostStyles: Record<string, string> = {};

//   ngOnInit(): void {
//     // Safe fallback padding 
//     const pt = PADDING_MAP ? PADDING_MAP[this.config.paddingTop ?? 'md'] : '64px';
//     const pb = PADDING_MAP ? PADDING_MAP[this.config.paddingBottom ?? 'md'] : '64px';

//     // Heights adjusted to feel grounded and structured
//     const heightMap: Record<string, string> = {
//       small: '480px',
//       medium: '640px',
//       large: '800px',
//       screen: '100vh',
//       auto: 'auto'
//     };

//     this.hostStyles = {
//       paddingTop: pt,
//       paddingBottom: pb,
//       minHeight: heightMap[this.config.height ?? 'medium'],
//       backgroundColor: this.config.backgroundColor || 'var(--bg-primary, #f8f9fa)'
//     };
//   }
// }

