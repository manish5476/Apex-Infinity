// src/app/modules/storefront-public/pages/pricing-table/pricing-table.component.ts
import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PricingTableConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-pricing-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="section-root" [ngStyle]="sectionStyle()">
      <div class="container-wrapper">
        
        <div class="header-group" *ngIf="cfg().title">
          <h2 class="section-title animate-in">{{ cfg().title }}</h2>
          <div class="divider-pill animate-in delay-1"></div>
        </div>

        <div class="pricing-grid">
          
          @for (plan of cfg().plans; track $index) {
            <div class="pricing-card animate-in delay-1" 
                 [class.is-popular]="plan.isPopular">
              
              @if (plan.isPopular) {
                <div class="popular-badge">Most Popular</div>
              }

              <div class="card-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                
                <div class="price-box">
                  <span class="price-amount">{{ plan.price }}</span>
                  <span class="price-period">{{ plan.period }}</span>
                </div>
              </div>

              <ul class="features-list">
                @for (feature of parseFeatures(plan.features); track $index) {
                  <li class="feature-item">
                    <i class="pi pi-check-circle check-icon"></i>
                    {{ feature }}
                  </li>
                }
              </ul>

              <a [routerLink]="getLink(plan.ctaLink)" 
                 [attr.href]="isExternal(plan.ctaLink) ? plan.ctaLink : null"
                 [target]="isExternal(plan.ctaLink) ? '_blank' : '_self'"
                 class="cta-btn">
                {{ plan.ctaText || 'Select Plan' }}
              </a>

            </div>
          }

        </div>
      </div>
    </section>
  `,
  styleUrls: ['./pricing-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingTableComponent {
  @Input() set config(v: PricingTableConfig) { this._config.set(v ?? {}); }
  private _config = signal<PricingTableConfig>({});

  readonly cfg = computed(() => ({
    title:           this._config().title           ?? 'Pricing Plans',
    plans:           this._config().plans           ?? [],
    paddingTop:      this._config().paddingTop      ?? 'md',
    paddingBottom:   this._config().paddingBottom   ?? 'md',
    backgroundColor: this._config().backgroundColor ?? 'var(--bg-secondary)',
    themeMode:       this._config().themeMode       ?? 'auto',
  }));

  // Layout Mappers
  readonly paddingMap: Record<string, string> = {
    'none': '0',
    'sm': 'var(--spacing-3xl)', 
    'md': 'var(--spacing-5xl)', 
    'lg': 'var(--spacing-7xl)'
  };

  readonly sectionStyle = computed(() => ({
    'background-color': this.cfg().backgroundColor,
    'padding-top':      this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
    'padding-bottom':   this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
  }));

  parseFeatures(features: string | string[] | undefined): string[] {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return features.split(',').map(s => s.trim());
    return [];
  }

  getLink(url: string | undefined): any[] {
    if (!url) return [];
    if (url.startsWith('http') || url.startsWith('www')) return [];
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : [];
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}