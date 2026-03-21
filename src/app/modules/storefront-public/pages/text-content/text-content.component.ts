// src/app/modules/storefront-public/pages/text-content/text-content.component.ts
import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextContentConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-text-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-content.component.html',
  styleUrls: ['./text-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextContentComponent {
  
  @Input() set config(v: TextContentConfig) { this._config.set(v ?? {}); }
  private _config = signal<TextContentConfig>({});

  readonly cfg = computed(() => ({
    title:           this._config().title,
    content:         this._config().content,
    alignment:       this._config().alignment       ?? 'left',
    maxWidth:        this._config().maxWidth        ?? 'md',
    paddingTop:      this._config().paddingTop      ?? 'md',
    paddingBottom:   this._config().paddingBottom   ?? 'md',
    backgroundColor: this._config().backgroundColor ?? 'var(--bg-primary)',
    themeMode:       this._config().themeMode       ?? 'auto',
  }));

  // Padding Logic
  readonly paddingMap: Record<string, string> = { 
    'none': '0', 
    'sm': 'var(--spacing-3xl)', 
    'md': 'var(--spacing-6xl)', 
    'lg': 'var(--spacing-8xl)', 
    'xl': 'var(--spacing-9xl)' 
  };

  readonly sectionStyle = computed(() => {
    return {
      'background-color': this.cfg().backgroundColor,
      'padding-top':      this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
      'padding-bottom':   this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
    };
  });

  // Container Width
  readonly maxWidthClass = computed(() => {
    switch (this.cfg().maxWidth) {
      case 'sm': return 'max-w-2xl'; // ~672px (Article)
      case 'md': return 'max-w-4xl'; // ~896px (Standard)
      case 'lg': return 'max-w-6xl';   // ~1152px
      case 'full': return 'max-w-full';
      default: return 'max-w-4xl';
    }
  });

  // Text Alignment
  readonly alignmentClass = computed(() => {
    switch (this.cfg().alignment) {
      case 'center': return 'text-center mx-auto';
      case 'right': return 'text-right ml-auto';
      default: return 'text-left mr-auto'; // 'left' or 'justify' handled loosely here.
    }
  });

  // Text Color Theme
  readonly textClass = computed(() => {
    return this.cfg().themeMode === 'dark' 
      ? 'text-white' 
      : 'text-dark'; 
  });
}