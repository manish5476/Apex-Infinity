import { Component, AfterViewInit, Output, EventEmitter, Input, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="location-picker-container">
      <div class="status-bar" *ngIf="selectedLocation">
        <span>Selected: {{ selectedLocation.lat | number:'1.4-4' }}, {{ selectedLocation.lng | number:'1.4-4' }}</span>
      </div>
      <div id="map" class="map-frame"></div>
      <div class="map-hint" *ngIf="!selectedLocation">Click map to select location</div>
    </div>
  `,
  styles: [`
    .location-picker-container {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .map-frame {
      height: 300px;
      width: 100%;
      z-index: 1;
    }
    .status-bar {
      background: #f8fafc;
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    .map-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      color: #64748b;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  `]
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();
  @Input() initialLocation: { lat: number; lng: number } | null = null;

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  
  selectedLocation: { lat: number; lng: number } | null = null;

  // Custom Icon Config to fix Webpack/Leaflet asset issues
  private defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

  private initMap(): void {
    const centerLat = this.initialLocation?.lat || 20.5937; // Default India Center
    const centerLng = this.initialLocation?.lng || 78.9629;

    this.map = L.map('map', {
      center: [centerLat, centerLng],
      zoom: 5
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.initialLocation) {
      this.addMarker(this.initialLocation.lat, this.initialLocation.lng);
      this.map.setView([this.initialLocation.lat, this.initialLocation.lng], 13);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addMarker(e.latlng.lat, e.latlng.lng);
      this.locationChange.emit({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    });
  }

  private addMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = L.marker([lat, lng], { icon: this.defaultIcon }).addTo(this.map);
    this.selectedLocation = { lat, lng };
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
