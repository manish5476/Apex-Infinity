// src/app/shared/ui/text-input/text-input.component.ts
import { Component, ChangeDetectionStrategy, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type TextInputType = 'text' | 'password' | 'email' | 'tel';

/**
 * Component: ui-text-input
 * Purpose: Token-driven text input with built-in password visibility
 * toggle and ControlValueAccessor integration for reactive/template forms.
 *
 * Note: `uppercase` is a visual transform only (text-transform: uppercase)
 * — the underlying model value keeps whatever case the user typed. If a
 * consumer needs the stored value itself normalized to uppercase, that's
 * a logic change outside this component's current contract.
 */
@Component({
  selector: 'ui-text-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="ui-text-input">
      <input
        [type]="actualType"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [ngModel]="value()"
        (ngModelChange)="handleModelChange($event)"
        (blur)="onTouched()"
        class="ui-text-input__field"
        [class.ui-text-input__field--uppercase]="uppercase()"
        [class.ui-text-input__field--invalid]="invalid()"
        [attr.aria-invalid]="invalid() ? true : null" />

      <!-- Built-in Password Toggle -->
      @if (type() === 'password' && showPasswordToggle()) {
        <button
          type="button"
          class="ui-text-input__toggle"
          [attr.aria-label]="isPasswordVisible() ? 'Hide password' : 'Show password'"
          [attr.aria-pressed]="isPasswordVisible()"
          (click)="togglePassword()">
          <i [class]="isPasswordVisible() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .ui-text-input {
      position: relative;
      width: 100%;
    }

    .ui-text-input__field {
      width: 100%;
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-radius: var(--ui-border-radius);
      border: var(--ui-border-width) solid var(--input-border);
      background: var(--input-bg);
      color: var(--input-text);
      font-size: var(--font-size-md);
      font-family: var(--font-body);
      outline: none;
      transition: var(--transition-fast);
    }

    .ui-text-input__field::placeholder {
      color: var(--input-placeholder);
    }

    .ui-text-input__field:hover:not(:disabled) {
      border-color: var(--border-primary);
    }

    .ui-text-input__field:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--accent-focus);
    }

    .ui-text-input__field:disabled {
      background: var(--color-disabled);
      color: var(--color-disabled-text);
      border-color: var(--border-secondary);
      cursor: not-allowed;
    }

    .ui-text-input__field--uppercase {
      text-transform: uppercase;
    }

    .ui-text-input__field--invalid {
      border-color: var(--color-error);
      background: var(--color-error-bg);
    }

    .ui-text-input__field--invalid:focus {
      border-color: var(--color-error);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--color-error-bg);
    }

    .ui-text-input__toggle {
      position: absolute;
      right: var(--spacing-lg);
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--spacing-4xl);
      height: var(--spacing-4xl);
      padding: 0;
      border: none;
      border-radius: var(--ui-border-radius-sm);
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .ui-text-input__toggle:hover {
      color: var(--text-secondary);
      background: var(--bg-ternary);
    }

    .ui-text-input__toggle:focus-visible {
      outline: var(--focus-outline-width) solid var(--accent-primary);
      outline-offset: 1px;
    }
  `],
})
export class TextInputComponent implements ControlValueAccessor {
  type = input<TextInputType>('text');
  placeholder = input<string>('');
  uppercase = input<boolean>(false);
  showPasswordToggle = input<boolean>(false);
  /**
   * Marks the field as failing validation — applies error-state styling
   * and sets aria-invalid. Distinct from Angular Forms' own validity
   * state; pass this from the consumer's own validation logic
   * (e.g. `[invalid]="control.invalid && control.touched"`).
   */
  invalid = input<boolean>(false);

  protected value = signal<string>('');
  protected isDisabled = signal<boolean>(false);
  protected isPasswordVisible = signal<boolean>(false);

  private onChange = (value: any) => {};
  private onTouchedFn = () => {};

  get actualType(): string {
    if (this.type() === 'password') {
      return this.isPasswordVisible() ? 'text' : 'password';
    }
    return this.type();
  }

  protected onTouched = () => this.onTouchedFn();

  togglePassword(): void {
    this.isPasswordVisible.update(v => !v);
  }

  handleModelChange(val: string): void {
    this.value.set(val);
    this.onChange(val);
  }

  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}// import { Component, forwardRef, input, signal } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// @Component({
//     selector: 'ui-text-input',
//     standalone: true,
//     imports: [CommonModule, FormsModule],
//     providers: [
//         {
//             provide: NG_VALUE_ACCESSOR,
//             useExisting: forwardRef(() => TextInputComponent),
//             multi: true
//         }
//     ],
//     template: `
//     <div class="relative w-full">
//       <input 
//         [type]="actualType"
//         [placeholder]="placeholder()"
//         [disabled]="isDisabled()"
//         [ngModel]="value()"
//         (ngModelChange)="handleModelChange($event)"
//         (blur)="onTouched()"
//         class="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
//         [class.uppercase]="uppercase()"
//       />
      
//       <!-- Built-in Password Toggle -->
//       @if (type() === 'password' && showPasswordToggle()) {
//         <button 
//           type="button" 
//           class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none"
//           (click)="togglePassword()">
//           <i [class]="isPasswordVisible() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
//         </button>
//       }
//     </div>
//   `
// })
// export class TextInputComponent implements ControlValueAccessor {
//     type = input<'text' | 'password' | 'email' | 'tel'>('text');
//     placeholder = input<string>('');
//     uppercase = input<boolean>(false);
//     showPasswordToggle = input<boolean>(false);

//     value = signal<string>('');
//     isDisabled = signal<boolean>(false);
//     isPasswordVisible = signal<boolean>(false);

//     onChange = (value: any) => { };
//     onTouched = () => { };

//     get actualType(): string {
//         if (this.type() === 'password') {
//             return this.isPasswordVisible() ? 'text' : 'password';
//         }
//         return this.type();
//     }

//     togglePassword() {
//         this.isPasswordVisible.update(v => !v);
//     }

//     handleModelChange(val: string) {
//         this.value.set(val);
//         this.onChange(val);
//     }

//     writeValue(val: string): void {
//         this.value.set(val || '');
//     }

//     registerOnChange(fn: any): void {
//         this.onChange = fn;
//     }

//     registerOnTouched(fn: any): void {
//         this.onTouched = fn;
//     }

//     setDisabledState(isDisabled: boolean): void {
//         this.isDisabled.set(isDisabled);
//     }
// }
