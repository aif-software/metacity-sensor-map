import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class CoordinateService {
  constructor(private logger: LoggerService) {}

  // Function to generate 10 evenly spaced coordinate points
  pointCount: number = 20;
  generatePoints(
    lat: number,
    lng: number,
    radius: number = 0.0005,
  ): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    const angleStep = (2 * Math.PI) / this.pointCount; // Divide full circle into 10 points

    for (let i = 0; i < this.pointCount; i++) {
      const angle = i * angleStep;
      const deltaLat = radius * Math.cos(angle);
      const deltaLng =
        (radius * Math.sin(angle)) / Math.cos(lat * (Math.PI / 180)); // Adjust for latitude distortion
      points.push({ lat: lat + deltaLat, lng: lng + deltaLng });
    }

    return points;
  }

  generateConeCoordinates(
    startLat: number,
    startLng: number,
    direction: number[],
  ): { lat: number; lng: number }[] {
    const coordinates: { lat: number; lng: number }[] = [];

    if (direction[0] != -180 || direction[1] != 180) {
      const radius: number = 0.0005;
      const numPoints: number = 20;
      const startAngle = direction[0] * (Math.PI / 180);
      const endAngle = direction[1] * (Math.PI / 180);

      coordinates.push({ lat: startLat, lng: startLng }); // Starting point

      for (let i = 0; i <= numPoints; i++) {
        const theta = startAngle + (i / numPoints) * (endAngle - startAngle);
        const lat = startLat + radius * Math.cos(theta);
        const lng =
          startLng +
          (radius * Math.sin(theta)) / Math.cos(lat * (Math.PI / 180));
        coordinates.push({ lat, lng });
      }

      coordinates.push({ lat: startLat, lng: startLng }); // Closing the cone shape

      return coordinates;
    } else {
      const angleStep = (2 * Math.PI) / this.pointCount; // Divide full circle into 10 points

      for (let i = 0; i < this.pointCount; i++) {
        const radius: number = 0.0005;

        const angle = i * angleStep;
        const deltaLat = radius * Math.cos(angle);
        const deltaLng =
          (radius * Math.sin(angle)) / Math.cos(startLat * (Math.PI / 180)); // Adjust for latitude distortion
        coordinates.push({
          lat: startLat + deltaLat,
          lng: startLng + deltaLng,
        });
      }
    }
    return coordinates;
  }
}
