/** Sensor information received from backend.*/
interface Device {
  _id: string;
  crsType: string;
  location: Location;
  status: string;
  sensorType: string;
  description: string;
  dataSecret: boolean;
}

interface Location {
  coordinates: [number, number, number?];
  path?: [{ lat: number; lng: number }];
  area?: [{ lat: number; lng: number }];
  _id: string;
  type: string;
}

export type { Device, Location };

/*
"id": "OULU175",
    "crsType": "EPSG:3067",
    "location": { "lat": 7216617, "lng": 429616, "elevation": 5 },
    "status": "Online",
    "sensorType": "Traffic Light",
    "description": "Raitotie-Pöllöntie",
    "dataSecret": true
*/
