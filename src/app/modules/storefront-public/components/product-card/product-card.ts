import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

// Ensure this model path is correct for your project
import { PublicProduct } from '../../../../core/models/storefront.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, TooltipModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Inputs
  @Input({ required: true }) product!: any; // Changed to 'any' temporarily to match your backend data structure, switch back to PublicProduct if strict
  @Input({ required: true }) orgSlug!: string;

  // Outputs
  @Output() addToCart = new EventEmitter<any>();
  @Output() quickView = new EventEmitter<any>();

  // State
  readonly FALLBACK_IMAGE = 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';
  imageError = false;

  /**
   * Smart getter for image source.
   * Returns fallback if the image array is empty OR if the image previously failed to load.
   */
  get displayImage(): string {
    if (this.imageError || !this.product?.images?.length) {
      return this.FALLBACK_IMAGE;
    }
    return this.product.images[0];
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.orgSlug = params.get('orgSlug') || '';
    });
  }

  onImageError() {
    this.imageError = true;
  }

  onAddToCart(event: Event) {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onQuickView(event: Event) {
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  viewDetails() {
    if (!this.orgSlug || !this.product?.slug) {
      console.warn('Cannot navigate: Missing orgSlug or product slug', { org: this.orgSlug, slug: this.product?.slug });
      return;
    }
    this.router.navigate(['/store', this.orgSlug, 'products', this.product.slug]);
  }
}
