import { Component, AfterViewInit } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { MarkerService } from '../services/marker.service';
import { Device } from '../models/map.interfaces';
import * as Leaflet from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
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
    private markerService: MarkerService
  ) {}

  /** Initializes map */
  private initMap(): Leaflet.Map {
    this.logger.log('initMap() called');
    const map = Leaflet.map('map', {
      center: [65.059333, 25.466806],
      zoom: 15,
    });

    const tiles = Leaflet.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(map);

    return map;
  }

  ngAfterViewInit(): void {
    this.map = this.initMap();

    this.markerService.getSensorMarkers().subscribe((res) => {
      this.logger.log('at map ngAfterViewInit');
      this.addFloorLayers(res);
      this.addMarkers(res);
      // initialize floor keys
      this.floorKeys = Array.from(this.filteredFloors.keys()).sort((a, b) =>
        b.localeCompare(a)
      );
    });
  }

  /**
   * Generate the floor layers used to sort the devices by floor.
   * @param devices device list fetched from backend
   */
  addFloorLayers(devices: Device[]) {
    for (const device of devices) {
      if (device.installed != null && device.location != null) {
        if (device.status == 'online') {
          this.filteredFloors.set(device.floorLevel, true);
        } else if (device.status == 'offline') {
          this.filteredOfflineFloors.set(device.floorLevel, true);
        }
      }
    }

    for (const key of this.filteredFloors.keys()) {
      this.floorLevelLayers[key] = Leaflet.layerGroup();
      this.floorLevelLayers[key].addTo(this.map);
    }
    for (const key of this.filteredOfflineFloors.keys()) {
      this.floorLevelOfflineLayers[key] = Leaflet.layerGroup();
      this.floorLevelOfflineLayers[key].addTo(this.map);
    }
  }

  /** Generates markers. */
  addMarkers(res: Device[]): void {
    for (const device of res) {
      // Removes sensors that are not installed yet but that have been added to the list
      if (device.installed != null && device.location != null) {
        const deviceMarker = Leaflet.marker(device.location.coordinates, {
          // Sets the sensors icon according to the status of the sensor (selected=green, online=grey, offline=red, maintenance=yellow).
          icon: this.markerIcon(device),
        });
        // Adds functionality to the marker, to be able to select them
        deviceMarker.on('click', () => {
          if (!this.selectedDevices.includes(device.deviceId)) {
            deviceMarker.setIcon(this.greenIcon);
            this.selectedDevices.push(device.deviceId);
            this.logger.log(this.selectedDevices);
          } else {
            const itemIndex = this.selectedDevices.indexOf(device.deviceId);
            const newArray = this.selectedDevices.filter(
              (e, i) => i !== itemIndex
            );
            this.selectedDevices = newArray;
            deviceMarker.setIcon(this.markerIcon(device));
          }
        });
        // Adds the location tooltip when you hover over the marker, and extra info about offline sensors
        switch (device.status) {
          case 'online':
            deviceMarker.bindTooltip(device.description);
            break;
          case 'offline':
            deviceMarker.bindTooltip(
              device.description +
                ' (This sensor is offline, it may contain no data)'
            );
            break;
          case 'maintenance':
            deviceMarker.bindTooltip(
              device.description +
                ' (This sensor is under maintenance, it may contain no data)'
            );
            break;
          default:
            deviceMarker.bindTooltip(
              device.description + ' (Sensor status undefined)'
            );
        }
        try {
          // Adds the marker to the map layer matching its floor level
          if (device.status == 'online') {
            deviceMarker.addTo(
              this.floorLevelLayers[this.parseLevel(device.floorLevel)]
            );
          } else {
            deviceMarker.addTo(
              this.floorLevelOfflineLayers[this.parseLevel(device.floorLevel)]
            );
          }
        } catch (e) {
          this.logger.log(e);
        }
      }
    }
  }

  /**
   * @returns icon according to the status of the sensor:
   * selected=green,
   * online=grey,
   * offline=red,
   * maintenance=yellow.
   */
  markerIcon(
    device: Device
  ): Leaflet.Icon<Leaflet.IconOptions> | Leaflet.DivIcon {
    if (this.selectedDevices.includes(device.deviceId)) {
      return this.greenIcon;
    }
    switch (device.status) {
      case 'online':
        return this.greyIcon;
      case 'offline':
        return this.redIcon;
      case 'maintenance':
        return this.yellowIcon;
      default:
        return this.greyIcon;
    }
  }

  /** Functionality to show or hide map layers for marker filtering. */
  toggleFloorVisibility(level: string): void {
    this.logger.log(`level ${level} toggled`);
    const currentlyVisible = this.filteredFloors.get(level);

    if (currentlyVisible) {
      this.floorLevelLayers[level].remove();
      if (this.floorLevelOfflineLayers[level]) {
        this.floorLevelOfflineLayers[level].remove();
      }
    } else {
      this.floorLevelLayers[level].addTo(this.map);
      if (this.offlineDevicesVisible && this.floorLevelOfflineLayers[level]) {
        this.floorLevelOfflineLayers[level].addTo(this.map);
      }
    }
    // flip the value
    this.filteredFloors.set(level, !this.filteredFloors.get(level));
  }

  /** Toggle offline sensors to be displayed or not. */
  toggleOfflineSensors(): void {
    if (this.offlineDevicesVisible) {
      this.logger.log('Offline sensors toggled');
      for (const i of this.floorKeys) {
        if (this.floorLevelOfflineLayers[i]) {
          this.floorLevelOfflineLayers[i].remove();
          this.offlineDevicesVisible = false;
        }
      }
    } else {
      for (const i of this.floorKeys) {
        if (this.floorLevelOfflineLayers[i] && this.filteredFloors.get(i)) {
          this.floorLevelOfflineLayers[i].addTo(this.map);
          this.offlineDevicesVisible = true;
        }
      }
    }
  }

  // Hides or shows the map legend, telling the user what the different icons mean
  toggleLegend() {
    this.legendVisible = !this.legendVisible;
  }

  /** Filters out any possible floors containing letters. */
  parseLevel(level: string) {
    const key = String(level).replace(/[^0-9-]/g, '');
    if (key.length == 0) {
      throw Error('Empty level key');
    }
    return key;
  }
}
