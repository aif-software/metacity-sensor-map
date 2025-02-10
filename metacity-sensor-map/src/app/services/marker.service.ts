import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../models/map.interfaces';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  url: string = environment.API.address;

  constructor(private http: HttpClient) {}

  /**
   * Requests a list of indivicual sensors from the backend.
   * @returns a list of sensors
   */
  getSensorMarkers(): Observable<Device[]> {
    return this.http.get<Device[]>(this.url + '/devices');
  }
}
