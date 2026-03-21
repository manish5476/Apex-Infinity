// src/app/modules/storefront-public/pages/split-content/split-content.component.ts
import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SplitImageTextConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-split-content',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './split-content.component.html',
  styleUrls: ['./split-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitContentComponent {
  @Input() set config(v: SplitImageTextConfig) { this._config.set(v ?? {}); }
  private _config = signal<SplitImageTextConfig>({});

  readonly cfg = computed(() => ({
    title:           this._config().title,
    content:         this._config().content,
    image:           this._config().image           ?? 'https://via.placeholder.com/800x600',
    imagePosition:   this._config().imagePosition   ?? 'left',
    ctaButton:       this._config().ctaButton,
    paddingTop:      this._config().paddingTop      ?? 'md',
    paddingBottom:   this._config().paddingBottom   ?? 'md',
    backgroundColor: this._config().backgroundColor ?? 'var(--bg-primary)',
    themeMode:       this._config().themeMode       ?? 'auto',
  }));

  readonly paddingMap: Record<string, string> = { 
    'none': '0',
    'sm': 'var(--spacing-3xl)', 
    'md': 'var(--spacing-5xl)', 
    'lg': 'var(--spacing-7xl)',
    'xl': 'calc(var(--spacing-7xl) * 1.5)' 
  };

  readonly sectionStyle = computed(() => ({
    'background-color': this.cfg().backgroundColor,
    'padding-top':      this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
    'padding-bottom':   this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
  }));

  // Helper for CTA Link
  getLink(url: string | undefined): any[] {
    if (!url) return [];
    if (url.startsWith('http') || url.startsWith('www')) return [];
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : [];
  }
  
  isExternalLink(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}