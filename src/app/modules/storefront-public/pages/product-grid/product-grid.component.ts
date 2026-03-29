// src/app/modules/storefront-public/pages/product-grid/product-grid.component.ts
import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductGridConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGridComponent {
  
  @Input() set config(v: ProductGridConfig) { this._config.set(v ?? {}); }
  private _config = signal<ProductGridConfig>({});

  @Input() products: any[] = [];
  @Input() orgSlug: string = '';

  @Output() addToCart = new EventEmitter<any>();

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Shop All',
    columns:       this._config().columns       ?? 4,
    gap:           this._config().gap           ?? 'md',
    pagination:    this._config().pagination    ?? false,
    paddingTop:    this._config().paddingTop    ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly paddingMap: Record<string, string> = {
    none: '0',
    sm: 'var(--spacing-3xl)',
    md: 'var(--spacing-5xl)',
    lg: 'calc(var(--spacing-5xl) * 1.5)',
    xl: 'calc(var(--spacing-5xl) * 2)'
  };

  readonly sectionStyle = computed(() => ({
    'padding-top':    this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
    'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md'],
    'background-color': this.cfg().backgroundColor || ''
  }));

  handleAddToCart(product: any) {
    this.addToCart.emit(product);
  }
}