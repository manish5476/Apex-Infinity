import {
  Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges,
  SimpleChanges, Inject, PLATFORM_ID, ViewEncapsulation, ViewChild, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, signal, computed
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
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

export interface MapLocationsConfig {
  title?: string;
  clusterMarkers?: boolean;
  mapStyle?: string;
  zoom?: number;
  animationDuration?: number;
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = {
  none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem'
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-map-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Critical for Leaflet marker styling
  template: `
    <section class="map-section-root w-full" [ngStyle]="sectionStyle()">
      <div class="relative w-full h-[90vh] bg-[#0a0a0f] overflow-hidden group/luxury-map font-sans mx-auto max-w-[1600px]"
           [ngStyle]="mapContainerStyle()">

        <div #mapStage id="map-stage" class="absolute inset-0 z-0 fade-in-map"></div>

        @if (isLoadingMap && filteredLocations.length > 0) {
          <div class="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0f] z-[50]">
            <div class="flex flex-col items-center gap-4">
              <div class="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs text-gray-500 uppercase tracking-widest">Initializing Map...</p>
            </div>
          </div>
        }

        @if (mapError) {
          <div class="absolute top-20 right-6 z-[65] max-w-sm rounded-xl border border-amber-400/30 bg-black/70 px-4 py-3 text-xs font-semibold text-amber-100 shadow-xl backdrop-blur-md" role="status">
            {{ mapError }}
          </div>
        }

        @if (filteredLocations.length === 0) {
          <div class="absolute inset-0 z-[55] flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div class="text-center p-8 border border-white/10 rounded-2xl bg-black/50 backdrop-blur-md shadow-2xl">
              <i class="pi pi-map-marker text-4xl text-rose-500 mb-4 block opacity-50"></i>
              <h3 class="text-xl font-bold text-white mb-2" [ngStyle]="headingStyle(true)">No Locations Found</h3>
              <p class="text-sm text-gray-400" [ngStyle]="bodyStyle(true)">There are no valid locations configured for this map section.</p>
            </div>
          </div>
        }

        <div class="absolute top-6 right-6 z-[60] flex gap-2">
          <button (click)="setMapStyle('dark')" class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all"
            [ngClass]="currentStyle === 'dark' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-black/60 border-white/10 text-gray-400 backdrop-blur hover:bg-black/80'">
            Dark
          </button>
          <button (click)="setMapStyle('light')" class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all"
            [ngClass]="currentStyle === 'light' ? 'bg-white border-white text-slate-900 shadow-lg' : 'bg-black/60 border-white/10 text-gray-400 backdrop-blur hover:bg-black/80'">
            Light
          </button>
          <button (click)="setMapStyle('satellite')" class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all"
            [ngClass]="currentStyle === 'satellite' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-black/60 border-white/10 text-gray-400 backdrop-blur hover:bg-black/80'">
            Sat
          </button>
        </div>

        <div class="absolute top-6 left-6 md:left-12 z-20 w-full pr-48 pointer-events-none">
          <div class="flex flex-col md:flex-row md:items-end gap-6 pointer-events-auto">
            <div>
              <h2 class="font-serif text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-300"
                  [ngClass]="currentStyle === 'light' ? 'text-slate-900' : 'text-white'"
                  [ngStyle]="headingStyle(currentStyle !== 'light')">
                {{ cfg().title }}
              </h2>
              <div class="flex items-center gap-3 mt-2">
                <span class="w-10 h-[2px] bg-gradient-to-r from-rose-500 to-pink-500"></span>
                <p class="text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-300"
                   [ngClass]="currentStyle === 'light' ? 'text-rose-600' : 'text-rose-300'">
                  {{ filteredLocations.length }} Locations
                </p>
              </div>
            </div>

            <div class="relative w-full max-w-sm">
              <input [(ngModel)]="searchQuery" (input)="searchLocations()" type="text" placeholder="Search..."
                     class="w-full backdrop-blur-xl border rounded-full py-2.5 px-5 pl-10 focus:outline-none transition-all shadow-lg"
                     [ngStyle]="bodyStyle()"
                     [ngClass]="currentStyle === 'light' 
                       ? 'bg-white/80 border-gray-300 text-slate-800 placeholder-gray-500 focus:border-rose-500' 
                       : 'bg-black/10 border-white/10 text-white placeholder-white/50 focus:bg-white/20 focus:border-rose-500/50'" />
              <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                 [ngClass]="currentStyle === 'light' ? 'text-gray-500' : 'text-white/50'"></i>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 w-full z-30 pb-8 pt-24 bg-gradient-to-t pointer-events-none transition-colors duration-500"
             [ngClass]="currentStyle === 'light' ? 'from-white via-white/80' : 'from-[#0a0a0f] via-[#0a0a0f]/95'">
          
          <div class="relative pointer-events-auto">
            @if (filteredLocations.length > 1) {
              <button (click)="scrollCards(-1)" class="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center hover:scale-110 transition-all hidden md:flex shadow-lg"
                      [ngClass]="currentStyle === 'light' ? 'bg-white text-slate-700 border-gray-200' : 'bg-white/10 text-white border-white/10'">
                <i class="pi pi-chevron-left"></i>
              </button>
            }

            @if (filteredLocations.length > 1) {
              <button (click)="scrollCards(1)" class="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center hover:scale-110 transition-all hidden md:flex shadow-lg"
                      [ngClass]="currentStyle === 'light' ? 'bg-white text-slate-700 border-gray-200' : 'bg-white/10 text-white border-white/10'">
                <i class="pi pi-chevron-right"></i>
              </button>
            }

            <div #cardsContainer class="flex gap-6 overflow-x-auto px-6 md:px-16 pb-4 scroll-smooth custom-scrollbar snap-x snap-mandatory">
              @for (loc of filteredLocations; track loc._id) {
                <div [id]="'card-' + loc._id" (click)="selectLocation(loc)"
                     class="group/card relative flex-shrink-0 w-[85vw] md:w-[380px] snap-center cursor-pointer transition-all duration-500"
                     [ngClass]="{'scale-100 opacity-100 z-10': selectedBranch?._id === loc._id, 'scale-95 opacity-70 hover:opacity-100': selectedBranch?._id !== loc._id}">

                  <div class="relative backdrop-blur-xl border rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:shadow-2xl"
                       [ngClass]="currentStyle === 'light' ? 'bg-white/95 border-gray-200 shadow-md text-slate-800' : 'bg-[#1a1a20]/90 border-white/10 text-white'"
                       [ngStyle]="cardStyle()">
                    
                    @if (selectedBranch?._id === loc._id) {
                      <div class="absolute -inset-1 bg-gradient-to-r from-rose-500/30 to-purple-500/30 blur-xl opacity-60"></div>
                    }

                    <div class="relative z-10">
                      <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-bold" [ngStyle]="headingStyle(currentStyle !== 'light')">{{ loc.name }}</h3>
                        @if (loc.isMainBranch) {
                          <span class="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded">HQ</span>
                        }
                      </div>

                      <p class="text-sm flex items-center gap-1 mb-4" [ngStyle]="bodyStyle(currentStyle !== 'light')" [ngClass]="currentStyle === 'light' ? 'text-slate-500' : 'text-slate-400'">
                        <i class="pi pi-map-marker text-rose-500"></i> {{ loc.address.city }}, {{ loc.address.state }}
                      </p>

                      <div class="flex items-center justify-between border-t pt-3" [ngClass]="currentStyle === 'light' ? 'border-gray-100' : 'border-white/10'">
                        <span class="text-xs font-mono" [ngClass]="currentStyle === 'light' ? 'text-slate-400' : 'text-slate-500'">
                          {{ loc.phoneNumber || 'No Contact' }}
                        </span>

                        <button (click)="$event.stopPropagation(); getDirections(loc)"
                                class="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                                [ngClass]="currentStyle === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-black'">
                          <i class="pi pi-directions text-xs font-bold"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    /* --- Animations --- */
    .fade-in-map { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
    @keyframes fadeIn { to { opacity: 1; } }

    /* --- Scrollbar --- */
    .custom-scrollbar { scrollbar-width: none; }
    .custom-scrollbar::-webkit-scrollbar { display: none; }

    /* --- Leaflet Resets --- */
    .leaflet-container { background: transparent !important; }
    
    .leaflet-bar { border: none !important; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important; }
    .leaflet-bar a { background-color: rgba(30, 30, 35, 0.9) !important; color: white !important; border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; }
    .leaflet-bar a:hover { background-color: #f43f5e !important; } /* Rose-500 */

    /* --- Markers --- */
    .luxury-marker { background: transparent !important; border: none !important; box-shadow: none !important; }
    .luxury-marker.leaflet-div-icon { background: transparent !important; border: none !important; }

    .luxury-marker .marker-container { position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; pointer-events: auto; background: transparent; }

    .luxury-marker .marker-dot {
      width: 14px; height: 14px; background: #f43f5e; border: 2.5px solid #ffffff; border-radius: 50%;
      z-index: 2; transition: transform 0.3s ease, border-width 0.3s ease; box-shadow: 0 2px 8px rgba(225, 29, 72, 0.5); will-change: transform;
    }
    .luxury-marker .marker-dot.headquarters { background: #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.5); }

    .luxury-marker .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(225, 29, 72, 0.35); opacity: 0; pointer-events: none; }
    .luxury-marker .pulse-ring.active { opacity: 1; animation: pulse 2.2s ease-out infinite; }

    .luxury-marker .crown-icon { position: absolute; top: -10px; font-size: 13px; z-index: 3; animation: float 3s ease-in-out infinite; line-height: 1; pointer-events: none; }

    .luxury-marker.selected .marker-dot { transform: scale(1.5); border-width: 3px; }

    .leaflet-div-icon { background: transparent !important; border: none !important; }

    @keyframes pulse { 0% { transform: scale(0.4); opacity: 0; } 40% { opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
  `]
})
export class MapLocationsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  
  @Input() set config(v: MapLocationsConfig) { this._config.set(v ?? {}); }
  private _config = signal<MapLocationsConfig>({});

  @Input() set locations(value: MapLocation[]) {
    this._locations = this.normalizeLocations(value ?? []);
    this.filteredLocations = [...this._locations];
  }
  get locations(): MapLocation[] { return this._locations; }

  @ViewChild('cardsContainer') cardsContainer!: ElementRef;
  @ViewChild('mapStage') mapStage!: ElementRef;

  public map: L.Map | undefined;
  public isLoadingMap = false;
  public mapError: string | null = null;

  private markerLayer: L.LayerGroup | undefined;
  private tileLayer: L.TileLayer | undefined;
  private markers: L.Marker[] = [];
  private isAnimating = false;
  private initScheduled = false;

  selectedBranch: MapLocation | null = null;
  filteredLocations: MapLocation[] = [];
  searchQuery = '';
  currentStyle: 'dark' | 'light' | 'satellite' = 'dark';
  private _locations: MapLocation[] = [];

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Global Presence',
    clusterMarkers: this._config().clusterMarkers ?? true,
    mapStyle: this._config().mapStyle ?? 'dark',
    zoom: this._config().zoom ?? 13,
    animationDuration: this._config().animationDuration ?? 1.2,
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md'
  }));

  // Basemap configs
  private readonly mapStyles = {
    dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', options: { maxZoom: 20, subdomains: 'abcd', attribution: '© CartoDB' } },
    light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', options: { maxZoom: 20, subdomains: 'abcd', attribution: '© CartoDB' } },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', options: { maxZoom: 19, attribution: 'Tiles © Esri' } }
  } as const;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filteredLocations = [...this.locations];
    if (this.cfg().mapStyle) {
      this.currentStyle = this.cfg().mapStyle as 'dark' | 'light' | 'satellite';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['locations'] && !changes['locations'].firstChange) {
      this.filteredLocations = [...this.locations];
      if (this.map) {
        this.addMarkers();
        this.fitMapToMarkers();
      } else {
        this.scheduleMapInit();
      }
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.scheduleMapInit();
    }
  }

  // --- Dynamic Styles ---

  sectionStyle() {
    return {
      'padding-top': PADDING[this.cfg().paddingTop] ?? '5rem',
      'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '5rem',
      'background-color': this.cfg().design?.customBackground || 'transparent'
    };
  }

  mapContainerStyle() {
    return {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`,
      'box-shadow': this.cfg().design?.boxShadow !== 'none' ? `var(--shadow-${this.cfg().design?.boxShadow || '2xl'})` : 'none'
    };
  }

  cardStyle() {
    return {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`
    };
  }

  headingStyle(isDarkContext: boolean) {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().typography?.headingColor || (isDarkContext ? '#ffffff' : 'var(--text-primary)')
    };
  }

  bodyStyle(isDarkContext: boolean = false) {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().typography?.bodyColor || (isDarkContext ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)')
    };
  }

  // --- Map Logic ---

  private scheduleMapInit(): void {
    if (this.initScheduled || this.map) return;
    this.initScheduled = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.initMap();
        this.initScheduled = false;
      });
    });
  }

  private initMap(): void {
    if (this.map || !this.mapStage || !isPlatformBrowser(this.platformId)) return;

    const validLocations = this.filteredLocations.filter(l =>
      l.location && Number.isFinite(Number(l.location.lat)) && Number.isFinite(Number(l.location.lng))
    );

    if (validLocations.length === 0) {
      console.warn('Map init skipped: no valid coordinates.');
      return;
    }

    this.isLoadingMap = true;
    this.mapError = null;

    const startLoc = this.selectedBranch?.location?.lat ? this.selectedBranch.location : validLocations[0].location;

    try {
      this.map = L.map(this.mapStage.nativeElement, {
        zoomControl: false, scrollWheelZoom: true, attributionControl: false,
        fadeAnimation: false, markerZoomAnimation: true, preferCanvas: false, renderer: L.svg()
      }).setView([startLoc.lat, startLoc.lng], this.cfg().zoom ?? 13);
    } catch (e) {
      this.mapError = 'Map is temporarily unavailable.';
      this.isLoadingMap = false;
      this.cdr.markForCheck();
      return;
    }

    this.setMapLayer(this.currentStyle);
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    this.addMarkers();

    if (validLocations.length > 1) {
      this.fitMapToMarkers();
    }

    this.isLoadingMap = false;
    this.cdr.markForCheck();
  }

  setMapStyle(style: 'dark' | 'light' | 'satellite'): void {
    this.currentStyle = style;
    this.setMapLayer(style);
    this.cdr.markForCheck();
  }

  private setMapLayer(styleKey: 'dark' | 'light' | 'satellite'): void {
    if (!this.map) return;
    if (this.tileLayer) this.map.removeLayer(this.tileLayer);

    const style = this.mapStyles[styleKey];
    this.tileLayer = L.tileLayer(style.url, { ...style.options })
      .on('tileerror', () => {
        this.mapError = 'Map tiles failed to load. Location cards are still available.';
        this.cdr.markForCheck();
      }).addTo(this.map);
  }

  private addMarkers(): void {
    if (!this.map || !this.markerLayer) return;
    this.markerLayer.clearLayers();
    this.markers = [];

    for (const location of this.filteredLocations) {
      if (!location.location || !Number.isFinite(Number(location.location.lat)) || !Number.isFinite(Number(location.location.lng))) continue;

      const isSelected = this.selectedBranch?._id === location._id;

      const icon = L.divIcon({
        className: `luxury-marker${isSelected ? ' selected' : ''}`,
        html: `
          <div class="marker-container">
            <div class="pulse-ring${isSelected ? ' active' : ''}"></div>
            <div class="marker-dot${location.isMainBranch ? ' headquarters' : ''}"></div>
            ${location.isMainBranch ? '<div class="crown-icon">👑</div>' : ''}
          </div>
        `,
        iconSize: [50, 50], iconAnchor: [25, 25], popupAnchor: [0, -25]
      });

      const marker = L.marker([location.location.lat, location.location.lng], { icon, title: location.name, riseOnHover: true });
      marker.on('click', () => this.selectLocation(location));
      this.markerLayer.addLayer(marker);
      this.markers.push(marker);
    }
  }

  selectLocation(location: MapLocation): void {
    if (this.isAnimating || !location.location) return;
    this.isAnimating = true;
    this.selectedBranch = location;
    this.addMarkers();

    if (this.map) {
      this.map.flyTo([location.location.lat, location.location.lng], 16, {
        duration: this.cfg().animationDuration ?? 1.2,
        easeLinearity: 0.25
      });
    }

    this.scrollToCard(location._id);
    this.cdr.markForCheck();
    setTimeout(() => { this.isAnimating = false; }, 1300);
  }

  scrollToCard(locationId: string): void {
    const card = document.getElementById('card-' + locationId);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  searchLocations(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredLocations = query
      ? this.locations.filter(l =>
        (l.name ?? '').toLowerCase().includes(query) ||
        (l.address?.city ?? '').toLowerCase().includes(query) ||
        (l.address?.state ?? '').toLowerCase().includes(query)
      )
      : [...this.locations];

    this.addMarkers();
    if (this.filteredLocations.length > 0) this.fitMapToMarkers();
    this.cdr.markForCheck();
  }

  getDirections(location: MapLocation): void {
    if (!location.location) return;
    // Fixed: Opens a valid Google Maps search/directions URL
    window.open(`https://www.google.com/maps/search/?api=1&query=${location.location.lat},${location.location.lng}`, '_blank');
  }

  scrollCards(direction: number): void {
    const container = this.cardsContainer?.nativeElement;
    if (container) container.scrollBy({ left: direction * 450, behavior: 'smooth' });
  }

  fitMapToMarkers(): void {
    if (!this.map || this.markers.length === 0) return;
    const group = L.featureGroup(this.markers);
    if (group.getLayers().length > 0) {
      this.map.fitBounds(group.getBounds().pad(0.15));
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  private normalizeLocations(locations: MapLocation[]): MapLocation[] {
    return locations
      .map((location: any) => {
        const coordinates = location?.location?.coordinates;
        const lat = location?.location?.lat ?? location?.lat ?? (Array.isArray(coordinates) ? coordinates[1] : undefined);
        const lng = location?.location?.lng ?? location?.lng ?? (Array.isArray(coordinates) ? coordinates[0] : undefined);

        return {
          ...location,
          _id: location?._id ?? location?.id ?? `${lat}-${lng}-${location?.name ?? 'loc'}`,
          address: location?.address ?? {},
          location: { ...location?.location, lat: Number(lat), lng: Number(lng) }
        } as MapLocation;
      })
      .filter(l => Number.isFinite(Number(l.location?.lat)) && Number.isFinite(Number(l.location?.lng)));
  }
}




// import {
//   Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges,
//   SimpleChanges, Inject, PLATFORM_ID, ViewEncapsulation, ViewChild, ElementRef,
//   ChangeDetectionStrategy, ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import * as L from 'leaflet';

// import { MapLocationsConfig } from '@core/models/storefront.model';

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

// @Component({
//   selector: 'app-map-locations',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './map-locations.component.html',
//   styleUrls: ['./map-locations.component.scss'],
//   encapsulation: ViewEncapsulation.None,
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class MapLocationsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
//   @Input() config: MapLocationsConfig = {
//     title: 'Our Presence',
//     clusterMarkers: true,
//     mapStyle: 'dark',
//     zoom: 13,
//     animationDuration: 1.2
//   };

//   @Input() set locations(value: MapLocation[]) {
//     this._locations = this.normalizeLocations(value ?? []);
//     this.filteredLocations = [...this._locations];
//   }
//   get locations(): MapLocation[] {
//     return this._locations;
//   }

//   @ViewChild('cardsContainer') cardsContainer!: ElementRef;
//   @ViewChild('mapStage') mapStage!: ElementRef;

//   public map: L.Map | undefined;
//   public isLoadingMap = false;
//   public mapError: string | null = null;

//   private markerLayer: L.LayerGroup | undefined;
//   private tileLayer: L.TileLayer | undefined;
//   private markers: L.Marker[] = [];
//   private isAnimating = false;
//   private initScheduled = false;

//   selectedBranch: MapLocation | null = null;
//   filteredLocations: MapLocation[] = [];
//   searchQuery = '';
//   currentStyle: 'dark' | 'light' | 'satellite' = 'dark';

//   private _locations: MapLocation[] = [];

//   // Basemap configs
//   private readonly mapStyles = {
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
//   } as const;

//   constructor(
//     @Inject(PLATFORM_ID) private platformId: Object,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit(): void {
//     this.filteredLocations = [...this.locations];
//     if (this.config.mapStyle) {
//       this.currentStyle = this.config.mapStyle as 'dark' | 'light' | 'satellite';
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['locations'] && !changes['locations'].firstChange) {
//       this.filteredLocations = [...this.locations];
//       if (this.map) {
//         this.addMarkers();
//         this.fitMapToMarkers();
//       } else {
//         this.scheduleMapInit();
//       }
//       this.cdr.markForCheck();
//     }
//   }

//   ngAfterViewInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       // Use requestAnimationFrame instead of setTimeout for faster, frame-synced init
//       this.scheduleMapInit();
//     }
//   }

//   private scheduleMapInit(): void {
//     if (this.initScheduled || this.map) return;
//     this.initScheduled = true;

//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         this.initMap();
//         this.initScheduled = false;
//       });
//     });
//   }

//   private initMap(): void {
//     if (this.map || !this.mapStage || !isPlatformBrowser(this.platformId)) return;

//     const validLocations = this.filteredLocations.filter(l =>
//       l.location &&
//       Number.isFinite(Number(l.location.lat)) &&
//       Number.isFinite(Number(l.location.lng))
//     );

//     if (validLocations.length === 0) {
//       console.warn('Map init skipped: no valid coordinates.');
//       return;
//     }

//     this.isLoadingMap = true;
//     this.mapError = null;

//     const startLoc = this.selectedBranch?.location?.lat
//       ? this.selectedBranch.location
//       : validLocations[0].location;

//     try {
//       this.map = L.map(this.mapStage.nativeElement, {
//         zoomControl: false,
//         scrollWheelZoom: true,
//         attributionControl: false,
//         // Performance optimizations
//         fadeAnimation: false,      // Disable Leaflet's own fade (we handle our own)
//         markerZoomAnimation: true,
//         preferCanvas: false,       // Keep SVG for sharp markers
//         renderer: L.svg()
//       }).setView([startLoc.lat, startLoc.lng], this.config.zoom ?? 13);
//     } catch (e) {
//       this.mapError = 'Map is temporarily unavailable.';
//       this.isLoadingMap = false;
//       this.cdr.markForCheck();
//       return;
//     }

//     this.setMapLayer(this.currentStyle);
//     L.control.zoom({ position: 'topright' }).addTo(this.map);
//     this.markerLayer = L.layerGroup().addTo(this.map);
//     this.addMarkers();

//     if (validLocations.length > 1) {
//       this.fitMapToMarkers();
//     }

//     this.isLoadingMap = false;
//     this.cdr.markForCheck();
//   }

//   setMapStyle(style: 'dark' | 'light' | 'satellite'): void {
//     this.currentStyle = style;
//     this.setMapLayer(style);
//     this.cdr.markForCheck();
//   }

//   private setMapLayer(styleKey: 'dark' | 'light' | 'satellite'): void {
//     if (!this.map) return;
//     if (this.tileLayer) this.map.removeLayer(this.tileLayer);

//     const style = this.mapStyles[styleKey];
//     this.tileLayer = L.tileLayer(style.url, { ...style.options })
//       .on('tileerror', () => {
//         this.mapError = 'Map tiles failed to load. Location cards are still available.';
//         this.cdr.markForCheck();
//       })
//       .addTo(this.map);
//   }

//   private addMarkers(): void {
//     if (!this.map || !this.markerLayer) return;

//     this.markerLayer.clearLayers();
//     this.markers = [];

//     for (const location of this.filteredLocations) {
//       if (
//         !location.location ||
//         !Number.isFinite(Number(location.location.lat)) ||
//         !Number.isFinite(Number(location.location.lng))
//       ) continue;

//       const isSelected = this.selectedBranch?._id === location._id;

//       const icon = L.divIcon({
//         // CRITICAL: empty className — do NOT put any class that has a background
//         className: `luxury-marker${isSelected ? ' selected' : ''}`,
//         html: `
//           <div class="marker-container">
//             <div class="pulse-ring${isSelected ? ' active' : ''}"></div>
//             <div class="marker-dot${location.isMainBranch ? ' headquarters' : ''}"></div>
//             ${location.isMainBranch ? '<div class="crown-icon">👑</div>' : ''}
//           </div>
//         `,
//         iconSize: [50, 50],
//         iconAnchor: [25, 25],
//         popupAnchor: [0, -25]
//       });

//       const marker = L.marker([location.location.lat, location.location.lng], {
//         icon,
//         title: location.name,
//         riseOnHover: true
//       });

//       marker.on('click', () => this.selectLocation(location));
//       this.markerLayer.addLayer(marker);
//       this.markers.push(marker);
//     }
//   }

//   selectLocation(location: MapLocation): void {
//     if (this.isAnimating || !location.location) return;
//     this.isAnimating = true;
//     this.selectedBranch = location;
//     this.addMarkers();

//     if (this.map) {
//       this.map.flyTo([location.location.lat, location.location.lng], 16, {
//         duration: this.config.animationDuration ?? 1.2,
//         easeLinearity: 0.25
//       });
//     }

//     this.scrollToCard(location._id);
//     this.cdr.markForCheck();
//     setTimeout(() => { this.isAnimating = false; }, 1300);
//   }

//   scrollToCard(locationId: string): void {
//     const card = document.getElementById('card-' + locationId);
//     card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
//   }

//   searchLocations(): void {
//     const query = this.searchQuery.trim().toLowerCase();
//     this.filteredLocations = query
//       ? this.locations.filter(l =>
//         (l.name ?? '').toLowerCase().includes(query) ||
//         (l.address?.city ?? '').toLowerCase().includes(query) ||
//         (l.address?.state ?? '').toLowerCase().includes(query)
//       )
//       : [...this.locations];

//     this.addMarkers();
//     if (this.filteredLocations.length > 0) this.fitMapToMarkers();
//     this.cdr.markForCheck();
//   }

//   clearSearch(): void {
//     this.searchQuery = '';
//     this.searchLocations();
//   }

//   getDirections(location: MapLocation): void {
//     if (!location.location) return;
//     window.open(
//       `https://www.google.com/maps/dir/?api=1&destination=${location.location.lat},${location.location.lng}`,
//       '_blank'
//     );
//   }

//   scrollCards(direction: number): void {
//     const container = this.cardsContainer?.nativeElement;
//     if (container) {
//       container.scrollBy({ left: direction * 450, behavior: 'smooth' });
//     }
//   }

//   fitMapToMarkers(): void {
//     if (!this.map || this.markers.length === 0) return;
//     const group = L.featureGroup(this.markers);
//     if (group.getLayers().length > 0) {
//       this.map.fitBounds(group.getBounds().pad(0.15));
//     }
//   }

//   ngOnDestroy(): void {
//     this.map?.remove();
//     this.map = undefined;
//   }

//   private normalizeLocations(locations: MapLocation[]): MapLocation[] {
//     return locations
//       .map((location: any) => {
//         const coordinates = location?.location?.coordinates;
//         const lat =
//           location?.location?.lat ??
//           location?.lat ??
//           (Array.isArray(coordinates) ? coordinates[1] : undefined);
//         const lng =
//           location?.location?.lng ??
//           location?.lng ??
//           (Array.isArray(coordinates) ? coordinates[0] : undefined);

//         return {
//           ...location,
//           _id: location?._id ?? location?.id ?? `${lat}-${lng}-${location?.name ?? 'loc'}`,
//           address: location?.address ?? {},
//           location: { ...location?.location, lat: Number(lat), lng: Number(lng) }
//         } as MapLocation;
//       })
//       .filter(l =>
//         Number.isFinite(Number(l.location?.lat)) &&
//         Number.isFinite(Number(l.location?.lng))
//       );
//   }
// }
