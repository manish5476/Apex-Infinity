import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map } from 'rxjs';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';



@Component({
  selector: 'app-machine-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
            <ng-container *ngIf="!isSubmitting(); else loadingState">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              <span>{{ isEditMode() ? 'Update' : 'Register' }}</span>
            </ng-container>
            <ng-template #loadingState>
              <div class="spinner"></div>
              <span>{{ isEditMode() ? 'Updating' : 'Saving' }}</span>
            </ng-template>
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
                  <div class="select-wrapper">
                    <select id="branchId" formControlName="branchId" class="se-input">
                      <option [ngValue]="null">Select Branch</option>
                      @for (branch of branchOptions(); track branch._id) {
                        <option [value]="branch._id">{{ branch.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-field">
                  <label for="providerType">Device Provider</label>
                  <div class="select-wrapper">
                    <select id="providerType" formControlName="providerType" class="se-input">
                      <option value="generic">Generic / Custom</option>
                      <option value="zkteco">ZKTeco</option>
                      <option value="hikvision">Hikvision</option>
                      <option value="essl">eSSL</option>
                      <option value="bioenable">BioEnable</option>
                      <option value="suprema">Suprema</option>
                    </select>
                  </div>
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
                <div class="select-wrapper">
                  <select id="connectionProtocol" formControlName="connectionProtocol" class="se-input">
                    <option value="http">HTTP / HTTPS</option>
                    <option value="tcp">TCP / IP</option>
                    <option value="websocket">WebSocket</option>
                    <option value="mqtt">MQTT</option>
                    <option value="usb">USB (Local)</option>
                  </select>
                </div>
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
                
                <label class="toggle-card">
                  <input type="checkbox" formControlName="fingerprint">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm10 6c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"></path></svg></span>
                    <span>Fingerprint</span>
                  </div>
                </label>

                <label class="toggle-card">
                  <input type="checkbox" formControlName="faceRecognition">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg></span>
                    <span>Face ID</span>
                  </div>
                </label>

                <label class="toggle-card">
                  <input type="checkbox" formControlName="rfid">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="10" y2="16"></line></svg></span>
                    <span>RFID Card</span>
                  </div>
                </label>

                <label class="toggle-card">
                  <input type="checkbox" formControlName="maskDetection">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4A10 10 0 0 1 12 2z"></path></svg></span>
                    <span>Mask Detect</span>
                  </div>
                </label>

                <label class="toggle-card">
                  <input type="checkbox" formControlName="temperature">
                  <div class="toggle-content">
                    <span class="toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg></span>
                    <span>Thermal</span>
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
              
              <div class="status-toggle-wrapper" style="margin-top: 0; margin-bottom: var(--spacing-sm);">
                <label class="toggle-container">
                  <input type="checkbox" formControlName="autoSync" class="toggle-input">
                  <span class="toggle-slider"></span>
                  <div class="toggle-text"><span class="toggle-label">Auto-Sync Enabled</span></div>
                </label>
              </div>

              <div class="form-field">
                <label for="syncInterval">Sync Interval (Minutes)</label>
                <input id="syncInterval" type="number" formControlName="syncInterval" class="se-input" min="1" placeholder="5">
              </div>

              <div class="form-field">
                <label for="timezone">Device Timezone</label>
                <input id="timezone" type="text" formControlName="timezone" class="se-input" placeholder="Asia/Kolkata">
              </div>

              <div class="divider"></div>

              <div class="form-field" [formGroup]="machineForm">
                <label for="status">Operational Status</label>
                <div class="select-wrapper">
                  <select id="status" formControlName="status" class="se-input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
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
export class MachineFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  machineForm!: FormGroup;
  
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  machineId: string | null = null;

  branchOptions = this.masterList.branches;

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

    // Auto-uppercase
    this.machineForm.get('serialNumber')?.valueChanges.subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.machineForm.get('serialNumber')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private checkEditMode() {
    this.route.paramMap.subscribe(params => {
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
      })
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
      this.hrmsService.updateMachine(this.machineId!, payload).subscribe({
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
      this.hrmsService.createMachine(payload).subscribe({
        next: (res: any) => {
          // Note: response might contain the new apiKey, could show a modal here
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
}



// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { HRMSService } from '../../../hrms.service';
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { DropdownModule } from 'primeng/dropdown';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { InputSwitchModule } from 'primeng/inputswitch';
// import { ToastModule } from 'primeng/toast';
// import { DialogModule } from 'primeng/dialog';
// import { SkeletonModule } from 'primeng/skeleton';

// @Component({
//   selector: 'app-machine-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, CardModule, ButtonModule,
//     InputTextModule, DropdownModule, InputNumberModule, InputSwitchModule,
//     ToastModule, DialogModule, SkeletonModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-wrapper fade-in">
//       <header class="dashboard-header slide-down mb-5">
//         <div class="header-left">
//           <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onCancel()"></p-button>
//           <div class="header-titles">
//             <h1 class="page-title m-0">{{ isEditMode() ? 'Edit Device Configuration' : 'Register New Device' }}</h1>
//             <p class="page-subtitle mt-1">Configure networking, protocols, and capabilities for this attendance machine.</p>
//           </div>
//         </div>
//       </header>

//       @if (isLoading()) {
//         <p-card styleClass="premium-card glass-card"><p-skeleton width="100%" height="400px"></p-skeleton></p-card>
//       } @else {
        
//         <form [formGroup]="machineForm" (ngSubmit)="onSubmit()" class="flex-col gap-5 pb-6">
          
//           <div class="grid-layout">
//             <div class="flex-col gap-5">
//               <p-card styleClass="premium-card glass-card slide-down" style="animation-delay: 0.1s">
//                 <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3 text-primary-color"><i class="pi pi-box mr-2"></i> Device Identity</h3>
                
//                 <div class="input-group mb-4">
//                   <label class="info-label">Device Name <span class="text-error">*</span></label>
//                   <input pInputText formControlName="name" placeholder="e.g. Main Entrance Gate 1" class="w-full premium-input" />
//                 </div>
                
//                 <div class="grid-2 gap-4">
//                   <div class="input-group">
//                     <label class="info-label">Serial Number (SN) <span class="text-error">*</span></label>
//                     <input pInputText formControlName="serialNumber" placeholder="Device SN" class="w-full premium-input uppercase" />
//                   </div>
//                   <div class="input-group">
//                     <label class="info-label">Manufacturer / Provider</label>
//                     <p-dropdown formControlName="providerType" [options]="providers" placeholder="Select Manufacturer" styleClass="w-full premium-dropdown"></p-dropdown>
//                   </div>
//                   <div class="input-group">
//                     <label class="info-label">Model Number</label>
//                     <input pInputText formControlName="model" placeholder="e.g. K40" class="w-full premium-input" />
//                   </div>
//                   <div class="input-group">
//                     <label class="info-label">Firmware Version</label>
//                     <input pInputText formControlName="firmwareVersion" placeholder="v1.0.0" class="w-full premium-input" />
//                   </div>
//                 </div>
//               </p-card>

//               <p-card styleClass="premium-card glass-card slide-down" style="animation-delay: 0.15s">
//                 <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3 text-primary-color"><i class="pi pi-wifi mr-2"></i> Network & Connectivity</h3>
                
//                 <div class="grid-2 gap-4">
//                   <div class="input-group span-2">
//                     <label class="info-label">Connection Protocol <span class="text-error">*</span></label>
//                     <p-dropdown formControlName="connectionProtocol" [options]="protocols" placeholder="Select Protocol" styleClass="w-full premium-dropdown"></p-dropdown>
//                   </div>
//                   <div class="input-group">
//                     <label class="info-label">Static IP Address</label>
//                     <input pInputText formControlName="ipAddress" placeholder="192.168.1.x" class="w-full premium-input font-mono" />
//                   </div>
//                   <div class="input-group">
//                     <label class="info-label">Port</label>
//                     <p-inputNumber formControlName="port" placeholder="e.g. 4370" [useGrouping]="false" styleClass="w-full premium-input"></p-inputNumber>
//                   </div>
//                   <div class="input-group span-2">
//                     <label class="info-label">MAC Address</label>
//                     <input pInputText formControlName="macAddress" placeholder="00:00:00:00:00:00" class="w-full premium-input font-mono uppercase" />
//                   </div>
//                 </div>
//               </p-card>
//             </div>

//             <div class="flex-col gap-5">
              
//               <p-card styleClass="premium-card glass-card slide-down" style="animation-delay: 0.2s">
//                 <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3 text-primary-color"><i class="pi pi-verified mr-2"></i> Hardware Capabilities</h3>
                
//                 <div formGroupName="capabilities" class="flex-col gap-3">
//                   <div class="flex-between bg-surface p-3 border-radius-md">
//                     <span class="font-medium text-sm"><i class="pi pi-camera text-tertiary mr-2"></i> Face Recognition</span>
//                     <p-inputSwitch formControlName="faceRecognition"></p-inputSwitch>
//                   </div>
//                   <div class="flex-between bg-surface p-3 border-radius-md">
//                     <span class="font-medium text-sm"><i class="pi pi-user text-tertiary mr-2"></i> Fingerprint Scanner</span>
//                     <p-inputSwitch formControlName="fingerprint"></p-inputSwitch>
//                   </div>
//                   <div class="flex-between bg-surface p-3 border-radius-md">
//                     <span class="font-medium text-sm"><i class="pi pi-id-card text-tertiary mr-2"></i> RFID Card Reader</span>
//                     <p-inputSwitch formControlName="rfid"></p-inputSwitch>
//                   </div>
//                 </div>
//               </p-card>

//               <p-card styleClass="premium-card glass-card slide-down" style="animation-delay: 0.25s">
//                 <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3 text-primary-color"><i class="pi pi-cog mr-2"></i> Sync Configuration</h3>
                
//                 <div formGroupName="config" class="flex-col gap-4">
//                   <div class="grid-2 gap-4">
//                     <div class="input-group">
//                       <label class="info-label">Sync Interval (Mins)</label>
//                       <p-inputNumber formControlName="syncInterval" [min]="1" [max]="120" styleClass="w-full premium-input"></p-inputNumber>
//                     </div>
//                     <div class="input-group">
//                       <label class="info-label">Retry Attempts</label>
//                       <p-inputNumber formControlName="retryAttempts" [min]="1" [max]="10" styleClass="w-full premium-input"></p-inputNumber>
//                     </div>
//                   </div>
//                   <div class="flex-between mt-2 pt-2 border-top">
//                     <span class="font-bold text-sm text-secondary">Auto-Sync Enabled</span>
//                     <p-inputSwitch formControlName="autoSync"></p-inputSwitch>
//                   </div>
//                 </div>
//               </p-card>

//             </div>
//           </div>

//           <div class="form-footer flex-align justify-end gap-3 mt-4 slide-down" style="animation-delay: 0.3s">
//             <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
//             <p-button [label]="isEditMode() ? 'Save Configuration' : 'Register & Generate Key'" icon="pi pi-check" type="submit" [loading]="isSaving()" [disabled]="machineForm.invalid" styleClass="p-button-primary shadow-md"></p-button>
//           </div>
//         </form>
//       }
//     </div>

//     <p-dialog header="Device Registered Successfully" [(visible)]="displayKeyModal" [modal]="true" [closable]="false" [style]="{width: '500px'}" styleClass="premium-dialog">
//       <div class="text-center mb-4">
//         <i class="pi pi-check-circle text-success text-5xl mb-3"></i>
//         <h3 class="m-0 font-heading">Secure API Key Generated</h3>
//       </div>
      
//       <p class="text-sm text-secondary mb-3 text-center">
//         Please copy this API key and configure it within the physical device or sync utility. 
//         <strong class="text-error">For security reasons, this key will never be shown again.</strong>
//       </p>

//       <div class="api-key-box bg-surface p-4 border-radius-md border-1 surface-border flex-between mb-4">
//         <code class="font-bold text-primary-color break-all">{{ generatedApiKey }}</code>
//         <p-button icon="pi pi-copy" [text]="true" [rounded]="true" severity="secondary" pTooltip="Copy to clipboard" (onClick)="copyKey()"></p-button>
//       </div>

//       <div class="flex-align justify-center border-top pt-4">
//         <p-button label="I have copied the key, proceed" styleClass="p-button-primary" (onClick)="closeKeyModal()"></p-button>
//       </div>
//     </p-dialog>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
//     .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-2xl); align-items: start; }
//     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
//     .span-2 { grid-column: span 2; }
    
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .justify-end { justify-content: flex-end; }
//     .justify-center { justify-content: center; }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
//     .gap-5 { gap: var(--spacing-2xl); }
    
//     .m-0 { margin: 0; }
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-4 { margin-top: var(--spacing-xl); }
//     .mr-2 { margin-right: var(--spacing-sm); }
    
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .pb-3 { padding-bottom: var(--spacing-md); }
//     .pb-6 { padding-bottom: var(--spacing-4xl); }
//     .pt-2 { padding-top: var(--spacing-sm); }
//     .pt-4 { padding-top: var(--spacing-xl); }
    
//     .w-full { width: 100%; }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
//     .text-center { text-align: center; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-5xl { font-size: 3rem; }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-success { color: var(--color-success); }
//     .text-error { color: var(--color-error); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .uppercase { text-transform: uppercase; }
//     .break-all { word-break: break-all; }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; }
//     .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

//     /* Cards & Form */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-sm); }
//     ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); }
//     ::ng-deep .premium-card .p-card-content { padding: 0; }
    
//     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
//     .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

//     ::ng-deep .premium-input, ::ng-deep .premium-dropdown .p-dropdown, ::ng-deep .premium-input .p-inputnumber-input { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); color: var(--text-primary); }
//     ::ng-deep .premium-input:focus, ::ng-deep .premium-dropdown .p-dropdown.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

//     .form-footer { position: sticky; bottom: 0; background: var(--bg-primary); padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-primary); z-index: 10; margin-top: var(--spacing-2xl); }

//     ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
//     ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
//   `]
// })
// export class MachineFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   machineForm!: FormGroup;
//   isLoading = signal(true);
//   isSaving = signal(false);
//   isEditMode = signal(false);
//   machineId: string | null = null;

//   // Dialog State
//   displayKeyModal = false;
//   generatedApiKey: string = '';

//   providers = [
//     { label: 'ZKTeco', value: 'zkteco' },
//     { label: 'Hikvision', value: 'hikvision' },
//     { label: 'eSSL', value: 'essl' },
//     { label: 'Suprema', value: 'suprema' },
//     { label: 'BioEnable', value: 'bioenable' },
//     { label: 'Generic / Custom', value: 'generic' }
//   ];

//   protocols = [
//     { label: 'HTTP (REST API)', value: 'http' },
//     { label: 'TCP/IP', value: 'tcp' },
//     { label: 'WebSocket (WSS)', value: 'websocket' },
//     { label: 'MQTT', value: 'mqtt' }
//   ];

//   ngOnInit() {
//     this.initForm();
//     this.machineId = this.route.snapshot.paramMap.get('id');
    
//     if (this.machineId) {
//       this.isEditMode.set(true);
//       this.loadMachine(this.machineId);
//     } else {
//       this.isLoading.set(false);
//     }
//   }

//   private initForm() {
//     this.machineForm = this.fb.group({
//       organizationId: ['698f1a7feff3e811b71a590f', Validators.required], // Injected normally
//       branchId: ['698f1a82eff3e811b71a5916', Validators.required],
      
//       name: ['', Validators.required],
//       serialNumber: ['', Validators.required],
//       providerType: ['generic'],
//       model: [''],
//       firmwareVersion: [''],
      
//       connectionProtocol: ['http', Validators.required],
//       ipAddress: [''],
//       port: [null],
//       macAddress: [''],
      
//       capabilities: this.fb.group({
//         faceRecognition: [false],
//         fingerprint: [true],
//         rfid: [false]
//       }),
      
//       config: this.fb.group({
//         syncInterval: [5],
//         retryAttempts: [3],
//         autoSync: [true]
//       })
//     });
//   }

//   private loadMachine(id: string) {
//     this.hrmsService.getMachine(id).pipe(
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load device configuration.' });
//         this.onCancel();
//         return of(null);
//       }),
//       finalize(() => this.isLoading.set(false))
//     ).subscribe((res: any) => {
//       const data = res?.data?.machine;
//       if (data) {
//         this.machineForm.patchValue(data);
//       }
//     });
//   }

//   onSubmit() {
//     if (this.machineForm.invalid) {
//       this.machineForm.markAllAsTouched();
//       return;
//     }

//     this.isSaving.set(true);
//     const payload = this.machineForm.value;

//     const req$ = this.isEditMode() && this.machineId
//       ? this.hrmsService.updateMachine(this.machineId, payload)
//       : this.hrmsService.createMachine(payload);

//     req$.pipe(
//       catchError(err => {
//         this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err.error?.message || 'Server error.' });
//         return of(null);
//       }),
//       finalize(() => this.isSaving.set(false))
//     ).subscribe((res: any) => {
//       if (res) {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Device configuration saved.' });
        
//         // Show API key on Creation only
//         if (!this.isEditMode() && res.data?.apiKey) {
//           this.generatedApiKey = res.data.apiKey;
//           this.displayKeyModal = true;
//         } else {
//           setTimeout(() => this.onCancel(), 1000);
//         }
//       }
//     });
//   }

//   copyKey() {
//     navigator.clipboard.writeText(this.generatedApiKey).then(() => {
//       this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'API Key copied to clipboard.' });
//     });
//   }

//   closeKeyModal() {
//     this.displayKeyModal = false;
//     this.onCancel();
//   }

//   onCancel() {
//     this.router.navigate(['/attendance/machines']); // Adjust as needed
//   }
// }