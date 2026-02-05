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
  @Input() masters: any = { categories: [], brands: [], tags: [] };
  @Output() configChange = new EventEmitter<any>();

  form: FormGroup;
  fb = inject(FormBuilder);
  
  tabs = { 
    content: [] as any[], 
    settings: [] as any[], 
    style: [] as any[] 
  };
  booleanGroup: any[] = [];
  expandedControls = new Map<AbstractControl, boolean>();

  constructor() { 
    this.form = this.fb.group({ initialized: [false] }); 
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schema'] || (changes['config'] && !this.form.get('initialized')?.value)) {
      this.buildForm();
    }
  }

  buildForm() {
    this.form = this.fb.group({ initialized: [true] });
    this.tabs = { content: [], settings: [], style: [] };
    this.booleanGroup = [];

    if (!this.schema) return;

    Object.keys(this.schema).forEach(key => {
      const def = this.schema[key];
      // Use def.default if config[key] is undefined (not just null checks)
      const initialValue = this.config[key] !== undefined ? this.config[key] : (def.default ?? null);

      if (def.type === 'array') {
        const arr = this.fb.array<AbstractControl>([]);
        if (Array.isArray(initialValue)) {
          initialValue.forEach(v => {
            arr.push(this.createArrayGroup(def.schema, v));
          });
        }
        this.form.addControl(key, arr);
      } else {
        let val = initialValue;
        if ((def.type === 'date' || def.inputType === 'datetime-local') && val) {
          val = new Date(val);
        }
        this.form.addControl(key, new FormControl(val, this.getValidators(def)));
      }

      const field = { key, ...def, label: this.formatLabel(key) };
      
      // Tab Classification
      if (def.type === 'array') {
        this.tabs.content.push(field);
      } else if (this.isStyleField(key, def)) {
        this.tabs.style.push(field);
      } 
      else if (def.type === 'boolean' && def.ui !== 'checkbox') {
  this.booleanGroup.push(field);
}
      // else if (def.type === 'boolean') {
      //   this.booleanGroup.push(field);
      // } 
      else {
        this.tabs.settings.push(field);
      }
    });

    this.form.valueChanges.subscribe(val => {
      if (this.form.valid) {
        const { initialized, ...cleanVal } = val;
        this.configChange.emit(cleanVal);
      }
    });
  }

  createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
    const group: any = {};
    Object.keys(schemaDef).forEach(k => {
      const fieldDef = schemaDef[k];
      const val = data[k] !== undefined ? data[k] : (fieldDef.default ?? null);
      group[k] = new FormControl(val, this.getValidators(fieldDef));
    });
    return this.fb.group(group);
  }

  // ✅ FIXED: Now correctly handles explicit 'options' array from schema
  getEnumOptions(field: any) {
    // 1. Explicit options (e.g. RuleType)
    if (field.options && Array.isArray(field.options)) {
      return field.options;
    }

    // 2. Dynamic Masters
    if (field.key === 'categoryId') return this.masters.categories.map((c: any) => ({ label: c.name, value: c.id }));
    if (field.key === 'brandId') return this.masters.brands.map((b: any) => ({ label: b.name, value: b.id }));
    if (field.key === 'tags' || field.key === 'selectedTags') return this.masters.tags.map((t: any) => ({ label: t, value: t }));

    // 3. Simple Enum Fallback
    return (field.enum || []).map((o: any) => ({ 
      label: o.toString().replace(/_/g, ' ').toUpperCase(), 
      value: o 
    }));
  }

  getIconForValue(val: string): string {
    const map: any = {
      // Alignments
      left: 'pi pi-align-left', center: 'pi pi-align-center', right: 'pi pi-align-right',
      // Themes
      light: 'pi pi-sun', dark: 'pi pi-moon',
      // Container Widths (From your schema)
      full: 'pi pi-arrows-h', 
      standard: 'pi pi-box', 
      narrow: 'pi pi-mobile', 
      custom: 'pi pi-cog'
    };
    return map[val] || 'pi pi-circle';
  }

  getFormArray(key: string): FormArray {
    return this.form.get(key) as FormArray;
  }

  addArrayItem(field: any) {
    const arr = this.getFormArray(field.key);
    const newGroup = this.createArrayGroup(field.schema);
    arr.push(newGroup);
    this.expandedControls.set(newGroup, true);
  }

  removeArrayItem(key: string, i: number) {
    this.getFormArray(key).removeAt(i);
  }

  drop(event: CdkDragDrop<any[]>, key: string) {
    const arr = this.getFormArray(key);
    moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
    arr.updateValueAndValidity();
  }

  toggleExpanded(c: AbstractControl) {
    this.expandedControls.set(c, !this.expandedControls.get(c));
  }

  isExpanded(c: AbstractControl) {
    return !!this.expandedControls.get(c);
  }
  
  getItemTitle(c: AbstractControl) {
    const v = c.value;
    return v.text || v.title || v.name || v.label || 'Item';
  }

  getArraySchema(field: any) {
    return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
  }

  private getValidators(def: any) {
    const v = [];
    if (def.required) v.push(Validators.required);
    if (def.min !== undefined) v.push(Validators.min(def.min));
    if (def.max !== undefined) v.push(Validators.max(def.max));
    return v;
  }

  private formatLabel(key: string) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }

  private isStyleField(key: string, def: any) {
    const k = key.toLowerCase();
    // Added specific checks for your schema keys
    return k.includes('color') || k.includes('padding') || k.includes('margin') || k.includes('gap') || 
           k.includes('border') || k.includes('shadow') || def.format === 'color' || k === 'thememode';
  }
}

// import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // PrimeNG Imports for v18
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
//     ToggleSwitchModule, RadioButtonModule, CheckboxModule,InputGroupAddonModule, 
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
//     if (changes['schema'] || (changes['config'] && !this.form.get('initialized')?.value)) {
//       this.buildForm();
//     }
//   }

//   buildForm() {
//     // Re-initialize the root group
//     this.form = this.fb.group({ initialized: [true] });
//     this.tabs = { content: [], settings: [], style: [] };
//     this.booleanGroup = [];

//     if (!this.schema) return;

//     Object.keys(this.schema).forEach(key => {
//       const def = this.schema[key];
//       const initialValue = this.config[key] ?? def.default ?? null;

//       if (def.type === 'array') {
//         // ✅ FIX: Explicitly type the FormArray to accept any AbstractControl (including FormGroups)
//         const arr = this.fb.array<AbstractControl>([]);
//         if (Array.isArray(initialValue)) {
//           initialValue.forEach(v => {
//             arr.push(this.createArrayGroup(def.schema, v));
//           });
//         }
//         this.form.addControl(key, arr);
//       } else {
//         let val = initialValue;
//         // Handle Date conversion for PrimeNG DatePicker
//         if ((def.type === 'date' || def.inputType === 'datetime-local') && val) {
//           val = new Date(val);
//         }
//         this.form.addControl(key, new FormControl(val, this.getValidators(def)));
//       }

//       const field = { key, ...def, label: this.formatLabel(key) };
      
//       // Classify for Tabs
//       if (def.type === 'array') {
//         this.tabs.content.push(field);
//       } else if (this.isStyleField(key, def)) {
//         this.tabs.style.push(field);
//       } else if (def.type === 'boolean') {
//         this.booleanGroup.push(field);
//       } else {
//         this.tabs.settings.push(field);
//       }
//     });

//     this.form.valueChanges.subscribe(val => {
//       if (this.form.valid) {
//         // Remove helper control from the emitted value
//         const { initialized, ...cleanVal } = val;
//         this.configChange.emit(cleanVal);
//       }
//     });
//   }

//   createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
//     const group: any = {};
//     Object.keys(schemaDef).forEach(k => {
//       const fieldDef = schemaDef[k];
//       const val = data[k] !== undefined ? data[k] : (fieldDef.default ?? null);
//       group[k] = new FormControl(val, this.getValidators(fieldDef));
//     });
//     return this.fb.group(group);
//   }

//   getEnumOptions(field: any) {
//     if (field.key === 'categoryId') return this.masters.categories.map((c: any) => ({ label: c.name, value: c.id }));
//     if (field.key === 'brandId') return this.masters.brands.map((b: any) => ({ label: b.name, value: b.id }));
//     if (field.key === 'tags' || field.key === 'selectedTags') return this.masters.tags.map((t: any) => ({ label: t, value: t }));

//     return (field.enum || []).map((o: any) => ({ 
//       label: o.toString().replace(/_/g, ' ').toUpperCase(), 
//       value: o 
//     }));
//   }

//   getIconForValue(val: string): string {
//     const map: any = {
//       left: 'pi pi-align-left', center: 'pi pi-align-center', right: 'pi pi-align-right',
//       standard: 'pi pi-stop', full: 'pi pi-arrows-h', narrow: 'pi pi-minus',
//       light: 'pi pi-sun', dark: 'pi pi-moon'
//     };
//     return map[val] || 'pi pi-circle';
//   }

//   getFormArray(key: string): FormArray {
//     return this.form.get(key) as FormArray;
//   }

//   addArrayItem(field: any) {
//     const arr = this.getFormArray(field.key);
//     const newGroup = this.createArrayGroup(field.schema);
//     arr.push(newGroup);
//     this.expandedControls.set(newGroup, true);
//   }

//   removeArrayItem(key: string, i: number) {
//     this.getFormArray(key).removeAt(i);
//   }

//   drop(event: CdkDragDrop<any[]>, key: string) {
//     const arr = this.getFormArray(key);
//     moveItemInArray(arr.controls, event.previousIndex, event.currentIndex);
//     arr.updateValueAndValidity();
//   }

//   toggleExpanded(c: AbstractControl) {
//     this.expandedControls.set(c, !this.expandedControls.get(c));
//   }

//   isExpanded(c: AbstractControl) {
//     return !!this.expandedControls.get(c);
//   }
  
//   getItemTitle(c: AbstractControl) {
//     const v = c.value;
//     return v.text || v.title || v.name || v.label || 'Item';
//   }

//   getArraySchema(field: any) {
//     return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
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
//     return k.includes('color') || k.includes('padding') || k.includes('margin') || k.includes('gap') || def.format === 'color';
//   }
// }

// // import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
// // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // // ✅ Updated PrimeNG Imports for v18
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { SelectModule } from 'primeng/select';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { TextareaModule } from 'primeng/textarea';
// // import { ColorPickerModule } from 'primeng/colorpicker';
// // import { ButtonModule } from 'primeng/button';
// // import { TabsModule } from 'primeng/tabs';
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // import { RadioButtonModule } from 'primeng/radiobutton';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { SelectButtonModule } from 'primeng/selectbutton';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { InputGroupModule } from 'primeng/inputgroup';
// // import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
// // @Component({
// //   selector: 'app-config-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule, ReactiveFormsModule, DragDropModule, 
// //     InputTextModule, InputNumberModule, SelectModule, MultiSelectModule,
// //     TextareaModule, ColorPickerModule, ButtonModule, TabsModule,
// //     ToggleSwitchModule, RadioButtonModule, CheckboxModule, 
// //     SelectButtonModule, DatePickerModule, InputGroupModule,InputGroupAddonModule
// //   ],
// //   templateUrl: './config-form.component.html',
// //   styleUrls: ['./config-form.component.scss'],
// //   encapsulation: ViewEncapsulation.None
// // })
// // export class ConfigFormComponent implements OnChanges {
// //   @Input() config: any = {};
// //   @Input() schema: any = {};
// //   @Input() masters: any = { categories: [], brands: [], tags: [] }; // ✅ New: Received from PageBuilder
// //   @Output() configChange = new EventEmitter<any>();

// //   form: FormGroup;
// //   fb = inject(FormBuilder);
// //   tabs = { content: [] as any[], settings: [] as any[], style: [] as any[] };
// //   booleanGroup: any[] = [];
// //   expandedControls = new Map<AbstractControl, boolean>();

// //   constructor() { this.form = this.fb.group({}); }

// //   ngOnChanges(changes: SimpleChanges) {
// //     if (changes['schema'] || (changes['config'] && !this.form.get('initialized'))) {
// //       this.buildForm();
// //     }
// //   }

// //   buildForm() {
// //     this.form = this.fb.group({ initialized: [true] });
// //     this.tabs = { content: [], settings: [], style: [] };
// //     this.booleanGroup = [];

// //     if (!this.schema) return;

// //     Object.keys(this.schema).forEach(key => {
// //       const def = this.schema[key];
// //       const initialValue = this.config[key] ?? def.default ?? null;

// //       if (def.type === 'array') {
// //         const arr = this.fb.array([]);
// //         if (Array.isArray(initialValue)) {
// //           initialValue.forEach(v => arr.push(this.createArrayGroup(def.schema, v)));
// //         }
// //         this.form.addControl(key, arr);
// //       } else {
// //         // Correct date object if it's a date field
// //         let val = initialValue;
// //         if ((def.type === 'date' || def.inputType === 'datetime-local') && val) {
// //           val = new Date(val);
// //         }
// //         this.form.addControl(key, new FormControl(val, this.getValidators(def)));
// //       }

// //       const field = { key, ...def, label: this.formatLabel(key) };
// //       if (def.type === 'array') this.tabs.content.push(field);
// //       else if (this.isStyleField(key, def)) this.tabs.style.push(field);
// //       else if (def.type === 'boolean') this.booleanGroup.push(field);
// //       else this.tabs.settings.push(field);
// //     });

// //     this.form.valueChanges.subscribe(val => {
// //       if (this.form.valid) {
// //         const { initialized, ...cleanVal } = val;
// //         this.configChange.emit(cleanVal);
// //       }
// //     });
// //   }

// //   createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
// //     const group: any = {};
// //     Object.keys(schemaDef).forEach(k => {
// //       const fieldDef = schemaDef[k];
// //       const val = data[k] !== undefined ? data[k] : (fieldDef.default ?? null);
// //       group[k] = new FormControl(val, this.getValidators(fieldDef));
// //     });
// //     return this.fb.group(group);
// //   }

// //   // ✅ New Logic: Fetch Options from either Schema Enum OR Master Data Signals
// //   getEnumOptions(field: any) {
// //     // 1. Check if it's a Master Data link
// //     if (field.key === 'categoryId') return this.masters.categories.map((c: any) => ({ label: c.name, value: c.id }));
// //     if (field.key === 'brandId') return this.masters.brands.map((b: any) => ({ label: b.name, value: b.id }));
// //     if (field.key === 'tags' || field.key === 'selectedTags') return this.masters.tags.map((t: any) => ({ label: t, value: t }));

// //     // 2. Fallback to hardcoded enum in registry
// //     return (field.enum || []).map((o: any) => ({ 
// //       label: o.toString().replace(/_/g, ' ').toUpperCase(), 
// //       value: o,
// //       icon: this.getIconForValue(o) 
// //     }));
// //   }

// //   getIconForValue(val: string): string {
// //     const map: any = {
// //       left: 'pi pi-align-left', center: 'pi pi-align-center', right: 'pi pi-align-right',
// //       standard: 'pi pi-stop', full: 'pi pi-arrows-h', narrow: 'pi pi-minus',
// //       light: 'pi pi-sun', dark: 'pi pi-moon'
// //     };
// //     return map[val] || 'pi pi-circle';
// //   }

// //   getFormArray(key: string): FormArray { return this.form.get(key) as FormArray; }
// //   addArrayItem(field: any) { this.getFormArray(field.key).push(this.createArrayGroup(field.schema)); }
// //   removeArrayItem(key: string, i: number) { this.getFormArray(key).removeAt(i); }
// //   toggleExpanded(c: AbstractControl) { this.expandedControls.set(c, !this.expandedControls.get(c)); }
// //   isExpanded(c: AbstractControl) { return !!this.expandedControls.get(c); }
  
// //   getItemTitle(c: AbstractControl) {
// //     const v = c.value;
// //     return v.text || v.title || v.name || v.label || 'Item';
// //   }

// //   getArraySchema(field: any) {
// //     return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
// //   }

// //   private getValidators(def: any) {
// //     const v = [];
// //     if (def.required) v.push(Validators.required);
// //     if (def.min !== undefined) v.push(Validators.min(def.min));
// //     if (def.max !== undefined) v.push(Validators.max(def.max));
// //     return v;
// //   }

// //   private formatLabel(key: string) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()); }
// //   private isStyleField(key: string, def: any) { 
// //     const k = key.toLowerCase();
// //     return k.includes('color') || k.includes('padding') || k.includes('margin') || k.includes('gap') || def.format === 'color'; 
// //   }
// // }

// // // import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ViewEncapsulation } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
// // // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
// // // import { CheckboxModule } from 'primeng/checkbox';
// // // // PrimeNG
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { InputNumberModule } from 'primeng/inputnumber';
// // // import { TextareaModule } from 'primeng/textarea';
// // // import { ColorPickerModule } from 'primeng/colorpicker';
// // // import { ButtonModule } from 'primeng/button';
// // // import { TabsModule } from 'primeng/tabs';
// // // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // // import { SelectModule } from 'primeng/select';
// // // import { RadioButtonModule } from 'primeng/radiobutton';
// // // import { TooltipModule } from 'primeng/tooltip';
// // // import { SelectButtonModule } from 'primeng/selectbutton';
// // // @Component({
// // //   selector: 'app-config-form',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     ReactiveFormsModule,
// // //     DragDropModule,
// // //     InputTextModule,
// // //     InputNumberModule,
// // //     SelectModule,
// // //     TextareaModule,
// // //     ColorPickerModule,
// // //     ButtonModule,
// // //     TabsModule,RadioButtonModule,
// // //     ToggleSwitchModule,
// // //     TooltipModule,CheckboxModule,SelectButtonModule
// // //   ],
// // //   templateUrl: './config-form.component.html',
// // //   styleUrls: ['./config-form.component.scss'],
// // //   encapsulation: ViewEncapsulation.None
// // // })
// // // export class ConfigFormComponent implements OnChanges {
// // //   @Input() config: any = {};
// // //   @Input() schema: any = {};
// // //   @Output() configChange = new EventEmitter<any>();
// // // showCustomColors = true;
// // //   form: FormGroup;
// // //   fb = inject(FormBuilder);

// // //   // UX Buckets
// // //   tabs = {
// // //     content: [] as any[],
// // //     settings: [] as any[],
// // //     style: [] as any[]
// // //   };

// // //   // Group toggles together
// // //   booleanGroup: any[] = [];

// // //   // Track expanded state for array items (survives drag & drop)
// // //   expandedControls = new Map<AbstractControl, boolean>();

// // //   constructor() { this.form = this.fb.group({}); }

// // //   ngOnChanges(changes: SimpleChanges) {
// // //     if (changes['schema']) {
// // //       this.buildForm();
// // //     } else if (changes['config'] && this.form) {
// // //       this.form.patchValue(this.config, { emitEvent: false });
// // //     }
// // //   }

// // //   buildForm() {
// // //     this.form = this.fb.group({});
// // //     this.resetBuckets();

// // //     if (!this.schema) return;

// // //     Object.keys(this.schema).forEach(key => {
// // //       const def = this.schema[key];
// // //       const initialValue = this.config[key] ?? def.default ?? null;

// // //       // 1. Control Creation
// // //       if (def.type === 'array') {
// // //         // Cast to 'any' to bypass strict FormGroup check
// // //         const arr = this.fb.array<any>([]); 
// // //         if (Array.isArray(initialValue)) {
// // //           initialValue.forEach((itemVal: any) => {
// // //             arr.push(this.createArrayGroup(def.schema, itemVal) as any);
// // //           });
// // //         }
// // //         this.form.addControl(key, arr);
// // //       } else {
// // //         const validators = this.getValidators(def);
// // //         this.form.addControl(key, new FormControl(initialValue, validators));
// // //       }

// // //       // 2. Classification Logic
// // //       const field = { key, ...def, label: this.formatLabel(key) };

// // //       if (def.type === 'array') {
// // //         this.tabs.content.push(field);
// // //       } else if (this.isStyleField(key, def)) {
// // //         this.tabs.style.push(field);
// // //       } else if (def.type === 'boolean') {
// // //         this.booleanGroup.push(field);
// // //       } else if (this.isSettingField(key, def)) {
// // //         this.tabs.settings.push(field);
// // //       } else {
// // //         this.tabs.content.push(field);
// // //       }
// // //     });

// // //     // AFTER the loop, listen for Theme Mode changes
// // //   if (this.form.get('themeMode')) {
// // //     // 1. Set initial state
// // //     this.checkThemeVisibility(this.form.get('themeMode')?.value);

// // //     // 2. Listen for changes
// // //     this.form.get('themeMode')?.valueChanges.subscribe(mode => {
// // //       this.checkThemeVisibility(mode);
// // //     });
// // //   }
    
// // //     this.form.valueChanges.subscribe(val => {
// // //       if (this.form.valid) this.configChange.emit(val);
// // //     });
// // //   }
// // //   checkThemeVisibility(mode: string) {
// // //   // If mode is 'preset', we flag custom colors to be hidden
// // //   this.showCustomColors = mode !== 'preset';
// // // }

// // //   // --- Array Logic ---

// // //   // createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
// // //   //   const group: any = {};
// // //   //   Object.keys(schemaDef).forEach(k => {
// // //   //     group[k] = [data[k] ?? schemaDef[k].default ?? ''];
// // //   //   });
// // //   //   return this.fb.group(group);
// // //   // }
// // // // In config-form.component.ts

// // // createArrayGroup(schemaDef: any, data: any = {}): FormGroup {
// // //     const group: any = {};
// // //     Object.keys(schemaDef).forEach(k => {
// // //       const fieldDef = schemaDef[k];
      
// // //       // 1. Determine Default Value (Handle booleans/numbers correctly)
// // //       let defaultValue = fieldDef.default ?? '';
// // //       if (fieldDef.type === 'boolean') defaultValue = fieldDef.default ?? false;
// // //       if (fieldDef.type === 'number') defaultValue = fieldDef.default ?? null;

// // //       // 2. Get Value (Data > Default)
// // //       const val = data[k] !== undefined ? data[k] : defaultValue;

// // //       // 3. ✅ FIX: Apply Validators to Array fields
// // //       // The original code was missing this: this.getValidators(fieldDef)
// // //       group[k] = [val, this.getValidators(fieldDef)]; 
// // //     });
// // //     return this.fb.group(group);
// // //   }

// // //   getFormArray(key: string): FormArray<any> { 
// // //     return this.form.get(key) as FormArray<any>; 
// // //   }

// // //   addArrayItem(field: any) {
// // //     const arr = this.getFormArray(field.key);
// // //     const newGroup = this.createArrayGroup(field.schema) as any;
// // //     arr.push(newGroup);
    
// // //     // Auto-expand new item
// // //     this.expandedControls.set(newGroup, true);
    
// // //     this.form.updateValueAndValidity();
// // //   }

// // //   removeArrayItem(key: string, index: number, event: Event) {
// // //     event.stopPropagation();
// // //     this.getFormArray(key).removeAt(index);
// // //   }

// // //   drop(event: CdkDragDrop<string[]>, formArrayName: string) {
// // //     const dir = this.getFormArray(formArrayName);
// // //     const from = event.previousIndex;
// // //     const to = event.currentIndex;

// // //     const control = dir.at(from);
// // //     dir.removeAt(from);
// // //     dir.insert(to, control);

// // //     this.form.updateValueAndValidity();
// // //   }

// // //   // --- State Management ---

// // //   toggleExpanded(control: AbstractControl) {
// // //     const currentState = this.expandedControls.get(control) || false;
// // //     this.expandedControls.set(control, !currentState);
// // //   }

// // //   isExpanded(control: AbstractControl): boolean {
// // //     return this.expandedControls.get(control) || false;
// // //   }

// // //   getItemTitle(control: AbstractControl, schema: any): string {
// // //     const val = control.value;
// // //     if (!val) return 'Item';
// // //     if (val.title) return val.title;
// // //     if (val.text) return val.text;
// // //     if (val.label) return val.label;
// // //     if (val.name) return val.name;
// // //     const firstString = Object.keys(val).find(k => typeof val[k] === 'string' && val[k].length > 0);
// // //     return firstString ? val[firstString] : 'Item';
// // //   }

// // //   // --- Helpers ---
// // //   resetBuckets() {
// // //     this.tabs = { content: [], settings: [], style: [] };
// // //     this.booleanGroup = [];
// // //   }

// // //   getValidators(def: any) {
// // //     const validators = [];
// // //     if (def.required) validators.push(Validators.required);
// // //     if (def.min !== undefined) validators.push(Validators.min(def.min));
// // //     if (def.max !== undefined) validators.push(Validators.max(def.max));
// // //     if (def.maxLength) validators.push(Validators.maxLength(def.maxLength));
// // //     return validators;
// // //   }

// // //   // isStyleField(key: string, def: any): boolean {
// // //   //   const k = key.toLowerCase();
// // //   //   return k.includes('color') || k.includes('background') || k.includes('gap') || k.includes('padding') || k.includes('margin') || def.format === 'color';
// // //   // }

// // //   // isSettingField(key: string, def: any): boolean {
// // //   //   if (def.type === 'number') return true;
// // //   //   if (def.enum && !['alignment', 'textAlign'].includes(key)) return true;
// // //   //   return false;
// // //   // }
  
// // // isStyleField(key: string, def: any): boolean {
// // //     const k = key.toLowerCase();
    
// // //     // 1. Common Design Tokens
// // //     const isToken = k.includes('color') || 
// // //                     k.includes('background') || 
// // //                     k.includes('gap') || 
// // //                     k.includes('padding') || 
// // //                     k.includes('margin') || 
// // //                     k.includes('border') || // Added: borderRadius, borderWidth
// // //                     k.includes('shadow');   // Added: boxShadow

// // //     // 2. Theme Specifics (Crucial for your SectionRegistry)
// // //     const isTheme = k.includes('theme') ||  // Catch themeMode, themeId, theme
// // //                     k === 'overlayopacity'; // Specific to video_hero
                    
// // //     // 3. Format Check
// // //     return isToken || isTheme || def.format === 'color';
// // //   }
// // //   isSettingField(key: string, def: any): boolean {
// // //     // If it's already a style field, don't put it in settings
// // //     if (this.isStyleField(key, def)) return false; 

// // //     if (def.type === 'number') return true;
// // //     if (def.enum && !['alignment', 'textAlign'].includes(key)) return true;
    
// // //     // Boolean toggles (isActive, hideOnMobile) usually go to settings
// // //     if (def.type === 'boolean') return true; 

// // //     return false;
// // //   }
  
// // //   formatLabel(key: string): string {
// // //     return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
// // //   }

// // //  getEnumOptions(def: any) {
// // //   if (!def.enum) return [];
  
// // //   return def.enum.map((opt: string) => {
// // //     // Improve formatting: "dark-mode-v2" -> "DARK MODE V2"
// // //     const label = opt.toString()
// // //       .replace(/_/g, ' ')
// // //       .replace(/-/g, ' ') // Handle hyphens
// // //       .toUpperCase();
      
// // //     return { label, value: opt };
// // //   });
// // // }
// // //   // getEnumOptions(def: any) {
// // //   //   if (!def.enum) return [];
// // //   //   return def.enum.map((opt: string) => ({ label: opt.toString().replace(/_/g, ' ').toUpperCase(), value: opt }));
// // //   // }

// // //   getArraySchema(field: any) {
// // //     return Object.keys(field.schema).map(k => ({ key: k, label: this.formatLabel(k), ...field.schema[k] }));
// // //   }
// // // }
