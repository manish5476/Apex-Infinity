import { Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, Inject, PLATFORM_ID, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

export interface MapLocation {
  _id: string;
  name: string;
  address: { street: string; city: string; state: string; zipCode: string; country?: string };
  location: { lat: number; lng: number };
  isMainBranch?: boolean;
  phoneNumber?: string;
  openingHours?: string;
  features?: string[];
  description?: string;
}

export interface MapConfig {
  title?: string;
  clusterMarkers?: boolean;
  enableHeatmap?: boolean;
  mapStyle?: 'dark' | 'light' | 'satellite';
  zoomLevel?: number;
  animationDuration?: number;
}

@Component({
  selector: 'app-map-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-locations.component.html',
  styleUrls: ['./map-locations.component.scss'],
  encapsulation: ViewEncapsulation.None 
})
export class MapLocationsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() config: MapConfig = {
    title: 'Our Presence',
    clusterMarkers: true,
    mapStyle: 'dark', // Default style
    zoomLevel: 13,
    animationDuration: 1.5
  };
  
  @Input() locations: MapLocation[] = [];
  
  @ViewChild('cardsContainer') cardsContainer!: ElementRef;
  @ViewChild('mapStage') mapStage!: ElementRef;

  public map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private markerLayer: L.LayerGroup | undefined;
  private tileLayer: L.TileLayer | undefined; // To manage switching styles
  private isAnimating = false;
  
  selectedBranch: MapLocation | null = null;
  filteredLocations: MapLocation[] = [];
  searchQuery: string = '';
  
  // Track current style for UI classes
  currentStyle: 'dark' | 'light' | 'satellite' = 'dark';

  // Basemap Configurations
  private mapStyles = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      options: { maxZoom: 20, subdomains: 'abcd', attribution: '© CartoDB' }
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      options: { maxZoom: 20, subdomains: 'abcd', attribution: '© CartoDB' }
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: { maxZoom: 19, attribution: 'Tiles © Esri' }
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.filteredLocations = [...this.locations];
    if (this.config.mapStyle) {
      this.currentStyle = this.config.mapStyle;
    }
  }

  // Handle data arriving later (Async)
  ngOnChanges(changes: SimpleChanges) {
    if (changes['locations'] && !changes['locations'].firstChange) {
      this.filteredLocations = [...this.locations];
      
      // If map exists, just update markers. If not, try init.
      if (this.map) {
        this.addMarkers();
        this.fitMapToMarkers();
      } else {
        this.initMap();
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => this.initMap(), 100);
    }
  }

  // --- Map Initialization (FIXED) ---
  private initMap(): void {
    // 1. Safety Checks
    if (this.map || !this.mapStage) return;

    // 2. Find the first VALID location (ignore ones without lat/lng)
    const validLocation = this.filteredLocations.find(l => l.location && l.location.lat && l.location.lng);

    // 3. If NO valid locations exist, stop here (prevents crash)
    if (!validLocation) {
      console.warn('Map initialization skipped: No locations with valid coordinates found.');
      return; 
    }

    // 4. Determine Start Point
    const startLoc = (this.selectedBranch && this.selectedBranch.location?.lat) 
      ? this.selectedBranch.location 
      : validLocation.location;
    
    // 5. Create Map
    this.map = L.map(this.mapStage.nativeElement, {
      zoomControl: false, 
      scrollWheelZoom: true, // Enabled zooming
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    }).setView([startLoc.lat, startLoc.lng], this.config.zoomLevel || 13);

    // 6. Set Initial Tile Layer
    this.setMapLayer(this.currentStyle);

    // 7. Controls & Layers
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    
    // 8. Add Markers
    this.addMarkers();
    
    // 9. Fit Bounds (if we have >1 location)
    if (this.filteredLocations.length > 1) {
      this.fitMapToMarkers();
    }
  }

  // --- Theme Switcher Logic ---
  setMapStyle(style: 'dark' | 'light' | 'satellite') {
    this.currentStyle = style;
    this.setMapLayer(style);
  }

  private setMapLayer(styleKey: string) {
    if (!this.map) return;

    // Remove old layer if exists
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    const style = this.mapStyles[styleKey as keyof typeof this.mapStyles];
    this.tileLayer = L.tileLayer(style.url, style.options).addTo(this.map);
  }

  // --- Marker Logic (FIXED) ---
  private addMarkers(): void {
    if (!this.map || !this.markerLayer) return;

    this.markerLayer.clearLayers();
    this.markers = [];

    this.filteredLocations.forEach(location => {
      // CRITICAL FIX: Skip locations with missing coordinates
      if (!location.location || !location.location.lat || !location.location.lng) {
        return;
      }

      const isSelected = this.selectedBranch?._id === location._id;
      
      const customIcon = L.divIcon({
        className: `luxury-marker ${isSelected ? 'selected' : ''}`,
        html: `
          <div class="marker-container">
            <div class="pulse-ring ${isSelected ? 'active' : ''}"></div>
            <div class="marker-dot ${location.isMainBranch ? 'headquarters' : ''}"></div>
            ${location.isMainBranch ? '<div class="crown-icon">👑</div>' : ''}
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      const marker = L.marker([location.location.lat, location.location.lng], {
        icon: customIcon,
        title: location.name,
        riseOnHover: true
      });

      marker.on('click', () => this.selectLocation(location));
      marker.addTo(this.markerLayer!);
      this.markers.push(marker);
    });
  }

  // --- User Interaction ---
  selectLocation(location: MapLocation): void {
    if (this.isAnimating || !this.map || !location.location) return;
    
    this.isAnimating = true;
    this.selectedBranch = location;
    
    // Refresh markers to update "selected" CSS class
    this.addMarkers();

    this.map.flyTo([location.location.lat, location.location.lng], 16, {
      duration: this.config.animationDuration || 1.5,
      easeLinearity: 0.25
    });

    this.scrollToCard(location._id);

    setTimeout(() => { this.isAnimating = false; }, 1500);
  }

  scrollToCard(locationId: string) {
    if (this.cardsContainer) {
      const card = document.getElementById('card-' + locationId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  // --- Utils ---
  searchLocations(): void {
    if (!this.searchQuery.trim()) {
      this.filteredLocations = [...this.locations];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredLocations = this.locations.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.address.city.toLowerCase().includes(query) ||
        l.address.state.toLowerCase().includes(query)
      );
    }
    this.addMarkers();
    if (this.filteredLocations.length > 0) this.fitMapToMarkers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchLocations();
  }

  getDirections(location: MapLocation): void {
    if (!location.location) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.location.lat},${location.location.lng}`;
    window.open(url, '_blank');
  }

  scrollCards(direction: number): void {
    if (this.cardsContainer) {
      const container = this.cardsContainer.nativeElement;
      const scrollAmount = 450; 
      container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  }

  fitMapToMarkers(): void {
    if (!this.map || this.markers.length === 0) return;
    const group = L.featureGroup(this.markers);
    if (group.getLayers().length > 0) {
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}