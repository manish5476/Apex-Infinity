import { Component, AfterViewInit, Output, EventEmitter, Input, OnDestroy, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * We use a namespace import for Leaflet. 
 * If your build environment has trouble resolving the package, 
 * ensure 'leaflet' is installed: npm install leaflet @types/leaflet
 */
import * as L from 'leaflet';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="location-picker-wrapper">
      <!-- Floating Details Card: Glass-morphism style using theme tokens -->
      <div class="location-details-card" [class.visible]="selectedLocation()">
        <div class="card-header">
          <i class="pi pi-map-marker text-[var(--accent-primary)]"></i>
          <span class="heading">Branch Location</span>
        </div>
        
        <div class="card-body">
          @if (loadingAddress()) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner mr-2"></i>
              <span>Resolving address...</span>
            </div>
          } @else {
            <div class="address-text" [title]="currentAddress()">
              {{ currentAddress() || 'Select a point on the map' }}
            </div>
          }

          <div class="coords-badge">
            <div class="coord-item">
              <span class="label">LAT</span>
              <span class="val">{{ selectedLocation()?.lat | number:'1.6-6' }}</span>
            </div>
            <div class="coord-divider"></div>
            <div class="coord-item">
              <span class="label">LNG</span>
              <span class="val">{{ selectedLocation()?.lng | number:'1.6-6' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Map Element -->
      <div id="map" class="map-frame"></div>

      <!-- Action Hint Overlay -->
      @if (!selectedLocation()) {
        <div class="map-hint">
          <div class="hint-content">
            <i class="pi pi-directions-alt"></i>
            <span>Click anywhere to pin branch location</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .location-picker-wrapper {
      position: relative;
      width: 100%;
      height: 400px;
      border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid var(--border-primary);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      background: var(--bg-secondary);
      font-family: var(--font-body);
    }

    .map-frame {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    /* Floating Details Card */
    .location-details-card {
      position: absolute;
      top: var(--spacing-lg);
      right: var(--spacing-lg);
      width: 300px;
      z-index: 1000;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-xl);
      padding: var(--spacing-lg);
      opacity: 0;
      transform: translateY(-10px);
      transition: var(--transition-base);
      pointer-events: none;
      border-left: 4px solid var(--accent-primary);

      &.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        
        .heading {
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-tertiary);
        }
      }

      .address-text {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        line-height: var(--line-height-relaxed);
        margin-bottom: var(--spacing-lg);
        min-height: 3em;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .loading-state {
        display: flex;
        align-items: center;
        font-size: var(--font-size-sm);
        color: var(--text-tertiary);
        margin-bottom: var(--spacing-lg);
        height: 3em;
      }

      .coords-badge {
        display: flex;
        align-items: center;
        background: var(--bg-ternary);
        padding: var(--spacing-sm);
        border-radius: var(--ui-border-radius);
        border: 1px solid var(--border-secondary);

        .coord-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          
          .label { 
            font-size: 10px; 
            font-weight: 800; 
            color: var(--text-label);
            margin-bottom: 2px;
          }
          .val { 
            font-family: var(--font-mono); 
            font-size: var(--font-size-xs);
            color: var(--accent-primary);
          }
        }

        .coord-divider {
          width: 1px;
          height: 20px;
          background: var(--border-primary);
        }
      }
    }

    .map-hint {
      position: absolute;
      bottom: var(--spacing-xl);
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      pointer-events: none;

      .hint-content {
        background: var(--bg-primary);
        color: var(--text-secondary);
        padding: var(--spacing-sm) var(--spacing-xl);
        border-radius: 50px;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--border-primary);
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        animation: pulseHint 2s infinite;
      }
    }

    @keyframes pulseHint {
      0% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); opacity: 0.9; }
    }

    /* Leaflet UI Overrides */
    ::ng-deep {
      .leaflet-control-zoom {
        border: none !important;
        margin: var(--spacing-lg) !important;
        
        a {
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--border-primary) !important;
          border-radius: var(--ui-border-radius) !important;
          margin-bottom: 4px;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          
          &:hover {
            background: var(--accent-focus) !important;
            color: var(--accent-primary) !important;
          }
        }
      }
      .leaflet-bar { box-shadow: var(--shadow-md) !important; border: none !important; }
      .leaflet-container { font-family: var(--font-body) !important; }
    }
  `]
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();
  
  /**
   * Input setter handles both initial load and programatic updates 
   * (e.g. from "Use Current Location" button in parent)
   */
  @Input() set initialLocation(loc: { lat: number; lng: number } | null) {
    if (loc && loc.lat && loc.lng) {
      this._initialLocation = loc;
      this.updateMapFromInput(loc);
    }
  }

  private _initialLocation: { lat: number; lng: number } | null = null;
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  
  // --- Reactive State Signals ---
  selectedLocation = signal<{ lat: number; lng: number } | null>(null);
  currentAddress = signal<string>('');
  loadingAddress = signal(false);

  // Fix for Leaflet marker icon paths in Angular/Webpack builds
  private readonly defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Ensure the DOM element is ready
      setTimeout(() => this.initMap(), 50);
    }
  }

  private initMap(): void {
    // Default to India center if no location provided
    const centerLat = this._initialLocation?.lat || 20.5937; 
    const centerLng = this._initialLocation?.lng || 78.9629;

    this.map = L.map('map', {
      center: [centerLat, centerLng],
      zoom: this._initialLocation ? 14 : 5,
      zoomControl: true,
      attributionControl: false
    });

    // Enterprise Map Style: Using Standard OSM but logic allows for Mapbox/custom tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    // Initial Marker if provided
    if (this._initialLocation) {
      this.addOrUpdateMarker(this._initialLocation.lat, this._initialLocation.lng);
      this.fetchAddress(this._initialLocation.lat, this._initialLocation.lng);
    }

    // Map Click Listener
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onUserSelectLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  private onUserSelectLocation(lat: number, lng: number): void {
    this.addOrUpdateMarker(lat, lng);
    this.selectedLocation.set({ lat, lng });
    this.locationChange.emit({ lat, lng });
    this.fetchAddress(lat, lng);
  }

  private addOrUpdateMarker(lat: number, lng: number): void {
    if (!this.map) return;
    
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { 
        icon: this.defaultIcon,
        draggable: true 
      }).addTo(this.map);

      // Allow dragging the marker to fine-tune location
      this.marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        this.onUserSelectLocation(position.lat, position.lng);
      });
    }

    this.selectedLocation.set({ lat, lng });
  }

  private updateMapFromInput(loc: { lat: number, lng: number }) {
    if (this.map) {
      this.addOrUpdateMarker(loc.lat, loc.lng);
      this.map.setView([loc.lat, loc.lng], 15, { animate: true });
      this.fetchAddress(loc.lat, loc.lng);
    }
  }

  /**
   * Enterprise Feature: Reverse Geocoding
   * Converts coordinates to a readable address using Nominatim (OpenStreetMap)
   */
  private async fetchAddress(lat: number, lng: number) {
    this.loadingAddress.set(true);
    try {
      // Nominatim requires an Accept-Language header for consistent localized results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      // Extract formatted address
      const address = data.display_name || 'Address details not found';
      this.currentAddress.set(address);
    } catch (error) {
      this.currentAddress.set('Location coordinates captured');
      console.error('Reverse geocoding error:', error);
    } finally {
      this.loadingAddress.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}

// import { Component, AfterViewInit, Output, EventEmitter, Input, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import * as L from 'leaflet';

// @Component({
//   selector: 'app-location-picker',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="location-picker-container">
//       <div class="status-bar" *ngIf="selectedLocation">
//         <span>Selected: {{ selectedLocation.lat | number:'1.4-4' }}, {{ selectedLocation.lng | number:'1.4-4' }}</span>
//       </div>
//       <div id="map" class="map-frame"></div>
//       <div class="map-hint" *ngIf="!selectedLocation">Click map to select location</div>
//     </div>
//   `,
//   styles: [`
//     .location-picker-container {
//       position: relative;
//       border-radius: 12px;
//       overflow: hidden;
//       border: 1px solid #e2e8f0;
//       box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//     }
//     .map-frame {
//       height: 300px;
//       width: 100%;
//       z-index: 1;
//     }
//     .status-bar {
//       background: #f8fafc;
//       padding: 8px 12px;
//       border-bottom: 1px solid #e2e8f0;
//       font-size: 12px;
//       font-weight: 600;
//       color: #475569;
//     }
//     .map-hint {
//       position: absolute;
//       top: 50%;
//       left: 50%;
//       transform: translate(-50%, -50%);
//       background: rgba(255, 255, 255, 0.9);
//       padding: 8px 16px;
//       border-radius: 20px;
//       font-size: 12px;
//       font-weight: bold;
//       color: #64748b;
//       pointer-events: none;
//       z-index: 1000;
//       box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//     }
//   `]
// })
// export class LocationPickerComponent implements AfterViewInit, OnDestroy {
//   @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();
//   @Input() initialLocation: { lat: number; lng: number } | null = null;

//   private map: L.Map | undefined;
//   private marker: L.Marker | undefined;
  
//   selectedLocation: { lat: number; lng: number } | null = null;

//   // Custom Icon Config to fix Webpack/Leaflet asset issues
//   private defaultIcon = L.icon({
//     iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//     shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//   });

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

//   ngAfterViewInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       this.initMap();
//     }
//   }

//   private initMap(): void {
//     const centerLat = this.initialLocation?.lat || 20.5937; // Default India Center
//     const centerLng = this.initialLocation?.lng || 78.9629;

//     this.map = L.map('map', {
//       center: [centerLat, centerLng],
//       zoom: 5
//     });

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       maxZoom: 19,
//       attribution: '© OpenStreetMap contributors'
//     }).addTo(this.map);

//     if (this.initialLocation) {
//       this.addMarker(this.initialLocation.lat, this.initialLocation.lng);
//       this.map.setView([this.initialLocation.lat, this.initialLocation.lng], 13);
//     }

//     this.map.on('click', (e: L.LeafletMouseEvent) => {
//       this.addMarker(e.latlng.lat, e.latlng.lng);
//       this.locationChange.emit({
//         lat: e.latlng.lat,
//         lng: e.latlng.lng
//       });
//     });
//   }

//   private addMarker(lat: number, lng: number): void {
//     if (!this.map) return;
//     if (this.marker) this.map.removeLayer(this.marker);
//     this.marker = L.marker([lat, lng], { icon: this.defaultIcon }).addTo(this.map);
//     this.selectedLocation = { lat, lng };
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }
// }
