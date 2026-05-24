import {
  Component, Input, OnInit, AfterViewInit, OnDestroy, OnChanges,
  SimpleChanges, Inject, PLATFORM_ID, ViewEncapsulation, ViewChild, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { MapLocationsConfig } from '@core/models/storefront.model';

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

@Component({
  selector: 'app-map-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-locations.component.html',
  styleUrls: ['./map-locations.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapLocationsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() config: MapLocationsConfig = {
    title: 'Our Presence',
    clusterMarkers: true,
    mapStyle: 'dark',
    zoom: 13,
    animationDuration: 1.2
  };

  @Input() set locations(value: MapLocation[]) {
    this._locations = this.normalizeLocations(value ?? []);
    this.filteredLocations = [...this._locations];
  }
  get locations(): MapLocation[] {
    return this._locations;
  }

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

  // Basemap configs
  private readonly mapStyles = {
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
  } as const;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filteredLocations = [...this.locations];
    if (this.config.mapStyle) {
      this.currentStyle = this.config.mapStyle as 'dark' | 'light' | 'satellite';
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
      // Use requestAnimationFrame instead of setTimeout for faster, frame-synced init
      this.scheduleMapInit();
    }
  }

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
      l.location &&
      Number.isFinite(Number(l.location.lat)) &&
      Number.isFinite(Number(l.location.lng))
    );

    if (validLocations.length === 0) {
      console.warn('Map init skipped: no valid coordinates.');
      return;
    }

    this.isLoadingMap = true;
    this.mapError = null;

    const startLoc = this.selectedBranch?.location?.lat
      ? this.selectedBranch.location
      : validLocations[0].location;

    try {
      this.map = L.map(this.mapStage.nativeElement, {
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
        // Performance optimizations
        fadeAnimation: false,      // Disable Leaflet's own fade (we handle our own)
        markerZoomAnimation: true,
        preferCanvas: false,       // Keep SVG for sharp markers
        renderer: L.svg()
      }).setView([startLoc.lat, startLoc.lng], this.config.zoom ?? 13);
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
      })
      .addTo(this.map);
  }

  private addMarkers(): void {
    if (!this.map || !this.markerLayer) return;

    this.markerLayer.clearLayers();
    this.markers = [];

    for (const location of this.filteredLocations) {
      if (
        !location.location ||
        !Number.isFinite(Number(location.location.lat)) ||
        !Number.isFinite(Number(location.location.lng))
      ) continue;

      const isSelected = this.selectedBranch?._id === location._id;

      const icon = L.divIcon({
        // CRITICAL: empty className — do NOT put any class that has a background
        className: `luxury-marker${isSelected ? ' selected' : ''}`,
        html: `
          <div class="marker-container">
            <div class="pulse-ring${isSelected ? ' active' : ''}"></div>
            <div class="marker-dot${location.isMainBranch ? ' headquarters' : ''}"></div>
            ${location.isMainBranch ? '<div class="crown-icon">👑</div>' : ''}
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
      });

      const marker = L.marker([location.location.lat, location.location.lng], {
        icon,
        title: location.name,
        riseOnHover: true
      });

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
        duration: this.config.animationDuration ?? 1.2,
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

  clearSearch(): void {
    this.searchQuery = '';
    this.searchLocations();
  }

  getDirections(location: MapLocation): void {
    if (!location.location) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${location.location.lat},${location.location.lng}`,
      '_blank'
    );
  }

  scrollCards(direction: number): void {
    const container = this.cardsContainer?.nativeElement;
    if (container) {
      container.scrollBy({ left: direction * 450, behavior: 'smooth' });
    }
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
        const lat =
          location?.location?.lat ??
          location?.lat ??
          (Array.isArray(coordinates) ? coordinates[1] : undefined);
        const lng =
          location?.location?.lng ??
          location?.lng ??
          (Array.isArray(coordinates) ? coordinates[0] : undefined);

        return {
          ...location,
          _id: location?._id ?? location?.id ?? `${lat}-${lng}-${location?.name ?? 'loc'}`,
          address: location?.address ?? {},
          location: { ...location?.location, lat: Number(lat), lng: Number(lng) }
        } as MapLocation;
      })
      .filter(l =>
        Number.isFinite(Number(l.location?.lat)) &&
        Number.isFinite(Number(l.location?.lng))
      );
  }
}