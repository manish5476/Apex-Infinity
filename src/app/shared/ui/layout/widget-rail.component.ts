import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, Input, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-rail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="widget-rail-container w-full group/rail relative">
      
      <!-- Header Area -->
      <div class="flex justify-between items-end mb-[var(--spacing-xl)] px-1 empty:hidden">
        <div class="rail-header flex-1 empty:hidden">
          <ng-content select="[rail-header]"></ng-content>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="rail-actions empty:hidden">
            <ng-content select="[rail-actions]"></ng-content>
          </div>
        </div>
      </div>

      <!-- Scrollable Track with Edge Fading -->
      <div class="relative w-full">
        
        <!-- Premium Floating Navigation Controls -->
        @if (showNavigation && !isAtStart()) {
          <button 
            class="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--bg-primary)]/90 backdrop-blur-md border border-[var(--border-secondary)] shadow-md flex items-center justify-center text-[var(--text-primary)] transition-all duration-300 hover:bg-[var(--bg-primary)] hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] opacity-0 group-hover/rail:opacity-100"
            (click)="scrollLeft()"
            aria-label="Scroll left">
            <i class="pi pi-chevron-left text-sm"></i>
          </button>
        }

        @if (showNavigation && !isAtEnd()) {
          <button 
            class="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[var(--bg-primary)]/90 backdrop-blur-md border border-[var(--border-secondary)] shadow-md flex items-center justify-center text-[var(--text-primary)] transition-all duration-300 hover:bg-[var(--bg-primary)] hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] opacity-0 group-hover/rail:opacity-100"
            (click)="scrollRight()"
            aria-label="Scroll right">
            <i class="pi pi-chevron-right text-sm"></i>
          </button>
        }

        <div class="w-full overflow-hidden" 
             [class.rail-fade-edges]="!isAtStart() || !isAtEnd()">
          
          <div 
            #track
            class="widget-rail-track"
            [class.snap-mandatory]="snap"
            [class.scrollbar-hidden]="scrollbar === 'hidden'"
            [class.scrollbar-thin]="scrollbar === 'thin'"
            [class.scrollbar-default]="scrollbar === 'default'"
            [class.cursor-grab]="dragScroll && !isDragging()"
            [class.cursor-grabbing]="isDragging()"
            [style.--rail-rows]="rows"
            [style.--rail-card-width]="cardWidth"
            [style.--rail-gap]="gap"
            (scroll)="onScroll()"
            (mousedown)="onMouseDown($event)"
            (mouseleave)="onMouseLeave()"
            (mouseup)="onMouseUp()"
            (mousemove)="onMouseMove($event)"
            tabindex="0"
            (keydown)="onKeyDown($event)">
            
            <ng-content></ng-content>
            
            <!-- Polished Loading Skeletons -->
            @if (loading) {
              @for (i of skeletonArray; track i) {
                <div class="widget-skeleton bg-[var(--bg-secondary)] rounded-[var(--ui-border-radius-xl)] animate-pulse border border-[var(--border-secondary)]"></div>
              }
            }
            
            <!-- Right padding spacer to ensure last item doesn't stick to the absolute edge -->
            <div class="w-[1px] shrink-0 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    /* CSS Mask to create smooth fade out on the left and right edges */
    .rail-fade-edges {
      mask-image: linear-gradient(to right, 
        transparent 0%, 
        black 2%, 
        black 98%, 
        transparent 100%
      );
      -webkit-mask-image: linear-gradient(to right, 
        transparent 0%, 
        black 2%, 
        black 98%, 
        transparent 100%
      );
    }

    .widget-rail-track {
      display: grid;
      grid-auto-flow: column;
      grid-template-rows: repeat(var(--rail-rows), auto);
      grid-auto-columns: var(--rail-card-width);
      gap: var(--rail-gap);
      overflow-x: auto;
      overflow-y: hidden;
      scroll-behavior: smooth;
      width: 100%;
      padding-bottom: var(--spacing-xl); /* Generous padding to prevent shadow clipping */
      padding-top: var(--spacing-sm);
      padding-inline: 4px;
    }

    .widget-rail-track:focus-visible {
      outline: none;
    }

    .snap-mandatory {
      scroll-snap-type: x mandatory;
    }
    
    ::ng-deep .widget-rail-track > * {
      scroll-snap-align: start;
      min-width: 0; 
      min-height: 0;
      height: 100%;
      /* Transition for smooth hover lift inside the rail */
      transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    .scrollbar-hidden { scrollbar-width: none; }
    .scrollbar-hidden::-webkit-scrollbar { display: none; }

    .scrollbar-thin { scrollbar-width: thin; }
    .scrollbar-thin::-webkit-scrollbar { height: 6px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: var(--border-secondary);
      border-radius: 10px;
    }

    .scrollbar-default { scrollbar-width: auto; }

    .widget-skeleton {
      width: 100%;
      height: 100%;
      min-height: 160px; 
    }
  `]
})
export class WidgetRailComponent implements AfterViewInit, OnDestroy {
  @ViewChild('track') track!: ElementRef<HTMLDivElement>;

  @Input() rows: number = 1;
  @Input() cardWidth: string = "clamp(300px, 25vw, 380px)";
  @Input() gap: string = "var(--spacing-xl, 1.5rem)";

  @Input() showNavigation: boolean = true;
  @Input() scrollbar: 'hidden' | 'thin' | 'default' = 'hidden';
  @Input() snap: boolean = true;
  @Input() dragScroll: boolean = true;
  @Input() loading: boolean = false;

  @Input() skeletonCount: number = 4;

  isAtStart = signal(true);
  isAtEnd = signal(false);
  isDragging = signal(false);

  private startX: number = 0;
  private scrollLeftPos: number = 0;
  private resizeObserver!: ResizeObserver;
  private isScrollBehaviorAuto = false;

  get skeletonArray() {
    return Array.from({ length: this.skeletonCount }, (_, i) => i);
  }

  ngAfterViewInit() {
    if (this.track && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkScrollBounds();
      });
      this.resizeObserver.observe(this.track.nativeElement);
    }

    setTimeout(() => this.checkScrollBounds(), 100);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  onScroll() {
    if (this.isDragging()) return;
    requestAnimationFrame(() => {
      this.checkScrollBounds();
    });
  }

  private checkScrollBounds() {
    if (!this.track) return;
    const el = this.track.nativeElement;

    const atStart = el.scrollLeft <= 2;
    const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 2;

    if (this.isAtStart() !== atStart) this.isAtStart.set(atStart);

    const noOverflow = el.scrollWidth <= el.clientWidth;
    if (this.isAtEnd() !== (atEnd || noOverflow)) this.isAtEnd.set(atEnd || noOverflow);
  }

  scrollLeft() {
    if (!this.track) return;
    const el = this.track.nativeElement;
    el.scrollBy({ left: -this.getScrollAmount(el), behavior: 'smooth' });
  }

  scrollRight() {
    if (!this.track) return;
    const el = this.track.nativeElement;
    el.scrollBy({ left: this.getScrollAmount(el), behavior: 'smooth' });
  }

  private getScrollAmount(el: HTMLElement): number {
    const firstChild = el.firstElementChild as HTMLElement;
    if (firstChild) {
      const gapValue = parseFloat(window.getComputedStyle(el).gap) || 0;
      return firstChild.offsetWidth + gapValue;
    }
    return 340;
  }

  onKeyDown(event: KeyboardEvent) {
    const el = this.track?.nativeElement;
    if (!el) return;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.scrollRight();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.scrollLeft();
        break;
      case 'Home':
        event.preventDefault();
        el.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        event.preventDefault();
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        break;
    }
  }

  onMouseDown(e: MouseEvent) {
    if (!this.dragScroll || !this.track) return;
    const el = this.track.nativeElement;

    if (e.offsetY >= el.clientHeight) return;

    this.isDragging.set(true);

    el.style.scrollBehavior = 'auto';
    this.isScrollBehaviorAuto = true;
    el.classList.remove('snap-mandatory');

    this.startX = e.pageX - el.offsetLeft;
    this.scrollLeftPos = el.scrollLeft;
  }

  onMouseLeave() {
    if (!this.isDragging()) return;
    this.endDrag();
  }

  onMouseUp() {
    if (!this.isDragging()) return;
    this.endDrag();
  }

  private endDrag() {
    this.isDragging.set(false);
    if (!this.track) return;
    const el = this.track.nativeElement;

    if (this.isScrollBehaviorAuto) {
      el.style.scrollBehavior = 'smooth';
      this.isScrollBehaviorAuto = false;
    }

    if (this.snap) {
      el.classList.add('snap-mandatory');
    }
    this.checkScrollBounds();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging() || !this.track) return;
    e.preventDefault();
    const el = this.track.nativeElement;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - this.startX) * 1.5;
    el.scrollLeft = this.scrollLeftPos - walk;
  }
}