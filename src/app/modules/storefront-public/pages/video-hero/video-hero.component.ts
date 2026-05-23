// ============================================================================
// video-hero.component.ts
// ============================================================================
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionButton, PADDING_MAP } from '../../../storefront-admin/schema/section.types';

interface VideoHeroConfig extends SectionBaseConfig {
  title?: string;
  titleTag?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  videoUrl?: string;
  posterImage?: string;
  overlayOpacity?: number;
  ctaButtons?: SectionButton[];
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
    aria-hidden="true">
  </video>

  <div class="video-hero__overlay"
    [style.opacity]="(config.overlayOpacity ?? 40) / 100">
  </div>

  <div class="video-hero__content" [ngClass]="'align-' + (config.alignment ?? 'center')">
    @if (config.title) {
      <h2 class="video-hero__title">{{ config.title }}</h2>
    }
    @if (config.subtitle) {
      <p class="video-hero__subtitle">{{ config.subtitle }}</p>
    }
    @if (config.ctaButtons?.length) {
      <div class="video-hero__actions">
        @for (btn of config.ctaButtons; track $index) {
          @if (btn.text) {
            <a [href]="btn.link || '#'" class="vhero-btn vhero-btn--{{ btn.variant ?? 'primary' }}">
              {{ btn.text }}
            </a>
          }
        }
      </div>
    }
  </div>
</section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .video-hero {
      position: relative;
      min-height: 560px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: var(--font-heading, sans-serif);
    }
    .video-hero__video {
      position: absolute;
      inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .video-hero__overlay {
      position: absolute;
      inset: 0;
      background: #000;
      pointer-events: none;
    }
    .video-hero__content {
      position: relative;
      z-index: 2;
      max-width: 720px;
      padding: 0 5%;
      text-align: center;
    }
    .align-left  { text-align: left;  align-self: flex-start; }
    .align-right { text-align: right; align-self: flex-end; }
    .video-hero__title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      color: #fff;
      margin: 0 0 16px;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .video-hero__subtitle {
      color: rgba(255,255,255,0.8);
      font-size: 1.125rem;
      margin: 0 0 28px;
      font-family: var(--font-body, sans-serif);
    }
    .video-hero__actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .align-left  .video-hero__actions { justify-content: flex-start; }
    .align-right .video-hero__actions { justify-content: flex-end; }
    .vhero-btn {
      padding: 13px 26px; border-radius: 7px; font-weight: 700;
      font-size: 0.875rem; text-decoration: none; transition: all 0.2s;
      display: inline-block;
    }
    .vhero-btn--primary {
      background: var(--theme-accent-primary, #2563eb);
      color: #fff;
      &:hover { filter: brightness(1.1); transform: translateY(-1px); }
    }
    .vhero-btn--outline {
      border: 2px solid #fff; color: #fff;
      &:hover { background: #fff; color: #000; }
    }
    .vhero-btn--secondary {
      background: rgba(255,255,255,0.2);
      color: #fff; backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.3);
    }
  `]
})
export class VideoHeroComponent implements OnInit {
  @Input() config: VideoHeroConfig = {};
  @Input() data: any = null;
  pt = '0'; pb = '0';
  ngOnInit(): void {
    this.pt = PADDING_MAP[this.config.paddingTop ?? 'md'];
    this.pb = PADDING_MAP[this.config.paddingBottom ?? 'md'];
  }
}
