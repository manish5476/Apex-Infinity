import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';

@Component({
  selector: 'app-bento-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()'
  },
  template: `
    <div [class]="containerClasses()">
      @if (title() || icon()) {
        <div class="px-6 pt-6 pb-2 flex items-center justify-between" 
             [class.cursor-pointer]="collapsible()" 
             (click)="toggleCollapse()">
          <h4 class="m-0 flex items-center gap-3 text-[length:var(--font-size-base)] font-bold text-[var(--text-primary)]">
            @if (icon()) {
              <div class="flex items-center justify-center w-7 h-7 rounded-md bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
                <i [class]="icon()" class="text-sm"></i>
              </div>
            }
            {{ title() }}
          </h4>
          <div class="flex items-center gap-2" (click)="$event.stopPropagation()">
            <ng-content select="[header-action]"></ng-content>
            @if (collapsible()) {
              <button type="button" class="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]" (click)="toggleCollapse()">
                 <i class="pi" [class.pi-chevron-down]="!isCollapsed()" [class.pi-chevron-up]="isCollapsed()"></i>
              </button>
            }
          </div>
        </div>
      }
      
      <div class="flex-1 flex flex-col transition-all duration-300 overflow-hidden"
           [style.max-height]="isCollapsed() ? '0' : '2000px'"
           [style.opacity]="isCollapsed() ? '0' : '1'">
        <div class="p-6 flex-1 flex flex-col">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class BentoContainerComponent {
  title = input<string>();
  icon = input<string>();
  variant = input<'surface' | 'glass' | 'outlined' | 'elevated' | 'flat'>('surface');
  collapsible = input<boolean>(false);
  
  isCollapsed = signal<boolean>(false);

  toggleCollapse() {
    if (this.collapsible()) {
      this.isCollapsed.update(v => !v);
    }
  }

  protected hostClasses = computed(() => 'block h-full w-full');

  protected containerClasses = computed(() => {
    const base = 'h-full w-full flex flex-col rounded-[var(--radius-2xl,20px)] transition-all duration-300 overflow-hidden group';
    
    const variants = {
      surface: 'bg-[var(--bg-primary)] border border-[color-mix(in_srgb,var(--border-secondary)_60%,transparent)] shadow-sm hover:shadow-[var(--elevation-1)] hover:border-[var(--border-primary)]',
      glass: 'bg-[color-mix(in_srgb,var(--bg-primary)_80%,transparent)] backdrop-blur-xl border border-[color-mix(in_srgb,var(--border-secondary)_40%,transparent)] shadow-sm hover:shadow-md',
      outlined: 'bg-transparent border border-[var(--border-secondary)] hover:border-[var(--border-primary)]',
      elevated: 'bg-[var(--bg-primary)] border border-[color-mix(in_srgb,var(--border-primary)_15%,transparent)] shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)] hover:-translate-y-1',
      flat: 'bg-[var(--bg-secondary)] border-none'
    };
    
    return `${base} ${variants[this.variant()]}`;
  });
}
