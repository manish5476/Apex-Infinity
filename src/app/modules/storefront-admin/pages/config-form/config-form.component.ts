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
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';

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
    <form [formGroup]="form" class="config-form">
      
      <p-tabs value="0" class="custom-tabs">
        <p-tablist>
            <p-tab value="0">Content</p-tab>
            <p-tab value="1">Settings</p-tab>
            <p-tab value="2">Style</p-tab>
        </p-tablist>

        <p-tabpanels class="custom-scrollbar">
          
          <p-tabpanel value="0">
            <div class="panel-inner">
              
              @if (hasField('ruleType') || hasField('sourceType')) {
                <div class="data-source-card">
                  <label class="label-heading highlight">Data Source</label>
                  
                  <p-select 
                    formControlName="sourceType" 
                    [options]="sourceTypeOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    appendTo="body">
                  </p-select>

                  @if (form.get('sourceType')?.value === 'rule') {
                    <div class="sub-field">
                      <label class="mini-label">Smart Rule</label>
                      <p-select 
                        formControlName="ruleType" 
                        [options]="ruleTypeOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        appendTo="body">
                      </p-select>
                    </div>
                  }

                  @if (['brand', 'category'].includes(form.get('sourceType')?.value)) {
                    <div class="sub-field">
                      <label class="mini-label">
                        Enter {{ form.get('sourceType')?.value | titlecase }} Name
                      </label>
                      <input pInputText formControlName="sourceValue" 
                             [placeholder]="'e.g. ' + (form.get('sourceType')?.value === 'brand' ? 'Samsung' : 'Laptops')" />
                    </div>
                  }
                </div>
              }

              @for (field of contentFields; track field.key) {
                <div class="field-container">
                  <label class="label-heading">{{ field.label }}</label>
                  @if (field.key === 'subtitle' || field.key === 'description') {
                    <textarea pInputTextarea [formControlName]="field.key" rows="3" class="compact-textarea"></textarea>
                  } @else {
                    <input pInputText [formControlName]="field.key" />
                  }
                </div>
              }

              @for (field of arrayFields; track field.key) {
                <div class="array-section">
                  <div class="array-header">
                    <label class="label-heading">{{ field.label }}</label>
                    <span class="count-badge">{{ getFormArray(field.key).length }} items</span>
                  </div>

                  <div class="array-list" [formArrayName]="field.key">
                    @for (item of getFormArray(field.key).controls; track item; let i = $index) {
                      <div [formGroupName]="i" class="array-card">
                        <button type="button" (click)="removeArrayItem(field.key, i)" class="remove-btn">
                          <i class="pi pi-times"></i>
                        </button>

                        <div class="array-grid">
                          @for (subField of getArraySchema(field.key); track subField.key) {
                            <div class="sub-field">
                              <label class="mini-label">{{ subField.label }}</label>
                              @if (subField.enum) {
                                <p-select [formControlName]="subField.key" [options]="getOptions(subField.enum)" 
                                            optionLabel="label" optionValue="value" appendTo="body"></p-select>
                              } @else {
                                <input pInputText [formControlName]="subField.key" [placeholder]="subField.label">
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <p-button label="Add Item" icon="pi pi-plus" 
                          styleClass="p-button-outlined p-button-sm add-btn" 
                          (click)="addArrayItem(field.key)">
                  </p-button>
                </div>
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="1">
            <div class="panel-inner">
              <div class="number-grid" *ngIf="numberFields.length > 0">
                @for (field of numberFields; track field.key) {
                  <div class="field-container">
                    <label class="label-heading">{{ field.label }}</label>
                    <p-inputNumber [formControlName]="field.key" [min]="0" [showButtons]="true" styleClass="w-full"></p-inputNumber>
                  </div>
                }
              </div>

              @for (field of enumFields; track field.key) {
                <div class="field-container">
                  <label class="label-heading">{{ field.label }}</label>
                  @if (field.key === 'textAlign' || field.key === 'alignment') {
                    <div class="alignment-picker">
                      @for (opt of alignOptions; track opt.value) {
                        <button type="button" (click)="form.get(field.key)?.setValue(opt.value)"
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
                <div class="boolean-group">
                  @for (field of booleanFields; track field.key) {
                    <div class="toggle-row" (click)="toggleSwitch(field.key)">
                      <label class="toggle-label">{{ field.label }}</label>
                      <p-toggleswitch [formControlName]="field.key"></p-toggleswitch>
                    </div>
                  }
                </div>
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="2">
            <div class="panel-inner">
              @for (field of colorFields; track field.key) {
                <div class="color-row">
                  <label class="toggle-label">{{ field.label }}</label>
                  <div class="color-picker-box">
                    <span class="mono-text">{{ form.get(field.key)?.value || 'N/A' }}</span>
                    <p-colorPicker [formControlName]="field.key" appendTo="body"></p-colorPicker>
                  </div>
                </div>
              }

              @if (hasField('backgroundImage')) {
                <div class="field-container mt-lg">
                  <label class="label-heading">Background Image</label>
                  <input pInputText formControlName="backgroundImage" placeholder="URL..." />
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
    :host { display: block; height: 100%; font-family: var(--font-body); }

    .config-form { 
      height: 100%; 
      background: white; 
      display: flex; 
      flex-direction: column; 
    }

    /* Token-based Panel Styling */
    .panel-inner { 
      padding: var(--spacing-xl); 
      display: flex; 
      flex-direction: column; 
      gap: var(--spacing-xl); 
    }

    .label-heading {
      font-family: var(--font-heading);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: #94a3b8; /* Slate 400 */
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: var(--spacing-sm);
    }
    
    .label-heading.highlight { color: #3b82f6; }
    .mini-label { font-size: var(--font-size-xs); color: #64748b; font-weight: var(--font-weight-medium); }
    .mono-text { font-family: var(--font-mono); font-size: var(--font-size-xs); color: #94a3b8; }

    /* Inputs & Containers */
    .field-container { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    
    .data-source-card {
      padding: var(--spacing-xl);
      background: #f8fafc;
      border: var(--ui-border-width) solid #e2e8f0;
      border-radius: var(--ui-border-radius-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .sub-field { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-top: var(--spacing-xs); }

    .array-card {
      padding: var(--spacing-lg);
      background: white;
      border: var(--ui-border-width) solid #e2e8f0;
      border-radius: var(--ui-border-radius);
      box-shadow: var(--shadow-sm);
      position: relative;
      margin-bottom: var(--spacing-md);
    }

    .remove-btn {
      position: absolute;
      top: var(--spacing-sm);
      right: var(--spacing-sm);
      background: transparent;
      border: none;
      color: #cbd5e1;
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .remove-btn:hover { color: #ef4444; }

    .array-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }

    .boolean-group {
      background: #f8fafc;
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      border: var(--ui-border-width) solid #f1f5f9;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) 0;
      cursor: pointer;
    }

    .toggle-label { font-size: var(--font-size-base); color: #334155; }

    .alignment-picker {
      display: flex;
      border: var(--ui-border-width) solid #e2e8f0;
      border-radius: var(--ui-border-radius);
      overflow: hidden;
    }

    .alignment-picker button {
      flex: 1;
      padding: var(--spacing-md);
      background: white;
      border: none;
      border-right: var(--ui-border-width) solid #f1f5f9;
      cursor: pointer;
    }

    .alignment-picker button.active { background: #eff6ff; color: #3b82f6; }

    .color-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border: var(--ui-border-width) solid #e2e8f0;
      border-radius: var(--ui-border-radius-lg);
    }

    .image-preview {
      height: 100px;
      margin-top: var(--spacing-md);
      border-radius: var(--ui-border-radius);
      background-size: cover;
      background-position: center;
      border: var(--ui-border-width) solid #e2e8f0;
      box-shadow: var(--shadow-xs);
    }

    /* PrimeNG Modular Overrides */
    :host ::ng-deep {
      .p-tablist-tab-list { border-bottom: 1px solid #f1f5f9; }
      .p-tab { 
        padding: var(--spacing-xl); 
        font-size: var(--font-size-sm); 
        font-weight: var(--font-weight-semibold); 
      }
      .p-tabpanels { padding: 0; }
      .p-inputtext, .p-select { width: 100%; font-size: var(--font-size-base); }
    }
  `]
})
export class ConfigFormComponent implements OnChanges {
  // ... Logic remains consistent with your previous version ...
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

  sourceTypeOptions = [
    { label: '⚡ Smart Rule', value: 'rule' },
    { label: '🏷️ Brand', value: 'brand' },
    { label: '📂 Category', value: 'category' }
  ];

  ruleTypeOptions = [
    { label: '🔥 Best Sellers', value: 'best_sellers' },
    { label: '✨ New Arrivals', value: 'new_arrivals' },
    { label: '📈 Trending', value: 'trending' }
  ];

  alignOptions = [
    { label: 'Left', value: 'left', icon: 'pi-align-left' },
    { label: 'Center', value: 'center', icon: 'pi-align-center' },
    { label: 'Right', value: 'right', icon: 'pi-align-right' }
  ];

  constructor() { this.form = this.fb.group({}); }

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
      if (['ruleType', 'sourceType', 'sourceValue', 'backgroundImage'].includes(key)) {
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
        group[key] = this.fb.array(initialData.map((item: any) => this.createArrayGroup(itemSchema, item)));
      } else {
        group[key] = [this.config[key] ?? def.default ?? null];
        if (type === 'boolean') this.booleanFields.push(field);
        else if (type === 'number') this.numberFields.push(field);
        else if (def.enum) this.enumFields.push(field);
        else if (key.toLowerCase().includes('color')) this.colorFields.push(field);
        else this.contentFields.push(field);
      }
    });

    this.form = this.fb.group(group);
    this.form.valueChanges.subscribe(val => { if(this.form.valid) this.configChange.emit(val); });
  }

  getFormArray(key: string): FormArray { return this.form.get(key) as FormArray; }
  getArraySchema(key: string): any[] {
    const schemaDef = this.schema[key]?.schema || {};
    return Object.keys(schemaDef).map(k => ({ key: k, label: this.formatLabel(k), ...schemaDef[k] }));
  }
  createArrayGroup(schemaDef: any, data: any = {}) {
    const group: any = {};
    Object.keys(schemaDef).forEach(k => group[k] = [data[k] ?? schemaDef[k].default ?? '']);
    return this.fb.group(group);
  }
  addArrayItem(key: string) { this.getFormArray(key).push(this.createArrayGroup(this.schema[key]?.schema || {})); }
  removeArrayItem(key: string, index: number) { this.getFormArray(key).removeAt(index); }
  hasField(key: string): boolean { return this.form.contains(key); }
  formatLabel(key: string): string { return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(); }
  getOptions(enumArr: string[]) { return enumArr.map(opt => ({ label: this.formatLabel(opt), value: opt })); }
  toggleSwitch(key: string) { this.form.get(key)?.setValue(!this.form.get(key)?.value); }
}

// import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

// // PrimeNG Imports
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { AccordionModule } from 'primeng/accordion';
// import { SelectModule } from 'primeng/select';

// @Component({
//   selector: 'app-config-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     InputTextModule,
//     InputNumberModule,
//     SelectModule,
//     TextareaModule,
//     ColorPickerModule,
//     ButtonModule,
//     TooltipModule,
//     TabsModule,
//     ToggleSwitchModule,
//     AccordionModule
//   ],
//   template: `
//     <form [formGroup]="form" class="h-full flex flex-col bg-white">
      
//       <p-tabs value="0" styleClass="h-full flex flex-col">
//         <p-tablist>
//             <p-tab value="0" class="flex-1 text-center text-sm font-semibold">Content</p-tab>
//             <p-tab value="1" class="flex-1 text-center text-sm font-semibold">Settings</p-tab>
//             <p-tab value="2" class="flex-1 text-center text-sm font-semibold">Style</p-tab>
//         </p-tablist>

//         <p-tabpanels class="flex-1 overflow-y-auto custom-scrollbar p-0">
          
//           <p-tabpanel value="0">
//             <div class="flex flex-col gap-5 p-4">
              
//               @if (hasField('ruleType') || hasField('sourceType')) {
//                 <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
//                   <label class="label-heading text-blue-600">Data Source</label>
                  
//                   <p-select 
//                     formControlName="sourceType" 
//                     [options]="sourceTypeOptions" 
//                     optionLabel="label" 
//                     optionValue="value" 
//                     styleClass="w-full"
//                     placeholder="Select Source">
//                   </p-select>

//                   @if (form.get('sourceType')?.value === 'rule') {
//                     <div class="flex flex-col gap-1">
//                       <label class="text-xs text-slate-500 font-medium">Smart Rule</label>
//                       <p-select 
//                         formControlName="ruleType" 
//                         [options]="ruleTypeOptions" 
//                         optionLabel="label" 
//                         optionValue="value" 
//                         styleClass="w-full"
//                         appendTo="body">
//                       </p-select>
//                     </div>
//                   }

//                   @if (['brand', 'category'].includes(form.get('sourceType')?.value)) {
//                     <div class="flex flex-col gap-1">
//                       <label class="text-xs text-slate-500 font-medium">
//                         Enter {{ form.get('sourceType')?.value | titlecase }} Name
//                       </label>
//                       <input pInputText formControlName="sourceValue" 
//                              class="w-full text-sm" 
//                              [placeholder]="'e.g. ' + (form.get('sourceType')?.value === 'brand' ? 'Samsung' : 'Laptops')" />
//                       <small class="text-[10px] text-slate-400">Must match exact name in inventory</small>
//                     </div>
//                   }
//                 </div>
//               }

//               @for (field of contentFields; track field.key) {
//                 <div class="flex flex-col gap-1.5">
//                   <label class="label-heading">{{ field.label }}</label>
//                   @if (field.key === 'subtitle' || field.key === 'description') {
//                     <textarea pInputTextarea [formControlName]="field.key" rows="3" class="w-full text-sm resize-none border-gray-300 rounded-md"></textarea>
//                   } @else {
//                     <input pInputText [formControlName]="field.key" class="w-full p-inputtext-sm" />
//                   }
//                 </div>
//               }

//               @for (field of arrayFields; track field.key) {
//                 <div class="mt-2 border-t border-slate-100 pt-4">
//                   <div class="flex justify-between items-center mb-3">
//                     <label class="label-heading">{{ field.label }}</label>
//                     <span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{{ getFormArray(field.key).length }} items</span>
//                   </div>

//                   <div class="flex flex-col gap-3" [formArrayName]="field.key">
//                     @for (item of getFormArray(field.key).controls; track item; let i = $index) {
//                       <div [formGroupName]="i" class="p-3 bg-white border border-slate-200 rounded-lg shadow-sm relative group">
//                         <button type="button" (click)="removeArrayItem(field.key, i)" 
//                                 class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-full transition-colors z-10">
//                           <i class="pi pi-times text-xs"></i>
//                         </button>

//                         <div class="grid gap-3">
//                           @for (subField of getArraySchema(field.key); track subField.key) {
//                             <div>
//                               <label class="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{{ subField.label }}</label>
//                               @if (subField.enum) {
//                                 <p-select [formControlName]="subField.key" [options]="getOptions(subField.enum)" 
//                                             optionLabel="label" optionValue="value" styleClass="w-full text-xs" appendTo="body"></p-select>
//                               } @else {
//                                 <input pInputText [formControlName]="subField.key" class="w-full p-inputtext-sm" [placeholder]="subField.label">
//                               }
//                             </div>
//                           }
//                         </div>
//                       </div>
//                     }
//                   </div>

//                   <button pButton type="button" label="Add Item" icon="pi pi-plus" 
//                           class="p-button-outlined p-button-sm w-full mt-3 text-xs border-slate-300 text-slate-600 hover:bg-slate-50" 
//                           (click)="addArrayItem(field.key)">
//                   </button>
//                 </div>
//               }
//             </div>
//           </p-tabpanel>

//           <p-tabpanel value="1">
//             <div class="flex flex-col gap-6 p-4">
              
//               <div class="grid grid-cols-2 gap-4" *ngIf="numberFields.length > 0">
//                 @for (field of numberFields; track field.key) {
//                   <div>
//                     <label class="label-heading mb-1 block">{{ field.label }}</label>
//                     <p-inputNumber [formControlName]="field.key" [min]="0" [showButtons]="true" 
//                                    styleClass="w-full" inputStyleClass="w-full text-sm"></p-inputNumber>
//                   </div>
//                 }
//               </div>

//               @for (field of enumFields; track field.key) {
//                 <div class="flex flex-col gap-1.5">
//                   <label class="label-heading">{{ field.label }}</label>
                  
//                   @if (field.key === 'textAlign' || field.key === 'alignment') {
//                     <div class="flex border border-slate-200 rounded-md overflow-hidden">
//                       @for (opt of alignOptions; track opt.value) {
//                         <button type="button" (click)="form.get(field.key)?.setValue(opt.value)"
//                                 class="flex-1 py-2 hover:bg-slate-50 transition-colors border-r last:border-r-0 border-slate-100"
//                                 [class.bg-blue-50]="form.get(field.key)?.value === opt.value"
//                                 [class.text-blue-600]="form.get(field.key)?.value === opt.value">
//                           <i [class]="'pi ' + opt.icon"></i>
//                         </button>
//                       }
//                     </div>
//                   } @else {
//                     <p-select [options]="getOptions(field.enum)" optionLabel="label" optionValue="value" 
//                                 [formControlName]="field.key" styleClass="w-full" appendTo="body"></p-select>
//                   }
//                 </div>
//               }

//               @if (booleanFields.length > 0) {
//                 <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-4">
//                   @for (field of booleanFields; track field.key) {
//                     <div class="flex justify-between items-center cursor-pointer" (click)="toggleSwitch(field.key)">
//                       <label class="text-sm text-slate-700 font-medium cursor-pointer select-none">{{ field.label }}</label>
//                       <p-toggleswitch [formControlName]="field.key"></p-toggleswitch>
//                     </div>
//                   }
//                 </div>
//               }
//             </div>
//           </p-tabpanel>

//           <p-tabpanel value="2">
//             <div class="flex flex-col gap-5 p-4">
              
//               @for (field of colorFields; track field.key) {
//                 <div class="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
//                   <label class="text-sm font-medium text-slate-700">{{ field.label }}</label>
//                   <div class="flex items-center gap-3">
//                     <span class="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{{ form.get(field.key)?.value || 'Transparent' }}</span>
//                     <p-colorPicker [formControlName]="field.key" appendTo="body"></p-colorPicker>
//                   </div>
//                 </div>
//               }

//               @if (hasField('backgroundImage')) {
//                 <div class="flex flex-col gap-2 mt-2">
//                   <label class="label-heading">Background Image</label>
//                   <div class="p-inputgroup">
//                     <span class="p-inputgroup-addon bg-slate-50 border-r-0"><i class="pi pi-image text-slate-400"></i></span>
//                     <input pInputText formControlName="backgroundImage" placeholder="https://..." class="p-inputtext-sm" />
//                   </div>
                  
//                   @if (form.get('backgroundImage')?.value) {
//                     <div class="mt-2 h-32 w-full rounded-lg bg-cover bg-center border border-slate-200 shadow-inner relative group overflow-hidden">
//                       <div class="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
//                         Preview
//                       </div>
//                       <div class="w-full h-full" [style.background-image]="'url(' + form.get('backgroundImage')?.value + ')'"></div>
//                     </div>
//                   }
//                 </div>
//               }

//               @if (colorFields.length === 0 && !hasField('backgroundImage')) {
//                 <div class="flex flex-col items-center justify-center py-12 text-center">
//                   <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
//                     <i class="pi pi-palette text-slate-300 text-xl"></i>
//                   </div>
//                   <p class="text-slate-400 text-sm">No specific styles available.</p>
//                 </div>
//               }
//             </div>
//           </p-tabpanel>

//         </p-tabpanels>
//       </p-tabs>
//     </form>
//   `,
//   styles: [`
//     :host { display: block; height: 100%; }
    
//     .label-heading {
//       @apply text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block;
//     }

//     /* PrimeNG Overrides for Professional Look */
//     :host ::ng-deep {
//       .p-tablist-tab-list { border-bottom: 1px solid #f1f5f9; background: #fff; }
//       .p-tab { padding: 1rem; color: #64748b; transition: all 0.2s; }
//       .p-tab-active { color: #0f172a; border-bottom: 2px solid #0f172a; }
      
//       .p-inputtext, .p-select, .p-inputnumber-input { 
//         font-size: 0.875rem; 
//         border-color: #e2e8f0; 
//         border-radius: 0.5rem;
//       }
//       .p-inputtext:focus, .p-select:not(.p-disabled).p-focus {
//         border-color: #3b82f6;
//         box-shadow: 0 0 0 1px #3b82f6;
//       }
//     }
//   `]
// })
// export class ConfigFormComponent implements OnChanges {
//   @Input() config: any = {};
//   @Input() schema: any = {}; 
//   @Output() configChange = new EventEmitter<any>();

//   form: FormGroup;
//   fb = inject(FormBuilder);

//   // Field Buckets
//   contentFields: any[] = [];
//   numberFields: any[] = [];
//   booleanFields: any[] = [];
//   enumFields: any[] = [];
//   colorFields: any[] = [];
//   arrayFields: any[] = [];

//   // Options
//   sourceTypeOptions = [
//     { label: '⚡ Smart Rule (Auto)', value: 'rule' },
//     { label: '🏷️ Specific Brand', value: 'brand' },
//     { label: '📂 Specific Category', value: 'category' }
//   ];

//   ruleTypeOptions = [
//     { label: '🔥 Best Sellers', value: 'best_sellers' },
//     { label: '✨ New Arrivals', value: 'new_arrivals' },
//     { label: '📈 Trending', value: 'trending' },
//     { label: '🏷️ On Sale', value: 'clearance_sale' },
//     { label: '🛠️ Custom', value: 'custom_query' }
//   ];

//   alignOptions = [
//     { label: 'Left', value: 'left', icon: 'pi-align-left' },
//     { label: 'Center', value: 'center', icon: 'pi-align-center' },
//     { label: 'Right', value: 'right', icon: 'pi-align-right' }
//   ];

//   constructor() {
//     this.form = this.fb.group({});
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['schema'] || changes['config']) {
//       // Rebuild if schema changes or controls missing
//       if (this.schema && (changes['schema'] || !this.form.controls['title'])) {
//         this.rebuildForm();
//       } else if (this.config) {
//         this.form.patchValue(this.config, { emitEvent: false });
//       }
//     }
//   }

//   rebuildForm() {
//     // Reset Buckets
//     this.contentFields = [];
//     this.numberFields = [];
//     this.booleanFields = [];
//     this.enumFields = [];
//     this.colorFields = [];
//     this.arrayFields = [];

//     // Gather keys from Schema AND Config (to handle legacy/ad-hoc data)
//     const keys = new Set([...Object.keys(this.schema || {}), ...Object.keys(this.config || {})]);
//     const group: any = {};

//     keys.forEach(key => {
//       // 1. Handle Special Manual Fields
//       if (['ruleType', 'sourceType', 'sourceValue', 'backgroundImage'].includes(key)) {
//         group[key] = [this.config[key] ?? this.schema?.[key]?.default ?? null];
//         return; // Don't auto-generate UI, we handle these manually in template
//       }

//       const def = this.schema?.[key] || {};
//       const type = def.type || typeof this.config[key];
//       const field = { key, label: this.formatLabel(key), ...def };

//       // 2. Build Form Control
//       if (type === 'array') {
//         this.arrayFields.push(field);
//         const itemSchema = def.schema || {};
//         const initialData = this.config[key] || [];
//         group[key] = this.fb.array(
//           initialData.map((item: any) => this.createArrayGroup(itemSchema, item))
//         );
//       } 
//       else {
//         const val = this.config[key] !== undefined ? this.config[key] : (def.default ?? null);
//         group[key] = [val];

//         // 3. Categorize for Tabs
//         if (type === 'boolean') {
//           this.booleanFields.push(field);
//         } else if (type === 'number') {
//           this.numberFields.push(field);
//         } else if (def.enum || (Array.isArray(def.type) && def.type.includes('string'))) {
//           this.enumFields.push(field);
//         } else if (key.toLowerCase().includes('color')) {
//           this.colorFields.push(field);
//         } else {
//           this.contentFields.push(field);
//         }
//       }
//     });

//     // Ensure manual fields exist even if not in schema
//     if (!group['sourceType']) group['sourceType'] = [this.config.sourceType || 'rule'];
//     if (!group['ruleType']) group['ruleType'] = [this.config.ruleType];
//     if (!group['sourceValue']) group['sourceValue'] = [this.config.sourceValue];
//     if (!group['backgroundImage']) group['backgroundImage'] = [this.config.backgroundImage];

//     this.form = this.fb.group(group);

//     this.form.valueChanges.subscribe(val => {
//       if(this.form.valid) this.configChange.emit(val);
//     });
//   }

//   // --- Array Logic ---
//   getFormArray(key: string): FormArray {
//     return this.form.get(key) as FormArray;
//   }

//   getArraySchema(key: string): any[] {
//     const schemaDef = this.schema[key]?.schema || {};
//     return Object.keys(schemaDef).map(k => ({ 
//       key: k, 
//       label: this.formatLabel(k),
//       ...schemaDef[k]
//     }));
//   }

//   createArrayGroup(schemaDef: any, data: any = {}) {
//     const group: any = {};
//     Object.keys(schemaDef).forEach(key => {
//       const def = schemaDef[key];
//       const val = data[key] !== undefined ? data[key] : (def.default ?? '');
//       group[key] = [val];
//     });
//     return this.fb.group(group);
//   }

//   addArrayItem(key: string) {
//     const schemaDef = this.schema[key]?.schema || {};
//     this.getFormArray(key).push(this.createArrayGroup(schemaDef));
//   }

//   removeArrayItem(key: string, index: number) {
//     this.getFormArray(key).removeAt(index);
//   }

//   // --- Helpers ---
//   hasField(key: string): boolean { return this.form.contains(key); }
  
//   formatLabel(key: string): string {
//     return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
//   }

//   getOptions(enumArr: string[]) {
//     return enumArr.map(opt => ({ label: this.formatLabel(opt), value: opt }));
//   }

//   toggleSwitch(key: string) {
//     const ctrl = this.form.get(key);
//     ctrl?.setValue(!ctrl.value);
//   }
// }

// // import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';

// // // PrimeNG Imports
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { TextareaModule } from 'primeng/textarea';
// // import { ColorPickerModule } from 'primeng/colorpicker';
// // import { ButtonModule } from 'primeng/button';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { SelectModule } from 'primeng/select';
// // import { TabsModule } from 'primeng/tabs'; // Modular Tabs
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';

// // @Component({
// //   selector: 'app-config-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     SelectModule,
// //     TextareaModule,
// //     ColorPickerModule,
// //     ButtonModule,
// //     TooltipModule,
// //     TabsModule,
// //     ToggleSwitchModule
// //   ],
// //   template: `
// //     <form [formGroup]="form" class="form-wrapper">
      
// //       <p-tabs value="0">
// //         <p-tablist>
// //             <p-tab value="0">Content</p-tab>
// //             <p-tab value="1">Settings</p-tab>
// //             <p-tab value="2">Style</p-tab>
// //         </p-tablist>

// //         <p-tabpanels>
// //           <p-tabpanel value="0">
// //             <div class="panel-container">
// //               @if (hasField('ruleType')) {
// //                 <div class="field-group">
// //                   <label class="label-heading">Data Source</label>
// //                   <p-select 
// //                     formControlName="ruleType" 
// //                     [options]="ruleTypeOptions" 
// //                     optionLabel="label" 
// //                     optionValue="value" 
// //                     appendTo="body"
// //                     placeholder="Select Source">
// //                   </p-select>
// //                 </div>
// //               }

// //               @for (field of contentFields; track field.key) {
// //                 <div class="field-group">
// //                   <label class="label-heading">{{ field.label }}</label>
// //                   @if (field.key === 'subtitle' || field.key === 'description') {
// //                     <textarea pInputTextarea [formControlName]="field.key" rows="3" class="custom-textarea"></textarea>
// //                   } @else {
// //                     <input pInputText [formControlName]="field.key" class="w-full" />
// //                   }
// //                 </div>
// //               }

// //               @for (field of arrayFields; track field.key) {
// //                 <div class="field-group mt-sm">
// //                   <div class="array-header">
// //                     <label class="label-heading primary-text">{{ field.label }}</label>
// //                     <span class="badge">{{ getFormArray(field.key).length }} items</span>
// //                   </div>

// //                   <div class="flex flex-col gap-md" [formArrayName]="field.key">
// //                     @for (item of getFormArray(field.key).controls; track item; let i = $index) {
// //                       <div [formGroupName]="i" class="array-card">
// //                         <button type="button" (click)="removeArrayItem(field.key, i)" class="delete-btn">
// //                           <i class="pi pi-trash"></i>
// //                         </button>

// //                         <div class="form-grid">
// //                           @for (subField of getArraySchema(field.key); track subField.key) {
// //                             <div class="flex flex-col">
// //                               <label class="mini-label">{{ subField.label }}</label>
// //                               @if (subField.enum) {
// //                                 <p-select [formControlName]="subField.key" [options]="getOptions(subField.enum)" 
// //                                             optionLabel="label" optionValue="value" appendTo="body"></p-select>
// //                               } @else {
// //                                 <input pInputText type="text" [formControlName]="subField.key" [placeholder]="subField.label">
// //                               }
// //                             </div>
// //                           }
// //                         </div>
// //                       </div>
// //                     }
// //                   </div>

// //                   <p-button label="Add Item" icon="pi pi-plus" 
// //                           styleClass="p-button-outlined p-button-sm w-full mt-md add-button" 
// //                           (click)="addArrayItem(field.key)">
// //                   </p-button>
// //                 </div>
// //               }
// //             </div>
// //           </p-tabpanel>

// //           <p-tabpanel value="1">
// //             <div class="panel-container">
// //               <div class="number-grid" *ngIf="numberFields.length > 0">
// //                 @for (field of numberFields; track field.key) {
// //                   <div class="field-group">
// //                     <label class="label-heading">{{ field.label }}</label>
// //                     <p-inputNumber [formControlName]="field.key" [min]="0" [showButtons]="true" styleClass="w-full"></p-inputNumber>
// //                   </div>
// //                 }
// //               </div>

// //               @for (field of enumFields; track field.key) {
// //                 <div class="field-group">
// //                   <label class="label-heading">{{ field.label }}</label>
// //                   @if (field.key === 'textAlign' || field.key === 'alignment') {
// //                     <div class="align-group">
// //                       @for (opt of alignOptions; track opt.value) {
// //                         <button type="button" (click)="form.get(field.key)?.setValue(opt.value)"
// //                                 class="align-btn"
// //                                 [class.active]="form.get(field.key)?.value === opt.value">
// //                           <i [class]="'pi ' + opt.icon"></i>
// //                         </button>
// //                       }
// //                     </div>
// //                   } @else {
// //                     <p-select [options]="getOptions(field.enum)" optionLabel="label" optionValue="value" 
// //                                 [formControlName]="field.key" appendTo="body"></p-select>
// //                   }
// //                 </div>
// //               }

// //               @if (booleanFields.length > 0) {
// //                 <div class="toggle-list">
// //                   @for (field of booleanFields; track field.key) {
// //                     <div class="toggle-item" (click)="toggleSwitch(field.key)">
// //                       <label class="toggle-label">{{ field.label }}</label>
// //                       <p-toggleSwitch [formControlName]="field.key"></p-toggleSwitch>
// //                     </div>
// //                   }
// //                 </div>
// //               }
// //             </div>
// //           </p-tabpanel>

// //           <p-tabpanel value="2">
// //             <div class="panel-container">
// //               @for (field of colorFields; track field.key) {
// //                 <div class="color-picker-row">
// //                   <label class="toggle-label">{{ field.label }}</label>
// //                   <div class="color-controls">
// //                     <span class="mono-badge">{{ form.get(field.key)?.value || '#—' }}</span>
// //                     <p-colorPicker appendTo="body" [formControlName]="field.key"></p-colorPicker>
// //                   </div>
// //                 </div>
// //               }

// //               @if (hasField('backgroundImage')) {
// //                 <div class="field-group mt-lg">
// //                   <label class="label-heading">Background Image</label>
// //                   <input pInputText formControlName="backgroundImage" placeholder="https://..." class="w-full" />
// //                   @if (form.get('backgroundImage')?.value) {
// //                     <div class="image-preview" [style.background-image]="'url(' + form.get('backgroundImage')?.value + ')'"></div>
// //                   }
// //                 </div>
// //               }
// //             </div>
// //           </p-tabpanel>
// //         </p-tabpanels>
// //       </p-tabs>

// //     </form>
// //   `,
// //   styles: [`
// //     :host { 
// //         display: block; 
// //         height: 100%; 
// //         font-family: var(--font-body);
// //     }

// //     .form-wrapper {
// //         background: white;
// //         height: 100%;
// //         display: flex;
// //         flex-direction: column;
// //     }

// //     /* Token-Based Scoped Styles */
// //     .panel-container {
// //         display: flex;
// //         flex-direction: column;
// //         gap: var(--spacing-xl);
// //         padding: var(--spacing-sm);
// //     }

// //     .label-heading {
// //         font-family: var(--font-heading);
// //         font-size: var(--font-size-xs);
// //         font-weight: var(--font-weight-bold);
// //         text-transform: uppercase;
// //         letter-spacing: 0.05em;
// //         color: #94a3b8; /* Slate 400 */
// //         margin-bottom: var(--spacing-sm);
// //         display: block;
// //     }

// //     .field-group { margin-bottom: var(--spacing-md); }

// //     .array-header {
// //         display: flex;
// //         justify-content: space-between;
// //         align-items: center;
// //         margin-bottom: var(--spacing-md);
// //     }

// //     .array-card {
// //         padding: var(--spacing-lg);
// //         background: #f8fafc; /* Slate 50 */
// //         border: var(--ui-border-width) solid #e2e8f0;
// //         border-radius: var(--ui-border-radius-lg);
// //         position: relative;
// //         transition: var(--transition-base);
// //     }

// //     .array-card:hover {
// //         border-color: #3b82f6;
// //         box-shadow: var(--shadow-sm);
// //     }

// //     .badge {
// //         font-size: var(--font-size-xs);
// //         background: #f1f5f9;
// //         padding: var(--spacing-xs) var(--spacing-md);
// //         border-radius: var(--ui-border-radius-sm);
// //         font-weight: var(--font-weight-bold);
// //     }

// //     .delete-btn {
// //         position: absolute;
// //         top: var(--spacing-md);
// //         right: var(--spacing-md);
// //         color: #94a3b8;
// //         border: none;
// //         background: transparent;
// //         cursor: pointer;
// //         transition: var(--transition-fast);
// //     }

// //     .delete-btn:hover { color: #ef4444; }

// //     .form-grid {
// //         display: grid;
// //         gap: var(--spacing-lg);
// //         grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
// //     }

// //     .mini-label {
// //         font-size: var(--font-size-xs);
// //         font-weight: var(--font-weight-bold);
// //         text-transform: uppercase;
// //         color: #64748b;
// //         margin-bottom: var(--spacing-xs);
// //     }

// //     .toggle-list {
// //         background: #f8fafc;
// //         padding: var(--spacing-lg);
// //         border-radius: var(--ui-border-radius-xl);
// //         display: flex;
// //         flex-direction: column;
// //         gap: var(--spacing-lg);
// //     }

// //     .toggle-item {
// //         display: flex;
// //         justify-content: space-between;
// //         align-items: center;
// //         cursor: pointer;
// //     }

// //     .toggle-label {
// //         font-size: var(--font-size-base);
// //         font-weight: var(--font-weight-medium);
// //         color: #334155;
// //     }

// //     .align-group {
// //         display: flex;
// //         border: var(--ui-border-width) solid #e2e8f0;
// //         border-radius: var(--ui-border-radius);
// //         overflow: hidden;
// //     }

// //     .align-btn {
// //         flex: 1;
// //         padding: var(--spacing-md);
// //         background: white;
// //         border: none;
// //         cursor: pointer;
// //         transition: var(--transition-colors);
// //     }

// //     .align-btn.active {
// //         background: #eff6ff;
// //         color: #2563eb;
// //     }

// //     .color-picker-row {
// //         display: flex;
// //         justify-content: space-between;
// //         align-items: center;
// //         padding: var(--spacing-lg);
// //         border: var(--ui-border-width) solid #e2e8f0;
// //         border-radius: var(--ui-border-radius-lg);
// //     }

// //     .mono-badge {
// //         font-family: var(--font-mono);
// //         font-size: var(--font-size-xs);
// //         color: #64748b;
// //     }

// //     .color-controls {
// //         display: flex;
// //         align-items: center;
// //         gap: var(--spacing-md);
// //     }

// //     .image-preview {
// //         margin-top: var(--spacing-md);
// //         height: 120px;
// //         border-radius: var(--ui-border-radius-lg);
// //         background-size: cover;
// //         background-position: center;
// //         border: var(--ui-border-width) solid #e2e8f0;
// //         box-shadow: var(--shadow-xs);
// //     }

// //     /* PrimeNG Customization via Tokens */
// //     :host ::ng-deep {
// //         .p-tablist-tab-list { border-bottom: 1px solid #f1f5f9; }
// //         .p-tab { 
// //             font-size: var(--font-size-sm); 
// //             padding: var(--spacing-lg); 
// //             font-weight: var(--font-weight-semibold);
// //         }
// //         .p-tabpanels {
// //             padding: var(--spacing-xl) var(--spacing-md);
// //             overflow-y: auto;
// //         }
// //         .p-inputtext, .p-select, .p-inputnumber {
// //             font-size: var(--font-size-base);
// //             width: 100%;
// //         }
// //     }
// //   `]
// // })
// // export class ConfigFormComponent implements OnChanges {
// //   // Logic remains mostly the same, ensuring UI matches the new schema
// //   // ... (keep your existing class logic for rebuildForm, addArrayItem, etc.)
  
// //   @Input() config: any = {};
// //   @Input() schema: any = {}; 
// //   @Output() configChange = new EventEmitter<any>();

// //   form: FormGroup;
// //   fb = inject(FormBuilder);

// //   contentFields: any[] = [];
// //   numberFields: any[] = [];
// //   booleanFields: any[] = [];
// //   enumFields: any[] = [];
// //   colorFields: any[] = [];
// //   arrayFields: any[] = [];

// //   ruleTypeOptions = [
// //     { label: '🔥 Best Sellers', value: 'best_sellers' },
// //     { label: '✨ New Arrivals', value: 'new_arrivals' },
// //     { label: '📈 Trending Now', value: 'trending' },
// //     { label: '🏷️ Clearance Sale', value: 'clearance_sale' },
// //     { label: '🛠️ Custom Query', value: 'custom_query' }
// //   ];

// //   alignOptions = [
// //     { label: 'Left', value: 'left', icon: 'pi-align-left' },
// //     { label: 'Center', value: 'center', icon: 'pi-align-center' },
// //     { label: 'Right', value: 'right', icon: 'pi-align-right' }
// //   ];

// //   constructor() {
// //     this.form = this.fb.group({});
// //   }

// //   ngOnChanges(changes: SimpleChanges) {
// //     if (changes['schema'] || changes['config']) {
// //       if (this.schema && (changes['schema'] || !this.form.controls['title'])) {
// //         this.rebuildForm();
// //       } else if (this.config) {
// //         this.form.patchValue(this.config, { emitEvent: false });
// //       }
// //     }
// //   }

// //   rebuildForm() {
// //     this.contentFields = [];
// //     this.numberFields = [];
// //     this.booleanFields = [];
// //     this.enumFields = [];
// //     this.colorFields = [];
// //     this.arrayFields = [];

// //     const keys = new Set([...Object.keys(this.schema || {}), ...Object.keys(this.config || {})]);
// //     const group: any = {};

// //     keys.forEach(key => {
// //       if (key === 'ruleType' || key === 'backgroundImage') { 
// //         group[key] = [this.config[key] ?? this.schema?.[key]?.default ?? null];
// //         return; 
// //       }

// //       const def = this.schema?.[key] || {};
// //       const type = def.type || typeof this.config[key];
// //       const field = { key, label: this.formatLabel(key), ...def };

// //       if (type === 'array') {
// //         this.arrayFields.push(field);
// //         const itemSchema = def.schema || {};
// //         const initialData = this.config[key] || [];
// //         group[key] = this.fb.array(
// //           initialData.map((item: any) => this.createArrayGroup(itemSchema, item))
// //         );
// //       } 
// //       else {
// //         const val = this.config[key] !== undefined ? this.config[key] : (def.default ?? null);
// //         group[key] = [val];

// //         if (type === 'boolean') {
// //           this.booleanFields.push(field);
// //         } else if (type === 'number') {
// //           this.numberFields.push(field);
// //         } else if (def.enum || (Array.isArray(def.type) && def.type.includes('string'))) {
// //           this.enumFields.push(field);
// //         } else if (key.toLowerCase().includes('color')) {
// //           this.colorFields.push(field);
// //         } else {
// //           this.contentFields.push(field);
// //         }
// //       }
// //     });

// //     this.form = this.fb.group(group);
// //     this.form.valueChanges.subscribe(val => {
// //       if(this.form.valid) this.configChange.emit(val);
// //     });
// //   }

// //   getFormArray(key: string): FormArray {
// //     return this.form.get(key) as FormArray;
// //   }

// //   getArraySchema(key: string): any[] {
// //     const schemaDef = this.schema[key]?.schema || {};
// //     return Object.keys(schemaDef).map(k => ({ 
// //       key: k, 
// //       label: this.formatLabel(k),
// //       ...schemaDef[k]
// //     }));
// //   }

// //   createArrayGroup(schemaDef: any, data: any = {}) {
// //     const group: any = {};
// //     Object.keys(schemaDef).forEach(key => {
// //       const def = schemaDef[key];
// //       const val = data[key] !== undefined ? data[key] : (def.default ?? '');
// //       group[key] = [val];
// //     });
// //     return this.fb.group(group);
// //   }

// //   addArrayItem(key: string) {
// //     const schemaDef = this.schema[key]?.schema || {};
// //     this.getFormArray(key).push(this.createArrayGroup(schemaDef));
// //   }

// //   removeArrayItem(key: string, index: number) {
// //     this.getFormArray(key).removeAt(index);
// //   }

// //   hasField(key: string): boolean { return this.form.contains(key); }
// //   formatLabel(key: string): string { return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(); }
// //   getOptions(enumArr: string[]) { return enumArr.map(opt => ({ label: this.formatLabel(opt), value: opt })); }
// //   toggleSwitch(key: string) {
// //     const ctrl = this.form.get(key);
// //     ctrl?.setValue(!ctrl.value);
// //   }
// // }
