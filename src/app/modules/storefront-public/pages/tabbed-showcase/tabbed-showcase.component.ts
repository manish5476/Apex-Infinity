import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabbed-showcase',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="tabbed-showcase-section py-24 px-4"
             [ngStyle]="{'background-color': config.design?.customBackground || 'var(--bg-primary)'}">
      
      <div class="max-w-[1200px] mx-auto flex flex-col items-center">
        
        <div class="flex flex-wrap justify-center gap-2 md:gap-4 mb-12 p-2 rounded-full bg-surface-100 border border-surface-200 shadow-sm">
          @for (tab of config.tabs; track tab.title; let i = $index) {
            <button (click)="activeIndex = i"
                    class="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300"
                    [ngClass]="activeIndex === i ? 'bg-primary-600 text-white shadow-md' : 'text-surface-500 hover:text-primary-600 hover:bg-surface-200'">
              {{ tab.title }}
            </button>
          }
        </div>

        @if (config.tabs && config.tabs.length > 0) {
          <div class="w-full flex flex-col md:flex-row items-center gap-12 bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-surface-100">
            
            <div class="flex-1 text-center md:text-left">
              <h2 class="text-3xl md:text-4xl font-bold mb-6 text-primary-900"
                  [ngStyle]="{'font-family': config.typography?.headingFont || 'var(--font-heading)'}">
                {{ config.tabs[activeIndex].title }}
              </h2>
              <p class="text-lg text-surface-600 leading-relaxed mb-8"
                 [ngStyle]="{'font-family': config.typography?.bodyFont || 'var(--font-body)'}">
                {{ config.tabs[activeIndex].content }}
              </p>
              
              @if (config.tabs[activeIndex].ctaText) {
                <a [href]="config.tabs[activeIndex].ctaLink" 
                   class="inline-block px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-primary-600 transition-colors">
                  {{ config.tabs[activeIndex].ctaText }}
                </a>
              }
            </div>

            <div class="flex-1 w-full relative h-[400px] rounded-2xl overflow-hidden shadow-inner bg-surface-50">
              @for (tab of config.tabs; track tab.title; let i = $index) {
                <img [src]="tab.image" 
                     [class.opacity-100]="activeIndex === i"
                     [class.opacity-0]="activeIndex !== i"
                     class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" 
                     alt="Tab visualization" />
              }
            </div>
          </div>
        }

      </div>
    </section>
  `,
  styles: []
})
export class TabbedShowcaseComponent {
  @Input() config: any = {};
  activeIndex = 0;
}
