import { lazy } from 'solid-js';
import type { RouteDefinition } from '@solidjs/router';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: lazy(() => import('./pages/Dashboard')),
  },
  {
    path: '/resources',
    component: lazy(() => import('./pages/Resources')),
  },
  {
    path: '/resource/:id',
    component: lazy(() => import('./pages/ResourceDetail')),
  },
  {
    path: '/topics',
    component: lazy(() => import('./pages/Topics')),
  },
  {
    path: '**',
    component: lazy(() => import('./errors/404')),
  },
];
