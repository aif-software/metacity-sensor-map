/** Sensor information received from backend.*/
interface Device {
  id: string;
  name: string;
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
  weatherData?: WeatherData;
}

interface Location {
  coordinates: [number, number, number?];
  path?: [{ lat: number; lng: number }];
  area?: [{ lat: number; lng: number }];
}

interface WeatherData
{
air_temperature?: number;
air_relative_humidity?: number;
dew_point_temperature?: number;
wind_speed?: number;
wind_direction?: number;
rainfall_depth?: number;
rainfall_intensity?: number;
snow_depth_a?: number;
snow_depth_b?: number;
snow_depth_c?: number;
snow_depth?: number;
rain_classification?: number;
road_surface_temperature?: number;

}

export type { Device, Location, WeatherData };
