


import { Component, Input, OnInit, ChangeDetectionStrategy, ViewEncapsulation, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionButton, PADDING_MAP } from '../../dynamic-page/section.types';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface VideoHeroConfig extends SectionBaseConfig {
  title?: string;
  titleTag?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  videoUrl?: string;
  posterImage?: string;
  overlayOpacity?: number;
  ctaButtons?: SectionButton[];
  contentPosition?: 'left' | 'center' | 'right';
  design?: any;       // Upgraded: Handles customBackground
  typography?: any;   // Upgraded: Handles custom fonts
  height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-video-hero',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="video-hero" [ngStyle]="hostStyles()">
      
      @if (cfg().videoUrl) {
        <video class="video-hero__video"
               [src]="cfg().videoUrl"
               [poster]="cfg().posterImage"
               autoplay muted loop playsinline
               disablePictureInPicture
               aria-hidden="true">
        </video>
      }
      
      <div class="video-hero__overlay" [style.opacity]="cfg().overlayOpacity / 100"></div>
      <div class="video-hero__gradient-lock"></div>
      
      <div class="video-hero__inner" [ngClass]="'video-hero__inner--' + cfg().contentPosition">
        <div class="video-hero__content" [ngClass]="'video-hero__content--' + cfg().alignment">
          
          @if (cfg().title) {
            <ng-container [ngSwitch]="cfg().titleTag">
              <h1 *ngSwitchCase="'h1'" class="video-hero__title" [ngStyle]="headingStyle()">{{ cfg().title }}</h1>
              <h2 *ngSwitchCase="'h2'" class="video-hero__title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
              <h3 *ngSwitchCase="'h3'" class="video-hero__title" [ngStyle]="headingStyle()">{{ cfg().title }}</h3>
              <h1 *ngSwitchDefault class="video-hero__title" [ngStyle]="headingStyle()">{{ cfg().title }}</h1>
            </ng-container>
          }

          @if (cfg().subtitle) {
            <p class="video-hero__subtitle" [ngStyle]="bodyStyle()">{{ cfg().subtitle }}</p>
          }

          @if (cfg().ctaButtons?.length) {
            <div class="video-hero__actions">
              @for (btn of cfg().ctaButtons; track btn.text) {
                @if (btn.text) {
                  <a [href]="btn.link || '#'" 
                     class="vhero-btn" 
                     [ngClass]="'vhero-btn--' + (btn.variant ?? 'primary')"
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
    .video-hero { position: relative; display: flex; flex-direction: column; overflow: hidden; font-family: 'Google Sans', Roboto, sans-serif; background-color: #202124; }
    .video-hero__video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0; animation: md-video-fade-in 1.5s forwards; }
    .video-hero__overlay { position: absolute; inset: 0; background: #202124; z-index: 1; pointer-events: none; }
    .video-hero__gradient-lock { position: absolute; inset: 0; z-index: 2; background: linear-gradient(to bottom, rgba(32,33,36,0.1) 0%, rgba(32,33,36,0.4) 100%); pointer-events: none; }
    .video-hero__inner { position: relative; z-index: 3; width: 100%; flex: 1; display: flex; align-items: center; padding: 0 5%; max-width: 1440px; margin: 0 auto; }
    .video-hero__inner--left { justify-content: flex-start; }
    .video-hero__inner--center { justify-content: center; }
    .video-hero__inner--right { justify-content: flex-end; }
    .video-hero__content { max-width: 840px; width: 100%; display: flex; flex-direction: column; }
    .video-hero__content--left { text-align: left; align-items: flex-start; }
    .video-hero__content--center { text-align: center; align-items: center; }
    .video-hero__content--right { text-align: right; align-items: flex-end; }

    .video-hero__title { font-size: clamp(2.75rem, 5vw + 1rem, 4.5rem); font-weight: 700; color: #fff; margin: 0 0 1rem; line-height: 1.1; letter-spacing: -0.04em; opacity: 0; animation: md-fade-up 0.8s forwards; }
    .video-hero__subtitle { color: #e8eaed; font-size: clamp(1.125rem, 2vw, 1.375rem); margin: 0 0 2rem; max-width: 60ch; line-height: 1.6; opacity: 0; animation: md-fade-up 0.8s 0.2s forwards; }
    
    .video-hero__actions { display: flex; gap: 1rem; flex-wrap: wrap; opacity: 0; animation: md-fade-up 0.8s 0.4s forwards; }
    .vhero-btn { display: inline-flex; align-items: center; gap: 0.5rem; height: 48px; padding: 0 24px; border-radius: 100px; font-weight: 500; font-size: 1rem; text-decoration: none; transition: all 0.2s; }
    .vhero-btn:hover { filter: brightness(0.95); }

    @keyframes md-fade-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
    @keyframes md-video-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
  `]
})
export class VideoHeroComponent {
  @Input() set config(v: VideoHeroConfig) { this._config.set(v ?? {}); }
  private _config = signal<VideoHeroConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().typography?.headingText || this._config().title,
    titleTag: this._config().titleTag ?? 'h1',
    subtitle: this._config().typography?.subText || this._config().subtitle,
    alignment: (this._config().typography?.alignment || this._config().alignment) ?? 'center',
    videoUrl: this._config().videoUrl,
    posterImage: this._config().posterImage,
    overlayOpacity: this._config().overlayOpacity ?? 40,
    ctaButtons: this._config().ctaButtons,
    contentPosition: this._config().contentPosition ?? 'center',
    design: this._config().design,
    typography: this._config().typography,
    height: this._config().height ?? 'medium',
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md'
  }));

  readonly hostStyles = computed(() => {
    const pt = typeof PADDING_MAP !== 'undefined' ? PADDING_MAP[this.cfg().paddingTop ?? 'md'] : '64px';
    const pb = typeof PADDING_MAP !== 'undefined' ? PADDING_MAP[this.cfg().paddingBottom] : '64px';

    const heightMap: Record<string, string> = {
      small: '480px', medium: '640px', large: '800px', screen: '100vh', auto: 'auto'
    };

    return {
      'padding-top': pt,
      'padding-bottom': pb,
      'min-height': heightMap[this.cfg().height],
      'background-color': this.cfg().design?.customBackground || '#202124'
    };
  });

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().typography?.headingColor || '#ffffff'
    };
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().typography?.bodyColor || '#e8eaed'
    };
  }

  buttonStyle(btn: SectionButton) {
    const isPrimary = btn.variant === 'primary';
    return {
      'background-color': isPrimary ? (btn.buttonColor || this.cfg().typography?.headingColor || '#1a73e8') : 'transparent',
      'color': isPrimary ? '#ffffff' : '#ffffff',
      'border': isPrimary ? 'none' : '1px solid #dadce0',
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)'
    };
  }
}// // video-hero.component.ts
