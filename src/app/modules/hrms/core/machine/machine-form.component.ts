import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map, Subject } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { takeUntil } from "rxjs/operators";
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-machine-form',
  standalone: true,
  imports: [ReactiveFormsModule, ToggleSwitchModule, SelectModule, ButtonModule, InputTextModule, MasterDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="page-title">{{ isEditMode() ? 'Edit Device' : 'Add New Device' }}</h1>
            <p class="page-subtitle">Configure biometric attendance machines and IoT gateways.</p>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-status" [class.valid]="machineForm.valid">
            <div class="status-dot"></div>
            <span>{{ machineForm.valid ? 'Ready' : 'Draft' }}</span>
          </div>
          <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || machineForm.invalid" (click)="onSubmit()">
            @if (!isSubmitting()) {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              <span>{{ isEditMode() ? 'Update' : 'Register' }}</span>
            } @else {
              <div class="spinner"></div>
              <span>{{ isEditMode() ? 'Updating' : 'Saving' }}</span>
            }
          </button>
        </div>
      </header>

      <main class="dashboard-content" [class.loading-opacity]="isLoading()">
        <form [formGroup]="machineForm" class="bento-grid">
          
          <div class="grid-card span-2 card-anim-1">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
              <h2 class="card-title">Device Identity</h2>
            </div>
            
            <div class="card-body">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="name">Device Name <span class="required">*</span></label>
                  <input id="name" type="text" formControlName="name" class="se-input" placeholder="e.g. Main Entrance Gate 1">
                </div>

                <div class="form-field">
                  <label for="serialNumber">Serial Number <span class="required">*</span></label>
                  <input id="serialNumber" type="text" formControlName="serialNumber" class="se-input uppercase-input" placeholder="e.g. SN-99887766">
                </div>

                <div class="form-field">
                  <label for="branchId">Branch Location <span class="required">*</span></label>
                  <app-master-dropdown 
                    endpoint="branches" 
                    formControlName="branchId" 
                    placeholder="Select Branch">
                  </app-master-dropdown>
                </div>

                <div class="form-field">
                  <label for="providerType">Device Provider</label>
                  <p-select id="providerType" formControlName="providerType" [options]="deviceProviderOptions" optionLabel="label" optionValue="value" styleClass="full-width" [filter]="true" filterBy="label"></p-select>
                </div>

                <div class="form-field">
                  <label for="model">Model Number</label>
                  <input id="model" type="text" formControlName="model" class="se-input" placeholder="e.g. uFace800">
                </div>

                <div class="form-field">
                  <label for="manufacturer">Manufacturer</label>
                  <input id="manufacturer" type="text" formControlName="manufacturer" class="se-input" placeholder="e.g. ZKTeco Inc.">
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-2">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
              <h2 class="card-title">Network Config</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="form-field">
                <label for="ipAddress">Static IP Address</label>
                <input id="ipAddress" type="text" formControlName="ipAddress" class="se-input" placeholder="192.168.1.201">
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="port">Port</label>
                  <input id="port" type="number" formControlName="port" class="se-input" placeholder="4370">
                </div>
                <div class="form-field">
                  <label for="timeout">Timeout (ms)</label>
                  <input id="timeout" type="number" formControlName="timeout" class="se-input" placeholder="5000">
                </div>
              </div>

              <div class="form-field">
                <label for="connectionProtocol">Protocol</label>
                <p-select id="connectionProtocol" formControlName="connectionProtocol" [options]="protocolOptions" optionLabel="label" optionValue="value" styleClass="full-width" [filter]="true" filterBy="label"></p-select>
              </div>
            </div>
          </div>

          <div class="grid-card span-2 card-anim-3" formGroupName="capabilities">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg></div>
              <h2 class="card-title">Biometric Capabilities</h2>
            </div>
            
            <div class="card-body">
              <div class="toggle-grid">
                
                <label class="toggle-card cursor-pointer">
                  <input type="checkbox" formControlName="fingerprint" style="display:none">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm10 6c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"></path></svg></span>
                    <span>Fingerprint</span>
                    <p-toggleswitch formControlName="fingerprint" class="mt-2"></p-toggleswitch>
                  </div>
                </label>

                <label class="toggle-card cursor-pointer">
                  <input type="checkbox" formControlName="faceRecognition" style="display:none">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg></span>
                    <span>Face ID</span>
                    <p-toggleswitch formControlName="faceRecognition" class="mt-2"></p-toggleswitch>
                  </div>
                </label>

                <label class="toggle-card cursor-pointer">
                  <input type="checkbox" formControlName="rfid" style="display:none">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="10" y2="16"></line></svg></span>
                    <span>RFID Card</span>
                    <p-toggleswitch formControlName="rfid" class="mt-2"></p-toggleswitch>
                  </div>
                </label>

                <label class="toggle-card cursor-pointer">
                  <input type="checkbox" formControlName="maskDetection" style="display:none">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4A10 10 0 0 1 12 2z"></path></svg></span>
                    <span>Mask Detect</span>
                    <p-toggleswitch formControlName="maskDetection" class="mt-2"></p-toggleswitch>
                  </div>
                </label>

                <label class="toggle-card cursor-pointer">
                  <input type="checkbox" formControlName="temperature" style="display:none">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg></span>
                    <span>Thermal</span>
                    <p-toggleswitch formControlName="temperature" class="mt-2"></p-toggleswitch>
                  </div>
                </label>

              </div>
            </div>
          </div>

          <div class="grid-card card-anim-4">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg></div>
              <h2 class="card-title">Sync Settings</h2>
            </div>
            
            <div class="card-body flex-col" formGroupName="config">
              
              <label class="status-toggle-wrapper flex-between cursor-pointer" style="margin-top: 0; margin-bottom: var(--spacing-sm);">
                  <div class="toggle-text"><span class="toggle-label font-bold text-sm">Auto-Sync Enabled</span></div>
                  <p-toggleswitch formControlName="autoSync"></p-toggleswitch>
              </label>

              <div class="form-field">
                <label for="syncInterval">Sync Interval (Minutes)</label>
                <input id="syncInterval" type="number" formControlName="syncInterval" class="se-input" min="1" placeholder="5">
              </div>

              <div class="form-field">
                <label for="timezone">Device Timezone</label>
                <input id="timezone" type="text" formControlName="timezone" class="se-input" placeholder="Asia/Kolkata">
              </div>

              <div class="divider"></div>

              <div class="form-field">
                <label for="status">Operational Status</label>
                <p-select id="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" styleClass="full-width" [filter]="true" filterBy="label"></p-select>
              </div>

            </div>
          </div>

        </form>
      </main>
    </div>
  `,
  styles: [`
    /* Using your established Design System */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
    .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .header-status { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--text-secondary); padding: 6px 12px; background: var(--component-surface-raised); border-radius: 999px; border: 1px solid var(--border-primary); margin-right: var(--spacing-md); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success); border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 5%, transparent); }
    .header-status.valid .status-dot { background: var(--color-success); }

    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); transition: opacity 0.3s; }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
    .span-2 { grid-column: span 2; }
    
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); }
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.03em; }
    .required { color: var(--color-error); }
    .se-input { width: 100%; background: var(--component-bg); border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--text-primary); box-sizing: border-box; height: 36px; }
    .uppercase-input { text-transform: uppercase; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
    .select-wrapper::after { content: ""; position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); width: 8px; height: 5px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; pointer-events: none; }

    /* Custom Toggle Grid for Capabilities */
    .toggle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
    .toggle-card { position: relative; cursor: pointer; }
    .toggle-card input { display: none; }
    .toggle-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: 8px; transition: all 0.2s; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; text-align: center; }
    .toggle-icon { color: var(--text-tertiary); transition: color 0.2s; }
    .toggle-card input:checked + .toggle-content { background: color-mix(in srgb, var(--color-primary) 10%, transparent); border-color: var(--color-primary); color: var(--color-primary); }
    .toggle-card input:checked + .toggle-content .toggle-icon { color: var(--color-primary); }

    .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
    .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
    .toggle-input { display: none; }
    .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
    .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
    .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
    .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
    .divider { height: 1px; background: var(--border-primary); margin: 8px 0; }
    .loading-opacity { opacity: 0.5; pointer-events: none; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; }
    
    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .inner-grid-2 { grid-template-columns: 1fr; }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
      .header-right { justify-content: space-between; }
    }
  `]
})
export class MachineFormComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  machineForm!: FormGroup;
  
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  machineId: string | null = null;

  deviceProviderOptions: any[] = [];
  protocolOptions: any[] = [];
  statusOptions: any[] = [];

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  private initForm() {
    this.machineForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      serialNumber: ['', [Validators.required]],
      branchId: [null, [Validators.required]],
      providerType: ['generic'],
      model: [''],
      manufacturer: [''],
      
      ipAddress: [''],
      port: [null],
      timeout: [5000],
      connectionProtocol: ['http'],

      capabilities: this.fb.group({
        fingerprint: [true],
        faceRecognition: [false],
        rfid: [false],
        maskDetection: [false],
        temperature: [false]
      }),

      config: this.fb.group({
        autoSync: [true],
        syncInterval: [5, [Validators.min(1)]],
        timezone: ['Asia/Kolkata']
      }),

      status: ['active']
    });

    this.deviceProviderOptions = [
      { label: 'Generic / Custom', value: 'generic' },
      { label: 'ZKTeco', value: 'zkteco' },
      { label: 'Hikvision', value: 'hikvision' },
      { label: 'eSSL', value: 'essl' },
      { label: 'BioEnable', value: 'bioenable' },
      { label: 'Suprema', value: 'suprema' }
    ];

    this.protocolOptions = [
      { label: 'HTTP / HTTPS', value: 'http' },
      { label: 'TCP / IP', value: 'tcp' },
      { label: 'WebSocket', value: 'websocket' },
      { label: 'MQTT', value: 'mqtt' },
      { label: 'USB (Local)', value: 'usb' }
    ];

    this.statusOptions = [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Maintenance', value: 'maintenance' }
    ];

    this.machineForm.get('serialNumber')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.machineForm.get('serialNumber')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private checkEditMode() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.machineId = id;
        this.loadMachineDetails();
      }
    });
  }

  private loadMachineDetails() {
    this.isLoading.set(true);
    this.machineForm.disable(); 
    
    this.hrmsService.getMachine(this.machineId!).pipe(
      map((res: any) => res?.data?.machine || res),
      catchError(err => {
        this.isLoading.set(false);
        this.machineForm.enable();
        this.messageService.handleHttpError(err)
        return of(null);
      }), takeUntil(this.destroy$)
    ).subscribe((data) => {
      if (data) {
        this.patchFormValues(data);
      }
      this.isLoading.set(false);
      this.machineForm.enable();
    });
  }

  private patchFormValues(data: any) {
    this.machineForm.patchValue({
      name: data.name,
      serialNumber: data.serialNumber,
      branchId: data.branchId?._id || data.branchId,
      providerType: data.providerType || 'generic',
      model: data.model,
      manufacturer: data.manufacturer,
      
      ipAddress: data.ipAddress,
      port: data.port,
      timeout: data.timeout || 5000,
      connectionProtocol: data.connectionProtocol || 'http',

      capabilities: {
        fingerprint: data.capabilities?.fingerprint ?? true,
        faceRecognition: data.capabilities?.faceRecognition ?? false,
        rfid: data.capabilities?.rfid ?? false,
        maskDetection: data.capabilities?.maskDetection ?? false,
        temperature: data.capabilities?.temperature ?? false
      },

      config: {
        autoSync: data.config?.autoSync ?? true,
        syncInterval: data.config?.syncInterval || 5,
        timezone: data.config?.timezone || 'Asia/Kolkata'
      },

      status: data.status || 'active'
    });
  }

  onSubmit() {
    if (this.machineForm.invalid) {
      this.machineForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = { ...this.machineForm.value };

    if (this.isEditMode()) {
      this.hrmsService.updateMachine(this.machineId!, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.messageService.showSuccess( 'Machine configuration updated');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err)
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.hrmsService.createMachine(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess( 'New machine registered successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err)
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/hrms/attendance/machines']);
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}