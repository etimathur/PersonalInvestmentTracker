import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Portfolio } from './features/portfolio/portfolio';
import { AddPortfolio } from './features/add-portfolio/add-portfolio';

export const routes: Routes = [
  { path: '', component: Dashboard, pathMatch: 'full' },
  { path: 'portfolio', component: Portfolio },
  { path: 'add-portfolio', component: AddPortfolio },
  { path: '**', redirectTo: '' },
];
