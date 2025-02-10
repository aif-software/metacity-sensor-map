/** Sensor information received from backend.*/
interface Device {
  _id: string;
  floorLevel: string;
  description: string;
  deviceId: string;
  deviceType: string;
  location: Location;
  status: string;
  addedByUser: string;
  __v: number;
  installed?: string;
}

interface Location {
  coordinates: [number, number];
  _id: string;
  type: string;
}

export type { Device, Location };
