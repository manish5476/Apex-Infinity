import { Component, Input, computed, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionButton } from '../../dynamic-page/section.types';
import { bodyStyle, headingStyle, normalizeDesign, normalizeTypography, resolveSectionSubtitle, resolveSectionTitle, sectionPaddingStyles } from '../../dynamic-page/section-config.utils';

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
  overlayColor?: string;
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
    
      <div class="hero-overlay" [style.opacity]="cfg().overlayOpacity / 100" [ngStyle]="{'background-color': cfg().overlayColor}"></div>
    
      <div class="hero-inner" [ngClass]="'hero-inner--' + cfg().contentPosition">
        <div class="hero-content" [ngClass]="'hero-content--' + cfg().alignment">
    
          @if (cfg().title) {
            @switch (cfg().titleTag) {
              @case ('h1') {
                <h1 class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h1>
              }
              @case ('h2') {
                <h2 class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
              }
              @case ('h3') {
                <h3 class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h3>
              }
              @default {
                <h1 class="hero-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h1>
              }
            }
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
                    <span [ngStyle]="{'font-family': cfg().typography.headingFont}">{{ btn.text }}</span>
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
    app-hero-banner { display: block; width: 100%; }

    /* --- Material Design Standard Easing --- */
    .hero-banner {
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
    title: resolveSectionTitle(this._config(), ''),
    titleTag: this._config().titleTag ?? 'h1',
    subtitle: resolveSectionSubtitle(this._config(), this._config().subtitle ?? ''),
    alignment: normalizeTypography(this._config()).alignment || (this._config().alignment ?? 'center'),
    backgroundImage: this._config().backgroundImage,
    height: this._config().height ?? 'medium',
    overlayColor: this._config().overlayColor || this._config().design?.overlayColor || '#202124',
    overlayOpacity: this._config().overlayOpacity ?? 30,
    ctaButtons: this._config().ctaButtons,
    contentPosition: this._config().contentPosition ?? 'center',
    design: normalizeDesign(this._config()),
    typography: normalizeTypography(this._config()),
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor
  }));

  readonly hostStyles = computed(() => {
    const heightMap: Record<string, string> = {
      small: '480px',
      medium: '640px',
      large: '800px',
      screen: '100vh',
      auto: 'auto'
    };

    return {
      ...sectionPaddingStyles(this._config(), 'md'),
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
    return headingStyle(this._config(), {
      'color': this.cfg().backgroundImage
        ? '#ffffff'
        : this.cfg().typography.headingColor,
      'font-size': this.cfg().typography?.headingSize === '2xl' ? 'clamp(3.5rem, 6vw + 1rem, 5.5rem)' : undefined
    });
  }

  bodyStyle() {
    return bodyStyle(this._config(), {
      'color': this.cfg().backgroundImage
        ? '#e8eaed'
        : this.cfg().typography.bodyColor
    });
  }

  buttonStyle(btn: SectionButton) {
    let btnColor = btn.buttonColor || this.cfg().typography?.headingColor || 'var(--md-sys-color-primary)';
    if (btnColor && /^[0-9A-Fa-f]{3,6}$/.test(btnColor)) {
      btnColor = '#' + btnColor;
    }

    if (btn.variant === 'primary') {
      return {
        'background-color': btnColor,
        'color': this.cfg().backgroundImage ? 'var(--text-primary, #111827)' : 'var(--bg-primary, #ffffff)'
      };
    }

    if (btn.variant === 'secondary' || btn.variant === 'outline') {
      return {
        'color': btnColor,
        'border-color': btnColor
      };
    }

    return {
      'color': btnColor
    };
  }
}