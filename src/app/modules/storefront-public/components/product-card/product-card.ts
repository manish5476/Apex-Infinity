// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-product-card',
//   imports: [],
//   templateUrl: './product-card.html',
//   styleUrl: './product-card.scss',
// })
// export class ProductCard {

// }
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicProduct } from '../../../../core/models/storefront.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
      
      <div class="aspect-[4/5] bg-gray-50 relative overflow-hidden">
        <img [src]="product.images[0] || 'assets/placeholder-product.png'" 
             [alt]="product.name"
             class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500">
        
        <div class="absolute top-2 left-2 flex flex-col gap-1">
          @if (product.price.hasDiscount) {
            <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </span>
          }
          @if (product.stock.lowStock) {
            <span class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              LOW STOCK
            </span>
          }
        </div>

        <div class="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 justify-center bg-gradient-to-t from-black/50 to-transparent">
          <button (click)="addToCart.emit(product)" 
                  class="bg-white text-gray-900 p-2 rounded-full hover:bg-primary-500 hover:text-white transition-colors"
                  title="Add to Cart">
            <i class="fas fa-shopping-cart"></i>
          </button>
          <button (click)="quickView.emit(product)" 
                  class="bg-white text-gray-900 p-2 rounded-full hover:bg-primary-500 hover:text-white transition-colors"
                  title="Quick View">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <div class="p-4">
        <p class="text-xs text-gray-500 mb-1 uppercase tracking-wide">{{ product.category }}</p>
        <h3 class="font-medium text-gray-900 mb-2 truncate">
          <a [routerLink]="product.url" class="hover:text-primary-600 transition-colors">
            {{ product.name }}
          </a>
        </h3>
        
        <div class="flex items-baseline gap-2">
          @if (product.price.hasDiscount) {
            <span class="text-lg font-bold text-red-600">{{ product.price.formattedDiscounted }}</span>
            <span class="text-sm text-gray-400 line-through">{{ product.price.formattedOriginal }}</span>
          } @else {
            <span class="text-lg font-bold text-gray-900">{{ product.price.formattedOriginal }}</span>
          }
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: PublicProduct;
  @Output() addToCart = new EventEmitter<PublicProduct>();
  @Output() quickView = new EventEmitter<PublicProduct>();
}