// src/app/modules/storefront-public/pages/video-hero/video-hero.component.ts
import { Component, Input, computed, ElementRef, ViewChild, AfterViewInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VideoHeroConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-video-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './video-hero.component.html',
  styleUrls: ['./video-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoHeroComponent implements AfterViewInit {

  @Input() set config(v: VideoHeroConfig) { this._config.set(v ?? {}); }
  private _config = signal<VideoHeroConfig>({});

  readonly cfg = computed(() => ({
    title:          this._config().title,
    subtitle:       this._config().subtitle,
    videoUrl:       this._config().videoUrl,
    posterImage:    this._config().posterImage,
    overlayOpacity: this._config().overlayOpacity ?? 40,
    ctaButtons:     this._config().ctaButtons ?? []
  }));

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  // Track if video has actually started playing to fade it in
  isPlaying = signal(false);

  // Layout Computation
  heightClass = computed(() => {
    // Currently no height defined in video-hero backend schema, defaulting to fullscreen-like or large
    return 'h-large';
  });

  // Valid Button Filter
  readonly validButtons = computed(() => {
    return this.cfg().ctaButtons.filter(b => b.text && b.link);
  });

  ngAfterViewInit() {
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      
      video.muted = true; // Required for auto-play      
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video started playing successfully
            this.isPlaying.set(true);
          })
          .catch(error => {
            console.warn('Auto-play prevented:', error);
            // Fallback: isPlaying stays false, Poster image remains visible
          });
      }
    }
  }

  getLink(url: string | undefined): any[] {
    if (!url) return [];
    if (url.startsWith('http') || url.startsWith('www')) return [];
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : [];
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}