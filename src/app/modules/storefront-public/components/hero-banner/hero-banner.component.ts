// src/app/modules/storefront-public/components/hero-banner/hero-banner.component.ts
import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { HeroBannerConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('heroAnim', [
      transition(':enter', [
        query('.anim-target', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('1s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HeroBannerComponent {
  @Input() set config(v: HeroBannerConfig) { this._config.set(v ?? {}); }
  private _config = signal<HeroBannerConfig>({});

  readonly cfg = computed(() => ({
    title:           this._config().title,
    subtitle:        this._config().subtitle,
    titleTag:        this._config().titleTag        ?? 'h1',
    alignment:       this._config().alignment       ?? 'center',
    backgroundImage: this._config().backgroundImage ?? '',
    height:          this._config().height          ?? 'medium',
    overlayOpacity:  this._config().overlayOpacity  ?? 40,
    ctaButtons:      this._config().ctaButtons      ?? [],
    contentPosition: this._config().contentPosition ?? 'center',
    paddingTop:      this._config().paddingTop      ?? 'none',
    paddingBottom:   this._config().paddingBottom   ?? 'none',
    backgroundColor: this._config().backgroundColor ?? 'transparent',
    themeMode:       this._config().themeMode       ?? 'auto',
  }));

  // Resolve Height Class
  heightClass = computed(() => {
    return `h-${this.cfg().height}`;
  });

  // Resolve Alignment Class
  alignmentClass = computed(() => {
    return `align-${this.cfg().alignment}`;
  });

  // Valid Button Filter
  readonly validButtons = computed(() => {
    return this.cfg().ctaButtons.filter(b => b.text && b.link);
  });

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
