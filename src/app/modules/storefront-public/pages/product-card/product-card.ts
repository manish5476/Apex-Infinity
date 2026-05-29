import {
  Component, input, output, signal, computed, inject,
  ChangeDetectionStrategy, ViewEncapsulation
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { PublicProduct } from '@core/models/storefront.model';
import { StorefrontCustomerFacade } from '../../../../storefront/core/facades/storefront-customer.facade';
import { bodyStyle, headingStyle, normalizeDesign, normalizeTypography } from '../../dynamic-page/section-config.utils';

type TagSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule, ButtonModule, TagModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (layout() === 'grid') {
      <article class="pc" [class.pc--unavailable]="!stockInfo().isAvailable"
               (click)="goToFullDetails()" (keydown.enter)="goToFullDetails()" tabindex="0" role="button"
               [attr.aria-label]="'View ' + product().name"
               [ngStyle]="cardStyle()">

        <div class="pc__img-shell" [ngStyle]="imageShellStyle()">
          <img [src]="displayImage()" [alt]="product().name" (error)="onImageError()" loading="lazy" class="pc__img" />

          <div class="pc__badges">
            @if (discountPercent() > 0) {
              <span class="pc__badge pc__badge--sale" [ngStyle]="badgeStyle()">−{{ discountPercent() }}%</span>
            }
            @if (!stockInfo().isAvailable) {
              <span class="pc__badge pc__badge--out">Sold Out</span>
            } @else if (stockInfo().qty > 0 && stockInfo().qty < 5) {
              <span class="pc__badge pc__badge--low">{{ stockInfo().qty }} left</span>
            }
          </div>

          <button class="pc__heart" (click)="handleWishlistToggle($event)"
                  [class.pc__heart--active]="isWishlisted()"
                  aria-label="Toggle wishlist" type="button">
            <i [class]="isWishlisted() ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
          </button>

          <button class="pc__qv-pill" (click)="openQuickView($event)" aria-label="Quick view" type="button" [ngStyle]="headingStyle()">
            <i class="pi pi-eye"></i>
            <span>Quick View</span>
          </button>
        </div>

        <div class="pc__body">
          <span class="pc__eyebrow" [ngStyle]="{'font-family': config()?.typography?.bodyFont || 'var(--font-mono)'}">
            {{ product().brand || product().category || 'Collection' }}
          </span>
          <h3 class="pc__name" [ngStyle]="headingStyle()">{{ product().name }}</h3>

          <div class="pc__footer">
            <div class="pc__pricing">
              <span class="pc__price" [ngStyle]="headingStyle()">
                {{ priceDisplay().current | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
              </span>
              @if (priceDisplay().hasDiscount) {
                <span class="pc__price-old" [ngStyle]="bodyStyle()">
                  {{ priceDisplay().original | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
                </span>
              }
            </div>

            @if (stockInfo().isAvailable) {
              <button class="pc__atc" (click)="handleAddToCart($event)" type="button" aria-label="Add to cart" [ngStyle]="buttonStyle()">
                <i class="pi pi-shopping-bag"></i>
              </button>
            } @else {
              <button class="pc__atc pc__atc--disabled" disabled type="button">
                <i class="pi pi-ban"></i>
              </button>
            }
          </div>
        </div>
      </article>
    }

    @if (layout() === 'list') {
      <article class="pl" [class.pl--unavailable]="!stockInfo().isAvailable"
               (click)="goToFullDetails()" (keydown.enter)="goToFullDetails()" tabindex="0" role="button"
               [attr.aria-label]="'View ' + product().name"
               [ngStyle]="cardStyle()">

        <div class="pl__img-wrap" [ngStyle]="imageShellStyle('left')">
          <img [src]="displayImage()" [alt]="product().name" (error)="onImageError()" loading="lazy" class="pl__img" />
          @if (discountPercent() > 0) {
            <span class="pl__discount-badge" [ngStyle]="badgeStyle()">−{{ discountPercent() }}%</span>
          }
        </div>

        <div class="pl__info">
          <span class="pl__eyebrow" [ngStyle]="{'font-family': config()?.typography?.bodyFont || 'var(--font-mono)'}">
            {{ product().brand || product().category || 'Collection' }}
          </span>
          <h3 class="pl__name" [ngStyle]="headingStyle()">{{ product().name }}</h3>

          @if ($any(product()).description) {
            <p class="pl__desc" [ngStyle]="bodyStyle()">{{ $any(product()).description }}</p>
          }

          <div class="pl__meta">
            <span class="pl__stock-chip"
                  [class.pl__stock-chip--in]="stockInfo().isAvailable"
                  [class.pl__stock-chip--out]="!stockInfo().isAvailable"
                  [class.pl__stock-chip--low]="stockInfo().isAvailable && stockInfo().qty > 0 && stockInfo().qty < 10"
                  [ngStyle]="bodyStyle()">
              @if (stockInfo().isAvailable && stockInfo().qty > 0 && stockInfo().qty < 10) {
                Low Stock : {{ stockInfo().qty }}
              } @else {
                {{ stockInfo().isAvailable ? 'In Stock' : 'Out of Stock' }}
                @if (stockInfo().isAvailable && stockInfo().qty > 0) {
                  : {{ stockInfo().qty }}
                }
              }
            </span>
          </div>
        </div>

        <div class="pl__actions">
          <div class="pl__pricing">
            <span class="pl__price" [ngStyle]="headingStyle()">
              {{ priceDisplay().current | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
            </span>
            @if (priceDisplay().hasDiscount) {
              <span class="pl__price-old" [ngStyle]="bodyStyle()">
                {{ priceDisplay().original | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
              </span>
            }
          </div>

          <div class="pl__btns">
            <button class="pl__heart" (click)="handleWishlistToggle($event)"
                    [class.pl__heart--active]="isWishlisted()"
                    aria-label="Toggle wishlist" type="button">
              <i [class]="isWishlisted() ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
            </button>

            @if (stockInfo().isAvailable) {
              <button class="pl__atc" (click)="handleAddToCart($event)" type="button" aria-label="Add to cart" [ngStyle]="buttonStyle()">
                <i class="pi pi-shopping-bag"></i>
              </button>
            } @else {
              <button class="pl__atc pl__atc--disabled" disabled type="button">
                <i class="pi pi-ban"></i>
              </button>
            }
          </div>
        </div>
      </article>
    }

    <p-dialog appendTo="body" [visible]="showModal()" (visibleChange)="showModal.set($event)" [modal]="true"
      [dismissableMask]="true" [showHeader]="false" styleClass="pc-dialog"
      [style]="{ width: '92vw', maxWidth: '1040px', padding: '0', borderRadius: '28px', overflow: 'hidden' }">

      <div class="pc-qv" [ngStyle]="{'background-color': config()?.design?.customBackground || 'var(--bg-secondary)'}">
        <button class="pc-qv__close" (click)="closeQuickView($event)" aria-label="Close">
          <i class="pi pi-times"></i>
        </button>

        <div class="pc-qv__gallery">
          <div class="pc-qv__img-wrap">
            <img [src]="displayImage()" [alt]="product().name" class="pc-qv__img" loading="lazy" />
          </div>
          @if (product().images && product().images.length > 1) {
            <div class="pc-qv__thumbs">
              @for (img of product().images.slice(0, 4); track img; let i = $index) {
                <button class="pc-qv__thumb" type="button">
                  <img [src]="img" [alt]="'View ' + (i + 1)" />
                </button>
              }
            </div>
          }
        </div>

        <div class="pc-qv__info">
          <span class="pc-qv__eyebrow" [ngStyle]="bodyStyle()">{{ product().brand || product().category || 'Collection' }}</span>
          <h2 class="pc-qv__title" [ngStyle]="headingStyle()">{{ product().name }}</h2>

          <div class="pc-qv__pricing">
            <span class="pc-qv__price" [ngStyle]="headingStyle()">{{ priceDisplay().current | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}</span>
            @if (priceDisplay().hasDiscount) {
              <span class="pc-qv__price-old" [ngStyle]="bodyStyle()">{{ priceDisplay().original | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}</span>
              <span class="pc__badge pc__badge--sale" [ngStyle]="badgeStyle()">Save {{ discountPercent() }}%</span>
            }
          </div>

          <div class="pc-qv__chips">
            <span class="pc-qv__chip" [class.pc-qv__chip--green]="stockInfo().isAvailable" [class.pc-qv__chip--red]="!stockInfo().isAvailable">
              {{ stockInfo().label }}
            </span>
            @if ($any(product()).rating) {
              <span class="pc-qv__chip pc-qv__chip--amber">
                <i class="pi pi-star-fill"></i> {{ $any(product()).rating }}
              </span>
            }
          </div>

          <hr class="pc-qv__divider" />

          <div class="pc-qv__desc">
            @if ($any(product()).description) {
              <p [ngStyle]="bodyStyle()">{{ $any(product()).description }}</p>
            } @else {
              <p class="muted" [ngStyle]="bodyStyle()">Full specifications available on the product details page.</p>
            }
          </div>

          <div class="pc-qv__actions">
            <button class="pc-qv__atc" (click)="handleAddToCart($event)" [disabled]="!stockInfo().isAvailable" type="button" [ngStyle]="buttonStyle()">
              <i class="pi pi-shopping-bag"></i>
              <span>Add to Cart</span>
            </button>
            <button class="pc-qv__detail" (click)="goToFullDetails()" type="button" [ngStyle]="headingStyle()">
              <span>View Details</span>
              <i class="pi pi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
      --ease-silk: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
      -webkit-font-smoothing: antialiased;
    }

    /* ════════════════════════════════════════════
       GRID CARD
    ═══════════════════════════════════════════ */
    .pc {
      position: relative; display: flex; flex-direction: column;
      border-radius: var(--ui-border-radius-xl, 20px); overflow: hidden; cursor: pointer; outline: none;
      background: var(--bg-secondary); border: 1px solid var(--border-secondary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.35s var(--ease-silk), box-shadow 0.35s var(--ease-silk), border-color 0.35s var(--ease-silk);
      will-change: transform;
    }

    .pc:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent);
      border-color: color-mix(in srgb, var(--color-primary) 40%, var(--border-secondary));
    }

    .pc--unavailable { opacity: 0.6; }

    .pc__img-shell {
      position: relative; width: 100%; aspect-ratio: 4 / 3;
      background: color-mix(in srgb, var(--bg-primary) 60%, var(--bg-secondary));
      overflow: hidden;
      border-top-left-radius: inherit; border-top-right-radius: inherit;
    }

    .pc__img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s var(--ease-silk); }
    .pc:hover .pc__img { transform: scale(1.06); }

    .pc__badges { position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 5px; z-index: 2; }
    .pc__badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 100px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; backdrop-filter: blur(10px); }
    .pc__badge--sale { background: color-mix(in srgb, var(--color-primary) 18%, transparent); color: var(--color-primary); border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent); }
    .pc__badge--out { background: rgba(220,38,38,0.15); color: var(--color-error); border: 1px solid rgba(220,38,38,0.3); }
    .pc__badge--low { background: rgba(234,179,8,0.15); color: #854d0e; border: 1px solid rgba(234,179,8,0.3); }

    .pc__heart {
      position: absolute; top: 12px; right: 12px; z-index: 3; width: 34px; height: 34px; border-radius: 50%;
      background: color-mix(in srgb, var(--bg-secondary) 75%, transparent); backdrop-filter: blur(12px);
      border: 1px solid var(--border-secondary); color: var(--text-secondary); display: grid; place-items: center;
      cursor: pointer; transition: all 0.25s var(--ease-spring); opacity: 0; transform: scale(0.8);
    }
    .pc:hover .pc__heart { opacity: 1; transform: scale(1); }
    .pc__heart--active, .pc:hover .pc__heart--active { opacity: 1; transform: scale(1); background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.35); color: var(--color-error); }
    .pc__heart:hover { transform: scale(1.15) !important; background: rgba(239,68,68,0.2) !important; color: var(--color-error) !important; border-color: rgba(239,68,68,0.4) !important; }

    .pc__qv-pill {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%) translateY(8px);
      display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 100px;
      background: color-mix(in srgb, var(--bg-secondary) 88%, transparent); backdrop-filter: blur(14px);
      border: 1px solid var(--border-secondary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em;
      cursor: pointer; opacity: 0; white-space: nowrap; transition: all 0.3s var(--ease-silk);
    }
    .pc:hover .pc__qv-pill { opacity: 1; transform: translateX(-50%) translateY(0); }

    .pc__body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .pc__eyebrow { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); }
    .pc__name { font-size: 0.92rem; font-weight: 600; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .pc__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
    .pc__pricing { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
    .pc__price { font-size: 1.08rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .pc__price-old { font-size: 0.8rem; text-decoration: line-through; }

    .pc__atc {
      flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; border: none;
      background: var(--color-primary); color: var(--bg-primary); display: grid; place-items: center;
      font-size: 0.95rem; cursor: pointer; transition: all 0.25s var(--ease-spring);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
    }
    .pc__atc:hover { transform: scale(1.15); box-shadow: 0 6px 18px color-mix(in srgb, var(--color-primary) 55%, transparent); }
    .pc__atc--disabled { background: var(--component-bg-hover); color: var(--text-secondary); cursor: not-allowed; box-shadow: none; }

    /* ════════════════════════════════════════════
       LIST ROW
    ═══════════════════════════════════════════ */
    .pl {
      display: flex; align-items: stretch; gap: 0; border-radius: var(--ui-border-radius-lg, 18px); overflow: hidden;
      cursor: pointer; outline: none; background: var(--bg-secondary); border: 1px solid var(--border-secondary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.28s var(--ease-silk), box-shadow 0.28s var(--ease-silk), border-color 0.28s var(--ease-silk);
      will-change: transform; min-height: 96px;
    }
    .pl:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px color-mix(in srgb, var(--color-primary) 25%, transparent); border-color: color-mix(in srgb, var(--color-primary) 35%, var(--border-secondary)); }

    .pl__img-wrap { position: relative; flex-shrink: 0; width: 110px; align-self: stretch; background: color-mix(in srgb, var(--bg-primary) 55%, var(--bg-secondary)); overflow: hidden; border-radius: inherit; border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .pl__img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.45s var(--ease-silk); }
    .pl:hover .pl__img { transform: scale(1.07); }

    .pl__discount-badge { position: absolute; top: 8px; left: 8px; padding: 2px 8px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; backdrop-filter: blur(8px); background: color-mix(in srgb, var(--color-primary) 18%, transparent); color: var(--color-primary); border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent); }

    .pl__info { flex: 1 1 auto; min-width: 0; padding: 14px 16px 14px 14px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
    .pl__eyebrow { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1; }
    .pl__name { font-size: 0.93rem; font-weight: 700; margin: 0; line-height: 1.35; white-space: normal; }
    .pl__desc { font-size: 0.78rem; margin: 2px 0 0 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .pl__meta { margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .pl__stock-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; border: 1px solid; }
    .pl__stock-chip--in { background: rgba(21,128,61,0.08); color: var(--color-success); border-color: rgba(21,128,61,0.22); }
    .pl__stock-chip--out { background: rgba(220,38,38,0.08); color: var(--color-error); border-color: rgba(220,38,38,0.22); }
    .pl__stock-chip--low { background: rgba(234,179,8,0.1); color: #92400e; border-color: rgba(234,179,8,0.28); }

    .pl__actions { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 10px; padding: 14px 16px; border-left: 1px solid var(--border-secondary); min-width: 100px; }
    .pl__pricing { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .pl__price { font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pl__price-old { font-size: 0.75rem; text-decoration: line-through; white-space: nowrap; }

    .pl__btns { display: flex; align-items: center; gap: 6px; }
    .pl__heart { width: 32px; height: 32px; border-radius: 50%; background: transparent; border: 1px solid var(--border-secondary); color: var(--text-secondary); display: grid; place-items: center; cursor: pointer; font-size: 0.85rem; transition: all 0.22s var(--ease-spring); }
    .pl__heart:hover, .pl__heart--active { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: var(--color-error); }

    .pl__atc { width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--color-primary); color: var(--bg-primary); display: grid; place-items: center; font-size: 0.9rem; cursor: pointer; transition: all 0.22s var(--ease-spring); box-shadow: 0 3px 10px color-mix(in srgb, var(--color-primary) 38%, transparent); }
    .pl__atc:hover { transform: scale(1.12); box-shadow: 0 5px 16px color-mix(in srgb, var(--color-primary) 50%, transparent); }
    .pl__atc--disabled { background: var(--component-bg-hover); color: var(--text-secondary); cursor: not-allowed; box-shadow: none; }

    /* ════════════════════════════════════════════
       QUICK VIEW DIALOG
    ═══════════════════════════════════════════ */
    .pc-dialog .p-dialog-content { padding: 0 !important; background: var(--bg-secondary) !important; border-radius: 28px !important; }

    .pc-qv { display: grid; grid-template-columns: 1fr; position: relative; background: var(--bg-secondary); }
    @media(min-width: 768px) { .pc-qv { grid-template-columns: 1fr 1fr; min-height: 520px; } }

    .pc-qv__close { position: absolute; top: 16px; right: 16px; z-index: 20; width: 40px; height: 40px; border-radius: 50%; background: color-mix(in srgb, var(--bg-secondary) 90%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--border-secondary); color: var(--text-primary); cursor: pointer; display: grid; place-items: center; transition: all 0.2s; }
    .pc-qv__close:hover { background: var(--component-bg-hover); }

    .pc-qv__gallery { background: color-mix(in srgb, var(--bg-primary) 60%, var(--bg-secondary)); padding: 2.5rem 2rem; display: flex; flex-direction: column; gap: 16px; border-radius: 28px 0 0 28px; }
    .pc-qv__img-wrap { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 280px; }
    .pc-qv__img { max-width: 100%; max-height: 380px; object-fit: contain; }

    .pc-qv__thumbs { display: flex; gap: 10px; justify-content: center; }
    .pc-qv__thumb { width: 60px; height: 60px; border-radius: 12px; border: 1px solid var(--border-secondary); background: var(--bg-secondary); padding: 4px; cursor: pointer; transition: border-color 0.2s; }
    .pc-qv__thumb:hover { border-color: var(--color-primary); }
    .pc-qv__thumb img { width: 100%; height: 100%; object-fit: contain; }

    .pc-qv__info { padding: 2.5rem 2.25rem; display: flex; flex-direction: column; }
    .pc-qv__eyebrow { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 8px; display: block; }
    .pc-qv__title { font-size: 1.85rem; font-weight: 600; margin: 0 0 1.2rem 0; line-height: 1.15; letter-spacing: -0.01em; }
    
    .pc-qv__pricing { display: flex; align-items: baseline; gap: 10px; margin-bottom: 1.2rem; flex-wrap: wrap; }
    .pc-qv__price { font-size: 2rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .pc-qv__price-old { font-size: 1.1rem; text-decoration: line-through; }

    .pc-qv__chips { display: flex; gap: 8px; margin-bottom: 1.2rem; flex-wrap: wrap; }
    .pc-qv__chip { padding: 4px 13px; border-radius: 100px; font-size: 0.78rem; font-weight: 700; border: 1px solid var(--border-secondary); background: var(--component-bg-hover); color: var(--text-secondary); }
    .pc-qv__chip--green { color: var(--color-success); background: rgba(21,128,61,0.1); border-color: rgba(21,128,61,0.25); }
    .pc-qv__chip--red   { color: var(--color-error); background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.25); }
    .pc-qv__chip--amber { color: #92400e; background: rgba(234,179,8,0.12); border-color: rgba(234,179,8,0.3); }

    .pc-qv__divider { height: 1px; background: var(--border-secondary); border: none; margin: 0 0 1.2rem 0; }
    .pc-qv__desc { flex: 1; line-height: 1.7; font-size: 0.92rem; margin-bottom: 2rem; }

    .pc-qv__actions { display: flex; gap: 12px; margin-top: auto; }
    .pc-qv__atc { flex: 1; height: 50px; border-radius: 14px; border: none; font-weight: 700; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.25s var(--ease-spring); box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 35%, transparent); }
    .pc-qv__atc:hover:not([disabled]) { transform: translateY(-2px); box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 45%, transparent); }
    .pc-qv__atc[disabled] { background: var(--component-bg-hover) !important; color: var(--text-secondary) !important; cursor: not-allowed; box-shadow: none; }

    .pc-qv__detail { height: 50px; padding: 0 18px; border-radius: 14px; background: transparent; border: 1.5px solid var(--border-secondary); font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
    .pc-qv__detail:hover { border-color: var(--color-primary); color: var(--color-primary) !important; }
  `]
})
export class ProductCardComponent {
  private readonly router = inject(Router);
  private readonly customerFacade = inject(StorefrontCustomerFacade);

  readonly product = input.required<PublicProduct>();
  readonly orgSlug = input<string>('');
  readonly layout = input<'grid' | 'list'>('grid');
  readonly config = input<any>({}); // Upgraded: Receives design & typography from parent section

  readonly addToCart = output<PublicProduct>();

  readonly showModal = signal(false);
  readonly imageError = signal(false);
  readonly normalizedTypography = computed(() => normalizeTypography(this.config()));
  readonly normalizedDesign = computed(() => normalizeDesign(this.config()));

  // --- Dynamic Style Methods ---
  
  cardStyle() {
    const base: any = {};
    const design = this.normalizedDesign();
    if (design.borderRadius && design.borderRadius !== 'none') {
      base['border-radius'] = `var(--ui-border-radius-${design.borderRadius})`;
    }
    if (design.boxShadow && design.boxShadow !== 'none') {
      base['box-shadow'] = `var(--shadow-${design.boxShadow})`;
    }
    if (design.customBackground) {
      base['background-color'] = design.customBackground;
    }
    return base;
  }

  imageShellStyle(direction: 'top' | 'left' = 'top') {
    if (!this.normalizedDesign().borderRadius || this.normalizedDesign().borderRadius === 'none') return {};
    const radius = `var(--ui-border-radius-${this.normalizedDesign().borderRadius})`;
    
    // We inherit the card's border radius based on grid vs list layout
    if (direction === 'top') {
      return { 'border-top-left-radius': radius, 'border-top-right-radius': radius, 'border-bottom-left-radius': '0', 'border-bottom-right-radius': '0' };
    } else {
      return { 'border-top-left-radius': radius, 'border-bottom-left-radius': radius, 'border-top-right-radius': '0', 'border-bottom-right-radius': '0' };
    }
  }

  headingStyle() {
    return headingStyle(this.config());
  }

  bodyStyle() {
    return bodyStyle(this.config());
  }

  buttonStyle() {
    return {
      'font-family': this.normalizedTypography().headingFont,
      'background-color': this.normalizedTypography().headingColor || 'var(--color-primary)',
      'color': 'var(--bg-primary)'
    };
  }

  badgeStyle() {
    return {
      'font-family': this.normalizedTypography().bodyFont || 'var(--font-mono)',
      'color': this.normalizedTypography().headingColor || 'var(--color-primary)'
    };
  }

  // --- Logic Methods ---

  readonly displayImage = computed(() => {
    const p = this.product();
    if (this.imageError()) return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.image) return p.image;
    return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';
  });

  readonly priceDisplay = computed(() => {
    const p = this.product().price;
    if (!p) return { current: 0, original: 0, currency: 'INR', hasDiscount: false };
    return {
      current: p.current || p.original || 0,
      original: p.original || 0,
      currency: p.currency || 'INR',
      hasDiscount: !!p.hasDiscount
    };
  });

  readonly stockInfo = computed(() => {
    const s = this.product().stock;
    if (!s) return { isAvailable: false, qty: 0, label: 'Out of Stock', severity: 'danger' as TagSeverity };
    const qty = s.quantity || 0;
    const available = s.available || (qty > 0);
    let severity: TagSeverity = 'danger';
    if (available) severity = qty < 10 ? 'warn' : 'success';
    return { isAvailable: available, qty, label: available ? 'In Stock' : 'Out of Stock', severity };
  });

  readonly discountPercent = computed(() => {
    const p = this.product();
    if (p.price?.discountPercentage) return p.price.discountPercentage;
    const pd = this.priceDisplay();
    if (!pd.hasDiscount || !pd.original) return 0;
    return Math.round(((pd.original - pd.current) / pd.original) * 100);
  });

  readonly isWishlisted = computed(() => {
    const productId = (this.product() as any)._id || (this.product() as any).id;
    if (!productId) return false;
    return this.customerFacade.wishlist().some((item: any) => {
      const id = item.productId?._id || item.productId || '';
      return id === productId;
    });
  });

  onImageError() { this.imageError.set(true); }

  openQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal.set(true);
  }

  closeQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal.set(false);
  }

  handleAddToCart(e?: Event) {
    e?.stopPropagation();
    this.addToCart.emit(this.product());
    this.showModal.set(false);
  }

  handleWishlistToggle(e?: Event) {
    e?.stopPropagation();
    const productId = (this.product() as any)._id || (this.product() as any).id;
    const org = this.orgSlug();
    if (!productId || !org) return;
    if (!this.customerFacade.customer()) {
      this.router.navigate(['/store', org, 'login']);
      return;
    }
    this.customerFacade.toggleWishlist(org, productId).subscribe();
  }

  goToFullDetails() {
    this.showModal.set(false);
    const p = this.product();
    const org = this.orgSlug();
    if (p.url) { this.router.navigateByUrl(p.url); return; }
    if (org && p.slug) { this.router.navigate(['/store', org, 'products', p.slug]); }
  }
}
