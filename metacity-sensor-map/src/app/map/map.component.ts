import {
  Component,
  AfterViewInit,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
  TemplateRef,
} from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { MarkerService } from '../services/marker.service';
import { Device } from '../models/map.interfaces';
import * as Leaflet from 'leaflet';
import { PopupComponent } from '../popup/popup.component';
import { HttpClient } from '@angular/common/http';
import { CoordinateService } from '../services/coordinate.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  standalone: false,
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: any;
  @ViewChild('markerIcon', { read: TemplateRef })
  markerIcon!: TemplateRef<any>;
  @ViewChild('popupContainer', { read: ViewContainerRef, static: true })
  popupContainer!: ViewContainerRef;

  map!: Leaflet.Map;

  sensorTypes: string[] = [];
  filteredSensorTypes = new Map<string, boolean>();
  colorClass: string = '';
  iconName: string = '';
  elevationRange: number[] = [-50, 50]; // Initial min/max range
  metaCityBorder!: Leaflet.Polygon;
  asemaKaavaOpacity: number = 0;
  asemaKaavaVisible: boolean = false;
  asemakaavaLayer!: Leaflet.TileLayer;
  measuringDirectionLayerGroup!: Leaflet.LayerGroup;
  measuringDirectionVisible: boolean = true;
  iconTemplate!: Leaflet.DivIcon;
  sensorList: any = [];
  polyline: Leaflet.LatLng[] = [];
  markerLayer: Leaflet.LayerGroup = Leaflet.layerGroup();
  polylineLayerGroup!: Leaflet.LayerGroup;
  sensorData: any;
  polygonArray: Leaflet.Polygon[] = [];
  constructor(
    private logger: LoggerService,
    private markerService: MarkerService,
    private http: HttpClient,
    private viewContainerRef: ViewContainerRef,
    private coordinateService: CoordinateService,
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
        maxZoom: 20,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );
    this.asemakaavaLayer = Leaflet.tileLayer.wms(
      'https://e-kartta.ouka.fi/TeklaOgcWebOpen/WMS.ashx',
      { layers: 'Asemakaava', opacity: 0 },
    );
    this.polylineLayerGroup = Leaflet.layerGroup();
    this.measuringDirectionLayerGroup = Leaflet.layerGroup();
    tiles.addTo(map);
    this.asemakaavaLayer.addTo(map);
    this.markerLayer.addTo(map);
    this.polylineLayerGroup.addTo(map);
    this.measuringDirectionLayerGroup.addTo(map);

    return map;
  }

  ngAfterViewInit(): void {
    this.map = this.initMap();

    this.http.get('/metacityBorders.json').subscribe((data) => {
      this.polyline = this.convertCoordinates(data);
      this.metaCityBorder.setLatLngs(this.polyline);
    });

    // this.http.get('/bikeStations.json').subscribe((data) => {
    // this.displayCounters(data);
    // });

    this.markerService.getSensorMarkers().subscribe((res) => {
      this.filterTypeKeys(res);
      this.displayMarkers(res);
      this.markerLayer.addTo(this.map);
    });

    this.map.on('click', function (e) {
      // console.log(e.latlng);
    });

    // initialize floor keys
    this.sensorTypes.sort((a, b) => b.localeCompare(a));
    this.logger.log(this.sensorTypes);

    const rangeSlider = document.querySelector('#rangeSlider');

    rangeSlider?.addEventListener('mouseenter', (e) => {
      this.map.dragging.disable();
    });

    rangeSlider?.addEventListener('mouseleave', (e) => {
      this.map.dragging.enable();
    });
  }

  /*
  displayCounters(data: any): void {
    data.forEach((bikeStation: any) => {
      this.logger.log(bikeStation);
      this.iconName = this.markerService.getMarkerIcons(bikeStation);

      const embeddedView = this.viewContainerRef.createEmbeddedView(
        this.markerIcon,
        { icon: this.iconName, color: this.colorClass },
      );
      embeddedView.detectChanges();

      // Convert the view into HTML
      const div = document.createElement('div');
      embeddedView.rootNodes.forEach((node) => div.appendChild(node));

      // Create the Leaflet divIcon
      this.iconTemplate = Leaflet.divIcon({
        className: '',
        html: div.innerHTML,
        iconSize: [25, 25],
        iconAnchor: [12, 20],
        tooltipAnchor: [12, -12],
        popupAnchor: [1, -25],
      });

      const coords = new Leaflet.LatLng(bikeStation.lat, bikeStation.lon);

      const sensorMarker = Leaflet.marker(coords, {
        icon: this.iconTemplate,
      });
      sensorMarker.bindTooltip(bikeStation.name);
      sensorMarker.addTo(this.map);
    });
  }
*/
  /**
   * Converts coordinates to Leaflet.LatLng objects
   * @param data Coordinates as an array of json
   * @returns array of Leaflet.LatLng objects
   */
  convertCoordinates(data: any): Leaflet.LatLng[] {
    var tempLatLngArray: Leaflet.LatLng[] = [];
    data.forEach((e: any) => {
      const latLng = new Leaflet.LatLng(e.lat, e.lng);
      tempLatLngArray.push(latLng);
    });
    return tempLatLngArray;
  }

  /**
   * Toggles the visibility of the asemakaava slider
   */
  toggleAsemakaavaVisibility(): void {
    if (this.asemaKaavaVisible) {
      this.asemaKaavaOpacity = 0;
      this.asemaKaavaVisible = !this.asemaKaavaVisible;
      this.asemakaavaLayer.setOpacity(this.asemaKaavaOpacity);
    } else {
      this.asemaKaavaOpacity = 1;
      this.asemaKaavaVisible = !this.asemaKaavaVisible;
      this.asemakaavaLayer.setOpacity(this.asemaKaavaOpacity);
    }
  }

  /**
   * Toggles the visibility of the asemakaava slider
   */
  toggleDirectionLayerVisibility(): void {
    this.measuringDirectionVisible = !this.measuringDirectionVisible;
    if (this.measuringDirectionVisible) {
      this.displayMarkers();
    } else {
      this.polygonArray.forEach((e: any) => {
        //////////////////////////////////////////////////////////////////////////////// OPACITY KORJAA
        this.logger.log(e);
      });
    }
  }

  /**
   * Toggles the visibility of the asemakaava slider
   */
  toggleLayerVisibility(layer: string): void {
    var currentLayer;
    switch (layer) {
      case 'asemakaava':
        currentLayer = this.asemakaavaLayer;
        break;
      case 'mittaussuunta':
        currentLayer = this.measuringDirectionLayerGroup;
    }
    this.logger.log(currentLayer?.options);
  }

  /**
   * Changes the opacity of the asemakaava layer
   */
  changeAsemakaavaOpacity(): void {
    this.asemakaavaLayer.setOpacity(this.asemaKaavaOpacity);
  }

  /**
   * Filters what type of sensors are on the list. Adds the type of sensor if it isn't included yet. Used for the layering of the markers and toggle buttons.
   * @param res Sensor array
   */
  filterTypeKeys(res: Device[]): void {
    res.forEach((marker: any) => {
      this.filteredSensorTypes.set(marker.sensorType, true);
      if (!this.sensorTypes.includes(marker.sensorType)) {
        this.sensorTypes.push(marker.sensorType);
      }
    });
  }

  /**
   * Draws the markers to their coordinates and assigns them their icons, marker colors and data for popups
   * @param res list of sensors, currently provided by /sensors.json
   */
  displayMarkers(res?: Device[]): void {
    // Clears any old markers or polygons
    this.markerLayer.clearLayers();
    this.polylineLayerGroup.clearLayers();
    this.measuringDirectionLayerGroup.clearLayers();

    if (res) {
      this.sensorList = res;
    }
    this.sensorList.forEach((marker: any) => {
      // Determine which icon each marker should use
      if (this.filteredSensorTypes.get(marker.sensorType)) {
        this.iconName = this.markerService.getMarkerIcons(marker);

        // Determine what color the icon should be based on its current status (Online, Offline, Maintenance)
        this.colorClass = marker.status;

        if (marker.crsType == 'EPSG:3067') {
          // Convert from ETRS-TM35FIN (EPSG:3067) (Used by the finnish government and cities) to WGS84 (EPSG:4326) (Used by most online mapping softwares, including openstreetmaps)
          marker = this.markerService.convertCrs(marker);
        }

        const measuringDirectionArray =
          this.coordinateService.generateConeCoordinates(
            marker.location.lat,
            marker.location.lng,
            marker.measuringDirection,
          );

        if (
          marker.sensorType == 'Traffic Light' ||
          marker.dataLatestValue != null
        ) {
          this.markerService
            .getTrafficLightData(marker.id)
            .subscribe((data: any) => {
              var totalWait: number = 0;

              // Checks the wait time of each of the lanes at an intersection
              data.values.forEach((e: any) => {
                totalWait = totalWait + e.value;
              });

              // Calculates the average wait time of a traffic light
              const totalWaitAVG = totalWait / data.values.length;
              marker.dataLatestValue = totalWaitAVG.toFixed(0);

              var measuringDirectionColor;

              // Assigns color for the circle depending on wait time (seconds)
              if (totalWaitAVG < 10) {
                measuringDirectionColor = 'green';
              } else if (totalWaitAVG < 20) {
                measuringDirectionColor = 'yellow';
              } else {
                measuringDirectionColor = 'red';
              }

              var polygon = Leaflet.polygon(measuringDirectionArray, {
                color: measuringDirectionColor,
                opacity: 1,
                weight: 4,
                fill: true,
              }).addTo(this.measuringDirectionLayerGroup);
              this.polygonArray.push(polygon);
            });
        } else {
          if (
            marker.measuringDirection[0] != 0 &&
            marker.measuringDirection[1] != 0
          ) {
            Leaflet.polygon(measuringDirectionArray, {
              color: 'blue',
              opacity: 1,
              weight: 4,
              fill: true,
            }).addTo(this.measuringDirectionLayerGroup);
          }
        }

        // Create an embedded view with the icon and color class
        const embeddedView = this.viewContainerRef.createEmbeddedView(
          this.markerIcon,
          { icon: this.iconName, color: this.colorClass },
        );
        embeddedView.detectChanges();

        // Convert the view into HTML
        const div = document.createElement('div');
        embeddedView.rootNodes.forEach((node) => div.appendChild(node));

        // Create the Leaflet divIcon
        this.iconTemplate = Leaflet.divIcon({
          className: '',
          html: div.innerHTML,
          iconSize: [25, 25],
          iconAnchor: [12, 20],
          tooltipAnchor: [12, -12],
          popupAnchor: [1, -25],
        });

        // Determine if the marker should be displayed based on currently chosen elevation range
        if (
          marker.location.elevation >= this.elevationRange[0] &&
          marker.location.elevation <= this.elevationRange[1]
        ) {
          const coords = new Leaflet.LatLng(
            marker.location.lat,
            marker.location.lng,
          );
          const sensorMarker = Leaflet.marker(coords, {
            icon: this.iconTemplate,
          });
          sensorMarker.bindPopup(() => this.createPopupContent(marker));
          this.markerLayer.addLayer(sensorMarker);
        }
      } else {
        this.logger.log(marker.sensorType);
      }
    });
  }

  /**
   * Filters the displayed sensors
   * @param sensor name of sensor filtering button thats pressed.
   */
  filterSensors(sensor: string): void {
    this.filteredSensorTypes.set(sensor, !this.filteredSensorTypes.get(sensor));
    this.displayMarkers();
  }

  /**
   * Creates the popup content
   * @param content sensor and all its data
   * @returns popup that is bound to the marker
   */
  createPopupContent(content: any): HTMLElement {
    // Clear previous components if any
    this.popupContainer.clear();

    const componentRef: ComponentRef<PopupComponent> =
      this.popupContainer.createComponent(PopupComponent);
    const locationString = `${content.location.lat} , ${content.location.lng}`;
    const elevationString = `${content.location.elevation}`;

    // Set data for the popup
    componentRef.instance.id = content.id;
    componentRef.instance.description = content.description;
    componentRef.instance.location = locationString;
    componentRef.instance.elevation = elevationString;
    componentRef.instance.status = content.status;
    componentRef.instance.sensorType = content.sensorType;
    componentRef.instance.dataSecret = content.dataSecret;
    componentRef.instance.dataValue = content.dataLatestValue;

    return componentRef.location.nativeElement;
  }

  /**
   * Changes the markers that are displayed when the elevation changes
   */
  onSliderChange(): void {
    this.logger.log(this.elevationRange);
    this.displayMarkers();
  }
}
