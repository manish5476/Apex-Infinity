import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chips-container">
      <div class="chip" *ngFor="let tag of tags; let i = index">
        {{ tag }}
        <span class="remove" (click)="removeTag(i)">×</span>
      </div>

      <input
        class="chip-input"
        [(ngModel)]="inputValue"
        (keydown.tab)="addTag()"
        (keydown.blur)="addTag()"
        placeholder="{{ placeholder }}"
      />
    </div>
  `,
  styleUrls: [],
  styles: [`
  .chips-container {
    display: flex;
    flex-wrap: wrap;
    padding: 6px;
    border-radius: var(--border-radius);
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
    cursor: text;
    gap: 6px;
    transition: border-color 0.15s ease;
  }

  .chips-container:focus-within {
    border-color: var(--primary-color);
    box-shadow: var(--focus-ring);
  }

  .chip {
    background: var(--surface-200);
    color: var(--text-color);
    padding: 4px 10px;
    border-radius: calc(var(--border-radius) - 2px);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--surface-border);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .chip:hover {
    background: var(--surface-300);
    border-color: var(--primary-color);
  }

  .remove {
    cursor: pointer;
    font-weight: bold;
    opacity: 0.7;
    transition: color 0.2s ease, opacity 0.2s ease;
  }

  .remove:hover {
    color: var(--primary-color);
    opacity: 1;
  }

  .chip-input {
    border: none;
    outline: none;
    background: transparent;
    padding: 5px;
    min-width: 120px;
    flex: 1;
    color: var(--text-color);
    font-size: 14px;
  }

  .chip-input::placeholder {
    color: var(--text-color-secondary);
    opacity: 0.8;
  }
`]
  ,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipsComponent),
      multi: true
    }
  ]
})
export class ChipsComponent implements ControlValueAccessor {
  @Input() placeholder = 'Type and press Enter';

  tags: string[] = [];
  inputValue = '';

  // ——— CONTROL VALUE ACCESSOR ———
  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(value: any): void {
    if (Array.isArray(value)) this.tags = value;
    else if (typeof value === 'string') this.tags = value.split(',').map(v => v.trim());
    else this.tags = [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // ——— TAG METHODS ———
  addTag() {
    const val = this.inputValue.trim();
    if (val && !this.tags.includes(val)) {
      this.tags.push(val);
      this.onChange(this.tags);
    }
    this.inputValue = '';
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
    this.onChange(this.tags);
  }
}
