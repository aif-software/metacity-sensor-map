/** Sensor information received from backend.*/
interface Device {
  id: string;
  crsType: string;
  iconName: string;
  location: Location;
  status: string;
  sensorType: string;
  sensorModel?: string;
  description: string;
  isDataSecret: boolean;
  measuringDirection?: [number, number];
  measuringRadius: number;
  measuringInterval: number;
  measuringDescription?: string;
  stationary: boolean;
  dataLink?: string;
  dataLatestValue?: string;
}

interface Location {
  coordinates: [number, number, number?];
  path?: [{ lat: number; lng: number }];
  area?: [{ lat: number; lng: number }];
}

export type { Device, Location };
