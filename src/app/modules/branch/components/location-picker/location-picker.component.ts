import { Component, AfterViewInit, Output, EventEmitter, Input, OnDestroy, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import * as L from 'leaflet';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./location-picker.component.html',
  styleUrl:'./location-picker.component.scss'
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();

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
