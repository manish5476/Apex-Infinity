import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ui-text-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextInputComponent),
            multi: true
        }
    ],
    template: `
    <div class="relative w-full">
      <input 
        [type]="actualType"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [ngModel]="value()"
        (ngModelChange)="handleModelChange($event)"
        (blur)="onTouched()"
        class="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
        [class.uppercase]="uppercase()"
      />
      
      <!-- Built-in Password Toggle -->
      @if (type() === 'password' && showPasswordToggle()) {
        <button 
          type="button" 
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none"
          (click)="togglePassword()">
          <i [class]="isPasswordVisible() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
        </button>
      }
    </div>
  `
})
export class TextInputComponent implements ControlValueAccessor {
    type = input<'text' | 'password' | 'email' | 'tel'>('text');
    placeholder = input<string>('');
    uppercase = input<boolean>(false);
    showPasswordToggle = input<boolean>(false);

    value = signal<string>('');
    isDisabled = signal<boolean>(false);
    isPasswordVisible = signal<boolean>(false);

    onChange = (value: any) => { };
    onTouched = () => { };

    get actualType(): string {
        if (this.type() === 'password') {
            return this.isPasswordVisible() ? 'text' : 'password';
        }
        return this.type();
    }

    togglePassword() {
        this.isPasswordVisible.update(v => !v);
    }

    handleModelChange(val: string) {
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
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }
}