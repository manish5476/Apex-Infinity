import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="py-24 relative overflow-hidden bg-slate-900 text-white text-center">
      
      <div class="absolute inset-0 z-0">
        <img *ngIf="isImage(config.ctaText)" [src]="config.ctaText" class="w-full h-full object-cover opacity-20 blur-sm">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/90"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        
        <span class="inline-block py-1 px-3 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 animate-pulse">
          Limited Time Offer
        </span>

        <h2 class="font-serif text-4xl md:text-6xl font-bold mb-12 tracking-tight">
          {{ config.title }}
        </h2>

        <div class="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
          
          <div class="time-block">
            <span class="number">{{ timeLeft().days }}</span>
            <span class="label">Days</span>
          </div>
          <div class="separator">:</div>
          <div class="time-block">
            <span class="number">{{ timeLeft().hours }}</span>
            <span class="label">Hours</span>
          </div>
          <div class="separator">:</div>
          <div class="time-block">
            <span class="number">{{ timeLeft().minutes }}</span>
            <span class="label">Mins</span>
          </div>
          <div class="separator">:</div>
          <div class="time-block">
            <span class="number text-rose-400">{{ timeLeft().seconds }}</span>
            <span class="label">Secs</span>
          </div>

        </div>

        @if (config.ctaUrl && !isImage(config.ctaUrl)) {
          <a [routerLink]="config.ctaUrl" 
             class="inline-flex items-center gap-3 px-10 py-4 bg-white text-slate-900 rounded-full font-bold uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300">
            Shop Now <i class="pi pi-arrow-right"></i>
          </a>
        }

      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Manrope:wght@400;700&display=swap');
    :host { display: block; font-family: 'Manrope', sans-serif; }
    
    .time-block {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      width: 80px; height: 90px; border-radius: 16px;
      @media(min-width: 768px) { width: 120px; height: 130px; border-radius: 24px; }
    }
    
    .number {
      font-size: 2rem; font-weight: 700; line-height: 1; margin-bottom: 4px; font-family: 'Playfair Display', serif;
      @media(min-width: 768px) { font-size: 3.5rem; }
    }
    
    .label {
      font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6;
      @media(min-width: 768px) { font-size: 0.75rem; }
    }

    .separator {
      font-size: 2rem; font-weight: 300; opacity: 0.3; align-self: flex-start; margin-top: 10px;
      @media(min-width: 768px) { font-size: 4rem; margin-top: 20px; }
    }
  `]
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() config: any = {};
  
  timeLeft = signal({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  intervalId: any;

  ngOnInit() {
    this.calculateTime();
    this.intervalId = setInterval(() => this.calculateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  calculateTime() {
    // Parse format "DD/MM/YYYY" from JSON
    const parts = this.config.targetDate?.split('/');
    if (!parts || parts.length !== 3) return;
    
    // Create Date (Month is 0-indexed in JS Date)
    const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff < 0) {
      this.timeLeft.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    this.timeLeft.set({
      days: d < 10 ? '0' + d : d.toString(),
      hours: h < 10 ? '0' + h : h.toString(),
      minutes: m < 10 ? '0' + m : m.toString(),
      seconds: s < 10 ? '0' + s : s.toString()
    });
  }

  // Simple check if string is URL (basic assumption for this context)
  isImage(val: string): boolean {
    return !!val && val.includes('http');
  }
}