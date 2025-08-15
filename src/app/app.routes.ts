import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFound),
  },
  {
    path: 'gantt',
    loadComponent: () => import('./features/gantt/gantt').then((m) => m.Gantt),
  },
];
