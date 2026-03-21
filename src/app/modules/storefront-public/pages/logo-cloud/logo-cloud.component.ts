import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface LogoItem {
  id?: string;
  name: string;
  image: string;
  url?: string;
  order?: number;
}

export interface LogoCloudConfig {
  title?: string;
  logos: LogoItem[];
  theme?: 'light' | 'dark';
  backgroundColor?: string;
  backgroundImage?: string;
  containerWidth?: 'standard' | 'full';
  paddingTop?: 'sm' | 'md' | 'lg';
  paddingBottom?: 'sm' | 'md' | 'lg';
  grayscale?: boolean;
  opacity?: number;
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Premium Logo Cloud Component
 * Displays a grid of partner/client logos with elegant hover effects and transitions.
 */
@Component({
  selector: 'app-logo-cloud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './logo-cloud.component.html',
  styleUrls: ['./logo-cloud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoCloudComponent {
  // --- Private State ---
  private readonly _config = signal<LogoCloudConfig | any>({});

  // --- Inputs ---
  @Input() set config(v: LogoCloudConfig | any) {
    this._config.set(v ?? {});
  }

  // --- Computed State ---
  readonly cfg = computed(() => {
    const v = this._config();
    return {
      title: v.title || '',
      logos: v.logos || [],
      theme: v.theme || 'light',
      backgroundColor: v.backgroundColor || 'transparent',
      backgroundImage: v.backgroundImage || '',
      containerWidth: v.containerWidth || 'standard',
      paddingTop: v.paddingTop || 'md',
      paddingBottom: v.paddingBottom || 'md',
      grayscale: v.grayscale ?? true,
      opacity: v.opacity ?? 0.6,
      gap: v.gap || 'md'
    };
  });

  readonly isDark = computed(() => this.cfg().theme === 'dark');

  /**
   * Section Root Styles (Background and Spacing)
   */
  readonly sectionStyle = computed(() => {
    const c = this.cfg();
    const style: any = {
      'background-color': c.backgroundColor,
      '--pt': this._getPadding(c.paddingTop),
      '--pb': this._getPadding(c.paddingBottom),
    };

    if (c.backgroundImage) {
      style['background-image'] = `url('${c.backgroundImage}')`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }

    return style;
  });

  /**
   * Individual Logo Styles
   */
  readonly logoItemStyle = computed(() => {
    const c = this.cfg();
    return {
      '--logo-opacity': c.opacity,
      '--logo-filter': c.grayscale ? 'grayscale(100%)' : 'none'
    };
  });

  // --- Helpers ---

  private _getPadding(size: string): string {
    const map: Record<string, string> = {
      'sm': 'var(--spacing-3xl)',
      'md': 'var(--spacing-6xl)',
      'lg': 'var(--spacing-8xl)'
    };
    return map[size] || map['md'];
  }

  isExternal(url: string | undefined): boolean {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('www');
  }

  getLink(url: string | undefined): any[] | null {
    if (!url) return null;
    return [url];
  }
}