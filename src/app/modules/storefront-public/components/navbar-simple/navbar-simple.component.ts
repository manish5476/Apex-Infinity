import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <div class="flex-shrink-0 flex items-center">
          @if (logo) {
            <img [src]="logo" alt="Store Logo" class="h-8 w-auto">
          } @else {
            <span class="text-xl font-bold text-gray-900">Store</span>
          }
        </div>

        <div class="hidden md:flex space-x-8">
          @for (item of config?.menuItems; track item.url) {
            <a [routerLink]="['/store', orgSlug, item.url.startsWith('/') ? item.url.substring(1) : item.url]"
               [routerLinkActive]="['text-blue-600', 'font-semibold']"
               [routerLinkActiveOptions]="{exact: item.url === '/'}"
               class="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer">
              {{ item.label }}
            </a>
          }
        </div>

        <div class="md:hidden">
          <button class="text-gray-500 hover:text-gray-900">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </nav>
    </header>
  `
})
export class NavbarSimpleComponent {
  @Input() config: any;
  @Input() logo: string | undefined;
  @Input() orgSlug: string = '';
}