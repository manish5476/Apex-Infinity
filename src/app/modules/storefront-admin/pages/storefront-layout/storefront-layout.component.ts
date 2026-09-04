import { Component, OnInit, inject, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { OrganizationService } from '../../../../modules/organization/organization.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PageReference {
  _id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  pageType: string;
}

interface StorefrontTheme {
  id: string;
  name: string;
  description?: string;
  color: string;
  gradient?: string;
}

export type LayoutTab = 'header' | 'footer' | 'branding';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './storefront-layout.component.html',
  styleUrls: ['./storefront-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontLayoutComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  private readonly orgService = inject(OrganizationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<LayoutTab>('header');

  // Raw API state
  private rawLayout: any = null;
  readonly pages = signal<PageReference[]>([]);
  readonly themes = signal<StorefrontTheme[]>([]);

  // Platform Delivery
  platformDeliveryEnabled = false;

  // UI Suggestion State
  readonly activeSuggestionIndex = signal<string | null>(null);
  readonly filteredPages = signal<PageReference[]>([]);

  // Editable Layout State
  headerLinks: Array<{ label: string; url: string }> = [];
  footerLinks: Array<{ label: string; url: string }> = [];
  footerCopyright = '';
  colors = { primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' };
  commerce: any = { currency: 'INR', allowGuestCheckout: true, minOrderAmount: 0, catalogMode: false };
  shopName = 'My Store';

  ngOnInit() {
    this.fetchCoreData();
  }

  // Close suggestions when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.suggestion-container')) {
      this.activeSuggestionIndex.set(null);
    }
  }

  fetchCoreData() {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      layoutRes: this.adminService.getLayout(),
      pagesRes: this.adminService.getPages(),
      themesRes: this.adminService.getAvailableThemes().pipe(
        catchError(() => of({ data: { themes: [] } }))
      ),
      orgRes: this.orgService.getMyOrganization().pipe(
        catchError(() => of({ data: null }))
      )
    }).subscribe({
      next: ({ layoutRes, pagesRes, themesRes, orgRes }) => {
        // 1. Map Themes
        const themeList = (themesRes as any)?.data?.themes || [];
        this.themes.set(themeList);

        // 2. Map Pages
        const pageData = (pagesRes as any)?.data ?? [];
        this.pages.set(pageData);
        this.filteredPages.set(pageData);

        // 3. Map Layout Configuration
        const layout = (layoutRes as any)?.data ?? layoutRes;
        this.rawLayout = layout;

        try {
          const navConfig = layout?.header?.[0]?.config;
          if (navConfig && navConfig.links) {
            this.headerLinks = JSON.parse(JSON.stringify(navConfig.links));
          }
        } catch (e) {
          console.error('Failed to parse header links:', e);
        }

        try {
          const footConfig = layout?.footer?.[0]?.config;
          if (footConfig) {
            this.footerCopyright = footConfig.copyright || '';
            if (footConfig.columns && footConfig.columns[0]?.links) {
              this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
            }
          }
        } catch (e) {
          console.error('Failed to parse footer links:', e);
        }

        try {
          if (layout?.globalSettings?.colors) {
            this.colors = { ...this.colors, ...layout.globalSettings.colors };
          }
          if (layout?.globalSettings?.commerce) {
            this.commerce = { ...this.commerce, ...layout.globalSettings.commerce };
          }
          if (layout?.globalSettings?.shopName) {
            this.shopName = layout.globalSettings.shopName;
          }
        } catch (e) {
          console.error('Failed to parse global settings:', e);
        }

        const org = (orgRes as any)?.data;
        if (org && org.platformDelivery) {
          this.platformDeliveryEnabled = org.platformDelivery.enabled || false;
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Storefront layout fetch failed:', err);
        this.error.set('Failed to load storefront layout settings. Please try again.');
        this.loading.set(false);
      }
    });
  }

  // Theme Marketplace Handlers
  applyThemeLocally(theme: StorefrontTheme) {
    this.colors.primary = theme.color;
    this.colors.accent = theme.color;
  }

  // Suggestion & Link Handlers
  filterPages(searchTerm: string) {
    const term = (searchTerm || '').toLowerCase().replace('/', '');
    if (!term) {
      this.filteredPages.set(this.pages());
      return;
    }
    const filtered = this.pages().filter(p =>
      p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
    );
    this.filteredPages.set(filtered);
  }

  selectSuggestion(page: PageReference, linkObj: any) {
    if (!linkObj.label || linkObj.label === 'New Link' || linkObj.label === 'Display Label') {
      linkObj.label = page.name;
    }
    linkObj.url = '/' + page.slug;
    this.activeSuggestionIndex.set(null);
  }

  addHeaderLink() {
    this.headerLinks.push({ label: '', url: '/' });
  }

  removeHeaderLink(index: number) {
    this.headerLinks.splice(index, 1);
  }

  addPageAsHeaderLink(page: PageReference) {
    this.headerLinks.push({
      label: page.name,
      url: '/' + page.slug
    });
  }

  addFooterLink() {
    this.footerLinks.push({ label: '', url: '/' });
  }

  removeFooterLink(index: number) {
    this.footerLinks.splice(index, 1);
  }

  // Page Publish Toggle
  togglePagePublishState(page: PageReference) {
    const request$ = page.isPublished
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.subscribe({
      next: () => {
        this.pages.update(list =>
          list.map(p => (p._id === page._id ? { ...p, isPublished: !page.isPublished } : p))
        );
      },
      error: (err) => {
        console.error('Failed to update page status:', err);
      }
    });
  }

  // Save Operations
  saveLayout() {
    if (!this.rawLayout) return;
    this.saving.set(true);

    const payload = JSON.parse(JSON.stringify(this.rawLayout));

    // Compile Header
    if (!payload.header) payload.header = [{}];
    if (!payload.header[0].config) payload.header[0].config = {};
    payload.header[0].config.links = this.headerLinks;

    // Compile Footer
    if (!payload.footer) payload.footer = [{}];
    if (!payload.footer[0].config) payload.footer[0].config = {};
    payload.footer[0].config.copyright = this.footerCopyright;
    if (!payload.footer[0].config.columns) payload.footer[0].config.columns = [{ title: 'Quick Links', links: [] }];
    payload.footer[0].config.columns[0].links = this.footerLinks;

    // Compile Globals (Themes & Commerce)
    if (!payload.globalSettings) payload.globalSettings = {};
    payload.globalSettings.colors = { ...(payload.globalSettings.colors || {}), ...this.colors };
    payload.globalSettings.commerce = {
      ...(payload.globalSettings.commerce || {}),
      ...this.commerce,
      minOrderAmount: Math.max(0, Number(this.commerce.minOrderAmount || 0))
    };
    payload.globalSettings.shopName = this.shopName;

    forkJoin([
      this.adminService.updateLayout(payload),
      this.orgService.updateMyOrganization({
        platformDelivery: { enabled: this.platformDeliveryEnabled }
      } as any)
    ]).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        console.error('Save layout failed:', err);
        this.saving.set(false);
        this.error.set('Failed to save layout configuration. Please try again.');
      }
    });
  }
}
