import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withJsonpSupport()), provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
