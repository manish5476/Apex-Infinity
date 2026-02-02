import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pricing-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="section-root" 
             [style.background-color]="config.backgroundColor || 'var(--bg-secondary)'"
             [style.padding-top]="paddingMap[config.paddingTop] || 'var(--spacing-5xl)'"
             [style.padding-bottom]="paddingMap[config.paddingBottom] || 'var(--spacing-5xl)'">
      
      <div class="container-wrapper" 
           [class.standard]="config.containerWidth === 'standard'"
           [class.full]="config.containerWidth === 'full'">
        
        <div class="header-group" *ngIf="config.title">
          <h2 class="section-title animate-in">{{ config.title }}</h2>
          <div class="divider-pill animate-in delay-1"></div>
        </div>

        <div class="pricing-grid">
          
          @for (plan of config.plans; track $index) {
            <div class="pricing-card animate-in delay-1" 
                 [class.is-popular]="plan.isPopular">
              
              @if (plan.isPopular) {
                <div class="popular-badge">Most Popular</div>
              }

              <div class="card-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                
                <div class="price-box">
                  <span class="price-amount">{{ plan.currency }}{{ plan.price }}</span>
                  <span class="price-period">{{ plan.period }}</span>
                </div>
                
                <p class="plan-desc">{{ plan.description }}</p>
              </div>

              <ul class="features-list">
                @for (feature of parseFeatures(plan.features); track $index) {
                  <li class="feature-item">
                    <i class="pi pi-check-circle check-icon"></i>
                    {{ feature }}
                  </li>
                }
              </ul>

              <a [routerLink]="getLink(plan.buttonUrl)" 
                 class="cta-btn">
                {{ plan.buttonText || 'Select Plan' }}
              </a>

            </div>
          }

        </div>
      </div>
    </section>
  `,
  styleUrls: ['./pricing-table.component.scss']
})
export class PricingTableComponent {
  @Input() config: any = {};

  // Layout Mappers
  paddingMap: any = {
    'none': '0',
    'sm': 'var(--spacing-3xl)', 
    'md': 'var(--spacing-5xl)', 
    'lg': 'var(--spacing-7xl)'
  };

  parseFeatures(features: string | string[]): string[] {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return features.split(',').map(s => s.trim());
    return ['Feature 1', 'Feature 2', 'Feature 3']; // Fallback
  }

  getLink(url: string): any[] {
    if (!url) return [];
    // Assuming internal routing for now
    return [url];
  }
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-pricing-table',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <section class="py-20 relative overflow-hidden" 
//              [style.background-color]="config.backgroundColor || '#ffffff'">
      
//       <div class="container mx-auto px-6 relative z-10" [class.max-w-7xl]="config.containerWidth === 'standard'">
        
//         <div class="text-center mb-16" *ngIf="config.title">
//           <h2 class="font-serif text-3xl md:text-5xl font-bold text-slate-900 mb-4 animate-fade-up">
//             {{ config.title }}
//           </h2>
//           <div class="w-16 h-1 bg-slate-200 mx-auto rounded-full"></div>
//         </div>

//         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          
//           @for (plan of config.plans; track $index) {
//             <div class="group relative p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 border"
//                  [ngClass]="plan.isPopular ? 'bg-slate-900 text-white shadow-2xl border-slate-900' : 'bg-white text-slate-900 shadow-xl border-slate-100 hover:border-slate-200'">
              
//               @if (plan.isPopular) {
//                 <span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
//                   Most Popular
//                 </span>
//               }

//               <div class="text-center border-b pb-8 mb-8" 
//                    [class.border-white-10]="plan.isPopular" 
//                    [class.border-slate-100]="!plan.isPopular">
//                 <h3 class="text-sm font-bold uppercase tracking-[0.2em] mb-4 opacity-70">{{ plan.name }}</h3>
//                 <div class="flex justify-center items-baseline gap-1">
//                   <span class="text-4xl font-serif font-bold">{{ plan.currency }}{{ plan.price }}</span>
//                   <span class="text-sm opacity-60">{{ plan.period }}</span>
//                 </div>
//                 <p class="mt-4 text-sm opacity-70 leading-relaxed">{{ plan.description }}</p>
//               </div>

//               <ul class="space-y-4 mb-8 text-sm font-medium opacity-80">
//                 @for (feature of parseFeatures(plan.features); track $index) {
//                   <li class="flex items-center gap-3">
//                     <i class="pi pi-check-circle text-lg" [class.text-green-400]="plan.isPopular" [class.text-green-600]="!plan.isPopular"></i>
//                     {{ feature }}
//                   </li>
//                 }
//               </ul>

//               <a [routerLink]="plan.buttonUrl" 
//                  class="block w-full py-4 rounded-xl text-center text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] shadow-md"
//                  [ngClass]="plan.isPopular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'">
//                 {{ plan.buttonText || 'Get Started' }}
//               </a>

//             </div>
//           }

//         </div>
//       </div>
//     </section>
//   `,
//   styles: [`
//     @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Manrope:wght@400;600;700&display=swap');
//     :host { display: block; font-family: 'Manrope', sans-serif; }
//     .border-white-10 { border-color: rgba(255,255,255,0.1); }
//     .animate-fade-up { animation: fadeUp 0.8s ease-out forwards; }
//     @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
//   `]
// })
// export class PricingTableComponent {
//   @Input() config: any = {};

//   parseFeatures(features: string | string[]): string[] {
//     if (Array.isArray(features)) return features;
//     if (typeof features === 'string') return features.split(',').map(s => s.trim());
//     return ['Feature 1', 'Feature 2', 'Feature 3']; // Fallback
//   }
// }