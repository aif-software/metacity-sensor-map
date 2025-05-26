import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-popup',
  standalone: false,
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
})
export class PopupComponent {
  @Input() id?: string;
  @Input() name?: string;
  @Input() description?: string;
  @Input() location?: string;
  @Input() elevation?: number;
  @Input() status?: string;
  @Input() sensorType?: string;
  @Input() sensorModel?: string;
  @Input() isDataSecret?: string;
  @Input() measuringInterval?: number;
  @Input() measuringDescription?: string;
  @Input() measuringRadius?: string;
  @Input() stationary?: string;
  @Input() dataValue?: string;
  @Input() linkToData?: string;

  @Input() air_temperature?: number;
  @Input() air_relative_humidity?: number;
  @Input() dew_point_temperature?: number;
  @Input() wind_speed?: number;
  @Input() wind_direction?: number;
  @Input() rainfall_depth?: number;
  @Input() rainfall_intensity?: number;
  @Input() snow_depth_a?: number;
  @Input() snow_depth_b?: number;
  @Input() snow_depth_c?: number;
  @Input() snow_depth?: number;
  @Input() rain_classification?: number;
  @Input() road_surface_temperature?: number;
}
