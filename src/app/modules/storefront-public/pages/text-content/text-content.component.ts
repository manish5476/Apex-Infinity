import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface TextContentConfig {
  title?: string;
  content?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: 'sm' | 'md' | 'lg' | 'full';
  design?: any;       // Upgraded: Handles customBackground
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = {
  none: '0',
  sm: 'var(--spacing-3xl, 3rem)',
  md: 'var(--spacing-5xl, 5rem)',
  lg: 'calc(var(--spacing-5xl) * 1.5)',
  xl: 'calc(var(--spacing-5xl) * 2)'
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-text-content',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="prem-tc-section" [ngStyle]="sectionStyle()">
      <div class="prem-tc-container" [attr.data-width]="cfg().maxWidth">
        <div class="prem-tc-inner" [attr.data-align]="cfg().alignment">

          @if (!cfg().title && !cfg().content) {
            <div class="prem-empty">
              <div class="prem-empty__icon"><i class="pi pi-align-left"></i></div>
              <h3 class="prem-empty__title" [ngStyle]="headingStyle()">Rich Text Block</h3>
              <p class="prem-empty__desc" [ngStyle]="bodyStyle()">Use the editor panel to add headings, paragraphs, and formatted text.</p>
            </div>
          } @else {
            
            @if (cfg().title) {
              <h2 class="prem-tc-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
            }
            
            @if (cfg().content) {
              <div class="prem-prose" [innerHTML]="cfg().content" [ngStyle]="bodyStyle()"></div>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .prem-tc-section { position: relative; transition: background-color 0.5s ease; }
    .prem-tc-container { margin: 0 auto; padding: 0 5%; width: 100%; }
    
    .prem-tc-container[data-width="sm"] { max-width: 640px; }
    .prem-tc-container[data-width="md"] { max-width: 800px; }
    .prem-tc-container[data-width="lg"] { max-width: 1024px; }
    .prem-tc-container[data-width="full"] { max-width: 1440px; }

    .prem-tc-inner[data-align="left"] { text-align: left; }
    .prem-tc-inner[data-align="center"] { text-align: center; }
    .prem-tc-inner[data-align="right"] { text-align: right; }
    .prem-tc-inner[data-align="justify"] { text-align: justify; }
    .prem-tc-inner[data-align="center"] .prem-prose { margin-inline: auto; }

    .prem-tc-title { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 2rem 0; opacity: 0; animation: prem-fade-up 0.8s ease forwards; }

    .prem-prose { font-size: clamp(1.125rem, 1.5vw, 1.25rem); line-height: 1.75; opacity: 0; animation: prem-fade-up 0.8s ease 0.1s forwards; }
    .prem-prose p { margin-top: 0; margin-bottom: 1.5em; }
    .prem-prose h1, .prem-prose h2, .prem-prose h3 { margin-top: 2.5em; margin-bottom: 1em; line-height: 1.2; }
    .prem-prose a { text-decoration: underline; text-underline-offset: 4px; }
    .prem-prose blockquote { font-size: 1.25em; font-style: italic; padding: 1.5em; margin: 2em 0; border-left: 4px solid var(--accent-primary); background: rgba(0,0,0,0.03); border-radius: 0 1rem 1rem 0; }
    
    .prem-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem; background: rgba(0,0,0,0.03); border-radius: 2rem; border: 1px dashed var(--border-secondary); text-align: center; }
    .prem-empty__icon { width: 5rem; height: 5rem; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; color: var(--text-tertiary); }
    .prem-empty__title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    
    @keyframes prem-fade-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  `]
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
    design: this._config().design,
    typography: this._config().typography
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? PADDING['lg'],
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().typography?.headingColor || 'var(--text-primary)'
    };
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().typography?.bodyColor || 'var(--text-secondary)'
    };
  }
}



// import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';

// export interface TextContentConfig {
//   title?: string;
//   content?: string;
//   alignment?: 'left' | 'center' | 'right' | 'justify';
//   maxWidth?: 'sm' | 'md' | 'lg' | 'full';
//   paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?: string;
//   themeMode?: 'auto' | 'light' | 'dark' | 'glass';
// }

// const PADDING: Record<string, string> = {
//   none: '0',
//   sm: 'var(--spacing-3xl, 3rem)',
//   md: 'var(--spacing-5xl, 5rem)',
//   lg: 'var(--spacing-7xl, 8rem)',
//   xl: 'var(--spacing-9xl, 12rem)'
// };

// @Component({
//   selector: 'app-text-content',
//   standalone: true,
//   imports: [CommonModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   // We use None encapsulation combined with a strict root class (.prem-tc-section)
//   // to ensure we can beautifully style the injected WYSIWYG [innerHTML] content.
//   encapsulation: ViewEncapsulation.None,
//   template: `
//     <section class="prem-tc-section" [ngStyle]="sectionStyle()">
//       <div class="prem-tc-container" [attr.data-width]="cfg().maxWidth">
//         <div class="prem-tc-inner" [attr.data-align]="cfg().alignment">

//           @if (!cfg().title && !cfg().content) {
//             <div class="prem-empty">
//               <div class="prem-empty__icon">
//                 <i class="pi pi-align-left"></i>
//               </div>
//               <h3 class="prem-empty__title">Rich Text Block</h3>
//               <p class="prem-empty__desc">Use the editor panel to add headings, paragraphs, and formatted text.</p>
//             </div>
//           } @else {
            
//             @if (cfg().title) {
//               <h2 class="prem-tc-title">{{ cfg().title }}</h2>
//             }
            
//             @if (cfg().content) {
//               <div class="prem-prose" [innerHTML]="cfg().content"></div>
//             }
            
//           }
//         </div>
//       </div>
//     </section>
//   `,
//   styles: [`
//     /* ==========================================================================
//        APPLE / LINEAR PREMIUM TEXT AESTHETIC
//        ========================================================================== */

//     .prem-tc-section {
//       position: relative;
//       background-color: var(--bg-primary, var(--bg-primary));
//       transition: background-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), 
//                   padding 0.5s cubic-bezier(0.16, 1, 0.3, 1);
//       font-family: var(--font-body, 'Inter', -apple-system, sans-serif);
//       color: var(--text-primary, var(--text-primary));
//     }

//     .prem-tc-container {
//       margin: 0 auto;
//       padding: 0 5%;
//       width: 100%;
//     }

//     /* --- Width Constraints (Optimized for Reading) --- */
//     .prem-tc-container[data-width="sm"] { max-width: 640px; }
//     .prem-tc-container[data-width="md"] { max-width: 800px; } /* Optimal for prose */
//     .prem-tc-container[data-width="lg"] { max-width: 1024px; }
//     .prem-tc-container[data-width="full"] { max-width: 1440px; }

//     /* --- Alignment Logic --- */
//     .prem-tc-inner[data-align="left"] { text-align: left; }
//     .prem-tc-inner[data-align="center"] { text-align: center; }
//     .prem-tc-inner[data-align="right"] { text-align: right; }
//     .prem-tc-inner[data-align="justify"] { text-align: justify; }

//     .prem-tc-inner[data-align="center"] .prem-prose {
//       margin-inline: auto; /* Centers the prose block itself */
//     }

//     /* --- Title --- */
//     .prem-tc-title {
//       font-family: var(--font-heading, 'Inter', sans-serif);
//       font-size: clamp(2rem, 4vw, 3.5rem);
//       font-weight: 800;
//       letter-spacing: -0.03em;
//       line-height: 1.1;
//       margin: 0 0 2rem 0;
//       color: var(--text-primary, var(--text-primary));
//       animation: prem-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//     }

//     /* --- Premium Prose Styling (Injected HTML) --- */
//     /* This targets exactly what WYSIWYG editors produce */
//     .prem-prose {
//       font-size: clamp(1.125rem, 1.5vw, 1.25rem); /* 18px to 20px */
//       line-height: 1.75;
//       color: var(--text-secondary, var(--text-secondary));
//       animation: prem-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
//       opacity: 0;
//     }

//     .prem-prose p {
//       margin-top: 0;
//       margin-bottom: 1.5em;
//     }

//     .prem-prose p:last-child {
//       margin-bottom: 0;
//     }

//     .prem-prose h1, .prem-prose h2, .prem-prose h3, .prem-prose h4 {
//       color: var(--text-primary, var(--text-primary));
//       font-family: var(--font-heading, sans-serif);
//       font-weight: 700;
//       line-height: 1.2;
//       letter-spacing: -0.02em;
//       margin-top: 2.5em;
//       margin-bottom: 1em;
//     }

//     .prem-prose h1 { font-size: 2.25em; }
//     .prem-prose h2 { font-size: 1.8em; }
//     .prem-prose h3 { font-size: 1.5em; }
//     .prem-prose h4 { font-size: 1.25em; }

//     .prem-prose a {
//       color: var(--theme-accent-primary, var(--accent-primary));
//       text-decoration: none;
//       border-bottom: 1px solid color-mix(in srgb, var(--theme-accent-primary, var(--accent-primary)) 30%, transparent);
//       transition: border-color 0.2s;
//     }

//     .prem-prose a:hover {
//       border-bottom-color: var(--theme-accent-primary, var(--accent-primary));
//     }

//     .prem-prose ul, .prem-prose ol {
//       margin-top: 0;
//       margin-bottom: 1.5em;
//       padding-left: 1.5em;
//     }

//     .prem-prose li {
//       margin-bottom: 0.5em;
//     }

//     .prem-prose blockquote {
//       font-size: 1.25em;
//       font-style: italic;
//       font-weight: 500;
//       color: var(--text-primary, var(--text-primary));
//       border-left: 4px solid var(--theme-accent-primary, var(--accent-primary));
//       padding-left: 1.5em;
//       margin: 2em 0;
//       background: linear-gradient(to right, color-mix(in srgb, var(--theme-accent-primary, var(--accent-primary)) 5%, transparent), transparent);
//       padding: 1.5em;
//       border-radius: 0 1rem 1rem 0;
//     }

//     .prem-prose strong, .prem-prose b {
//       color: var(--text-primary, var(--text-primary));
//       font-weight: 700;
//     }

//     /* Handle centering lists perfectly */
//     .prem-tc-inner[data-align="center"] .prem-prose ul,
//     .prem-tc-inner[data-align="center"] .prem-prose ol {
//       display: inline-block;
//       text-align: left;
//     }

//     /* --- Empty State --- */
//     .prem-empty {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       padding: 6rem 2rem;
//       background: color-mix(in srgb, var(--bg-secondary, var(--bg-secondary)) 50%, transparent);
//       border-radius: 2rem;
//       border: 1px dashed color-mix(in srgb, var(--border-secondary, var(--border-primary)) 80%, transparent);
//       text-align: center;
//     }

//     .prem-empty__icon {
//       width: 5rem;
//       height: 5rem;
//       border-radius: 50%;
//       background: var(--bg-primary, var(--bg-primary));
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       margin-bottom: 1.5rem;
//       box-shadow: 0 4px 20px rgba(0,0,0,0.05);
//       color: var(--text-tertiary, var(--text-secondary));
//     }

//     .prem-empty__icon i { font-size: 2rem; }
//     .prem-empty__title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary, var(--text-primary)); margin: 0 0 0.5rem 0; }
//     .prem-empty__desc { color: var(--text-secondary, var(--text-secondary)); max-width: 400px; }

//     /* --- Animations --- */
//     @keyframes prem-fade-up {
//       0% { opacity: 0; transform: translateY(20px); }
//       100% { opacity: 1; transform: translateY(0); }
//     }
//   `]
// })
// export class TextContentComponent {
//   @Input() set config(v: TextContentConfig) {
//     this._config.set(v ?? {});
//   }

//   private _config = signal<TextContentConfig>({});

//   readonly cfg = computed(() => ({
//     title: this._config().title ?? '',
//     content: this._config().content ?? '',
//     alignment: this._config().alignment ?? 'left',
//     maxWidth: this._config().maxWidth ?? 'md',
//     paddingTop: this._config().paddingTop ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? ''
//   }));

//   readonly sectionStyle = computed(() => ({
//     'padding-top': PADDING[this.cfg().paddingTop] ?? PADDING['lg'],
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? PADDING['lg'],
//     'background-color': this.cfg().backgroundColor || ''
//   }));
// }
