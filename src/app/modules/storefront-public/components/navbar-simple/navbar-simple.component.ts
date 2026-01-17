import { Component, Input, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
            [class.pt-8]="!isScrolled()"
            [class.pt-4]="isScrolled()">

      <nav 
        class="pointer-events-auto relative flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
        [class.w-[92%]]="!isScrolled()"
        [class.max-w-[1280px]]="!isScrolled()"
        [class.w-auto]="isScrolled()" 
        [class.px-12]="!isScrolled()" 
        [class.py-4]="!isScrolled()"
        [class.px-8]="isScrolled()"
        [class.py-3]="isScrolled()"
        [class.gap-16]="!isScrolled()"
        [class.gap-8]="isScrolled()"
        style="
          border-radius: 100px;
          backdrop-filter: blur(2rem);
          -webkit-backdrop-filter: blur(2rem);
        "
        [ngClass]="{
          'glass-classic': !isScrolled(),
          'glass-scrolled': isScrolled()
        }">

        <div class="flex-shrink-0 flex items-center cursor-pointer select-none" [routerLink]="['/store', orgSlug]">
          @if (logo || organization?.logo) {
            <img [src]="logo || organization?.logo" 
                 [alt]="organization?.name" 
                 class="h-8 w-auto object-contain hover:opacity-80 transition-opacity duration-300">
          } @else {
            <span class="font-serif text-2xl font-bold tracking-tight whitespace-nowrap transition-colors duration-300"
                  [class.text-white]="!isScrolled()"
                  [class.text-slate-900]="isScrolled()">
              {{ organization?.name || 'Store' }}
            </span>
          }
        </div>

        <div class="hidden md:flex flex-1 justify-center">
          <div class="flex items-center gap-2">
            @for (item of config?.menuItems; track item.url) {
              <a [routerLink]="['/store', orgSlug, item.url.startsWith('/') ? item.url.substring(1) : item.url]"
                 [routerLinkActive]="['bg-white/20', 'shadow-inner']"
                 [routerLinkActiveOptions]="{exact: item.url === '/'}"
                 class="relative px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 group overflow-hidden border border-transparent"
                 [class.text-white]="!isScrolled()"
                 [class.text-slate-800]="isScrolled()"
                 [class.hover:border-white/20]="!isScrolled()">
                
                 <span class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-500 rounded-full"></span>
                 <span class="relative z-10">{{ item.label }}</span>
              </a>
            }
          </div>
        </div>

        <div class="flex items-center gap-4 min-w-fit">
          
          <button class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/10"
                  [class.text-white]="!isScrolled()"
                  [class.text-slate-500]="isScrolled()">
             <i class="pi pi-search text-lg opacity-80 group-hover:opacity-100"></i>
          </button>
          
          <button class="hidden md:flex items-center gap-3 px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-[0.15em] transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm"
             [class.bg-white]="!isScrolled()"
             [class.text-slate-900]="!isScrolled()"
             [class.bg-slate-900]="isScrolled()"
             [class.text-white]="isScrolled()">
             <span>Account</span> 
             <span class="w-1.5 h-1.5 rounded-full bg-red-500" *ngIf="false"></span> </button>

          <div class="md:hidden">
            <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    [class.text-white]="!isScrolled()" 
                    [class.text-slate-900]="isScrolled()">
              <i class="pi pi-bars text-xl"></i>
            </button>
          </div>

        </div>
      </nav>
    </header>
  `,
  styles: [`
    .font-serif { font-family: 'Playfair Display', serif; }

    /* CLASSIC GLASS STYLE 
       The "Magic" HSL color you provided + Inset White Border for 3D Glass Effect 
    */
    .glass-classic {
      background: hsl(0deg 43.94% 60.01% / 40%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      /* Inner white glow + Soft outer shadow */
      box-shadow: 
        inset 0 0 0 1px rgba(255, 255, 255, 0.2), 
        0 20px 40px -10px rgba(100, 50, 50, 0.15);
    }

    /* SCROLLED / COMPACT STYLE */
    .glass-scrolled {
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 
        inset 0 0 0 1px rgba(255, 255, 255, 0.5),
        0 10px 30px -5px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class NavbarSimpleComponent {
  @Input() config: any;
  @Input() logo: string | undefined;
  @Input() orgSlug: string = '';
  @Input() organization: any;

  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 30);
  }
}
// import { Component, Input, HostListener, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-navbar-simple',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b"
//             [class.bg-white/90]="isScrolled()"
//             [class.backdrop-blur-md]="isScrolled()"
//             [class.shadow-sm]="isScrolled()"
//             [class.border-gray-100]="isScrolled()"
//             [class.border-transparent]="!isScrolled()"
//             [class.py-2]="isScrolled()"
//             [class.py-5]="!isScrolled()"
//             [class.bg-transparent]="!isScrolled()">
      
//       <nav class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">
        
//         <div class="flex-shrink-0 flex items-center cursor-pointer min-w-fit" [routerLink]="['/store', orgSlug]">
//           @if (logo || organization?.logo) {
//             <img [src]="logo || organization?.logo" [alt]="organization?.name" class="h-9 w-auto object-contain">
//           } @else {
//             <span class="text-2xl font-serif font-bold tracking-tight whitespace-nowrap transition-colors duration-300" 
//                   [class.text-white]="!isScrolled()"
//                   [class.text-slate-900]="isScrolled()">
//               {{ organization?.name || 'Store' }}
//             </span>
//           }
//         </div>

//         <div class="hidden md:flex flex-1 justify-center max-w-2xl mx-auto overflow-hidden relative group">
          
//           <div class="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full justify-center px-4"
//                [style.mask-image]="'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'">
            
//             @for (item of config?.menuItems; track item.url) {
//               <a [routerLink]="['/store', orgSlug, item.url.startsWith('/') ? item.url.substring(1) : item.url]"
//                  [routerLinkActive]="['opacity-100', 'font-bold']"
//                  [routerLinkActiveOptions]="{exact: item.url === '/'}"
//                  class="flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-105 whitespace-nowrap"
//                  [class.text-white]="!isScrolled()"
//                  [class.text-slate-600]="isScrolled()"
//                  [class.hover:text-blue-500]="isScrolled()">
//                 {{ item.label }}
//               </a>
//             }

//           </div>
//         </div>

//         <div class="flex items-center gap-4 min-w-fit">
//           <button class="transition-colors duration-300 group"
//                   [class.text-white]="!isScrolled()"
//                   [class.text-slate-600]="isScrolled()">
//              <i class="pi pi-search text-lg group-hover:scale-110 transition-transform"></i>
//           </button>
          
//           <button class="hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-300 transform hover:scale-105"
//              [class.bg-white]="!isScrolled()"
//              [class.text-slate-900]="!isScrolled()"
//              [class.bg-slate-900]="isScrolled()"
//              [class.text-white]="isScrolled()">
//              Get Started
//           </button>

//           <div class="md:hidden">
//             <button class="transition-colors" [class.text-white]="!isScrolled()" [class.text-slate-900]="isScrolled()">
//               <i class="pi pi-bars text-2xl"></i>
//             </button>
//           </div>
//         </div>

//       </nav>
//     </header>
//   `,
//   styles: [`
//     /* Hide Scrollbar but keep functionality */
//     .no-scrollbar::-webkit-scrollbar { display: none; }
//     .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
//     .font-serif { font-family: 'Playfair Display', serif; }
//   `]
// })
// export class NavbarSimpleComponent {
//   @Input() config: any;
//   @Input() logo: string | undefined;
//   @Input() orgSlug: string = '';
//   @Input() organization: any; // ✅ Correct Input

//   isScrolled = signal(false);

//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     // Toggles state when scrolled past 20px
//     this.isScrolled.set(window.scrollY > 20);
//   }
// }
