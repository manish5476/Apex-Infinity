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

// import { Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, Inject, PLATFORM_ID, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import * as L from 'leaflet';

// export interface MapLocation {
//   _id: string;
//   name: string;
//   address: { street: string; city: string; state: string; zipCode: string; country?: string };
//   location: { lat: number; lng: number };
//   isMainBranch?: boolean;
//   phoneNumber?: string;
//   openingHours?: string;
//   features?: string[];
//   description?: string;
// }

// export interface MapConfig {
//   title: string;
//   clusterMarkers?: boolean;
//   enableHeatmap?: boolean;
//   mapStyle?: 'dark' | 'light' | 'satellite';
//   zoomLevel?: number;
//   animationDuration?: number;
// }

// @Component({
//   selector: 'app-map-locations',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './map-locations.component.html',
//   styleUrls: ['./map-locations.component.scss'],
//   encapsulation: ViewEncapsulation.None 
// })
// export class MapLocationsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//   @Input() config: MapConfig = {
//     title: 'Our Presence',
//     clusterMarkers: true,
//     mapStyle: 'dark', // Default
//     zoomLevel: 13,
//     animationDuration: 1.5
//   };
  
//   @Input() locations: MapLocation[] = [];
  
//   @ViewChild('cardsContainer') cardsContainer!: ElementRef;
//   @ViewChild('mapStage') mapStage!: ElementRef;

//   public map: L.Map | undefined;
//   private markers: L.Marker[] = [];
//   private markerLayer: L.LayerGroup | undefined;
//   private tileLayer: L.TileLayer | undefined; // Store tile layer to switch it later
//   private isAnimating = false;
  
//   selectedBranch: MapLocation | null = null;
//   filteredLocations: MapLocation[] = [];
//   searchQuery: string = '';
//   currentStyle: 'dark' | 'light' | 'satellite' = 'dark'; // Track current style

//   // Map Styles
//   private mapStyles = {
//     dark: {
//       url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
//       options: { maxZoom: 20, subdomains: 'abcd', attribution: '© CartoDB' }
//     },
//     light: {
//       url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
//       options: { maxZoom: 20, subdomains: 'abcd', attribution: '© CartoDB' }
//     },
//     satellite: {
//       url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//       options: { maxZoom: 19, attribution: 'Tiles © Esri' }
//     }
//   };

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

//   ngOnInit() {
//     this.filteredLocations = [...this.locations];
//     if (this.locations.length) {
//       this.selectedBranch = this.locations[0];
//     }
//     // Set initial style from config
//     if (this.config.mapStyle) {
//       this.currentStyle = this.config.mapStyle;
//     }
//   }



//   // 🔥 FIX: Re-run init when data arrives later
//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['locations'] && !changes['locations'].firstChange) {
//       this.filteredLocations = [...this.locations];
//       if (this.map) {
//         this.addMarkers();
//         this.fitMapToMarkers();
//       } else {
//         // If map wasn't ready before, try again now that we have data
//         this.initMap();
//       }
//     }
//   }


//   // ... inside MapLocationsComponent class ...

//   // --- Map Initialization (FIXED) ---
//   private initMap(): void {
//     // 1. Basic safety checks
//     if (this.map || !this.mapStage) return;

//     // 2. Filter out locations that don't have coordinates
//     const validLocations = this.filteredLocations.filter(l => l.location && l.location.lat && l.location.lng);

//     // 3. If NO valid locations exist at all, stop (loader will persist or show empty state)
//     if (validLocations.length === 0) {
//       console.warn('Map skipped: No locations with valid coordinates found.');
//       return; 
//     }

//     // 4. Determine Center Point
//     // Priority: Selected Branch (if valid) -> First Valid Location -> Default (0,0)
//     let startLat = 0;
//     let startLng = 0;

//     if (this.selectedBranch && this.selectedBranch.location?.lat) {
//       startLat = this.selectedBranch.location.lat;
//       startLng = this.selectedBranch.location.lng;
//     } else {
//       // 🔥 THE FIX: Use the first VALID location, not just index 0
//       startLat = validLocations[0].location.lat;
//       startLng = validLocations[0].location.lng;
//     }
    
//     // 5. Create Map
//     this.map = L.map(this.mapStage.nativeElement, {
//       zoomControl: false, 
//       scrollWheelZoom: false,
//       attributionControl: false,
//       fadeAnimation: true,
//       zoomAnimation: true
//     }).setView([startLat, startLng], this.config.zoomLevel || 13);

//     // 6. Add Tiles
//     this.setMapLayer(this.currentStyle); // Helper to set tiles based on current style

//     // 7. Add Controls
//     L.control.zoom({ position: 'topright' }).addTo(this.map);
    
//     this.markerLayer = L.layerGroup().addTo(this.map);
    
//     // 8. Add Markers (Using the safe list)
//     this.addMarkers();
    
//     // 9. Fit bounds if we have multiple VALID points
//     if (validLocations.length > 1) {
//       this.fitMapToMarkers();
//     }
//   }

//   // --- Marker Logic (FIXED) ---
//   private addMarkers(): void {
//     if (!this.map || !this.markerLayer) return;

//     this.markerLayer.clearLayers();
//     this.markers = [];

//     // 🔥 FIX: Loop through original list, but skip invalid ones safely
//     this.filteredLocations.forEach(location => {
      
//       // SAFETY CHECK: If lat or lng is missing, skip this iteration immediately
//       if (!location.location || !location.location.lat || !location.location.lng) {
//         return; 
//       }

//       const isSelected = this.selectedBranch?._id === location._id;
      
//       const customIcon = L.divIcon({
//         className: `luxury-marker ${isSelected ? 'selected' : ''}`,
//         html: `
//           <div class="marker-container">
//             <div class="pulse-ring ${isSelected ? 'active' : ''}"></div>
//             <div class="marker-dot ${location.isMainBranch ? 'headquarters' : ''}"></div>
//             ${location.isMainBranch ? '<div class="crown-icon">👑</div>' : ''}
//           </div>
//         `,
//         iconSize: [50, 50],
//         iconAnchor: [25, 25]
//       });

//       const marker = L.marker([location.location.lat, location.location.lng], {
//         icon: customIcon,
//         title: location.name,
//         riseOnHover: true
//       });

//       marker.on('click', () => this.selectLocation(location));
//       marker.addTo(this.markerLayer!);
//       this.markers.push(marker);
//     });
//   }

//   // --- Helper to ensure markers fit (FIXED) ---
//   fitMapToMarkers(): void {
//     if (!this.map || this.markers.length === 0) return;
    
//     // Only try to fit bounds if we actually created valid markers
//     const group = L.featureGroup(this.markers);
//     if (group.getLayers().length > 0) {
//       this.map.fitBounds(group.getBounds().pad(0.1));
//     }
//   }
//   ngAfterViewInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       // Small timeout ensures the DOM element #mapStage is actually ready
//       setTimeout(() => this.initMap(), 100);
//     }
//   }

//   // --- NEW: Theme Switcher Logic ---
//   setMapStyle(style: 'dark' | 'light' | 'satellite') {
//     this.currentStyle = style;
//     this.setMapLayer(style);
//   }

//   private setMapLayer(styleKey: string) {
//     if (!this.map) return;

//     // Remove old layer if exists
//     if (this.tileLayer) {
//       this.map.removeLayer(this.tileLayer);
//     }

//     const style = this.mapStyles[styleKey as keyof typeof this.mapStyles];
//     this.tileLayer = L.tileLayer(style.url, style.options).addTo(this.map);
//   }

//   selectLocation(location: MapLocation): void {
//     if (this.isAnimating || !this.map) return;
    
//     this.isAnimating = true;
//     this.selectedBranch = location;
//     this.addMarkers(); // Re-render to show selection state

//     this.map.flyTo([location.location.lat, location.location.lng], 16, {
//       duration: this.config.animationDuration || 1.5,
//       easeLinearity: 0.25
//     });

//     this.scrollToCard(location._id);
//     setTimeout(() => { this.isAnimating = false; }, 1500);
//   }

//   scrollToCard(locationId: string) {
//     if (this.cardsContainer) {
//       const card = document.getElementById('card-' + locationId);
//       if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
//     }
//   }

//   searchLocations(): void {
//     if (!this.searchQuery.trim()) {
//       this.filteredLocations = [...this.locations];
//     } else {
//       const query = this.searchQuery.toLowerCase();
//       this.filteredLocations = this.locations.filter(l =>
//         l.name.toLowerCase().includes(query) ||
//         l.address.city.toLowerCase().includes(query) ||
//         l.address.state.toLowerCase().includes(query)
//       );
//     }
//     this.addMarkers();
//     if (this.filteredLocations.length > 0) this.fitMapToMarkers();
//   }

//   clearSearch(): void {
//     this.searchQuery = '';
//     this.searchLocations();
//   }

//   getDirections(location: MapLocation): void {
//     if (!location.location) return;
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${location.location.lat},${location.location.lng}`;
//     window.open(url, '_blank');
//   }

//   scrollCards(direction: number): void {
//     if (this.cardsContainer) {
//       const container = this.cardsContainer.nativeElement;
//       const scrollAmount = 450; 
//       container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
//     }
//   }

//   ngOnDestroy() {
//     if (this.map) {
//       this.map.remove();
//       this.map = undefined;
//     }
//   }
// }
