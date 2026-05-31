import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editorial-hero',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="editorial-hero"
             [ngStyle]="{
               'background-color': config.design?.customBackground || 'var(--bg-primary)',
               'padding-top': 'var(--spacing-' + (config.paddingTop || '4xl') + ')',
               'padding-bottom': 'var(--spacing-' + (config.paddingBottom || '4xl') + ')'
             }">
    
      <div class="max-w-[1400px] mx-auto px-6 md:px-12 relative flex flex-col md:flex-row items-center"
        [class.md:flex-row-reverse]="config.layoutDirection === 'text_right'">
    
        <div class="editorial-text-col z-20 flex-1 relative" [class.text-center]="config.layoutDirection === 'split_center'">
    
          @if (config.accentTitle) {
            <span class="editorial-accent block mb-[-2rem] ml-4 opacity-80"
                  [ngStyle]="{
                    'font-family': config.accentFont || 'var(--font-heading)',
                    'color': config.typography?.headingColor || 'var(--accent-primary)'
                  }">
              {{ config.accentTitle }}
            </span>
          }
    
          <h1 class="editorial-title uppercase tracking-tighter"
              [ngStyle]="{
                'font-family': config.primaryFont || 'var(--font-heading)',
                'color': config.typography?.headingColor || 'var(--text-primary)'
              }">
            {{ config.primaryTitle }}
          </h1>
    
          @if (config.ctaButton?.text) {
            <a [href]="config.ctaButton.link"
              class="editorial-btn mt-8 inline-flex items-center gap-2"
              [ngStyle]="{'background-color': config.ctaButton.buttonColor || 'var(--text-primary)'}">
              {{ config.ctaButton.text }}
              @if (config.ctaButton.icon) {
                <i [class]="config.ctaButton.icon"></i>
              }
            </a>
          }
        </div>
    
        <div class="editorial-image-col flex-1 relative mt-12 md:mt-0 z-10 w-full">
          <div class="primary-img-wrapper overflow-hidden rounded-xl">
            <img [src]="config.mainImage" alt="Hero" class="w-full h-[600px] object-cover scale-105 hover:scale-100 transition-transform duration-700 ease-out" />
          </div>
    
          @if (config.secondaryImage) {
            <div class="secondary-img-wrapper absolute -bottom-12 -left-12 w-64 h-80 rounded-lg overflow-hidden shadow-2xl border-4 border-white z-30 hidden md:block">
              <img [src]="config.secondaryImage" alt="Accent" class="w-full h-full object-cover" />
            </div>
          }
        </div>
    
      </div>
    </section>
    `,
  styles: [`
    .editorial-hero {
      position: relative;
      overflow: hidden;
    }
    .editorial-title {
      font-size: clamp(3rem, 8vw, 7rem);
      line-height: 0.9;
      font-weight: 800;
      position: relative;
      z-index: 2;
    }
    .editorial-accent {
      font-size: clamp(4rem, 10vw, 9rem);
      line-height: 0.7;
      white-space: nowrap;
      position: relative;
      z-index: 1;
      mix-blend-mode: multiply;
    }
    .editorial-btn {
      color: var(--bg-primary);
      padding: var(--spacing-md) var(--spacing-2xl);
      border-radius: var(--ui-border-radius-pill);
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: var(--transition-base);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
    }
  `]
})
export class EditorialHeroComponent {
  @Input() config: any = {};
}
