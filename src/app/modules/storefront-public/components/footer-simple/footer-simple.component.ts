import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-gray-50 border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-base text-gray-400">
          {{ config?.copyrightText || '© 2024 Storefront' }}
        </p>
      </div>
    </footer>
  `
})
export class FooterSimpleComponent {
  @Input() config: any;
}