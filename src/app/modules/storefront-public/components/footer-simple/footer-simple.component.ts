import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="relative bg-[#0f1216] text-slate-400 font-sans pt-10 pb-12">
      
      <div class="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-[98%] z-0">
        <svg class="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  fill="#0f1216"></path>
        </svg>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        
        <div class="mb-20 text-center opacity-10 select-none pointer-events-none">
           <h1 class="text-[15vw] leading-[0.8] font-serif font-black text-white tracking-tighter">
             {{ organization?.name || 'STORE' }}
           </h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/5 pb-16 mb-12">
          
          <div class="md:col-span-4 space-y-6">
            <h2 class="text-2xl text-white font-serif italic">Designed for life.</h2>
            <div *ngIf="organization?.contact" class="flex flex-col gap-2 text-sm">
               <a [href]="'mailto:' + organization.contact.email" class="hover:text-white transition-colors">{{ organization.contact.email }}</a>
               <a [href]="'tel:' + organization.contact.phone" class="hover:text-white transition-colors">{{ organization.contact.phone }}</a>
            </div>
          </div>

          <div class="md:col-span-2 space-y-6">
            <h4 class="text-xs font-bold text-white uppercase tracking-widest">Explore</h4>
            <ul class="space-y-3 text-sm">
              <li><a href="#" class="hover:text-white transition-colors">Products</a></li>
              <li><a href="#" class="hover:text-white transition-colors">About</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Journal</a></li>
            </ul>
          </div>

          <div class="md:col-span-2 space-y-6">
            <h4 class="text-xs font-bold text-white uppercase tracking-widest">Help</h4>
            <ul class="space-y-3 text-sm">
              <li><a href="#" class="hover:text-white transition-colors">Shipping</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Returns</a></li>
              <li><a href="#" class="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div class="md:col-span-4 bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-4">Stay in loop</h4>
            <div class="flex gap-2">
              <input type="email" placeholder="Email address" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30">
              <button class="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-colors">Join</button>
            </div>
          </div>

        </div>

        <div class="flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-slate-600">
          <p>{{ config?.copyrightText }}</p>
          <p>Designed by Apex</p>
        </div>

      </div>
    </footer>
  `
})
export class FooterSimpleComponent {
  @Input() config: any;
  @Input() organization: any;
}

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-footer-simple',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <footer class="relative bg-[#0f1216] text-slate-400 overflow-hidden font-sans border-t border-white/5 mt-auto">
      
//       <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>
//       <div class="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none"></div>

//       <div class="absolute -bottom-4 left-0 w-full overflow-hidden pointer-events-none select-none opacity-[0.02]">
//         <h1 class="text-[18vw] leading-none font-serif font-black text-center text-white tracking-tighter whitespace-nowrap">
//           {{ organization?.name || 'STORE' }}
//         </h1>
//       </div>

//       <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-12">
        
//         <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-start">
          
//           <div class="space-y-6">
//             <h2 class="text-3xl md:text-4xl font-serif text-white font-medium tracking-tight">
//               Elevate your lifestyle.
//             </h2>
//             <div class="space-y-2">
//               <p class="text-base text-slate-400 font-light leading-relaxed max-w-md">
//                 Experience the best in electronics and modern living. Curated for quality, designed for you.
//               </p>
//               @if (organization?.contact) {
//                 <div class="flex flex-col gap-1 pt-2 text-sm text-slate-500">
//                   <a [href]="'mailto:' + organization.contact.email" class="hover:text-rose-300 transition-colors">
//                     {{ organization.contact.email }}
//                   </a>
//                   <a [href]="'tel:' + organization.contact.phone" class="hover:text-rose-300 transition-colors">
//                     {{ organization.contact.phone }}
//                   </a>
//                 </div>
//               }
//             </div>
//           </div>

//           <div class="w-full max-w-md lg:ml-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
//             <label class="block text-xs font-bold uppercase tracking-[0.2em] text-rose-200/80 mb-4">
//               Join the community
//             </label>
//             <div class="flex flex-col gap-4">
//               <input type="email" 
//                      placeholder="Enter your email address" 
//                      class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400 transition-colors font-light">
//               <button class="w-full bg-white text-slate-900 font-bold uppercase text-xs tracking-widest py-3 rounded-xl hover:bg-rose-50 transition-colors">
//                 Subscribe
//               </button>
//             </div>
//             <p class="text-[10px] text-slate-600 mt-4 text-center">
//               By subscribing, you agree to our Privacy Policy and consent to receive updates.
//             </p>
//           </div>
//         </div>

//         <hr class="border-white/10 mb-16">

//         <div class="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-20">
          
//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Shop</h4>
//             <ul class="space-y-3 text-sm font-medium text-slate-400">
//               <li><a [routerLink]="['/products']" class="hover:text-white hover:translate-x-1 transition-all inline-block">All Products</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">New Arrivals</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Best Sellers</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Accessories</a></li>
//             </ul>
//           </div>

//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Support</h4>
//             <ul class="space-y-3 text-sm font-medium text-slate-400">
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Help Center</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Order Status</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Returns & Warranty</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Contact Us</a></li>
//             </ul>
//           </div>

//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Company</h4>
//             <ul class="space-y-3 text-sm font-medium text-slate-400">
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">About Us</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Careers</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Press</a></li>
//               <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Terms of Service</a></li>
//             </ul>
//           </div>

//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Follow Us</h4>
//             <div class="flex gap-3">
//               <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-300">
//                 <i class="pi pi-instagram text-lg"></i>
//               </a>
//               <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-300">
//                 <i class="pi pi-twitter text-lg"></i>
//               </a>
//               <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-300">
//                 <i class="pi pi-facebook text-lg"></i>
//               </a>
//             </div>
//           </div>
//         </div>

//         <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs font-medium uppercase tracking-widest text-slate-600">
//           <p>{{ config?.copyrightText || '© 2024 ' + (organization?.name || 'Store') + '. All rights reserved.' }}</p>
//           <div class="flex gap-6 mt-4 md:mt-0">
//              <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
//              <a href="#" class="hover:text-white transition-colors">Cookie Policy</a>
//           </div>
//         </div>

//       </div>
//     </footer>
//   `,
//   styles: [`
//     .font-serif { font-family: 'Playfair Display', serif; }
//   `]
// })
// export class FooterSimpleComponent {
//   @Input() config: any;
//   @Input() organization: any;
// }
