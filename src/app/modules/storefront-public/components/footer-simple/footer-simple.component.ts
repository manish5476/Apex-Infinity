import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="relative bg-[#0f1216] text-slate-400 overflow-hidden font-sans border-t border-white/5 mt-auto">
      
      <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="absolute -bottom-4 left-0 w-full overflow-hidden pointer-events-none select-none opacity-[0.02]">
        <h1 class="text-[18vw] leading-none font-serif font-black text-center text-white tracking-tighter whitespace-nowrap">
          {{ organization?.name || 'STORE' }}
        </h1>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-12">
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-start">
          
          <div class="space-y-6">
            <h2 class="text-3xl md:text-4xl font-serif text-white font-medium tracking-tight">
              Elevate your lifestyle.
            </h2>
            <div class="space-y-2">
              <p class="text-base text-slate-400 font-light leading-relaxed max-w-md">
                Experience the best in electronics and modern living. Curated for quality, designed for you.
              </p>
              @if (organization?.contact) {
                <div class="flex flex-col gap-1 pt-2 text-sm text-slate-500">
                  <a [href]="'mailto:' + organization.contact.email" class="hover:text-rose-300 transition-colors">
                    {{ organization.contact.email }}
                  </a>
                  <a [href]="'tel:' + organization.contact.phone" class="hover:text-rose-300 transition-colors">
                    {{ organization.contact.phone }}
                  </a>
                </div>
              }
            </div>
          </div>

          <div class="w-full max-w-md lg:ml-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <label class="block text-xs font-bold uppercase tracking-[0.2em] text-rose-200/80 mb-4">
              Join the community
            </label>
            <div class="flex flex-col gap-4">
              <input type="email" 
                     placeholder="Enter your email address" 
                     class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400 transition-colors font-light">
              <button class="w-full bg-white text-slate-900 font-bold uppercase text-xs tracking-widest py-3 rounded-xl hover:bg-rose-50 transition-colors">
                Subscribe
              </button>
            </div>
            <p class="text-[10px] text-slate-600 mt-4 text-center">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>

        <hr class="border-white/10 mb-16">

        <div class="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-20">
          
          <div class="space-y-6">
            <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Shop</h4>
            <ul class="space-y-3 text-sm font-medium text-slate-400">
              <li><a [routerLink]="['/products']" class="hover:text-white hover:translate-x-1 transition-all inline-block">All Products</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">New Arrivals</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Best Sellers</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Accessories</a></li>
            </ul>
          </div>

          <div class="space-y-6">
            <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Support</h4>
            <ul class="space-y-3 text-sm font-medium text-slate-400">
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Help Center</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Order Status</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Returns & Warranty</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Contact Us</a></li>
            </ul>
          </div>

          <div class="space-y-6">
            <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Company</h4>
            <ul class="space-y-3 text-sm font-medium text-slate-400">
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">About Us</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Careers</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Press</a></li>
              <li><a href="#" class="hover:text-white hover:translate-x-1 transition-all inline-block">Terms of Service</a></li>
            </ul>
          </div>

          <div class="space-y-6">
            <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Follow Us</h4>
            <div class="flex gap-3">
              <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-300">
                <i class="pi pi-instagram text-lg"></i>
              </a>
              <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-300">
                <i class="pi pi-twitter text-lg"></i>
              </a>
              <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-300">
                <i class="pi pi-facebook text-lg"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs font-medium uppercase tracking-widest text-slate-600">
          <p>{{ config?.copyrightText || '© 2024 ' + (organization?.name || 'Store') + '. All rights reserved.' }}</p>
          <div class="flex gap-6 mt-4 md:mt-0">
             <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" class="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>

      </div>
    </footer>
  `,
  styles: [`
    .font-serif { font-family: 'Playfair Display', serif; }
  `]
})
export class FooterSimpleComponent {
  @Input() config: any;
  @Input() organization: any;
}

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-footer-simple',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <footer class="relative bg-[#0f1216] text-slate-400 overflow-hidden font-sans border-t border-white/5">
      
//       <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>
//       <div class="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none"></div>

//       <div class="absolute -bottom-10 left-0 w-full overflow-hidden pointer-events-none select-none opacity-[0.03]">
//         <h1 class="text-[15vw] leading-none font-serif font-black text-center text-white tracking-tighter">
//           {{ organization?.name || 'ORIGIN' }}
//         </h1>
//       </div>

//       <div class="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-12">
        
//         <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-end">
          
//           <div>
//             <h2 class="text-4xl md:text-5xl font-serif text-white font-medium mb-6 tracking-tight">
//               Build your legacy.
//             </h2>
//             <p class="text-lg text-slate-400 max-w-md font-light leading-relaxed">
//               The all-in-one platform designed for the modern builder. Create, manage, and scale with tools built for perfection.
//             </p>
//           </div>

//           <div class="w-full max-w-md lg:ml-auto">
//             <label class="block text-xs font-bold uppercase tracking-[0.2em] text-rose-200/80 mb-4">
//               Stay in the loop
//             </label>
//             <div class="flex group">
//               <input type="email" 
//                      placeholder="Enter your email" 
//                      class="w-full bg-white/5 border-b border-white/20 px-0 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-rose-400 transition-colors font-serif text-lg">
//               <button class="border-b border-white/20 py-4 px-4 text-white/50 group-hover:text-rose-400 group-hover:border-rose-400 transition-all uppercase text-xs font-bold tracking-widest">
//                 Join
//               </button>
//             </div>
//           </div>
//         </div>

//         <hr class="border-white/10 mb-20">

//         <div class="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 mb-24">
          
//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Product</h4>
//             <ul class="space-y-4 text-sm font-medium">
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Features</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Pricing</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Integrations</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Changelog</a></li>
//             </ul>
//           </div>

//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Company</h4>
//             <ul class="space-y-4 text-sm font-medium">
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">About</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Careers</a> <span class="text-[9px] border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded-full ml-1">Hiring</span></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Press Kit</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Contact</a></li>
//             </ul>
//           </div>

//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Resources</h4>
//             <ul class="space-y-4 text-sm font-medium">
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Community</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Help Center</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">API Docs</a></li>
//               <li><a href="#" class="hover:text-rose-300 hover:translate-x-1 transition-all inline-block">Status</a></li>
//             </ul>
//           </div>

//           <div class="space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Social</h4>
//             <div class="flex gap-4">
//               <a href="#" class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all duration-300 group">
//                 <i class="pi pi-twitter group-hover:scale-110 transition-transform"></i>
//               </a>
//               <a href="#" class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-pink-600 hover:border-pink-600 transition-all duration-300 group">
//                 <i class="pi pi-instagram group-hover:scale-110 transition-transform"></i>
//               </a>
//               <a href="#" class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 group">
//                 <i class="pi pi-linkedin group-hover:scale-110 transition-transform"></i>
//               </a>
//             </div>
//           </div>
//         </div>

//         <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs font-medium uppercase tracking-widest text-slate-500">
//           <div class="flex gap-6 mb-4 md:mb-0">
//              <a href="#" class="hover:text-white transition-colors">Privacy</a>
//              <a href="#" class="hover:text-white transition-colors">Terms</a>
//              <a href="#" class="hover:text-white transition-colors">Cookies</a>
//           </div>
//           <p>{{ config?.copyrightText || '© 2024 Origin Inc.' }}</p>
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

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-footer-simple',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <footer class="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
//       <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
//         <div class="col-span-1">
//           <h2 class="text-2xl font-serif text-white font-bold mb-4">Origin</h2>
//           <p class="text-sm leading-relaxed mb-6">
//             The all-in-one money management platform designed to help you build wealth.
//           </p>
//           <div class="flex gap-4">
//             <a href="#" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="pi pi-twitter"></i></a>
//             <a href="#" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="pi pi-instagram"></i></a>
//             <a href="#" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="pi pi-linkedin"></i></a>
//           </div>
//         </div>

//         <div>
//           <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-6">Product</h4>
//           <ul class="space-y-3 text-sm">
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Features</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Pricing</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Investments</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Budgeting</a></li>
//           </ul>
//         </div>

//         <div>
//           <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-6">Company</h4>
//           <ul class="space-y-3 text-sm">
//             <li><a href="#" class="hover:text-blue-400 transition-colors">About Us</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Careers</a> <span class="bg-blue-900 text-blue-200 text-[10px] px-1.5 py-0.5 rounded ml-2">Hiring</span></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Press</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Contact</a></li>
//           </ul>
//         </div>

//         <div>
//           <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-6">Legal</h4>
//           <ul class="space-y-3 text-sm">
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Terms of Service</a></li>
//             <li><a href="#" class="hover:text-blue-400 transition-colors">Security</a></li>
//           </ul>
//         </div>

//       </div>

//       <div class="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs">
//         <p>{{ config?.copyrightText || '© 2024 Origin Financial Inc. All rights reserved.' }}</p>
//         <p class="mt-2 md:mt-0">Made with <i class="pi pi-heart-fill text-red-500 mx-1"></i> for builders.</p>
//       </div>
//     </footer>
//   `
// })
// export class FooterSimpleComponent {
//   @Input() config: any;
// }

// // import { Component, Input } from '@angular/core';
// // import { CommonModule } from '@angular/common';

// // @Component({
// //   selector: 'app-footer-simple',
// //   standalone: true,
// //   imports: [CommonModule],
// //   template: `
// //     <footer class="bg-gray-50 border-t border-gray-200 mt-auto">
// //       <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
// //         <p class="text-center text-base text-gray-400">
// //           {{ config?.copyrightText || '© 2024 Storefront' }}
// //         </p>
// //       </div>
// //     </footer>
// //   `
// // })
// // export class FooterSimpleComponent {
// //   @Input() config: any;
// // }