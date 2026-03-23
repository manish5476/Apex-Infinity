// split-image-text.component.ts  (selector: app-split-content)
import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SplitImageTextConfig {
  image?:         string;
  imagePosition?: 'left' | 'right';
  title?:         string;
  content?:       string;
  ctaButton?:     { text: string; link: string; variant?: string };
  paddingTop?:    'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

const PADDING: Record<string, string> = { none:'0', sm:'3rem', md:'5rem', lg:'8rem', xl:'11rem' };
const PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

@Component({
  selector: 'app-split-content',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './split-content.component.html',
  styleUrls:   ['./split-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitContentComponent {
  @Input() set config(v: SplitImageTextConfig) { this._config.set(v ?? {}); }
  private _config = signal<SplitImageTextConfig>({});

  readonly cfg = computed(() => ({
    image:         this._config().image         ?? PLACEHOLDER,
    imagePosition: this._config().imagePosition ?? 'left',
    title:         this._config().title         ?? 'Crafted with Purpose',
    content:       this._config().content       ?? 'Every detail matters. We combine thoughtful design with premium materials to create products that stand the test of time.',
    ctaButton:     this._config().ctaButton,
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().backgroundColor || ''
  }));

  isExternal(url: string): boolean {
    return url?.startsWith('http') || url?.startsWith('www');
  }
}
// // src/app/modules/storefront-public/pages/split-content/split-content.component.ts
// import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { SplitImageTextConfig } from '@core/models/storefront.model';

// @Component({
//   selector: 'app-split-content',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './split-content.component.html',
//   styleUrls: ['./split-content.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class SplitContentComponent {
//   @Input() set config(v: SplitImageTextConfig) { this._config.set(v ?? {}); }
//   private _config = signal<SplitImageTextConfig>({});

//   readonly cfg = computed(() => ({
//     title:           this._config().title,
//     content:         this._config().content,
//     image:           this._config().image           ?? 'https://via.placeholder.com/800x600',
//     imagePosition:   this._config().imagePosition   ?? 'left',
//     ctaButton:       this._config().ctaButton,
//     paddingTop:      this._config().paddingTop      ?? 'md',
//     paddingBottom:   this._config().paddingBottom   ?? 'md',
//     backgroundColor: this._config().backgroundColor ?? 'var(--bg-primary)',
//     themeMode:       this._config().themeMode       ?? 'auto',
//   }));

//   readonly paddingMap: Record<string, string> = { 
//     'none': '0',
//     'sm': 'var(--spacing-3xl)', 
//     'md': 'var(--spacing-5xl)', 
//     'lg': 'var(--spacing-7xl)',
//     'xl': 'calc(var(--spacing-7xl) * 1.5)' 
//   };

//   readonly sectionStyle = computed(() => ({
//     'background-color': this.cfg().backgroundColor,
//     'padding-top':      this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
//     'padding-bottom':   this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
//   }));

//   // Helper for CTA Link
//   getLink(url: string | undefined): any[] {
//     if (!url) return [];
//     if (url.startsWith('http') || url.startsWith('www')) return [];
//     const clean = url.startsWith('/') ? url.slice(1) : url;
//     return clean ? ['/', clean] : [];
//   }
  
//   isExternalLink(url: string | undefined): boolean {
//     return !!url && (url.startsWith('http') || url.startsWith('www'));
//   }
// }