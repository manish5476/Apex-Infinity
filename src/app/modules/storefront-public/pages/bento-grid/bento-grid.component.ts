import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-grid',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="bento-section" [ngStyle]="sectionStyles">
      <div class="bento-container w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div class="bento-grid" [ngStyle]="gridStyles">
          @for (item of config.items; track item) {
            <div class="bento-card" 
                 [ngStyle]="{
                   'grid-column': 'span ' + getColSpan(item),
                   'grid-row': 'span ' + (item.rowSpan || 1),
                   'background-color': item.backgroundColor || 'var(--bg-secondary)',
                   'border-radius': getBorderRadius(config.design?.borderRadius),
                   'box-shadow': 'var(--shadow-' + (config.design?.boxShadow || 'sm') + ')'
                 }">
              
              @if (item.contentType === 'image') {
                <div class="bento-image-wrapper">
                  <img [src]="item.image" alt="Bento image" class="w-full h-full object-cover" />
                  <div class="bento-image-overlay">
                    @if (item.title) {
                      <h3 class="bento-title mb-2" style="color: #ffffff;">{{ item.title }}</h3>
                    }
                    @if (item.content) {
                      <p class="bento-content" style="color: #f3f4f6;">{{ item.content }}</p>
                    }
                  </div>
                </div>
              }

              @if (item.contentType === 'text') {
                <div class="bento-text-wrapper p-6 flex flex-col justify-center h-full">
                  @if (item.title) {
                    <h3 class="bento-title mb-3">{{ item.title }}</h3>
                  }
                  <p class="bento-content">{{ item.content }}</p>
                </div>
              }
              
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .bento-section {
      width: 100%;
    }
    .bento-grid {
      display: grid;
    }
    .bento-card {
      position: relative;
      overflow: hidden;
      border: var(--ui-border-width) solid var(--border-primary);
      transition: var(--transition-base);
      
      &:hover {
        border-color: var(--border-secondary);
        transform: translateY(-2px);
      }
    }
    .bento-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      line-height: var(--line-height-tight);
    }
    .bento-content {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      line-height: var(--line-height-relaxed);
    }
    .bento-image-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .bento-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
  `]
})
export class BentoGridComponent {
  @Input() config: any = {};

  get sectionStyles() {
    return {
      'background-color': this.config.design?.customBackground || 'transparent',
      'padding-top': `var(--spacing-${this.config.paddingTop || 'md'})`,
      'padding-bottom': `var(--spacing-${this.config.paddingBottom || 'md'})`
    };
  }

  get gridStyles() {
    return {
      'grid-template-columns': `repeat(${this.config.columns || 4}, minmax(0, 1fr))`,
      'gap': `var(--spacing-${this.config.gap || 'md'})`,
      'grid-auto-rows': '120px'
    };
  }

  getColSpan(item: any): number {
    const requested = item.colSpan || 1;
    const maxCols = this.config.columns || 4;
    return requested > maxCols ? maxCols : requested;
  }

  getBorderRadius(size?: string): string {
    const map: Record<string, string> = {
      'none': '0px',
      'sm': 'var(--ui-border-radius-sm)',
      'md': 'var(--ui-border-radius)',
      'lg': 'var(--ui-border-radius-lg)',
      'xl': 'var(--ui-border-radius-xl)',
      '2xl': 'var(--ui-border-radius-xl)',
      'full': 'var(--ui-border-radius-pill)'
    };
    return map[size || 'lg'] || 'var(--ui-border-radius-lg)';
  }
}
