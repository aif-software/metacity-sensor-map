/** Sensor information received from backend.*/
interface TrafficLight {
  devName: string;
  measuredTime: string;
  values: Values;
}

interface Values {
  sgName: string;
  interval: number;
  name: string;
  reliabValue: number;
  unit: string;
  value: number;
}

export type { TrafficLight, Values };

/*
  "id": "OULU175",
      "crsType": "EPSG:3067",
      "location": { "lat": 7216617, "lng": 429616, "elevation": 5 },
      "status": "Online",
      "sensorType": "Traffic Light",
      "description": "Raitotie-Pöllöntie",
      "dataSecret": true
  */
