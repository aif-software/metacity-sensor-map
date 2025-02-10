import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})

/**
 * Singleton service provided in AppModule.
 */
export class LoggerService {
  constructor() {}

  /**
   * Does not print anything in production mode.
   * @param message gets passed to console.log().
   */
  log(message: unknown) {
    if (!environment.production) {
      console.log(message);
    }
  }
}
