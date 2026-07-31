// src/app/shared/ui/media/avatar.component.ts
import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | 'none';

const PALETTE = [
    'bg-[var(--color-info-bg)] text-[var(--color-info-dark)]',
    'bg-[var(--color-success-bg)] text-[var(--color-success-dark)]',
    'bg-[var(--accent-focus)] text-[var(--accent-primary)]',
    'bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)]',
    'bg-[var(--color-error-bg)] text-[var(--color-error-dark)]',
];

const STATUS_DOT: Record<Exclude<AvatarStatus, 'none'>, string> = {
    online: 'bg-[var(--color-success)]',
    offline: 'bg-[var(--text-tertiary)]',
    busy: 'bg-[var(--color-error)]',
    away: 'bg-[var(--color-warning)]',
};

/**
 * Component: app-avatar
 * Purpose: Consistent user/entity avatar — image with graceful fallback to initials,
 * deterministic color assignment, and optional presence indicator.
 */
@Component({
    selector: 'app-avatar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-flex relative shrink-0' },
    template: `
    <div [class]="containerClasses()">
      @if (imageUrl() && !imageFailed()) {
        <img
          [src]="imageUrl()"
          [alt]="name()"
          class="h-full w-full object-cover"
          (error)="imageFailed.set(true)" />
      } @else {
        <span [class]="initialsTextClass()">{{ initials() }}</span>
      }
    </div>

    @if (status() !== 'none') {
      <span
        class="absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--bg-primary)]"
        [class]="dotSizeClass() + ' ' + dotColorClass()"
        [attr.aria-label]="status()">
      </span>
    }
  `,
})
export class AvatarComponent {
    name = input.required<string>();
    imageUrl = input<string>();
    size = input<AvatarSize>('md');
    shape = input<'circle' | 'square'>('circle');
    status = input<AvatarStatus>('none');

    protected imageFailed = signal(false);

    protected initials = computed(() => {
        const parts = this.name().trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    });

    private paletteIndex = computed(() => {
        let hash = 0;
        for (const ch of this.name()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
        return hash % PALETTE.length;
    });

    protected containerClasses = computed(() => {
        const sizeMap: Record<AvatarSize, string> = {
            xs: 'h-6 w-6 text-[10px]',
            sm: 'h-8 w-8 text-[11px]',
            md: 'h-10 w-10 text-[length:var(--font-size-sm)]',
            lg: 'h-12 w-12 text-[length:var(--font-size-md)]',
            xl: 'h-16 w-16 text-[length:var(--font-size-lg)]',
        };
        const shapeClass = this.shape() === 'circle' ? 'rounded-full' : 'rounded-[var(--ui-border-radius)]';
        const bg = this.imageUrl() && !this.imageFailed() ? 'bg-[var(--bg-ternary)]' : PALETTE[this.paletteIndex()];
        return `flex items-center justify-center overflow-hidden font-[var(--font-weight-semibold)] select-none ${sizeMap[this.size()]} ${shapeClass} ${bg}`;
    });

    protected initialsTextClass = computed(() => 'leading-none');

    protected dotSizeClass = computed(() => {
        const map: Record<AvatarSize, string> = { xs: 'h-1.5 w-1.5', sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3 w-3', xl: 'h-3.5 w-3.5' };
        return map[this.size()];
    });

    protected dotColorClass = computed(() =>
        this.status() === 'none' ? '' : STATUS_DOT[this.status() as Exclude<AvatarStatus, 'none'>]
    );
}