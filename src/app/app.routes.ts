import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Prichindel Club' },
  { path: 'programari', loadComponent: () => import('./programari.component').then(m => m.ProgramariComponent), title: 'Locuri disponibile – Prichindel Club' },
  { path: '**', redirectTo: '' }
];
