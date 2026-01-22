import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-20 bg-slate-50 relative overflow-hidden" 
             [style.background-color]="config.backgroundColor || '#f8fafc'">
      
      <div class="container mx-auto px-6 max-w-4xl relative z-10">
        
        <div class="text-center mb-16">
          <h2 class="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">{{ config.title }}</h2>
          <div class="w-12 h-1 bg-rose-500 mx-auto rounded-full"></div>
        </div>

        <div class="space-y-4">
          @for (item of config.items; track $index) {
            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300"
                 [class.shadow-md]="isOpen($index)"
                 [class.shadow-sm]="!isOpen($index)">
              
              <button (click)="toggle($index)" 
                      class="w-full flex items-center justify-between p-6 text-left focus:outline-none group">
                <span class="font-bold text-slate-800 group-hover:text-rose-600 transition-colors pr-4">
                  {{ item.question }}
                </span>
                <span class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                      [ngClass]="isOpen($index) ? 'bg-rose-100 text-rose-600 rotate-180' : 'bg-slate-100 text-slate-400'">
                  <i class="pi pi-chevron-down text-xs"></i>
                </span>
              </button>

              <div class="grid transition-all duration-300 ease-in-out"
                   [ngClass]="isOpen($index) ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'">
                <div class="overflow-hidden px-6">
                  <p class="text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                    {{ item.answer }}
                  </p>
                </div>
              </div>

            </div>
          }
        </div>

      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Manrope:wght@400;600;700&display=swap');
    :host { display: block; font-family: 'Manrope', sans-serif; }
  `]
})
export class FaqAccordionComponent {
  @Input() config: any = {};
  openIndex = signal<number | null>(0); // Default first open

  isOpen(index: number): boolean {
    return this.openIndex() === index;
  }

  toggle(index: number) {
    this.openIndex.update(current => current === index ? null : index);
  }
}