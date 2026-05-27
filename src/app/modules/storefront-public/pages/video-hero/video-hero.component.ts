// video-hero.component.ts
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionButton, PADDING_MAP } from '../../dynamic-page/section.types';

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
}

@Component({
  selector: 'app-video-hero',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="video-hero" [style.paddingTop]="pt" [style.paddingBottom]="pb">
  
  <video class="video-hero__video"
    [src]="config.videoUrl"
    [poster]="config.posterImage || ''"
    autoplay muted loop playsinline
    disablePictureInPicture
    aria-hidden="true">
  </video>
 
  <div class="video-hero__overlay"
    [style.opacity]="(config.overlayOpacity ?? 40) / 100">
  </div>
  <div class="video-hero__gradient-lock"></div>
 
  <div class="video-hero__inner" [ngClass]="'video-hero__inner--' + (config.contentPosition ?? 'center')">
    <div class="video-hero__content" [ngClass]="'video-hero__content--' + (config.alignment ?? 'center')">
      
      @if (config.title) {
        <ng-container [ngSwitch]="config.titleTag ?? 'h1'">
          <h1 *ngSwitchCase="'h1'" class="video-hero__title">{{ config.title }}</h1>
          <h2 *ngSwitchCase="'h2'" class="video-hero__title">{{ config.title }}</h2>
          <h3 *ngSwitchCase="'h3'" class="video-hero__title">{{ config.title }}</h3>
          <h1 *ngSwitchDefault class="video-hero__title">{{ config.title }}</h1>
        </ng-container>
      }

      @if (config.subtitle) {
        <p class="video-hero__subtitle">{{ config.subtitle }}</p>
      }

      @if (config.ctaButtons?.length) {
        <div class="video-hero__actions">
          @for (btn of config.ctaButtons; track btn.text) {
            @if (btn.text) {
              <a [href]="btn.link || '#'" 
                 class="vhero-btn"
                 [ngClass]="'vhero-btn--' + (btn.variant ?? 'primary')">
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

    /* --- Material Design 3 Standard Variables --- */
    :host {
      --md-sys-motion-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
      --md-sys-motion-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
      --md-sys-color-primary: var(--theme-accent-primary, #1a73e8); /* Google Blue */
      --md-sys-color-surface-dark: #202124; /* Google Dark Gray */
    }

    .video-hero {
      position: relative;
      min-height: 640px; /* Modern standard height */
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--md-sys-color-surface-dark); /* Prevents white flash while buffering */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* --- Video Handling --- */
    .video-hero__video {
      position: absolute;
      inset: 0;
      width: 100%; 
      height: 100%;
      object-fit: cover;
      z-index: 0;
      opacity: 0;
      /* Smooth fade-in hides buffering artifacts */
      animation: md-video-fade-in 1.5s var(--md-sys-motion-easing-standard) 0.2s forwards;
    }

    /* --- Scrims & Overlays --- */
    .video-hero__overlay {
      position: absolute;
      inset: 0;
      background: var(--md-sys-color-surface-dark);
      z-index: 1;
      pointer-events: none;
    }

    .video-hero__gradient-lock {
      position: absolute;
      inset: 0;
      z-index: 2;
      background: linear-gradient(
        to bottom,
        rgba(32, 33, 36, 0.1) 0%,
        rgba(32, 33, 36, 0.4) 100%
      );
      pointer-events: none;
    }

    /* --- Layout Container --- */
    .video-hero__inner {
      position: relative;
      z-index: 3;
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 5%;
      max-width: 1440px;
      margin: 0 auto;
    }

    .video-hero__inner--left   { justify-content: flex-start; }
    .video-hero__inner--center { justify-content: center; }
    .video-hero__inner--right  { justify-content: flex-end; }

    .video-hero__content {
      max-width: 840px;
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    .video-hero__content--left   { text-align: left; align-items: flex-start; }
    .video-hero__content--center { text-align: center; align-items: center; }
    .video-hero__content--right  { text-align: right; align-items: flex-end; }

    /* --- Typography (Google Display) --- */
    .video-hero__title {
      font-size: clamp(2.75rem, 5vw + 1rem, 4.5rem);
      font-weight: 700;
      color: var(--bg-primary);
      margin: 0 0 1rem;
      line-height: 1.1;
      letter-spacing: -0.04em;
      opacity: 0;
      animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.1s forwards;
    }

    .video-hero__subtitle {
      color: #e8eaed; /* Specific M3 dark-theme text secondary */
      font-size: clamp(1.125rem, 2vw, 1.375rem);
      margin: 0 0 2rem;
      max-width: 60ch;
      font-family: Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      opacity: 0;
      animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.2s forwards;
    }

    /* --- Material 3 Buttons --- */
    .video-hero__actions { 
      display: flex; 
      gap: 1rem; 
      flex-wrap: wrap; 
      opacity: 0;
      animation: md-fade-up 0.8s var(--md-sys-motion-easing-decelerate) 0.3s forwards;
    }

    .vhero-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px; /* Strict M3 Touch Target Size */
      padding: 0 24px; 
      border-radius: 100px; /* Fully rounded */
      font-weight: 500; /* Medium weight for M3 */
      font-size: 1rem; 
      text-decoration: none; 
      transition: all 0.2s var(--md-sys-motion-easing-standard);
      letter-spacing: 0.01em;
    }

    /* M3 Filled Button (Primary) */
    .vhero-btn--primary {
      background-color: var(--md-sys-color-primary);
      color: var(--bg-primary);
      border: 1px solid transparent;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);

      &:hover { 
        filter: brightness(0.95); 
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
      }
    }

    /* M3 Outlined Button (Secondary) */
    .vhero-btn--secondary, .vhero-btn--outline {
      background-color: transparent;
      color: var(--bg-primary); 
      border: 1px solid #dadce0; /* Exact Google border color */
      
      &:hover { 
        background-color: rgba(255, 255, 255, 0.08); /* White state layer */
        border-color: var(--bg-primary);
      }
    }

    /* M3 Text Button (Ghost) */
    .vhero-btn--ghost {
      background-color: transparent;
      color: var(--bg-primary);
      padding: 0 16px;
      
      &:hover { 
        background-color: rgba(255, 255, 255, 0.08); 
      }
    }

    /* --- Keyframes --- */
    @keyframes md-fade-up {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes md-video-fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `]
})
export class VideoHeroComponent implements OnInit {
  @Input() config: VideoHeroConfig = {};
  @Input() data: any = null;

  pt = '64px';
  pb = '64px';

  ngOnInit(): void {
    if (PADDING_MAP) {
      this.pt = PADDING_MAP[this.config.paddingTop ?? 'md'] || '64px';
      this.pb = PADDING_MAP[this.config.paddingBottom ?? 'md'] || '64px';
    }
  }
}
