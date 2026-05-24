import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AddItemDto, StorefrontCartService } from './storefront.cart.service';
import { StorefrontSessionService } from './storefront-session.service';

@Injectable({ providedIn: 'root' })
export class StorefrontGuestCartService {
  private readonly cartService = inject(StorefrontCartService);
  private readonly sessionService = inject(StorefrontSessionService);

  readonly cart = this.cartService.cart;
  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly grandTotal = this.cartService.grandTotal;

  load(orgSlug: string): Observable<any> {
    this.sessionService.setStore(orgSlug);
    return this.cartService.getCart(orgSlug);
  }

  add(orgSlug: string, item: AddItemDto): Observable<any> {
    this.sessionService.setStore(orgSlug);
    return this.cartService.addItem(orgSlug, item);
  }

  mergeAfterLogin(orgSlug: string): Observable<any> {
    return this.cartService.mergeCart(orgSlug);
  }
}
