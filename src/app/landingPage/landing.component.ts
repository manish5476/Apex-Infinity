import { Component, OnInit, AfterViewInit, HostListener, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Feature {
  title: string;
  desc: string;
  group: string;
  icon: string;
  color: string; // CSS var string
  position?: { row: number; column: number; span?: number };
}

interface Stat {
  label: string;
  value: number;
  suffix: string;
  currentValue?: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styles: [`
    /* --- LANDING PAGE SPECIFIC ANIMATIONS --- */
    
    /* Floating Animation for Dashboard Preview */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }

    /* Slow Pulse for Background Blobs */
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 8s ease-in-out infinite;
    }

    /* Bento Grid Layout Logic */
    .bento-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    @media (min-width: 768px) {
      .bento-grid {
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: minmax(180px, auto);
      }
    }
  `]
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  // State
  scrollY = signal(0);
  activeCategory = signal('All');
  isYearly = signal(false);
  
  // Parallax Mouse Tracking
  mouseX = signal(0);
  mouseY = signal(0);

  private observer: IntersectionObserver | null = null;
  private countersAnimated = false;

  // DATA: Stats (Using Theme Variables for Colors)
  animatedStats = signal<Stat[]>([
    { label: 'Businesses', value: 5000, suffix: '+', currentValue: 0, icon: 'pi pi-building', color: 'var(--accent-primary)' },
    { label: 'Daily Invoices', value: 25000, suffix: '', currentValue: 0, icon: 'pi pi-receipt', color: 'var(--color-success)' },
    { label: 'Uptime', value: 99.9, suffix: '%', currentValue: 0, icon: 'pi pi-server', color: 'var(--accent-secondary)' },
    { label: 'Growth', value: 32, suffix: '%', currentValue: 0, icon: 'pi pi-chart-line', color: 'var(--color-warning)' }
  ]);

  // DATA: Categories
  categories = ['All', 'Finance', 'Inventory', 'CRM', 'Communication'];

  // DATA: Bento Features
  features: Feature[] = [
    {
      title: 'Double-Entry Accounting',
      desc: 'Automated ledger entries with real-time GST compliance.',
      group: 'Finance',
      icon: 'pi pi-wallet',
      color: 'var(--accent-primary)',
      position: { row: 1, column: 1, span: 2 }
    },
    {
      title: 'Smart Inventory',
      desc: 'Multi-location tracking with AI reorder points.',
      group: 'Inventory',
      icon: 'pi pi-box',
      color: 'var(--color-success)',
      position: { row: 1, column: 3 }
    },
    {
      title: 'Team Sync',
      desc: 'Real-time chat & role-based access control.',
      group: 'Communication',
      icon: 'pi pi-users',
      color: 'var(--accent-secondary)',
      position: { row: 2, column: 1 }
    },
    {
      title: 'Financial AI',
      desc: 'Predictive cashflow analysis & automated reporting.',
      group: 'Finance',
      icon: 'pi pi-chart-pie',
      color: 'var(--color-warning)',
      position: { row: 2, column: 2, span: 2 }
    }
  ];

  // DATA: Pricing
  plans = [
    {
      name: 'Starter',
      price: 'Free',
      desc: 'Perfect for freelancers',
      features: ['5 Users', '100 Invoices/mo', 'Basic Support'],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: '₹2,499',
      desc: 'For growing teams',
      features: ['Unlimited Users', 'AI Insights', 'Priority Support', 'API Access'],
      cta: 'Get Pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'For large organizations',
      features: ['Dedicated Manager', 'Custom Integrations', 'On-Premise Deployment'],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  // Computed Features
  filteredFeatures = computed(() => {
    if (this.activeCategory() === 'All') return this.features;
    return this.features.filter(f => f.group === this.activeCategory());
  });

  ngOnInit() {}

  ngAfterViewInit() {
    this.initObservers();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  // --- EVENTS ---
  @HostListener('window:scroll')
  onWindowScroll() {
    this.scrollY.set(window.scrollY);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Normalize mouse position (-1 to 1) for parallax
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    this.mouseX.set(x * 15); // Movement intensity
    this.mouseY.set(y * 15);
  }

  // --- METHODS ---
  setActiveCategory(category: string) {
    this.activeCategory.set(category);
  }

  // Helper for Bento Grid Positioning (Desktop Only)
  getFeatureGridStyle(feature: Feature): any {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && feature.position) {
      return {
        'grid-row': `span ${1}`, 
        'grid-column': `span ${feature.position.span || 1}`
      };
    }
    return {};
  }

  // Animation Logic
  private initObservers() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id === 'stats-section' && !this.countersAnimated) {
          this.countersAnimated = true;
          this.animateCounters();
          this.observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const stats = document.getElementById('stats-section');
    if (stats) this.observer.observe(stats);
  }

  private animateCounters() {
    this.animatedStats().forEach((stat, index) => {
      const duration = 2000; 
      const start = 0;
      const end = stat.value;
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic Ease Out
        const current = Math.floor(start + (end - start) * ease);

        // Update Signal Immutably
        const currentStats = this.animatedStats();
        const newStats = [...currentStats];
        newStats[index] = { ...newStats[index], currentValue: current };
        this.animatedStats.set(newStats);

        if (progress < 1) requestAnimationFrame(step);
      };
      
      requestAnimationFrame(step);
    });
  }
}
