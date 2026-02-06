import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { BadgeModule } from 'primeng/badge';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DragDropModule, 
    InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
    TextareaModule, ColorPickerModule, ButtonModule, TabsModule,
    ToggleSwitchModule, RadioButtonModule, CheckboxModule, InputGroupAddonModule, 
    SelectButtonModule, DatePickerModule, InputGroupModule, BadgeModule
  ],
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfigFormComponent implements OnChanges {
  @Input() config: any = {};
  @Input() schema: any = {};
  @Input() masters: any = { categories: [], brands: [], tags: [], products: [] };
  @Output() configChange = new EventEmitter<any>();

  form: FormGroup;
  fb = inject(FormBuilder);
  
  tabs = { content: [] as any[], settings: [] as any[], style: [] as any[] };
  booleanGroup: any[] = [];
  expandedControls = new Map<AbstractControl, boolean>();

  constructor() { 
    // Initialize with a dummy control to avoid null checks before buildForm
    this.form = this.fb.group({ _initialized: [false] }); 
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only rebuild the entire form if the schema structure changes
    // or if the config arrives for the first time.
    if (changes['schema'] || (changes['config'] && !this.form.get('_initialized')?.value)) {
      this.buildForm();
    }
  }

  buildForm() {
    const group: any = { _initialized: new FormControl(true) };
    this.tabs = { content: [], settings: [], style: [] };
    this.booleanGroup = [];

    if (!this.schema) return;

    Object.keys(this.schema).forEach(key => {
      const def = this.schema[key];
      const initialValue = this.config?.[key] !== undefined ? this.config[key] : (def.default ?? null);

      if (def.type === 'array') {
        // FIX: Explicitly type the FormArray to AbstractControl to avoid TypeScript assignment errors
        const arr = this.fb.array<AbstractControl>([]);
        if (Array.isArray(initialValue)) {
          initialValue.forEach(v => arr.push(this.createControlForType(def.itemSchema, v)));
        }
        group[key] = arr;
      } 
      else if (def.type === 'object') {
        group[key] = this.createControlForType(def.schema, initialValue);
      }
      else {
        let val = initialValue;
        // Ensure Date objects for PrimeNG DatePicker
        if ((def.type === 'datetime' || def.type === 'date') && typeof val === 'string') {
          val = new Date(val);
        }
        group[key] = new FormControl(val, this.getValidators(def));
      }

      const field = { key, ...def, label: def.label || this.formatLabel(key) };
      this.classifyField(field);
    });

    this.form = this.fb.group(group);
    
    this.form.valueChanges.subscribe(val => {
      if (this.form.valid) {
        // Strip out the internal initialization flag before emitting
        const { _initialized, ...cleanVal } = val;
        this.configChange.emit(cleanVal);
      }
    });
  }

  /**
   * Generates a nested FormGroup or FormControl based on provided schema
   */
  createControlForType(schemaDef: any, data: any): AbstractControl {
    // Handle primitives in arrays (e.g. string arrays for tags)
    if (!schemaDef || typeof schemaDef === 'string') {
      return new FormControl(data || '');
    }

    const group: any = {};
    Object.keys(schemaDef).forEach(k => {
      const fieldDef = schemaDef[k];
      let val = data?.[k] !== undefined ? data[k] : (fieldDef.default ?? null);
      if ((fieldDef.type === 'datetime' || fieldDef.type === 'date') && val) {
        val = new Date(val);
      }
      group[k] = new FormControl(val, this.getValidators(fieldDef));
    });
    return this.fb.group(group);
  }

  /**
   * Distributes fields into the appropriate UI tabs
   */
  classifyField(field: any) {
    const k = field.key.toLowerCase();
    const styleKeys = ['color', 'padding', 'margin', 'gap', 'theme', 'align', 'height', 'width', 'opacity'];
    const settingKeys = ['isactive', 'hideon', 'limit', 'ruletype', 'itemsper', 'columns', 'pagination', 'sticky'];

    // Booleans that aren't explicit checkboxes go to the Settings Toggle grid
    if (field.type === 'boolean' && field.ui !== 'checkbox') {
      this.booleanGroup.push(field);
    } 
    else if (styleKeys.some(sk => k.includes(sk)) || field.type === 'color') {
      this.tabs.style.push(field);
    } 
    else if (settingKeys.some(sk => k.includes(sk))) {
      this.tabs.settings.push(field);
    } 
    else {
      this.tabs.content.push(field);
    }
  }

  getEnumOptions(field: any) {
    if (field.options) return field.options;
    if (field.enum) return field.enum.map((v: any) => ({ 
      label: this.formatLabel(v.toString()), 
      value: v 
    }));

    if (field.type?.startsWith('reference')) {
      const ref = field.ref;
      if (ref === 'Master' || field.key === 'categoryId') 
        return this.masters.categories.map((c: any) => ({ label: c.name, value: c.id || c._id }));
      if (ref === 'Brand' || field.key === 'brandId') 
        return this.masters.brands.map((b: any) => ({ label: b.name, value: b.id || b._id }));
      if (ref === 'Product' || field.key === 'productId') 
        return this.masters.products.map((p: any) => ({ label: p.name, value: p.id || p._id }));
    }
    return [];
  }

  formatLabel(s: string) {
    return s.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  getValidators(def: any) {
    const v = [];
    if (def.required) v.push(Validators.required);
    if (def.min !== undefined) v.push(Validators.min(def.min));
    if (def.max !== undefined) v.push(Validators.max(def.max));
    return v;
  }

  // --- Helper Methods for Template Context ---
  
  getFormArray(key: string): FormArray { 
    return this.form.get(key) as FormArray; 
  }
  
  getArrayFields(field: any) {
    if (typeof field.itemSchema === 'string' || !field.itemSchema) return [];
    return Object.keys(field.itemSchema).map(k => ({ 
      key: k, ...field.itemSchema[k], label: field.itemSchema[k].label || this.formatLabel(k) 
    }));
  }

  getObjectFields(field: any) {
    if (!field.schema) return [];
    return Object.keys(field.schema).map(k => ({ 
      key: k, ...field.schema[k], label: field.schema[k].label || this.formatLabel(k) 
    }));
  }

  addArrayItem(field: any) {
    const arr = this.getFormArray(field.key);
    const ctrl = this.createControlForType(field.itemSchema, null);
    arr.push(ctrl);
    this.expandedControls.set(ctrl, true);
  }

  removeArrayItem(key: string, i: number) { 
    this.getFormArray(key).removeAt(i); 
  }

  toggleExpanded(c: AbstractControl) { 
    this.expandedControls.set(c, !this.expandedControls.get(c)); 
  }

  getItemTitle(c: AbstractControl) {
    const v = c.value;
    if (typeof v === 'string') return v;
    return v?.text || v?.title || v?.name || v?.label || v?.question || 'Item';
  }

  drop(event: CdkDragDrop<any[]>, key: string) {
    const arr = this.getFormArray(key);
    moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
    arr.updateValueAndValidity();
  }
}




// import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // PrimeNG Imports
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { TextareaModule } from 'primeng/textarea';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { ButtonModule } from 'primeng/button';
// import { TabsModule } from 'primeng/tabs';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { RadioButtonModule } from 'primeng/radiobutton';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectButtonModule } from 'primeng/selectbutton';
// import { DatePickerModule } from 'primeng/datepicker';
// import { InputGroupModule } from 'primeng/inputgroup';
// import { BadgeModule } from 'primeng/badge';
// import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// @Component({
//   selector: 'app-config-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, DragDropModule, 
//     InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
//     TextareaModule, ColorPickerModule, ButtonModule, TabsModule,
//     ToggleSwitchModule, RadioButtonModule, CheckboxModule, InputGroupAddonModule, 
//     SelectButtonModule, DatePickerModule, InputGroupModule, BadgeModule
//   ],
//   templateUrl: './config-form.component.html',
//   styleUrls: ['./config-form.component.scss'],
//   encapsulation: ViewEncapsulation.None
// })
// export class ConfigFormComponent implements OnChanges {
//   @Input() config: any = {};
//   @Input() schema: any = {};
//   @Input() masters: any = { categories: [], brands: [], tags: [] };
//   @Output() configChange = new EventEmitter<any>();

//   form: FormGroup;
//   fb = inject(FormBuilder);
  
//   tabs = { 
//     content: [] as any[], 
//     settings: [] as any[], 
//     style: [] as any[] 
//   };
//   booleanGroup: any[] = [];
//   expandedControls = new Map<AbstractControl, boolean>();

//   constructor() { 
//     this.form = this.fb.group({ initialized: [false] }); 
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     // Rebuild form if Schema changes OR if Config changes (and form isn't initialized yet)
//     // We avoid rebuilding on every config change to prevent cursor jumping if 2-way binding is used
//     if (changes['schema'] || (changes['config'] && !this.form.get('initialized')?.value)) {
//       this.buildForm();
//     }
//   }

//   buildForm() {
//     this.form = this.fb.group({ initialized: [true] });
//     this.tabs = { content: [], settings: [], style: [] };
//     this.booleanGroup = [];

//     if (!this.schema) return;

//     Object.keys(this.schema).forEach(key => {
//       const def = this.schema[key];
//       // Use def.default if config[key] is undefined (not just null checks)
//       const initialValue = this.config?.[key] !== undefined ? this.config[key] : (def.default ?? null);

//       if (def.type === 'array') {
//         const arr = this.fb.array<AbstractControl>([]);
//         if (Array.isArray(initialValue)) {
//           initialValue.forEach(v => {
//             arr.push(this.createArrayGroup(def.itemSchema, v));
//           });
//         }
//         this.form.addControl(key, arr);
//       } else {
//         let val = initialValue;
//         if ((def.type === 'date' || def.inputType === 'datetime-local') && val) {
//           val = new Date(val);
//         }
//         this.form.addControl(key, new FormControl(val, this.getValidators(def)));
//       }

//       const field = { key, ...def, label: def.label || this.formatLabel(key) };
      
//       // Tab Classification Logic
//       if (def.type === 'array') {
//         this.tabs.content.push(field);
//       } else if (this.isStyleField(key, def)) {
//         this.tabs.style.push(field);
//       } 
//       else if (def.type === 'boolean' && def.ui !== 'checkbox') {
//         this.booleanGroup.push(field);
//       }
//       // else if (def.type === 'boolean') {
//       //   this.booleanGroup.push(field);
//       // } 
//       else {
//         this.tabs.settings.push(field);
//       }
//     });

//     this.form.valueChanges.subscribe(val => {
//       if (this.form.valid) {
//         const { initialized, ...cleanVal } = val;
//         this.configChange.emit(cleanVal);
//       }
//     });
//   }

//   createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
//     const group: any = {};
//     if (!schemaDef) return this.fb.group({});

//     Object.keys(schemaDef).forEach(k => {
//       const fieldDef = schemaDef[k];
//       const val = data[k] !== undefined ? data[k] : (fieldDef.default ?? null);
//       group[k] = new FormControl(val, this.getValidators(fieldDef));
//     });
//     return this.fb.group(group);
//   }

//   // ✅ FIXED: Now correctly handles explicit 'options' array from schema
//   getEnumOptions(field: any) {
//     // 1. Explicit options (e.g. RuleType)
//     if (field.options && Array.isArray(field.options)) {
//       return field.options;
//     }

//     // 2. Dynamic Masters
//     // Handle 'reference' types from SectionRegistry
//     if (field.type === 'reference' || field.key === 'categoryId') {
//         if (field.ref === 'Master') return this.masters.categories.map((c: any) => ({ label: c.name, value: c.id }));
//         if (field.ref === 'Brand') return this.masters.brands.map((b: any) => ({ label: b.name, value: b.id }));
//         if (field.ref === 'Product') return this.masters.products?.map((p: any) => ({ label: p.name, value: p.id })) || [];
//     }
    
//     // Legacy fallback for specific keys
//     if (field.key === 'categoryId') return this.masters.categories.map((c: any) => ({ label: c.name, value: c.id }));
//     if (field.key === 'brandId') return this.masters.brands.map((b: any) => ({ label: b.name, value: b.id }));
//     if (field.key === 'tags' || field.key === 'selectedTags') return this.masters.tags.map((t: any) => ({ label: t, value: t }));

//     // 3. Simple Enum Fallback
//     return (field.enum || []).map((o: any) => ({ 
//       label: o.toString().replace(/_/g, ' ').toUpperCase(), 
//       value: o 
//     }));
//   }

//   getIconForValue(val: string): string {
//     const map: any = {
//       // Alignments
//       left: 'pi pi-align-left', center: 'pi pi-align-center', right: 'pi pi-align-right',
//       // Themes
//       light: 'pi pi-sun', dark: 'pi pi-moon',
//       // Container Widths (From your schema)
//       full: 'pi pi-arrows-h', 
//       standard: 'pi pi-box', 
//       narrow: 'pi pi-mobile', 
//       custom: 'pi pi-cog'
//     };
//     return map[val] || 'pi pi-circle';
//   }

//   getFormArray(key: string): FormArray {
//     return this.form.get(key) as FormArray;
//   }

//   addArrayItem(field: any) {
//     const arr = this.getFormArray(field.key);
//     const newGroup = this.createArrayGroup(field.itemSchema);
//     arr.push(newGroup);
//     this.expandedControls.set(newGroup, true); // Auto-expand new item
//   }

//   removeArrayItem(key: string, i: number) {
//     this.getFormArray(key).removeAt(i);
//   }

//   drop(event: CdkDragDrop<any[]>, key: string) {
//     const arr = this.getFormArray(key);
//     moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
//     arr.updateValueAndValidity();
//     // Trigger change detection implicitly by updating value
//     this.configChange.emit(this.form.value); 
//   }

//   toggleExpanded(c: AbstractControl) {
//     this.expandedControls.set(c, !this.expandedControls.get(c));
//   }

//   isExpanded(c: AbstractControl) {
//     return !!this.expandedControls.get(c);
//   }
  
//   getItemTitle(c: AbstractControl) {
//     const v = c.value;
//     return v.text || v.title || v.name || v.label || v.question || 'Item';
//   }

//   getArraySchema(field: any) {
//     if (!field.itemSchema) return [];
//     return Object.keys(field.itemSchema).map(k => ({ key: k, label: field.itemSchema[k].label || this.formatLabel(k), ...field.itemSchema[k] }));
//   }

//   private getValidators(def: any) {
//     const v = [];
//     if (def.required) v.push(Validators.required);
//     if (def.min !== undefined) v.push(Validators.min(def.min));
//     if (def.max !== undefined) v.push(Validators.max(def.max));
//     return v;
//   }

//   private formatLabel(key: string) {
//     return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
//   }

//   private isStyleField(key: string, def: any) {
//     const k = key.toLowerCase();
//     // Added specific checks for your schema keys
//     return k.includes('color') || k.includes('padding') || k.includes('margin') || k.includes('gap') || 
//            k.includes('border') || k.includes('shadow') || def.format === 'color' || k === 'thememode';
//   }
// }