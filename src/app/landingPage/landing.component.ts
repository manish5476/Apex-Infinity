import { Component, OnInit, AfterViewInit, HostListener, signal, inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { ThemeService } from '../core/services/theme.service';

interface FeatureDetail {
  id: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  points: string[];
  icon: string;
  colorVar: string;
  metric?: { label: string; value: string };
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TooltipModule, AccordionModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  encapsulation: ViewEncapsulation.None 
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private themeService = inject(ThemeService);
  private scrollObserver: IntersectionObserver | null = null;

  readonly scrollY = signal(0);
  readonly activeTab = signal('finance');
  readonly mobileMenuOpen = signal(false);

  // 1. Hero Data
  readonly heroData = signal({
    headline: 'Architecting the Infinite Enterprise.',
    subhead: 'Apex Infinity is the only ERP that unifies Financials, Supply Chain, and Human Capital with a reactive, sub-50ms core.',
    stats: [
      { label: 'Modules', value: '24+' },
      { label: 'Active Orgs', value: '500+' },
      { label: 'Uptime', value: '99.99%' }
    ]
  });

  // 2. The Massive Feature List (Restoring Depth)
  readonly deepDiveFeatures = signal<FeatureDetail[]>([
    {
      id: 'finance',
      category: 'Financial Core',
      title: 'Real-Time General Ledger',
      tagline: 'The Heart of Truth',
      description: 'A double-entry accounting engine that updates instantly. Every sale, purchase, and payroll run impacts the ledger in real-time. No end-of-day batch processing.',
      points: ['Multi-Branch Consolidation', 'Automated GST/Tax Filing', 'Audit Trail & Immutable Logs'],
      icon: 'pi pi-wallet',
      colorVar: 'var(--color-success)',
      metric: { label: 'Reconciliation Speed', value: '< 200ms' }
    },
    {
      id: 'inventory',
      category: 'Supply Chain',
      title: 'Multi-Location Inventory',
      tagline: 'Global Visibility',
      description: 'Track stock across warehouses, retail outlets, and transit vans. Smart transfer orders and low-stock alerts ensure you never miss a sale.',
      points: ['Batch & Expiry Tracking', 'Barcode/QR Scanning Support', 'Automated Replenishment'],
      icon: 'pi pi-box',
      colorVar: 'var(--accent-primary)',
      metric: { label: 'Stock Accuracy', value: '100%' }
    },
    {
      id: 'storefront',
      category: 'Commerce',
      title: 'Headless Storefront Builder',
      tagline: 'B2B & B2C Unified',
      description: 'Launch a pixel-perfect public store directly from your ERP. Inventory syncs instantly. Manage SEO, banners, and pricing without IT help.',
      points: ['Drag-and-Drop Page Builder', 'Real-time Stock Sync', 'Customer Portal Built-in'],
      icon: 'pi pi-shopping-cart',
      colorVar: 'var(--accent-secondary)',
      metric: { label: 'Deploy Time', value: '5 Mins' }
    },
    {
      id: 'hr',
      category: 'Human Capital',
      title: 'Biometric Attendance & Payroll',
      tagline: 'Manage People, Not Paper',
      description: 'Direct integration with biometric devices. Automated shift scheduling, leave management, and one-click payroll generation based on actual hours.',
      points: ['Geo-fenced Mobile Punching', 'Complex Shift Rotations', 'Payslip Generation'],
      icon: 'pi pi-users',
      colorVar: 'var(--color-info)',
      metric: { label: 'Payroll Errors', value: '0%' }
    },
    {
      id: 'emi',
      category: 'Lending Engine',
      title: 'EMI Lifecycle Management',
      tagline: 'Automated Collections',
      description: 'Designed for electronics retailers and financiers. Track down-payments, interest schedules, and automate SMS reminders for due installments.',
      points: ['Amortization Schedules', 'Penalty Calculation', 'Bad Debt Analytics'],
      icon: 'pi pi-calculator',
      colorVar: 'var(--color-warning)',
      metric: { label: 'Recovery Rate', value: '+18%' }
    },
    {
      id: 'ai',
      category: 'Intelligence',
      title: 'Apex AI Analyst',
      tagline: 'Your 24/7 CFO',
      description: 'Stop writing SQL. Ask questions like "Which branch had the highest profit margin last week?" and get visual answers instantly.',
      points: ['Natural Language Querying', 'Trend Forecasting', 'Anomaly Detection'],
      icon: 'pi pi-bolt',
      colorVar: 'var(--accent-tertiary)',
      metric: { label: 'Response Time', value: 'instant' }
    },
    {
      id: 'sales',
      category: 'Sales Force',
      title: 'Omnichannel Sales Order',
      tagline: 'Sell Everywhere',
      description: 'Unify offline POS, online orders, and B2B quotes. One screen to manage approvals, shipping, and invoicing across all channels.',
      points: ['Quotation to Invoice Flow', 'Credit Limit Checks', 'Sales Commission Tracking'],
      icon: 'pi pi-percentage',
      colorVar: 'var(--text-secondary)'
    },
    {
      id: 'purchase',
      category: 'Procurement',
      title: 'Smart Procurement',
      tagline: 'Optimize Spending',
      description: 'Vendor portals, purchase requisition workflows, and landed cost calculations. Know exactly what your inventory costs.',
      points: ['Vendor Performance Rating', 'GRN Verification', 'Landed Cost Analysis'],
      icon: 'pi pi-truck',
      colorVar: 'var(--color-error)'
    },
    {
      id: 'manufacturing',
      category: 'Production',
      title: 'Light Manufacturing',
      tagline: 'Bill of Materials',
      description: 'Manage BOMs, raw material consumption, and finished goods production. Perfect for assembly and packaging units.',
      points: ['Raw Material Planning', 'Wastage Tracking', 'Production Costing'],
      icon: 'pi pi-cog',
      colorVar: 'var(--text-primary)'
    },
    {
      id: 'assets',
      category: 'Asset Mgmt',
      title: 'Fixed Asset Tracking',
      tagline: 'Value Over Time',
      description: 'Depreciation schedules, asset maintenance logs, and location tracking for all company equipment.',
      points: ['Automated Depreciation', 'Maintenance Alerts', 'QR Asset Tagging'],
      icon: 'pi pi-building',
      colorVar: 'var(--accent-primary)'
    }
  ]);

  // 3. Problem/Solution Data
  readonly problems = signal([
    { title: 'Data Silos', desc: 'Finance doesn\'t talk to Sales.', icon: 'pi-server' },
    { title: 'Slow Closing', desc: 'Month-end takes 15 days.', icon: 'pi-calendar-times' },
    { title: 'Stock Outs', desc: 'Lost sales due to bad inventory data.', icon: 'pi-exclamation-triangle' },
    { title: 'Manual Error', desc: 'Spreadsheets serve as databases.', icon: 'pi-file-excel' }
  ]);

  // 4. FAQ Data
  readonly faqs = signal([
    { id: '1', question: 'How long does implementation take?', answer: 'For standard setups, you can go live in 48 hours. Enterprise migrations typically take 2-3 weeks.' },
    { id: '2', question: 'Is my data secure?', answer: 'We use AES-256 encryption at rest and TLS 1.3 in transit. We are ISO 27001 compliant.' },
    { id: '3', question: 'Can I customize the print formats?', answer: 'Yes, our "Print Designer" lets you drag-and-drop to create custom invoices, POs, and labels.' },
    { id: '4', question: 'Does it support multi-currency?', answer: 'Yes, automated exchange rate fetching and realized/unrealized gain/loss reporting is built-in.' }
  ]);

  // 5. Tech Stack (For the "Tech" section)
  readonly techStack = signal([
    { name: 'Angular 20', icon: 'pi pi-code' },
    { name: 'PrimeNG', icon: 'pi pi-palette' },
    { name: 'Signals', icon: 'pi pi-bolt' },
    { name: 'Node.js', icon: 'pi pi-server' }
  ]);

  constructor() {}

  ngOnInit() {
    this.themeService.setLightTheme('theme-glass');
  }

  ngAfterViewInit() {
    this.initScrollObserver();
  }

  ngOnDestroy() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY.set(window.scrollY);
  }

  private initScrollObserver() {
    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => this.scrollObserver?.observe(el));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }
}