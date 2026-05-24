// hero-banner.component.ts
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionButton, PADDING_MAP } from '../../dynamic-page/section.types';

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
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="hero-banner" [style]="hostStyles">
  @if (config.backgroundImage) {
    <div class="hero-bg"
      [style.backgroundImage]="'url(' + config.backgroundImage + ')'">
    </div>
  } @else {
    <div class="hero-bg hero-bg--fallback"></div>
  }

  <div class="hero-overlay"
    [style.opacity]="(config.overlayOpacity ?? 30) / 100">
  </div>

  <div class="hero-inner" [ngClass]="'hero-inner--' + (config.contentPosition ?? 'center')">
    <div class="hero-content" [ngClass]="'hero-content--' + (config.alignment ?? 'center')">

      @if (config.title) {
        <ng-container [ngSwitch]="config.titleTag ?? 'h1'">
          <h1 *ngSwitchCase="'h1'" class="hero-title">{{ config.title }}</h1>
          <h2 *ngSwitchCase="'h2'" class="hero-title">{{ config.title }}</h2>
          <h3 *ngSwitchCase="'h3'" class="hero-title">{{ config.title }}</h3>
          <h1 *ngSwitchDefault class="hero-title">{{ config.title }}</h1>
        </ng-container>
      }

      @if (config.subtitle) {
        <p class="hero-subtitle">{{ config.subtitle }}</p>
      }

      @if (config.ctaButtons?.length) {
        <div class="hero-actions">
          @for (btn of config.ctaButtons; track btn.text) {
            @if (btn.text) {
              <a [href]="btn.link || '#'"
                class="hero-btn"
                [ngClass]="'hero-btn--' + (btn.variant ?? 'primary')">
                @if (btn.icon) {
                  <i [class]="btn.icon" aria-hidden="true"></i>
                }
                <span>{{ btn.text }}</span>
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
    :host { 
      display: block; 
      width: 100%; 
    }

    /* --- Material Design Standard Easing --- */
    :host {
      --md-sys-motion-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
      --md-sys-motion-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
      --md-sys-color-primary: var(--theme-accent-primary, #1a73e8); /* Google Blue */
    }

    .hero-banner {
      position: relative;
      width: 100%;
      overflow: hidden;
      /* Google's signature font stack */
      font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--bg-primary, #f8f9fa);
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* --- Background --- */
    .hero-bg {
      position: absolute;
      inset: -2%; 
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
      /* Subtle, professional scale-in rather than dramatic pan */
      animation: md-scale-in 10s var(--md-sys-motion-easing-decelerate) forwards;
      will-change: transform;
    }

    /* Google Store style clean mesh fallback */
    .hero-bg--fallback {
      background: radial-gradient(
        circle at 15% 50%, 
        color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent), 
        transparent 50%
      ),
      radial-gradient(
        circle at 85% 30%, 
        color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent), 
        transparent 50%
      );
      background-color: var(--bg-primary, #f8f9fa);
    }

    /* --- Overlay --- */
    .hero-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      /* Dark scrim only applied if there's an image, handled by opacity */
      background-color: #202124; /* Google Dark Gray */
      pointer-events: none;
    }

    /* If no image, hide the dark overlay to keep the clean M3 look */
    .hero-bg--fallback + .hero-overlay {
      display: none;
    }

    /* --- Layout --- */
    .hero-inner {
      position: relative;
      z-index: 2;
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 5%;
      max-width: 1440px;
      margin: 0 auto;
    }

    .hero-inner--left   { justify-content: flex-start; }
    .hero-inner--center { justify-content: center; }
    .hero-inner--right  { justify-content: flex-end; }

    .hero-content {
      max-width: 840px; /* Slightly wider for Google's readable line lengths */
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    .hero-content--left   { text-align: left; align-items: flex-start; }
    .hero-content--center { text-align: center; align-items: center; }
    .hero-content--right  { text-align: right; align-items: flex-end; }

    /* --- Typography (Google Display Styles) --- */
    .hero-title {
      /* Fluid scaling matching Google Store headers */
      font-size: clamp(2.75rem, 5vw + 1rem, 4.5rem);
      font-weight: 700; /* Google Sans looks best at 700 */
      color: #ffffff;
      line-height: 1.1;
      letter-spacing: -0.04em;
      margin: 0 0 1rem;
      opacity: 0;
      animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) forwards;
    }

    .hero-subtitle {
      font-size: clamp(1.125rem, 2vw, 1.375rem);
      color: #e8eaed; /* Google's specific light gray for dark backgrounds */
      font-family: Roboto, 'Helvetica Neue', Arial, sans-serif; /* Body font */
      font-weight: 400;
      line-height: 1.6;
      margin: 0 0 2rem;
      max-width: 60ch;
      opacity: 0;
      animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.1s forwards;
    }

    /* Auto-switch text colors if no background image is used */
    .hero-bg--fallback ~ .hero-inner .hero-title {
      color: var(--text-primary, #202124); /* Theme Text Primary */
      text-shadow: none;
    }
    
    .hero-bg--fallback ~ .hero-inner .hero-subtitle {
      color: var(--text-secondary, #5f6368); /* Theme Text Secondary */
      text-shadow: none;
    }

    /* --- Buttons (Material 3) --- */
    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      opacity: 0;
      animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.2s forwards;
    }

    .hero-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px; /* Strict Material Touch Target Size */
      padding: 0 24px;
      border-radius: 100px; /* Fully rounded M3 buttons */
      font-size: 1rem;
      font-weight: 500; /* Material buttons use medium weight */
      text-decoration: none;
      transition: all 0.2s var(--md-sys-motion-easing-standard);
      letter-spacing: 0.01em;
    }

    /* M3 Filled Button */
    .hero-btn--primary {
      background-color: var(--md-sys-color-primary);
      color: #ffffff;
      border: 1px solid transparent;
      /* M3 Elevation Level 1 */
      box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
      
      &:hover { 
        /* M3 Elevation Level 2 */
        box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
        filter: brightness(0.95); /* State layer overlay */
      }
      
      &:active {
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
      }
    }

    /* M3 Outlined Button */
    .hero-btn--secondary, .hero-btn--outline {
      background-color: var(--bg-primary, #ffffff);
      color: var(--md-sys-color-primary);
      border: 1px solid var(--border-secondary, #dadce0);
      
      &:hover { 
        background-color: var(--bg-secondary, #f8f9fa); /* Material hover state layer */
        border-color: var(--md-sys-color-primary, #d2e3fc); /* Match primary tint on hover */
      }
    }

    /* M3 Text Button */
    .hero-btn--ghost {
      background-color: transparent;
      color: #ffffff;
      padding: 0 16px;
      
      &:hover { 
        background-color: rgba(255, 255, 255, 0.08); /* White state layer */
      }
    }

    /* Adjust ghost button if on clean background */
    .hero-bg--fallback ~ .hero-inner .hero-btn--ghost {
      color: var(--md-sys-color-primary);
      &:hover { background-color: rgba(26, 115, 232, 0.04); }
    }

    /* --- Keyframes --- */
    @keyframes md-scale-in {
      0% { transform: scale(1.04); }
      100% { transform: scale(1); }
    }

    @keyframes md-fade-up {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HeroBannerComponent implements OnInit {
  @Input() config: HeroBannerConfig = {};
  @Input() data: any = null;

  hostStyles: Record<string, string> = {};

  ngOnInit(): void {
    // Safe fallback padding 
    const pt = PADDING_MAP ? PADDING_MAP[this.config.paddingTop ?? 'md'] : '64px';
    const pb = PADDING_MAP ? PADDING_MAP[this.config.paddingBottom ?? 'md'] : '64px';

    // Heights adjusted to feel grounded and structured
    const heightMap: Record<string, string> = {
      small: '480px',
      medium: '640px',
      large: '800px',
      screen: '100vh',
      auto: 'auto'
    };

    this.hostStyles = {
      paddingTop: pt,
      paddingBottom: pb,
      minHeight: heightMap[this.config.height ?? 'medium'],
      backgroundColor: this.config.backgroundColor || 'var(--bg-primary, #f8f9fa)'
    };
  }
}

