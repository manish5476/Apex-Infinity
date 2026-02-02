import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-footer-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer-simple.component.html',
  styleUrls: ['./footer-simple.component.scss']
})
export class FooterSimpleComponent implements OnInit {
  @Input() config: any;
  @Input() organization: any;
  
  // We need the slug for the links to work
  orgSlug: string = '';
  private router = inject(Router);

  ngOnInit() {
    // Basic extraction of slug so links like "Shop" work
    const match = this.router.url.match(/\/store\/([^\/]+)/);
    if (match && match[1]) {
      this.orgSlug = match[1];
    }
  }
}

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-footer-simple',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <footer class="relative bg-[#0f1216] text-slate-400 font-sans pt-10 pb-12">
      
//       <div class="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-[98%] z-0">
//         <svg class="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
//             <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
//                   fill="#0f1216"></path>
//         </svg>
//       </div>

//       <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        
//         <div class="mb-20 text-center opacity-10 select-none pointer-events-none">
//            <h1 class="text-[15vw] leading-[0.8] font-serif font-black text-white tracking-tighter">
//              {{ organization?.name || 'STORE' }}
//            </h1>
//         </div>

//         <div class="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/5 pb-16 mb-12">
          
//           <div class="md:col-span-4 space-y-6">
//             <h2 class="text-2xl text-white font-serif italic">Designed for life.</h2>
//             <div *ngIf="organization?.contact" class="flex flex-col gap-2 text-sm">
//                <a [href]="'mailto:' + organization.contact.email" class="hover:text-white transition-colors">{{ organization.contact.email }}</a>
//                <a [href]="'tel:' + organization.contact.phone" class="hover:text-white transition-colors">{{ organization.contact.phone }}</a>
//             </div>
//           </div>

//           <div class="md:col-span-2 space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-widest">Explore</h4>
//             <ul class="space-y-3 text-sm">
//               <li><a href="#" class="hover:text-white transition-colors">Products</a></li>
//               <li><a href="#" class="hover:text-white transition-colors">About</a></li>
//               <li><a href="#" class="hover:text-white transition-colors">Journal</a></li>
//             </ul>
//           </div>

//           <div class="md:col-span-2 space-y-6">
//             <h4 class="text-xs font-bold text-white uppercase tracking-widest">Help</h4>
//             <ul class="space-y-3 text-sm">
//               <li><a href="#" class="hover:text-white transition-colors">Shipping</a></li>
//               <li><a href="#" class="hover:text-white transition-colors">Returns</a></li>
//               <li><a href="#" class="hover:text-white transition-colors">FAQ</a></li>
//             </ul>
//           </div>

//           <div class="md:col-span-4 bg-white/5 rounded-2xl p-6 border border-white/10">
//             <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-4">Stay in loop</h4>
//             <div class="flex gap-2">
//               <input type="email" placeholder="Email address" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30">
//               <button class="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-colors">Join</button>
//             </div>
//           </div>

//         </div>

//         <div class="flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-slate-600">
//           <p>{{ config?.copyrightText }}</p>
//           <p>Designed by Apex</p>
//         </div>

//       </div>
//     </footer>
//   `
// })
// export class FooterSimpleComponent {
//   @Input() config: any;
//   @Input() organization: any;
// }
