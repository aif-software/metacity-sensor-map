import {
  Component,
  AfterViewInit,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
  TemplateRef,
  Input,
} from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { MarkerService } from '../services/marker.service';
import { Device } from '../models/map.interfaces';
import * as Leaflet from 'leaflet';
import { PopupComponent } from '../popup/popup.component';
import { HttpClient } from '@angular/common/http';
import { CoordinateService } from '../services/coordinate.service';

@Input({ required: true })
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  standalone: false,
})
export class MapComponent implements AfterViewInit {
  @Input() elevationRange: number[] = [-50, 50]; // Initial min/max range

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
  metaCityBorder!: Leaflet.Polygon;
  cityPlanLayer!: Leaflet.TileLayer;
  iconTemplate!: Leaflet.DivIcon;
  sensorList: any = [];
  polyline: Leaflet.LatLng[] = [];
  sensorData: any;
  polygonArray: Leaflet.Polygon[] = [];

  sensorTypeLayers: { [key: string]: any } = {}; // eslint-disable-line
  measuringDirectionLayers: { [key: string]: any } = {}; // eslint-disable-line
  pathLayers: { [key: string]: any } = {}; // eslint-disable-line

  constructor(
    private logger: LoggerService,
    private markerService: MarkerService,
    private http: HttpClient,
    private viewContainerRef: ViewContainerRef,
    private coordinateService: CoordinateService,
  ) {}

  /** Initializes map */
  initMap(): Leaflet.Map {
    this.logger.log('initMap() called');

    // Creates map object and centers it at Linnanmaa
    const map = Leaflet.map('map', {
      center: [65.059333, 25.466806],
      zoom: 15,
    });

    // Draws the border around the Metacity area
    this.metaCityBorder = Leaflet.polygon(this.polyline, {
      color: 'red',
      weight: 4,
      fill: false,
      dashArray: '0 20 0',
      dashOffset: '10',
    }).addTo(map);

    // Retrieves the tiles for the map
    const tiles = Leaflet.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 20,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );

    // Retrieves the cityplan for showing the current cityplan. Updates automatically as new cityplans are submitted for public use.
    this.cityPlanLayer = Leaflet.tileLayer.wms(
      'https://e-kartta.ouka.fi/TeklaOgcWebOpen/WMS.ashx',
      { layers: 'Asemakaava', opacity: 0 },
    );
    tiles.addTo(map);
    this.cityPlanLayer.addTo(map);

    return map;
  }

  /**
   * Initializes the map
   */
  ngAfterViewInit() {
    this.map = this.initMap();

    this.initMapFeatures();
  }

  /**
   * Initializes the features of the map, such as markers and the coordinates of the border of Metacity.
   */
  initMapFeatures(): void {
    // Retrieves the coordinates for the Metacity border
    this.http.get('/metacityBorders.json').subscribe((data) => {
      this.polyline = this.convertCoordinates(data);
      this.metaCityBorder.setLatLngs(this.polyline);
    });

    // Retrieves the data for markers from the backend. Filters all sensortypes, generates layers for each type of sensors and then displays the markers.
    this.markerService.getSensorMarkers().subscribe((res) => {
      this.logger.log(res);
      this.filterTypeKeys(res);
      this.generateSensorLayers(res);
      this.displayMarkers(res);
    });

    // Temporary function to show the coordinates of mouse click.
    this.map.on('click', function (e) {
      console.log(e.latlng);
    });

    // Sorts floor keys alphabetically.
    this.sensorTypes.sort((a, b) => b.localeCompare(a));
  }

  /**
   * Returns sensorTypes, used to get them for navigation layer.
   * @returns list of sensor types
   */
  returnSensorTypes() {
    return this.sensorTypes;
  }

  /**
   * Generate the sensor layers used to sort the devices by sensor type.
   * @param devices device list fetched from backend
   */
  generateSensorLayers(res: Device[]) {
    // Sets each sensor layer to visible
    res.forEach((marker: any) => {
      this.filteredSensorTypes.set(marker.sensorType, true);
      if (!this.sensorTypes.includes(marker.sensorType)) {
        this.sensorTypes.push(marker.sensorType);
      }
    });

    // Generates needed layers for each sensor type. Generates layers for markers, their measuring direction and paths. Each sensor type has one of each layer.
    for (const key of this.filteredSensorTypes.keys()) {
      this.sensorTypeLayers[key] = Leaflet.layerGroup();
      this.sensorTypeLayers[key].addTo(this.map);

      this.measuringDirectionLayers[key] = Leaflet.layerGroup();
      this.measuringDirectionLayers[key].addTo(this.map);

      this.pathLayers[key] = Leaflet.layerGroup();
      this.pathLayers[key].addTo(this.map);
    }
  }

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
    // Clears any old markers and polygons
    for (const key of this.filteredSensorTypes.keys()) {
      this.sensorTypeLayers[key].clearLayers();
      this.measuringDirectionLayers[key].clearLayers();
      this.pathLayers[key].clearLayers();
    }

    // If sensor list is not provided, uses the previously used sensor list instead
    if (res) {
      this.sensorList = res;
    }

    // Goes through the list of sensors and generates a marker for each
    this.sensorList.forEach((marker: any) => {
      // Determine if the marker should be displayed based on currently chosen elevation range
      if (
        marker.location.elevation >= this.elevationRange[0] &&
        marker.location.elevation <= this.elevationRange[1]
      ) {
        // Determine which icon each marker should use
        if (this.filteredSensorTypes.get(marker.sensorType)) {
          // Determine what color the icon should be based on its current status (Online, Offline, Maintenance)
          this.colorClass = marker.status;

          // Convert from ETRS-TM35FIN (EPSG:3067) (Used by the finnish government and cities) to WGS84 (EPSG:4326) (Used by most online mapping softwares, including openstreetmaps)
          if (marker.crsType == 'EPSG:3067') {
            marker = this.markerService.convertCrs(marker);
          }

          // Generates coordinates to show direction of measurement
          var measuringDirectionArray: any;
          if (marker.measuringRadius != 0) {
            measuringDirectionArray =
              this.coordinateService.generateConeCoordinates(
                marker.location.lat,
                marker.location.lng,
                marker.measuringDirection,
                marker.measuringRadius,
              );
          }
          // If the sensor is a traffic light, contacts the traffic light API to get wait time data. Only for development to show actual data.
          if (
            marker.sensorType == 'Traffic Light' ||
            marker.dataLatestValue != null
          ) {
            // Connects to the traffic light API
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

                // Assigns color for the measurement area depending on wait time (seconds)
                if (totalWaitAVG < 10) {
                  measuringDirectionColor = 'green';
                } else if (totalWaitAVG < 20) {
                  measuringDirectionColor = 'yellow';
                } else {
                  measuringDirectionColor = 'red';
                }

                // Draws the measurement direction of the traffic light with previously provided color
                var polygon = Leaflet.polygon(measuringDirectionArray, {
                  color: measuringDirectionColor,
                  opacity: 1,
                  weight: 4,
                  fill: true,
                }).addTo(this.measuringDirectionLayers[marker.sensorType]);
                this.polygonArray.push(polygon);
              });
          } else {
            if (
              marker.measuringDirection[0] != 0 &&
              marker.measuringDirection[1] != 0
            ) {
              if (marker.measuringRadius != 0) {
                Leaflet.polygon(measuringDirectionArray, {
                  color: 'blue',
                  opacity: 1,
                  weight: 4,
                  fill: true,
                }).addTo(this.measuringDirectionLayers[marker.sensorType]);
              }
              // Draws the measurement direction of the sensor
            }
            if (marker.location.path) {
              marker.location.path.push({
                lat: marker.location.lat,
                lng: marker.location.lng,
              });
              // If sensor contains path data, draws a polyline following that
              const pathArray = this.convertCoordinates(marker.location.path);
              Leaflet.polyline(pathArray, {
                color: 'blue',
                opacity: 1,
                weight: 4,
              }).addTo(this.pathLayers[marker.sensorType]);
            }
            if (marker.location.area) {
              // If sensor contains measurement area data, draws a polygon to display it
              const movementArea = this.convertCoordinates(
                marker.location.area,
              );
              Leaflet.polygon(movementArea, {
                color: 'blue',
                opacity: 1,
                weight: 4,
              }).addTo(this.pathLayers[marker.sensorType]);
            }
          }

          // Instantaniate the icon used by html template
          this.iconName = marker.iconName;

          // Create an embedded view with the icon and color class
          const embeddedView = this.viewContainerRef.createEmbeddedView(
            this.markerIcon,
            { color: this.colorClass },
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

          // Assigns the coordinates of the marker
          const coords = new Leaflet.LatLng(
            marker.location.lat,
            marker.location.lng,
          );
          const sensorMarker = Leaflet.marker(coords, {
            icon: this.iconTemplate,
          });

          // Binds the popup data to the marker to show when clicked
          sensorMarker.bindPopup(() => this.createPopupContent(marker));

          // Adds the marker to its respective layer
          sensorMarker.addTo(this.sensorTypeLayers[marker.sensorType]);
        } else {
          this.logger.log(marker.sensorType);
        }
      }
    });
  }

  /**
   * Creates the popup content
   * @param content sensor and all its data
   * @returns popup that is bound to the marker
   */
  createPopupContent(content: any): HTMLElement {
    // Clear previous components if any.
    this.popupContainer.clear();

    const componentRef: ComponentRef<PopupComponent> =
      this.popupContainer.createComponent(PopupComponent);
    // Sets location strings.
    const locationString = `${content.location.lat} , ${content.location.lng}`;

    // Set data for the popup
    componentRef.instance.id = content.id;
    componentRef.instance.description = content.description;
    componentRef.instance.location = locationString;
    componentRef.instance.elevation = content.location.elevation;
    componentRef.instance.status = content.status;
    componentRef.instance.sensorType = content.sensorType;
    componentRef.instance.isDataSecret = content.isDataSecret;
    componentRef.instance.measuringInterval = content.measuringInterval;
    componentRef.instance.measuringRadius = content.measuringRadius;
    componentRef.instance.measuringDescription = content.measuringDescription;
    componentRef.instance.stationary = content.stationary;
    componentRef.instance.dataValue = content.dataLatestValue;
    componentRef.instance.linkToData = content.dataLink;

    return componentRef.location.nativeElement;
  }
}
