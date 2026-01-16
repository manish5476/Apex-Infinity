import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs'; // Modular Tabs
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    ColorPickerModule,
    ButtonModule,
    TooltipModule,
    TabsModule,
    ToggleSwitchModule
  ],
  template: `
    <form [formGroup]="form" class="form-wrapper">
      
      <p-tabs value="0">
        <p-tablist>
            <p-tab value="0">Content</p-tab>
            <p-tab value="1">Settings</p-tab>
            <p-tab value="2">Style</p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel value="0">
            <div class="panel-container">
              @if (hasField('ruleType')) {
                <div class="field-group">
                  <label class="label-heading">Data Source</label>
                  <p-select 
                    formControlName="ruleType" 
                    [options]="ruleTypeOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    appendTo="body"
                    placeholder="Select Source">
                  </p-select>
                </div>
              }

              @for (field of contentFields; track field.key) {
                <div class="field-group">
                  <label class="label-heading">{{ field.label }}</label>
                  @if (field.key === 'subtitle' || field.key === 'description') {
                    <textarea pInputTextarea [formControlName]="field.key" rows="3" class="custom-textarea"></textarea>
                  } @else {
                    <input pInputText [formControlName]="field.key" class="w-full" />
                  }
                </div>
              }

              @for (field of arrayFields; track field.key) {
                <div class="field-group mt-sm">
                  <div class="array-header">
                    <label class="label-heading primary-text">{{ field.label }}</label>
                    <span class="badge">{{ getFormArray(field.key).length }} items</span>
                  </div>

                  <div class="flex flex-col gap-md" [formArrayName]="field.key">
                    @for (item of getFormArray(field.key).controls; track item; let i = $index) {
                      <div [formGroupName]="i" class="array-card">
                        <button type="button" (click)="removeArrayItem(field.key, i)" class="delete-btn">
                          <i class="pi pi-trash"></i>
                        </button>

                        <div class="form-grid">
                          @for (subField of getArraySchema(field.key); track subField.key) {
                            <div class="flex flex-col">
                              <label class="mini-label">{{ subField.label }}</label>
                              @if (subField.enum) {
                                <p-select [formControlName]="subField.key" [options]="getOptions(subField.enum)" 
                                            optionLabel="label" optionValue="value" appendTo="body"></p-select>
                              } @else {
                                <input pInputText type="text" [formControlName]="subField.key" [placeholder]="subField.label">
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <p-button label="Add Item" icon="pi pi-plus" 
                          styleClass="p-button-outlined p-button-sm w-full mt-md add-button" 
                          (click)="addArrayItem(field.key)">
                  </p-button>
                </div>
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="1">
            <div class="panel-container">
              <div class="number-grid" *ngIf="numberFields.length > 0">
                @for (field of numberFields; track field.key) {
                  <div class="field-group">
                    <label class="label-heading">{{ field.label }}</label>
                    <p-inputNumber [formControlName]="field.key" [min]="0" [showButtons]="true" styleClass="w-full"></p-inputNumber>
                  </div>
                }
              </div>

              @for (field of enumFields; track field.key) {
                <div class="field-group">
                  <label class="label-heading">{{ field.label }}</label>
                  @if (field.key === 'textAlign' || field.key === 'alignment') {
                    <div class="align-group">
                      @for (opt of alignOptions; track opt.value) {
                        <button type="button" (click)="form.get(field.key)?.setValue(opt.value)"
                                class="align-btn"
                                [class.active]="form.get(field.key)?.value === opt.value">
                          <i [class]="'pi ' + opt.icon"></i>
                        </button>
                      }
                    </div>
                  } @else {
                    <p-select [options]="getOptions(field.enum)" optionLabel="label" optionValue="value" 
                                [formControlName]="field.key" appendTo="body"></p-select>
                  }
                </div>
              }

              @if (booleanFields.length > 0) {
                <div class="toggle-list">
                  @for (field of booleanFields; track field.key) {
                    <div class="toggle-item" (click)="toggleSwitch(field.key)">
                      <label class="toggle-label">{{ field.label }}</label>
                      <p-toggleSwitch [formControlName]="field.key"></p-toggleSwitch>
                    </div>
                  }
                </div>
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="2">
            <div class="panel-container">
              @for (field of colorFields; track field.key) {
                <div class="color-picker-row">
                  <label class="toggle-label">{{ field.label }}</label>
                  <div class="color-controls">
                    <span class="mono-badge">{{ form.get(field.key)?.value || '#—' }}</span>
                    <p-colorPicker appendTo="body" [formControlName]="field.key"></p-colorPicker>
                  </div>
                </div>
              }

              @if (hasField('backgroundImage')) {
                <div class="field-group mt-lg">
                  <label class="label-heading">Background Image</label>
                  <input pInputText formControlName="backgroundImage" placeholder="https://..." class="w-full" />
                  @if (form.get('backgroundImage')?.value) {
                    <div class="image-preview" [style.background-image]="'url(' + form.get('backgroundImage')?.value + ')'"></div>
                  }
                </div>
              }
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

    </form>
  `,
  styles: [`
    :host { 
        display: block; 
        height: 100%; 
        font-family: var(--font-body);
    }

    .form-wrapper {
        background: white;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    /* Token-Based Scoped Styles */
    .panel-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
        padding: var(--spacing-sm);
    }

    .label-heading {
        font-family: var(--font-heading);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8; /* Slate 400 */
        margin-bottom: var(--spacing-sm);
        display: block;
    }

    .field-group { margin-bottom: var(--spacing-md); }

    .array-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
    }

    .array-card {
        padding: var(--spacing-lg);
        background: #f8fafc; /* Slate 50 */
        border: var(--ui-border-width) solid #e2e8f0;
        border-radius: var(--ui-border-radius-lg);
        position: relative;
        transition: var(--transition-base);
    }

    .array-card:hover {
        border-color: #3b82f6;
        box-shadow: var(--shadow-sm);
    }

    .badge {
        font-size: var(--font-size-xs);
        background: #f1f5f9;
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--ui-border-radius-sm);
        font-weight: var(--font-weight-bold);
    }

    .delete-btn {
        position: absolute;
        top: var(--spacing-md);
        right: var(--spacing-md);
        color: #94a3b8;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: var(--transition-fast);
    }

    .delete-btn:hover { color: #ef4444; }

    .form-grid {
        display: grid;
        gap: var(--spacing-lg);
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .mini-label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: var(--spacing-xs);
    }

    .toggle-list {
        background: #f8fafc;
        padding: var(--spacing-lg);
        border-radius: var(--ui-border-radius-xl);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
    }

    .toggle-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    }

    .toggle-label {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
        color: #334155;
    }

    .align-group {
        display: flex;
        border: var(--ui-border-width) solid #e2e8f0;
        border-radius: var(--ui-border-radius);
        overflow: hidden;
    }

    .align-btn {
        flex: 1;
        padding: var(--spacing-md);
        background: white;
        border: none;
        cursor: pointer;
        transition: var(--transition-colors);
    }

    .align-btn.active {
        background: #eff6ff;
        color: #2563eb;
    }

    .color-picker-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-lg);
        border: var(--ui-border-width) solid #e2e8f0;
        border-radius: var(--ui-border-radius-lg);
    }

    .mono-badge {
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        color: #64748b;
    }

    .color-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }

    .image-preview {
        margin-top: var(--spacing-md);
        height: 120px;
        border-radius: var(--ui-border-radius-lg);
        background-size: cover;
        background-position: center;
        border: var(--ui-border-width) solid #e2e8f0;
        box-shadow: var(--shadow-xs);
    }

    /* PrimeNG Customization via Tokens */
    :host ::ng-deep {
        .p-tablist-tab-list { border-bottom: 1px solid #f1f5f9; }
        .p-tab { 
            font-size: var(--font-size-sm); 
            padding: var(--spacing-lg); 
            font-weight: var(--font-weight-semibold);
        }
        .p-tabpanels {
            padding: var(--spacing-xl) var(--spacing-md);
            overflow-y: auto;
        }
        .p-inputtext, .p-select, .p-inputnumber {
            font-size: var(--font-size-base);
            width: 100%;
        }
    }
  `]
})
export class ConfigFormComponent implements OnChanges {
  // Logic remains mostly the same, ensuring UI matches the new schema
  // ... (keep your existing class logic for rebuildForm, addArrayItem, etc.)
  
  @Input() config: any = {};
  @Input() schema: any = {}; 
  @Output() configChange = new EventEmitter<any>();

  form: FormGroup;
  fb = inject(FormBuilder);

  contentFields: any[] = [];
  numberFields: any[] = [];
  booleanFields: any[] = [];
  enumFields: any[] = [];
  colorFields: any[] = [];
  arrayFields: any[] = [];

  ruleTypeOptions = [
    { label: '🔥 Best Sellers', value: 'best_sellers' },
    { label: '✨ New Arrivals', value: 'new_arrivals' },
    { label: '📈 Trending Now', value: 'trending' },
    { label: '🏷️ Clearance Sale', value: 'clearance_sale' },
    { label: '🛠️ Custom Query', value: 'custom_query' }
  ];

  alignOptions = [
    { label: 'Left', value: 'left', icon: 'pi-align-left' },
    { label: 'Center', value: 'center', icon: 'pi-align-center' },
    { label: 'Right', value: 'right', icon: 'pi-align-right' }
  ];

  constructor() {
    this.form = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema'] || changes['config']) {
      if (this.schema && (changes['schema'] || !this.form.controls['title'])) {
        this.rebuildForm();
      } else if (this.config) {
        this.form.patchValue(this.config, { emitEvent: false });
      }
    }
  }

  rebuildForm() {
    this.contentFields = [];
    this.numberFields = [];
    this.booleanFields = [];
    this.enumFields = [];
    this.colorFields = [];
    this.arrayFields = [];

    const keys = new Set([...Object.keys(this.schema || {}), ...Object.keys(this.config || {})]);
    const group: any = {};

    keys.forEach(key => {
      if (key === 'ruleType' || key === 'backgroundImage') { 
        group[key] = [this.config[key] ?? this.schema?.[key]?.default ?? null];
        return; 
      }

      const def = this.schema?.[key] || {};
      const type = def.type || typeof this.config[key];
      const field = { key, label: this.formatLabel(key), ...def };

      if (type === 'array') {
        this.arrayFields.push(field);
        const itemSchema = def.schema || {};
        const initialData = this.config[key] || [];
        group[key] = this.fb.array(
          initialData.map((item: any) => this.createArrayGroup(itemSchema, item))
        );
      } 
      else {
        const val = this.config[key] !== undefined ? this.config[key] : (def.default ?? null);
        group[key] = [val];

        if (type === 'boolean') {
          this.booleanFields.push(field);
        } else if (type === 'number') {
          this.numberFields.push(field);
        } else if (def.enum || (Array.isArray(def.type) && def.type.includes('string'))) {
          this.enumFields.push(field);
        } else if (key.toLowerCase().includes('color')) {
          this.colorFields.push(field);
        } else {
          this.contentFields.push(field);
        }
      }
    });

    this.form = this.fb.group(group);
    this.form.valueChanges.subscribe(val => {
      if(this.form.valid) this.configChange.emit(val);
    });
  }

  getFormArray(key: string): FormArray {
    return this.form.get(key) as FormArray;
  }

  getArraySchema(key: string): any[] {
    const schemaDef = this.schema[key]?.schema || {};
    return Object.keys(schemaDef).map(k => ({ 
      key: k, 
      label: this.formatLabel(k),
      ...schemaDef[k]
    }));
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

  hasField(key: string): boolean { return this.form.contains(key); }
  formatLabel(key: string): string { return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(); }
  getOptions(enumArr: string[]) { return enumArr.map(opt => ({ label: this.formatLabel(opt), value: opt })); }
  toggleSwitch(key: string) {
    const ctrl = this.form.get(key);
    ctrl?.setValue(!ctrl.value);
  }
}
