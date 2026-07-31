// src/app/shared/ui/media/image-preview.component.ts
import { Component, ChangeDetectionStrategy, input, signal, HostListener } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/**
 * Component: app-image-preview
 * Purpose: Thumbnail with loading skeleton, broken-image fallback, hover zoom affordance,
 * and click-to-expand lightbox. Used for attachments, product/supplier images, document previews.
 */
@Component({
    selector: 'app-image-preview',
    standalone: true,
    imports: [SkeletonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block' },
    template: `
    <div
      class="group relative overflow-hidden rounded-[var(--ui-border-radius)] border border-[var(--border-secondary)] bg-[var(--bg-secondary)] cursor-zoom-in"
      [class]="sizeClass()"
      (click)="failed() ? null : lightboxOpen.set(true)">

      @if (!loaded() && !failed()) {
        <p-skeleton width="100%" height="100%" styleClass="!absolute inset-0"></p-skeleton>
      }

      @if (failed()) {
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)]">
          <i class="pi pi-image text-2xl"></i>
          <span class="text-[10px]">Unavailable</span>
        </div>
      } @else {
        <img
          [src]="src()"
          [alt]="alt()"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          [class.opacity-0]="!loaded()"
          (load)="loaded.set(true)"
          (error)="failed.set(true)" />

        @if (loaded()) {
          <div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <i class="pi pi-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity text-lg"></i>
          </div>
        }
      }
    </div>

    @if (lightboxOpen()) {
      <div
        class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--overlay-bg)] p-8 animate-fade-in"
        (click)="lightboxOpen.set(false)">
        <img [src]="src()" [alt]="alt()" class="max-h-full max-w-full rounded-[var(--ui-border-radius)] shadow-[var(--elevation-3)] object-contain" (click)="$event.stopPropagation()" />
        <button
          type="button"
          class="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close preview"
          (click)="lightboxOpen.set(false)">
          <i class="pi pi-times"></i>
        </button>
      </div>
    }
  `,
})
export class ImagePreviewComponent {
    src = input.required<string>();
    alt = input<string>('');
    size = input<'sm' | 'md' | 'lg'>('md');

    protected loaded = signal(false);
    protected failed = signal(false);
    protected lightboxOpen = signal(false);

    protected sizeClass = () => {
        const map = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-36 w-36' };
        return map[this.size()];
    };

    @HostListener('document:keydown.escape')
    protected onEscape(): void {
        this.lightboxOpen.set(false);
    }
}