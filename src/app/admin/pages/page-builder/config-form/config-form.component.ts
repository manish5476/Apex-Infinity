import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="space-y-5 p-1">
      
      @for (field of fields; track field.key) {
        <div class="flex flex-col gap-1.5">
          
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {{ field.label }}
              @if(field.required) { <span class="text-red-500">*</span> }
            </label>
          </div>

          @if (['string', 'number'].includes(field.type) && !field.enum) {
            <div class="relative flex items-center">
              
              @if (field.format === 'color') {
                <div class="absolute left-2 w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                     [style.background-color]="form.get(field.key)?.value"></div>
                <input type="color" [formControlName]="field.key" class="absolute inset-0 opacity-0 cursor-pointer w-8" />
              }

              <input 
                [type]="field.type === 'number' ? 'number' : 'text'" 
                [formControlName]="field.key" 
                class="ui-input" 
                [class.pl-8]="field.format === 'color'"
                [placeholder]="field.placeholder">
            </div>
          }

          @if (field.enum) {
            <div class="relative">
              <select [formControlName]="field.key" class="ui-input appearance-none">
                @for (opt of field.enum; track opt) {
                  <option [value]="opt">{{ opt | titlecase }}</option>
                }
              </select>
              <i class="pi pi-chevron-down absolute right-3 top-3 text-gray-400 text-xs pointer-events-none"></i>
            </div>
          }

          @if (field.type === 'boolean') {
            <label class="flex items-center gap-3 cursor-pointer p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="relative">
                <input type="checkbox" [formControlName]="field.key" class="sr-only peer">
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span class="text-sm font-medium text-gray-700">Enable {{ field.label }}</span>
            </label>
          }

          @if (field.type === 'array') {
            <div class="space-y-2">
              <div formArrayName="{{field.key}}">
                @for (item of getFormArray(field.key).controls; track item; let i = $index) {
                  <div [formGroupName]="i" class="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-2 relative group">
                    
                    <button type="button" (click)="removeArrayItem(field.key, i)" 
                            class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors">
                      <i class="pi pi-times"></i>
                    </button>

                    <div class="grid gap-2">
                      @for (subField of getArraySchema(field.key); track subField.key) {
                        <div>
                          <label class="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{{ subField.key }}</label>
                          
                          @if (subField.enum) {
                             <select [formControlName]="subField.key" class="ui-input-sm w-full">
                                @for (opt of subField.enum; track opt) { <option [value]="opt">{{opt}}</option> }
                             </select>
                          } @else {
                             <input type="text" [formControlName]="subField.key" class="ui-input-sm w-full" [placeholder]="subField.key">
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
              
              <button type="button" (click)="addArrayItem(field.key)" 
                      class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-xs font-bold uppercase hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                <i class="pi pi-plus"></i> Add Item
              </button>
            </div>
          }

        </div>
      }
    </form>
  `,
  styles: [`
    .ui-input {
      @apply w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all;
    }
    .ui-input-sm {
      @apply px-2 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500;
    }
  `]
})
export class ConfigFormComponent implements OnChanges {
  @Input() config: any = {};
  @Input() schema: any = {}; 
  @Output() configChange = new EventEmitter<any>();

  form: FormGroup;
  fields: any[] = [];
  fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema'] || changes['config']) {
      // Prevent rebuild loops if config matches form value
      if (JSON.stringify(this.config) !== JSON.stringify(this.form.value)) {
        this.rebuildForm();
      }
    }
  }

  rebuildForm() {
    if (!this.schema) return;

    this.fields = Object.keys(this.schema).map(key => {
      const def = this.schema[key];
      return {
        key,
        label: key.replace(/([A-Z])/g, ' $1').trim(),
        ...def,
        placeholder: def.default ? `Default: ${def.default}` : ''
      };
    });

    const group: any = {};

    this.fields.forEach(f => {
      if (f.type === 'array') {
        // Handle Arrays (e.g., ctaButtons)
        const itemSchema = f.schema || {};
        const initialData = this.config[f.key] || [];
        
        group[f.key] = this.fb.array(
          initialData.map((item: any) => this.createArrayGroup(itemSchema, item))
        );
      } else {
        // Handle Primitive Fields
        const val = this.config[f.key] !== undefined ? this.config[f.key] : (f.default ?? '');
        const validators = f.required ? [Validators.required] : [];
        group[f.key] = [val, validators];
      }
    });

    this.form = this.fb.group(group);

    // Debounce emission slightly to prevent UI flicker
    this.form.valueChanges.subscribe(val => {
      if (this.form.valid) {
        this.configChange.emit(val);
      }
    });
  }

  // --- Array Helpers ---

  getFormArray(key: string): FormArray {
    return this.form.get(key) as FormArray;
  }

  getArraySchema(key: string): any[] {
    const schemaDef = this.schema[key]?.schema || {};
    return Object.keys(schemaDef).map(k => ({ key: k, ...schemaDef[k] }));
  }

  createArrayGroup(schemaDef: any, data: any = {}) {
    const group: any = {};
    Object.keys(schemaDef).forEach(key => {
      const def = schemaDef[key];
      const val = data[key] !== undefined ? data[key] : (def.default ?? '');
      group[key] = [val];
    });
    return this.fb.group(group);
  }

  addArrayItem(key: string) {
    const schemaDef = this.schema[key]?.schema || {};
    this.getFormArray(key).push(this.createArrayGroup(schemaDef));
  }

  removeArrayItem(key: string, index: number) {
    this.getFormArray(key).removeAt(index);
  }
}