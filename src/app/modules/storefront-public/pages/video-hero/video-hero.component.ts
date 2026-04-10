// video-hero.component.ts
import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';

export interface VideoHeroConfig {
  videoUrl?:       string;   // YouTube embed, direct .mp4, or Vimeo
  posterImage?:    string;   // Fallback / first-frame
  title?:          string;
  subtitle?:       string;
  ctaText?:        string;
  ctaLink?:        string;
  overlayOpacity?: number;
  height?:         'medium' | 'large' | 'screen';
}

const HEIGHT_MAP: Record<string, string> = { medium: '65vh', large: '85vh', screen: '100vh' };

@Component({
  selector: 'app-video-hero',
  standalone: true,
  imports: [RouterModule],
  template: `
    <section class="vh-root" [style.min-height]="height()">

      <!-- Video / poster background -->
      @if (cfg().videoUrl && isDirectVideo()) {
        <video
          class="vh-video"
          [src]="cfg().videoUrl"
          [poster]="cfg().posterImage || ''"
          autoplay muted loop playsinline
          aria-hidden="true">
        </video>
      } @else if (cfg().posterImage) {
        <div class="vh-poster" [style.background-image]="'url(' + cfg().posterImage + ')'"></div>
      }

      <!-- Overlay -->
      <div class="vh-overlay" [style.opacity]="(cfg().overlayOpacity / 100)"></div>

      <!-- Content -->
      <div class="vh-content">
        @if (cfg().subtitle) {
          <span class="vh-eyebrow">{{ cfg().subtitle }}</span>
        }
        <h2 class="vh-title">{{ cfg().title }}</h2>
        @if (cfg().ctaText && cfg().ctaLink) {
          <a [routerLink]="[cfg().ctaLink]" class="vh-cta">
            {{ cfg().ctaText }} <i class="pi pi-arrow-right"></i>
          </a>
        }
      </div>

    </section>
  `,
  styles: [`
    :host { display: block; }
    .vh-root { position: relative; overflow: hidden; background: #0c0e12; display: flex; align-items: center; justify-content: center; }
    .vh-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .vh-poster { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
    .vh-overlay { position: absolute; inset: 0; background: #000; z-index: 1; }
    .vh-content {
      position: relative; z-index: 10; text-align: center; padding: 80px 24px;
      max-width: 760px; display: flex; flex-direction: column; align-items: center; gap: 20px;
    }
    .vh-eyebrow {
      font-family: var(--font-mono); font-size: 11px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 3px; color: rgba(255,255,255,0.55);
    }
    .vh-title {
      margin: 0; font-family: var(--font-heading);
      font-size: clamp(28px, 6vw, 68px); font-weight: 800; color: #fff;
      line-height: 1.05; letter-spacing: -0.03em;
      text-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .vh-cta {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 32px; background: #fff; color: #0c0e12;
      border-radius: 100px; font-size: 13px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 1px; text-decoration: none;
      transition: all 0.25s ease;
      i { font-size: 11px; transition: transform 0.2s ease; }
      &:hover { background: var(--accent-primary); color: #fff; transform: translateY(-2px); }
      &:hover i { transform: translateX(4px); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoHeroComponent {
  @Input() set config(v: VideoHeroConfig) { this._config.set(v ?? {}); }
  private _config = signal<VideoHeroConfig>({});

  readonly cfg = computed(() => ({
    videoUrl:       this._config().videoUrl       ?? '',
    posterImage:    this._config().posterImage    ?? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1400&q=80',
    title:          this._config().title          ?? 'Experience the Difference',
    subtitle:       this._config().subtitle       ?? 'Play',
    ctaText:        this._config().ctaText        ?? 'Explore Products',
    ctaLink:        this._config().ctaLink        ?? '/products',
    overlayOpacity: this._config().overlayOpacity ?? 50,
    height:         this._config().height         ?? 'large'
  }));

  readonly height = computed(() => HEIGHT_MAP[this.cfg().height] ?? '85vh');

  isDirectVideo(): boolean {
    const url = this.cfg().videoUrl;
    return !!url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('blob:'));
  }
}

// // src/app/modules/storefront-public/pages/video-hero/video-hero.component.ts
// import { Component, Input, computed, ElementRef, ViewChild, AfterViewInit, signal, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { VideoHeroConfig } from '@core/models/storefront.model';

// @Component({
//   selector: 'app-video-hero',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './video-hero.component.html',
//   styleUrls: ['./video-hero.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class VideoHeroComponent implements AfterViewInit {

//   @Input() set config(v: VideoHeroConfig) { this._config.set(v ?? {}); }
//   private _config = signal<VideoHeroConfig>({});

//   readonly cfg = computed(() => ({
//     title:          this._config().title,
//     subtitle:       this._config().subtitle,
//     videoUrl:       this._config().videoUrl,
//     posterImage:    this._config().posterImage,
//     overlayOpacity: this._config().overlayOpacity ?? 40,
//     ctaButtons:     this._config().ctaButtons ?? []
//   }));

//   @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
//   // Track if video has actually started playing to fade it in
//   isPlaying = signal(false);

//   // Layout Computation
//   heightClass = computed(() => {
//     // Currently no height defined in video-hero backend schema, defaulting to fullscreen-like or large
//     return 'h-large';
//   });

//   // Valid Button Filter
//   readonly validButtons = computed(() => {
//     return this.cfg().ctaButtons.filter(b => b.text && b.link);
//   });

//   ngAfterViewInit() {
//     if (this.videoPlayer?.nativeElement) {
//       const video = this.videoPlayer.nativeElement;
      
//       video.muted = true; // Required for auto-play      
//       const playPromise = video.play();
      
//       if (playPromise !== undefined) {
//         playPromise
//           .then(() => {
//             // Video started playing successfully
//             this.isPlaying.set(true);
//           })
//           .catch(error => {
//             console.warn('Auto-play prevented:', error);
//             // Fallback: isPlaying stays false, Poster image remains visible
//           });
//       }
//     }
//   }

//   getLink(url: string | undefined): any[] {
//     if (!url) return [];
//     if (url.startsWith('http') || url.startsWith('www')) return [];
//     const clean = url.startsWith('/') ? url.slice(1) : url;
//     return clean ? ['/', clean] : [];
//   }

//   isExternal(url: string | undefined): boolean {
//     return !!url && (url.startsWith('http') || url.startsWith('www'));
//   }
// }