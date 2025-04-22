import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class CoordinateService {
  constructor(private logger: LoggerService) {}

  pointCount: number = 20;
  /**
   * Function to generate 20 evenly spaced coordinate points around the marker. Not currently used
   * @param lat Latitude of the marker
   * @param lng Longitude of the marker
   * @param radius Radius of the measuring direction area
   * @returns array of coordinate points around the marker
   */
  generatePoints(
    lat: number,
    lng: number,
    radius: number = 0.0005,
  ): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];

    // Divide full circle into 20 points
    const angleStep = (2 * Math.PI) / this.pointCount;

    // Generates the points around the marker location
    for (let i = 0; i < this.pointCount; i++) {
      const angle = i * angleStep;
      const deltaLat = radius * Math.cos(angle);

      // Adjust for latitude distortion
      const deltaLng =
        (radius * Math.sin(angle)) / Math.cos(lat * (Math.PI / 180));
      points.push({ lat: lat + deltaLat, lng: lng + deltaLng });
    }

    return points;
  }

  /**
   * Generates coordinates around the marker, and if direction is specified generates them in a cone.
   * @param startLat Latitude of the marker
   * @param startLng Longitude of the marker
   * @param direction Direction of the measurement as an array of two degrees (eg. [-90, 90])
   * @returns Array of coordinates
   */
  generateConeCoordinates(
    startLat: number,
    startLng: number,
    direction: number[],
  ): { lat: number; lng: number }[] {
    const coordinates: { lat: number; lng: number }[] = [];

    // If either measurement direction is not -180 or 180, draws the measurement direction as cone
    if (direction[0] != -180 || direction[1] != 180) {
      const radius: number = 0.0005;
      const numPoints: number = 20;
      const startAngle = direction[0] * (Math.PI / 180);
      const endAngle = direction[1] * (Math.PI / 180);

      // Starting point of cone
      coordinates.push({ lat: startLat, lng: startLng });

      // Generate the points in a cone to draw the measurement direction
      for (let i = 0; i <= numPoints; i++) {
        const theta = startAngle + (i / numPoints) * (endAngle - startAngle);
        const lat = startLat + radius * Math.cos(theta);
        const lng =
          startLng +
          (radius * Math.sin(theta)) / Math.cos(lat * (Math.PI / 180));
        coordinates.push({ lat, lng });
      }

      // Closing the cone shape
      coordinates.push({ lat: startLat, lng: startLng });

      return coordinates;
    } else {
      // Divide full circle into 20 points
      const angleStep = (2 * Math.PI) / this.pointCount;

      // Generate points in a circle around the marker
      for (let i = 0; i < this.pointCount; i++) {
        const radius: number = 0.0005;

        const angle = i * angleStep;
        const deltaLat = radius * Math.cos(angle);
        // Adjust for latitude distortion, read more at https://en.wikipedia.org/wiki/Mercator_projection#Distortion_of_sizes
        const deltaLng =
          (radius * Math.sin(angle)) / Math.cos(startLat * (Math.PI / 180));
        coordinates.push({
          lat: startLat + deltaLat,
          lng: startLng + deltaLng,
        });
      }
    }
    return coordinates;
  }
}
