import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-grid',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="bento-section" [ngStyle]="gridStyles">
      <div class="bento-container w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div class="bento-grid">
          @for (item of config.items; track item) {
            <div class="bento-card" 
                 [ngStyle]="{
                   'grid-column': 'span ' + (item.colSpan || 1),
                   'grid-row': 'span ' + (item.rowSpan || 1),
                   'background-color': item.backgroundColor || 'var(--bg-secondary)',
                   'border-radius': 'var(--ui-border-radius-' + (config.design?.borderRadius || 'lg') + ')',
                   'box-shadow': 'var(--shadow-' + (config.design?.boxShadow || 'sm') + ')'
                 }">
              
              @if (item.contentType === 'image') {
                <div class="bento-image-wrapper">
                  <img [src]="item.image" alt="Bento image" class="w-full h-full object-cover" />
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
  `]
})
export class BentoGridComponent {
  @Input() config: any = {};

  get gridStyles() {
    return {
      'grid-template-columns': `repeat(${this.config.columns || 4}, minmax(0, 1fr))`,
      'gap': `var(--spacing-${this.config.gap || 'md'})`,
      'background-color': this.config.design?.customBackground || 'transparent',
      'padding-top': `var(--spacing-${this.config.paddingTop || 'md'})`,
      'padding-bottom': `var(--spacing-${this.config.paddingBottom || 'md'})`
    };
  }
}
