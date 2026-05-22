// hero-banner.component.ts
import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface HeroBannerConfig {
  title?: string;
  titleTag?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  backgroundImage?: string;
  height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
  overlayOpacity?: number;
  ctaButtons?: Array<{ text: string; link: string; variant: 'primary' | 'secondary' | 'outline' | 'ghost' }>;
  contentPosition?: 'left' | 'center' | 'right';
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  themeMode?: 'auto' | 'light' | 'dark';
}

const HEIGHT_MAP: Record<string, string> = {
  auto: 'auto', small: '50vh', medium: '70vh', large: '85vh', screen: '100vh'
};

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroBannerComponent {
  @Input() set config(v: HeroBannerConfig) { this._config.set(v ?? {}); }
  private _config = signal<HeroBannerConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Welcome to Our Store',
    titleTag: this._config().titleTag ?? 'h2', // Fixed default to match schema
    subtitle: this._config().subtitle ?? 'Discover something extraordinary',
    alignment: this._config().alignment ?? 'center',
    backgroundImage: this._config().backgroundImage ?? '',
    height: this._config().height ?? 'large',
    overlayOpacity: this._config().overlayOpacity ?? 40,
    ctaButtons: this._config().ctaButtons ?? [
      { text: 'Shop Now', link: '/products', variant: 'primary' as const },
      { text: 'Learn More', link: '#', variant: 'outline' as const }
    ],
    contentPosition: this._config().contentPosition ?? 'center',
    backgroundColor: this._config().backgroundColor ?? '',
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    themeMode: this._config().themeMode ?? 'auto'
  }));

  readonly paddingMap: Record<string, string> = {
    none: '0',
    sm: 'var(--spacing-3xl, 2rem)',
    md: 'var(--spacing-5xl, 4rem)',
    lg: 'calc(var(--spacing-5xl, 4rem) * 1.5)',
    xl: 'calc(var(--spacing-5xl, 4rem) * 2)'
  };

  readonly sectionStyle = computed(() => ({
    'min-height': HEIGHT_MAP[this.cfg().height] ?? '70vh',
    'background-color': this.cfg().backgroundColor || '',
    'background-image': this.cfg().backgroundImage
      ? `url(${this.cfg().backgroundImage})`
      : '',
    'padding-top': this.paddingMap[this.cfg().paddingTop] ?? this.paddingMap['md'],
    'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
  }));

  readonly overlayStyle = computed(() => ({
    'opacity': (this.cfg().overlayOpacity / 100).toString()
  }));

  isExternal(url: string): boolean {
    return url.startsWith('http') || url.startsWith('www');
  }
}
