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
    return this.http.get<Device[]>(this.url + 'Devices');
  }

  /**
   * Requests wait time data from the Traffic Light API
   * @param deviceId Id of the traffic light
   * @returns wait time in seconds
   */
  getTrafficLightData(deviceId: string): Observable<TrafficLight[]> {
    return this.http.get<TrafficLight[]>(
      'https://api.oulunliikenne.fi/tpm/kpi/wait-time/' + deviceId,
    );
  }

  /**
   * Requests sensors from the bike lane counter API, currently not working
   * @returns -
   */
  getBikeLaneSensors() {
    return this.http.get('https://api.oulunliikenne.fi/proxy/graphql');
  }

  /**
   * Converts the markers CRS and markers location coordinates from EPSG:3067 to EPSG:4326. EPSG:3067 is used by some finnish goverment agencies, EPSG:4326 is used by most mapping software, including the openStreetMaps that provides maps for this application
   * @param marker marker with coordinates in the format EPSG:3067.
   * @returns marker with new location coordinates and CRS Type changed.
   */
  convertCrs(marker: any) {
    const proj4String3067 =
      '+proj=utm +zone=35 +ellps=GRS80 +datum=WGS84 +units=m +no_defs'; // Definition for EPSG:3067

    // Convert from ETRS-TM35FIN (EPSG:3067) to WGS84 (EPSG:4326)
    const etrsTm35finCoords = [marker.location.lng, marker.location.lat]; // X, Y coordinates in meters (EPSG:3067)
    const wgs84Coords = proj4(proj4String3067, 'EPSG:4326', etrsTm35finCoords);

    // Change the coordinates of the marker to new converted ones
    marker.location.lng = wgs84Coords[0];
    marker.location.lat = wgs84Coords[1];
    marker.crsType = 'EPSG:4326';
    return marker;
  }
}
