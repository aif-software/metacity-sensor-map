import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../models/map.interfaces';
import { environment } from '../../environment/environment';
import { TrafficLight } from '../models/traffic-light.interfaces';
import proj4 from 'proj4';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  url: string = environment.API.address;

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
  ) {}

  /**
   * Requests a list of indivicual sensors from the backend.
   * @returns a list of sensors
   */
  getSensorMarkers(): Observable<Device[]> {
    return this.http.get<Device[]>('/sensors.json');
  }

  getTrafficLightData(deviceId: string): Observable<TrafficLight[]> {
    return this.http.get<TrafficLight[]>(
      'https://api.oulunliikenne.fi/tpm/kpi/wait-time/' + deviceId,
    );
  }

  getBikeLaneSensors() {
    return this.http.get('https://api.oulunliikenne.fi/proxy/graphql');
  }

  getMarkerIcons(marker: any): string {
    switch (marker.sensorType) {
      case 'temperature':
        return 'device_thermostat';
      case 'humidity':
        return 'water_drop';
      case 'motion':
        return 'directions_walk';
      case 'co2':
        return 'co2';
      case 'Traffic Light':
        return 'traffic';
      case 'Counter':
        return 'directions_walk';
      case 'Bike Rental':
        return 'pedal_bike';
      default:
        return '';
    }
  }

  convertCrs(marker: any) {
    const proj4String3067 =
      '+proj=utm +zone=35 +ellps=GRS80 +datum=WGS84 +units=m +no_defs'; // Definition for EPSG:3067

    // Convert from ETRS-TM35FIN (EPSG:3067) to WGS84 (EPSG:4326)
    const etrsTm35finCoords = [marker.location.lng, marker.location.lat]; // X, Y coordinates in meters (EPSG:3067)

    const wgs84Coords = proj4(proj4String3067, 'EPSG:4326', etrsTm35finCoords);
    marker.location.lng = wgs84Coords[0];
    marker.location.lat = wgs84Coords[1];
    marker.crsType = 'EPSG:4326';
    return marker;
  }
}
