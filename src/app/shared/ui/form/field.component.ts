// src/app/shared/ui/form/field.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div class="flex flex-col gap-[var(--spacing-sm)] w-full">
      @if (label()) {
        <label [for]="forId()" class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] flex items-center gap-1">
          {{ label() }}
          @if (required()) {
            <span class="text-[var(--color-error,#dc2626)]">*</span>
          }
        </label>
      }

      <div class="relative w-full">
        <ng-content></ng-content>
      </div>

      @if (error()) {
        <p class="text-[length:var(--font-size-xs)] text-[var(--color-error,#dc2626)] m-0 flex items-center gap-1.5">
          <i class="pi pi-exclamation-circle text-[11px]"></i>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] m-0">
          {{ hint() }}
        </p>
      }
    </div>
  `,
})
export class FieldComponent {
  label = input<string>();
  forId = input<string>();
  required = input<boolean>(false);
  error = input<string | null>(null);
  hint = input<string>();
}