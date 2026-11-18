import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Boards · Kanban Task Board',
    loadComponent: () => import('./features/boards/boards-page').then((m) => m.BoardsPageComponent),
  },
  {
    path: 'boards/:boardId',
    loadComponent: () => import('./features/board/board-page').then((m) => m.BoardPageComponent),
  },
  { path: '**', redirectTo: '' },
];
