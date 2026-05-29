import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stacked-cards',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="stacked-cards-section w-full py-24 px-4 md:px-8"
             [ngStyle]="{'background-color': config.design?.customBackground || 'var(--bg-primary)'}">
      
      <div class="w-full mx-auto flex flex-col gap-[6vh]"
           [ngClass]="{
             'max-w-3xl': config.cardWidth === 'md',
             'max-w-5xl': config.cardWidth === 'lg' || !config.cardWidth,
             'max-w-[1400px]': config.cardWidth === 'xl'
           }">
        
        @for (card of config.cards; track card.title; let i = $index) {
          <div class="stacked-card sticky flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-xl transition-all duration-300"
               [ngStyle]="{
                 'top': 'calc(15vh + ' + (i * 24) + 'px)', 
                 'background-color': card.cardBgColor || 'var(--bg-secondary)',
                 'border': '1px solid var(--border-primary)',
                 'z-index': i + 1
               }">
            
            <div class="p-8 md:p-12 flex-1 flex flex-col justify-center">
              @if (card.badge) {
                <span class="inline-block px-3 py-1 bg-primary-500/10 text-primary-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6 w-max">
                  {{ card.badge }}
                </span>
              }
              
              <h3 class="text-3xl md:text-4xl font-bold mb-4 text-primary-900"
                  [ngStyle]="{'font-family': config.typography?.headingFont || 'var(--font-heading)'}">
                {{ card.title }}
              </h3>
              
              <p class="text-lg text-surface-600 leading-relaxed"
                 [ngStyle]="{'font-family': config.typography?.bodyFont || 'var(--font-body)'}">
                {{ card.content }}
              </p>
            </div>

            @if (card.image) {
              <div class="w-full md:w-1/2 h-64 md:h-auto min-h-[300px] bg-surface-100">
                <img [src]="card.image" [alt]="card.title" class="w-full h-full object-cover" />
              </div>
            }
            
          </div>
        }

      </div>
    </section>
  `,
  styles: [`
    .stacked-cards-section {
      position: relative;
    }
    .stacked-card {
      position: -webkit-sticky;
      position: sticky;
      transform-origin: top center;
    }
  `]
})
export class StackedCardsComponent {
  @Input() config: any = {};
}
