/** Sensor information received from backend.*/
interface Device {
  id: string;
  crsType: string;
  location: Location;
  status: string;
  sensorType: string;
  description: string;
  isDataSecret: boolean;
  measuringDirection?: [number, number];
  dataLink?: string;
  dataLatestValue?: string;
}

interface Location {
  coordinates: [number, number, number?];
  path?: [{ lat: number; lng: number }];
  area?: [{ lat: number; lng: number }];
}

export type { Device, Location };
