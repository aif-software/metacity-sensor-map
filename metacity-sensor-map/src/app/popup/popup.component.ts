import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-popup',
  standalone: false,
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
})
export class PopupComponent {
  @Input() id?: string;
  @Input() description?: string;
  @Input() location?: string;
  @Input() elevation?: string;
  @Input() status?: string;
  @Input() sensorType?: string;
  @Input() dataSecret?: string;
  @Input() dataValue?: string;
  @Input() linkToData?: string;
}
