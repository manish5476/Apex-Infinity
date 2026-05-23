// text-content.component.ts
import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TextContentConfig {
  title?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: 'sm' | 'md' | 'lg' | 'full';
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  themeMode?: 'auto' | 'light' | 'dark' | 'glass';
}

const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };
const MAX_W: Record<string, string> = { sm: '540px', md: '720px', lg: '960px', full: '100%' };

@Component({
  selector: 'app-text-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tc-root" [ngStyle]="sectionStyle()">
      <div class="tc-inner" [style.max-width]="maxW()">
        @if (cfg().title) {
          <h2 class="tc-title" [style.text-align]="cfg().alignment">{{ cfg().title }}</h2>
        }
        @if (cfg().content) {
          <div class="tc-body" [style.text-align]="cfg().alignment"
               [innerHTML]="cfg().content">
          </div>
        }
        @if (!cfg().title && !cfg().content) {
          <p class="tc-placeholder">Add your content in the editor panel.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .tc-root { background-color: var(--bg-primary); }
    .tc-inner { margin: 0 auto; padding: 0 var(--spacing-2xl); }
    .tc-title {
      font-family: var(--font-heading);
      font-size: clamp(24px, 3.5vw, 40px);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0 0 var(--spacing-2xl);
    }
    .tc-body {
      font-family: var(--font-body);
      font-size: var(--font-size-md);
      color: var(--text-secondary);
      line-height: 1.8;
      p { margin: 0 0 1em; }
      h1,h2,h3,h4 { color: var(--text-primary); font-family: var(--font-heading); margin: 1.5em 0 0.5em; }
      a { color: var(--accent-primary); text-decoration: underline; }
      ul,ol { padding-left: 1.5em; margin: 0 0 1em; }
    }
    .tc-placeholder {
      color: var(--text-tertiary);
      font-style: italic;
      font-size: var(--font-size-sm);
      text-align: center;
      padding: var(--spacing-3xl) 0;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextContentComponent {
  @Input() set config(v: TextContentConfig) { this._config.set(v ?? {}); }
  private _config = signal<TextContentConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? '',
    content: this._config().content ?? '',
    alignment: this._config().alignment ?? 'left',
    maxWidth: this._config().maxWidth ?? 'md',
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly maxW = computed(() => MAX_W[this.cfg().maxWidth] ?? '720px');

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().backgroundColor || ''
  }));
}