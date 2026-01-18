import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-schema-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ColorPickerModule,
    ToggleSwitchModule,
    ButtonModule,
    TextareaModule
  ],
  templateUrl: './schema-form.component.html'
})
export class SchemaFormComponent implements OnChanges {
  @Input() schema!: Record<string, any>;
  @Input() value: any = {};

  @Output() valueChange = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  form!: FormGroup;

  ngOnChanges() {
    if (!this.schema) return;
    this.form = this.buildGroup(this.schema, this.value);

    this.form.valueChanges.subscribe(v => {
      if (this.form.valid) this.valueChange.emit(v);
    });
  }

  /* ---------- BUILDERS ---------- */
  private buildGroup(schema: any, value: any): FormGroup {
    const group: Record<string, AbstractControl> = {};

    for (const key of Object.keys(schema)) {
      group[key] = this.buildControl(schema[key], value?.[key]);
    }

    return this.fb.group(group);
  }

  private buildControl(def: any, value: any): AbstractControl {
    const validators = [];

    if (def.required) validators.push(Validators.required);
    if (def.maxLength) validators.push(Validators.maxLength(def.maxLength));
    if (def.min !== undefined) validators.push(Validators.min(def.min));
    if (def.max !== undefined) validators.push(Validators.max(def.max));

    switch (def.type) {
      case 'string':
      case 'number':
      case 'boolean':
        return this.fb.control(value ?? def.default ?? null, validators);

      case 'array':
        return this.buildArray(def, value);

      case 'object':
        return this.buildGroup(def.schema, value ?? {});

      default:
        return this.fb.control(value ?? null);
    }
  }


  private buildArray(def: any, value: any[]): FormArray {
    const arr = this.fb.array<AbstractControl>([]);

    (value || []).forEach(v => {
      arr.push(this.buildGroup(def.schema, v));
    });

    if (def.required && arr.length === 0) {
      arr.setValidators(Validators.required);
    }

    return arr;
  }

  /* ---------- HELPERS ---------- */
  array(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }


  addItem(name: string) {
    const def = this.schema[name];
    this.array(name).push(this.buildGroup(def.schema, {}));
  }

  removeItem(name: string, i: number) {
    this.array(name).removeAt(i);
  }

  options(enumArr: string[]) {
    return enumArr.map(v => ({ label: this.label(v), value: v }));
  }

  label(key: string) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
  }
}
