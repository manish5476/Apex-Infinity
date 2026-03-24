import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Leaflet
import * as L from 'leaflet';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-geofence-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    CardModule, 
    ButtonModule,
    InputTextModule, 
    SelectModule, 
    InputNumberModule, 
    ToggleSwitchModule,
    SliderModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true" 
            [rounded]="true" 
            size="large" 
            severity="secondary" 
            (onClick)="onCancel()">
          </p-button>
          <div class="header-titles flex-col gap-xs">
            <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">
              {{ isEditMode() ? 'Edit Boundary' : 'Define New Boundary' }}
            </h1>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">
              Use the interactive map to place your virtual site perimeter.
            </p>
          </div>
        </div>
      </header>

      @if (isLoading()) {
        <div class="bento-grid">
          <div class="flex-col gap-xl">
            <p-skeleton width="100%" height="400px" borderRadius="16px"></p-skeleton>
            <p-skeleton width="100%" height="200px" borderRadius="16px"></p-skeleton>
          </div>
          <p-skeleton width="100%" height="600px" borderRadius="16px"></p-skeleton>
        </div>
      } @else {
        
        <form [formGroup]="fenceForm" (ngSubmit)="onSubmit()" class="flex-col gap-xl pb-4xl">
          
          <div class="bento-grid">
            
            <div class="flex-col gap-xl">
              
              <p-card styleClass="glass-panel border-radius-xl shadow-sm overflow-hidden p-0 slide-down" [style.animation-delay]="'0.1s'">
                <ng-template pTemplate="title">
                  <div class="flex align-items-center gap-sm border-bottom-subtle pb-sm">
                    <i class="pi pi-info-circle text-primary text-xl"></i>
                    <h3 class="font-heading text-lg m-0 font-bold text-primary">Fence Details</h3>
                  </div>
                </ng-template>
                
                <ng-template pTemplate="content">
                  <div class="flex-col gap-md mt-sm">
                    <div class="input-group flex-col gap-xs">
                      <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Boundary Name <span class="text-error">*</span></label>
                      <input pInputText formControlName="name" placeholder="e.g. Corporate HQ" class="w-full" />
                    </div>
                    
                    <div class="grid-2 gap-md">
                      <div class="input-group flex-col gap-xs">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Code <span class="text-error">*</span></label>
                        <input pInputText formControlName="code" placeholder="HQ-01" class="w-full uppercase font-mono" />
                      </div>
                      <div class="input-group flex-col gap-xs">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Shape Type</label>
                        <p-select formControlName="type" [options]="types" appendTo="body" styleClass="w-full" [filter]="true" filterBy="label"></p-select>

                      </div>
                    </div>
                    
                    <div formGroupName="address" class="input-group flex-col gap-xs">
                      <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Resolved City/Location Name</label>
                      <input pInputText formControlName="city" placeholder="e.g. Bangalore" class="w-full" />
                    </div>
                    
                    <div class="flex-between bg-primary-light p-md border-radius-md border-1 border-solid border-primary mt-sm">
                      <div class="flex-col gap-xs">
                        <span class="font-bold text-sm text-primary">Enable Geofence</span>
                        <span class="text-xs text-secondary">Toggle to instantly activate/deactivate this zone.</span>
                      </div>
                      <p-toggleswitch formControlName="isActive"></p-toggleswitch>
                    </div>
                  </div>
                </ng-template>
              </p-card>

              <p-card styleClass="glass-panel border-radius-xl shadow-sm overflow-hidden p-0 slide-down" [style.animation-delay]="'0.15s'">
                <ng-template pTemplate="title">
                  <div class="flex align-items-center gap-sm border-bottom-subtle pb-sm">
                    <i class="pi pi-compass text-primary text-xl"></i>
                    <h3 class="font-heading text-lg m-0 font-bold text-primary">Perimeter Rules</h3>
                  </div>
                </ng-template>
                
                <ng-template pTemplate="content">
                  <div class="flex-col gap-xl mt-sm">
                    
                    <div class="input-group flex-col gap-md">
                      <div class="flex-between w-full">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest m-0">Radius Coverage (Meters) <span class="text-error">*</span></label>
                        <span class="text-primary font-heading font-bold text-xl">{{ fenceForm.get('radius')?.value }}m</span>
                      </div>
                      <p-slider formControlName="radius" [min]="10" [max]="1000" [step]="5" (onChange)="updateMapCircle()"></p-slider>
                      <div class="flex-between text-xs font-mono text-tertiary"><span>10m</span><span>1000m</span></div>
                    </div>

                    <div class="grid-2 gap-md pt-md border-top-subtle">
                      <div class="input-group flex-col gap-xs">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Latitude</label>
                        <input pInputText [value]="fenceForm.get('center.coordinates')?.value?.[1] || ''" readonly class="w-full bg-secondary font-mono text-sm opacity-80" />
                      </div>
                      <div class="input-group flex-col gap-xs">
                        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Longitude</label>
                        <input pInputText [value]="fenceForm.get('center.coordinates')?.value?.[0] || ''" readonly class="w-full bg-secondary font-mono text-sm opacity-80" />
                      </div>
                    </div>
                    
                  </div>
                </ng-template>
              </p-card>

            </div>

            <div class="flex-col h-full slide-down" [style.animation-delay]="'0.2s'">
              <p-card styleClass="glass-panel border-radius-xl shadow-sm overflow-hidden p-0 h-full flex-col">
                <div class="map-toolbar bg-secondary px-xl py-md flex-between border-bottom-subtle">
                  <span class="text-sm font-bold text-primary flex align-items-center gap-sm">
                    <i class="pi pi-map-marker text-lg"></i> Click map to drop central pin
                  </span>
                  <p-button icon="pi pi-search" [text]="true" [rounded]="true" severity="secondary" pTooltip="Recenter to pin" tooltipPosition="left"></p-button>
                </div>
                <div #mapContainer id="leaflet-map" class="map-container flex-grow-1 w-full bg-surface" style="min-height: 550px; z-index: 1;"></div>
              </p-card>
            </div>

          </div>

          <div class="form-footer flex justify-content-end gap-md p-xl bg-primary border-top-subtle slide-down sticky bottom-0 z-10 border-radius-lg shadow-xl mt-xl border-1 border-solid border-secondary" [style.animation-delay]="'0.3s'">
            <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
            <p-button 
              [label]="isEditMode() ? 'Save Boundary' : 'Create Boundary'" 
              icon="pi pi-check" 
              type="submit" 
              [loading]="isSaving()" 
              [disabled]="fenceForm.invalid || !hasCoordinates()" 
              styleClass="p-button-primary">
            </p-button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
    .page-container { max-width: 1400px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .align-items-center { align-items: center; }
    .justify-content-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-grow-1 { flex-grow: 1; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    
    .bento-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--spacing-2xl); align-items: stretch; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-sm { margin-top: var(--spacing-sm); }
    .mt-xl { margin-top: var(--spacing-xl); }
    
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    .py-md { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .pb-sm { padding-bottom: var(--spacing-sm); }
    .pb-4xl { padding-bottom: var(--spacing-4xl); }
    .pt-md { padding-top: var(--spacing-md); }
    
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-xl { gap: var(--spacing-xl); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .max-w-prose { max-width: 65ch; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-error { color: var(--color-error, #dc2626); }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-surface { background: #e2e8f0; } /* Fallback for map loading */
    .bg-primary-light { background: color-mix(in srgb, var(--color-primary) 10%, transparent); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }
    .opacity-80 { opacity: 0.8; }
    
    .sticky { position: sticky; }
    .bottom-0 { bottom: 0; }
    .z-10 { z-index: 10; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    /* Responsive */
    @media (max-width: 1024px) {
      .bento-grid { grid-template-columns: 1fr; }
      .map-container { min-height: 400px !important; }
    }
    @media (max-width: 640px) {
      .page-container { padding: var(--spacing-xl) var(--spacing-md); }
      .grid-2 { grid-template-columns: 1fr; }
      .form-footer { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class GeofenceFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fenceForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  isEditMode = signal(false);
  fenceId: string | null = null;

  types = [{ label: 'Circular Radius', value: 'circle' }];

  // Leaflet Map State
  private map!: L.Map;
  private marker!: L.Marker;
  private circle!: L.Circle;

  // Default to India Center if no coordinates
  private defaultLat = 20.5937;
  private defaultLng = 78.9629;

  ngOnInit() {
    this.initForm();
    this.fenceId = this.route.snapshot.paramMap.get('id');
    
    if (this.fenceId) {
      this.isEditMode.set(true);
      this.loadFence(this.fenceId);
    } else {
      this.isLoading.set(false);
    }
  }

  ngAfterViewInit() {
    // Only init map if the container exists (handled after loading signal flips)
    if (!this.isLoading()) {
      this.initMapSafely();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initForm() {
    this.fenceForm = this.fb.group({
      organizationId: ['org_01', Validators.required], // Inject auth context here
      name: ['', Validators.required],
      code: ['', Validators.required],
      type: ['circle'],
      radius: [100, [Validators.required, Validators.min(10)]],
      center: this.fb.group({
        type: ['Point'],
        coordinates: [[]] // [lng, lat]
      }),
      address: this.fb.group({
        city: ['']
      }),
      isActive: [true]
    });
  }

  private loadFence(id: string) {
    this.hrmsService.getGeoFence(id).pipe(
      catchError((error) => {
        this.messageService.handleHttpError(error)
        this.onCancel();
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      if (res?.data?.geofence) {
        this.fenceForm.patchValue(res.data.geofence);
        
        // Wait for Angular to destroy skeleton and render map container
        setTimeout(() => this.initMapSafely(), 50);
      }
    });
  }

  // --- Leaflet Integration ---
  private initMapSafely() {
    if (!this.mapContainer || this.map) return;

    this.map = L.map(this.mapContainer.nativeElement).setView([this.defaultLat, this.defaultLng], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      this.fenceForm.get('center.coordinates')?.setValue([lng, lat]);
      this.drawMarkerAndCircle(lat, lng);
    });

    if (this.hasCoordinates()) {
      this.updateMapFromForm();
    }
  }

  private drawMarkerAndCircle(lat: number, lng: number) {
    if (!this.map) return;

    const radius = this.fenceForm.get('radius')?.value || 100;

    if (this.marker) this.map.removeLayer(this.marker);
    if (this.circle) this.map.removeLayer(this.circle);

    // Custom Icon using standard CSS vars
    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: var(--color-primary); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
    this.circle = L.circle([lat, lng], {
      color: 'var(--color-primary)',
      fillColor: 'var(--color-primary)',
      fillOpacity: 0.2,
      radius: radius
    }).addTo(this.map);

    this.map.setView([lat, lng], 16); 
  }

  updateMapCircle() {
    const coords = this.fenceForm.get('center.coordinates')?.value;
    if (coords && coords.length === 2) {
      this.drawMarkerAndCircle(coords[1], coords[0]);
    }
  }

  private updateMapFromForm() {
    const coords = this.fenceForm.get('center.coordinates')?.value;
    if (coords && coords.length === 2) {
      this.drawMarkerAndCircle(coords[1], coords[0]);
    }
  }

  hasCoordinates(): boolean {
    const coords = this.fenceForm.get('center.coordinates')?.value;
    return Array.isArray(coords) && coords.length === 2 && coords[0] !== undefined;
  }

  // --- Submissions ---
  onSubmit() {
    if (this.fenceForm.invalid || !this.hasCoordinates()) return;

    this.isSaving.set(true);
    const payload = this.fenceForm.value;

    const req$ = this.isEditMode() && this.fenceId
      ? this.hrmsService.updateGeoFence(this.fenceId, payload)
      : this.hrmsService.createGeoFence(payload);

    req$.pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isSaving.set(false))
    ).subscribe((res:any) => {
      if (res) {
        this.messageService.showSuccess(res.message || 'Geofence saved successfully.')
        setTimeout(() => this.onCancel(), 1000);
      }
    });
  }

  onCancel() { 
    this.router.navigate(['/hrms/geofence']); 
  }
}



// import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, inject, signal, ViewChild, ElementRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Leaflet
// import * as L from 'leaflet';

// // Services
// import { MessageService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SliderModule } from 'primeng/slider';
// import { SelectModule } from 'primeng/select';
// import { ToggleSwitch, ToggleSwitchModule } from 'primeng/toggleswitch';
// import { HRMSService } from '../../hrms.service';
// import { AppMessageService } from '@core/services/message.service';
// import { error } from 'console';

// @Component({
//   selector: 'app-geofence-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, CardModule, ButtonModule,
//     InputTextModule, SelectModule, InputNumberModule, ToggleSwitchModule,
//     SliderModule
//   ],
//   providers: [MessageService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="page-wrapper fade-in">
//       <header class="dashboard-header slide-down mb-4">
//         <div class="header-left">
//           <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onCancel()"></p-button>
//           <div class="header-titles">
//             <h1 class="page-title m-0">{{ isEditMode() ? 'Edit Boundary' : 'Define New Boundary' }}</h1>
//             <p class="page-subtitle mt-1">Use the interactive map to place your virtual site perimeter.</p>
//           </div>
//         </div>
//       </header>

//       <form [formGroup]="fenceForm" (ngSubmit)="onSubmit()" class="flex-col gap-5 pb-6">
        
//         <div class="grid-layout">
          
//           <div class="flex-col gap-4">
//             <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.1s">
//               <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3"><i class="pi pi-info-circle text-primary mr-2"></i> Fence Details</h3>
              
//               <div class="flex-col gap-4">
//                 <div class="input-group">
//                   <label class="info-label">Boundary Name <span class="text-error">*</span></label>
//                   <input pInputText formControlName="name" placeholder="e.g. Corporate HQ" class="w-full premium-input" />
//                 </div>
//                 <div class="grid-2 gap-4">
//                   <div class="input-group">
//                     <label class="info-label">Code <span class="text-error">*</span></label>
//                     <input pInputText formControlName="code" placeholder="HQ-01" class="w-full premium-input uppercase" />
//                   </div>
//                   <div class="input-group">
//                     <label class="info-label">Shape Type</label>
//                     <p-select formControlName="type" [options]="types" styleClass="w-full premium-select"></p-select>
//                   </div>
//                 </div>
                
//                 <div formGroupName="address" class="input-group">
//                   <label class="info-label">Resolved City/Location Name</label>
//                   <input pInputText formControlName="city" placeholder="e.g. Bangalore" class="w-full premium-input" />
//                 </div>
                
//                 <div class="flex-between bg-surface p-3 border-radius-md mt-2">
//                   <span class="font-bold text-sm text-secondary">Enable Geofence</span>
//                   <p-toggleswitch formControlName="isActive"></p-toggleswitch>
//                 </div>
//               </div>
//             </p-card>

//             <p-card styleClass="premium-card glass-card slide-down" styleClas="animation-delay: 0.15s">
//               <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3"><i class="pi pi-compass text-primary mr-2"></i> Perimeter Rules</h3>
              
//               <div class="input-group mb-4">
//                 <label class="info-label flex-between">
//                   <span>Radius Coverage (Meters) <span class="text-error">*</span></span>
//                   <span class="text-primary font-bold text-lg">{{ fenceForm.get('radius')?.value }}m</span>
//                 </label>
//                 <p-slider formControlName="radius" [min]="10" [max]="1000" [step]="5" (onChange)="updateMapCircle()"></p-slider>
//                 <div class="flex-between text-xs text-tertiary mt-2"><span>10m</span><span>1000m</span></div>
//               </div>

//               <div class="grid-2 gap-4">
//                 <div class="input-group">
//                   <label class="info-label">Latitude</label>
//                   <input pInputText [value]="fenceForm.get('center.coordinates')?.value?.[1] || ''" readonly class="w-full premium-input bg-surface font-mono text-xs" />
//                 </div>
//                 <div class="input-group">
//                   <label class="info-label">Longitude</label>
//                   <input pInputText [value]="fenceForm.get('center.coordinates')?.value?.[0] || ''" readonly class="w-full premium-input bg-surface font-mono text-xs" />
//                 </div>
//               </div>
//             </p-card>
//           </div>

//           <div class="flex-col h-full slide-down" style="animation-delay: 0.2s">
//             <p-card styleClass="premium-card glass-card map-card h-full">
//               <div class="map-toolbar bg-secondary p-3 flex-between">
//                 <span class="text-sm font-bold text-white"><i class="pi pi-map-marker mr-2"></i> Click map to drop pin</span>
//                 <p-button icon="pi pi-search" [text]="true" styleClass="text-white" pTooltip="Recenter"></p-button>
//               </div>
//               <div #mapContainer id="leaflet-map" class="map-container"></div>
//             </p-card>
//           </div>

//         </div>

//         <div class="form-footer flex-align justify-end gap-3 mt-4 slide-down" style="animation-delay: 0.3s">
//           <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
//           <p-button [label]="isEditMode() ? 'Save Boundary' : 'Create Boundary'" icon="pi pi-check" type="submit" [loading]="isSaving()" [disabled]="fenceForm.invalid || !hasCoordinates()" styleClass="p-button-primary shadow-md"></p-button>
//         </div>

//       </form>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
//     .grid-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--spacing-2xl); align-items: stretch; }
//     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .justify-end { justify-content: flex-end; }
    
//     .w-full { width: 100%; }
//     .h-full { height: 100%; }
//     .gap-4 { gap: var(--spacing-lg); }
//     .gap-5 { gap: var(--spacing-2xl); }
    
//     .m-0 { margin: 0; }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-4 { margin-top: var(--spacing-xl); }
//     .mr-2 { margin-right: var(--spacing-sm); }
//     .pb-3 { padding-bottom: var(--spacing-md); }
//     .pb-6 { padding-bottom: var(--spacing-4xl); }
//     .p-3 { padding: var(--spacing-lg); }
    
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-error { color: var(--color-error); }
//     .text-white { color: white; }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .uppercase { text-transform: uppercase; }

//     .bg-surface { background: var(--bg-secondary); }
//     .bg-secondary { background: var(--text-secondary); } /* Darker bar for map */
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

//     /* Cards */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); height: 100%; display: flex; flex-direction: column; }
//     ::ng-deep .premium-card .p-card-content { padding: 0; flex: 1; }
    
//     ::ng-deep .map-card .p-card-body { padding: 0; }
//     .map-container { width: 100%; height: 100%; min-height: 500px; z-index: 1; }
    
//     /* Inputs */
//     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
//     .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
//     ::ng-deep .premium-input, ::ng-deep .premium-select .p-select { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); }
//     ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

//     ::ng-deep .p-slider .p-slider-range { background: var(--color-primary); }
//     ::ng-deep .p-slider .p-slider-handle { border: 2px solid var(--color-primary); }

//     .form-footer { position: sticky; bottom: 0; background: var(--bg-primary); padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-primary); z-index: 10; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } .map-container { min-height: 400px; } }
//   `]
// })
// export class GeofenceFormComponent implements OnInit, AfterViewInit, OnDestroy {
//   @ViewChild('mapContainer') mapContainer!: ElementRef;

//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   fenceForm!: FormGroup;
//   isLoading = signal(true);
//   isSaving = signal(false);
//   isEditMode = signal(false);
//   fenceId: string | null = null;

//   types = [{ label: 'Circular Radius', value: 'circle' }];

//   // Leaflet Map State
//   private map!: L.Map;
//   private marker!: L.Marker;
//   private circle!: L.Circle;

//   // Default to India Center if no coordinates
//   private defaultLat = 20.5937;
//   private defaultLng = 78.9629;

//   ngOnInit() {
//     this.initForm();
//     this.fenceId = this.route.snapshot.paramMap.get('id');
    
//     if (this.fenceId) {
//       this.isEditMode.set(true);
//       this.loadFence(this.fenceId);
//     } else {
//       this.isLoading.set(false);
//     }
//   }

//   ngAfterViewInit() {
//     // Wait slightly to ensure container is fully rendered by Angular
//     setTimeout(() => {
//       this.initMap();
//     }, 100);
//   }

//   ngOnDestroy() {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private initForm() {
//     this.fenceForm = this.fb.group({
//       organizationId: ['698f1a7feff3e811b71a590f', Validators.required],
//       name: ['', Validators.required],
//       code: ['', Validators.required],
//       type: ['circle'],
//       radius: [100, [Validators.required, Validators.min(10)]],
//       center: this.fb.group({
//         type: ['Point'],
//         coordinates: [[]] // [lng, lat]
//       }),
//       address: this.fb.group({
//         city: ['']
//       }),
//       isActive: [true]
//     });
//   }

//   private loadFence(id: string) {
//     this.hrmsService.getGeoFence(id).pipe(
//       catchError((error) => {
//         this.messageService.handleHttpError(error)
//         this.onCancel();
//         return of(null);
//       }),
//       finalize(() => this.isLoading.set(false))
//     ).subscribe((res: any) => {
//       if (res?.data?.geofence) {
//         this.fenceForm.patchValue(res.data.geofence);
//         this.updateMapFromForm();
//       }
//     });
//   }

//   // --- Leaflet Integration ---
//   private initMap() {
//     if (!this.mapContainer) return;

//     this.map = L.map(this.mapContainer.nativeElement).setView([this.defaultLat, this.defaultLng], 5);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors'
//     }).addTo(this.map);

//     // Handle Clicks
//     this.map.on('click', (e: L.LeafletMouseEvent) => {
//       const lat = e.latlng.lat;
//       const lng = e.latlng.lng;
      
//       this.fenceForm.get('center.coordinates')?.setValue([lng, lat]);
//       this.drawMarkerAndCircle(lat, lng);
//     });

//     // If edit mode and loaded early, draw it
//     if (this.hasCoordinates()) {
//       this.updateMapFromForm();
//     }
//   }

//   private drawMarkerAndCircle(lat: number, lng: number) {
//     if (!this.map) return;

//     const radius = this.fenceForm.get('radius')?.value || 100;

//     // Clear existing
//     if (this.marker) this.map.removeLayer(this.marker);
//     if (this.circle) this.map.removeLayer(this.circle);

//     // Custom Blue Icon (since default assets might be missing in Angular build)
//     const customIcon = L.divIcon({
//       className: 'custom-leaflet-marker',
//       html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
//       iconSize: [14, 14],
//       iconAnchor: [7, 7]
//     });

//     this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
//     this.circle = L.circle([lat, lng], {
//       color: '#3b82f6',
//       fillColor: '#3b82f6',
//       fillOpacity: 0.2,
//       radius: radius
//     }).addTo(this.map);

//     this.map.setView([lat, lng], 16); // Zoom in on click
//   }

//   updateMapCircle() {
//     const coords = this.fenceForm.get('center.coordinates')?.value;
//     if (coords && coords.length === 2) {
//       this.drawMarkerAndCircle(coords[1], coords[0]);
//     }
//   }

//   private updateMapFromForm() {
//     const coords = this.fenceForm.get('center.coordinates')?.value;
//     if (coords && coords.length === 2) {
//       this.drawMarkerAndCircle(coords[1], coords[0]);
//     }
//   }

//   hasCoordinates(): boolean {
//     const coords = this.fenceForm.get('center.coordinates')?.value;
//     return coords && coords.length === 2;
//   }

//   // --- Submissions ---
//   onSubmit() {
//     if (this.fenceForm.invalid || !this.hasCoordinates()) return;

//     this.isSaving.set(true);
//     const payload = this.fenceForm.value;

//     const req$ = this.isEditMode() && this.fenceId
//       ? this.hrmsService.updateGeoFence(this.fenceId, payload)
//       : this.hrmsService.createGeoFence(payload);

//     req$.pipe(
//       catchError(err => {
//         this.messageService.handleHttpError(err)
//         return of(null);
//       }),
//       finalize(() => this.isSaving.set(false))
//     ).subscribe((res:any) => {
//       if (res) {
//         this.messageService.showSuccess(res.message)
//         setTimeout(() => this.onCancel(), 1000);
//       }
//     });
//   }

//   onCancel() { this.router.navigate(['/hrms/geofence']); }
// }



// import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { catchError, map } from 'rxjs';
// import * as L from 'leaflet';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';


// @Component({
//   selector: 'app-geofence-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" type="button" (click)="goBack()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
//           <div>
//             <h1 class="page-title">{{ isEditMode() ? 'Edit Geofence' : 'Create Geofence' }}</h1>
//             <p class="page-subtitle">Define virtual perimeters for attendance tracking.</p>
//           </div>
//         </div>
//         <div class="header-right">
//           <button type="button" class="btn btn-outline" (click)="goBack()">Cancel</button>
//           <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || form.invalid" (click)="onSubmit()">
//             {{ isEditMode() ? 'Update Fence' : 'Save Fence' }}
//           </button>
//         </div>
//       </header>

//       <main class="dashboard-content">
//         <form [formGroup]="form" class="bento-grid">
          
//           <div class="grid-card card-anim-1">
//             <div class="card-header"><h2 class="card-title">Geofence Identity</h2></div>
//             <div class="card-body flex-col">
//               <div class="form-field">
//                 <label>Name <span class="required">*</span></label>
//                 <input type="text" formControlName="name" class="se-input" placeholder="e.g. Head Office Fence">
//               </div>
//               <div class="form-field">
//                 <label>Code <span class="required">*</span></label>
//                 <input type="text" formControlName="code" class="se-input uppercase-input" placeholder="HQ-01">
//               </div>
//               <div class="form-field">
//                 <label>Branch Link</label>
//                 <select formControlName="branchId" class="se-input">
//                   <option [ngValue]="null">Select Branch (Optional)</option>
//                   @for (branch of branchOptions(); track branch._id) {
//                     <option [value]="branch._id">{{ branch.name }}</option>
//                   }
//                 </select>
//               </div>
              
//               <div class="status-toggle-wrapper mt-2">
//                 <label class="toggle-container">
//                   <input type="checkbox" formControlName="applicableToAll" class="toggle-input">
//                   <span class="toggle-slider"></span>
//                   <div class="toggle-text"><span class="toggle-label">Applicable to all employees</span></div>
//                 </label>
//               </div>
//             </div>
//           </div>

//           <div class="grid-card span-2 card-anim-2" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
//             <div class="card-header" style="padding: var(--spacing-lg) var(--spacing-lg) 0 var(--spacing-lg); border: none;">
//               <h2 class="card-title">Location Boundary Map</h2>
//             </div>
            
//             <div style="display: flex; gap: 16px; padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);">
//               <div class="form-field" style="flex: 1;">
//                 <label>Radius (Meters) <span class="required">*</span></label>
//                 <input type="number" formControlName="radius" class="se-input" min="10" max="10000" (input)="updateMapCircle()">
//               </div>
//               <div class="form-field" style="flex: 1;">
//                 <label>Latitude</label>
//                 <input type="number" formControlName="latitude" class="se-input" readonly>
//               </div>
//               <div class="form-field" style="flex: 1;">
//                 <label>Longitude</label>
//                 <input type="number" formControlName="longitude" class="se-input" readonly>
//               </div>
//             </div>

//             <div id="geofenceMap" style="flex: 1; min-height: 400px; background: #e5e7eb; border-top: 1px solid var(--border-secondary);"></div>
//             <div style="padding: 8px; text-align: center; font-size: 0.75rem; color: var(--text-tertiary); background: var(--bg-secondary);">
//               Click anywhere on the map to set the center point of your geofence.
//             </div>
//           </div>

//         </form>
//       </main>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }
//     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; }
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); border-bottom: 1px solid var(--border-primary); }
//     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
//     .icon-btn { background: var(--component-bg); border: 1px solid var(--border-primary); color: var(--text-secondary); width: 38px; height: 38px; border-radius: var(--ui-border-radius); display: flex; align-items: center; justify-content: center; cursor: pointer; }
//     .page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
//     .page-subtitle { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }
    
//     .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: var(--ui-border-radius); cursor: pointer; border: 1px solid transparent; }
//     .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); }
//     .btn-primary { background: var(--color-primary); color: white; }
    
//     .dashboard-content { flex: 1; padding: var(--spacing-xl); overflow-y: auto; background: var(--bg-primary); }
//     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); max-width: 1400px; margin: 0 auto; }
//     .span-2 { grid-column: span 2; }
    
//     .grid-card { background: var(--component-bg); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
//     .card-header { padding-bottom: var(--spacing-md); }
//     .card-title { font-size: 1rem; font-weight: 600; margin: 0; }
//     .flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    
//     .form-field { display: flex; flex-direction: column; gap: 4px; }
//     .form-field label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
//     .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); padding: 0.4rem 0.6rem; border-radius: 4px; font-size: 0.875rem; color: var(--text-primary); outline: none; }
//     .uppercase-input { text-transform: uppercase; }
//     .required { color: var(--color-error); }

//     .status-toggle-wrapper { padding: var(--spacing-sm); background: var(--component-surface-raised); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius); }
//     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
//     .toggle-input { display: none; }
//     .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: 0.2s; }
//     .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.2s; }
//     .toggle-input:checked + .toggle-slider { background-color: var(--color-primary); }
//     .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
//     .toggle-label { font-size: 0.875rem; font-weight: 500; }

//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     .fade-in { animation: fadeIn 0.3s ease-out; }
//     @media (max-width: 1024px) { .bento-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
//   `]
// })
// export class GeofenceFormComponent implements OnInit, AfterViewInit, OnDestroy {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);

//   form!: FormGroup;
//   isSubmitting = signal(false);
//   isEditMode = signal(false);
//   fenceId: string | null = null;
//   branchOptions = this.masterList.branches;

//   // Leaflet Instances
//   private map: L.Map | undefined;
//   private circleLayer: L.Circle | undefined;

//   ngOnInit() {
//     this.form = this.fb.group({
//       name: ['', Validators.required],
//       code: ['', Validators.required],
//       branchId: [null],
//       type: ['circle'],
//       radius: [100, [Validators.required, Validators.min(10)]],
//       latitude: [null, Validators.required],
//       longitude: [null, Validators.required],
//       applicableToAll: [true],
//       isActive: [true]
//     });

//     this.form.get('code')?.valueChanges.subscribe(val => {
//       if (val && val !== val.toUpperCase()) {
//         this.form.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
//       }
//     });

//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         this.isEditMode.set(true);
//         this.fenceId = id;
//         this.loadDetails();
//       }
//     });
//   }

//   ngAfterViewInit() {
//     this.initMap();
//   }

//   ngOnDestroy() {
//     if (this.map) this.map.remove();
//   }

//   private initMap() {
//     // Default to a central coordinate (e.g. New Delhi)
//     const defaultLat = 28.6139;
//     const defaultLng = 77.2090;

//     this.map = L.map('geofenceMap').setView([defaultLat, defaultLng], 12);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors'
//     }).addTo(this.map);

//     this.map.on('click', (e: L.LeafletMouseEvent) => {
//       const lat = e.latlng.lat;
//       const lng = e.latlng.lng;
//       this.form.patchValue({ latitude: lat, longitude: lng });
//       this.drawCircle(lat, lng, this.form.value.radius);
//     });
//   }

//   updateMapCircle() {
//     const { latitude, longitude, radius } = this.form.value;
//     if (latitude && longitude && radius) {
//       this.drawCircle(latitude, longitude, radius);
//     }
//   }

//   private drawCircle(lat: number, lng: number, radius: number) {
//     if (!this.map) return;
    
//     if (this.circleLayer) {
//       this.map.removeLayer(this.circleLayer);
//     }

//     this.circleLayer = L.circle([lat, lng], {
//       color: '#3b82f6',
//       fillColor: '#60a5fa',
//       fillOpacity: 0.3,
//       radius: radius
//     }).addTo(this.map);

//     // Pan map to new circle
//     this.map.setView([lat, lng]);
//   }

//   private loadDetails() {
//     this.hrmsService.getGeoFence(this.fenceId!).subscribe((res: any) => {
//       const data = res.data?.geofence || res.data;
      
//       // Extract coordinates from GeoJSON point: [lng, lat]
//       let lat = null;
//       let lng = null;
//       if (data.center?.coordinates?.length === 2) {
//         lng = data.center.coordinates[0];
//         lat = data.center.coordinates[1];
//       }

//       this.form.patchValue({
//         name: data.name,
//         code: data.code,
//         branchId: data.branchId?._id || data.branchId,
//         radius: data.radius || 100,
//         latitude: lat,
//         longitude: lng,
//         applicableToAll: data.applicableToAll ?? true,
//         isActive: data.isActive ?? true
//       });

//       if (lat && lng) {
//         setTimeout(() => this.drawCircle(lat, lng, data.radius || 100), 500); // slight delay to let map init
//       }
//     });
//   }

//   onSubmit() {
//     if (this.form.invalid) return;
//     this.isSubmitting.set(true);

//     const v = this.form.value;
//     // Map form variables back to Mongoose Schema structure
//     const payload: any = {
//       name: v.name,
//       code: v.code,
//       branchId: v.branchId,
//       type: 'circle',
//       radius: v.radius,
//       center: {
//         type: 'Point',
//         coordinates: [v.longitude, v.latitude] // Note: GeoJSON is [lng, lat]
//       },
//       applicableToAll: v.applicableToAll,
//       isActive: v.isActive
//     };

//     const req$ = this.isEditMode() 
//       ? this.hrmsService.updateGeoFence(this.fenceId!, payload)
//       : this.hrmsService.createGeoFence(payload);

//     req$.subscribe({
//       next: () => {
//         this.messageService.showSuccess('Success', 'Geofence saved');
//         this.goBack();
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.message);
//         this.isSubmitting.set(false);
//       }
//     });
//   }

//   goBack() { this.router.navigate(['/hrms/attendance/geofences']); }
// }