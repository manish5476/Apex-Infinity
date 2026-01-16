import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        <div class="col-span-1">
          <h2 class="text-2xl font-serif text-white font-bold mb-4">Origin</h2>
          <p class="text-sm leading-relaxed mb-6">
            The all-in-one money management platform designed to help you build wealth.
          </p>
          <div class="flex gap-4">
            <a href="#" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="pi pi-twitter"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="pi pi-instagram"></i></a>
            <a href="#" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="pi pi-linkedin"></i></a>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-6">Product</h4>
          <ul class="space-y-3 text-sm">
            <li><a href="#" class="hover:text-blue-400 transition-colors">Features</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Pricing</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Investments</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Budgeting</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-6">Company</h4>
          <ul class="space-y-3 text-sm">
            <li><a href="#" class="hover:text-blue-400 transition-colors">About Us</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Careers</a> <span class="bg-blue-900 text-blue-200 text-[10px] px-1.5 py-0.5 rounded ml-2">Hiring</span></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Press</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white uppercase tracking-widest mb-6">Legal</h4>
          <ul class="space-y-3 text-sm">
            <li><a href="#" class="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" class="hover:text-blue-400 transition-colors">Security</a></li>
          </ul>
        </div>

      </div>

      <div class="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs">
        <p>{{ config?.copyrightText || '© 2024 Origin Financial Inc. All rights reserved.' }}</p>
        <p class="mt-2 md:mt-0">Made with <i class="pi pi-heart-fill text-red-500 mx-1"></i> for builders.</p>
      </div>
    </footer>
  `
})
export class FooterSimpleComponent {
  @Input() config: any;
}

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-footer-simple',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <footer class="bg-gray-50 border-t border-gray-200 mt-auto">
//       <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
//         <p class="text-center text-base text-gray-400">
//           {{ config?.copyrightText || '© 2024 Storefront' }}
//         </p>
//       </div>
//     </footer>
//   `
// })
// export class FooterSimpleComponent {
//   @Input() config: any;
// }