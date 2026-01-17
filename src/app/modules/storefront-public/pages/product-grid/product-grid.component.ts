import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../components/product-card/product-card';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss']
})
export class ProductGridComponent {
  // Inputs matching your JSON structure
  @Input() config: any = {}; 
  @Input() products: any[] = [];
  @Input() orgSlug: string = ''; // Needed for router links in card

  @Output() addToCart = new EventEmitter<any>();

  // Compute Grid Columns for Desktop
  // Mobile defaults to 1 or 2 via CSS, Desktop uses config
  get gridStyle(): string {
    const cols = this.config.columns || 3;
    return `repeat(${cols}, 1fr)`;
  }

  handleAddToCart(product: any) {
    this.addToCart.emit(product);
  }
}