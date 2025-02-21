import {
  Component,
  AfterViewInit,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { MarkerService } from '../services/marker.service';
import { Device } from '../models/map.interfaces';
import * as Leaflet from 'leaflet';
import { PopupComponent } from '../popup/popup.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  standalone: false,
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: any;
  @ViewChild('popupContainer', { read: ViewContainerRef, static: true })
  popupContainer!: ViewContainerRef;

  map!: Leaflet.Map;
  legendVisible = false;
  filteredFloors = new Map<string, boolean>();
  filteredOfflineFloors = new Map<string, boolean>();
  floorKeys: string[] = [];
  offlineFloorKeys: string[] = [];
  floorLevelLayers: { [key: string]: any } = {}; // eslint-disable-line
  floorLevelOfflineLayers: { [key: string]: any } = {}; // eslint-disable-line
  offlineDevicesVisible: boolean = true;
  selectedDevices: string[] = [];

  elevationRange: number[] = [-50, 50]; // Initial min/max range
  metaCityBorder!: Leaflet.Polygon;
  asemaKaavaOpacity: number = 0;
  asemaKaavaVisible: boolean = false;
  asemakaavaLayer!: Leaflet.TileLayer;
  markerLayer: Leaflet.LayerGroup = Leaflet.layerGroup();

  sensorList: any = [];

  polyline: Leaflet.LatLng[] = [];

  readonly greyIcon = Leaflet.icon({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/markericon_grey.png',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [1, -34],
    tooltipAnchor: [12, -12],
  });
  readonly greenIcon = Leaflet.icon({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/markericon_green.png',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [1, -34],
    tooltipAnchor: [12, -12],
  });
  readonly redIcon = Leaflet.icon({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/markericon_red.png',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [1, -34],
    tooltipAnchor: [12, -12],
  });
  readonly yellowIcon = Leaflet.icon({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/markericon_yellow.png',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [1, -34],
    tooltipAnchor: [12, -12],
  });

  constructor(
    private logger: LoggerService,
    private markerService: MarkerService,
    private http: HttpClient,
  ) {}

  /** Initializes map */
  private initMap(): Leaflet.Map {
    this.logger.log('initMap() called');
    const map = Leaflet.map('map', {
      center: [65.059333, 25.466806],
      zoom: 15,
    });

    this.metaCityBorder = Leaflet.polygon(this.polyline, {
      color: 'red',
      weight: 4,
      fill: false,
      dashArray: '0 20 0',
      dashOffset: '10',
    }).addTo(map);

    const tiles = Leaflet.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );
    this.asemakaavaLayer = Leaflet.tileLayer.wms(
      'https://e-kartta.ouka.fi/TeklaOgcWebOpen/WMS.ashx',
      { layers: 'Asemakaava', opacity: 0 },
    );
    tiles.addTo(map);
    this.asemakaavaLayer.addTo(map);
    this.markerLayer.addTo(map);

    return map;
  }

  ngAfterViewInit(): void {
    this.map = this.initMap();

    this.http.get('/metacityBorders.json').subscribe((data) => {
      this.convertCoordinates(data);
      this.metaCityBorder.setLatLngs(this.polyline);
    });

    this.http.get('/sensors.json').subscribe((data) => {
      this.sensorList = data;
      this.displayMarkers();
    });
    const rangeSlider = document.querySelector('#rangeSlider');

    rangeSlider?.addEventListener('mouseenter', (e) => {
      this.map.dragging.disable();
    });

    rangeSlider?.addEventListener('mouseleave', (e) => {
      this.map.dragging.enable();
    });
  }

  convertCoordinates(data: any): void {
    data.forEach((e: any) => {
      const latLng = new Leaflet.LatLng(e.lat, e.lng);
      this.polyline.push(latLng);
    });
  }

  toggleAsemakaavaVisibility(): void {
    if (this.asemaKaavaVisible) {
      this.asemaKaavaOpacity = 0;
      this.asemaKaavaVisible = !this.asemaKaavaVisible;
      this.changeAsemakaavaOpacity();
    } else {
      this.asemaKaavaOpacity = 1;
      this.asemaKaavaVisible = !this.asemaKaavaVisible;
      this.changeAsemakaavaOpacity();
    }
  }

  changeAsemakaavaOpacity(): void {
    this.asemakaavaLayer.setOpacity(this.asemaKaavaOpacity);
  }

  displayMarkers(): void {
    this.markerLayer.clearLayers();
    this.sensorList.forEach((marker: any) => {
      if (
        marker.location.elevation >= this.elevationRange[0] &&
        marker.location.elevation <= this.elevationRange[1]
      ) {
        const coords = new Leaflet.LatLng(
          marker.location.lat,
          marker.location.lng,
        );
        const sensorMarker = Leaflet.marker(coords, {
          icon: this.greenIcon,
        });
        sensorMarker.bindPopup(() => this.createPopupContent(marker));
        this.markerLayer.addLayer(sensorMarker);
      }
    });
  }

  createPopupContent(content: any): HTMLElement {
    this.popupContainer.clear(); // Clear previous components if any

    const componentRef: ComponentRef<PopupComponent> =
      this.popupContainer.createComponent(PopupComponent);
    const locationString = `${content.location.lat} , ${content.location.lng} , ${content.location.elevation}`;

    // Set data for the popup
    componentRef.instance.id = content.id;
    componentRef.instance.description = content.description;
    componentRef.instance.location = locationString;
    componentRef.instance.status = content.status;
    componentRef.instance.sensorType = content.sensorType;
    componentRef.instance.dataSecret = content.dataSecret;

    return componentRef.location.nativeElement;
  }

  onSliderChange(): void {
    this.logger.log(this.elevationRange);
    this.displayMarkers();
    //this.elevationRange = event; // Update min and max elevation
  }
}
