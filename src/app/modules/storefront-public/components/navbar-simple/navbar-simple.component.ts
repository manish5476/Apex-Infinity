import { Component, Input, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b"
            [class.bg-white/90]="isScrolled()"
            [class.backdrop-blur-md]="isScrolled()"
            [class.shadow-sm]="isScrolled()"
            [class.border-gray-100]="isScrolled()"
            [class.border-transparent]="!isScrolled()"
            [class.py-2]="isScrolled()"
            [class.py-5]="!isScrolled()"
            [class.bg-transparent]="!isScrolled()">
      
      <nav class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">
        
        <div class="flex-shrink-0 flex items-center cursor-pointer min-w-fit" [routerLink]="['/store', orgSlug]">
          @if (logo || organization?.logo) {
            <img [src]="logo || organization?.logo" [alt]="organization?.name" class="h-9 w-auto object-contain">
          } @else {
            <span class="text-2xl font-serif font-bold tracking-tight whitespace-nowrap transition-colors duration-300" 
                  [class.text-white]="!isScrolled()"
                  [class.text-slate-900]="isScrolled()">
              {{ organization?.name || 'Store' }}
            </span>
          }
        </div>

        <div class="hidden md:flex flex-1 justify-center max-w-2xl mx-auto overflow-hidden relative group">
          
          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full justify-center px-4"
               [style.mask-image]="'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'">
            
            @for (item of config?.menuItems; track item.url) {
              <a [routerLink]="['/store', orgSlug, item.url.startsWith('/') ? item.url.substring(1) : item.url]"
                 [routerLinkActive]="['opacity-100', 'font-bold']"
                 [routerLinkActiveOptions]="{exact: item.url === '/'}"
                 class="flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-105 whitespace-nowrap"
                 [class.text-white]="!isScrolled()"
                 [class.text-slate-600]="isScrolled()"
                 [class.hover:text-blue-500]="isScrolled()">
                {{ item.label }}
              </a>
            }

          </div>
        </div>

        <div class="flex items-center gap-4 min-w-fit">
          <button class="transition-colors duration-300 group"
                  [class.text-white]="!isScrolled()"
                  [class.text-slate-600]="isScrolled()">
             <i class="pi pi-search text-lg group-hover:scale-110 transition-transform"></i>
          </button>
          
          <button class="hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-300 transform hover:scale-105"
             [class.bg-white]="!isScrolled()"
             [class.text-slate-900]="!isScrolled()"
             [class.bg-slate-900]="isScrolled()"
             [class.text-white]="isScrolled()">
             Get Started
          </button>

          <div class="md:hidden">
            <button class="transition-colors" [class.text-white]="!isScrolled()" [class.text-slate-900]="isScrolled()">
              <i class="pi pi-bars text-2xl"></i>
            </button>
          </div>
        </div>

      </nav>
    </header>
  `,
  styles: [`
    /* Hide Scrollbar but keep functionality */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    .font-serif { font-family: 'Playfair Display', serif; }
  `]
})
export class NavbarSimpleComponent {
  @Input() config: any;
  @Input() logo: string | undefined;
  @Input() orgSlug: string = '';
  @Input() organization: any; // ✅ Correct Input

  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Toggles state when scrolled past 20px
    this.isScrolled.set(window.scrollY > 20);
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
//     <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
//             [class.bg-white]="isScrolled()"
//             [class.shadow-sm]="isScrolled()"
//             [class.py-2]="isScrolled()"
//             [class.py-4]="!isScrolled()"
//             [class.bg-transparent]="!isScrolled()">
      
//       <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
//         <div class="flex-shrink-0 flex items-center cursor-pointer" [routerLink]="['/store', orgSlug]">
//           @if (logo) {
//             <img [src]="logo" alt="Logo" class="h-8 w-auto">
//           } @else {
//             {{organization|json}}
//             <span class="text-2xl font-serif font-bold tracking-tight" 
//                   [class.text-white]="!isScrolled()"
//                   [class.text-slate-900]="isScrolled()">
//               {{config?.organization?.name}}
//             </span>
//           }
//         </div>

//         <div class="hidden md:flex items-center space-x-8">
//           @for (item of config?.menuItems; track item.url) {
//             <a [routerLink]="['/store', orgSlug, item.url.startsWith('/') ? item.url.substring(1) : item.url]"
//                class="text-xs font-bold uppercase tracking-widest transition-colors duration-200"
//                [class.text-white]="!isScrolled()"
//                [class.hover:text-white/80]="!isScrolled()"
//                [class.text-slate-600]="isScrolled()"
//                [class.hover:text-blue-600]="isScrolled()">
//               {{ item.label }}
//             </a>
//           }
//         </div>

//         <!-- <div class="hidden md:flex items-center gap-4">
//           <a routerLink="/login" 
//              class="text-xs font-bold uppercase tracking-widest transition-colors"
//              [class.text-white]="!isScrolled()"
//              [class.text-slate-900]="isScrolled()">
//              Log In
//           </a>
//           <a routerLink="/signup" 
//              class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all transform hover:scale-105"
//              [class.bg-white]="!isScrolled()"
//              [class.text-slate-900]="!isScrolled()"
//              [class.bg-slate-900]="isScrolled()"
//              [class.text-white]="isScrolled()">
//              Get Started ->
//           </a>
//         </div> -->

//         <div class="md:hidden">
//           <button class="transition-colors" [class.text-white]="!isScrolled()" [class.text-slate-900]="isScrolled()">
//             <i class="pi pi-bars text-2xl"></i>
//           </button>
//         </div>

//       </nav>
//     </header>
//   `
// })
// export class NavbarSimpleComponent {
//   @Input() config: any;
//   @Input() logo: string | undefined;
//   @Input() orgSlug: string = '';
// @Input() organization:any
//   isScrolled = signal(false);

//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     this.isScrolled.set(window.scrollY > 20);
//   }
// }
