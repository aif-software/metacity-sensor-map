import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { LoggerService } from '../services/logger.service';
import { HttpClient } from '@angular/common/http';
import * as Leaflet from 'leaflet';

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './app-nav.component.html',
  styleUrl: './app-nav.component.scss',
})
export class AppNavComponent implements AfterViewInit {
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  measuringDirectionVisible: boolean = true;
  flightPathVisible: boolean = true;
  filteredSensorTypes = new Map<string, boolean>();
  map!: Leaflet.Map;
  cityPlanOpacity: number = 0;
  cityPlanVisible: boolean = false;
  elevationRange: number[] = [-50, 50]; // Initial min/max range
  sensorTypes: string[] = [];

  constructor(
    private logger: LoggerService,
    private http: HttpClient,
  ) {}

  ngAfterViewInit(): void {
    this.mapComponent.elevationRange = this.elevationRange;

    this.sensorTypes = this.mapComponent.sensorTypes;
    this.filteredSensorTypes = this.mapComponent.filteredSensorTypes;

    // const rangeSlider = document.querySelector('#rangeSlider');

    // rangeSlider?.addEventListener('mouseenter', (e) => {
    //   this.map.dragging.disable();
    // });

    // rangeSlider?.addEventListener('mouseleave', (e) => {
    //   this.map.dragging.enable();
    // });
  }

  /**
   * Toggles the visibility of the cityPlan slider
   */
  togglecityPlanVisibility(): void {
    if (this.cityPlanVisible) {
      this.cityPlanOpacity = 0;
      this.cityPlanVisible = !this.cityPlanVisible;
      this.mapComponent.cityPlanLayer.setOpacity(this.cityPlanOpacity);
    } else {
      this.cityPlanOpacity = 1;
      this.cityPlanVisible = !this.cityPlanVisible;
      this.mapComponent.cityPlanLayer.setOpacity(this.cityPlanOpacity);
    }
  }

  /**
   * Changes the opacity of the cityPlan layer
   */
  changecityPlanOpacity(): void {
    this.mapComponent.cityPlanLayer.setOpacity(this.cityPlanOpacity);
  }

  /**
   * Toggles the visibility of the cityPlan slider
   */
  toggleDirectionLayerVisibility(): void {
    this.measuringDirectionVisible = !this.measuringDirectionVisible;
    if (this.measuringDirectionVisible) {
      for (const key of this.filteredSensorTypes.keys()) {
        this.mapComponent.measuringDirectionLayers[key].addTo(
          this.mapComponent.map,
        );
      }
    } else {
      for (const key of this.filteredSensorTypes.keys()) {
        this.mapComponent.measuringDirectionLayers[key].remove();
      }
    }
  }

  /**
   * Toggles the visibility of the paths
   */
  togglePathVisibility(): void {
    this.flightPathVisible = !this.flightPathVisible;
    if (this.flightPathVisible) {
      for (const key of this.filteredSensorTypes.keys()) {
        this.mapComponent.pathLayers[key].addTo(this.mapComponent.map);
      }
    } else {
      for (const key of this.filteredSensorTypes.keys()) {
        this.mapComponent.pathLayers[key].remove();
      }
    }
  }

  /**
   * Filters the displayed sensors
   * @param sensor name of sensor filtering button thats pressed.
   */
  filterSensors(sensor: string): void {
    this.filteredSensorTypes.set(sensor, !this.filteredSensorTypes.get(sensor));
    if (!this.filteredSensorTypes.get(sensor)) {
      this.mapComponent.sensorTypeLayers[sensor].remove();
      this.mapComponent.measuringDirectionLayers[sensor].remove();
      this.mapComponent.pathLayers[sensor].remove();
    } else {
      this.mapComponent.sensorTypeLayers[sensor].addTo(this.mapComponent.map);
      this.mapComponent.measuringDirectionLayers[sensor].addTo(
        this.mapComponent.map,
      );
      this.mapComponent.pathLayers[sensor].addTo(this.mapComponent.map);
    }
  }

  /**
   * Changes the markers that are displayed when the elevation changes
   */
  onSliderChange(): void {
    this.logger.log(this.elevationRange);
    this.mapComponent.displayMarkers();
  }
}
