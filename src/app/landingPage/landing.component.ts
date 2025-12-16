import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// ⚠️ CHECK PATH: Ensure this points to your real service location
import { ThemeService } from '../core/services/theme.service';

interface Feature {
  title: string;
  desc: string;
  group: string;
  icon: string;
  tags: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LandingComponent implements AfterViewInit, OnDestroy {

  // --- Services ---
  private themeService = inject(ThemeService);
  private observer: IntersectionObserver | null = null;

  // --- Signals & State ---
  searchQuery = signal('');
  selectedCategory = signal('All');
  isYearly = signal(true);
  openFaqIndex = signal<number | null>(null);

  // Available Themes for Selector
  availableThemes = [
    { name: 'Glass', class: 'theme-glass' },
    { name: 'Light', class: 'theme-light' },
    { name: 'Dark', class: 'theme-dark' },
    { name: 'Premium', class: 'theme-premium' },
    { name: 'Minimal', class: 'theme-minimal' },
    { name: 'Bold', class: 'theme-bold' },
    { name: 'Luxury', class: 'theme-luxury' },
    { name: 'Slate', class: 'theme-slate' },
    { name: 'Titanium', class: 'theme-titanium' },
    { name: 'Rose', class: 'theme-rose' },
    { name: 'Sunset', class: 'theme-sunset' },
    { name: 'Ocean', class: 'theme-ocean' },
    { name: 'Forest', class: 'theme-forest' },
    { name: 'Futuristic', class: 'theme-futuristic' }
  ];

  // --- Data (Full List Preserved) ---
  features: Feature[] = [
    { title: "Executive Dashboard", desc: "High-level strategic insights & KPI monitoring.", group: "Analytics", icon: "pi-th-large", tags: "view_executive" },
    { title: "Branch Comparison", desc: "Benchmark performance across multiple locations.", group: "Analytics", icon: "pi-arrow-right-arrow-left", tags: "view_branch_comparison" },
    { title: "AI Revenue Forecast", desc: "Predict sales & revenue using AI models.", group: "Analytics", icon: "pi-chart-line", tags: "view_forecast" },
    { title: "Critical Alerts", desc: "Real-time risk & stock-out notifications.", group: "Analytics", icon: "pi-exclamation-triangle", tags: "view_alerts" },
    { title: "Financial Summary", desc: "P&L, Revenue, and Expense overview.", group: "Analytics", icon: "pi-chart-pie", tags: "view_financial" },
    { title: "Cash Flow Analysis", desc: "Track cash movement & payment modes.", group: "Analytics", icon: "pi-money-bill", tags: "view_cashflow" },
    { title: "GST & Tax Reports", desc: "Input/Output tax analysis for compliance.", group: "Analytics", icon: "pi-file", tags: "view_tax" },
    { title: "Debtor Aging", desc: "0-90+ days outstanding payment analysis.", group: "Analytics", icon: "pi-hourglass", tags: "view_debtor_aging" },
    { title: "Profitability Matrix", desc: "Real Gross Profit & Margin tracking.", group: "Analytics", icon: "pi-percentage", tags: "view_profitability" },
    { title: "Staff Leaderboard", desc: "Employee performance tracking & KPIs.", group: "Analytics", icon: "pi-star", tags: "view_staff_performance" },
    { title: "Peak Hour Heatmap", desc: "Visualize busiest times & days.", group: "Analytics", icon: "pi-clock", tags: "view_peak_hours" },
    { title: "Dead Stock Detector", desc: "Identify items non-moving > 90 days.", group: "Analytics", icon: "pi-box", tags: "view_dead_stock" },
    { title: "Stock-out Prediction", desc: "AI run-rate analysis for restocking.", group: "Analytics", icon: "pi-bolt", tags: "view_stock_forecast" },
    { title: "RFM Segmentation", desc: "Segment by Recency, Frequency, Money.", group: "Analytics", icon: "pi-users", tags: "view_customer_segmentation" },
    { title: "Cohort Retention", desc: "Analyze customer loyalty over time.", group: "Analytics", icon: "pi-heart", tags: "view_customer_retention" },
    { title: "Credit Limits", desc: "Set & manage customer credit limits.", group: "CRM", icon: "pi-credit-card", tags: "customer:credit_limit" },
    { title: "Purchase Orders", desc: "Manage supplier purchasing lifecyle.", group: "Inventory", icon: "pi-shopping-cart", tags: "purchase:read create update delete" },
    { title: "Invoice Engine", desc: "Create, Edit & Delete Invoices.", group: "Sales", icon: "pi-file-edit", tags: "invoice:read create update delete" },
    { title: "EMI Management", desc: "Create EMI plans & collect payments.", group: "Finance", icon: "pi-calendar", tags: "emi:read create pay" },
    { title: "RBAC Controls", desc: "Manage roles & granular permissions.", group: "System", icon: "pi-lock", tags: "role:manage" },
    { title: "Audit Logs", desc: "View security logs & suspicious activity.", group: "System", icon: "pi-shield", tags: "logs:view analytics:view_security_audit" },
    { title: "AI Assistant", desc: "Chat with your data using AI.", group: "Utilities", icon: "pi-android", tags: "ai:chat" },
    // Communication Features
    { title: "Team Chat", desc: "Real-time messaging with channels & DMs.", group: "Communication", icon: "pi-comments", tags: "chat:read create" },
    { title: "Broadcast Messages", desc: "Send announcements to entire teams instantly.", group: "Communication", icon: "pi-megaphone", tags: "broadcast:create send" },
    { title: "File Sharing", desc: "Share documents & media in conversations.", group: "Communication", icon: "pi-paperclip", tags: "chat:attach" },
    { title: "Notification Center", desc: "Centralized alerts for all activities.", group: "Communication", icon: "pi-bell", tags: "notifications:view" },
  ];

  // --- Computed Values ---
  categories = computed(() => ['All', ...new Set(this.features.map(f => f.group))]);

  filteredFeatures = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const group = this.selectedCategory();

    return this.features.filter(f => {
      const matchesGroup = group === 'All' || f.group === group;
      
      // Safety checks: handle undefined/null values gracefully
      const title = f.title ? f.title.toLowerCase() : '';
      const desc = f.desc ? f.desc.toLowerCase() : '';
      const tags = f.tags ? f.tags.toLowerCase() : '';

      const matchesSearch = !q || title.includes(q) || desc.includes(q) || tags.includes(q);
      
      return matchesGroup && matchesSearch;
    });
  });

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private el: ElementRef
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // 100ms delay ensures the HTML list is actually rendered before we try to animate it
      setTimeout(() => this.initIntersectionObserver(), 100);
    }
  }

  ngOnDestroy() {
    // Clean up memory when component is destroyed
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  togglePricing() {
    this.isYearly.update(v => !v);
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  toggleFaq(index: number) {
    this.openFaqIndex.update(current => current === index ? null : index);
  }

  getCategoryCount(cat: string): number {
    if (cat === 'All') return this.features.length;
    return this.features.filter(f => f.group === cat).length;
  }

  selectTheme(themeClass: string) {
    this.themeService.setLightTheme(themeClass);
  }

  private initIntersectionObserver() {
    const options = {
      root: null, // Watch the viewport
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% is visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Performance Optimization: Stop watching once revealed
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    // Select all elements with the 'reveal' class
    const elements = this.el.nativeElement.querySelectorAll('.reveal');
    if (elements.length > 0) {
      elements.forEach((el: any) => this.observer?.observe(el));
    }
  }
}
